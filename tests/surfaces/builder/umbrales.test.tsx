// @vitest-environment jsdom

/** El builder carga los umbrales del semáforo · decisión humana del 2026-11-24
 *
 *  Los cortes los define datos y quien compone los copia en el panel. Lo que
 *  hay que sostener es la cadena entera: **escribir los dos cortes tiene que
 *  llegar al `PUT` como `thresholds`**, que es lo que el servicio guarda. Un
 *  campo que se ve bien y no llega al cable es un botón muerto con otra cara.
 *
 *  Arnés recortado de `binder.test.tsx`: un `kpi` sobre una métrica escalar.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const versiones = [
  { id: 'l-2', tenant_id: 't-1', dashboard_id: 'd-1', status: 'draft', version_id: 'v4', published_at: null },
]
const dashboards = [
  { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
]

function detalleCon(options: Record<string, unknown>) {
  return {
    layout: versiones[0],
    tabs: [
      {
        tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿Cómo vamos?', sort_order: 1, role_ids: [] },
        panels: [
          { id: 'p-1', tab_id: 'tab-a', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4, options },
        ],
      },
    ],
  }
}

const bloques = [
  {
    type: 'kpi', ui_name: 'KPI', accepted_shapes: ['scalar'],
    col_span_min: 3, col_span_max: 4, row_span_min: 3, row_span_max: 4,
    layout_params: ['comparative', 'thresholds'],
  },
]

const metricas = [
  {
    id: 'm-1', tenant_id: 't-1', key: 'roas', name: 'ROAS',
    shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
]

/** Sirve el borrador y devuelve los `options` de cada `PUT`, en orden. */
function servir(options: Record<string, unknown> = {}) {
  const guardados: Record<string, unknown>[] = []
  server.use(
    http.get(`${API}/admin/tenants`, () => ok([{ id: 't-1', name: 'Under Armour México' }])),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(versiones)),
    http.get(`${API}/admin/tenants/:id/dashboards`, () => ok(dashboards)),
    http.get(`${API}/admin/dashboards/:id/publications`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/users`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalleCon(options))),
    http.put(`${API}/admin/layouts/:id`, async ({ request }) => {
      const cuerpo = (await request.json()) as {
        tabs: { id?: string; name: string; operational_question: string; sort_order: number; role_ids: string[]; panels: Record<string, unknown>[] }[]
      }
      const panel = cuerpo.tabs[0]?.panels[0]
      guardados.push((panel?.['options'] ?? {}) as Record<string, unknown>)
      return ok({
        layout: versiones[0],
        tabs: cuerpo.tabs.map((t, i) => ({
          tab: { id: t.id ?? `tab-${String(i)}`, name: t.name, operational_question: t.operational_question, sort_order: t.sort_order, role_ids: t.role_ids },
          panels: t.panels.map((x, j) => ({ ...x, id: x['id'] ?? `p-${String(j)}`, tab_id: t.id ?? `tab-${String(i)}` })),
        })),
      })
    }),
    http.get(`${API}/config/blocks`, () => ok(bloques)),
  )
  return guardados
}

async function abrirAjustes() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
  await userEvent.click(await screen.findByRole('button', { name: 'Abrir el editor de Overview' }))
  await screen.findByRole('grid', { name: 'Lienzo de composición' })
  const paneles = () => screen.getAllByRole('gridcell').filter((c) => c.getAttribute('draggable') === 'true')
  await waitFor(() => expect(paneles()).toHaveLength(1))
  await userEvent.click(paneles()[0] as HTMLElement)
  const inspector = within(await screen.findByRole('complementary', { name: 'Configuración del panel' }))
  await userEvent.click(inspector.getByRole('button', { name: /^Ajustes/ }))
  return within(screen.getByRole('region', { name: 'Ajustes' }))
}

describe('los umbrales se cargan con dos campos y llegan al cable', () => {
  it('los dos cortes dicen la dirección y se guardan como `thresholds`', async () => {
    const guardados = servir()
    const col = await abrirAjustes()

    await userEvent.type(col.getByLabelText('Corte de bien'), '3')
    await userEvent.type(col.getByLabelText('Corte de mal'), '2')
    expect(col.getByText('Más alto es mejor: bien desde 3, mal por debajo de 2.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(guardados.at(-1)).toEqual({ thresholds: { bien: 3, mal: 2 } }))
  })

  it('con el corte de bien menor, dice que más bajo es mejor', async () => {
    servir()
    const col = await abrirAjustes()
    await userEvent.type(col.getByLabelText('Corte de bien'), '20')
    await userEvent.type(col.getByLabelText('Corte de mal'), '40')
    expect(col.getByText('Más bajo es mejor: bien hasta 20, mal por encima de 40.')).toBeInTheDocument()
  })

  it('con un solo corte, lo que impide publicar lo dice', async () => {
    servir()
    const col = await abrirAjustes()
    await userEvent.type(col.getByLabelText('Corte de bien'), '3')
    await waitFor(() => expect(screen.getAllByText(/«umbrales» necesita los dos cortes/).length).toBeGreaterThan(0))
  })

  it('«Quitar umbrales» los borra del panel guardado', async () => {
    const guardados = servir({ thresholds: { bien: 3, mal: 2 }, comparative: true })
    const col = await abrirAjustes()
    expect(col.getByLabelText<HTMLInputElement>('Corte de bien').value).toBe('3')

    await userEvent.click(col.getByRole('button', { name: 'Quitar umbrales' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(guardados.at(-1)).toEqual({ comparative: true }))
  })
})

/** De dos lados · el pacing de Terpel. La elección es una `Opcion` y los
 *  bordes son cuatro campos; lo que se sostiene es lo mismo que arriba: **lo
 *  escrito llega al `PUT`**, con la forma que el validador acepta. */
describe('de dos lados, el rango llega al cable', () => {
  it('«Dos lados» y los dos bordes de bien se guardan como un rango, sin mal', async () => {
    const guardados = servir()
    const col = await abrirAjustes()

    expect(col.getByRole('button', { name: 'Un lado' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(col.getByRole('button', { name: 'Dos lados' }))
    expect(col.getByRole('button', { name: 'Dos lados' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.type(col.getByLabelText('Bien desde'), '90')
    await userEvent.type(col.getByLabelText('Bien hasta'), '110')
    expect(col.getByText('Bien entre 90 y 110; mal por debajo de 90 y por encima de 110.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(guardados.at(-1)).toEqual({ thresholds: { bien: [90, 110] } }))
  })

  it('con el rango de mal, el tramo del medio es aceptable y se guarda entero', async () => {
    const guardados = servir({ thresholds: { bien: [90, 110] } })
    const col = await abrirAjustes()
    expect(col.getByLabelText<HTMLInputElement>('Bien desde').value).toBe('90')

    await userEvent.type(col.getByLabelText('Mal por debajo de'), '80')
    await userEvent.type(col.getByLabelText('Mal por encima de'), '120')
    expect(
      col.getByText('Bien entre 90 y 110; mal por debajo de 80 y por encima de 120; aceptable entre los dos.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(guardados.at(-1)).toEqual({ thresholds: { bien: [90, 110], mal: [80, 120] } }))
  })

  it('un rango de mal que no contiene al de bien impide publicar, y lo dice', async () => {
    servir({ thresholds: { bien: [90, 110] } })
    const col = await abrirAjustes()
    await userEvent.type(col.getByLabelText('Mal por debajo de'), '95')
    await userEvent.type(col.getByLabelText('Mal por encima de'), '120')
    await waitFor(() =>
      expect(screen.getAllByText(/«umbrales» el rango de «mal» tiene que contener al de «bien»/).length).toBeGreaterThan(0),
    )
  })

  it('volver a «Un lado» borra el rango del panel guardado', async () => {
    const guardados = servir({ thresholds: { bien: [90, 110] }, comparative: true })
    const col = await abrirAjustes()
    await userEvent.click(col.getByRole('button', { name: 'Un lado' }))
    expect(col.getByLabelText('Corte de bien')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(guardados.at(-1)).toEqual({ comparative: true }))
  })
})
