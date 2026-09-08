/** Series temporales · una línea o varias · F1.13f */
import { useSize } from './core/useSize'
import { ceiling, linearScale } from './core/scale'
import { ValueAxis } from './core/Axis'
import { MARGIN, axisReserve } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Area, Line } from './core/Series'
import type { Family } from '../../catalog/types'

export type DrawableSeries = { etiqueta: string; puntos: { t: string; v: number }[] }

export function PlotSeries({
  series,
  family,
  format,
  area = true,
}: {
  series: readonly DrawableSeries[]
  family: Family
  format: (v: number) => string
  /** El área solo tiene sentido con UNA serie: con varias, las capas se tapan y
   *  ninguna se lee. */
  area?: boolean
}) {
  const { ref, w, h } = useSize()

  const all = series.flatMap((s) => s.puntos)
  const max = ceiling(all.map((p) => p.v))
  const height = Math.max(0, h - MARGIN.t - MARGIN.b)

  // La reserva sale del rótulo MÁS LARGO, no del rótulo del máximo · F1.13a.
  const y = linearScale([0, max], [height, 0]) // invertido: la y crece hacia abajo
  const reserve = axisReserve(y.ticks(4).map(format))
  const width = Math.max(0, w - reserve - MARGIN.r)

  const steps = Math.max(1, all.length === 0 ? 1 : (series[0]?.puntos.length ?? 1) - 1)
  const x = linearScale([0, steps], [0, width])

  const pointsOf = (s: DrawableSeries) => s.puntos.map((p, i) => ({ x: i, y: p.v }))
  const single = series.length === 1

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && (
        <svg width={w} height={h} role="img" aria-label={`${series.length} series`}>
          <g transform={`translate(${reserve},${MARGIN.t})`}>
            <Grid scale={y} orientation="horizontal" length={width} />
            {series.map((s, i) => (
              <g key={s.etiqueta}>
                {area && single && (
                  <Area points={pointsOf(s)} x={x} y={y} base={height} family={family} />
                )}
                <Line
                  points={pointsOf(s)}
                  x={x}
                  y={y}
                  family={family}
                  step={(i % 4) as 0 | 1 | 2 | 3}
                />
              </g>
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
