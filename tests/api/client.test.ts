// @vitest-environment jsdom
//
// jsdom por dos razones concretas: `session.ts` lee `localStorage`, y el cliente
// pega contra `/api/v1` en RELATIVO — en node `fetch` de una URL relativa tira
// `Failed to parse URL`, y solo hay `location.origin` contra el que resolverla
// dentro de un DOM.

/** El cliente HTTP · F1.1, probado como manda F0.9: contra HTTP mockeado y NO
 *  contra un fixture importado. Un contenedor que importa datos falsos queda
 *  acoplado a ellos, y el acoplamiento sobrevive al deploy — §4 de
 *  `nuevo-desarrollo.md` lo declara anti-patrón.
 */
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { ApiError, SIN_CODIGO } from '@/api/types'
import { saveToken } from '@/app/auth/session'
import { API, context, fail, ok } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('el envelope se desenvuelve en el cliente y en ningún otro lado', () => {
  it('devuelve `data` adaptado, no `{ success, data }` ni la forma del cable', async () => {
    // Dos cosas en una, y las dos tienen que valer: el envelope se desenvuelve
    // —si saliera `{ success, data }`, la forma del transporte ya se habría
    // filtrado a la capa de datos— y lo que sale habla el vocabulario del
    // CONTRATO aunque haya entrado el del CABLE.
    const ctx = await api.me()

    expect(ctx.catalogVersion).toBe(context.catalog_version)
    expect(ctx.tabs[0]?.pregunta).toBe(context.tabs[0]?.operational_question)
    // `first_name` + `last_name` → `nombre`. Los dos datos llegaron, así que
    // componerlo es reformatear y no inventar.
    expect(ctx.user.nombre).toBe('Prueba Uno')
    // Y nada del cable sobrevive: si `catalog_version` siguiera acá, el
    // adaptador estaría copiando en vez de traduciendo.
    expect(ctx).not.toHaveProperty('catalog_version')
    expect(ctx).not.toHaveProperty('periods')
  })

  it('un `success: false` sale como ApiError con el mensaje del servicio', async () => {
    // **`error` es una CADENA en este servicio**, no el objeto de §4.1. Leerlo
    // como objeto daba `code: undefined` y `message: ''` — una pantalla de error
    // sin una palabra, que es el defecto por el que existe `api/auth.ts`.
    server.use(
      http.get(`${API}/config/me`, () => fail('El feed de ventas no corrió hoy.', { status: 409 })),
    )

    const error = await api.me().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      message: 'El feed de ventas no corrió hoy.',
      httpStatus: 409,
    })
  })

  it('el código dice que no hay código, y no cae en ninguna familia de §4.1', async () => {
    // §4.1 propone `FAMILIA_DETALLE` y que el front decida sobre el prefijo
    // hasta el primer `_`. El servicio no manda ninguno, así que el front NO
    // clasifica: `SIN` no es `CAMPO`, `REGLA` ni `FALLO`, y por eso ninguna rama
    // futura lo va a agarrar por accidente.
    server.use(http.get(`${API}/config/me`, () => fail('No hay nada.')))

    const error = (await api.me().catch((e: unknown) => e)) as ApiError

    expect(error.code).toBe(SIN_CODIGO)
    expect(['CAMPO', 'REGLA', 'FALLO']).not.toContain(error.code.split('_')[0])
  })

  it('sin `desbloqueaCon` el campo queda en null, no en undefined', async () => {
    // El cable no tiene dónde mandarlo: el error es una cadena y nada más.
    server.use(http.get(`${API}/config/me`, () => fail('No hay nada.')))

    const error = (await api.me().catch((e: unknown) => e)) as ApiError
    expect(error.unblockedBy).toBeNull()
  })

  it('una respuesta que no es JSON no explota con «Unexpected token»', async () => {
    // Un 502 del proxy o un panic de Go devuelven HTML. Sin el try, el mensaje
    // que ve el usuario habla del parser y no de que el servicio no está.
    server.use(
      http.get(`${API}/config/me`, () =>
        HttpResponse.text('<html>502 Bad Gateway</html>', { status: 502 }),
      ),
    )

    const error = (await api.me().catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.httpStatus).toBe(502)
    expect(error.message).toContain('502')
    expect(error.message).not.toContain('JSON.parse')
  })
})

describe('el bearer', () => {
  it('viaja cuando hay sesión', async () => {
    saveToken('token-de-prueba')

    let authorization: string | null = null
    server.use(
      http.get(`${API}/config/me`, ({ request }) => {
        authorization = request.headers.get('Authorization')
        return ok(context)
      }),
    )

    await api.me()
    expect(authorization).toBe('Bearer token-de-prueba')
  })

  it('no se manda vacío cuando no hay sesión', async () => {
    // Un `Authorization: Bearer null` es peor que ninguna cabecera: el backend
    // lo lee como un intento de autenticar y responde 401 en vez de 403.
    let hasHeader = true
    server.use(
      http.get(`${API}/config/me`, ({ request }) => {
        hasHeader = request.headers.has('Authorization')
        return ok(context)
      }),
    )

    await api.me()
    expect(hasHeader).toBe(false)
  })
})

describe('las rutas que arma el cliente', () => {
  it('escapa el tabId y agrega el layoutId solo si vino', async () => {
    const urls: string[] = []
    server.use(
      http.get(`${API}/config/tabs/:tabId`, ({ request }) => {
        urls.push(new URL(request.url).search)
        return ok({ tab: context.tabs[0], panels: [] })
      }),
    )

    await api.tab('tab/uno')
    await api.tab('tab-1', 'layout-9')

    expect(urls).toEqual(['', '?layoutId=layout-9'])
  })
})

describe('los cuerpos que el servicio exige · F1.36', () => {
  it('el batch manda `panel_ids` y `period`, que es lo que el binding pide', async () => {
    // Los dos llevan `binding:"required"` en Gin. Con `panelIds`/`periodo` el
    // servicio devuelve **400**, no un batch vacío: iba mal desde F1.1 y MSW no
    // lo podía ver porque respondía a cualquier cuerpo.
    let body: unknown = null
    server.use(
      http.post(`${API}/config/panels:batch`, async ({ request }) => {
        body = await request.json()
        return ok({})
      }),
    )

    await api.panelsBatch(['p-1', 'p-2'], '2026-08')

    expect(body).toEqual({ panel_ids: ['p-1', 'p-2'], period: '2026-08' })
  })

  it('las preferencias van a `/preferences` con `theme`', async () => {
    // `/preferencias` con `{ tema }` es un 404 en este servicio.
    let url = ''
    let body: unknown = null
    server.use(
      http.put(`${API}/config/me/preferences`, async ({ request }) => {
        url = new URL(request.url).pathname
        body = await request.json()
        return ok({ theme: 'dark' })
      }),
    )

    await api.savePreferences('dark')

    expect(url.endsWith('/config/me/preferences')).toBe(true)
    expect(body).toEqual({ theme: 'dark' })
  })
})
