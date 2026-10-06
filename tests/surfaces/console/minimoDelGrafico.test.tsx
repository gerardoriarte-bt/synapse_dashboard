// @vitest-environment jsdom

/** El mínimo del repertorio apaga el dibujo, con su razón · F1.31 · 2026-09-29
 *
 *  ── LO QUE ESTA PRUEBA CUBRE Y LAS DE `catalog/` NO ─────────────────────────
 *
 *  `tests/catalog/plots.test.ts` verifica la DECISIÓN sobre una tabla en
 *  memoria. Acá se verifica el CAMINO: que la tabla se pida, que el contenedor
 *  la cruce con el payload del panel, y que la razón llegue a la pantalla.
 *
 *  Son cuatro saltos —`usePlots → plotProblemOf → Console → PanelInGrid`— y cada
 *  uno usa el spread condicional que `exactOptionalPropertyTypes` obliga, que es
 *  el idioma donde **una prop mal nombrada compila**. Ya pasó tres veces el
 *  2026-09-02 y una cuarta con `chart` el 28.
 *
 *  ── POR QUÉ LA ASERCIÓN ES LA RAZÓN Y NO «NO SE DIBUJÓ» ─────────────────────
 *
 *  Un panel apagado se ve igual esté apagado por la causa correcta o por otra.
 *  La razón viene del REPERTORIO —redactada en `design.md`, servida por
 *  `/config/plots`— así que afirmarla textualmente prueba que atravesó el
 *  adaptador y las dos superficies sin que nadie la recompusiera.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { abrirGobierno } from '../../gobierno'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { WireMetric, WirePanel, WirePlot } from '@/api/adapt'

const metrica: WireMetric = {
  id: 'm-cat',
  tenant_id: 't-1',
  key: 'venta_por_division',
  name: 'Venta por división',
  shape: 'categorical',
  family: 'demand',
  layer: 'GOLD',
  source: 'Snowflake',
  base: '48 tiendas sobre 52',
  unit: 'USD',
  min_grain: 'month',
  measurement_window: 'Mes calendario seleccionado',
  dimensions: [],
  catalog_version: 1,
}

const panel = (chart: string): WirePanel => ({
  id: 'p-1',
  metric_id: 'm-cat',
  type: 'bars',
  col_start: 1,
  col_span: 4,
  row_span: 4,
  chart,
  note: '',
})

/** **Capturado de `GET /config/plots`**, la ruta que escribimos el 2026-09-29 y
 *  medimos contra `b6f0e09`. Los umbrales no se inventaron: `pareto` pide 3 en
 *  `categorical` y `bars` pide 2. */
const REPERTORIO: WirePlot[] = [
  {
    id: 'bars',
    name: 'BARRAS',
    shapes: ['categorical', 'ranking'],
    supports_band: false,
    minimums: [
      { shape: 'categorical', when: 'items < 2', reason: 'una barra sola no compara nada' },
    ],
    cap: null,
  },
  {
    id: 'pareto',
    name: 'PARETO',
    shapes: ['categorical'],
    supports_band: false,
    minimums: [
      {
        shape: 'categorical',
        when: 'items < 3',
        reason: 'con dos categorías no hay concentración que mostrar',
      },
    ],
    cap: null,
  },
] as unknown as WirePlot[]

const valorCon = (n: number) => ({
  status: 'AVAILABLE',
  value: {
    shape: 'categorical',
    items: Array.from({ length: n }, (_, i) => ({ label: `d${String(i)}`, v: (i + 1) * 10 })),
  },
  governance: {
    base: '48 tiendas sobre 52',
    layer: 'GOLD',
    source: 'Snowflake',
    freshness: '2026-09-02T08:00:00Z',
    catalog_version: 1,
    measurement_window: 'Mes calendario seleccionado',
  },
})

function montar(chart: string, items: number, repertorio: WirePlot[] = REPERTORIO) {
  const p = panel(chart)
  server.use(
    http.get(`${API}/config/catalog`, () => ok([metrica])),
    http.get(`${API}/config/plots`, () => ok(repertorio)),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab, panels: [p] })),
    http.post(`${API}/config/panels:batch`, () => ok({ [p.id]: valorCon(items) })),
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('por debajo del mínimo no se dibuja, y se dice por qué', () => {
  it('`pareto` con dos categorías muestra la RAZÓN del repertorio', async () => {
    const { container } = montar('pareto', 2)

    expect(
      await screen.findByText('con dos categorías no hay concentración que mostrar'),
    ).toBeVisible()
    // Y el dibujo NO está. Con sólo la primera mitad, un panel que mostrara las
    // dos cosas pasaría igual.
    expect(container.querySelector('svg[role="img"]')).toBeNull()
  })

  it('el SHELL queda · un estado reemplaza el cuerpo, nunca el shell', async () => {
    montar('pareto', 2)

    // §4.1: título, BASE y procedencia siguen visibles. El panel dice qué mide
    // aunque no pueda dibujarlo.
    expect(await screen.findByText('Venta por división')).toBeVisible()
    expect(await abrirGobierno()).toHaveTextContent('48 tiendas sobre 52')
  })

  it('con TRES el mismo gráfico dibuja · el umbral es el del repertorio', async () => {
    montar('pareto', 3)

    // **Se ESPERA el dibujo, no se consulta y ya.** El cuerpo llega por `lazy`,
    // así que un `querySelector` inmediato lo encuentra vacío y la prueba diría
    // «no dibujó» sobre un chunk en vuelo — un falso rojo que se lee igual que
    // el defecto que busca.
    expect(await screen.findByRole('img')).toBeVisible()
    expect(screen.queryByText(/no hay concentración/)).toBeNull()
  })

  it('el umbral es POR GRÁFICO · `bars` con dos dibuja donde `pareto` no', async () => {
    // La misma forma y el mismo dato: lo único que cambia es el gráfico. Si el
    // mínimo se leyera de la forma y no de la entrada, los dos se comportarían
    // igual y esta prueba no distinguiría nada.
    montar('bars', 2)

    expect(await screen.findByRole('img')).toBeVisible()
  })

  it('**sin repertorio NO se bloquea nada**, que es la regresión que importa', async () => {
    // `/config/plots` es una consulta aparte y puede fallar sola. Un panel
    // apagado por una tabla que no cargó es peor que uno dibujado sin verificar:
    // el segundo es lo que hacía ayer; el primero el usuario no lo distingue de
    // un fallo de datos.
    montar('pareto', 2, [])

    expect(await screen.findByRole('img', { name: /categorías/ })).toBeVisible()
    // **La aserción que discrimina es ÉSTA, y la primera versión no la tenía.**
    // Sin la guarda, `invalidPlotReason` sobre una tabla vacía no devuelve
    // «pasa»: devuelve `incompatible` —«el gráfico no está en el repertorio»— y
    // apaga el panel. Afirmar sólo que hay un `img` no lo distinguía, y la
    // mutación que quita la guarda SOBREVIVIÓ contra la primera versión.
    expect(screen.queryByText(/no está en el repertorio/)).toBeNull()
    expect(screen.queryByText(/no hay concentración/)).toBeNull()
  })
})
