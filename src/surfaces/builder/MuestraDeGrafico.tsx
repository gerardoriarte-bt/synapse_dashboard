/** Un gráfico del repertorio, dibujado con el DATO del panel · 2026-10-07
 *
 *  §7.2 pide que B3 muestre «los gráficos del grupo **con preview real**», y
 *  `PlotPicker` lo declaraba imposible: «lo que falta para montar el plot real
 *  es el **espécimen**: un valor de muestra por forma, que no lo declara ni el
 *  contrato ni `/config/plots`. Inventarlo acá sería meter cifras fabricadas».
 *
 *  **El espécimen es el dato real de la métrica del panel**, que el preview con
 *  `include=payloads` trae desde `d9147c3`. No es una muestra: es lo que el
 *  cliente va a ver, dibujado de cada forma posible. Ver
 *  `docs/AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`.
 *
 *  **El cuerpo sin el marco del panel**: en una columna angosta, título y estado
 *  repetidos en cada opción serían ruido —el marco ya se ve en el lienzo—.
 *  **La BASE y la procedencia SÍ van**, abajo y en chico: es la regla dura 5 y
 *  `design-lint` la hace cumplir —una cifra no viaja sin su base—, con la misma
 *  forma que `ChatFigure`, que tampoco puede usar el marco.
 */
import { Suspense } from 'react'
import { bodyFor } from '../../render/bodies/registry'
import { LoadingState } from '../../render/states/LoadingState'
import { hasValue, resolveGovernance } from '../../render/state'
import { Label } from '../../render/primitives/Label'
import { Provenance } from '../../render/Panel/Provenance'
import type { Formatter } from '../../render/format'
import type { ChartId } from '../../catalog/types'
import type { Metric, PanelType, Payload } from '../../api/types'

type Props = {
  tipo: string
  grafico: ChartId | undefined
  metrica: Metric
  payload: Payload
  format: Formatter
  now: Date
}

export function MuestraDeGrafico({ tipo, grafico, metrica, payload, format, now }: Props) {
  const Body = bodyFor(tipo as PanelType)
  if (Body === undefined || !hasValue(payload)) return null
  const gobierno = resolveGovernance(metrica, payload)
  return (
    <div className="flex flex-col gap-1">
      {/* Sin eventos: es una muestra, apretarla elige la opción. */}
      <div aria-hidden className="pointer-events-none h-36 overflow-hidden">
        <Suspense fallback={<LoadingState />}>
          <Body
            value={payload.valor}
            params={{}}
            // El tamaño de un panel mediano del tipo: los cuerpos deciden por el
            // span qué muestran —un KPI de 3 columnas no lleva comparativos—.
            span={{ colStart: 1, colSpan: 4, rowSpan: 3 }}
            family={metrica.familia}
            {...(grafico === undefined ? {} : { grafico })}
            metric={metrica.nombre}
            format={format}
            {...(metrica.unidad == null ? {} : { unit: metrica.unidad })}
            {...(payload.presentacion === undefined ? {} : { presentation: payload.presentacion })}
          />
        </Suspense>
      </div>
      <Label as="div">Base · {gobierno.base}</Label>
      <Provenance
        capa={gobierno.capa}
        fuente={gobierno.fuente}
        frescura={gobierno.frescura}
        format={format}
        now={now}
      />
    </div>
  )
}
