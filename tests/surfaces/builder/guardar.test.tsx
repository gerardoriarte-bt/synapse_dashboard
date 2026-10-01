// @vitest-environment jsdom

/** Guardar el borrador · F4.13
 *
 *  **La prueba que sostiene la tarea es la del segundo guardado.** El PUT
 *  devuelve los `id` que el servidor acaba de asignar a lo nuevo; si el borrador
 *  local sobrevive, esas pestañas y paneles **siguen sin `id`** y el guardado
 *  siguiente los crea de nuevo. El síntoma es duplicados, y aparece recién la
 *  segunda vez.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]

const borrador = { id: 'l-2', tenant_id: 't-1', status: 'draft', version_id: 'v4', published_at: null }
const publicado = {
  id: 'l-1',
  tenant_id: 't-1',
  status: 'published',
  version_id: 'v3',
  published_at: '2026-09-10T12:00:00Z',
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

function base(extra: Parameters<typeof server.use> = []) {
  // **Los overrides van PRIMERO.** `server.use` antepone los handlers y, entre
  // los de una misma llamada, gana el primero. Con `...extra` al final, un
  // override de una ruta que la base ya declara **nunca se aplica** — y la
  // prueba pasa por el motivo equivocado. Lo encontró una mutación que
  // sobrevivía: el override estaba escrito y no corría.
  server.use(
    ...extra,
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/config/blocks`, () => ok([])),
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

    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await userEvent.type(await screen.findByDisplayValue('Resumen'), ' ejecutivo')
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
        cuerpos.push((await request.json()) as (typeof cuerpos)[number])
        // El servidor le pone id a la que vino sin él.
        return ok({
          layout: borrador,
          tabs: [
            ...tabDe(borrador, 'tab-a', 'Resumen').tabs,
            {
              tab: {
                id: 'tab-nueva', key: 'tab-nueva-key', layout_version_id: 'l-2', name: 'Pestaña nueva',
                operational_question: '¿?', sort_order: 2, role_ids: [],
              },
              panels: [],
            },
          ],
        })
      }),
    ])
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await screen.findByDisplayValue('Resumen')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar pestaña' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]?.tabs.map((t) => t.id)).toEqual(['tab-a', undefined])

    // Segunda vuelta: se edita otra cosa y se vuelve a guardar.
    await userEvent.type(await screen.findByDisplayValue('Pestaña nueva'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(cuerpos).toHaveLength(2))
    // **Con `id`: se edita, no se duplica.**
    expect(cuerpos[1]?.tabs.map((t) => t.id)).toEqual(['tab-a', 'tab-nueva'])
  })

  it('después de guardar queda limpio', async () => {
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
      http.put(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen ejecutivo'))),
    ])
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await userEvent.type(await screen.findByDisplayValue('Resumen'), ' ejecutivo')
    // **El contador vive en el chrome desde el 2026-09-15** y cuenta pestañas
    // tocadas, no pulsaciones: un contador de teclas diría «10 cambios» por
    // escribir una palabra.
    expect(screen.getByText('1 cambio(s) sin guardar')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByText(/cambio\(s\) sin guardar/)).toBeNull())
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
  })

  it('los problemas de composición NO bloquean guardar', async () => {
    // Un borrador es donde una composición a medias puede vivir. Lo que no se
    // puede es publicarla, y eso lo decide el servidor.
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
      http.put(`${API}/admin/layouts/:id`, () => ok(tabDe(borrador, 'tab-a', 'Resumen'))),
    ])
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await userEvent.type(await screen.findByDisplayValue('Resumen'), '!')

    expect(screen.getByText(/se guardan igual, no se publican/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })
})

describe('una versión publicada no se edita', () => {
  it('lo dice ANTES de intentar y ofrece duplicarla', async () => {
    // Dejar apretar para que falle con 409 es enseñar que el botón a veces no
    // anda. La salida existe, así que se ofrece.
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([publicado])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(publicado, 'tab-a', 'Resumen'))),
    ])
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /v3/ }))
    await screen.findByDisplayValue('Resumen')

    // **Ausente, no deshabilitado**: un CTA sin manejador no se pinta.
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
    expect(screen.getByText(/está publicada y no se edita/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear borrador desde esta versión/ })).toBeInTheDocument()
  })

  it('sigue deshabilitado aunque HAYA cambios', async () => {
    // **La prueba que la mutación pidió.** Con el borrador limpio, `!sucio` ya
    // deshabilita el botón, así que quitar `publicada` de la condición no
    // cambiaba nada. Hace falta editarlo para que las dos razones se separen.
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([publicado])),
      http.get(`${API}/admin/layouts/:id`, () => ok(tabDe(publicado, 'tab-a', 'Resumen'))),
    ])
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /v3/ }))
    await userEvent.type(await screen.findByDisplayValue('Resumen'), '!')

    expect(screen.getByText('1 cambio(s) sin guardar')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
  })

  it('duplicar COPIA la composición · el POST crea un borrador vacío', async () => {
    // ── **ESTA PRUEBA FIJABA EL DEFECTO** · corregida el 2026-10-01 ──────────
    //
    // Afirmaba `cuerpos` igual a `[{ version_id: 'v3' }]` y nada más, que es
    // exactamente lo que el front hacía: mandar el nombre y creer que eso
    // duplicaba. **El cable dice «Crear un borrador VACÍO»** y `version_id` es
    // cómo se va a llamar, no de dónde sale.
    //
    // Medido contra el servicio ese día sobre un layout de 14 paneles: el
    // borrador salía con `tabs: 0`. Y lo que viene después del botón es
    // publicar, así que el final de ese camino es **el dashboard reemplazado
    // por nada**.
    //
    // La aserción nueva es el `PUT`, que es lo único que puede fallar: que el
    // `POST` salga ya lo hacía el código roto.
    const posts: unknown[] = []
    const puts: { id: string; cuerpo: { tabs: { panels: unknown[] }[] } }[] = []
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([publicado, borrador])),
      http.get(`${API}/admin/layouts/:id`, ({ params }) => {
        const d = tabDe(
          params['id'] === 'l-2' ? borrador : publicado,
          'tab-a',
          params['id'] === 'l-2' ? 'Copia' : 'Resumen',
        )
        // **El fixture compartido trae `panels: []`**, y con una pestaña vacía
        // la aserción de abajo no separa «copió» de «no copió»: las dos mandan
        // cero paneles. El panel se agrega sólo en este caso.
        return ok({
          ...d,
          tabs: [
            {
              ...d.tabs[0],
              panels: [
                {
                  id: 'p-1', tab_id: 'tab-a', metric_id: 'm-1', type: 'kpi',
                  col_start: 1, col_span: 3, row_span: 4, chart: '',
                },
              ],
            },
          ],
        })
      }),
      http.post(`${API}/admin/tenants/:id/layouts`, async ({ request }) => {
        posts.push(await request.json())
        return ok(borrador)
      }),
      http.put(`${API}/admin/layouts/:id`, async ({ request, params }) => {
        puts.push({
          id: String(params['id']),
          cuerpo: (await request.json()) as { tabs: { panels: unknown[] }[] },
        })
        return ok(tabDe(borrador, 'tab-a', 'Copia'))
      }),
    ])
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /v3/ }))
    await screen.findByDisplayValue('Resumen')
    await userEvent.click(screen.getByRole('button', { name: /Crear borrador desde esta versión/ }))

    await waitFor(() => expect(posts).toEqual([{ version_id: 'v3' }]))

    // **Va al borrador NUEVO**, no al de origen: escribir la copia sobre la
    // versión abierta sería peor que no copiar.
    await waitFor(() => expect(puts).toHaveLength(1))
    expect(puts[0]?.id).toBe('l-2')

    // Y lleva la composición, no un `tabs: []` que el servicio aceptaría igual.
    expect(puts[0]?.cuerpo.tabs).toHaveLength(1)
    expect(puts[0]?.cuerpo.tabs[0]?.panels.length).toBeGreaterThan(0)

    // **SIN los ids del layout de origen.** Con ellos el servicio intenta
    // actualizar filas de otro layout y contesta 500 — medido contra el
    // servicio corriendo el 2026-10-01, con el `PUT` ya saliendo. Es la mitad
    // del arreglo que una aserción de «mandó algo» no habría visto.
    expect(puts[0]?.cuerpo.tabs[0]).not.toHaveProperty('id')
    expect(puts[0]?.cuerpo.tabs[0]?.panels[0]).not.toHaveProperty('id')

    expect(await screen.findByDisplayValue('Copia')).toBeInTheDocument()
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

    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await userEvent.type(await screen.findByDisplayValue('Resumen'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText(/Alguien publicó esta versión mientras la editabas/)).toBeInTheDocument()
  })
})
