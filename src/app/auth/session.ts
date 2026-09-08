/** El token de sesión, en un solo lugar · F0.5.
 *
 *  Vive en `app/` y no en `api/` porque el login es routing y no transporte:
 *  `api/client.ts` solo lo LEE para firmar el request.
 *
 *  El JWT trae `tenant_id`, `role_id` y `user_id` como claims, y el front NO los
 *  lee de ahí: los recibe resueltos en `/config/me`. Decodificar el token en el
 *  cliente sería volver a poner en el front una decisión que es del backend.
 */
const KEY = 'synapse.token'

export function currentToken(): string | null {
  return localStorage.getItem(KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(KEY, token)
}

export function signOut(): void {
  localStorage.removeItem(KEY)
}

export function hasSession(): boolean {
  return currentToken() !== null
}
