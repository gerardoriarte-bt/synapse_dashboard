/** La hoja del chat · de un PANEL o de una PESTAÑA · F3.3 · F3.15
 *
 *  **Se llamaba `PanelChat` hasta el 2026-09-26**, y el nombre dejó de ser
 *  cierto: desde que el cable acepta `tab_context` la misma hoja sirve a las dos
 *  entradas que el `.pen` dibuja —el `PREGUNTAR` de cada panel y el de la barra
 *  inferior—. Se ensanchó en vez de duplicarse: el riel, la conversación y el
 *  compositor son los mismos, y lo único que cambia es de qué habla.
 *
 *  **Lo que el contexto de pestaña NO tiene, y se declara en vez de fingirse:**
 *
 *  | | panel | pestaña |
 *  |---|---|---|
 *  | sugeridas | `/config/panels/{id}/chat-suggestions` | **no hay ruta** · el campo abre sin abridores |
 *  | cuerpo de la cifra | el del panel de origen | **ninguno** · ver `ChatFigure` |
 *  | riel de hilos | `?panel_id=` | `?tab_id=` · las dos las filtra el servicio |
 *
 *  **Se monta sólo cuando hay contexto, y eso es la mitad del diseño.** `useChat`
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
import { esDePanel } from '../../api/chat'
import type { ContextoDeChat } from '../../api/chat'
import { useDeleteThread, useSuggestions, useThreads } from '../../api/hooks'
import { Label } from '../../render/primitives/Label'
import { ChatOverlay } from './ChatOverlay'
import { ChatThread } from './ChatThread'
import { Suggestions } from './Suggestions'
import { ThreadRail } from './ThreadRail'
import { groupByRecency } from './threads'
import type { Formatter } from '../../render/format'
import type { BlockTable } from '../../catalog/blocks'
import type { PanelType } from '../../catalog/types'
import type { ChatAgent } from '../../api/types'
import { etiquetaDeAgente } from './agenteDeChat'

const ROTULO = 'font-mono text-label tracking-rotulo leading-rotulo uppercase text-dim'

const CAMPO =
  'font-body text-cuerpo leading-cuerpo text-ink bg-elev border border-w3 rounded-md px-3 py-2 ' +
  'outline-none focus:border-w5 flex-1 min-w-0'

type Props = {
  /** **De panel o de pestaña, nunca las dos** · F3.15. El servicio exige
   *  exactamente uno y devuelve 400 con ambos; la unión lo hace inexpresable. */
  contexto: ContextoDeChat
  /** `YYYY-MM`. El servicio lo valida y devuelve 400 si no calza. */
  periodo: string
  /** De qué se está hablando: el nombre de la métrica, o el de la pestaña. */
  titulo: string
  /** Con qué cuerpo se dibujan las cifras del agente · F3.6.
   *
   *  **Ausente con contexto de pestaña**, y no es un olvido: el cuerpo sale del
   *  panel de origen y una pregunta de pestaña no tiene uno. Qué dibujar ahí es
   *  una pregunta de spec abierta —§7 de la propuesta del 2026-09-22— y hasta
   *  que se conteste la hoja lo dice en vez de elegir un cuerpo por su cuenta. */
  panelTipo?: PanelType | undefined
  bloques: BlockTable
  /** Para el agrupado del riel · «HOY», «ESTA SEMANA», «JULIO». */
  format: Formatter
  onClose: () => void
  /** **El selector de agente, sólo para admin** · 2026-10-06. Sin
   *  `onAgente` no se pinta: un planner no puede elegir —el servicio le
   *  devuelve 403— y un control que promete lo que no hay no se muestra. El
   *  `.pen` no lo dibuja; ver la propuesta del 2026-09-22 §10. */
  agentes?: ChatAgent[] | undefined
  /** `undefined` es «el que resuelva el servicio por rol». */
  agenteId?: string | undefined
  onAgente?: ((id: string | undefined) => void) | undefined
}

export function ChatSheet({
  contexto,
  periodo,
  titulo,
  panelTipo,
  bloques,
  format,
  onClose,
  agentes,
  agenteId,
  onAgente,
}: Props) {
  const { turns, threadId, historial, ask, resume, reset } = useChat(contexto, agenteId)
  const dePanel = esDePanel(contexto)
  const [texto, setTexto] = useState('')
  /** El riel colapsado es una pantalla propia del `.pen`. Vive acá y no en el
   *  contenedor: es preferencia de lectura de esta hoja, no estado de la app. */
  const [colapsado, setColapsado] = useState(false)
  // Un solo `now` para la hoja: dos llamadas distintas darían dos frescuras
  // para la misma respuesta.
  const ahora = new Date()

  /** Los hilos de ESTE panel y ESTE período · F3.7. El filtro lo aplica el
   *  servicio: pedir todos y descartar acá traería por la red las
   *  conversaciones de los otros once paneles para tirarlas. */
  const hilos = useThreads(contexto, periodo)
  const eliminar = useDeleteThread()

  /** Qué preguntar sobre este panel · §PEN:C3. Deterministas del lado del
   *  servicio, así que no se refrescan mientras la hoja está abierta. */
  const sugeridas = useSuggestions(dePanel ? contexto.panelId : null, periodo)

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
  const ultimo = turns.at(-1)
  const enVuelo = ultimo?.streaming === true

  return (
    <ChatOverlay
      open
      title="Preguntar a Synapse"
      contexto={`${titulo} · ${periodo}`}
      onClose={onClose}
    >
      {/* ── HISTORIAL · 220, o 52 colapsado · §PEN:C3 ──────────────────────
          **Es una COLUMNA, no un bloque debajo de la conversación.** El dibujo
          la pone a la izquierda, en `$dock`, con su cabecera arriba y su pie
          abajo — y por eso el `Spacer` del medio: el pie queda pegado al fondo
          aunque haya tres hilos.

          **El colapsado es una pantalla propia del `.pen`** —«C3 · Chat ·
          historial colapsado»—: el riel baja a 52 y la conversación toma los
          888 restantes, «el texto respira y las barras se leen mejor». */}
      <aside
        className={
          'flex shrink-0 flex-col gap-4 overflow-y-auto border-r border-w2 bg-dock py-6 ' +
          (colapsado ? 'w-13 items-center px-2' : 'w-55 px-4')
        }
      >
        <button
          type="button"
          onClick={() => setColapsado((c) => !c)}
          aria-expanded={!colapsado}
          aria-label={colapsado ? 'Abrir el historial' : 'Colapsar el historial'}
          className="flex items-center gap-2 font-mono text-label tracking-rotulo uppercase text-dim hover:text-ink cursor-pointer bg-transparent border-0 p-0"
        >
          {/* **Colapsado dice CUÁNTO esconde**, y es literal de la nota del
              dibujo: «un riel colapsado que no dice cuánto esconde no invita a
              abrirlo». Sin la cuenta es una flecha que no promete nada.

              **Abierto no repite «Historial»**, que es el rótulo de la cabecera
              del riel: decía la misma palabra dos veces, una arriba de la otra.
              Se vio al abrirlo. El nombre para el lector de pantalla lo pone
              `aria-label`, así que el control se sigue anunciando. */}
          {colapsado ? String(hilos.data?.length ?? 0) : '‹'}
        </button>

        {colapsado ? (
          // Del riel colapsado sobreviven tres cosas · §PEN:C3: el control para
          // reabrir, el «+» de nueva consulta y la cuenta. Las dos primeras son
          // estos botones; la cuenta está arriba.
          <button
            type="button"
            onClick={reset}
            aria-label="Nueva consulta"
            className="font-mono text-label tracking-rotulo uppercase text-acc hover:text-acc-hover cursor-pointer bg-transparent border-0 p-0"
          >
            +
          </button>
        ) : (
          <>
            {grupos.length === 0 ? (
              <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
                Todavía no preguntaste nada.
              </p>
            ) : (
              <ThreadRail
                groups={grupos}
                // **LOS DOS IDS, y acá es donde se confunden.** El riel
                // identifica sus filas por `id` —el uuid, que es lo que el DOM
                // y el `aria-current` necesitan— y `resume` manda `hiloId`, el
                // ENTERO que el binding de Gin pide en `thread_id`. Pasar
                // `resume` directo como `onSelect` compilaba y mandaba el uuid:
                // 400 en cada intento de retomar.
                format={format}
                onNueva={reset}
                onSelect={(uuid) => {
                  const elegido = (hilos.data ?? []).find((h) => h.id === uuid)
                  if (elegido?.hiloId != null) resume({ uuid: elegido.id, hiloId: elegido.hiloId })
                }}
                {...(activo === undefined ? {} : { activeId: activo.id })}
                // **Eliminar la consulta abierta suelta el hilo** · 2026-10-09.
                // Si no, lo próximo que se pregunte seguiría colgando de un
                // hilo que el riel ya no muestra. Se suelta al confirmar el
                // servicio, no antes: si falla, la conversación sigue ahí.
                onDelete={(uuid) =>
                  eliminar.mutate(uuid, {
                    onSuccess: () => {
                      if (activo?.id === uuid) reset()
                    },
                  })
                }
                {...(eliminar.isPending && eliminar.variables !== undefined
                  ? { deletingId: eliminar.variables }
                  : {})}
                {...(eliminar.isError && eliminar.variables !== undefined
                  ? { deleteFailedId: eliminar.variables }
                  : {})}
              />
            )}
          </>
        )}
      </aside>

      {/* ── CONVERSACIÓN · 720 · §PEN:C3 ───────────────────────────────────
          En `$panel`, con la cabecera y el campo en `$elev`: los dos se elevan
          sobre el hilo, que es lo que los deja fijos a la vista cuando el hilo
          crece. */}
      <div className="flex min-w-0 flex-1 flex-col bg-panel">
        <div className="flex items-start justify-between gap-4 bg-elev px-6 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            {/* El literal del `.pen`, con el contexto debajo. El dibujo cuenta
                la PESTAÑA porque ahí el chat es de la pestaña; acá es del
                panel —decisión del 2026-09-17—, así que nombra la métrica y el
                período. Copiar el literal sin su decisión dejaría una etiqueta
                que miente. */}
            <h2 className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0 min-w-0 truncate">
              Preguntar a Synapse
            </h2>
            <Label as="div">
              Contexto · {titulo} · {periodo}
            </Label>
            {onAgente !== undefined && agentes !== undefined && agentes.length > 0 ? (
              <div className="flex items-center gap-2 pt-1">
                <label htmlFor="chat-agente" className={ROTULO}>
                  Agente
                </label>
                {/* **Cambiar de agente empieza otra conversación**: el servicio
                    fija el agente al crear el hilo. Lo hace `useChat`; acá sólo
                    se elige. */}
                <select
                  id="chat-agente"
                  value={agenteId ?? ''}
                  onChange={(e) => onAgente(e.target.value === '' ? undefined : e.target.value)}
                  className="font-mono text-label tracking-rotulo uppercase text-ink bg-panel border border-w3 rounded-md px-2 py-1 outline-none focus:border-w5 min-w-0 cursor-pointer"
                >
                  <option value="">Por rol · el del servicio</option>
                  {agentes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {etiquetaDeAgente(a)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          {/* Dice `ESC` y no «Cerrar»: es la tecla que además funciona, así que
              el rótulo enseña el atajo. El nombre accesible sigue siendo
              «Cerrar» — `ESC` no se lee en voz alta como una acción. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="font-mono text-label tracking-rotulo uppercase text-dim hover:text-ink cursor-pointer bg-transparent border-0 p-0 shrink-0"
          >
            Esc
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          {/* **Un hilo reabierto dice qué trae y qué no** · 2026-10-09. El
              historial guarda el texto y la última cifra de cada respuesta,
              no el SQL ni las cifras anteriores del mismo turno: sin decirlo,
              una respuesta reabierta se lee como completa cuando no lo es. */}
          {historial === null ? null : (
            <div className="flex flex-col gap-1">
              {historial.estado === 'cargando' ? (
                <Label as="div">Abriendo la consulta</Label>
              ) : historial.estado === 'error' ? (
                <Label as="div">No se pudo abrir la consulta · podés seguir preguntando en el mismo hilo</Label>
              ) : (
                <>
                  <Label as="div">
                    Reabierta del historial · se guardan el texto y la última cifra de cada respuesta, no la consulta SQL
                  </Label>
                  {historial.hayAnteriores ? (
                    <Label as="div">Se muestran los últimos mensajes · los anteriores no se cargaron</Label>
                  ) : null}
                </>
              )}
            </div>
          )}
          <ChatThread
            turns={turns}
            panelTipo={panelTipo}
            bloques={bloques}
            format={format}
            now={ahora}
          />
        </div>

        <div className="flex flex-col gap-3 bg-elev px-6 py-4">
          {/* **Las sugeridas van pegadas al campo** · §PEN:C3 las dibuja ahí, y
              son DOS fuentes: mientras no se preguntó nada, las del panel;
              después, las del agente. Las del panel NO vuelven cuando el agente
              no manda ninguna — son un ABRIDOR, y lo descubrió una prueba. */}
          <Suggestions
            preguntas={
              turns.length === 0 ? (sugeridas.data ?? []) : (ultimo?.respuesta.sugerencias ?? [])
            }
            onPreguntar={(pregunta) => void ask(pregunta)}
            esperando={enVuelo}
          />

          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const pregunta = texto.trim()
              // Una pregunta vacía abriría un turno que no pregunta nada y
              // gastaría la cuota por usuario que el servicio comparte con
              // `/chat/*`.
              if (pregunta === '' || enVuelo) return
              setTexto('')
              void ask(pregunta)
            }}
          >
            <label htmlFor="panel-chat-pregunta" className="sr-only">
              Tu pregunta sobre {titulo}
            </label>
            {/* §PEN:C3 dice «Preguntá sobre esta pestaña», y desde F3.15 ese
                literal vuelve a ser el del dibujo cuando el contexto lo es. Con
                contexto de panel se adapta, que es más específico. */}
            <input
              id="panel-chat-pregunta"
              name="pregunta"
              type="text"
              autoComplete="off"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={dePanel ? 'Preguntá sobre este panel' : 'Preguntá sobre esta pestaña'}
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
        </div>
      </div>
    </ChatOverlay>
  )
}
