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
 *
 *  **§PEN:C3** · C3 · «Chat expandido» · DIVERGE de fondo · misma auditoría, §1 a §7.
 */
import { useState } from 'react'
import { useChat } from '../../api/useChat'
import { useThreads } from '../../api/hooks'
import { ChatOverlay } from './ChatOverlay'
import { ChatThread } from './ChatThread'
import { ThreadRail } from './ThreadRail'
import { groupByRecency } from './threads'
import type { Formatter } from '../../render/format'

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
  /** Para el agrupado del riel · «HOY», «ESTA SEMANA», «JULIO». */
  format: Formatter
  onClose: () => void
}

export function PanelChat({ panelId, periodo, titulo, format, onClose }: Props) {
  const { turns, threadId, ask, resume, reset } = useChat({ panelId, periodo })
  const [texto, setTexto] = useState('')

  /** Los hilos de ESTE panel y ESTE período · F3.7. El filtro lo aplica el
   *  servicio: pedir todos y descartar acá traería por la red las
   *  conversaciones de los otros once paneles para tirarlas. */
  const hilos = useThreads(panelId, periodo)

  /** El agrupado por tiempo **es la excepción a que el front no calcule**, y el
   *  contrato la concede explícitamente: «HOY, ESTA SEMANA, JULIO lo hace el
   *  front: es presentación y depende del huso del usuario». Es la otra zona
   *  horaria — la del navegador, no la del tenant. */
  const grupos = groupByRecency(hilos.data ?? [], new Date(), format)

  /** Cuál de las filas del riel es la conversación en curso. Se busca por
   *  `hiloId` —el entero— porque eso es lo que `useChat` sostiene, y se marca
   *  por `id` —el uuid—, que es como el riel nombra sus filas. */
  const activo = (hilos.data ?? []).find((h) => h.hiloId === threadId)

  // Mientras el último turno transmite, preguntar de nuevo ABORTARÍA ese stream
  // —`ask` cancela el anterior— y la respuesta a medias se perdería sin decir
  // por qué. Se espera, y el botón dice que se está esperando.
  const enVuelo = turns.at(-1)?.streaming === true

  return (
    // **El encabezado es el literal del `.pen`, el contexto es NUESTRO** ·
    // §PEN:C3 encabeza «PREGUNTAR A SYNAPSE» y pone debajo
    // `CONTEXTO · … · JUL 2026 · 12 PANELES`. El dibujo cuenta la pestaña
    // porque ahí el chat es de la pestaña; acá es del panel, que es la decisión
    // del 2026-09-17, así que el contexto nombra la métrica y el período. Poner
    // el literal del dibujo sin su decisión dejaría una etiqueta que miente.
    <ChatOverlay
      open
      title="Preguntar a Synapse"
      contexto={`${titulo} · ${periodo}`}
      onClose={onClose}
    >
      <ChatThread turns={turns} />

      {/* **El riel va DEBAJO de la conversación en curso, no arriba.** Lo que
          se está leyendo es la respuesta; el historial es a dónde se va
          después. Y no se pinta si no hay nada: un encabezado «Conversaciones
          anteriores» sobre una lista vacía ocupa el lugar sin decir nada.

          Tampoco mientras carga: el riel aparece cuando hay algo que mostrar,
          en vez de parpadear con un esqueleto por una lista de tres líneas. */}
      {grupos.length === 0 ? null : (
        <div className="border-t border-w2 pt-4">
          <ThreadRail
            groups={grupos}
            // **LOS DOS IDS, y acá es donde se confunden.** El riel identifica
            // sus filas por `id` —el uuid del hilo, que es lo que el DOM y el
            // `aria-current` necesitan— y `resume` manda `hiloId`, el ENTERO
            // que el binding de Gin pide en `thread_id`. Pasar `resume` directo
            // como `onSelect` compilaba y mandaba el uuid: 400 en cada intento
            // de retomar.
            format={format}
            onNueva={reset}
            onSelect={(uuid) => {
              const elegido = (hilos.data ?? []).find((h) => h.id === uuid)
              if (elegido?.hiloId != null) resume(elegido.hiloId)
            }}
            {...(activo === undefined ? {} : { activeId: activo.id })}
          />
        </div>
      )}

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
        {/* §PEN:C3 dice «Preguntá sobre esta pestaña». Acá el contexto es el
            PANEL, así que el literal se adapta — copiarlo tal cual nombraría
            algo que no es lo que viaja en la petición. */}
        <input
          id="panel-chat-pregunta"
          name="pregunta"
          type="text"
          autoComplete="off"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Preguntá sobre este panel"
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
