/** El único lugar del front que habla con el backend · F1.1.
 *
 *  SIN IMPORTS DE MOCK. Es la regla que el andamio de v2 rompía y por la que una
 *  superficie terminaba acoplada a datos falsos. Si hace falta responder sin
 *  backend, se hace con MSW a nivel HTTP, no con un fixture importado.
 */
import { ApiError } from './types'
import type {
  AppContext,
  Block,
  Envelope,
  Metric,
  Payload,
  TabWithPanels,
  ThreadSummary,
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
  const body = (await res.json()) as Envelope<T>

  if (!body.success) {
    throw new ApiError(body.error.codigo, body.error.mensaje, res.status, body.error.desbloqueaCon)
  }

  return body.data
}

export const api = {
  /** Quién sos, qué tenant, qué rol, qué pestañas y qué períodos. */
  me: () => request<AppContext>('/config/me'),

  /** Las métricas del tenant, YA filtradas por rol. El front no filtra. */
  catalog: () => request<{ metrics: Metric[] }>('/config/catalog'),

  /** La tabla tipo ↔ formas ↔ rangos de span. Es lo que permite que el builder
   *  valide una composición sin llevar la tabla escrita adentro. */
  blocks: () => request<{ blocks: Block[] }>('/config/blocks'),

  /** El layout de una pestaña. SIN datos: por eso cambiar de período no la
   *  vuelve a pedir. */
  tab: (tabId: string, layoutId?: string) =>
    request<TabWithPanels>(
      `/config/tabs/${encodeURIComponent(tabId)}` +
        (layoutId === undefined ? '' : `?layoutId=${encodeURIComponent(layoutId)}`),
    ),

  /** Los payloads de una pestaña en una sola llamada. Fallo parcial: un panel
   *  que no resuelve llega con `estado: ERROR` y el resto vuelve normal. */
  panelsBatch: (panelIds: string[], period: string) =>
    request<Record<string, Payload>>('/config/panels:batch', {
      method: 'POST',
      body: JSON.stringify({ panelIds, periodo: period }),
    }),

  /** Los hilos del usuario del token. El backend ya los ordena. */
  threads: () => request<{ hilos: ThreadSummary[] }>('/config/chat/hilos'),

  /** El tema es preferencia de USUARIO, no de tenant · §2.4. */
  savePreferences: (preferences: { tema: 'dark' | 'light' }) =>
    request<void>('/config/me/preferencias', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
}
