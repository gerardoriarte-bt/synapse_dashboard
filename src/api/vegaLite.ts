/** El gráfico del agente a nuestra forma de valor · 2026-10-07
 *
 *  ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 *
 *  El agente `SYNAPSE_UA` tiene la herramienta `data_to_chart` y una regla que
 *  dice «ALWAYS generate a chart when: rankings, time series >=3 points,
 *  comparisons, distributions» —leído con `DESCRIBE AGENT` el 2026-10-07—. En
 *  Snowflake Intelligence ese gráfico se ve. Acá no se veía nunca: el backend
 *  (`7b717aa`) lo manda como `{shape: 'raw', data: {shape: 'chart',
 *  chart_spec}}` y `adaptValue` no tiene caso para eso, así que el frame se
 *  descartaba en silencio.
 *
 *  ── QUÉ SE TOMA DEL SPEC Y QUÉ NO ───────────────────────────────────────────
 *
 *  **Se toman los datos y la MARCA.** La marca es la decisión del agente sobre
 *  cómo se lee la respuesta —decisión humana del 2026-10-07: «su marca,
 *  nuestros cuerpos»—, así que dibujar una línea donde pidió una línea no es
 *  elegir un cuerpo, es respetarlo.
 *
 *  **No se toman el color ni la escala.** El agente trae los colores de marca
 *  de UA, entre ellos un ámbar y un rojo que `design.md` prohíbe como color de
 *  dato. En este sistema el color lo dicta la familia de la métrica.
 *
 *  ── LO QUE SE RECHAZA, Y ES A PROPÓSITO ─────────────────────────────────────
 *
 *  La regla del adaptador es «renombra y reformatea; no calcula». Un spec con
 *  `aggregate` o `transform` pide que el que dibuja SUME o FILTRE, y hacerlo
 *  acá sería calcular una cifra que nadie consultó. Tampoco se traduce lo que
 *  no tiene un cuerpo que lo dibuje tal como el agente lo pidió —barras con
 *  color (agrupadas o apiladas), tortas, mapas de calor—: cambiarle la marca
 *  sería volver a elegir por él. Todo eso devuelve `null`, con la misma
 *  consecuencia que un valor que no adapta: no se pinta a medias.
 *
 *  La salida está en la forma del CABLE —`time_series`, `multi_series`,
 *  `categorical`— y no en la nuestra, para pasar por `adaptValue` igual que
 *  cualquier otro valor. Validar dos veces de dos maneras es cómo se separan.
 */
import type { PanelType } from './types'

export type GraficoDelAgente = {
  /** El valor en la forma del cable, listo para `adaptValue`. */
  valor: Record<string, unknown>
  tipoDePanel: Extract<PanelType, 'series' | 'bars'>
  titulo: string | null
}

const MARCAS_DE_SERIE = new Set(['line', 'area', 'point', 'trail'])

type Canal = { field: string; type: string | null }

/** El spec del agente —texto u objeto— a un valor dibujable, o `null`. */
export function deVegaLite(chartSpec: unknown): GraficoDelAgente | null {
  const spec = comoObjeto(typeof chartSpec === 'string' ? parsear(chartSpec) : chartSpec)
  if (spec === null) return null

  // Un spec en capas o con transformaciones no es un gráfico: es un programa.
  if ('layer' in spec || 'transform' in spec || 'concat' in spec || 'facet' in spec) return null

  const marca = marcaDe(spec.mark)
  const encoding = comoObjeto(spec.encoding)
  const datos = comoObjeto(spec.data)
  const filas = Array.isArray(datos?.values) ? (datos.values as unknown[]) : null
  if (marca === null || encoding === null || filas === null || filas.length === 0) return null

  const x = canal(encoding.x)
  const y = canal(encoding.y)
  if (x === null || y === null) return null

  // La medida es el canal cuantitativo; la dimensión, el otro. Una barra
  // horizontal tiene la medida en `x`, y es la misma barra.
  const [dimension, medida] =
    y.type === 'quantitative' ? [x, y] : x.type === 'quantitative' ? [y, x] : [null, null]
  if (dimension === null || medida === null) return null

  const color = canal(encoding.color)
  const titulo = tituloDe(spec.title)

  const puntos: { d: string; v: number; s: string | null }[] = []
  for (const f of filas) {
    const fila = comoObjeto(f)
    if (fila === null) return null
    const d = fila[dimension.field]
    const v = cifra(fila[medida.field])
    const s = color === null ? null : fila[color.field]
    // **Una fila rota invalida el gráfico entero.** Saltarla movería la línea
    // sobre un hueco que el agente no dibujó.
    if ((typeof d !== 'string' && typeof d !== 'number') || v === null) return null
    if (color !== null && typeof s !== 'string' && typeof s !== 'number') return null
    puntos.push({ d: String(d), v, s: s === null ? null : String(s) })
  }

  if (MARCAS_DE_SERIE.has(marca)) {
    if (color === null) {
      return {
        valor: { shape: 'time_series', points: puntos.map((p) => ({ t: p.d, v: p.v })) },
        tipoDePanel: 'series',
        titulo,
      }
    }
    // El orden de las series es el de su primera aparición, que es el orden
    // en que el agente las listó. No se reordena.
    const series = new Map<string, { t: string; v: number }[]>()
    for (const p of puntos) {
      const clave = p.s as string
      if (!series.has(clave)) series.set(clave, [])
      series.get(clave)?.push({ t: p.d, v: p.v })
    }
    return {
      valor: {
        shape: 'multi_series',
        series: [...series].map(([label, points]) => ({ label, points })),
      },
      tipoDePanel: 'series',
      titulo,
    }
  }

  if (marca === 'bar' && color === null) {
    return {
      valor: { shape: 'categorical', items: puntos.map((p) => ({ label: p.d, v: p.v })) },
      tipoDePanel: 'bars',
      titulo,
    }
  }

  return null
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

/** Un canal con su campo. Con `aggregate` o `bin` no es un canal que se lee:
 *  es una cuenta que el que dibuja tendría que hacer.
 *
 *  **`timeUnit` sí pasa**: `yearmonth` sobre una fecha por mes sólo dice cómo
 *  rotularla. Rechazarlo tiraba casi todas las series mensuales del agente. */
function canal(v: unknown): Canal | null {
  const c = comoObjeto(v)
  if (c === null || typeof c.field !== 'string' || c.field === '') return null
  if ('aggregate' in c || 'bin' in c) return null
  return { field: c.field, type: typeof c.type === 'string' ? c.type : null }
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

function tituloDe(t: unknown): string | null {
  if (typeof t === 'string') return t.trim() === '' ? null : t
  const o = comoObjeto(t)
  return typeof o?.text === 'string' && o.text.trim() !== '' ? o.text : null
}
