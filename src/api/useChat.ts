/** El hilo de conversación, fuera del componente que lo pinta · F3.8
 *
 *  §4 separa contenedor de presentacional y acá vale doble: el componente de
 *  mensajes recibe **una lista y un estado**, y no sabe qué es SSE. Es lo que
 *  permite pintarlo con mensajes fijos en una prueba o en el builder sin abrir
 *  una conexión.
 *
 *  **Desmontar aborta.** El `AbortController` se dispara en la limpieza del
 *  efecto, así que cerrar la hoja corta la conexión en vez de dejarla
 *  transmitiendo contra un componente que ya no existe — que además es cómo se
 *  llega a un `setState` sobre algo desmontado.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatStreamError, askSynapse, esDePanel } from './chat'
import type { ChatRequest, ContextoDeChat, TurnoGuardado } from './chat'
import { api } from './client'
export type { ContextoDeChat }
import type { ChatEvent } from './types'

/** Lo que el agente respondió a UNA pregunta.
 *
 *  La prosa se acumula en `texto`; las cifras van aparte en `datos` y no
 *  intercaladas en la prosa, porque cada una se pinta con el cuerpo de panel que
 *  le toca · F3.6. */
export type Answer = {
  texto: string
  datos: Extract<ChatEvent, { tipo: 'dato' }>[]
  auditoria: Extract<ChatEvent, { tipo: 'auditoria' }> | null
  sugerencias: string[]
}

export type ChatTurn = {
  pregunta: string
  respuesta: Answer
  /** Mientras el stream de ESTE turno sigue abierto. */
  streaming: boolean
  /** El corte, si lo hubo. `parcial` decide si lo ya recibido se conserva. */
  error: { mensaje: string; parcial: boolean } | null
}

const VACIA: Answer = { texto: '', datos: [], auditoria: null, sugerencias: [] }

/** El estado de un hilo reabierto. `null` es «no se reabrió nada»: una
 *  consulta nueva o una conversación que se está teniendo ahora. */
export type Historial = {
  estado: 'cargando' | 'listo' | 'error'
  /** La página trajo las últimas 50 y hay mensajes antes. */
  hayAnteriores: boolean
}

/** Un turno guardado a la forma de los turnos en vivo. Sin `auditoria` ni
 *  `sugerencias`: el servicio no los guarda, y la hoja lo declara. */
function aTurno(t: TurnoGuardado): ChatTurn {
  return {
    pregunta: t.pregunta,
    respuesta: { texto: t.texto ?? '', datos: t.datos, auditoria: null, sugerencias: [] },
    streaming: false,
    error: t.texto === null ? { mensaje: 'El turno se cortó antes de terminar.', parcial: false } : null,
  }
}

/** Aplica un evento a la respuesta en curso.
 *
 *  Función pura y exportada a propósito: es toda la lógica de acumulación, y
 *  probarla no debería necesitar ni React ni una conexión. */
export function apply(previa: Answer, evento: ChatEvent): Answer {
  switch (evento.tipo) {
    case 'texto':
      return { ...previa, texto: previa.texto + evento.delta }
    case 'dato':
      return { ...previa, datos: [...previa.datos, evento] }
    case 'auditoria':
      return { ...previa, auditoria: evento }
    case 'sugerencias':
      return { ...previa, sugerencias: evento.sugerencias }
    case 'fin':
    case 'error':
      // No cambian la respuesta: cambian el ESTADO del turno, que lo lleva el
      // hook. Mezclarlos acá haría que `apply` decidiera dos cosas distintas.
      return previa
  }
}

/** **`PanelContext` se fue el 2026-09-26** y su lugar lo toma `ContextoDeChat`,
 *  que es una unión: panel o pestaña, nunca las dos · F3.15.
 *
 *  Lo que NO cambió es por qué son dos campos y no doce: el servicio arma el
 *  resto —la métrica, el valor, los paneles de la pestaña— leyendo por id, así
 *  que el front no los transcribe. Esa parte del criterio de F3.2 se retiró el
 *  2026-09-17 y esto no la reabre. */
/** `agenteId` es el que eligió un admin en el selector · 2026-10-06. Ausente,
 *  el servicio resuelve el agente por rol y tenant, que es el camino de
 *  cualquier otro usuario. */
export function useChat(contexto: ContextoDeChat, agenteId?: string) {
  const clave = esDePanel(contexto)
    ? `panel:${contexto.panelId}:${contexto.periodo}`
    : `tab:${contexto.tabId}:${contexto.periodo}`
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)

  const abort = useRef<AbortController | null>(null)

  /** Retomar un hilo del riel · F3.7, y **reabrirlo** desde el 2026-10-09.
   *
   *  **Apunta el próximo envío al hilo elegido y trae su conversación.** Hasta
   *  el 2026-10-09 sólo apuntaba: el criterio de F3.7 pedía que retomar
   *  reenviara el contexto y no traer los mensajes, así que la hoja quedaba
   *  vacía. Visto desde el uso era un clic que no abría nada, y el `.pen`
   *  dibuja C3 con la conversación del hilo activo a la vista.
   *
   *  **Los dos ids, cada uno a lo suyo**: el UUID trae los mensajes y el entero
   *  continúa la conversación. Ver `ChatThread` en el cable.
   *
   *  **Una respuesta que llega tarde no pisa otro hilo.** Si mientras carga se
   *  elige otro o se abre una consulta nueva, `pedido` ya cambió y se descarta. */
  const pedido = useRef(0)
  const [historial, setHistorial] = useState<Historial | null>(null)

  const resume = useCallback((hilo: { uuid: string; hiloId: string }) => {
    abort.current?.abort()
    setThreadId(hilo.hiloId)
    setTurns([])
    const este = ++pedido.current
    setHistorial({ estado: 'cargando', hayAnteriores: false })
    api.threadMessages(hilo.uuid).then(
      ({ turnos, hayAnteriores }) => {
        if (pedido.current !== este) return
        setTurns(turnos.map(aTurno))
        setHistorial({ estado: 'listo', hayAnteriores })
      },
      () => {
        if (pedido.current !== este) return
        setHistorial({ estado: 'error', hayAnteriores: false })
      },
    )
  }, [])

  /** «Nueva consulta» · §PEN:C3 lo pone en la cabecera del riel.
   *
   *  **Suelta el hilo además de limpiar los turnos.** Con el `hiloId` puesto, lo
   *  que parece una conversación nueva seguiría colgando de la anterior del
   *  lado del servidor — y el riel mostraría una sola fila donde el usuario ve
   *  dos consultas. */
  const reset = useCallback(() => {
    abort.current?.abort()
    pedido.current++
    setHistorial(null)
    setThreadId(null)
    setTurns([])
  }, [])

  /** **Cambiar de agente es una conversación nueva.** El servicio fija el
   *  agente al crear el hilo e ignora `agent_id` cuando va `thread_id`, así que
   *  seguir el hilo después de cambiar mostraría un agente en el selector y
   *  contestaría otro. Se compara contra el anterior y no se usa un efecto
   *  sobre `agenteId` a secas: el primer render no es un cambio. */
  const agenteAnterior = useRef(agenteId)
  useEffect(() => {
    if (agenteAnterior.current === agenteId) return
    agenteAnterior.current = agenteId
    reset()
  }, [agenteId, reset])

  // Una sola limpieza, al desmontar. El `ref` sostiene el controlador del turno
  // en curso, sea cual sea.
  useEffect(() => () => abort.current?.abort(), [])

  const ask = useCallback(
    async (pregunta: string) => {
      abort.current?.abort()
      const control = new AbortController()
      abort.current = control

      const indice = turns.length
      setTurns((previos) => [
        ...previos,
        { pregunta, respuesta: VACIA, streaming: true, error: null },
      ])

      const parche = (cambio: (t: ChatTurn) => ChatTurn) =>
        setTurns((previos) => previos.map((t, i) => (i === indice ? cambio(t) : t)))

      const cuerpo: ChatRequest = {
        pregunta,
        // **Se pasa entero y no campo por campo**: desarmarlo acá obligaría a
        // reconstruir la unión, y ahí es donde alguien manda las dos ramas.
        contexto,
        ...(threadId === null ? {} : { hiloId: threadId }),
        ...(agenteId === undefined ? {} : { agenteId }),
      }

      try {
        for await (const evento of askSynapse(cuerpo, control.signal)) {
          if (evento.tipo === 'fin') {
            setThreadId(evento.hiloId)
            parche((t) => ({ ...t, streaming: false }))
            continue
          }
          if (evento.tipo === 'error') {
            // `parcial` decide qué se conserva, y es del backend: con SSE
            // reintentar no es volver a llamar, así que el front no adivina si
            // lo recibido sigue valiendo.
            parche((t) => ({
              ...t,
              streaming: false,
              error: { mensaje: evento.mensaje, parcial: evento.parcial },
              respuesta: evento.parcial ? t.respuesta : VACIA,
            }))
            continue
          }
          parche((t) => ({ ...t, respuesta: apply(t.respuesta, evento) }))
        }
      } catch (e) {
        // Abortar no es un error del agente: es el usuario cerrando la hoja, y
        // pintarle «algo salió mal» a quien acaba de irse sería mentir.
        if (control.signal.aborted) return
        const parcial = e instanceof ChatStreamError ? e.partial : false
        parche((t) => ({
          ...t,
          streaming: false,
          error: {
            mensaje: e instanceof Error ? e.message : 'El agente no respondió.',
            parcial,
          },
          respuesta: parcial ? t.respuesta : VACIA,
        }))
      } finally {
        parche((t) => (t.streaming ? { ...t, streaming: false } : t))
      }
    },
    // **Una clave derivada y no el objeto**: el llamador pasa un literal, así
    // que `[contexto]` recrearía `ask` en cada render. Y con la unión ya no
    // alcanza `contexto.panelId` — la rama de pestaña no lo tiene.
    [clave, threadId, turns.length, agenteId],
  )

  return { turns, threadId, historial, ask, resume, reset }
}
