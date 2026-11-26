/** La cabecera de sesión, en UN solo lugar · 2026-11-26
 *
 *  Mejora #2 de `docs/AUDITORIA-2026-11-25-calidad-de-codigo.md`. Hasta acá
 *  `Authorization: Bearer …` se escribía a mano en siete lugares de cuatro
 *  archivos —`client.ts`, `admin.ts` (dos), `chat.ts` y `auth.ts` (tres)—, y
 *  esa es exactamente la clase de defecto que ya ocurrió: `askSynapse` se
 *  escribió aparte de `client.ts`, copió las dos cabeceras del SSE y no la
 *  `Authorization`, y el chat nunca autenticó.
 *
 *  **Sólo se unifica la cabecera, no los envelopes.** Cada cliente sigue
 *  desenvolviendo su respuesta a su manera, por las razones que cada uno anota
 *  (`admin.ts` devuelve el tipo de su cable; `auth.ts` lee `error` de otra
 *  forma; el chat lee un stream). Lo que no tenía razón para estar repetido
 *  era la firma.
 *
 *  Sin token, las cabeceras salen tal cual: el login y las solicitudes de
 *  acceso no llevan sesión, y un `Bearer null` sería un 401 con otra cara.
 */
import { currentToken } from '../app/auth/session'

/** Las cabeceras dadas, más la `Authorization` si hay sesión.
 *
 *  `token` se pasa sólo cuando quien llama ya lo tiene en la mano y tiene que
 *  ser ESE —`tokenInfo` verifica el token que el guardia usó como clave de
 *  cache—; si no, se lee el de la sesión en el momento de la petición. */
export function conSesion(
  cabeceras: Record<string, string> = {},
  token: string | null = currentToken(),
): Record<string, string> {
  return token === null ? cabeceras : { ...cabeceras, Authorization: `Bearer ${token}` }
}
