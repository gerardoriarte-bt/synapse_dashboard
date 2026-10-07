// @vitest-environment jsdom

/** Guardar el borrador · F4.13 · y el guardado automático del 2026-10-07
 *
 *  **La prueba que sostiene la tarea es la del segundo guardado.** El PUT
 *  devuelve los `id` que el servidor acaba de asignar a lo nuevo; si el borrador
 *  local sobrevive, esas pestañas y paneles **siguen sin `id`** y el guardado
 *  siguiente los crea de nuevo. El síntoma es duplicados, y aparece recién la
 *  segunda vez.
 *
 *  ── EL FLUJO CAMBIÓ EL 2026-10-07 ───────────────────────────────────────────
 *
 *  Cliente → Dashboard → Editor (`docs/AUDITORIA-2026-10-07-flujo-de-edicion.md`).
 *  Las pestañas se ajustan en el inspector del EDITOR —ya no en «Contexto de
 *  edición»—, y el guardado es **automático a los 3 s sin editar y explícito a
 *  la vez** (D2): el botón no desaparece, cambia de estado —«Guardar»,
 *  «Guardando…», «Guardado» con la hora, o «Reintentar»—.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]

/** `LayoutDashboard` del cable · `contracts/synapse-admin-wire.yaml`. */
const dashboards = [
  { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
]

const borrador = {
  id: 'l-2', tenant_id: 't-1', dashboard_id: 'd-1', status: 'draft', version_id: 'v4', published_at: null,
}

const tabDe = (layout: unknown, id: string | undefined, nombre: string) => ({
  layout,
  tabs: [
    {
      tab: {
        ...(id === undefined ? {} : { id: id }),
        layout_version_id: 'l-2',
        name: nombre,
        operational_question: '¿Cómo vamos?',
        sort_order: 1,
        role_ids: [],
      },
      panels: [],
    },
  ],
})

const metricas = [
  {
    id: 'm-1', tenant_id: 't-1', key: 'revenue', name: 'Ventas',
    shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
]
const bloques = [
  {
    type: 'kpi', ui_name: 'KPI', accepted_shapes: ['scalar'],
    col_span_min: 3, col_span_max: 4, row_span_min: 3, row_span_max: 4, layout_params: [],
  },
]

function base(extra: Parameters<typeof server.use> = []) {
  // **Los overrides van PRIMERO.** `server.use` antepone los handlers y, entre
  // los de una misma llamada, gana el primero. Con `...extra` al final, un
  // override de una ruta que la base ya declara **nunca se aplica** — y la
  // prueba pasa por el motivo equivocado. Lo encontró una mutación que
  // sobrevivía: el override estaba escrito y no corría.
  server.use(
    ...extra,
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/dashboards`, () => ok(dashboards)),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/config/blocks`, () => ok(bloques)),
    // Los pide el contenedor siempre —B6 y sus autores—, aunque estas pruebas
    // no los miren.
    http.get(`${API}/admin/dashboards/:id/publications`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/users`, () => ok([])),
  )
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      {/* **En un router, porque el contenedor navega.** Desde el 2026-09-16
          `Admin`/`Builder` ofrecen «volver a la consola» y eso es `useNavigate`,
          que fuera de un router lanza. Montarlos sin él probaba una app que la
          real no es. */}
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** El camino de quien llega: dashboard → abrir el editor. */
async function abrirEditor(user = userEvent.setup()) {
  await user.click(await screen.findByRole('button', { name: /Overview/ }))
  await user.click(await screen.findByRole('button', { name: 'Abrir el editor de Overview' }))
  await screen.findByRole('tablist', { name: 'Pestañas del dashboard' })
}

/** Los ajustes de la pestaña activa, en el inspector. */
async function ajustes(user = userEvent.setup()) {
  await user.click(screen.getByRole('button', { name: 'Ajustes de la pestaña' }))
  return within(await screen.findByRole('complementary', { name: 'Ajustes de la pestaña' }))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('§7.2 · guardado explícito', () => {
  it('manda el layout ENTERO, con los roles y paneles que el editor no toca', async () => {
    const cuerpos: unknown[] = []
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: borrador,
          tabs: [
            {
              tab: {
                id: 'tab-a', key: 'tab-a-key', layout_version_id: 'l-2', name: 'Resumen',
                operational_question: '¿Cómo vamos?', sort_order: 1,
                role_ids: ['r-1'],
              },
              panels: [
                { id: 'p-1', tab_id: 'tab-a', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4 },
              ],
            },
          ],
        }),
      ),
      http.put(`${API}/admin/layouts/:id`, async ({ request }) => {
        cuerpos.push(await request.json())
        return ok(tabDe(borrador, 'tab-a', 'Resumen ejecutivo'))
      }),
    ])
    montar()

    await abrirEditor()
    const insp = await ajustes()
    await userEvent.type(insp.getByDisplayValue('Resumen'), ' ejecutivo')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    const tab = (cuerpos[0] as { tabs: { role_ids: string[]; panels: unknown[] }[] }).tabs[0]
    // **Lo que el editor no muestra igual viaja.** El PUT es un reemplazo
    // completo: sin esto, renombrar borraría los dos.
    expect(tab?.role_ids).toEqual(['r-1'])
    expect(tab?.panels).toHaveLength(1)
  })

  it('el SEGUNDO guardado no duplica lo que el primero creó', async () => {
    // **La prueba de la tarea.** El PUT devuelve los `id` asignados; si el
    // borrador local sobrevive, la pestaña nueva sigue sin `id` y el servicio la
    // crea otra vez. Solo se ve la segunda vez.
    const cuerpos: { tabs: { id?: string; name: string }[] }[] = []
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
      http.put(`${API}/admin/layouts/:id`, async ({ request }) => {
        const cuerpo = (await request.json()) as (typeof cuerpos)[number]
        cuerpos.push(cuerpo)
        // El servidor le pone id a la que vino sin él, y devuelve lo que guardó.
        return ok({
          layout: borrador,
          tabs: [
            ...tabDe(borrador, 'tab-a', 'Resumen').tabs,
            {
              tab: {
                id: 'tab-nueva', key: 'tab-nueva-key', layout_version_id: 'l-2',
                name: cuerpo.tabs[1]?.name ?? 'Pestaña nueva',
                operational_question: '', sort_order: 2, role_ids: [],
              },
              panels: [],
            },
          ],
        })
      }),
    ])
    montar()

    await abrirEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Agregar una pestaña' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]?.tabs.map((t) => t.id)).toEqual(['tab-a', undefined])
    await screen.findByRole('button', { name: 'Guardado' })

    // Segunda vuelta: se edita otra cosa y se vuelve a guardar. El inspector
    // quedó abierto en la pestaña nueva.
    const insp = within(screen.getByRole('complementary', { name: 'Ajustes de la pestaña' }))
    await userEvent.type(insp.getByDisplayValue('Pestaña nueva'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(cuerpos).toHaveLength(2))
    // **Con `id`: se edita, no se duplica.**
    expect(cuerpos[1]?.tabs.map((t) => t.id)).toEqual(['tab-a', 'tab-nueva'])
  })

  it('lo editado MIENTRAS el PUT viaja se conserva, y adopta los ids que el servidor asignó', async () => {
    // **Nuevo con el guardado automático** · `adoptarIds`. Antes guardar
    // descartaba el borrador local; con el automático se sigue editando
    // mientras el PUT viaja, y descartarlo tiraría esas ediciones.
    let soltar: () => void = () => {}
    const espera = new Promise<void>((r) => {
      soltar = r
    })
    const cuerpos: { tabs: { id?: string; name: string; operational_question: string }[] }[] = []
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
      http.put(`${API}/admin/layouts/:id`, async ({ request }) => {
        const cuerpo = (await request.json()) as (typeof cuerpos)[number]
        cuerpos.push(cuerpo)
        if (cuerpos.length === 1) await espera
        return ok({
          layout: borrador,
          tabs: [
            ...tabDe(borrador, 'tab-a', 'Resumen').tabs,
            {
              tab: {
                id: 'tab-nueva', key: 'tab-nueva-key', layout_version_id: 'l-2',
                name: cuerpo.tabs[1]?.name ?? '', operational_question: cuerpo.tabs[1]?.operational_question ?? '',
                sort_order: 2, role_ids: [],
              },
              panels: [],
            },
          ],
        })
      }),
    ])
    montar()

    await abrirEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Agregar una pestaña' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await screen.findByRole('button', { name: 'Guardando…' })

    // Con el PUT en vuelo, se escribe la pregunta de la pestaña nueva.
    const insp = within(screen.getByRole('complementary', { name: 'Ajustes de la pestaña' }))
    await userEvent.type(insp.getByPlaceholderText('¿Qué pregunta contesta esta pestaña?'), '¿Y?')
    soltar()

    // El primer PUT volvió: lo escrito sigue en pantalla y sigue sucio.
    expect(await screen.findByRole('button', { name: 'Guardar' })).toBeEnabled()
    expect(insp.getByDisplayValue('¿Y?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(cuerpos).toHaveLength(2))
    // **Con el id que el primero asignó**: si no lo adoptara, el servicio crearía
    // una segunda «Pestaña nueva».
    expect(cuerpos[1]?.tabs.map((t) => t.id)).toEqual(['tab-a', 'tab-nueva'])
    expect(cuerpos[1]?.tabs[1]?.operational_question).toBe('¿Y?')
  })

  it('después de guardar queda limpio, y el botón dice «Guardado» con la hora', async () => {
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
      http.put(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen ejecutivo'))),
    ])
    montar()

    await abrirEditor()
    // Sin cambios todavía: el botón está, deshabilitado, y no inventa una hora.
    expect(screen.getByRole('button', { name: 'Guardado' })).toBeDisabled()
    expect(screen.queryByText(/^Guardado a las/)).toBeNull()

    const insp = await ajustes()
    await userEvent.type(insp.getByDisplayValue('Resumen'), ' ejecutivo')
    // **El contador vive en el chrome** y cuenta pestañas tocadas, no
    // pulsaciones: un contador de teclas diría «10 cambios» por escribir una
    // palabra.
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardado' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('button', { name: 'Guardado' })).toBeDisabled()
    expect(screen.queryByText(/con cambios/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
    // **La hora del guardado**, que es lo que dice que pasó algo.
    expect(screen.getByText(/^Guardado a las \d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('el contador cuenta PESTAÑAS, en plural cuando son varias', async () => {
    // Dos pestañas tocadas son dos, aunque una tenga diez teclas.
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: borrador,
          tabs: [
            ...tabDe(borrador, 'tab-a', 'Resumen').tabs,
            {
              ...tabDe(borrador, 'tab-b', 'Marca').tabs[0],
              tab: { ...tabDe(borrador, 'tab-b', 'Marca').tabs[0]?.tab, sort_order: 2 },
            },
          ],
        }),
      ),
    ])
    montar()

    await abrirEditor()
    let insp = await ajustes()
    await userEvent.type(insp.getByDisplayValue('Resumen'), ' ejecutivo')
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'Marca' }))
    insp = await ajustes()
    await userEvent.type(insp.getByDisplayValue('Marca'), '!')
    expect(screen.getByText('2 pestañas con cambios · se guarda solo en unos segundos')).toBeInTheDocument()
  })

  it('mientras guarda dice «Guardando…» y no deja apretar dos veces', async () => {
    // Dos PUT seguidos con el mismo borrador crearían dos veces lo que todavía
    // no tiene id · es la misma familia que el segundo guardado.
    let soltar: () => void = () => {}
    const espera = new Promise<void>((r) => {
      soltar = r
    })
    let puts = 0
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
      http.put(`${API}/admin/layouts/:id`, async () => {
        puts += 1
        await espera
        return ok(tabDe(borrador, 'tab-a', 'Resumen!'))
      }),
    ])
    montar()

    await abrirEditor()
    const insp = await ajustes()
    await userEvent.type(insp.getByDisplayValue('Resumen'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    const ocupado = await screen.findByRole('button', { name: 'Guardando…' })
    expect(ocupado).toBeDisabled()
    await userEvent.click(ocupado)
    soltar()
    await screen.findByRole('button', { name: 'Guardado' })
    expect(puts).toBe(1)
  })

  it('los problemas de composición NO bloquean guardar', async () => {
    // Un borrador es donde una composición a medias puede vivir. Lo que no se
    // puede es publicarla, y eso lo decide el servidor.
    let puts = 0
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: borrador,
          tabs: [
            {
              tab: {
                id: 'tab-a', key: 'tab-a-key', layout_version_id: 'l-2', name: 'Resumen',
                operational_question: '', sort_order: 1, role_ids: [],
              },
              panels: [],
            },
          ],
        }),
      ),
      http.put(`${API}/admin/layouts/:id`, () => {
        puts += 1
        return ok(tabDe(borrador, 'tab-a', 'Resumen'))
      }),
    ])
    montar()

    await abrirEditor()
    const insp = await ajustes()
    await userEvent.type(insp.getByDisplayValue('Resumen'), '!')

    expect(screen.getByText('1 problema de composición')).toBeInTheDocument()
    expect(
      screen.getByText('Se puede guardar igual; no se publica hasta corregirlos. El servidor tiene la última palabra.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(puts).toBe(1))
  })

  it('un 409 que llega igual nombra la causa y la salida', async () => {
    // Alguien puede publicar entre que la pantalla leyó la versión y el PUT sale.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
      http.put(
        `${API}/admin/layouts/:id`,
        () =>
          new HttpResponse(JSON.stringify({ success: false, error: 'layout is published' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    ])
    montar()

    await abrirEditor()
    const insp = await ajustes()
    await userEvent.type(insp.getByDisplayValue('Resumen'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      (await screen.findAllByText(/Alguien publicó esta versión mientras la editabas/)).length,
    ).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled()
  })
})

describe('§7.2 · guardado automático · D2 del 2026-10-07', () => {
  /** **Timers falsos con avance real**: `shouldAdvanceTime` deja correr MSW y
   *  React Query, y `advanceTimers` sincroniza user-event con el reloj falso. */
  function relojFalso() {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    return userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) })
  }

  it('guarda solo a los 3 s sin editar', async () => {
    let puts = 0
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
      http.put(`${API}/admin/layouts/:id`, () => {
        puts += 1
        return ok(tabDe(borrador, 'tab-a', 'Resumen!'))
      }),
    ])
    const user = relojFalso()
    montar()

    await abrirEditor(user)
    const insp = await ajustes(user)
    await user.type(insp.getByDisplayValue('Resumen'), '!')

    await act(() => vi.advanceTimersByTimeAsync(2900))
    expect(puts).toBe(0)
    await act(() => vi.advanceTimersByTimeAsync(200))
    await waitFor(() => expect(puts).toBe(1))
    expect(await screen.findByRole('button', { name: 'Guardado' })).toBeDisabled()
  })

  it('cada cambio REINICIA la cuenta', async () => {
    // Guardar a mitad de una palabra sería guardar algo que nadie escribió.
    let puts = 0
    const nombres: string[] = []
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
      http.put(`${API}/admin/layouts/:id`, async ({ request }) => {
        puts += 1
        const cuerpo = (await request.json()) as { tabs: { name: string }[] }
        nombres.push(cuerpo.tabs[0]?.name ?? '')
        return ok(tabDe(borrador, 'tab-a', 'Resumen!!'))
      }),
    ])
    const user = relojFalso()
    montar()

    await abrirEditor(user)
    const insp = await ajustes(user)
    const campo = insp.getByDisplayValue('Resumen')
    await user.type(campo, '!')
    await act(() => vi.advanceTimersByTimeAsync(2000))
    await user.type(campo, '!')
    // 4 s desde el primer cambio, 2 desde el segundo: todavía no. **Asíncrono a
    // propósito**: con el avance síncrono el `PUT` no alcanzaba a salir antes
    // de la aserción, y una cuenta que NO se reiniciaba pasaba igual —lo
    // encontró una mutación el 2026-10-07—.
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(puts).toBe(0)
    await act(() => vi.advanceTimersByTimeAsync(1100))
    await waitFor(() => expect(puts).toBe(1))
    // Y lo guardado es lo ÚLTIMO que se escribió, no la mitad.
    expect(nombres).toEqual(['Resumen!!'])
  })

  it('un error NO se reintenta solo · «Reintentar» sí', async () => {
    // Un automático que reintenta cada 3 s un 409 es un bucle contra el
    // servidor y un mensaje que parpadea.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let puts = 0
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
      http.put(`${API}/admin/layouts/:id`, () => {
        puts += 1
        return puts === 1
          ? new HttpResponse(JSON.stringify({ success: false, error: 'se cayó la base' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          : ok(tabDe(borrador, 'tab-a', 'Resumen!'))
      }),
    ])
    const user = relojFalso()
    montar()

    await abrirEditor(user)
    const insp = await ajustes(user)
    await user.type(insp.getByDisplayValue('Resumen'), '!')
    act(() => {
      vi.advanceTimersByTime(3100)
    })

    const reintentar = await screen.findByRole('button', { name: 'Reintentar' })
    expect(screen.getAllByText('se cayó la base').length).toBeGreaterThan(0)
    // Asíncrono, por la misma razón que arriba: con el síncrono un reintento
    // automático no alcanzaba a salir y la prueba no lo veía.
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(puts).toBe(1)

    await user.click(reintentar)
    await waitFor(() => expect(puts).toBe(2))
    expect(await screen.findByRole('button', { name: 'Guardado' })).toBeInTheDocument()
  })
})

describe('una versión publicada no se edita en el lugar', () => {
  /** **El camino real a una versión publicada abierta en el editor** desde el
   *  2026-10-07: abrir el editor siempre da un borrador —lo abre o lo crea—, así
   *  que se llega publicando el que se tiene abierto. */
  function publicable() {
    let estado: 'draft' | 'published' = 'draft'
    const layout = () => ({
      ...borrador,
      status: estado,
      published_at: estado === 'published' ? '2026-10-07T12:00:00Z' : null,
    })
    const handlers = [
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([layout()])),
      http.get(`${API}/admin/layouts/:id`, ({ params }) => {
        if (params['id'] === 'l-5') {
          return ok(tabDe({ ...borrador, id: 'l-5', version_id: 'v5' }, 'tab-x', 'Copia'))
        }
        const d = tabDe(layout(), 'tab-a', 'Resumen')
        return ok({
          ...d,
          tabs: [
            {
              ...d.tabs[0],
              panels: [
                { id: 'p-1', tab_id: 'tab-a', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4, chart: '' },
              ],
            },
          ],
        })
      }),
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
      http.post(`${API}/admin/layouts/:id/publish`, () => {
        estado = 'published'
        return ok(layout())
      }),
    ]
    return handlers
  }

  async function publicar() {
    await abrirEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Validar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Publicar' }))
    await screen.findByText(/Estás viendo la versión publicada: no se edita/)
  }

  it('lo dice ANTES de intentar y ofrece editar en un borrador', async () => {
    // Dejar apretar para que falle con 409 es enseñar que el botón a veces no
    // anda. La salida existe, así que se ofrece.
    base(publicable())
    montar()
    await publicar()

    expect(screen.getByRole('button', { name: 'Editar en un borrador' })).toBeEnabled()
    // **Ausente, no deshabilitado**: ni guardar, ni validar, ni el porqué de no
    // publicar lo que ya está publicado.
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Guardado' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Validar' })).toBeNull()
    expect(screen.queryByText(/^Para publicar/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  })

  it('no ofrece NADA que la edite · ni pestañas, ni ajustes, ni biblioteca, ni arrastre', async () => {
    // **Reemplaza «sigue deshabilitado aunque HAYA cambios»** · 2026-10-07.
    // Antes se podía editar la publicada en pantalla y sólo guardar faltaba;
    // ahora el lienzo es de sólo lectura y no hay cambio que hacer.
    base(publicable())
    montar()
    await publicar()

    expect(screen.queryByRole('button', { name: 'Agregar una pestaña' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ajustes de la pestaña' })).toBeNull()
    expect(screen.queryByLabelText('Biblioteca de tipos')).toBeNull()
    const lienzo = screen.getByLabelText('Lienzo de composición')
    const celda = within(lienzo).getByRole('gridcell', { name: /Ventas/ })
    expect(celda).toHaveAttribute('draggable', 'false')
    // Elegir el panel no abre el inspector.
    await userEvent.click(celda)
    expect(screen.queryByRole('complementary', { name: 'Configuración del panel' })).toBeNull()
    expect(screen.queryByText(/con cambios/)).toBeNull()
  })

  it('«Editar en un borrador» crea la versión SIGUIENTE en su dashboard y COPIA la composición', async () => {
    // ── **ESTA PRUEBA FIJABA EL DEFECTO** · corregida el 2026-10-01 ──────────
    //
    // El cable dice «Crear un borrador VACÍO» y `version_id` es cómo se va a
    // llamar, no de dónde sale: medido sobre un layout de 14 paneles, el
    // borrador salía con `tabs: 0`. La aserción que importa es el `PUT`.
    //
    // **Y desde el 2026-10-07 con `dashboard_id` y `vN+1`**: mandaba el
    // `version_id` de origen —quedaban dos «v4»— y sin dashboard, así que el
    // borrador caía en el por defecto.
    const posts: unknown[] = []
    const puts: { id: string; cuerpo: { tabs: { panels: unknown[] }[] } }[] = []
    base([
      http.post(`${API}/admin/tenants/:id/layouts`, async ({ request }) => {
        posts.push(await request.json())
        return ok({ ...borrador, id: 'l-5', version_id: 'v5' })
      }),
      http.put(`${API}/admin/layouts/:id`, async ({ request, params }) => {
        puts.push({
          id: String(params['id']),
          cuerpo: (await request.json()) as { tabs: { panels: unknown[] }[] },
        })
        return ok(tabDe({ ...borrador, id: 'l-5', version_id: 'v5' }, 'tab-x', 'Copia'))
      }),
      ...publicable(),
    ])
    montar()
    await publicar()

    await userEvent.click(screen.getByRole('button', { name: 'Editar en un borrador' }))

    await waitFor(() => expect(posts).toEqual([{ version_id: 'v5', dashboard_id: 'd-1' }]))

    // **Va al borrador NUEVO**, no al de origen.
    await waitFor(() => expect(puts).toHaveLength(1))
    expect(puts[0]?.id).toBe('l-5')
    // Y lleva la composición, no un `tabs: []` que el servicio aceptaría igual.
    expect(puts[0]?.cuerpo.tabs).toHaveLength(1)
    expect(puts[0]?.cuerpo.tabs[0]?.panels.length).toBeGreaterThan(0)
    // **SIN los ids del layout de origen**: con ellos el servicio intenta
    // actualizar filas de otro layout y contesta 500 (medido el 2026-10-01).
    expect(puts[0]?.cuerpo.tabs[0]).not.toHaveProperty('id')
    expect(puts[0]?.cuerpo.tabs[0]?.panels[0]).not.toHaveProperty('id')

    // Y lo dice: de qué se creó, y que lo publicado no cambia.
    expect(
      await screen.findByText(/Se creó el borrador v5 a partir de la versión publicada v4/),
    ).toBeInTheDocument()
  })
})
