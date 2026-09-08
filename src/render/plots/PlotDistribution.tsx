/** Distribución · cortes sobre un eje · F1.13f
 *
 *  Reusa `Dots`, la cuarta marca cartesiana; no necesitó primitiva nueva.
 */
import { useSize } from './core/useSize'
import { ceiling, linearScale } from './core/scale'
import { ValueAxis } from './core/Axis'
import { MARGIN, axisReserve } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Dots } from './core/Series'
import type { Family } from '../../catalog/types'

export type Cut = { etiqueta: string; v: number }

export function PlotDistribution({
  cuts,
  family,
  format,
}: {
  cuts: readonly Cut[]
  family: Family
  format: (v: number) => string
}) {
  const { ref, w, h } = useSize()

  const height = Math.max(0, h - MARGIN.t - MARGIN.b)
  const y = linearScale([0, ceiling(cuts.map((c) => c.v))], [height, 0])
  const reserve = axisReserve(y.ticks(4).map(format))
  const width = Math.max(0, w - reserve - MARGIN.r)
  const x = linearScale([0, Math.max(1, cuts.length - 1)], [0, width])

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && (
        <svg width={w} height={h} role="img" aria-label={`${cuts.length} cortes`}>
          <g transform={`translate(${reserve},${MARGIN.t})`}>
            <Grid scale={y} orientation="horizontal" length={width} />
            <Dots
              points={cuts.map((c, i) => ({ k: c.etiqueta, x: i, y: c.v, r: 5 }))}
              x={x}
              y={y}
              family={family}
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
