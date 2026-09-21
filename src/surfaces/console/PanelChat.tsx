/** La hoja del chat atada a UN panel · F3.3
 *
 *  **Se monta sólo cuando hay panel, y eso es la mitad del diseño.** `useChat`
 *  vive acá adentro, así que abrir el chat de otro panel desmonta éste y arranca
 *  un hilo nuevo: no hay forma de que una respuesta sobre «Venta diaria» quede
 *  colgando en la hoja de «Ventas por canal». El estado no se comparte porque no
 *  existe mientras la hoja está cerrada.
 *
 *  **Cerrar pierde la conversación, y hoy es correcto.** Recuperarla es el
 *  historial de hilos —F3.7—, que necesita una ruta que todavía no está
 *  transcrita. Fingir persistencia guardando los turnos en memoria daría una
 *  conversación que sobrevive a cerrar la hoja y NO a recargar, que es la peor
 *  de las dos promesas.
 *
 *  ── EL CAMPO DE LA PREGUNTA NO TENÍA TAREA ──────────────────────────────────
 *
 *  F3.1 es la hoja, F3.5 son los mensajes, F3.8 es el hook. **Ninguna de las
 *  tres es el lugar donde se escribe**, y se descubrió al construir F3.3: sin
 *  esto, «Preguntar» abre una hoja que dice «preguntá» y no deja preguntar, que
 *  es un CTA muerto con un paso más.
 */
import { useState } from 'react'
import { useChat } from '../../api/useChat'
import { ChatOverlay } from './ChatOverlay'
import { ChatThread } from './ChatThread'

const ROTULO = 'font-mono text-label tracking-rotulo leading-rotulo uppercase text-dim'

const CAMPO =
  'font-body text-cuerpo leading-cuerpo text-ink bg-elev border border-w3 rounded-md px-3 py-2 ' +
  'outline-none focus:border-w5 flex-1 min-w-0'

type Props = {
  /** El panel desde el que se preguntó. Es la mitad del contexto que el
   *  servicio necesita; la otra es el período. */
  panelId: string
  /** `YYYY-MM`. El servicio lo valida y devuelve 400 si no calza. */
  periodo: string
  /** El nombre de la métrica, para que la hoja diga de qué se está hablando. */
  titulo: string
  onClose: () => void
}

export function PanelChat({ panelId, periodo, titulo, onClose }: Props) {
  const { turns, ask } = useChat({ panelId, periodo })
  const [texto, setTexto] = useState('')

  // Mientras el último turno transmite, preguntar de nuevo ABORTARÍA ese stream
  // —`ask` cancela el anterior— y la respuesta a medias se perdería sin decir
  // por qué. Se espera, y el botón dice que se está esperando.
  const enVuelo = turns.at(-1)?.streaming === true

  return (
    <ChatOverlay open title={titulo} onClose={onClose}>
      <ChatThread turns={turns} />

      <form
        className="mt-auto flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const pregunta = texto.trim()
          // Una pregunta vacía abriría un turno que no pregunta nada y gastaría
          // la cuota por usuario que el servicio comparte con `/chat/*`.
          if (pregunta === '' || enVuelo) return
          setTexto('')
          void ask(pregunta)
        }}
      >
        <label htmlFor="panel-chat-pregunta" className="sr-only">
          Tu pregunta sobre {titulo}
        </label>
        <input
          id="panel-chat-pregunta"
          name="pregunta"
          type="text"
          autoComplete="off"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="¿Por qué cambió?"
          className={CAMPO}
        />
        <button
          type="submit"
          disabled={texto.trim() === '' || enVuelo}
          className={`${ROTULO} cursor-pointer border-0 bg-transparent p-0 pb-2 text-acc hover:text-acc-hover disabled:cursor-default disabled:text-dim`}
        >
          {enVuelo ? 'Esperando' : 'Preguntar'}
        </button>
      </form>
    </ChatOverlay>
  )
}
