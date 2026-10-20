/** Los comparativos del mes abierto se dicen parciales · F5.22, 2026-10-19
 *
 *  **El servicio compara el mes en curso contra el anterior COMPLETO**, y no lo
 *  dice: el 19 de octubre la consola mostraba «VS MES ANTERIOR −74,5 %», que son
 *  diecinueve días contra treinta, y «VS AÑO ANTERIOR» tiene el mismo problema.
 *  Lo primero que leía un gerente era una caída que no existe.
 *
 *  **El delta no se toca ni se esconde.** Es del servicio; recalcularlo acá
 *  sería inventar una cifra. Lo que se agrega es que la consola SABE qué
 *  período está mirando y cuál está abierto —`open_period`—, así que marca los
 *  comparativos y el cuerpo lo dice al lado de cada uno.
 *
 *  Vive en `surfaces/` y no en el adaptador: el adaptador no sabe qué período
 *  se eligió, y en `render/` el cuerpo no sabe cuál está abierto.
 */
import type { Payload } from '../../api/types'

export function marcarParcial(payload: Payload, abierto: boolean): Payload {
  if (!abierto || !('presentacion' in payload) || payload.presentacion?.comparativo === undefined) {
    return payload
  }
  return {
    ...payload,
    presentacion: {
      ...payload.presentacion,
      comparativo: payload.presentacion.comparativo.map((c) => ({ ...c, parcial: true })),
    },
  }
}
