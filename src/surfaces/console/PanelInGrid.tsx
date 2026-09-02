/** El puente entre el layout y el panel · F1.9
 *
 *  Recibe `panel` + `metric` + `payload` y decide qué va en el slot. **El shell
 *  va siempre**: es la garantía de §5.2, y acá está por construcción.
 *
 *  Vive en `surfaces/` y no en `render/` porque resuelve el registro, que carga
 *  chunks — o sea que toca el mundo. `render/Panel` sigue siendo puro: recibe el
 *  cuerpo ya resuelto por `children`.
 */
import { Suspense } from 'react'
import { Panel } from '../../render/Panel/Panel'
import { LoadingState } from '../../render/states/States'
import { Label } from '../../render/primitives/Label'
import { bodyFor } from '../../render/bodies/registry'
import { hasValue } from '../../render/state'
import type { Formatter } from '../../render/format'
import type { Metric, PanelConfig, Payload } from '../../api/types'

type Props = {
  panel: PanelConfig
  metric: Metric
  payload: Payload
  /** Ya validados por `adaptPanelParams` · F1.29. **No se leen de
   *  `panel.opciones`**: eso sería saltearse la validación, que es justo el
   *  defecto que la tarea arregla. */
  params: Record<string, unknown>
  columns?: number
  format: Formatter
  now: Date
  /** Los tres suben a la superficie. **El cuerpo no navega ni abre modales por
   *  su cuenta** · §4 regla 11: el panel declara qué pasó y quien decide qué
   *  hacer es quien conoce el routing. */
  onDrill?: () => void
  onChat?: () => void
  onRetry?: () => void
}

export function PanelInGrid({
  panel,
  metric,
  payload,
  params,
  columns,
  format,
  now,
  onDrill,
  onChat,
  onRetry,
}: Props) {
  return (
    <Panel
      metric={metric}
      payload={payload}
      placement={panel}
      {...(columns === undefined ? {} : { columns })}
      format={format}
      now={now}
      {...(onDrill === undefined ? {} : { onDrill })}
      {...(onChat === undefined ? {} : { onChat })}
      {...(onRetry === undefined ? {} : { onRetry })}
    >
      {body()}
    </Panel>
  )

  function body() {
    // `Panel` ya decidió que va un estado si no hay cifra, así que esto solo se
    // evalúa en DISPONIBLE y DEGRADADO. La guarda es para el compilador.
    if (!hasValue(payload)) return null

    const Body = bodyFor(panel.tipo)

    // Sin fallback silencioso · F1.22 y §1 principio 6: un cuerpo de otro tipo,
    // o una caja vacía, convierte un error de composición en una pantalla que
    // parece correcta.
    if (Body === undefined) {
      return <Label as="div">Sin cuerpo para el tipo «{panel.tipo}»</Label>
    }

    return (
      // EL MISMO ESQUELETO que el estado de carga, y no `null`. Para quien mira,
      // un chunk en vuelo y un dato en vuelo son indistinguibles: si el chunk
      // dejara el cuerpo vacío en vez de en esqueleto, un panel se vería roto
      // durante la descarga y otro cargando, por una diferencia que es interna.
      <Suspense fallback={<LoadingState />}>
        <Body
          value={payload.valor}
          params={params}
          span={panel}
          family={metric.familia}
          metric={metric.nombre}
          format={format}
          {...(metric.unidad == null ? {} : { unit: metric.unidad })}
        />
      </Suspense>
    )
  }
}
