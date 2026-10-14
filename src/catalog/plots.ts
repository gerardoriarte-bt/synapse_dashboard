/** Las reglas del repertorio, aplicadas sobre lo que mandó el backend · F1.31.
 *
 *  LA TABLA NO ESTÁ ACÁ. Llega en `GET /config/plots` —la ruta que escribimos
 *  nosotros el 2026-09-29— y estas funciones operan sobre ella. Es la misma
 *  figura que `catalog/blocks.ts`, y por la misma razón: la consumen el builder,
 *  `layout:validate` y el adaptador del front, y una tabla duplicada en tres
 *  lugares se separa en el primer cambio.
 *
 *  ── QUÉ DECIDE, Y QUÉ NO ────────────────────────────────────────────────────
 *
 *  Decide **si un gráfico puede dibujar este valor**. No decide qué dibujar —eso
 *  es del cuerpo— ni si el panel tiene datos —eso ya lo dice su `estado`—.
 *
 *  Un gráfico puede fallar de tres formas distintas y las tres tienen razón
 *  propia, que es lo que §8 pide: **incompatible** con la forma del dato,
 *  **por debajo del mínimo**, o **por encima del tope**.
 *
 *  ── EVALUAR `cuando` ES LA PARTE DELICADA ───────────────────────────────────
 *
 *  El contrato declara la condición como texto: «la condición, legible y
 *  evaluable sobre el valor». `items < 2`, `partes > 5`, `filas < 2 o columnas
 *  < 2`. Evaluarla es contar un sustantivo del valor y comparar.
 *
 *  **Los sustantivos no se inventaron: son los campos del contrato.** `items` de
 *  `ValorCategorica`, `partes` de `ValorComposicion`, `cortes` de
 *  `ValorDistribucion`, `filas` y `columnas` de `ValorMatriz`, `aristas` de
 *  `ValorGrafo`, `etapas` de `ValorFlujo`. El único que no es un campo de primer
 *  nivel es `atributos`, que vive en `perfiles[].atributos` — y se cuenta del
 *  primer perfil porque **el contrato declara que todos comparten los ejes**
 *  («todos los atributos comparten la unidad de la métrica»).
 *
 *  **Un sustantivo desconocido NO se da por cumplido.** Es la decisión que más
 *  importa de este archivo: si el backend agrega mañana `celdas < 4` y acá no
 *  hay contador, la salida honesta es «no se pudo evaluar», no «pasa». Lo
 *  contrario apaga una regla en silencio, que es exactamente el modo de falla
 *  que este archivo existe para cerrar — el mismo que `validateParams` cierra
 *  para los params.
 */
import type { ChartId, Plot, Shape, Value } from './types'

export type PlotTable = ReadonlyMap<string, Plot>

export function plotTable(plots: readonly Plot[]): PlotTable {
  return new Map(plots.map((p) => [p.id, p]))
}

/** ¿Este gráfico sabe dibujar esta forma? La primera de las tres preguntas. */
export function acceptsShape(table: PlotTable, id: ChartId, shape: Shape): boolean {
  return table.get(id)?.formas.includes(shape) ?? false
}

/** ¿Admite banda? **Regla dura 6**: `serieConBanda` sólo acepta gráficos con
 *  esto en `true`, porque un pronóstico sin banda no se publica. */
export function supportsBand(table: PlotTable, id: ChartId): boolean {
  return table.get(id)?.soportaBanda ?? false
}

/* ── Contar el valor ───────────────────────────────────────────────────────── */

/** Cuánto hay de cada sustantivo en este valor.
 *
 *  **Devuelve un mapa parcial a propósito.** Un `escalar` no tiene `items`, y
 *  `0` sería mentira: diría «llegaron cero» donde lo cierto es «esa cuenta no
 *  aplica a esta forma». La diferencia importa porque `items < 2` sobre un
 *  escalar tiene que salir como no-evaluable y no como incumplido. */
function conteos(value: Value): Readonly<Record<string, number>> {
  switch (value.forma) {
    case 'serieTemporal':
    case 'serieConBanda':
      return { puntos: value.puntos.length }
    case 'seriesMultiples':
      return { series: value.series.length }
    case 'categorica':
    case 'ranking':
    case 'categoricaComparada':
      return { items: value.items.length }
    case 'composicion':
      return { partes: value.partes.length }
    case 'distribucion':
      return { cortes: value.cortes.length }
    case 'matriz':
      return { filas: value.filas.length, columnas: value.columnas.length }
    case 'grafo':
      return { aristas: value.aristas.length, nodos: value.nodos.length }
    case 'flujo':
      return { etapas: value.etapas.length, enlaces: value.enlaces.length }
    case 'perfilMultiatributo':
      return {
        perfiles: value.perfiles.length,
        // Del PRIMER perfil, no del máximo ni del mínimo: el contrato declara
        // que todos comparten los ejes, así que cualquiera responde lo mismo y
        // tomar el máximo escondería un perfil corto en vez de ejercitarlo.
        atributos: value.perfiles[0]?.atributos.length ?? 0,
      }
    case 'tabular':
      return { filas: value.filas.length, columnas: value.columnas.length }
    default:
      // `escalar`, `escalarConIntervalo`, `prosa`: no llevan ninguna cuenta, y
      // tampoco tienen mínimo declarado. Un mapa vacío, no ceros.
      return {}
  }
}

/** El resultado de evaluar una condición. `null` es **no se pudo**, y no es lo
 *  mismo que `false`: quien decide tiene que poder distinguirlos. */
type Evaluacion = boolean | null

const TERMINO = /^([a-záéíóúñ]+)\s*(<|>|<=|>=)\s*(\d+)$/

/** Evalúa `items < 2`, y `filas < 2 o columnas < 2` como disyunción.
 *
 *  **La `o` es la única composición que la tabla usa** —la trae `matriz`, y es
 *  la que dice «una matriz de una fila es un gráfico de barras»—. No se soporta
 *  `y` porque ninguna condición la necesita: agregarla sería construir un
 *  evaluador para un caso que no existe, y el día que exista se verá el dato
 *  enfrente. */
export function evaluar(cuando: string, value: Value): Evaluacion {
  const cuentas = conteos(value)
  let alguna = false
  for (const parte of cuando.split(' o ')) {
    const m = TERMINO.exec(parte.trim())
    if (m === null) return null
    const [, sustantivo, op, n] = m
    const tiene = cuentas[sustantivo as string]
    if (tiene === undefined) return null
    const limite = Number(n)
    const cumple =
      op === '<' ? tiene < limite
      : op === '>' ? tiene > limite
      : op === '<=' ? tiene <= limite
      : tiene >= limite
    if (cumple) alguna = true
  }
  return alguna
}

/* ── La decisión ──────────────────────────────────────────────────────────── */

export type PlotProblem = {
  /** `incompatible`, `minimo`, `tope` o `indeterminado`. Quien pinta elige el
   *  estado con esto: los tres primeros son `EmptyState` con su razón, y el
   *  cuarto **no apaga el panel** — ver abajo. */
  clase: 'incompatible' | 'minimo' | 'tope' | 'indeterminado'
  /** **Copy de producto, se pinta tal cual.** Sale del repertorio, que lo trae
   *  redactado de `design.md`; el front no lo compone ni lo traduce. */
  razon: string
}

/** Por qué este gráfico no puede dibujar este valor. `null` si puede.
 *
 *  **Devuelve la razón y no un booleano** por lo mismo que `invalidReason` de
 *  `blocks.ts`: el panel tiene que poder MOSTRARLA. «Este corte necesita al
 *  menos tres categorías» ayuda; «gráfico inválido» manda a buscar un error
 *  donde hay una regla.
 *
 *  **`indeterminado` no apaga el panel, y es deliberado.** Si la condición no se
 *  puede evaluar —un sustantivo que este build no sabe contar— apagar el dibujo
 *  castigaría al usuario por una deriva entre el repertorio y el front. Se
 *  reporta para que se vea en desarrollo y el gráfico se dibuja: es la misma
 *  elección que hace `adaptPanelParams` con un param desconocido.
 */
export function invalidPlotReason(
  table: PlotTable,
  id: ChartId,
  value: Value,
): PlotProblem | null {
  const plot = table.get(id)
  if (plot === undefined) {
    return { clase: 'incompatible', razon: `el gráfico «${id}» no está en el repertorio` }
  }
  if (!plot.formas.includes(value.forma)) {
    return {
      clase: 'incompatible',
      razon: `«${plot.nombre}» no sabe dibujar la forma «${value.forma}»`,
    }
  }

  // **El mínimo se busca por FORMA**, no el primero de la lista: nueve de los 49
  // sirven dos formas con umbrales distintos —`treemap` pide 2 en `categorica` y
  // 3 en `composicion`—, así que tomar el primero acertaría en cuarenta y
  // fallaría en nueve, que es peor que fallar siempre.
  const minimo = (plot.minimos ?? []).find((m) => m.forma === value.forma)
  if (minimo !== undefined) {
    const falla = evaluar(minimo.cuando, value)
    if (falla === null) {
      return { clase: 'indeterminado', razon: `no se pudo evaluar «${minimo.cuando}»` }
    }
    if (falla) return { clase: 'minimo', razon: minimo.razon }
  }

  const tope = plot.tope
  if (tope !== undefined && tope !== null) {
    const excede = evaluar(tope.cuando, value)
    if (excede === null) {
      return { clase: 'indeterminado', razon: `no se pudo evaluar «${tope.cuando}»` }
    }
    if (excede) return { clase: 'tope', razon: tope.razon }
  }

  return null
}
