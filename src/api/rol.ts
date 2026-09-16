/** ¿Este rol administra la plataforma? · 2026-09-16
 *
 *  ── ESTO NO ES UN PERMISO, Y LA DIFERENCIA IMPORTA ──────────────────────────
 *
 *  **El permiso lo aplica el servidor y ya lo aplica.** `/admin/*` cuelga de
 *  `AdminOnlyMiddleware` y devuelve **403** a cualquiera que no sea admin,
 *  independientemente de lo que el front muestre. Verificado el 2026-09-16: con
 *  rol `Planner` las ocho rutas daban 403, y con `Admin` dan 200.
 *
 *  Lo que esto decide es **si se pinta la entrada**, que es la regla que este
 *  repositorio ya aplica en tres lugares: «un botón que se aprieta y devuelve
 *  403 es peor que un botón ausente». Mismo motivo que `puedeAprobar` en
 *  `RecoBody` y que el CTA sin manejador del shell.
 *
 *  **Por eso NO va en `AuthGuard`.** El guardia no decide por rol a propósito —
 *  «un guardia que decidiera por rol sería lógica de negocio en el front»— y
 *  esconder la entrada no es lo mismo que proteger la ruta: quien escriba
 *  `/admin` a mano sigue llegando a la pantalla, y las llamadas siguen dando
 *  403. Eso está bien: **ocultar no es permitir**, y el servidor es el que dice
 *  que no.
 *
 *  ── POR QUÉ SE NORMALIZA ────────────────────────────────────────────────────
 *
 *  Se compara en minúsculas y sin espacios porque **el servicio hace lo mismo**.
 *  El rol del usuario de prueba llega como `Admin` —con mayúscula— y
 *  `/admin/tenants` le responde 200: si acá comparáramos contra `'admin'` a
 *  secas, el front escondería una entrada que el servidor sí habilita, que es el
 *  error simétrico al que esta función existe para evitar.
 */
import type { AppContext } from './types'

export const ROL_ADMIN = 'admin'

export function esAdmin(role: AppContext['role'] | undefined): boolean {
  return role !== undefined && role.nombre.trim().toLowerCase() === ROL_ADMIN
}
