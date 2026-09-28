/** `forecast` · formas `escalarConIntervalo` y `serieConBanda` · colSpan 4–6 · F1.13g
 *
 *  **El intervalo se muestra SIEMPRE.** Regla dura 6: una estimación puntual sin
 *  banda no se publica. Con `escalarConIntervalo` no hay serie que dibujar, así
 *  que el intervalo va en texto — pero va.
 */
import { Label } from '../primitives/Label'
import { Value } from '../primitives/Value'
import { PlotForecast } from '../plots/PlotForecast'
import { PlotControl } from '../plots/PlotControl'
import { PlotInterval } from '../plots/PlotInterval'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar, por forma.
 *
 *  **La lista es por FORMA y no por cuerpo**, y no es un detalle: `forecast` y
 *  `interval` sirven a las dos formas en §5, pero lo que se dibuja es distinto
 *  —una serie con banda contra una barra de rango— y pedir `control` sobre un
 *  escalar no tiene qué dibujar.
 *
 *  Lo que NO está acá se declara, no se sustituye. */
const DIBUJA = {
  escalarConIntervalo: ['interval'],
  serieConBanda: ['forecast', 'control'],
} as const

export type ForecastParams = {
  horizonte?: string
  /** Cuántos puntos son observados; el resto es proyección. */
  corte?: number
}

const PERCENT = 100

export function ForecastBody({
  value,
  params,
  family,
  grafico,
  unit,
  format,
}: BodyProps<'escalarConIntervalo' | 'serieConBanda', ForecastParams>) {
  const level = `Intervalo ${Math.round(value.nivel * PERCENT)}%`

  // **Se comprueba antes de dibujar y no dentro de cada rama.** Si se resolviera
  // abajo, un `grafico` desconocido tendría que acordarse de no caer al de por
  // defecto en cada rama nueva — y la que se olvide se ve bien.
  const conocidos: readonly string[] = DIBUJA[value.forma]
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  if (value.forma === 'escalarConIntervalo') {
    const figure = format.number(value.v, { abbreviate: true })
    return (
      <div className="h-full min-h-0 flex flex-col gap-2">
        <Value label="Estimado" size="kpi">
          {format.withUnit(figure, unit)}
        </Value>
        {/* **La barra es opcional y el texto no.** Regla dura 6: el intervalo se
            muestra siempre, así que los extremos van en texto haya dibujo o no —
            si la barra fuera la única portadora, un panel sin `grafico` volvería
            a la cifra desnuda. */}
        {grafico === 'interval' && (
          <div className="h-5 shrink-0">
            <PlotInterval lo={value.lo} hi={value.hi} family={family} />
          </div>
        )}
        {/* Los extremos van SIN abreviar: un intervalo de «4.2M – 4.3M» esconde
            cuánto mide, que es justamente lo que el intervalo comunica. */}
        <Label>{`${level} · ${format.number(value.lo)} – ${format.number(value.hi)}`}</Label>
        {params.horizonte !== undefined && <Label>{`Horizonte · ${params.horizonte}`}</Label>}
      </div>
    )
  }

  if (grafico === 'control') {
    return (
      <div className="h-full min-h-0 flex flex-col gap-2">
        <PlotControl
          points={value.puntos}
          family={family}
          format={(v) => format.number(v, { abbreviate: true })}
        />
        {/* La carta de control declara sus LÍMITES, no su nivel de confianza:
            es lo que el `.pen` rotula —«LÍMITE SUPERIOR 1.44%»— y lo que el
            lector necesita para leer un punto que se sale. */}
        <Label>{`Límites · ${format.number(value.puntos[0]?.lo ?? 0)} – ${format.number(value.puntos[0]?.hi ?? 0)}`}</Label>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <PlotForecast
        points={value.puntos}
        family={family}
        format={(v) => format.number(v, { abbreviate: true })}
        {...(params.corte === undefined ? {} : { cut: params.corte })}
      />
      <Label>{level}</Label>
    </div>
  )
}
