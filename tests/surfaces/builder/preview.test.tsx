// @vitest-environment jsdom

/** B5 · Vista previa por rol · F4.12
 *
 *  **El recorte lo hace el SERVIDOR, y estas pruebas lo respetan.** Los fixtures
 *  devuelven lo que `/admin/layouts/:id/preview?roleId=` contestaría — ya
 *  filtrado— porque «filtrar en el front lo que ya se tiene probaría el filtro
 *  del front, que no existe».
 *
 *  Forma de la CONSOLA en la respuesta —`sort_order`, `col_start`— y no la del
 *  builder: el preview sale de `GetTab`.
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
const layouts = [
  { ID: 'l-2', TenantID: 't-1', Status: 'draft', VersionID: 'v4', PublishedAt: null },
]
const detalle = {
  layout: layouts[0],
  tabs: [
    {
      tab: { ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen', OperationalQuestion: '¿Cómo vamos?', SortOrder: 1, RoleIDs: [] },
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

const panel = (id: string, metricId: string, colStart: number) => ({
  id, metric_id: metricId, type: 'kpi', col_start: colStart, col_span: 3, row_span: 4,
})

/** Lo que el servidor devuelve por rol · YA filtrado. */
const previews: Record<string, unknown> = {
  'r-ceo': {
    layout_id: 'l-2', role_id: 'r-ceo', role_name: 'CEO', without_payloads: true,
    tabs: [
      {
        tab: { id: 'tab-a', name: 'Resumen', operational_question: '¿Cómo vamos?', sort_order: 1 },
        panels: [panel('p-1', 'm-1', 1), panel('p-2', 'm-2', 4)],
      },
    ],
  },
  'r-pla': {
    layout_id: 'l-2', role_id: 'r-pla', role_name: 'Planner', without_payloads: true,
    // El servidor ya sacó el panel de la métrica oculta.
    tabs: [
      {
        tab: { id: 'tab-a', name: 'Resumen', operational_question: '¿Cómo vamos?', sort_order: 1 },
        panels: [panel('p-1', 'm-1', 1)],
      },
    ],
  },
}

function base(extra: Parameters<typeof server.use> = []) {
  server.use(
    ...extra,
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(layouts)),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/admin/tenants/:id/roles`, () => ok(roles)),
    http.get(`${API}/config/blocks`, () => ok([])),
    http.get(`${API}/admin/layouts/:id/preview`, ({ request }) =>
      ok(previews[new URL(request.url).searchParams.get('roleId') ?? '']),
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

async function abrirPreview() {
  await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
  await screen.findByDisplayValue('Resumen')
  await userEvent.click(screen.getByRole('button', { name: 'Vista previa por rol' }))
}

describe('§7.2 · como lo verá el rol seleccionado', () => {
  it('pinta las pestañas y paneles que el servidor devolvió para ese rol', async () => {
    base()
    montar()
    await abrirPreview()

    expect(await screen.findByText('Como lo ve · CEO')).toBeInTheDocument()
    // El título de la pestaña, que sale del cable en snake_case —`name`— y no
    // del PascalCase del builder: el preview viene de `GetTab`.
    expect(screen.getByRole('heading', { name: 'Resumen' })).toBeInTheDocument()
    expect(screen.getByText('¿Cómo vamos?')).toBeInTheDocument()
    expect(screen.getByText('Ventas')).toBeInTheDocument()
    expect(screen.getByText('Margen')).toBeInTheDocument()
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
    await waitFor(() => expect(screen.queryByText('Margen')).toBeNull())
    expect(screen.getByText('Ventas')).toBeInTheDocument()
  })

  it('el preview de un rol NO se sirve del cache de otro', async () => {
    // La clave lleva los dos ids. Un preview servido desde el cache de otro rol
    // es exactamente la mentira que B4.9 existe para no cometer.
    const pedidos: string[] = []
    base([
      http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
        const r = new URL(request.url).searchParams.get('roleId') ?? ''
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
        ok({ layout_id: 'l-2', role_id: 'r-ceo', role_name: 'CEO', without_payloads: true, tabs: [] }),
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

describe('la mitad que §7.2 pide y no llega', () => {
  it('declara que la vista NO trae cifras, y por qué', async () => {
    // Sin esto, quien mire un panel sin número va a leer «este panel no tiene
    // datos» en vez de «esta vista no los pide».
    base()
    const { container } = montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    const texto = container.textContent ?? ''
    expect(texto).toContain('muestra la composición, no las cifras')
    expect(texto).toContain('B4.9')
  })

  it('el aviso se APAGA si la respuesta deja de declarar `without_payloads`', async () => {
    // **La prueba que la mutación pidió.** Escrito fijo, el aviso seguiría
    // diciendo que no hay cifras el día que el servicio las mande — y nadie lo
    // notaría hasta mirar. Colgado del campo, se apaga solo.
    base([
      http.get(`${API}/admin/layouts/:id/preview`, () =>
        ok({ ...(previews['r-ceo'] as object), without_payloads: false }),
      ),
    ])
    const { container } = montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    expect(container.textContent ?? '').not.toContain('muestra la composición, no las cifras')
    // Lo que sí sigue siendo cierto se sigue diciendo.
    expect(container.textContent ?? '').toContain('El recorte por rol lo hizo el servidor')
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

  it('pinta la posición y el tamaño en unidades de grilla', async () => {
    // Es lo que sí se puede afirmar, y es la mitad que compone.
    base()
    montar()
    await abrirPreview()
    await screen.findByText('Como lo ve · CEO')

    const ventas = screen.getByText('Ventas').closest('div')
    expect(within(ventas as HTMLElement).getByText('3×4 · col 1')).toBeInTheDocument()
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
    base([http.get(`${API}/admin/tenants/:id/roles`, () => ok([]))])
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
      await screen.findByText(/todavía no sirve esta ruta · está escrita en el fork · B4.9/),
    ).toBeInTheDocument()
  })
})
