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
import { createEvent, fireEvent } from '@testing-library/dom'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { nombreDeTipo } from '@/surfaces/builder/rotulos'
import { FORMATO_ELECCION } from '@/surfaces/builder/eleccion'
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
  // **Una serie, que no está en el lienzo** · 2026-11-10: desde que la
  // biblioteca es de datos, para arrastrar una «Serie temporal» hace falta un
  // dato que se dibuje así.
  { id: 'm-3', tenant_id: 't-1', key: 'c', name: 'Tendencia', shape: 'time_series', family: 'media', layer: 'GOLD', source: 'Ads', base: 'y', min_grain: 'day', dimensions: [], catalog_version: 1 },
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

/** **La biblioteca es de datos** · 2026-11-10: se abre un dato y aparece cómo
 *  se puede mostrar. Devuelve ese grupo. */
async function abrirDato(nombre: string) {
  const biblioteca = within(screen.getByRole('complementary', { name: 'Datos del cliente' }))
  await userEvent.click(biblioteca.getByRole('button', { name: new RegExp(`^${nombre}`) }))
  return within(biblioteca.getByRole('group', { name: `Cómo mostrar ${nombre}` }))
}

/** Un dato de cada tipo, para las pruebas que arrastran un tipo. */
const DATO_DE: Record<string, string> = { kpi: 'Ventas', series: 'Tendencia' }

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
    // «un dato» desde el 2026-11-10: la biblioteca es de datos.
    const ayuda = screen.getByText(/Arrastrá un dato de la biblioteca a un espacio libre/)
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

describe('la biblioteca es de DATOS · decisión humana del 2026-11-10', () => {
  /** «Se centra en un gráfico y no en los datos que se quieren transmitir.» Lo
   *  primero que se elige es qué se muestra; el cómo sale del dato. */
  it('lista los datos del cliente agrupados por familia, con su forma', async () => {
    base()
    montar()
    await abrirCanvas()

    const biblioteca = within(screen.getByRole('complementary', { name: 'Datos del cliente' }))
    expect(biblioteca.getByText('Demanda')).toBeInTheDocument()
    expect(biblioteca.getByText('Medios')).toBeInTheDocument()
    expect(biblioteca.getByRole('button', { name: /^Ventas/ })).toBeInTheDocument()
    expect(biblioteca.getByRole('button', { name: /^Tendencia/ })).toBeInTheDocument()
    // La forma, en producto y no por su id · D6.
    expect(within(biblioteca.getByRole('button', { name: /^Ventas/ })).getByText('Cifra única')).toBeInTheDocument()
    // Ya no es la biblioteca de tipos.
    expect(screen.queryByRole('complementary', { name: 'Biblioteca de tipos' })).toBeNull()
  })

  it('al abrir un dato muestra cómo se puede mostrar · y lo que no sirve, desactivado con su razón', async () => {
    base()
    montar()
    await abrirCanvas()

    const como = await abrirDato('Ventas')
    // Lo que sirve, con su «+».
    expect(como.getByText('Indicador')).toBeInTheDocument()
    expect(como.getByRole('button', { name: 'Agregar Ventas como Indicador · el de por defecto' })).toBeInTheDocument()
    // Lo que no, explicado y sin «+»: una cifra sola no es una serie.
    expect(como.getByText('Dibuja Serie temporal · este dato es Cifra única')).toBeInTheDocument()
    expect(como.queryByRole('button', { name: /como Serie temporal/ })).toBeNull()
  })

  it('el buscador filtra por nombre, y dice cuando no hay', async () => {
    base()
    montar()
    await abrirCanvas()

    const biblioteca = within(screen.getByRole('complementary', { name: 'Datos del cliente' }))
    await userEvent.type(biblioteca.getByRole('searchbox', { name: 'Buscar un dato' }), 'tend')
    expect(biblioteca.getByRole('button', { name: /^Tendencia/ })).toBeInTheDocument()
    expect(biblioteca.queryByRole('button', { name: /^Ventas/ })).toBeNull()

    await userEvent.type(biblioteca.getByRole('searchbox', { name: 'Buscar un dato' }), 'zzz')
    expect(biblioteca.getByText('Ningún dato se llama «tendzzz».')).toBeInTheDocument()
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

    const aside = screen.getByRole('complementary', { name: 'Datos del cliente' })
    expect(aside.className).toContain('sticky')
    expect(aside.className).toContain('self-start')
    expect(aside.className).toContain('overflow-y-auto')
    expect(aside.className).toMatch(/max-h-/)
    // **Y debajo de la cabecera, que también es fija** · 2026-11-10. Se pegaba a
    // `top-6` y la cabecera, de 177 px, le tapaba el principio: «no puedo ver el
    // principio del scroll izquierdo». El tope y el alto salen de su altura real.
    expect(aside.className).toMatch(/top-\[calc\(var\(--alto-cabecera-builder/)
    expect(aside.className).toMatch(/max-h-\[calc\(100vh-var\(--alto-cabecera-builder/)
  })
})

/** ── EL DATO DE TODO EL CATÁLOGO · `a80c318`, 2026-11-10 ───────────────────
 *
 *  `GET /admin/tenants/{tenantId}/catalog/data?period=…` · forma de
 *  `DatoDelCatalogo` en `synapse-admin-wire.yaml`, medida ese día contra
 *  `4953411`: una entrada por métrica, con el payload del lote. */
const datoDelCatalogo = (porMetrica: Record<string, unknown>) => [
  // **Con roles**: el período sale del dato del lienzo, que se pide con el
  // lente de un rol. Sin roles no hay dato del lienzo, y no se sabe el mes.
  http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(rolesConAdmin)),
  http.get(`${API}/admin/tenants/:id/catalog/data`, ({ request }) => {
    pedidosDelCatalogo.push(new URL(request.url))
    return ok({
      period: new URL(request.url).searchParams.get('period'),
      metrics: Object.entries(porMetrica).map(([id, p]) => ({ metric_id: id, key: `clave-${id}`, ...(p as object) })),
    })
  }),
]
const pedidosDelCatalogo: URL[] = []
const sinCifra = { status: 'BLOCKED', reason: 'No hay datos calculados para este período', unlocks_with: '' }

describe('la biblioteca sabe qué dato tiene cada métrica · a80c318', () => {
  /** El rótulo de un dato de la lista: nombre y forma. */
  const itemDe = (nombre: string) =>
    within(screen.getByRole('complementary', { name: 'Datos del cliente' })).getByRole('button', {
      name: new RegExp(`^${nombre}`),
    })

  it('lo pide con el período del lienzo · la lista y los paneles hablan del mismo mes', async () => {
    pedidosDelCatalogo.length = 0
    base([...datoDelCatalogo({ 'm-1': disponible(48362), 'm-2': sinCifra, 'm-3': sinCifra })])
    montar()
    await abrirCanvas()

    await waitFor(() => expect(pedidosDelCatalogo.length).toBeGreaterThan(0))
    // El preview de este archivo contesta `period: '2026-10'`.
    expect(pedidosDelCatalogo[0]?.searchParams.get('period')).toBe('2026-10')
    expect(pedidosDelCatalogo[0]?.pathname).toMatch(/\/admin\/tenants\/t-1\/catalog\/data$/)
  })

  it('marca «Sin cifra» sólo en las que no tienen, y dice de qué mes es el estado', async () => {
    base([...datoDelCatalogo({ 'm-1': disponible(48362), 'm-2': sinCifra, 'm-3': sinCifra })])
    montar()
    await abrirCanvas()

    await waitFor(() => expect(itemDe('Doce meses')).toHaveTextContent('Sin cifra'))
    expect(itemDe('Ventas')).not.toHaveTextContent('Sin cifra')
    expect(screen.getByText(/El estado de cada dato es el de .*2026/)).toBeInTheDocument()
  })

  it('una métrica FUERA del lienzo ya se elige con su dato · no «por su forma»', async () => {
    // «Tendencia» no está en ningún panel: hasta `a80c318` no había cómo saber
    // su dato, y la biblioteca lo decía.
    const serie = {
      status: 'AVAILABLE',
      value: { shape: 'time_series', points: [{ t: '2026-10-01', v: 1 }, { t: '2026-10-02', v: 2 }] },
      governance: disponible(0).governance,
    }
    base([...datoDelCatalogo({ 'm-1': disponible(48362), 'm-2': disponible(1), 'm-3': serie })])
    montar()
    await abrirCanvas()

    await waitFor(() => expect(screen.getByText(/El estado de cada dato/)).toBeInTheDocument())
    const como = await abrirDato('Tendencia')
    expect(como.queryByText(/Sin el dato a mano/)).toBeNull()
  })

  it('sin cifra, al abrirlo dice por qué con las palabras del servicio, y que se puede poner igual', async () => {
    base([...datoDelCatalogo({ 'm-1': disponible(48362), 'm-2': sinCifra, 'm-3': sinCifra })])
    montar()
    await abrirCanvas()
    await waitFor(() => expect(itemDe('Doce meses')).toHaveTextContent('Sin cifra'))

    const como = await abrirDato('Tendencia')
    expect(como.getByText(/^No hay datos calculados para este período\. Se puede poner igual/)).toBeInTheDocument()
    // **Sin cifra no es desactivado**: la opción se sigue pudiendo agregar.
    expect(como.getByRole('button', { name: /^Agregar Tendencia como/ })).toBeInTheDocument()
  })

  it('si NINGUNO tiene cifra, lo dice una vez arriba y no marca cada uno', async () => {
    // Visto en local: el mes en curso sin dato marcaba los 33.
    base([...datoDelCatalogo({ 'm-1': sinCifra, 'm-2': sinCifra, 'm-3': sinCifra })])
    montar()
    await abrirCanvas()

    expect(await screen.findByText(/ningún dato tiene cifra todavía/)).toBeInTheDocument()
    for (const n of ['Ventas', 'Doce meses', 'Tendencia']) expect(itemDe(n)).not.toHaveTextContent('Sin cifra')
  })

  it('contra un servicio SIN la ruta sigue como antes · el dato de lo que está en el lienzo', async () => {
    // Es QA hasta que despliegue `a80c318`: la ruta da 404.
    base([
      http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(rolesConAdmin)),
      http.get(`${API}/admin/tenants/:id/catalog/data`, () => new Response(null, { status: 404 })),
    ])
    montar()
    await abrirCanvas()

    const como = await abrirDato('Tendencia')
    expect(como.getByText(/Sin el dato a mano se elige por su forma/)).toBeInTheDocument()
    expect(screen.queryByText(/El estado de cada dato/)).toBeNull()
    expect(screen.queryByText(/Sin cifra/)).toBeNull()
  })
})

describe('soltar un DATO · 2026-11-10', () => {
  /** El arrastre desde la biblioteca de datos lleva dos cosas: el tipo en
   *  `text/plain`, con el que el lienzo mide, y la elección aparte. Se suelta
   *  como lo entrega el navegador, por formato. */
  function soltarDato(col: number, fila: number, tipo: string, eleccion: Record<string, string>) {
    const celda = screen.getByRole('gridcell', { name: `Columna ${String(col)}, fila ${String(fila)}` })
    const dt = {
      getData: (formato: string) => (formato === FORMATO_ELECCION ? JSON.stringify(eleccion) : tipo),
      setData: () => undefined,
      effectAllowed: '',
    }
    fireEvent.dragOver(celda, { dataTransfer: dt })
    fireEvent.drop(celda, { dataTransfer: dt })
  }

  it('el panel nace con su métrica Y su gráfico, donde se soltó', async () => {
    base()
    montar()
    await abrirCanvas()

    soltarDato(1, 5, 'series', { metricId: 'm-3', tipo: 'series', grafico: 'area' })

    const nuevo = await screen.findByRole('gridcell', { name: /Tendencia/ })
    expect(nuevo.style.gridColumn).toBe('1 / span 6')
    expect(screen.queryByRole('gridcell', { name: /Sin métrica/ })).toBeNull()
    // El gráfico elegido viaja: la banda del panel lo nombra en vez del tipo.
    expect(within(nuevo).queryByText('Serie temporal')).toBeNull()
  })

  it('una elección de OTRO tipo se descarta · el panel nace vacío, con el tamaño medido', async () => {
    base()
    montar()
    await abrirCanvas()

    soltarDato(1, 5, 'series', { metricId: 'm-1', tipo: 'kpi' })

    const nuevo = await screen.findByRole('gridcell', { name: /Sin métrica/ })
    expect(nuevo.style.gridColumn).toBe('1 / span 6')
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
  it('agrega el dato AL FINAL de la pestaña, ya con su métrica, y lo deja elegido', async () => {
    // La salida para el teclado y para quien no descubre el gesto. Se verifica
    // que el panel llegue al lienzo con el ancho de su tipo, **con su dato** —ya
    // no nace «Sin métrica»— y que quede elegido, no que el botón exista.
    base()
    montar()
    await abrirCanvas()

    const como = await abrirDato('Tendencia')
    await userEvent.click(como.getByRole('button', { name: 'Agregar Tendencia como Serie temporal · el de por defecto' }))

    const nuevo = await screen.findByRole('gridcell', { name: /Tendencia/ })
    expect(screen.queryByRole('gridcell', { name: /Sin métrica/ })).toBeNull()
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
    // **Desde un dato que se dibuja así** · 2026-11-10: la biblioteca es de
    // datos. Por el «+» de su opción, que la nombra entera.
    const dato = DATO_DE[tipo] ?? ''
    const como = await abrirDato(dato)
    const item = como
      .getByRole('button', { name: `Agregar ${dato} como ${nombreDeTipo(tipo)} · el de por defecto` })
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

    // **Ya con su dato, desde la biblioteca** · 2026-11-10.
    const como = await abrirDato('Ventas')
    await userEvent.click(como.getByRole('button', { name: 'Agregar Ventas como Indicador · el de por defecto' }))

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

    const como = await abrirDato('Ventas')
    await userEvent.click(como.getByRole('button', { name: 'Agregar Ventas como Indicador · el de por defecto' }))
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

/** ── MOVER Y ESTIRAR CON EL MOUSE · 2026-11-10 ──────────────────────────────
 *
 *  Pedido del humano: «refinar la grilla … para mover y ajustar los tamaños».
 *  Medido en local ese día: correr un panel una columna no se podía, el panel
 *  caía por la esquina sin importar de dónde se lo agarró, y un «Ancho +» en
 *  una fila llena bajó dos paneles de fila. Decisión del mismo día: **lo que
 *  no entra se bloquea y se avisa**. */

/** Una pestaña con estos paneles · `[metricId, colStart, colSpan]`. */
function conPaneles(...ps: [string, number, number][]) {
  return http.get(`${API}/admin/layouts/:id`, () =>
    ok({
      layout: layouts[0],
      tabs: [
        {
          tab: { id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen', operational_question: '¿?', sort_order: 1, role_ids: [] },
          panels: ps.map(([m, c, s], i) => panel(`p-${String(i + 1)}`, m, c, s)),
        },
      ],
    }),
  )
}

/** Un `dataTransfer` que guarda por formato, como el del navegador. */
function transferencia() {
  const datos = new Map<string, string>()
  return {
    getData: (f: string) => datos.get(f) ?? '',
    setData: (f: string, v: string) => void datos.set(f, v),
    effectAllowed: '',
  }
}

const celda = (col: number, fila: number) =>
  screen.getByRole('gridcell', { name: `Columna ${String(col)}, fila ${String(fila)}` })

describe('mover un panel con el mouse · 2026-11-10', () => {
  it('cae donde se lo soltó CONTANDO de dónde se lo agarró · no por la esquina', async () => {
    base([conPaneles(['m-1', 1, 3])])
    montar()
    await abrirCanvas()

    // Un indicador de 3 × 4 mide 272 × 368, y se lo agarra por su tercera
    // columna. Soltado con el cursor en la 5, su esquina va a la 3.
    const p = panelDe('Ventas')
    p.getBoundingClientRect = () => ({ left: 0, top: 0, width: 272, height: 368, right: 272, bottom: 368, x: 0, y: 0, toJSON: () => ({}) })
    const dt = transferencia()
    // jsdom no tiene `DragEvent`: la posición del cursor se pone a mano.
    const inicio = createEvent.dragStart(p, { dataTransfer: dt })
    Object.defineProperty(inicio, 'clientX', { value: 2 * 96 + 10 })
    Object.defineProperty(inicio, 'clientY', { value: 10 })
    fireEvent(p, inicio)
    fireEvent.dragOver(celda(5, 1), { dataTransfer: dt })
    fireEvent.drop(celda(5, 1), { dataTransfer: dt })

    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('3 / span 3'))
  })

  it('mientras vuela, los paneles dejan pasar el puntero y se ve dónde va a caer', async () => {
    // Era lo que impedía correrlo una columna: el cursor quedaba sobre el
    // propio panel, que no acepta soltar.
    base([conPaneles(['m-1', 1, 3])])
    montar()
    await abrirCanvas()

    const dt = transferencia()
    fireEvent.dragStart(panelDe('Ventas'), { dataTransfer: dt })
    await waitFor(() => expect(panelDe('Ventas').className).toMatch(/pointer-events-none/))

    fireEvent.dragEnter(celda(2, 1), { dataTransfer: dt })
    expect(await screen.findByText('Ventas · 3 × 4')).toBeInTheDocument()

    fireEvent.dragEnd(panelDe('Ventas'), { dataTransfer: dt })
    await waitFor(() => expect(panelDe('Ventas').className).not.toMatch(/pointer-events-none/))
  })

  it('al moverlo sobre otro, nombra con cuál choca · igual que lo que viene de la biblioteca', async () => {
    base()
    montar()
    await abrirCanvas()

    const dt = transferencia()
    fireEvent.dragStart(panelDe('Ventas'), { dataTransfer: dt })
    await waitFor(() => expect(panelDe('Ventas').className).toMatch(/pointer-events-none/))
    fireEvent.dragEnter(celda(4, 1), { dataTransfer: dt })
    expect(await screen.findByText(/Se solapa con «Doce meses»/)).toBeInTheDocument()
  })
})

describe('estirar desde las asas · las del `.pen`', () => {
  /** Las asas no son botones: se buscan por su borde. */
  const asa = (borde: string) => {
    const el = document.querySelector(`[data-asa="${borde}"]`)
    if (el === null) throw new Error(`sin asa ${borde}`)
    return el
  }

  it('aparecen solo con el panel elegido', async () => {
    base([conPaneles(['m-1', 1, 3])])
    montar()
    await abrirCanvas()

    expect(document.querySelector('[data-asa]')).toBeNull()
    await userEvent.click(panelDe('Ventas'))
    expect(document.querySelectorAll('[data-asa]')).toHaveLength(5)
  })

  it('el borde derecho ensancha, con la medida a la vista mientras se estira', async () => {
    // Sin medida en jsdom, el paso es el del `.pen`: columna 80 más 16.
    base([conPaneles(['m-1', 1, 3])])
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))

    fireEvent.mouseDown(asa('e'), { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 2 * 96, clientY: 0 })
    expect(await screen.findByText('5 × 4')).toBeInTheDocument()
    fireEvent.mouseUp(window, { clientX: 2 * 96, clientY: 0 })

    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 5'))
  })

  it('el izquierdo mueve la columna y el ancho juntos · el borde derecho queda quieto', async () => {
    base([conPaneles(['m-1', 4, 3])])
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))

    fireEvent.mouseDown(asa('o'), { clientX: 500, clientY: 0 })
    fireEvent.mouseUp(window, { clientX: 500 - 2 * 96, clientY: 0 })

    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('2 / span 5'))
  })

  it('el de abajo agranda en filas', async () => {
    base([conPaneles(['m-1', 1, 3])])
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))

    fireEvent.mouseDown(asa('s'), { clientX: 0, clientY: 0 })
    fireEvent.mouseUp(window, { clientX: 0, clientY: 96 })

    await waitFor(() => expect(panelDe('Ventas').style.gridRow).toBe('1 / span 5'))
  })

  it('estirar de más lo deja en el máximo del tipo, y lo dice', async () => {
    // `kpi` va de 3 a 8 columnas en este fixture.
    base([conPaneles(['m-1', 1, 3])])
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))

    fireEvent.mouseDown(asa('e'), { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 20 * 96, clientY: 0 })
    expect(await screen.findByText('«Indicador» ocupa entre 3 y 8 columnas')).toBeInTheDocument()
    fireEvent.mouseUp(window, { clientX: 20 * 96, clientY: 0 })

    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 8'))
  })

  it('sobre otro panel NO se aplica: se ve por qué y queda dicho', async () => {
    base()
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))

    fireEvent.mouseDown(asa('e'), { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 96, clientY: 0 })
    expect(await screen.findByText('Se solapa con «Doce meses»')).toBeInTheDocument()
    fireEvent.mouseUp(window, { clientX: 96, clientY: 0 })

    expect(await screen.findByRole('status')).toHaveTextContent('Se solapa con «Doce meses»')
    expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 6')
    expect(panelDe('Doce meses').style.gridColumn).toBe('7 / span 6')
  })
})

describe('un tamaño que no entra se bloquea · decisión humana del 2026-11-10', () => {
  it('«Ancho +» en una fila llena no empuja a nadie: dice con quién choca', async () => {
    // El caso medido en local: el clic bajó dos paneles de fila.
    base()
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))

    await userEvent.click(screen.getByRole('button', { name: 'Ensanchar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Se solapa con «Doce meses»')
    expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 6')
    expect(panelDe('Doce meses').style.gridRow).toBe('1 / span 4')
  })

  it('en el tope del tipo, el botón dice por qué no hace nada', async () => {
    base([conPaneles(['m-1', 1, 8])])
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))

    await userEvent.click(screen.getByRole('button', { name: 'Ensanchar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('«Indicador» ocupa entre 3 y 8 columnas')
    expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 8')
  })

  it('Shift y las flechas siguen la misma regla', async () => {
    base()
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))

    fireEvent.keyDown(panelDe('Ventas'), { key: 'ArrowRight', shiftKey: true })

    expect(await screen.findByRole('status')).toHaveTextContent('Se solapa con «Doce meses»')
    expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 6')
  })
})

describe('deshacer · el borrador se guarda solo', () => {
  it('Deshacer y Rehacer vuelven el último cambio, ida y vuelta', async () => {
    base([conPaneles(['m-1', 1, 3])])
    montar()
    await abrirCanvas()

    expect(screen.getByRole('button', { name: /^Deshacer/ })).toBeDisabled()
    await userEvent.click(panelDe('Ventas'))
    await userEvent.click(screen.getByRole('button', { name: 'Ensanchar' }))
    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 4'))

    await userEvent.click(screen.getByRole('button', { name: /^Deshacer/ }))
    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 3'))

    await userEvent.click(screen.getByRole('button', { name: /^Rehacer/ }))
    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 4'))
  })

  it('Cmd + Z deshace y Cmd + Shift + Z rehace', async () => {
    base([conPaneles(['m-1', 1, 3])])
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))
    fireEvent.keyDown(panelDe('Ventas'), { key: 'ArrowRight' })
    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('2 / span 3'))

    fireEvent.keyDown(panelDe('Ventas'), { key: 'z', metaKey: true })
    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('1 / span 3'))

    fireEvent.keyDown(panelDe('Ventas'), { key: 'z', metaKey: true, shiftKey: true })
    await waitFor(() => expect(panelDe('Ventas').style.gridColumn).toBe('2 / span 3'))
  })

  it('un cambio nuevo después de deshacer descarta lo que se podía rehacer', async () => {
    base([conPaneles(['m-1', 1, 3])])
    montar()
    await abrirCanvas()
    await userEvent.click(panelDe('Ventas'))
    await userEvent.click(screen.getByRole('button', { name: 'Ensanchar' }))
    await userEvent.click(screen.getByRole('button', { name: /^Deshacer/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /^Rehacer/ })).toBeEnabled())

    await userEvent.click(screen.getByRole('button', { name: 'Agrandar' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /^Rehacer/ })).toBeDisabled())
  })
})
