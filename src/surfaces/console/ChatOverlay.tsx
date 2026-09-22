/** La hoja lateral del chat · F3.1 · §PEN:C3
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
 *
 *  ── LA FORMA SALE DEL DIBUJO · 2026-09-21 ───────────────────────────────────
 *
 *  Hasta hoy medía 480 y no tenía velo. El frame `Chat` de §PEN:C3 dice otra
 *  cosa, campo por campo:
 *
 *   · **940 de ancho**, pegada a la derecha — `x=500` sobre un lienzo de 1440.
 *   · **`radius [16, 0, 0, 16]`**: redondeada **solo del lado que entra**.
 *   · **`Filo`**, 940 × 2 en `$acc`, arriba de todo.
 *   · **`Velo`** a pantalla completa por detrás.
 *   · fondo `$dock`, no `$elev`.
 *
 *  **El velo es lo que hace honesto el `aria-modal`.** Estaba declarado desde el
 *  principio y era mentira: sin velo, todo lo de atrás seguía siendo clickeable
 *  y alcanzable por teclado, así que a un lector de pantalla se le decía que el
 *  resto estaba inerte cuando no lo estaba.
 *
 *  ── DOS VALORES QUE EL `.pen` ESCRIBE COMO LITERAL ──────────────────────────
 *
 *  Y acá el `.pen` se contradice consigo mismo, así que no se copia:
 *
 *   · **El radio 16.** Los otros nodos de esa misma pantalla usan tokens
 *     —`$r-lg` en el botón—, pero la hoja lleva un 16 crudo, y **la escala que
 *     el propio `.pen` emite termina en `--radius-xl: 10px`**. Se usa el token.
 *   · **El velo `#0B0B0CCC`.** No hay token con ese valor, y «un hex literal es
 *     un bug» es regla dura. Se usa `shad`, que es el único negro translúcido
 *     del sistema y **se invierte con el tema**, que un hex fijo no hace.
 *
 *  Las dos quedan como propuesta de spec: o la escala gana un radio de 16 y un
 *  color de velo, o el dibujo usa los que ya hay. Escritas y juntas con las
 *  otras en `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` · §1.
 */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

let abiertas = 0

type Props = {
  open: boolean
  /** Nombra la hoja para el lector de pantalla. */
  title: string
  /** De qué se está hablando · se suma al nombre accesible, para que las hojas
   *  de dos paneles no se llamen igual. */
  contexto?: string
  onClose: () => void
  children: ReactNode
}

export function ChatOverlay({ open, title, contexto, onClose, children }: Props) {
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
    <>
      {/* **El velo** · §PEN:C3 lo dibuja a pantalla completa por detrás de la
          hoja. Cierra al apretarlo, que es lo que espera cualquiera que haya
          usado una hoja lateral, y **es lo que vuelve cierto el `aria-modal`**.

          `aria-hidden` porque no aporta nada a quien no lo ve: el Escape y el
          botón de cerrar son las salidas que sí se anuncian. */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 bg-shad"
      />

      <div
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-label={contexto === undefined ? title : `${title} · ${contexto}`}
        tabIndex={-1}
        // 940 del dibujo, pegada a la derecha, y redondeada **solo a la
        // izquierda** — el lado por el que entra. `overflow-hidden` para que
        // las dos columnas respeten ese radio.
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[940px] overflow-hidden rounded-l-xl bg-dock shadow-[0_0_40px_var(--color-shad)] outline-none"
      >
        {/* El `Filo`: 2px de `$acc` arriba de todo, a lo ancho de la hoja. */}
        <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-0.5 bg-acc" />
        {children}
      </div>
    </>
  )
}
