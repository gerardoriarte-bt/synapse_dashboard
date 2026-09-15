// @vitest-environment jsdom

/** B1 · Contexto de edición · F4.7
 *
 *  **Los fixtures salen de `contracts/synapse-admin-wire.yaml`, no de memoria.**
 *  Ese cable mezcla dos convenciones en la misma respuesta: las dos claves de
 *  afuera de `LayoutDetail` llevan etiqueta `json:` —`layout`, `tabs`— y todo lo
 *  de adentro sale con el nombre del campo de Go: `ID`, `Status`, `RoleIDs`. Un
 *  fixture escrito en snake_case pasaría por el adaptador dando `undefined` en
 *  todo y la prueba «pasaría» contra una pantalla vacía.
 */
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
      <Builder />
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

    await screen.findByText('Resumen')
    const filas = Array.from(container.querySelectorAll('tbody tr')).map(
      (f) => f.textContent ?? '',
    )
    expect(filas[0]).toContain('Resumen')
    expect(filas[1]).toContain('Inventario')
  })

  it('cuenta los paneles de cada pestaña', async () => {
    servir()
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))

    const fila = (await screen.findByText('Resumen')).closest('tr')
    expect(within(fila as HTMLElement).getByText('2')).toBeInTheDocument()
  })
})

describe('§7.2 · la pestaña sin pregunta se declara', () => {
  it('no se disimula con una celda vacía', async () => {
    // «Una pestaña que no contesta una pregunta no se compone» · F4.8. El cable
    // deja `OperationalQuestion` en cadena vacía y el producto no. Una celda en
    // blanco se leería como un dato que falta, no como una regla violada.
    servir()
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))

    const fila = (await screen.findByText('Inventario')).closest('tr')
    expect(within(fila as HTMLElement).getByText(/no se debería poder componer/i)).toBeInTheDocument()
  })
})

describe('§7.2 · los roles', () => {
  it('«vacío» significa todos los roles, y se dice · no «ninguno»', async () => {
    servir()
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))

    const fila = (await screen.findByText('Resumen')).closest('tr')
    expect(within(fila as HTMLElement).getByText(/todos los roles/i)).toBeInTheDocument()
  })

  it('NO pinta los UUID de rol · son plomería, no un nombre', async () => {
    // `RoleIDs` es un arreglo de UUID y ninguna ruta los resuelve a un nombre.
    // Pintarlos es lo mismo que §7.3 prohíbe del lado de administración.
    servir()
    const { container } = montar()
    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await screen.findByText('Inventario')

    expect(container.textContent ?? '').not.toContain('a3f1c2d4')
    expect(container.textContent ?? '').toContain('1 rol(es)')
  })

  it('NO ofrece selector de rol, y dice por qué', async () => {
    // Se podría armar con la unión de los `RoleIDs` y sería la lista
    // equivocada: le faltaría todo rol que todavía no tiene pestaña, que es
    // justo el rol para el que uno abre el builder.
    servir()
    const { container } = montar()
    await screen.findByRole('button', { name: /v4/ })

    expect(screen.queryByLabelText(/^Rol$/i)).toBeNull()
    expect(container.textContent ?? '').toContain('B4.8')
  })
})

describe('§7.2 · la herencia de plantilla, que no existe en el cable', () => {
  it('declara las tres cosas que faltan en vez de inventar la distinción', async () => {
    servir()
    const { container } = montar()
    await screen.findByRole('button', { name: /v4/ })

    const texto = container.textContent ?? ''
    expect(texto).toContain('Faltan 3 cosas')
    expect(texto).toContain('HEREDAN')
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
    await screen.findByText('Resumen')

    await userEvent.selectOptions(screen.getByLabelText('Cliente'), 't-2')

    await waitFor(() => expect(screen.queryByText('Resumen')).toBeNull())
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
