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
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]
const layouts = [
  { id: 'l-2', tenant_id: 't-1', status: 'draft', version_id: 'v4', published_at: null },
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
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(layouts)),
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

async function abrirPreview() {
  await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
  await screen.findByDisplayValue('Resumen')
  await userEvent.click(screen.getByRole('button', { name: 'Vista previa por rol' }))
}

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

    expect(await screen.findByText(/no ve ninguna pestaña de este layout/)).toBeInTheDocument()
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
    expect(await screen.findByDisplayValue('Resumen')).toBeInTheDocument()
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
    expect(texto).toContain('`roles.tab_ids` y `hidden_metric_ids`')
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
  it('sin versión elegida invita a elegir una', async () => {
    base()
    montar()
    await screen.findByRole('button', { name: /v4/ })
    await userEvent.click(screen.getByRole('button', { name: 'Vista previa por rol' }))

    expect(await screen.findByText(/Elegí una versión en «Contexto de edición»/)).toBeInTheDocument()
  })

  it('sin roles manda a definirlos, no se muestra vacía', async () => {
    base([http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([]))])
    montar()
    await abrirPreview()

    expect(await screen.findByText(/no tiene roles definidos/)).toBeInTheDocument()
    expect(screen.getByText(/F4.3/)).toBeInTheDocument()
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
  it('entrar al preview SIN versión deja salida, y el botón devuelve al contexto', async () => {
    base()
    montar()

    // Sin elegir versión: se va derecho a la pestaña del preview.
    await userEvent.click(await screen.findByRole('button', { name: 'Vista previa por rol' }))
    expect(await screen.findByText(/Elegí una versión/i)).toBeVisible()

    // **La aserción es que el callback LLEVA a algún lado**, no que el botón
    // esté: un botón muerto se ve igual que uno que funciona, y acá la cadena
    // pasa por el spread condicional del contenedor.
    await userEvent.click(screen.getByRole('button', { name: /contexto de edición/i }))
    expect(await screen.findByRole('button', { name: /v4/ })).toBeInTheDocument()
  })
})
