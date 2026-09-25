/** El cable → el contrato · F1.33 y F1.34
 *
 *  `synapse-api-go` no implementó `contracts/synapse-api.yaml`. Manda otra
 *  forma: inglés snake_case, `error` como cadena, arreglos desnudos donde el
 *  contrato declara un objeto, estados en inglés, `Gobierno` anidado y el
 *  discriminador de `Valor` llamado `shape`.
 *
 *  **Este archivo es el único lugar donde esa diferencia existe.** Por debajo de
 *  `api/` todo habla el vocabulario del contrato, así que `render/`, `catalog/` y
 *  las superficies no se enteran — y `design-lint`, `spec-anclas` y la suite
 *  entera siguen valiendo sin tocar una línea. **Sin contarlas acá**: un número
 *  escrito en prosa se vence sin que nadie lo note, y éste ya decía «9 anclas» y
 *  «354 pruebas» cuando eran 10 y 740. Los conteos salen de las herramientas.
 *
 *  ── LA REGLA ────────────────────────────────────────────────────────────────
 *
 *  **Renombra y reformatea. No calcula, no inventa una cifra y no escribe copy
 *  de producto.**
 *
 *  Renombrar `col_span` a `colSpan` está bien. Componer `nombre` desde
 *  `first_name` y `last_name` está bien: los dos datos llegaron. Derivar un
 *  `porcentaje` que la composición no trajo NO está bien — el contrato dice
 *  explícitamente que lo calcula el backend porque redondear en el cliente da
 *  columnas que suman 99,9.
 *
 *  Donde el cable no trae el campo, el campo queda ausente o cae a un valor
 *  A PRUEBA DE FALLO —nunca a uno plausible—, y queda anotado acá y en §4 de
 *  `docs/PLAN-INTEGRACION-2026-09-11.md` como pedido al backend.
 *
 *  ── LA SEGUNDA FUNCIÓN, QUE NO ES TRADUCIR ──────────────────────────────────
 *
 *  En el cable `shape`, `family`, `layer` y `block_type` son **`string` libre**;
 *  en el contrato son enumerados cerrados. `make sync-catalog` hace upsert de lo
 *  que diga una vista de Snowflake, así que un valor desconocido no es
 *  hipotético. Este es el único lugar donde se puede detectar: una familia que no
 *  conocemos produce `var(--color-fam-vendors-1)`, que no existe, y la serie se
 *  pinta **sin color** sin que nada falle.
 *
 *  Por eso `adaptCatalog` devuelve también `rejected`: lo que no se pudo adaptar
 *  sale con su razón en vez de desaparecer en silencio · F1.35.
 *
 *  ── CUÁNDO SE BORRA ─────────────────────────────────────────────────────────
 *
 *  El día que el servicio implemente el contrato, esto se vuelve la identidad y
 *  desaparece. Es la razón de haberlo hecho así y no al revés.
 */
import type { components as wire } from './console-generated'
import type {
  AppContext,
  Block,
  Family,
  Layer,
  Metric,
  NetworkPayload,
  PanelConfig,
  Presentation,
  Shape,
  Tab,
  TabWithPanels,
  Value,
  ThreadSummary,
} from './types'

type W = wire['schemas']

export type WireContext = W['ContextResponse']
export type WireMetric = W['CatalogMetric']
export type WireBlock = W['BlockRule']
export type WireTabWithPanels = W['TabWithPanels']
export type WirePanel = W['PanelDTO']

/* ── Los enumerados que cambian de idioma ─────────────────────────────────────
 *
 * Tablas explícitas y no un `toLowerCase()` con guiones: `scalar_with_interval`
 * no se convierte en `escalarConIntervalo` con ninguna regla mecánica, y una
 * regla que funciona para ocho casos y falla en el noveno es peor que nueve
 * líneas escritas.
 */

/** Las nueve formas que `materialize.TransformValue` sabe producir.
 *
 *  Las otras siete del contrato —`distribucion`, `serieConBanda`,
 *  `categoricaComparada`, `perfilMultiatributo`, `matriz`, `flujo`, `grafo`— no
 *  están acá porque el backend no las materializa: su `switch` tiene nueve casos
 *  y un `default` que devuelve `ErrUnknownShape`. Ponerlas sería declarar una
 *  traducción para algo que nunca llega. */
/** **El nombre de cable de cada forma, y va al revés a propósito.**
 *
 *  Un `Record<string, Shape>` —que es como estuvo hasta el 2026-09-15— no puede
 *  estar incompleto, porque toda cadena es una clave válida. Y estaba: le
 *  faltaba `distribution`, así que `distribucion` salía de `accepted_shapes`
 *  **en silencio** y un bloque `distribution` quedaba con la lista vacía. El
 *  cuerpo está construido desde F1.13 y el builder no lo podía colocar nunca.
 *
 *  No se vio porque hoy ninguna métrica declara esa forma —verificado contra
 *  `/config/catalog` el 2026-09-15: seis `scalar`, dos `prose`, y una de
 *  `categorical`, `multi_series`, `tabular` y `time_series`—. Era un bug con
 *  fecha de activación, no uno inofensivo.
 *
 *  Escrito con la forma del contrato como CLAVE, **`Record` completo y no
 *  `Partial`**, agregar una forma al enumerado sin su nombre de cable deja de
 *  compilar. Es el mismo mecanismo que el criterio de F4.20 pide para el
 *  registro de cuerpos, acá donde sí se puede sostener hoy.
 *
 *  Los cinco nombres de las formas v1.1 no son inventados: los manda
 *  `/config/blocks` del servicio corriendo —`comparison` acepta
 *  `compared_categorical` y `multi_attribute_profile`, `matrix` acepta `matrix`,
 *  `graph` acepta `graph` y `flow`—. */
const NOMBRE_DE_FORMA: Readonly<Record<Shape, string>> = {
  escalar: 'scalar',
  escalarConIntervalo: 'scalar_with_interval',
  serieTemporal: 'time_series',
  serieConBanda: 'series_with_band',
  seriesMultiples: 'multi_series',
  categorica: 'categorical',
  categoricaComparada: 'compared_categorical',
  perfilMultiatributo: 'multi_attribute_profile',
  composicion: 'composition',
  distribucion: 'distribution',
  matriz: 'matrix',
  flujo: 'flow',
  grafo: 'graph',
  ranking: 'ranking',
  tabular: 'tabular',
  prosa: 'prose',
}

const FORMAS: Readonly<Record<string, Shape>> = Object.fromEntries(
  Object.entries(NOMBRE_DE_FORMA).map(([forma, nombre]) => [nombre, forma as Shape]),
)

/** **De acá sale el color de cada serie.** Los nombres del contrato son los que
 *  nombran los tokens: `--color-fam-demanda-1`. Una familia fuera de estas cinco
 *  no tiene rampa. */
export const FAMILIAS: Readonly<Record<string, Family>> = {
  demand: 'demanda',
  media: 'medios',
  inventory: 'inventario',
  customer: 'cliente',
  external: 'externo',
}

export const CAPAS: Readonly<Record<string, Layer>> = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
}

const GRANOS: Readonly<Record<string, 'dia' | 'semana' | 'mes'>> = {
  day: 'dia',
  week: 'semana',
  month: 'mes',
}

/** **Los quince tipos de panel, en runtime** · F1.35.
 *
 *  `PanelType` es una unión de TypeScript y **se borra al compilar**, así que no
 *  sirve para decidir en tiempo de ejecución si `block_type` es uno de los
 *  quince. En el cable es `string` libre.
 *
 *  Sin esta lista el adaptador hacía `b.type as Block['tipo']`, que es un cast:
 *  el compilador se calla y un tipo inventado entra a la tabla como si fuera
 *  bueno. **Una aserción de tipo sobre un dato de red es una afirmación sin
 *  evidencia.**
 *
 *  Es una copia del enumerado del contrato y hay que decirlo: `tests/contract.ts`
 *  lee el yaml y una prueba compara las dos, igual que `registry.test.tsx` hace
 *  con el registro de cuerpos. Una copia a mano sin esa prueba se desactualiza
 *  con el contrato adelante. */
const TIPOS = [
  'kpi', 'prose', 'series', 'bars', 'table', 'gauge', 'forecast', 'list', 'reco',
  'composition', 'comparison', 'distribution', 'blocked', 'matrix', 'graph',
] as const

export const TIPOS_DE_PANEL: readonly string[] = TIPOS

const esTipo = (s: string): s is Block['tipo'] => (TIPOS as readonly string[]).includes(s)

/** **Los nombres de los params de layout** · F1.41.
 *
 *  El cable los manda en inglés —`layout_params` de la tabla `blocks`— y
 *  `PARAM_SCHEMAS` de `api/params.ts` los espera en español. Sin esta tabla, un
 *  `gauge` llega con `{ maximum: 100 }`, `validateParams` no encuentra `maximum`
 *  en el esquema, lo descarta como desconocido, y **el cuerpo dibuja el arco
 *  contra su default**: el panel se ve bien mostrando otra cosa.
 *
 *  Es el modo de falla que `params.ts` existe para evitar, entrando por el lado
 *  contrario — no un param mal escrito por quien compone, sino uno bien escrito
 *  en el otro idioma.
 *
 *  Va acá y no en `params.ts` **porque acá están los otros dos mapeos**: formas y
 *  familias. Tres tablas de traducción en tres archivos es cómo una se queda
 *  atrás. */
const PARAMS: Readonly<Record<string, string>> = {
  comparative: 'comparativo',
  meter: 'medidor',
  pillars: 'pilares',
  normalization: 'normalizacion',
  cut: 'corte',
  order: 'orden',
  columns: 'columnas',
  band: 'banda',
  maximum: 'maximo',
  horizon: 'horizonte',
  cap: 'tope',
  window: 'ventana',
  bins: 'bins',
}

/** **Los que el cable declara y este front no lee**, con su tipo de panel:
 *
 *      brand (bars) · components (gauge) · interval_level (forecast)
 *      cuts (composition) · reference, profile_cap (comparison)
 *      stats (distribution) · scale (matrix) · clustering (graph)
 *
 *  **No se traducen a propósito y no se inventa un nombre.** Cinco son de los
 *  tres cuerpos que todavía no existen —`comparison`, `matrix`, `graph`— y los
 *  otros son opciones que ningún cuerpo nuestro lee hoy.
 *
 *  Pasan sin tocar, y `validateParams` los reporta como desconocidos: así el que
 *  compone se entera de que configuró algo que no se dibuja. **Descartarlos acá
 *  en silencio sería peor** — el panel se vería igual y nadie sabría por qué la
 *  opción no hace nada.
 *
 *  Ojo con `cut` y `cuts`: el primero es de `series` y `forecast` y sí se
 *  traduce; el segundo es de `composition` y no tiene contraparte. Un plural de
 *  diferencia. */
function traducirParams(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) out[PARAMS[k] ?? k] = v
  return out
}

/* ── Contexto ─────────────────────────────────────────────────────────────── */

export function adaptContext(w: WireContext): AppContext {
  return {
    // **`alcance` no llega, y `usuario` no es un relleno plausible: es el único
    // valor que este servicio puede sostener.** `plataforma` habilita el
    // selector de tenant del navbar, y para eso hace falta `tenantsDisponibles`,
    // que tampoco existe. Declarar `plataforma` pintaría un selector vacío.
    // Pedido en §4 del plan.
    alcance: 'usuario',

    user: {
      id: w.user.id,
      // El cable lo manda partido; el contrato lo pide junto. Los dos datos
      // llegaron, así que componerlo es reformatear y no inventar.
      nombre: `${w.user.first_name} ${w.user.last_name}`.trim(),
      email: w.user.email,
      // `capacidades` y `preferencias.tema` NO se rellenan. El tema es el que
      // más duele y el más barato: `users.theme` existe y el PUT lo escribe,
      // pero `/config/me` no lo devuelve — se guarda y no se puede leer.
    },

    tenant: {
      id: w.tenant.id,
      nombre: w.tenant.name,
      // `etiqueta` es la forma corta para el navbar y el cable no la tiene.
      // Cae al nombre completo: es un FALLBACK visible —se ve largo— y no una
      // etiqueta inventada recortando el nombre, que se vería bien y sería
      // nuestra invención.
      etiqueta: w.tenant.name,
      // `vertical` no llega y no se rellena.
      vertical: '',
    },

    role: {
      id: w.role.id,
      nombre: w.role.name,
      // **`false` es la dirección a prueba de fallo, no un valor plausible.**
      // Con `true` el panel de recomendaciones pintaría APROBAR y RECHAZAR para
      // todos, y «un botón que se aprieta y devuelve 403 es peor que un botón
      // ausente». Con `false` la recomendación se lee sin acción, que es la
      // misma gramática que el contrato ya define para quien no puede decidir.
      puedeAprobar: false,
    },

    tabs: w.tabs.map(adaptTabMeta),

    // El cable manda cadenas sueltas —los últimos doce meses del CALENDARIO,
    // tenga o no materialización—. `etiqueta` es requerida por el contrato.
    //
    // **`grano` se DEDUCE del id, y eso el contrato lo sanciona** explícitamente:
    // «el front lo deduce de la forma del id cuando no llega». La etiqueta NO se
    // deduce: se usa el id crudo. Escribir «JUL 2026» necesita un locale, y
    // `Contexto.locale` es otro campo que el cable no trae —la mitad de F1.13b—;
    // inventarlo sería elegir el idioma del tenant por nuestra cuenta.
    //
    // **`enCurso` sale de `open_period`, y es un renombre, no un cálculo** ·
    // F1.42. El cable declara cuál de los doce está abierto; acá se marca ese y
    // ningún otro. Deducirlo contra `new Date()` sería el bug de las dos zonas
    // horarias: el corte del día es del tenant, no del navegador.
    //
    // **Si `open_period` no llega, NINGUNO se marca**, que es el comportamiento
    // de antes. Es lo que pasa contra el servicio desplegado —el campo es del
    // fork—, y es la respuesta correcta: no sabemos cuál está abierto, así que
    // no afirmamos nada de ninguno. Marcar el primero «porque suele ser el mes
    // en curso» sería adivinar, y se vería bien.
    periodos: w.periods.map((id) => ({
      id,
      etiqueta: id,
      grano: granoDelId(id),
      ...(w.open_period === undefined ? {} : { enCurso: id === w.open_period }),
    })),

    catalogVersion: w.catalog_version,
  }
}

/** El grano a partir de la forma del id · sancionado por el contrato.
 *
 *  `2026-W32` es una semana, `2026-07-15` un día, `2026-07` un mes. El contrato
 *  advierte que deducir del id «es frágil en cuanto aparezca un período con
 *  nombre propio», y tiene razón — pero mientras el cable mande cadenas sueltas
 *  no hay otra fuente, y el selector NECESITA el grano para deshabilitar lo que
 *  una métrica mensual no puede contestar. Desaparece en cuanto el backend
 *  mande el período como objeto · §4 ask 10. */
function granoDelId(id: string): 'dia' | 'semana' | 'mes' {
  if (/^\d{4}-W\d{2}$/.test(id)) return 'semana'
  if (/^\d{4}-\d{2}-\d{2}/.test(id)) return 'dia'
  return 'mes'
}

function adaptTabMeta(t: W['TabMeta']): Tab {
  return {
    id: t.id,
    // `key` es requerida por el contrato y el cable no la tiene. Cae al id:
    // es estable y único, que es para lo que sirve. Un slug del nombre se
    // rompería al renombrar la pestaña.
    key: t.id,
    nombre: t.name,
    pregunta: t.operational_question,
    orden: t.sort_order,
    // `icono` y `chatSugerencias` no llegan y no se rellenan.
  }
}

/* ── Catálogo ─────────────────────────────────────────────────────────────── */

/** Una métrica que no se pudo adaptar, con la razón. **No se descarta en
 *  silencio**: el panel que la referencia tiene que poder decir por qué no se
 *  puede dibujar · §1 principio 6. */
export type RejectedMetric = { id: string; key: string; razon: string }

export type AdaptedCatalog = { metrics: Metric[]; rejected: RejectedMetric[] }

export function adaptCatalog(rows: readonly WireMetric[]): AdaptedCatalog {
  const metrics: Metric[] = []
  const rejected: RejectedMetric[] = []

  for (const m of rows) {
    const forma = FORMAS[m.shape]
    const familia = FAMILIAS[m.family]
    const capa = CAPAS[m.layer]

    // Los tres son enumerados cerrados en el contrato y `string` libre en el
    // cable. Un valor que no está no se sustituye por un default: la métrica no
    // entra y dice por qué.
    const falla =
      forma === undefined
        ? `forma desconocida: «${m.shape}»`
        : // **Ésta es una puerta aparte, y hasta el 2026-09-15 no lo era.** El
          // rechazo salía de que la forma no estuviera en el mapa de nombres, así
          // que «no sé cómo se llama» y «el backend no la materializa» eran la
          // misma línea. Completar el mapa —que es lo que hace que agregar una
          // forma al contrato sin su nombre de cable no compile— habría dejado
          // pasar `distribucion` al catálogo en silencio.
          //
          // Lo agarró `adapt.test.ts`, que afirmaba el rechazo con su razón
          // escrita. La prueba estaba bien y la lectura era mía.
          !MATERIALIZABLES.includes(forma)
          ? `forma que el backend todavía no materializa: «${m.shape}»`
          : familia === undefined
          ? `familia desconocida: «${m.family}»`
          : capa === undefined
            ? `capa desconocida: «${m.layer}»`
            : null

    if (falla !== null || forma === undefined || familia === undefined || capa === undefined) {
      rejected.push({ id: m.id, key: m.key, razon: falla ?? 'desconocida' })
      continue
    }

    metrics.push({
      id: m.id,
      key: m.key,
      nombre: m.name,
      forma,
      familia,
      capa,
      fuente: m.source,
      base: m.base,
      // **`ventana` no llega, y es la mitad de la BASE.** El shell pinta
      // `Base · {base} · {ventana}` en los doce paneles y en los siete estados.
      // Queda VACÍA y no se deriva del período: dos métricas consultadas con el
      // mismo `2026-07` pueden tener ventanas distintas —un total mensual y un
      // promedio móvil de treinta días—, así que no hay de dónde sacarla.
      // Es B1.25, y hasta que llegue la línea sale incompleta.
      ventana: '',
      unidad: m.unit ?? null,
      dimensiones: m.dimensions,
      // El cable manda un CÓDIGO —`HIGHER_IS_BETTER`— y el contrato declara
      // texto que se pinta tal cual. **No se traduce acá**: «MÁS ALTO = MEJOR»
      // es copy de producto y el front no lo escribe. Pasa como vino; si el
      // backend confirma que es código, se redacta del lado de ellos · §4 ask 7.
      direccionSemantica: m.semantic_direction ?? null,
      granoMinimo: GRANOS[m.min_grain] ?? 'dia',
      // `estado` de la MÉTRICA —el gobierno del catálogo, que no es el estado
      // del panel— no llega. `DISPONIBLE` es lo que el servicio implica al
      // devolverla: una métrica que el catálogo sirve está disponible para
      // componer. Lo que decide si hay dato es el payload, y ese sí llega.
      estado: 'DISPONIBLE',
      catalogVersion: m.catalog_version,
    })
  }

  return { metrics, rejected }
}

/* ── Bloques ──────────────────────────────────────────────────────────────── */

/** **Lo que el comodín de `blocked` significa, y NO son las dieciséis.**
 *
 *  Antes salía de `Object.values(FORMAS)`, que daba lo mismo mientras el mapa de
 *  nombres estuviera incompleto —nueve— y dejó de darlo al completarlo. La
 *  coincidencia escondía que son dos preguntas distintas: **cómo se llama cada
 *  forma en el cable** es una tabla de nombres, y **cuáles sabe materializar el
 *  backend** es un hecho sobre su `transform.go`, que tiene nueve casos.
 *
 *  Expandir el `*` a las dieciséis ofrecería formas que ningún payload trae, que
 *  es la misma promesa vacía que un período sin datos. Las siete que faltan
 *  entran con B5.3, junto con los cuerpos de F4.17–F4.19. */
const MATERIALIZABLES: readonly Shape[] = [
  'escalar',
  'escalarConIntervalo',
  'serieTemporal',
  'seriesMultiples',
  'categorica',
  'ranking',
  'tabular',
  'prosa',
  'composicion',
]

/** Un bloque cuyo `type` no es uno de los quince **no entra a la tabla**, y sale
 *  con su razón. Si entrara, `acceptsShape` y `spanInRange` opinarían sobre un
 *  tipo que ningún cuerpo puede dibujar — y el builder lo ofrecería. */
export type AdaptedBlocks = { blocks: Block[]; rejected: RejectedMetric[] }

export function adaptBlocks(rows: readonly WireBlock[]): Block[] {
  return adaptBlocksConRechazo(rows).blocks
}

export function adaptBlocksConRechazo(rows: readonly WireBlock[]): AdaptedBlocks {
  const blocks: Block[] = []
  const rejected: RejectedMetric[] = []
  for (const b of rows) {
    if (!esTipo(b.type)) {
      rejected.push({ id: b.type, key: b.type, razon: `tipo de panel desconocido: «${b.type}»` })
      continue
    }
    blocks.push(unBloque(b, b.type))
  }
  return { blocks, rejected }
}

function unBloque(b: WireBlock, tipo: Block['tipo']): Block {
  return {
    tipo,
    // **`blocked` declara `["*"]`**, un comodín que el contrato no tiene. Se
    // expande a las formas que el backend puede materializar y no a las
    // dieciséis del enumerado: ofrecer una forma que ningún payload trae es la
    // misma promesa vacía que un período sin datos.
    formasAceptadas: b.accepted_shapes.includes('*')
      ? [...MATERIALIZABLES]
      : b.accepted_shapes.flatMap((s) => {
          const forma = FORMAS[s]
          return forma === undefined ? [] : [forma]
        }),
    colSpanMin: b.col_span_min,
    colSpanMax: b.col_span_max,
    rowSpanMin: b.row_span_min,
    rowSpanMax: b.row_span_max,
    // **La misma tabla que los params del panel**, y por eso importa que sea una
    // sola: `validateParams` exige que el param esté en el esquema Y en esta
    // lista. Traducir un lado y no el otro haría que todo saliera desconocido.
    ...(b.layout_params === undefined
      ? {}
      : { paramsDisponibles: b.layout_params.map((n) => PARAMS[n] ?? n) }),
  }
}

/* ── Pestaña con paneles ──────────────────────────────────────────────────── */

export function adaptTab(w: WireTabWithPanels): TabWithPanels {
  return {
    tab: adaptTabMeta(w.tab),
    panels: w.panels.map(adaptPanel),
  }
}

function adaptPanel(p: WirePanel): PanelConfig {
  return {
    id: p.id,
    tipo: p.type as PanelConfig['tipo'],
    metricId: p.metric_id,
    colStart: p.col_start,
    colSpan: p.col_span,
    rowSpan: p.row_span,
    // **Los params se traducen acá** · F1.41. Quien los VALIDA sigue siendo
    // `adaptPanelParams`, que compara contra `PARAM_SCHEMAS` y contra
    // `paramsDisponibles`; lo que cambia es que ahora los dos lados de esa
    // comparación hablan el mismo idioma.
    ...(p.options === undefined ? {} : { opciones: traducirParams(p.options) }),
  }
}

/* ══ Payload · valor · presentación · F1.34 ═══════════════════════════════════
 *
 * Tres diferencias de forma, no de nombre:
 *
 *  1. **El estado va en inglés** · `AVAILABLE` / `DEGRADED` / `BLOCKED` /
 *     `FORBIDDEN` / `ERROR`.
 *  2. **`governance` va ANIDADO** y el contrato lo intersecta en el payload.
 *  3. **El cable NO es una unión discriminada**: `ports.DDPayloadDTO` es un
 *     struct con campos `omitempty`, así que el tipo no impide un `BLOCKED` con
 *     valor ni un `AVAILABLE` sin gobierno. El contrato sí lo impide. **Acá es
 *     donde eso se vuelve a cerrar**, y por eso este adaptador puede fallar: un
 *     payload que no cumple la variante sale como `ERROR` con la razón escrita,
 *     nunca como una variante a medias.
 */

export type WirePayload = W['Payload']

/** Un payload que no se pudo armar. `ERROR` y no `BLOQUEADO`: bloqueado
 *  significa «no hay dato y no puede haberlo», y esto es un dato que llegó mal
 *  — son dos cosas distintas y el usuario tiene que poder distinguirlas. */
function comoError(mensaje: string): NetworkPayload {
  return { estado: 'ERROR', mensaje }
}

export function adaptPayload(w: WirePayload): NetworkPayload {
  switch (w.status) {
    case 'FORBIDDEN':
      return {
        estado: 'SIN_PERMISO',
        // Hoy el servicio manda la constante `"administrator"` escrita en el
        // código, no el rol que decide sobre la métrica. Se pasa tal cual: es
        // lo único que hay, y sustituirlo por algo mejor redactado sería el
        // front inventando a quién pedirle · §4 ask 5.
        solicitarA: w.request_from ?? '',
      }

    case 'BLOCKED':
      return {
        estado: 'BLOQUEADO',
        razon: w.reason ?? '',
        // **`unlocks_with` llega VACÍO en BLOCKED** — el servicio solo lo
        // escribe al derivar DEGRADED. No se inventa un «qué lo desbloquea»:
        // §8 pide estado, razón, qué lo desbloquea y CTA, y prometer un
        // desbloqueo que nadie declaró es peor que no declararlo · B1.25/§4.
        desbloqueaCon: w.unlocks_with ?? '',
      }

    case 'ERROR':
      return comoError(w.message ?? 'El panel no se pudo resolver.')

    case 'AVAILABLE':
    case 'DEGRADED': {
      // Los dos estados con cifra exigen gobierno: §1.3 hace obligatoria la
      // procedencia en toda cifra, y el contrato lo hace imposible de construir
      // sin ella. Si el cable no lo manda, no hay payload válido que armar.
      if (w.governance === undefined) {
        return comoError('El payload trae valor sin procedencia.')
      }
      const valor = adaptValue(w.value)
      if (!valor.ok) return comoError(valor.razon)

      const gobierno = {
        base: w.governance.base,
        capa: (CAPAS[w.governance.layer] ?? 'GOLD') as Layer,
        fuente: w.governance.source,
        frescura: w.governance.freshness,
        catalogVersion: w.governance.catalog_version,
      }
      const presentacion = adaptPresentation(w.presentation)

      if (w.status === 'AVAILABLE') {
        return {
          ...gobierno,
          estado: 'DISPONIBLE',
          valor: valor.valor,
          ...(presentacion === undefined ? {} : { presentacion }),
        }
      }
      return {
        ...gobierno,
        estado: 'DEGRADADO',
        valor: valor.valor,
        // En DEGRADED el servicio SÍ los escribe: los redacta `isDegraded` al
        // derivar el estado por frescura.
        razon: w.reason ?? '',
        desbloqueaCon: w.unlocks_with ?? '',
        ...(presentacion === undefined ? {} : { presentacion }),
      }
    }

    default:
      // Un estado que no está en las cinco constantes de Go. El cable lo declara
      // como enum pero es una cadena en runtime, así que esto puede pasar.
      return comoError(`Estado desconocido: «${String(w.status)}».`)
  }
}

/* ── El valor · nueve formas ──────────────────────────────────────────────── */

type ValorOk = { ok: true; valor: Value }
type ValorMal = { ok: false; razon: string }

const objeto = (v: unknown): Record<string, unknown> | null =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null

const cadena = (o: Record<string, unknown>, k: string): string | null =>
  typeof o[k] === 'string' ? (o[k] as string) : null

const numero = (o: Record<string, unknown>, k: string): number | null =>
  typeof o[k] === 'number' && Number.isFinite(o[k]) ? (o[k] as number) : null

const lista = (o: Record<string, unknown>, k: string): Record<string, unknown>[] | null => {
  if (!Array.isArray(o[k])) return null
  const out: Record<string, unknown>[] = []
  for (const x of o[k] as unknown[]) {
    const fila = objeto(x)
    if (fila !== null) out.push(fila)
  }
  return out
}

/** Puntos `{t, v}` · los dos son iguales de los dos lados. */
function puntos(filas: Record<string, unknown>[]): { t: string; v: number }[] {
  return filas.flatMap((p) => {
    const t = cadena(p, 't')
    const v = numero(p, 'v')
    return t === null || v === null ? [] : [{ t, v }]
  })
}

export function adaptValue(raw: unknown): ValorOk | ValorMal {
  const v = objeto(raw)
  if (v === null) return { ok: false, razon: 'El payload no trae valor.' }

  const shape = cadena(v, 'shape')
  if (shape === null) return { ok: false, razon: 'El valor no declara su forma.' }

  switch (shape) {
    case 'scalar': {
      const n = numero(v, 'v')
      return n === null
        ? { ok: false, razon: 'Un escalar sin cifra.' }
        : { ok: true, valor: { forma: 'escalar', v: n } }
    }

    case 'scalar_with_interval': {
      const n = numero(v, 'v')
      const lo = numero(v, 'lo')
      const hi = numero(v, 'hi')
      const nivel = numero(v, 'level')
      // **Regla dura 6: prohibida la estimación puntual sin intervalo.** El
      // contrato hace `lo`, `hi` y `nivel` obligatorios justamente para que un
      // pronóstico sin banda no se pueda construir. No se inventa una banda.
      return n === null || lo === null || hi === null || nivel === null
        ? { ok: false, razon: 'Un pronóstico sin banda no se publica.' }
        : { ok: true, valor: { forma: 'escalarConIntervalo', v: n, lo, hi, nivel } }
    }

    case 'time_series': {
      const ps = lista(v, 'points')
      return ps === null
        ? { ok: false, razon: 'Una serie sin puntos.' }
        : { ok: true, valor: { forma: 'serieTemporal', puntos: puntos(ps) } }
    }

    case 'multi_series': {
      const ss = lista(v, 'series')
      if (ss === null) return { ok: false, razon: 'Un multiserie sin series.' }
      const series = ss.flatMap((s) => {
        const etiqueta = cadena(s, 'label')
        const ps = lista(s, 'points')
        return etiqueta === null || ps === null ? [] : [{ etiqueta, puntos: puntos(ps) }]
      })
      return { ok: true, valor: { forma: 'seriesMultiples', series } }
    }

    case 'categorical': {
      const items = lista(v, 'items')
      if (items === null) return { ok: false, razon: 'Una categórica sin ítems.' }
      return {
        ok: true,
        valor: {
          forma: 'categorica',
          items: items.flatMap((i) => {
            const etiqueta = cadena(i, 'label')
            const n = numero(i, 'v')
            return etiqueta === null || n === null ? [] : [{ etiqueta, v: n }]
          }),
        },
      }
    }

    case 'ranking': {
      const items = lista(v, 'items')
      if (items === null) return { ok: false, razon: 'Un ranking sin ítems.' }
      return {
        ok: true,
        valor: {
          forma: 'ranking',
          items: items.flatMap((i, idx) => {
            const etiqueta = cadena(i, 'label')
            const n = numero(i, 'v')
            // `position` es obligatorio del lado del contrato y el
            // transformador de Go siempre lo escribe; el índice es el respaldo
            // y conserva el ORDEN que mandó el backend, que es el que importa.
            const posicion = numero(i, 'position') ?? idx + 1
            return etiqueta === null || n === null ? [] : [{ etiqueta, v: n, posicion }]
          }),
        },
      }
    }

    case 'tabular': {
      const cols = lista(v, 'columns')
      const filas = lista(v, 'rows')
      if (cols === null || filas === null) return { ok: false, razon: 'Una tabla sin forma.' }
      return {
        ok: true,
        valor: {
          forma: 'tabular',
          // `decimales` y `unidad` por columna NO llegan. Sin `decimales` una
          // columna de ROAS sale «4.2 · 4.5 · 3.5 · 3»: cada celda está bien y
          // la columna se lee mal · §4 ask 14. No se deducen del dato.
          columnas: cols.flatMap((c) => {
            const clave = cadena(c, 'key')
            const titulo = cadena(c, 'title')
            return clave === null || titulo === null
              ? []
              : [{ clave, titulo, numerica: c['numeric'] === true }]
          }),
          // Las celdas del cable son `any` de Go. El contrato admite cadena,
          // número o nulo — cualquier otra cosa (un objeto anidado, un booleano)
          // se descarta en su celda y no rompe la fila entera.
          filas: filas.map((f) => {
            const out: Record<string, string | number | null> = {}
            for (const [k, celda] of Object.entries(f)) {
              if (celda === null || typeof celda === 'string' || typeof celda === 'number') {
                out[k] = celda
              }
            }
            return out
          }),
        },
      }
    }

    case 'prose': {
      const titular = cadena(v, 'headline')
      if (titular === null) return { ok: false, razon: 'Una prosa sin titular.' }
      // `pillars` se omite cuando no hay ninguno: el transformador solo lo
      // escribe con `len > 0`. Un arreglo vacío es una prosa legítima de solo
      // titular, así que acá no es un error.
      const ps = lista(v, 'pillars') ?? []
      return {
        ok: true,
        valor: {
          forma: 'prosa',
          titular,
          pilares: ps.flatMap((p) => {
            const label = cadena(p, 'label')
            // `value` del cable, `valor` del contrato. Ya viene formateado, y es
            // el único lugar donde eso es correcto: el pilar cita una cifra que
            // el titular ya nombra, y reformatearla las haría decir distinto.
            const valor = cadena(p, 'value')
            const nota = cadena(p, 'note')
            return label === null || valor === null
              ? []
              : [{ label, valor, ...(nota === null ? {} : { nota }) }]
          }),
        },
      }
    }

    case 'composition': {
      const parts = lista(v, 'parts')
      if (parts === null) return { ok: false, razon: 'Una composición sin partes.' }
      const partes: { etiqueta: string; v: number; porcentaje: number }[] = []
      for (const p of parts) {
        const etiqueta = cadena(p, 'label')
        const n = numero(p, 'v')
        const porcentaje = numero(p, 'percentage')
        if (etiqueta === null || n === null) continue
        // **El porcentaje NO se deriva.** El contrato dice por qué con todas las
        // letras: «lo calcula el backend y no el front: la suma tiene que dar
        // 100 y redondear en el cliente produce columnas que suman 99,9». En el
        // cable es opcional —solo sale si venía en la fila—, así que su ausencia
        // rompe la composición entera en vez de producir una que casi suma.
        if (porcentaje === null) {
          return { ok: false, razon: `La composición no declara el porcentaje de «${etiqueta}».` }
        }
        partes.push({ etiqueta, v: n, porcentaje })
      }
      return { ok: true, valor: { forma: 'composicion', partes } }
    }

    case 'distribution': {
      // **El backend SÍ la emite, desde `168a761` (2026-09-21).** Acá caía en el
      // `default` con un comentario que decía lo contrario, y ese comentario era
      // la razón por la que nadie la miraba: una métrica de esta forma salía
      // «forma desconocida» y el panel quedaba rechazado.
      //
      // El comentario se escribió cuando era cierto y envejeció sin aviso. Lo
      // destapó el equipo de backend contestando un mensaje nuestro que decía,
      // con la misma seguridad, que ellos no la producían · 2026-09-25.
      const bins = lista(v, 'bins')
      if (bins === null) return { ok: false, razon: 'Una distribución sin cortes.' }
      const cortes: { etiqueta: string; v: number }[] = []
      for (const b of bins) {
        const etiqueta = cadena(b, 'label')
        const n = numero(b, 'v')
        if (etiqueta === null || n === null) continue
        cortes.push({ etiqueta, v: n })
      }
      // `lo` y `hi` del bin llegan opcionales y **no se adaptan**: el contrato
      // interno declara `cortes` con `etiqueta` y `v`, nada más. Traerlos sin que
      // el contrato los declare sería inventar una forma.
      if (cortes.length === 0) return { ok: false, razon: 'Una distribución sin cortes válidos.' }
      return { ok: true, valor: { forma: 'distribucion', cortes } }
    }

    default:
      // Lo que queda acá son las formas que el contrato **no declara**:
      // `compared_categorical`, `multi_attribute_profile`, `matrix`, `graph` y
      // `flow`. El backend las emite desde `168a761`; lo que falta es de este
      // lado —esquema en `Valor` y cuerpo—, y son F4.17–F4.19, que siguen
      // bloqueadas con esa razón escrita y verificada el 2026-09-25.
      //
      // **`series_with_band` también cae acá, y por una razón distinta**: el
      // contrato declara `nivel` obligatorio en `ValorSerieConBanda` y el cable
      // no lo manda. Una banda sin su nivel de confianza no se puede leer —80%
      // y 95% son afirmaciones distintas—, así que adaptarla hoy sería inventar
      // el número. Está preguntado en
      // `docs/RESPUESTA-2026-09-25-dos-formas.md` §3, y ellos ya ofrecieron
      // agregarlo.
      return { ok: false, razon: `Forma desconocida: «${shape}».` }
  }
}

/* ── Presentación ─────────────────────────────────────────────────────────── */

/** **Solo llega para `scalar` y `scalar_with_interval`.**
 *  `PresentationFromRows` devuelve `nil` para las otras siete formas, así que un
 *  panel de barras o de tabla no trae rótulo — y «ningún número desnudo» es
 *  regla dura. Es §4 ask 13; acá no se compensa inventando uno. */
function adaptPresentation(raw: unknown): Presentation | undefined {
  const p = objeto(raw)
  if (p === null) return undefined

  const label = cadena(p, 'label')

  const m = objeto(p['meter'])
  const medidorLabel = m === null ? null : cadena(m, 'label')
  const porcentaje = m === null ? null : numero(m, 'percentage')
  const medidorNota = m === null ? null : cadena(m, 'note')

  const comparativo = (lista(p, 'comparative') ?? [])
    .flatMap((c) => {
      const l = cadena(c, 'label')
      const delta = numero(c, 'delta')
      // `unidad` no llega en el comparativo del cable. Queda ausente: el signo
      // comunica la dirección y el color no —regla dura 3—, así que un
      // comparativo sin unidad se lee igual.
      return l === null || delta === null ? [] : [{ label: l, delta }]
    })

  const out: Presentation = {
    ...(label === null ? {} : { label }),
    ...(medidorLabel === null || porcentaje === null
      ? {}
      : {
          medidor: {
            label: medidorLabel,
            porcentaje,
            ...(medidorNota === null ? {} : { nota: medidorNota }),
          },
        }),
    ...(comparativo.length === 0 ? {} : { comparativo }),
    // `nota` al pie tampoco llega · §4 ask 13.
  }

  return Object.keys(out).length === 0 ? undefined : out
}

/* ── F3.7 · los hilos del chat ─────────────────────────────────────────────── */

export type WireChatThread = W['ChatThread']
export type WireChatSuggestion = W['ChatSuggestion']

/** Un hilo del cable a `HiloResumen`.
 *
 *  **Los dos ids se conservan por separado y con nombres distintos**, que es
 *  toda la gracia: `id` es el uuid con el que se piden los mensajes del hilo y
 *  `hiloId` es el entero con el que se continúa la conversación. Fundirlos en
 *  uno daría un 400 la mitad de las veces y un 404 la otra.
 *
 *  **`titulo` sale de `first_message_preview`**, que es la primera pregunta tal
 *  como se escribió — exactamente lo que el contrato pide para el riel: «no se
 *  resume ni se recorta acá». `thread_name` no sirve: es el nombre del hilo del
 *  lado del agente, no lo que el usuario preguntó.
 *
 *  **Lo que el cable NO trae queda ausente, y hay una prueba que lo atestigua:**
 *  `esDecision` y `decisionId` son de C4 —`/config/decisiones`, que no existe—,
 *  así que `esDecision` cae a `false`. **Es el valor a prueba de fallo, no uno
 *  plausible**: marcar un hilo como decisión sin serlo lo volvería imborrable
 *  en una pantalla que todavía no existe.
 */
export function adaptThread(w: WireChatThread): ThreadSummary {
  // El cable manda cadena vacía donde no hay dato —`omitempty` sobre `string`—
  // y el contrato declara `null`. Traducir uno al otro es el trabajo de acá:
  // una cadena vacía se pinta como un rótulo sin texto.
  const texto = (v: string | undefined): string | null => (v == null || v === '' ? null : v)

  return {
    id: w.id,
    titulo: w.first_message_preview,
    creadoEn: w.created_at,
    actualizadoEn: w.updated_at,
    esDecision: false,
    hiloId: String(w.thread_id),
    panelId: w.panel_id ?? null,
    periodo: texto(w.period),
    metricaNombre: texto(w.metric_name),
    metricKey: texto(w.metric_key),
    pestanaNombre: texto(w.tab_name),
  }
}

/** Una pregunta sugerida del cable a su texto.
 *
 *  **`intent` se descarta, y hay una prueba que lo atestigua.** §PEN:C3 dibuja
 *  las sugeridas como chips con su texto y nada más; conservar un campo que
 *  ninguna pantalla lee es exactamente cómo `BodyProps.presentation` estuvo
 *  meses declarada sin un solo consumidor. El día que una pantalla lo necesite,
 *  la prueba dice dónde estaba.
 *
 *  **El texto llega ya redactado en español** —«¿Por qué Ventas está en USD
 *  4.28M en septiembre?»— así que acá no se compone nada: el front no escribe
 *  copy de producto. */
export function adaptSuggestion(w: W['ChatSuggestion']): string {
  return w.question
}
