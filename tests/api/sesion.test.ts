// @vitest-environment jsdom

/** Cada cliente firma con la sesión · mejora #2 de
 *  `docs/AUDITORIA-2026-11-25-calidad-de-codigo.md`
 *
 *  **Los handlers de acá EXIGEN la cabecera**, como el middleware del servicio:
 *  sin `Authorization: Bearer <token>` contestan 401. Es lo que el juego por
 *  defecto de MSW no hace, y por eso no vio que el chat nunca autenticó
 *  (2026-09-24): un handler que no exige el token responde igual con
 *  credencial y sin ella.
 *
 *  Una petición por cada camino que arma su propio `fetch`: el `request` de la
 *  consola, el `pedir` de administración y su DELETE sin cuerpo, el stream del
 *  chat y las tres rutas de sesión de `auth.ts`. Si alguno vuelve a escribir la
 *  cabecera a mano y se la olvida, falla el suyo.
 */
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { saveToken, signOut } from '@/app/auth/session'
import { adminApi } from '@/api/admin'
import { changePassword, switchTenant, tokenInfo } from '@/api/auth'
import { askSynapse } from '@/api/chat'
import { api } from '@/api/client'
import { conSesion } from '@/api/sesion'
import { context, ok } from '../mocks/handlers'
import { server } from '../mocks/server'

const API = '*/api/v1'
const TOKEN = 'jwt.de-la-sesion'

const usuario = {
  id: 'u-1',
  tenant_id: 't-1',
  email: 'prueba@uamx.test',
  first_name: 'Prueba',
  last_name: 'Uno',
  phone: '',
  role: 'admin',
  password_updated: true,
}

/** Lo que cada handler vio llegar, para que la falla diga QUÉ cliente no firmó. */
let recibidas: Record<string, string | null> = {}

/** El middleware: sin la cabecera esperada, 401. */
function exige(nombre: string, esperada: string, responder: () => Response) {
  return ({ request }: { request: Request }) => {
    const auth = request.headers.get('Authorization')
    recibidas[nombre] = auth
    if (auth !== esperada) {
      return HttpResponse.json({ success: false, error: 'token requerido' }, { status: 401 })
    }
    return responder()
  }
}

afterEach(() => {
  signOut()
  recibidas = {}
})

describe('con sesión, cada cliente manda `Authorization: Bearer`', () => {
  const BEARER = `Bearer ${TOKEN}`

  it('la consola · `client.ts`', async () => {
    saveToken(TOKEN)
    server.use(http.get(`${API}/config/me`, exige('consola', BEARER, () => ok(context))))
    await api.me()
    expect(recibidas['consola']).toBe(BEARER)
  })

  it('administración · `pedir` de `admin.ts`', async () => {
    saveToken(TOKEN)
    server.use(http.get(`${API}/admin/tenants`, exige('admin', BEARER, () => ok([]))))
    await adminApi.tenants()
    expect(recibidas['admin']).toBe(BEARER)
  })

  it('administración · el DELETE de rol, que no pasa por `pedir`', async () => {
    saveToken(TOKEN)
    server.use(
      http.delete(
        `${API}/admin/roles/:rolId`,
        exige('borrarRol', BEARER, () => new HttpResponse(null, { status: 204 })),
      ),
    )
    await adminApi.borrarRol('r-1')
    expect(recibidas['borrarRol']).toBe(BEARER)
  })

  it('el chat · el stream de `chat.ts`', async () => {
    saveToken(TOKEN)
    server.use(
      http.post(
        `${API}/config/chat`,
        exige(
          'chat',
          BEARER,
          () =>
            new HttpResponse('event: done\ndata: {}\n\n', {
              headers: { 'content-type': 'text/event-stream' },
            }),
        ),
      ),
    )
    const eventos = []
    for await (const e of askSynapse({
      pregunta: '¿Y las ventas?',
      contexto: { panelId: 'p-1', periodo: '2026-09' },
    })) {
      eventos.push(e)
    }
    expect(recibidas['chat']).toBe(BEARER)
  })

  it('acceso · `switchTenant`', async () => {
    saveToken(TOKEN)
    server.use(
      http.post(
        `${API}/auth/switch-tenant`,
        exige('switchTenant', BEARER, () =>
          HttpResponse.json({ success: true, data: { token: 'jwt.otro', user: usuario } }),
        ),
      ),
    )
    await switchTenant('t-2')
    expect(recibidas['switchTenant']).toBe(BEARER)
  })

  it('acceso · `changePassword`', async () => {
    saveToken(TOKEN)
    server.use(
      http.post(
        `${API}/auth/change-password`,
        exige('changePassword', BEARER, () =>
          HttpResponse.json({ success: true, data: { user: usuario } }),
        ),
      ),
    )
    await changePassword('Vieja#123', 'Nueva#456')
    expect(recibidas['changePassword']).toBe(BEARER)
  })

  it('acceso · `tokenInfo` firma con el token que RECIBE, no con el guardado', async () => {
    // El guardia usa el token como clave de cache: lo que se verifica tiene que
    // ser ese, aunque la sesión haya cambiado entre medio.
    saveToken('jwt.guardado')
    server.use(
      http.get(
        `${API}/auth/token-info`,
        exige('tokenInfo', `Bearer ${TOKEN}`, () =>
          HttpResponse.json({ success: true, data: { user: usuario } }),
        ),
      ),
    )
    await tokenInfo(TOKEN)
    expect(recibidas['tokenInfo']).toBe(`Bearer ${TOKEN}`)
  })
})

describe('el helper', () => {
  it('sin sesión devuelve las cabeceras tal cual · nada de `Bearer null`', () => {
    signOut()
    expect(conSesion({ accept: 'text/event-stream' })).toEqual({ accept: 'text/event-stream' })
  })

  it('con sesión la agrega sin pisar las otras', () => {
    saveToken(TOKEN)
    expect(conSesion({ 'Content-Type': 'application/json' })).toEqual({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    })
  })
})
