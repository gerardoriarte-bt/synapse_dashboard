/** Sin permiso · F1.13d
 *
 *  Qué se pidió, por qué no llega a este rol, y a quién solicitarlo.

 *  **Sin manejador no se pinta el botón.** §8 pide que un estado tenga salida, y
 *  la tiene: el `detail` dice qué lo desbloquea. Lo que NO puede tener es un CTA
 *  que no lleva a ningún lado — es la misma regla que `RecoBody` aplica con
 *  `puedeResponder`: «un botón que se aprieta y devuelve 403 es peor que un
 *  botón ausente, porque promete una acción que no existe para vos».
 */
import { Icon } from './Icon'
import { StateBody } from './StateBody'

export function ForbiddenState({
  requestTo,
  onRequest,
}: {
  requestTo: string
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
      phrase="Esta métrica no está disponible para tu rol."
      detail={`Quién lo decide · ${requestTo}`}
      {...(onRequest === undefined
        ? {}
        : { exit: { text: 'Solicitar acceso', onClick: onRequest } })}
    />
  )
}
