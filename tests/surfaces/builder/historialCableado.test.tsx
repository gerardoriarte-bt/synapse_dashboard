// @vitest-environment jsdom

/** B6 · el CABLEADO de la pantalla en el builder · §PEN:B6 · F5.19
 *
 *  **Esta prueba existe porque `historial.test.tsx` no la puede hacer.** Aquella
 *  rinde `VersionHistory` con las props construidas a mano, que es lo correcto
 *  para verificar la pantalla y **deja sin cubrir el único tramo que el cableado
 *  agrega**: que el `dashboardId` salga de la versión abierta, que el historial se
 *  pida con ÉSE, que las cinco listas lleguen a las props y que el chrome de B6
 *  no ofrezca acciones de composición.
 *
 *  Es la misma frontera que la mutación encontró sin cubrir tres veces en
 *  septiembre, una capa más arriba: **cada salto del camino usa spread
 *  condicional o una prop opcional, y una prop mal nombrada COMPILA.**
 *
 *  ── LOS FIXTURES SON CAPTURAS DEL SERVICIO · 2026-09-30, `:4010` ────────────
 *
 *  Login `dev@synapse.local`, tenant `e65f81ae…`. **Lo único recortado son los
 *  paneles del detalle del layout y las 20 métricas que el diff no nombra**: la
 *  pantalla no lee ni una cosa ni la otra, y pegar 21 métricas de 16 campos
 *  escondería lo que la prueba mira. El recorte va dicho acá y no descubierto
 *  después.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'
const TENANT = 'e65f81ae-50ba-4ceb-bb11-d4c0bb76d111'
/** El dashboard «Marca» · el que tiene las cinco publicaciones. */
const MARCA = 'd0187f9f-1e5b-4738-a538-826db2f61148'
/** El dashboard «Overview» · layout publicado y CERO publicaciones, porque la
 *  auditoría se empezó a escribir con `168a761`. */
const OVERVIEW = 'f34e59d5-c9ad-5938-ab3e-175ff4021c27'
const PUBLICADO = '16009187-188f-4011-8b34-01e5a6a38fef'
const DESTINO = 'f1687bc9-457a-496a-9388-b9cfff65150c'
const AUTOR = '33333333-3333-4333-8333-333333333333'
const SALES = '0ec90430-794c-5626-9863-a88b610515bd'

/** Las 7 versiones del tenant, **con DOS `published`, una por dashboard**. Es el
 *  corte medido y es lo que hace que el badge no se pueda derivar con un `find`
 *  sobre el estado a secas. */
const LAYOUTS = [
  { id: PUBLICADO, tenant_id: TENANT, dashboard_id: MARCA, status: 'published', version_id: 'v-1790712673', published_at: '2026-09-29T15:11:13.664957-05:00' },
  { id: 'f998ae8c-2d63-5553-a164-a9205859eaa9', tenant_id: TENANT, dashboard_id: OVERVIEW, status: 'published', version_id: 'v1', published_at: '2026-09-24T10:19:12.082824-05:00' },
  { id: 'a7b420d1-adfc-4629-af42-184d68af38cd', tenant_id: TENANT, dashboard_id: OVERVIEW, status: 'draft', version_id: '' },
  { id: '605596a0-982e-485b-9368-2c1c5ebb4170', tenant_id: TENANT, dashboard_id: MARCA, status: 'archived', version_id: 'v-1790692732', published_at: '2026-09-29T09:38:52.7762-05:00' },
  { id: DESTINO, tenant_id: TENANT, dashboard_id: MARCA, status: 'archived', version_id: 'rollback-v-1790630106', published_at: '2026-09-28T16:16:05.073326-05:00' },
  { id: 'bff2251d-4797-47a3-b278-f89c1f53bbdd', tenant_id: TENANT, dashboard_id: MARCA, status: 'archived', version_id: 'v-1790630165', published_at: '2026-09-28T16:16:05.05395-05:00' },
  { id: '779a4742-fba7-4cf7-b65a-14e6f8d1982d', tenant_id: TENANT, dashboard_id: MARCA, status: 'archived', version_id: 'v-1790630106', published_at: '2026-09-28T16:15:06.767525-05:00' },
]

/** Una fila del historial de «Marca». El diff trae UNA entrada de cada forma que
 *  la pantalla nombra, para que el cruce con el contador tenga algo que cruzar. */
const publicacion = (over: Record<string, unknown>) => ({
  id: `pub-${String(over.version_id)}`,
  tenant_id: TENANT,
  dashboard_id: MARCA,
  layout_id: PUBLICADO,
  version_id: 'v-1790712673',
  action: 'publish',
  actor_user_id: AUTOR,
  actor_role: 'admin',
  previous_layout_id: '605596a0-982e-485b-9368-2c1c5ebb4170',
  diff: {
    summary: { tabs_added: 0, panels_added: 0, tabs_removed: 0, panels_changed: 1, panels_removed: 0 },
    tabs_added: [],
    panels_added: [],
    panels_moved: [
      {
        tab: 'marca',
        type: 'kpi',
        metric_id: SALES,
        from: { col_span: 3, row_span: 4, col_start: 4 },
        to: { col_span: 3, row_span: 4, col_start: 1 },
      },
    ],
    tabs_removed: [],
    panels_removed: [],
    panels_retyped: [],
    tabs_reordered: [],
    panels_options_changed: [],
  },
  created_at: '2026-09-29T15:11:13.664957-05:00',
  ...over,
})

const USUARIOS = [
  {
    id: AUTOR,
    tenant_id: TENANT,
    email: 'dev@synapse.local',
    first_name: 'Dev',
    last_name: 'Local',
    role_id: '47065592-28d0-40ac-97d5-e281a6d4b47e',
    role: 'admin',
    last_login_at: '2026-09-30T15:16:22.967924-05:00',
    is_active: true,
    created_at: '2026-09-22T09:18:45.922229-05:00',
  },
]

/** `sales`, la única que el diff de estos fixtures nombra. Capturada entera: las
 *  otras 20 no cambian nada de lo que se mira. */
const CATALOGO = [
  {
    id: SALES,
    tenant_id: TENANT,
    key: 'sales',
    name: 'Sales',
    shape: 'scalar',
    family: 'demand',
    layer: 'GOLD',
    source: 'ERP',
    base: 'ALL CHANNELS',
    semantic_direction: 'HIGHER = BETTER',
    min_grain: 'month',
    measurement_window: '',
    dimensions: [],
    catalog_version: 1,
  },
]

/** El detalle de la versión publicada. **`tabs: []`** es el recorte declarado
 *  arriba: lo único que B6 le lee es `layout.dashboard_id`, que es el campo que
 *  `adaptarVersion` tiraba hasta hoy. */
const DETALLE = {
  layout: LAYOUTS[0],
  tabs: [],
}

/** `GET /admin/tenants/{tenantId}/dashboards` · **NO es captura**: la ruta se
 *  transcribió el 2026-10-07, después de este corte. Se arma con la forma
 *  `LayoutDashboard` del cable y los dos dashboards que las versiones de arriba
 *  ya nombran; «Overview» por defecto, igual que en el `/config/me` sembrado. */
const DASHBOARDS = [
  { id: OVERVIEW, tenant_id: TENANT, name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
  { id: MARCA, tenant_id: TENANT, name: 'Marca', slug: 'marca', is_default: false, history_months: 12 },
]

function montar(
  publicaciones: unknown[] = [publicacion({})],
  layouts: unknown[] = LAYOUTS,
  dashboards: unknown[] = DASHBOARDS,
) {
  const pedidas: string[] = []
  /** Los `POST …/layouts` · «Volver a editar» sobre una publicada crea el
   *  borrador desde ella, y esto es lo que deja verificar que DISPARE. */
  const creados: unknown[] = []
  server.use(
    http.get(`${API}/admin/tenants/:id/dashboards`, () => ok(dashboards)),
    http.post(`${API}/admin/tenants/:id/layouts`, async ({ request }) => {
      creados.push(await request.json())
      return ok({ id: 'nuevo-1', tenant_id: TENANT, dashboard_id: MARCA, status: 'draft', version_id: 'v2', published_at: null })
    }),
    http.get(`${API}/admin/tenants`, () =>
      ok([{ id: TENANT, name: 'Under Armour México', locale: 'es-CO' }]),
    ),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(layouts)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(CATALOGO)),
    http.get(`${API}/admin/tenants/:id/users`, () => ok(USUARIOS)),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
    // El borrador recién creado se lee como borrador, vacío: el detalle de la
    // publicada no tiene pestañas que copiar (recorte declarado arriba).
    http.get(`${API}/admin/layouts/:id`, ({ params }) =>
      params['id'] === 'nuevo-1'
        ? ok({ layout: { id: 'nuevo-1', tenant_id: TENANT, dashboard_id: MARCA, status: 'draft', version_id: 'v2' }, tabs: [] })
        : ok(DETALLE),
    ),
    // **Se registra la URL pedida.** Con la ruta de `layouts` la pantalla
    // pintaría UNA tarjeta y nadie lo notaría: las dos rutas existen y devuelven
    // la misma forma.
    http.get(`${API}/admin/dashboards/:id/publications`, ({ params }) => {
      pedidas.push(String(params.id))
      return ok(publicaciones)
    }),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { pedidas, creados }
}

/** «Dashboards» → elegir «Marca» → B6. Es el camino real desde el 2026-10-07:
 *  se elige el DASHBOARD, el builder toma su versión —acá la publicada, porque
 *  «Marca» no tiene borrador— y el historial se pide por el dashboard de ésa.
 *  Se aprieta «Marca» aunque haya uno elegido solo: el por defecto es
 *  «Overview». */
async function abrirHistorial() {
  await userEvent.click(await screen.findByRole('button', { name: /Marca/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Historial de versiones' }))
}

describe('B6 · el dashboard sale de la VERSIÓN abierta', () => {
  it('pide el historial del dashboard de esa versión, no del tenant ni del layout', async () => {
    // **El campo que lo hace posible es `dashboard_id` del detalle**, que
    // `adaptarVersion` tiraba hasta el 2026-09-30. Sin él no hay forma de llegar
    // de lo que B1 elige a lo que hay que pedir.
    const { pedidas } = montar()
    await abrirHistorial()

    await waitFor(() => expect(pedidas).toContain(MARCA))
    // Y NO el de «Overview», que es el otro dashboard con layout publicado.
    expect(pedidas).not.toContain(OVERVIEW)
  })

  it('sin versión elegida no pide nada y ofrece la salida, que DISPARA', async () => {
    // `enabled` es lo único que impide `/admin/dashboards//publications`.
    // **Desde la autoselección del 2026-10-06** —auditoría de ese día— un
    // cliente con versiones nunca queda sin una, así que el caso es el de un
    // cliente sin ninguna. Desde el 2026-10-07 se entra por dashboards, y el
    // cliente vacío es el que no tiene ni dashboards ni versiones.
    const { pedidas } = montar([publicacion({})], [], [])
    await screen.findByText('Este cliente todavía no tiene dashboards. Creá el primero.')
    await userEvent.click(screen.getByRole('button', { name: 'Historial de versiones' }))

    expect(pedidas).toEqual([])
    expect(
      screen.getByText('Elegí un dashboard en «Dashboards» para ver su historial.'),
    ).toBeInTheDocument()
    // **Que el botón DISPARE, no que exista**: un estado sin salida es una queja.
    await userEvent.click(screen.getByRole('button', { name: 'Ir a Dashboards' }))
    // B1 ya no tiene el selector de cliente —subió a la cabecera el 2026-10-06—:
    // se la reconoce por su pregunta.
    expect(await screen.findByRole('heading', { name: '¿Sobre qué se va a componer?' })).toBeInTheDocument()
  })
})

describe('B6 · un dashboard elegido sin versiones', () => {
  it('lo nombra y dice que no tiene versiones · no pide «elegí un dashboard»', async () => {
    // **Visto en pantalla el 2026-10-07**: un dashboard recién creado, elegido,
    // abría el historial con «Elegí un dashboard», que es falso — ya estaba
    // elegido. Lo que pasa es que todavía no tiene versiones.
    const { pedidas } = montar([publicacion({})], [], DASHBOARDS)
    await userEvent.click(await screen.findByRole('button', { name: /Marca/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Historial de versiones' }))

    expect(
      screen.getByText('Marca todavía no tiene versiones: el historial empieza con la primera.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Elegí un dashboard en «Dashboards» para ver su historial.')).toBeNull()
    expect(pedidas).toEqual([])
    await userEvent.click(screen.getByRole('button', { name: 'Ir a Dashboards' }))
    expect(await screen.findByRole('heading', { name: '¿Sobre qué se va a componer?' })).toBeInTheDocument()
  })
})

describe('B6 · lo que el contenedor le pasa a la pantalla', () => {
  it('el título nombra el dashboard y el cliente cuando el cliente es el PROPIO', async () => {
    // El único cable transcripto con nombres de dashboard es `/config/me`, y es
    // del usuario que MIRA: con el mismo tenant, el nombre se resuelve.
    server.use(
      http.get(`${API}/config/me`, () =>
        ok({
          ...context,
          tenant: { ...context.tenant, id: TENANT },
          dashboards: [{ id: MARCA, name: 'Marca', slug: 'marca', is_default: false }],
        }),
      ),
    )
    montar()
    await abrirHistorial()
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Marca · Under Armour México',
    )
  })

  it('con un cliente AJENO el título nombra el dashboard desde la ruta de dashboards', async () => {
    // **El caso ocurre de verdad y no es un borde**: `/config/me` es del usuario
    // que mira, así que componer un cliente distinto del propio dejaba el nombre
    // del dashboard sin fuente. Medido el 2026-09-30, la base local tiene DOS
    // clientes con el mismo nombre y el que el builder elige por defecto no es el
    // del usuario sembrado.
    //
    // **Se cerró el 2026-10-07** al transcribir
    // `GET /admin/tenants/{tenantId}/dashboards`: el nombre sale de ahí para
    // cualquier cliente. Hasta ese día esta prueba afirmaba que el título decía
    // sólo el cliente.
    montar() // el `/config/me` por defecto es del tenant `t-1`, no de TENANT
    await abrirHistorial()
    const titulo = await screen.findByRole('heading', { level: 1 })
    expect(titulo).toHaveTextContent('Marca · Under Armour México')
    expect(titulo.textContent).not.toContain(MARCA)
  })

  it('el badge EN PRODUCCIÓN aparece UNA vez, con DOS layouts publicados en la lista', async () => {
    // **El caso que ninguna prueba de la pantalla podía ver**: `layouts` llega
    // por TENANT y trae dos `published`, uno por dashboard. Sin acotar al
    // dashboard, el `find` puede tomar el de «Overview» y el badge desaparece.
    montar()
    await abrirHistorial()
    const badges = await screen.findAllByText(/EN PRODUCCIÓN/i)
    expect(badges).toHaveLength(1)
    expect(badges[0]?.closest('li')).toHaveTextContent('v-1790712673')
  })

  it('el autor sale de `/admin/tenants/{id}/users` y la métrica del catálogo de admin', async () => {
    // Las dos listas se resuelven en la superficie, no en el adaptador: el cable
    // manda uuids. Si una prop llegara mal nombrada, acá se vería un uuid o un
    // «fuera del catálogo» — que es justo lo que el spread condicional deja
    // compilar.
    montar()
    await abrirHistorial()
    expect(await screen.findByText(/DEV LOCAL · /i)).toBeInTheDocument()
    expect(screen.getByText(/Sales/)).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(AUTOR))).toBeNull()
    expect(screen.queryByText(/MÉTRICA FUERA DEL CATÁLOGO/i)).toBeNull()
  })

  it('con cero publicaciones pinta el vacío medido de «Overview», no «cargando»', async () => {
    montar([])
    await abrirHistorial()
    expect(await screen.findByText(/SIN PUBLICACIONES REGISTRADAS/i)).toBeInTheDocument()
    expect(screen.queryByText(/TRAYENDO EL HISTORIAL/i)).toBeNull()
  })
})

describe('B6 · el chrome de `contexto` · §PEN:B6 frame `Volver`', () => {
  it('no ofrece PUBLICAR ni VISTA PREVIA sobre una pantalla de sólo lectura', async () => {
    // `conContexto` no distinguía `contexto` de `composicion`, así que B6 pintaba
    // las acciones de composición. No se vio antes porque B6 no estaba montada:
    // la única pantalla con esta forma mostraba un aviso de «Pendiente».
    montar()
    await abrirHistorial()
    const cabecera = within(screen.getByRole('banner'))
    expect(cabecera.queryByRole('button', { name: 'Vista previa' })).toBeNull()
    expect(cabecera.queryByRole('button', { name: 'Publicar' })).toBeNull()
    expect(cabecera.queryByText(/falta validar en el servidor/i)).toBeNull()
  })

  it('«VOLVER A EDITAR» es el único control, y DISPARA', async () => {
    // **Desde el 2026-10-07 vuelve al EDITOR, no a «Dashboards»**: es lo que el
    // literal promete. Y «Marca» sólo tiene la publicada, que no se edita en el
    // lugar, así que volver a editar resuelve igual que el paso 3: crea un
    // borrador a partir de ella, CON su dashboard y la versión siguiente.
    const { creados } = montar()
    await abrirHistorial()
    const cabecera = within(screen.getByRole('banner'))
    await userEvent.click(cabecera.getByRole('button', { name: 'Volver a editar' }))

    await waitFor(() => expect(creados).toEqual([{ version_id: 'v2', dashboard_id: MARCA }]))
    expect(
      await screen.findByText(/Se creó el borrador v2 a partir de la versión publicada v-1790712673/),
    ).toBeInTheDocument()
    // Y quedó en el editor de ese borrador, que se puede componer.
    expect(
      await screen.findByText('Este dashboard todavía no tiene pestañas. Agregá la primera con «+ Pestaña».'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar una pestaña' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '¿Sobre qué se va a componer?' })).toBeNull()
  })

  it('el contexto sigue visible · es lo que el `.pen` dibuja en el navbar de B6', async () => {
    montar()
    await abrirHistorial()
    const cabecera = within(screen.getByRole('banner'))
    for (const rotulo of ['Cliente', 'Rol']) {
      expect(cabecera.getByText(rotulo)).toBeInTheDocument()
    }
    expect(cabecera.getByText('Under Armour México')).toBeInTheDocument()
    // Sin filtro de rol el chrome lo dice, en vez de un guion que parece un hueco.
    expect(cabecera.getByText('Todos los roles')).toBeInTheDocument()
    // La pestaña salió del chrome el 2026-10-06: B6 es del dashboard entero.
    expect(cabecera.queryByText('Pestaña')).toBeNull()
  })
})

describe('B6 · revertir viaja hasta el servicio', () => {
  it('hace POST al layout PUBLICADO con el DESTINO en el cuerpo', async () => {
    /** **La cadena entera, y es la que no tenía nada.** `VersionCard → onClick →
     *  VersionHistory.onRevertir → revertir.mutate → adminApi.revertir`: cuatro
     *  saltos, y el de la prop usa spread condicional. Los dos uuids son
     *  distintos a propósito — con el mismo valor un intercambio no se detecta. */
    let cuerpo: unknown = null
    let url = ''
    server.use(
      http.post(`${API}/admin/layouts/:id/revert`, async ({ request, params }) => {
        url = String(params.id)
        cuerpo = await request.json()
        return ok({ ...LAYOUTS[4], status: 'published' })
      }),
    )
    // Dos filas: la publicada —sin botón— y el destino de la reversión.
    montar([
      publicacion({}),
      publicacion({ version_id: 'rollback-v-1790630106', layout_id: DESTINO, action: 'rollback' }),
    ])
    await abrirHistorial()

    const tarjeta = (await screen.findByText('rollback-v-1790630106')).closest('li')
    const boton = tarjeta?.querySelector('button')
    expect(boton).not.toBeNull()
    await userEvent.click(boton as HTMLButtonElement)

    await waitFor(() => expect(url).toBe(PUBLICADO))
    expect(cuerpo).toEqual({ to_layout_id: DESTINO })
  })

  it('el fallo se pinta con el mensaje del SERVIDOR, arriba de la lista', async () => {
    // El envelope trae `error` como cadena ya redactada en español desde
    // `f70cec2`. Traducir el código acá sería una segunda fuente para el mismo
    // texto.
    server.use(
      http.post(`${API}/admin/layouts/:id/revert`, () =>
        Response.json(
          { success: false, error: 'no se puede revertir a sí mismo', code: 'CONFLICT_REVERT_SELF' },
          { status: 409 },
        ),
      ),
    )
    montar([
      publicacion({}),
      publicacion({ version_id: 'rollback-v-1790630106', layout_id: DESTINO, action: 'rollback' }),
    ])
    await abrirHistorial()

    const tarjeta = (await screen.findByText('rollback-v-1790630106')).closest('li')
    await userEvent.click(tarjeta?.querySelector('button') as HTMLButtonElement)

    expect(await screen.findByText(/no se puede revertir a sí mismo/i)).toBeInTheDocument()
  })
})
