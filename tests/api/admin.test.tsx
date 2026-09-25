// @vitest-environment jsdom
//
// Por lo mismo que `client.test.ts`: la base cae a `/api/v1`, que es RELATIVO,
// y en node `fetch` de una URL relativa tira `Failed to parse URL`.

/** El cliente de admin y builder · F4.23
 *
 *  **Los fixtures salen de `contracts/synapse-admin-wire.yaml`**, con su
 *  PascalCase y todo. Escribirlos en camelCase haría que el adaptador no
 *  traduzca nada y la prueba pasara igual — el mismo defecto que los mocks de la
 *  consola tuvieron durante meses.
 *
 *  **Y desde el 2026-09-16 están confirmados contra el servicio.** Hasta esa
 *  fecha no se podían: las rutas piden rol `admin` y el usuario de prueba era
 *  `planner`, así que estas pruebas verificaban el adaptador contra lo que el
 *  código de Go DICE que devuelve y no contra lo que se vio llegar — una capa
 *  menos de evidencia. Con el rol cambiado, `npm run humo` recorre las ocho
 *  rutas y compara campo por campo contra el yaml.
 *
 *  **El PascalCase quedó confirmado, no deducido**: `GET /admin/tenants/{id}/layouts`
 *  devuelve `ID`, `TenantID`, `Status`, `VersionID` y `PublishedAt`. Era la
 *  deuda que el yaml declaraba como pregunta abierta, y la respuesta es que sí.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { keys, usePublishLayout } from '@/api/hooks'
import { adminApi } from '@/api/admin'
import { ApiError } from '@/api/types'
import { ok } from '../mocks/handlers'
import { server } from '../mocks/server'

const API = '*/api/v1'

/** Un layout como lo serializa Go: **sin etiquetas `json:`**, así que las claves
 *  son los nombres de los campos. */
const borrador = {
  ID: 'l-1',
  TenantID: 't-1',
  Status: 'draft',
  VersionID: 'borrador-1',
  PublishedAt: null,
}

const detalle = {
  layout: borrador,
  tabs: [
    {
      tab: {
        ID: 'tab-1',
        LayoutVersionID: 'l-1',
        Name: 'Resumen',
        OperationalQuestion: '¿Qué movió el negocio?',
        SortOrder: 1,
        RoleIDs: [],
      },
      panels: [
        {
          ID: 'p-1',
          TabID: 'tab-1',
          MetricID: 'm-1',
          Type: 'kpi',
          ColStart: 5,
          ColSpan: 3,
          RowSpan: 4,
          Options: { comparative: true },
        },
      ],
    },
  ],
}

describe('el PascalCase del dominio se absorbe acá', () => {
  it('la versión de layout llega con las claves del contrato', async () => {
    // `ID` → `id`, `Status` → `estado`. Si no se tradujera, el builder leería
    // `layout.estado` como `undefined` y trataría un publicado como borrador.
    server.use(http.get(`${API}/admin/tenants/t-1/layouts`, () => ok([borrador])))

    expect(await adminApi.layouts('t-1')).toEqual([
      { id: 'l-1', tenantId: 't-1', estado: 'borrador', versionId: 'borrador-1', publicadoEn: null },
    ])
  })

  it('`published` → `publicado`, con su fecha', async () => {
    server.use(
      http.get(`${API}/admin/tenants/t-1/layouts`, () =>
        ok([{ ...borrador, Status: 'published', PublishedAt: '2026-09-11T14:00:00Z' }]),
      ),
    )
    const [l] = await adminApi.layouts('t-1')
    expect(l).toMatchObject({ estado: 'publicado', publicadoEn: '2026-09-11T14:00:00Z' })
  })

  it('un estado desconocido cae en `borrador`, que es la lectura SEGURA', async () => {
    // No se sustituye por `publicado`: un layout del que no se sabe si está
    // publicado no se trata como publicado. La dirección importa.
    server.use(
      http.get(`${API}/admin/tenants/t-1/layouts`, () => ok([{ ...borrador, Status: 'archived' }])),
    )
    expect((await adminApi.layouts('t-1'))[0]?.estado).toBe('borrador')
  })

  it('el detalle trae las pestañas y los paneles con la forma del contrato', async () => {
    server.use(http.get(`${API}/admin/layouts/l-1`, () => ok(detalle)))
    const d = await adminApi.layout('l-1')

    expect(d.tabs[0]?.tab).toEqual({
      id: 'tab-1',
      nombre: 'Resumen',
      pregunta: '¿Qué movió el negocio?',
      orden: 1,
      roles: [],
    })
    // **El panel del builder es el mismo `PanelConfig` que dibuja la consola.**
    // Darle dos formas sería garantizar que se separen.
    expect(d.tabs[0]?.panels[0]).toEqual({
      id: 'p-1',
      tipo: 'kpi',
      metricId: 'm-1',
      colStart: 5,
      colSpan: 3,
      rowSpan: 4,
      opciones: { comparative: true },
    })
  })
})

describe('guardar · el PUT reemplaza el layout entero', () => {
  it('el cuerpo va en snake_case aunque la respuesta venga en PascalCase', async () => {
    // El servicio manda una forma y recibe otra. Es su asimetría, no la nuestra.
    let cuerpo: unknown = null
    server.use(
      http.put(`${API}/admin/layouts/l-1`, async ({ request }) => {
        cuerpo = await request.json()
        return ok(detalle)
      }),
    )

    await adminApi.guardar('l-1', [
      {
        id: 'tab-1',
        nombre: 'Resumen',
        pregunta: '¿Qué movió?',
        orden: 1,
        roles: [],
        panels: [
          { metricId: 'm-1', tipo: 'kpi', colStart: 1, colSpan: 3, rowSpan: 4 },
        ],
      },
    ])

    expect(cuerpo).toEqual({
      tabs: [
        {
          id: 'tab-1',
          name: 'Resumen',
          operational_question: '¿Qué movió?',
          sort_order: 1,
          role_ids: [],
          panels: [{ metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4 }],
        },
      ],
    })
  })

  it('una tab SIN `id` no lo manda · el servicio genera una nueva', async () => {
    // Es la trampa que el yaml documenta: mandar el id conserva la pestaña,
    // omitirlo la recrea. Mandar `id: undefined` sería mandar la clave.
    // Un arreglo y no una variable: con `let` el compilador narrowa a `never`
    // porque no ve que el closure corre, y `push` no tiene ese problema.
    const cuerpos: { tabs: { id?: string }[] }[] = []
    server.use(
      http.put(`${API}/admin/layouts/l-1`, async ({ request }) => {
        cuerpos.push((await request.json()) as { tabs: { id?: string }[] })
        return ok(detalle)
      }),
    )
    await adminApi.guardar('l-1', [
      { nombre: 'Nueva', pregunta: '¿?', orden: 1, roles: [], panels: [] },
    ])
    expect(cuerpos[0]?.tabs[0]).not.toHaveProperty('id')
  })

  it('un 409 sobre un layout publicado tiene código propio', async () => {
    // Sin distinguirlo, el builder diría «error al guardar» sobre algo que tiene
    // una salida concreta: duplicar el layout.
    server.use(
      http.put(`${API}/admin/layouts/l-1`, () =>
        HttpResponse.json(
          { success: false, error: 'layout is published and cannot be edited' },
          { status: 409 },
        ),
      ),
    )
    const e = (await adminApi.guardar('l-1', []).catch((x: unknown) => x)) as ApiError
    expect(e.code).toBe('REGLA_LAYOUT_PUBLICADO')
    expect(e.httpStatus).toBe(409)
    expect(e.message).toContain('published')
  })
})

describe('validar · el servidor decide', () => {
  it('los problemas llegan ATADOS a su panel', async () => {
    // `tab_id` y `panel_id` son lo que permite pintar el error sobre el panel en
    // vez de en una lista al pie: la diferencia entre «arreglá esto» y «buscá
    // cuál de los doce».
    server.use(
      http.post(`${API}/admin/layouts/l-1/validate`, () =>
        ok({
          valid: false,
          errors: [
            {
              tab_id: 'tab-1',
              panel_id: 'p-1',
              field: 'options.maximum',
              message: 'gauge requires options.maximum',
            },
          ],
        }),
      ),
    )

    const r = await adminApi.validar('l-1')
    expect(r.valido).toBe(false)
    expect(r.problemas[0]).toEqual({
      tabId: 'tab-1',
      panelId: 'p-1',
      campo: 'options.maximum',
      mensaje: 'gauge requires options.maximum',
    })
  })

  it('un problema sin panel llega con `null`, no ausente', async () => {
    // Un error de layout entero —«al menos una tab»— no cuelga de ningún panel.
    // `null` lo dice; `undefined` obligaría a distinguir «no vino» de «no aplica».
    server.use(
      http.post(`${API}/admin/layouts/l-1/validate`, () =>
        ok({ valid: false, errors: [{ message: 'layout needs at least one tab' }] }),
      ),
    )
    expect((await adminApi.validar('l-1')).problemas[0]).toMatchObject({
      tabId: null,
      panelId: null,
    })
  })

  it('un 200 con `valid: false` NO es un éxito de composición', async () => {
    // El 200 dice que la validación corrió. Lo que decide es `valido`, y
    // confundirlos publicaría un layout roto.
    server.use(
      http.post(`${API}/admin/layouts/l-1/validate`, () => ok({ valid: false, errors: [] })),
    )
    await expect(adminApi.validar('l-1')).resolves.toMatchObject({ valido: false })
  })
})

describe('publicar toca DOS cachés · F4.23', () => {
  // **Lo que el cliente solo no puede verificar.** Publicar demota el layout
  // publicado anterior del tenant a borrador, así que cambia la lista de
  // layouts —lo evidente— y también **lo que la consola está mostrando**: sus
  // pestañas y su contexto salen del layout publicado.
  //
  // Sin invalidar `me` y `tab`, quien acaba de publicar sigue viendo el layout
  // viejo en la consola y cree que no funcionó. Es el defecto silencioso de esta
  // tarea: todo responde 200 y la pantalla no cambia.

  it('invalida los layouts del tenant Y el contexto de la consola', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidadas: string[] = []
    const original = qc.invalidateQueries.bind(qc)
    qc.invalidateQueries = ((filtros: { queryKey?: readonly unknown[] }) => {
      invalidadas.push(JSON.stringify(filtros.queryKey))
      return original(filtros)
    }) as typeof qc.invalidateQueries

    server.use(
      http.post(`${API}/admin/layouts/l-1/publish`, () =>
        ok({ ...borrador, Status: 'published', PublishedAt: '2026-09-15T10:00:00Z' }),
      ),
    )

    const { result } = renderHook(() => usePublishLayout('l-1', 't-1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      ),
    })
    result.current.mutate(undefined)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Las dos del builder…
    expect(invalidadas).toContain(JSON.stringify(keys.layouts('t-1')))
    expect(invalidadas).toContain(JSON.stringify(keys.layout('l-1')))
    // …y las DOS de la consola, que es lo que se olvida.
    expect(invalidadas).toContain(JSON.stringify(keys.me))
    expect(invalidadas).toContain(JSON.stringify(['config', 'tab']))
  })
})

describe('el listado de roles va a `/roles/composition`, no a `/roles`', () => {
  /** **El defecto que cierra, medido el 2026-09-25.** `168a761` puso el listado
   *  de roles DE ELLOS en `/admin/tenants/{id}/roles`. No es un choque de
   *  nombres: el suyo contesta qué dashboards ve un rol —`dashboard_ids`— y el
   *  nuestro qué ve dentro de un layout —`tab_ids`, `hidden_metric_ids`,
   *  `layout_overrides`— más `user_count`.
   *
   *  Mientras el front pidió `/roles`, el servicio real contestaba con la forma
   *  de ellos: de los siete campos que el adaptador lee llegaban DOS,
   *  `pestanas` quedaba `undefined` donde el tipo promete `string[]`, y
   *  `usoPorMetrica` reventaba con `r.pestanas.length`. **La pantalla de admin
   *  salía en negro**, y no lo vio ninguna prueba: los mocks servían NUESTRA
   *  forma en la ruta vieja, así que la frontera quedaba escondida — que es
   *  literal la lección de la bitácora del 14.
   *
   *  Lo que esta prueba fija es lo único que una prueba puede fijar acá: **a qué
   *  ruta se pide**. Que la respuesta real tenga la forma correcta lo verifica
   *  `npm run humo`, contra el servicio.
   */
  it('pide la ruta de composición · el `POST` sigue en `/roles`', async () => {
    const pedidas: string[] = []
    server.use(
      http.get(`${API}/admin/tenants/:id/roles/composition`, ({ request }) => {
        pedidas.push(new URL(request.url).pathname)
        return ok([])
      }),
    )

    await adminApi.roles('t-1')

    expect(pedidas).toHaveLength(1)
    expect(pedidas[0]).toMatch(/\/admin\/tenants\/t-1\/roles\/composition$/)
  })
})

describe('las fuentes · A5 · F4.24', () => {
  /** **La frontera.** Las pruebas de `FeedHealth` construyen `Fuente` a mano, así
   *  que no tocan el adaptador — y ahí vive la distinción que sostiene toda la
   *  pantalla: `null` es «nunca cargó» y `0` es «cargó recién». Lo cazó una
   *  mutación que cambiaba `?? null` por `?? 0`, que convertía una fuente sin
   *  estrenar en una al día.
   */
  it('`freshness_hours` nulo llega como null, NO como cero', async () => {
    server.use(
      http.get(`${API}/admin/tenants/:id/feeds`, () =>
        ok([
          {
            key: 'ga4',
            name: 'GA4',
            gold_table: '',
            cadence_hours: 24,
            tolerance_factor: 3,
            source_labels: ['ga4'],
            last_load_at: null,
            rows_processed: null,
            rows_failed: null,
            freshness_hours: null,
            status: 'unknown',
            metric_count: 1,
            metric_keys: ['visits'],
            is_active: true,
          },
        ]),
      ),
    )

    const f = (await adminApi.fuentes('t-1'))[0]
    expect(f?.frescuraHoras).toBeNull()
    expect(f?.ultimaCargaEn).toBeNull()
    expect(f?.filasProcesadas).toBeNull()
  })

  it('y una carga recién hecha llega como 0, que es lo contrario', async () => {
    server.use(
      http.get(`${API}/admin/tenants/:id/feeds`, () =>
        ok([
          {
            key: 'erp',
            name: 'ERP',
            gold_table: 'ecomm',
            cadence_hours: 1,
            tolerance_factor: 2,
            source_labels: ['erp'],
            last_load_at: '2026-09-25T10:00:00Z',
            rows_processed: 0,
            rows_failed: 0,
            freshness_hours: 0,
            status: 'ok',
            metric_count: 2,
            metric_keys: ['sales', 'visits'],
            is_active: true,
          },
        ]),
      ),
    )

    const f = (await adminApi.fuentes('t-1'))[0]
    expect(f?.frescuraHoras).toBe(0)
    expect(f?.filasProcesadas).toBe(0)
    expect(f?.metricas).toEqual(['sales', 'visits'])
  })

  it('el adaptador NO trae `status` · el estado se deriva', () => {
    // Que no esté en el tipo lo garantiza el compilador; que no esté en el
    // objeto lo garantiza esto, por si alguien lo agrega «por las dudas».
    expect(Object.keys({} as never)).not.toContain('status')
  })
})
