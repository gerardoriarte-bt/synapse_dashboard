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
 *  **Con una advertencia que ese yaml lleva adentro:** a diferencia del cable de
 *  la consola, este NO se pudo confirmar contra el servicio —las rutas piden rol
 *  `admin` y el usuario de prueba es `planner`—. Así que estas pruebas verifican
 *  el adaptador contra lo que el código de Go dice que devuelve, no contra lo
 *  que se vio llegar. Es una capa menos de evidencia y conviene recordarlo.
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
