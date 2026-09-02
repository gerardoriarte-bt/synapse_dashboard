/** C1 · el dashboard · F1.5
 *
 *  LA PANTALLA NO ESTÁ ESCRITA. Se recorre lo que llegó de `/config/tabs/{id}` y
 *  cada celda se resuelve contra el catálogo. Ningún panel, métrica ni posición
 *  aparece literal en este archivo.
 *
 *  **Sin un solo hook de datos** · F1.6. Todo llega por props, así que este
 *  componente se puede montar con datos fijos en el builder y en la vista previa
 *  por rol sin tocar la red. Quien hace fetch es `ConsoleContainer`.
 */
import { useLayoutEffect } from 'react'
import { Label } from '../../render/primitives/Label'
import { gridStyle } from '../../render/grid'
import { measureLayoutCommit, measureLayoutPainted } from '../../render/budget'
import { PanelInGrid } from './PanelInGrid'
import { Topbar } from './Topbar'
import type { Formatter } from '../../render/format'
import type { Theme } from '../../tokens/theme'
import type { AppContext, Metric, PanelConfig, Payload, Tab } from '../../api/types'

type Props = {
  context: AppContext
  activeTab: Tab | undefined
  activePeriodId: string | undefined
  panels: readonly PanelConfig[]
  metricsById: ReadonlyMap<string, Metric>
  payloadOf: (panelId: string) => Payload
  format: Formatter
  onSelectTab: (id: string) => void
  onSelectPeriod: (id: string) => void
  onChangeTheme?: (theme: Theme) => void
  onRetryPanels?: () => void
}

export function Console({
  context,
  activeTab,
  activePeriodId,
  panels,
  metricsById,
  payloadOf,
  format,
  onSelectTab,
  onSelectPeriod,
  onChangeTheme,
  onRetryPanels,
}: Props) {
  // Un solo `now` para toda la pantalla. Si cada panel llamara a `new Date()`,
  // dos paneles del mismo lote podrían escribir frescuras distintas para la
  // misma corrida del feed.
  const now = new Date()

  const tabMetrics = panels
    .map((p) => metricsById.get(p.metricId))
    .filter((m): m is Metric => m !== undefined)

  // El presupuesto de §8 · F1.13j. `useLayoutEffect` corre después de que React
  // escribió el DOM y antes de que el navegador pinte: es exactamente el commit.
  // El pintado se mide un frame más tarde, desde adentro.
  const layoutKey = panels.map((p) => p.id).join(',')
  useLayoutEffect(() => {
    measureLayoutCommit()
    measureLayoutPainted()
  }, [layoutKey])

  return (
    <main className="min-h-screen bg-bg p-6">
      <Topbar
        context={context}
        activeTab={activeTab}
        activePeriodId={activePeriodId}
        tabMetrics={tabMetrics}
        onSelectTab={onSelectTab}
        onSelectPeriod={onSelectPeriod}
        {...(onChangeTheme === undefined ? {} : { onChangeTheme })}
      />

      <div style={gridStyle()}>
        {panels.map((panel) => {
          const metric = metricsById.get(panel.metricId)

          // Un `metricId` que el catálogo no resuelve NO se pinta con un
          // fallback silencioso: el catálogo llega ya filtrado por rol, así que
          // una métrica ausente significa que el layout referencia algo que este
          // rol no puede ver. Es un error del backend, no una celda vacía.
          if (metric === undefined) {
            return (
              <section key={panel.id} className="rounded-xl bg-panel border border-w4 p-6">
                <Label as="div">Métrica no resuelta · {panel.metricId}</Label>
              </section>
            )
          }

          return (
            <PanelInGrid
              key={panel.id}
              panel={panel}
              metric={metric}
              payload={payloadOf(panel.id)}
              format={format}
              now={now}
              {...(onRetryPanels === undefined ? {} : { onRetry: onRetryPanels })}
            />
          )
        })}
      </div>
    </main>
  )
}
