/** Bloqueado · F1.13d
 *
 *  Sin número. Razón, qué lo desbloquea y CTA · §8.
 *
 *  La marca dice SIN VALOR APROXIMADO porque **la ausencia de cifra es la
 *  información**, no una carencia de la pantalla: si un feed está vencido, un
 *  número aproximado sería peor que ninguno.
 */
import { Label } from '../primitives/Label'
import { StateBody } from './StateBody'

export function BlockedState({
  reason,
  unblockedBy,
  onUnblock,
}: {
  reason: string
  unblockedBy: string
  onUnblock?: () => void
}) {
  return (
    <StateBody
      // Sin `name`: su marca ya es texto visible que dice «Bloqueado».
      mark={<Label>Bloqueado · sin valor aproximado</Label>}
      phrase={reason}
      detail={`Qué lo desbloquea · ${unblockedBy}`}
      exit={{
        text: 'Resolver',
        primary: true,
        ...(onUnblock === undefined ? {} : { onClick: onUnblock }),
      }}
    />
  )
}
