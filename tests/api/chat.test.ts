/** El cliente SSE · F3.4
 *
 *  **Lo que se prueba es el troceado, que es donde esto se rompe.** Un chunk de
 *  la red no es un evento: puede partir un JSON al medio, puede traer tres
 *  juntos, y puede terminar sin cerrar el último. Un parser escrito «un chunk,
 *  un evento» funciona en desarrollo —donde el servidor local manda cada evento
 *  entero— y falla en producción detrás de un proxy. Por eso las tramas se
 *  arman a propósito partidas en lugares incómodos.
 *
 *  Las seis clases de evento salen del contrato, no de la implementación:
 *  `texto`, `dato`, `auditoria`, `sugerencias`, `fin`, `error`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatStreamError, askSynapse } from '@/api/chat'
import type { ChatEvent } from '@/api/types'

/** Un cuerpo de respuesta que emite exactamente estos trozos, en este orden.
 *  Los trozos son de la RED, no eventos: ahí está toda la gracia. */
function streamDe(trozos: string[], alCancelar?: () => void): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let i = 0
  return new ReadableStream({
    pull(controller) {
      if (i >= trozos.length) return controller.close()
      controller.enqueue(encoder.encode(trozos[i] as string))
      i += 1
    },
    cancel() {
      alCancelar?.()
    },
  })
}

function responde(trozos: string[], init: { status?: number } = {}, alCancelar?: () => void) {
  vi.stubGlobal('fetch', vi.fn(async () => {
    const status = init.status ?? 200
    return new Response(status === 200 ? streamDe(trozos, alCancelar) : null, { status })
  }))
}

async function recolectar(gen: AsyncGenerator<ChatEvent>): Promise<ChatEvent[]> {
  const salida: ChatEvent[] = []
  for await (const e of gen) salida.push(e)
  return salida
}

afterEach(() => vi.unstubAllGlobals())

const TEXTO = { tipo: 'texto', delta: 'Las ventas ' }
const FIN = { tipo: 'fin', hiloId: 'h-1' }

describe('el troceado · un chunk de la red no es un evento', () => {
  it('un chunk con TRES eventos los entrega como tres', async () => {
    responde([
      `data: ${JSON.stringify(TEXTO)}\n\n` +
        `data: ${JSON.stringify({ tipo: 'texto', delta: 'subieron.' })}\n\n` +
        `data: ${JSON.stringify(FIN)}\n\n`,
    ])
    const eventos = await recolectar(askSynapse({ pregunta: '¿Y las ventas?' }))
    expect(eventos.map((e) => e.tipo)).toEqual(['texto', 'texto', 'fin'])
  })

  it('un JSON partido al medio entre dos chunks se reconstruye', async () => {
    const entero = `data: ${JSON.stringify(TEXTO)}\n\n`
    const mitad = Math.floor(entero.length / 2)
    responde([entero.slice(0, mitad), entero.slice(mitad), `data: ${JSON.stringify(FIN)}\n\n`])

    const eventos = await recolectar(askSynapse({ pregunta: 'x' }))
    expect(eventos).toHaveLength(2)
    expect(eventos[0]).toEqual(TEXTO)
  })

  it('un evento sin su `\\n\\n` final NO se emite a medias', async () => {
    // El stream se corta antes de cerrar el último evento. Emitirlo sería
    // entregar un objeto que el backend no terminó de mandar.
    responde([`data: ${JSON.stringify(TEXTO)}\n\ndata: {"tipo":"texto","delta":"a med`])
    const eventos = await recolectar(askSynapse({ pregunta: 'x' }))
    expect(eventos).toEqual([TEXTO])
  })

  it('los comentarios de keep-alive no rompen ni se emiten', async () => {
    // Un `:` cada tantos segundos es la forma estándar de que un proxy no corte
    // la conexión. Tirar por eso sería tirar por lo que la mantiene viva.
    responde([`: keep-alive\n\ndata: ${JSON.stringify(FIN)}\n\n`])
    const eventos = await recolectar(askSynapse({ pregunta: 'x' }))
    expect(eventos).toEqual([FIN])
  })
})

describe('las seis clases del contrato llegan tipadas', () => {
  it('texto, dato, auditoria, sugerencias, fin y error', async () => {
    const seis = [
      TEXTO,
      {
        tipo: 'dato',
        valor: { forma: 'escalar', v: 12 },
        familia: 'demanda',
        base: '48 tiendas sobre 52',
        capa: 'GOLD',
        fuente: 'Snowflake',
        frescura: '2026-09-02T08:00:00Z',
        catalogVersion: 1,
      },
      { tipo: 'auditoria', sql: 'select 1', fuentesConsultadas: ['GOLD.ventas'] },
      { tipo: 'sugerencias', sugerencias: ['¿Y por tienda?'] },
      { tipo: 'error', mensaje: 'Se cortó.', parcial: true },
      FIN,
    ]
    responde(seis.map((e) => `data: ${JSON.stringify(e)}\n\n`))

    const eventos = await recolectar(askSynapse({ pregunta: 'x' }))
    expect(eventos.map((e) => e.tipo)).toEqual([
      'texto', 'dato', 'auditoria', 'sugerencias', 'error', 'fin',
    ])
  })

  it('el evento `dato` trae la procedencia PEGADA a la cifra', async () => {
    // Es la regla dura del contrato: «es estructuralmente imposible mandar una
    // cifra sin su procedencia». Si el evento llegara sin `base`, habría medio
    // segundo con un número en pantalla sin su badge.
    const dato = {
      tipo: 'dato',
      valor: { forma: 'escalar', v: 12 },
      familia: 'demanda',
      base: '48 tiendas sobre 52',
      capa: 'GOLD',
      fuente: 'Snowflake',
      frescura: '2026-09-02T08:00:00Z',
      catalogVersion: 1,
    }
    responde([`data: ${JSON.stringify(dato)}\n\n`])
    const [evento] = await recolectar(askSynapse({ pregunta: 'x' }))
    expect(evento).toMatchObject({ base: '48 tiendas sobre 52', capa: 'GOLD', familia: 'demanda' })
  })
})

describe('la pregunta viaja en el CUERPO, no en la URL', () => {
  it('es un POST con la pregunta en el body', async () => {
    responde([`data: ${JSON.stringify(FIN)}\n\n`])
    await recolectar(askSynapse({ pregunta: '¿cuánto vendimos?', tabId: 'tab-1' }))

    const llamada = vi.mocked(fetch).mock.calls[0]
    const [url, init] = llamada as [string, RequestInit]
    // En la URL quedaría en logs de proxy y en el historial del navegador, que
    // es la razón por la que esto no usa `EventSource`.
    expect(url).not.toContain('cuánto')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      pregunta: '¿cuánto vendimos?',
      tabId: 'tab-1',
    })
  })
})

describe('cortes y errores', () => {
  it('un HTTP que no es 200 sale como ChatStreamError sin parcial', async () => {
    responde([], { status: 503 })
    await expect(recolectar(askSynapse({ pregunta: 'x' }))).rejects.toThrow(ChatStreamError)
    await expect(recolectar(askSynapse({ pregunta: 'x' }))).rejects.toMatchObject({
      partial: false,
    })
  })

  it('un `data:` que no es JSON corta y lo dice, en vez de esperar para siempre', async () => {
    responde(['data: esto no es json\n\n'])
    await expect(recolectar(askSynapse({ pregunta: 'x' }))).rejects.toThrow(/no se entiende/)
  })

  it('abandonar el `for await` CANCELA el cuerpo · la conexión no queda abierta', async () => {
    // La mitad de «desmontar la hoja aborta el stream»: no alcanza con dejar de
    // leer, hay que cancelar. El `finally` del generador es lo que lo garantiza.
    //
    // **El origen NO se cierra solo, y esa es la parte que importa de la
    // prueba.** Con una lista finita de trozos, el pipe los consume enteros
    // antes de que el consumidor alcance a abandonar, el origen queda cerrado y
    // `cancel()` sobre algo cerrado no hace nada: la prueba fallaba con el
    // código correcto. Un servidor que sigue transmitiendo es el único caso en
    // el que abandonar significa algo.
    const cancelado = vi.fn()
    const encoder = new TextEncoder()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      new ReadableStream({
        pull(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(TEXTO)}\n\n`))
        },
        cancel: cancelado,
      }),
    )))

    for await (const _ of askSynapse({ pregunta: 'x' })) break

    // La cancelación viaja por el pipe en un microtask: sin este respiro se
    // comprueba antes de que llegue al origen.
    await new Promise((r) => setTimeout(r, 0))
    expect(cancelado).toHaveBeenCalled()
  })
})
