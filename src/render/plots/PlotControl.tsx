/** Carta de control · forma `serieConBanda` · §PEN:Plot/CONTROL
 *
 *  **Lo que distingue una carta de control de un pronóstico es qué comunica la
 *  banda.** En `PlotForecast` la banda es la incertidumbre de la estimación y se
 *  ensancha hacia adelante; acá son **límites**, y lo que el gráfico existe para
 *  mostrar es **qué puntos se salen**. Un control sin las violaciones marcadas
 *  es una serie con un rectángulo de fondo.
 *
 *  ── LO QUE DICE EL DIBUJO ───────────────────────────────────────────────────
 *
 *  Leído del `.pen` antes de escribir esto: línea de 2px sobre un rect de banda
 *  al 10 % de opacidad, dos puntos de 10×10 sobre las violaciones **con su cifra
 *  al lado**, y los dos límites rotulados —«LÍMITE SUPERIOR 1.44%»—.
 *
 *  **La banda se dibuja igual con `Band`, aunque acá sea constante.** Los
 *  límites llegan como `lo`/`hi` por punto: constantes son el mismo número en
 *  todos. No hace falta una primitiva nueva, y una banda que se ensancha —una
 *  carta de control de límites móviles— sale gratis.
 *
 *  ── UNA DIVERGENCIA CON EL `.pen`, DECLARADA ────────────────────────────────
 *
 *  **El dibujo marca las violaciones con `$fam-inventario-1` sobre una serie de
 *  `$fam-demanda-1`** — o sea, con una familia distinta de la de la métrica.
 *  Acá no se puede: regla dura 1, «la familia se lee del catálogo, nunca se
 *  elige en el componente». Elegir un hue sería exactamente lo que la regla
 *  prohíbe.
 *
 *  Se marca en `ink`, que además es lo que pide la regla de los deltas: el color
 *  no comunica: lo hace la posición fuera de la banda. **Va como propuesta de
 *  spec, no resuelta en silencio.**
 */
import { useSize } from './core/useSize'
import { ceiling, linearScale } from './core/scale'
import { ValueAxis } from './core/Axis'
import { MARGIN, axisReserve } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Band } from './core/Band'
import { Line } from './core/Series'
import type { Family } from '../../catalog/types'

export type ControlPoint = { t: string; v: number; lo: number; hi: number }

/** El radio del punto de violación · 10px de diámetro en el `.pen`. */
const DOT = 5

/** Fuera de la banda. **El `>` y el `<` son estrictos**: un valor que toca
 *  exactamente el límite está dentro, que es lo que «límite» significa. */
const violates = (p: ControlPoint) => p.v > p.hi || p.v < p.lo

export function PlotControl({
  points,
  family,
  format,
}: {
  points: readonly ControlPoint[]
  family: Family
  format: (v: number) => string
}) {
  const { ref, w, h } = useSize()

  const height = Math.max(0, h - MARGIN.t - MARGIN.b)
  // El techo mira el `hi` **y** el valor: una violación por arriba está, por
  // definición, por encima del límite — con el techo en `hi` se saldría del área.
  const y = linearScale([0, ceiling(points.flatMap((p) => [p.hi, p.v]))], [height, 0])
  const reserve = axisReserve(y.ticks(4).map(format))
  const width = Math.max(0, w - reserve - MARGIN.r)
  const x = linearScale([0, Math.max(1, points.length - 1)], [0, width])

  const fuera = points.map((p, i) => ({ ...p, i })).filter(violates)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`Serie con banda de control · ${String(fuera.length)} fuera de límite`}
        >
          <g transform={`translate(${reserve},${MARGIN.t})`}>
            <Grid scale={y} orientation="horizontal" length={width} />
            <Band
              points={points.map((p, i) => ({ t: i, lo: p.lo, hi: p.hi }))}
              x={x}
              y={y}
              family={family}
            />
            <Line points={points.map((p, i) => ({ x: i, y: p.v }))} x={x} y={y} family={family} />
            {fuera.map((p) => (
              <circle
                key={p.t}
                cx={x(p.i)}
                cy={y(p.v)}
                r={DOT}
                fill="var(--color-ink)"
                aria-label={`${p.t} fuera de límite · ${format(p.v)}`}
              />
            ))}
          </g>
          <g transform={`translate(0,${MARGIN.t})`}>
            <ValueAxis scale={y} side="left" at={reserve - 6} format={format} />
          </g>
        </svg>
      )}
    </div>
  )
}
