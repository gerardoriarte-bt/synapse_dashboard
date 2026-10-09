// @vitest-environment jsdom

/** El header de administración y del builder, montado con sus RUTAS ·
 *  decisión humana del 2026-10-07
 *
 *  Las pruebas de `MenuDeTrabajo` e `IdentityBlock` verifican que avisen al
 *  contenedor. Ésta verifica **que el contenedor haga algo con el aviso**: el
 *  camino tiene tres saltos —contenedor → chrome → menú— y cada uno usa el
 *  spread condicional, con el que una prop mal nombrada compila y el botón se
 *  pinta muerto.
 *
 *  Por eso se monta con las rutas reales y se afirma el DESTINO: que la
 *  pantalla cambie, no que se haya llamado una función.
 */
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { Builder } from '@/surfaces/builder/Builder'
import { currentToken, saveToken } from '@/app/auth/session'
import { ok } from '../mocks/handlers'
import { server } from '../mocks/server'

const API = '*/api/v1'

/** Del cable · `GET /admin/tenants` y `LayoutDashboard`. */
const TENANTS = [{ id: 't-1', name: 'Under Armour México', label: '', created_at: '2026-09-22T09:18:45Z' }]
const DASHBOARD = { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 }

function montar(inicio: string) {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok(TENANTS)),
    http.get(`${API}/admin/tenants/:id/dashboards`, () => ok([DASHBOARD])),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/users`, () => ok([])),
    http.get(`${API}/admin/users`, () => ok({ users: [], total: 0 })),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[inicio]}>
        <Routes>
          <Route path="/" element={<p>LA CONSOLA</p>} />
          <Route path="/login" element={<p>EL INGRESO</p>} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/builder/*" element={<Builder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const menu = async () => userEvent.click(await screen.findByRole('button', { name: 'Menú de trabajo' }))

describe('la URL decide la pantalla · para que el menú pueda entrar directo', () => {
  it('administración abre en la pantalla de su ruta', async () => {
    montar('/admin/catalogo')
    expect(await screen.findByRole('heading', { level: 1, name: 'Catálogo de métricas' })).toBeInTheDocument()
  })

  it('el builder abre en la pantalla de su ruta', async () => {
    montar('/builder/historial')
    expect(await screen.findByRole('button', { name: 'Historial de versiones', current: 'page' })).toBeInTheDocument()
  })

  it('la navegación de la propia superficie CAMBIA la URL · si no, el menú la desmentiría', async () => {
    montar('/admin')
    await userEvent.click(await screen.findByRole('button', { name: 'Usuarios' }))
    await menu()
    expect(screen.getByRole('menuitem', { name: 'Usuarios' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('el menú de trabajo cruza superficies, directo a la pantalla', () => {
  it('desde el builder, a «Usuarios» de administración', async () => {
    montar('/builder')
    await menu()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Usuarios' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Usuarios' })).toBeInTheDocument()
  })

  it('desde administración, al «Historial de versiones» del builder', async () => {
    montar('/admin')
    await menu()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Historial de versiones' }))
    expect(await screen.findByRole('button', { name: 'Historial de versiones', current: 'page' })).toBeInTheDocument()
  })
})

describe('«Volver al dashboard» · el acceso rápido', () => {
  it.each([['/admin'], ['/builder']])('desde %s lleva a la consola', async (inicio) => {
    montar(inicio)
    await userEvent.click(await screen.findByRole('button', { name: 'Volver al dashboard' }))
    expect(await screen.findByText('LA CONSOLA')).toBeInTheDocument()
  })
})

describe('«Cerrar sesión» desde el nombre · llega hasta el contenedor', () => {
  it.each([['/admin'], ['/builder']])('desde %s borra el token y lleva al ingreso', async (inicio) => {
    saveToken('jwt-de-prueba')
    montar(inicio)
    await userEvent.click(await screen.findByRole('button', { name: /^Identidad · / }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))

    expect(await screen.findByText('EL INGRESO')).toBeInTheDocument()
    expect(currentToken()).toBeNull()
  })
})

describe('el orden de la derecha · decisión humana del 2026-10-07', () => {
  it.each([['/admin'], ['/builder']])('en %s: volver, usuario y el menú AL FINAL', async (inicio) => {
    montar(inicio)
    const volver = await screen.findByRole('button', { name: 'Volver al dashboard' })
    const usuario = await screen.findByRole('button', { name: /^Identidad · / })
    const menu = screen.getByRole('button', { name: 'Menú de trabajo' })
    const sigue = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    expect(sigue(volver, usuario)).toBe(true)
    expect(sigue(usuario, menu)).toBe(true)
  })
})
