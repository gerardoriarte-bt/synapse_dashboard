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
  Plot,
  Presentation,
  Shape,
  Tab,
  TabWithPanels,
  ThreadSummary,
  ChatAgent,
  Value,
} from './types'

type W = wire['schemas']

export type WireContext = W['ContextResponse']
export type WireMetric = W['CatalogMetric']
export type WireBlock = W['BlockRule']
export type WirePlot = W['PlotRule']
export type WireTabWithPanels = W['TabWithPanels']
export type WirePanel = W['PanelDTO']

/* ── Los enumerados que cambian de idioma ─────────────────────────────────────
 *
 * Tablas explícitas y no un `toLowerCase()` con guiones: `scalar_with_interval`
 * no se convierte en `escalarConIntervalo` con ninguna regla mecánica, y una
 * regla que funciona para ocho casos y falla en el noveno es peor que nueve
 * líneas escritas.
 */

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
    // ── **`scope` LLEGÓ** · B1.1, medido el 2026-09-28 ──────────────────────
    //
    // Acá decía `'usuario'` fijo con su razón: «declarar `plataforma` pintaría
    // un selector vacío». Esa razón venció — el cable trae `kind` y la lista.
    //
    // **`multi_tenant` es lo que el contrato llama `plataforma`**, y la
    // traducción es del adaptador: son los dos nombres de lo mismo y el contrato
    // no adopta la grafía del cable.
    alcance: w.scope.kind === 'multi_tenant' ? 'plataforma' : 'usuario',
    // **Sólo cuando hay más de uno.** Con un tenant el selector no tiene qué
    // ofrecer, y es la misma regla que el selector de dashboard de F5.1: un
    // control que no ofrece una elección es ruido.
    ...(w.scope.tenants.length > 1
      ? {
          // **`label` y no `name`** · corregido el 2026-09-28. El selector de
          // cliente vive en el navbar, que es exactamente para lo que la forma
          // corta existe, y acá se leía el nombre largo mientras la cabecera de
          // al lado ya leía el corto. **Se vio abriendo la aplicación**: la
          // consola decía «UA México» arriba y «UNDER ARMOUR MÉXICO» en el
          // selector, dos nombres para el mismo cliente en la misma barra.
          tenantsDisponibles: w.scope.tenants.map((x) => ({ id: x.id, etiqueta: x.label })),
        }
      : {}),

    user: {
      id: w.user.id,
      // El cable lo manda partido; el contrato lo pide junto. Los dos datos
      // llegaron, así que componerlo es reformatear y no inventar.
      nombre: `${w.user.first_name} ${w.user.last_name}`.trim(),
      email: w.user.email,
      // `capacidades` NO se rellena.
      //
      // ── **`preferencias.tema` SÍ, desde el 2026-10-02** ──────────────────
      //
      // Acá decía que no se rellenaba «porque nadie lo consumiría», y era
      // cierto cuando se escribió: `applyTheme` sólo se llamaba desde
      // `ThemeOptions`, al apretar. **Ya hay tres consumidores** —las tres
      // superficies, por `useTemaGuardado`— así que el campo deja de ser un
      // hueco y pasa a ser el que decide con qué tema abre la aplicación.
      //
      // **Y hasta hoy el tema guardado NO SE APLICABA EN NINGUNA PARTE.**
      // `ConsoleContainer` tenía el efecto desde F1.12 y leía este campo, que
      // siempre valía `undefined`: el efecto corría y no hacía nada. Elegir
      // claro, recargar, y volver a oscuro. El propio comentario de arriba lo
      // predijo —«lo que falta es una línea en la superficie y su prueba»— y
      // la línea estaba; lo que faltaba era el dato.
      ...(w.user.theme === undefined ? {} : { preferencias: { tema: w.user.theme } }),
    },

    tenant: {
      id: w.tenant.id,
      nombre: w.tenant.name,
      // `etiqueta` es la forma corta para el navbar y el cable no la tiene.
      // Cae al nombre completo: es un FALLBACK visible —se ve largo— y no una
      // etiqueta inventada recortando el nombre, que se vería bien y sería
      // **LLEGÓ el 2026-09-28** · B1.1. Acá caía a `name`, que es lo que hacía
      // que el navbar dijera `Under Armour México` donde el `.pen` pinta
      // `UA MX`. **No se hace el fallback acá**: el servicio ya lo hace —«si el
      // tenant no la define, `label` es `name`»— y repetirlo sería un segundo
      // lugar donde esa regla vive.
      etiqueta: w.tenant.label,
      // `vertical` no llega y no se rellena.
      vertical: '',
      // ── LOS TRES DE F1.13b · desde `8633b10` · 2026-09-26 ────────────────
      //
      // **Es un renombre, no un cálculo**, igual que el resto del adaptador. Y
      // los tres son `string` sin `omitempty` del lado del servicio: vienen
      // siempre, vacíos si el tenant no los tiene cargados.
      //
      // **El valor de hoy es el default de la migración**: «Under Armour
      // México» trae `es-CO`, `COP` y `America/Bogota`. Eso se carga con
      // `PUT /admin/tenants/{tenantId}` y no es cosa del adaptador — si acá se
      // «corrigiera» a `es-MX` estaríamos escribiendo un dato que nadie midió.
      locale: w.tenant.locale,
      moneda: w.tenant.currency,
      zonaHoraria: w.tenant.timezone,
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

    // ── MULTI-DASHBOARD · F5.1 · renombre, no cálculo ──────────────────────
    //
    // `is_default` → `esDefault` y `active_*_id` → `*ActivoId`. **`?? null` en
    // los dos ids**: el cable los declara `null` cuando el dashboard activo no
    // tiene layout, y eso es un estado, no una ausencia.
    dashboards: (w.dashboards ?? []).map((d) => ({
      id: d.id,
      nombre: d.name,
      esDefault: d.is_default,
    })),
    dashboardActivoId: w.active_dashboard_id ?? null,
    layoutActivoId: w.active_layout_id ?? null,

    // **`?? []` y no un `!`** · F5.1. El cable puede mandar `tabs: null` cuando
    // el dashboard activo no tiene layout publicado, medido el 2026-09-26. Sin
    // esto el adaptador tira y la superficie dice «no se pudo cargar tu
    // contexto · sin detalle del servidor» — atribuyendo al servicio un fallo
    // nuestro.
    //
    // **Vacío no es lo mismo que «sin layout», y por eso viaja `layoutActivoId`
    // aparte**: cero pestañas puede ser un rol que no ve ninguna. Quien tiene
    // que distinguirlos es la superficie, y no puede si acá se colapsan.
    tabs: (w.tabs ?? []).map(adaptTabMeta),

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
    // ── **`periods_detail` LLEGÓ** · B1.1, medido el 2026-09-28 ─────────────
    //
    // `periods` sigue siendo la fuente del ORDEN y de qué períodos hay; el
    // detalle se busca por clave y **no se asume que venga para todos**: si
    // falta, se cae a lo de antes en vez de descartar el período.
    //
    // ── **SIN REPETIDOS, Y NO ES UNA PRECAUCIÓN** · medido el 2026-09-29 ────
    //
    // El cable manda **doce entradas que no son doce meses distintos**. Medido
    // contra `de881e1` ese día: `['2026-09', … , '2026-04', '2026-03',
    // '2026-03', '2026-01', …]` — marzo dos veces y **febrero no está**, en
    // `periods` y en `periods_detail`.
    //
    // Es `availablePeriods()` de su `dd_config_service.go`, que resta meses con
    // `now.AddDate(0, -i, 0)` **sin normalizar al día 1**: el 29 de septiembre
    // menos siete meses cae en «29 de febrero», que no existe, y Go desborda al
    // 1 de marzo. Reproducido con su misma aritmética: pasa **29 días de los
    // 365**, los 29/30/31 de un mes cuyo mes objetivo es más corto. Los otros
    // 336 la lista sale bien, y por eso nunca se había visto. El arreglo es de
    // ellos y ya existe escrito en su propio `snowflake/period.go:66`, que sí
    // normaliza — está pedido.
    //
    // **Acá se deduplica porque `id` es una CLAVE, no un dato.** Atraviesa el
    // batch, la caché, el payload y el hilo del chat, y la superficie busca el
    // activo con `periodos.find(p => p.id === activeId)`: dos entradas con el
    // mismo id son la misma, por construcción. No es calcular ni inventar —las
    // dos entradas son idénticas campo por campo, rango incluido—, y dejarlas
    // pasar pinta dos veces «2026-03» con la misma `key` de React.
    //
    // **Lo que NO se hace es rellenar el mes que falta.** Febrero no está y el
    // front no lo puede agregar: no sabe si el servicio no lo tiene o no lo
    // quiere dar, y ofrecer un período que el batch va a rechazar es peor que
    // no ofrecerlo. Se pierde un mes hasta que ellos normalicen.
    periodos: [...new Set(w.periods)].map((id) => {
      const det = (w.periods_detail ?? []).find((d) => d.key === id)
      return {
        id,
        etiqueta: id,
        // **El grano DECLARADO le gana al deducido del id.** `granoDelId` existe
        // porque no había otra fuente, y el contrato ya advertía que deducirlo
        // «es frágil en cuanto aparezca un período con nombre propio». Ahora hay
        // fuente; el deducido queda de respaldo.
        grano: det === undefined ? granoDelId(id) : adaptGrano(det.grain),
        // **El rango va como lo manda el cable, sin formatear.** Quien lo pinta
        // tiene el formateador del tenant; redactarlo acá sería el adaptador
        // escribiendo copy, y además con el locale equivocado.
        ...(det === undefined ? {} : { rango: { desde: det.start, hasta: det.end } }),
        ...(w.open_period === undefined ? {} : { enCurso: id === w.open_period }),
      }
    }),

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
/** El grano DECLARADO, del cable al contrato · 2026-09-28
 *
 *  Dos vocabularios para lo mismo: el cable dice `month`/`week` y el contrato
 *  `mes`/`semana`. **Es el adaptador quien traduce**, que es exactamente su
 *  trabajo — renombrar sin calcular.
 *
 *  **El cable no declara `day` y el contrato sí `dia`**, así que un grano diario
 *  sólo puede llegar por el id. No se inventa una rama para un valor que nadie
 *  emite: el `switch` cubre lo que el cable declara y nada más. */
function adaptGrano(g: 'month' | 'week'): 'semana' | 'mes' {
  return g === 'week' ? 'semana' : 'mes'
}

function granoDelId(id: string): 'dia' | 'semana' | 'mes' {
  if (/^\d{4}-W\d{2}$/.test(id)) return 'semana'
  if (/^\d{4}-\d{2}-\d{2}/.test(id)) return 'dia'
  return 'mes'
}

function adaptTabMeta(t: W['TabMeta']): Tab {
  return {
    id: t.id,
    // ── **LA `key` LLEGÓ** · 2026-09-28, medida: la sembrada trae `overview` ──
    //
    // Acá caía al `id` con su razón —«es estable y único»— y esa razón era
    // falsa a medias: el id es estable dentro de una VERSIÓN y se recrea en la
    // siguiente. Lo levantó el backend: `roles.tab_ids` guarda ids de fila, así
    // que la primera publicación real dejaba sin pestañas a todo rol con
    // restricción.
    //
    // **Sin fallback al id**: si el campo faltara, caer al id devolvería el
    // defecto que esto arregla, y en silencio.
    key: t.key,
    nombre: t.name,
    pregunta: t.operational_question,
    orden: t.sort_order,
    // ── **LLEGARON el 2026-09-28** · B4.4, medido contra `5924bf2b` ──────────
    //
    // Estuvieron pedidos desde el 2026-09-15, cuando F4.8 construyó el editor:
    // el builder los escribía y la consola no los recibía.
    //
    // **El icono vacío se omite en vez de pasarse como `''`.** El contrato lo
    // declara opcional, y un `icono: ''` obliga a cada consumidor a distinguir
    // «sin icono» de «icono vacío» — que es la misma cadena y no significan lo
    // mismo. Ausente ya dice «no hay».
    ...(t.icon === '' ? {} : { icono: t.icon }),
    // **La lista vacía SÍ se pasa**, y la asimetría es a propósito: el servicio
    // la emite siempre como lista, así que `[]` es «no hay sugerencias» y no
    // «no sé». Omitirla obligaría a un `?? []` en cada consumidor.
    chatSugerencias: t.chat_suggestions,
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
          !DIBUJABLES.includes(forma)
          ? `forma que el front todavía no dibuja: «${m.shape}»`
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
      // **`ventana` YA LLEGA · B1.25, desde `8633b10`, medido el 2026-09-26.**
      // Acá había cinco líneas explicando que el cable no la traía y que no se
      // podía derivar del período. Lo segundo sigue siendo cierto y es por eso
      // que se lee y no se calcula: dos métricas consultadas con el mismo
      // `2026-07` pueden tener ventanas distintas —un total mensual y un
      // promedio móvil de treinta días—.
      //
      // Es un renombre, que es lo que el criterio de B1.25 pide: «el front lo
      // consume por el adaptador de F1.33 sin lógica nueva».
      //
      // **Vacío para las métricas que Snowflake no tiene** —8 de 18 el
      // 2026-09-26, las de la semilla—, y vacío se lee como ausente.
      ventana: m.measurement_window,
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

/** **Las formas que este front puede DIBUJAR**, que es lo que la puerta del
 *  catálogo y el comodín de `blocked` necesitan saber.
 *
 *  ── SE LLAMABA `MATERIALIZABLES`, Y EL NOMBRE ERA EL PROBLEMA · 2026-09-25 ──
 *
 *  Decía «cuáles sabe materializar el backend · su `transform.go` tiene nueve
 *  casos», y **dejó de ser cierto el 2026-09-21**: `168a761` lo llevó a quince.
 *  Cuatro días después el nombre seguía justificando la lista, así que agregar
 *  `distribucion` y `serieConBanda` al adaptador de VALORES no alcanzó — las
 *  métricas seguían rechazándose acá, en la puerta del catálogo, y el panel
 *  decía «forma que el backend todavía no materializa» sobre una que sí.
 *
 *  **Lo encontró abrir el modo mock**, después de agregarles un panel: la
 *  pantalla lo dijo con todas las letras. Ninguna prueba lo vio, porque las
 *  pruebas afirmaban el rechazo con esa misma razón escrita.
 *
 *  Con el nombre correcto la lista se lee sola: una forma se dibuja cuando el
 *  backend la emite **y** nuestro contrato declara su esquema **y** hay un
 *  cuerpo. Las cinco que faltan cumplen la primera y no las otras dos — son
 *  F4.17–F4.19, y su candado dice exactamente eso.
 *
 *  Expandir el `*` a las dieciséis ofrecería formas que ningún cuerpo puede
 *  pintar, que es la misma promesa vacía que un período sin datos. */
const DIBUJABLES: readonly Shape[] = [
  'escalar',
  'escalarConIntervalo',
  'serieTemporal',
  'seriesMultiples',
  'categorica',
  'ranking',
  'tabular',
  'prosa',
  'composicion',
  // Las dos del 2026-09-25 · el backend las emite desde `168a761`, el contrato
  // declara su esquema y `DistributionBody` y `ForecastBody` existen.
  'distribucion',
  'serieConBanda',
  // **Las tres del 2026-09-30**, y las tres condiciones se cumplen a la vez por
  // primera vez para las formas v1.1: el backend las materializa —con las
  // entradas de `MetricRegistry` que escribimos y corrimos contra Snowflake—, el
  // contrato declara su esquema desde el 2026-09-26, y `ComparisonBody`,
  // `MatrixBody` y `GraphBody` existen.
  //
  // **Las otras dos siguen afuera y no es simetría pendiente:**
  // `perfilMultiatributo` tiene un solo gráfico en el repertorio —`radar`— y no
  // está construido; `grafo` no tiene ni gráfico ni dato del cual salir. Una
  // forma acá sin cuerpo que la dibuje es un panel en blanco sin razón.
  'categoricaComparada',
  'matriz',
  'flujo',
]

/** Un bloque cuyo `type` no es uno de los quince **no entra a la tabla**, y sale
 *  con su razón. Si entrara, `acceptsShape` y `spanInRange` opinarían sobre un
 *  tipo que ningún cuerpo puede dibujar — y el builder lo ofrecería. */
export type AdaptedBlocks = { blocks: Block[]; rejected: RejectedMetric[] }

/** El repertorio · `GET /config/plots`, la ruta que escribimos el 2026-09-29.
 *
 *  **Renombra y traduce formas; no calcula y no redacta.** `razon` y la del
 *  `tope` son copy de producto que viene del repertorio y se pinta tal cual.
 *
 *  **Una forma que este contrato no conoce descarta el gráfico entero**, y no
 *  sólo esa forma: un `treemap` al que le faltara `composicion` se vería
 *  correcto aceptando una forma menos, que es la clase de error que no falla.
 *  Descartarlo lo hace visible — el id cae en `UnknownPlotState`, que lo nombra. */
export function adaptPlots(rows: readonly WirePlot[]): Plot[] {
  const out: Plot[] = []
  for (const p of rows) {
    const formas = p.shapes.map((f) => FORMAS[f])
    if (formas.some((f) => f === undefined)) continue
    out.push({
      id: p.id as Plot['id'],
      nombre: p.name,
      formas: formas as Shape[],
      soportaBanda: p.supports_band,
      // **`minimums` nunca llega `null`** —el servicio lo normaliza, medido el
      // 2026-09-29—, pero el `?? []` queda: el día que alguien sirva la tabla
      // desde otro lado, una lista ausente no puede leerse como «sin mínimo».
      minimos: (p.minimums ?? []).flatMap((m) => {
        const forma = FORMAS[m.shape]
        return forma === undefined ? [] : [{ forma, cuando: m.when, razon: m.reason }]
      }),
      ...(p.cap === undefined || p.cap === null
        ? {}
        : { tope: { cuando: p.cap.when, razon: p.cap.reason } }),
    })
  }
  return out
}

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
      ? [...DIBUJABLES]
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
    // ── **`chart` → `grafico`** · llegó el 2026-09-28, medido en los doce ────
    //
    // **El cable lo manda como `string` libre y acá se cierra**, que es lo mismo
    // que se hace con `shape`, `family` y `layer`. Ellos lo dicen explícito: «no
    // validamos contra el repertorio, eso es del front, que tiene los 49».
    //
    // **Vacío se omite**: es el gráfico por defecto del cuerpo, y pasarlo como
    // `''` obligaría a cada cuerpo a distinguirlo de «no declarado».
    //
    // **Y un id desconocido se PASA igual, no se descarta.** Es la decisión que
    // importa: descartarlo acá haría que el panel cayera al de por defecto en
    // silencio —una cascada dibujada como dona—, y lo que el producto decidió es
    // que el panel lo declare. El cuerpo tiene `UnknownPlotState` para eso.
    ...(p.chart === '' ? {} : { grafico: p.chart as NonNullable<PanelConfig['grafico']> }),
    // **La nota de lectura** · B1.13, llegó el 2026-09-28 · medida.
    //
    // **Vacía se OMITE**, igual que el icono de la pestaña: una nota de cadena
    // vacía obliga a cada consumidor a distinguirla de «no hay», y no es lo
    // mismo. Ausente ya lo dice, y el cuerpo no pinta un renglón en blanco.
    ...(p.note === '' ? {} : { nota: p.note }),
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
        // Hoy el servicio manda la constante `"admin"` escrita en el código,
        // no el rol que decide sobre la métrica. Se pasa tal cual: es lo único
        // que hay, y sustituirlo por algo mejor redactado sería el front
        // inventando a quién pedirle · §4 ask 5.
        //
        // **Acá decía `"administrator"`, y no se había inventado: se venció.**
        // Ellos lo cambiaron a `"admin"` y nos lo avisaron por escrito el
        // 2026-09-25 · §B1.6 de `docs/RESPUESTA-2026-09-25-para-backend.md`. El
        // aviso se guardó en prosa y no bajó ni acá ni al cable.
        //
        // Medido el 2026-09-28 con el token de `planner`: los tres paneles que
        // su rol oculta contestan `request_from: "admin"`. Es un literal y no un
        // rol resuelto — un tenant cuyo rol de administración se llame distinto
        // recibe `admin` igual.
        solicitarA: w.request_from ?? '',
        // **Las dos frases las escribe el SERVICIO, no nosotros** · llegaron en
        // `de881e1`. Hasta el 2026-09-29 `ForbiddenState` pintaba una frase
        // nuestra escrita a mano —«Esta métrica no está disponible para tu
        // rol»—, que es exactamente lo que la regla del adaptador prohíbe: el
        // dueño del texto que describe datos es quien los emite.
        //
        // **Se pidieron, llegaron, y estuvimos un día sin usarlas.** El campo
        // llega y el front sigue pintando lo suyo es un modo de falla que no
        // avisa: la pantalla se ve bien.
        razon: w.reason ?? '',
        desbloqueaCon: w.unlocks_with ?? '',
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

export type ValorOk = { ok: true; valor: Value }
export type ValorMal = { ok: false; razon: string }

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

/** Días desde epoch en una cadena · `"20727"`, y nada más que dígitos. */
const DIAS_EPOCH = /^\d{1,6}$/
const MS_POR_DIA = 86_400_000

/** `t` a ISO cuando llega como días desde epoch · 2026-10-06.
 *
 *  **La interpretación la declara el backend, no nosotros.** El contrato midió
 *  el 2026-09-29 que `t` llegaba como `"20362"` y se negó a interpretarlo porque
 *  el cable no lo decía. `c8b9247` lo dice en su mensaje —«la SQL API devuelve
 *  DATE como días desde epoch; `formatDateLabel` convierte a ISO»— y desde ahí
 *  manda `"2026-09-01"`.
 *
 *  **Pero las filas ya materializadas conservan el número** hasta que su período
 *  se rematerialice: medido en QA el 2026-10-06, `daily_trend` y
 *  `media_efficiency_12m` seguían en `"20727"`. Con un eje X que ahora sí se
 *  pinta, eso es «20727» en pantalla. Esto hace del lado de acá la misma
 *  conversión que el servicio hace del suyo: reformatea, no calcula, y una `t`
 *  que ya es ISO o que es una etiqueta —`'jul'`— pasa tal cual. */
function tIso(t: string): string {
  if (!DIAS_EPOCH.test(t)) return t
  return new Date(Number(t) * MS_POR_DIA).toISOString().slice(0, 10)
}

/** Puntos `{t, v}` · los dos son iguales de los dos lados, salvo el formato de
 *  `t` cuando viene de una fila vieja · ver `tIso`. */
function puntos(filas: Record<string, unknown>[]): { t: string; v: number }[] {
  return filas.flatMap((p) => {
    const t = cadena(p, 't')
    const v = numero(p, 'v')
    return t === null || v === null ? [] : [{ t: tIso(t), v }]
  })
}

/** Una lista de CADENAS · `rows` y `columns` de la matriz.
 *
 *  Separada de `lista`, que devuelve objetos: las etiquetas de la matriz son
 *  cadenas sueltas y pasarlas por `objeto()` las descartaría todas. Devuelve
 *  `null` cuando el campo no es un arreglo, y **una entrada que no es cadena
 *  invalida la lista entera** — descartarla correría las etiquetas contra las
 *  celdas, y una matriz corrida se ve perfecta con los rótulos cambiados de
 *  lugar. */
const cadenas = (o: Record<string, unknown>, k: string): string[] | null => {
  if (!Array.isArray(o[k])) return null
  const out: string[] = []
  for (const x of o[k] as unknown[]) {
    if (typeof x !== 'string') return null
    out.push(x)
  }
  return out
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

    case 'series_with_band': {
      // **Adaptable desde `75b8ecc` (2026-09-25).** Hasta ese commit el cable
      // mandaba los puntos sin `level` y con `lo`/`hi` opcionales, así que esta
      // forma caía en el `default`: nuestro contrato declara `nivel` obligatorio
      // y **una banda sin su nivel de confianza no se puede leer** —80% y 95%
      // son afirmaciones distintas sobre el mismo pronóstico—.
      //
      // Lo pedimos y lo hicieron el mismo día. Ahora su transformer falla con
      // `ErrMissingField` si falta cualquiera de los tres, así que lo que llega
      // acá está completo o no llega.
      const nivel = numero(v, 'level')
      const ps = lista(v, 'points')
      if (nivel === null) return { ok: false, razon: 'Un pronóstico sin nivel de intervalo.' }
      if (ps === null) return { ok: false, razon: 'Un pronóstico sin puntos.' }

      const pts: { t: string; v: number; lo: number; hi: number }[] = []
      for (const p of ps) {
        const marca = cadena(p, 't')
        const n = numero(p, 'v')
        const lo = numero(p, 'lo')
        const hi = numero(p, 'hi')
        // **Un punto sin banda no se deja pasar a medias.** `design.md`:
        // «prohibida la estimación puntual sin intervalo; un pronóstico sin
        // banda no se publica». Aceptar el punto y dibujarlo sin banda sería
        // publicar justo lo que la regla prohíbe.
        if (marca === null || n === null || lo === null || hi === null) {
          return { ok: false, razon: 'Un punto del pronóstico llegó sin su intervalo.' }
        }
        pts.push({ t: marca, v: n, lo, hi })
      }
      if (pts.length === 0) return { ok: false, razon: 'Un pronóstico sin puntos válidos.' }
      return { ok: true, valor: { forma: 'serieConBanda', nivel, puntos: pts } }
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

    case 'compared_categorical': {
      // **F4.17 · adaptada el 2026-09-30**, contra la salida real de
      // `platform_gap` en Snowflake: 37 ítems, 22 con `reference`.
      const items = lista(v, 'items')
      if (items === null) return { ok: false, razon: 'Una comparación sin ítems.' }
      const out: Extract<Value, { forma: 'categoricaComparada' }>['items'] = []
      for (const i of items) {
        const etiqueta = cadena(i, 'label')
        const n = numero(i, 'v')
        if (etiqueta === null || n === null) continue
        const referencia = numero(i, 'reference')
        const delta = numero(i, 'delta')
        // **`referencia` ausente NO se rellena, y `delta` NO se deriva.** El
        // esquema del contrato dice las dos cosas con todas las letras: sin
        // referencia «es una categórica común con otro nombre, y el panel tiene
        // que decirlo en vez de inventar un objetivo», y el delta «lo calcula el
        // BACKEND … quien conoce la definición del delta —absoluto, relativo,
        // contra qué base— es quien produjo el dato».
        //
        // Y no es teórico: en la salida real quince de los 37 ítems llegan sin
        // `reference` —plataformas con retorno atribuido y sin costo, avisado a
        // datos— y `v - reference` habría dibujado quince pesas desde el origen.
        out.push({
          etiqueta,
          v: n,
          ...(referencia === null ? {} : { referencia }),
          ...(delta === null ? {} : { delta }),
        })
      }
      return out.length === 0
        ? { ok: false, razon: 'Una comparación sin ítems válidos.' }
        : { ok: true, valor: { forma: 'categoricaComparada', items: out } }
    }

    case 'matrix': {
      // **F4.18 · adaptada el 2026-09-30**, contra `platform_month_matrix`:
      // 38 × 12 con celdas `null` donde la plataforma no tuvo inversión ese mes.
      const filas = cadenas(v, 'rows')
      const columnas = cadenas(v, 'columns')
      if (filas === null || columnas === null) {
        return { ok: false, razon: 'Una matriz sin sus etiquetas de fila o de columna.' }
      }
      if (!Array.isArray(v['cells'])) return { ok: false, razon: 'Una matriz sin celdas.' }
      const celdas: (number | null)[][] = []
      for (const fila of v['cells'] as unknown[]) {
        if (!Array.isArray(fila)) return { ok: false, razon: 'Una fila de la matriz no es una lista.' }
        const out: (number | null)[] = []
        for (const c of fila as unknown[]) {
          // **`null` pasa y cualquier otra cosa invalida la matriz entera.**
          // `null` es «el backend declara que no hay dato» y se dibuja con su
          // contorno; una celda de otro tipo es un payload mal formado, y
          // convertirla en `null` le atribuiría al negocio un hueco que es del
          // productor del dato. Es la misma distinción que ya costó en A5 y A1,
          // y acá la sostiene el adaptador porque `MatrixBody` sólo puede ver
          // largos, no tipos.
          if (c === null) out.push(null)
          else if (typeof c === 'number' && Number.isFinite(c)) out.push(c)
          else return { ok: false, razon: 'Una celda de la matriz no es una cifra ni está vacía.' }
        }
        celdas.push(out)
      }
      // **La densidad NO se comprueba acá, y es a propósito.** La declara
      // `MatrixBody` con el estado que dice cuántas faltan, porque un panel que
      // desaparece del layout con «forma inválida» no dice nada y uno que
      // muestra «38 etiquetas y 37 filas» sí. Lo que sí es del adaptador es el
      // TIPO de cada celda, que el cuerpo no puede ver.
      return { ok: true, valor: { forma: 'matriz', filas, columnas, celdas } }
    }

    case 'flow': {
      // **F4.19 · adaptada el 2026-09-30**, contra `spend_flow`: 23 etapas y
      // 22 enlaces, todos hacia un único nodo `total`.
      const stages = lista(v, 'stages')
      const links = lista(v, 'links')
      if (stages === null || links === null) {
        return { ok: false, razon: 'Un flujo sin etapas o sin enlaces.' }
      }
      const etapas = stages.flatMap((e) => {
        const id = cadena(e, 'id')
        const etiqueta = cadena(e, 'label')
        const n = numero(e, 'v')
        // **La etiqueta no cae al `id`.** El esquema de `ValorGrafo` declara que
        // ese respaldo **lo hace el backend** —«cae al `id` cuando la fila no
        // trae una, y lo hace el backend»— y `ValorFlujo` la pide obligatoria.
        // Hacerlo acá taparía que dejó de hacerlo.
        return id === null || etiqueta === null || n === null ? [] : [{ id, etiqueta, v: n }]
      })
      const enlaces = links.flatMap((l) => {
        const desde = cadena(l, 'from')
        const hacia = cadena(l, 'to')
        const n = numero(l, 'v')
        return desde === null || hacia === null || n === null ? [] : [{ desde, hacia, v: n }]
      })
      // **Un enlace a una etapa que no existe NO se filtra acá.** Es el
      // repartidor del dibujo el que decide qué hacer con él —`flowLayout` de
      // `PlotSankey` lo descarta, con su prueba— y filtrarlo en el adaptador
      // dejaría un flujo que suma distinto sin que nada lo diga.
      return etapas.length === 0 || enlaces.length === 0
        ? { ok: false, razon: 'Un flujo sin etapas o enlaces válidos.' }
        : { ok: true, valor: { forma: 'flujo', etapas, enlaces } }
    }

    default:
      // Lo que queda son las dos formas que **ningún cuerpo dibuja**:
      // `multi_attribute_profile`, cuyo único gráfico es `radar` y no está
      // construido, y `graph`, que además no tiene de dónde salir —ninguna
      // columna de las dos tablas Gold trae aristas origen→destino, medido el
      // 2026-09-29—.
      //
      // **Acá decía que el contrato no las declaraba, y era falso desde el
      // 2026-09-26**: el yaml declara las dieciséis `Valor*`. El comentario se
      // escribió cuando era cierto para las cinco y envejeció con tres de ellas
      // adentro — el mismo modo de falla que tuvo `case 'distribution'`, que
      // caía acá con un comentario que decía que el backend no la emitía.
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
export type WireChatMessagesPage = W['ChatMessagesPage']
export type WireChatSuggestion = W['ChatSuggestion']
export type WireChatAgentOption = W['ChatAgentOption']

/** Una opción de `GET /chat/agents` a `ChatAgent` · 2026-10-06.
 *
 *  **El `trim` del nombre es reformateo, no copy**: en QA llegan
 *  «Terpel Lubricantes » y «Terpel Combustibles » con el espacio de la carga, y
 *  en un selector eso desalinea la etiqueta. El texto es el del servicio. */
export function adaptChatAgent(w: WireChatAgentOption): ChatAgent {
  return {
    id: w.id,
    nombre: w.name.trim(),
    rolObjetivo: w.target_role,
    tenantId: w.tenant_id,
    tenantNombre: w.tenant_name.trim(),
  }
}

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

/* ── B5.4 · el drill-down · F3.9 · §PEN:C2 ─────────────────────────────────── */

export type WireDrillDimensions = W['DrillDownDimensions']
export type WireDrillResult = W['DrillDownResponse']

/** Por qué dimensiones se puede desagregar un panel. */
export type DrillDimensions = {
  panelId: string
  /** La clave de la métrica **del catálogo**, no la canónica del registry: el
   *  servicio consulta con la canónica —`sales` → `revenue`— y devuelve ésta. */
  clave: string
  /** Lo que decide si el CTA de detalle se pinta. */
  soportado: boolean
  dimensiones: string[]
}

/** Una desagregación ya pedida. */
export type DrillResult = {
  panelId: string
  clave: string
  /** Como lo trae el catálogo. **Hoy sale en inglés** en los paneles del
   *  dashboard por defecto, porque apuntan a las métricas de la semilla; las de
   *  Snowflake están en español. No se traduce acá: el dueño del copy que
   *  describe datos es el catálogo. */
  nombre: string
  dimension: string
  periodo: string
  /** **Las filas que la consulta devolvió, y NO la cantidad de ítems.** Medido
   *  el 2026-09-30: `platform` sobre `sales` contestó 39 con 37 ítems, porque
   *  el transformador del servicio saltea en silencio toda fila sin `label` o
   *  sin `v`. Se pasa con su nombre propio y no se usa para nada más — quien lo
   *  pinte tiene que rotularlo por lo que es. */
  filas: number
  /** Cuándo se corrió ESTA consulta · `time.Now().UTC()` del servicio.
   *
   *  **No es la frescura del panel y confundirlos es el bug**: `governance.
   *  frescura` dice cuándo se materializó la métrica. Medido el 2026-09-30 son
   *  siete horas de diferencia sobre el mes en curso, y con ellas el total del
   *  panel y la suma del detalle no coinciden. */
  consultadoEn: string
  /** `ValorOk | ValorMal`: un valor que no adapta trae su razón y la hoja la
   *  pinta, en vez de dibujar una caja vacía. */
  valor: ValorOk | ValorMal
}

/** Sólo renombra. `dimensions` llega siempre como arreglo —el servicio inicializa
 *  el DTO con `[]string{}` y sólo después mira el registry—, así que `[]`
 *  significa «no soporta» y no «no vino». */
export function adaptDrillDimensions(w: WireDrillDimensions): DrillDimensions {
  return {
    panelId: w.panel_id,
    clave: w.metric_key,
    soportado: w.supported,
    dimensiones: w.dimensions,
  }
}

/** Sólo renombra, y el valor lo adapta el que ya existe.
 *
 *  **El `shape` de raíz se ignora a propósito.** Está cableado a `"categorical"`
 *  del lado del servicio —`Shape: "categorical"`, medido igual en las tres
 *  dimensiones— y `value.shape` lo repite. Leer los dos sería una segunda fuente
 *  para el mismo dato, y se separarían el día que una de las dos cambie.
 *
 *  **Lo que el dibujo pide y el cable no trae queda AUSENTE**, cada cosa con una
 *  prueba que lo atestigua en vez de una aserción borrada: las filas crudas de la
 *  tabla origen, las cuatro capas del linaje con sus conteos, el descarte de
 *  bronce a plata, el porcentaje por fila, el total de la desagregación y la
 *  frase que afirma que cierra contra el total. Las dos primeras no tienen ruta;
 *  las dos últimas serían un cálculo y una frase compuesta, que no es trabajo de
 *  acá. */
export function adaptDrillResult(w: WireDrillResult): DrillResult {
  return {
    panelId: w.panel_id,
    clave: w.metric_key,
    nombre: w.metric_name,
    dimension: w.dimension,
    periodo: w.period,
    filas: w.row_count,
    consultadoEn: w.queried_at,
    valor: adaptValue(w.value),
  }
}
