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
import { MemoryRouter } from 'react-router-dom'
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
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(roles)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(layouts)),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    // El agente del cliente · F4.4. Sin esto la ficha pinta la rama de error
    // del bloque de agente, que es correcta pero no es lo que estas pruebas
    // miran. Lo descubrió una aserción que dio cero.
    http.get(`${API}/admin/tenants/:id/agents`, () => ok([])),
  )
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      {/* **En un router, porque el contenedor navega.** Desde el 2026-09-16
          `Admin`/`Builder` ofrecen «volver a la consola» y eso es `useNavigate`,
          que fuera de un router lanza. Montarlos sin él probaba una app que la
          real no es. */}
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
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

    // Acotado a la lista: desde el 2026-09-25 el navbar pinta la identidad
    // —§PEN:A1— y el nombre del rol activo puede aparecer también ahí.
    const planner = screen.getAllByText('Planner').map((e) => e.closest('li')).find(Boolean)
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

    // Acotado a la lista: desde el 2026-09-25 el navbar pinta la identidad
    // —§PEN:A1— y el nombre del rol activo puede aparecer también ahí.
    const planner = screen.getAllByText('Planner').map((e) => e.closest('li')).find(Boolean)
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
      http.get(`${API}/admin/tenants/:id/roles/composition`, () =>
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

    // Lo que desaparece es la FILA, no toda mención: la identidad del navbar
    // sigue nombrando el rol de quien está mirando.
    await waitFor(() =>
      expect(screen.queryAllByText('Planner').some((e) => e.closest('li') !== null)).toBe(false),
    )
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

    // Acotado a la lista: desde el 2026-09-25 el navbar pinta la identidad
    // —§PEN:A1— y el nombre del rol activo puede aparecer también ahí.
    const planner = screen.getAllByText('Planner').map((e) => e.closest('li')).find(Boolean)
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
        `${API}/admin/tenants/:id/roles/composition`,
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
  it('declara las dos de la ficha y la lista de usuarios', async () => {
    // **Eran tres hasta el 2026-09-21.** El estado del acceso salió de esta
    // lista y no porque llegara: lo declara `AgentConfig`, al lado de los
    // agentes y diciendo con precisión qué significa «Activo». Tenerlo en los
    // dos lados era la misma carencia contada dos veces en la misma pantalla.
    base()
    const { container } = montar()
    await abrirFicha()

    const texto = container.textContent ?? ''
    // **Sin el número.** La pantalla lo saca de `FALTANTES.length`, así que no
    // se puede vencer; escribirlo acá sí — y se venció el 2026-09-22, cuando
    // §9 sumó dos carencias más. Lo que la prueba fija es que cada carencia
    // esté nombrada, que es lo que vale.
    expect(texto).toMatch(/Faltan \d+ cosas/)
    expect(texto).toContain('Subprocesadores')
    expect(texto).toContain('POST /admin/users')
  })

  it('el estado del acceso se declara UNA vez, y en el bloque del agente', async () => {
    // La prueba de que no se duplicó: la ficha lo dice una sola vez.
    base()
    const { container } = montar()
    await abrirFicha()

    const texto = container.textContent ?? ''
    const veces = texto.split('estado del acceso').length - 1
    expect(veces).toBe(1)
    expect(texto).toContain('Pendiente · el estado del acceso')
  })
})

describe('A4 · la columna USO · divergencia 6', () => {
  const conPanel = {
    layout: layouts[1],
    tabs: [
      {
        tab: { ID: 'tab-a', LayoutVersionID: 'l-1', Name: 'Resumen', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
        panels: [
          { ID: 'p-1', TabID: 'tab-a', MetricID: 'm-1', Type: 'kpi', ColStart: 1, ColSpan: 3, RowSpan: 4 },
          { ID: 'p-2', TabID: 'tab-a', MetricID: 'm-1', Type: 'kpi', ColStart: 4, ColSpan: 3, RowSpan: 4 },
        ],
      },
    ],
  }

  async function abrirCatalogo() {
    await screen.findByText('Under Armour México')
    await userEvent.click(screen.getByRole('button', { name: 'Catálogo de métricas' }))
    await screen.findByRole('table')
  }

  it('cuenta los paneles del layout PUBLICADO y nombra la pestaña', async () => {
    base([http.get(`${API}/admin/layouts/:id`, () => ok(conPanel))])
    montar()
    await abrirCatalogo()

    const fila = (await screen.findByText('Ventas')).closest('tr')
    expect(within(fila as HTMLElement).getByText('2 panel(es)')).toBeInTheDocument()
    expect(within(fila as HTMLElement).getByText('Resumen')).toBeInTheDocument()
  })

  it('avisa a cuántos ROLES afecta editarla · §7.3', async () => {
    // «EDITAR SU NOMBRE, FAMILIA O TIPO CAMBIA LO QUE VEN 2 ROLES» · es lo que
    // §7.3 pide antes de guardar una edición, y lo que hace útil al conteo
    // mientras editar todavía no exista.
    base([http.get(`${API}/admin/layouts/:id`, () => ok(conPanel))])
    montar()
    await abrirCatalogo()

    const fila = (await screen.findByText('Ventas')).closest('tr')
    expect(
      within(fila as HTMLElement).getByText(/Editarla cambia lo que ven 2 rol\(es\) · CEO y Planner/),
    ).toBeInTheDocument()
  })

  it('una métrica sin uso publicado NO dice «0» a secas', async () => {
    // **Es toda la razón por la que F4.5 lo había descartado.** «0» invita a
    // retirar una métrica que puede estar en un borrador.
    base([http.get(`${API}/admin/layouts/:id`, () => ok(conPanel))])
    montar()
    await abrirCatalogo()

    const fila = (await screen.findByText('Margen')).closest('tr')
    expect(
      within(fila as HTMLElement).getByText(/Sin uso publicado · puede estar en un borrador/),
    ).toBeInTheDocument()
    expect(within(fila as HTMLElement).queryByText('0 panel(es)')).toBeNull()
  })

  it('la columna declara que el conteo es del layout publicado', async () => {
    base([http.get(`${API}/admin/layouts/:id`, () => ok(conPanel))])
    montar()
    await abrirCatalogo()

    const encabezado = screen.getByRole('table').querySelector('thead')
    expect(encabezado?.textContent).toContain('del layout publicado')
  })

  it('ya NO se declara ausente entre los faltantes', async () => {
    base([http.get(`${API}/admin/layouts/:id`, () => ok(conPanel))])
    const { container } = montar()
    await abrirCatalogo()

    expect(container.textContent).toContain('Faltan 3 datos')
    expect(container.textContent).not.toContain('en cuántos paneles se usa')
  })
})

describe('el desglose de §9, desde la superficie · A2 §9', () => {
  /** **Estas dos van acá y no en `composicion.test.tsx`**, que monta `RoleCard`
   *  suelto. La cadena es `Admin → Cliente → RoleEditor → RoleCard`, cuatro
   *  saltos, y el 2026-09-22 `onVerCatalogo` se perdía en el segundo: `Cliente`
   *  desestructuraba prop por prop y esa, por ser opcional, **compilaba y no
   *  llegaba**. El enlace no se pintaba y nada lo dijo — lo encontró abrir la
   *  pantalla.
   *
   *  La regla es la del spread condicional: **verificar que el callback dispare
   *  desde donde vive el estado**, no que el botón exista en la hoja. */
  /** El `detalle` compartido tiene `OperationalQuestion: '¿?'` y cero paneles,
   *  que alcanzaba para «nombra las pestañas y no sus UUID». Para §9 no: el
   *  desglose es la pregunta y el conteo. Va como override —**primero**, que es
   *  como `base` los aplica— en vez de cambiar el fixture de todos. */
  const conComposicion = () =>
    base([
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: layouts[1],
          tabs: [
            {
              tab: {
                ID: 'tab-a', LayoutVersionID: 'l-1', Name: 'Resumen',
                OperationalQuestion: '¿Cómo va el negocio?', SortOrder: 1, RoleIDs: [],
              },
              panels: [{ ID: 'p-1' }, { ID: 'p-2' }, { ID: 'p-3' }],
            },
          ],
        }),
      ),
    ])

  it('el enlace al catálogo LLEGA hasta la tarjeta y navega', async () => {
    conComposicion()
    montar()
    await abrirFicha()

    // La tarjeta de Planner es la que oculta una métrica.
    await userEvent.click(await screen.findByRole('button', { name: /ver en el catálogo/i }))

    // **Navegó de verdad**, y se asserta por lo que CAMBIÓ: «Catálogo de
    // métricas» está siempre —es un botón del chrome—, así que mirarlo no
    // distingue haber navegado de no haberlo hecho. Lo que distingue es que la
    // sección de roles ya no esté.
    await waitFor(() => {
      expect(screen.queryByText('Roles y composición')).toBeNull()
    })
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('la pregunta operativa de cada pestaña llega al desglose', async () => {
    // Es lo que §9 agrega sobre la lista de nombres que había antes, y viaja
    // por el mismo camino que se rompió.
    conComposicion()
    montar()
    await abrirFicha()
    // Una vez por tarjeta: son tres roles y los tres ven esa pestaña. Se
    // asserta dentro de UNA, que es el ámbito que la afirma.
    await screen.findAllByText('¿Cómo va el negocio?')
    // Acotado a la lista: desde el 2026-09-25 el navbar pinta la identidad
    // —§PEN:A1— y el nombre del rol activo puede aparecer también ahí.
    const planner = screen.getAllByText('Planner').map((e) => e.closest('li')).find(Boolean) as HTMLElement
    expect(within(planner).getByText('¿Cómo va el negocio?')).toBeInTheDocument()
    // Y su conteo, que es la otra mitad del desglose.
    expect(within(planner).getByText('3 paneles')).toBeInTheDocument()
  })
})
