/** `bars` · formas `categorica` y `ranking` · colSpan 4–8, rowSpan 4–5 · F1.13g */
import { PlotBars } from '../plots/PlotBars'
import type { BodyProps } from '../types'

export type BarsParams = {
  /** `desc` es el defecto: un ranking se lee de mayor a menor. */
  orden?: 'desc' | 'asc' | 'natural'
  tope?: number
}

export function BarsBody({
  value,
  params,
  family,
  format,
}: BodyProps<'categorica' | 'ranking', BarsParams>) {
  const { orden = 'desc', tope } = params

  const items = value.items.map((i) => ({ etiqueta: i.etiqueta, v: i.v }))
  // Copia antes de ordenar: `sort` muta, y el arreglo viene del payload que
  // TanStack Query tiene en cache. Ordenarlo en el lugar cambia lo que ve el
  // próximo lector de esa entrada.
  const sorted =
    orden === 'natural'
      ? items
      : [...items].sort((a, b) => (orden === 'desc' ? b.v - a.v : a.v - b.v))
  const trimmed = tope === undefined ? sorted : sorted.slice(0, tope)

  return (
    <div className="h-full min-h-0">
      <PlotBars
        value={{ forma: 'categorica', items: trimmed }}
        family={family}
        format={(v) => format.number(v, { abbreviate: true })}
      />
    </div>
  )
}
