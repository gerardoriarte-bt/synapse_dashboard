// @vitest-environment jsdom

/** El orden del DOM ES la fila · §ANCLA:RESP-3 · 2026-09-16
 *
 *  ── EL DEFECTO QUE ESTA PRUEBA EXISTE PARA IMPEDIR ──────────────────────────
 *
 *  `readingOrder` ordena por `colStart` globalmente, y se aplicaba **siempre**.
 *  §4 lo pide solo «por debajo de 768px a 1 columna», y el comentario del código
 *  afirmaba que a doce columnas «no cambia nada». **Es falso**, y se midió en el
 *  navegador sobre el layout publicado:
 *
 *      servidor   prosa(1/12) kpi(1/3) kpi(4/3) kpi(7/3) kpi(10/3) bars(1/6) …
 *      ordenado   prosa(1/12) kpi(1/3) bars(1/6) series(1/6) tabla(1/7) … kpi(4/3)
 *
 *  CSS grid coloca en el orden del DOM con un cursor que **no retrocede** —sin
 *  `grid-auto-flow: dense`—. Así que el `bars` de `colStart` 1 ya no entraba en
 *  la fila del `kpi` de `colStart` 1 y bajaba una fila, y el `kpi` de la columna
 *  4 llegaba cuando el cursor ya había pasado. Doce paneles bien compuestos se
 *  veían apilados en una sola columna.
 *
 *  **Y el arreglo es la fila.** `PanelConfigurado` no declara `rowStart`: la
 *  única información de fila que existe es la posición en el arreglo, y ordenar
 *  por `colStart` la borra.
 *
 *  ── POR QUÉ SE AFIRMA SOBRE EL DOM Y NO SOBRE `readingOrder` ────────────────
 *
 *  Una prueba unitaria de `readingOrder` no habría visto nada: la función hace
 *  exactamente lo que dice. El defecto estaba en DÓNDE se la llamaba. Por eso se
 *  monta la consola y se lee el orden de los títulos, que es lo que el navegador
 *  usa para colocar.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, context, kpiMetric, ok } from '../mocks/handlers'
import { server } from '../mocks/server'
import type { WireMetric, WirePanel } from '@/api/adapt'

/** Dos filas de dos, como las compone el builder. **El orden del arreglo es el
 *  orden de las filas**: (1,2) arriba, (3,4) abajo. */
const PANELES: readonly { n: number; colStart: number }[] = [
  { n: 1, colStart: 1 },
  { n: 2, colStart: 7 },
  { n: 3, colStart: 1 },
  { n: 4, colStart: 7 },
]

const metricas: WireMetric[] = PANELES.map((p) => ({
  ...kpiMetric,
  id: `m-${String(p.n)}`,
  key: `k${String(p.n)}`,
  name: `Panel ${String(p.n)}`,
}))

const panels: WirePanel[] = PANELES.map((p) => ({
  id: `p-${String(p.n)}`,
  metric_id: `m-${String(p.n)}`,
  type: 'kpi',
  col_start: p.colStart,
  col_span: 6,
  row_span: 4,
}))

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function servir() {
  server.use(
    http.get(`${API}/config/catalog`, () => ok(metricas)),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: context.tabs[0], panels })),
    http.post(`${API}/config/panels:batch`, () =>
      ok(
        Object.fromEntries(
          panels.map((p) => [
            p.id,
            {
              status: 'AVAILABLE',
              value: { shape: 'scalar', v: 1 },
              governance: {
                base: 'b',
                layer: 'GOLD',
                source: 'ERP',
                freshness: '2026-09-02T08:00:00Z',
                catalog_version: 1,
              },
            },
          ]),
        ),
      ),
    ),
  )
}

/** El ancho decide las columnas · `useColumns` lee `window.innerWidth`. */
function anchoDe(px: number) {
  Object.defineProperty(window, 'innerWidth', { value: px, writable: true, configurable: true })
}

const ANCHO_ORIGINAL = window.innerWidth
afterEach(() => anchoDe(ANCHO_ORIGINAL))

async function titulos(): Promise<string[]> {
  await waitFor(() => expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4))
  return screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent ?? '')
}

describe('a doce columnas el DOM conserva el orden del servidor', () => {
  it('no se reordena · el arreglo es la fila', async () => {
    anchoDe(1710)
    servir()
    montar()

    // 1,2 en la primera fila y 3,4 en la segunda. Ordenado por `colStart` esto
    // sería 1,3,2,4 — y el navegador bajaría el 3 una fila, apilando todo.
    expect(await titulos()).toEqual(['Panel 1', 'Panel 2', 'Panel 3', 'Panel 4'])
  })
})

describe('colapsada a una columna SÍ se ordena · §4', () => {
  it('por `colStart`, que es lo que la spec pide debajo de 768', async () => {
    anchoDe(400)
    servir()
    montar()

    // Con una sola columna el orden visual ES el orden del DOM, así que los dos
    // de la izquierda van primero: es la lectura de arriba a abajo.
    expect(await titulos()).toEqual(['Panel 1', 'Panel 3', 'Panel 2', 'Panel 4'])
  })
})
