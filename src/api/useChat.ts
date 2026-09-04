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
import { ChatStreamError, askSynapse } from './chat'
import type { ChatRequest } from './chat'
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

export function useChat(tabId?: string) {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)

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
        ...(tabId === undefined ? {} : { tabId }),
        ...(threadId === null ? {} : { hiloId: threadId }),
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
    [tabId, threadId, turns.length],
  )

  return { turns, threadId, ask }
}
