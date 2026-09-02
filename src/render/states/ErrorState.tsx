/** Error · F1.13d
 *
 *  Qué falló y qué hacer. **Reintento por panel, nunca de página:** el resto de
 *  los paneles cargó bien y recargar los tiraría también.
 */
import { Icon } from './Icon'
import { StateBody } from './StateBody'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <StateBody
      name="Error"
      mark={
        <Icon>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6" />
          <circle cx="12" cy="16.5" r=".5" fill="currentColor" />
        </Icon>
      }
      phrase={message}
      detail="El resto de los paneles cargó normalmente"
      exit={{
        text: 'Reintentar este panel',
        ...(onRetry === undefined ? {} : { onClick: onRetry }),
      }}
    />
  )
}
