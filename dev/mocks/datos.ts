/** Los datos del modo de desarrollo · fixtures del CABLE, no del contrato
 *
 *  ── POR QUÉ ESTO NO VIVE EN `tests/mocks/` NI EN `src/` ─────────────────────
 *
 *  **`tests/mocks/` no se toca**: sus handlers son el PISO de las pruebas —«el
 *  contexto mínimo con el que la app arranca, no un catálogo de escenarios»— y
 *  meterle una plataforma entera los convertiría en un escenario que después
 *  hay que mantener sincronizado con cada prueba.
 *
 *  **Y `src/` menos todavía.** F0.8 dice que los mocks no entran al bundle, y
 *  está «cumplido por construcción»: la garantía es que **no existe ruta de
 *  import desde `src/` hasta un mock**. Un import condicionado por
 *  `import.meta.env.DEV` la rompería — quedaría a merced de que el tree-shaking
 *  haga lo que creemos.
 *
 *  Por eso el modo mock es una **entrada de Vite aparte** —`dev/main.tsx` con su
 *  propio `index.dev.html`—: `src/main.tsx` no se toca y el build de producción
 *  no ve este archivo nunca.
 *
 *  ── Y LOS FIXTURES SON DEL CABLE ────────────────────────────────────────────
 *
 *  snake_case y PascalCase donde corresponde, como el servicio los manda. Un
 *  fixture en el idioma de nuestra capa interna **no probaría la frontera, la
 *  escondería** — que es el aprendizaje de la integración del 2026-09-14.
 */

export const TENANT = '11111111-1111-1111-1111-111111111111'
export const LAYOUT_PUB = '22222222-2222-2222-2222-222222222222'
export const LAYOUT_DRAFT = '22222222-2222-2222-2222-333333333333'
export const TAB_A = '33333333-3333-3333-3333-333333333333'
export const TAB_B = '33333333-3333-3333-3333-444444444444'

const M = (n: number) => `44444444-4444-4444-4444-4444444444${String(n).padStart(2, '0')}`
const P = (n: number) => `55555555-5555-5555-5555-5555555555${String(n).padStart(2, '0')}`
const R = (n: number) => `66666666-6666-6666-6666-6666666666${String(n).padStart(2, '0')}`

export const usuario = {
  id: '77777777-7777-7777-7777-777777777777',
  tenant_id: TENANT,
  email: 'admin@lobueno.co',
  first_name: 'María',
  last_name: 'Benítez',
  phone: '',
  role: 'admin',
  password_updated: true,
}

/** Las formas que el materializador sabe transformar, repartidas para que la
 *  biblioteca del builder tenga con qué en los cinco grupos.
 *
 *  **Decía «las nueve» y eran quince desde `168a761`**, del 2026-09-21. El
 *  conteo se saca a propósito: un número en prosa se vence sin que nadie lo
 *  note, y éste ya lo hizo —y de paso ayudó a que le mandáramos al backend un
 *  mensaje equivocado el 2026-09-25 diciendo que no emitían dos de ellas—.
 *
 *  Las cinco que faltan acá —`compared_categorical`, `multi_attribute_profile`,
 *  `matrix`, `graph`, `flow`— **no tienen esquema en nuestro contrato**: son
 *  F4.17–F4.19, bloqueadas por eso y no porque el backend no las mande. */
const FORMAS = [
  ['scalar', 'demand'],
  ['scalar', 'inventory'],
  ['scalar_with_interval', 'demand'],
  ['time_series', 'demand'],
  ['multi_series', 'media'],
  ['categorical', 'media'],
  ['ranking', 'inventory'],
  ['tabular', 'external'],
  ['prose', 'customer'],
  ['composition', 'demand'],
  // Las dos que se adaptaron el 2026-09-25 y **no se podían mirar en ningún
  // lado**: el servicio real no tiene métricas de estas formas y los mocks no
  // las tenían. `series_with_band` es la que sostiene «un pronóstico sin banda
  // no se publica», que sin esto no se ejercitaba nunca.
  ['series_with_band', 'demand'],
  ['distribution', 'inventory'],
] as const

export const catalogo = FORMAS.flatMap(([shape, family], i) =>
  [0, 1].map((k) => ({
    id: M(i * 2 + k),
    tenant_id: TENANT,
    key: `${shape}_${String(i)}_${String(k)}`,
    name: `${['Ventas', 'Margen', 'Tráfico', 'Inversión', 'Retorno', 'Stock', 'Quiebres', 'Órdenes', 'Ticket medio', 'Recompra', 'Pronóstico de venta', 'Días de cobertura'][i] ?? 'Métrica'} ${String(k + 1)}`,
    shape,
    family,
    layer: ['GOLD', 'SILVER', 'BRONZE'][(i + k) % 3],
    source: ['ERP', 'ERP + Ads API', 'Merchant Center', 'Analítica de sitio'][i % 4],
    base: '312 SKU críticos sobre 18.240 activos',
    unit: i % 3 === 0 ? 'USD' : null,
    semantic_direction: i % 2 === 0 ? 'HIGHER = BETTER' : null,
    min_grain: ['day', 'week', 'month'][i % 3],
    dimensions: ['canal', 'categoria'],
    catalog_version: 4,
  })),
)

/** Los quince tipos con sus rangos · es lo que gobierna la biblioteca y el
 *  binder, así que tiene que estar completo o el builder miente sobre qué
 *  existe.
 *
 *  ── CAPTURADO DEL SERVICIO, NO ESCRITO DE MEMORIA · 2026-09-15 ──────────────
 *
 *  `GET /api/v1/config/blocks` contra el servicio corriendo. La primera versión
 *  de esta tabla se escribió de memoria y **las quince filas estaban mal**: cinco
 *  con `accepted_shapes` equivocadas, los quince `ui_name` traducidos al español
 *  —el cable los manda en inglés— y casi todos los rangos de span.
 *
 *  Las cinco formas importan más que el resto porque son las que decide
 *  `invalidReason`: el mock decía que `distribution` acepta `tabular` y que
 *  `comparison` acepta `categorical`, así que **componer contra el mock daba una
 *  validación que el servidor no da**. Es la trampa que ya está escrita en
 *  `CLAUDE.md` —«un mock que habla el idioma de tu capa interna no prueba la
 *  frontera, la esconde»— en su otra mitad: uno que habla el idioma equivocado
 *  del cable tampoco.
 *
 *  **`blocked` no trae `layout_params`** y acá se respeta la ausencia: es el
 *  caso que cubre el spread condicional de `adapt.ts`. Ponerle `[]` lo escondía.
 *
 *  **Los `ui_name` en inglés son del servicio y quedan tal cual**, que es la
 *  regla del fixture. No llegan a la pantalla: `Bloque` del contrato no tiene
 *  campo de nombre, así que `adaptBlocks` no lo lleva y la biblioteca del
 *  builder rotula con `tipo`. Traducirlos acá habría hecho que el fixture
 *  pareciera resolver algo que el adaptador ni mira. */
export const bloques = [
  { type: 'kpi', ui_name: 'KPI', accepted_shapes: ['scalar'], col_span_min: 3, col_span_max: 4, row_span_min: 3, row_span_max: 4, layout_params: ['comparative', 'meter'] },
  { type: 'prose', ui_name: 'Prose / summary', accepted_shapes: ['prose'], col_span_min: 8, col_span_max: 12, row_span_min: 3, row_span_max: 4, layout_params: ['pillars'] },
  { type: 'series', ui_name: 'Time series', accepted_shapes: ['time_series', 'multi_series'], col_span_min: 5, col_span_max: 7, row_span_min: 4, row_span_max: 5, layout_params: ['normalization', 'cut'] },
  { type: 'bars', ui_name: 'Bars', accepted_shapes: ['categorical', 'ranking'], col_span_min: 4, col_span_max: 8, row_span_min: 4, row_span_max: 5, layout_params: ['order', 'brand'] },
  { type: 'table', ui_name: 'Table', accepted_shapes: ['tabular'], col_span_min: 5, col_span_max: 8, row_span_min: 4, row_span_max: 5, layout_params: ['order', 'columns'] },
  { type: 'gauge', ui_name: 'Gauge', accepted_shapes: ['scalar'], col_span_min: 3, col_span_max: 7, row_span_min: 4, row_span_max: 4, layout_params: ['band', 'components', 'maximum'] },
  { type: 'forecast', ui_name: 'Forecast', accepted_shapes: ['scalar_with_interval', 'series_with_band'], col_span_min: 4, col_span_max: 6, row_span_min: 4, row_span_max: 5, layout_params: ['horizon', 'interval_level', 'cut'] },
  { type: 'list', ui_name: 'List / ranking', accepted_shapes: ['ranking'], col_span_min: 3, col_span_max: 5, row_span_min: 4, row_span_max: 5, layout_params: ['order', 'cap'] },
  { type: 'reco', ui_name: 'Recommendation', accepted_shapes: ['prose'], col_span_min: 4, col_span_max: 5, row_span_min: 4, row_span_max: 5, layout_params: ['cap', 'window'] },
  { type: 'composition', ui_name: 'Composition / stacked', accepted_shapes: ['composition'], col_span_min: 4, col_span_max: 8, row_span_min: 4, row_span_max: 5, layout_params: ['cuts', 'order'] },
  { type: 'comparison', ui_name: 'Comparison', accepted_shapes: ['compared_categorical', 'multi_attribute_profile'], col_span_min: 5, col_span_max: 8, row_span_min: 4, row_span_max: 5, layout_params: ['reference', 'order', 'profile_cap'] },
  { type: 'distribution', ui_name: 'Distribution', accepted_shapes: ['distribution'], col_span_min: 5, col_span_max: 8, row_span_min: 4, row_span_max: 5, layout_params: ['bins', 'stats'] },
  { type: 'blocked', ui_name: 'Blocked panel', accepted_shapes: ['*'], col_span_min: 4, col_span_max: 6, row_span_min: 4, row_span_max: 4 },
  { type: 'matrix', ui_name: 'Matrix / heatmap', accepted_shapes: ['matrix'], col_span_min: 6, col_span_max: 12, row_span_min: 5, row_span_max: 7, layout_params: ['scale'] },
  { type: 'graph', ui_name: 'Graph / flow', accepted_shapes: ['graph', 'flow'], col_span_min: 6, col_span_max: 12, row_span_min: 7, row_span_max: 7, layout_params: ['clustering'] },
]

export const roles = [
  { id: R(1), tenant_id: TENANT, name: 'CEO', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 2 },
  { id: R(2), tenant_id: TENANT, name: 'Planner', tab_ids: [TAB_A], hidden_metric_ids: [M(4), M(5)], layout_overrides: {}, user_count: 5 },
  // Uno sin usuarios, para ver que borrar se ofrece; y uno sin pestañas, que es
  // el caso que la unión de `RoleIDs` no encontraría nunca.
  { id: R(3), tenant_id: TENANT, name: 'Analista', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 0 },
]

export const tenants = [
  { id: TENANT, name: 'Under Armour México' },
  { id: '11111111-1111-1111-1111-222222222222', name: 'Terpel Colombia' },
]

const panel = (n: number, metric: number, tab: string, colStart: number, colSpan: number, tipo: string) => ({
  ID: P(n), TabID: tab, MetricID: M(metric), Type: tipo,
  ColStart: colStart, ColSpan: colSpan, RowSpan: 4,
})

export const layouts = [
  { ID: LAYOUT_PUB, TenantID: TENANT, Status: 'published', VersionID: 'v3', PublishedAt: '2026-09-10T12:00:00Z' },
  { ID: LAYOUT_DRAFT, TenantID: TENANT, Status: 'draft', VersionID: 'v4', PublishedAt: null },
]

const tabsDe = (layout: string) => [
  {
    tab: { ID: TAB_A, LayoutVersionID: layout, Name: 'eCommerce Overview', OperationalQuestion: '¿Cómo va el negocio?', SortOrder: 1, RoleIDs: [] },
    panels: [
      panel(1, 0, TAB_A, 1, 3, 'kpi'),
      panel(2, 1, TAB_A, 4, 3, 'kpi'),
      panel(3, 6, TAB_A, 7, 6, 'series'),
      panel(4, 12, TAB_A, 1, 4, 'bars'),
      // **El pronóstico, con su banda** · el bloque `forecast` acepta
      // `series_with_band`, y su `colSpan` va de 4 a 6.
      panel(6, 20, TAB_A, 5, 4, 'forecast'),
      // Y la distribución · su `colSpan` va de 5 a 8.
      panel(7, 22, TAB_A, 9, 5, 'distribution'),
    ],
  },
  {
    tab: { ID: TAB_B, LayoutVersionID: layout, Name: 'Inventory & Shopping', OperationalQuestion: '', SortOrder: 2, RoleIDs: [R(1)] },
    panels: [panel(5, 13, TAB_B, 1, 6, 'list')],
  },
]

export const detalle = (layout: string) => ({
  layout: layouts.find((l) => l.ID === layout) ?? layouts[1],
  tabs: tabsDe(layout),
})

/** El contexto de la consola · forma del cable. */
export const contexto = {
  user: { id: usuario.id, email: usuario.email, first_name: usuario.first_name, last_name: usuario.last_name },
  tenant: { id: TENANT, name: 'Under Armour México', timezone: 'America/Mexico_City' },
  // **`admin`, y no uno de los tres roles del cliente.** El login de este modo
  // ya devolvía `role: 'admin'` y `/config/me` devolvía `CEO`: la consola lee el
  // segundo, así que el menú de usuario escondía la salida a administración y al
  // builder — justo lo que este modo existe para poder recorrer.
  //
  // Va con id propio y no con `R(1)`: el super-admin es del plano PLATAFORMA
  // —§3.1, «cross-tenant por diseño»— y CEO, Planner y Analista son roles DEL
  // cliente. Reusar el id de CEO habría hecho que el mismo identificador
  // significara dos cosas.
  role: { id: '66666666-6666-6666-6666-6666666666ad', name: 'admin' },
  tabs: tabsDe(LAYOUT_PUB).map((t) => ({
    id: t.tab.ID,
    name: t.tab.Name,
    operational_question: t.tab.OperationalQuestion,
    sort_order: t.tab.SortOrder,
  })),
  periods: ['2026-09', '2026-08', '2026-07'],
  catalog_version: 4,
}
