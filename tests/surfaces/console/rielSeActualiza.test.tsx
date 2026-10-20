// @vitest-environment jsdom

/** El riel se entera de la consulta recién hecha · F5.26, 2026-10-19
 *
 *  **Visto en la consola, con Cortex de verdad**: después de preguntar, el riel
 *  seguía en «Todavía no preguntaste nada», y al cerrar y reabrir la hoja la
 *  conversación no estaba en ninguna parte. El hilo SÍ se había guardado
 *  —medido en `user_threads`—; la lista seguía en caché hasta recargar.
 *
 *  Se afirma por la red y por la pantalla: el servicio devuelve la lista vacía
 *  antes del `POST` y con el hilo después, igual que el real.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const PREGUNTA = '¿Qué plataforma tuvo mejor ROAS este mes?'

/** La forma capturada de `GET /config/chat/threads` · ver `reabrir.test.tsx`. */
const hilo = {
  id: 'ut-1',
  thread_id: 41,
  thread_name: PREGUNTA,
  agent_id: 'a-ua',
  agent_name: 'Synapse UA',
  role: 'admin',
  first_message_preview: PREGUNTA,
  last_message_id: 7,
  period: '2026-10',
  tab_id: 'tab-1',
  tab_name: 'Resumen',
  created_at: '2026-10-19T12:41:46-05:00',
  updated_at: '2026-10-19T12:41:46-05:00',
}

function trama(evento: string, datos: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`
}

function laConsola() {
  const guardados: (typeof hilo)[] = []
  server.use(
    http.get(`${API}/config/chat/threads`, () => ok(guardados)),
    http.post(`${API}/config/chat`, () => {
      // El servicio guarda el hilo al responder: desde acá la lista lo trae.
      guardados.push(hilo)
      return new HttpResponse(
        new ReadableStream({
          start(controller) {
            const e = new TextEncoder()
            controller.enqueue(e.encode(trama('thread_info', { thread_id: 41, parent_message_id: 7, user_thread_id: 'ut-1' })))
            controller.enqueue(e.encode(trama('delta', { text: 'Google PMax.' })))
            controller.enqueue(e.encode(trama('done', {})))
            controller.close()
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
      )
    }),
  )
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('el riel después de preguntar', () => {
  it('muestra la consulta recién hecha sin recargar', async () => {
    laConsola()
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /Preguntar a Synapse/i }))
    const hoja = await screen.findByRole('dialog')
    expect(await within(hoja).findByText('Todavía no preguntaste nada.')).toBeInTheDocument()

    await userEvent.type(within(hoja).getByRole('textbox'), PREGUNTA)
    await userEvent.click(within(hoja).getByRole('button', { name: 'Preguntar' }))
    await waitFor(() => expect(within(hoja).getAllByText('Google PMax.').length).toBeGreaterThan(0))

    // El riel deja de decir que no hay nada: la lista se volvió a pedir.
    await waitFor(() => expect(within(hoja).queryByText('Todavía no preguntaste nada.')).toBeNull())
  })
})

// ── EL CHAT DE PESTAÑA OFRECE LAS SUGERIDAS DE LA PESTAÑA · F5.33 ───────────
//
// Arrancaba con una línea aunque la pestaña trajera `chat_suggestions`.
describe('las sugeridas de la pestaña', () => {
  const SUGERIDA = '¿Qué plataforma rindió más este mes?'

  it('se ofrecen al abrir, y tocar una la pregunta', async () => {
    const preguntas: Record<string, unknown>[] = []
    laConsola()
    server.use(
      http.get(`${API}/config/tabs/:tabId`, ({ params }) =>
        ok({
          tab: { id: String(params['tabId']), name: 'Resumen', key: 'resumen', operational_question: '¿Cómo vamos?', sort_order: 1, icon: '', chat_suggestions: [SUGERIDA] },
          panels: [],
        }),
      ),
      http.post(`${API}/config/chat`, async ({ request }) => {
        preguntas.push((await request.json()) as Record<string, unknown>)
        return new HttpResponse(
          new ReadableStream({
            start(controller) {
              const e = new TextEncoder()
              controller.enqueue(e.encode(trama('delta', { text: 'Google PMax.' })))
              controller.enqueue(e.encode(trama('done', {})))
              controller.close()
            },
          }),
          { headers: { 'Content-Type': 'text/event-stream' } },
        )
      }),
    )
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /Preguntar a Synapse/i }))
    const hoja = await screen.findByRole('dialog')
    await userEvent.click(await within(hoja).findByRole('button', { name: SUGERIDA }))
    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]?.['question']).toBe(SUGERIDA)
  })
})
