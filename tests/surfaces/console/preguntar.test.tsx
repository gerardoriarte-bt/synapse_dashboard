// @vitest-environment jsdom

/** «Preguntar» de punta a punta · F3.3
 *
 *  **La cadena tiene cinco saltos y cada uno usa el spread condicional**:
 *  `ConsoleContainer → Console → PanelInGrid → Panel → PanelShell`. Con
 *  `exactOptionalPropertyTypes` ese idioma es obligatorio y tiene un costo
 *  conocido: **una prop mal nombrada compila**. Ya pasó tres veces el
 *  2026-09-02, siempre con el mismo síntoma — un botón que se aprieta y no
 *  llama a nada.
 *
 *  Por eso acá **no se verifica que el botón exista, se verifica que la
 *  pregunta LLEGUE al servicio con el panel correcto.** Un botón muerto se ve
 *  igual que uno vivo.
 *
 *  Y el stream que responde el mock **habla el cable** —`event:` + `data:` con
 *  las claves del servicio—, no nuestro vocabulario interno. Un mock que habla
 *  el dialecto propio esconde la frontera en vez de probarla: es lo que dejó
 *  pasar que el chat no pintara una sola palabra.
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
import type { WireMetric, WirePanel, WirePayload } from '@/api/adapt'

const governance = {
  base: '48 tiendas sobre 52',
  layer: 'GOLD',
  source: 'Snowflake',
  freshness: '2026-09-02T08:00:00Z',
  catalog_version: 1,
}

/** DOS paneles, y son dos a propósito: con uno solo, un `onChat` cableado
 *  siempre al primer panel pasa desapercibido. */
const METRICAS = [
  ['kpi', 'Venta diaria'],
  ['table', 'Detalle por tienda'],
] as const

const metrics = METRICAS.map(([tipo, name]) => ({
  id: `m-${tipo}`,
  tenant_id: 't-1',
  key: `k_${tipo}`,
  name,
  shape: tipo === 'kpi' ? 'scalar' : 'tabular',
  family: 'demand',
  layer: 'GOLD',
  source: 'Snowflake',
  base: '48 tiendas sobre 52',
  min_grain: 'month',
  dimensions: [],
  catalog_version: 1,
})) as unknown as WireMetric[]

const panels = METRICAS.map(([tipo], i) => ({
  id: `p-${tipo}`,
  type: tipo,
  metric_id: `m-${tipo}`,
  col_start: i * 6 + 1,
  col_span: 6,
  row_span: 4,
})) as unknown as WirePanel[]

const payloads: Record<string, WirePayload> = {
  'p-kpi': { status: 'AVAILABLE', value: { shape: 'scalar', v: 4280000 }, governance } as WirePayload,
  'p-table': {
    status: 'AVAILABLE',
    value: {
      shape: 'tabular',
      columns: [{ key: 'tienda', title: 'Tienda', numeric: false }],
      rows: [{ tienda: 'Polanco' }],
    },
    governance,
  } as WirePayload,
}

/** Una trama del cable, con sus DOS líneas. */
function trama(evento: string, datos: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`
}

/** El stream que responde el servicio, en el idioma del servicio. */
function responde(...tramas: string[]) {
  return new HttpResponse(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        for (const t of tramas) controller.enqueue(encoder.encode(t))
        controller.close()
      },
    }),
    { headers: { 'content-type': 'text/event-stream' } },
  )
}

/** Las peticiones de chat que llegaron, con su cuerpo ya parseado. */
function laConsola(): { preguntas: Record<string, unknown>[] } {
  const preguntas: Record<string, unknown>[] = []
  server.use(
    http.get(`${API}/config/catalog`, () => ok(metrics)),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: context.tabs[0], panels })),
    http.post(`${API}/config/panels:batch`, () => ok(payloads)),
    http.post(`${API}/config/chat`, async ({ request }) => {
      preguntas.push((await request.json()) as Record<string, unknown>)
      return responde(
        trama('thread_info', { thread_id: 41, parent_message_id: 7, user_thread_id: 'ut-1' }),
        trama('delta', { text: 'Cayó por quiebre de stock.' }),
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

/** Escribe y envía DENTRO de la hoja.
 *
 *  **«Preguntar» aparece dos veces en la pantalla** —el CTA de cada panel y el
 *  submit del formulario— así que buscarlo suelto es ambiguo. Acotar al diálogo
 *  no es un rodeo de la prueba: es lo que hace un usuario, que ve la hoja
 *  abierta encima. */
async function enviar(usuario: ReturnType<typeof userEvent.setup>, texto: string) {
  const hoja = await screen.findByRole('dialog')
  await usuario.type(within(hoja).getByRole('textbox'), texto)
  await usuario.click(within(hoja).getByRole('button', { name: 'Preguntar' }))
}

/** Aprieta «Preguntar» en el panel que lleva ese título. */
async function preguntarEn(titulo: string) {
  const usuario = userEvent.setup()
  const seccion = (await screen.findByRole('heading', { name: titulo })).closest('section')
  expect(seccion).not.toBeNull()
  const boton = Array.from(seccion!.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === 'Preguntar',
  )
  expect(boton).toBeDefined()
  await usuario.click(boton!)
  return usuario
}

describe('F3.3 · «Preguntar» abre la hoja con el panel desde el que se preguntó', () => {
  it('la hoja se titula con la métrica de ESE panel, no la del vecino', async () => {
    laConsola()
    montar()
    await preguntarEn('Detalle por tienda')

    const hoja = await screen.findByRole('dialog')
    expect(hoja).toHaveAttribute('aria-label', 'Detalle por tienda')
  })

  it('la pregunta viaja con el panel y el período que se está mirando', async () => {
    // **Es la aserción que vale.** Que el botón exista no dice nada: la cadena
    // tiene cinco saltos con spread condicional y una prop mal nombrada
    // compila. Lo que se comprueba es que el `panel_id` que llega al servicio
    // sea el del panel apretado.
    const { preguntas } = laConsola()
    montar()
    const usuario = await preguntarEn('Detalle por tienda')

    await enviar(usuario, '¿Por qué cayó?')

    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]).toEqual({
      question: '¿Por qué cayó?',
      // `p-table`, no `p-kpi`: el panel apretado.
      panel_context: { panel_id: 'p-table', period: '2026-07' },
    })
  })

  it('apretar en OTRO panel manda OTRO panel_id', async () => {
    const { preguntas } = laConsola()
    montar()
    const usuario = await preguntarEn('Venta diaria')

    await enviar(usuario, 'x')

    await waitFor(() => expect(preguntas).toHaveLength(1))
    expect(preguntas[0]?.['panel_context']).toEqual({ panel_id: 'p-kpi', period: '2026-07' })
  })

  it('la respuesta del CABLE se pinta · la cadena entera, no sólo la ida', async () => {
    // El mock manda `event: delta` con `{text}`. Si el traductor volviera a
    // descartar la línea `event:`, esto queda vacío — que es exactamente lo que
    // pasaba contra el servicio real mientras las pruebas estaban en verde.
    laConsola()
    montar()
    const usuario = await preguntarEn('Venta diaria')

    await enviar(usuario, '¿Por qué?')

    expect(await screen.findByText(/quiebre de stock/)).toBeInTheDocument()
  })

  it('una pregunta en blanco no llama al servicio', async () => {
    // La cuota por usuario está compartida con `/chat/*`: un turno que no
    // pregunta nada la gasta igual.
    const { preguntas } = laConsola()
    montar()
    await preguntarEn('Venta diaria')
    await screen.findByRole('dialog')

    const hoja = await screen.findByRole('dialog')
    expect(within(hoja).getByRole('button', { name: 'Preguntar' })).toBeDisabled()
    expect(preguntas).toHaveLength(0)
  })

  it('saltar a otro panel SIN cerrar la hoja no arrastra los turnos', async () => {
    // **La hoja no tapa la pantalla** —es un panel lateral de 480px— así que
    // los paneles de atrás siguen siendo clickeables y se puede saltar de uno a
    // otro sin cerrar. Ahí `PanelChat` NO se desmonta, y sin la `key` por panel
    // React reutiliza el mismo `useChat`: la respuesta sobre «Venta diaria»
    // queda debajo del título «Detalle por tienda».
    //
    // La primera versión de esta prueba cerraba la hoja antes de abrir la otra,
    // y así pasaba con la `key` y sin ella — el cierre desmonta igual. Lo
    // descubrió una mutación, no la lectura.
    laConsola()
    montar()
    const usuario = await preguntarEn('Venta diaria')
    await enviar(usuario, '¿Por qué?')
    await screen.findByText(/quiebre de stock/)

    // Sin cerrar: directo al otro panel.
    await preguntarEn('Detalle por tienda')

    const hoja = await screen.findByRole('dialog')
    expect(hoja).toHaveAttribute('aria-label', 'Detalle por tienda')
    expect(within(hoja).queryByText(/quiebre de stock/)).not.toBeInTheDocument()
  })

  it('cerrar la hoja y abrir la de otro panel tampoco los arrastra', async () => {
    laConsola()
    montar()
    const usuario = await preguntarEn('Venta diaria')
    await enviar(usuario, '¿Por qué?')
    await screen.findByText(/quiebre de stock/)

    await usuario.click(screen.getByRole('button', { name: 'Cerrar' }))
    await preguntarEn('Detalle por tienda')

    const hoja = await screen.findByRole('dialog')
    expect(hoja).toHaveAttribute('aria-label', 'Detalle por tienda')
    expect(screen.queryByText(/quiebre de stock/)).not.toBeInTheDocument()
  })
})

/** §17 · casilla 13 · «Clic abre chat con `metricId` + contexto» · F5.10
 *
 *  **La casilla dice `metricId` y el cable pide `panel_id`.** No es una
 *  divergencia que se resuelva acá: `nuevo-desarrollo.md` §17 se escribió antes
 *  de que existiera `POST /config/chat`, y el 2026-09-17 se decidió —decisión
 *  humana— adoptar la forma del backend, que es `panel_context: {panel_id,
 *  period}`. El servicio resuelve la métrica leyendo el panel por su id.
 *
 *  **Lo que la casilla protege sigue en pie, y es lo que se verifica:** que el
 *  chat quede anclado a la métrica del panel que se apretó. Un front que
 *  mandara el panel equivocado cumpliría «manda un panel_id» y abriría una
 *  conversación sobre otra cifra.
 *
 *  Queda anotado como propuesta de spec en el plan · F5.10.
 */
describe('§17 · casilla 13 · el chat queda anclado a la métrica del panel', () => {
  it('el `panel_id` que viaja es el del panel cuya MÉTRICA titula la hoja', async () => {
    // **El ancla se verifica de punta a punta**, no por partes: se lee el
    // título —que es el nombre de la métrica—, se busca qué panel la lleva en
    // el catálogo, y se exige que sea ese el que viajó.
    const { preguntas } = laConsola()
    montar()
    const usuario = await preguntarEn('Detalle por tienda')

    const hoja = await screen.findByRole('dialog')
    const tituloDeLaHoja = hoja.getAttribute('aria-label')
    await enviar(usuario, 'x')
    await waitFor(() => expect(preguntas).toHaveLength(1))

    const metrica = metrics.find((m) => m.name === tituloDeLaHoja)
    expect(metrica).toBeDefined()
    const panelDeEsaMetrica = panels.find((p) => p.metric_id === metrica!.id)
    expect(panelDeEsaMetrica).toBeDefined()

    const contexto = preguntas[0]?.['panel_context'] as { panel_id: string; period: string }
    expect(contexto.panel_id).toBe(panelDeEsaMetrica!.id)
    // Y el contexto: el período que se estaba mirando.
    expect(contexto.period).toBe('2026-07')
  })

  it('el panel NO navega solo · el viaje lo decide la superficie', async () => {
    // La otra mitad de la casilla, que §17 pide en su propia línea: «eventos
    // suben por callbacks — el componente no navega solo». Si `render/`
    // abriera la hoja, montar la consola sin `onAskPanel` la abriría igual.
    laConsola()
    montar()
    await screen.findByRole('heading', { name: 'Venta diaria' })

    // Sin apretar nada no hay hoja: nadie la abre por su cuenta al montar.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
