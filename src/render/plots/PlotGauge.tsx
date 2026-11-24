/** Medidor · forma `escalar` con un máximo conocido · F1.13f
 *
 *  Es el plot que no se pudo componer con las marcas cartesianas y necesitó
 *  `Arc`: su geometría es polar.
 */
import { useSize } from './core/useSize'
import { Arc, ArcRail } from './core/Arc'
import { TONO_DE_MARCA } from '../semaforo'
import type { EstadoDeUmbral } from '../semaforo'
import type { FamiliaDeDibujo } from '../types'

/** Tres cuartos de vuelta, empezando abajo a la izquierda. Deja el hueco de
 *  abajo para la cifra, que es lo que hace el `.pen`. */
const SWEEP = 0.75
const FROM = 0.625

export function PlotGauge({
  value,
  max,
  family,
  format,
  unit,
  estado,
}: {
  value: number
  max: number
  family: FamiliaDeDibujo
  format: (v: number) => string
  unit?: string
  /** El semáforo · con umbrales declarados el arco toma el color del estado y
   *  deja el de la familia. Sin esto, el arco de siempre. */
  estado?: EstadoDeUmbral
}) {
  const { ref, w, h } = useSize()

  const side = Math.min(w, h)
  const cx = w / 2
  const cy = h / 2
  const radius = Math.max(0, side / 2 - 4)
  const thickness = Math.max(6, radius * 0.18)

  // Un máximo en cero o negativo no dibuja arco en vez de dividir por cero: la
  // escala no existe, y una fracción inventada mentiría sobre el avance.
  const fraction = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max))

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {side > 0 && (
        <svg width={w} height={h} role="img" aria-label={`${format(value)} de ${format(max)}`}>
          {/* El riel dice cuánto FALTA, no solo cuánto hay. */}
          <ArcRail
            cx={cx}
            cy={cy}
            radius={radius}
            thickness={thickness}
            totalSweep={SWEEP}
            from={FROM}
          />
          <Arc
            cx={cx}
            cy={cy}
            radius={radius}
            thickness={thickness}
            family={family}
            totalSweep={SWEEP}
            from={FROM}
            segments={[{ k: 'value', fraction, step: 1 }]}
            {...(estado === undefined ? {} : { tono: TONO_DE_MARCA[estado] })}
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: Math.max(18, radius * 0.48),
              fill: 'var(--color-ink)',
            }}
          >
            {format(value)}
            {unit === '%' ? '%' : ''}
          </text>
        </svg>
      )}
    </div>
  )
}
