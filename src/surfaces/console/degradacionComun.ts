/** Una degradación repetida, un aviso · 2026-11-23
 *
 *  **Visto en QA con los meses cerrados de UA**: cada tarjeta repetía, debajo
 *  del título, «Los datos tienen más de 3 días…» y «Qué lo desbloquea · Se
 *  actualiza en la próxima materialización». La misma frase en todos los
 *  paneles, empujando el cuerpo hacia abajo en cada uno.
 *
 *  Es el mismo caso que `fallaComun.ts` resolvió para los errores: **una causa
 *  repetida es UNA causa**, y se dice una vez arriba de la grilla. Cada panel
 *  conserva el badge —que no empuja nada, va en la línea del título— y deja de
 *  repetir la frase.
 *
 *  **Se agrupa por el texto exacto de la razón Y de lo que la desbloquea**, sin
 *  interpretarlos ni reescribirlos: el copy es del backend. Dos textos
 *  distintos son dos limitaciones distintas, aunque se parezcan.
 */
import type { Payload } from '../../api/types'

export type DegradacionComun = {
  razon: string
  desbloqueaCon: string
  /** Los paneles con esa razón, en el orden de la grilla. */
  paneles: string[]
  /** Cuántos paneles tiene la pestaña, para decir «todos» cuando lo son. */
  total: number
}

/** **Desde dos**, igual que la falla común. Si hay más de una razón repetida
 *  gana la que alcanza a más paneles; las demás siguen dichas en su panel. Una
 *  razón vacía no se agrupa: no hay nada que decir una vez. */
export function degradacionComun(
  paneles: readonly { id: string; payload: Payload }[],
): DegradacionComun | null {
  const porCausa = new Map<string, { razon: string; desbloqueaCon: string; ids: string[] }>()
  for (const { id, payload } of paneles) {
    if (payload.estado !== 'DEGRADADO') continue
    if (payload.razon.trim() === '' && payload.desbloqueaCon.trim() === '') continue
    const clave = JSON.stringify([payload.razon, payload.desbloqueaCon])
    const grupo = porCausa.get(clave) ?? { razon: payload.razon, desbloqueaCon: payload.desbloqueaCon, ids: [] }
    grupo.ids.push(id)
    porCausa.set(clave, grupo)
  }
  let mejor: DegradacionComun | null = null
  for (const { razon, desbloqueaCon, ids } of porCausa.values()) {
    if (ids.length < 2) continue
    if (mejor === null || ids.length > mejor.paneles.length) {
      mejor = { razon, desbloqueaCon, paneles: ids, total: paneles.length }
    }
  }
  return mejor
}
