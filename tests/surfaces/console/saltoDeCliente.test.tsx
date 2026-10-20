// @vitest-environment jsdom

/** El superadmin cambia de cliente y la consola es la de ese cliente · 2026-10-20
 *
 *  Contra `d794a3e`: `POST /auth/switch-tenant` devuelve un token cuyo cliente es
 *  el elegido, y `/config/*` sirve el cliente del token. **El servicio falso de
 *  acá hace lo mismo**: contesta según el token que llega, así que una consulta
 *  que salga con el token viejo trae el cliente viejo —que es justo el defecto
 *  que hay que poder ver—.
 *
 *  Medido en local contra ese binario el mismo día: el `/config/me` del token
 *  nuevo trae otro `tenant.id`, otras pestañas y otro dashboard, y `scope` sigue
 *  en `multi_tenant`.
 */
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { ClienteDeTrabajoProvider } from '@/surfaces/ClienteDeTrabajoProvider'
import { currentToken, saveToken, signOut } from '@/app/auth/session'
import { API, context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import { elegirCliente } from '../elegirCliente'

const TENANTS = [
  { id: 't-1', name: 'Under Armour México', label: 'UA México', created_at: '2026-09-22T09:18:45Z' },
  { id: 't-2', name: 'Terpel Colombia', label: 'Terpel CO', created_at: '2026-09-22T09:18:45Z' },
]

const SCOPE = { kind: 'multi_tenant' as const, tenants: TENANTS.map(({ id, name, label }) => ({ id, name, label })) }

/** El contexto que el servicio devuelve para cada cliente del token. */
const POR_CLIENTE: Record<string, typeof context> = {
  't-1': { ...context, role: { id: 'r-s1', name: 'superadmin' }, scope: SCOPE },
  't-2': {
    ...context,
    role: { id: 'r-s2', name: 'superadmin' },
    scope: SCOPE,
    tenant: { ...context.tenant, id: 't-2', name: 'Terpel Colombia', label: 'Terpel CO' },
    tabs: [{ ...(context.tabs ?? [])[0]!, id: 'tab-terpel', name: 'Estaciones', key: 'estaciones', operational_question: '¿Cómo venden las estaciones?' }],
    dashboards: [{ id: 'd-terpel', name: 'Terpel', slug: 'terpel', is_default: true, history_months: 12 }],
    active_dashboard_id: 'd-terpel',
    active_layout_id: 'l-terpel',
  },
}

function clienteDel(request: Request): string {
  return (request.headers.get('Authorization') ?? '').replace('Bearer tok-', '')
}

type Registro = { saltos: string[]; tabsPedidas: string[]; catalogos: string[] }

function servicio(saltoFalla?: { status: number; error: string }): Registro {
  const r: Registro = { saltos: [], tabsPedidas: [], catalogos: [] }
  server.use(
    http.get(`${API}/config/me`, ({ request }) => ok(POR_CLIENTE[clienteDel(request)] ?? POR_CLIENTE['t-1'])),
    http.get(`${API}/config/tabs/:tabId`, ({ params, request }) => {
      r.tabsPedidas.push(`${String(params['tabId'])}@${clienteDel(request)}`)
      const tabs = (POR_CLIENTE[clienteDel(request)] ?? POR_CLIENTE['t-1'])?.tabs ?? []
      return ok({ tab: tabs.find((t) => t.id === params['tabId']) ?? tabs[0], panels: [] })
    }),
    http.get(`${API}/config/catalog`, ({ request }) => {
      r.catalogos.push(clienteDel(request))
      return ok([])
    }),
    http.get(`${API}/admin/tenants`, () => ok(TENANTS)),
    http.get(`${API}/chat/agents`, () => ok([])),
    http.post(`${API}/auth/switch-tenant`, async ({ request }) => {
      const { tenant_id } = (await request.json()) as { tenant_id: string }
      r.saltos.push(tenant_id)
      if (saltoFalla !== undefined) {
        return HttpResponse.json({ success: false, error: saltoFalla.error, code: 'NOT_FOUND_ROLE' }, { status: saltoFalla.status })
      }
      return ok({
        token: `tok-${tenant_id}`,
        user: { id: 'u-1', tenant_id, email: 'operador@lobueno.test', role: 'superadmin', password_updated: true },
      })
    }),
  )
  return r
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <ClienteDeTrabajoProvider>
          <Routes>
            <Route path="/" element={<ConsoleContainer />} />
          </Routes>
        </ClienteDeTrabajoProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => saveToken('tok-t-1'))
afterEach(() => signOut())

describe('el superadmin elige otro cliente', () => {
  it('la consola pasa a ser la de ese cliente: su token, sus pestañas y su nombre', async () => {
    const r = servicio()
    montar()
    expect(await screen.findByRole('heading', { level: 1, name: /Tenemos stock/ })).toBeInTheDocument()

    await elegirCliente(/Terpel Colombia/)

    // La pestaña del cliente nuevo, pedida CON el token nuevo.
    expect(await screen.findByRole('heading', { level: 1, name: /venden las estaciones/ })).toBeInTheDocument()
    expect(r.saltos).toEqual(['t-2'])
    expect(currentToken()).toBe('tok-t-2')
    expect(r.tabsPedidas).toContain('tab-terpel@t-2')
    // Ninguna pestaña del cliente anterior se pidió con el token nuevo.
    expect(r.tabsPedidas).not.toContain('tab-1@t-2')
    // El catálogo es del cliente: se vuelve a pedir, y no se sirve el anterior.
    expect(r.catalogos).toEqual(['t-1', 't-2'])
    const barra = screen.getByRole('region', { name: 'Cliente activo' })
    expect(within(barra).getByText('Terpel Colombia')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /todavía no se puede abrir/ })).toBeNull()
  })

  it('y volver al suyo es otro salto, con su propio token', async () => {
    const r = servicio()
    montar()
    await elegirCliente(/Terpel Colombia/)
    await screen.findByRole('heading', { level: 1, name: /venden las estaciones/ })
    await elegirCliente(/Under Armour México/)
    expect(await screen.findByRole('heading', { level: 1, name: /Tenemos stock/ })).toBeInTheDocument()
    expect(r.saltos).toEqual(['t-2', 't-1'])
    expect(currentToken()).toBe('tok-t-1')
  })
})

describe('si el servicio no deja saltar', () => {
  it('lo declara con su razón, deja el token como estaba y no reintenta solo', async () => {
    const r = servicio({ status: 404, error: 'ese cliente no tiene rol superadmin' })
    montar()
    await elegirCliente(/Terpel Colombia/)

    expect(await screen.findByText(/ese cliente no tiene rol superadmin/)).toBeInTheDocument()
    expect(currentToken()).toBe('tok-t-1')
    // Un render más no dispara otro intento.
    await waitFor(() => expect(r.saltos).toEqual(['t-2']))
    expect(screen.queryByRole('heading', { level: 1, name: /Tenemos stock/ })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Volver a la consola de Under Armour México' }))
    expect(await screen.findByRole('heading', { level: 1, name: /Tenemos stock/ })).toBeInTheDocument()
    expect(r.saltos).toEqual(['t-2'])
  })
})
