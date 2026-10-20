// @vitest-environment jsdom

/** La barra del cliente activo en la consola · 2026-10-20
 *
 *  La consola sirve el cliente del token: `/config/*` no acepta otro. Con la
 *  barra y su selector, elegir otro cliente NO puede pintar los paneles de la
 *  sesión con el nombre de otro arriba. Lo que se afirma es eso, y que la salida
 *  DISPARE hasta la ruta.
 */
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { ClienteDeTrabajoProvider } from '@/surfaces/ClienteDeTrabajoProvider'
import { API, context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import { elegirCliente } from '../elegirCliente'

const TENANTS = [
  { id: 't-1', name: 'Under Armour México', label: '', created_at: '2026-09-22T09:18:45Z' },
  { id: 't-2', name: 'Terpel Colombia', label: 'Terpel CO', created_at: '2026-09-22T09:18:45Z' },
]

function Ruta() {
  const { pathname, search } = useLocation()
  return <p>EN {pathname + search}</p>
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <ClienteDeTrabajoProvider>
          <Routes>
            <Route path="/" element={<ConsoleContainer />} />
            <Route path="/admin" element={<Ruta />} />
          </Routes>
        </ClienteDeTrabajoProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const comoAdmin = () =>
  server.use(
    http.get(`${API}/config/me`, () => ok({ ...context, role: { id: 'r-1', name: 'admin' } })),
    http.get(`${API}/admin/tenants`, () => ok(TENANTS)),
    // El selector de agente del chat, que la consola pide para el admin.
    http.get(`${API}/chat/agents`, () => ok([])),
  )

describe('quien no administra', () => {
  it('ve su cliente en la barra, sin selector, y no pregunta por los demás', async () => {
    const pedidos: string[] = []
    server.use(
      http.get(`${API}/admin/tenants`, () => {
        pedidos.push('tenants')
        return ok(TENANTS)
      }),
    )
    montar()
    const barra = await screen.findByRole('region', { name: 'Cliente activo' })
    expect(await within(barra).findByText('Under Armour México')).toBeInTheDocument()
    expect(within(barra).queryByRole('button', { name: /Cambiar de cliente/ })).toBeNull()
    expect(pedidos).toEqual([])
  })
})

describe('quien administra varios clientes', () => {
  it('elige otro y la consola lo declara bloqueado, sin pintar los paneles de la sesión', async () => {
    comoAdmin()
    montar()
    const barra = await screen.findByRole('region', { name: 'Cliente activo' })
    await within(barra).findByRole('button', { name: /Cambiar de cliente/ })
    // Antes de cambiar, la consola está entera: con el título de la pestaña.
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preguntar sobre esta pestaña' })).toBeInTheDocument()

    await elegirCliente(/Terpel Colombia/)

    expect(within(barra).getByText('Terpel Colombia')).toBeInTheDocument()
    expect(within(barra).getByText('TERPEL CO')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'La consola de Terpel Colombia todavía no se puede abrir' })).toBeInTheDocument()
    expect(screen.getByText(/que es de Under Armour México/)).toBeInTheDocument()
    // Ni el título, ni las pestañas, ni «Preguntar»: son del cliente de la sesión.
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Preguntar sobre esta pestaña' })).toBeNull()
  })

  it('la salida lleva a administración CON ese cliente', async () => {
    comoAdmin()
    montar()
    await elegirCliente(/Terpel Colombia/)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir Terpel Colombia en administración' }))
    expect(await screen.findByText('EN /admin?cliente=t-2')).toBeInTheDocument()
  })

  it('volver a elegir el de la sesión devuelve la consola', async () => {
    comoAdmin()
    montar()
    await elegirCliente(/Terpel Colombia/)
    await elegirCliente(/Under Armour México/)
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /todavía no se puede abrir/ })).toBeNull()
  })
})
