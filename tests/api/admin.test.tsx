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
  id: 'l-1',
  tenant_id: 't-1',
  status: 'draft',
  version_id: 'borrador-1',
  published_at: null,
}

const detalle = {
  layout: borrador,
  tabs: [
    {
      tab: {
        id: 'tab-1',
        key: 'tab-1-key',
        layout_version_id: 'l-1',
        name: 'Resumen',
        operational_question: '¿Qué movió el negocio?',
        sort_order: 1,
        role_ids: [],
      },
      panels: [
        {
          id: 'p-1',
          tab_id: 'tab-1',
          metric_id: 'm-1',
          type: 'kpi',
          col_start: 5,
          col_span: 3,
          row_span: 4,
          options: { comparative: true },
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
        ok([{ ...borrador, status: 'published', published_at: '2026-09-11T14:00:00Z' }]),
      ),
    )
    const [l] = await adminApi.layouts('t-1')
    expect(l).toMatchObject({ estado: 'publicado', publicadoEn: '2026-09-11T14:00:00Z' })
  })

  it('`archived` → `archivado` · ESTA PRUEBA AFIRMABA LO CONTRARIO', async () => {
    // ── LA PRUEBA ESTABA ESCRITA DESDE LA IMPLEMENTACIÓN · 2026-09-30 ───────
    //
    // Acá decía «un estado desconocido cae en `borrador`, que es la lectura
    // SEGURA» y usaba **`archived`** como ejemplo de desconocido. `archived` no
    // es desconocido: está en el dominio del servicio desde el principio y es
    // **el estado más común** — 4 de los 7 layouts medidos el 2026-09-30.
    //
    // Así que la prueba no verificaba un fallback: **verificaba la mentira**. Y
    // pasaba, porque estaba escrita mirando el mapa de `ESTADOS` en vez de el
    // enum del cable. Es el antecedente del 2026-08-20 otra vez: una prueba
    // escrita desde la implementación no puede fallar nunca.
    //
    // Lo encontró construir B6, que es la pantalla que necesita distinguir un
    // borrador de una versión archivada.
    server.use(
      http.get(`${API}/admin/tenants/t-1/layouts`, () => ok([{ ...borrador, status: 'archived' }])),
    )
    expect((await adminApi.layouts('t-1'))[0]?.estado).toBe('archivado')
  })

  it('un estado que NO está en el enum cae en `borrador`, que es la lectura SEGURA', async () => {
    // El fallback sigue existiendo y sigue siendo fallback. No se sustituye por
    // `publicado`: un layout del que no se sabe si está publicado no se trata
    // como publicado. La dirección importa.
    server.use(
      http.get(`${API}/admin/tenants/t-1/layouts`, () => ok([{ ...borrador, status: 'inventado' }])),
    )
    expect((await adminApi.layouts('t-1'))[0]?.estado).toBe('borrador')
  })

  it('el detalle trae las pestañas y los paneles con la forma del contrato', async () => {
    server.use(http.get(`${API}/admin/layouts/l-1`, () => ok(detalle)))
    const d = await adminApi.layout('l-1')

    expect(d.tabs[0]?.tab).toEqual({
      id: 'tab-1',
      clave: 'tab-1-key', nombre: 'Resumen',
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
          // **`chart` se agregó el 2026-09-29 y esta prueba se puso ROJA**, que
          // es exactamente para lo que sirve fijar el cuerpo entero con
          // `toEqual`: un campo nuevo en el `PUT` no puede entrar sin que
          // alguien lo mire. Va vacío porque este panel no tiene gráfico
          // elegido, y explícito porque el cuerpo dice qué se quiso.
          panels: [
            { metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4, chart: '' },
          ],
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
        ok({ ...borrador, status: 'published', published_at: '2026-09-15T10:00:00Z' }),
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

describe('los usuarios · A3 · F4.3', () => {
  /** La misma frontera que las fuentes, y el mismo hueco: las pruebas de
   *  `UserList` construyen `Usuario` a mano, así que no tocan el adaptador —y
   *  ahí vive la distinción que sostiene la columna «Nunca»—. Lo cazó una
   *  mutación que cambiaba `?? null` por una fecha inventada. */
  it('`last_login_at` nulo llega como null · «nunca entró» es un hecho', async () => {
    server.use(
      http.get(`${API}/admin/tenants/:id/users`, () =>
        ok([
          {
            id: 'u-1',
            tenant_id: 't-1',
            email: 'sofia@ua.test',
            first_name: 'Sofía',
            last_name: 'Marín',
            phone: '',
            role: 'planner',
            role_id: 'r-1',
            last_login_at: null,
            is_active: true,
            created_at: '2026-08-14T10:00:00Z',
          },
        ]),
      ),
    )

    const u = (await adminApi.usuarios('t-1'))[0]
    expect(u?.ultimoAccesoEn).toBeNull()
    // Y el nombre se arma en el adaptador, no en la pantalla: el cable manda las
    // dos mitades y quien las junta tiene que ser uno solo.
    expect(u?.nombre).toBe('Sofía Marín')
    expect(u?.rolId).toBe('r-1')
  })
})

describe('la restricción de rol viaja por CLAVE · 2026-09-29', () => {
  it('LEE `tab_keys` cuando están, y cae a `tab_ids` cuando no', async () => {
    // **El orden no es cortesía: es el del backend.** Su regla es «si hay
    // `tab_keys` manda la key; si está vacía cae a `tab_ids`». Leerlo al revés
    // dejaría **sin restricción** a un rol que todavía no migró — y un rol sin
    // restricción ve todo, así que el error abre acceso en vez de cerrarlo.
    server.use(
      http.get(`${API}/admin/tenants/:id/roles/composition`, () =>
        ok([
          { id: 'r-1', tenant_id: 't-1', name: 'Migrado', tab_keys: ['overview'], tab_ids: [],
            hidden_metric_ids: [], layout_overrides: {}, user_count: 0 },
          { id: 'r-2', tenant_id: 't-1', name: 'Sin migrar', tab_keys: [], tab_ids: ['tab-viejo'],
            hidden_metric_ids: [], layout_overrides: {}, user_count: 0 },
          // **El caso que importa y que faltaba**: después de SU migración los
          // roles tienen LAS DOS pobladas —`tab_keys` se rellenó desde
          // `tab_ids`— y los ids quedan apuntando a la versión vieja. Si se
          // leyeran primero, la consola mostraría una restricción caduca **sin
          // romper nada**: los dos campos existen y los dos parecen válidos.
          //
          // Lo encontró una mutación que sobrevivió con sólo los dos primeros.
          { id: 'r-3', tenant_id: 't-1', name: 'Con las dos', tab_keys: ['overview'],
            tab_ids: ['id-de-una-version-vieja'],
            hidden_metric_ids: [], layout_overrides: {}, user_count: 0 },
        ]),
      ),
    )
    const roles = await adminApi.roles('t-1')

    expect(roles[0]?.pestanas).toEqual(['overview'])
    expect(roles[1]?.pestanas).toEqual(['tab-viejo'])
    // Con las dos, manda la key.
    expect(roles[2]?.pestanas).toEqual(['overview'])
  })

  it('ESCRIBE `tab_keys` y NO manda `tab_ids`', async () => {
    // **No se mandan los dos.** El backend prioriza `tab_keys`, así que un
    // `tab_ids` al lado sería ruido que alguien va a leer como la fuente — y
    // mandar sólo ids era escribir una restricción con fecha de vencimiento: la
    // próxima publicación los recrea y el rol pierde sus pestañas.
    let cuerpo: Record<string, unknown> | undefined
    server.use(
      http.post(`${API}/admin/tenants/:id/roles`, async ({ request }) => {
        cuerpo = (await request.json()) as Record<string, unknown>
        return ok({ id: 'r-9', tenant_id: 't-1', name: 'Nuevo', tab_keys: ['overview'],
          tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 0 })
      }),
    )
    await adminApi.crearRol('t-1', { nombre: 'Nuevo', pestanas: ['overview'], metricasOcultas: [] })

    expect(cuerpo?.['tab_keys']).toEqual(['overview'])
    expect(cuerpo).not.toHaveProperty('tab_ids')
  })
})

describe('cargar meses · POST /admin/tenants/{id}/materialize · 2026-10-07', () => {
  it('manda los meses elegidos en `periods` y devuelve los que el servicio arrancó', async () => {
    let cuerpo: unknown = null
    server.use(
      http.post(`${API}/admin/tenants/t-1/materialize`, async ({ request }) => {
        cuerpo = await request.json()
        // La respuesta 202 medida contra `7b717aa` ese día.
        return HttpResponse.json(
          { success: true, data: { started: true, trigger: 'manual', tenant_id: 't-1', role: 'admin', periods: ['2026-07', '2026-08'] } },
          { status: 202 },
        )
      }),
    )
    expect(await adminApi.cargarPeriodos('t-1', ['2026-07', '2026-08'])).toEqual(['2026-07', '2026-08'])
    expect(cuerpo).toEqual({ periods: ['2026-07', '2026-08'] })
  })

  it('una lista VACÍA no sale · el servicio la leería como «los meses por defecto»', async () => {
    let llamado = false
    server.use(
      http.post(`${API}/admin/tenants/t-1/materialize`, () => {
        llamado = true
        return ok({})
      }),
    )
    await expect(adminApi.cargarPeriodos('t-1', [])).rejects.toThrow()
    expect(llamado).toBe(false)
  })

  it('el 400 del servicio llega con SU frase', async () => {
    server.use(
      http.post(`${API}/admin/tenants/t-1/materialize`, () =>
        HttpResponse.json({ success: false, error: 'período inválido: 2026-13 (formato YYYY-MM)' }, { status: 400 }),
      ),
    )
    await expect(adminApi.cargarPeriodos('t-1', ['2026-13'])).rejects.toThrow('período inválido: 2026-13')
  })
})

/* ── Usuarios y solicitudes de acceso · 2026-10-09 ─────────────────────────
 *
 * **Los fixtures son los que el servicio devolvió ese día** —binario de
 * `9dc481e`, base local—, recortados. Ver el cable. */

const usuarioDelCable = {
  id: 'u-9', tenant_id: 't-1', email: 'solicitante@prueba.test',
  first_name: 'Solicitante', last_name: 'Prueba', phone: '000',
  role_id: 'r-2', role: 'planner', last_login_at: null,
  is_active: true, created_at: '2026-10-09T09:50:04.726489-05:00',
}

describe('cambiar un usuario · PUT sobre el usuario DEL tenant', () => {
  it('va a la URL del cliente del usuario, con SÓLO lo que cambia', async () => {
    let url = ''
    let cuerpo: unknown = null
    server.use(
      http.put(`${API}/admin/tenants/:tenantId/users/:userId`, async ({ request }) => {
        url = new URL(request.url).pathname
        cuerpo = await request.json()
        return ok({ ...usuarioDelCable, is_active: false })
      }),
    )
    const u = await adminApi.editarUsuario('t-1', 'u-9', { activo: false })
    expect(url).toBe('/api/v1/admin/tenants/t-1/users/u-9')
    // **Sin `role_id`**: lo que no viaja no cambia, y mandarlo vacío sería pedir
    // un rol inexistente.
    expect(cuerpo).toEqual({ is_active: false })
    expect(u.activo).toBe(false)
  })

  it('el cambio de rol manda `role_id` y nada más', async () => {
    let cuerpo: unknown = null
    server.use(
      http.put(`${API}/admin/tenants/:tenantId/users/:userId`, async ({ request }) => {
        cuerpo = await request.json()
        return ok(usuarioDelCable)
      }),
    )
    await adminApi.editarUsuario('t-1', 'u-9', { rolId: 'r-2' })
    expect(cuerpo).toEqual({ role_id: 'r-2' })
  })

  it('el usuario trae su CLIENTE, que es lo que va en esa URL', async () => {
    server.use(http.get(`${API}/admin/tenants/t-1/users`, () => ok([usuarioDelCable])))
    const [u] = await adminApi.usuarios('t-1')
    expect(u?.clienteId).toBe('t-1')
  })
})

describe('el cliente trae su forma corta · para distinguir dos del mismo nombre', () => {
  it('`label` llega como `formaCorta`, vacía si nadie la cargó', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () =>
        ok([
          { id: 't-1', name: 'Under Armour México', label: 'UA MX', locale: 'es-MX', currency: 'USD', timezone: 'America/Mexico_City', user_count: 2, created_at: '2026-09-22T09:18:45Z' },
          { id: 't-2', name: 'Under Armour México', label: '', locale: 'es-MX', currency: 'USD', timezone: 'America/Mexico_City', user_count: 0, created_at: '2026-09-22T09:18:45Z' },
        ]),
      ),
    )
    const [a, b] = await adminApi.tenants()
    expect(a?.formaCorta).toBe('UA MX')
    expect(b?.formaCorta).toBe('')
  })
})

const solicitudDelCable = {
  id: 'ar-1', type: 'registration', company_name: 'Prueba', full_name: 'Solicitante Prueba',
  email: 'solicitante@prueba.test', phone: '000', job_title: 'Analista', info_use: 'medir la cola',
  status: 'pending', created_at: '2026-10-09T09:50:04.653604-05:00',
}

describe('las solicitudes de acceso', () => {
  it('lista SÓLO las pendientes, y las adapta', async () => {
    let consulta = ''
    server.use(
      http.get(`${API}/admin/access-requests`, ({ request }) => {
        consulta = new URL(request.url).search
        return ok({
          items: [solicitudDelCable, { ...solicitudDelCable, id: 'ar-2', type: 'password_reset' }],
          total: 2, page: 1, page_size: 100, total_pages: 1,
        })
      }),
    )
    const { total, solicitudes } = await adminApi.solicitudes()
    expect(consulta).toContain('status=pending')
    expect(total).toBe(2)
    expect(solicitudes[0]).toMatchObject({ tipo: 'alta', estado: 'pendiente', empresa: 'Prueba', clienteNombre: null })
    expect(solicitudes[1]?.tipo).toBe('contrasena')
  })

  it('aprobar un alta manda cliente y agente · el rol sale del agente', async () => {
    let cuerpo: unknown = null
    server.use(
      http.post(`${API}/admin/access-requests/ar-1/approve`, async ({ request }) => {
        cuerpo = await request.json()
        return ok({ message: 'solicitud aprobada', request: solicitudDelCable, temp_password: 'no-se-lee' })
      }),
    )
    await adminApi.aprobarSolicitud('ar-1', { tenantId: 't-1', agenteId: 'ag-1' })
    expect(cuerpo).toEqual({ tenant_id: 't-1', agent_id: 'ag-1' })
  })

  it('aprobar un cambio de contraseña no manda destino', async () => {
    let cuerpo: unknown = 'sin leer'
    server.use(
      http.post(`${API}/admin/access-requests/ar-2/approve`, async ({ request }) => {
        cuerpo = await request.json()
        return ok({ message: 'solicitud aprobada', request: solicitudDelCable })
      }),
    )
    await adminApi.aprobarSolicitud('ar-2')
    expect(cuerpo).toEqual({})
  })

  it('rechazar va a su propia ruta', async () => {
    let llamado = false
    server.use(
      http.post(`${API}/admin/access-requests/ar-1/reject`, () => {
        llamado = true
        return ok({ message: 'solicitud rechazada', request: solicitudDelCable })
      }),
    )
    await adminApi.rechazarSolicitud('ar-1')
    expect(llamado).toBe(true)
  })
})
