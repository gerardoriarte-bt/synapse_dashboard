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

    expect(await within(hoja).findByText('¿Por qué cayó la venta?')).toBeInTheDocument()
    expect(hoja.textContent).not.toContain('·')
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
