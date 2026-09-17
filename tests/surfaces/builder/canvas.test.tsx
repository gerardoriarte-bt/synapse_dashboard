// @vitest-environment jsdom

/** B2 · el lienzo de composición · F4.9
 *
 *  **Lo que se prueba es la INTERACCIÓN**, que es lo que `design.md` no declaraba
 *  y el `.pen` sí: qué pasa al soltar en cada uno de los tres casos, qué dice una
 *  colisión, y que el teclado no sea una puerta trasera a un estado que el
 *  arrastre no permite.
 *
 *  Las celdas del lienzo son elementos reales y cada una es su propio destino,
 *  así que soltar se prueba sobre la celda y no con matemática de píxeles — que
 *  en jsdom no existe: ahí todo mide cero.
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
const layouts = [{ ID: 'l-2', TenantID: 't-1', Status: 'draft', VersionID: 'v4', PublishedAt: null }]

const panel = (id: string, metricId: string, colStart: number, colSpan: number) => ({
  ID: id, TabID: 'tab-a', MetricID: metricId, Type: 'kpi',
  ColStart: colStart, ColSpan: colSpan, RowSpan: 4,
})

const detalle = {
  layout: layouts[0],
  tabs: [
    {
      tab: { ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
      panels: [panel('p-1', 'm-1', 1, 6), panel('p-2', 'm-2', 7, 6)],
    },
  ],
}

const metricas = [
  { id: 'm-1', tenant_id: 't-1', key: 'a', name: 'Ventas', shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP', base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1 },
  { id: 'm-2', tenant_id: 't-1', key: 'b', name: 'Doce meses', shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP', base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1 },
]

const bloques = [
  { type: 'kpi', ui_name: 'KPI', accepted_shapes: ['scalar'], col_span_min: 3, col_span_max: 8, row_span_min: 3, row_span_max: 6, layout_params: [] },
  { type: 'series', ui_name: 'Serie', accepted_shapes: ['time_series'], col_span_min: 6, col_span_max: 12, row_span_min: 4, row_span_max: 8, layout_params: [] },
]

function base(extra: Parameters<typeof server.use> = []) {
  server.use(
    ...extra,
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(layouts)),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/admin/tenants/:id/roles`, () => ok([])),
    http.get(`${API}/config/blocks`, () => ok(bloques)),
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

async function abrirCanvas() {
  await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
  await screen.findByDisplayValue('Resumen')
  await userEvent.click(screen.getByRole('button', { name: 'Canvas' }))
  await screen.findByRole('grid', { name: 'Lienzo de composición' })
}

/** Soltar sobre una celda. `dataTransfer` es un objeto mínimo: jsdom no lo trae. */
function soltarEn(col: number, fila: number, dato: string) {
  const celda = screen.getByRole('gridcell', { name: `Columna ${String(col)}, fila ${String(fila)}` })
  const dt = { getData: () => dato, setData: () => undefined, effectAllowed: '' }
  fireEvent.dragOver(celda, { dataTransfer: dt })
  fireEvent.drop(celda, { dataTransfer: dt })
}

const panelDe = (nombre: string) => screen.getByRole('gridcell', { name: new RegExp(nombre) })

describe('§7.2 · la grilla de 12 es visible, con guías', () => {
  it('pinta las doce columnas como celdas reales', async () => {
    // Las guías y los destinos de soltado son la misma cosa: así «en qué celda
    // cayó» lo contesta el navegador y no una cuenta con getBoundingClientRect.
    base()
    montar()
    await abrirCanvas()

    for (const col of [1, 6, 12]) {
      expect(
        screen.getByRole('gridcell', { name: `Columna ${String(col)}, fila 1` }),
      ).toBeInTheDocument()
    }
    expect(screen.queryByRole('gridcell', { name: 'Columna 13, fila 1' })).toBeNull()
  })

  it('declara los números con los que se compone', async () => {
    base()
    montar()
    await abrirCanvas()
    expect(screen.getByText(/Grilla 12 · columna 80 · gap 16 · fila base 80/)).toBeInTheDocument()
    expect(screen.getByText(/El alto se declara en rowSpan · nunca en píxeles/)).toBeInTheDocument()
  })

  it('cada panel dice su medida en unidades Y en píxeles', async () => {
    // `px = 96·N − 16` · la fórmula es la regla.
    base()
    montar()
    await abrirCanvas()
    expect(within(panelDe('Ventas')).getByText('6 × 4 · 368 px de alto')).toBeInTheDocument()
  })
})

describe('§7.2 · la biblioteca, agrupada', () => {
  it('lista los cinco grupos con sus tipos y sus rangos', async () => {
    base()
    montar()
    await abrirCanvas()

    const biblioteca = within(screen.getByRole('complementary', { name: 'Biblioteca de tipos' }))
    for (const g of ['Comparación', 'Composición', 'Evolución', 'Distribución', 'Estado']) {
      expect(biblioteca.getByText(g)).toBeInTheDocument()
    }
    // «bars · categorica · ranking · 4–8 ×4–5» en el `.pen`: el rango va con el tipo.
    expect(biblioteca.getByText('3–8 × 3–6')).toBeInTheDocument()
  })

  it('queda PEGADA al scroll · y no se le esconden los últimos grupos', async () => {
    // **Es de uso, no de estética.** El lienzo crece hacia abajo con cada fila;
    // al bajar a buscar un hueco la biblioteca salía de pantalla y había que
    // volver arriba, tomar el tipo y bajar arrastrando a ciegas. Reportado el
    // 2026-09-17 al usarlo.
    //
    // Las dos mitades juntas a propósito: `sticky` sin altura máxima esconde los
    // últimos de los cinco grupos, que es cambiar un problema por otro. Una
    // prueba que solo mirara `sticky` daría por buena esa mitad.
    base()
    montar()
    await abrirCanvas()

    const aside = screen.getByRole('complementary', { name: 'Biblioteca de tipos' })
    expect(aside.className).toContain('sticky')
    expect(aside.className).toContain('self-start')
    expect(aside.className).toContain('overflow-y-auto')
    expect(aside.className).toMatch(/max-h-/)
  })
})

describe('§7.2 · al soltar, los tres casos', () => {
  it('sobre celdas libres SE COLOCA · el span sale del rango del tipo', async () => {
    // «EL SPAN SE AJUSTA AL RANGO DEL TIPO» · un `series` nace de 6 y no de 3.
    base()
    montar()
    await abrirCanvas()

    soltarEn(1, 5, 'series')

    const nuevo = await screen.findByRole('gridcell', { name: /series/ })
    expect(within(nuevo).getByText('6 × 4 · 368 px de alto')).toBeInTheDocument()
  })

  it('sobre otro panel NO SE SUELTA, y dice CON CUÁL choca', async () => {
    // «SE SOLAPA CON "DOCE MESES" · NO SE PUEDE SOLTAR AQUÍ» · nombrarlo es la
    // diferencia entre «no podés» y «movete tres columnas».
    base()
    montar()
    await abrirCanvas()

    // «Ventas» está en 1–6 de la fila 1; se lo intenta llevar encima de «Doce
    // meses», que está en 7–12.
    soltarEn(8, 1, '0')

    await waitFor(() =>
      expect(within(panelDe('Ventas')).getByText('6 × 4 · 368 px de alto')).toBeInTheDocument(),
    )
    // No se movió: sigue arrancando en la columna 1.
    const celdaUno = screen.getByRole('gridcell', { name: 'Columna 1, fila 1' })
    expect(celdaUno).toBeInTheDocument()
  })

  it('un tipo que se pasa del borde de la grilla no se suelta', async () => {
    base()
    montar()
    await abrirCanvas()

    // `series` mide 6 de ancho: en la columna 10 se pasaría de la 12.
    soltarEn(10, 5, 'series')
    await waitFor(() => expect(screen.queryByRole('gridcell', { name: /series/ })).toBeNull())
  })
})

describe('§7.2 · el slot vacío es DERIVADO', () => {
  it('sale con su medida, como en el `.pen`', async () => {
    base([
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: layouts[0],
          tabs: [
            {
              tab: { ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
              panels: [panel('p-1', 'm-1', 1, 6)],
            },
          ],
        }),
      ),
    ])
    montar()
    await abrirCanvas()

    // Un panel de 6 de ancho y 4 de alto deja 7–12 libre en las cuatro filas.
    expect(await screen.findByText('Slot vacío · 6 × 4')).toBeInTheDocument()
  })
})

describe('el teclado no es un accesorio · y no es una puerta trasera', () => {
  it('las flechas mueven una columna', async () => {
    base([
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: layouts[0],
          tabs: [
            {
              tab: { ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
              panels: [panel('p-1', 'm-1', 1, 3)],
            },
          ],
        }),
      ),
    ])
    montar()
    await abrirCanvas()

    const p = panelDe('Ventas')
    await userEvent.click(p)
    fireEvent.keyDown(p, { key: 'ArrowRight' })

    await waitFor(() =>
      expect(panelDe('Ventas').style.gridColumn).toBe('2 / span 3'),
    )
  })

  it('shift + flechas redimensiona, acotado al rango del TIPO', async () => {
    // Un `kpi` va de 3 a 8 columnas. Apretar de más no lo pasa de 8.
    base([
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: layouts[0],
          tabs: [
            {
              tab: { ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
              panels: [panel('p-1', 'm-1', 1, 3)],
            },
          ],
        }),
      ),
    ])
    montar()
    await abrirCanvas()

    const p = panelDe('Ventas')
    await userEvent.click(p)
    for (let i = 0; i < 10; i++) fireEvent.keyDown(panelDe('Ventas'), { key: 'ArrowRight', shiftKey: true })

    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 8'))
  })

  it('NO alcanza un estado que el arrastre no permite', async () => {
    // «Ventas» en 1–6 y «Doce meses» en 7–12: moverlo a la derecha lo pondría
    // encima. Con el mouse no se puede; con el teclado tampoco.
    base()
    montar()
    await abrirCanvas()

    const p = panelDe('Ventas')
    await userEvent.click(p)
    fireEvent.keyDown(p, { key: 'ArrowRight' })

    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 6'))
  })

  it('Escape deselecciona', async () => {
    base()
    montar()
    await abrirCanvas()

    const p = panelDe('Ventas')
    await userEvent.click(p)
    expect(panelDe('Ventas')).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(panelDe('Ventas'), { key: 'Escape' })
    await waitFor(() => expect(panelDe('Ventas')).toHaveAttribute('aria-selected', 'false'))
  })
})

describe('los handles del panel seleccionado', () => {
  it('aparecen solo al seleccionarlo y redimensionan de a una celda', async () => {
    base([
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: layouts[0],
          tabs: [
            {
              tab: { ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
              panels: [panel('p-1', 'm-1', 1, 3)],
            },
          ],
        }),
      ),
    ])
    montar()
    await abrirCanvas()

    expect(screen.queryByRole('button', { name: 'Ensanchar' })).toBeNull()

    await userEvent.click(panelDe('Ventas'))
    await userEvent.click(screen.getByRole('button', { name: 'Ensanchar' }))

    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 4'))
  })
})

describe('el canvas compone UNA pestaña', () => {
  it('ofrece elegir cuál, y el chrome la dice', async () => {
    // Un lienzo con los paneles de las cuatro pestañas encimados no es una
    // composición, es una superposición.
    base()
    montar()
    await abrirCanvas()

    expect(screen.getByLabelText('Componiendo')).toBeInTheDocument()
    const cabecera = within(screen.getByRole('banner'))
    expect(cabecera.getByText('Resumen')).toBeInTheDocument()
  })
})

describe('«Span al soltar» · lo que va a ocupar, antes de soltar', () => {
  /** Arrastrar un tipo desde la biblioteca y entrar en una celda. */
  async function arrastrarTipoHasta(tipo: string, col: number, fila: number) {
    const item = within(screen.getByRole('complementary', { name: 'Biblioteca de tipos' })).getByText(
      tipo,
    ).closest('li')
    const dt = { getData: () => tipo, setData: () => undefined, effectAllowed: '' }
    fireEvent.dragStart(item as HTMLElement, { dataTransfer: dt })
    fireEvent.dragEnter(
      screen.getByRole('gridcell', { name: `Columna ${String(col)}, fila ${String(fila)}` }),
      { dataTransfer: dt },
    )
  }

  it('los huecos dicen en cuáles ENTRA, antes de mover el cursor', async () => {
    // **Dos preguntas distintas.** El rectángulo de «span al soltar» contesta
    // «¿entra ACÁ?», y para eso hay que pasar por encima de cada celda. Con el
    // lienzo largo eso es buscar a ojo — reportado el 2026-09-17 al usarlo.
    //
    // Esto contesta «¿DÓNDE entra?». **No mueve nada de nadie**: §7.2 dice «no
    // se permite soltar encima», no «se reacomoda», y resaltar destinos no es
    // reacomodar.
    // Con UN panel de 6 · deja 7–12 libre en las cuatro filas. El fixture por
    // defecto llena las doce columnas y no tiene huecos que marcar.
    base([
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: layouts[0],
          tabs: [
            {
              tab: { ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
              panels: [panel('p-1', 'm-1', 1, 6)],
            },
          ],
        }),
      ),
    ])
    montar()
    await abrirCanvas()

    // Antes de arrastrar, un hueco es un hueco.
    expect(screen.getAllByText(/Slot vacío/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Entra acá/)).not.toBeInTheDocument()

    await arrastrarTipoHasta('kpi', 1, 5)
    expect(screen.getAllByText(/Entra acá/).length).toBeGreaterThan(0)
  })

  it('un hueco ANCHO y BAJO no se marca · el rectángulo tiene que caber entero', async () => {
    // **El caso que separa «cabe» de «hay lugar».** Un panel de 6 de ancho y 4
    // de alto, y otro de 6 × 2 al lado, dejan un hueco de **6 × 2** — doce
    // celdas libres, igual que las doce que un `kpi` de 3 × 4 necesita.
    //
    // Comparar áreas lo daría por bueno. Mirar solo el ancho, también. Las dos
    // marcarían un destino donde al soltar sale el aviso de colisión, que es
    // peor que no marcarlo: prometer un lugar y negarlo al llegar.
    base([
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: layouts[0],
          tabs: [
            {
              tab: { ID: 'tab-a', LayoutVersionID: 'l-2', Name: 'Resumen', OperationalQuestion: '¿?', SortOrder: 1, RoleIDs: [] },
              panels: [
                panel('p-1', 'm-1', 1, 6),
                { ...panel('p-2', 'm-2', 7, 6), RowSpan: 2 },
              ],
            },
          ],
        }),
      ),
    ])
    montar()
    await abrirCanvas()

    // El hueco existe y mide 6 × 2.
    expect(screen.getByText('Slot vacío · 6 × 2')).toBeInTheDocument()

    await arrastrarTipoHasta('kpi', 1, 5)
    // Un `kpi` mide 3 × 4: entra en ancho, no en alto. No se marca.
    expect(screen.queryByText(/Entra acá/)).not.toBeInTheDocument()
  })

  it('dibuja el rectángulo con el tipo y su medida', async () => {
    // Sin esto hay que soltar para saber si entraba, que es lo contrario de
    // «fácil y clara».
    base()
    montar()
    await abrirCanvas()

    await arrastrarTipoHasta('series', 1, 6)
    expect(await screen.findByText('series · 6 × 4')).toBeInTheDocument()
  })

  it('cuando NO entra, dice por qué en el mismo lugar', async () => {
    base()
    montar()
    await abrirCanvas()

    // `series` mide 6: en la columna 10 se pasa del borde.
    await arrastrarTipoHasta('series', 10, 6)
    expect(await screen.findByText(/se pasa del borde de la grilla/)).toBeInTheDocument()
  })

  it('sobre un panel ocupado, nombra con cuál choca', async () => {
    base()
    montar()
    await abrirCanvas()

    // «Doce meses» ocupa 7–12 de la fila 1.
    await arrastrarTipoHasta('kpi', 8, 1)
    expect(await screen.findByText(/Se solapa con «Doce meses»/)).toBeInTheDocument()
  })
})
