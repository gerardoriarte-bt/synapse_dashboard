/** Las cuatro marcas cartesianas · F1.13a
 *
 *  Línea, área, barra y punto. Todo lo que se dibuja sobre dos ejes sale de
 *  alguna de las cuatro; lo que no —el arco— vive en `Arc.tsx`, y no por gusto:
 *  su geometría es polar y no se compone de ninguna de estas.
 */
import { hue } from './seriesColor'
import type { SeriesColor } from './seriesColor'
import type { BandScale, LinearScale } from './scale'

/** §2 fija 2px, que es `r-xs`. En SVG el radio va como número y el token no
 *  sirve, así que el valor se repite acá. Es el único lugar donde vive. */
const BAR_RADIUS = 2

/** **El color SIEMPRE llega por `family` y el escalón por `step`.** Un plot no
 *  tiene paleta ni sabe qué familia le tocó: la asignación vive en el catálogo,
 *  que es lo que sostiene la persistencia cromática de §2.2 y la regla dura 1
 *  por construcción y no por disciplina. */
export type PointXY = { x: number; y: number }

/** Barras y columnas. Una sola primitiva porque son la misma marca con los ejes
 *  cambiados, y tenerlas separadas es la fuente del primer duplicado en cada
 *  proyecto de gráficos. */
export function Bars({
  items,
  band,
  value,
  orientation,
  base,
  ...color
}: {
  items: readonly { k: string; v: number }[]
  /** Categorías sobre el eje transversal. */
  band: BandScale
  /** Valores sobre el eje de magnitud. */
  value: LinearScale
  orientation: 'horizontal' | 'vertical'
  /** El origen del que crecen: `value(0)`. Se pasa resuelto para que la
   *  primitiva no tenga que saber si el dominio empieza en cero. */
  base: number
} & SeriesColor) {
  return (
    <g>
      {items.map(({ k, v }) => {
        const p = value(v)
        const from = Math.min(p, base)
        const length = Math.abs(p - base)
        return orientation === 'horizontal' ? (
          <rect
            key={k}
            x={from}
            y={band(k)}
            width={length}
            height={band.bandwidth}
            rx={BAR_RADIUS}
            fill={hue(color)}
          />
        ) : (
          <rect
            key={k}
            x={band(k)}
            y={from}
            width={band.bandwidth}
            height={length}
            rx={BAR_RADIUS}
            fill={hue(color)}
          />
        )
      })}
    </g>
  )
}

export function Line({
  points,
  x,
  y,
  dashed = false,
  ...color
}: {
  points: readonly PointXY[]
  x: LinearScale
  y: LinearScale
  /** `stroke-dasharray` nativo. En el `.pen` los guiones eran subtrazos
   *  sintetizados porque Pencil no soporta la propiedad; en el navegador sí. */
  dashed?: boolean
} & SeriesColor) {
  if (points.length === 0) return null
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.x)},${y(p.y)}`).join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={hue(color)}
      strokeWidth={1.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      {...(dashed ? { strokeDasharray: '4 3' } : {})}
    />
  )
}

export function Area({
  points,
  x,
  y,
  base,
  ...color
}: {
  points: readonly PointXY[]
  x: LinearScale
  y: LinearScale
  base: number
} & SeriesColor) {
  if (points.length === 0) return null
  const line = points.map((p) => `${x(p.x)},${y(p.y)}`).join(' L')
  const first = points[0]
  const last = points[points.length - 1]
  if (first === undefined || last === undefined) return null
  return (
    <path
      d={`M${x(first.x)},${base} L${line} L${x(last.x)},${base} Z`}
      fill={hue(color)}
      fillOpacity={0.16}
    />
  )
}

/** Dispersión y burbujas. Es la cuarta marca y completa el juego cartesiano. */
export function Dots({
  points,
  x,
  y,
  ...color
}: {
  points: readonly { x: number; y: number; r?: number; k: string }[]
  x: LinearScale
  y: LinearScale
} & SeriesColor) {
  return (
    <g>
      {points.map((p) => (
        <circle
          key={p.k}
          cx={x(p.x)}
          cy={y(p.y)}
          r={p.r ?? 3.5}
          fill={hue(color)}
          // Una burbuja lleva opacidad porque se solapa con sus vecinas; un
          // punto de dispersión sin radio propio, no.
          fillOpacity={p.r === undefined ? 1 : 0.55}
        />
      ))}
    </g>
  )
}
