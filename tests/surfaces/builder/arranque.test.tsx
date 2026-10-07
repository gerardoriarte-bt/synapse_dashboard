// @vitest-environment jsdom

/** El builder arranca en el cliente propio sin pasar por otro · 2026-10-07
 *
 *  **Visto en la red contra el servicio**: mientras `/config/me` cargaba, el
 *  cliente de trabajo caía al primero de la lista y se pedían sus datos. En el
 *  builder es peor que en administración: lo primero que pide son los
 *  dashboards del cliente, y lo que se elija en ese instante es de otro. La
 *  prueba del hook no ve que un llamador vuelva a pasar `?? null`; ésta mira lo
 *  que el builder PIDE.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const cliente = (id: string, name: string) => ({
  id,
  name,
  locale: 'es-MX',
  currency: 'USD',
  timezone: 'America/Mexico_City',
  user_count: 1,
  last_published_at: null,
  worst_feed_status: 'ok',
  worst_feed_freshness_hours: 1,
  status: null,
  vertical: null,
  created_at: '2026-09-22T09:18:45Z',
})

it('con `/config/me` lento, no pide nada del primer cliente si el propio es otro', async () => {
  const pedidos: string[] = []
  server.use(
    http.get(`${API}/config/me`, async () => {
      await new Promise((r) => setTimeout(r, 300))
      return ok({
        ...context,
        tenant: {
          ...context.tenant,
          id: 't-2',
          name: 'Keralty Colombia',
          label: 'Keralty Colombia',
        },
      })
    }),
    http.get(`${API}/admin/tenants`, () =>
      ok([cliente('t-1', 'Under Armour México'), cliente('t-2', 'Keralty Colombia')]),
    ),
    http.get(`${API}/admin/tenants/:id/*`, ({ params }) => {
      pedidos.push(String(params.id))
      return ok([])
    }),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await waitFor(() => expect(pedidos).toContain('t-2'))
  expect(pedidos).not.toContain('t-1')
})
