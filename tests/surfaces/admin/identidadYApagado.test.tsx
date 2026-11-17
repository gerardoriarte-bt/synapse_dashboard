// @vitest-environment jsdom

/** El nombre del cliente y su apagado, desde la ficha · A2 · 2026-11-10
 *
 *  **Los fixtures salen de lo medido contra `4192041` ese día**, con el binario
 *  y la base local: el `PUT` con `name` da 200 y con `name` vacío 400; el
 *  `DELETE` da 200 con `{id, is_active: false}`, otra vez 200 sobre uno ya
 *  apagado, y el cliente sale de `GET /admin/tenants`. Ver
 *  `docs/AUDITORIA-2026-11-10-respuesta-clientes-de-qa.md`.
 *
 *  **Lo que se prueba es lo que puede fallar viéndose bien**: que viaje sólo lo
 *  que cambió, que un nombre vacío no salga, que un admin de cliente no vea el
 *  apagado, y que apagar DISPARE el `DELETE` al cliente de la ficha —y no a
 *  otro— recién después de confirmar.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const cliente = (id: string, name: string, user_count: number) => ({
  id,
  name,
  label: '',
  locale: 'es-CO',
  currency: 'COP',
  timezone: 'America/Bogota',
  user_count,
  last_published_at: null,
  worst_feed_status: 'unknown',
  worst_feed_freshness_hours: null,
  status: null,
  vertical: null,
  created_at: '2026-09-25T10:00:00Z',
})

const usuario = (id: string) => ({
  id,
  email: `${id}@ejemplo.co`,
  name: id,
  role: 'admin',
  role_id: 'r-1',
  tenant_id: 't-2',
  is_active: true,
  last_login_at: null,
  created_at: '2026-10-01T10:00:00Z',
})

/** El escenario · `alcance` es lo que esta prueba mueve. */
function base(alcance: 'plataforma' | 'usuario') {
  const puts: unknown[] = []
  const deletes: string[] = []
  let lista = [cliente('t-1', 'Under Armour México', 12), cliente('t-2', 'Synapse UA HTML', 2)]
  server.use(
    http.get(`${API}/config/me`, () =>
      ok({
        ...context,
        scope:
          alcance === 'plataforma'
            ? {
                kind: 'multi_tenant',
                tenants: lista.map((t) => ({ id: t.id, name: t.name, label: '' })),
              }
            : context.scope,
      }),
    ),
    http.get(`${API}/admin/tenants`, () => ok(lista)),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/agents`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/feeds`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/users`, () => ok([usuario('ana'), usuario('luis')])),
    http.get(`${API}/admin/users`, () => ok({ users: [], total: 0, tenants: 0 })),
    http.put(`${API}/admin/tenants/:id`, async ({ params, request }) => {
      const cuerpo = (await request.json()) as { name?: string; label?: string }
      puts.push(cuerpo)
      lista = lista.map((t) => (t.id === params['id'] ? { ...t, ...cuerpo } : t))
      return ok({
        id: params['id'],
        name: cuerpo.name ?? 'Synapse UA HTML',
        label: cuerpo.label ?? '',
      })
    }),
    http.delete(`${API}/admin/tenants/:id`, ({ params }) => {
      deletes.push(String(params['id']))
      lista = lista.filter((t) => t.id !== params['id'])
      return ok({ id: params['id'], is_active: false })
    }),
  )
  return { puts, deletes }
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function abrirFicha() {
  await userEvent.click(await screen.findByRole('button', { name: /^Synapse UA HTML · / }))
  await screen.findByRole('navigation', { name: 'Migaja' })
}

describe('el nombre del cliente · EV-003', () => {
  it('renombrar manda SÓLO el nombre, y el título lo dice', async () => {
    const red = base('usuario')
    montar()
    await abrirFicha()
    const identidad = screen.getByRole('region', { name: 'Resumen · Identidad' })
    await userEvent.click(within(identidad).getByRole('button', { name: 'Editar' }))
    const nombre = within(identidad).getByRole('textbox', { name: 'Nombre' })
    await userEvent.clear(nombre)
    await userEvent.type(nombre, '  Under Armour MX ')
    await userEvent.click(within(identidad).getByRole('button', { name: 'Guardar' }))

    // La forma corta no cambió, así que no viaja: el servicio la deja como está.
    await waitFor(() => expect(red.puts).toEqual([{ name: 'Under Armour MX' }]))
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Under Armour MX' }),
    ).toBeInTheDocument()
  })

  it('con el nombre vacío no se puede guardar · el servicio lo rechaza con 400', async () => {
    const red = base('usuario')
    montar()
    await abrirFicha()
    const identidad = screen.getByRole('region', { name: 'Resumen · Identidad' })
    await userEvent.click(within(identidad).getByRole('button', { name: 'Editar' }))
    await userEvent.clear(within(identidad).getByRole('textbox', { name: 'Nombre' }))
    expect(within(identidad).getByRole('button', { name: 'Guardar' })).toBeDisabled()
    expect(red.puts).toEqual([])
  })
})

describe('apagar el cliente · sólo el equipo interno', () => {
  it('un admin de UN cliente no lo ve', async () => {
    base('usuario')
    montar()
    await abrirFicha()
    expect(screen.queryByRole('region', { name: 'Apagar el cliente' })).toBeNull()
  })

  it('pide confirmar, dice qué NO hace, y recién ahí manda el DELETE a ESTE cliente', async () => {
    const red = base('plataforma')
    montar()
    await abrirFicha()
    const seccion = await screen.findByRole('region', { name: 'Apagar el cliente' })

    await userEvent.click(within(seccion).getByRole('button', { name: 'Apagar cliente' }))
    expect(red.deletes).toEqual([])
    // Las dos cosas que el servicio no hace, medidas contra `4192041`.
    expect(within(seccion).getByText(/Sus 2 usuarios pueden seguir entrando/)).toBeInTheDocument()
    expect(within(seccion).getByText(/no se puede volver a encender/)).toBeInTheDocument()

    await userEvent.click(
      within(seccion).getByRole('button', { name: 'Sí, apagar «Synapse UA HTML»' }),
    )
    await waitFor(() => expect(red.deletes).toEqual(['t-2']))

    // Vuelve a la lista, y el cliente ya no está.
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Migaja' })).toBeNull())
    expect(
      await screen.findByRole('button', { name: /^Under Armour México · / }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Synapse UA HTML · / })).toBeNull()
  })

  it('cancelar no manda nada', async () => {
    const red = base('plataforma')
    montar()
    await abrirFicha()
    const seccion = await screen.findByRole('region', { name: 'Apagar el cliente' })
    await userEvent.click(within(seccion).getByRole('button', { name: 'Apagar cliente' }))
    await userEvent.click(within(seccion).getByRole('button', { name: 'Cancelar' }))
    expect(within(seccion).getByRole('button', { name: 'Apagar cliente' })).toBeInTheDocument()
    expect(red.deletes).toEqual([])
  })
})
