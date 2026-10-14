// @vitest-environment jsdom

/** B1 · Dashboards · F4.7, reorganizada el 2026-10-07
 *
 *  **Los fixtures salen de `contracts/synapse-admin-wire.yaml`, no de memoria.**
 *  Ese cable mezcla dos convenciones en la misma respuesta: las dos claves de
 *  afuera de `LayoutDetail` llevan etiqueta `json:` —`layout`, `tabs`— y todo lo
 *  de adentro sale con el nombre del campo de Go. Un fixture escrito en otra
 *  forma pasaría por el adaptador dando `undefined` en todo y la prueba
 *  «pasaría» contra una pantalla vacía.
 *
 *  **Desde el 2026-10-07 B1 elige DASHBOARDS, no versiones** ·
 *  `docs/AUDITORIA-2026-10-07-flujo-de-edicion.md`, D1 y D3: paso 1 el
 *  dashboard, paso 2 el rol —recién con un dashboard elegido—, paso 3 abrir el
 *  editor, que dice antes de apretar qué va a pasar. Las pruebas que elegían
 *  una versión en B1 y miraban sus pestañas acá se reescribieron contra eso:
 *  las pestañas viven en el editor, y las cubre `editor.test.tsx`.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { fail, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [
  { id: 't-1', name: 'Under Armour México' },
  { id: 't-2', name: 'Keralty Colombia' },
]

/** `LayoutDashboard` del cable · los seis `required`. Tres dashboards, uno por
 *  cada caso de «qué va a pasar al abrir»: con borrador, sólo publicado, y sin
 *  componer. */
const dashboards = {
  't-1': [
    { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
    { id: 'd-2', tenant_id: 't-1', name: 'Marca', slug: 'marca', is_default: false, history_months: 12 },
    { id: 'd-3', tenant_id: 't-1', name: 'Medios', slug: 'medios', is_default: false, history_months: 12 },
  ],
  't-2': [{ id: 'd-9', tenant_id: 't-2', name: 'Salud', slug: 'salud', is_default: true, history_months: 12 }],
}

/** **La publicada primero, a propósito**: el servicio las devuelve así, y
 *  tomar `[0]` elegiría la que no se edita. */
const versiones = {
  't-1': [
    { id: 'l-1', tenant_id: 't-1', dashboard_id: 'd-1', status: 'published', version_id: 'v3', published_at: '2026-09-10T12:00:00Z' },
    { id: 'l-2', tenant_id: 't-1', dashboard_id: 'd-1', status: 'draft', version_id: 'v4', published_at: null },
    { id: 'l-5', tenant_id: 't-1', dashboard_id: 'd-2', status: 'published', version_id: 'v2', published_at: '2026-09-10T12:00:00Z' },
  ],
  't-2': [{ id: 'l-9', tenant_id: 't-2', dashboard_id: 'd-9', status: 'draft', version_id: 'k1', published_at: null }],
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
        panels: [],
      },
    ],
  },
  'l-5': {
    layout: versiones['t-1'][2],
    tabs: [
      {
        tab: {
          id: 'tab-m',
          layout_version_id: 'l-5',
          name: 'Portada',
          operational_question: '¿Crece la marca?',
          sort_order: 1,
          role_ids: [],
        },
        panels: [],
      },
    ],
  },
  'l-9': { layout: versiones['t-2'][0], tabs: [] },
}

const roles = [
  { id: 'r-1', tenant_id: 't-1', name: 'CEO', tab_ids: ['tab-a'], hidden_metric_ids: [], layout_overrides: {}, user_count: 1 },
  // **El que destapa la vieja aproximación**: no tiene ninguna pestaña, así
  // que la unión de `RoleIDs` no lo habría encontrado nunca.
  { id: 'r-2', tenant_id: 't-1', name: 'Sin pestañas', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 0 },
]

function servir() {
  server.use(
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(roles)),
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/dashboards`, ({ params }) =>
      ok(dashboards[params['id'] as keyof typeof dashboards] ?? []),
    ),
    http.get(`${API}/admin/tenants/:id/layouts`, ({ params }) =>
      ok(versiones[params['id'] as keyof typeof versiones] ?? []),
    ),
    http.get(`${API}/admin/layouts/:id`, ({ params }) => ok(detalles[params['id'] as string])),
    // Las tres que el contenedor pide siempre —el editor y B6 calientan su
    // cache— y que estas pruebas no miran.
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/users`, () => ok([])),
    http.get(`${API}/admin/dashboards/:id/publications`, () => ok([])),
  )
}

/** **Los de cada prueba ganan**: MSW prueba el último `server.use` primero,
 *  así que los de acá van antes de que la prueba registre los suyos. */
beforeEach(servir)

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      {/* **En un router, porque el contenedor navega.** Desde el 2026-09-16
          `Admin`/`Builder` ofrecen «volver a la consola» y eso es `useNavigate`,
          que fuera de un router lanza. */}
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** La tarjeta de un dashboard en el paso 1. */
const tarjeta = (nombre: RegExp) => screen.findByRole('button', { name: nombre })

describe('§7.2 · B1 es el punto de entrada · paso 1, el dashboard', () => {
  it('lista los dashboards del cliente, cada uno con su estado en palabras', async () => {
    montar()

    const overview = await tarjeta(/Overview/)
    // El borrador va primero porque es lo que se viene a editar; la publicada
    // se nombra al lado.
    expect(overview.textContent).toContain('Borrador v4 en curso · publicada v3')
    expect(within(overview).getByText('Por defecto')).toBeInTheDocument()

    const marca = screen.getByRole('button', { name: /Marca/ })
    // La fecha pasa por `format.calendar` con el locale del tenant —`es-MX` en
    // el mock de `/config/me`—, no el ISO crudo.
    expect(marca.textContent).toContain('Publicado v2 · 10 sep 2026')
    expect(marca.textContent).not.toContain('2026-09-10')
    expect(within(marca).queryByText('Por defecto')).toBeNull()

    // El literal de C6 para un dashboard sin layout.
    expect(screen.getByRole('button', { name: /Medios/ }).textContent).toContain('Todavía no se compuso')
  })

  it('elegir un dashboard lo marca · el callback dispara', async () => {
    montar()

    const marca = await tarjeta(/Marca/)
    expect(marca).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(marca)
    expect(marca).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Overview/ })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('progresivo · D3: el rol y el editor aparecen recién con un dashboard elegido', () => {
  it('sin dashboard elegido no hay paso 2 ni paso 3', async () => {
    montar()
    await tarjeta(/Overview/)

    expect(screen.getByRole('region', { name: 'Paso 1 · Dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Paso 2 · Rol' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Paso 3 · Editor' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Rol' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Abrir el editor/ })).toBeNull()
  })

  it('al elegir uno aparecen los dos', async () => {
    montar()
    await userEvent.click(await tarjeta(/Overview/))

    expect(await screen.findByRole('region', { name: 'Paso 2 · Rol' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Paso 3 · Editor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir el editor de Overview' })).toBeInTheDocument()
  })
})

describe('§7.2 · los roles · paso 2', () => {
  it('ofrece la lista completa, con «Todos los roles» elegido de entrada', async () => {
    // `GET /admin/tenants/:id/roles/composition` devuelve todos, con nombre,
    // incluido el que todavía no tiene pestaña.
    montar()
    await userEvent.click(await tarjeta(/Overview/))

    const selector = await screen.findByRole('group', { name: 'Rol' })
    expect(within(selector).getByRole('button', { name: 'Todos los roles' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(selector).getByRole('button', { name: 'CEO' })).toBeInTheDocument()
    expect(within(selector).getByRole('button', { name: 'Sin pestañas' })).toBeInTheDocument()
    expect(screen.getByText('Vas a ver y editar todas las pestañas del dashboard.')).toBeInTheDocument()
  })

  it('elegir un rol dice qué va a pasar con él · el callback dispara', async () => {
    montar()
    await userEvent.click(await tarjeta(/Overview/))

    const selector = await screen.findByRole('group', { name: 'Rol' })
    await userEvent.click(within(selector).getByRole('button', { name: 'CEO' }))

    expect(within(selector).getByRole('button', { name: 'CEO' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(selector).getByRole('button', { name: 'Todos los roles' })).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.getByText('Vas a ver y editar sólo las pestañas que ve CEO. Las que agregues, las va a ver CEO.'),
    ).toBeInTheDocument()
  })

  it('el rol FILTRA las pestañas del editor · y «Todos los roles» las vuelve a mostrar', async () => {
    // **D5 de la auditoría del 2026-10-06**: «debería funcionar como un filtro».
    // `Resumen` no declara roles —la ven todos— e `Inventario` sólo la ve un rol
    // que no es CEO, así que con CEO el editor tiene que esconder exactamente una.
    montar()
    await userEvent.click(await tarjeta(/Overview/))
    await userEvent.click(within(await screen.findByRole('group', { name: 'Rol' })).getByRole('button', { name: 'CEO' }))
    await userEvent.click(screen.getByRole('button', { name: 'Abrir el editor de Overview' }))

    const pestanas = await screen.findByRole('tablist', { name: 'Pestañas del dashboard' })
    expect(within(pestanas).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Resumen'])

    await userEvent.click(screen.getByRole('button', { name: 'Dashboards' }))
    await userEvent.click(within(await screen.findByRole('group', { name: 'Rol' })).getByRole('button', { name: 'Todos los roles' }))
    await userEvent.click(screen.getByRole('button', { name: 'Abrir el editor de Overview' }))

    const todas = await screen.findByRole('tablist', { name: 'Pestañas del dashboard' })
    expect(within(todas).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Resumen', 'Inventario'])
  })

  it('sin roles definidos manda a la ficha de cliente', async () => {
    server.use(http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])))
    montar()
    await userEvent.click(await tarjeta(/Overview/))
    expect(
      await screen.findByText('Este cliente todavía no tiene roles. Se definen en su ficha, en administración.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Rol' })).toBeNull()
  })
})

describe('paso 3 · abrir el editor dice qué va a pasar, y lo hace', () => {
  it('con borrador · lo abre, sin crear nada', async () => {
    // El borrador se elige solo aunque la publicada venga primero.
    const creados: unknown[] = []
    server.use(
      http.post(`${API}/admin/tenants/:id/layouts`, async ({ request }) => {
        creados.push(await request.json())
        return fail('no debería crearse', { status: 500 })
      }),
    )
    montar()
    await userEvent.click(await tarjeta(/Overview/))

    expect(
      screen.getByText('Vas a editar el borrador v4. Los cambios se guardan solos.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir el editor de Overview' }))

    const pestanas = await screen.findByRole('tablist', { name: 'Pestañas del dashboard' })
    // Ordenadas por `sort_order`, no por el orden del arreglo, que viene al revés.
    expect(within(pestanas).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Resumen', 'Inventario'])
    expect(creados).toEqual([])
  })

  it('sólo publicado · crea un borrador A PARTIR de lo publicado, en SU dashboard', async () => {
    // **Con `dashboard_id`** · sin él el servicio usa el por defecto, y el
    // borrador de «Marca» habría caído en «Overview». Y con la versión
    // SIGUIENTE —v5—, no repitiendo la de origen.
    const cuerpos: unknown[] = []
    const copias: string[] = []
    const nuevo = { id: 'l-nuevo', tenant_id: 't-1', dashboard_id: 'd-2', status: 'draft', version_id: 'v5', published_at: null }
    let lista = versiones['t-1']
    server.use(
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok(lista)),
      http.post(`${API}/admin/tenants/:id/layouts`, async ({ request }) => {
        cuerpos.push(await request.json())
        lista = [...versiones['t-1'], nuevo]
        return ok(nuevo)
      }),
      http.put(`${API}/admin/layouts/l-nuevo`, async ({ request }) => {
        copias.push(JSON.stringify(await request.json()))
        return ok({ layout: nuevo, tabs: [] })
      }),
      http.get(`${API}/admin/layouts/l-nuevo`, () =>
        ok({
          layout: nuevo,
          tabs: [
            {
              tab: { id: 'tab-n', layout_version_id: 'l-nuevo', name: 'Portada', operational_question: '¿Crece la marca?', sort_order: 1, role_ids: [] },
              panels: [],
            },
          ],
        }),
      ),
    )
    montar()
    await userEvent.click(await tarjeta(/Marca/))

    expect(
      screen.getByText(
        'Se va a crear un borrador a partir de la versión publicada v2. Lo publicado no cambia hasta que publiques.',
      ),
    ).toBeInTheDocument()
    const abrir = screen.getByRole('button', { name: 'Abrir el editor de Marca' })
    // Hasta que llegan las pestañas de la publicada no hay qué copiar.
    await waitFor(() => expect(abrir).toBeEnabled())
    await userEvent.click(abrir)

    await waitFor(() => expect(cuerpos).toEqual([{ version_id: 'v5', dashboard_id: 'd-2' }]))
    // La copia lleva las pestañas de la publicada, SIN sus ids: son de otro layout.
    await waitFor(() => expect(copias).toHaveLength(1))
    expect(copias[0]).toContain('Portada')
    expect(copias[0]).not.toContain('tab-m')

    expect(
      await screen.findByText(
        'Se creó el borrador v5 a partir de la versión publicada v2. Lo publicado no cambia hasta que publiques.',
      ),
    ).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'Portada' })).toBeInTheDocument()
  })

  it('sin componer · crea su primer borrador, vacío, en SU dashboard', async () => {
    const cuerpos: unknown[] = []
    const puts: unknown[] = []
    const nuevo = { id: 'l-nuevo', tenant_id: 't-1', dashboard_id: 'd-3', status: 'draft', version_id: 'v5', published_at: null }
    let lista = versiones['t-1']
    server.use(
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok(lista)),
      http.post(`${API}/admin/tenants/:id/layouts`, async ({ request }) => {
        cuerpos.push(await request.json())
        lista = [...versiones['t-1'], nuevo]
        return ok(nuevo)
      }),
      http.put(`${API}/admin/layouts/:id`, async ({ request }) => {
        puts.push(await request.json())
        return ok({ layout: nuevo, tabs: [] })
      }),
      http.get(`${API}/admin/layouts/l-nuevo`, () => ok({ layout: nuevo, tabs: [] })),
    )
    montar()
    await userEvent.click(await tarjeta(/Medios/))

    expect(screen.getByText('Todavía no se compuso. Se va a crear su primer borrador, vacío.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir el editor de Medios' }))

    await waitFor(() => expect(cuerpos).toEqual([{ version_id: 'v5', dashboard_id: 'd-3' }]))
    expect(
      await screen.findByText('Se creó el borrador v5, vacío. Empezá agregando una pestaña.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Este dashboard todavía no tiene pestañas. Agregá la primera con «+ Pestaña».'),
    ).toBeInTheDocument()
    // Vacío de verdad: nada que copiar, así que no hay `PUT`.
    expect(puts).toEqual([])
  })
})

describe('«Nuevo dashboard» · D4', () => {
  it('lo crea SIN volverlo el por defecto, y lo deja elegido', async () => {
    // **`is_default` explícito en `false`**: omitido, el servicio lo pondría en
    // `true` si fuera el primero, y en `true` desplaza al anterior — un
    // dashboard nuevo cambiaría lo que ven los usuarios al entrar.
    const cuerpos: unknown[] = []
    const creado = { id: 'd-4', tenant_id: 't-1', name: 'Tiendas', slug: 'tiendas', is_default: false, history_months: 12 }
    let lista = dashboards['t-1']
    server.use(
      http.get(`${API}/admin/tenants/:id/dashboards`, () => ok(lista)),
      http.post(`${API}/admin/tenants/:id/dashboards`, async ({ request }) => {
        cuerpos.push(await request.json())
        lista = [...dashboards['t-1'], creado]
        return ok(creado)
      }),
    )
    montar()
    await tarjeta(/Overview/)

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo dashboard' }))
    const crear = screen.getByRole('button', { name: 'Crear dashboard' })
    // Sin nombre no hay nada que mandar.
    expect(crear).toBeDisabled()
    // **El campo abre con el foco** · visto en pantalla el 2026-10-07: sin él,
    // lo que se tipeaba después de apretar no iba a ningún lado.
    const campo = screen.getByRole('textbox', { name: 'Nombre del dashboard nuevo' })
    expect(campo).toHaveFocus()
    await userEvent.type(campo, '  Tiendas ')
    await userEvent.click(crear)

    await waitFor(() => expect(cuerpos).toEqual([{ name: 'Tiendas', is_default: false }]))
    const tiendas = await tarjeta(/^Tiendas/)
    await waitFor(() => expect(tiendas).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByRole('button', { name: 'Abrir el editor de Tiendas' })).toBeInTheDocument()
  })

  it('el PRIMERO del cliente sí nace por defecto', async () => {
    const cuerpos: unknown[] = []
    server.use(
      http.get(`${API}/admin/tenants/:id/dashboards`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
      http.post(`${API}/admin/tenants/:id/dashboards`, async ({ request }) => {
        cuerpos.push(await request.json())
        return ok({ id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 })
      }),
    )
    montar()

    expect(await screen.findByText('Este cliente todavía no tiene dashboards. Creá el primero.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo dashboard' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre del dashboard nuevo' }), 'Overview')
    await userEvent.click(screen.getByRole('button', { name: 'Crear dashboard' }))

    await waitFor(() => expect(cuerpos).toEqual([{ name: 'Overview', is_default: true }]))
  })

  it('«Cancelar» cierra el campo sin mandar nada', async () => {
    const cuerpos: unknown[] = []
    server.use(
      http.post(`${API}/admin/tenants/:id/dashboards`, async ({ request }) => {
        cuerpos.push(await request.json())
        return fail('no', { status: 500 })
      }),
    )
    montar()
    await tarjeta(/Overview/)

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo dashboard' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre del dashboard nuevo' }), 'Tiendas')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('textbox', { name: 'Nombre del dashboard nuevo' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Nuevo dashboard' })).toBeInTheDocument()
    expect(cuerpos).toEqual([])
  })

  it('el error del servidor se dice con SU mensaje', async () => {
    server.use(
      http.post(`${API}/admin/tenants/:id/dashboards`, () => fail('Ya existe un dashboard con ese nombre', { status: 409 })),
    )
    montar()
    await tarjeta(/Overview/)

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo dashboard' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre del dashboard nuevo' }), 'Overview')
    await userEvent.click(screen.getByRole('button', { name: 'Crear dashboard' }))

    expect(await screen.findByText('Ya existe un dashboard con ese nombre')).toBeInTheDocument()
  })
})

describe('sin la ruta de dashboards', () => {
  it('los arma desde las versiones, en vez de mostrar un builder vacío', async () => {
    // Un servicio viejo sin `GET …/dashboards`: cada versión dice de qué
    // dashboard es, y el nombre sale de `/config/me` cuando es el propio —el
    // mock declara `d-1` como «Overview»—.
    server.use(http.get(`${API}/admin/tenants/:id/dashboards`, () => fail('no existe', { status: 404 })))
    montar()

    const overview = await tarjeta(/Overview/)
    expect(overview.textContent).toContain('Borrador v4 en curso · publicada v3')
    // `d-2` no está en `/config/me`: se numera en vez de inventarle nombre.
    expect(screen.getByRole('button', { name: /Dashboard 2/ }).textContent).toContain('Publicado v2')
  })
})

describe('§7.2 · la herencia de plantilla, que no existe en el cable', () => {
  it('ya NO la anuncia en pantalla · era una nota del plan, no del producto', async () => {
    // **Cambió el 2026-10-06** · `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`.
    // Sigue sin declararse en el contrato; lo que se quitó es decírselo al
    // usuario. Tampoco se inventa la distinción.
    const { container } = montar()
    await userEvent.click(await tarjeta(/Overview/))
    await screen.findByRole('group', { name: 'Rol' })

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('Esta pantalla va a crecer')
    expect(texto).not.toMatch(/plantilla/i)
    expect(texto).not.toMatch(/heredad|override/i)
  })
})

describe('cambiar de cliente', () => {
  it('OLVIDA el dashboard elegido y muestra los del nuevo', async () => {
    // **`/admin/layouts/{id}` no cuelga del tenant**, así que un id del cliente
    // anterior seguiría resolviendo: sin limpiarlo, se editaría un dashboard de
    // un cliente bajo el nombre de otro.
    montar()
    await userEvent.click(await tarjeta(/Marca/))
    await screen.findByRole('region', { name: 'Paso 2 · Rol' })

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Cliente' }), 't-2')

    expect(await tarjeta(/Salud/)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button', { name: /Marca/ })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Paso 2 · Rol' })).toBeNull()
  })
})
