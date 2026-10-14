// @vitest-environment jsdom

/** `chart` atraviesa la cadena y CAMBIA EL DIBUJO · 2026-09-28
 *
 *  **El hueco que cierra, y es el que `CLAUDE.md` nombra.** Los cuatro gráficos
 *  que se construyeron esta semana tienen sus pruebas, y **las nueve rinden el
 *  cuerpo directo**: `render(<SeriesBody grafico="stackarea" />)`. Eso verifica
 *  el cuerpo y deja sin cubrir lo único que podía estar mal: que el id **llegue**
 *  desde el servicio.
 *
 *  Y el camino es exactamente el que la trampa registrada describe:
 *
 *      cable → adapt.ts → Console → PanelInGrid → Panel → SeriesBody
 *
 *  con **un spread condicional en cada salto** —`{...(x === undefined ? {} : { x })}`,
 *  obligatorio con `exactOptionalPropertyTypes`—. Una prop mal nombrada en
 *  cualquiera de ellos **compila, pasa el lint, y el panel se dibuja igual**:
 *  cae al gráfico por defecto del cuerpo. Es el mismo modo de falla que los tres
 *  callbacks muertos del 2026-09-02, con otra cara — y peor, porque un botón
 *  muerto no hace nada y un gráfico equivocado **dibuja algo**.
 *
 *  **Por eso la aserción es sobre el DIBUJO y no sobre la prop.** «Verificar que
 *  el callback dispare, no que el botón exista», traducido: el rótulo accesible
 *  dice `2 series` cuando se superponen y `2 series apiladas` cuando se apilan,
 *  así que las dos ramas se distinguen sin un atributo de prueba.
 *
 *  Es la misma lección que apareció tres veces con A5 y A3: las pruebas de
 *  pantalla construyen el tipo a mano, así que la frontera queda sin cubrir.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { WireMetric, WirePanel } from '@/api/adapt'

/** Una métrica de forma `multi_series`, que es la que `stackarea` sirve. */
const metrica: WireMetric = {
  id: 'm-ms',
  tenant_id: 't-1',
  key: 'ventas_por_canal',
  name: 'Ventas por canal',
  shape: 'multi_series',
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

/** **`chart` se pasa como lo emite el servicio**, no como lo quiere el cuerpo:
 *  cadena vacía para «el de siempre». Los doce paneles publicados salen así,
 *  medido el 2026-09-28 contra `f70cec2`. */
const panel = (chart: string): WirePanel => ({
  id: 'p-ms',
  metric_id: 'm-ms',
  type: 'series',
  col_start: 1,
  col_span: 6,
  row_span: 4,
  chart,
  note: '',
})

/** **La serie lleva `label`, no `name`** · leído de `adapt.ts:888`, no recordado.
 *  La primera versión de este fixture puso `name` y **falló en silencio**: el
 *  `flatMap` del adaptador descarta la serie a la que le falta el rótulo, así que
 *  `series` quedó vacío y el panel dijo «Sin datos» en vez de romperse. Es la
 *  misma familia que el rótulo vacío del 2026-09-04 —donde la prueba pasaba
 *  porque sólo miraba el `valor`—, y la razón por la que la regla dice que el
 *  fixture se escribe desde el contrato. */
const VALOR = {
  status: 'AVAILABLE',
  value: {
    shape: 'multi_series',
    series: [
      { label: 'Retail', points: [{ t: 'S1', v: 10 }, { t: 'S2', v: 12 }] },
      { label: 'Online', points: [{ t: 'S1', v: 15 }, { t: 'S2', v: 13 }] },
    ],
  },
  governance: {
    base: '48 tiendas sobre 52',
    layer: 'GOLD',
    source: 'Snowflake',
    freshness: '2026-09-02T08:00:00Z',
    catalog_version: 1,
    measurement_window: 'Mes calendario seleccionado',
  },
}

function montarCon(chart: string) {
  const p = panel(chart)
  server.use(
    http.get(`${API}/config/catalog`, () => ok([metrica])),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab, panels: [p] })),
    http.post(`${API}/config/panels:batch`, () => ok({ [p.id]: VALOR })),
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

describe('el `chart` del servicio llega al cuerpo y cambia el dibujo', () => {
  it('con `chart: "stackarea"` la consola APILA', async () => {
    // **Es la aserción que importa de este archivo.** Si cualquiera de los
    // cuatro spreads pierde la prop, acá sale `2 series` y la prueba falla.
    montarCon('stackarea')
    expect(await screen.findByRole('img', { name: '2 series apiladas' })).toBeInTheDocument()
  })

  it('con `chart: ""` NO apila · es el gráfico por defecto del cuerpo', async () => {
    // La otra mitad, y sin ella la de arriba pasaría con un cuerpo que apila
    // siempre. Cadena vacía es lo que el servicio manda hoy en los doce.
    montarCon('')
    expect(await screen.findByRole('img', { name: '2 series' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /apiladas/ })).toBeNull()
  })

  it('un `chart` DESCONOCIDO se declara en el panel · no cae al de siempre', async () => {
    // El servicio no lo valida contra el repertorio —«eso es del front»—, así
    // que un id inventado llega. Dibujarlo como el de por defecto sería una
    // cascada pintada como dona: se ve perfecta y miente.
    montarCon('inventado')
    expect(await screen.findByText(/inventado/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /series/ })).toBeNull()
  })
})
