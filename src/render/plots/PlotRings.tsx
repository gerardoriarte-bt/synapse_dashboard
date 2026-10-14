/** Anillos · cumplimiento múltiple · forma `escalar` con objetivo · §PEN:Plot/ANILLOS
 *
 *  Medido nodo por nodo sobre el frame `Plot/ANILLOS · Cumplimiento múltiple`
 *  (404×200; los seis `path` llevan `viewBox [0,0,340,200]` y `x: 48`). Lo que
 *  el dibujo NO dice con palabras y hubo que medir está abajo, en `HEADROOM`.
 *
 *  **Por qué una LISTA y no un `value` suelto.** `PlotProps<'escalar'>` trae UN
 *  valor y este gráfico dibuja N anillos: el `.pen` pinta VENTAS, ÓRDENES y
 *  ROAS, que son tres métricas, y un panel se ancla a UN `metricId`. Hoy el
 *  cuerpo le pasa un elemento y se ve un anillo solo — que es lo honesto, no un
 *  defecto. El día que el cable traiga el dato múltiple cambia el cuerpo y no
 *  este archivo. De `PlotProps` se toma lo que sí vale con un `Pick`, para que
 *  «`format` es obligatorio» siga siendo una garantía del compilador.
 *
 *  **El riel se compone con `arcPath` y no con `ArcRail`** porque `ArcRail`
 *  tiene `fill="var(--color-w2)"` cableado y el `.pen` manda `$c-grid`. Componer
 *  una primitiva de `core/` cumple la regla del README; lo que falta es un tono
 *  en `ArcRail`, y ése es un archivo compartido que esta tarea no toca.
 */
import { Arc } from './core/Arc'
import { arcPath } from './core/arcPath'
import { useSize } from './core/useSize'
import type { FamilyStep } from '../../tokens/tokens'
import type { PlotProps } from '../types'

/** **La vuelta entera es 110%, no 100%.** Es lo único del dibujo que nadie
 *  puede deducir y por eso vive en una constante con su medición al lado.
 *
 *  Los tres arcos de valor del `.pen` terminan en vueltas 0,9364 / 0,8819 /
 *  0,8635 para 103% / 97% / 95%; el cociente porcentaje÷vueltas da 109,99 /
 *  110,00 / 110,02. Tres coincidencias a 0,1% no son un descuido: el dibujo
 *  reserva 10% de aire para que un sobrecumplimiento se VEA en vez de quedar
 *  aplastado contra el tope. Si diseño dice que el aire es otro, se cambia acá
 *  y la prueba del arco cerrado avisa. */
const HEADROOM = 1.1

/** La banda que el rótulo ocupa debajo del anillo. En el `.pen` el centro del
 *  rótulo cae 20,4px debajo del borde exterior (y = 174,9 contra un radio
 *  exterior de 50,5 sobre cy = 104). */
const LABEL_BAND = 28

/** Del `.pen`: diámetro exterior 101 sobre una celda de 128 ⇒ 0,79. */
const FILL_OF_CELL = 0.79

/** `strokeWidth` 9 sobre un radio exterior de 50,5 ⇒ 0,178, que es el mismo
 *  0,18 que ya usa `PlotGauge`. */
const THICKNESS_RATIO = 0.178

/** 19px de cifra sobre un radio exterior de 50,5 ⇒ 0,376. El 19 no está en la
 *  escala tipográfica —emite 15 y 20—, así que se calcula del radio como ya hace
 *  `PlotGauge` con la suya: dentro de un plot el tamaño escala con el dibujo. El
 *  piso 11 es `--text-cifra`. */
const FIGURE_RATIO = 0.38

/** El escalón de la rampa que le toca a cada anillo.
 *
 *  El `.pen` pinta `$fam-demanda-1`, `$fam-demanda-0` y `$fam-medios-1`: en la
 *  maqueta cada anillo es otra métrica con SU familia. Acá la familia es UNA
 *  sola y llega por prop, así que lo que varía entre anillos es el paso — y el
 *  orden sale del dibujo: al primero le da el 1 —el mismo que usa `PlotGauge`—
 *  y al segundo el 0. De ahí en adelante sube, que es lo único que el dibujo no
 *  decide. Lo que importa es que dos anillos vecinos no compartan tono. */
function stepOfRing(i: number): FamilyStep {
  if (i === 0) return 1
  if (i === 1) return 0
  return (i % 5) as FamilyStep
}

export type Ring = {
  /** Clave de React. */
  k: string
  /** El rótulo en mayúsculas debajo del anillo · «ningún número desnudo».
   *  Sale del payload; el plot no lo redacta. */
  label: string
  /** Lo logrado y contra qué. El plot divide; no inventa el denominador. */
  value: number
  max: number
}

/** El porcentaje contra el objetivo, redondeado. Se redondea ACÁ y se formatea
 *  después: el locale lo decide quien inyecta `format`. */
const percentOf = (r: Ring) => (r.max <= 0 ? 0 : Math.round((r.value / r.max) * 100))

/** Vueltas del arco de valor. El tope de 1 es GEOMÉTRICO —un arco no da más de
 *  una vuelta— y no se le aplica a la cifra: un 200% se llena y lo dice. */
const turnsOf = (r: Ring) => (r.max <= 0 ? 0 : Math.min(1, r.value / r.max / HEADROOM))

export function PlotRings({
  rings,
  family,
  format,
}: Pick<PlotProps<'escalar'>, 'family' | 'format'> & { rings: readonly Ring[] }) {
  const { ref, w, h } = useSize()

  const cellW = rings.length === 0 ? 0 : w / rings.length
  const cy = (h - LABEL_BAND) / 2
  const rOuter = Math.max(0, Math.min((cellW * FILL_OF_CELL) / 2, cy))
  const thickness = Math.max(4, rOuter * THICKNESS_RATIO)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && rings.length > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={rings
            .map((r) => `${r.label.toUpperCase()} ${format(percentOf(r))}% de su objetivo`)
            .join(' · ')}
        >
          {rings.map((r, i) => {
            const cx = cellW * (i + 0.5)
            return (
              <g key={r.k}>
                {/* El riel dice cuánto FALTA, no solo cuánto hay. */}
                <path
                  d={arcPath(cx, cy, rOuter, rOuter - thickness, 0, 1)}
                  fill="var(--color-c-grid)"
                />
                <Arc
                  cx={cx}
                  cy={cy}
                  radius={rOuter}
                  thickness={thickness}
                  family={family}
                  totalSweep={1}
                  from={0}
                  segments={[
                    {
                      k: r.k,
                      fraction: turnsOf(r),
                      step: stepOfRing(i),
                    },
                  ]}
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: Math.max(11, rOuter * FIGURE_RATIO),
                    letterSpacing: 'var(--tracking-titulo)',
                    fill: 'var(--color-ink)',
                  }}
                >
                  {format(percentOf(r))}%
                </text>
                <text
                  x={cx}
                  y={Math.min(cy + rOuter + 20, h - 4)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-nota)',
                    letterSpacing: 'var(--tracking-rotulo)',
                    fill: 'var(--color-dim)',
                  }}
                >
                  {r.label.toUpperCase()}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
