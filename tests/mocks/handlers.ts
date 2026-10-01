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
  // `theme` es requerido desde el 2026-09-26 · B1.1 · medido contra `8633b10`.
  user: {
    id: 'u-1',
    email: 'prueba@uamx.test',
    first_name: 'Prueba',
    last_name: 'Uno',
    theme: 'light',
  },
  // ── POR QUÉ `es-MX` Y NO EL VALOR MEDIDO · 2026-09-26 ────────────────────
  //
  // Acá decía `es-CO`, `COP` y `America/Bogota`, que es lo que el servicio
  // devuelve HOY para este tenant — el default de la migración, y dato a
  // cargar con `PUT /admin/tenants/{tenantId}`. Se escribió medido a propósito.
  //
  // **Cuando F1.13b conectó el locale, ese valor se propagó a ocho aserciones
  // que no son de locale**: `USD 4.28M` pasó a `USD 4,28M` en pruebas de
  // paneles, de estados y de frescura. Un fixture COMPARTIDO no es el lugar de
  // un dato de un día: su trabajo es ser un ejemplo coherente, y un tenant que
  // se llama «Under Armour México» con formato colombiano no lo es.
  //
  // **Lo medido no se pierde**: está en el cable, en B4.1 y en la prueba que sí
  // es de locale, que usa `es-CO` explícito porque es lo que el servicio manda.
  tenant: {
    id: 't-1',
    name: 'Under Armour México',
    label: 'Under Armour México',
    locale: 'es-MX',
    // **USD, y no la moneda del país del cliente** · decidido el 2026-10-01
    // (humano) y medido contra las tres fuentes el mismo día: el catálogo de
    // Snowflake declara `unit: USD` en las cinco métricas de dinero y su texto
    // de gobierno dice «en USD»; el `.pen` escribe USD en 62 de sus 63 nodos con
    // moneda —el único `MXN` es la variante «tenant en alta», que es otro
    // cliente—; y producto lo confirmó. UA MX factura en dólares.
    currency: 'USD',
    timezone: 'America/Mexico_City',
  },
  role: { id: 'r-planner', name: 'Planner' },
  tabs: [
    {
      id: 'tab-1',
      name: 'Inventory & Shopping',
      operational_question: '¿Tenemos stock y lo estamos mostrando?',
      sort_order: 1,
      // **La identidad estable de la pestaña** · llegó en `f70cec2`. La semilla
      // la rellenó con el slug del nombre.
      key: 'inventory-shopping',
      // **Vacíos, como los emite el servicio** · medido el 2026-09-28: la
      // semilla no trae ninguno, y `chat_suggestions` llega lista y no `null`.
      icon: '',
      chat_suggestions: [],
    },
  ],
  // Cadenas sueltas, como las manda `availablePeriods()`.
  periods: ['2026-07'],
  // ── B1.1 · los tres que llegaron el 2026-09-28 ──────────────────────────
  //
  // **Los bordes son `[start, end)`**, con el fin EXCLUSIVO: es lo que dio la
  // medición —`2026-09` va de `2026-09-01` a `2026-10-01`— y escribirlo
  // inclusivo acá haría que una prueba de rango pasara contra un fixture que
  // el servicio no emite.
  period_grain: 'month' as const,
  periods_detail: [
    { key: '2026-07', grain: 'month' as const, start: '2026-07-01', end: '2026-08-01' },
  ],
  // `single_tenant` porque el fixture es un usuario de un solo cliente, que es
  // lo que midió el token de planner. El selector de cliente del navbar sólo
  // tiene sentido con `multi_tenant`.
  scope: {
    kind: 'single_tenant' as const,
    // **`label` distinta de `name` a propósito**: el selector del navbar lee
    // la corta, y un fixture donde las dos coinciden no distingue cuál se leyó.
    tenants: [{ id: 't-1', name: 'Under Armour México', label: 'UA México' }],
  },
  catalog_version: 1,
  // ── MULTI-DASHBOARD · F5.1 · 2026-09-26 ──────────────────────────────────
  //
  // **UNO solo, y eso es lo que se prueba por defecto**: el primer bullet del
  // criterio dice «con un solo layout no hay selector». La prueba que necesita
  // dos los declara ella.
  //
  // **`active_layout_id` no es decorativo**: sin él la consola muestra «todavía
  // no se compuso», que es el estado real de un dashboard sin layout publicado
  // —medido el 2026-09-26 creando uno—. Un fixture que lo omite está simulando
  // ese estado sin querer.
  // `history_months` es REQUERIDO desde `d9147c3` · medido el 2026-10-01 contra
  // el servicio: 12 en los dos dashboards sembrados, que es el default de la
  // columna. No se omite «porque es opcional»: el cable lo pide, y un fixture
  // que lo omitiera dejaría de compilar — que es justamente cómo lo encontró.
  dashboards: [{ id: 'd-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 }],
  active_dashboard_id: 'd-1',
  active_layout_id: 'l-1',
}

/** **La pestaña del contexto, ya desenvuelta** · F5.1.
 *
 *  `context.tabs` pasó a ser `TabMeta[] | null` el 2026-09-26, porque un
 *  dashboard sin layout publicado devuelve `null` —medido—. Las nueve pruebas
 *  que hacían `tab` dejaron de compilar, y encadenar un `?.` en
 *  cada una escondería la razón. Acá está una vez, con su porqué. */
export const tab = context.tabs?.[0] as NonNullable<WireContext['tabs']>[number]

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
  // **B1.25 · requerido desde el 2026-09-26.** Con valor, porque `base` y
  // `measurement_window` son dos cosas distintas y el fixture tiene que
  // mostrarlo: `base` es el denominador —48 sobre 52— y esto es la ventana.
  // El texto es uno real de Snowflake, medido el 2026-09-26.
  measurement_window: 'Mes calendario seleccionado',
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
  chart: '',
  note: '',
}

export const handlers = [
  http.get(`${API}/config/me`, () => ok(context)),
  // **Arreglo desnudo**, no `{ metrics }` ni `{ blocks }`: es lo que sale de
  // `SendSuccess(c, 200, metrics)` en Go.
  http.get(`${API}/config/catalog`, () => ok(metrics)),
  http.get(`${API}/config/blocks`, () => ok(blocks)),
  // **`/config/plots` va en el PISO, y no es opcional** · F1.31, 2026-09-29.
  //
  // Sin él `usePlots` queda en error y el contenedor no monta: la consola entera
  // deja de renderizar por una tabla que ni siquiera bloquea nada. Lo encontró
  // agregar el hook — cinco pruebas que no lo mencionan se pusieron rojas.
  //
  // **Vacío a propósito.** El piso es «el contexto mínimo con el que la app
  // arranca», y sin repertorio la consola dibuja sin verificar, que es
  // exactamente lo que hace contra un servicio que todavía no sirve la ruta. La
  // prueba que necesita la tabla la sirve con `server.use`.
  http.get(`${API}/config/plots`, () => ok([])),
  // ── LAS DIMENSIONES DE CADA PANEL VAN EN EL PISO · F3.9, 2026-09-30 ───────
  //
  // La consola le pregunta por CADA panel de la pestaña para decidir si pinta
  // «Ver detalle» —un CTA sin manejador no se pinta—, así que sin este handler
  // toda prueba que monte el contenedor se cae: `onUnhandledRequest: 'error'`.
  //
  // **`supported: false`, que es el lado seguro.** El piso es «el contexto
  // mínimo con el que la app arranca», y sin saber si una métrica se puede
  // desagregar lo correcto es no prometer la acción. La prueba que necesita el
  // CTA lo sirve con `server.use`, que es lo que la hace decir qué ejercita.
  http.get(`${API}/config/panels/:panelId/drilldown/dimensions`, ({ params }) =>
    ok({
      panel_id: String(params['panelId']),
      metric_key: 'sin_drilldown',
      supported: false,
      // **`[]` y no `null`**: el servicio inicializa el DTO con `[]string{}` y
      // sólo después mira el registry, medido en las ocho que no soportan.
      dimensions: [],
    }),
  ),
]
