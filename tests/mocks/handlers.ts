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
import type { WireBlock, WireContext, WireMetric, WirePanel } from '@/api/adapt'

/** La base contra la que pega el cliente. El patrón lleva `*` adelante porque en
 *  jsdom `fetch('/api/v1/...')` se resuelve contra `location.origin`, que no es
 *  el mismo en toda corrida. */
export const API = '*/api/v1'

/** El envelope de §4.1 del contrato. El cliente lo desenvuelve; las pruebas lo
 *  tienen que envolver, o estarían probando contra una forma que no existe. */
export function ok<T>(data: T) {
  return HttpResponse.json({ success: true, data })
}

/** Un error **con la forma del CABLE** · F1.36.
 *
 *  `error` es una CADENA, no el objeto de §4.1. El contrato declara
 *  `{ codigo, mensaje, campo?, desbloqueaCon? }` y `synapse-api-go` declara
 *  `Error string`.
 *
 *  Este helper emitía la forma del contrato, y por eso **el cliente podía leer
 *  `body.error.codigo` durante meses sin que ninguna prueba se quejara**: los
 *  mocks le daban de comer exactamente lo que esperaba. Es el modo de falla que
 *  F1.38 persigue en grande — mientras MSW responda la forma del contrato, el
 *  adaptador no se ejecuta nunca en una prueba. */
export function fail(mensaje: string, init: { status?: number } = {}) {
  const { status = 400 } = init
  return HttpResponse.json({ success: false, error: mensaje }, { status })
}

/** El contexto mínimo con el que la consola arranca, **con la forma del CABLE**
 *  · F1.33.
 *
 *  Emitía la forma del CONTRATO, y eso es exactamente el defecto que F1.38
 *  persigue: con los mocks hablando el idioma del front, `adapt.ts` no se
 *  ejecutaba en ninguna prueba y las 354 habrían seguido verdes con el
 *  adaptador roto. Los mismos mocks tapaban `body.error.codigo` y el cuerpo
 *  `{ panelIds, periodo }`.
 *
 *  Los campos son los `required` del cable y nada más: un fixture que rellena
 *  opcionales enseña a depender de ellos. */
export const context: WireContext = {
  user: { id: 'u-1', email: 'prueba@uamx.test', first_name: 'Prueba', last_name: 'Uno' },
  tenant: { id: 't-1', name: 'Under Armour México' },
  role: { id: 'r-planner', name: 'Planner' },
  tabs: [
    {
      id: 'tab-1',
      name: 'Inventory & Shopping',
      operational_question: '¿Tenemos stock y lo estamos mostrando?',
      sort_order: 1,
    },
  ],
  // Cadenas sueltas, como las manda `availablePeriods()`.
  periods: ['2026-07'],
  catalog_version: 1,
}

export const metrics: WireMetric[] = []
export const blocks: WireBlock[] = []

/** Una métrica y un panel, lo mínimo para que la consola dibuje una celda.
 *
 *  **`shape`, `family` y `layer` van en el idioma del servicio.** Si acá
 *  dijeran `escalar` o `demanda`, el adaptador los rechazaría — que es
 *  justamente lo que tiene que hacer con un valor que el cable no produce. */
export const kpiMetric: WireMetric = {
  id: 'm-kpi',
  tenant_id: 't-1',
  key: 'ventas_dia',
  name: 'Venta diaria',
  shape: 'scalar',
  family: 'demand',
  layer: 'GOLD',
  source: 'Snowflake',
  base: '48 tiendas sobre 52',
  unit: 'USD',
  min_grain: 'month',
  dimensions: [],
  catalog_version: 1,
}

export const kpiPanel: WirePanel = {
  id: 'p-1',
  metric_id: 'm-kpi',
  type: 'kpi',
  col_start: 1,
  col_span: 4,
  row_span: 4,
}

export const handlers = [
  http.get(`${API}/config/me`, () => ok(context)),
  // **Arreglo desnudo**, no `{ metrics }` ni `{ blocks }`: es lo que sale de
  // `SendSuccess(c, 200, metrics)` en Go.
  http.get(`${API}/config/catalog`, () => ok(metrics)),
  http.get(`${API}/config/blocks`, () => ok(blocks)),
]
