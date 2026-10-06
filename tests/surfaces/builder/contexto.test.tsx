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
    { id: 'l-1', tenant_id: 't-1', status: 'published', version_id: 'v3', published_at: '2026-09-10T12:00:00Z' },
    { id: 'l-2', tenant_id: 't-1', status: 'draft', version_id: 'v4', published_at: null },
  ],
  't-2': [{ id: 'l-9', tenant_id: 't-2', status: 'draft', version_id: 'k1', published_at: null }],
}

const detalles: Record<string, unknown> = {
  'l-2': {
    layout: versiones['t-1'][1],
    tabs: [
      {
        tab: {
          id: 'tab-b',
          layout_version_id: 'l-2',
          name: 'Inventario',
          operational_question: '',
          sort_order: 2,
          role_ids: ['a3f1c2d4-0000-0000-0000-00000000dead'],
        },
        panels: [],
      },
      {
        tab: {
          id: 'tab-a',
          layout_version_id: 'l-2',
          name: 'Resumen',
          operational_question: '¿Cómo vamos contra el plan?',
          sort_order: 1,
          role_ids: [],
        },
        panels: [
          { id: 'p-1', tab_id: 'tab-a', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4 },
          { id: 'p-2', tab_id: 'tab-a', metric_id: 'm-2', type: 'series', col_start: 4, col_span: 6, row_span: 4 },
        ],
      },
    ],
  },
  'l-9': { layout: versiones['t-2'][0], tabs: [] },
}

function servir() {
  server.use(
    http.get(`${API}/admin/tenants/:id/roles/composition`, () =>
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
    // **El estado va primero, y es la palabra** · desde el 2026-10-06 la opción
    // dice «Borrador v4», con mayúscula: es una frase, no un rótulo.
    expect(borrador.textContent).toContain('Borrador v4')

    const publicada = screen.getByRole('button', { name: /v3/ })
    expect(publicada.textContent).toContain('Publicada v3')
    // La fecha pasa por `format.calendar` con el locale del tenant —`es-MX` en
    // el mock de `/config/me`—, no el ISO crudo que se pintaba antes.
    expect(publicada.textContent).toContain('10 sep 2026')
    expect(publicada.textContent).not.toContain('2026-09-10')
    expect(within(publicada).queryByText(/sin publicar/i)).toBeNull()
  })

  it('la versión se elige SOLA · el primer borrador, antes que la publicada', async () => {
    // **Nuevo el 2026-10-06** · auditoría §2.1: B1 abría sin versión elegida y
    // no mostraba ninguna pestaña hasta que alguien apretaba una. El servicio
    // devuelve la publicada PRIMERO a propósito: tomar `[0]` elegiría la que no
    // se edita.
    servir()
    montar()

    expect(await screen.findByDisplayValue('Resumen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /v4/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /v3/ })).toHaveAttribute('aria-pressed', 'false')
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

    // **Desde el 2026-10-06 son opciones, no un `select`** · D5 de la auditoría:
    // el rol es un filtro, y «Todos los roles» es la opción que lo apaga.
    const selector = await screen.findByRole('group', { name: 'Rol' })
    expect(within(selector).getByRole('button', { name: 'Todos los roles' })).toBeInTheDocument()
    expect(within(selector).getByRole('button', { name: 'CEO' })).toBeInTheDocument()
    // El que no tiene ninguna pestaña asignada también está.
    expect(within(selector).getByRole('button', { name: 'Sin pestañas' })).toBeInTheDocument()
  })

  it('el rol FILTRA las pestañas · y «Todos los roles» las vuelve a mostrar', async () => {
    // **D5 de la auditoría del 2026-10-06**: «debería funcionar como un filtro».
    // Hasta ese día el selector se movía sin cambiar nada en la pantalla.
    // `Resumen` no declara roles —la ven todos— e `Inventario` sólo la ve un rol
    // que no es CEO, así que elegir CEO tiene que esconder exactamente una.
    servir()
    montar()
    await screen.findByDisplayValue('Inventario')

    const selector = screen.getByRole('group', { name: 'Rol' })
    await userEvent.click(within(selector).getByRole('button', { name: 'CEO' }))

    await waitFor(() => expect(screen.queryByDisplayValue('Inventario')).toBeNull())
    expect(screen.getByDisplayValue('Resumen')).toBeInTheDocument()
    expect(within(selector).getByRole('button', { name: 'CEO' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 más no las ve este rol.')).toBeInTheDocument()

    await userEvent.click(within(selector).getByRole('button', { name: 'Todos los roles' }))
    expect(await screen.findByDisplayValue('Inventario')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Resumen')).toBeInTheDocument()
    expect(screen.queryByText(/no las ve este rol/)).toBeNull()
  })

  it('sin roles definidos manda a la ficha de cliente', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok(versiones['t-1'])),
    )
    montar()
    await screen.findByRole('button', { name: /v4/ })
    expect(
      screen.getByText('Este cliente todavía no tiene roles. Se definen en su ficha, en administración.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Rol' })).toBeNull()
  })
})

describe('§7.2 · la herencia de plantilla, que no existe en el cable', () => {
  it('ya NO la anuncia en pantalla · era una nota del plan, no del producto', async () => {
    // **Cambió el 2026-10-06** · `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`.
    // Esta prueba exigía el bloque «Esta pantalla va a crecer», que le contaba a
    // quien compone lo que el contrato todavía no declara —herencia, plantilla,
    // override—. Sigue sin declararse y sigue escrito en el encabezado de
    // `ContextView.tsx`; lo que se quitó es decírselo al usuario. Tampoco se
    // inventa la distinción: ninguna pestaña se rotula heredada ni propia.
    servir()
    const { container } = montar()
    await screen.findByDisplayValue('Resumen')

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('Esta pantalla va a crecer')
    expect(texto).not.toMatch(/plantilla/i)
    expect(texto).not.toMatch(/heredad|override/i)
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

    // `getByRole` y no `getByLabelText`: la sección y el `select` se rotulan
    // con el mismo «Cliente».
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Cliente' }), 't-2')

    await waitFor(() => expect(screen.queryByDisplayValue('Resumen')).toBeNull())
    expect(await screen.findByRole('button', { name: /k1/ })).toBeInTheDocument()
  })
})

describe('sin versiones', () => {
  it('ofrece crear el primer borrador, y lo crea como v1 y lo deja elegido', async () => {
    // **Cambió dos veces el 2026-10-06.** Primero el copy viejo —«se crea un
    // borrador para empezar a componer»— prometía una acción que la pantalla no
    // ofrecía, y se sacó la promesa. Después la decisión humana fue la otra
    // salida: ofrecer la acción, «y asigna una versión». Se afirma que DISPARA
    // el POST con `version_id: 'v1'`, no que el botón exista.
    let creadas: unknown[] = []
    const cuerpos: unknown[] = []
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok(creadas)),
      http.post(`${API}/admin/tenants/:id/layouts`, async ({ request }) => {
        cuerpos.push(await request.json())
        const nuevo = {
          id: 'l-nuevo',
          tenant_id: 't-1',
          dashboard_id: 'd-1',
          status: 'draft',
          version_id: 'v1',
          published_at: null,
        }
        creadas = [nuevo]
        return ok(nuevo)
      }),
      http.get(`${API}/admin/layouts/l-nuevo`, () =>
        ok({ layout: creadas[0], tabs: [] }),
      ),
    )
    montar()
    expect(
      await screen.findByText(
        'Este cliente todavía no tiene versiones. Creá el primer borrador para empezar a componer.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Componer / })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Crear el primer borrador' }))

    await waitFor(() => expect(cuerpos).toEqual([{ version_id: 'v1' }]))
    // Que quede elegida lo garantizan DOS cosas —el `setVersion` del alta y la
    // autoselección del borrador—, así que quitar una sola no rompe esta
    // aserción. Medido: la mutación que borra el `setVersion` sobrevive. Lo que
    // la prueba fija es el resultado, no cuál de las dos lo produce.
    const elegida = await screen.findByRole('button', { name: /Borrador v1/ })
    expect(elegida).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Crear el primer borrador' })).toBeNull()
  })
})
