/** El dashboard que se está mirando, de la consola al builder · 2026-11-10
 *
 *  **Lo notó el humano usándolo**: desde el menú, «Editor» abría el editor del
 *  dashboard POR DEFECTO aunque la consola mostrara otro. La consola sabía cuál
 *  miraba —`dashboardActivoId`— y no lo decía al navegar, así que el builder
 *  elegía el suyo.
 *
 *  **Viaja en la URL, como el cliente** (`ClienteDeTrabajoProvider`): sobrevive
 *  a recargar y a compartir el enlace. Y lo resuelve el builder contra SU lista,
 *  así que un id que no es del cliente se ignora y cae al por defecto.
 *
 *  **Sólo a las pantallas del builder**: administración no edita dashboards, y
 *  ahí el parámetro no significaría nada.
 */
export const PARAMETRO_DASHBOARD = 'dashboard'

export function rutaConDashboard(ruta: string, dashboardId: string | null): string {
  if (dashboardId === null || !/^\/builder(\/|$)/.test(ruta)) return ruta
  return `${ruta}?${PARAMETRO_DASHBOARD}=${encodeURIComponent(dashboardId)}`
}
