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

/** **«superadmin» también administra** · 2026-10-20, medido en QA.
 *
 *  El backend creó el rol y se lo dio a `jose.rodriguez@lobueno.co`, y con él
 *  `/admin/*` contesta 200 **y cruza clientes**: `GET /admin/tenants` le da los
 *  cinco, y el catálogo, los roles, los usuarios, los layouts y los feeds de
 *  Keralty contestan 200. Sólo con «admin» el front escondía el menú de trabajo
 *  a quien el servidor sí habilita, que es el error simétrico que esta función
 *  existe para evitar.
 *
 *  **Ese código no está en su repositorio**: en `31e97b1`, `AdminOnlyMiddleware`
 *  sigue pidiendo «admin» a secas. Se transcribe lo que QA hace, y está
 *  preguntado. Cuando `/config/me` diga qué se puede administrar —el pedido 4
 *  del 2026-10-10—, esta lista se va. */
export const ROLES_QUE_ADMINISTRAN: readonly string[] = [ROL_ADMIN, 'superadmin']

export function esAdmin(role: AppContext['role'] | undefined): boolean {
  return role !== undefined && ROLES_QUE_ADMINISTRAN.includes(role.nombre.trim().toLowerCase())
}
