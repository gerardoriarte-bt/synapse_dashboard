// @vitest-environment jsdom

/** F3.15 · el chat tiene PRESENCIA en la consola · §PEN:C1
 *
 *  Decisión humana del 2026-09-22: *«el chat debe tener presencia, es una
 *  funcionalidad importante para el uso de Synapse, no un complemento»*. La
 *  persiana ya existía; lo que faltaba eran las dos entradas que el `.pen`
 *  dibuja en las dieciséis pantallas de consola: el CTA del navbar y la barra
 *  inferior.
 *
 *  ── QUÉ SE AFIRMA ACÁ, Y POR QUÉ NO ALCANZA CON QUE EL BOTÓN EXISTA ────────
 *
 *  «La regla de prueba es: verificar que el callback DISPARE, no que el botón
 *  exista. Un botón muerto se ve igual que uno que funciona.» Y acá la cadena
 *  es larga —`Console → Topbar/ConsoleDock → onAskTab → ConsoleContainer →
 *  ChatSheet → useChat → askSynapse`— y cada salto usa el spread condicional,
 *  que deja compilar una prop mal escrita.
 *
 *  Así que lo que se afirma es **el cuerpo que sale por la red**: que lleve
 *  `tab_context` y que NO lleve `panel_context`. El servicio devuelve 400 con
 *  los dos, medido el 2026-09-26.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { WireMetric, WirePanel, WirePayload } from '@/api/adapt'

const governance = {
  base: '48 tiendas sobre 52',
  layer: 'GOLD',
  source: 'Snowflake',
  freshness: '2026-09-02T08:00:00Z',
  catalog_version: 1,
  measurement_window: '',
}

/** **TRES paneles y no uno**: el conteo de la barra es lo que declara el
 *  alcance de la pregunta, así que con un solo panel un `1` accidental —o un
 *  `length` de otra lista— pasaría desapercibido. */
const metrics = ['a', 'b', 'c'].map((k) => ({
  id: `m-${k}`,
  tenant_id: 't-1',
  key: `metrica_${k}`,
  name: `Métrica ${k.toUpperCase()}`,
  shape: 'scalar',
  family: 'demand',
  layer: 'GOLD',
  source: 'Snowflake',
  base: 'x',
  min_grain: 'month',
  measurement_window: '',
  dimensions: [],
  catalog_version: 1,
})) as unknown as WireMetric[]

const panels = ['a', 'b', 'c'].map((k, i) => ({
  id: `p-${k}`,
  metric_id: `m-${k}`,
  type: 'kpi',
  col_start: 1 + i * 3,
  col_span: 3,
  row_span: 4,
})) as unknown as WirePanel[]

const payloads: Record<string, WirePayload> = Object.fromEntries(
  ['a', 'b', 'c'].map((k) => [
    `p-${k}`,
    { status: 'AVAILABLE', value: { shape: 'scalar', v: 10 }, governance } as WirePayload,
  ]),
)

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

/** Recoge **el cuerpo que sale por la red**, que es lo único que prueba que la
 *  cadena de callbacks llegó entera. */
function laConsola(): { preguntas: Record<string, unknown>[] } {
  const preguntas: Record<string, unknown>[] = []
  server.use(
    http.get(`${API}/config/catalog`, () => ok(metrics)),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: tab, panels })),
    http.post(`${API}/config/panels:batch`, () => ok(payloads)),
    http.get(`${API}/config/chat/threads`, () => ok([])),
    http.post(`${API}/config/chat`, async ({ request }) => {
      preguntas.push((await request.json()) as Record<string, unknown>)
      return responde(
        trama('thread_info', { thread_id: 41, parent_message_id: 7, user_thread_id: 'ut-1' }),
        trama('delta', { text: 'Listo.' }),
        trama('done', {}),
      )
    }),
  )
  return { preguntas }
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

/** Escribe y envía dentro de la hoja abierta.
 *
 *  **Acotado al diálogo**, igual que `preguntar.test.tsx`: «Preguntar» nombra
 *  también al CTA del navbar y al de cada panel. No es un rodeo de la prueba —
 *  es lo que hace un usuario, que ve la hoja abierta encima. */
async function preguntar(texto: string) {
  const hoja = await screen.findByRole('dialog')
  await userEvent.type(within(hoja).getByRole('textbox'), texto)
  await userEvent.click(within(hoja).getByRole('button', { name: 'Preguntar' }))
}

describe('la barra inferior declara el contexto que va a viajar', () => {
  it('nombra cliente, pestaña, período y CUÁNTOS paneles', async () => {
    laConsola()
    montar()

    // El literal del frame: `CONTEXTO · {TENANT} · {PESTAÑA} · {PERÍODO} · {N} PANELES`.
    // **Se espera el conteo y no la línea**: la barra se pinta antes de que
    // `/config/tabs` conteste, así que `findByText(/^Contexto ·/)` resuelve con
    // «0 paneles» y la aserción mide el estado de carga.
    const linea = await screen.findByText(/3 paneles/)
    expect(linea).toHaveTextContent('Under Armour México')
    expect(linea).toHaveTextContent(tab?.name as string)
  })

  it('el conteo es el de los paneles QUE LLEGARON, no uno fijo', async () => {
    // **Es la mitad del criterio**: «lo que declara es lo que viaja». Con dos
    // paneles la barra tiene que decir dos, y por eso el fixture de arriba trae
    // tres: un número escrito a mano pasaría una de las dos y no las dos.
    laConsola()
    server.use(
      http.get(`${API}/config/tabs/:tabId`, () =>
        ok({ tab: tab, panels: panels.slice(0, 2) }),
      ),
    )
    montar()

    expect(await screen.findByText(/2 paneles/)).toBeVisible()
  })

  it('con UN panel dice «panel» y no «paneles»', async () => {
    laConsola()
    server.use(
      http.get(`${API}/config/tabs/:tabId`, () =>
        ok({ tab: tab, panels: panels.slice(0, 1) }),
      ),
    )
    montar()

    const linea = await screen.findByText(/1 panel/)
    expect(linea).toHaveTextContent('1 panel')
    expect(linea).not.toHaveTextContent('1 paneles')
  })
})

describe('las DOS entradas mandan `tab_context` · F3.15', () => {
  it('la barra inferior abre la hoja y la pregunta lleva `tab_id`', async () => {
    const { preguntas } = laConsola()
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /Preguntar a Synapse/i }))
    await preguntar('¿Cómo vamos?')

    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]).toMatchObject({
      question: '¿Cómo vamos?',
      tab_context: { tab_id: tab?.id, period: '2026-07' },
    })
    // **Explícito**: el servicio devuelve 400 con los dos contextos, así que
    // que `tab_context` esté no alcanza — `panel_context` tiene que NO estar.
    expect(preguntas[0]).not.toHaveProperty('panel_context')
  })

  it('el CTA del navbar hace lo mismo', async () => {
    const { preguntas } = laConsola()
    montar()

    // El del navbar dice «Preguntar» a secas · el de la barra, «Preguntar a
    // Synapse». Son dos entradas con el mismo alcance, que es lo que el `.pen`
    // dibuja.
    await userEvent.click(
      await screen.findByRole('button', { name: 'Preguntar sobre esta pestaña' }),
    )
    await preguntar('¿Y el mes?')

    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]).toHaveProperty('tab_context')
    expect(preguntas[0]).not.toHaveProperty('panel_context')
  })

  it('y el PREGUNTAR de un panel sigue mandando `panel_context`', async () => {
    // El criterio lo pide explícito: «el `PREGUNTAR` de panel sigue funcionando
    // y sigue mandando `panel_id`». Son dos alcances, no uno que reemplaza al
    // otro.
    const { preguntas } = laConsola()
    montar()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Preguntar sobre Métrica A' }),
    )

    const hoja = await screen.findByRole('dialog')
    await userEvent.type(within(hoja).getByRole('textbox'), '¿Por qué cayó?')
    await userEvent.click(within(hoja).getByRole('button', { name: 'Preguntar' }))

    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]).toMatchObject({ panel_context: { panel_id: 'p-a' } })
    expect(preguntas[0]).not.toHaveProperty('tab_context')
  })
})

describe('la hoja de pestaña declara lo que NO tiene', () => {
  it('no ofrece sugeridas · esa ruta cuelga de un panel', async () => {
    // `/config/panels/{panelId}/chat-suggestions` no existe para una pestaña, y
    // pedirla con un id vacío sería un 404 por render. El hook se apaga.
    let pedidas = 0
    laConsola()
    server.use(
      http.get(`${API}/config/panels/:panelId/chat-suggestions`, () => {
        pedidas += 1
        return ok([])
      }),
    )
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /Preguntar a Synapse/i }))
    await screen.findByPlaceholderText(/Preguntá sobre esta pestaña/i)

    expect(pedidas).toBe(0)
  })

  it('el riel pide los hilos de ESTA pestaña, con `tab_id`', async () => {
    const urls: string[] = []
    laConsola()
    server.use(
      http.get(`${API}/config/chat/threads`, ({ request }) => {
        urls.push(request.url)
        return ok([])
      }),
    )
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /Preguntar a Synapse/i }))
    await screen.findByPlaceholderText(/Preguntá sobre esta pestaña/i)

    await waitFor(() => expect(urls.length).toBeGreaterThan(0))
    const ultima = urls.at(-1) as string
    expect(ultima).toContain(`tab_id=${tab?.id as string}`)
    expect(ultima).not.toContain('panel_id=')
  })
})
