/** El panel completo: shell + el estado que le toca · F1.13e
 *
 *  **Acá está la garantía de §5.2 hecha código.** El `switch` decide qué va en
 *  el slot del cuerpo, y el shell queda intacto en las siete ramas: título,
 *  BASE, procedencia y dirección siguen visibles mientras el panel carga, falla,
 *  está bloqueado o no tiene permiso.
 *
 *  El cuerpo llega por `children` y no se importa: es lo que permite que el
 *  mismo panel sirva en la consola, en el builder y en la vista previa por rol
 *  sin una rama, y lo que mantiene a `render/Panel/` sin saber qué es un
 *  `PanelType`. Quién resuelve `tipo → cuerpo` es el registro · F1.13h.
 */
import type { ReactNode } from 'react'
import { PanelShell } from './PanelShell'
import { BlockedState, EmptyState, ErrorState, ForbiddenState, LoadingState } from '../states/States'
import { visualState } from '../state'
import type { Formatter } from '../format'
import type { Placement } from '../../catalog/types'
import type { Metric, Payload } from '../../api/types'

type Props = {
  metric: Metric
  payload: Payload
  placement: Placement
  columns?: number
  format: Formatter
  now: Date
  onDrill?: () => void
  onChat?: () => void
  onCollapse?: () => void
  onRetry?: () => void
  onUnblock?: () => void
  onRequestAccess?: () => void
  /** El cuerpo ya resuelto. Solo se pinta en DISPONIBLE y DEGRADADO — los dos
   *  estados que tienen cifra. */
  children: ReactNode
}

export function Panel({
  metric,
  payload,
  placement,
  columns,
  format,
  now,
  onDrill,
  onChat,
  onCollapse,
  onRetry,
  onUnblock,
  onRequestAccess,
  children,
}: Props) {
  return (
    <PanelShell
      metric={metric}
      payload={payload}
      placement={placement}
      {...(columns === undefined ? {} : { columns })}
      format={format}
      now={now}
      {...(onDrill === undefined ? {} : { onDrill })}
      {...(onChat === undefined ? {} : { onChat })}
      {...(onCollapse === undefined ? {} : { onCollapse })}
    >
      {body()}
    </PanelShell>
  )

  function body() {
    // VACIO se decide primero porque es el único estado DERIVADO: el backend
    // manda DISPONIBLE y el front distingue el que trae datos del que no.
    if (visualState(payload) === 'VACIO') {
      // SIN repetir la BASE: el shell ya la declara arriba, y duplicarla es el
      // mismo ruido que `BodyProps.metric` prohíbe para el título. Lo que el
      // vacío agrega es que la ausencia es del PERÍODO, no de la métrica —que
      // es la diferencia entre «cambiá el período» y «esta métrica no existe».
      return (
        <EmptyState
          phrase={`No hay datos de ${metric.nombre.toLowerCase()} en este período.`}
          detail={`Ventana · ${metric.ventana}`}
        />
      )
    }

    // El resto sale del payload, que narrowa solo por `estado`. El `switch` es
    // exhaustivo: agregar un estado al contrato deja de compilar hasta que
    // alguien decida qué se pinta. Un `default` silencioso es cómo un estado
    // nuevo termina renderizando el cuerpo de otro.
    switch (payload.estado) {
      case 'CARGANDO':
        return <LoadingState />

      case 'BLOQUEADO':
        return (
          <BlockedState
            reason={payload.razon}
            unblockedBy={payload.desbloqueaCon}
            {...(onUnblock === undefined ? {} : { onUnblock })}
          />
        )

      case 'SIN_PERMISO':
        return (
          <ForbiddenState
            requestTo={payload.solicitarA}
            {...(onRequestAccess === undefined ? {} : { onRequest: onRequestAccess })}
          />
        )

      case 'ERROR':
        return (
          <ErrorState
            message={payload.mensaje}
            {...(onRetry === undefined ? {} : { onRetry })}
          />
        )

      case 'DISPONIBLE':
      case 'DEGRADADO':
        return children
    }
  }
}
