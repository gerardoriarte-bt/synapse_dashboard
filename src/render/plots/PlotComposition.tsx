/** Composición · una barra apilada al 100% · F1.13f
 *
 *  **Los escalones salen de la familia, no de una paleta.** Una composición
 *  necesita distinguir partes entre sí, y la rampa `fam-x-0..4` existe para eso:
 *  cinco escalones del mismo hue. Por eso una composición de más de cinco partes
 *  se agrupa en «otros» antes de dibujarse — no por estética, sino porque no hay
 *  un sexto escalón que no repita uno anterior.
 */
import { useSize } from './core/useSize'
import { hue } from './core/seriesColor'
import { AxisText } from './core/Axis'
import { charsThatFit } from './core/axisGeometry'
import { stack } from './core/stack'
import type { Family } from '../../catalog/types'

export type Part = { etiqueta: string; v: number; porcentaje: number }

const BAR_HEIGHT = 28
const LEGEND_STEP = 20
const MAX_PARTS = 5

export function PlotComposition({
  parts,
  family,
  format,
}: {
  parts: readonly Part[]
  family: Family
  format: (v: number) => string
}) {
  const { ref, w, h } = useSize()

  // La misma suma prefija que usa `<Arc>`: un arco de dona y una barra apilada
  // al 100% reparten igual.
  const visible = parts.slice(0, MAX_PARTS)
  const spans = stack(visible.map((p) => p.porcentaje))
  const stacked = visible.map((p, i) => ({
    ...p,
    from: spans[i]?.start ?? 0,
    step: (i % MAX_PARTS) as 0 | 1 | 2 | 3 | 4,
  }))

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && (
        <svg width={w} height={h} role="img" aria-label={`${stacked.length} partes`}>
          {stacked.map((t) => (
            <rect
              key={t.etiqueta}
              x={(t.from / 100) * w}
              y={0}
              // −2 deja el aire entre tramos. Con `Math.max(0, …)` una parte de
              // porcentaje diminuto no produce un ancho negativo, que en SVG
              // hace desaparecer el rect entero sin avisar.
              width={Math.max(0, (t.porcentaje / 100) * w - 2)}
              height={BAR_HEIGHT}
              rx={2}
              fill={hue({ family, step: t.step })}
            />
          ))}

          {/* La leyenda es parte del plot y no del cuerpo: sin ella la barra es
              una franja de colores sin significado. */}
          {stacked.map((t, i) => {
            const y = BAR_HEIGHT + 22 + i * LEGEND_STEP
            if (y > h) return null
            const cap = charsThatFit(w * 0.5)
            const label =
              t.etiqueta.length > cap ? `${t.etiqueta.slice(0, cap - 1)}…` : t.etiqueta
            return (
              <g key={`l-${t.etiqueta}`}>
                <rect x={0} y={y - 5} width={8} height={8} rx={2} fill={hue({ family, step: t.step })} />
                <AxisText x={14} y={y} anchor="start">
                  {label}
                </AxisText>
                <AxisText x={w} y={y} anchor="end">
                  {`${format(t.porcentaje)}%`}
                </AxisText>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
