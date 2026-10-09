// @vitest-environment jsdom

/** Reabrir una consulta desde el riel · 2026-10-09
 *
 *  **El clic del riel no abría nada, y ninguna prueba lo vio.** `ThreadRail`
 *  tenía la suya —«elegir un hilo DISPARA con su id»— y `useChat.resume` no
 *  tenía ninguna: la cadena `riel → hoja → resume` no la recorría nadie, y
 *  `resume` sólo apuntaba el próximo envío al hilo sin traer sus mensajes.
 *  Visto desde el uso: la fila se marcaba y la hoja quedaba vacía.
 *
 *  Por eso esto monta la consola entera y aprieta la fila, como un usuario.
 *
 *  **Los fixtures son capturas**, no memoria: el hilo y sus mensajes salen de
 *  `9dc481e` levantado en `:4010` el 2026-10-09 —`GET /config/chat/threads` y
 *  `GET /config/chat/threads/{id}/messages`—, recortados.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

/** Capturado de `GET /config/chat/threads`, el primero de la lista. */
const hilo = {
  id: 'ccf4c429-ec76-4898-a941-b73644127907',
  thread_id: 17194754773,
  thread_name: '¿Cómo se distribuyó el presupuesto de medios por plataforma en agosto de 2026?',
  agent_id: 'eb79a48e-b4b4-46b1-86d8-1e1258cabe6f',
  agent_name: 'Synapse UA',
  role: 'admin',
  first_message_preview: '¿Cómo se distribuyó el presupuesto de medios por plataforma en agosto de 2026?',
  last_message_id: 1126874865170470,
  period: '2026-08',
  tab_id: '5c82dd4b-48f0-42cd-9d20-40d12514a1ca',
  tab_name: 'Resumen',
  created_at: '2026-10-09T10:03:35.92182-05:00',
  updated_at: '2026-10-09T10:16:24.99031-05:00',
}

/** Un segundo hilo, para la carrera: mismo agente, otra pregunta. */
const otro = {
  ...hilo,
  id: '7f43052f-4d88-48bd-838b-fb5a11995148',
  thread_id: 17194754761,
  thread_name: '¿Cuánto ingreso generó paid media por mes?',
  first_message_preview: '¿Cuánto ingreso generó paid media por mes?',
}

/** Capturado de `GET /config/chat/threads/{id}/messages`: la pregunta y la
 *  respuesta con su `structured_data` —el gráfico del agente, procedencia
 *  vacía como en toda consulta de pestaña—, y una tercera pregunta SIN
 *  respuesta, que es cómo queda un turno que se cortó. */
const mensajes = {
  messages: [
    {
      id: 'f5db8570-9557-4bdd-8a72-484024f82853',
      role: 'user',
      content: '¿Cómo se distribuyó el presupuesto de medios por plataforma en agosto de 2026?',
      created_at: '2026-10-09T10:03:35.928548-05:00',
    },
    {
      id: 'f9c7f172-c087-41e1-ac42-632b00b19d78',
      role: 'assistant',
      content:
        '\n\nEn agosto de 2026, la inversión de medios estuvo **fuertemente concentrada en dos plataformas**: Google y Meta (Facebook) absorbieron juntos el **87.5% del presupuesto**.',
      structured_data: {
        data: {
          shape: 'chart',
          chart_spec: JSON.stringify({
            mark: 'bar',
            title: 'Distribución de inversión de medios por plataforma — Agosto 2026 (USD)',
            data: {
              values: [
                { INVESTMENT: 63777.61, LABEL: 'Google' },
                { INVESTMENT: 33562.86, LABEL: 'Facebook' },
              ],
            },
            encoding: {
              x: { field: 'INVESTMENT', type: 'quantitative' },
              y: { field: 'LABEL', type: 'nominal' },
            },
          }),
        },
        shape: 'raw',
        provenance: {
          base: '',
          layer: '',
          family: '',
          period: '2026-08',
          source: 'cortex_agent',
          freshness: '',
          metric_key: '',
          queried_at: '2026-10-09T15:04:27Z',
          base_source: '',
          source_system: '',
          sql_available: true,
          catalog_version: 0,
        },
      },
      cortex_message_id: 1126874865178630,
      created_at: '2026-10-09T10:04:46.476945-05:00',
    },
    {
      id: 'c918c08d-7505-4d58-b5d6-0dc5ee7d4bb0',
      role: 'user',
      content: '¿Y en septiembre?',
      created_at: '2026-10-09T10:15:53.797779-05:00',
    },
  ],
  has_more: false,
}

const delOtro = {
  messages: [
    { id: 'u-2', role: 'user', content: '¿Cuánto ingreso generó paid media por mes?', created_at: '2026-10-09T09:00:00Z' },
    { id: 'a-2', role: 'assistant', content: 'Paid media generó ingresos en los ocho meses.', created_at: '2026-10-09T09:01:00Z' },
  ],
  has_more: true,
}

function trama(evento: string, datos: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`
}

function laConsola(opciones: { demoraDelPrimero?: number } = {}) {
  const preguntas: Record<string, unknown>[] = []
  server.use(
    http.get(`${API}/config/chat/threads`, () => ok([hilo, otro])),
    http.get(`${API}/config/chat/threads/:id/messages`, async ({ params }) => {
      if (params.id === hilo.id) {
        if (opciones.demoraDelPrimero !== undefined) await delay(opciones.demoraDelPrimero)
        return ok(mensajes)
      }
      if (params.id === otro.id) return ok(delOtro)
      return HttpResponse.json({ success: false, error: 'hilo no encontrado' }, { status: 404 })
    }),
    http.post(`${API}/config/chat`, async ({ request }) => {
      preguntas.push((await request.json()) as Record<string, unknown>)
      return new HttpResponse(
        new ReadableStream({
          start(c) {
            const e = new TextEncoder()
            c.enqueue(e.encode(trama('thread_info', { thread_id: hilo.thread_id })))
            c.enqueue(e.encode(trama('delta', { text: 'Sigue igual.' })))
            c.enqueue(e.encode(trama('done', {})))
            c.close()
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
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

async function abrirLaHoja() {
  await userEvent.click(await screen.findByRole('button', { name: 'Preguntar sobre esta pestaña' }))
  return screen.findByRole('dialog')
}

describe('reabrir una consulta del riel · 2026-10-09', () => {
  it('apretar la fila TRAE la conversación · no deja la hoja vacía', async () => {
    laConsola()
    montar()
    const hoja = await abrirLaHoja()

    await userEvent.click(await within(hoja).findByRole('button', { name: /^¿Cómo se distribuyó/ }))

    expect(await within(hoja).findByText(/fuertemente concentrada en dos plataformas/)).toBeVisible()
    expect(within(hoja).getByText(/Reabierta del historial/)).toBeVisible()
  })

  it('la cifra guardada se adapta como la del stream · procedencia vacía, no inventada', async () => {
    laConsola()
    montar()
    const hoja = await abrirLaHoja()
    await userEvent.click(await within(hoja).findByRole('button', { name: /^¿Cómo se distribuyó/ }))

    // Es la misma regla de la cifra en vivo: sin familia, el gráfico se
    // declara con su título. Si el historial se adaptara con otro código, acá
    // aparecería otra cosa —o nada—.
    expect(
      await within(hoja).findByText(/Distribución de inversión de medios por plataforma/),
    ).toBeVisible()
    expect(within(hoja).getByText(/no declaró de qué familia es/)).toBeVisible()
  })

  it('una pregunta sin respuesta guardada lo dice · no queda como si estuviera esperando', async () => {
    laConsola()
    montar()
    const hoja = await abrirLaHoja()
    await userEvent.click(await within(hoja).findByRole('button', { name: /^¿Cómo se distribuyó/ }))

    expect(await within(hoja).findByText(/El turno se cortó antes de terminar/)).toBeVisible()
    expect(within(hoja).queryByText(/^Consultando/)).toBeNull()
  })

  it('lo que se pregunta después SIGUE el mismo hilo · con el id entero', async () => {
    const { preguntas } = laConsola()
    montar()
    const hoja = await abrirLaHoja()
    await userEvent.click(await within(hoja).findByRole('button', { name: /^¿Cómo se distribuyó/ }))
    await within(hoja).findByText(/fuertemente concentrada/)

    await userEvent.type(within(hoja).getByRole('textbox'), '¿Y en octubre?')
    await userEvent.click(within(hoja).getByRole('button', { name: 'Preguntar' }))

    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]).toMatchObject({ thread_id: hilo.thread_id })
  })

  it('con más mensajes de los que vinieron, lo declara', async () => {
    laConsola()
    montar()
    const hoja = await abrirLaHoja()
    await userEvent.click(await within(hoja).findByRole('button', { name: /^¿Cuánto ingreso/ }))

    expect(await within(hoja).findByText(/los anteriores no se cargaron/)).toBeVisible()
  })

  it('si se elige otro mientras el primero carga, gana el último · no se pisan', async () => {
    laConsola({ demoraDelPrimero: 150 })
    montar()
    const hoja = await abrirLaHoja()

    await userEvent.click(await within(hoja).findByRole('button', { name: /^¿Cómo se distribuyó/ }))
    await userEvent.click(within(hoja).getByRole('button', { name: /^¿Cuánto ingreso/ }))

    expect(await within(hoja).findByText(/generó ingresos en los ocho meses/)).toBeVisible()
    // Se espera más que la demora del primero: si su respuesta pisara, ya
    // habría llegado.
    await delay(250)
    expect(within(hoja).queryByText(/fuertemente concentrada/)).toBeNull()
  })
})

describe('eliminar una consulta del riel · 2026-10-09 · opción A', () => {
  /** El riel después de borrar: el servicio deja de listar el hilo. Es lo que
   *  hace el borrado suave —`deleted_at`— y lo que la prueba necesita para
   *  ver que la fila se va porque el servicio lo dijo, no porque el front la
   *  escondió. */
  function conBorrado(estado: number = 200) {
    const borrados: string[] = []
    const { preguntas } = laConsola()
    server.use(
      http.get(`${API}/config/chat/threads`, () =>
        ok([hilo, otro].filter((h) => !borrados.includes(h.id))),
      ),
      http.delete(`${API}/history/threads/:id`, ({ params }) => {
        if (estado !== 200) {
          return HttpResponse.json({ success: false, error: 'no se pudo eliminar' }, { status: estado })
        }
        borrados.push(params.id as string)
        return ok({ message: 'thread eliminado del historial' })
      }),
    )
    return { borrados, preguntas }
  }

  it('confirmar BORRA ese hilo y la fila se va', async () => {
    const { borrados } = conBorrado()
    montar()
    const hoja = await abrirLaHoja()

    await userEvent.click(await within(hoja).findByRole('button', { name: `Eliminar ${otro.thread_name}` }))
    await userEvent.click(within(hoja).getByRole('button', { name: `Eliminar ${otro.thread_name}` }))

    await waitFor(() => expect(borrados).toEqual([otro.id]))
    await waitFor(() =>
      expect(within(hoja).queryByRole('button', { name: /^¿Cuánto ingreso/ })).toBeNull(),
    )
    expect(within(hoja).getByRole('button', { name: /^¿Cómo se distribuyó/ })).toBeVisible()
  })

  it('cancelar NO borra · la pregunta en línea se cierra', async () => {
    const { borrados } = conBorrado()
    montar()
    const hoja = await abrirLaHoja()

    await userEvent.click(await within(hoja).findByRole('button', { name: `Eliminar ${otro.thread_name}` }))
    await userEvent.click(within(hoja).getByRole('button', { name: 'Cancelar' }))

    expect(within(hoja).queryByText('¿Eliminar del historial?')).toBeNull()
    expect(borrados).toEqual([])
  })

  it('eliminar la consulta ABIERTA la suelta · lo siguiente no cuelga de un hilo borrado', async () => {
    const { preguntas } = conBorrado()
    montar()
    const hoja = await abrirLaHoja()
    await userEvent.click(await within(hoja).findByRole('button', { name: /^¿Cómo se distribuyó/ }))
    await within(hoja).findByText(/fuertemente concentrada/)

    await userEvent.click(within(hoja).getByRole('button', { name: `Eliminar ${hilo.thread_name}` }))
    await userEvent.click(within(hoja).getByRole('button', { name: `Eliminar ${hilo.thread_name}` }))

    await waitFor(() => expect(within(hoja).queryByText(/fuertemente concentrada/)).toBeNull())
    await userEvent.type(within(hoja).getByRole('textbox'), '¿Y ahora?')
    await userEvent.click(within(hoja).getByRole('button', { name: 'Preguntar' }))
    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]).not.toHaveProperty('thread_id')
  })

  it('si el servicio falla, lo dice EN la fila y la consulta sigue', async () => {
    conBorrado(500)
    montar()
    const hoja = await abrirLaHoja()

    await userEvent.click(await within(hoja).findByRole('button', { name: `Eliminar ${otro.thread_name}` }))
    await userEvent.click(within(hoja).getByRole('button', { name: `Eliminar ${otro.thread_name}` }))

    expect(await within(hoja).findByText('No se pudo eliminar')).toBeVisible()
    expect(within(hoja).getByRole('button', { name: /^¿Cuánto ingreso/ })).toBeVisible()
  })
})
