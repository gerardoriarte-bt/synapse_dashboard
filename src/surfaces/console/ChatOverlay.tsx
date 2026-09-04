/** La hoja lateral del chat · F3.1
 *
 *  **Sin `<dialog>` nativo, y con la razón escrita.** `showModal()` daría el
 *  Escape, la trampa de foco y la devolución del foco al disparador de arriba,
 *  pero jsdom no lo implementa —verificado el 2026-09-03— así que las pruebas
 *  tendrían que polirrellenarlo y estarían verificando el polyfill, no la hoja.
 *  Se hace a mano, que además deja el retorno del foco explícito en vez de
 *  confiado al navegador.
 *
 *  **Una sola hoja abierta a la vez.** Apilarlas deja al usuario sin saber qué
 *  cierra el Escape. La consola sostiene un solo estado, así que estructuralmente
 *  no puede haber dos; el contador de abajo es la red por si alguien monta una
 *  segunda desde otro lado, y avisa en vez de fallar en silencio.
 */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

let abiertas = 0

type Props = {
  open: boolean
  /** Nombra la hoja para el lector de pantalla. Es el panel desde el que se
   *  preguntó, o la pestaña si se abrió desde el chrome. */
  title: string
  onClose: () => void
  children: ReactNode
}

export function ChatOverlay({ open, title, onClose, children }: Props) {
  const hoja = useRef<HTMLDivElement>(null)
  // Quién tenía el foco antes de abrir. Se guarda en el momento de abrir y no
  // al montar: la hoja se monta con la consola y se abre mucho después.
  const disparador = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    disparador.current = document.activeElement as HTMLElement | null
    hoja.current?.focus()

    abiertas += 1
    if (abiertas > 1) {
      console.warn(
        '[Synapse] Dos hojas de chat abiertas a la vez. El Escape cierra una sola ' +
          'y el usuario no sabe cuál: la consola sostiene un único estado de chat.',
      )
    }

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', alTeclear)

    return () => {
      document.removeEventListener('keydown', alTeclear)
      abiertas -= 1
      // El foco vuelve al disparador. Sin esto, cerrar con Escape deja el foco
      // en el `body` y quien navega con teclado tiene que recorrer la página
      // entera para volver al panel desde el que preguntó.
      disparador.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={hoja}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col gap-4 overflow-y-auto border-l border-w3 bg-elev p-6 shadow-[0_0_40px_var(--color-shad)] outline-none"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0 min-w-0 truncate">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-label tracking-rotulo uppercase text-dim hover:text-ink cursor-pointer bg-transparent border-0 p-0"
        >
          Cerrar
        </button>
      </div>
      {children}
    </div>
  )
}
