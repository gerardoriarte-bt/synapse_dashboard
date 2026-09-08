/** El cliente SSE del chat · F3.4
 *
 *  **No usa `EventSource`, y no por gusto.** `POST /config/chat` lleva la
 *  pregunta en el cuerpo, y `EventSource` solo hace GET sin cuerpo: la pregunta
 *  tendría que viajar en la URL, donde queda en logs de proxy y en el historial
 *  del navegador. Se usa `fetch` con `ReadableStream`, que además da
 *  `AbortController` de verdad —cerrar la hoja aborta la conexión, no solo deja
 *  de escuchar.
 *
 *  **El parseo de `text/event-stream` es a mano y es correcto que lo sea.** El
 *  formato es una línea `data:` por evento y una línea en blanco que lo cierra;
 *  lo único que hay que respetar es que **un chunk de la red no es un evento**:
 *  puede partir un JSON al medio y puede traer tres eventos juntos. Por eso hay
 *  un búfer y se corta por `\n\n`, no por chunk.
 */
import type { ChatEvent } from './types'

const BASE = import.meta.env['VITE_API_URL'] ?? '/api/v1'

export type ChatRequest = {
  pregunta: string
  tabId?: string
  hiloId?: string
}

/** Lo que el stream devolvió antes de cortarse. `parcial` sale del evento
 *  `error` del contrato: con SSE reintentar no es volver a llamar, así que el
 *  backend declara si lo recibido sigue valiendo. */
export class ChatStreamError extends Error {
  // Campo declarado y asignado, no propiedad de parámetro: `erasableSyntaxOnly`
  // prohíbe la forma corta, porque no se borra al compilar — emite código.
  readonly partial: boolean

  constructor(message: string, partial: boolean) {
    super(message)
    this.name = 'ChatStreamError'
    this.partial = partial
  }
}

/** Abre el stream y entrega un evento por vez.
 *
 *  Es un generador y no un callback: el consumidor decide cuándo pedir el
 *  siguiente, `for await` cancela solo al salir del bucle, y probarlo es
 *  recorrerlo — con callbacks habría que esperar a que dejen de llamarse, que
 *  es la clase de prueba que pasa por timeout.
 */
export async function* askSynapse(
  body: ChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const res = await fetch(`${BASE}/config/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify(body),
    ...(signal === undefined ? {} : { signal }),
  })

  if (!res.ok || res.body === null) {
    throw new ChatStreamError(
      `El agente no pudo abrir la conversación (${res.status}).`,
      false,
    )
  }

  const lector = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let bufer = ''

  try {
    for (;;) {
      const { done, value } = await lector.read()
      if (done) break
      bufer += value

      // `\n\n` cierra un evento. Lo que queda después del último se guarda: es
      // un evento incompleto y el próximo chunk lo termina.
      let corte = bufer.indexOf('\n\n')
      while (corte !== -1) {
        const crudo = bufer.slice(0, corte)
        bufer = bufer.slice(corte + 2)
        const evento = parse(crudo)
        if (evento !== null) yield evento
        corte = bufer.indexOf('\n\n')
      }
    }
  } finally {
    // Si el consumidor abandona el `for await`, esto corre igual y la conexión
    // no queda abierta. Es la mitad de «desmontar la hoja aborta el stream».
    await lector.cancel().catch(() => {})
  }
}

/** Una trama SSE a evento. Devuelve `null` para lo que no es un evento —
 *  comentarios de keep-alive (`:`), campos `event:` o `id:`— en vez de romper:
 *  un `:` cada 15 segundos es la forma estándar de que un proxy no corte la
 *  conexión, y tirar por eso sería tirar por lo que mantiene vivo el stream. */
function parse(trama: string): ChatEvent | null {
  const datos = trama
    .split('\n')
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .join('\n')

  if (datos === '') return null

  try {
    return JSON.parse(datos) as ChatEvent
  } catch {
    // Un `data:` que no es JSON es un backend roto, y callarlo dejaría la hoja
    // esperando para siempre.
    throw new ChatStreamError('El agente mandó una respuesta que no se entiende.', true)
  }
}
