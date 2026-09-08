// @vitest-environment jsdom
//
// Por lo mismo que `client.test.ts`: `VITE_AUTH_URL` cae a `/api/v1`, que es
// RELATIVO, y en node `fetch` de una URL relativa tira `Failed to parse URL`.
// Solo hay `location.origin` contra el que resolverla dentro de un DOM.

/** El cliente de acceso · F0.5
 *
 *  Contra el envelope REAL de `synapse-api-go`, que no es el del contrato: ahí
 *  `error` es una cadena y en §4.1 es un objeto. Las pruebas están escritas
 *  desde el handler de Go —`SendSuccess`/`SendError` de `response.go`— y no
 *  desde nuestro cliente.
 */
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { login } from '@/api/auth'
import { ApiError } from '@/api/types'
import { server } from '../mocks/server'

const AUTH = '*/api/v1/auth/login'

const usuario = {
  id: 'u-1',
  tenant_id: 't-1',
  email: 'prueba@uamx.test',
  first_name: 'Prueba',
  last_name: 'Uno',
  phone: '',
  role: 'planner',
  password_updated: true,
}

describe('entrar', () => {
  it('manda email y contraseña en el cuerpo y devuelve token y usuario', async () => {
    let recibido: unknown
    server.use(
      http.post(AUTH, async ({ request }) => {
        recibido = await request.json()
        return HttpResponse.json({ success: true, data: { token: 'jwt.abc', user: usuario } })
      }),
    )

    const salida = await login('prueba@uamx.test', 'secreto123')
    expect(recibido).toEqual({ email: 'prueba@uamx.test', password: 'secreto123' })
    expect(salida.token).toBe('jwt.abc')
    expect(salida.user.role).toBe('planner')
  })

  it('NO guarda el token · eso lo decide quien llama', () => {
    // `api/` es transporte. Dónde vive la sesión es de `app/auth/session.ts`, y
    // mezclarlos haría que un cliente HTTP tuviera efectos sobre el navegador.
    expect(localStorage.getItem('synapse.token')).toBeNull()
  })
})

describe('el envelope de Go no es el del contrato', () => {
  it('un 401 sale con el MENSAJE del servicio, no vacío', async () => {
    // Es la prueba que justifica que este archivo exista. Pasado por
    // `api/client.ts`, `body.error.mensaje` sobre la cadena «credenciales
    // inválidas» da `undefined` y el usuario ve una pantalla muda.
    server.use(
      http.post(AUTH, () =>
        HttpResponse.json({ success: false, error: 'credenciales inválidas' }, { status: 401 }),
      ),
    )

    await expect(login('a@b.test', 'malamala')).rejects.toThrow('credenciales inválidas')
  })

  it('distingue credenciales de fallo del servicio', async () => {
    // §8: «revisá tu correo» y «volvé a intentar» son dos acciones distintas.
    server.use(
      http.post(AUTH, () =>
        HttpResponse.json({ success: false, error: 'credenciales inválidas' }, { status: 401 }),
      ),
    )
    await expect(login('a@b.test', 'malamala')).rejects.toMatchObject({
      code: 'AUTH_CREDENCIALES',
      httpStatus: 401,
    })

    server.use(
      http.post(AUTH, () =>
        HttpResponse.json(
          { success: false, error: 'no se pudo completar el inicio de sesión' },
          { status: 500 },
        ),
      ),
    )
    await expect(login('a@b.test', 'secreto123')).rejects.toMatchObject({
      code: 'AUTH_FALLO',
      httpStatus: 500,
    })
  })

  it('un ApiError de acceso es el mismo tipo que el de la consola', async () => {
    // Para que una superficie no tenga que distinguir de qué servicio vino el
    // error para saber cómo leerlo.
    server.use(
      http.post(AUTH, () =>
        HttpResponse.json({ success: false, error: 'x' }, { status: 401 }),
      ),
    )
    await expect(login('a@b.test', 'secreto123')).rejects.toBeInstanceOf(ApiError)
  })
})
