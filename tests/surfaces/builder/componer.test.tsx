// @vitest-environment jsdom

/** Abrir el editor componiendo la pestaña elegida · 2026-09-16, rehecho el 2026-10-07
 *
 *  ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 *
 *  La nota de B1 en el `.pen` lo llama «el punto de entrada del builder». Hasta
 *  el 2026-10-07 era un CTA «Componer ‹pestaña›» por pestaña en B1; con la
 *  reorganización Cliente → Dashboard → Editor
 *  (`docs/AUDITORIA-2026-10-07-flujo-de-edicion.md`, D1) B1 elige el
 *  dashboard y **las pestañas viven en el editor, como pestañas**.
 *
 *  ── LO QUE SE AFIRMA ────────────────────────────────────────────────────────
 *
 *  **Que el gesto haga las DOS cosas**, igual que antes: elegir la pestaña tiene
 *  que marcarla Y cambiar lo que pinta el lienzo. Cada mitad por separado se ve
 *  bien y no resuelve nada, así que la prueba las mira juntas: se aprieta la
 *  SEGUNDA pestaña y el lienzo tiene que pintar sus paneles.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const version = {
  id: 'l-2', tenant_id: 't-1', dashboard_id: 'd-1', status: 'draft', version_id: 'v4', published_at: null,
}

/** `LayoutDashboard` del cable. */
const dashboard = {
  id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12,
}

/** Dos pestañas con distinta cantidad de paneles · del cable, en PascalCase. */
const panel = (n: number, tab: string) => ({
  id: `p-${String(n)}`, tab_id: tab, metric_id: 'm-1', type: 'kpi',
  col_start: n === 1 ? 1 : 4, col_span: 3, row_span: 4,
})

const detalle = {
  layout: version,
  tabs: [
    {
      tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿Cómo vamos?', sort_order: 1, role_ids: [] },
      panels: [panel(1, 'tab-a')],
    },
    {
      tab: { id: 'tab-b', layout_version_id: 'l-2', name: 'Detalle', operational_question: '¿Dónde se movió?', sort_order: 2, role_ids: [] },
      panels: [panel(2, 'tab-b'), panel(3, 'tab-b')],
    },
  ],
}

function servir() {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok([{ id: 't-1', name: 'Under Armour México' }])),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([version])),
    http.get(`${API}/admin/tenants/:id/dashboards`, () => ok([dashboard])),
    http.get(`${API}/admin/dashboards/:id/publications`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/users`, () => ok([])),
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

/** Dashboards → «Overview» → «Abrir el editor de Overview». */
async function abrirEditor() {
  await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
  await userEvent.click(await screen.findByRole('button', { name: 'Abrir el editor de Overview' }))
  return screen.findByRole('grid', { name: 'Lienzo de composición' })
}

describe('el editor compone la pestaña elegida', () => {
  it('hay una pestaña por cada una del dashboard, con su nombre y en orden', async () => {
    servir()
    montar()
    await abrirEditor()

    const pestanas = within(screen.getByRole('tablist', { name: 'Pestañas del dashboard' })).getAllByRole('tab')
    expect(pestanas.map((t) => t.textContent)).toEqual(['Resumen', 'Detalle'])
    // Abre en la primera.
    expect(pestanas[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('apretar la SEGUNDA pestaña compone ESA', async () => {
    servir()
    montar()
    const lienzo = await abrirEditor()

    // Se llegó al editor…
    expect(screen.getByRole('button', { name: 'Editor' })).toHaveAttribute('aria-current', 'page')
    expect(within(lienzo).getAllByRole('gridcell', { name: /^Indicador · / })).toHaveLength(1)

    await userEvent.click(screen.getByRole('tab', { name: 'Detalle' }))

    // …la pestaña queda marcada…
    expect(screen.getByRole('tab', { name: 'Detalle' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveAttribute('aria-selected', 'false')
    // …y el lienzo pinta SUS paneles —dos—, no el único de «Resumen».
    expect(
      within(screen.getByRole('grid', { name: 'Lienzo de composición' })).getAllByRole('gridcell', {
        name: /^Indicador · /,
      }),
    ).toHaveLength(2)
  })
})
