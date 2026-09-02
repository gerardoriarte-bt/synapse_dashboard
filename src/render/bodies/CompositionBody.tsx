/** `composition` · forma `composicion` · colSpan 4–8, rowSpan 4–5 · F1.13g
 *
 *  **Agrupa en «Otros» a partir de la quinta parte.** La razón es de sistema y no
 *  de gusto: la rampa de familia tiene cinco escalones, así que una sexta parte
 *  repetiría un color y dos partes distintas se verían iguales. Es el mismo tope
 *  que §5 le pone a la dona, por la misma razón.
 */
import { Label } from '../primitives/Label'
import { PlotComposition } from '../plots/PlotComposition'
import type { BodyProps } from '../types'

export type CompositionParams = { orden?: 'desc' | 'natural' }

/** Cuatro visibles más «Otros» = los cinco escalones de la rampa. */
const VISIBLE = 4

export function CompositionBody({
  value,
  params,
  family,
  format,
}: BodyProps<'composicion', CompositionParams>) {
  // Copia antes de ordenar: el arreglo viene del payload cacheado.
  const parts = params.orden === 'natural' ? value.partes : [...value.partes].sort((a, b) => b.v - a.v)

  const visible = parts.slice(0, VISIBLE)
  const rest = parts.slice(VISIBLE)
  const withOthers =
    rest.length === 0
      ? visible
      : [
          ...visible,
          {
            etiqueta: `Otros · ${rest.length}`,
            v: rest.reduce((s, p) => s + p.v, 0),
            porcentaje: rest.reduce((s, p) => s + p.porcentaje, 0),
          },
        ]

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <PlotComposition
        parts={withOthers}
        family={family}
        format={(v) => format.number(v, { decimals: 1 })}
      />
      {rest.length > 0 && (
        <Label>{`${rest.length} partes agrupadas · la rampa tiene cinco escalones`}</Label>
      )}
    </div>
  )
}
