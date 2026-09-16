// @vitest-environment jsdom

/** B1 · Contexto de edición · F4.7
 *
 *  **Los fixtures salen de `contracts/synapse-admin-wire.yaml`, no de memoria.**
 *  Ese cable mezcla dos convenciones en la misma respuesta: las dos claves de
 *  afuera de `LayoutDetail` llevan etiqueta `json:` —`layout`, `tabs`— y todo lo
 *  de adentro sale con el nombre del campo de Go: `ID`, `Status`, `RoleIDs`. Un
 *  fixture escrito en snake_case pasaría por el adaptador dando `undefined` en
 *  todo y la prueba «pasaría» contra una pantalla vacía.
 *
 *  **Desde F4.8 la lista de pestañas la pinta `TabEditor`**, y lo que era la
 *  tabla de solo lectura de acá —conteo de paneles, roles, la pestaña sin
 *  pregunta— lo cubre `editor.test.tsx`. No se duplica: dos pruebas del mismo
 *  hecho es la otra forma de deriva.
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

const tenants = [
  { id: 't-1', name: 'Under Armour México' },
  { id: 't-2', name: 'Keralty Colombia' },
]

const versiones = {
  't-1': [
    { ID: 'l-1', TenantID: 't-1', Status: 'published', VersionID: 'v3', PublishedAt: '2026-09-10T12:00:00Z' },
    { ID: 'l-2', TenantID: 't-1', Status: 'draft', VersionID: 'v4', PublishedAt: null },
  ],
  't-2': [{ ID: 'l-9', TenantID: 't-2', Status: 'draft', VersionID: 'k1', PublishedAt: null }],
}

const detalles: Record<string, unknown> = {
  'l-2': {
    layout: versiones['t-1'][1],
    tabs: [
      {
        tab: {
          ID: 'tab-b',
          LayoutVersionID: 'l-2',
          Name: 'Inventario',
          OperationalQuestion: '',
          SortOrder: 2,
          RoleIDs: ['a3f1c2d4-0000-0000-0000-00000000dead'],
        },
        panels: [],
      },
      {
        tab: {
          ID: 'tab-a',
          LayoutVersionID: 'l-2',
          Name: 'Resumen',
          OperationalQuestion: '¿Cómo vamos contra el plan?',
          SortOrder: 1,
          RoleIDs: [],
        },
        panels: [
          { ID: 'p-1', TabID: 'tab-a', MetricID: 'm-1', Type: 'kpi', ColStart: 1, ColSpan: 3, RowSpan: 4 },
          { ID: 'p-2', TabID: 'tab-a', MetricID: 'm-2', Type: 'series', ColStart: 4, ColSpan: 6, RowSpan: 4 },
        ],
      },
    ],
  },
  'l-9': { layout: versiones['t-2'][0], tabs: [] },
}

function servir() {
  server.use(
    http.get(`${API}/admin/tenants/:id/roles`, () =>
      ok([
        { id: 'r-1', tenant_id: 't-1', name: 'CEO', tab_ids: ['tab-a'], hidden_metric_ids: [], layout_overrides: {}, user_count: 1 },
        // **El que destapa la vieja aproximación**: no tiene ninguna pestaña, así
        // que la unión de `RoleIDs` no lo habría encontrado nunca.
        { id: 'r-2', tenant_id: 't-1', name: 'Sin pestañas', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 0 },
      ]),
    ),
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/layouts`, ({ params }) =>
      ok(versiones[params['id'] as keyof typeof versiones] ?? []),
    ),
    http.get(`${API}/admin/layouts/:id`, ({ params }) =>
      ok(detalles[params['id'] as string] ?? { layout: versiones['t-1'][1], tabs: [] }),
    ),
  )
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      {/* **En un router, porque el contenedor navega.** Desde el 2026-09-16
          `Admin`/`Builder` ofrecen «volver a la consola» y eso es `useNavigate`,
          que fuera de un router lanza. Montarlos sin él probaba una app que la
          real no es. */}
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('§7.2 · B1 es el punto de entrada', () => {
  it('lista los clientes y las versiones del elegido', async () => {
    servir()
    montar()

    expect(await screen.findByRole('button', { name: /v4/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /v3/ })).toBeInTheDocument()
  })

  it('un borrador dice «sin publicar», no una fecha de creación', async () => {
    // `publicadoEn` es `null` mientras sea borrador. Poner la fecha de creación
    // diría que se publicó cuando no.
    servir()
    montar()

    const borrador = await screen.findByRole('button', { name: /v4/ })
    expect(within(borrador).getByText(/sin publicar/i)).toBeInTheDocument()
    expect(borrador.textContent).toContain('borrador')

    const publicada = screen.getByRole('button', { name: /v3/ })
    expect(publicada.textContent).toContain('publicado')
    expect(publicada.textContent).toContain('2026-09-10')
  })

  it('al elegir una versión muestra sus pestañas, ordenadas por `orden`', async () => {
    // El servicio devuelve las dos al revés a propósito: §7.2 pide el orden de
    // la pestaña, y confiar en el orden del arreglo es confiar en el servidor.
    servir()
    const { container } = montar()

    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))

    await screen.findByDisplayValue('Resumen')
    const nombres = Array.from(container.querySelectorAll('li input')).map(
      (i) => (i as HTMLInputElement).value,
    )
    expect(nombres[0]).toBe('Resumen')
    expect(nombres[2]).toBe('Inventario')
  })
})

describe('§7.2 · los roles', () => {
  it('SÍ ofrece selector de rol desde B4.8, con la lista completa', async () => {
    // **F4.7 lo declaró imposible y tenía razón entonces**: el único origen era
    // `RoleIDs`, UUID sin nombre, y su unión deja afuera al rol que todavía no
    // tiene pestaña. `GET /admin/tenants/:id/roles` devuelve todos, con nombre.
    servir()
    montar()
    await screen.findByRole('button', { name: /v4/ })

    const selector = await screen.findByLabelText('Rol')
    expect(within(selector).getByText('CEO')).toBeInTheDocument()
    // El que no tiene ninguna pestaña asignada también está.
    expect(within(selector).getByText('Sin pestañas')).toBeInTheDocument()
  })

  it('sin roles definidos manda a la ficha de cliente', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/roles`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok(versiones['t-1'])),
    )
    montar()
    await screen.findByRole('button', { name: /v4/ })
    expect(screen.getByText(/Sin roles definidos/)).toBeInTheDocument()
  })
})

describe('§7.2 · la herencia de plantilla, que no existe en el cable', () => {
  it('declara las tres cosas que faltan en vez de inventar la distinción', async () => {
    servir()
    const { container } = montar()
    await screen.findByRole('button', { name: /v4/ })

    const texto = container.textContent ?? ''
    expect(texto).toContain('Faltan 3 cosas')
    // El `.pen` pide «la proporción real entre paneles heredados de la plantilla
    // y propios del tenant» · «UA MX hereda 11 de 12 paneles en su overview».
    expect(texto).toContain('HEREDADOS')
    expect(texto).toContain('OVERRIDE')
    expect(texto).toContain('vertical')
  })
})

describe('cambiar de cliente', () => {
  it('OLVIDA la versión elegida', async () => {
    // **`/admin/layouts/{id}` no cuelga del tenant**, así que un `layoutId` del
    // cliente anterior sigue resolviendo: sin limpiarlo, la pantalla mostraría
    // las pestañas de un cliente bajo el nombre de otro. No lo ve el typecheck.
    servir()
    montar()

    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await screen.findByDisplayValue('Resumen')

    await userEvent.selectOptions(screen.getByLabelText('Cliente'), 't-2')

    await waitFor(() => expect(screen.queryByDisplayValue('Resumen')).toBeNull())
    expect(await screen.findByRole('button', { name: /k1/ })).toBeInTheDocument()
  })
})

describe('sin versiones', () => {
  it('invita a crear un borrador en vez de mostrarse vacía', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
    )
    montar()
    expect(await screen.findByText(/Ninguna todavía/i)).toBeInTheDocument()
    expect(screen.getByText(/F4.13/)).toBeInTheDocument()
  })
})
