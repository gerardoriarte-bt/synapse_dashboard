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
import { LoadingState } from '../../render/states/LoadingState'
import { EmptyState } from '../../render/states/EmptyState'
import { Label } from '../../render/primitives/Label'
import { bodyFor } from '../../render/bodies/registry'
import { hasValue } from '../../render/state'
import type { Formatter } from '../../render/format'
import type { Metric, PanelConfig, Payload } from '../../api/types'
import type { PlotProblem } from '../../catalog/plots'

type Props = {
  panel: PanelConfig
  metric: Metric
  payload: Payload
  /** Por qué el gráfico pedido NO puede dibujar este valor · F1.31.
   *
   *  **Llega resuelto y no se calcula acá**, igual que `params`: la tabla del
   *  repertorio viene de `/config/plots`, que es otra consulta, y juntarla con
   *  el layout acá acoplaría dos cachés con vidas distintas. Ausente significa
   *  que se puede dibujar. */
  plotProblem?: PlotProblem
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
  plotProblem,
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

    // ── EL REPERTORIO DECIDE ANTES QUE EL CUERPO · F1.31 ─────────────────
    //
    // **Un gráfico que no puede dibujar este valor no se dibuja mal: se
    // declara.** Es la regla que esta tarea existe para cerrar — hasta hoy un
    // `bars` con un ítem dibujaba una barra sola, que es una comparación de una
    // cosa contra nada y se ve perfecta.
    //
    // **La decisión llega resuelta**, igual que `paramsOf`: el contenedor tiene
    // la tabla —viene de `/config/plots`, otra consulta— y acá sólo se pinta.
    // Es lo que `api/params.ts` declara en su cabecera: un cuerpo no valida su
    // entrada, porque si validara tendría que decidir qué hacer cuando falla, y
    // **esa decisión es de la superficie**.
    //
    // **`indeterminado` NO llega hasta acá**: `invalidPlotReason` lo devuelve
    // para que se vea en desarrollo, y el contenedor no lo propaga. Apagar un
    // panel porque este build no sabe contar un sustantivo nuevo del repertorio
    // sería castigar al usuario por una deriva que no es suya.
    if (plotProblem !== undefined) {
      return (
        <EmptyState
          phrase={plotProblem.razon}
          detail={
            plotProblem.clase === 'tope'
              ? 'Elegí otro gráfico o recortá la lista'
              : 'Elegí otro gráfico o esperá a que haya más dato'
          }
        />
      )
    }

    const Body = bodyFor(panel.tipo)

    // Sin fallback silencioso · F1.22 y §1 principio 6: un cuerpo de otro tipo,
    // o una caja vacía, convierte un error de composición en una pantalla que
    // parece correcta.
    if (Body === undefined) {
      return <Label as="div">Sin cuerpo para el tipo «{panel.tipo}»</Label>
    }

    // **Los rótulos viajan con el DATO y no con el layout** · F1.40.
    //
    // `BodyProps.presentation` estaba declarada desde el port y NADIE la pasaba:
    // `KpiBody` leía `label`, `medidor` y `comparativo` de `params`, o sea del
    // layout. El contrato dice lo contrario y explica por qué — «el medidor
    // marca 61% este mes y otra cosa el siguiente».
    //
    // Con el servicio real dejó de ser teórico: el payload trae `presentation`
    // completa —medidor al 61%, dos comparativos, el label «USD · TOTAL»— y la
    // pantalla mostraba la cifra sola.
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
          // **Del LAYOUT, no del dato** · 2026-09-28. Qué gráfico se dibuja es
          // una decisión de composición: la misma métrica puede verse como
          // serie con banda en una pestaña y como barra de rango en otra. Por
          // eso sale de `panel`, que es el layout, y no de `payload`.
          {...(panel.grafico === undefined ? {} : { grafico: panel.grafico })}
          metric={metric.nombre}
          format={format}
          {...(metric.unidad == null ? {} : { unit: metric.unidad })}
          {...(payload.presentacion === undefined ? {} : { presentation: payload.presentacion })}
        />
      </Suspense>
    )
  }
}
