/** Un panel del builder, dibujado como lo verá el cliente · 2026-10-07
 *
 *  Decisión humana del 2026-10-07 (D1 de
 *  `docs/AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`): «no hay una
 *  previsualización del gráfico, entonces es como construir de memoria». Lo
 *  usan el lienzo, la vista previa y el selector de gráfico.
 *
 *  **Es el mismo `PanelInGrid` de la consola, con la misma resolución**
 *  —`resolverPanel.ts`—, así que lo que se ve acá es lo que se ve allá. Sin
 *  callbacks: «un CTA sin manejador no se pinta», y en el builder ni «ver
 *  detalle» ni «preguntar» tienen a dónde ir.
 *
 *  **Lo que NO hace es inventar un dato.** Sin payload no hay un `CARGANDO`
 *  que no está cargando ni un valor de muestra: se dice por qué todavía no se
 *  dibuja.
 */
import { PanelInGrid } from '../console/PanelInGrid'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { conParams, problemaDeGrafico } from '../resolverPanel'
import type { PlotTable } from '../../catalog/plots'
import type { Formatter } from '../../render/format'
import type { Block, Metric, PanelConfig, Payload } from '../../api/types'

type Props = {
  panel: PanelConfig
  metrica: Metric | undefined
  /** `undefined` es «todavía no hay dato para esto» · ver `sinDato`. */
  payload: Payload | undefined
  /** Por qué no hay dato, en palabras · «Se dibuja al guardar». */
  sinDato: string
  bloques: readonly Block[] | undefined
  repertorio: PlotTable
  format: Formatter
  now: Date
}

export function PanelConDato({ panel, metrica, payload, sinDato, bloques, repertorio, format, now }: Props) {
  if (metrica === undefined) {
    return (
      <div className="flex h-full flex-col justify-center gap-1 rounded-xl border border-dashed border-w4 p-6">
        <Label as="div">Sin métrica</Label>
        <Ayuda>Elegí qué muestra este panel para verlo dibujado.</Ayuda>
      </div>
    )
  }
  if (payload === undefined) {
    return (
      <div className="flex h-full flex-col justify-center gap-1 rounded-xl border border-dashed border-w4 p-6">
        <span className="font-body text-cuerpo font-medium text-ink">{metrica.nombre}</span>
        <Ayuda>{sinDato}</Ayuda>
      </div>
    )
  }
  const { payload: resuelto, params } = conParams(panel, payload, bloques)
  const problema = problemaDeGrafico(repertorio, panel, resuelto)
  return (
    <PanelInGrid
      panel={panel}
      metric={metrica}
      payload={resuelto}
      params={params}
      format={format}
      now={now}
      {...(problema === undefined ? {} : { plotProblem: problema })}
    />
  )
}
