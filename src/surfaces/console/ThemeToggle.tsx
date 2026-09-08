/** El control de tema · F1.12
 *
 *  **El cambio visual NO pasa por la API.** Es un atributo en la raíz y las
 *  custom properties hacen el resto: cero recálculo, cero re-render, cero
 *  estilos en JS. La escritura contra el perfil va en paralelo y si falla, el
 *  tema igual cambió — que es lo correcto: la preferencia es del usuario y ya la
 *  expresó.
 *
 *  §2.4: el tema es preferencia de USUARIO, no de tenant, así que se persiste
 *  contra el perfil y no en el navegador. Un `localStorage` haría que la misma
 *  cuenta se viera distinta en dos máquinas.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { currentTheme, toggleTheme } from '../../tokens/theme'
import type { Theme } from '../../tokens/theme'

type Props = {
  /** Se llama con el tema que quedó. Quien persiste es la superficie, con
   *  `useSaveTheme` — este control no habla con la red. */
  onChange?: (theme: Theme) => void
}

export function ThemeToggle({ onChange }: Props) {
  // El estado es solo para re-pintar el rótulo. La fuente de verdad es el
  // atributo del DOM, que es lo que el CSS lee.
  const [theme, setTheme] = useState<Theme>(() => currentTheme())

  return (
    <button
      type="button"
      onClick={() => {
        const next = toggleTheme()
        setTheme(next)
        onChange?.(next)
      }}
      aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
      className="rounded-md px-2 py-1 cursor-pointer bg-transparent border border-w2 hover:bg-w2"
    >
      <Label>{theme === 'dark' ? 'Oscuro' : 'Claro'}</Label>
    </button>
  )
}
