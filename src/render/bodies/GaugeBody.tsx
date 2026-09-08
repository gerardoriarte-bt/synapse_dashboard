/** `gauge` · forma `escalar` · colSpan 3–7, rowSpan 4 · F1.13g
 *
 *  **Sin `maximo` no se dibuja el arco.** Un medidor es una proporción, y sin
 *  denominador es un número con un adorno circular. Cae a decirlo, que es lo
 *  honesto: lo que falta es la BASE, y §1.3 no deja inventarla.
 */
import { Label } from '../primitives/Label'
import { PlotGauge } from '../plots/PlotGauge'
import type { BodyProps } from '../types'

export type GaugeParams = {
  /** Contra qué se mide. Sin esto un medidor no dice nada: 72 sobre qué. */
  maximo?: number
  banda?: { lo: number; hi: number; etiqueta: string }
}

export function GaugeBody({
  value,
  params,
  family,
  unit,
  format,
}: BodyProps<'escalar', GaugeParams>) {
  const { maximo, banda } = params
  const figure = (v: number) => format.number(v, { abbreviate: true })

  if (maximo === undefined || maximo <= 0) {
    return (
      <div className="h-full min-h-0 flex items-center">
        <Label>Sin máximo declarado · no se puede leer como proporción</Label>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <PlotGauge
        value={value.v}
        max={maximo}
        family={family}
        format={figure}
        {...(unit === undefined ? {} : { unit })}
      />
      <Label>
        {banda === undefined
          ? `Sobre ${figure(maximo)}`
          : `${banda.etiqueta} · ${figure(banda.lo)}–${figure(banda.hi)}`}
      </Label>
    </div>
  )
}
