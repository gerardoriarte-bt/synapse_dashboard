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
import { nombreDeTipo } from '@/surfaces/builder/rotulos'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]
const layouts = [
  { id: 'l-2', tenant_id: 't-1', dashboard_id: 'd-1', status: 'draft', version_id: 'v4', published_at: null },
]

/** `GET /admin/tenants/{tenantId}/dashboards` · `LayoutDashboard` del cable.
 *  Desde el 2026-10-07 el builder entra por acá: Cliente → Dashboard → Editor. */
const dashboards = [
  { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
]

const panel = (id: string, metricId: string, colStart: number, colSpan: number) => ({
  id: id, tab_id: 'tab-a', metric_id: metricId, type: 'kpi',
  col_start: colStart, col_span: colSpan, row_span: 4,
})

const detalle = {
  layout: layouts[0],
  tabs: [
    {
      tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿?', sort_order: 1, role_ids: [] },
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

/** Un payload del cable de consola, forma capturada contra `7b717aa` el
 *  2026-10-07 · valores sintéticos. */
const disponible = (v: number) => ({
  status: 'AVAILABLE',
  value: { shape: 'scalar', v },
  governance: {
    base: 'x', layer: 'GOLD', source: 'ERP', freshness: '2026-10-07T00:00:00Z',
    catalog_version: 1, measurement_window: 'Mes calendario seleccionado',
  },
})

/** **El preview con datos**, que el lienzo pide desde el 2026-10-07 · forma de
 *  `Preview` en `synapse-admin-wire.yaml`. Se registra lo pedido. */
const pedidosDePreview: URL[] = []
const preview = (payloads: Record<string, unknown>) =>
  http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
    pedidosDePreview.push(new URL(request.url))
    return ok({
      layout_id: 'l-2', dashboard_id: 'd-1', status: 'draft',
      role: { id: 'r-admin', name: 'admin' },
      tabs: [{
        id: 'tab-a', name: 'Resumen', key: 'resumen', operational_question: '¿?', sort_order: 1, icon: '', chat_suggestions: [],
        panels: detalle.tabs[0]?.panels.map((x) => ({ ...x, options: {}, note: '', chart: '' })) ?? [],
      }],
      period: '2026-10',
      payloads,
    })
  })

/** Roles del cable · `RoleComposition`. Con `admin` el lienzo tiene lente. */
const rolesConAdmin = [
  { id: 'r-admin', tenant_id: 't-1', name: 'admin', tab_ids: [], tab_keys: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 1 },
  { id: 'r-pla', tenant_id: 't-1', name: 'Planner', tab_ids: [], tab_keys: [], hidden_metric_ids: ['m-2'], layout_overrides: {}, user_count: 2 },
]

function base(extra: Parameters<typeof server.use> = []) {
  server.use(
    ...extra,
    preview({ 'p-1': disponible(48362), 'p-2': disponible(1234) }),
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(layouts)),
    http.get(`${API}/admin/tenants/:id/dashboards`, () => ok(dashboards)),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
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

/** El camino de 2026-10-07 · el dashboard en el paso 1 y «Abrir el editor» en
 *  el 3. Con un borrador del dashboard, abrir lo abre: no crea nada. */
async function abrirCanvas() {
  await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
  await userEvent.click(await screen.findByRole('button', { name: 'Abrir el editor de Overview' }))
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

  it('NO le habla del handoff a quien compone · las reglas de grilla se fueron', async () => {
    // **Reemplaza a «declara los números con los que se compone»** · D7 de la
    // auditoría del 2026-10-06: «GRILLA 12 · COLUMNA 80 · GAP 16» y «EL ALTO SE
    // DECLARA EN rowSpan» son literales del `.pen` para quien implementa, y
    // `rowSpan` es un nombre de campo. La grilla sigue siendo la regla; la
    // aplica el lienzo, no la lee el usuario.
    base()
    montar()
    await abrirCanvas()
    expect(screen.queryByText(/Grilla 12 · columna 80/)).toBeNull()
    expect(screen.queryByText(/rowSpan/)).toBeNull()
  })

  it('cada panel dice su medida en columnas y filas · sin píxeles', async () => {
    // **Reemplaza a «cada panel dice su medida en unidades Y en píxeles»** · D7
    // de la auditoría del 2026-10-06: `px = 96·N − 16` sigue mandando, pero la
    // aplica la grilla; quien compone ajusta en las mismas unidades que pide el
    // inspector.
    base()
    montar()
    await abrirCanvas()
    // **La ficha ahora es una banda** sobre el panel dibujado · 2026-10-07.
    expect(within(panelDe('Ventas')).getByText('6 × 4')).toBeInTheDocument()
    expect(panelDe('Ventas').textContent).not.toMatch(/px/)
  })
})

describe('el lienzo anuncia sus gestos · 2026-09-17', () => {
  it('dice que se arrastra para mover · la capacidad estaba y no se veía', async () => {
    // **El defecto no era la capacidad: era que nada la anunciaba.** El panel es
    // `draggable` desde F4.9 y mover funciona —verificado en el navegador—, pero
    // `cursor: grab` solo aparece al pasar por encima y el `.pen` dibuja
    // «ARRASTRAR AL LIENZO» para la biblioteca y nada para el lienzo. Quien
    // compone concluye que no se puede.
    base()
    montar()
    await abrirCanvas()

    // **Una sola frase desde el 2026-10-06** (D7): las reglas de la grilla se
    // fueron y quedaron los gestos, que es lo que quien compone necesita.
    const ayuda = screen.getByText(/Arrastrá un tipo de la biblioteca a un espacio libre/)
    expect(ayuda.textContent).toMatch(/arrastralo para moverlo, o usá las flechas/)
    // La otra mitad del gesto, y son distintas: mover y cambiar el tamaño ·
    // propuesta del canvas, punto 1.
    expect(ayuda.textContent).toMatch(/con Shift y las flechas cambiás su tamaño/)
  })

  it('y el panel sigue siendo arrastrable · el rótulo no reemplaza al gesto', async () => {
    // Un rótulo que anuncia algo que no funciona es peor que no anunciarlo.
    base()
    montar()
    await abrirCanvas()

    const panel = screen.getByRole('gridcell', { name: /Ventas/ })
    expect(panel).toHaveAttribute('draggable', 'true')
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
    // «bars · categorica · ranking · 4–8 ×4–5» en el `.pen`: el rango va con el
    // tipo. Desde el 2026-10-06 dice en qué unidad (D7).
    expect(biblioteca.getByText('3–8 col × 3–6 filas')).toBeInTheDocument()
    expect(biblioteca.getByText('6–12 col × 4–8 filas')).toBeInTheDocument()
  })

  it('nombra los tipos y las formas como PRODUCTO, no por su id · D6', async () => {
    // «Definirlo» · D6 de la auditoría del 2026-10-06. `kpi` y `escalar` son
    // del contrato; quien compone lee «Indicador» y «Cifra única».
    base()
    montar()
    await abrirCanvas()

    const biblioteca = within(screen.getByRole('complementary', { name: 'Biblioteca de tipos' }))
    expect(biblioteca.getByText('Indicador')).toBeInTheDocument()
    expect(biblioteca.getByText('Cifra única')).toBeInTheDocument()
    for (const id of ['kpi', 'series', 'escalar', 'serieTemporal']) {
      expect(biblioteca.queryByText(id)).toBeNull()
    }
    // Y el lienzo, igual.
    expect(within(panelDe('Ventas')).getByText('Indicador')).toBeInTheDocument()
    expect(within(panelDe('Ventas')).queryByText('kpi')).toBeNull()
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

    const nuevo = await screen.findByRole('gridcell', { name: /Sin métrica/ })
    expect(within(nuevo).getByText('6 × 4')).toBeInTheDocument()
    expect(nuevo.style.gridColumn).toBe('1 / span 6')
  })

  it('el panel soltado QUEDA ELEGIDO y abre su configuración', async () => {
    // Soltar y después tener que buscarlo para elegirle la métrica era un paso
    // de más: lo primero que pide un panel nuevo es su métrica.
    base()
    montar()
    await abrirCanvas()

    soltarEn(1, 5, 'series')

    const nuevo = await screen.findByRole('gridcell', { name: /Sin métrica/ })
    expect(nuevo).toHaveAttribute('aria-selected', 'true')
    const inspector = await screen.findByRole('complementary', { name: 'Configuración del panel' })
    // **Desde el 2026-10-07 el tipo se lee en «Cómo se ve»**, y un panel nuevo
    // abre directo en «Qué muestra», que es lo único que le falta.
    expect(within(inspector).getByRole('button', { name: /Cómo se ve/ })).toHaveTextContent(
      `${nombreDeTipo('series')} · por defecto`,
    )
    expect(screen.getByRole('region', { name: 'Qué muestra' })).toBeInTheDocument()
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

    // No se movió: sigue arrancando en la columna 1, con su medida.
    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 6'))
    expect(within(panelDe('Ventas')).getByText('6 × 4')).toBeInTheDocument()
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
              tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿?', sort_order: 1, role_ids: [] },
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
              tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿?', sort_order: 1, role_ids: [] },
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
              tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿?', sort_order: 1, role_ids: [] },
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
              tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿?', sort_order: 1, role_ids: [] },
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

  it('los cuatro disparan, cada uno sobre su eje y en su sentido', async () => {
    // **Un botón muerto se ve igual que uno que funciona.** Desde el 2026-10-06
    // son dos grupos «Ancho − +» y «Alto − +»: se verifica que cada uno mueva
    // el eje que nombra, en el sentido que nombra. `kpi` va de 3 a 8 columnas y
    // de 3 a 6 filas; arranca en 4 × 4 para que los cuatro tengan lugar.
    base([
      http.get(`${API}/admin/layouts/:id`, () =>
        ok({
          layout: layouts[0],
          tabs: [
            {
              tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿?', sort_order: 1, role_ids: [] },
              panels: [panel('p-1', 'm-1', 1, 4)],
            },
          ],
        }),
      ),
    ])
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))

    await userEvent.click(screen.getByRole('button', { name: 'Ensanchar' }))
    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 5'))
    expect(panelDe('Ventas').style.gridRow).toBe('1 / span 4')

    await userEvent.click(screen.getByRole('button', { name: 'Angostar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Angostar' }))
    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 3'))
    expect(panelDe('Ventas').style.gridRow).toBe('1 / span 4')

    await userEvent.click(screen.getByRole('button', { name: 'Agrandar' }))
    await waitFor(() => expect(panelDe('Ventas').style.gridRow).toBe('1 / span 5'))
    expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 3')

    await userEvent.click(screen.getByRole('button', { name: 'Achicar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Achicar' }))
    await waitFor(() => expect(panelDe('Ventas').style.gridRow).toBe('1 / span 3'))
    expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 3')
  })
})

describe('el «+» de la biblioteca · agregar sin arrastrar', () => {
  it('agrega el tipo AL FINAL de la pestaña y lo deja elegido', async () => {
    // La salida para el teclado y para quien no descubre el gesto. Se verifica
    // que el panel llegue al lienzo con el ancho de su tipo y que quede elegido,
    // no que el botón exista.
    base()
    montar()
    await abrirCanvas()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar Serie temporal' }))

    const nuevo = await screen.findByRole('gridcell', { name: /Sin métrica/ })
    // Al final: debajo de los dos que llenan la fila 1, con el mínimo del tipo.
    expect(nuevo.style.gridColumn).toBe('1 / span 6')
    expect(nuevo.style.gridRow).toBe('5 / span 4')
    expect(nuevo).toHaveAttribute('aria-selected', 'true')
    expect(within(nuevo).getByText('Serie temporal')).toBeInTheDocument()
    expect(
      await screen.findByRole('complementary', { name: 'Configuración del panel' }),
    ).toBeInTheDocument()
  })
})

describe('el canvas compone UNA pestaña', () => {
  it('ofrece elegir cuál, y la dice UNA vez', async () => {
    // Un lienzo con los paneles de las cuatro pestañas encimados no es una
    // composición, es una superposición.
    //
    // **El chrome ya no la repite** · §2.2 de la auditoría del 2026-10-06: la
    // pestaña estaba como texto en el chrome y como selector en el cuerpo, uno
    // que se tocaba y otro que no. Queda el selector — desde el 2026-10-07 son
    // pestañas de verdad (`role="tab"`) y no el `<select>` «Componiendo».
    base()
    montar()
    await abrirCanvas()

    const pestanas = screen.getByRole('tablist', { name: 'Pestañas del dashboard' })
    expect(within(pestanas).getByRole('tab', { name: 'Resumen' })).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('banner')).queryByText('Resumen')).toBeNull()
  })
})

describe('«Span al soltar» · lo que va a ocupar, antes de soltar', () => {
  /** Arrastrar un tipo desde la biblioteca y entrar en una celda. */
  async function arrastrarTipoHasta(tipo: string, col: number, fila: number) {
    // Por el «+» de su ítem, que lleva el nombre de producto: el texto suelto
    // no alcanza, porque «Serie temporal» es a la vez un tipo y una forma.
    const item = within(screen.getByRole('complementary', { name: 'Biblioteca de tipos' }))
      .getByRole('button', { name: `Agregar ${nombreDeTipo(tipo)}` })
      .closest('li')
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
              tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿?', sort_order: 1, role_ids: [] },
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
              tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿?', sort_order: 1, role_ids: [] },
              panels: [
                panel('p-1', 'm-1', 1, 6),
                { ...panel('p-2', 'm-2', 7, 6), row_span: 2 },
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
    // El tipo, con su nombre de producto (D6).
    expect(await screen.findByText('Serie temporal · 6 × 4')).toBeInTheDocument()
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

/** ── EL LIENZO DIBUJA CON DATO · D1 del 2026-10-07 ─────────────────────────
 *
 *  «No hay una previsualización del gráfico, entonces es como construir de
 *  memoria.» Ver `docs/AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`.
 */
describe('el lienzo dibuja cada panel con su dato', () => {
  it('pide el preview CON DATOS, con el lente admin cuando no hay rol elegido', async () => {
    pedidosDePreview.length = 0
    base([http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(rolesConAdmin))])
    montar()
    await abrirCanvas()
    await waitFor(() => expect(pedidosDePreview.length).toBeGreaterThan(0))
    expect(pedidosDePreview[0]?.searchParams.get('include')).toBe('payloads')
    expect(pedidosDePreview[0]?.searchParams.get('role_id')).toBe('r-admin')
  })

  it('cada panel muestra SU cifra, del servidor', async () => {
    base([http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(rolesConAdmin))])
    montar()
    await abrirCanvas()
    expect(await within(panelDe('Ventas')).findByText(/48[.,]362/)).toBeInTheDocument()
    expect(within(panelDe('Doce meses')).getByText(/1[.,]234/)).toBeInTheDocument()
  })

  it('un panel cuya métrica no está en el preview dice que se dibuja al guardar · no inventa', async () => {
    base([
      http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(rolesConAdmin)),
      preview({ 'p-1': disponible(48362) }),
    ])
    montar()
    await abrirCanvas()
    await within(panelDe('Ventas')).findByText(/48[.,]362/)
    expect(within(panelDe('Doce meses')).getByText('Se dibuja al guardar.')).toBeInTheDocument()
  })

  it('con un rol elegido, lo que ese rol no ve lo DICE en el lienzo', async () => {
    base([http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(rolesConAdmin))])
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Planner' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Abrir el editor de Overview' }))
    expect(
      await within(panelDe('Doce meses')).findByText('Planner no ve esta métrica: la tiene oculta.'),
    ).toBeInTheDocument()
  })

  it('sin roles NO promete un dato que no se puede pedir', async () => {
    // La ruta exige `role_id`: sin roles, «Trayendo el dato…» quedaría para
    // siempre.
    base()
    montar()
    await abrirCanvas()
    expect(
      await within(panelDe('Ventas')).findByText('Este cliente todavía no tiene roles, y el dato se pide como lo ve un rol.'),
    ).toBeInTheDocument()
  })

  it('un panel NUEVO con una métrica que ya está en el lienzo se dibuja SIN esperar al guardado', async () => {
    // **El dato es por métrica y período**, no por panel —`dd_panel_data`—: el
    // de «Ventas» ya llegó con el preview, y sirve igual para el panel nuevo.
    base([http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(rolesConAdmin))])
    montar()
    await abrirCanvas()
    await within(panelDe('Ventas')).findByText(/48[.,]362/)

    await userEvent.click(screen.getByRole('button', { name: `Agregar ${nombreDeTipo('kpi')}` }))
    const columna = await screen.findByRole('region', { name: 'Qué muestra' })
    await userEvent.click(within(columna).getByRole('button', { name: /Ventas/ }))

    // Dos cifras iguales: el panel de antes y el nuevo, que no tiene id todavía.
    // En el LIENZO: «Cómo se ve» se abre sola y dibuja su muestra con la misma
    // cifra.
    const lienzo = screen.getByRole('grid', { name: 'Lienzo de composición' })
    expect(within(lienzo).getAllByText(/48[.,]362/)).toHaveLength(2)
    expect(screen.queryByText('Se dibuja al guardar.')).toBeNull()
  })

  it('guardar vuelve a pedir el dato · el preview quedó viejo', async () => {
    // Un panel nuevo o una métrica cambiada se ven recién cuando el preview se
    // vuelve a leer: sin invalidarlo, «se dibuja al guardar» no se cumpliría.
    pedidosDePreview.length = 0
    base([
      http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(rolesConAdmin)),
      http.put(`${API}/admin/layouts/:id`, () => ok(detalle)),
    ])
    montar()
    await abrirCanvas()
    await within(panelDe('Ventas')).findByText(/48[.,]362/)
    const antes = pedidosDePreview.length

    await userEvent.click(screen.getByRole('button', { name: `Agregar ${nombreDeTipo('kpi')}` }))
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(pedidosDePreview.length).toBeGreaterThan(antes))
  })

  it('las filas miden lo de la consola · 80 y 16, no 96 más 16', () => {
    // **Contaba la separación dos veces**: filas de 96 más 16, y un panel de
    // 4 filas medía 432 en vez de los 368 de `96·N − 16`. Con el panel real
    // adentro quedaba un hueco abajo — visto en pantalla el 2026-10-07.
    base()
    montar()
    return abrirCanvas().then(() => {
      const lienzo = screen.getByRole('grid', { name: 'Lienzo de composición' })
      expect(lienzo.style.gridAutoRows).toBe('80px')
      expect(lienzo.style.gap).toBe('16px')
    })
  })
})
