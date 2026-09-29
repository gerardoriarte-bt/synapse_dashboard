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

/** Un cliente, con lo que A1 necesita para su banda · B4.1 · desde `6e521cc`.
 *
 *  **Era `{ id, nombre }` hasta el 2026-09-26.** `GET /admin/tenants` servía
 *  `TenantPublicOption` —«public option» porque nació para llenar un selector— y
 *  A1 declaraba cinco columnas ausentes. Llegaron tres.
 *
 *  `estado` y `vertical` siguen en `null`, y **no porque falte el campo**: el
 *  servicio los manda vacíos esperando que definamos sus valores. Es una
 *  pregunta nuestra sin contestar, no un hueco de ellos. */
export type Tenant = {
  id: string
  nombre: string
  locale: string
  moneda: string
  zonaHoraria: string
  /** Usuarios ACTIVOS. **Cero es válido**: un cliente nuevo no tiene ninguno. */
  usuarios: number
  /** `null` si nunca se publicó un layout. */
  publicadoEn: string | null
  /** Ya reducido por el servicio sobre todas las fuentes del cliente.
   *
   *  **`unknown` no es lo mismo que vencido**: quiere decir que ninguna fuente
   *  cargó nunca. Colapsarlos pintaría un cliente sin datos como uno al día. */
  peorFuente: string
  /** Horas desde la última carga de la peor fuente. **`null` es «nunca cargó» y
   *  `0` es «recién»** — la misma distinción que `saludDeFuente` sostiene en A5,
   *  y confundirlas pinta una fuente muerta como sana. */
  peorFuenteHoras: number | null
  /** `null` hasta que definamos los valores · pedido abierto. */
  estado: string | null
  /** `null` hasta que definamos los valores · pedido abierto. */
  vertical: string | null
}

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
/** ── LA FORMA CAMBIÓ Y ES MÁS CHICA · 2026-09-26 ────────────────────────────
 *
 *  Este tipo describía la respuesta de NUESTRO fork, que devolvía cada pestaña
 *  con **sus paneles ya filtrados** por `hidden_metric_ids`. Upstream tomó B4.9
 *  en `8633b10` con una forma distinta, medida: devuelve QUÉ PESTAÑAS ve el rol
 *  y nada más — ni paneles, ni `without_payloads`.
 *
 *  **Y no hay otra ruta que lo dé.** `GET /config/tabs/{tabId}` resuelve el rol
 *  desde el token y no acepta lente, así que un admin no puede pedir una pestaña
 *  «con los ojos de otro rol». Está medido y anotado en el cable.
 *
 *  Lo que se pierde es el nivel de panel, que es la mitad de §7.2. Queda pedido
 *  a backend; hasta entonces `RolePreview` declara el hueco en vez de pintar una
 *  grilla vacía. */
export type PreviewDeRol = {
  layoutId: string
  dashboardId: string
  /** El del layout previsualizado: un borrador se puede previsualizar. */
  estado: EstadoDeLayout
  /** Anidado en el cable, y acá también: son un par, no dos campos sueltos. */
  rol: { id: string; nombre: string }
  /** **Con sus paneles desde el 2026-09-28** · B4.9 llegó. Vienen filtrados por
   *  `hidden_metric_ids` y con los `layout_overrides` aplicados — el servidor
   *  usa el mismo código que sirve la consola, así que no pueden divergir. */
  tabs: { tab: TabDeLayout; paneles: PanelConfig[] }[]
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
  /** **La identidad ESTABLE de la pestaña** · el `id` se recrea en cada versión
   *  publicada y esto no. Es con lo que la consola de roles restringe. */
  clave: string
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

/** ── LOS QUINCE CAMPOS PASARON A snake_case · 2026-09-26 ────────────────────
 *
 *  Los tres adaptadores de abajo leían PascalCase —`w.ID`, `p.MetricID`,
 *  `t.tab.SortOrder`— porque hasta `6e595e3` los structs de dominio de Go **no
 *  tenían etiquetas `json:`** y Go serializaba con el nombre del campo. Estaba
 *  medido y escrito: «el PascalCase quedó confirmado y no deducido».
 *
 *  **`8633b10` les puso etiquetas** —B4.10— y los quince pasaron a `undefined`.
 *
 *  **Y no rompía: mentía.** Trece de los quince dan `undefined`, que se ve como
 *  un hueco. El catorceavo es el que enseña:
 *
 *      estado: ESTADOS[w.Status] ?? 'borrador'
 *
 *  `ESTADOS[undefined]` es `undefined`, así que el `??` entregaba `'borrador'`
 *  **para todo layout, incluido el publicado**. El fallback estaba escrito como
 *  «la lectura SEGURA», y con la clave cambiada dejó de ser una lectura segura y
 *  pasó a ser una afirmación falsa con cara de prudencia.
 *
 *  No lo vio el compilador —el tipo venía del yaml, que también decía
 *  PascalCase—, ni el lint, ni las pruebas, que corren contra fixtures hechos
 *  del mismo yaml. Lo encontró `humo` la primera vez que supo comparar los
 *  campos que el servicio manda contra los que el cable declara. */
function adaptarVersion(w: WireLayoutVersion): LayoutVersion {
  return {
    id: w.id,
    tenantId: w.tenant_id,
    // Un estado que no es `draft` ni `published` no se sustituye por uno: cae en
    // `borrador`, que es la lectura SEGURA — un layout que no se sabe si está
    // publicado no se trata como publicado.
    //
    // **Ese «seguro» depende de que la clave exista.** Ver el comentario de
    // arriba: con `Status` en vez de `status` este `??` afirmaba «borrador» sobre
    // el layout publicado durante un día entero.
    estado: ESTADOS[w.status] ?? 'borrador',
    versionId: w.version_id,
    publicadoEn: w.published_at ?? null,
  }
}

function adaptarPanel(p: A['LayoutPanel']): PanelConfig {
  return {
    id: p.id,
    tipo: p.type as PanelConfig['tipo'],
    metricId: p.metric_id,
    colStart: p.col_start,
    colSpan: p.col_span,
    rowSpan: p.row_span,
    ...(p.options === undefined ? {} : { opciones: p.options }),
  }
}

export function adaptarDetalle(w: WireLayoutDetail): LayoutDetalle {
  return {
    layout: adaptarVersion(w.layout),
    tabs: w.tabs.map((t) => ({
      tab: {
        id: t.tab.id,
        clave: t.tab.key,
        nombre: t.tab.name,
        pregunta: t.tab.operational_question ?? '',
        orden: t.tab.sort_order,
        roles: t.tab.role_ids ?? [],
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
    // `?? null` por la misma razón que arriba: ausente es una procedencia —vino
    // de la ruta por cliente— y no un nombre vacío.
    clienteNombre: w.tenant_name ?? null,
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
    // ── LA RESTRICCIÓN SE LEE POR CLAVE, CON RESPALDO ──────────────────────
    //
    // **`tab_ids` apunta a `dd_tabs.id`, que se recrea en cada versión
    // publicada**, así que un rol restringido por id pierde sus pestañas en la
    // primera publicación real desde el builder. `tab_keys` es estable.
    //
    // **El respaldo no es cortesía, es el orden del backend**: su regla es «si
    // hay `tab_keys` manda la key; si está vacía cae a `tab_ids`». Leerlo al
    // revés dejaría sin restricción a un rol que todavía no migró.
    //
    // Lo que el front escribe es **siempre `tab_keys`** · ver `cuerpoDeRol`.
    pestanas: (w.tab_keys ?? []).length > 0 ? w.tab_keys : w.tab_ids,
    metricasOcultas: w.hidden_metric_ids,
    overrides: (w.layout_overrides ?? {}) as Record<string, unknown>,
    usuarios: w.user_count,
  }
}

/** El preview sale de su propio servicio y ya no de `GetTab`, así que su forma
 *  es la suya: `role` anidado y pestañas planas.
 *
 *  **`roles: []` en cada pestaña no es un hueco**: la pregunta «qué roles ven
 *  esta pestaña» ya está contestada — es la pestaña de ESTE rol.
 *
 *  **Los paneles volvieron el 2026-09-28** · medido contra `5924bf2b`: lente
 *  `admin` 12 paneles, lente `planner` 9 con `col_span` 4. Los dos recortes que
 *  §7.2 pide —qué pestañas y qué paneles— en una sola respuesta. */
function adaptarPreview(w: WirePreview): PreviewDeRol {
  return {
    layoutId: w.layout_id,
    dashboardId: w.dashboard_id,
    estado: ESTADOS[w.status] ?? 'borrador',
    rol: { id: w.role.id, nombre: w.role.name },
    tabs: w.tabs.map((t) => ({
      tab: {
        id: t.id,
        clave: t.key,
        nombre: t.name,
        pregunta: t.operational_question ?? '',
        orden: t.sort_order,
        roles: [],
      },
      paneles: t.panels.map((x) => ({
        id: x.id,
        tipo: x.type as PanelConfig['tipo'],
        metricId: x.metric_id,
        colStart: x.col_start,
        colSpan: x.col_span,
        rowSpan: x.row_span,
        ...(x.options === undefined ? {} : { opciones: x.options }),
        // La nota vacía se omite · misma regla que en el cable de consola.
        ...(x.note === '' ? {} : { nota: x.note }),
      })),
    })),
  }
}

const cuerpoDeRol = (r: RolParaGuardar): A['RoleInput'] => ({
  name: r.nombre,
  // **Se escribe `tab_keys` y NO `tab_ids`** · desde el 2026-09-29, cuando el
  // backend lo habilitó en `de881e1`. Mandar ids era escribir una restricción
  // con fecha de vencimiento: la próxima publicación los recrea.
  //
  // **No se mandan los dos.** El backend prioriza `tab_keys`, así que un
  // `tab_ids` al lado sería ruido que alguien va a leer como la fuente.
  tab_keys: r.pestanas,
  hidden_metric_ids: r.metricasOcultas,
  ...(r.overrides === undefined ? {} : { layout_overrides: r.overrides }),
})

export const adminApi = {
  tenants: async (): Promise<Tenant[]> =>
    (await pedir<WireTenantOption[]>('/admin/tenants')).map((t) => ({
      id: t.id,
      nombre: t.name,
      locale: t.locale,
      moneda: t.currency,
      zonaHoraria: t.timezone,
      usuarios: t.user_count,
      // `?? null` en los tres, y **nunca `?? 0` ni `?? ''`**: un cero que
      // significa «no sé» es el defecto que A5 ya documentó.
      publicadoEn: t.last_published_at ?? null,
      peorFuente: t.worst_feed_status ?? 'unknown',
      peorFuenteHoras: t.worst_feed_freshness_hours ?? null,
      estado: t.status ?? null,
      vertical: t.vertical ?? null,
    })),

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

  /** Los usuarios de UN cliente · servida desde `1e080ee`.
   *
   *  Sigue existiendo aunque haya alcance de plataforma: es la que sirve a la
   *  ficha de cliente (A2), donde la pregunta ya es de un cliente. */
  usuarios: async (tenantId: string): Promise<Usuario[]> =>
    (await pedir<WireUser[]>(`/admin/tenants/${encodeURIComponent(tenantId)}/users`)).map(
      adaptarUsuario,
    ),

  /** **Todos los usuarios de la plataforma** · B4.17 · desde `6e521cc`.
   *
   *  Es la que A3 pedía y no existía. Los conteos vienen del servicio: ver
   *  `UsuariosDePlataforma`.
   *
   *  **No reemplaza a `usuarios`** — la de arriba sirve a A2, donde el cliente ya
   *  está elegido y pedir toda la plataforma para filtrar uno sería traer N veces
   *  lo que no se usa. */
  usuariosDePlataforma: async (): Promise<UsuariosDePlataforma> => {
    const w = await pedir<WireUsersPlatform>('/admin/users')
    return {
      total: w.total,
      clientes: w.tenants,
      usuarios: w.users.map(adaptarUsuario),
    }
  },

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
        // **`role_id`, snake_case** · corregido el 2026-09-26. Mandaba `roleId`
        // y el servicio contesta **400 · «role_id es requerido y debe ser un
        // uuid»**, medido: F4.12 no pudo haber funcionado nunca contra el
        // servicio real.
        //
        // No se deduce del resto: `/config/tabs` usa `layoutId` y `dashboardId`
        // en camelCase, en el mismo binario. Y **MSW no podía verlo** — su
        // handler leía la misma grafía que mandábamos, así que respondía igual.
        // Ahora el mock exige `role_id` y devuelve 400 sin él.
        `/admin/layouts/${encodeURIComponent(layoutId)}/preview?role_id=${encodeURIComponent(rolId)}`,
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
export type WireUsersPlatform = A['UsersPlatform']

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
  /** **El nombre del cliente, y sólo llega en el alcance de PLATAFORMA.**
   *
   *  `GET /admin/tenants/{id}/users` no lo trae —sería redundante, el cliente es
   *  el de la URL— y `GET /admin/users` sí. `null` dice «esta fila vino de la
   *  ruta por cliente», que es una procedencia y no un dato faltante. */
  clienteNombre: string | null
}

/** El listado de plataforma · B4.17.
 *
 *  **Los dos conteos los cuenta el SERVICIO**, y por eso viajan en vez de
 *  derivarse de `usuarios.length`: `clientes` es «clientes con al menos un
 *  usuario», que de la lista no se deduce sin agrupar, y un total nuestro bajaría
 *  en silencio si una consulta fallara. Es la razón que `UserList` escribió
 *  cuando la ruta no existía. */
export type UsuariosDePlataforma = {
  total: number
  clientes: number
  usuarios: Usuario[]
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
