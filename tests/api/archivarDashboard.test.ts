// @vitest-environment jsdom
//
// Por lo mismo que `admin.test.tsx`: la base cae a `/api/v1`, que es RELATIVO,
// y en node `fetch` de una URL relativa tira `Failed to parse URL`.

/** El adaptador de dashboards y la ruta de archivar · `5b917f7`
 *
 *  **Los fixtures salen del cable** —`LayoutDashboard` de
 *  `contracts/synapse-admin-wire.yaml`—, que a su vez se leyó de
 *  `internal/core/domain/dd_dashboard.go` en `f1ccbbe`: `is_archived` viaja
 *  siempre y `archived_at` es `omitempty`, así que FALTA en los que no están
 *  archivados. No se midió contra un servicio: no hay ruta para desarchivar.
 *
 *  La prueba del adaptador va aparte de la de pantalla por la razón de siempre:
 *  la pantalla construye el tipo a mano, y la frontera queda sin cubrir.
 */
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { adminApi } from '@/api/admin'
import { ApiError } from '@/api/types'
import { fail, ok } from '../mocks/handlers'
import { server } from '../mocks/server'

const API = '*/api/v1'

describe('`GET /admin/tenants/{tenantId}/dashboards` · con los archivados', () => {
  it('lee `is_archived` y `archived_at`, y un servicio sin el campo da «no archivado»', async () => {
    server.use(
      http.get(`${API}/admin/tenants/:id/dashboards`, () =>
        ok([
          // Anterior a `5b917f7`: sin ninguno de los dos.
          { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
          // Posterior, sin archivar: `is_archived` va, `archived_at` no (`omitempty`).
          { id: 'd-2', tenant_id: 't-1', name: 'Marca', slug: 'marca', is_default: false, is_archived: false, history_months: 12 },
          {
            id: 'd-3', tenant_id: 't-1', name: 'Temporada', slug: 'temporada', is_default: false,
            is_archived: true, archived_at: '2026-11-23T19:06:08Z', history_months: 12,
          },
        ]),
      ),
    )

    const lista = await adminApi.dashboards('t-1')
    expect(lista.map((d) => [d.nombre, d.archivado, d.archivadoEn])).toEqual([
      ['Overview', false, null],
      ['Marca', false, null],
      ['Temporada', true, '2026-11-23T19:06:08Z'],
    ])
  })
})

describe('`POST /admin/dashboards/{dashboardId}/archive`', () => {
  it('pega en la ruta del dashboard, sin cuerpo, y adapta lo que vuelve', async () => {
    const pedidos: { url: string; metodo: string; cuerpo: string }[] = []
    server.use(
      http.post(`${API}/admin/dashboards/:id/archive`, async ({ request, params }) => {
        pedidos.push({ url: new URL(request.url).pathname, metodo: request.method, cuerpo: await request.text() })
        return ok({
          id: params['id'], tenant_id: 't-1', name: 'Marca', slug: 'marca', is_default: false,
          is_archived: true, archived_at: '2026-11-24T10:00:00Z', history_months: 12,
        })
      }),
    )

    const d = await adminApi.archivarDashboard('d-2')
    expect(pedidos).toEqual([{ url: '/api/v1/admin/dashboards/d-2/archive', metodo: 'POST', cuerpo: '' }])
    expect(d).toMatchObject({ id: 'd-2', archivado: true, archivadoEn: '2026-11-24T10:00:00Z' })
  })

  it('el 409 llega como `ApiError` con su status, que es lo que la pantalla traduce', async () => {
    server.use(
      http.post(`${API}/admin/dashboards/:id/archive`, () =>
        fail('no se puede archivar el dashboard default: marque otro como default antes', { status: 409 }),
      ),
    )
    const error = await adminApi.archivarDashboard('d-1').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).httpStatus).toBe(409)
  })
})
