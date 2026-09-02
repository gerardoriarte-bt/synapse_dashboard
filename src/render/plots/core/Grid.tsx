/** La rejilla · F1.13a
 *
 *  Siempre en `c-grid`. Es el único token que un plot usa sin que se lo pasen:
 *  **la rejilla no es dato, es papel.** Por eso no lleva familia.
 */
import type { LinearScale } from './scale'

export function Grid({
  scale,
  orientation,
  length,
  count = 4,
}: {
  scale: LinearScale
  /** `vertical` dibuja líneas verticales (eje x); `horizontal`, horizontales. */
  orientation: 'vertical' | 'horizontal'
  length: number
  count?: number
}) {
  return (
    <g aria-hidden>
      {scale.ticks(count).map((v) => {
        const p = scale(v)
        return orientation === 'vertical' ? (
          <line
            key={v}
            x1={p}
            x2={p}
            y1={0}
            y2={length}
            stroke="var(--color-c-grid)"
            strokeWidth={1}
          />
        ) : (
          <line
            key={v}
            x1={0}
            x2={length}
            y1={p}
            y2={p}
            stroke="var(--color-c-grid)"
            strokeWidth={1}
          />
        )
      })}
    </g>
  )
}
