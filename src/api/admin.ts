/** El cliente de admin y builder · F4.23
 *
 *  Las ocho operaciones de `/admin/*` sobre layouts, más el adaptador que
 *  traduce sus respuestas.
 *
 *  ── POR QUÉ HACE FALTA UN ADAPTADOR ACÁ TAMBIÉN ─────────────────────────────
 *
 *  Por lo mismo que en la consola y con una vuelta de tuerca: las respuestas de
 *  admin **mezclan dos convenciones**. Los DTO del builder llevan etiquetas
 *  `json:` y salen en snake_case —`valid`, `errors`, `layout`, `tabs`—, y los
 *  structs de DOMINIO no llevan ninguna, así que Go los serializa con el nombre
 *  del campo: `ID`, `TenantID`, `Status`, `ColStart`.
 *
 *  **Eso rompe los propios tests de Postman del backend** —`scriptCreateDraft`
 *  compara `lv.status` contra `'draft'` y lo que llega es `Status`—, que es la
 *  evidencia de que es un descuido y no una convención. Está pedido en B4.10.
 *  Mientras tanto se absorbe acá, igual que el resto del cable.
 *
 *  ── LA FORMA QUE SALE DE ACÁ ES UNA PROPUESTA ───────────────────────────────
 *
 *  **El contrato NO declara admin todavía.** `contracts/synapse-api.yaml` lo dice
 *  en su alcance: «Administración y builder se agregan cuando esas superficies
 *  prueben qué necesitan, no antes». Así que lo que este archivo devuelve no es
 *  «el contrato» sino **la propuesta**, igual que nació el de la consola — la
 *  pantalla corre contra esta forma y eso demuestra que alcanza.
 *
 *  Sigue las convenciones del contrato: español, camelCase, y **reusa
 *  `PanelConfig`** — un panel del builder es el mismo panel que la consola
 *  dibuja, y darle dos formas sería garantizar que se separen. Es lo que se
 *  propondrá en B0.6.
 */
import { ApiError, SIN_CODIGO } from './types'
import type { PanelConfig } from './types'
import { adaptCatalog } from './adapt'
import type { AdaptedCatalog, WireMetric } from './adapt'
import type { components as admin } from './admin-generated'
import { currentToken } from '../app/auth/session'

type A = admin['schemas']

export type WireLayoutVersion = A['LayoutVersion']
export type WireLayoutDetail = A['LayoutDetail']
export type WireValidationResult = A['ValidationResult']
export type WireTenantOption = A['TenantOption']

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

/** El mismo desenvolvimiento que `client.ts`, y por las mismas razones: el
 *  envelope se lee en un solo lugar, `error` es una cadena en este servicio, y
 *  un 502 del proxy no devuelve JSON.
 *
 *  **No se reusa `client.ts` porque devolvería el tipo del contrato de consola.**
 *  El día que los dos hablen la misma forma, este archivo se funde con aquel —
 *  la misma nota que lleva `auth.ts`. */
async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = currentToken()
  const res = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
      ...opciones.headers,
    },
  })

  let cuerpo: { success: boolean; data?: T; error?: string }
  try {
    cuerpo = (await res.json()) as typeof cuerpo
  } catch {
    throw new ApiError(SIN_CODIGO, `El servicio respondió ${String(res.status)} sin cuerpo.`, res.status)
  }

  if (!cuerpo.success) {
    // **El 409 tiene nombre propio y no es decoración.** Es «este layout ya está
    // publicado»: el servicio solo deja editar borradores. Sin distinguirlo, el
    // builder diría «error al guardar» sobre algo que tiene una salida concreta
    // —duplicar el layout— y quien compone no la encontraría.
    throw new ApiError(
      res.status === 409 ? 'REGLA_LAYOUT_PUBLICADO' : SIN_CODIGO,
      cuerpo.error ?? '',
      res.status,
    )
  }
  return cuerpo.data as T
}

/* ── Lo que sale de acá · la propuesta ─────────────────────────────────────── */

export type Tenant = { id: string; nombre: string }

export type EstadoDeLayout = 'borrador' | 'publicado'

export type LayoutVersion = {
  id: string
  tenantId: string
  estado: EstadoDeLayout
  versionId: string
  /** `null` mientras sea borrador: un borrador no tiene fecha de publicación, y
   *  poner la de creación sería decir que se publicó cuando no. */
  publicadoEn: string | null
}

export type TabDeLayout = {
  id: string
  nombre: string
  pregunta: string
  orden: number
  /** Vacío significa «la ven todos los roles». */
  roles: string[]
}

export type LayoutDetalle = {
  layout: LayoutVersion
  tabs: { tab: TabDeLayout; panels: PanelConfig[] }[]
}

/** Un problema de composición, **atado al panel que lo tiene**.
 *
 *  `tabId` y `panelId` vienen del servicio, y por eso el builder puede pintar el
 *  error SOBRE el panel en vez de en una lista al pie — que es la diferencia
 *  entre «arreglá esto» y «buscá cuál de los doce». */
export type ProblemaDeComposicion = {
  tabId: string | null
  panelId: string | null
  campo: string
  mensaje: string
}

export type ResultadoDeValidacion = {
  valido: boolean
  problemas: ProblemaDeComposicion[]
}

const ESTADOS: Readonly<Record<string, EstadoDeLayout>> = {
  draft: 'borrador',
  published: 'publicado',
}

function adaptarVersion(w: WireLayoutVersion): LayoutVersion {
  return {
    id: w.ID,
    tenantId: w.TenantID,
    // Un estado que no es `draft` ni `published` no se sustituye por uno: cae en
    // `borrador`, que es la lectura SEGURA — un layout que no se sabe si está
    // publicado no se trata como publicado.
    estado: ESTADOS[w.Status] ?? 'borrador',
    versionId: w.VersionID,
    publicadoEn: w.PublishedAt ?? null,
  }
}

function adaptarPanel(p: A['LayoutPanel']): PanelConfig {
  return {
    id: p.ID,
    tipo: p.Type as PanelConfig['tipo'],
    metricId: p.MetricID,
    colStart: p.ColStart,
    colSpan: p.ColSpan,
    rowSpan: p.RowSpan,
    ...(p.Options === undefined ? {} : { opciones: p.Options }),
  }
}

export function adaptarDetalle(w: WireLayoutDetail): LayoutDetalle {
  return {
    layout: adaptarVersion(w.layout),
    tabs: w.tabs.map((t) => ({
      tab: {
        id: t.tab.ID,
        nombre: t.tab.Name,
        pregunta: t.tab.OperationalQuestion ?? '',
        orden: t.tab.SortOrder,
        roles: t.tab.RoleIDs ?? [],
      },
      panels: t.panels.map(adaptarPanel),
    })),
  }
}

export function adaptarValidacion(w: WireValidationResult): ResultadoDeValidacion {
  return {
    valido: w.valid,
    problemas: w.errors.map((e) => ({
      tabId: e.tab_id ?? null,
      panelId: e.panel_id ?? null,
      campo: e.field ?? '',
      mensaje: e.message,
    })),
  }
}

/* ── Lo que entra · el cuerpo del PUT ──────────────────────────────────────── */

/** **El `PUT` es un REEMPLAZO COMPLETO**, no un parche: se envía el layout entero
 *  y lo que no venga se borra. Y **una tab sin `id` genera una NUEVA** en vez de
 *  editar la existente — la diferencia entre editar y duplicar, que el servicio
 *  no avisa.
 *
 *  Por eso `id` es opcional acá **y quien llama tiene que decidirlo a
 *  conciencia**: omitirlo no es «no sé», es «creá una».
 *
 *  *Nota del 2026-09-15:* el spread condicional de `aCuerpo` es una garantía de
 *  TIPO —`exactOptionalPropertyTypes`— y no de cable: `JSON.stringify` descarta
 *  las claves `undefined`, así que mandar `id: undefined` produce el mismo JSON.
 *  Verificado, porque la mutación que lo quitaba no rompió ninguna prueba y hubo
 *  que averiguar si era una prueba débil o un cambio sin efecto. Era lo segundo. */
export type TabParaGuardar = {
  id?: string
  nombre: string
  pregunta: string
  orden: number
  roles: string[]
  panels: { id?: string; metricId: string; tipo: string; colStart: number; colSpan: number; rowSpan: number; opciones?: Record<string, unknown> }[]
}

function aCuerpo(tabs: readonly TabParaGuardar[]): A['LayoutUpdateRequest'] {
  return {
    tabs: tabs.map((t) => ({
      ...(t.id === undefined ? {} : { id: t.id }),
      name: t.nombre,
      operational_question: t.pregunta,
      sort_order: t.orden,
      role_ids: t.roles,
      panels: t.panels.map((p) => ({
        ...(p.id === undefined ? {} : { id: p.id }),
        metric_id: p.metricId,
        type: p.tipo,
        col_start: p.colStart,
        col_span: p.colSpan,
        row_span: p.rowSpan,
        ...(p.opciones === undefined ? {} : { options: p.opciones }),
      })),
    })),
  }
}

export const adminApi = {
  tenants: async (): Promise<Tenant[]> =>
    (await pedir<WireTenantOption[]>('/admin/tenants')).map((t) => ({ id: t.id, nombre: t.name })),

  /** **El catálogo SIN filtrar por rol** · es la diferencia con
   *  `/config/catalog`. Quien compone tiene que poder asignar una métrica que
   *  después un rol no verá; filtrarla acá escondería la mitad del inventario.
   *
   *  Devuelve el mismo `Metric` del contrato, así que reusa el adaptador de la
   *  consola: una métrica es una métrica, y darle dos formas garantizaría que se
   *  separen. Y por lo mismo devuelve también `rejected` — una métrica con una
   *  familia fuera del enumerado tampoco se puede dibujar en el builder. */
  catalogo: async (tenantId: string): Promise<AdaptedCatalog> =>
    adaptCatalog(await pedir<WireMetric[]>(`/admin/tenants/${encodeURIComponent(tenantId)}/catalog`)),

  layouts: async (tenantId: string): Promise<LayoutVersion[]> =>
    (await pedir<WireLayoutVersion[]>(`/admin/tenants/${encodeURIComponent(tenantId)}/layouts`)).map(
      adaptarVersion,
    ),

  crearBorrador: async (tenantId: string, versionId?: string): Promise<LayoutVersion> =>
    adaptarVersion(
      await pedir<WireLayoutVersion>(`/admin/tenants/${encodeURIComponent(tenantId)}/layouts`, {
        method: 'POST',
        body: JSON.stringify({ version_id: versionId ?? '' }),
      }),
    ),

  layout: async (layoutId: string): Promise<LayoutDetalle> =>
    adaptarDetalle(await pedir<WireLayoutDetail>(`/admin/layouts/${encodeURIComponent(layoutId)}`)),

  guardar: async (layoutId: string, tabs: readonly TabParaGuardar[]): Promise<LayoutDetalle> =>
    adaptarDetalle(
      await pedir<WireLayoutDetail>(`/admin/layouts/${encodeURIComponent(layoutId)}`, {
        method: 'PUT',
        body: JSON.stringify(aCuerpo(tabs)),
      }),
    ),

  /** **Responde 200 aunque la composición sea inválida**: el 200 dice que la
   *  validación corrió, no que el layout esté bien. Lo que decide es `valido`. */
  validar: async (layoutId: string): Promise<ResultadoDeValidacion> =>
    adaptarValidacion(
      await pedir<WireValidationResult>(`/admin/layouts/${encodeURIComponent(layoutId)}/validate`, {
        method: 'POST',
      }),
    ),

  publicar: async (layoutId: string, versionId?: string): Promise<LayoutVersion> =>
    adaptarVersion(
      await pedir<WireLayoutVersion>(`/admin/layouts/${encodeURIComponent(layoutId)}/publish`, {
        method: 'POST',
        body: JSON.stringify({ version_id: versionId ?? '' }),
      }),
    ),
}
