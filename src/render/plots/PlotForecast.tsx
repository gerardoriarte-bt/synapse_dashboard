/** Pronóstico con banda · formas `serieConBanda` y `escalarConIntervalo` · F1.13f
 *
 *  **La banda no es opcional y no hay bandera para apagarla.** Regla dura 6: un
 *  pronóstico sin intervalo no se publica. Que `Band` exista como primitiva
 *  aparte y este plot la use siempre es lo que hace que apagarla exija reescribir
 *  el componente, no pasar `band={false}`.
 */
import { useSize } from './core/useSize'
import { ceiling, linearScale } from './core/scale'
import { ValueAxis } from './core/Axis'
import { MARGIN, axisReserve } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Band } from './core/Band'
import { Line } from './core/Series'
import type { Family } from '../../catalog/types'

export type BandedPoint = { t: string; v: number; lo: number; hi: number }

export function PlotForecast({
  points,
  family,
  format,
  cut,
}: {
  points: readonly BandedPoint[]
  family: Family
  format: (v: number) => string
  /** Índice donde termina lo observado y empieza lo proyectado. */
  cut?: number
}) {
  const { ref, w, h } = useSize()

  const height = Math.max(0, h - MARGIN.t - MARGIN.b)
  // El techo sale del `hi` de la banda, no del valor: con el valor, el borde
  // superior del intervalo se salía del área.
  const y = linearScale([0, ceiling(points.map((p) => p.hi))], [height, 0])
  const reserve = axisReserve(y.ticks(4).map(format))
  const width = Math.max(0, w - reserve - MARGIN.r)
  const x = linearScale([0, Math.max(1, points.length - 1)], [0, width])

  const line = points.map((p, i) => ({ x: i, y: p.v }))
  const breakAt = cut ?? points.length - 1

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && (
        <svg width={w} height={h} role="img" aria-label="Pronóstico con intervalo">
          <g transform={`translate(${reserve},${MARGIN.t})`}>
            <Grid scale={y} orientation="horizontal" length={width} />
            <Band
              points={points.map((p, i) => ({ t: i, lo: p.lo, hi: p.hi }))}
              x={x}
              y={y}
              family={family}
            />
            <Line points={line.slice(0, breakAt + 1)} x={x} y={y} family={family} />
            {/* Lo proyectado va guionado: el guion dice «esto todavía no pasó». */}
            <Line points={line.slice(breakAt)} x={x} y={y} family={family} step={3} dashed />
          </g>
          <g transform={`translate(0,${MARGIN.t})`}>
            <ValueAxis scale={y} side="left" at={reserve - 6} format={format} />
          </g>
        </svg>
      )}
    </div>
  )
}
