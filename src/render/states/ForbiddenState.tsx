/** Sin permiso · F1.13d
 *
 *  Qué se pidió, por qué no llega a este rol, y a quién solicitarlo.
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
      exit={{ text: 'Solicitar acceso', ...(onRequest === undefined ? {} : { onClick: onRequest }) }}
    />
  )
}
