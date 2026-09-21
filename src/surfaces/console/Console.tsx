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
import { COLUMNS, gridStyle, readingOrder } from '../../render/grid'
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
  /** Por qué una métrica del catálogo NO se pudo adaptar · F1.35. Llega desde
   *  `adaptCatalog`, que las separa en vez de descartarlas: una métrica que
   *  desaparece sin decir por qué deja un panel que no dibuja y no explica. */
  rejectedMetrics?: ReadonlyMap<string, string>

  /** Los params YA validados · F1.29. La superficie no los lee: solo los pasa.
   *  Quien valida es el adaptador de `api/`. */
  paramsOf: (panelId: string) => Record<string, unknown>
  format: Formatter
  onSelectTab: (id: string) => void
  onSelectPeriod: (id: string) => void
  onChangeTheme?: (theme: Theme) => void
  /** Reintento de UN panel · F2.4. Lleva el `panelId` porque el reintento es
   *  de ese panel y no del batch: los otros ya cargaron bien. */
  onRetryPanel?: (panelId: string) => void
  /** «Preguntar» · F3.3. Lleva el `panelId` porque el contexto del chat es el
   *  panel desde el que se preguntó: `panel_context: {panel_id, period}`.
   *
   *  **Es un callback y no una navegación escrita acá**, igual que `onRetry`.
   *  `Console` no sabe si abre una hoja, una ruta o nada — quien decide el
   *  viaje es quien monta la consola, que en el builder y en la vista previa
   *  por rol no es el mismo. */
  onAskPanel?: (panelId: string) => void
}

export function Console({
  context,
  activeTab,
  activePeriodId,
  panels,
  metricsById,
  payloadOf,
  paramsOf,
  rejectedMetrics,
  format,
  onSelectTab,
  onSelectPeriod,
  onChangeTheme,
  onRetryPanel,
  onAskPanel,
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
        {/* **Se reordena SOLO con la grilla colapsada** · §ANCLA:RESP-3, que lo
            pide «por debajo de 768px a 1 columna». Ahí el orden visual ES el
            orden del DOM y hay que ordenar de verdad.

            **A doce columnas reordenar ROMPE la composición, y acá decía lo
            contrario.** Medido en el navegador el 2026-09-16 sobre el layout
            publicado: `readingOrder` ordena por `colStart` globalmente, así que
            el DOM quedaba `prosa(1/12) · kpi(1/3) · bars(1/6) · series(1/6) ·
            tabla(1/7)` y recién después los de `colStart` 4, 7 y 10. CSS grid
            coloca en el orden del DOM con un cursor que **no retrocede** —sin
            `dense`—, así que el kpi de la columna 4 ya no entraba en la fila del
            de la columna 1 y bajaba. El dashboard se veía apilado en una
            columna con doce paneles bien compuestos detrás.

            **El orden del arreglo ES la fila**, porque `PanelConfigurado` no
            declara `rowStart`: ordenarlo por `colStart` borra la única
            información de fila que existe. */}
        {(columns === COLUMNS ? panels : readingOrder(panels)).map((panel) => {
          const metric = metricsById.get(panel.metricId)

          // Un `metricId` que el catálogo no resuelve NO se pinta con un
          // fallback silencioso: el catálogo llega ya filtrado por rol, así que
          // una métrica ausente significa que el layout referencia algo que este
          // rol no puede ver. Es un error del backend, no una celda vacía.
          //
          // **Y desde F1.35 dice POR QUÉ cuando se sabe.** El adaptador rechaza
          // las métricas con una forma, familia o capa que no están en el
          // contrato, y esas no son «no resueltas»: son conocidas y no se pueden
          // dibujar. «No resuelta» a secas mandaba a buscar un problema de
          // permisos donde había un valor fuera del enumerado.
          if (metric === undefined) {
            const razon = rejectedMetrics?.get(panel.metricId)
            return (
              <section key={panel.id} className="rounded-xl bg-panel border border-w4 p-6">
                <Label as="div">
                  {razon === undefined
                    ? `Métrica no resuelta · ${panel.metricId}`
                    : `Métrica no dibujable · ${razon}`}
                </Label>
              </section>
            )
          }

          // **Sin manejador NO se pinta el botón** · la regla del CTA muerto. El
          // shell ya la aplica sobre `onChat`, y acá se sostiene hacia arriba:
          // el builder monta esta misma consola sin `onAskPanel`, y ahí
          // «Preguntar» no aparece en vez de aparecer y no hacer nada.
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
              {...(onRetryPanel === undefined ? {} : { onRetry: () => onRetryPanel(panel.id) })}
              {...(onAskPanel === undefined ? {} : { onChat: () => onAskPanel(panel.id) })}
            />
          )
        })}
      </div>
    </main>
  )
}
