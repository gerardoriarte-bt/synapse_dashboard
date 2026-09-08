/** La marca de un estado · F1.13d
 *
 *  `aria-hidden` siempre: el significado que carga —candado, alerta— no llega al
 *  árbol de accesibilidad, y por eso `StateBody` lleva `name` aparte.
 */
import type { ReactNode } from 'react'

export function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      {children}
    </svg>
  )
}
