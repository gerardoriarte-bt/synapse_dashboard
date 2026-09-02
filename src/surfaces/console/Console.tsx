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
import { gridStyle, readingOrder } from '../../render/grid'
import { useColumns } from '../../render/useColumns'
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
  /** Los params YA validados · F1.29. La superficie no los lee: solo los pasa.
   *  Quien valida es el adaptador de `api/`. */
  paramsOf: (panelId: string) => Record<string, unknown>
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
  paramsOf,
  format,
  onSelectTab,
  onSelectPeriod,
  onChangeTheme,
  onRetryPanels,
}: Props) {
  // El colapso · F1.30. No lo puede hacer solo el CSS: el `colSpan` viaja en un
  // estilo en línea y una media query no lo alcanza.
  const columns = useColumns()

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

      <div style={gridStyle(columns)}>
        {/* Con la grilla colapsada el orden visual ES el orden del DOM, así que
            se ordena de verdad · §ANCLA:RESP-3. A doce columnas el orden lo fija
            `colStart` en el estilo y esto no cambia nada. */}
        {readingOrder(panels).map((panel) => {
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
              params={paramsOf(panel.id)}
              columns={columns}
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
