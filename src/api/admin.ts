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
/** **Del FORK** · B4.8 y B4.9. El servicio desplegado no sirve estas rutas: hoy
 *  devuelven 404. Están en el cable marcadas `x-origen: fork` para que F4.3 y
 *  F4.12 se puedan construir contra MSW, igual que se construyó la consola. */
export type WireRole = A['Role']
export type WirePreview = A['Preview']

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

/** Un rol del tenant · B4.8.
 *
 *  **`pestanas` vacío significa «ve todas»**, no «no ve ninguna», y el nombre en
 *  singular de cada campo importa: `metricasOcultas` OCULTA y no impide. El
 *  servidor vuelve a verificar en `/config/catalog` y en el batch, así que un
 *  rol que oculta una métrica no es un rol que no pueda pedirla · §1.4.20. */
export type Rol = {
  id: string
  tenantId: string
  nombre: string
  pestanas: string[]
  metricasOcultas: string[]
  overrides: Record<string, unknown>
  /** Con uno o más, borrar da 409. Viaja en el listado para que la pantalla lo
   *  diga antes de ofrecer el botón, y no después del rechazo. */
  usuarios: number
}

export type RolParaGuardar = {
  nombre: string
  pestanas: string[]
  metricasOcultas: string[]
  overrides?: Record<string, unknown>
}

/** El layout como lo vería un rol · B4.9. **Sin payloads**, y lo declara. */
export type PreviewDeRol = {
  layoutId: string
  rolId: string
  rolNombre: string
  tabs: { tab: TabDeLayout; panels: PanelConfig[] }[]
  sinPayloads: boolean
}

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

function adaptarUsuario(w: WireUser): Usuario {
  return {
    id: w.id,
    // El nombre completo se arma acá y no en la pantalla: el cable manda las dos
    // mitades y quien las junta tiene que ser uno solo.
    nombre: `${w.first_name} ${w.last_name}`.trim(),
    email: w.email,
    rol: w.role,
    rolId: w.role_id,
    // `?? null` y no una cadena vacía: «nunca entró» es un hecho, no un texto.
    ultimoAccesoEn: w.last_login_at ?? null,
    activo: w.is_active,
    altaEn: w.created_at,
  }
}

function adaptarFuente(w: WireFeed): Fuente {
  return {
    clave: w.key,
    nombre: w.name,
    tablaGold: w.gold_table ?? '',
    cadenciaHoras: w.cadence_hours,
    toleranciaFactor: w.tolerance_factor,
    // `?? null` y no `?? 0`: cero horas de frescura es «cargó recién», que es lo
    // contrario de «nunca cargó». Confundirlos diría que una fuente sin estrenar
    // está al día.
    ultimaCargaEn: w.last_load_at ?? null,
    frescuraHoras: w.freshness_hours ?? null,
    filasProcesadas: w.rows_processed ?? null,
    filasFallidas: w.rows_failed ?? null,
    metricas: w.metric_keys ?? [],
    activa: w.is_active,
  }
}

function adaptarRol(w: WireRole): Rol {
  return {
    id: w.id,
    tenantId: w.tenant_id,
    nombre: w.name,
    pestanas: w.tab_ids,
    metricasOcultas: w.hidden_metric_ids,
    overrides: (w.layout_overrides ?? {}) as Record<string, unknown>,
    usuarios: w.user_count,
  }
}

/** **La forma de la CONSOLA, no la del builder.** El preview sale de `GetTab`,
 *  así que sus pestañas y paneles vienen en snake_case —`sort_order`,
 *  `col_start`— y no en el PascalCase del dominio. Adaptarlos con
 *  `adaptarDetalle` daría `undefined` en todo. */
function adaptarPreview(w: WirePreview): PreviewDeRol {
  return {
    layoutId: w.layout_id,
    rolId: w.role_id,
    rolNombre: w.role_name,
    tabs: w.tabs.map((t) => ({
      tab: {
        id: t.tab.id,
        nombre: t.tab.name,
        pregunta: t.tab.operational_question ?? '',
        orden: t.tab.sort_order,
        // El preview no devuelve los roles de la pestaña: la pregunta ya está
        // contestada — es la pestaña de ESTE rol.
        roles: [],
      },
      panels: t.panels.map((p) => ({
        id: p.id,
        tipo: p.type as PanelConfig['tipo'],
        metricId: p.metric_id,
        colStart: p.col_start,
        colSpan: p.col_span,
        rowSpan: p.row_span,
        ...(p.options === undefined ? {} : { opciones: p.options }),
      })),
    })),
    sinPayloads: w.without_payloads,
  }
}

const cuerpoDeRol = (r: RolParaGuardar): A['RoleInput'] => ({
  name: r.nombre,
  tab_ids: r.pestanas,
  hidden_metric_ids: r.metricasOcultas,
  ...(r.overrides === undefined ? {} : { layout_overrides: r.overrides }),
})

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

  /* ── B4.8 y B4.9 · del FORK · el servicio desplegado devuelve 404 ──────── */

  /** Los agentes del cliente · B3.9, del commit `82da946` del upstream.
   *
   *  **No es del fork**, a diferencia de `roles` y `preview`: esta ruta la
   *  escribieron ellos. Lo que sí falta es el esquema — las tres columnas que
   *  el CRUD escribe no existen en la base compartida, medido el 2026-09-21—,
   *  así que contra el servicio esto da **500, no 404**. Ver B3.11. */
  agentes: async (tenantId: string): Promise<Agente[]> =>
    (await pedir<WireAgent[]>(`/admin/tenants/${encodeURIComponent(tenantId)}/agents`)).map(
      adaptAgent,
    ),

  /** Los usuarios del cliente · B4.16, servida desde `1e080ee`.
   *
   *  **Por cliente, y A3 está dibujada con alcance plataforma.** No se suman N
   *  llamadas: un total armado acá parecería de plataforma y sería una cuenta
   *  nuestra. La pantalla lo declara. */
  usuarios: async (tenantId: string): Promise<Usuario[]> =>
    (await pedir<WireUser[]>(`/admin/tenants/${encodeURIComponent(tenantId)}/users`)).map(
      adaptarUsuario,
    ),

  /** Las fuentes del cliente y su salud · B2.13, servida desde `1e080ee`. */
  fuentes: async (tenantId: string): Promise<Fuente[]> =>
    (await pedir<WireFeed[]>(`/admin/tenants/${encodeURIComponent(tenantId)}/feeds`)).map(
      adaptarFuente,
    ),

  roles: async (tenantId: string): Promise<Rol[]> =>
    // `/roles/composition` y NO `/roles` · 2026-09-25. `168a761` puso SU listado
    // en `/roles`, que contesta otra pregunta —qué dashboards ve un rol— y con
    // otra forma. Mientras pedimos `/roles`, el servicio real devolvía la suya,
    // `pestanas` quedaba `undefined` donde el tipo promete `string[]` y la
    // pantalla de admin salía en NEGRO. El `POST` sigue en `/roles`.
    (
      await pedir<WireRole[]>(
        `/admin/tenants/${encodeURIComponent(tenantId)}/roles/composition`,
      )
    ).map(
      adaptarRol,
    ),

  crearRol: async (tenantId: string, rol: RolParaGuardar): Promise<Rol> =>
    adaptarRol(
      await pedir<WireRole>(`/admin/tenants/${encodeURIComponent(tenantId)}/roles`, {
        method: 'POST',
        body: JSON.stringify(cuerpoDeRol(rol)),
      }),
    ),

  editarRol: async (rolId: string, rol: RolParaGuardar): Promise<Rol> =>
    adaptarRol(
      await pedir<WireRole>(`/admin/roles/${encodeURIComponent(rolId)}`, {
        method: 'PUT',
        body: JSON.stringify(cuerpoDeRol(rol)),
      }),
    ),

  /** **204 sin cuerpo**, así que no pasa por `pedir`: aquel exige JSON y un 204
   *  no lo trae. Leerlo con `res.json()` tiraría, y el catch diría «respondió
   *  204 sin cuerpo» — que es cierto y es exactamente lo correcto. */
  borrarRol: async (rolId: string): Promise<void> => {
    const token = currentToken()
    const res = await fetch(`${BASE}/admin/roles/${encodeURIComponent(rolId)}`, {
      method: 'DELETE',
      headers: { ...(token === null ? {} : { Authorization: `Bearer ${token}` }) },
    })
    if (res.status === 204) return
    // Un 409 trae cuerpo y su mensaje dice cuántos usuarios tiene el rol.
    let cuerpo: { error?: string } = {}
    try {
      cuerpo = (await res.json()) as typeof cuerpo
    } catch {
      throw new ApiError(SIN_CODIGO, `El servicio respondió ${String(res.status)} sin cuerpo.`, res.status)
    }
    throw new ApiError(
      res.status === 409 ? 'REGLA_ROL_CON_USUARIOS' : SIN_CODIGO,
      cuerpo.error ?? '',
      res.status,
    )
  },

  previewPorRol: async (layoutId: string, rolId: string): Promise<PreviewDeRol> =>
    adaptarPreview(
      await pedir<WirePreview>(
        `/admin/layouts/${encodeURIComponent(layoutId)}/preview?roleId=${encodeURIComponent(rolId)}`,
      ),
    ),

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

/* ── B3.9 · el agente por tenant · F4.4 ─────────────────────────────────────
 *
 *  **Acá se decide qué NO cruza la frontera, y es la mitad de la tarea.**
 *  `AgentAdminDTO` trae `snowflake_db`, `snowflake_schema` y `warehouse`, y
 *  §7.3 de `design.md` los prohíbe en esta superficie: «no se muestra
 *  vocabulario de infraestructura — ni base, ni rol técnico, ni grants, ni
 *  warehouse. Se declara la consecuencia, no la plomería».
 *
 *  **Se recortan en el adaptador y no en el componente.** Si llegaran hasta el
 *  render, taparlos sería una decisión de cada pantalla que los use, y alcanza
 *  con que una se olvide. Acá no existen: el tipo no los tiene.
 *
 *  `semantic_views` tampoco pasa — son nombres de objeto de Snowflake, o sea la
 *  misma plomería con otro nombre. Lo que sí pasa es **cuántas son**, que
 *  responde «¿tiene datos asignados?» sin nombrar ninguno.
 */

export type WireAgent = A['AgentAdmin']
export type WireFeed = A['Feed']
export type WireUser = A['User']

/** El agente, en el vocabulario del producto. */
/** Un usuario del cliente · A3 · F4.3.
 *
 *  **`estado` es derivado y son DOS, no los tres que el dibujo pinta.** A3
 *  dibuja `ACTIVO`, `SUSPENDIDO` e `INVITACIÓN PENDIENTE`, y el cable sólo trae
 *  `is_active`. El tercero se declara como hueco en la pantalla: inferirlo de
 *  «nunca entró» sería inventarlo — alguien puede tener cuenta activa y no haber
 *  entrado todavía, que es otra cosa. */
export type Usuario = {
  id: string
  nombre: string
  email: string
  /** El nombre del rol. `rolId` sirve para enlazar con la ficha. */
  rol: string
  rolId: string
  /** `null` cuando nunca entró · el dibujo lo pinta «Nunca». */
  ultimoAccesoEn: string | null
  activo: boolean
  altaEn: string
}

/** Una fuente de datos del tenant · A5 · F4.24.
 *
 *  **No trae estado.** El cable manda `status` y acá no está a propósito: el
 *  estado se deriva de `frescura > cadencia × tolerancia` —§PEN:A5, al pie— y
 *  tenerlo en el tipo invitaría a leerlo. Ver `surfaces/admin/saludDeFuente.ts`.
 *
 *  **Tampoco trae capa**, y el dibujo la pone como columna: el cable no la
 *  manda. Declarado como hueco en F4.24 y pedido; acá no se inventa. */
export type Fuente = {
  clave: string
  nombre: string
  /** Vacío mientras la fuente no tenga tabla Gold. */
  tablaGold: string
  cadenciaHoras: number
  toleranciaFactor: number
  /** `null` cuando nunca cargó · no es un error, es una fuente sin estrenar. */
  ultimaCargaEn: string | null
  frescuraHoras: number | null
  filasProcesadas: number | null
  filasFallidas: number | null
  /** Las métricas que dependen de esta fuente. */
  metricas: string[]
  activa: boolean
}

export type Agente = {
  id: string
  nombre: string
  /** El rol de PRODUCTO que atiende — «Planner», «CEO»—, no un rol técnico. */
  rol: string
  /** Baja lógica. **No es «el acceso funciona»**, ver `EstadoDeAcceso`. */
  activo: boolean
  /** Cuántas vistas tiene asignadas. Sin los nombres · §7.3. */
  vistas: number
  /** Cuándo se editó la fila. **No es «cuándo se verificó el acceso»**. */
  editadoEn: string
}

export function adaptAgent(w: WireAgent): Agente {
  return {
    id: w.id,
    nombre: w.name,
    rol: w.target_role,
    activo: w.is_active,
    vistas: w.semantic_views.length,
    editadoEn: w.updated_at,
  }
}
