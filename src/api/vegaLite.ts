/** El gráfico del agente a nuestra forma de valor · 2026-10-07, generalizado el 2026-10-10
 *
 *  ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 *
 *  El agente `SYNAPSE_UA` tiene la herramienta `data_to_chart` y una regla que
 *  dice «ALWAYS generate a chart when: rankings, time series >=3 points,
 *  comparisons, distributions» —leído con `DESCRIBE AGENT` el 2026-10-07—. El
 *  backend lo manda como `{shape: 'raw', data: {shape: 'chart', chart_spec}}`.
 *
 *  ── QUÉ SE TOMA DEL SPEC Y QUÉ NO ───────────────────────────────────────────
 *
 *  **Se toman los datos, la MARCA, el título y los TÍTULOS DE LOS EJES.** La
 *  marca es la decisión del agente sobre cómo se lee la respuesta —decisión
 *  humana del 2026-10-07: «su marca, nuestros cuerpos»—. Los títulos de los ejes
 *  —«Ingresos (USD)», «Plataforma»— **se descartaban hasta el 2026-10-10**, y
 *  con ellos la unidad: un eje decía «1.5M» y no de qué. Lo encontró la
 *  auditoría de ese día (`docs/AUDITORIA-2026-10-10-graficos-del-chat.md`).
 *
 *  **No se toman el color ni la escala.** En este sistema el color lo dicta la
 *  familia de la métrica, o el neutro cuando no la hay.
 *
 *  ── NINGÚN GRÁFICO DESAPARECE · 2026-10-10 ──────────────────────────────────
 *
 *  Hasta ese día, todo lo que no se sabía traducir devolvía `null` y la trama
 *  se descartaba **en silencio**: dos de los siete gráficos reales —unas barras
 *  agrupadas y una serie con meses sin dato— no se veían, y la respuesta decía
 *  «aquí la gráfica». Viola la degradación declarada.
 *
 *  Ahora lo que ninguna traducción acepta **se muestra como TABLA** con los
 *  datos que el agente graficó y la razón escrita. No es elegir otro gráfico por
 *  él: es mostrar sus datos sin dibujarlos. Sólo devuelve `null` un spec que no
 *  se puede leer —no es JSON, no trae datos—.
 *
 *  ── CÓMO CRECE ──────────────────────────────────────────────────────────────
 *
 *  `TRADUCCIONES` es una lista: cada entrada reconoce una marca con sus papeles
 *  —qué canal es la medida, cuál la dimensión, cuál separa series— y produce una
 *  forma del cable y un gráfico del repertorio (`docs/backend/config-plots.json`).
 *  Cuando el repertorio sume un gráfico —barras agrupadas por serie, por
 *  ejemplo—, se agrega una entrada y lo que hoy sale como tabla pasa a dibujarse.
 *  **Nada de lo de abajo nombra una métrica**: los papeles salen de los tipos de
 *  Vega-Lite, no de los nombres de las columnas.
 *
 *  ── LO QUE NO SE HACE, A PROPÓSITO ──────────────────────────────────────────
 *
 *  La regla del adaptador es «renombra y reformatea; no calcula». Un spec con
 *  `aggregate`, `bin` o `transform` pide que el que dibuja SUME o FILTRE: se
 *  muestra como tabla con sus filas tal cual. Una torta pide el porcentaje de
 *  cada parte, y el contrato prohíbe derivarlo en el cliente.
 *
 *  La salida está en la forma del CABLE —`time_series`, `categorical`,
 *  `tabular`…— para pasar por `adaptValue` igual que cualquier otro valor.
 */
import type { ChartId, PanelType } from './types'

/** Lo que el agente escribió para leer el gráfico. `null` donde no lo escribió. */
export type EjesDelGrafico = {
  /** El título del eje de la cifra, con su unidad si la puso: «Ingresos (USD)». */
  medida: string | null
  /** El del eje que reparte: «Mes», «Plataforma». */
  dimension: string | null
  /** El de lo que separa series: «Plataforma». */
  serie: string | null
  /** La dimensión es una fecha: el rótulo lo pone el formateador del tenant. */
  dimensionEsFecha: boolean
}

export type GraficoDelAgente = {
  /** El valor en la forma del cable, listo para `adaptValue`. */
  valor: Record<string, unknown>
  tipoDePanel: PanelType
  /** El gráfico del repertorio que dibuja la marca del agente. Ausente: el del cuerpo. */
  grafico?: ChartId
  titulo: string | null
  ejes: EjesDelGrafico
  /** **Presente cuando se muestra como TABLA**: por qué no se dibuja como gráfico. */
  razon?: string
}

type Canal = {
  field: string
  type: string | null
  title: string | null
  calcula: boolean
}

type Contexto = {
  marca: string
  filas: Record<string, unknown>[]
  medida: Canal
  dimension: Canal
  serie: Canal | null
  /** La medida está en `x`: barra horizontal. */
  horizontal: boolean
  canales: Record<string, Canal>
}

type Traduccion = {
  nombre: string
  aplica: (c: Contexto) => boolean
  /** El valor, o la razón por la que estos datos no se pueden dibujar así. */
  traducir: (c: Contexto) => { valor: Record<string, unknown>; tipoDePanel: PanelType; grafico?: ChartId } | string
}

const MARCAS_DE_SERIE = new Set(['line', 'area', 'point', 'trail'])

/** **La lista que crece.** El orden importa: la primera que aplica gana. */
const TRADUCCIONES: readonly Traduccion[] = [
  {
    nombre: 'serie',
    aplica: (c) => MARCAS_DE_SERIE.has(c.marca),
    traducir: (c) => {
      const grupos = agrupar(c)
      if (typeof grupos === 'string') return grupos
      const area = c.marca === 'area'
      if (c.serie === null) {
        const [unica] = grupos
        return {
          valor: { shape: 'time_series', points: (unica?.puntos ?? []).map((p) => ({ t: p.d, v: p.v })) },
          tipoDePanel: 'series',
          ...(area ? { grafico: 'area' } : {}),
        }
      }
      // **Las series tienen que estar alineadas**: `PlotSeries` toma el eje del
      // tiempo de la primera. Desalineadas, la lectura del hover diría el valor
      // de otro mes.
      const eje = grupos[0]?.puntos.map((p) => p.d).join('|')
      if (grupos.some((g) => g.puntos.map((p) => p.d).join('|') !== eje)) {
        return `las series de «${tituloDe(c.serie)}» no cubren los mismos ${minusculas(tituloDe(c.dimension))}`
      }
      return {
        valor: {
          shape: 'multi_series',
          series: grupos.map((g) => ({ label: g.nombre, points: g.puntos.map((p) => ({ t: p.d, v: p.v })) })),
        },
        tipoDePanel: 'series',
        grafico: area ? 'stackarea' : 'multiline',
      }
    },
  },
  {
    nombre: 'barras',
    aplica: (c) => c.marca === 'bar' && c.serie === null,
    traducir: (c) => {
      const grupos = agrupar(c)
      if (typeof grupos === 'string') return grupos
      return {
        valor: {
          shape: 'categorical',
          items: (grupos[0]?.puntos ?? []).map((p) => ({ label: p.d, v: p.v })),
        },
        tipoDePanel: 'bars',
        // La orientación es la del agente: con la cifra en `x` son barras
        // horizontales; en `y`, columnas.
        grafico: c.horizontal ? 'bars' : 'columns',
      }
    },
  },
  {
    nombre: 'barras por serie',
    aplica: (c) => c.marca === 'bar' && c.serie !== null,
    // **Es un hueco del repertorio, no del dato.** `grouped` dibuja una
    // comparación de DOS valores (`compared_categorical`), no N series. El día
    // que haya uno, esta entrada traduce en vez de explicar.
    traducir: (c) =>
      `las barras agrupadas o apiladas por «${tituloDe(c.serie as Canal)}» todavía no tienen un gráfico que las dibuje`,
  },
  {
    nombre: 'torta',
    aplica: (c) => c.marca === 'arc',
    traducir: () =>
      'una torta pide el porcentaje de cada parte, y el contrato no deja calcularlo en la consola',
  },
  {
    nombre: 'mapa de calor',
    aplica: (c) => c.marca === 'rect',
    traducir: (c) => {
      const colorCanal = c.canales.color
      if (colorCanal === undefined || colorCanal.type !== 'quantitative') {
        return 'un mapa de calor sin una cifra en el color no tiene qué dibujar'
      }
      const x = c.canales.x as Canal
      const y = c.canales.y as Canal
      const columnas: string[] = []
      const filas: string[] = []
      const celdas = new Map<string, number | null>()
      for (const f of c.filas) {
        const col = texto(f[x.field])
        const fila = texto(f[y.field])
        if (col === null || fila === null) return `una celda sin «${tituloDe(x)}» o «${tituloDe(y)}»`
        if (!columnas.includes(col)) columnas.push(col)
        if (!filas.includes(fila)) filas.push(fila)
        celdas.set(`${fila}|${col}`, cifra(f[colorCanal.field]))
      }
      return {
        valor: {
          shape: 'matrix',
          rows: filas,
          columns: columnas,
          cells: filas.map((fila) => columnas.map((col) => celdas.get(`${fila}|${col}`) ?? null)),
        },
        tipoDePanel: 'matrix',
        grafico: 'heatmap',
      }
    },
  },
]

/** El spec del agente —texto u objeto— a algo que se muestra, o `null`. */
export function deVegaLite(chartSpec: unknown): GraficoDelAgente | null {
  const spec = comoObjeto(typeof chartSpec === 'string' ? parsear(chartSpec) : chartSpec)
  if (spec === null) return null

  const datos = comoObjeto(spec.data)
  const filasCrudas = Array.isArray(datos?.values) ? (datos.values as unknown[]) : null
  if (filasCrudas === null || filasCrudas.length === 0) return null
  const filas = filasCrudas.map(comoObjeto)
  if (filas.some((f) => f === null)) return null
  const lasFilas = filas as Record<string, unknown>[]

  const titulo = tituloTexto(spec.title)
  const encoding = comoObjeto(spec.encoding) ?? {}
  const canales: Record<string, Canal> = {}
  for (const [nombre, valor] of Object.entries(encoding)) {
    const c = canal(valor)
    if (c !== null) canales[nombre] = c
  }

  const x = canales.x ?? null
  const y = canales.y ?? null
  const [medida, dimension, horizontal] =
    y?.type === 'quantitative' && x !== null && x.type !== 'quantitative'
      ? [y, x, false]
      : x?.type === 'quantitative' && y !== null && y.type !== 'quantitative'
        ? [x, y, true]
        : [null, null, false]
  const colorCanal = canales.color ?? canales.detail ?? null
  const serie = colorCanal !== null && colorCanal.type !== 'quantitative' ? colorCanal : null

  const ejes: EjesDelGrafico = {
    medida: medida === null ? null : tituloDe(medida),
    dimension: dimension === null ? null : tituloDe(dimension),
    serie: serie === null ? null : tituloDe(serie),
    dimensionEsFecha: dimension?.type === 'temporal',
  }

  const comoTabla = (razon: string): GraficoDelAgente => ({
    valor: tablaDe(lasFilas, canales),
    tipoDePanel: 'table',
    titulo,
    ejes,
    razon,
  })

  // Un programa —capas, transformaciones— o un canal que pide sumar: se
  // muestran sus filas, no se calcula su resultado.
  for (const clave of ['layer', 'transform', 'concat', 'hconcat', 'vconcat', 'facet', 'repeat']) {
    if (clave in spec) return comoTabla('el gráfico combina o transforma los datos al dibujarse')
  }
  if (Object.values(canales).some((c) => c.calcula)) {
    return comoTabla('el gráfico pide sumar o agrupar los datos al dibujarse, y eso no se calcula en la consola')
  }

  const marca = marcaDe(spec.mark)
  if (marca === null) return comoTabla('el gráfico no declara su marca')

  // El mapa de calor no tiene una medida en `x` o `y`: la cifra va en el color.
  const contexto: Contexto | null =
    medida !== null && dimension !== null
      ? { marca, filas: lasFilas, medida, dimension, serie, horizontal, canales }
      : marca === 'rect' && x !== null && y !== null
        ? { marca, filas: lasFilas, medida: x, dimension: y, serie: null, horizontal: false, canales }
        : null
  if (contexto === null) {
    return comoTabla('el gráfico no tiene un eje con la cifra y otro que la reparta')
  }

  const traduccion = TRADUCCIONES.find((t) => t.aplica(contexto))
  if (traduccion === undefined) {
    return comoTabla(`la marca «${marca}» todavía no tiene un gráfico que la dibuje`)
  }
  const r = traduccion.traducir(contexto)
  if (typeof r === 'string') return comoTabla(r)
  return { ...r, titulo, ejes }
}

/** Las filas por serie, en el orden en que el agente las listó. Una cifra que
 *  falta devuelve la razón: **un mes sin dato no es un cero**, y dibujar la
 *  línea a través de él afirmaría un valor que no está. */
function agrupar(
  c: Contexto,
): { nombre: string; puntos: { d: string; v: number }[] }[] | string {
  const grupos = new Map<string, { d: string; v: number }[]>()
  const faltan: string[] = []
  for (const f of c.filas) {
    const d = texto(f[c.dimension.field])
    if (d === null) return `una fila no trae «${tituloDe(c.dimension)}»`
    const nombre = c.serie === null ? '' : texto(f[c.serie.field])
    if (nombre === null) return `una fila no trae «${tituloDe(c.serie as Canal)}»`
    const v = cifra(f[c.medida.field])
    if (v === null) {
      faltan.push(nombre === '' ? d : `${nombre} en ${d}`)
      continue
    }
    if (!grupos.has(nombre)) grupos.set(nombre, [])
    grupos.get(nombre)?.push({ d, v })
  }
  if (faltan.length > 0) {
    return `faltan cifras —${faltan.slice(0, 3).join(', ')}${faltan.length > 3 ? '…' : ''}— y una línea con huecos todavía no se dibuja`
  }
  return [...grupos].map(([nombre, puntos]) => ({ nombre, puntos }))
}

/** Los datos del spec como tabla del cable: primero lo que reparte, después las
 *  cifras. Las columnas son las de los canales —lo que el agente graficó—, con
 *  sus títulos; las demás columnas de `values` no se graficaron. */
function tablaDe(filas: Record<string, unknown>[], canales: Record<string, Canal>): Record<string, unknown> {
  // **El orden es por PAPEL, no por cómo vinieron las claves** · el agente
  // escribe `color` antes que `x` a veces, y la tabla abría con «Plataforma»
  // en vez de «Mes». Primero los ejes que reparten, después lo que separa
  // series, al final las cifras.
  const papel = ([nombre, c]: [string, Canal]) =>
    c.type === 'quantitative' ? 2 : nombre === 'x' || nombre === 'y' ? 0 : 1
  const vistos = new Set<string>()
  const ordenados = Object.entries(canales)
    .sort((a, b) => papel(a) - papel(b))
    .map(([, c]) => c)
    .filter((c) => (vistos.has(c.field) ? false : (vistos.add(c.field), true)))
  const columnas = ordenados.map((c) => ({
    key: c.field,
    title: tituloDe(c),
    numeric: c.type === 'quantitative',
  }))
  return {
    shape: 'tabular',
    columns: columnas,
    rows: filas.map((f) =>
      Object.fromEntries(
        ordenados.map((c) => [c.field, c.type === 'quantitative' ? cifra(f[c.field]) : texto(f[c.field])]),
      ),
    ),
  }
}

function parsear(texto: string): unknown {
  try {
    return JSON.parse(texto) as unknown
  } catch {
    return null
  }
}

function comoObjeto(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

function marcaDe(mark: unknown): string | null {
  if (typeof mark === 'string') return mark
  const m = comoObjeto(mark)
  return typeof m?.type === 'string' ? m.type : null
}

/** Un canal con su campo y su título. `aggregate` o `bin` lo marcan como una
 *  cuenta que el que dibuja tendría que hacer.
 *
 *  **`timeUnit` sí pasa**: `yearmonth` sobre una fecha por mes sólo dice cómo
 *  rotularla. Rechazarlo tiraba casi todas las series mensuales del agente. */
function canal(v: unknown): Canal | null {
  const c = comoObjeto(v)
  if (c === null || typeof c.field !== 'string' || c.field === '') return null
  const titulo =
    texto(c.title) ?? texto(comoObjeto(c.axis)?.title) ?? texto(comoObjeto(c.legend)?.title)
  return {
    field: c.field,
    type: typeof c.type === 'string' ? c.type : null,
    title: titulo,
    calcula: 'aggregate' in c || 'bin' in c,
  }
}

/** El título que el agente escribió, o el nombre de la columna si no escribió
 *  ninguno: `VENTAS_USD` se lee peor, pero dice qué es. */
function tituloDe(c: Canal): string {
  return c.title ?? c.field
}

function minusculas(s: string): string {
  return s.toLocaleLowerCase('es')
}

/** Snowflake devuelve NUMBER como texto por la SQL API, así que `"123.45"` es
 *  una cifra. Pasarla a número es reformatear, no calcular. */
function cifra(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function texto(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() === '' ? null : v
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return null
}

function tituloTexto(t: unknown): string | null {
  if (typeof t === 'string') return t.trim() === '' ? null : t
  const o = comoObjeto(t)
  return typeof o?.text === 'string' && o.text.trim() !== '' ? o.text : null
}
