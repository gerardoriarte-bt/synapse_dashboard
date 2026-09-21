/** El servicio falso del modo de desarrollo · `npm run dev:mock`
 *
 *  **Para qué existe.** `/admin/*` cuelga de `AdminOnlyMiddleware` y los usuarios
 *  de prueba que tenemos son `Planner`: contra el servicio real, admin y builder
 *  devuelven 403 en cada llamada. Y `/admin/tenants/{id}/roles` y `/preview` son
 *  del fork, que no está desplegado: 404. Así que **la mitad de la Fase 4 no se
 *  puede ver corriendo**, aunque esté construida y probada.
 *
 *  Esto la hace navegable. No reemplaza al humo ni a las pruebas: es para MIRAR.
 *
 *  ── LO QUE ESTE MODO NO DEMUESTRA, Y HAY QUE DECIRLO ────────────────────────
 *
 *  **Que la app ande acá no dice nada sobre el servicio real.** Los mocks
 *  responden lo que nosotros creemos del cable; si la transcripción se equivocó,
 *  acá se ve perfecto y en producción falla. Eso lo cierra `npm run humo`, que
 *  compara contra el servicio de verdad — y para `/admin/*` sigue BLOQUEADO
 *  hasta que exista un usuario con rol `admin`.
 *
 *  Es exactamente el aprendizaje del 2026-09-14: **un mock que habla el idioma de
 *  tu capa interna no prueba la frontera, la esconde.** Por eso los fixtures de
 *  `datos.ts` están en el idioma del cable y no en el nuestro.
 *
 *  ── EL ESTADO ES DE MENTIRA PERO SE COMPORTA ────────────────────────────────
 *
 *  Guardar, publicar y el CRUD de roles **mutan un objeto en memoria**, así que
 *  recargar la página vuelve todo a cero. Alcanza para recorrer un flujo entero
 *  —componer, guardar, validar, publicar— que es lo que no se podía ver.
 */
import { http, HttpResponse, delay } from 'msw'
import { setupWorker } from 'msw/browser'
import { LAYOUT_PUB, bloques, catalogo, contexto, detalle, layouts, roles, tenants, usuario } from './datos'

const API = '*/api/v1'
const ok = <T,>(data: T) => HttpResponse.json({ success: true, data })
const mal = (mensaje: string, status: number) =>
  HttpResponse.json({ success: false, error: mensaje }, { status })

/* ── El estado mutable ─────────────────────────────────────────────────────
 *
 * Un objeto y no un store: lo único que tiene que hacer es sobrevivir entre
 * llamadas. Que se pierda al recargar es correcto — nadie debería confundir
 * esto con una base.
 */
const estado = {
  layouts: structuredClone(layouts),
  detalles: new Map(layouts.map((l) => [l.ID, structuredClone(detalle(l.ID))])),
  roles: structuredClone(roles),
}

/** `panelId` → la forma de la métrica que ese panel dibuja.
 *
 *  El layout y el catálogo ya estaban; lo único que faltaba era cruzarlos. Sin
 *  esto el handler emitía un valor por índice, sin mirar qué forma pedía cada
 *  panel — así que hasta un `bars` recibía un escalar. */
function formaDe(panelId: string): string {
  const paneles = [...estado.detalles.values()].flatMap((d) => d.tabs.flatMap((t) => t.panels))
  const panel = paneles.find((p) => p.ID === panelId)
  if (panel === undefined) return 'scalar'
  return catalogo.find((m) => m.id === panel.MetricID)?.shape ?? 'scalar'
}

/** Un valor del CABLE para cada una de las nueve formas que el backend
 *  materializa. **Las claves salen de `synapse-console-wire.yaml`**, no de la
 *  memoria: `v` y no `valor`, `headline` y no `titular`, `t`/`v` en los puntos. */
function valorPara(forma: string, i: number): Record<string, unknown> {
  const n = 128_400 + i * 1_000
  const meses = ['abr', 'may', 'jun', 'jul', 'ago', 'sep']
  const puntos = meses.map((t, k) => ({ t, v: n * (0.82 + k * 0.05) }))
  switch (forma) {
    case 'scalar':
      return { shape: 'scalar', v: n }
    case 'scalar_with_interval':
      return { shape: 'scalar_with_interval', v: n, low: n * 0.9, high: n * 1.1 }
    case 'time_series':
      return { shape: 'time_series', points: puntos }
    case 'multi_series':
      return {
        shape: 'multi_series',
        series: [
          { label: 'Busqueda', points: puntos },
          { label: 'Social', points: puntos.map((p) => ({ ...p, v: p.v * 0.6 })) },
        ],
      }
    case 'categorical':
      return {
        shape: 'categorical',
        items: [
          { label: 'Calzado', v: n * 0.42 },
          { label: 'Ropa', v: n * 0.33 },
          { label: 'Accesorios', v: n * 0.25 },
        ],
      }
    case 'ranking':
      return {
        shape: 'ranking',
        items: [
          { label: 'Polo Pique M', v: 412, position: 1 },
          { label: 'Short Tech L', v: 388, position: 2 },
          { label: 'Gorra Curry', v: 291, position: 3 },
        ],
      }
    case 'tabular':
      return {
        shape: 'tabular',
        columns: [
          { key: 'tienda', title: 'Tienda', numeric: false },
          { key: 'venta', title: 'Venta', numeric: true },
        ],
        rows: [
          { tienda: 'Perisur', venta: n * 0.2 },
          { tienda: 'Antara', venta: n * 0.17 },
        ],
      }
    case 'prose':
      return {
        shape: 'prose',
        headline: 'La venta crecio por medios pagos, y el inventario no acompano.',
        pillars: [
          { label: 'Venta', value: 'USD 4.28M', note: '+6.4% vs ago' },
          { label: 'Cobertura', value: '31 d' },
        ],
      }
    case 'composition':
      return {
        shape: 'composition',
        parts: [
          { label: 'Organico', v: n * 0.55 },
          { label: 'Pago', v: n * 0.31 },
          { label: 'Directo', v: n * 0.14 },
        ],
      }
    default:
      return { shape: 'scalar', v: n }
  }
}

export const worker = setupWorker(
  /* ── Acceso ─────────────────────────────────────────────────────────────── */
  http.post(`${API}/auth/login`, async () => {
    // **Cualquier credencial entra**, y el usuario que devuelve es `admin`: ese
    // es todo el punto de este modo. Con una contraseña de verdad acá se estaría
    // fingiendo una autenticación que no existe.
    await delay(120)
    return ok({ token: 'token-de-desarrollo', user: usuario })
  }),
  http.get(`${API}/auth/token-info`, () => ok({ user: usuario })),

  /* ── Consola ────────────────────────────────────────────────────────────── */
  http.get(`${API}/config/me`, async () => {
    await delay(200)
    return ok(contexto)
  }),
  // **Arreglos desnudos**, no `{ metrics }` ni `{ blocks }`: es lo que sale de
  // `SendSuccess(c, 200, metrics)` en Go.
  http.get(`${API}/config/catalog`, () => ok(catalogo)),
  http.get(`${API}/config/blocks`, () => ok(bloques)),
  http.get(`${API}/config/tabs/:tabId`, ({ params }) => {
    const d = estado.detalles.get(LAYOUT_PUB)
    const t = d?.tabs.find((x) => x.tab.ID === params['tabId'])
    if (t === undefined) return mal('tab not found', 404)
    return ok({
      tab: {
        id: t.tab.ID,
        name: t.tab.Name,
        operational_question: t.tab.OperationalQuestion,
        sort_order: t.tab.SortOrder,
      },
      panels: t.panels.map((p) => ({
        id: p.ID, metric_id: p.MetricID, type: p.Type,
        col_start: p.ColStart, col_span: p.ColSpan, row_span: p.RowSpan,
      })),
    })
  }),
  http.post(`${API}/config/panels:batch`, async ({ request }) => {
    const { panel_ids } = (await request.json()) as { panel_ids: string[] }
    await delay(400)
    // **Uno de cada cuatro llega degradado y uno bloqueado.** Con todo en
    // DISPONIBLE, los siete estados de §8 no se ven nunca — que es justamente lo
    // que este modo existe para poder mirar.
    return ok(
      Object.fromEntries(
        panel_ids.map((id, i) => [
          id,
          i % 4 === 3
            ? { status: 'BLOCKED', reason: 'Su fuente tiene 31 h y se refresca cada hora', unlocks_with: 'Esperar la próxima materialización' }
            : {
                status: i % 4 === 2 ? 'DEGRADED' : 'AVAILABLE',
                governance: {
                  base: '312 SKU críticos sobre 18.240 activos',
                  layer: 'GOLD',
                  source: 'ERP',
                  freshness: new Date().toISOString(),
                  catalog_version: 4,
                },
                // **El valor tiene que corresponder a la FORMA de su métrica.**
                // Hasta el 2026-09-16 esto emitía `{ valor, delta }` para todos:
                // ni la forma del cable ni la del contrato. El adaptador lo
                // rechazaba con razón —«El valor no declara su forma»— y **la
                // consola del modo mock se veía rota**, que es justo lo que este
                // modo existe para evitar. Se descubrió abriéndolo en el
                // navegador por primera vez.
                value: valorPara(formaDe(id), i),
                ...(i % 4 === 2 ? { reason: 'Stale data: last materialization is older than 3 days' } : {}),
              },
        ]),
      ),
    )
  }),
  http.put(`${API}/config/me/preferences`, () => ok({ theme: 'dark' })),

  /** El chat contextual · F3.3.
   *
   *  **Responde el CABLE, no nuestro vocabulario interno**: `event:` en una
   *  línea y `data:` con las claves del servicio en otra. Es la única forma de
   *  que este modo sirva para mirar el chat — un mock que hablara el dialecto
   *  de `api/types` volvería a esconder exactamente la frontera que dejó pasar
   *  que el chat no pintara una sola palabra.
   *
   *  No manda `event: data`: el traductor lo descarta mientras F3.6 siga
   *  bloqueada, y emitirlo daría la impresión contraria. */
  /** El historial de hilos · F3.7. **Con los DOS ids**, que es lo que hay que
   *  poder mirar: el uuid nombra la fila y el entero continúa la conversación.
   *  Uno de los tres va sin contexto de panel, como los hilos viejos. */
  http.get(`${API}/config/chat/threads`, ({ request }) => {
    const panel = new URL(request.url).searchParams.get('panel_id') ?? 'p-1'
    const base = {
      agent_id: 'a-1', agent_name: 'UA MX', role: 'Planner',
      tab_id: 'tab-1', tab_name: 'Ecommerce Overview',
      metric_id: 'm-1', metric_key: 'ventas_dia',
    }
    return ok([
      {
        ...base, id: '3f1d0a6e-0000-4000-8000-000000000001', thread_id: 41,
        thread_name: 'hilo 41', first_message_preview: '¿Por qué cayó la venta la semana pasada?',
        panel_id: panel, period: '2026-09', metric_name: 'Ventas 1',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      },
      {
        ...base, id: '3f1d0a6e-0000-4000-8000-000000000002', thread_id: 39,
        thread_name: 'hilo 39', first_message_preview: '¿Qué tiendas quedaron sin cobertura?',
        panel_id: panel, period: '2026-08', metric_name: 'Ventas 1',
        created_at: '2026-08-14T10:00:00Z', updated_at: '2026-08-14T10:00:00Z',
      },
      {
        // Sin contexto: abierto antes de que existiera. La fila se dibuja igual.
        ...base, id: '3f1d0a6e-0000-4000-8000-000000000003', thread_id: 12,
        thread_name: 'hilo 12', first_message_preview: 'Una pregunta vieja, sin panel',
        period: '', metric_name: '', metric_key: '', tab_name: '',
        created_at: '2026-07-02T10:00:00Z', updated_at: '2026-07-02T10:00:00Z',
      },
    ])
  }),

  http.post(`${API}/config/chat`, async ({ request }) => {
    const { question } = (await request.json()) as { question: string }

    const trama = (evento: string, datos: unknown) =>
      `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`

    const fragmentos = [
      'Cayó 12% contra el mes anterior. ',
      'El quiebre se concentra en 312 SKU de la familia de inventario, ',
      'todos con cobertura menor a siete días.\n\n',
      '### Límite declarado\n',
      'No cubre las tiendas sin lectura de inventario en el período.',
    ]

    const encoder = new TextEncoder()
    return new HttpResponse(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode(
              trama('thread_info', {
                thread_id: 41,
                parent_message_id: 7,
                user_thread_id: '3f1d0a6e-0000-4000-8000-000000000001',
              }),
            ),
          )
          controller.enqueue(encoder.encode(trama('thinking', { status: 'running', message: question })))
          // De a fragmentos y con pausa: sin esto el texto aparece entero y el
          // estado de streaming no se ve nunca, que es la mitad de lo que hay
          // que poder mirar.
          for (const text of fragmentos) {
            await delay(220)
            controller.enqueue(encoder.encode(trama('delta', { text })))
          }
          controller.enqueue(
            encoder.encode(
              trama('sql', {
                sql: 'select sku, cobertura_dias\n  from gold.inventario\n where periodo = :periodo\n   and cobertura_dias < 7',
                tool: 'cortex_analyst',
              }),
            ),
          )
          controller.enqueue(encoder.encode(trama('done', {})))
          controller.close()
        },
      }),
      { headers: { 'content-type': 'text/event-stream' } },
    )
  }),

  /* ── Admin y builder ────────────────────────────────────────────────────── */
  http.get(`${API}/admin/tenants`, () => ok(tenants)),
  http.get(`${API}/admin/tenants/:id/catalog`, () => ok(catalogo)),
  http.get(`${API}/admin/tenants/:id/layouts`, () => ok(estado.layouts)),

  http.post(`${API}/admin/tenants/:id/layouts`, async ({ request }) => {
    const { version_id } = (await request.json()) as { version_id?: string }
    const nuevo = {
      ID: crypto.randomUUID(), TenantID: tenants[0]!.id, Status: 'draft',
      VersionID: `${version_id ?? 'v'}-copia`, PublishedAt: null,
    }
    estado.layouts = [nuevo, ...estado.layouts]
    // Duplicar copia el contenido de la versión de origen, que es lo que hace
    // que «duplicar para editar» sirva de algo.
    const origen = estado.detalles.get(LAYOUT_PUB)
    estado.detalles.set(nuevo.ID, { layout: nuevo, tabs: structuredClone(origen?.tabs ?? []) })
    return HttpResponse.json({ success: true, data: nuevo }, { status: 201 })
  }),

  http.get(`${API}/admin/layouts/:id`, ({ params }) => {
    const d = estado.detalles.get(params['id'] as string)
    return d === undefined ? mal('layout not found', 404) : ok(d)
  }),

  http.put(`${API}/admin/layouts/:id`, async ({ params, request }) => {
    const id = params['id'] as string
    const layout = estado.layouts.find((l) => l.ID === id)
    // **El 409 de verdad**, que es el que hace útil a la barra de guardado: el
    // servicio solo deja editar borradores.
    if (layout?.Status === 'published') return mal('layout is published', 409)

    const cuerpo = (await request.json()) as {
      tabs: { id?: string; name: string; operational_question: string; sort_order: number; role_ids?: string[]; panels?: unknown[] }[]
    }
    await delay(300)
    const d = {
      layout: layout ?? estado.layouts[0]!,
      // **Una pestaña sin `id` gana uno nuevo**, como el servicio: es lo que
      // hace que el segundo guardado no duplique.
      tabs: cuerpo.tabs.map((t) => ({
        tab: {
          ID: t.id ?? crypto.randomUUID(),
          LayoutVersionID: id,
          Name: t.name,
          OperationalQuestion: t.operational_question,
          SortOrder: t.sort_order,
          RoleIDs: t.role_ids ?? [],
        },
        panels: (t.panels ?? []).map((p) => {
          const q = p as { id?: string; metric_id: string; type: string; col_start: number; col_span: number; row_span: number; options?: unknown }
          return {
            ID: q.id ?? crypto.randomUUID(), TabID: t.id ?? '', MetricID: q.metric_id,
            Type: q.type, ColStart: q.col_start, ColSpan: q.col_span, RowSpan: q.row_span,
            ...(q.options === undefined ? {} : { Options: q.options }),
          }
        }),
      })),
    }
    estado.detalles.set(id, d)
    return ok(d)
  }),

  http.post(`${API}/admin/layouts/:id/validate`, async ({ params }) => {
    await delay(500)
    const d = estado.detalles.get(params['id'] as string)
    // **200 aunque sea inválido** · el 200 dice que la validación corrió. Y lo
    // que marca es una pestaña sin pregunta operativa, que es la regla dura.
    const errors = (d?.tabs ?? [])
      .filter((t) => t.tab.OperationalQuestion.trim() === '')
      .map((t) => ({
        tab_id: t.tab.ID,
        field: 'operational_question',
        message: 'una pestaña que no contesta una pregunta no se compone',
      }))
    return ok({ valid: errors.length === 0, errors })
  }),

  http.post(`${API}/admin/layouts/:id/publish`, async ({ params }) => {
    const id = params['id'] as string
    await delay(400)
    const d = estado.detalles.get(id)
    if ((d?.tabs ?? []).some((t) => t.tab.OperationalQuestion.trim() === '')) {
      return mal('invalid panels', 422)
    }
    // Publicar **demota al anterior**: solo hay uno publicado por tenant.
    estado.layouts = estado.layouts.map((l) => ({
      ...l,
      Status: l.ID === id ? 'published' : l.Status === 'published' ? 'draft' : l.Status,
      PublishedAt: l.ID === id ? new Date().toISOString() : l.PublishedAt,
    }))
    return ok(estado.layouts.find((l) => l.ID === id))
  }),

  /* ── B4.8 y B4.9 · del fork ─────────────────────────────────────────────── */
  http.get(`${API}/admin/tenants/:id/roles`, async () => {
    await delay(200)
    return ok(estado.roles)
  }),
  http.post(`${API}/admin/tenants/:id/roles`, async ({ request }) => {
    const r = (await request.json()) as { name: string; tab_ids?: string[]; hidden_metric_ids?: string[] }
    if (estado.roles.some((x) => x.name === r.name)) return mal('ya existe un rol con ese nombre', 409)
    const nuevo = {
      id: crypto.randomUUID(), tenant_id: tenants[0]!.id, name: r.name,
      tab_ids: r.tab_ids ?? [], hidden_metric_ids: r.hidden_metric_ids ?? [],
      layout_overrides: {}, user_count: 0,
    }
    estado.roles = [...estado.roles, nuevo]
    return HttpResponse.json({ success: true, data: nuevo }, { status: 201 })
  }),
  http.put(`${API}/admin/roles/:roleId`, async ({ params, request }) => {
    const r = (await request.json()) as { name: string; tab_ids?: string[]; hidden_metric_ids?: string[] }
    const id = params['roleId'] as string
    estado.roles = estado.roles.map((x) =>
      x.id === id ? { ...x, name: r.name, tab_ids: r.tab_ids ?? [], hidden_metric_ids: r.hidden_metric_ids ?? [] } : x,
    )
    return ok(estado.roles.find((x) => x.id === id))
  }),
  http.delete(`${API}/admin/roles/:roleId`, ({ params }) => {
    const id = params['roleId'] as string
    const r = estado.roles.find((x) => x.id === id)
    // **Con usuarios no se borra**, y el mensaje dice cuántos · es la regla de
    // B4.8 y lo que la pantalla muestra antes de ofrecer el botón.
    if (r !== undefined && r.user_count > 0) {
      return mal(`el rol tiene ${String(r.user_count)} usuario(s) asignado(s) · reasignalos antes de borrarlo`, 409)
    }
    estado.roles = estado.roles.filter((x) => x.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/admin/layouts/:id/preview`, async ({ params, request }) => {
    await delay(300)
    const rolId = new URL(request.url).searchParams.get('roleId') ?? ''
    const rol = estado.roles.find((r) => r.id === rolId)
    if (rol === undefined) return mal('role not found', 404)
    const d = estado.detalles.get(params['id'] as string)

    // **El recorte lo hace el servidor** · acá se simula con las mismas reglas:
    // `tab_ids` vacío ve todas, y `hidden_metric_ids` saca paneles.
    const tabs = (d?.tabs ?? [])
      .filter((t) => rol.tab_ids.length === 0 || rol.tab_ids.includes(t.tab.ID))
      .map((t) => ({
        tab: {
          id: t.tab.ID, name: t.tab.Name,
          operational_question: t.tab.OperationalQuestion, sort_order: t.tab.SortOrder,
        },
        panels: t.panels
          .filter((p) => !rol.hidden_metric_ids.includes(p.MetricID))
          .map((p) => ({
            id: p.ID, metric_id: p.MetricID, type: p.Type,
            col_start: p.ColStart, col_span: p.ColSpan, row_span: p.RowSpan,
          })),
      }))

    return ok({
      layout_id: params['id'],
      role_id: rolId,
      role_name: rol.name,
      tabs,
      without_payloads: true,
    })
  }),
)
