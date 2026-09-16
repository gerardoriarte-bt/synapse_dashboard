/** En cuántos paneles se usa cada métrica · A4, columna `USO`
 *
 *  §7.3 se lo pide a A4 —«y en cuántos paneles se usa»— y el `.pen` lo dibuja
 *  con más detalle: la celda dice «2 · PANELES», y al desplegar, «PEGA EN ·
 *  Inventory & Shopping» y «EDITAR SU NOMBRE, FAMILIA O TIPO CAMBIA LO QUE VEN 2
 *  ROLES».
 *
 *  ── POR QUÉ F4.5 LO DECLARÓ AUSENTE, Y QUÉ CAMBIÓ ───────────────────────────
 *
 *  F4.5 lo descartó con un argumento que **sigue siendo válido**: contarlo sobre
 *  el layout publicado le da **cero** a una métrica que solo se usa en un
 *  borrador, y quien lo lea va a concluir «no se usa» y considerar retirarla.
 *
 *  Lo que cambió no es el argumento sino **qué está en la mano**: desde F4.3 la
 *  ficha de cliente ya pide el layout publicado y los roles del tenant, así que
 *  el conteo no cuesta un viaje más. Y el problema del cero se resuelve
 *  **diciendo sobre qué se contó**: «2 paneles del layout publicado» es cierto;
 *  «2» a secas es lo que engaña.
 *
 *  **Los borradores no se recorren**, y eso es una decisión de costo declarada:
 *  serían N viajes, uno por versión, para un dato que no cambia lo que los
 *  usuarios ven hoy.
 *
 *  ── Y POR QUÉ EL PUBLICADO ES EL CORRECTO PARA ESTA PREGUNTA ────────────────
 *
 *  El aviso del `.pen` —«cambia lo que ven 2 roles»— es sobre **lo que la gente
 *  ve**, y lo que la gente ve es el layout publicado. Un borrador todavía no le
 *  cambia nada a nadie.
 */
import type { LayoutDetalle, Rol } from '../../api/admin'

export type UsoDeMetrica = {
  paneles: number
  /** En qué pestañas aparece · nombres, no ids. */
  pestanas: string[]
  /** Qué roles la ven. Un rol sin `pestanas` ve todas · §7.3. */
  roles: string[]
}

export function usoPorMetrica(
  detalle: LayoutDetalle | undefined,
  roles: readonly Rol[],
): Map<string, UsoDeMetrica> {
  const out = new Map<string, UsoDeMetrica>()
  if (detalle === undefined) return out

  for (const { tab, panels } of detalle.tabs) {
    // **Un rol con `pestanas` vacío ve TODAS** · es la misma regla que A2
    // declara, y aplicarla mal acá diría que una métrica no la ve nadie.
    const quienes = roles.filter((r) => r.pestanas.length === 0 || r.pestanas.includes(tab.id))

    for (const p of panels) {
      if (p.metricId === '') continue
      const actual = out.get(p.metricId) ?? { paneles: 0, pestanas: [], roles: [] }
      actual.paneles += 1
      // Una métrica puede estar dos veces en la misma pestaña: cuenta dos
      // paneles y **una** pestaña.
      if (!actual.pestanas.includes(tab.nombre)) actual.pestanas.push(tab.nombre)
      for (const r of quienes) if (!actual.roles.includes(r.nombre)) actual.roles.push(r.nombre)
      out.set(p.metricId, actual)
    }
  }

  return out
}
