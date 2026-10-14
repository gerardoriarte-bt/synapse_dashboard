// @vitest-environment jsdom

/** B4 · Binder de métrica · F4.10
 *
 *  **La aserción que sostiene la tarea es que las incompatibles APAREZCAN.**
 *  §7.2: «las incompatibles aparecen listadas y deshabilitadas con la razón. El
 *  rechazo explicado es lo que enseña el sistema». Filtrarlas sería más corto y
 *  más limpio, y una prueba escrita desde esa implementación pasaría siempre.
 *
 *  **Desde el 2026-10-06 es el inspector del canvas** (D1 de
 *  `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`): las pruebas llegan
 *  al editor —desde el 2026-10-07 por «Dashboards» y «Abrir el editor»—, eligen
 *  el panel en el lienzo y miran dentro del inspector.
 *
 *  **Desde el 2026-10-07 el inspector es una cascada de columnas** (D6 y D7 de
 *  `docs/AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`): la primera
 *  resume el panel —su título es la métrica— y sus filas «Qué muestra», «Cómo
 *  se ve» y «Ajustes» abren la segunda. El `<select>` «Tipo de panel» se fue:
 *  el tipo se elige junto con el gráfico en «Cómo se ve», y elegir una métrica
 *  de otra forma lo cambia. Las pruebas que lo usaban para romper la
 *  composición ahora reciben el panel roto del servidor —`servir({ tipo:
 *  'series' })`—, que es la única forma de llegar a ese estado.
 *
 *  Los fixtures salen de los dos cables: `BlockRule` de
 *  `synapse-console-wire.yaml` —snake_case, `accepted_shapes` en inglés— y
 *  `CatalogMetric` de `synapse-admin-wire.yaml`.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/dom'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]
const versiones = [
  { id: 'l-2', tenant_id: 't-1', dashboard_id: 'd-1', status: 'draft', version_id: 'v4', published_at: null },
]

/** `LayoutDashboard` del cable · desde el 2026-10-07 el builder entra por acá. */
const dashboards = [
  { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
]

const detalle = {
  layout: versiones[0],
  tabs: [
    {
      tab: {
        id: 'tab-a',
        layout_version_id: 'l-2',
        name: 'Resumen',
        operational_question: '¿Cómo vamos?',
        sort_order: 1,
        role_ids: [],
      },
      panels: [
        { id: 'p-1', tab_id: 'tab-a', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4 },
      ],
    },
  ],
}

/** Tres tipos con rangos distintos. `gauge` es el que no dibuja una serie. */
const bloques = [
  {
    type: 'kpi',
    ui_name: 'KPI',
    accepted_shapes: ['scalar', 'scalar_with_interval'],
    col_span_min: 3,
    col_span_max: 4,
    row_span_min: 3,
    row_span_max: 4,
    // `comparative` llega en inglés y el adaptador lo pasa a `comparativo`,
    // que es un sí o no · ver la prueba de los booleanos.
    layout_params: ['comparative'],
  },
  {
    type: 'series',
    ui_name: 'Serie',
    accepted_shapes: ['time_series', 'multi_series'],
    col_span_min: 6,
    col_span_max: 12,
    row_span_min: 4,
    row_span_max: 8,
    layout_params: ['normalization'],
  },
  {
    type: 'bars',
    ui_name: 'Barras',
    accepted_shapes: ['categorical'],
    col_span_min: 4,
    col_span_max: 12,
    row_span_min: 4,
    row_span_max: 8,
    layout_params: ['order', 'cap'],
  },
  {
    type: 'table',
    ui_name: 'Tabla',
    accepted_shapes: ['tabular'],
    col_span_min: 6,
    col_span_max: 12,
    row_span_min: 4,
    row_span_max: 10,
    layout_params: ['columns'],
  },
  {
    type: 'gauge',
    ui_name: 'Medidor',
    accepted_shapes: ['scalar'],
    col_span_min: 3,
    col_span_max: 4,
    row_span_min: 4,
    row_span_max: 5,
    // A propósito uno que el front no sabe describir.
    layout_params: ['maximum', 'inventado'],
  },
]

const metricas = [
  {
    id: 'm-1', tenant_id: 't-1', key: 'revenue', name: 'Ventas',
    shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
  {
    id: 'm-2', tenant_id: 't-1', key: 'trend', name: 'Tendencia de ventas',
    shape: 'time_series', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
  // **Las tres de abajo existen para cambiar de tipo eligiendo la métrica**:
  // una que `kpi` acepta y `gauge` no, una que dibuja `bars` y una que dibuja
  // `table`.
  {
    id: 'm-3', tenant_id: 't-1', key: 'forecast', name: 'Venta pronosticada',
    shape: 'scalar_with_interval', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
  {
    id: 'm-4', tenant_id: 't-1', key: 'by_channel', name: 'Ventas por canal',
    shape: 'categorical', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
  {
    id: 'm-5', tenant_id: 't-1', key: 'orders', name: 'Detalle de pedidos',
    shape: 'tabular', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
]

/** El panel que llega del servidor · por defecto `kpi` sobre `Ventas`, que es
 *  una composición cerrada. Con `tipo: 'series'` llega ROTO: es la única forma
 *  de tener un panel incompatible desde que elegir la métrica ajusta el tipo. */
function detalleCon(panel: { tipo?: string; metricId?: string } = {}) {
  return {
    ...detalle,
    tabs: [
      {
        ...detalle.tabs[0],
        panels: [
          {
            id: 'p-1', tab_id: 'tab-a', metric_id: panel.metricId ?? 'm-1', type: panel.tipo ?? 'kpi',
            col_start: 1, col_span: panel.tipo === 'series' ? 6 : 3, row_span: 4,
          },
        ],
      },
    ],
  }
}

function servir(panel: { tipo?: string; metricId?: string } = {}) {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(versiones)),
    http.get(`${API}/admin/tenants/:id/dashboards`, () => ok(dashboards)),
    // Con `dashboard_id` en la versión el editor ya sabe de qué dashboard es, y
    // el historial, los roles y los usuarios se piden igual · se sirven vacíos.
    // **Sin roles no hay lente**, así que el editor no pide el preview con
    // datos: las pruebas que lo necesitan sirven un rol `admin`.
    http.get(`${API}/admin/dashboards/:id/publications`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/users`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalleCon(panel))),
    // **El guardado automático, atendido** · 2026-10-07. Bajo carga una prueba
    // tarda más de 3 s entre editar y afirmar, el automático manda el `PUT` y
    // sin manejador la prueba fallaba de vez en cuando —identificada repitiendo
    // la base seis veces—. Devuelve lo que recibió, con ids para lo nuevo, que
    // es lo que hace el servicio: así lo editado no se pisa.
    http.put(`${API}/admin/layouts/:id`, async ({ request }) => {
      const cuerpo = (await request.json()) as {
        tabs: { id?: string; name: string; operational_question: string; sort_order: number; role_ids: string[]; panels: Record<string, unknown>[] }[]
      }
      const layout = (detalleCon(panel) as { layout: unknown }).layout
      return ok({
        layout,
        tabs: cuerpo.tabs.map((t, i) => {
          const tabId = t.id ?? `tab-eco-${String(i)}`
          return {
            tab: { id: tabId, name: t.name, operational_question: t.operational_question, sort_order: t.sort_order, role_ids: t.role_ids },
            panels: t.panels.map((x, j) => ({ ...x, id: x['id'] ?? `p-eco-${String(i)}-${String(j)}`, tab_id: tabId })),
          }
        }),
      })
    }),
    http.get(`${API}/config/blocks`, () => ok(bloques)),
  )
}

/** Dos gráficos del repertorio · `/config/plots`, `Grafico` del cable de
 *  consola. `columns` no compara con una sola barra; `lollipop` no declara
 *  mínimo; `bullet` es de cifra única, y lo pueden dibujar dos tipos. */
const repertorio = [
  {
    id: 'columns', name: 'Columnas', shapes: ['categorical'], supports_band: false,
    minimums: [{ shape: 'categorical', when: 'items < 2', reason: 'una barra sola no compara nada' }],
  },
  { id: 'lollipop', name: 'Lollipop', shapes: ['categorical'], supports_band: false, minimums: [] },
  { id: 'bullet', name: 'Bala', shapes: ['scalar'], supports_band: false, minimums: [] },
]
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

/** **Desde el 2026-10-06 el configurador es el inspector del canvas** · D1 y
 *  D2 de `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`. B1 ya no
 *  lista paneles ni configura: se llega al editor, se elige el panel en el
 *  lienzo y se abre el inspector. La versión se elige sola —el primer borrador—,
 *  así que no hace falta tocarla. */
async function componer() {
  // **Desde el 2026-10-07 se entra por «Dashboards»** · Cliente → Dashboard →
  // Editor: se elige el dashboard y se abre su editor, que abre el borrador.
  await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
  await userEvent.click(await screen.findByRole('button', { name: 'Abrir el editor de Overview' }))
  await screen.findByRole('grid', { name: 'Lienzo de composición' })
}

/** Los paneles del lienzo · son las celdas que se arrastran. Por eso y no por
 *  nombre: con una métrica fuera del catálogo el panel no tiene nombre que buscar. */
const panelesDelLienzo = () =>
  screen.getAllByRole('gridcell').filter((c) => c.getAttribute('draggable') === 'true')

const INSPECTOR = 'Configuración del panel'
const inspector = () => within(screen.getByRole('complementary', { name: INSPECTOR }))

/** Compone «Resumen» y elige el panel que ya existe. */
async function abrirPanel() {
  await componer()
  await waitFor(() => expect(panelesDelLienzo()).toHaveLength(1))
  await userEvent.click(panelesDelLienzo()[0] as HTMLElement)
  await screen.findByRole('complementary', { name: INSPECTOR })
}

/** La segunda columna · un `section` con el título de la fila que la abrió. */
const columna = (titulo: string) => within(screen.getByRole('region', { name: titulo }))

/** Abre una profundidad desde su fila de la primera columna. */
async function abrir(titulo: 'Qué muestra' | 'Cómo se ve' | 'Ajustes') {
  await userEvent.click(inspector().getByRole('button', { name: new RegExp(`^${titulo}`) }))
  return columna(titulo)
}

/** Las métricas de OTRA forma viven plegadas en «Qué muestra». */
const otrasFormas = () =>
  within(columna('Qué muestra').getByText(/más · se dibujan de otra forma/).closest('details') as HTMLElement)

/** Elegir una métrica de otra forma · cambia el tipo del panel. */
async function elegirDeOtraForma(nombre: string) {
  await abrir('Qué muestra')
  await userEvent.click(otrasFormas().getByRole('button', { name: new RegExp(`^${nombre}`) }))
}

/** La banda del panel en el lienzo · dice el tipo o el gráfico y el tamaño. */
const panelUno = () => panelesDelLienzo()[0] as HTMLElement

describe('§7.2 · el rechazo explicado es lo que enseña el sistema', () => {
  it('las de otra forma APARECEN, y dicen qué forma tienen y cómo se van a dibujar', async () => {
    // **Reescrita el 2026-10-07.** Antes aparecían sin caja, con «Requiere … ·
    // esta es …»: no se podían elegir. Con «qué muestra» primero, prohibirlas
    // obligaba a elegir el dibujo antes que el dato; ahora se eligen y CAMBIAN
    // el tipo. El rechazo sigue explicado, como consecuencia: el `.pen` la
    // escribía «REQUIERE serieTemporal · ESTA ES escalar».
    servir()
    montar()
    await abrirPanel()
    await abrir('Qué muestra')

    const lista = otrasFormas()
    expect(lista.getByText('Tendencia de ventas')).toBeInTheDocument()
    expect(lista.getByText('Es Serie temporal · se va a dibujar como Serie temporal')).toBeInTheDocument()
    expect(lista.getByText('Es Por categoría · se va a dibujar como Barras')).toBeInTheDocument()
  })

  it('elegir una de otra forma CAMBIA el tipo del panel en el lienzo', async () => {
    servir()
    montar()
    await abrirPanel()

    await elegirDeOtraForma('Tendencia de ventas')

    await waitFor(() => expect(within(panelUno()).getByText('Tendencia de ventas')).toBeInTheDocument())
    expect(within(panelUno()).getByText('Serie temporal')).toBeInTheDocument()
    expect(inspector().getByRole('heading', { name: 'Tendencia de ventas' })).toBeInTheDocument()
  })

  it('las separa en dos listas y dice con qué tipo se dibujan las primeras', async () => {
    servir()
    montar()
    await abrirPanel()
    await abrir('Qué muestra')

    expect(columna('Qué muestra').getByText('Se dibujan como Indicador')).toBeInTheDocument()
    expect(columna('Qué muestra').getByText('2 de 5')).toBeInTheDocument()
    expect(columna('Qué muestra').getByText('3 más · se dibujan de otra forma')).toBeInTheDocument()
  })

  it('las compatibles se pueden elegir', async () => {
    servir()
    montar()
    await abrirPanel()
    await abrir('Qué muestra')

    expect(columna('Qué muestra').getByRole('button', { name: /^Ventas\s*GOLD/ })).not.toBeDisabled()
  })

  it('la métrica compatible trae su procedencia · capa y fuente, en una línea', async () => {
    // Del `.pen`: «seriesMultiples · GOLD · ERP + GA4». Es lo que deja elegir
    // entre dos que sirven las dos. **La forma salió de esa línea** el
    // 2026-10-07: en la lista de compatibles todas tienen una que el tipo acepta.
    servir()
    montar()
    await abrirPanel()
    await abrir('Qué muestra')
    expect(columna('Qué muestra').getAllByText('GOLD · ERP').length).toBeGreaterThan(0)
  })

  it('cambiar el tipo cambia QUIÉN es compatible', async () => {
    // La prueba que demuestra que la lista depende del tipo y no está fija.
    // `kpi` acepta la cifra con intervalo; `gauge`, no.
    servir()
    montar()
    await abrirPanel()

    await userEvent.click((await abrir('Cómo se ve')).getByRole('button', { name: 'Medidor · El de por defecto' }))
    await abrir('Qué muestra')

    await waitFor(() =>
      expect(columna('Qué muestra').getByText('Se dibujan como Medidor')).toBeInTheDocument(),
    )
    expect(otrasFormas().getByText('Venta pronosticada')).toBeInTheDocument()
    expect(
      otrasFormas().getByText('Es Cifra con intervalo · se va a dibujar como Indicador'),
    ).toBeInTheDocument()
  })

  it('«Cómo se ve» agrupa por los tipos que dibujan la forma, nombrados como producto', async () => {
    // **Reemplaza a «el select de tipo nombra los tipos como producto»**: el
    // select se fue (D7). Con la métrica fija, los tipos posibles son los que
    // aceptan su forma —uno o dos—, y cada uno es un grupo. «Bloqueado» no:
    // acepta `*` y no dibuja nada.
    servir()
    montar()
    await abrirPanel()
    const col = await abrir('Cómo se ve')

    expect(col.getByRole('region', { name: 'Indicador' })).toBeInTheDocument()
    expect(col.getByRole('region', { name: 'Medidor' })).toBeInTheDocument()
    expect(col.queryByRole('region', { name: 'Serie temporal' })).toBeNull()
    expect(col.getByRole('button', { name: 'Indicador · El de por defecto' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('las profundidades · D6 del 2026-10-07', () => {
  it('cada fila abre su columna, la vuelve a cerrar, y «Listo» también', async () => {
    servir()
    montar()
    await abrirPanel()

    const fila = inspector().getByRole('button', { name: /^Ajustes/ })
    expect(fila).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'Ajustes' })).toBeNull()

    await userEvent.click(fila)
    expect(fila).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Ajustes' })).toBeInTheDocument()

    await userEvent.click(fila)
    expect(screen.queryByRole('region', { name: 'Ajustes' })).toBeNull()

    await abrir('Ajustes')
    await userEvent.click(columna('Ajustes').getByRole('button', { name: 'Cerrar esta columna' }))
    expect(screen.queryByRole('region', { name: 'Ajustes' })).toBeNull()
    // La primera columna sigue: «Listo» cierra UNA profundidad.
    expect(screen.getByRole('complementary', { name: INSPECTOR })).toBeInTheDocument()
  })

  it('abrir otra fila REEMPLAZA la segunda columna, no la apila', async () => {
    servir()
    montar()
    await abrirPanel()

    await abrir('Ajustes')
    await abrir('Cómo se ve')
    expect(screen.queryByRole('region', { name: 'Ajustes' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Cómo se ve' })).toBeInTheDocument()
  })

  it('«Cómo se ve» sin métrica lo dice, y ofrece ir a «Qué muestra», que DISPARA', async () => {
    servir()
    montar()
    await componer()
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Indicador' }))
    await screen.findByRole('complementary', { name: INSPECTOR })

    const col = await abrir('Cómo se ve')
    expect(col.getByText('Cómo se ve depende de qué muestra: elegí primero la métrica.')).toBeInTheDocument()
    await userEvent.click(col.getByRole('button', { name: 'Elegir qué muestra' }))
    expect(screen.getByRole('region', { name: 'Qué muestra' })).toBeInTheDocument()
  })

  it('elegir un gráfico de OTRO grupo cambia el tipo y el gráfico JUNTOS', async () => {
    // `bullet` lo dibujan `kpi` y `gauge`: el tipo no se deduce del gráfico, así
    // que el grupo donde se aprieta es el que lo decide.
    servir()
    server.use(http.get(`${API}/config/plots`, () => ok(repertorio)))
    montar()
    await abrirPanel()

    const col = await abrir('Cómo se ve')
    await userEvent.click(await col.findByRole('button', { name: 'Medidor · Bala' }))

    await waitFor(() =>
      expect(columna('Cómo se ve').getByRole('button', { name: 'Medidor · Bala' })).toHaveAttribute('aria-pressed', 'true'),
    )
    expect(columna('Cómo se ve').getByRole('button', { name: 'Indicador · Bala' })).toHaveAttribute('aria-pressed', 'false')
    // El gráfico, en la banda del lienzo y en el resumen de la primera columna.
    expect(within(panelUno()).getByText('Bala')).toBeInTheDocument()
    expect(inspector().getByText('Bala · 3 × 4')).toBeInTheDocument()
    // Y el tipo: las opciones de «Ajustes» son las del medidor.
    await abrir('Ajustes')
    expect(columna('Ajustes').getByLabelText('maximo')).toBeInTheDocument()
  })

  it('un gráfico cuyo mínimo el DATO REAL no cumple queda deshabilitado, con la razón', async () => {
    // **El tope y el mínimo se evalúan**, ya no se declaran: el preview con
    // `include=payloads` trae el dato de la métrica del panel, y con una sola
    // categoría «Columnas» no compara nada. «Lollipop» no declara mínimo.
    const pedidas: URL[] = []
    servir({ tipo: 'bars', metricId: 'm-4' })
    server.use(
      http.get(`${API}/config/plots`, () => ok(repertorio)),
      http.get(`${API}/admin/tenants/:id/roles/composition`, () =>
        ok([{ id: 'r-admin', tenant_id: 't-1', name: 'admin', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 1 }]),
      ),
      // `Preview` del cable, con `period` y `payloads` · contracts/synapse-admin-wire.yaml.
      http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
        const url = new URL(request.url)
        pedidas.push(url)
        return ok({
          layout_id: 'l-2',
          dashboard_id: 'd-1',
          status: 'draft',
          role: { id: 'r-admin', name: 'admin' },
          tabs: [
            {
              id: 'tab-a', name: 'Resumen', key: 'resumen', operational_question: '¿Cómo vamos?',
              sort_order: 1, icon: '', chat_suggestions: [],
              panels: [
                { id: 'p-1', metric_id: 'm-4', type: 'bars', col_start: 1, col_span: 4, row_span: 4, options: {}, note: '', chart: '' },
              ],
            },
          ],
          period: '2026-10',
          payloads: {
            'p-1': {
              status: 'AVAILABLE',
              value: { shape: 'categorical', items: [{ label: 'Tiendas', v: 120 }] },
              governance: { base: 'x', layer: 'GOLD', source: 'ERP', freshness: '2026-10-07T00:00:00Z', catalog_version: 1 },
            },
          },
        })
      }),
    )
    montar()
    await abrirPanel()

    const col = await abrir('Cómo se ve')
    await waitFor(() =>
      expect(col.getByText('Cada opción está dibujada con el dato de Ventas por canal.')).toBeInTheDocument(),
    )
    expect(pedidas[0]?.searchParams.get('include')).toBe('payloads')
    expect(pedidas[0]?.searchParams.get('role_id')).toBe('r-admin')

    const columnas = col.getByRole('button', { name: 'Barras · Columnas' })
    expect(columnas).toBeDisabled()
    expect(within(columnas).getByText(/una barra sola no compara nada/)).toBeInTheDocument()
    expect(col.getByRole('button', { name: 'Barras · Lollipop' })).not.toBeDisabled()
  })
})

describe('§7.2 · los spans salen de la tabla del backend', () => {
  it('el rango se muestra y acota el campo', async () => {
    servir()
    montar()
    await abrirPanel()
    const col = await abrir('Ajustes')

    expect(col.getByText(/Columnas · 3 a 4/)).toBeInTheDocument()
    const columnas = col.getByLabelText<HTMLInputElement>(/Columnas/)
    expect(columnas.min).toBe('3')
    expect(columnas.max).toBe('4')
  })

  it('la altura se pide en FILAS, no en píxeles', async () => {
    // D7 de la auditoría del 2026-10-06: `px = 96·N − 16` sigue siendo la
    // regla, pero la aplica la grilla; quien compone piensa en filas.
    servir()
    montar()
    await abrirPanel()
    const col = await abrir('Ajustes')

    expect(col.getByText(/Filas · 3 a 4/)).toBeInTheDocument()
    expect(col.getByLabelText<HTMLInputElement>(/Filas/).value).toBe('4')
    expect(screen.getByRole('region', { name: 'Ajustes' }).textContent).not.toMatch(/\bpx\b/)
    expect(screen.getByRole('complementary', { name: INSPECTOR }).textContent).not.toMatch(/\bpx\b/)
  })

  it('cambiar de tipo RECORTA el span al rango nuevo', async () => {
    // Desde el 2026-10-07 el tipo cambia al elegir una métrica de otra forma.
    servir()
    montar()
    await abrirPanel()

    await elegirDeOtraForma('Tendencia de ventas')
    const col = await abrir('Ajustes')
    await waitFor(() => expect(col.getByLabelText<HTMLInputElement>(/Columnas/).value).toBe('6'))
  })

  it('colStart NO se edita · la posición es del canvas, y se dice', async () => {
    servir()
    montar()
    await abrirPanel()
    const col = await abrir('Ajustes')

    expect(
      col.getByText('También se cambia en el lienzo, con los controles del panel elegido. La posición, arrastrándolo.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/Columna de inicio/)).toBeNull()
  })
})

describe('las opciones · dos autoridades distintas', () => {
  it('lista los params del tipo con lo que aceptan', async () => {
    // `maximum` llega en inglés del cable y el adaptador lo pasa a `maximo`;
    // los valores los describe `PARAM_SCHEMAS`, que es del front.
    servir()
    montar()
    await abrirPanel()

    await userEvent.click((await abrir('Cómo se ve')).getByRole('button', { name: 'Medidor · El de por defecto' }))
    const col = await abrir('Ajustes')
    expect(await col.findByLabelText<HTMLInputElement>('maximo')).toHaveAttribute('type', 'number')
    expect(col.getByText('Espera un número de 0 en adelante.')).toBeInTheDocument()
  })

  it('un param que el front no sabe describir se declara, no se ofrece', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.click((await abrir('Cómo se ve')).getByRole('button', { name: 'Medidor · El de por defecto' }))
    const col = await abrir('Ajustes')
    const rotulo = await col.findByText('inventado')
    expect(
      within(rotulo.parentElement as HTMLElement).getByText(
        'Esta opción todavía no se puede editar desde acá.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('inventado')).toBeNull()
  })
})

describe('agregar y quitar paneles', () => {
  it('el panel nuevo se agrega sin métrica, lo dice, y abre en «Qué muestra»', async () => {
    servir()
    montar()
    await componer()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar Indicador' }))

    // **Abre directo en «Qué muestra»**: es lo único que le falta.
    expect(
      await columna('Qué muestra').findByText('Elegí qué muestra este panel: sin métrica no se puede publicar.'),
    ).toBeInTheDocument()
    expect(inspector().getByRole('heading', { name: 'Panel sin métrica' })).toBeInTheDocument()
    expect(panelesDelLienzo()).toHaveLength(2)
    expect(within(panelesDelLienzo()[1] as HTMLElement).getByText('Sin métrica')).toBeInTheDocument()
  })

  it('elegir una métrica la marca, pasa a «Cómo se ve» Y cambia el panel del lienzo', async () => {
    // **La cadena entera**: Opcion → PanelConfigurator → Builder → borrador →
    // Canvas. Un callback mal nombrado en cualquiera de los saltos compila.
    servir()
    montar()
    await componer()
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Indicador' }))
    await screen.findByRole('region', { name: 'Qué muestra' })

    await userEvent.click(columna('Qué muestra').getByRole('button', { name: /^Ventas\s*GOLD/ }))

    // Elegido el dato, lo que sigue es cómo se ve.
    expect(await screen.findByRole('region', { name: 'Cómo se ve' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Qué muestra' })).toBeNull()
    expect(inspector().getByRole('heading', { name: 'Ventas' })).toBeInTheDocument()
    await abrir('Qué muestra')
    expect(columna('Qué muestra').getByRole('button', { name: /^Ventas\s*GOLD/ })).toHaveAttribute('aria-pressed', 'true')
    const nuevo = panelesDelLienzo()[1] as HTMLElement
    expect(within(nuevo).getByText('Ventas')).toBeInTheDocument()
    expect(within(nuevo).queryByText('Sin métrica')).toBeNull()
  })

  it('quitar el panel cierra el configurador y lo saca del lienzo', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.click(inspector().getByRole('button', { name: 'Quitar panel' }))
    await waitFor(() => expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull())
    expect(panelesDelLienzo()).toHaveLength(0)
  })

  it('quitar la PESTAÑA no deja el configurador apuntando a un hueco', async () => {
    // La selección es por índice contra el borrador vigente. Sin resolver a
    // `null`, el configurador leería `panel.tipo` de un `undefined`. Desde el
    // 2026-10-07 abrir los ajustes de una pestaña cierra el panel elegido: lo
    // que se verifica es que quitar «Resumen» no deje el configurador leyendo
    // un hueco.
    servir()
    montar()
    await abrirPanel()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar una pestaña' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Resumen' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Resumen' }))
    await userEvent.click(
      within(screen.getByRole('complementary', { name: 'Ajustes de la pestaña' })).getByRole('button', {
        name: 'Quitar Resumen',
      }),
    )

    await waitFor(() => expect(screen.queryByRole('tab', { name: 'Resumen' })).toBeNull())
    expect(screen.getByRole('tab', { name: 'Pestaña nueva' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Qué configurar' })).toBeNull()
  })
})

describe('el inspector · D1 de la auditoría del 2026-10-06', () => {
  it('no está hasta que se elige un panel, y su título es la MÉTRICA', async () => {
    servir()
    montar()
    await componer()

    expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull()
    await waitFor(() => expect(panelesDelLienzo()).toHaveLength(1))
    await userEvent.click(panelesDelLienzo()[0] as HTMLElement)
    expect(await screen.findByRole('complementary', { name: INSPECTOR })).toBeInTheDocument()
    // **El título es lo que el panel muestra**, no el bloque · 2026-10-07. Y el
    // tipo, como producto, en el renglón de abajo.
    expect(inspector().getByRole('heading', { name: 'Ventas' })).toBeInTheDocument()
    expect(inspector().getByText('Indicador · por defecto · 3 × 4')).toBeInTheDocument()
  })

  it('las tres filas dicen su valor actual sin abrirlas', async () => {
    servir()
    montar()
    await abrirPanel()

    expect(inspector().getByRole('button', { name: /^Qué muestra.*Ventas/ })).toBeInTheDocument()
    expect(inspector().getByRole('button', { name: /^Cómo se ve.*Indicador · por defecto/ })).toBeInTheDocument()
    expect(inspector().getByRole('button', { name: /^Ajustes.*3 × 4/ })).toBeInTheDocument()
  })

  it('«Cerrar» lo cierra, y el panel sigue en el lienzo', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.click(
      screen.getByRole('button', { name: 'Cerrar la configuración del panel' }),
    )
    await waitFor(() => expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull())
    expect(panelesDelLienzo()).toHaveLength(1)
  })

  it('Escape cierra de a una profundidad: primero la columna, después el inspector', async () => {
    // El foco está en un control de la configuración, no en el panel del
    // lienzo: el Escape del lienzo no lo alcanza, así que esto prueba el suyo.
    servir()
    montar()
    await abrirPanel()
    const col = await abrir('Ajustes')

    fireEvent.keyDown(col.getByLabelText(/Columnas/), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Ajustes' })).toBeNull())
    expect(screen.getByRole('complementary', { name: INSPECTOR })).toBeInTheDocument()

    fireEvent.keyDown(inspector().getByRole('button', { name: /^Ajustes/ }), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull())
  })
})

describe('§7.2 · editar las opciones del panel', () => {
  /** A `bars`, que tiene `orden` y `tope`, eligiendo una métrica por categoría. */
  async function aBarras() {
    await elegirDeOtraForma('Ventas por canal')
    return abrir('Ajustes')
  }

  it('un param de enum se elige de una lista, con «Por defecto»', async () => {
    // El vacío no es un valor: el default lo aplica el cuerpo, y escribirlo acá
    // lo congelaría el día que el cuerpo cambie de opinión.
    servir()
    montar()
    await abrirPanel()

    const col = await aBarras()
    const orden = await col.findByLabelText<HTMLSelectElement>('orden')
    expect(orden.value).toBe('')
    expect(within(orden).getByText('Por defecto')).toBeInTheDocument()

    await userEvent.selectOptions(orden, 'asc')
    expect(columna('Ajustes').getByLabelText<HTMLSelectElement>('orden').value).toBe('asc')
  })

  it('un param numérico se escribe y se manda como NÚMERO', async () => {
    servir()
    montar()
    await abrirPanel()

    const col = await aBarras()
    const tope = await col.findByLabelText<HTMLInputElement>('tope')
    expect(tope.type).toBe('number')
    expect(tope.min).toBe('1')
    expect(tope.placeholder).toBe('Por defecto')

    await userEvent.type(tope, '10')
    expect(columna('Ajustes').getByLabelText<HTMLInputElement>('tope').value).toBe('10')
  })

  it('el número escrito llega como NÚMERO al validador', async () => {
    // **La prueba que la mutación pidió.** El valor mostrado es el mismo con
    // `Number(texto)` y sin él; lo que distingue es `validateParams`, que pide
    // `typeof === 'number'`.
    servir()
    const { container } = montar()
    await abrirPanel()

    const col = await aBarras()
    await userEvent.type(await col.findByLabelText('tope'), '10')

    await waitFor(() =>
      expect(columna('Ajustes').getByLabelText<HTMLInputElement>('tope').value).toBe('10'),
    )
    expect(container.textContent).not.toMatch(/«tope» tiene el valor/)
  })

  it('un valor que el esquema no acepta se explica arriba, no se corrige solo', async () => {
    servir()
    montar()
    await abrirPanel()

    const col = await aBarras()
    // `tope` pide un entero de 1 en adelante.
    await userEvent.type(await col.findByLabelText('tope'), '0')

    // Dos veces: arriba en la primera columna —«lo que impide publicar,
    // ARRIBA» desde el 2026-10-07— y en el resumen, que es lo que bloquea
    // publicar. Las dos salen de la misma corrida.
    await waitFor(() =>
      expect(screen.getAllByText(/«tope» tiene el valor 0 y espera un número entero/)).toHaveLength(2),
    )
    expect(inspector().getByText(/«tope» tiene el valor 0/)).toBeInTheDocument()
    expect(inspector().getByText('Falta para publicar')).toBeInTheDocument()
  })

  it('un param de estructura se DECLARA, no se ofrece un textarea', async () => {
    servir()
    montar()
    await abrirPanel()

    await elegirDeOtraForma('Detalle de pedidos')
    const col = await abrir('Ajustes')
    const rotulo = await col.findByText('columnas')
    expect(
      within(rotulo.parentElement as HTMLElement).getByText(
        'Esta opción todavía no se puede editar desde acá.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('columnas')).toBeNull()
    expect(screen.queryByRole('textbox', { name: 'columnas' })).toBeNull()
  })

  it('un sí o no se ELIGE · Sí escribe true, No escribe false, Por defecto lo borra', async () => {
    // `aria-pressed` sale de `valor === true`, `=== false` y `=== undefined`,
    // estricto: si se escribiera el texto «true», ninguna quedaría marcada.
    servir()
    montar()
    await abrirPanel()
    await abrir('Ajustes')

    const porDefecto = () => columna('Ajustes').getByRole('button', { name: 'comparativo · por defecto' })
    const si = () => columna('Ajustes').getByRole('button', { name: 'comparativo · sí' })
    const no = () => columna('Ajustes').getByRole('button', { name: 'comparativo · no' })

    expect(porDefecto()).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(si())
    await waitFor(() => expect(si()).toHaveAttribute('aria-pressed', 'true'))
    expect(no()).toHaveAttribute('aria-pressed', 'false')
    expect(porDefecto()).toHaveAttribute('aria-pressed', 'false')
    // Y escribirlo ensucia el borrador: el valor llegó al borrador, no al botón.
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()
    // La fila lo cuenta sin abrirla.
    expect(inspector().getByRole('button', { name: /^Ajustes.*1 opción/ })).toBeInTheDocument()

    await userEvent.click(no())
    await waitFor(() => expect(no()).toHaveAttribute('aria-pressed', 'true'))
    expect(si()).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(porDefecto())
    await waitFor(() => expect(porDefecto()).toHaveAttribute('aria-pressed', 'true'))
    // Borrarlo devuelve el borrador a la semilla: `undefined` quita la clave.
    await waitFor(() =>
      expect(screen.queryByText(/con cambios · se guarda solo/)).toBeNull(),
    )
  })

  it('escribir una opción ensucia el borrador · borrarla vuelve a «Por defecto»', async () => {
    servir()
    montar()
    await abrirPanel()

    const col = await aBarras()
    const orden = await col.findByLabelText<HTMLSelectElement>('orden')

    await userEvent.selectOptions(orden, 'asc')
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()

    await userEvent.selectOptions(columna('Ajustes').getByLabelText('orden'), '')
    // Sigue sucio porque el TIPO y la métrica cambiaron; lo que se verifica es
    // que la opción se fue y no quedó un `opciones: {}` colgado.
    expect(columna('Ajustes').getByLabelText<HTMLSelectElement>('orden').value).toBe('')
  })
})

describe('§F4.11 · el resumen dice dónde y que NO decide', () => {
  it('nombra la pestaña y el panel, no «composición inválida»', async () => {
    // El panel llega `series` sobre una métrica de cifra única: roto.
    servir({ tipo: 'series' })
    montar()
    await abrirPanel()

    expect(await screen.findByText('Resumen · panel 1')).toBeInTheDocument()
    // La razón, en nombres de producto (D6) · en el resumen y arriba en el
    // inspector, que desde el 2026-10-07 muestra todo lo que falta.
    expect(
      screen.getAllByText('Un bloque «Serie temporal» no sabe dibujar la forma «Cifra única».').length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('declara que el servidor decide · también cuando está limpio', async () => {
    // **El caso peligroso es el limpio**: es ahí donde alguien podría leer
    // «listo para publicar». Con el resumen limpio sin pintar, lo dice el chrome.
    servir()
    montar()
    await abrirPanel()

    expect(screen.queryByText(/problemas? de composición/)).toBeNull()
    expect(screen.getByText('Para publicar, validá.')).toBeInTheDocument()
  })

  it('con problemas, el resumen dice que el servidor tiene la última palabra', async () => {
    servir({ tipo: 'series' })
    montar()
    await abrirPanel()
    expect(await screen.findByText(/El servidor tiene la última palabra/)).toBeInTheDocument()
  })

  it('publicar NO está autorizado sin veredicto del servidor', async () => {
    // «Nunca se publica algo que el front dio por bueno y el servidor no vio».
    servir()
    montar()
    await abrirPanel()

    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    expect(screen.getByText('Para publicar, validá.')).toBeInTheDocument()

    // Con cambios, primero tiene que guardarse · desde el 2026-10-07 se guarda
    // solo, y el chrome lo dice así.
    await abrir('Ajustes')
    await userEvent.click(columna('Ajustes').getByRole('button', { name: 'comparativo · sí' }))
    expect(await screen.findByText('Para publicar, esperá a que se guarde y validá.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  })

  it('«Ir al panel» lleva al panel con problemas y abre su configuración', async () => {
    servir({ tipo: 'series' })
    montar()
    await abrirPanel()

    await userEvent.click(
      screen.getByRole('button', { name: 'Cerrar la configuración del panel' }),
    )
    await waitFor(() => expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull())

    await userEvent.click(screen.getByRole('button', { name: 'Ir al panel' }))

    expect(await screen.findByRole('complementary', { name: INSPECTOR })).toBeInTheDocument()
    expect(panelesDelLienzo()[0]).toHaveAttribute('aria-selected', 'true')
  })
})

describe('el contador cuenta PESTAÑAS, no cambios ni problemas', () => {
  it('dos problemas en la misma pestaña son dos problemas y una pestaña', async () => {
    // **La prueba que la mutación pidió.** Con un problema por pestaña las dos
    // cuentas dan lo mismo.
    servir({ tipo: 'series' })
    montar()
    await abrirPanel()

    // Uno: el panel llegó roto. Dos: la pregunta operativa se borra, en los
    // ajustes de la pestaña · tocar la pestaña activa los abre (2026-10-07).
    await userEvent.click(screen.getByRole('tab', { name: 'Resumen' }))
    await userEvent.clear(await screen.findByDisplayValue('¿Cómo vamos?'))

    await waitFor(() =>
      expect(screen.getByText('2 problemas de composición')).toBeInTheDocument(),
    )
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()
  })
})

describe('con un catálogo grande · plegadas, y cada una dice qué va a pasar', () => {
  /** Treinta y cuatro métricas, como el `.pen`: «4 DE 34 MÉTRICAS DEL CATÁLOGO».
   *  Con dos métricas el plegado no se ve; con treinta, es toda la diferencia. */
  const muchas = [
    ...Array.from({ length: 4 }, (_, i) => ({
      ...metricas[0], id: `ok-${String(i)}`, key: `ok${String(i)}`, name: `Compatible ${String(i)}`,
    })),
    ...Array.from({ length: 13 }, (_, i) => ({
      ...metricas[1], id: `ts-${String(i)}`, key: `ts${String(i)}`, name: `Serie ${String(i)}`,
      shape: 'time_series',
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      ...metricas[1], id: `pr-${String(i)}`, key: `pr${String(i)}`, name: `Prosa ${String(i)}`,
      shape: 'prose',
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      ...metricas[1], id: `ta-${String(i)}`, key: `ta${String(i)}`, name: `Tabla ${String(i)}`,
      shape: 'tabular',
    })),
  ]

  it('las de otra forma van PLEGADAS, y cada una dice cómo se dibujaría', async () => {
    // **Reemplaza a «muestra seis con su razón y resume el resto por forma»** ·
    // 2026-10-07. El resumen «Y 14 más» existía porque las incompatibles eran
    // una lista para leer; ahora son opciones que se eligen, y cada una tiene
    // que decir qué pasa al elegirla.
    servir()
    server.use(http.get(`${API}/admin/tenants/:id/catalog`, () => ok(muchas)))
    montar()
    await abrirPanel()
    await abrir('Qué muestra')

    await waitFor(() => expect(columna('Qué muestra').getByText('4 de 24')).toBeInTheDocument())
    expect(columna('Qué muestra').getByText('20 más · se dibujan de otra forma')).toBeInTheDocument()
    expect(otrasFormas().getAllByText('Es Serie temporal · se va a dibujar como Serie temporal')).toHaveLength(13)
    expect(otrasFormas().getAllByText('Es Tabla · se va a dibujar como Tabla')).toHaveLength(2)
  })

  it('una forma que NINGÚN tipo dibuja se nombra con la razón, sin caja que se toque', async () => {
    // La tabla de bloques de este fixture no tiene `prose`: «el rechazo
    // explicado» sigue existiendo para lo que de verdad no se puede.
    servir()
    server.use(http.get(`${API}/admin/tenants/:id/catalog`, () => ok(muchas)))
    montar()
    await abrirPanel()
    await abrir('Qué muestra')

    expect(await otrasFormas().findAllByText('Ningún tipo dibuja la forma Texto')).toHaveLength(5)
    expect(otrasFormas().queryByRole('button', { name: /^Prosa/ })).toBeNull()
  })

  it('si NINGUNA entra en el tipo lo dice, y no deja la lista en blanco', async () => {
    servir()
    server.use(
      http.get(`${API}/admin/tenants/:id/catalog`, () =>
        ok(muchas.filter((m) => m.shape !== 'scalar')),
      ),
    )
    montar()
    await abrirPanel()
    await abrir('Qué muestra')

    expect(
      await columna('Qué muestra').findByText(/Ninguna métrica de este cliente tiene una forma que este tipo acepte/),
    ).toBeInTheDocument()
  })
})
