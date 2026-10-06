/** El cliente SSE del chat · F3.4, y su traducción al contrato
 *
 *  **No usa `EventSource`, y no por gusto.** `POST /config/chat` lleva la
 *  pregunta en el cuerpo, y `EventSource` solo hace GET sin cuerpo: la pregunta
 *  tendría que viajar en la URL, donde queda en logs de proxy y en el historial
 *  del navegador. Se usa `fetch` con `ReadableStream`, que además da
 *  `AbortController` de verdad —cerrar la hoja aborta la conexión, no solo deja
 *  de escuchar.
 *
 *  **El parseo de `text/event-stream` es a mano y es correcto que lo sea.** El
 *  formato es una línea `event:`, una `data:` y una línea en blanco que cierra
 *  la trama; lo único que hay que respetar es que **un chunk de la red no es una
 *  trama**: puede partir un JSON al medio y puede traer tres tramas juntas. Por
 *  eso hay un búfer y se corta por `\n\n`, no por chunk.
 *
 *  ── POR QUÉ ESTE ARCHIVO TRADUCE ────────────────────────────────────────────
 *
 *  **El discriminador del cable está en la línea `event:`, no adentro del
 *  JSON.** El contrato declara `EventoDeChat` con un campo `tipo`; el servicio
 *  manda `event: delta` y un `data:` que no tiene `tipo` en ningún lado.
 *
 *  Hasta el 2026-09-21 este archivo descartaba la línea `event:` a propósito
 *  —era «un campo que no es un evento»— y entregaba el `data:` crudo. `useChat`
 *  conmutaba sobre `evento.tipo`, que era `undefined` para todas las tramas, y
 *  **el chat no pintaba una sola palabra**. Los mocks de MSW no lo delataban
 *  porque hablan el idioma de nuestra capa interna: es el mismo modo de falla
 *  que tuvo `panels:batch`, y la lección es la misma — un mock que habla tu
 *  dialecto esconde la frontera en vez de probarla.
 *
 *  Así que este archivo es a `/config/chat` lo que `adapt.ts` es a las seis
 *  rutas de la consola, **y le rige la misma regla: renombra y reformatea, no
 *  calcula, no inventa una cifra y no escribe copy de producto.** Tipa contra
 *  `console-generated.ts`, que se genera de la transcripción del cable, y no
 *  contra structs de Go leídos a mano.
 *
 *  ── LAS TRES TRAMAS QUE SE TIRAN, Y POR QUÉ ─────────────────────────────────
 *
 *  `thinking` no tiene equivalente en el contrato: es el estado interno del
 *  agente, no parte de la respuesta.
 *
 *  `data` **SE TRADUCE desde el 2026-09-22** · F3.6. Estuvo descartada un día,
 *  porque `EventoDato` exige `familia` más los cinco campos de `Gobierno` y el
 *  cable mandaba cinco campos que no incluían ninguno. Se pidió, y `55e8419`
 *  los agregó todos: `base`, `family`, `layer`, `source_system`,
 *  `catalog_version`, `freshness` y `queried_at`.
 *
 *  **`frescura` sale de `queried_at`, no de `freshness`, y es una decisión.**
 *  Los dos vienen y significan cosas distintas: `freshness` es cuándo se
 *  materializó la MÉTRICA y `queried_at` cuándo el agente produjo ESTA cifra.
 *  Una cifra que el agente calculó al vuelo es tan fresca como su consulta, no
 *  como el último refresco del panel. Cuando el agente no consultó —no hay
 *  `tool_result`— `queried_at` viene vacío y se cae a `freshness`, que es lo
 *  único que queda.
 *
 *  `user_thread_id` de `thread_info` se pierde: el contrato tiene un solo campo
 *  de id en `EventoFin` y ahí va el que continúa la conversación. El uuid que
 *  pide `GET /config/chat/threads/{id}/messages` lo va a necesitar F3.7, y ese
 *  día el contrato necesita un campo donde viaje.
 */
import { CAPAS, FAMILIAS, adaptValue } from './adapt'
import type { components as wire } from './console-generated'
import type { ChatEvent } from './types'
import { currentToken } from '../app/auth/session'
import { apiBase } from './base'

type WireSchemas = wire['schemas']
type WireChatFrameData = WireSchemas['ChatFrameData']

const BASE = apiBase()

/** El contexto de una pregunta · **uno de los dos, nunca los dos**.
 *
 *  ── POR QUÉ ES UNA UNIÓN Y NO DOS CAMPOS OPCIONALES · 2026-09-26 ───────────
 *
 *  El servicio exige **exactamente uno** —`if (req.PanelContext == nil) ==
 *  (req.TabContext == nil)` devuelve 400— así que con dos opcionales se podría
 *  escribir el estado que el cable rechaza, y el compilador no diría nada. La
 *  unión lo hace imposible de expresar.
 *
 *  **Hasta hoy sólo existía la forma de panel**, y era del cable: `panel_context`
 *  estaba `binding:"required"`. Lo pedimos el 2026-09-25 —F3.15— y llegó en
 *  `8da70de`; medido contra `8633b10` el 26.
 *
 *  **Y la de pestaña es la que hace posible la presencia.** Un chat «del panel»
 *  no puede estar siempre visible porque el panel es quien da el contexto; uno
 *  «de la pestaña» sí. Es la decisión humana del 2026-09-22. */
export type ContextoDeChat =
  | { panelId: string; periodo: string }
  | { tabId: string; periodo: string }

/** `true` si el contexto es de panel. Se usa para elegir la rama del cable y
 *  para decidir qué puede ofrecer la hoja: las sugeridas y el riel de hilos
 *  cuelgan de un panel, no de una pestaña. */
export function esDePanel(c: ContextoDeChat): c is { panelId: string; periodo: string } {
  return 'panelId' in c
}

/** Lo que el front pide, en el vocabulario del contrato. */
export type ChatRequest = {
  pregunta: string
  contexto: ContextoDeChat
  hiloId?: string
}

/** Lo que el stream devolvió antes de cortarse. `parcial` sale del evento
 *  `error` del contrato: con SSE reintentar no es volver a llamar, así que hay
 *  que declarar si lo recibido sigue valiendo. */
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

/** Abre el stream y entrega un evento del CONTRATO por vez.
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
  // **El token va acá a mano, y por eso se olvidó** · corregido el 2026-09-24.
  //
  // El resto de las llamadas pasan por `client.ts`, que lo agrega solo. El chat
  // NO puede usar ese camino: `fetch` crudo es lo único que deja leer el cuerpo
  // como stream, y al escribirlo aparte se copiaron las dos cabeceras que el
  // SSE necesita y no la que la ruta exige.
  //
  // **El servicio contestaba 401 en 170 microsegundos** —el middleware, no
  // Snowflake— y el mensaje de abajo lo atribuía al agente: «El agente no pudo
  // abrir la conversación». El chat nunca autenticó, ni una vez.
  //
  // **MSW no podía verlo**: los handlers no verifican el token, así que una
  // petición sin credencial les responde igual que una con. Es la familia de
  // F1.38 —un mock que habla tu idioma no prueba la frontera— con otra cara: un
  // mock que no exige lo que el servicio exige tampoco la prueba.
  const token = currentToken()
  const res = await fetch(`${BASE}/config/chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
      ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(alCable(body)),
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

  // El id del hilo llega en la PRIMERA trama y el contrato lo pide en la
  // ÚLTIMA: `done` del cable es `{}`. Sostenerlo acá es lo que permite que
  // `EventoFin` siga teniendo `hiloId` sin que el backend lo repita.
  const hilo = { id: null as string | null }
  // `parcial` tampoco viaja en el cable. Lo que sí es un hecho del stream es si
  // ya se entregó contenido antes del corte, y el servicio persiste la
  // respuesta acumulada —`defer s.persistAssistant(st)`— así que lo entregado
  // no se pierde. Es la lectura con evidencia; si el cable declara el campo
  // algún día, esto se borra y se lee de ahí.
  const entregado = { algo: false }

  try {
    for (;;) {
      const { done, value } = await lector.read()
      if (done) break
      bufer += value

      // `\n\n` cierra una trama. Lo que queda después de la última se guarda: es
      // una trama incompleta y el próximo chunk la termina.
      let corte = bufer.indexOf('\n\n')
      while (corte !== -1) {
        const crudo = bufer.slice(0, corte)
        bufer = bufer.slice(corte + 2)
        const evento = traducir(parse(crudo), hilo, entregado)
        if (evento !== null) {
          if (evento.tipo === 'texto' || evento.tipo === 'auditoria') {
            entregado.algo = true
          }
          yield evento
        }
        corte = bufer.indexOf('\n\n')
      }
    }
  } finally {
    // Si el consumidor abandona el `for await`, esto corre igual y la conexión
    // no queda abierta. Es la mitad de «desmontar la hoja aborta el stream».
    await lector.cancel().catch(() => {})
  }
}

/** El cuerpo del contrato al cuerpo del cable. */
function alCable(body: ChatRequest): WireSchemas['ChatAskRequest'] {
  return {
    question: body.pregunta,
    // **Una de las dos ramas y nunca las dos**: mandar ambas es 400, igual que
    // no mandar ninguna. El tipo de `contexto` ya lo impide; esto sólo traduce.
    ...(esDePanel(body.contexto)
      ? { panel_context: { panel_id: body.contexto.panelId, period: body.contexto.periodo } }
      : { tab_context: { tab_id: body.contexto.tabId, period: body.contexto.periodo } }),
    // **El `thread_id` del cable es un ENTERO**, no el uuid que sugiere
    // `hiloId`. Se guarda como texto porque `EventoFin.hiloId` es texto, y se
    // devuelve como número porque el binding de Gin lo pide `*int64`: un texto
    // ahí da 400.
    ...(body.hiloId === undefined ? {} : { thread_id: Number(body.hiloId) }),
  }
}

/** Una trama cruda a sus dos partes. Devuelve `null` para lo que no es una
 *  trama de evento —comentarios de keep-alive (`:`) y tramas sin `data:`— en vez
 *  de romper: un `:` cada 15 segundos es la forma estándar de que un proxy no
 *  corte la conexión, y tirar por eso sería tirar por lo que mantiene vivo el
 *  stream. */
function parse(trama: string): { evento: string; datos: unknown } | null {
  const lineas = trama.split('\n')

  // El nombre puede venir con o sin espacio tras los dos puntos; el formato lo
  // permite y el servicio escribe `event: %s`.
  const nombre = lineas.find((l) => l.startsWith('event:'))?.slice(6).trim() ?? ''

  const datos = lineas
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .join('\n')

  if (datos === '') return null

  try {
    return { evento: nombre, datos: JSON.parse(datos) as unknown }
  } catch {
    // Un `data:` que no es JSON es un backend roto, y callarlo dejaría la hoja
    // esperando para siempre.
    throw new ChatStreamError('El agente mandó una respuesta que no se entiende.', true)
  }
}

/** El cable al contrato. Devuelve `null` para las tramas que no tienen
 *  equivalente — ver la cabecera, que dice cuáles y por qué. */
function traducir(
  trama: { evento: string; datos: unknown } | null,
  hilo: { id: string | null },
  entregado: { algo: boolean },
): ChatEvent | null {
  if (trama === null) return null
  const { evento, datos } = trama

  switch (evento) {
    case 'thread_info': {
      const info = datos as WireSchemas['ChatFrameThreadInfo']
      hilo.id = String(info.thread_id)
      return null
    }

    case 'delta': {
      const d = datos as WireSchemas['ChatFrameDelta']
      return { tipo: 'texto', delta: d.text }
    }

    case 'sql': {
      // `fuentesConsultadas` y `limiteDeclarado` son opcionales en el contrato y
      // el cable no los manda: el agente los escribe como secciones del
      // markdown. Quedan ausentes, que es la regla del adaptador — no en un
      // arreglo vacío, que se leería como «se consultó nada».
      const s = datos as WireSchemas['ChatFrameSQL']
      return { tipo: 'auditoria', sql: s.sql }
    }

    case 'error': {
      const e = datos as WireSchemas['ChatFrameError']
      return { tipo: 'error', mensaje: e.message, parcial: entregado.algo }
    }

    case 'done': {
      // Sin `thread_info` no hay id, y un `fin` con `hiloId: ''` haría que la
      // próxima pregunta abriera un hilo nuevo en silencio. Que el turno cierre
      // por el `finally` del hook es preferible a inventar una continuación.
      if (hilo.id === null) return null
      return { tipo: 'fin', hiloId: hilo.id }
    }

    case 'data': {
      const d = datos as WireChatFrameData
      const valor = adaptValue(d.data)
      // **Un valor que no se puede adaptar NO se pinta a medias.** `adaptValue`
      // devuelve la razón —«el valor no declara su forma»— y descartarlo es lo
      // mismo que hace `adapt.ts` con un payload de panel que no cierra.
      if (!valor.ok) return null

      const p = d.provenance
      const familia = FAMILIAS[p.family]
      // **Sin familia no se dibuja**, y no se cae a una por defecto: el color de
      // una cifra del chat ya se inventó una vez —estaba cableado a `demanda`—
      // y por eso `familia` entró al contrato el 2026-08-19.
      if (familia === undefined) return null

      return {
        tipo: 'dato',
        valor: valor.valor,
        familia,
        base: p.base,
        capa: CAPAS[p.layer] ?? 'GOLD',
        fuente: p.source_system,
        // Ver la cabecera: la cifra es tan fresca como la consulta que la
        // produjo, no como el último refresco del panel.
        frescura: p.queried_at === '' ? p.freshness : p.queried_at,
        catalogVersion: p.catalog_version,
      }
    }

    // `thinking`: es estado interno del agente, no parte de la respuesta. Un
    // evento que el servicio agregue mañana cae acá también, y callarlo es
    // correcto — el contrato declara seis tipos y `useChat` los agota.
    default:
      return null
  }
}
