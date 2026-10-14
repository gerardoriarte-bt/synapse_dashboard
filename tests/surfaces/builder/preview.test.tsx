// @vitest-environment jsdom

/** B5 · Vista previa por rol · F4.12
 *
 *  **El recorte lo hace el SERVIDOR, y estas pruebas lo respetan.** Los fixtures
 *  devuelven lo que la ruta contestaría — ya filtrado— porque «filtrar en el
 *  front lo que ya se tiene probaría el filtro del front, que no existe».
 *
 *  ── **LA FORMA CAMBIÓ Y LA PANTALLA PERDIÓ LOS PANELES** · 2026-09-26 ───────
 *
 *  Upstream tomó B4.9 en `8633b10` con una forma distinta de la de nuestro fork:
 *  `role` anidado, pestañas planas y **sin paneles**. Las cuatro pruebas de nivel
 *  de panel se fueron con ellos, y en su lugar hay una que afirma el hueco.
 *
 *  ── **Y EL MOCK EXIGE `role_id`** ──────────────────────────────────────────
 *
 *  Antes leía `searchParams.get('roleId')`, que es lo que el cliente mandaba, así
 *  que **ninguna prueba podía atrapar que el servicio quiere `role_id`** — el
 *  handler respondía igual con la grafía equivocada. Medido el 2026-09-26:
 *  `?roleId=` da 400. Es la familia de F1.38: un mock que no exige lo que el
 *  servicio exige esconde la frontera en vez de probarla.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]
/** `LayoutDashboard` del cable · `contracts/synapse-admin-wire.yaml`. */
const dashboards = [
  { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
]
const layouts = [
  { id: 'l-2', tenant_id: 't-1', dashboard_id: 'd-1', status: 'draft', version_id: 'v4', published_at: null },
]
const detalle = {
  layout: layouts[0],
  tabs: [
    {
      tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿Cómo vamos?', sort_order: 1, role_ids: [] },
      panels: [],
    },
  ],
}

const roles = [
  { id: 'r-ceo', tenant_id: 't-1', name: 'CEO', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 1 },
  { id: 'r-pla', tenant_id: 't-1', name: 'Planner', tab_ids: [], hidden_metric_ids: ['m-2'], layout_overrides: {}, user_count: 0 },
]

const metricas = [
  { id: 'm-1', tenant_id: 't-1', key: 'revenue', name: 'Ventas', shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP', base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1 },
  { id: 'm-2', tenant_id: 't-1', key: 'margin', name: 'Margen', shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP', base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1 },
]

/** Lo que el servidor devuelve por rol · las pestañas que ve, YA filtradas.
 *
 *  **Con `panels` desde el 2026-09-28** · B4.9 llegó y se midió contra
 *  `5924bf2b`: el lente `admin` da 12 paneles y el `planner` 9 con `col_span` 4.
 *  Sigue sin `without_payloads`, que era de nuestro fork. `role` va anidado.
 *
 *  **Acá el CEO ve dos paneles y el Planner uno**, para que la diferencia sea
 *  lo que se prueba: el que falta es el hueco. */
const previews: Record<string, unknown> = {
  'r-ceo': {
    layout_id: 'l-2',
    dashboard_id: 'd-1',
    status: 'draft',
    role: { id: 'r-ceo', name: 'CEO' },
    tabs: [
      {
        id: 'tab-a',
        name: 'Resumen',
        operational_question: '¿Cómo vamos?',
        sort_order: 1,
        icon: '',
        chat_suggestions: [],
        panels: [
          { id: 'p-1', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 4, row_span: 4, note: '' },
          { id: 'p-2', metric_id: 'm-2', type: 'bars', col_start: 5, col_span: 8, row_span: 4, note: '' },
        ],
      },
      {
        id: 'tab-b',
        name: 'Medios',
        operational_question: '¿Rinde la inversión?',
        sort_order: 2,
        icon: '',
        chat_suggestions: [],
        panels: [],
      },
    ],
  },
  'r-pla': {
    layout_id: 'l-2',
    dashboard_id: 'd-1',
    status: 'draft',
    role: { id: 'r-pla', name: 'Planner' },
    // El servidor ya sacó la pestaña que este rol no ve · `roles.tab_ids`, y el
    // panel que `hidden_metric_ids` le oculta. **Los dos recortes, del servidor.**
    tabs: [
      {
        id: 'tab-a',
        name: 'Resumen',
        operational_question: '¿Cómo vamos?',
        sort_order: 1,
        icon: '',
        chat_suggestions: [],
        panels: [
          { id: 'p-1', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 4, row_span: 4, note: '' },
        ],
      },
    ],
  },
}

/** **Exige `role_id` y devuelve 400 con `roleId`**, igual que el servicio.
 *
 *  Es lo que convierte la grafía en algo que una prueba puede atrapar: volver el
 *  cliente a `roleId` rompe esta suite en vez de pasar en verde y fallar en
 *  producción. */
const handlerPreview = http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
  const params = new URL(request.url).searchParams
  const rol = params.get('role_id')
  if (rol === null) {
    return HttpResponse.json(
      { success: false, error: 'role_id es requerido y debe ser un uuid' },
      { status: 400 },
    )
  }
  return ok(previews[rol])
})

function base(extra: Parameters<typeof server.use> = []) {
  server.use(
    ...extra,
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/dashboards`, () => ok(dashboards)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(layouts)),
    // Los pide el contenedor siempre —B6 y sus autores—, aunque estas pruebas
    // no los miren.
    http.get(`${API}/admin/dashboards/:id/publications`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/users`, () => ok([])),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(roles)),
    http.get(`${API}/config/blocks`, () => ok([])),
    handlerPreview,
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

/** Cliente → Dashboard → Editor · 2026-10-07. El rol, si se pasa, se elige
 *  en el paso 2, antes de abrir. */
async function abrirEditor(rol?: string) {
  await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
  if (rol !== undefined) await userEvent.click(await screen.findByRole('button', { name: rol }))
  await userEvent.click(await screen.findByRole('button', { name: 'Abrir el editor de Overview' }))
  await screen.findByRole('tab', { name: 'Resumen' })
}

/** **Se llega por el botón `Vista previa` del chrome** · D3 de la auditoría del
 *  2026-10-06: la pestaña «Vista previa por rol» salió del nav porque repetía el
 *  botón. Y desde el 2026-10-07 el botón es del EDITOR: en «Dashboards» todavía
 *  no se eligió qué previsualizar. */
async function abrirPreview() {
  await abrirEditor()
  await userEvent.click(screen.getByRole('button', { name: 'Vista previa' }))
}

/** El servicio sin versiones para el cliente · la lista vacía es la forma que
 *  `GET /admin/tenants/{id}/layouts` devuelve para un dashboard recién creado. */
const sinVersiones = http.get(`${API}/admin/tenants/:id/layouts`, () => ok([]))

describe('§7.2 · como lo verá el rol seleccionado', () => {
  it('pinta las PESTAÑAS que el servidor devolvió para ese rol', async () => {
    base()
    montar()
    await abrirPreview()

    expect(await screen.findByText('Como lo ve · CEO')).toBeInTheDocument()
    // Los títulos salen del cable en snake_case —`name`, `operational_question`—.
    expect(screen.getByRole('heading', { name: 'Resumen' })).toBeInTheDocument()
    expect(screen.getByText('¿Cómo vamos?')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Medios' })).toBeInTheDocument()
    expect(screen.getByText('2 pestaña(s) · 2 paneles')).toBeInTheDocument()
  })

  it('declara si el layout previsualizado es un BORRADOR', async () => {
    // **Un borrador SÍ se puede previsualizar** desde que arreglaron la compuerta
    // —mira quién pregunta, no a quién se simula—. Y sin decirlo, alguien compara
    // «lo que ve el Planner» contra algo que el Planner todavía no ve.
    base()
    montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    expect(screen.getByText('Borrador')).toBeInTheDocument()
  })

  it('cambiar de rol PIDE OTRO preview · no se filtra acá', async () => {
    // «Filtrar en el front lo que ya se tiene probaría el filtro del front, que
    // no existe». La diferencia entre los dos roles la decide el servidor.
    base()
    montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'r-pla')

    expect(await screen.findByText('Como lo ve · Planner')).toBeInTheDocument()
    // El CEO ve dos pestañas y el Planner una. La diferencia la decidió el
    // servidor con `roles.tab_ids`, y es lo que esta pantalla existe para mostrar.
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Medios' })).toBeNull())
    expect(screen.getByRole('heading', { name: 'Resumen' })).toBeInTheDocument()
  })

  it('el preview de un rol NO se sirve del cache de otro', async () => {
    // La clave lleva los dos ids. Un preview servido desde el cache de otro rol
    // es exactamente la mentira que B4.9 existe para no cometer.
    const pedidos: string[] = []
    base([
      http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
        const r = new URL(request.url).searchParams.get('role_id') ?? ''
        pedidos.push(r)
        return ok(previews[r])
      }),
    ])
    montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'r-pla')
    await screen.findByText('Como lo ve · Planner')

    expect(pedidos).toEqual(['r-ceo', 'r-pla'])
  })

  it('un rol sin pestañas lo dice, y no es un error', async () => {
    base([
      http.get(`${API}/admin/layouts/:id/preview`, () =>
        ok({
          layout_id: 'l-2',
          dashboard_id: 'd-1',
          status: 'published',
          role: { id: 'r-ceo', name: 'CEO' },
          tabs: [],
        }),
      ),
    ])
    montar()
    await abrirPreview()

    expect(await screen.findByText(/no ve ninguna pestaña de esta versión/)).toBeInTheDocument()
  })
})

describe('§7.2 · sin chrome de edición, y con toggle', () => {
  it('no ofrece editar nada adentro de la vista', async () => {
    base()
    const { container } = montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    // Ni campos ni botones de composición: la vista previa se mira.
    expect(container.querySelectorAll('input')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Agregar/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Quitar/ })).toBeNull()
  })

  it('el toggle vuelve a edición', async () => {
    base()
    montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    await userEvent.click(screen.getByRole('button', { name: 'Volver a edición' }))
    // **Al EDITOR**, que es de donde se vino · 2026-10-07. Volvía a «Contexto de
    // edición», que desde ese día es la elección del dashboard.
    expect(await screen.findByRole('tab', { name: 'Resumen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editor' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('la grilla volvió · B4.9 llegó el 2026-09-28', () => {
  // ── ESTA SUITE ERA LA CONTRARIA, Y FALLÓ COMO SE ESPERABA ──────────────────
  //
  // Se llamaba «la mitad que §7.2 pide y no llega» y una de sus pruebas decía en
  // el nombre **«y el día que lleguen, esto falla»**. Llegaron el 2026-09-28 y
  // falló. Eso es lo que una prueba escrita contra una carencia tiene que hacer:
  // avisar cuando la carencia termina, en vez de quedar como leyenda.
  it('pinta los paneles con su posición REAL, no con una copia del reflujo', async () => {
    base()
    const { container } = montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    // La colocación sale de `render/grid.ts`, la misma que aplica la consola.
    const cajas = container.querySelectorAll('[style*="grid-column"]')
    expect(cajas.length).toBeGreaterThanOrEqual(2)
    expect(container.textContent ?? '').toContain('4 × 4')
    expect(container.textContent ?? '').toContain('8 × 4')
  })

  it('el aviso ya no dice «no trae paneles» · esa razón venció', async () => {
    base()
    const { container } = montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('no sus paneles ni sus cifras')
    expect(texto).not.toContain('no hay otra que acepte el rol como lente')
    // Lo que SÍ sigue siendo cierto: no hay cifras.
    expect(texto).toContain('sin cifras')
    // Nombraba los dos campos del cable en pantalla; desde el 2026-10-06 dice
    // qué son, y los nombres del cable no aparecen (copy de producto).
    expect(texto).toContain('qué pestañas ve el rol y qué métricas tiene ocultas')
    expect(texto).not.toContain('hidden_metric_ids')
  })

  it('los paneles NO se dibujan con un payload inventado', async () => {
    // Usar `render/Panel` exigiría un `BLOQUEADO` que ningún servidor emitió o
    // un `CARGANDO` que no está cargando. Compila, se ve bien y miente.
    base()
    const { container } = montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    const texto = container.textContent ?? ''
    for (const estado of ['BLOQUEADO', 'CARGANDO', 'SIN_PERMISO', 'DEGRADADO']) {
      expect(texto).not.toContain(estado)
    }
  })
})

describe('los estados de B5', () => {
  it('en «Dashboards» NO se ofrece la vista previa · es del editor', async () => {
    // **Cambió dos veces.** El 2026-10-06 dejó de ofrecerse sin versión —una
    // entrada que sólo sirve para salir—. El 2026-10-07 dejó de ofrecerse en
    // «Dashboards» del todo, con versión o sin ella: ahí todavía no se eligió
    // qué editar, y guardar, validar y previsualizar son del editor.
    base()
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
    await screen.findByRole('button', { name: 'Abrir el editor de Overview' })
    expect(screen.queryByRole('button', { name: 'Vista previa' })).toBeNull()

    // Y en el editor, sí: que la diferencia sea la pantalla y no la versión.
    await userEvent.click(screen.getByRole('button', { name: 'Abrir el editor de Overview' }))
    expect(await screen.findByRole('button', { name: 'Vista previa' })).toBeInTheDocument()
  })

  it('un dashboard sin versiones dice qué va a pasar, y no ofrece la vista previa', async () => {
    base([sinVersiones])
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
    expect(
      await screen.findByText('Todavía no se compuso. Se va a crear su primer borrador, vacío.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vista previa' })).toBeNull()
  })

  it('sin roles manda a definirlos, no se muestra vacía', async () => {
    const pedidos: string[] = []
    base([
      http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
      http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
        pedidos.push(new URL(request.url).searchParams.get('role_id') ?? '')
        return ok(previews['r-ceo'])
      }),
    ])
    montar()
    await abrirPreview()

    // El texto dice DÓNDE se definen · antes nombraba la tarea, «F4.3», que no
    // es un lugar al que quien compone pueda ir.
    expect(
      await screen.findByText('Este cliente todavía no tiene roles. Se definen en su ficha, en administración.'),
    ).toBeInTheDocument()
    // Sin rol no hay de quién previsualizar: no se pide nada.
    expect(pedidos).toEqual([])
    // **La salida DISPARA** y lleva al editor · B5 no tiene chrome, así que sin
    // este botón el vacío no tendría salida.
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(await screen.findByRole('tab', { name: 'Resumen' })).toBeInTheDocument()
  })

  it('un 404 dice que el fork no está desplegado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    base([
      http.get(
        `${API}/admin/layouts/:id/preview`,
        () =>
          new HttpResponse(JSON.stringify({ success: false, error: 'not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    ])
    montar()
    await abrirPreview()

    expect(
      await screen.findByText(/La vista previa por rol todavía no se puede consultar/),
    ).toBeInTheDocument()
  })
})

describe('B5 no tiene chrome · su vacío lleva salida propia · 2026-09-25', () => {
  /** **El defecto que cierra.** «Vista previa por rol» se dibuja SIN cabecera, y
   *  eso sale del `.pen` —`sinChrome(forma)` en `BuilderChrome`, porque B5 se
   *  dibuja sin cabecera—. Lo que NO sale del dibujo es que su estado vacío
   *  mandara a «Contexto de edición» **sin ninguna forma de llegar**: medido en
   *  el navegador, nueve botones antes de entrar y **cero** después. El texto
   *  pedía ir a un lugar inalcanzable sin escribir la URL.
   *
   *  «Un estado sin salida es una queja» · §8, la misma frase que `StateBody`
   *  lleva escrita. El manejador ya venía pasado —sólo lo usaba la rama con
   *  datos— así que el CTA no promete una acción que no existe.
   *
   *  **Casi se reporta mal**: la primera medición cayó durante una recarga de
   *  Vite. Se repitió desde una carga limpia antes de afirmarlo.
   */
  it('entrar al preview y volver deja el EDITOR donde estaba, con lo no guardado', async () => {
    // **Era «… deja a B1 donde estaba»**: B5 volvía a «Contexto de edición».
    // Desde el 2026-10-07 vuelve al editor, y lo que tiene que sobrevivir el
    // viaje es el borrador local. El PUT queda en vuelo a propósito: así el
    // guardado automático no reemplaza lo escrito por la respuesta.
    base([http.put(`${API}/admin/layouts/:id`, () => new Promise<never>(() => {}))])
    montar()
    await abrirEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Ajustes de la pestaña' }))
    const insp = within(await screen.findByRole('complementary', { name: 'Ajustes de la pestaña' }))
    await userEvent.type(insp.getByDisplayValue('Resumen'), '!')

    await userEvent.click(screen.getByRole('button', { name: 'Vista previa' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Volver a edición' }))

    expect(await screen.findByRole('tab', { name: 'Resumen!' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('heading', { name: '¿Sobre qué se va a componer?' })).toBeNull()
  })
})

describe('B5 se abre desde el chrome · D3 de la auditoría del 2026-10-06', () => {
  it('«Vista previa por rol» NO está en el nav, y el botón «Vista previa» lleva a B5', async () => {
    base()
    montar()
    await abrirEditor()

    const nav = within(screen.getByRole('navigation', { name: 'Builder' }))
    expect(nav.queryByRole('button', { name: 'Vista previa por rol' })).toBeNull()
    // Las tres que SÍ se navegan, para que un nav vacío no pase por «no está».
    // «Dashboards» y «Editor» desde el 2026-10-07 · D1 y D5.
    for (const nombre of ['Dashboards', 'Editor', 'Historial de versiones']) {
      expect(nav.getByRole('button', { name: nombre })).toBeInTheDocument()
    }

    // Que DISPARE: llegar a B5 es ver lo que el servidor devolvió para un rol.
    await userEvent.click(screen.getByRole('button', { name: 'Vista previa' }))
    expect(await screen.findByText('Como lo ve · CEO')).toBeInTheDocument()
  })

  it('con «Todos los roles» la vista previa pide el preview del PRIMER rol', async () => {
    // Previsualizar «todos» no es la vista de nadie: B5 necesita UN rol, y sin
    // filtro toma el primero de la lista que el servicio devolvió.
    const pedidos: string[] = []
    base([
      http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
        const r = new URL(request.url).searchParams.get('role_id') ?? ''
        pedidos.push(r)
        return ok(previews[r])
      }),
    ])
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
    expect(await screen.findByRole('button', { name: 'Todos los roles' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Abrir el editor de Overview' }))
    await screen.findByRole('tab', { name: 'Resumen' })

    await userEvent.click(screen.getByRole('button', { name: 'Vista previa' }))
    await screen.findByText('Como lo ve · CEO')

    expect(pedidos).toEqual(['r-ceo'])
    expect(screen.getByLabelText('Rol')).toHaveValue('r-ceo')
  })

  it('elegir un rol en el paso 2 de «Dashboards» hace que la vista previa pida ESE rol', async () => {
    const pedidos: string[] = []
    base([
      http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
        const r = new URL(request.url).searchParams.get('role_id') ?? ''
        pedidos.push(r)
        return ok(previews[r])
      }),
    ])
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Planner' }))
    expect(screen.getByRole('button', { name: 'Planner' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Abrir el editor de Overview' }))
    await screen.findByRole('tab', { name: 'Resumen' })

    await userEvent.click(screen.getByRole('button', { name: 'Vista previa' }))

    expect(await screen.findByText('Como lo ve · Planner')).toBeInTheDocument()
    expect(pedidos).toEqual(['r-pla'])
  })
})

/** ── B5 DIBUJA CON DATO · 2026-10-07 ─────────────────────────────────────
 *
 *  §7.2: «Renderiza la composición exactamente como la verá el rol
 *  seleccionado, **con datos reales**». La razón por la que pintaba cajas —«el
 *  preview va sin payloads»— venció con `d9147c3`.
 */
describe('B5 dibuja cada panel con su dato', () => {
  const conDatos = http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
    const params = new URL(request.url).searchParams
    const rol = params.get('role_id') ?? ''
    const base = previews[rol] as Record<string, unknown>
    if (params.get('include') !== 'payloads') return ok(base)
    return ok({
      ...base,
      period: '2026-10',
      payloads: {
        'p-1': {
          status: 'AVAILABLE',
          value: { shape: 'scalar', v: 48362 },
          governance: { base: 'x', layer: 'GOLD', source: 'ERP', freshness: '2026-10-07T00:00:00Z', catalog_version: 1 },
        },
      },
    })
  })

  it('pide CON datos y pinta la cifra del servidor, y dice de qué período es', async () => {
    base([conDatos])
    montar()
    await abrirPreview()
    expect(await screen.findByText(/48[.,]362/)).toBeInTheDocument()
    expect(screen.getByText('Con el dato de 2026-10, como lo va a ver este rol.')).toBeInTheDocument()
  })

  it('un panel sin dato lo DICE · no se le inventa un estado', async () => {
    base([conDatos])
    montar()
    await abrirPreview()
    await screen.findByText(/48[.,]362/)
    expect(screen.getByText('El servidor no mandó dato para este panel.')).toBeInTheDocument()
  })
})
