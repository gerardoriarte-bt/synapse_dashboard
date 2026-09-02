/** Bloqueado · F1.13d
 *
 *  Sin número. Razón, qué lo desbloquea y CTA · §8.
 *
 *  La marca dice SIN VALOR APROXIMADO porque **la ausencia de cifra es la
 *  información**, no una carencia de la pantalla: si un feed está vencido, un
 *  número aproximado sería peor que ninguno.

 *  **Sin manejador no se pinta el botón.** §8 pide que un estado tenga salida, y
 *  la tiene: el `detail` dice qué lo desbloquea. Lo que NO puede tener es un CTA
 *  que no lleva a ningún lado — es la misma regla que `RecoBody` aplica con
 *  `puedeResponder`: «un botón que se aprieta y devuelve 403 es peor que un
 *  botón ausente, porque promete una acción que no existe para vos».
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
      {...(onUnblock === undefined
        ? {}
        : { exit: { text: 'Resolver', primary: true, onClick: onUnblock } })}
    />
  )
}
