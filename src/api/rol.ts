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
 *  **Ya está en su repositorio** · `d794a3e`, leído el 2026-10-20:
 *  `AdminOnlyMiddleware` acepta los dos. Cuando `/config/me` diga qué se puede
 *  administrar —el pedido 4 del 2026-10-10—, esta lista se va. */
export const ROLES_QUE_ADMINISTRAN: readonly string[] = [ROL_ADMIN, 'superadmin']

export function esAdmin(role: AppContext['role'] | undefined): boolean {
  return role !== undefined && ROLES_QUE_ADMINISTRAN.includes(role.nombre.trim().toLowerCase())
}

/** **«superadmin» no se asigna desde la plataforma** · decisión humana del
 *  2026-10-20.
 *
 *  `d794a3e` crea un rol `superadmin` en CADA cliente —es lo que le permite al
 *  operador saltar a cualquiera—, así que aparecía en las listas de roles de
 *  todos: en el selector de rol de cada usuario, en la ficha, en el builder.
 *  Es de asignación interna de Lo Bueno, nunca de un cliente, así que el front
 *  no lo ofrece en ninguna parte.
 *
 *  **Esconderlo no es impedirlo**: el servicio acepta asignarlo igual —leído en
 *  `UpdateAdmin`, que valida sólo que el rol sea del cliente y esté activo—.
 *  Está avisado al backend. */
export const ROL_INTERNO = 'superadmin'

export function sinRolesInternos<T extends { nombre: string }>(roles: readonly T[]): T[] {
  return roles.filter((r) => r.nombre.trim().toLowerCase() !== ROL_INTERNO)
}
