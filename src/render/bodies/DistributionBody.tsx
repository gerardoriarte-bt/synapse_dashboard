/** `distribution` · forma `distribucion` · colSpan 5–8, rowSpan 4–5 · F1.13g */
import { PlotDistribution } from '../plots/PlotDistribution'
import type { BodyProps } from '../types'

export type DistributionParams = { bins?: number }

export function DistributionBody({
  value,
  family,
  format,
}: BodyProps<'distribucion', DistributionParams>) {
  return (
    <div className="h-full min-h-0">
      <PlotDistribution
        cuts={value.cortes}
        family={family}
        format={(v) => format.number(v, { abbreviate: true })}
      />
    </div>
  )
}
