/** Error · F1.13d
 *
 *  Qué falló y qué hacer. **Reintento por panel, nunca de página:** el resto de
 *  los paneles cargó bien y recargar los tiraría también.

 *  **Sin manejador no se pinta el botón.** §8 pide que un estado tenga salida, y
 *  la tiene: el `detail` dice qué lo desbloquea. Lo que NO puede tener es un CTA
 *  que no lleva a ningún lado — es la misma regla que `RecoBody` aplica con
 *  `puedeResponder`: «un botón que se aprieta y devuelve 403 es peor que un
 *  botón ausente, porque promete una acción que no existe para vos».
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
      {...(onRetry === undefined
        ? {}
        : { exit: { text: 'Reintentar este panel', onClick: onRetry } })}
    />
  )
}
