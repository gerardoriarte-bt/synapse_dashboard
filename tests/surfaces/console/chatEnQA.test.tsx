// @vitest-environment jsdom

/** El chat, como se vio en QA el 2026-11-23
 *
 *  **Cuatro cosas que se vieron usándolo contra el servicio real**, y lo que
 *  se afirma es lo que se ve — no la función que lo arma:
 *
 *   1. La tabla de respuesta decía «PRODUCT_ID» y escribía el id como
 *      «3,026,175».
 *   2. El pie decía «la consulta no la declara», que sonaba a error.
 *   3. Mientras el agente contestaba, el riel decía «Todavía no preguntaste
 *      nada».
 *   4. Con un solo agente, la cabecera ofrecía un desplegable de una opción.
 *
 *  La cadena del 3 y el 4 es `ConsoleContainer → ChatSheet`, igual que
 *  `agenteDelAdmin.test.tsx`: los agentes llegan por `/chat/agents` y la
 *  pregunta por el stream de `/config/chat`.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { ChatFigure } from '@/surfaces/console/ChatFigure'
import { blockTable } from '@/catalog/blocks'
import { createFormat } from '@/render/format'
import { API, context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { Block } from '@/catalog/types'
import type { ChatEvent } from '@/api/types'
import type { WireChatAgentOption } from '@/api/adapt'

const format = createFormat('es-MX')
const now = new Date('2026-11-23T12:00:00Z')

const conTabla = blockTable([
  {
    tipo: 'table',
    formasAceptadas: ['tabular'],
    colSpanMin: 5,
    colSpanMax: 8,
    rowSpanMin: 4,
    rowSpanMax: 5,
    paramsDisponibles: [],
  },
] as unknown as Block[])

/** La tabla de QA: el backend infiere las columnas de la consulta y pone el
 *  nombre de la columna como título. Los valores son los que se vieron. */
const deQA = {
  tipo: 'dato',
  valor: {
    forma: 'tabular',
    columnas: [
      { clave: 'PRODUCT_ID', titulo: 'PRODUCT_ID', numerica: true },
      { clave: 'TITULO_PRODUCTO', titulo: 'TITULO_PRODUCTO', numerica: false },
      { clave: 'GENERO', titulo: 'GENERO', numerica: false },
      { clave: 'UNIDADES', titulo: 'UNIDADES', numerica: true },
    ],
    filas: [
      { PRODUCT_ID: 3026175, TITULO_PRODUCTO: 'Tenis UA HOVR', GENERO: 'Hombre', UNIDADES: 1520 },
    ],
  },
  familia: null,
  base: '',
  capa: null,
  fuente: '',
  frescura: '2026-11-23T11:00:00Z',
  catalogVersion: 1,
} as unknown as Extract<ChatEvent, { tipo: 'dato' }>

describe('1 · la tabla del agente se lee', () => {
  it('un id sale con sus dígitos, sin separador de miles; una cantidad sí lo lleva', async () => {
    const { container } = render(<ChatFigure dato={deQA} bloques={conTabla} format={format} now={now} />)
    await screen.findByText('Tenis UA HOVR')
    expect(container.textContent).toContain('3026175')
    expect(container.textContent).not.toContain('3,026,175')
    // La cantidad de al lado sigue siendo una cifra formateada: el arreglo es
    // del id, no de la tabla.
    expect(container.textContent).not.toContain('1520')
  })

  it('los nombres de columna se leen sin guiones bajos, y sin traducirse', async () => {
    render(<ChatFigure dato={deQA} bloques={conTabla} format={format} now={now} />)
    await screen.findByText('Tenis UA HOVR')
    const encabezados = screen.getAllByRole('columnheader').map((th) => th.textContent)
    expect(encabezados).toEqual(['Product id', 'Titulo producto', 'Genero', 'Unidades'])
  })

  it('un título que alguien escribió se respeta tal cual', async () => {
    const escrito = {
      ...deQA,
      valor: {
        ...deQA.valor,
        columnas: [
          { clave: 'TITULO_PRODUCTO', titulo: 'Producto', numerica: false },
          { clave: 'UNIDADES', titulo: 'UNIDADES_VENDIDAS', numerica: true },
        ],
      },
    } as unknown as Extract<ChatEvent, { tipo: 'dato' }>
    render(<ChatFigure dato={escrito} bloques={conTabla} format={format} now={now} />)
    await screen.findByText('Tenis UA HOVR')
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Producto',
      'UNIDADES_VENDIDAS',
    ])
  })
})

describe('2 · el pie dice qué es, no que algo falló', () => {
  it('sin base ni capa declara una consulta libre del agente', async () => {
    const { container } = render(<ChatFigure dato={deQA} bloques={conTabla} format={format} now={now} />)
    await screen.findByText('Tenis UA HOVR')
    expect(container.textContent).toContain('Base · consulta libre del agente · sin base declarada')
    expect(container.textContent).toContain('Procedencia · consulta libre del agente')
    expect(container.textContent).not.toContain('no la declara')
  })
})

// ── LA HOJA ENTERA ─────────────────────────────────────────────────────────

const UNO: WireChatAgentOption[] = [
  { id: 'a-ua', name: 'Under Armour México', target_role: 'Planner', tenant_id: 't-1', tenant_name: 'Under Armour MX' },
]
const DOS: WireChatAgentOption[] = [
  ...UNO,
  { id: 'a-terpel', name: 'Terpel Lubricantes', target_role: 'admin', tenant_id: 't-9', tenant_name: 'Terpel' },
]

function trama(evento: string, datos: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`
}

/** `/config/chat` que contesta cuando se lo suelta: entre la pregunta y el
 *  `done` pasan los treinta segundos de QA. */
function laConsola(agentes: WireChatAgentOption[]) {
  const preguntas: Record<string, unknown>[] = []
  let soltar: () => void = () => {}
  server.use(
    http.get(`${API}/config/me`, () => ok({ ...context, role: { id: 'r-x', name: 'Admin' } })),
    http.get(`${API}/config/chat/threads`, () => ok([])),
    http.get(`${API}/chat/agents`, () => ok(agentes)),
    http.post(`${API}/config/chat`, async ({ request }) => {
      preguntas.push((await request.json()) as Record<string, unknown>)
      return new HttpResponse(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()
            controller.enqueue(encoder.encode(trama('thread_info', { thread_id: 41, parent_message_id: 7, user_thread_id: 'ut-1' })))
            soltar = () => {
              controller.enqueue(encoder.encode(trama('delta', { text: 'Listo.' })))
              controller.enqueue(encoder.encode(trama('done', {})))
              controller.close()
            }
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
      )
    }),
  )
  return { preguntas, soltar: () => soltar() }
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

describe('3 · mientras el agente contesta, el riel no niega la pregunta', () => {
  it('muestra la consulta en curso y no «Todavía no has preguntado nada»', async () => {
    const { soltar } = laConsola(UNO)
    montar()
    const hoja = await abrirLaHoja()
    expect(within(hoja).getByText('Todavía no has preguntado nada.')).toBeTruthy()

    await userEvent.type(within(hoja).getByRole('textbox'), '¿Qué productos vendieron más?')
    await userEvent.click(within(hoja).getByRole('button', { name: 'Preguntar' }))

    const enCurso = await within(hoja).findByRole('region', { name: 'Consulta en curso' })
    expect(within(enCurso).getByText('¿Qué productos vendieron más?')).toBeTruthy()
    expect(enCurso.textContent).toMatch(/respondiendo/i)
    expect(within(hoja).queryByText('Todavía no has preguntado nada.')).toBeNull()

    soltar()
    await waitFor(() => expect(within(hoja).getAllByText('Listo.').length).toBeGreaterThan(0))
  })
})

describe('4 · con un solo agente no se ofrece elegir', () => {
  it('sin desplegable: el agente se nombra como texto, y la pregunta lo lleva', async () => {
    const { preguntas, soltar } = laConsola(UNO)
    montar()
    const hoja = await abrirLaHoja()

    await within(hoja).findByText('Agente · Under Armour MX · Under Armour México · Planner')
    expect(within(hoja).queryByRole('combobox')).toBeNull()

    await userEvent.type(within(hoja).getByRole('textbox'), '¿Cómo vamos?')
    await userEvent.click(within(hoja).getByRole('button', { name: 'Preguntar' }))
    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]).toMatchObject({ agent_id: 'a-ua' })
    soltar()
  })

  it('con dos sigue el desplegable', async () => {
    laConsola(DOS)
    montar()
    const hoja = await abrirLaHoja()
    expect(await within(hoja).findByRole('combobox')).toBeTruthy()
  })
})
