// @vitest-environment jsdom

/** La consola coloca cada panel en la fila del EDITOR · 2026-11-18
 *
 *  ── EL DEFECTO, MEDIDO EN QA ────────────────────────────────────────────────
 *
 *  UA MX publicado: un resumen de 12 × 4 y abajo Órdenes en la columna 10,
 *  Visitas en la 7, Ingresos en la 1 e Inversión en la 4, en ese orden. El
 *  editor los mostraba en una fila. La consola dejaba la fila a CSS, y CSS lleva
 *  también un cursor de COLUMNA: un panel que arranca a la izquierda del
 *  anterior baja de fila aunque haya lugar. Medido en el navegador:
 *
 *      Órdenes fila 5 · Visitas fila 6 · Ingresos e Inversión fila 7 ·
 *      AOV fila 8 · CVR fila 9 · Tendencia fila 10
 *
 *  donde el editor decía 5 · 5 · 5 · 5 · 8 · 8 · 8. Una escalera.
 *
 *  **Se afirma sobre el DOM de la consola montada**, igual que
 *  `ordenDeFilas.test.tsx`: la fila tiene que llegar al estilo del panel, que
 *  es lo que el navegador usa, y en el camino hay un spread condicional.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { panelStyle, rowStarts } from '@/render/grid'
import { disposicion } from '@/surfaces/builder/disposicion'
import { API, kpiMetric, ok, tab } from '../mocks/handlers'
import { server } from '../mocks/server'
import type { WireMetric, WirePanel } from '@/api/adapt'

/** El orden y las medidas de UA MX en QA el 2026-11-18. */
const QA: readonly { nombre: string; colStart: number; colSpan: number; rowSpan: number }[] = [
  { nombre: 'Decisions', colStart: 1, colSpan: 12, rowSpan: 4 },
  { nombre: 'Órdenes', colStart: 10, colSpan: 3, rowSpan: 3 },
  { nombre: 'Visitas', colStart: 7, colSpan: 3, rowSpan: 3 },
  { nombre: 'Ingresos', colStart: 1, colSpan: 3, rowSpan: 3 },
  { nombre: 'Investment', colStart: 4, colSpan: 3, rowSpan: 3 },
  { nombre: 'Ticket promedio', colStart: 10, colSpan: 3, rowSpan: 4 },
  { nombre: 'Conversión', colStart: 7, colSpan: 3, rowSpan: 4 },
  { nombre: 'Tendencia diaria', colStart: 1, colSpan: 6, rowSpan: 4 },
]
/** Lo que el editor mostraba. */
const FILAS = [1, 5, 5, 5, 5, 8, 8, 8]

describe('rowStarts · una sola cuenta para los dos', () => {
  it('el caso de QA queda en tres filas, no en una escalera', () => {
    expect(rowStarts(QA)).toEqual(FILAS)
  })

  it('`panelStyle` escribe la fila sólo a doce columnas · colapsada la suelta', () => {
    // La consola ya no la manda colapsada; esto cubre a cualquier otro que la
    // pase, porque a seis columnas la fila del editor pisaría paneles.
    const p = { colStart: 7, colSpan: 3, rowSpan: 3, rowStart: 5 }
    expect(panelStyle(p).gridRow).toBe('5 / span 3')
    expect(panelStyle(p, 6).gridRow).toBe('span 3')
  })

  it('el editor usa la misma · `disposicion` devuelve esas filas', () => {
    expect(disposicion(QA).map((c) => c.filaInicio)).toEqual(FILAS)
  })
})

const metricas: WireMetric[] = QA.map((p, i) => ({
  ...kpiMetric,
  id: `m-${String(i)}`,
  key: `k${String(i)}`,
  name: p.nombre,
}))

const panels: WirePanel[] = QA.map((p, i) => ({
  id: `p-${String(i)}`,
  metric_id: `m-${String(i)}`,
  type: 'kpi',
  col_start: p.colStart,
  col_span: p.colSpan,
  row_span: p.rowSpan,
  chart: '',
  note: '',
}))

function servir() {
  server.use(
    http.get(`${API}/config/catalog`, () => ok(metricas)),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: tab, panels })),
    http.post(`${API}/config/panels:batch`, () =>
      ok(
        Object.fromEntries(
          panels.map((p) => [
            p.id,
            {
              status: 'AVAILABLE',
              value: { shape: 'scalar', v: 1 },
              governance: { base: 'b', layer: 'GOLD', source: 'ERP', freshness: '2026-11-18T08:00:00Z', catalog_version: 1 },
            },
          ]),
        ),
      ),
    ),
  )
}

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

function anchoDe(px: number) {
  Object.defineProperty(window, 'innerWidth', { value: px, writable: true, configurable: true })
}
const ANCHO_ORIGINAL = window.innerWidth
afterEach(() => anchoDe(ANCHO_ORIGINAL))

async function filaDe(nombre: string): Promise<string> {
  await waitFor(() => expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(QA.length))
  const celda = screen.getByRole('heading', { name: nombre, level: 2 }).closest('[style*="grid-column"]')
  return (celda as HTMLElement).style.gridRow
}

describe('la consola ESCRIBE la fila del editor · a doce columnas', () => {
  it('cada panel arranca donde el editor lo mostraba', async () => {
    anchoDe(1710)
    servir()
    montar()
    for (const [i, p] of QA.entries()) {
      expect(await filaDe(p.nombre)).toBe(`${String(FILAS[i])} / span ${String(p.rowSpan)}`)
    }
  })

  it('colapsada NO la escribe · la fila del editor ya no describe nada', async () => {
    anchoDe(1000)
    servir()
    montar()
    expect(await filaDe('Visitas')).toBe('span 3')
  })
})
