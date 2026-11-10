/** El tramo en curso, punteado y con los puntos huecos · EV-015, 2026-11-10.
 *  La regla y el porqué están en `enCurso.ts`; acá sólo se dibuja. */
import { Line } from './Series'
import { hue } from './seriesColor'
import type { PointXY } from './Series'
import type { LinearScale } from './scale'

/** El tramo en curso: punteado y con los puntos huecos. Nada si no hay. */
export function TramoEnCurso({
  abiertos,
  enCurso,
  x,
  y,
  family,
  step,
}: {
  abiertos: readonly PointXY[]
  enCurso: readonly PointXY[]
  x: LinearScale
  y: LinearScale
  family: string
  step: 0 | 1 | 2 | 3 | 4
}) {
  if (abiertos.length === 0) return null
  return (
    <g data-en-curso>
      <Line points={abiertos} x={x} y={y} family={family} step={step} dashed />
      {enCurso.map((p) => (
        <circle
          key={p.x}
          cx={x(p.x)}
          cy={y(p.y)}
          r={3}
          fill="var(--color-panel)"
          stroke={hue({ family, step })}
          strokeWidth={1.5}
        />
      ))}
    </g>
  )
}
