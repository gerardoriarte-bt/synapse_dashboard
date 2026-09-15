// @vitest-environment jsdom

/** Validar y publicar · F4.14 y F4.15
 *
 *  **Dos trampas del servicio, y las dos se prueban acá.**
 *
 *  `POST /validate` responde **200 aunque la composición sea inválida**: el 200
 *  dice que la validación corrió, no que el layout esté bien. Y `POST /publish`
 *  rechaza con **422** si hay paneles inválidos, que es información y no un fallo
 *  del sistema.
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

const detalle = {
  layout: borrador,
  tabs: [
    {
      tab: {
        ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen',
        OperationalQuestion: '¿Cómo vamos?', SortOrder: 1, RoleIDs: [],
      },
      panels: [
        { ID: 'p-1', TabID: 'tab-a', MetricID: 'm-1', Type: 'kpi', ColStart: 1, ColSpan: 3, RowSpan: 4 },
      ],
    },
  ],
}

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
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/config/blocks`, () => ok(bloques)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.put(`${API}/admin/layouts/:id`, () => ok(detalle)),
  )
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <Builder />
    </QueryClientProvider>,
  )
}

async function abrir() {
  await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
  await screen.findByDisplayValue('Resumen')
}

describe('F4.14 · el servidor valida lo GUARDADO', () => {
  it('con cambios sin guardar, validar se deshabilita y dice por qué', async () => {
    // Un «válido» sobre otra composición es peor que no validar.
    base()
    montar()
    await abrir()

    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    expect(screen.getByRole('button', { name: 'Validar en el servidor' })).toBeDisabled()
    expect(screen.getByText(/el servidor valida lo guardado, no lo que se ve acá/)).toBeInTheDocument()
  })

  it('un 200 con `valido: false` NO autoriza a publicar', async () => {
    // **La trampa.** El 200 dice que la validación corrió. Leer el status sería
    // dar por bueno cualquier cosa.
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () =>
        ok({
          valid: false,
          errors: [
            { tab_id: 'tab-a', panel_id: 'p-1', field: 'type', message: 'un bloque kpi no dibuja una serie' },
          ],
        }),
      ),
    ])
    montar()
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Validar en el servidor' }))

    expect(await screen.findByText(/El servidor encontró 1 problema\(s\) · no se publica/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeDisabled()
  })

  it('nombra la PESTAÑA del problema, no su UUID', async () => {
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () =>
        ok({
          valid: false,
          errors: [{ tab_id: 'tab-a', panel_id: 'p-1', field: 'type', message: 'no dibuja esa forma' }],
        }),
      ),
    ])
    const { container } = montar()
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Validar en el servidor' }))

    expect(await screen.findByText(/^Resumen · un panel · no dibuja esa forma$/)).toBeInTheDocument()
    expect(container.textContent).not.toContain('tab-a')
  })

  it('un `valido: true` sí autoriza', async () => {
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
    ])
    montar()
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Validar en el servidor' }))
    expect(await screen.findByText(/La dio por válida|dio por válida/)).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).not.toBeDisabled(),
    )
  })
})

describe('F4.15 · publicar', () => {
  it('sin veredicto no se publica, y se dice que el servidor no vio nada', async () => {
    base()
    montar()
    await abrir()

    expect(screen.getByRole('button', { name: 'Publicar' })).toBeDisabled()
    expect(screen.getByText(/Sin validar · el servidor todavía no vio esta composición/)).toBeInTheDocument()
  })

  it('EDITAR después de validar retira el permiso', async () => {
    // El veredicto era sobre lo que había. Sin esto, se validaría una
    // composición y se publicaría otra — que es literalmente lo que el criterio
    // de F4.11 y F4.15 prohíbe.
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
    ])
    montar()
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Validar en el servidor' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).not.toBeDisabled(),
    )

    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeDisabled()
  })

  it('GUARDAR después de validar también lo retira', async () => {
    // Guardar limpia el borrador, así que `sucio` deja de alcanzar: el veredicto
    // anterior es sobre una composición que ya no está guardada.
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
    ])
    montar()
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Validar en el servidor' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).not.toBeDisabled(),
    )

    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    await waitFor(() => expect(screen.getByText('Sin cambios')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeDisabled()
    expect(screen.getByText(/todavía no vio esta composición/)).toBeInTheDocument()
  })

  it('publica mandando el versionId', async () => {
    const cuerpos: unknown[] = []
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
      http.post(`${API}/admin/layouts/:id/publish`, async ({ request }) => {
        cuerpos.push(await request.json())
        return ok({ ...borrador, Status: 'published', PublishedAt: '2026-09-15T10:00:00Z' })
      }),
    ])
    montar()
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Validar en el servidor' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).not.toBeDisabled(),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    await waitFor(() => expect(cuerpos).toEqual([{ version_id: 'v4' }]))
  })

  it('un 422 dice que hay paneles inválidos, no «error del sistema»', async () => {
    // B4.15: el servidor rechaza la publicación si hay paneles inválidos. Es
    // información, no un fallo.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
      http.post(
        `${API}/admin/layouts/:id/publish`,
        () =>
          new HttpResponse(JSON.stringify({ success: false, error: 'invalid panels' }), {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    ])
    montar()
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Validar en el servidor' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).not.toBeDisabled(),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(
      await screen.findByText(/El servidor rechazó la publicación: hay paneles inválidos/),
    ).toBeInTheDocument()
  })

  it('declara que publicar no despliega', async () => {
    // §7.2: es un cambio de dato, no un build.
    base()
    montar()
    await abrir()
    expect(screen.getByText(/Publicar no despliega · cambia qué layout sirve la consola/)).toBeInTheDocument()
  })
})
