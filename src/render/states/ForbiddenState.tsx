/** Sin permiso · F1.13d
 *
 *  Qué se pidió, por qué no llega a este rol, y a quién solicitarlo.

 *  **Sin manejador no se pinta el botón.** §8 pide que un estado tenga salida, y
 *  la tiene: el `detail` dice qué lo desbloquea. Lo que NO puede tener es un CTA
 *  que no lleva a ningún lado — es la misma regla que `RecoBody` aplica con
 *  `puedeResponder`: «un botón que se aprieta y devuelve 403 es peor que un
 *  botón ausente, porque promete una acción que no existe para vos».
 *
 *  **§PEN:C5** · C5 · «Sin permiso», con y sin alternativas que ofrecer.
 */
import { Icon } from './Icon'
import { StateBody } from './StateBody'

/** **El respaldo, y por qué sigue existiendo.** Era la frase que este componente
 *  pintaba siempre, escrita por nosotros. Desde `de881e1` el servicio manda la
 *  suya y **esa manda**; ésta queda para un payload sin `razon` —un backend más
 *  viejo, o un fixture— porque un panel sin frase no dice nada.
 *
 *  **No es una traducción de la del servicio**: si algún día las dos difieren, la
 *  que se ve es la de él, y esto no se toca. */
const FRASE_SIN_RAZON = 'Esta métrica no está disponible para tu rol.'

export function ForbiddenState({
  requestTo,
  reason,
  unlocksWith,
  onRequest,
}: {
  requestTo: string
  /** **Del servicio, no nuestra** · ver la cabecera. Vacía cae a la de antes. */
  reason?: string
  unlocksWith?: string
  onRequest?: () => void
}) {
  return (
    <StateBody
      name="Sin permiso"
      mark={
        <Icon>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </Icon>
      }
      phrase={reason !== undefined && reason !== '' ? reason : FRASE_SIN_RAZON}
      detail={
        unlocksWith !== undefined && unlocksWith !== ''
          ? unlocksWith
          : `Quién lo decide · ${requestTo}`
      }
      {...(onRequest === undefined
        ? {}
        : { exit: { text: 'Solicitar acceso', onClick: onRequest } })}
    />
  )
}
