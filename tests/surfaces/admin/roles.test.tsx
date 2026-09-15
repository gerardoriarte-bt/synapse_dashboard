// @vitest-environment jsdom

/** A2 · roles del cliente · F4.3
 *
 *  **Los fixtures salen de `Role` en `contracts/synapse-admin-wire.yaml`**, que
 *  es una de las cinco rutas marcadas `x-origen: fork`: el servicio desplegado
 *  devuelve 404 y estas pruebas corren contra MSW, igual que se construyó la
 *  consola entera antes de que existiera el servicio.
 *
 *  Las dos aserciones que sostienen la tarea son de VOCABULARIO, no de CRUD:
 *  que «pestañas vacío» se lea como «ve todas» y que ocultar una métrica no se
 *  lea como un permiso.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]

const roles = [
  {
    id: 'r-1',
    tenant_id: 't-1',
    name: 'CEO',
    tab_ids: [],
    hidden_metric_ids: [],
    layout_overrides: {},
    user_count: 2,
  },
  {
    id: 'r-2',
    tenant_id: 't-1',
    name: 'Planner',
    tab_ids: ['tab-a'],
    hidden_metric_ids: ['m-2'],
    layout_overrides: {},
    user_count: 0,
  },
]

/** **El borrador va PRIMERO a propósito.** Con el publicado en la posición 0,
 *  «el primero de la lista» y «el publicado» son el mismo layout y una mutación
 *  que confunda los dos sobrevive. Lo hizo, en la primera corrida del arnés. */
const layouts = [
  { ID: 'l-2', TenantID: 't-1', Status: 'draft', VersionID: 'v4', PublishedAt: null },
  { ID: 'l-1', TenantID: 't-1', Status: 'published', VersionID: 'v3', PublishedAt: '2026-09-10T12:00:00Z' },
]

const detalle = {
  layout: layouts[1],
  tabs: [
    {
      tab: { ID: 'tab-a', LayoutVersionID: 'l-1', Name: 'Resumen', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
      panels: [],
    },
    {
      tab: { ID: 'tab-b', LayoutVersionID: 'l-1', Name: 'Inventario', OperationalQuestion: '¿?', SortOrder: 2, RoleIDs: [] },
      panels: [],
    },
  ],
}

const metricas = [
  {
    id: 'm-1', tenant_id: 't-1', key: 'revenue', name: 'Ventas',
    shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
  {
    id: 'm-2', tenant_id: 't-1', key: 'margin', name: 'Margen',
    shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
]

function base(extra: Parameters<typeof server.use> = []) {
  // **Los overrides van PRIMERO.** `server.use` antepone los handlers y, entre
  // los de una misma llamada, gana el primero. Con `...extra` al final, un
  // override de una ruta que la base ya declara **nunca se aplica** — y la
  // prueba pasa por el motivo equivocado. Lo encontró una mutación que
  // sobrevivía: el override estaba escrito y no corría.
  server.use(
    ...extra,
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/roles`, () => ok(roles)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(layouts)),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
  )
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <Admin />
    </QueryClientProvider>,
  )
}

async function abrirFicha() {
  await screen.findByText('Under Armour México')
  await userEvent.click(screen.getByRole('button', { name: 'Ficha de cliente' }))
  await screen.findByText('CEO')
}

describe('§7.3 · el vocabulario de los dos campos', () => {
  it('«pestañas vacío» se lee como VE TODAS, no como ninguna', async () => {
    // Es la diferencia entre un rol recién creado y un rol tapiado. Pintar
    // «0 pestañas» diría lo segundo.
    base()
    montar()
    await abrirFicha()

    const ceo = screen.getByText('CEO').closest('li')
    expect(within(ceo as HTMLElement).getByText(/Ve TODAS las pestañas/)).toBeInTheDocument()
    expect(within(ceo as HTMLElement).queryByText(/0 pestañas/)).toBeNull()
  })

  it('nombra las pestañas del rol, no sus UUID', async () => {
    base()
    const { container } = montar()
    await abrirFicha()

    const planner = screen.getByText('Planner').closest('li')
    expect(within(planner as HTMLElement).getByText(/Resumen/)).toBeInTheDocument()
    expect(container.textContent ?? '').not.toContain('tab-a')
  })

  it('declara que ocultar una métrica NO es un permiso', async () => {
    // §1.4.20. Quien compone tiene que saberlo o va a usar el campo como si lo
    // fuera, y eso se descubre en una auditoría y no antes.
    base()
    montar()
    await abrirFicha()

    expect(
      screen.getByText(/Ocultar una métrica NO es un permiso/),
    ).toBeInTheDocument()
  })

  it('nombra la métrica oculta, no su id', async () => {
    base()
    const { container } = montar()
    await abrirFicha()

    const planner = screen.getByText('Planner').closest('li')
    expect(within(planner as HTMLElement).getByText(/Margen/)).toBeInTheDocument()
    expect(container.textContent ?? '').not.toContain('m-2')
  })
})

describe('borrar · el conteo va ANTES del botón', () => {
  it('un rol con usuarios no ofrece borrar, y dice por qué', async () => {
    // Un botón que se aprieta y devuelve 409 es peor que uno ausente.
    base()
    montar()
    await abrirFicha()

    const ceo = screen.getByText('CEO').closest('li')
    expect(within(ceo as HTMLElement).getByText(/2 usuario\(s\)/)).toBeInTheDocument()
    expect(within(ceo as HTMLElement).queryByRole('button', { name: 'Borrar CEO' })).toBeNull()
    expect(within(ceo as HTMLElement).getByText(/reasignalos primero/)).toBeInTheDocument()
  })

  it('un rol sin usuarios sí lo ofrece, y el 204 se trata como ÉXITO', async () => {
    // **El 204 no trae cuerpo**, así que `borrarRol` no puede pasar por el
    // cliente común: aquel exige JSON. Que la llamada salga no alcanza como
    // prueba —sale igual si la respuesta se maneja mal—; lo que distingue es la
    // consecuencia: la lista se rehace sin el rol y no aparece ningún error.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const borrados: string[] = []
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok(layouts)),
      http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
      http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
      http.get(`${API}/admin/tenants/:id/roles`, () =>
        ok(roles.filter((r) => !borrados.includes(r.id))),
      ),
      http.delete(`${API}/admin/roles/:roleId`, ({ params }) => {
        borrados.push(params['roleId'] as string)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { container } = montar()
    await abrirFicha()

    await userEvent.click(screen.getByRole('button', { name: 'Borrar Planner' }))

    await waitFor(() => expect(screen.queryByText('Planner')).toBeNull())
    expect(screen.getByText('CEO')).toBeInTheDocument()
    expect(container.textContent ?? '').not.toContain('sin cuerpo')
  })
})

describe('crear y editar', () => {
  it('crear manda POST con las tres columnas', async () => {
    const cuerpos: unknown[] = []
    base([
      http.post(`${API}/admin/tenants/:id/roles`, async ({ request }) => {
        cuerpos.push(await request.json())
        return ok({ ...roles[1], id: 'r-3', name: 'Analista' })
      }),
    ])
    montar()
    await abrirFicha()

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo rol' }))
    await userEvent.type(screen.getByLabelText('Nombre'), 'Analista')
    await userEvent.click(screen.getByLabelText('Inventario'))
    await userEvent.click(screen.getByLabelText('Ventas'))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar rol' }))

    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).toEqual({
      name: 'Analista',
      tab_ids: ['tab-b'],
      hidden_metric_ids: ['m-1'],
    })
  })

  it('editar manda PUT y precarga lo que el rol ya tiene', async () => {
    const cuerpos: unknown[] = []
    base([
      http.put(`${API}/admin/roles/:roleId`, async ({ request }) => {
        cuerpos.push(await request.json())
        return ok(roles[1])
      }),
    ])
    montar()
    await abrirFicha()

    const planner = screen.getByText('Planner').closest('li')
    await userEvent.click(within(planner as HTMLElement).getByRole('button', { name: 'Editar' }))

    // Precargado: «Resumen» marcado y «Margen» marcado.
    expect(screen.getByLabelText<HTMLInputElement>('Resumen').checked).toBe(true)
    expect(screen.getByLabelText<HTMLInputElement>('Margen').checked).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: 'Guardar rol' }))
    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).toEqual({
      name: 'Planner',
      tab_ids: ['tab-a'],
      hidden_metric_ids: ['m-2'],
    })
  })

  it('un rol sin nombre no se puede guardar, y se dice', async () => {
    base()
    montar()
    await abrirFicha()

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo rol' }))
    expect(screen.getByRole('button', { name: 'Guardar rol' })).toBeDisabled()
    expect(screen.getByText(/Un rol sin nombre no se puede guardar/)).toBeInTheDocument()
  })
})

describe('las pestañas que se ofrecen salen del layout PUBLICADO', () => {
  it('no ofrece las de un borrador', async () => {
    // `tab_ids` apunta a pestañas concretas. Marcar una de un borrador dejaría
    // el rol apuntando a un id que la consola no sirve.
    base([
      http.get(`${API}/admin/layouts/:id`, ({ params }) => {
        if (params['id'] !== 'l-1') {
          return ok({
            layout: layouts[0],
            tabs: [
              {
                tab: { ID: 'tab-z', LayoutVersionID: 'l-2', Name: 'Borrador', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
                panels: [],
              },
            ],
          })
        }
        return ok(detalle)
      }),
    ])
    montar()
    await abrirFicha()

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo rol' }))
    expect(screen.getByLabelText('Resumen')).toBeInTheDocument()
    expect(screen.queryByLabelText('Borrador')).toBeNull()
  })
})

describe('el 404 mientras el fork no esté desplegado', () => {
  it('lo nombra en vez de dejarlo como un error de la pantalla', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
      http.get(
        `${API}/admin/tenants/:id/roles`,
        () =>
          new HttpResponse(JSON.stringify({ success: false, error: 'not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )
    montar()
    await screen.findByText('Under Armour México')
    await userEvent.click(screen.getByRole('button', { name: 'Ficha de cliente' }))

    expect(
      await screen.findByText(/todavía no sirve las rutas de roles · están escritas en el fork/),
    ).toBeInTheDocument()
  })
})

describe('lo que A2 y A3 todavía no pueden mostrar', () => {
  it('declara las tres de la ficha y la lista de usuarios', async () => {
    base()
    const { container } = montar()
    await abrirFicha()

    const texto = container.textContent ?? ''
    expect(texto).toContain('Faltan 3 cosas')
    expect(texto).toContain('Subprocesadores')
    expect(texto).toContain('POST /admin/users')
  })
})
