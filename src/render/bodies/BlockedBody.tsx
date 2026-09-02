/** `blocked` · acepta cualquier forma · colSpan 4–6, rowSpan 4 · F1.13g
 *
 *  **Es el único tipo que NO dibuja su valor.** Existe para cuando la métrica
 *  está bloqueada de origen —el catálogo lo declara— y no por un feed vencido de
 *  este período. La diferencia con el estado `BLOQUEADO` del payload es de
 *  duración: el estado es de hoy, el tipo es del panel.
 *
 *  Reusa el mismo cuerpo de estado para que la gramática sea una sola. Que un
 *  panel bloqueado por catálogo y uno bloqueado por frescura se vieran distinto
 *  sería exactamente el problema que §8 evita.
 */
import { BlockedState } from '../states/States'
import type { BodyProps } from '../types'

export type BlockedParams = { razon?: string; desbloqueaCon?: string }

export function BlockedBody({ params }: BodyProps<'escalar', BlockedParams>) {
  return (
    <BlockedState
      reason={params.razon ?? 'Esta métrica no está disponible.'}
      unblockedBy={params.desbloqueaCon ?? 'Sin acción declarada'}
    />
  )
}
