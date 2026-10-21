/** Una falla, un aviso · 2026-10-21
 *
 *  **Visto en QA con Keralty**: los doce paneles en `ERROR` con el mismo texto,
 *  el error crudo de Snowflake —«Object 'DB_HNO_KERALTY…' does not exist or not
 *  authorized. Your primary role RL_BT_UA_BI…»— repetido doce veces, y debajo de
 *  cada uno «El resto de los paneles cargó normalmente», que era falso. Quien
 *  entraba leía doce veces el nombre de una base y de un rol que no son para él.
 *
 *  **Una causa repetida es UNA causa**, y se dice una vez: arriba de la grilla,
 *  con cuántos paneles alcanza. El detalle técnico sólo lo ve quien administra,
 *  que es quien puede hacer algo con él.
 *
 *  **Se agrupa por el texto exacto**, sin interpretarlo: el front no sabe qué
 *  significa un error de Snowflake y no lo traduce. Dos mensajes distintos son
 *  dos causas, aunque se parezcan.
 */
import type { Payload } from '../../api/types'

export type FallaComun = {
  mensaje: string
  /** Los paneles que fallaron con ese mensaje, en el orden de la grilla. */
  paneles: string[]
  /** Cuántos paneles tiene la pestaña, para decir «todos» cuando lo son. */
  total: number
}

/** **Desde dos**: con uno solo no hay nada que agrupar, y el panel ya dice lo
 *  suyo. Si hay más de una causa repetida, gana la que alcanza a más paneles;
 *  las demás siguen diciéndose en su panel. */
export function fallaComun(paneles: readonly { id: string; payload: Payload }[]): FallaComun | null {
  const porMensaje = new Map<string, string[]>()
  for (const { id, payload } of paneles) {
    if (payload.estado !== 'ERROR') continue
    porMensaje.set(payload.mensaje, [...(porMensaje.get(payload.mensaje) ?? []), id])
  }
  let mejor: FallaComun | null = null
  for (const [mensaje, ids] of porMensaje) {
    if (ids.length < 2) continue
    if (mejor === null || ids.length > mejor.paneles.length) mejor = { mensaje, paneles: ids, total: paneles.length }
  }
  return mejor
}
