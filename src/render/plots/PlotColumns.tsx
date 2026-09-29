/** Columnas verticales · forma `categorica` · §PEN:Plot/COLUMNAS · Ventas por mes
 *
 *  **No es `PlotBars` rotado, y la diferencia la fija el dato, no el gusto.** Las
 *  barras horizontales contestan «quién es más grande» y por eso su cuerpo
 *  ordena de mayor a menor; las columnas contestan «cómo se movió esto a lo
 *  largo del eje», y ese eje casi siempre es el tiempo. Reordenar «ventas por
 *  mes» por magnitud produce un gráfico que se ve impecable y miente.
 *
 *  ── LO QUE SE MIDIÓ EN EL DIBUJO ────────────────────────────────────────────
 *
 *  El frame son 580 × 224 con doce columnas. El área de dibujo va de x 34 a 574
 *  —540 px— y el baseline está en y 196, con rejilla en 196, 105 y 14. El paso
 *  entre columnas es 43.84 y cada columna mide 28.1: **la columna ocupa 0.64 del
 *  paso**, o sea `padding = 0.36`, y no el 0.2 que `bandScale` trae por defecto.
 *  Ese número es lo único de la geometría que se copia; el resto se deriva del
 *  contenedor, porque el `.pen` dibuja a tamaño fijo y acá el plot vive dentro
 *  del `rowSpan` que le toque.
 *
 *  **La tinta del dibujo tiene una sola diferencia**: la columna del índice 6 va
 *  en el escalón 1 de la familia a opacidad plena, y las otras once en el
 *  escalón 0 al 60 %. No hay naranja, y no se agrega: `--color-acc` no es color
 *  de datos, y «resaltado» es justamente donde la tentación aparece.
 *
 *  ── EL RESALTADO ENTRA POR PARAMS, Y ESO ES UNA FRONTERA ────────────────────
 *
 *  `ValorCategorica` es `{ etiqueta, v }` y nada más: no trae «período vigente»
 *  ni bandera de actual. El dibujo resalta el índice 6 de 12, que no es ni el
 *  máximo —el más alto es el 11— ni el último, así que **el dibujo no expone una
 *  regla derivable**. Deducir una —«la más alta», «la última»— sería el front
 *  calculando sin dato de atrás. Por eso `destacado` llega por prop y, cuando no
 *  llega, las doce columnas quedan iguales y sin cifra.
 *
 *  ── EL RALO DEL EJE SE CALCULA, NO SE CABLEA ────────────────────────────────
 *
 *  El dibujo rotula seis de doce —ENE, MAR, MAY, JUL, SEP, NOV—. Escribir «cada
 *  dos» sería cablear una consecuencia: el eje está ralo porque las etiquetas no
 *  entran, no porque los meses vengan de a pares. Con las etiquetas que el cable
 *  manda de verdad —`2026-01`, siete caracteres sobre un paso de ~44— la regla
 *  de que quepa da 2 y reproduce el dibujo; con «ENE» de tres daría 1 y se
 *  pintarían las doce, que es correcto y no es el dibujo.
 *
 *  **La banda destacada se rotula siempre**, la saltee o no el ralo: una cifra
 *  sobre una columna sin rótulo es un número desnudo.
 *
 *  ── TRES DESVIACIONES DECLARADAS ────────────────────────────────────────────
 *
 *  1. **La opacidad va en un `<g>` y no en cada marca.** `Bars` toma un solo
 *     `SeriesColor` para todo el grupo y no sabe de opacidad, así que la
 *     destacada se compone llamándolo DOS veces sobre la misma `bandScale`. Lo
 *     correcto es una prop `opacity` en `Bars` —el patrón se repite en pareto,
 *     ciclo y ranking, así que falta la primitiva— y tocar `core/Series.tsx` no
 *     entra en esta tarea.
 *  2. **El ralo se logra angostando el DOMINIO, no el eje.** `CategoryAxis`
 *     pinta todas las categorías; acá se le pasa la misma escala con el dominio
 *     recortado, así que las posiciones siguen saliendo de la escala completa y
 *     el eje no cambia. La prop `every` sigue faltando en la primitiva.
 *  3. **La cifra es un `<text>` propio.** `AxisText` no sirve: es mono 10,
 *     `dim`, con tracking y con `.toUpperCase()` forzado, y los cuatro rasgos
 *     están mal para una cifra —el dibujo la pone mono 11, `ink`, sin tracking—.
 *     Lo que falta es `core/MarkLabel.tsx`, que piden también cascada, bullet,
 *     dumbbell y lollipop.
 *
 *  ── LO QUE EL DIBUJO PIDE Y NO SE REPRODUCE ─────────────────────────────────
 *
 *  Sus tres rótulos de valor son 0.0 / 2.5 / 5.0, y **ese paso de 2.5 no existe
 *  en `niceStep`**, que redondea a 1, 2, 5 o 10 por década. Sobre un dominio
 *  0–5 `ticks(4)` da 0, 2 y 4: son tres líneas, con otros números y con la de
 *  arriba dejando de coincidir con el techo. Meterle el medio paso cambiaría el
 *  eje de TODOS los plots, así que se usan los defectos y la divergencia queda
 *  escrita; si diseño quiere el medio paso, es propuesta de spec.
 */
import { useSize } from './core/useSize'
import { bandScale, ceiling, linearScale } from './core/scale'
import { CategoryAxis, ValueAxis } from './core/Axis'
import { MARGIN, axisReserve, textWidth } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Bars } from './core/Series'
import type { BandScale } from './core/scale'
import type { PlotProps } from '../types'

/** La fracción del paso que queda como aire · medida en el `.pen`: paso 43.84 y
 *  columna 28.1. El defecto de `bandScale` es 0.2 y produce un apilado sin aire. */
const PADDING = 0.36

/** Las columnas que NO son la destacada · el dibujo las pone al 60 %. */
const MUTED = 0.6

/** Cuánto sube la cifra sobre el tope de su columna. En el dibujo el centro del
 *  texto queda en y 28.3 y el tope de la columna en 40.2. */
const LIFT = 12

/** El aire mínimo entre dos rótulos de categoría vecinos, en píxeles. */
const LABEL_GAP = 8

/** La MISMA escala con el dominio recortado.
 *
 *  Las posiciones siguen saliendo de la escala completa —`x(k)` no cambia— así
 *  que esto no mueve nada: sólo le dice al eje cuáles rotular. Es lo que deja
 *  ralear sin escribir un eje propio ni desalinear el rótulo de su columna. */
function narrowed(scale: BandScale, domain: readonly string[]): BandScale {
  return Object.assign((k: string) => scale(k), {
    domain,
    bandwidth: scale.bandwidth,
    step: scale.step,
  }) as BandScale
}

export function PlotColumns({
  value,
  family,
  format,
  destacado,
}: PlotProps<'categorica'> & {
  /** La `etiqueta` de la columna a resaltar, **no un índice**: el cuerpo ordena
   *  y recorta antes de llamar, así que un índice apunta a otra columna en
   *  cuanto `orden` o `tope` cambian. */
  destacado?: string
}) {
  const { ref, w, h } = useSize()

  const items = value.items.map((i) => ({ k: i.etiqueta, v: i.v }))
  const marca = items.find((i) => i.k === destacado)

  const height = Math.max(0, h - MARGIN.t - MARGIN.b)
  const y = linearScale([0, ceiling(items.map((i) => i.v))], [height, 0])
  const reserve = axisReserve(y.ticks(4).map(format))
  const width = Math.max(0, w - reserve - MARGIN.r)
  const x = bandScale(
    items.map((i) => i.k),
    [0, width],
    PADDING,
  )

  // Cada cuántas categorías cabe un rótulo entero. Sale de la más larga porque
  // es la que choca primero con su vecina.
  const longest = Math.max(0, ...items.map((i) => i.k.length))
  const every =
    x.step > 0 ? Math.max(1, Math.ceil((textWidth(longest) + LABEL_GAP) / x.step)) : 1
  const rotulados = items
    .filter((i, n) => n % every === 0 || i.k === marca?.k)
    .map((i) => i.k)

  const label =
    marca === undefined
      ? `${items.length} columnas`
      : `${items.length} columnas · ${marca.k} ${format(marca.v)}`

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        <svg width={w} height={h} role="img" aria-label={label}>
          <g transform={`translate(${reserve},${MARGIN.t})`}>
            <Grid scale={y} orientation="horizontal" length={width} />
            {/* Las once apagadas y la destacada, en dos llamadas sobre la misma
                banda · ver la desviación 1 de la cabecera. */}
            <g opacity={MUTED}>
              <Bars
                items={items.filter((i) => i.k !== marca?.k)}
                band={x}
                value={y}
                orientation="vertical"
                base={y(0)}
                family={family}
                step={0}
              />
            </g>
            {marca !== undefined && (
              <>
                <Bars
                  items={[marca]}
                  band={x}
                  value={y}
                  orientation="vertical"
                  base={y(0)}
                  family={family}
                  step={1}
                />
                <text
                  x={x(marca.k) + x.bandwidth / 2}
                  y={y(marca.v) - LIFT}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-cifra)',
                    fill: 'var(--color-ink)',
                  }}
                >
                  {format(marca.v)}
                </text>
              </>
            )}
            <CategoryAxis
              scale={narrowed(x, rotulados)}
              side="bottom"
              at={height + LIFT}
              width={x.step}
            />
          </g>
          <g transform={`translate(0,${MARGIN.t})`}>
            <ValueAxis scale={y} side="left" at={reserve - 6} format={format} />
          </g>
        </svg>
      )}
    </div>
  )
}
