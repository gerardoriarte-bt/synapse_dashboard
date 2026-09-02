/** `forecast` · formas `escalarConIntervalo` y `serieConBanda` · colSpan 4–6 · F1.13g
 *
 *  **El intervalo se muestra SIEMPRE.** Regla dura 6: una estimación puntual sin
 *  banda no se publica. Con `escalarConIntervalo` no hay serie que dibujar, así
 *  que el intervalo va en texto — pero va.
 */
import { Label } from '../primitives/Label'
import { Value } from '../primitives/Value'
import { PlotForecast } from '../plots/PlotForecast'
import type { BodyProps } from '../types'

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
  unit,
  format,
}: BodyProps<'escalarConIntervalo' | 'serieConBanda', ForecastParams>) {
  const level = `Intervalo ${Math.round(value.nivel * PERCENT)}%`

  if (value.forma === 'escalarConIntervalo') {
    const figure = format.number(value.v, { abbreviate: true })
    return (
      <div className="h-full min-h-0 flex flex-col gap-2">
        <Value label="Estimado" size="kpi">
          {format.withUnit(figure, unit)}
        </Value>
        {/* Los extremos van SIN abreviar: un intervalo de «4.2M – 4.3M» esconde
            cuánto mide, que es justamente lo que el intervalo comunica. */}
        <Label>{`${level} · ${format.number(value.lo)} – ${format.number(value.hi)}`}</Label>
        {params.horizonte !== undefined && <Label>{`Horizonte · ${params.horizonte}`}</Label>}
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
