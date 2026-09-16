// @vitest-environment jsdom

/** «Componer ‹pestaña›» · el punto de entrada de B1 al canvas · 2026-09-16
 *
 *  ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 *
 *  La nota de B1 en el `.pen` lo llama «el punto de entrada del builder», y cada
 *  pestaña lleva su CTA con el rótulo **`AL ENTRAR SE ABRE B2 CON ESTE
 *  CONTEXTO`**. No lo teníamos: había que elegir versión y después acordarse de
 *  ir a «Canvas» por la navegación. Quien no hacía las dos cosas veía «Elegí una
 *  versión…» y concluía que el canvas no estaba construido — que es exactamente
 *  lo que pasó al revisar el diseño contra lo hecho.
 *
 *  ── LO QUE SE AFIRMA ────────────────────────────────────────────────────────
 *
 *  **Que el gesto haga las DOS cosas.** Cambiar de pantalla sin fijar la pestaña
 *  deja el canvas componiendo otra, y fijar la pestaña sin cambiar de pantalla
 *  no lleva a ningún lado. Cada mitad por separado se ve bien y no resuelve
 *  nada, así que la prueba las mira juntas: se aprieta en la SEGUNDA pestaña y
 *  el canvas tiene que abrir con esa.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const version = { ID: 'l-2', TenantID: 't-1', Status: 'draft', VersionID: 'v4', PublishedAt: null }

/** Dos pestañas con distinta cantidad de paneles · del cable, en PascalCase. */
const panel = (n: number, tab: string) => ({
  ID: `p-${String(n)}`, TabID: tab, MetricID: 'm-1', Type: 'kpi',
  ColStart: n === 1 ? 1 : 4, ColSpan: 3, RowSpan: 4,
})

const detalle = {
  layout: version,
  tabs: [
    {
      tab: { ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen', OperationalQuestion: '¿Cómo vamos?', SortOrder: 1, RoleIDs: [] },
      panels: [panel(1, 'tab-a')],
    },
    {
      tab: { ID: 'tab-b', LayoutVersionID: 'l-2', Name: 'Detalle', OperationalQuestion: '¿Dónde se movió?', SortOrder: 2, RoleIDs: [] },
      panels: [panel(2, 'tab-b'), panel(3, 'tab-b')],
    },
  ],
}

function servir() {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok([{ id: 't-1', name: 'Under Armour México' }])),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([version])),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.get(`${API}/admin/tenants/:id/catalog`, () =>
      ok([
        {
          id: 'm-1', tenant_id: 't-1', key: 'revenue', name: 'Ventas',
          shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP',
          base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
        },
      ]),
    ),
    http.get(`${API}/config/blocks`, () =>
      ok([
        {
          type: 'kpi', ui_name: 'KPI', accepted_shapes: ['scalar'],
          col_span_min: 3, col_span_max: 4, row_span_min: 3, row_span_max: 4,
          layout_params: [],
        },
      ]),
    ),
  )
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('B1 abre el canvas con la pestaña elegida', () => {
  it('hay un CTA por pestaña, con su nombre', async () => {
    servir()
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))

    // **Sin conteo en el CTA**: la fila ya lo declara y el `.pen` dice
    // `COMPONER ECOMMERCE OVERVIEW` a secas. Uno por pestaña, con su nombre.
    expect(await screen.findByRole('button', { name: 'Componer Resumen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Componer Detalle' })).toBeInTheDocument()
  })

  it('apretar en la SEGUNDA pestaña abre el canvas componiendo ESA', async () => {
    servir()
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await userEvent.click(await screen.findByRole('button', { name: /Componer Detalle/ }))

    // Cambió de pantalla…
    await waitFor(() => expect(screen.getByText(/Grilla 12/)).toBeInTheDocument())
    // …y compone la SEGUNDA. Sin fijar la pestaña esto abriría «Resumen» y la
    // pantalla se vería igual de bien.
    expect(screen.getByRole('combobox', { name: /Componiendo/i })).toHaveValue('1')
  })
})
