// @vitest-environment jsdom

/** El selector de agente del admin · 2026-10-06
 *
 *  **Nació de una falla medida en QA**: un admin de UA preguntaba y recibía 409
 *  —«no hay agente activo disponible para este tenant y rol»— porque el único
 *  agente de su tenant es `Planner` y, sin `agent_id`, el servicio busca uno
 *  para `admin`. Con `agent_id` la misma pregunta contestó 200.
 *
 *  **Lo que se afirma es el cuerpo que sale por la red**, igual que
 *  `presencia.test.tsx`: la cadena es `ConsoleContainer → ChatSheet → useChat →
 *  askSynapse`, cada salto usa el spread condicional, y un selector que cambia
 *  de valor sin que el valor viaje se ve igual que uno que funciona.
 *
 *  Las opciones copian la forma medida en QA —`GET /chat/agents`, con el
 *  espacio al final de un nombre y `admin`/`Planner` con mayúsculas
 *  distintas—, no una inventada.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, context, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { WireChatAgentOption, WireMetric, WirePanel, WirePayload } from '@/api/adapt'

/** El agente de UA es el del tenant del contexto de prueba, `t-1`. */
const DE_UA = 'a-ua'
const DE_TERPEL = 'a-terpel'

const AGENTES: WireChatAgentOption[] = [
  { id: DE_UA, name: 'Under Armour México', target_role: 'Planner', tenant_id: 't-1', tenant_name: 'Synapse UA HTML' },
  { id: DE_TERPEL, name: 'Terpel Lubricantes ', target_role: 'admin', tenant_id: 't-9', tenant_name: 'Lobueno Analytics Terpel' },
]

function trama(evento: string, datos: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`
}

function responde(...tramas: string[]) {
  return new HttpResponse(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        for (const t of tramas) controller.enqueue(encoder.encode(t))
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  )
}

/** `rol` es el NOMBRE como lo guarda el servicio: en QA el admin llega `Admin`. */
function laConsola(rol: string, agentes: WireChatAgentOption[] = AGENTES) {
  const preguntas: Record<string, unknown>[] = []
  const pedidosDeAgentes = { n: 0 }
  server.use(
    http.get(`${API}/config/me`, () => ok({ ...context, role: { id: 'r-x', name: rol } })),
    http.get(`${API}/config/chat/threads`, () => ok([])),
    http.get(`${API}/chat/agents`, () => {
      pedidosDeAgentes.n += 1
      return ok(agentes)
    }),
    http.post(`${API}/config/chat`, async ({ request }) => {
      preguntas.push((await request.json()) as Record<string, unknown>)
      return responde(
        trama('thread_info', { thread_id: 41, parent_message_id: 7, user_thread_id: 'ut-1' }),
        trama('delta', { text: 'Listo.' }),
        trama('done', {}),
      )
    }),
  )
  return { preguntas, pedidosDeAgentes }
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
  await userEvent.click(await screen.findByRole('button', { name: /Preguntar a Synapse/i }))
  return screen.findByRole('dialog')
}

async function preguntar(hoja: HTMLElement, texto: string) {
  await userEvent.type(within(hoja).getByRole('textbox'), texto)
  await userEvent.click(within(hoja).getByRole('button', { name: 'Preguntar' }))
  // Se espera el fin del turno: preguntar con un stream abierto lo aborta.
  await waitFor(() => expect(within(hoja).getAllByText('Listo.').length).toBeGreaterThan(0))
}

describe('quien NO es admin no ve el selector ni lo pide', () => {
  it('un planner pregunta sin `agent_id` y nunca llama a `/chat/agents`', async () => {
    const { preguntas, pedidosDeAgentes } = laConsola('Planner')
    montar()

    const hoja = await abrirLaHoja()
    expect(within(hoja).queryByLabelText('Agente')).toBeNull()
    await preguntar(hoja, '¿Cómo vamos?')

    expect(preguntas[0]).not.toHaveProperty('agent_id')
    // El servidor le daría 403: preguntar lo que se sabe negado es un error en
    // caché esperando a que alguien lo pinte.
    expect(pedidosDeAgentes.n).toBe(0)
  })
})

describe('el admin elige, y lo elegido VIAJA', () => {
  it('arranca con el agente de SU tenant · el caso de QA, que era 409', async () => {
    const { preguntas } = laConsola('Admin')
    montar()

    const hoja = await abrirLaHoja()
    const selector = await within(hoja).findByLabelText('Agente')
    expect(selector).toHaveValue(DE_UA)

    await preguntar(hoja, '¿Cuánto vendimos?')
    expect(preguntas[0]).toMatchObject({ agent_id: DE_UA, tab_context: { tab_id: tab?.id } })
  })

  it('la etiqueta dice tenant, agente y rol · sin el espacio de la carga', async () => {
    laConsola('Admin')
    montar()

    const hoja = await abrirLaHoja()
    await within(hoja).findByLabelText('Agente')
    expect(
      within(hoja).getByRole('option', { name: 'Lobueno Analytics Terpel · Terpel Lubricantes · admin' }),
    ).toBeInTheDocument()
  })

  it('cambiar de agente empieza OTRO hilo · va `agent_id` nuevo y no `thread_id`', async () => {
    const { preguntas } = laConsola('Admin')
    montar()

    const hoja = await abrirLaHoja()
    await preguntar(hoja, 'Primera')
    await userEvent.selectOptions(await within(hoja).findByLabelText('Agente'), DE_TERPEL)
    await preguntar(hoja, 'Segunda')

    expect(preguntas).toHaveLength(2)
    expect(preguntas[1]).toMatchObject({ agent_id: DE_TERPEL })
    // **Con `thread_id` el servicio ignora `agent_id`**, así que mandar los dos
    // contestaría con el agente viejo bajo el nombre del nuevo.
    expect(preguntas[1]).not.toHaveProperty('thread_id')
  })

  it('el mismo agente CONTINÚA el hilo · el segundo turno lleva `thread_id` y no `agent_id`', async () => {
    const { preguntas } = laConsola('Admin')
    montar()

    const hoja = await abrirLaHoja()
    await preguntar(hoja, 'Primera')
    await preguntar(hoja, 'Segunda')

    expect(preguntas[1]).toMatchObject({ thread_id: 41 })
    expect(preguntas[1]).not.toHaveProperty('agent_id')
  })

  it('«Por rol» deja que lo resuelva el servicio · sin `agent_id`', async () => {
    const { preguntas } = laConsola('Admin')
    montar()

    const hoja = await abrirLaHoja()
    await userEvent.selectOptions(await within(hoja).findByLabelText('Agente'), '')
    await preguntar(hoja, '¿Cómo vamos?')

    expect(preguntas[0]).not.toHaveProperty('agent_id')
  })

  it('la elección sobrevive a cerrar la hoja · vive en el contenedor', async () => {
    const { preguntas } = laConsola('Admin')
    montar()

    let hoja = await abrirLaHoja()
    await userEvent.selectOptions(await within(hoja).findByLabelText('Agente'), DE_TERPEL)
    await userEvent.click(within(hoja).getByRole('button', { name: 'Cerrar' }))

    hoja = await abrirLaHoja()
    expect(await within(hoja).findByLabelText('Agente')).toHaveValue(DE_TERPEL)
    await preguntar(hoja, '¿Y ahora?')
    expect(preguntas[0]).toMatchObject({ agent_id: DE_TERPEL })
  })
})

describe('la hoja de PANEL también lleva el selector · es la otra entrada', () => {
  /** **Un solo panel con su métrica**, el mínimo para que pinte su «Preguntar».
   *  La hoja de pestaña y la de panel son dos `<ChatSheet>` distintos en el
   *  contenedor, y cada uno recibe el selector por su lado: con sólo la de
   *  pestaña probada, olvidar el de panel sobrevivía. Se vio por mutación. */
  function conUnPanel() {
    const governance = {
      base: '48 tiendas sobre 52',
      layer: 'GOLD',
      source: 'Snowflake',
      freshness: '2026-09-02T08:00:00Z',
      catalog_version: 1,
      measurement_window: '',
    }
    const metric = {
      id: 'm-v', tenant_id: 't-1', key: 'ventas', name: 'Ventas', shape: 'scalar',
      family: 'demand', layer: 'GOLD', source: 'Snowflake', base: 'x', min_grain: 'month',
      measurement_window: '', dimensions: [], catalog_version: 1,
    } as unknown as WireMetric
    const panel = { id: 'p-v', metric_id: 'm-v', type: 'kpi', col_start: 1, col_span: 6, row_span: 4 } as unknown as WirePanel
    server.use(
      http.get(`${API}/config/catalog`, () => ok([metric])),
      http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: tab, panels: [panel] })),
      http.post(`${API}/config/panels:batch`, () =>
        ok({ 'p-v': { status: 'AVAILABLE', value: { shape: 'scalar', v: 10 }, governance } as WirePayload }),
      ),
    )
  }

  it('preguntar desde un panel manda `panel_context` Y el agente elegido', async () => {
    const { preguntas } = laConsola('Admin')
    conUnPanel()
    montar()

    const seccion = (await screen.findByRole('heading', { name: 'Ventas' })).closest('section')
    const boton = Array.from(seccion!.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Preguntar',
    )
    await userEvent.click(boton!)
    const hoja = await screen.findByRole('dialog')
    expect(await within(hoja).findByLabelText('Agente')).toHaveValue(DE_UA)
    await preguntar(hoja, '¿Por qué?')

    expect(preguntas[0]).toMatchObject({ agent_id: DE_UA, panel_context: { panel_id: 'p-v' } })
  })
})
