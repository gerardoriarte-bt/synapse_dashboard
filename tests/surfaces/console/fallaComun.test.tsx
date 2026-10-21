// @vitest-environment jsdom

/** Una falla repetida se dice una vez · 2026-10-21
 *
 *  **Visto en QA con Keralty**: doce paneles en `ERROR` con el mismo error crudo
 *  de Snowflake, repetido doce veces y visible para cualquiera. El mensaje de
 *  abajo es el de esa pantalla, recortado.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { fallaComun } from '@/surfaces/console/fallaComun'
import type { WirePayload } from '@/api/adapt'
import { API, context, kpiMetric, kpiPanel, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const SNOWFLAKE =
  "snowflake sql: status 422: 002003 · SQL compilation error: Object 'DB_HNO_KERALTY.HNO_KY_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE' does not exist or not authorized."

const OTRO_PANEL = { ...kpiPanel, id: 'p-2', col_start: 5 }
const TERCERO = { ...kpiPanel, id: 'p-3', col_start: 9 }

function servir(lote: Record<string, WirePayload>, rol = 'Planner') {
  const pedidos: string[][] = []
  server.use(
    http.get(`${API}/config/me`, () => ok({ ...context, role: { id: 'r-1', name: rol } })),
    http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab, panels: [kpiPanel, OTRO_PANEL, TERCERO] })),
    http.post(`${API}/config/panels:batch`, async ({ request }) => {
      const { panel_ids } = (await request.json()) as { panel_ids: string[] }
      pedidos.push(panel_ids)
      return ok(Object.fromEntries(panel_ids.map((id) => [id, lote[id]])))
    }),
    http.get(`${API}/admin/tenants`, () => ok([])),
    http.get(`${API}/chat/agents`, () => ok([])),
  )
  return pedidos
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const FALLA: WirePayload = { status: 'ERROR', message: SNOWFLAKE }
const BIEN: WirePayload = {
  status: 'AVAILABLE',
  value: { shape: 'scalar', v: 10 },
  governance: { base: 'Venta del sitio', layer: 'GOLD', source: 'ERP', freshness: '2026-10-19T00:00:00Z', catalog_version: 1, measurement_window: '' },
}

describe('todos los paneles fallan por lo mismo', () => {
  it('quien no administra ve un aviso, sin el texto del servicio en ninguna parte', async () => {
    servir({ 'p-1': FALLA, 'p-2': FALLA, 'p-3': FALLA })
    montar()
    expect(await screen.findByRole('heading', { name: 'Ningún panel de esta pestaña se pudo calcular' })).toBeInTheDocument()
    expect(screen.getByText('Error · los 3 paneles')).toBeInTheDocument()
    expect(screen.queryByText(/DB_HNO_KERALTY/)).toBeNull()
    expect(screen.queryByText('Ver el detalle técnico')).toBeNull()
    // Cada panel apunta al aviso, y ninguno dice que el resto cargó bien.
    expect(screen.getAllByText('No se pudo calcular · la causa está en el aviso de arriba')).toHaveLength(3)
    expect(screen.queryByText('El resto de los paneles cargó normalmente')).toBeNull()
  })

  it('quien administra ve el texto del servicio, una sola vez', async () => {
    servir({ 'p-1': FALLA, 'p-2': FALLA, 'p-3': FALLA }, 'admin')
    montar()
    const aviso = await screen.findByRole('region', { name: 'Ningún panel de esta pestaña se pudo calcular' })
    expect(within(aviso).getByText('Ver el detalle técnico')).toBeInTheDocument()
    expect(screen.getAllByText(/DB_HNO_KERALTY/)).toHaveLength(1)
  })

  it('«Reintentar todos» pide los tres en una sola vuelta', async () => {
    const pedidos = servir({ 'p-1': FALLA, 'p-2': FALLA, 'p-3': FALLA })
    montar()
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar todos' }))
    await waitFor(() => expect(pedidos.at(-1)).toEqual(['p-1', 'p-2', 'p-3']))
  })
})

describe('sólo algunos', () => {
  it('el aviso dice cuántos, y el panel que cargó se ve', async () => {
    servir({ 'p-1': FALLA, 'p-2': FALLA, 'p-3': BIEN })
    montar()
    expect(await screen.findByRole('heading', { name: '2 paneles no se pudieron calcular' })).toBeInTheDocument()
    expect(screen.getByText('Error · 2 de 3 paneles')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar los 2' })).toBeInTheDocument()
  })

  it('un solo panel con error no arma aviso: lo dice el panel', async () => {
    servir({ 'p-1': FALLA, 'p-2': BIEN, 'p-3': BIEN })
    montar()
    expect(await screen.findByText(SNOWFLAKE)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /no se pudo calcular|se pudieron calcular/ })).toBeNull()
  })
})

describe('fallaComun', () => {
  const p = (id: string, mensaje?: string) => ({
    id,
    payload: (mensaje === undefined ? { estado: 'CARGANDO' } : { estado: 'ERROR', mensaje }) as never,
  })

  it('dos mensajes distintos son dos causas: gana la que alcanza a más', () => {
    expect(fallaComun([p('a', 'x'), p('b', 'y'), p('c', 'y'), p('d')])).toEqual({ mensaje: 'y', paneles: ['b', 'c'], total: 4 })
  })

  it('con dos causas repetidas, la que alcanza a más paneles', () => {
    expect(fallaComun([p('a', 'x'), p('b', 'x'), p('c', 'y'), p('d', 'y'), p('e', 'y')])?.mensaje).toBe('y')
    expect(fallaComun([p('a', 'y'), p('b', 'y'), p('c', 'y'), p('d', 'x'), p('e', 'x')])?.mensaje).toBe('y')
  })

  it('sin repetición, no hay aviso', () => {
    expect(fallaComun([p('a', 'x'), p('b', 'y')])).toBeNull()
  })
})
