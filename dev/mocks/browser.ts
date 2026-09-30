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
import repertorio from './repertorio.json'
import { DASH_A, LAYOUT_PUB, bloques, catalogo, contexto, detalle, layouts, publicaciones, roles, tenants, usuario, PANELES_MUESTRARIO } from './datos'

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
/** El slug de una `key` de pestaña · como lo hace el servicio, medido el
 *  2026-09-28: recorta, baja a minúsculas, **quita los acentos** y junta con
 *  guiones. `"Visión General"` → `vision-general`. */
const slug = (v: string) =>
  v
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const estado = {
  layouts: structuredClone(layouts),
  detalles: new Map(layouts.map((l) => [l.id, structuredClone(detalle(l.id))])),
  roles: structuredClone(roles),
  // B6 · el historial crece con cada reversión, igual que en el servicio.
  publicaciones: structuredClone(publicaciones),
}

/** `panelId` → la forma de la métrica que ese panel dibuja.
 *
 *  El layout y el catálogo ya estaban; lo único que faltaba era cruzarlos. Sin
 *  esto el handler emitía un valor por índice, sin mirar qué forma pedía cada
 *  panel — así que hasta un `bars` recibía un escalar. */
function formaDe(panelId: string): string {
  const paneles = [...estado.detalles.values()].flatMap((d) => d.tabs.flatMap((t) => t.panels))
  const panel = paneles.find((p) => p.id === panelId)
  if (panel === undefined) return 'scalar'
  return catalogo.find((m) => m.id === panel.metric_id)?.shape ?? 'scalar'
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
    case 'series_with_band':
      // **La forma del CABLE, leída de `transform_v11.go` en `75b8ecc`**, no
      // inventada: `level` de nivel superior y `lo`/`hi` en cada punto, los tres
      // obligatorios. Su transformer falla con `ErrMissingField` si falta uno.
      return {
        shape: 'series_with_band',
        level: 80,
        points: puntos.map((p, k) => ({
          ...p,
          lo: p.v * (0.92 - k * 0.01),
          hi: p.v * (1.08 + k * 0.01),
        })),
      }
    case 'distribution':
      // `bins` con `label` y `v`; `lo` y `hi` son opcionales en el cable y el
      // adaptador no los trae, porque el contrato interno declara los cortes con
      // etiqueta y valor y nada más.
      return {
        shape: 'distribution',
        bins: [
          { label: '0 – 2', v: n * 0.08 },
          { label: '2 – 5', v: n * 0.21 },
          { label: '5 – 10', v: n * 0.34 },
          { label: '10 – 20', v: n * 0.25 },
          { label: '20 +', v: n * 0.12 },
        ],
      }
    case 'compared_categorical':
      // **Tres ítems de la salida real de `platform_gap`**, y el tercero llega
      // SIN `reference`: es el caso de quince de sus 37 ítems —plataformas con
      // retorno atribuido y sin costo— y el que hace visible que la pesa no se
      // dibuja desde el origen.
      return {
        shape: 'compared_categorical',
        items: [
          { label: 'Google PMax', v: 502449.76, reference: 85134.28, delta: 417315.48 },
          { label: 'Google', v: 197060.78, reference: 43422.49, delta: 153638.29 },
          { label: 'Facebook', v: 155645.76, reference: 43692.57, delta: 111953.19 },
          { label: 'Criteo', v: 36813.49, reference: 2574.17, delta: 34239.32 },
          { label: 'MGID', v: 221.48, reference: 7842.45, delta: -7620.97 },
          { label: 'YouTube', v: 12455.52 },
        ],
      }
    case 'matrix':
      // Cinco plataformas por seis meses de `platform_month_matrix`, con sus
      // `null` reales: la plataforma no tuvo inversión ese mes. **Se recorta a
      // cinco filas y no a las 38 que devuelve** — mirarlas las 38 es lo que hizo
      // ver que la forma no tiene tope, y eso está anotado aparte.
      return {
        shape: 'matrix',
        rows: ['Criteo', 'DV360', 'Facebook', 'Google', 'Adsmovil'],
        columns: ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'],
        cells: [
          [7933.11, 1939.7, 4032.44, 3333.74, 1782.43, 1383.86],
          [1398.95, null, 2259.97, null, 1851.48, 642.01],
          [133397.25, 23698.11, 100811.13, 76124.1, 59614.31, 35455.82],
          [39998.02, 26888.85, 43297.82, 48462.64, 31122.54, 29607.82],
          [1766.49, 0.04, null, null, null, null],
        ],
      }
    case 'flow':
      // Cinco plataformas hacia el nodo `total`, que es la forma que la consulta
      // produce: cada una aporta su inversión y el total sólo recibe.
      return {
        shape: 'flow',
        stages: [
          { id: 'Dailymotion', label: 'Dailymotion', v: 1883185 },
          { id: 'GCM-Other', label: 'GCM-Other', v: 1058397 },
          { id: 'Google PMax', label: 'Google PMax', v: 85134.28 },
          { id: 'Facebook', label: 'Facebook', v: 43692.57 },
          { id: 'TikTok', label: 'TikTok', v: 18358.88 },
          { id: 'total', label: 'Total invertido', v: 3088767.73 },
        ],
        links: [
          { from: 'Dailymotion', to: 'total', v: 1883185 },
          { from: 'GCM-Other', to: 'total', v: 1058397 },
          { from: 'Google PMax', to: 'total', v: 85134.28 },
          { from: 'Facebook', to: 'total', v: 43692.57 },
          { from: 'TikTok', to: 'total', v: 18358.88 },
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
  /* **El repertorio, y hasta el 2026-09-30 no tenía handler.** MSW avisaba
     «intercepted a request without a matching request handler» en la consola del
     navegador y la aplicación seguía andando: `usePlots` caía a lista vacía y
     `plotProblemOf` devuelve `undefined` con el repertorio vacío —lo dice su
     propia guardia— así que **ningún mínimo ni tope se ejercitaba en `dev:mock`**.

     Se sirve el JSON GENERADO y no una copia a mano: lo emite `tools/gen-plots.py`
     junto con los otros dos, de modo que las 49 filas de acá son las mismas que
     las del servicio. Una tercera tabla escrita aparte es cómo se desincroniza. */
  http.get(`${API}/config/plots`, () => ok(repertorio)),
  http.get(`${API}/config/tabs/:tabId`, ({ params }) => {
    const d = estado.detalles.get(LAYOUT_PUB)
    const t = d?.tabs.find((x) => x.tab.id === params['tabId'])
    if (t === undefined) return mal('tab not found', 404)
    // **Este `map` copia campo por campo, y por eso silencia los nuevos.**
    // `chart` y `key` existían en `datos.ts` y no llegaban a la consola porque
    // acá no estaban escritos: el gráfico apilado se dibujaba como dos líneas,
    // que es un dibujo equivocado y no un panel roto. Lo encontró abrirlo.
    //
    // Se deja el copiado explícito a propósito —un `...p` haría que el mock
    // devolviera campos que el cable no declara, que es la otra forma de
    // mentir— pero queda anotado: **un campo nuevo del cable se agrega acá
    // también**, y el síntoma de olvidarlo es que se vea bien.
    return ok({
      tab: {
        id: t.tab.id,
        name: t.tab.name,
        key: t.tab.key,
        operational_question: t.tab.operational_question,
        sort_order: t.tab.sort_order,
      },
      panels: t.panels.map((p) => ({
        id: p.id, metric_id: p.metric_id, type: p.type,
        col_start: p.col_start, col_span: p.col_span, row_span: p.row_span,
        chart: p.chart, note: p.note,
        // **`options` FALTABA, y con él todos los params de layout** · agregado
        // el 2026-09-29. El aviso de arriba acertó dos veces: la primera con
        // `chart`, y ésta. Mientras no estuvo, **ningún panel del modo mock
        // recibió un solo param** —ni `meter`, ni `comparative`, ni `cut`, ni
        // `order`—, así que todo lo que un param cambia se veía con el default
        // y parecía correcto.
        //
        // Lo destapó el BULLET, que sin `maximum` cae a «sin máximo declarado»:
        // un panel que dice por qué no dibuja es lo único que hace ruido cuando
        // el param se pierde. Los demás params se pierden en silencio.
        //
        // El servicio real lo manda siempre, vacío incluido — medido contra
        // `de881e1`: el panel de prosa trae `"options": {}`.
        options: p.options,
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
          // **El muestrario queda fuera de la rotación** · ver
          // `PANELES_MUESTRARIO`. La rotación existe para mirar los estados y
          // esa pestaña existe para mirar dibujos; dejarla adentro escondía dos
          // de sus nueve gráficos y ninguno de los dos propósitos se cumplía.
          PANELES_MUESTRARIO.has(id)
            ? {
                status: 'AVAILABLE',
                governance: {
                  base: '312 SKU críticos sobre 18.240 activos',
                  layer: 'GOLD',
                  source: 'ERP',
                  freshness: new Date().toISOString(),
                  catalog_version: 4,
                },
                value: valorPara(formaDe(id), i),
              }
            : i % 4 === 3
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
                // **En español desde el 2026-09-28, porque el servicio lo
                // cambió y nosotros no lo pedimos.** El copy medido contra
                // `f70cec2`, textual — un mock que se queda con la frase vieja
                // hace que el modo mock muestre un idioma que el producto ya no
                // habla, y es lo que se ve al abrirlo.
                //
                // Va con `unlocks_with`, que el real también manda: §8 pide que
                // un estado diga qué lo desbloquea, y sin las dos frases este
                // modo no deja mirar la gramática completa.
                ...(i % 4 === 2
                  ? {
                      reason:
                        'Esta métrica todavía no se calculó con datos reales; el valor que se muestra es de referencia',
                      unlocks_with: 'Falta registrar la fuente de datos de esta métrica',
                    }
                  : {}),
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
   *  **Manda `event: data` desde el 2026-09-22** · F3.6 se destrabó con
   *  `55e8419`, que agregó la BASE, la familia, la capa, la fuente, la versión
   *  del catálogo y las dos frescuras. */
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

  /** Qué preguntar sobre un panel · §PEN:C3. Deterministas del lado del
   *  servicio: acá se devuelven tres fijas, que es lo que hay que poder mirar. */
  http.get(`${API}/config/panels/:panelId/chat-suggestions`, () => ok([
    { question: '¿Por qué cayó contra el mes anterior?', intent: 'explain' },
    { question: '¿Qué está impulsando esta cifra?', intent: 'drivers' },
    { question: '¿Cómo se reparte por canal?', intent: 'breakdown' },
  ])),

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
          // La cifra, con su procedencia completa · F3.6.
          controller.enqueue(
            encoder.encode(
              trama('data', {
                shape: 'scalar',
                data: { shape: 'scalar', v: 128400 },
                provenance: {
                  source: 'cortex_agent', tool: 'cortex_analyst',
                  metric_key: 'ventas_dia', period: '2026-09', sql_available: true,
                  base: '312 SKU críticos sobre 18.240 activos', base_source: 'catalog',
                  family: 'demand', layer: 'GOLD', source_system: 'ERP',
                  catalog_version: 4,
                  freshness: '2026-09-21T08:00:00Z',
                  queried_at: new Date().toISOString(),
                },
              }),
            ),
          )
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
      // **`dashboard_id` también se copia** · el duplicado es del mismo
      // dashboard que el origen, y de ese campo sale qué historial pedir.
      id: crypto.randomUUID(), tenant_id: tenants[0]!.id, dashboard_id: DASH_A,
      status: 'draft' as string,
      version_id: `${version_id ?? 'v'}-copia`, published_at: null as string | null,
    }
    estado.layouts = [nuevo, ...estado.layouts]
    // Duplicar copia el contenido de la versión de origen, que es lo que hace
    // que «duplicar para editar» sirva de algo.
    const origen = estado.detalles.get(LAYOUT_PUB)
    estado.detalles.set(nuevo.id, { layout: nuevo, tabs: structuredClone(origen?.tabs ?? []) })
    return HttpResponse.json({ success: true, data: nuevo }, { status: 201 })
  }),

  http.get(`${API}/admin/layouts/:id`, ({ params }) => {
    const d = estado.detalles.get(params['id'] as string)
    return d === undefined ? mal('layout not found', 404) : ok(d)
  }),

  /* ── B6 · el historial y la reversión · §PEN:B6 ──────────────────────────
   *
   * **Es la ruta de `dashboards` y no la de `layouts`**, igual que en el
   * servicio: aquella filtra por layout y devuelve una fila sola, porque
   * revertir COPIA a un layout nuevo y cada layout se publica una vez. Sin este
   * handler B6 en modo mock pintaba «no se pudo traer el historial», que es un
   * fallo nuestro leído como uno del servicio.
   */
  http.get(`${API}/admin/dashboards/:id/publications`, ({ params }) =>
    ok(estado.publicaciones.filter((p) => p.dashboard_id === params['id'])),
  ),

  /** Revertir **publica una versión nueva**, no reactiva la archivada. El estado
   *  en memoria hace lo mismo: el destino pasa a `published`, el que estaba se
   *  archiva, y queda una fila más con `action: 'rollback'`. Sin eso el botón se
   *  apretaría y la lista no cambiaría, que es el defecto silencioso que el hook
   *  describe. */
  http.post(`${API}/admin/layouts/:id/revert`, async ({ params, request }) => {
    const desde = params['id'] as string
    const { to_layout_id } = (await request.json()) as { to_layout_id?: string }
    const destino = estado.layouts.find((l) => l.id === to_layout_id)
    if (destino === undefined) return mal('layout not found', 404)
    if (destino.id === desde) return mal('no se puede revertir a sí mismo', 409)
    estado.layouts = estado.layouts.map((l) =>
      l.id === desde
        ? { ...l, status: 'archived' }
        : l.id === destino.id
          ? { ...l, status: 'published' }
          : l,
    )
    estado.publicaciones = [
      {
        ...estado.publicaciones[0]!,
        id: crypto.randomUUID(),
        layout_id: destino.id,
        version_id: `rollback-${destino.version_id}`,
        action: 'rollback',
        previous_layout_id: desde,
        created_at: new Date().toISOString(),
      },
      ...estado.publicaciones,
    ]
    return ok(estado.layouts.find((l) => l.id === destino.id))
  }),

  http.put(`${API}/admin/layouts/:id`, async ({ params, request }) => {
    const id = params['id'] as string
    const layout = estado.layouts.find((l) => l.id === id)
    // **El 409 de verdad**, que es el que hace útil a la barra de guardado: el
    // servicio solo deja editar borradores.
    if (layout?.status === 'published') return mal('layout is published', 409)

    const cuerpo = (await request.json()) as {
      tabs: { id?: string; name: string; key?: string; operational_question: string; sort_order: number; role_ids?: string[]; panels?: unknown[] }[]
    }
    await delay(300)
    const d = {
      layout: layout ?? estado.layouts[0]!,
      // **Una pestaña sin `id` gana uno nuevo**, como el servicio: es lo que
      // hace que el segundo guardado no duplique.
      tabs: cuerpo.tabs.map((t) => ({
        tab: {
          id: t.id ?? crypto.randomUUID(),
          layout_version_id: id,
          name: t.name,
          // **La `key` se SLUGIFICA, y omitirla la deriva del nombre.** Medido
          // el 2026-09-28 contra `f70cec2`: `"  MI-Clave  "` se guarda como
          // `mi-clave`, y `"Visión General"` sin key queda `vision-general` —
          // los acentos se van. Su documento decía sólo «recortado».
          //
          // **El mock lo replica en vez de guardar lo que le llegó**, porque un
          // mock que devuelve el valor tal cual esconde justo la transformación:
          // el builder mandaría `"Visión General"` y vería `"Visión General"`,
          // y el día que se compare contra el real no coincidiría.
          key: slug(t.key ?? t.name),
          operational_question: t.operational_question,
          sort_order: t.sort_order,
          role_ids: t.role_ids ?? [],
        },
        panels: (t.panels ?? []).map((p) => {
          const q = p as { id?: string; metric_id: string; type: string; col_start: number; col_span: number; row_span: number; options?: unknown; chart?: string; note?: string }
          return {
            id: q.id ?? crypto.randomUUID(), tab_id: t.id ?? '', metric_id: q.metric_id,
            type: q.type, col_start: q.col_start, col_span: q.col_span, row_span: q.row_span,
            // **Recortado y en minúsculas**, medido: `"  Waterfall  "` →
            // `waterfall`. Ausente queda cadena vacía, que es el gráfico por
            // defecto del bloque y lo que salen los doce publicados.
            chart: (q.chart ?? '').trim().toLowerCase(),
            note: (q.note ?? '').trim(),
            // **Siempre va, vacío si no hay** · alineado el 2026-09-29 con lo
            // medido: el servicio manda `"options": {}` en el panel de prosa,
            // no omite la clave. El spread condicional de antes hacía que el
            // tipo saliera opcional acá y requerido en `datos.ts`.
            options: (q.options ?? {}) as Record<string, unknown>,
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
      .filter((t) => t.tab.operational_question.trim() === '')
      .map((t) => ({
        tab_id: t.tab.id,
        field: 'operational_question',
        message: 'una pestaña que no contesta una pregunta no se compone',
      }))
    return ok({ valid: errors.length === 0, errors })
  }),

  http.post(`${API}/admin/layouts/:id/publish`, async ({ params }) => {
    const id = params['id'] as string
    await delay(400)
    const d = estado.detalles.get(id)
    if ((d?.tabs ?? []).some((t) => t.tab.operational_question.trim() === '')) {
      return mal('invalid panels', 422)
    }
    // Publicar **demota al anterior**: solo hay uno publicado por tenant.
    estado.layouts = estado.layouts.map((l) => ({
      ...l,
      status: l.id === id ? 'published' : l.status === 'published' ? 'draft' : l.status,
      published_at: l.id === id ? new Date().toISOString() : l.published_at,
    }))
    return ok(estado.layouts.find((l) => l.id === id))
  }),

  /* ── B4.8 y B4.9 · del fork ─────────────────────────────────────────────── */
  /** El agente del cliente · F4.4. **Con toda la plomería**, que es lo que hay
   *  que poder mirar: si `snowflake_db` o el warehouse aparecen en la pantalla,
   *  se ven acá. Uno inactivo, para que los dos estados se vean. */
  // A5 · las tres saludes, para poder MIRAR la pantalla. Contra el servicio real
  // las cuatro fuentes llegan sin carga, así que `DEGRADADA` y `AL_DIA` sólo se
  // ven acá — y la degradada es el ejemplo literal del `.pen`: 31 h sobre una
  // fuente horaria con tolerancia 2×.
  // ── A3 · LOS USUARIOS · agregados el 2026-09-26 ───────────────────────────
  //
  // **No había handler de usuarios y A3 nunca se pudo MIRAR con datos acá.** El
  // modo mock existe para ver pantallas, y ésta salía con su vacío de alta.
  //
  // Los números son los del dibujo —«17 usuarios · 2 clientes con usuarios»— y
  // por eso `total` NO coincide con el largo de la lista: es lo que pasa cuando
  // la ruta pagina, y con los dos iguales nadie vería la diferencia entre el
  // conteo del servicio y un `length` nuestro.
  //
  // Los tres estados que el dibujo pinta: activo con acceso, activo que **nunca
  // entró** —`last_login_at: null`, que no es lo mismo que suspendido— y
  // suspendido. El tercero del dibujo, «invitación pendiente», no está: el cable
  // no lo distingue y **inventarlo acá sería inventarlo en la pantalla**.
  http.get(`${API}/admin/users`, () => ok({
    total: 17,
    tenants: 2,
    users: [
      {
        id: 'u-1', tenant_id: 't-1', tenant_name: 'Under Armour México',
        email: 'sofia.marin@underarmour.com', first_name: 'Sofía', last_name: 'Marín',
        role: 'planner', role_id: 'r-pla', last_login_at: '2026-09-25T14:10:00Z',
        is_active: true, created_at: '2026-08-14T10:00:00Z',
      },
      {
        id: 'u-2', tenant_id: 't-1', tenant_name: 'Under Armour México',
        email: 'gerardo.riarte@buentipo.com', first_name: 'Gerardo', last_name: 'Riarte',
        role: 'admin', role_id: 'r-adm', last_login_at: '2026-09-26T08:02:00Z',
        is_active: true, created_at: '2026-07-01T10:00:00Z',
      },
      {
        id: 'u-3', tenant_id: 't-1', tenant_name: 'Under Armour México',
        email: 'nuevo.ingreso@underarmour.com', first_name: 'Nuevo', last_name: 'Ingreso',
        role: 'planner', role_id: 'r-pla', last_login_at: null,
        is_active: true, created_at: '2026-09-24T09:00:00Z',
      },
      {
        id: 'u-4', tenant_id: 't-2', tenant_name: 'Cliente Dos',
        email: 'ana.paz@clientedos.com', first_name: 'Ana', last_name: 'Paz',
        role: 'ceo', role_id: 'r-ceo', last_login_at: '2026-09-20T11:00:00Z',
        is_active: false, created_at: '2026-06-02T10:00:00Z',
      },
    ],
  })),

  // La por-cliente, que sirve a A2 · sin `tenant_name`, igual que el servicio.
  http.get(`${API}/admin/tenants/:id/users`, () => ok([
    {
      id: 'u-1', tenant_id: 't-1',
      email: 'sofia.marin@underarmour.com', first_name: 'Sofía', last_name: 'Marín',
      role: 'planner', role_id: 'r-pla', last_login_at: '2026-09-25T14:10:00Z',
      is_active: true, created_at: '2026-08-14T10:00:00Z',
    },
  ])),

  http.get(`${API}/admin/tenants/:id/feeds`, () => ok([
    {
      key: 'merchant_center', name: 'Merchant Center', gold_table: 'shopping_feed',
      cadence_hours: 1, tolerance_factor: 2, source_labels: ['merchant center'],
      last_load_at: '2026-08-14T08:12:00Z', rows_processed: 48210, rows_failed: 0,
      freshness_hours: 31, status: 'degraded', metric_count: 4,
      metric_keys: ['feed_coverage', 'feed_quality', 'feed_vs_sales', 'feed_gap'],
      is_active: true,
    },
    {
      key: 'erp', name: 'ERP', gold_table: 'ecomm',
      cadence_hours: 24, tolerance_factor: 3, source_labels: ['erp'],
      last_load_at: '2026-09-25T06:00:00Z', rows_processed: 120440, rows_failed: 12,
      freshness_hours: 4, status: 'ok', metric_count: 5,
      metric_keys: ['sales', 'visits', 'executive_summary', 'goals_vs_actual', 'twelve_month_efficiency'],
      is_active: true,
    },
    {
      key: 'ga4', name: 'GA4', gold_table: '',
      cadence_hours: 24, tolerance_factor: 3, source_labels: ['ga4'],
      last_load_at: null, rows_processed: null, rows_failed: null,
      freshness_hours: null, status: 'unknown', metric_count: 1,
      metric_keys: ['visits'], is_active: true,
    },
  ])),

  http.get(`${API}/admin/tenants/:id/agents`, () => ok([
    {
      id: 'ag-1', tenant_id: 't-1', name: 'Agente UA MX', target_role: 'Planner',
      snowflake_db: 'DB_BT_UA', snowflake_schema: 'BT_UA_MART_ANALYTICS',
      snowflake_cortex_agent_name: 'SYNAPSE_AGENT', warehouse: 'WH_SYNAPSE',
      semantic_views: ['SYNAPSE_METRIC_CATALOG', 'SYNAPSE_SALES'],
      system_prompt_base: 'Sos el analista de UA MX.', is_active: true,
      created_at: '2026-09-01T10:00:00Z', updated_at: '2026-09-15T10:00:00Z',
    },
    {
      id: 'ag-2', tenant_id: 't-1', name: 'Agente de dirección', target_role: 'CEO',
      snowflake_db: 'DB_BT_UA', snowflake_schema: 'BT_UA_MART_ANALYTICS',
      snowflake_cortex_agent_name: 'SYNAPSE_AGENT_CEO', warehouse: 'WH_SYNAPSE',
      semantic_views: ['SYNAPSE_METRIC_CATALOG'],
      system_prompt_base: '', is_active: false,
      created_at: '2026-08-01T10:00:00Z', updated_at: '2026-09-02T10:00:00Z',
    },
  ])),

  http.get(`${API}/admin/tenants/:id/roles/composition`, async () => {
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
      .filter((t) => rol.tab_ids.length === 0 || rol.tab_ids.includes(t.tab.id))
      .map((t) => ({
        tab: {
          id: t.tab.id, name: t.tab.name,
          operational_question: t.tab.operational_question, sort_order: t.tab.sort_order,
        },
        panels: t.panels
          .filter((p) => !rol.hidden_metric_ids.includes(p.metric_id))
          .map((p) => ({
            id: p.id, metric_id: p.metric_id, type: p.type,
            col_start: p.col_start, col_span: p.col_span, row_span: p.row_span,
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
