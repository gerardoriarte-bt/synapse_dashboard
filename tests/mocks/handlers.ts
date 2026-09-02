/** Los handlers base de MSW · F0.9.
 *
 *  Viven fuera de `src/` a propósito: son datos falsos, y la única forma de
 *  garantizar que no entren al bundle (F0.8) es que no exista ruta desde `src/`
 *  hasta acá. `api/client.ts` lo declara en su cabecera; esto lo hace cierto.
 *
 *  Estos handlers son el PISO —el contexto mínimo con el que la app arranca—, no
 *  un catálogo de escenarios. Una prueba que necesite otra respuesta la declara
 *  ella misma con `server.use(...)`, que la anula solo para ese archivo.
 */
import { http, HttpResponse } from 'msw'
import type { AppContext, Block, Metric } from '@/api/types'

/** La base contra la que pega el cliente. El patrón lleva `*` adelante porque en
 *  jsdom `fetch('/api/v1/...')` se resuelve contra `location.origin`, que no es
 *  el mismo en toda corrida. */
export const API = '*/api/v1'

/** El envelope de §4.1 del contrato. El cliente lo desenvuelve; las pruebas lo
 *  tienen que envolver, o estarían probando contra una forma que no existe. */
export function ok<T>(data: T) {
  return HttpResponse.json({ success: true, data })
}

export function fail(
  codigo: string,
  mensaje: string,
  init: { status?: number; desbloqueaCon?: string } = {},
) {
  const { status = 400, desbloqueaCon } = init
  return HttpResponse.json(
    {
      success: false,
      error: { codigo, mensaje, ...(desbloqueaCon === undefined ? {} : { desbloqueaCon }) },
    },
    { status },
  )
}

/** El contexto mínimo con el que la consola arranca: un tenant, un rol, una
 *  pestaña, un período. Los campos son los `required` del contrato y nada más —
 *  un fixture que rellena opcionales enseña a depender de ellos. */
export const context: AppContext = {
  alcance: 'usuario',
  user: { id: 'u-1', nombre: 'Prueba', email: 'prueba@uamx.test' },
  tenant: {
    id: 't-1',
    nombre: 'Under Armour México',
    etiqueta: 'UA MX',
    vertical: 'retail_apparel',
  },
  role: { id: 'r-planner', nombre: 'Planner', puedeAprobar: false },
  tabs: [
    {
      id: 'tab-1',
      key: 'inventory',
      nombre: 'Inventory & Shopping',
      pregunta: '¿Tenemos stock y lo estamos mostrando?',
      orden: 1,
    },
  ],
  // `grano` no está en el `required` del contrato pero declara `default: mes`,
  // y openapi-typescript emite un defaulted como presente. Va explícito.
  periodos: [{ id: '2026-07', etiqueta: 'JUL 2026', grano: 'mes' }],
  catalogVersion: 1,
}

export const metrics: Metric[] = []
export const blocks: Block[] = []

/** Una métrica y un panel, lo mínimo para que la consola dibuje una celda. */
export const kpiMetric = {
  id: 'm-kpi',
  key: 'ventas_dia',
  nombre: 'Venta diaria',
  forma: 'escalar',
  familia: 'demanda',
  capa: 'GOLD',
  fuente: 'Snowflake',
  ventana: 'Últimos 30 días',
  base: '48 tiendas sobre 52',
  unidad: 'USD',
  granoMinimo: 'mes',
  estado: 'DISPONIBLE',
  catalogVersion: 1,
} as unknown as Metric

export const kpiPanel = {
  id: 'p-1',
  tipo: 'kpi',
  metricId: 'm-kpi',
  colStart: 1,
  colSpan: 4,
  rowSpan: 4,
}

export const handlers = [
  http.get(`${API}/config/me`, () => ok(context)),
  http.get(`${API}/config/catalog`, () => ok({ metrics })),
  http.get(`${API}/config/blocks`, () => ok({ blocks })),
]
