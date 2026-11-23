// @vitest-environment jsdom

/** Una degradación repetida se dice una vez · 2026-11-23
 *
 *  **Visto en QA con los meses cerrados de UA**: cada tarjeta repetía la misma
 *  razón y el mismo «Qué lo desbloquea», empujando el cuerpo hacia abajo. Las
 *  frases de abajo son las de esa pantalla; el copy es del backend y el front
 *  no lo reescribe.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { degradacionComun } from '@/surfaces/console/degradacionComun'
import type { WirePayload } from '@/api/adapt'
import { API, context, kpiMetric, kpiPanel, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const RAZON = 'Los datos tienen más de 3 días'
const DESBLOQUEA = 'Se actualiza en la próxima materialización'

const OTRO_PANEL = { ...kpiPanel, id: 'p-2', col_start: 5 }
const TERCERO = { ...kpiPanel, id: 'p-3', col_start: 9 }

const governance = {
  base: 'Venta del sitio',
  layer: 'GOLD',
  source: 'ERP',
  freshness: '2026-10-19T00:00:00Z',
  catalog_version: 1,
  measurement_window: '',
}

const viejo = (reason = RAZON, unlocks = DESBLOQUEA): WirePayload =>
  ({
    status: 'DEGRADED',
    value: { shape: 'scalar', v: 10 },
    governance,
    reason,
    unlocks_with: unlocks,
  }) as WirePayload

const BIEN: WirePayload = { status: 'AVAILABLE', value: { shape: 'scalar', v: 10 }, governance }

function servir(lote: Record<string, WirePayload>) {
  server.use(
    http.get(`${API}/config/me`, () => ok(context)),
    http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab, panels: [kpiPanel, OTRO_PANEL, TERCERO] })),
    http.post(`${API}/config/panels:batch`, async ({ request }) => {
      const { panel_ids } = (await request.json()) as { panel_ids: string[] }
      return ok(Object.fromEntries(panel_ids.map((id) => [id, lote[id]])))
    }),
    http.get(`${API}/admin/tenants`, () => ok([])),
    http.get(`${API}/chat/agents`, () => ok([])),
  )
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

describe('varios paneles degradados por lo mismo', () => {
  it('un solo aviso arriba, con la razón tal cual, y en cada panel sólo el badge', async () => {
    servir({ 'p-1': viejo(), 'p-2': viejo(), 'p-3': viejo() })
    montar()
    const aviso = await screen.findByRole('region', { name: 'Paneles degradados' })
    expect(within(aviso).getByText('Los 3 paneles · misma limitación')).toBeInTheDocument()
    expect(within(aviso).getByText(RAZON)).toBeInTheDocument()
    expect(within(aviso).getByText(`Qué lo desbloquea · ${DESBLOQUEA}`)).toBeInTheDocument()
    // La razón se dice UNA vez en la página, no una por panel.
    expect(screen.getAllByText(RAZON)).toHaveLength(1)
    expect(screen.getAllByText(`Qué lo desbloquea · ${DESBLOQUEA}`)).toHaveLength(1)
    // Y cada panel conserva su badge: el estado no se esconde.
    expect(screen.getAllByText('Degradado')).toHaveLength(4)
  })

  it('el que tiene otra razón la sigue diciendo en su panel', async () => {
    servir({ 'p-1': viejo(), 'p-2': viejo(), 'p-3': viejo('Falta una fuente', 'La carga de mañana') })
    montar()
    const aviso = await screen.findByRole('region', { name: 'Paneles degradados' })
    expect(within(aviso).getByText('2 de 3 paneles · misma limitación')).toBeInTheDocument()
    expect(screen.getByText('Falta una fuente')).toBeInTheDocument()
    expect(within(aviso).queryByText('Falta una fuente')).toBeNull()
  })

  it('uno solo no arma aviso: lo dice su panel', async () => {
    servir({ 'p-1': viejo(), 'p-2': BIEN, 'p-3': BIEN })
    montar()
    expect(await screen.findByText(RAZON)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Paneles degradados' })).toBeNull()
  })
})

describe('degradacionComun', () => {
  const p = (id: string, razon: string, desbloqueaCon = 'x') => ({
    id,
    payload: { estado: 'DEGRADADO', razon, desbloqueaCon } as never,
  })

  it('agrupa por razón Y por lo que la desbloquea', () => {
    expect(degradacionComun([p('a', 'r', 'x'), p('b', 'r', 'y')])).toBeNull()
    expect(degradacionComun([p('a', 'r'), p('b', 'r'), p('c', 's')])).toEqual({
      razon: 'r',
      desbloqueaCon: 'x',
      paneles: ['a', 'b'],
      total: 3,
    })
  })

  it('una razón vacía no se agrupa: no hay nada que decir una vez', () => {
    expect(degradacionComun([p('a', '', ''), p('b', '', '')])).toBeNull()
  })
})
