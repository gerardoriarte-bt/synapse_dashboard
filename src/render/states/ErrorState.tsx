/** Error · F1.13d
 *
 *  Qué falló y qué hacer. **Reintento por panel, nunca de página:** recargar
 *  tiraría también los paneles que sí cargaron.

 *  **Sin manejador no se pinta el botón.** §8 pide que un estado tenga salida, y
 *  la tiene: el `detail` dice qué lo desbloquea. Lo que NO puede tener es un CTA
 *  que no lleva a ningún lado — es la misma regla que `RecoBody` aplica con
 *  `puedeResponder`: «un botón que se aprieta y devuelve 403 es peor que un
 *  botón ausente, porque promete una acción que no existe para vos».
 */
import { Icon } from './Icon'
import { StateBody } from './StateBody'

/** **`agrupado`: la causa ya se dijo arriba** · 2026-10-21. Cuando varios paneles
 *  fallan con el mismo mensaje, la consola lo dice una vez sobre la grilla
 *  —`surfaces/console/fallaComun.ts`— y el panel no lo repite: apunta al aviso.
 *  Y no dice «el resto cargó normalmente», que en ese caso es falso.
 *
 *  **`restoCargo`: esa frase se afirma sólo si es verdad** · 2026-11-23. En QA
 *  nueve paneles fallaban por una causa y los otros por otra, y los de la otra
 *  decían «El resto de los paneles cargó normalmente» con la pestaña entera en
 *  error. Este estado no ve la grilla, así que no lo puede saber: lo dice quien
 *  la ve. `true` lo afirma; `false` dice que otros también fallaron; sin
 *  decirlo —la hoja del detalle, un valor mal formado— no se dice nada. */
export function ErrorState({
  message,
  onRetry,
  agrupado = false,
  restoCargo,
}: {
  message: string
  onRetry?: () => void
  agrupado?: boolean
  restoCargo?: boolean | undefined
}) {
  const detail = agrupado
    ? 'Es la misma falla en varios paneles de esta pestaña'
    : restoCargo === true
      ? 'El resto de los paneles cargó normalmente'
      : restoCargo === false
        ? 'Otros paneles de esta pestaña tampoco cargaron'
        : undefined
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
      phrase={agrupado ? 'No se pudo calcular · la causa está en el aviso de arriba' : message}
      {...(detail === undefined ? {} : { detail })}
      {...(onRetry === undefined
        ? {}
        : { exit: { text: 'Reintentar este panel', onClick: onRetry } })}
    />
  )
}
