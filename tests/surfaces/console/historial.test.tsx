// @vitest-environment jsdom

/** El historial de hilos, de punta a punta · F3.7
 *
 *  **Los dos ids son el riesgo de esta tarea, no el listado.** El cable manda
 *  `id` —uuid, con el que se piden los mensajes de un hilo— y `thread_id`
 *  —entero, con el que se continúa la conversación—. Se parecen, viajan juntos
 *  y el compilador no los distingue: los dos son `string` después del
 *  adaptador. Mandar el uuid donde va el entero da **400** y el síntoma es
 *  «retomar no hace nada».
 *
 *  Por eso acá se verifica **qué número sale por la red**, no que la fila se
 *  pinte.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { WireChatThread, WireMetric, WirePanel, WirePayload } from '@/api/adapt'

const governance = {
  base: '48 tiendas sobre 52',
  layer: 'GOLD',
  source: 'Snowflake',
  freshness: '2026-09-02T08:00:00Z',
  catalog_version: 1,
}

const metrics = [
  {
    id: 'm-kpi', tenant_id: 't-1', key: 'k_kpi', name: 'Venta diaria',
    shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'Snowflake',
    base: '48 tiendas sobre 52', min_grain: 'month', dimensions: [], catalog_version: 1,
  },
] as unknown as WireMetric[]

const panels = [
  { id: 'p-kpi', type: 'kpi', metric_id: 'm-kpi', col_start: 1, col_span: 6, row_span: 4 },
] as unknown as WirePanel[]

const payloads: Record<string, WirePayload> = {
  'p-kpi': { status: 'AVAILABLE', value: { shape: 'scalar', v: 4280000 }, governance } as WirePayload,
}

/** Un hilo **como lo manda el servicio**, con sus DOS ids.
 *
 *  Copiado de `ChatThread` en `contracts/synapse-console-wire.yaml`, que es la
 *  transcripción de `82da946`. No se escribe de memoria. */
const hilo = (parche: Partial<WireChatThread> = {}): WireChatThread =>
  ({
    id: '3f1d0a6e-0000-4000-8000-000000000001',
    thread_id: 41,
    thread_name: 'hilo del agente',
    agent_id: 'a-1',
    agent_name: 'UA MX',
    role: 'Planner',
    first_message_preview: '¿Por qué cayó la venta?',
    panel_id: 'p-kpi',
    period: '2026-07',
    tab_id: 'tab-1',
    tab_name: 'Inventory & Shopping',
    metric_id: 'm-kpi',
    metric_key: 'k_kpi',
    metric_name: 'Venta diaria',
    created_at: '2026-07-10T12:00:00Z',
    updated_at: '2026-07-10T12:00:00Z',
    ...parche,
  }) as WireChatThread

function trama(evento: string, datos: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`
}

function laConsola(hilos: WireChatThread[]) {
  const pedidos: { url: string }[] = []
  const preguntas: Record<string, unknown>[] = []
  server.use(
    http.get(`${API}/config/catalog`, () => ok(metrics)),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: context.tabs[0], panels })),
    http.post(`${API}/config/panels:batch`, () => ok(payloads)),
    http.get(`${API}/config/chat/threads`, ({ request }) => {
      pedidos.push({ url: request.url })
      return ok(hilos)
    }),
    http.post(`${API}/config/chat`, async ({ request }) => {
      preguntas.push((await request.json()) as Record<string, unknown>)
      const encoder = new TextEncoder()
      return new HttpResponse(
        new ReadableStream({
          start(c) {
            c.enqueue(encoder.encode(trama('thread_info', { thread_id: 41, parent_message_id: 1, user_thread_id: 'ut' })))
            c.enqueue(encoder.encode(trama('delta', { text: 'ok' })))
            c.enqueue(encoder.encode(trama('done', {})))
            c.close()
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      )
    }),
  )
  return { pedidos, preguntas }
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function abrirLaHoja() {
  const usuario = userEvent.setup()
  const seccion = (await screen.findByRole('heading', { name: 'Venta diaria' })).closest('section')
  const boton = Array.from(seccion!.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === 'Preguntar',
  )
  await usuario.click(boton!)
  return { usuario, hoja: await screen.findByRole('dialog') }
}

describe('F3.7 · cada hilo muestra con qué panel y período se abrió', () => {
  it('la fila lleva la métrica y el período DEL HILO', async () => {
    // El período es el del hilo, no el de hoy: reabrir en octubre una consulta
    // de septiembre tiene que decir septiembre.
    laConsola([hilo({ period: '2026-07', metric_name: 'Venta diaria' })])
    montar()
    const { hoja } = await abrirLaHoja()

    expect(await within(hoja).findByText('Venta diaria · 2026-07')).toBeInTheDocument()
  })

  it('un hilo SIN contexto se dibuja igual, sin separador colgando', async () => {
    // Los hilos abiertos antes de que existiera el contexto de panel no lo
    // traen. Una línea «· » sin nada al lado es el defecto que la línea de BASE
    // tuvo con `ventana`.
    laConsola([hilo({ period: '', metric_name: '', metric_key: '', tab_name: '' })])
    montar()
    const { hoja } = await abrirLaHoja()

    const fila = (await within(hoja).findByText('¿Por qué cayó la venta?')).closest('button')
    expect(fila).not.toBeNull()
    // **La aserción va sobre la FILA.** Desde que la hoja lleva su línea de
    // contexto y el riel su pie —§PEN:C3—, `·` aparece con razón en los dos.
    // Lo que no puede pasar es que la fila de un hilo sin contexto lo tenga.
    expect(fila!.textContent).not.toContain('·')
  })

  it('el listado se pide filtrado por ESTE panel y ESTE período', async () => {
    // El filtro lo aplica el servicio: pedir todos y descartar acá traería por
    // la red los hilos de los otros paneles para tirarlos.
    const { pedidos } = laConsola([hilo()])
    montar()
    await abrirLaHoja()

    await waitFor(() => expect(pedidos).toHaveLength(1))
    const url = new URL(pedidos[0]!.url)
    expect(url.searchParams.get('panel_id')).toBe('p-kpi')
    expect(url.searchParams.get('period')).toBe('2026-07')
  })

  it('sin hilos, el riel no ocupa lugar', async () => {
    laConsola([])
    montar()
    const { hoja } = await abrirLaHoja()

    expect(within(hoja).queryByRole('navigation')).not.toBeInTheDocument()
  })
})

describe('F3.7 · retomar reenvía el contexto, y NO arranca uno nuevo', () => {
  it('retomar manda el `thread_id` ENTERO, no el uuid', async () => {
    // **La aserción que vale.** El riel identifica sus filas por uuid y el
    // servicio continúa la conversación por el entero. Pasar el callback
    // directo compilaba y mandaba el uuid: 400 en cada intento.
    const { preguntas } = laConsola([hilo({ id: 'uuid-del-hilo', thread_id: 41 })])
    montar()
    const { usuario, hoja } = await abrirLaHoja()

    await usuario.click(await within(hoja).findByText('¿Por qué cayó la venta?'))
    await usuario.type(within(hoja).getByRole('textbox'), 'y ahora?')
    await usuario.click(within(hoja).getByRole('button', { name: 'Preguntar' }))

    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]?.['thread_id']).toBe(41)
  })

  it('retomar LIMPIA los turnos · no se lee un hilo bajo el id de otro', async () => {
    // Dejarlos arriba mostraría la conversación de un hilo mientras se continúa
    // otro: lo que se ve y lo que se continúa serían cosas distintas.
    laConsola([hilo({ first_message_preview: 'La conversación vieja' })])
    montar()
    const { usuario, hoja } = await abrirLaHoja()

    await usuario.type(within(hoja).getByRole('textbox'), 'primera')
    await usuario.click(within(hoja).getByRole('button', { name: 'Preguntar' }))
    await within(hoja).findByText(/Preguntaste/)

    await usuario.click(within(hoja).getByText('La conversación vieja'))
    await waitFor(() => expect(within(hoja).queryByText(/Preguntaste/)).not.toBeInTheDocument())
  })
})

describe('§PEN:C3 · los literales que el `.pen` manda', () => {
  it('la fila lleva su marca de tiempo · el dibujo la pone en todas', async () => {
    // `28 JUL` para un hilo viejo, la hora para uno de hoy. Con la hora sola,
    // dos hilos de días distintos se leerían como del mismo rato.
    laConsola([hilo({ updated_at: '2026-07-28T12:00:00Z' })])
    montar()
    const { hoja } = await abrirLaHoja()

    const fila = (await within(hoja).findByText('¿Por qué cayó la venta?')).closest('button')
    expect(fila!.textContent).toMatch(/28 JUL/)
  })

  it('el riel dice quién puede leer lo que se preguntó', async () => {
    // No es decorativo: es la clase de cosa que se pregunta una vez y se
    // contesta mal si no está escrita.
    laConsola([hilo()])
    montar()
    const { hoja } = await abrirLaHoja()

    expect(await within(hoja).findByText('Las consultas quedan en el tenant')).toBeVisible()
    expect(within(hoja).getByText('Visibles solo para tu rol')).toBeVisible()
  })

  it('«Nueva consulta» SUELTA el hilo, no solo limpia la pantalla', async () => {
    // Con el `hiloId` puesto, lo que parece una consulta nueva seguiría
    // colgando de la anterior del lado del servidor: el riel mostraría una
    // fila donde el usuario ve dos.
    const { preguntas } = laConsola([hilo({ thread_id: 41 })])
    montar()
    const { usuario, hoja } = await abrirLaHoja()

    // Retomar un hilo, después pedir una consulta nueva, y preguntar.
    await usuario.click(await within(hoja).findByText('¿Por qué cayó la venta?'))
    await usuario.click(within(hoja).getByRole('button', { name: 'Nueva consulta' }))
    await usuario.type(within(hoja).getByRole('textbox'), 'otra cosa')
    await usuario.click(within(hoja).getByRole('button', { name: 'Preguntar' }))

    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]).not.toHaveProperty('thread_id')
  })

  it('la cabecera es la del dibujo, con el contexto debajo', async () => {
    laConsola([hilo()])
    montar()
    const { hoja } = await abrirLaHoja()

    expect(within(hoja).getByRole('heading', { name: 'Preguntar a Synapse' })).toBeVisible()
    expect(within(hoja).getByText(/Contexto · Venta diaria · 2026-07/)).toBeVisible()
    // `ESC` es el rótulo; el nombre accesible sigue siendo «Cerrar», porque
    // `ESC` no se lee en voz alta como una acción.
    expect(within(hoja).getByRole('button', { name: 'Cerrar' })).toHaveTextContent('Esc')
  })
})

describe('§PEN:C3 · las sugeridas son chips que preguntan', () => {
  /** Las sugeridas del panel, con la forma del cable. */
  function conSugeridas(preguntas: string[]) {
    server.use(
      http.get(`${API}/config/panels/:panelId/chat-suggestions`, () =>
        ok(preguntas.map((question) => ({ question, intent: 'explain' }))),
      ),
    )
  }

  it('apretar una sugerida MANDA esa pregunta · no solo la escribe', async () => {
    // **Es la aserción de la tarea.** Hasta el 2026-09-21 eran una lista de
    // texto: se leían y no se podían usar, que es la mitad de lo que una
    // sugerencia es para.
    const { preguntas } = laConsola([])
    conSugeridas(['¿Por qué cayó en septiembre?'])
    montar()
    const { usuario, hoja } = await abrirLaHoja()

    await usuario.click(
      await within(hoja).findByRole('button', { name: '¿Por qué cayó en septiembre?' }),
    )

    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]?.['question']).toBe('¿Por qué cayó en septiembre?')
  })

  it('se piden para ESTE panel y ESTE período', async () => {
    // Sin `period` el servicio usa el mes actual en UTC, que no es el del
    // tenant ni el que se está mirando. Una sugerencia sobre otro mes es peor
    // que ninguna.
    const pedidos: string[] = []
    laConsola([])
    server.use(
      http.get(`${API}/config/panels/:panelId/chat-suggestions`, ({ request, params }) => {
        pedidos.push(`${String(params['panelId'])}?${new URL(request.url).searchParams.get('period')}`)
        return ok([])
      }),
    )
    montar()
    await abrirLaHoja()

    await waitFor(() => expect(pedidos).toContain('p-kpi?2026-07'))
  })

  it('después de responder manda las DEL AGENTE, no las del panel', async () => {
    // Mostrar las del panel debajo de una respuesta sería ofrecer lo que ya se
    // contestó.
    // **El orden importa y ya costó una vez.** `server.use` antepone, así que
    // el ÚLTIMO en registrarse gana: con `laConsola` después, su handler de
    // `/config/chat` pisaba este override y la respuesta nunca llegaba. Está
    // anotado igual en `roles.test.tsx`.
    laConsola([])
    conSugeridas(['La del panel'])
    server.use(
      http.post(`${API}/config/chat`, () => {
        const encoder = new TextEncoder()
        return new HttpResponse(
          new ReadableStream({
            start(c) {
              c.enqueue(encoder.encode(trama('thread_info', { thread_id: 1, parent_message_id: 0, user_thread_id: 'u' })))
              c.enqueue(encoder.encode(trama('delta', { text: 'listo' })))
              c.enqueue(encoder.encode(trama('done', {})))
              c.close()
            },
          }),
          { headers: { 'content-type': 'text/event-stream' } },
        )
      }),
    )
    montar()
    const { usuario, hoja } = await abrirLaHoja()

    expect(await within(hoja).findByRole('button', { name: 'La del panel' })).toBeInTheDocument()
    await usuario.click(within(hoja).getByRole('button', { name: 'La del panel' }))
    await within(hoja).findByText('listo')

    // El agente no mandó `sugerencias`, así que no hay del agente — y las del
    // panel NO vuelven a aparecer debajo de la respuesta.
    expect(within(hoja).queryByRole('button', { name: 'La del panel' })).not.toBeInTheDocument()
  })
})

describe('§PEN:C1 · el chrome son tres bandas, no un bloque', () => {
  it('el tema y el usuario viven en el NAVBAR, con el logotipo', async () => {
    // **Son de la PLATAFORMA**: no cambian con la pestaña ni con el período.
    // Al lado del título parecían parte de la pantalla.
    laConsola([])
    montar()
    await screen.findByRole('heading', { name: 'Venta diaria' })

    const navbar = screen.getByRole('img', { name: 'Synapse' }).closest('div')
    expect(navbar).not.toBeNull()
    expect(within(navbar!).getByRole('button', { name: /Prueba Uno/ })).toBeInTheDocument()
    expect(within(navbar!).getByRole('button', { name: /tema/i })).toBeInTheDocument()
  })

  it('el título de la pantalla NO está en el navbar', async () => {
    // Es la otra mitad: el navbar es de la plataforma y el título es de la
    // pestaña. Si conviven, se leen como una sola cosa.
    laConsola([])
    montar()
    await screen.findByRole('heading', { name: 'Venta diaria' })

    const navbar = screen.getByRole('img', { name: 'Synapse' }).closest('div')
    expect(within(navbar!).queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })
})

describe('§PEN:C3 · la hoja son dos columnas, y el riel colapsa', () => {
  it('el historial es una COLUMNA, no un bloque debajo de la conversación', async () => {
    // El dibujo lo pone a la izquierda, en `$dock`, al lado del hilo. Hasta el
    // 2026-09-21 iba debajo, y la hoja medía 480 en vez de 940.
    laConsola([hilo()])
    montar()
    const { hoja } = await abrirLaHoja()

    const riel = await within(hoja).findByRole('complementary')
    expect(riel.className).toContain('bg-dock')
    // Y la conversación es su hermana, no su contenedor.
    expect(riel.contains(within(hoja).getByRole('heading', { name: 'Preguntar a Synapse' }))).toBe(
      false,
    )
  })

  it('colapsar deja la CUENTA · un riel que no dice cuánto esconde no invita', async () => {
    // Es literal de la nota del `.pen`. Sin la cuenta es una flecha que no
    // promete nada.
    laConsola([hilo(), hilo({ id: 'otro', thread_id: 42 })])
    montar()
    const { usuario, hoja } = await abrirLaHoja()

    await usuario.click(await within(hoja).findByRole('button', { name: 'Colapsar el historial' }))

    const control = within(hoja).getByRole('button', { name: 'Abrir el historial' })
    expect(control).toHaveTextContent('2')
    expect(control).toHaveAttribute('aria-expanded', 'false')
  })

  it('colapsado sobreviven el control para reabrir y el «+»', async () => {
    // Los tres que la nota nombra: reabrir, nueva consulta y la cuenta.
    laConsola([hilo()])
    montar()
    const { usuario, hoja } = await abrirLaHoja()

    await usuario.click(await within(hoja).findByRole('button', { name: 'Colapsar el historial' }))

    expect(within(hoja).getByRole('button', { name: 'Abrir el historial' })).toBeVisible()
    expect(within(hoja).getByRole('button', { name: 'Nueva consulta' })).toBeVisible()
    // Y las filas NO: para eso se colapsó.
    expect(within(hoja).queryByText('¿Por qué cayó la venta?')).not.toBeInTheDocument()
  })

  it('reabrir devuelve las filas', async () => {
    laConsola([hilo()])
    montar()
    const { usuario, hoja } = await abrirLaHoja()

    await usuario.click(await within(hoja).findByRole('button', { name: 'Colapsar el historial' }))
    await usuario.click(within(hoja).getByRole('button', { name: 'Abrir el historial' }))

    expect(within(hoja).getByText('¿Por qué cayó la venta?')).toBeVisible()
  })
})
