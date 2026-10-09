// @vitest-environment jsdom

/** El cliente SSE y su traducción · F3.4 y la integración de 2026-09-21
 *
 *  **Estas pruebas hablan el CABLE, no nuestro dialecto, y esa es la
 *  corrección.** La versión anterior emitía `data: {"tipo":"texto",...}` —el
 *  vocabulario del contrato— y pasaba en verde mientras el chat no pintaba una
 *  sola palabra contra el servicio real, porque el servicio manda
 *  `event: delta` y un `data:` sin ningún `tipo` adentro. Es el mismo modo de
 *  falla que tuvo `panels:batch`: un mock que habla el idioma de tu capa interna
 *  no prueba la frontera, la esconde.
 *
 *  Las tramas de acá están copiadas de `contracts/synapse-console-wire.yaml`,
 *  que es la transcripción de `82da946`. No se escriben de memoria.
 *
 *  **Lo que se prueba del troceado es que un chunk de la red no es una trama.**
 *  Puede partir un JSON al medio, puede traer tres juntas, y puede terminar sin
 *  cerrar la última. Un parser escrito «un chunk, una trama» funciona en
 *  desarrollo —donde el servidor local manda cada trama entera— y falla en
 *  producción detrás de un proxy. Por eso se parten en lugares incómodos.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatStreamError, askSynapse, turnosDelHistorial } from '@/api/chat'
import { saveToken, signOut } from '@/app/auth/session'
import type { ChatEvent } from '@/api/types'

/** Un cuerpo de respuesta que emite exactamente estos trozos, en este orden.
 *  Los trozos son de la RED, no tramas: ahí está toda la gracia. */
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

/** Una trama del cable, con sus dos líneas. */
function trama(evento: string, datos: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`
}

const PREGUNTA = {
  pregunta: '¿Y las ventas?',
  contexto: { panelId: 'p-1', periodo: '2026-09' },
}

/** La otra rama · F3.15. El servicio exige **exactamente una** de las dos. */
const PREGUNTA_DE_PESTANA = {
  pregunta: '¿Cómo vamos este mes?',
  contexto: { tabId: 'tab-1', periodo: '2026-09' },
}

const THREAD_INFO = { thread_id: 41, parent_message_id: 7, user_thread_id: 'ut-uuid' }
const INFO = trama('thread_info', THREAD_INFO)
const DONE = trama('done', {})

describe('el discriminador está en la línea `event:` · el defecto de 2026-09-17', () => {
  it('`event: delta` con `{text}` se traduce a `{tipo: texto, delta}`', async () => {
    // Es LA prueba de este arreglo. Antes el cliente tiraba la línea `event:` y
    // entregaba `{text: '...'}` tal cual, sin `tipo`: `useChat` conmutaba sobre
    // `undefined` y no acumulaba nada.
    responde([INFO, trama('delta', { text: 'Las ventas ' }), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos[0]).toEqual({ tipo: 'texto', delta: 'Las ventas ' })
  })

  it('`event: sql` se traduce a `auditoria`, SIN inventar fuentes ni límite', async () => {
    // El cable manda `{sql, tool}` y nada más: el agente escribe las fuentes y
    // el límite como secciones del markdown. Los campos quedan AUSENTES, que es
    // la regla del adaptador — un arreglo vacío se leería como «se consultó
    // nada», que es una afirmación que nadie hizo.
    responde([INFO, trama('sql', { sql: 'select 1', tool: 'cortex_analyst' }), DONE])

    const [evento] = await recolectar(askSynapse(PREGUNTA))
    expect(evento).toEqual({ tipo: 'auditoria', sql: 'select 1' })
    expect(evento).not.toHaveProperty('fuentesConsultadas')
    expect(evento).not.toHaveProperty('limiteDeclarado')
  })

  it('`event: error` se traduce a `error`, con el mensaje del cable', async () => {
    responde([INFO, trama('error', { code: 'upstream_error', message: 'Se cortó.' }), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos[0]).toMatchObject({ tipo: 'error', mensaje: 'Se cortó.' })
  })

  it('el nombre del evento sin espacio tras los dos puntos también vale', async () => {
    // El formato lo permite y un proxy podría reescribirlo. El servicio escribe
    // `event: %s`, pero depender de ese espacio sería depender de un detalle de
    // formateo de Go.
    responde([`event:delta\ndata: ${JSON.stringify({ text: 'ok' })}\n\n`])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos).toEqual([{ tipo: 'texto', delta: 'ok' }])
  })
})

describe('el id del hilo llega PRIMERO y el contrato lo pide ÚLTIMO', () => {
  it('`fin` lleva el `thread_id` que trajo `thread_info`', async () => {
    // `done` del cable es `{}`. El id viene en la primera trama, así que el
    // traductor lo sostiene hasta el final. Sin esto, `EventoFin.hiloId` sería
    // vacío y cada pregunta abriría un hilo nuevo en silencio.
    responde([INFO, trama('delta', { text: 'hola' }), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos.at(-1)).toEqual({ tipo: 'fin', hiloId: '41' })
  })

  it('el `thread_id` viaja como NÚMERO cuando se continúa el hilo', async () => {
    // El binding de Gin lo declara `*int64`: mandar el texto '41' da 400.
    responde([INFO, DONE])
    await recolectar(askSynapse({ ...PREGUNTA, hiloId: '41' }))

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string).thread_id).toBe(41)
  })

  it('sin `thread_info` no se emite `fin` · antes que inventar una continuación', async () => {
    responde([trama('delta', { text: 'hola' }), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos.map((e) => e.tipo)).toEqual(['texto'])
  })

  it('`thread_info` no se emite como evento · no es parte de la respuesta', async () => {
    responde([INFO, DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos).toEqual([{ tipo: 'fin', hiloId: '41' }])
  })
})

describe('lo que el traductor DESCARTA, y por qué', () => {
  it('`event: data` se descarta · F3.6 está bloqueada y no se razona por encima', async () => {
    // El cable manda `{shape, data, provenance}` y `EventoDato` exige
    // `familia`, que no viene. Componerla sería elegir el color de una cifra en
    // el componente, que es el defecto por el que `familia` entró al contrato
    // el 2026-08-19. Esta prueba es lo que avisa el día que el campo llegue.
    responde([
      INFO,
      trama('data', {
        shape: 'escalar',
        data: { v: 12 },
        provenance: {
          source: 'cortex_agent',
          metric_key: 'revenue',
          period: '2026-09',
          sql_available: true,
        },
      }),
      DONE,
    ])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos.map((e) => e.tipo)).toEqual(['fin'])
  })

  it('`event: thinking` se descarta · es estado del agente, no respuesta', async () => {
    responde([
      INFO,
      trama('thinking', { status: 'running', message: 'consultando' }),
      trama('thinking', { text: 'pensando' }),
      DONE,
    ])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos.map((e) => e.tipo)).toEqual(['fin'])
  })

  it('un evento que el servicio agregue mañana no rompe el stream', async () => {
    responde([INFO, trama('inventado_manana', { x: 1 }), trama('delta', { text: 'ok' }), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos.map((e) => e.tipo)).toEqual(['texto', 'fin'])
  })

  it('`user_thread_id` se pierde · el contrato no tiene dónde ponerlo', async () => {
    // No es un olvido: `EventoFin` tiene UN campo de id y ahí va el que
    // continúa la conversación. El uuid que pide
    // `GET /config/chat/threads/{id}/messages` lo va a necesitar F3.7, y ese día
    // hace falta un campo en el contrato. La prueba existe para que se note.
    responde([INFO, DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(JSON.stringify(eventos)).not.toContain('ut-uuid')
  })
})

describe('el troceado · un chunk de la red no es una trama', () => {
  it('un chunk con TRES tramas las entrega como tres', async () => {
    responde([INFO + trama('delta', { text: 'Las ventas ' }) + trama('delta', { text: 'subieron.' }) + DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos.map((e) => e.tipo)).toEqual(['texto', 'texto', 'fin'])
  })

  it('un JSON partido al medio entre dos chunks se reconstruye', async () => {
    const entera = trama('delta', { text: 'Las ventas ' })
    const mitad = Math.floor(entera.length / 2)
    responde([INFO, entera.slice(0, mitad), entera.slice(mitad), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos).toHaveLength(2)
    expect(eventos[0]).toEqual({ tipo: 'texto', delta: 'Las ventas ' })
  })

  it('una trama sin su `\\n\\n` final NO se emite a medias', async () => {
    // El stream se corta antes de cerrar la última trama. Emitirla sería
    // entregar un objeto que el backend no terminó de mandar.
    responde([INFO + trama('delta', { text: 'entera' }) + 'event: delta\ndata: {"text":"a med'])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos).toEqual([{ tipo: 'texto', delta: 'entera' }])
  })

  it('los comentarios de keep-alive no rompen ni se emiten', async () => {
    // Un `:` cada tantos segundos es la forma estándar de que un proxy no corte
    // la conexión. Tirar por eso sería tirar por lo que la mantiene viva.
    responde([`: keep-alive\n\n`, INFO, DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos).toEqual([{ tipo: 'fin', hiloId: '41' }])
  })
})

describe('la pregunta viaja en el CUERPO, con el contexto de panel', () => {
  it('es un POST con `question` y `panel_context`, en el vocabulario del cable', async () => {
    responde([INFO, DONE])
    await recolectar(
      askSynapse({ pregunta: '¿cuánto vendimos?', contexto: { panelId: 'p-9', periodo: '2026-08' } }),
    )

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    // En la URL quedaría en logs de proxy y en el historial del navegador, que
    // es la razón por la que esto no usa `EventSource`.
    expect(url).not.toContain('cuánto')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      question: '¿cuánto vendimos?',
      panel_context: { panel_id: 'p-9', period: '2026-08' },
    })
  })

  // ── LA OTRA RAMA · F3.15 ──────────────────────────────────────────────────
  //
  // El servicio exige **exactamente uno** de los dos contextos: con los dos o
  // con ninguno devuelve 400, medido el 2026-09-26. Así que no alcanza con que
  // `tab_context` salga: hay que afirmar que `panel_context` **no** sale.
  it('con contexto de pestaña manda `tab_context` y NO `panel_context`', async () => {
    responde([INFO, DONE])
    await recolectar(askSynapse(PREGUNTA_DE_PESTANA))

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    const cuerpo = JSON.parse(init.body as string)
    expect(cuerpo).toEqual({
      question: '¿Cómo vamos este mes?',
      tab_context: { tab_id: 'tab-1', period: '2026-09' },
    })
    // Explícito, porque `toEqual` con una clave de más ya falla pero el mensaje
    // no diría cuál es el problema: mandar las dos es 400.
    expect(cuerpo).not.toHaveProperty('panel_context')
  })

  it('y con contexto de panel NO manda `tab_context`', async () => {
    responde([INFO, DONE])
    await recolectar(askSynapse(PREGUNTA))

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('tab_context')
  })

  it('sin hilo previo no se manda `thread_id` · no va un null', async () => {
    responde([INFO, DONE])
    await recolectar(askSynapse(PREGUNTA))

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('thread_id')
  })
})

describe('el agente que elige un admin · 2026-10-06', () => {
  const AGENTE = '6deffca1-013a-4489-9a98-5b0d8f1c8ced'

  it('`agent_id` viaja en el PRIMER turno', async () => {
    responde([INFO, DONE])
    await recolectar(askSynapse({ ...PREGUNTA, agenteId: AGENTE }))

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string).agent_id).toBe(AGENTE)
  })

  it('con hilo NO viaja · el servicio lo ignora y el agente ya quedó fijado', async () => {
    responde([INFO, DONE])
    await recolectar(askSynapse({ ...PREGUNTA, hiloId: '41', agenteId: AGENTE }))

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    const cuerpo = JSON.parse(init.body as string)
    expect(cuerpo).not.toHaveProperty('agent_id')
    expect(cuerpo.thread_id).toBe(41)
  })

  it('sin elegir no viaja · ni un null, que el binding leería como uuid inválido', async () => {
    responde([INFO, DONE])
    await recolectar(askSynapse(PREGUNTA))

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('agent_id')
  })
})

describe('cortes y errores', () => {
  it('un 409 dice el MOTIVO del servicio, no sólo el código', async () => {
    // Medido en QA el 2026-10-06 con un admin sin agente para su rol. Antes la
    // hoja decía «(409)» y nada más.
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(
        JSON.stringify({
          success: false,
          error: 'no hay agente activo disponible para este tenant y rol',
          code: 'CONFLICT_STATE',
        }),
        { status: 409, headers: { 'content-type': 'application/json' } },
      ),
    ))
    await expect(recolectar(askSynapse(PREGUNTA))).rejects.toThrow(
      'El agente no pudo abrir la conversación (409): no hay agente activo disponible para este tenant y rol',
    )
  })

  it('un cuerpo que no es JSON —un 502 de proxy— cae al código solo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 })))
    await expect(recolectar(askSynapse(PREGUNTA))).rejects.toThrow(
      /^El agente no pudo abrir la conversación \(502\)\.$/,
    )
  })


  it('`parcial` sale de si ya se entregó contenido · el cable no lo declara', async () => {
    // El frame `error` del cable es `{code, message}`: no dice si lo recibido
    // sigue valiendo. Lo que sí es un hecho es si algo se entregó, y el servicio
    // persiste la respuesta acumulada antes de cerrar.
    responde([INFO, trama('delta', { text: 'las ventas ' }), trama('error', { code: 'x', message: 'Se cortó.' }), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos[1]).toEqual({ tipo: 'error', mensaje: 'Se cortó.', parcial: true })
  })

  it('un error ANTES de cualquier contenido no es parcial', async () => {
    responde([INFO, trama('error', { code: 'empty_stream', message: 'sin contenido' }), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos[0]).toMatchObject({ parcial: false })
  })

  it('un HTTP que no es 200 sale como ChatStreamError sin parcial', async () => {
    responde([], { status: 503 })
    await expect(recolectar(askSynapse(PREGUNTA))).rejects.toThrow(ChatStreamError)
    await expect(recolectar(askSynapse(PREGUNTA))).rejects.toMatchObject({ partial: false })
  })

  it('un `data:` que no es JSON corta y lo dice, en vez de esperar para siempre', async () => {
    responde(['event: delta\ndata: esto no es json\n\n'])
    await expect(recolectar(askSynapse(PREGUNTA))).rejects.toThrow(/no se entiende/)
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
    //
    // **Pero el tope tampoco es decorativo.** Un `pull` verdaderamente infinito
    // hace que esta prueba se CUELGUE en vez de fallar cuando el traductor deja
    // de emitir —que es exactamente lo que pasa si alguien vuelve a descartar la
    // línea `event:`—, porque el bucle no cede nunca a un macrotask y el
    // temporizador de vitest no llega a dispararse. Verificado rompiéndolo el
    // 2026-09-21. Mil tramas son de sobra para que el origen siga abierto al
    // primer `break`, y garantizan que la prueba termine.
    const cancelado = vi.fn()
    const encoder = new TextEncoder()
    let emitidas = 0
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      new ReadableStream({
        pull(controller) {
          if (emitidas >= 1000) return controller.close()
          emitidas += 1
          controller.enqueue(encoder.encode(trama('delta', { text: 'sigue' })))
        },
        cancel: cancelado,
      }),
    )))

    for await (const _ of askSynapse(PREGUNTA)) break

    // La cancelación viaja por el pipe en un microtask: sin este respiro se
    // comprueba antes de que llegue al origen.
    await new Promise((r) => setTimeout(r, 0))
    expect(cancelado).toHaveBeenCalled()
  })
})

describe('§F3.6 · el evento `data` se traduce · desde `55e8419`', () => {
  /** El frame como lo manda el servicio, con la procedencia completa. Copiado
   *  de `ChatFrameData` en el cable transcripto. */
  const conProvenance = (parche: Record<string, unknown> = {}) =>
    trama('data', {
      shape: 'scalar',
      data: { shape: 'scalar', v: 4280000 },
      provenance: {
        source: 'cortex_agent',
        tool: 'cortex_analyst',
        metric_key: 'sales',
        period: '2026-09',
        sql_available: true,
        base: '48 tiendas sobre 52',
        base_source: 'catalog',
        family: 'demand',
        layer: 'GOLD',
        source_system: 'Snowflake',
        catalog_version: 4,
        freshness: '2026-09-01T08:00:00Z',
        queried_at: '2026-09-02T10:00:00Z',
        ...parche,
      },
    })

  it('llega como `dato` con su valor y su gobierno completo', async () => {
    // Estuvo descartado un día entero: `EventoDato` exige `familia` más los
    // cinco de `Gobierno` y el cable mandaba cinco campos que no incluían
    // ninguno. `55e8419` los agregó todos.
    responde([INFO, conProvenance(), DONE])

    const [evento] = await recolectar(askSynapse(PREGUNTA))
    expect(evento).toMatchObject({
      tipo: 'dato',
      valor: { forma: 'escalar', v: 4280000 },
      familia: 'demanda',
      base: '48 tiendas sobre 52',
      capa: 'GOLD',
      fuente: 'Snowflake',
      catalogVersion: 4,
    })
  })

  it('`frescura` sale de `queried_at`, NO de `freshness`', async () => {
    // **Los dos vienen y significan cosas distintas.** `freshness` es cuándo se
    // materializó la MÉTRICA; `queried_at`, cuándo el agente produjo ESTA
    // cifra. Una cifra calculada al vuelo es tan fresca como su consulta.
    responde([INFO, conProvenance(), DONE])

    const [evento] = await recolectar(askSynapse(PREGUNTA))
    expect(evento).toMatchObject({ frescura: '2026-09-02T10:00:00Z' })
  })

  it('sin `queried_at` cae a `freshness` · es lo único que queda', async () => {
    // Pasa cuando el agente no consultó: el servicio sólo lo pone al recibir
    // un `tool_result`.
    responde([INFO, conProvenance({ queried_at: '' }), DONE])

    const [evento] = await recolectar(askSynapse(PREGUNTA))
    expect(evento).toMatchObject({ frescura: '2026-09-01T08:00:00Z' })
  })

  it('una FAMILIA que el contrato no declara se descarta · no cae a una', async () => {
    // El color de una cifra del chat ya se inventó una vez —estaba cableado a
    // `demanda`— y por eso `familia` entró al contrato el 2026-08-19.
    responde([INFO, conProvenance({ family: 'inventada' }), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos.map((e) => e.tipo)).toEqual(['fin'])
  })

  /** **El gráfico del agente** · 2026-10-07. Así lo manda `7b717aa`:
   *  `TranslateCortexEvent` pone `{shape: 'chart', chart_spec}` y
   *  `StructuredDataFromCortex`, sin filas, lo envuelve como `raw`. Hasta hoy el
   *  front lo tiraba en silencio. */
  const conGrafico = (parche: Record<string, unknown> = {}) =>
    trama('data', {
      shape: 'raw',
      data: {
        shape: 'chart',
        chart_spec: JSON.stringify({
          title: 'Ingresos por mes',
          mark: 'line',
          encoding: {
            x: { field: 'MES', type: 'temporal' },
            y: { field: 'INGRESOS', type: 'quantitative' },
          },
          data: { values: [{ MES: '2026-08-01', INGRESOS: 10 }, { MES: '2026-09-01', INGRESOS: 12 }] },
        }),
      },
      provenance: {
        source: 'cortex_agent',
        metric_key: 'revenue',
        period: '2026-09',
        sql_available: true,
        base: 'Pedidos completados',
        base_source: 'catalog',
        family: 'demand',
        layer: 'GOLD',
        source_system: 'Snowflake',
        catalog_version: 2,
        freshness: '',
        queried_at: '2026-10-07T10:00:00Z',
        ...parche,
      },
    })

  it('el `chart_spec` del agente llega como `dato`, con la marca que eligió', async () => {
    responde([INFO, conGrafico(), DONE])

    const [evento] = await recolectar(askSynapse(PREGUNTA))
    expect(evento).toMatchObject({
      tipo: 'dato',
      tipoDePanel: 'series',
      titulo: 'Ingresos por mes',
      familia: 'demanda',
      valor: { forma: 'serieTemporal', puntos: [{ t: '2026-08-01', v: 10 }, { t: '2026-09-01', v: 12 }] },
    })
  })

  it('en la PESTAÑA `family: ""` llega como `null` · se declara, no se descarta', async () => {
    // `provenanceFromContext` en modo pestaña sólo llena `source` y `period`;
    // el resto viaja vacío. Antes eso tiraba todos los datos del chat de
    // pestaña, que es el modo por defecto.
    responde([INFO, conGrafico({ family: '', base: '', layer: '' }), DONE])

    const [evento] = await recolectar(askSynapse(PREGUNTA_DE_PESTANA))
    expect(evento).toMatchObject({ tipo: 'dato', familia: null, tipoDePanel: 'series' })
  })

  /** **Capturado del servicio, no escrito de memoria** · `9dc481e` levantado en
   *  `:4010` el 2026-10-09, pregunta de pestaña por la inversión de medios por
   *  plataforma. Es la segunda de sus cuatro tramas `data`, recortada a dos
   *  filas: la consulta sale de `VW_COSTOS_CAMPANAS`, fuera del catálogo, y la
   *  procedencia viaja vacía entera. */
  const fueraDelCatalogo = (parche: Record<string, unknown> = {}) =>
    trama('data', {
      data: {
        columns: [
          { key: 'investment', numeric: true, title: 'investment' },
          { key: 'share_pct', numeric: true, title: 'share_pct' },
        ],
        rows: [
          { investment: 63777.61, share_pct: 57.36 },
          { investment: 33562.86, share_pct: 30.19 },
        ],
        shape: 'tabular',
      },
      provenance: {
        source: 'cortex_agent',
        metric_key: '',
        period: '2026-08',
        sql_available: true,
        base: '',
        base_source: '',
        family: '',
        layer: '',
        source_system: '',
        catalog_version: 0,
        freshness: '',
        queried_at: '2026-10-09T15:04:03Z',
        ...parche,
      },
      shape: 'tabular',
    })

  it('una consulta fuera del catálogo llega SIN capa · no se firma GOLD · 2026-10-09', async () => {
    // Acá había `CAPAS[p.layer] ?? 'GOLD'`: la procedencia de una consulta que
    // no la declara salía inventada, y con la misma tipografía que una real.
    responde([INFO, fueraDelCatalogo(), DONE])

    const [evento] = await recolectar(askSynapse(PREGUNTA_DE_PESTANA))
    expect(evento).toMatchObject({ tipo: 'dato', capa: null, familia: null, base: '' })
  })

  it('una CAPA que el contrato no declara se descarta · igual que la familia', async () => {
    responde([INFO, fueraDelCatalogo({ layer: 'PLATINUM' }), DONE])

    const eventos = await recolectar(askSynapse(PREGUNTA_DE_PESTANA))
    expect(eventos.map((e) => e.tipo)).toEqual(['fin'])
  })

  it('un valor que no se puede adaptar tampoco se pinta a medias', async () => {
    responde([
      INFO,
      trama('data', { shape: 'raw', data: { sin: 'forma' }, provenance: {} }),
      DONE,
    ])

    const eventos = await recolectar(askSynapse(PREGUNTA))
    expect(eventos.map((e) => e.tipo)).toEqual(['fin'])
  })
})

describe('la petición lleva credencial · el defecto del 2026-09-24', () => {
  /** **El chat nunca autenticó, ni una vez.** `askSynapse` usa `fetch` crudo
   *  —es lo único que deja leer el cuerpo como stream— y al escribirlo aparte
   *  de `client.ts` se copiaron las dos cabeceras que el SSE necesita y no la
   *  que la ruta exige. El servicio contestaba **401 en 170 microsegundos**, o
   *  sea el middleware y no Snowflake, y el mensaje lo atribuía al agente.
   *
   *  **Ninguna de las 23 pruebas de este archivo lo vio**, porque todas miran
   *  la RESPUESTA. Ésta mira lo que se MANDA, que es donde estaba el hueco — y
   *  es lo mismo que MSW no podía ver: un handler que no exige el token
   *  responde igual con credencial y sin ella. */
  it('manda `Authorization: Bearer` con el token de la sesión', async () => {
    saveToken('un-token-de-prueba')
    responde([trama('done', {})])

    await recolectar(askSynapse(PREGUNTA))

    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer un-token-de-prueba',
    )
  })

  it('sin sesión NO manda una cabecera vacía · se omite', async () => {
    // `Authorization: Bearer null` sería peor que no mandarla: el servicio
    // devolvería el mismo 401 y el log diría que llegó una credencial.
    signOut()
    responde([trama('done', {})])

    await recolectar(askSynapse(PREGUNTA))

    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('y las dos que el SSE necesita siguen ahí', async () => {
    saveToken('t')
    responde([trama('done', {})])
    await recolectar(askSynapse(PREGUNTA))
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ]
    const h = init.headers as Record<string, string>
    expect(h.accept).toBe('text/event-stream')
    expect(h['content-type']).toBe('application/json')
  })
})

describe('el historial de un hilo, en turnos · 2026-10-09', () => {
  /** Las formas de `GET /config/chat/threads/{id}/messages`, capturadas de
   *  `9dc481e` el 2026-10-09. Sólo lo que el emparejamiento mira. */
  const msg = (role: 'user' | 'assistant', content: string) => ({
    id: `${role}-${content}`,
    role,
    content,
    created_at: '2026-10-09T10:00:00Z',
  })

  it('una pregunta y su respuesta son UN turno', () => {
    const { turnos } = turnosDelHistorial({
      messages: [msg('user', '¿Cuánto?'), msg('assistant', 'Tanto.')],
      has_more: false,
    })
    expect(turnos).toEqual([{ pregunta: '¿Cuánto?', texto: 'Tanto.', datos: [] }])
  })

  it('una respuesta SIN pregunta antes se descarta · la página empezó a mitad de un turno', () => {
    // Con 50 por página, la primera puede ser la respuesta de una pregunta que
    // quedó en la página anterior. Colgarla de una pregunta vacía, o de la
    // siguiente, la atribuiría mal.
    const { turnos, hayAnteriores } = turnosDelHistorial({
      messages: [msg('assistant', 'Huérfana.'), msg('user', '¿Y hoy?'), msg('assistant', 'Hoy no.')],
      has_more: true,
    })
    expect(turnos).toEqual([{ pregunta: '¿Y hoy?', texto: 'Hoy no.', datos: [] }])
    expect(hayAnteriores).toBe(true)
  })

  it('una pregunta sin respuesta queda con texto `null` · no con una respuesta vacía', () => {
    const { turnos } = turnosDelHistorial({ messages: [msg('user', '¿Y?')], has_more: false })
    expect(turnos).toEqual([{ pregunta: '¿Y?', texto: null, datos: [] }])
  })
})
