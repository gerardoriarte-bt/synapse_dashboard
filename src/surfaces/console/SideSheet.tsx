/** Las mecánicas de una hoja lateral · F3.1 y F3.9
 *
 *  **Se extrajo de `ChatOverlay` el 2026-09-30, cuando apareció la segunda
 *  hoja.** Hasta ese día había una sola —el chat— y las mecánicas vivían junto a
 *  sus medidas. El drill-down las necesita todas y **ninguna de sus medidas**:
 *  el `.pen` lo dibuja al 60% del viewport, en `$panel`, con filete `$w3`, **sin
 *  radio y sin filo**, contra los 940 fijos, el `$dock`, el `rounded-l-xl` y los
 *  2px de `$acc` del chat. Son cuatro diferencias, así que lo que se comparte es
 *  el comportamiento y cada hoja declara su forma.
 *
 *  **NO lleva ancla de pantalla, a propósito.** `pen-pantallas` exige el ancla en
 *  cada archivo que una fila del registro cite, y este archivo sirve a dos
 *  pantallas: ponerle una sería decir que implementa una, y ponerle las dos sería
 *  hacer que cada fila reclame un archivo que no es suyo. Las anclas viven en
 *  `ChatOverlay` —§PEN:C3— y en `DrillSheet` —§PEN:C2—, que son los dos que se
 *  escribieron mirando un dibujo.
 *
 *  ── QUÉ MECÁNICAS, Y POR QUÉ CADA UNA ───────────────────────────────────────
 *
 *  **Sin `<dialog>` nativo, y con la razón escrita.** `showModal()` daría el
 *  Escape, la trampa de foco y la devolución del foco al disparador, pero jsdom
 *  no lo implementa —verificado el 2026-09-03— así que las pruebas tendrían que
 *  polirrellenarlo y estarían verificando el polyfill, no la hoja. Se hace a
 *  mano, que además deja el retorno del foco explícito en vez de confiado al
 *  navegador.
 *
 *  **Una sola hoja abierta a la vez, y el contador es UNO para todas.** Con un
 *  contador por módulo, el chat y el drill-down abiertos a la vez no se verían
 *  entre ellos — y es justo el caso que el pie de §PEN:C2 habilita, porque
 *  «preguntar sobre esta cifra» abre el chat desde la hoja de detalle. Por eso
 *  vive acá, en el módulo compartido, y no en cada hoja.
 *
 *  **El velo es lo que hace honesto el `aria-modal`.** Sin él, todo lo de atrás
 *  sigue siendo clickeable y alcanzable por teclado, así que a un lector de
 *  pantalla se le dice que el resto está inerte cuando no lo está.
 */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/** **UNA sola cuenta, compartida por las dos hojas.** Ver la cabecera. */
let abiertas = 0

type Props = {
  open: boolean
  /** Nombra la hoja para el lector de pantalla. */
  title: string
  /** De qué se está hablando · se suma al nombre accesible, para que las hojas
   *  de dos paneles no se llamen igual. */
  contexto?: string
  onClose: () => void
  /** El ancho que el dibujo de ESA hoja mide. El chat son 940 fijos; el
   *  drill-down es el 60% del viewport. No hay un defecto porque no hay uno
   *  correcto: inventarlo haría que la hoja nueva heredara la medida de la
   *  vieja sin que nadie lo decidiera. */
  ancho: string
  /** La superficie y el filete, también del dibujo. El chat va en `$dock` y
   *  redondeado sólo del lado por el que entra; el drill-down en `$panel` con
   *  filete `$w3` y sin radio. */
  superficie: string
  /** El filo de 2px arriba de todo. **Ausente cuando el dibujo no lo lleva**: el
   *  frame del drill-down no tiene ese nodo, y pintarlo «por consistencia» sería
   *  elegir por diseño. */
  filo?: string
  children: ReactNode
}

export function SideSheet({
  open,
  title,
  contexto,
  onClose,
  ancho,
  superficie,
  filo,
  children,
}: Props) {
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
        '[Synapse] Dos hojas laterales abiertas a la vez. El Escape cierra una sola ' +
          'y el usuario no sabe cuál: la consola sostiene un único estado por hoja ' +
          'y las excluye entre sí.',
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
      // entera para volver al panel desde el que abrió.
      disparador.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* **El velo** · las dos pantallas lo dibujan a pantalla completa por
          detrás de la hoja. Cierra al apretarlo, que es lo que espera cualquiera
          que haya usado una hoja lateral, y **es lo que vuelve cierto el
          `aria-modal`**.

          `aria-hidden` porque no aporta nada a quien no lo ve: el Escape y el
          botón de cerrar son las salidas que sí se anuncian.

          **`$shad` y no un hex.** El frame del drill-down lo dibuja con el token;
          el del chat escribe `#0B0B0CCC`, que no tiene token y es un hex literal
          — se usa el único negro translúcido del sistema, que además se invierte
          con el tema. La divergencia del chat está escrita. */}
      <div aria-hidden onClick={onClose} className="fixed inset-0 z-40 bg-shad" />

      <div
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-label={contexto === undefined ? title : `${title} · ${contexto}`}
        tabIndex={-1}
        // Pegada a la derecha en las dos. `overflow-hidden` para que las
        // columnas de adentro respeten el radio cuando lo hay.
        className={`fixed inset-y-0 right-0 z-50 flex overflow-hidden outline-none ${ancho} ${superficie}`}
      >
        {filo === undefined ? null : <span aria-hidden className={filo} />}
        {children}
      </div>
    </>
  )
}
