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

const BASE = import.meta.env['VITE_AUTH_URL'] ?? import.meta.env.VITE_API_URL ?? '/api/v1'

/** Lo que el servicio devuelve al entrar. Escrito desde `ports.LoginUserInfo`
 *  del repositorio de Go, con sus nombres en snake_case tal como viajan. */
export type LoginUser = {
  id: string
  tenant_id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: string
  /** `false` mientras el usuario siga con la contraseña que le asignaron.
   *  **El servicio NO bloquea el login por esto**: devuelve un token válido
   *  igual, así que forzar el cambio es del front. Ver F0.13. */
  password_updated: boolean
}

type GoEnvelope<T> = { success: true; data: T } | { success: false; error: string }

export async function login(email: string, password: string): Promise<{
  token: string
  user: LoginUser
}> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const body = (await res.json()) as GoEnvelope<{ token: string; user: LoginUser }>

  if (!body.success) {
    // 401 son credenciales; el resto es un fallo del servicio. La diferencia
    // importa para el mensaje: «revisá tu correo y contraseña» contra «volvé a
    // intentar», que son dos acciones distintas · §8.
    throw new ApiError(
      res.status === 401 ? 'AUTH_CREDENCIALES' : 'AUTH_FALLO',
      body.error,
      res.status,
    )
  }

  return body.data
}
