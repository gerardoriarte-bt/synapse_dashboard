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
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { ApiError } from '@/api/types'
import { saveToken } from '@/app/auth/session'
import { API, context, fail, ok } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('el envelope se desenvuelve en el cliente y en ningún otro lado', () => {
  it('devuelve `data`, no `{ success, data }`', async () => {
    // Si esto devolviera el envelope, la forma del transporte ya se habría
    // filtrado a la capa de datos.
    await expect(api.me()).resolves.toEqual(context)
  })

  it('un `success: false` sale como ApiError con código, status y desbloqueaCon', async () => {
    server.use(
      http.get(`${API}/config/me`, () =>
        fail('FEED_VENCIDO', 'El feed de ventas no corrió hoy.', {
          status: 409,
          desbloqueaCon: 'Corrida del ETL de ventas',
        }),
      ),
    )

    // §8: los errores no se disculpan y nunca son vagos. El panel necesita las
    // tres cosas para pintar estado, razón y CTA sin inventar ninguna.
    const error = await api.me().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      code: 'FEED_VENCIDO',
      message: 'El feed de ventas no corrió hoy.',
      httpStatus: 409,
      unblockedBy: 'Corrida del ETL de ventas',
    })
  })

  it('sin `desbloqueaCon` el campo queda en null, no en undefined', async () => {
    server.use(http.get(`${API}/config/me`, () => fail('SIN_DATOS', 'No hay nada.')))

    const error = (await api.me().catch((e: unknown) => e)) as ApiError
    expect(error.unblockedBy).toBeNull()
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
        return ok({})
      }),
    )

    await api.tab('tab/uno')
    await api.tab('tab-1', 'layout-9')

    expect(urls).toEqual(['', '?layoutId=layout-9'])
  })
})
