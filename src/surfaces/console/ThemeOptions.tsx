/** Las dos opciones de tema · §PEN «Console/Panel de usuario» · 2026-09-28
 *
 *  **Reemplaza al `ThemeToggle` suelto del navbar**, que era un botón que
 *  alternaba. El dibujo pone **las dos opciones a la vista** —`OSCURO` en `$acc`
 *  cuando está activo, `CLARO` en `$dim`— dentro del panel de usuario.
 *
 *  **La diferencia no es estética: un toggle no dice en qué estado estás.**
 *  «Claro» en un botón puede leerse como «estás en claro» o como «pasá a
 *  claro», y cuál de las dos es depende de saber la convención. Con las dos
 *  opciones visibles y una marcada, no hay que saberla.
 *
 *  **El acento acá es legítimo**: §2.1 lista «estado activo» entre sus usos, y
 *  esto es exactamente eso. Y no es el único portador — `aria-pressed` lo dice
 *  para quien no lo ve.
 *
 *  El cambio visual **no pasa por la API**: es un atributo en la raíz y las
 *  custom properties hacen el resto. La escritura contra el perfil va en
 *  paralelo, y si falla el tema igual cambió — la preferencia es del usuario y
 *  ya la expresó.
 */
import { useState } from 'react'
import { applyTheme, currentTheme } from '../../tokens/theme'
import type { Theme } from '../../tokens/theme'

const OPCIONES: readonly { valor: Theme; rotulo: string }[] = [
  { valor: 'dark', rotulo: 'Oscuro' },
  { valor: 'light', rotulo: 'Claro' },
]

export function ThemeOptions({ onChange }: { onChange: (theme: Theme) => void }) {
  // El estado es sólo para re-pintar cuál está marcado. La fuente de verdad es
  // el atributo del DOM, que es lo que el CSS lee.
  const [tema, setTema] = useState<Theme>(() => currentTheme())

  return (
    <div className="flex items-center gap-3">
      {OPCIONES.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={tema === o.valor}
          onClick={() => {
            applyTheme(o.valor)
            setTema(o.valor)
            onChange(o.valor)
          }}
          className={[
            'cursor-pointer border-0 bg-transparent p-0 font-mono text-label tracking-rotulo uppercase',
            tema === o.valor ? 'text-acc' : 'text-dim hover:text-ink',
          ].join(' ')}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}
