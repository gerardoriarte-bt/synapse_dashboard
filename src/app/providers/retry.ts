/** Cuándo se reintenta una consulta · aparte de `AppProviders` desde el 2026-11-24
 *
 *  Es una función y no un componente: en el archivo del proveedor rompía el
 *  fast refresh de Vite, y `oxlint` lo marcaba (`only-export-components`).
 */
import { ApiError } from '../../api/types'

/** **Un 4xx no se reintenta** · 2026-11-23.
 *
 *  Visto en QA con los reportes, cuya ruta todavía no está desplegada: la lista
 *  pidió una vez, recibió 404 y **se quedó en filas esqueleto para siempre**,
 *  sin reintento y sin error. TanStack **pausa** el reintento mientras la
 *  pestaña no tiene el foco, así que el `retry: 1` de antes dejaba la consulta
 *  colgada en «cargando» hasta que alguien volviera a la ventana — y el estado
 *  de error de la pantalla nunca llegaba.
 *
 *  Una respuesta 4xx no cambia por repetirla: la ruta no existe, el permiso no
 *  alcanza, el pedido está mal. Se reintenta una vez lo que puede ser pasajero
 *  —red, 5xx— y nada más. El 408 y el 429 son de la primera clase aunque
 *  empiecen con 4. */
export function reintentar(fallas: number, error: Error): boolean {
  if (error instanceof ApiError) {
    const s = error.httpStatus
    if (s >= 400 && s < 500 && s !== 408 && s !== 429) return false
  }
  return fallas < 1
}
