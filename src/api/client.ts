/** El único lugar del front que habla con el backend · F1.1.
 *
 *  SIN IMPORTS DE MOCK. Es la regla que el andamio de v2 rompía y por la que una
 *  superficie terminaba acoplada a datos falsos. Si hace falta responder sin
 *  backend, se hace con MSW a nivel HTTP, no con un fixture importado.
 */
import { ApiError, SIN_CODIGO } from './types'
import { adaptBlocks, adaptCatalog, adaptContext, adaptPayload, adaptTab, adaptThread } from './adapt'
import type {
  AdaptedCatalog,
  WireBlock,
  WireChatThread,
  WireContext,
  WireMetric,
  WirePayload,
  WireTabWithPanels,
} from './adapt'
import type {
  AppContext,
  Block,
  Envelope,
  Payload,
  TabWithPanels,
} from './types'
import { currentToken } from '../app/auth/session'

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = currentToken()

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  // El envelope se desenvuelve ACÁ y en ningún otro lado. Un hook que reciba
  // `{ success, data }` es un hook que ya dejó entrar la forma del transporte a
  // la capa de datos.
  //
  // **No todo lo que vuelve es JSON** · F1.36. Un 502 del proxy, un 404 de Vite
  // cuando el backend no está levantado, o un panic de Go devuelven HTML o nada.
  // `res.json()` tira ahí, y sin este try el error que ve el usuario es
  // «Unexpected token < in JSON» — que no dice que el servicio no está.
  let body: Envelope<T>
  try {
    body = (await res.json()) as Envelope<T>
  } catch {
    throw new ApiError(
      SIN_CODIGO,
      res.ok
        ? 'El servicio respondió algo que no es JSON.'
        : `El servicio respondió ${String(res.status)} sin cuerpo.`,
      res.status,
    )
  }

  if (!body.success) {
    // **`error` es una CADENA en este servicio**, no el objeto de §4.1. Leerlo
    // como objeto daba `code: undefined` y `message: ''`: una pantalla de error
    // sin una palabra. Es el defecto exacto por el que existe `api/auth.ts`.
    //
    // El mensaje se pasa tal cual porque es lo único que el servicio manda, y
    // §8 manda sobre él: si dice «tab not found», eso es lo que hay. Reescribirlo
    // acá sería el front redactando el error del servidor sin saber qué pasó.
    throw new ApiError(SIN_CODIGO, body.error, res.status)
  }

  return body.data
}

/* ── El adaptador va ACÁ · F1.33 ─────────────────────────────────────────────
 *
 * `request<…>` pide el tipo del CABLE; lo que sale de `api.*` es el tipo del
 * CONTRATO. La traducción ocurre en este borde y en ninguno más: `hooks.ts` y
 * las superficies reciben exactamente lo que recibían antes, que es lo que deja
 * `render/` intacto.
 */
export const api = {
  /** Quién sos, qué tenant, qué rol, qué pestañas y qué períodos. */
  me: async (): Promise<AppContext> => adaptContext(await request<WireContext>('/config/me')),

  /** Las métricas del tenant, YA filtradas por rol. El front no filtra.
   *
   *  **`data` es un ARREGLO DESNUDO**, no `{ metrics: [...] }` · heredado de
   *  F1.36. Sale de `SendSuccess(c, 200, metrics)` con `[]domain.DDCatalogMetric`.
   *
   *  Devuelve también `rejected`: lo que no se pudo adaptar, con su razón. Una
   *  métrica descartada en silencio deja un panel que no dibuja y no explica. */
  catalog: async (): Promise<AdaptedCatalog> =>
    adaptCatalog(await request<WireMetric[]>('/config/catalog')),

  /** La tabla tipo ↔ formas ↔ rangos de span. Es lo que permite que el builder
   *  valide una composición sin llevar la tabla escrita adentro.
   *
   *  También llega como arreglo desnudo. */
  blocks: async (): Promise<{ blocks: Block[] }> => ({
    blocks: adaptBlocks(await request<WireBlock[]>('/config/blocks')),
  }),

  /** El layout de una pestaña. SIN datos: por eso cambiar de período no la
   *  vuelve a pedir. */
  tab: async (tabId: string, layoutId?: string): Promise<TabWithPanels> =>
    adaptTab(
      await request<WireTabWithPanels>(
        `/config/tabs/${encodeURIComponent(tabId)}` +
          (layoutId === undefined ? '' : `?layoutId=${encodeURIComponent(layoutId)}`),
      ),
    ),

  /** Los payloads de una pestaña en una sola llamada. Fallo parcial: un panel
   *  que no resuelve llega con `estado: ERROR` y el resto vuelve normal. */
  panelsBatch: async (panelIds: string[], period: string): Promise<Record<string, Payload>> => {
    const crudo = await request<Record<string, WirePayload>>('/config/panels:batch', {
      method: 'POST',
      // **`panel_ids` y `period`, no `panelIds` y `periodo`** · F1.36. Los dos
      // llevan `binding:"required"` en Gin, así que un nombre equivocado no
      // devuelve un batch vacío: devuelve **400**. Iba mal desde F1.1 y no lo
      // vio nadie porque MSW respondía a cualquier cuerpo.
      body: JSON.stringify({ panel_ids: panelIds, period }),
    })
    // **Panel por panel, y un payload que no se puede armar sale como `ERROR`
    // en SU celda.** El contrato ya declara fallo parcial: uno roto no arrastra
    // a los otros, y eso vale también para el adaptador.
    return Object.fromEntries(Object.entries(crudo).map(([id, p]) => [id, adaptPayload(p)]))
  },

  /** Los hilos del usuario del token. El backend ya los ordena · F3.7.
   *
   *  **La ruta era `/config/chat/hilos` y no existía.** Desde `82da946` el
   *  servicio sirve `GET /config/chat/threads`, y la diferencia no es solo el
   *  nombre: **devuelve un arreglo desnudo**, no `{ hilos: [...] }`. Leerlo con
   *  la forma vieja daba `undefined` y un riel vacío sin decir por qué.
   *
   *  **El filtro por panel es lo que hace útil al riel dentro de la hoja**: la
   *  conversación de un panel se lista sola, sin mezclarse con las de los otros
   *  once. Lo resuelve el servicio, no el front. */
  threads: (panelId?: string, periodo?: string) => {
    const q = new URLSearchParams()
    if (panelId !== undefined) q.set('panel_id', panelId)
    if (periodo !== undefined) q.set('period', periodo)
    const cola = q.toString()
    return request<WireChatThread[]>(
      `/config/chat/threads${cola === '' ? '' : `?${cola}`}`,
    ).then((hilos) => hilos.map(adaptThread))
  },

  /** El tema es preferencia de USUARIO, no de tenant · §2.4.
   *
   *  **La ruta es `/preferences` y la clave es `theme`** · F1.36. Iba a
   *  `/preferencias` con `{ tema }`, que en este servicio es un 404.
   *
   *  Y hay una asimetría que no es nuestra: el servicio ESCRIBE el tema pero
   *  `/config/me` no lo devuelve, así que la preferencia se guarda y no se puede
   *  leer. Está pedido en §4 del plan de integración; hasta entonces la consola
   *  arranca con el defecto que emite `tokens.css`. */
  savePreferences: (theme: 'dark' | 'light') =>
    request<{ theme: 'dark' | 'light' }>('/config/me/preferences', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    }),
}
