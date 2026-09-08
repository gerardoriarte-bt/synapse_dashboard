/** El cliente de autenticación · F0.5
 *
 *  **Es un servicio DISTINTO del de la consola, y por eso vive aparte.** El
 *  login lo sirve `synapse-api-go` (AntPack-dev), que es su propio despliegue;
 *  la consola la sirve la API del contrato. Los dos publican bajo `/api/v1`, así
 *  que sin dos bases el front no puede hablarle a los dos.
 *
 *  `VITE_AUTH_URL` cae a `VITE_API_URL` a propósito: si mañana los dos servicios
 *  quedan detrás del mismo origen —o se fusionan— no hay que tocar nada.
 *
 *  ── EL ENVELOPE NO ES EL MISMO, Y NO SE PUEDE FINGIR QUE SÍ ─────────────────
 *
 *  §4.1 del contrato declara el error como un OBJETO: `{ codigo, mensaje,
 *  campo?, desbloqueaCon? }`. El servicio de Go lo declara como una CADENA:
 *
 *      type Response struct {
 *          Success bool        `json:"success"`
 *          Data    interface{} `json:"data,omitempty"`
 *          Error   string      `json:"error,omitempty"`
 *      }
 *
 *  Pasarlo por `api/client.ts` no rompe: `body.error.codigo` sobre una cadena da
 *  `undefined`, así que saldría un `ApiError` con código y mensaje vacíos y el
 *  usuario vería una pantalla que no dice nada. **Ese silencio es la razón por
 *  la que este archivo desenvuelve por su cuenta** en vez de reusar el cliente.
 *
 *  El código lo pone el front —`AUTH_CREDENCIALES`, `AUTH_FALLO`— porque el
 *  servicio no manda uno. Está anotado en `docs/PARA-BACKEND.md`: si adoptan el
 *  error de §4.1, esto se borra y los dos servicios hablan igual.
 */
import { ApiError } from './types'
import { currentToken } from '../app/auth/session'
import type { components } from './auth-generated'

type AuthSchemas = components['schemas']

const BASE = import.meta.env['VITE_AUTH_URL'] ?? import.meta.env.VITE_API_URL ?? '/api/v1'

/** Lo que el servicio devuelve al entrar.
 *
 *  **Generado, no escrito** · F0.14. La primera versión de este tipo se escribió
 *  leyendo las estructuras de Go, y eso es escribir desde la implementación en
 *  vez del contrato — el mismo error que la Fase 5 encontró en los fixtures. Ya
 *  costó una: el spec declara que con `password_updated: false` el front debe
 *  mostrar un modal bloqueante, y nosotros lo habíamos anotado como una decisión
 *  de producto pendiente.
 *
 *  Las claves van en snake_case porque así viajan. No se traducen, por lo mismo
 *  que no se traducen las del contrato de la consola. */
export type LoginUser = AuthSchemas['LoginUserInfo']

/** El envelope del servicio. `ErrorResponse` sale del spec y confirma lo que ya
 *  se veía en el código: `error` es una CADENA, no el objeto de §4.1. */
type AuthError = AuthSchemas['ErrorResponse']
type AuthOk<T> = { success?: boolean; data?: T }

/** Lo que un login exitoso devuelve. El spec declara `token` y `user` como
 *  OPCIONALES dentro de `data` —`SuccessResponse & { data?: {...} }`— así que el
 *  tipo generado los trae con `?`. Acá se estrecha una vez, con la comprobación
 *  hecha, para que quien llama no arrastre dos opcionales por toda la app. */
export type LoginResult = { token: string; user: LoginUser }

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const body = (await res.json()) as AuthOk<Partial<LoginResult>> & AuthError

  if (!res.ok) {
    // 401 son credenciales; el resto es un fallo del servicio. La diferencia
    // importa para el mensaje: «revisá tu correo y contraseña» contra «volvé a
    // intentar», que son dos acciones distintas · §8.
    throw new ApiError(
      res.status === 401 ? 'AUTH_CREDENCIALES' : 'AUTH_FALLO',
      body.error ?? '',
      res.status,
    )
  }

  // El spec los declara opcionales; un 200 sin token es un servicio roto y hay
  // que decirlo, no seguir con `undefined` hasta que reviente en otro lado
  // · §1 principio 6.
  const { token, user } = body.data ?? {}
  if (token === undefined || user === undefined) {
    throw new ApiError('AUTH_FALLO', 'El servicio de acceso respondió sin sesión.', res.status)
  }

  return { token, user }
}

/** La sesión, según el servidor · F0.13.
 *
 *  **De acá sale `password_updated`, y no de guardarlo al entrar.** El login lo
 *  devuelve y sería más barato meterlo en `localStorage`, pero eso es una
 *  segunda fuente de verdad: quedaría en `false` para siempre si alguien cambia
 *  la contraseña desde otro lado, y el usuario no podría entrar nunca más.
 *
 *  El servicio lee «los datos del usuario en BD y los claims del JWT activo»,
 *  así que después de un cambio dice `true` aunque el token sea el viejo. */
export async function tokenInfo(token: string): Promise<{ user: LoginUser }> {
  const res = await fetch(`${BASE}/auth/token-info`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = (await res.json()) as AuthOk<{ user?: LoginUser }> & AuthError

  if (!res.ok) {
    throw new ApiError(
      res.status === 401 ? 'AUTH_CREDENCIALES' : 'AUTH_FALLO',
      body.error ?? '',
      res.status,
    )
  }

  const user = body.data?.user
  if (user === undefined) {
    throw new ApiError('AUTH_FALLO', 'El servicio de acceso respondió sin usuario.', res.status)
  }
  return { user }
}

/** Cambiar la contraseña · F0.13.
 *
 *  **La política la valida el servidor y el front no la reimplementa.** El spec
 *  la declara —ocho caracteres, letra, número, especial, distinta de la
 *  actual— y devuelve en `error` el criterio que falló, en prosa. Copiarla acá
 *  daría dos validaciones que se separan, y la del front sería la que miente.
 *
 *  Lo único que se declara en el input es `minLength={8}`, que evita un viaje
 *  que ya se sabe que vuelve con 400. */
export async function changePassword(current: string, next: string): Promise<LoginUser> {
  const res = await fetch(`${BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(currentToken() === null ? {} : { Authorization: `Bearer ${currentToken() as string}` }),
    },
    body: JSON.stringify({ current_password: current, new_password: next }),
  })
  const body = (await res.json()) as AuthOk<{ user?: LoginUser }> & AuthError

  if (!res.ok) {
    // Un 400 es la política; un 401 es la contraseña actual. Los dos traen el
    // texto del servicio, que ya dice cuál criterio falló.
    throw new ApiError(
      res.status === 401 ? 'AUTH_CREDENCIALES' : 'AUTH_POLITICA',
      body.error ?? '',
      res.status,
    )
  }

  const user = body.data?.user
  if (user === undefined) {
    throw new ApiError('AUTH_FALLO', 'El servicio no devolvió el usuario.', res.status)
  }
  return user
}

/** Pedir recuperación de contraseña · F0.15.
 *
 *  **Público: no lleva token.** Es el único del servicio de acceso que se puede
 *  llamar sin sesión, y tiene sentido — quien no puede entrar tampoco tiene con
 *  qué firmar.
 *
 *  **No devuelve si el correo existe, y el front no puede deshacer eso.** El
 *  servicio responde 201 con el mismo `message` esté el correo registrado o no;
 *  lo único que cambia es que trae `request` cuando existe. Si la pantalla
 *  mostrara algo distinto en cada caso —un texto, un tiempo de espera, un
 *  ícono— convertiría el endpoint en un verificador de correos: se prueba una
 *  lista y se ve cuáles son clientes. Por eso esta función devuelve **solo el
 *  mensaje** y descarta `request`: lo que no llega arriba no se puede filtrar
 *  por accidente.
 *
 *  **No es un enlace de reseteo.** El flujo termina en una solicitud que un
 *  admin tiene que aprobar; la pantalla no puede prometer un correo con un
 *  enlace porque no lo hay.
 */
export async function requestPasswordReset(email: string): Promise<string> {
  const res = await fetch(`${BASE}/password-reset-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Normalizado como lo hace el ejemplo del servicio: un correo con mayúsculas
    // o espacios es el mismo correo, y que la solicitud dependa de eso sería una
    // sorpresa.
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })
  const body = (await res.json()) as AuthOk<{ message?: string }> & AuthError

  if (!res.ok) {
    throw new ApiError(
      res.status === 409 ? 'AUTH_SOLICITUD_PENDIENTE' : 'AUTH_FALLO',
      body.error ?? '',
      res.status,
    )
  }

  return body.data?.message ?? 'Si el correo está registrado, tu solicitud fue enviada.'
}
