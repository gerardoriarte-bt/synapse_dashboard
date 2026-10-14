/** El registro de AYUDA · instrucciones, explicaciones y avisos · 2026-10-06
 *
 *  `Label` nombra un dato: «CLIENTE», «BASE», «3 × 4». Hasta hoy también
 *  explicaba —«Arrastrá un panel para moverlo»— y avisaba —«Guardá primero»—,
 *  todo en el mismo mono de 10 en mayúsculas. La auditoría del 2026-10-06 midió
 *  81 `Label` contra 21 botones en el builder, y el pedido humano fue
 *  exactamente ese: «poca diferenciación entre lo que es texto informativo y
 *  texto seleccionable». Ver `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md` §1.4.
 *
 *  **Una frase se escribe como frase.** Cuerpo de 13 en Inter, caja normal,
 *  gris. Así la regla que el ojo aprende es corta: mayúsculas mono = el nombre
 *  de algo; frase = una explicación; caja = se toca (`Accion`, `Opcion`).
 *
 *  Sin `className`, igual que todo `render/`: el componente es dueño de su
 *  apariencia.
 */
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** `p` por defecto: casi siempre es un párrafo suelto. `span` para ir en línea
   *  al lado de un control. */
  as?: 'p' | 'span' | 'div'
  id?: string
}

const AYUDA = 'font-body text-cuerpo leading-cuerpo text-dim m-0'

export function Ayuda({ children, as: As = 'p', id }: Props) {
  return (
    <As className={AYUDA} {...(id === undefined ? {} : { id })}>
      {children}
    </As>
  )
}
