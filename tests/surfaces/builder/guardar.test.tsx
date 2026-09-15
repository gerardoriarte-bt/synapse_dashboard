// @vitest-environment jsdom

/** Guardar el borrador · F4.13
 *
 *  **La prueba que sostiene la tarea es la del segundo guardado.** El PUT
 *  devuelve los `id` que el servidor acaba de asignar a lo nuevo; si el borrador
 *  local sobrevive, esas pestañas y paneles **siguen sin `id`** y el guardado
 *  siguiente los crea de nuevo. El síntoma es duplicados, y aparece recién la
 *  segunda vez.
 */
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

const borrador = { ID: 'l-2', TenantID: 't-1', Status: 'draft', VersionID: 'v4', PublishedAt: null }
const publicado = {
  ID: 'l-1',
  TenantID: 't-1',
  Status: 'published',
  VersionID: 'v3',
  PublishedAt: '2026-09-10T12:00:00Z',
}

const tabDe = (layout: unknown, id: string | undefined, nombre: string) => ({
  layout,
  tabs: [
    {
      tab: {
        ...(id === undefined ? {} : { ID: id }),
        LayoutVersionID: 'l-2',
        Name: nombre,
        OperationalQuestion: '¿Cómo vamos?',
        SortOrder: 1,
        RoleIDs: [],
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
  server.use(
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/config/blocks`, () => ok([])),
    ...extra,
  )
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Builder />
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
                ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen',
                OperationalQuestion: '¿Cómo vamos?', SortOrder: 1,
                RoleIDs: ['r-1'],
              },
              panels: [
                { ID: 'p-1', TabID: 'tab-a', MetricID: 'm-1', Type: 'kpi', ColStart: 1, ColSpan: 3, RowSpan: 4 },
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
    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))

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
                ID: 'tab-nueva', LayoutVersionID: 'l-2', Name: 'Pestaña nueva',
                OperationalQuestion: '¿?', SortOrder: 2, RoleIDs: [],
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
    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]?.tabs.map((t) => t.id)).toEqual(['tab-a', undefined])

    // Segunda vuelta: se edita otra cosa y se vuelve a guardar.
    await userEvent.type(await screen.findByDisplayValue('Pestaña nueva'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))

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
    expect(screen.getByText('Sin guardar')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
    await waitFor(() => expect(screen.getByText('Sin cambios')).toBeInTheDocument())
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
                ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen',
                OperationalQuestion: '', SortOrder: 1, RoleIDs: [],
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
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).not.toBeDisabled()
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

    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled()
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

    expect(screen.getByText('Sin guardar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled()
  })

  it('duplicar manda el versionId de origen y salta al borrador nuevo', async () => {
    const cuerpos: unknown[] = []
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([publicado, borrador])),
      http.get(`${API}/admin/layouts/:id`, ({ params }) =>
        ok(tabDe(params['id'] === 'l-2' ? borrador : publicado, 'tab-a', params['id'] === 'l-2' ? 'Copia' : 'Resumen')),
      ),
      http.post(`${API}/admin/tenants/:id/layouts`, async ({ request }) => {
        cuerpos.push(await request.json())
        return ok(borrador)
      }),
    ])
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /v3/ }))
    await screen.findByDisplayValue('Resumen')
    await userEvent.click(screen.getByRole('button', { name: /Crear borrador desde esta versión/ }))

    await waitFor(() => expect(cuerpos).toEqual([{ version_id: 'v3' }]))
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
    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    expect(await screen.findByText(/Alguien publicó esta versión mientras la editabas/)).toBeInTheDocument()
  })
})
