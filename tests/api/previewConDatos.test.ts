// @vitest-environment jsdom

/** El preview con el dato de cada panel · `include=payloads` · 2026-10-07
 *
 *  **La prueba del adaptador va de entrada**, que es la lección de A5 y A3: las
 *  pruebas de pantalla construyen el tipo a mano y la frontera queda sin
 *  cubrir.
 *
 *  La FORMA sale de una respuesta capturada contra `7b717aa` el 2026-10-07 —las
 *  siete claves del payload, `period` y `payloads` al lado de `tabs`—. Los
 *  VALORES son sintéticos: la prueba mira el paso por el adaptador, no el
 *  negocio.
 */
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { adminApi } from '@/api/admin'
import { ok } from '../mocks/handlers'
import { server } from '../mocks/server'

const API = '*/api/v1'
const LAYOUT = '3d8381d5-0000-4000-8000-000000000001'
const ROL = '5a1e0000-0000-4000-8000-000000000002'

const panel = (id: string, chart: string) => ({
  id,
  metric_id: `m-${id}`,
  type: 'kpi',
  col_start: 1,
  col_span: 3,
  row_span: 4,
  options: {},
  note: '',
  chart,
})

const respuesta = (conDatos: boolean) => ({
  layout_id: LAYOUT,
  dashboard_id: 'd-1',
  status: 'draft',
  role: { id: ROL, name: 'admin' },
  tabs: [
    {
      id: 't-1',
      name: 'Resumen',
      key: 'resumen',
      operational_question: '¿Cómo vamos?',
      sort_order: 1,
      icon: '',
      chat_suggestions: [],
      panels: [panel('p-1', ''), panel('p-2', 'radial')],
    },
  ],
  ...(conDatos
    ? {
        period: '2026-10',
        payloads: {
          'p-1': {
            status: 'DEGRADED',
            value: { shape: 'scalar', v: 48362 },
            governance: {
              base: 'Venta total',
              layer: 'GOLD',
              source: 'ERP',
              freshness: '2026-10-02T18:44:00Z',
              catalog_version: 5,
              measurement_window: 'Mes calendario seleccionado',
            },
            presentation: { label: 'USD · TOTAL' },
            reason: 'Los datos tienen más de 3 días',
            unlocks_with: 'Se actualiza en la próxima materialización',
            stale_since: '2026-10-05T18:44:00Z',
          },
          'p-2': { status: 'FORBIDDEN', request_from: 'admin' },
        },
      }
    : {}),
})

function servir() {
  const pedidas: URL[] = []
  server.use(
    http.get(`${API}/admin/layouts/:id/preview`, ({ request }) => {
      const url = new URL(request.url)
      pedidas.push(url)
      return ok(respuesta(url.searchParams.get('include') === 'payloads'))
    }),
  )
  return pedidas
}

describe('previewPorRol · con y sin datos', () => {
  it('sin pedirlos, la URL no lleva `include` y no hay datos', async () => {
    const pedidas = servir()
    const p = await adminApi.previewPorRol(LAYOUT, ROL)
    expect(pedidas[0]?.searchParams.get('include')).toBeNull()
    expect(p.datos).toBeUndefined()
  })

  it('con datos pide `include=payloads` y `role_id` en snake_case', async () => {
    const pedidas = servir()
    await adminApi.previewPorRol(LAYOUT, ROL, true)
    expect(pedidas[0]?.searchParams.get('include')).toBe('payloads')
    expect(pedidas[0]?.searchParams.get('role_id')).toBe(ROL)
  })

  it('adapta CADA payload con el adaptador de la consola · los estados en español', async () => {
    servir()
    const p = await adminApi.previewPorRol(LAYOUT, ROL, true)
    expect(p.datos?.periodo).toBe('2026-10')
    expect(p.datos?.porPanel.size).toBe(2)
    expect(p.datos?.porPanel.get('p-1')?.estado).toBe('DEGRADADO')
    // La métrica oculta para el lente sale como en la consola: es información.
    expect(p.datos?.porPanel.get('p-2')?.estado).toBe('SIN_PERMISO')
  })

  it('el gráfico de cada panel LLEGA · este adaptador lo tiraba', async () => {
    // Sin dato no se notaba. Con dato, B5 habría dibujado el de por defecto
    // del bloque en vez del elegido —un anillo como barras—.
    servir()
    const p = await adminApi.previewPorRol(LAYOUT, ROL, true)
    const [sinGrafico, conGrafico] = p.tabs[0]?.paneles ?? []
    expect(sinGrafico?.grafico).toBeUndefined()
    expect(conGrafico?.grafico).toBe('radial')
  })
})
