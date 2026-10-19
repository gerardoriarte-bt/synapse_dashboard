// @vitest-environment jsdom

/** Los comparativos del mes abierto se dicen parciales · F5.22, 2026-10-19
 *
 *  **Visto en la consola el 19 de octubre**: «VS MES ANTERIOR −74,5 %», que son
 *  diecinueve días contra un septiembre completo. Se prueba la cadena entera
 *  —`ConsoleContainer → Panel → KpiBody`— porque el dato pasa por varios saltos
 *  y una marca que no llega se ve igual que una que no existe.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { marcarParcial } from '@/surfaces/console/comparativoParcial'
import { API, context, kpiMetric, kpiPanel, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const DOS_MESES = {
  ...context,
  periods: ['2026-10', '2026-09'],
  open_period: '2026-10',
  periods_detail: [
    { key: '2026-10', grain: 'month' as const, start: '2026-10-01', end: '2026-11-01' },
    { key: '2026-09', grain: 'month' as const, start: '2026-09-01', end: '2026-10-01' },
  ],
}

/** La forma medida en `dd_panel_data` para `revenue` en octubre de 2026. */
const CON_COMPARATIVO = {
  status: 'AVAILABLE',
  value: { shape: 'scalar', v: 336931 },
  presentation: {
    label: 'USD · TOTAL',
    comparative: [
      { delta: -74.5, label: 'VS MES ANTERIOR' },
      { delta: -34.8, label: 'VS AÑO ANTERIOR' },
    ],
  },
  governance: { base: 'Venta del sitio', layer: 'GOLD', source: 'ERP', freshness: '2026-10-19T00:00:00Z' },
}

function servir() {
  server.use(
    http.get(`${API}/config/me`, () => ok(DOS_MESES)),
    http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab, panels: [kpiPanel] })),
    http.post(`${API}/config/panels:batch`, () => ok({ [kpiPanel.id]: CON_COMPARATIVO })),
  )
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('en la consola', () => {
  it('con el mes abierto elegido, cada comparativo dice que el mes está incompleto', async () => {
    servir()
    montar()
    expect(await screen.findByText('VS MES ANTERIOR · mes incompleto')).toBeVisible()
    expect(screen.getByText('VS AÑO ANTERIOR · mes incompleto')).toBeVisible()
  })

  it('con un mes cerrado elegido, el comparativo va sin la marca', async () => {
    servir()
    montar()
    await screen.findByText('VS MES ANTERIOR · mes incompleto')
    await userEvent.selectOptions(screen.getByRole('combobox'), '2026-09')
    expect(await screen.findByText('VS MES ANTERIOR')).toBeVisible()
    expect(screen.queryByText(/mes incompleto/)).toBeNull()
  })
})

describe('marcarParcial', () => {
  it('no toca el delta · lo marca y nada más', () => {
    const p = {
      estado: 'DISPONIBLE',
      presentacion: { comparativo: [{ label: 'VS MES ANTERIOR', delta: -74.5 }] },
    } as never
    expect(marcarParcial(p, true)).toMatchObject({
      presentacion: { comparativo: [{ label: 'VS MES ANTERIOR', delta: -74.5, parcial: true }] },
    })
  })

  it('con el mes cerrado devuelve el mismo payload', () => {
    const p = { estado: 'DISPONIBLE', presentacion: { comparativo: [] } } as never
    expect(marcarParcial(p, false)).toBe(p)
  })
})
