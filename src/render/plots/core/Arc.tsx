/** Arcos sobre una circunferencia · gauge, dona, anillos, barras radiales · F1.13a
 *
 *  **Es la única primitiva no cartesiana.** `Series` dibuja línea, área, barra y
 *  punto: las cuatro sobre dos ejes. Un arco no se compone de ninguna, porque su
 *  geometría es polar — el ángulo es el dato y el radio es constante, al revés
 *  que en una barra.
 *
 *  Cubre `gauge`, `donut`, `rings` y `radial`. Treemap, funnel, sankey y network
 *  son de partición y de grafo, y siguen sin primitiva.
 */
import { arcPath, placeSegments } from './arcPath'
import { hue } from './seriesColor'

export type ArcSegment = {
  k: string
  /** Fracción de la vuelta que ocupa este tramo. */
  fraction: number
  step?: 0 | 1 | 2 | 3 | 4
}

export function Arc({
  cx,
  cy,
  radius,
  thickness,
  segments,
  family,
  /** Cuánto de la circunferencia se usa. 1 es dona, 0.75 es medidor. */
  totalSweep = 1,
  /** Desde dónde arranca, en vueltas. */
  from = 0,
}: {
  cx: number
  cy: number
  radius: number
  thickness: number
  segments: readonly ArcSegment[]
  family: string
  totalSweep?: number
  from?: number
}) {
  const placed = placeSegments(
    segments.map((s) => s.fraction),
    from,
    totalSweep,
  )

  return (
    <g>
      {segments.map((s, i) => {
        const span = placed[i]
        if (span === undefined) return null
        return (
          <path
            key={s.k}
            d={arcPath(cx, cy, radius, radius - thickness, span.start, span.end)}
            fill={hue({ family, step: s.step ?? ((i % 5) as 0 | 1 | 2 | 3 | 4) })}
          />
        )
      })}
    </g>
  )
}

/** El riel de fondo de un medidor: el arco completo en un wash, para que se vea
 *  **cuánto falta** y no solo cuánto hay. */
export function ArcRail({
  cx,
  cy,
  radius,
  thickness,
  totalSweep = 1,
  from = 0,
}: {
  cx: number
  cy: number
  radius: number
  thickness: number
  totalSweep?: number
  from?: number
}) {
  return (
    <path
      d={arcPath(cx, cy, radius, radius - thickness, from, from + totalSweep)}
      fill="var(--color-w2)"
    />
  )
}
