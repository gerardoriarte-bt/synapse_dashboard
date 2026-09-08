/** La banda de intervalo · regla dura 6 · F1.13a
 *
 *  **Existe como primitiva y no como opción de la serie** porque §5 la hace
 *  obligatoria: un `serieConBanda` sin banda no se publica, y una estimación
 *  puntual sin intervalo tampoco. Que sea su propio componente es lo que permite
 *  que L10 del lint la busque por nombre.
 */
import { familyVar } from '../../../tokens/tokens'
import type { LinearScale } from './scale'

export type BandPoint = { t: number; lo: number; hi: number }

export function Band({
  points,
  x,
  y,
  family,
}: {
  points: readonly BandPoint[]
  x: LinearScale
  y: LinearScale
  family: string
}) {
  if (points.length === 0) return null

  const top = points.map((p) => `${x(p.t)},${y(p.hi)}`).join(' L')
  const bottom = [...points]
    .reverse()
    .map((p) => `${x(p.t)},${y(p.lo)}`)
    .join(' L')

  return <path d={`M${top} L${bottom} Z`} fill={familyVar(family)} fillOpacity={0.18} aria-hidden />
}
