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

/** Las nueve formas que el materializador sabe transformar, repartidas para que
 *  la biblioteca del builder tenga con qué en los cinco grupos. */
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
] as const

export const catalogo = FORMAS.flatMap(([shape, family], i) =>
  [0, 1].map((k) => ({
    id: M(i * 2 + k),
    tenant_id: TENANT,
    key: `${shape}_${String(i)}_${String(k)}`,
    name: `${['Ventas', 'Margen', 'Tráfico', 'Inversión', 'Retorno', 'Stock', 'Quiebres', 'Órdenes', 'Ticket medio', 'Recompra'][i] ?? 'Métrica'} ${String(k + 1)}`,
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
 *  existe. */
export const bloques = [
  { type: 'kpi', ui_name: 'KPI', accepted_shapes: ['scalar', 'scalar_with_interval'], col_span_min: 3, col_span_max: 4, row_span_min: 3, row_span_max: 4, layout_params: ['maximum'] },
  { type: 'prose', ui_name: 'Prosa', accepted_shapes: ['prose'], col_span_min: 4, col_span_max: 12, row_span_min: 3, row_span_max: 6, layout_params: ['pillars'] },
  { type: 'series', ui_name: 'Serie', accepted_shapes: ['time_series', 'multi_series'], col_span_min: 6, col_span_max: 12, row_span_min: 4, row_span_max: 8, layout_params: ['normalization'] },
  { type: 'bars', ui_name: 'Barras', accepted_shapes: ['categorical', 'ranking'], col_span_min: 4, col_span_max: 8, row_span_min: 4, row_span_max: 5, layout_params: ['order', 'cap'] },
  { type: 'table', ui_name: 'Tabla', accepted_shapes: ['tabular'], col_span_min: 6, col_span_max: 12, row_span_min: 4, row_span_max: 10, layout_params: ['columns', 'order'] },
  { type: 'gauge', ui_name: 'Medidor', accepted_shapes: ['scalar'], col_span_min: 3, col_span_max: 4, row_span_min: 4, row_span_max: 5, layout_params: ['maximum', 'band'] },
  { type: 'forecast', ui_name: 'Pronóstico', accepted_shapes: ['scalar_with_interval'], col_span_min: 6, col_span_max: 12, row_span_min: 4, row_span_max: 8, layout_params: ['horizon', 'cut'] },
  { type: 'list', ui_name: 'Lista', accepted_shapes: ['ranking'], col_span_min: 3, col_span_max: 6, row_span_min: 4, row_span_max: 8, layout_params: ['cap', 'order'] },
  { type: 'reco', ui_name: 'Recomendación', accepted_shapes: ['prose'], col_span_min: 4, col_span_max: 8, row_span_min: 4, row_span_max: 8, layout_params: ['cap', 'window'] },
  { type: 'composition', ui_name: 'Composición', accepted_shapes: ['composition'], col_span_min: 4, col_span_max: 6, row_span_min: 4, row_span_max: 6, layout_params: ['order'] },
  { type: 'comparison', ui_name: 'Comparación', accepted_shapes: ['categorical'], col_span_min: 4, col_span_max: 8, row_span_min: 4, row_span_max: 6, layout_params: [] },
  { type: 'distribution', ui_name: 'Distribución', accepted_shapes: ['tabular'], col_span_min: 4, col_span_max: 8, row_span_min: 4, row_span_max: 6, layout_params: ['bins'] },
  { type: 'blocked', ui_name: 'Bloqueado', accepted_shapes: ['*'], col_span_min: 3, col_span_max: 12, row_span_min: 3, row_span_max: 6, layout_params: [] },
  { type: 'matrix', ui_name: 'Matriz', accepted_shapes: ['tabular'], col_span_min: 6, col_span_max: 12, row_span_min: 4, row_span_max: 8, layout_params: [] },
  { type: 'graph', ui_name: 'Grafo', accepted_shapes: ['multi_series'], col_span_min: 6, col_span_max: 12, row_span_min: 4, row_span_max: 8, layout_params: [] },
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
  role: { id: R(1), name: 'CEO' },
  tabs: tabsDe(LAYOUT_PUB).map((t) => ({
    id: t.tab.ID,
    name: t.tab.Name,
    operational_question: t.tab.OperationalQuestion,
    sort_order: t.tab.SortOrder,
  })),
  periods: ['2026-09', '2026-08', '2026-07'],
  catalog_version: 4,
}
