/** Validación de composición, del lado del front · F4.11
 *
 *  Corre sobre el borrador entero con `catalog/blocks.ts` —la tabla que llegó en
 *  `/config/blocks`— y el catálogo del tenant. **No reimplementa reglas: usa las
 *  mismas funciones que la consola** para detectar un layout mal formado, que es
 *  lo que hace que el builder y el renderizador no puedan opinar distinto.
 *
 *  ── ESTO ES FEEDBACK, NO LA DECISIÓN ────────────────────────────────────────
 *
 *  **El servidor decide** · B4.6. `POST /admin/layouts/{id}/validate` es la
 *  autoridad y F4.14 lo llama antes de publicar. Lo de acá es inmediato —se ve
 *  mientras se compone, sin una vuelta de red por tecla— y por eso puede estar
 *  incompleto: no conoce las reglas que el servidor tenga y nosotros no.
 *
 *  Nunca al revés: **que esto salga limpio no autoriza a publicar.** Un front que
 *  se dé por bueno a sí mismo es exactamente lo que el criterio de F4.11 prohíbe.
 *
 *  ── POR QUÉ ÍNDICES Y NO IDS ────────────────────────────────────────────────
 *
 *  Un problema se direcciona por posición en el borrador —`{ tab, panel }`— y no
 *  por `id`, porque **una pestaña o un panel recién agregados no tienen id
 *  todavía**: el id lo asigna el servidor al guardar. Los problemas que devuelve
 *  el servidor sí vienen por id, y juntarlos es trabajo de F4.14, cuando existan
 *  los dos lados.
 */
import { invalidReason } from '../../catalog/blocks'
import { validateParams } from '../../api/params'
import { problemas as problemasDeTab } from './borrador'
import type { BlockTable } from '../../catalog/blocks'
import type { Metric, PanelType } from '../../api/types'
import type { TabParaGuardar } from '../../api/admin'

export type ProblemaLocal = {
  tab: number
  /** `null` cuando el problema es de la pestaña y no de un panel. */
  panel: number | null
  campo: string
  mensaje: string
}

export function validarBorrador(
  tabs: readonly TabParaGuardar[],
  tabla: BlockTable,
  metrics: readonly Metric[],
): ProblemaLocal[] {
  const porId = new Map(metrics.map((m) => [m.id, m]))
  const out: ProblemaLocal[] = []

  tabs.forEach((t, i) => {
    // Las de la pestaña salen de `borrador.ts`, que es donde vive la regla dura
    // de la pregunta operativa. Repetirla acá la dejaría desincronizada.
    for (const mensaje of problemasDeTab(t)) {
      out.push({ tab: i, panel: null, campo: 'pregunta', mensaje })
    }

    // **Una pestaña sin paneles NO es un problema acá, y se dejó escrito.** Era
    // la regla obvia de agregar —«no contesta su pregunta con nada»— y no está
    // en ningún lado: §7.2 B2 hasta contempla el slot vacío como estado legítimo
    // del canvas. Inventarla haría que el front bloqueara una publicación que el
    // servidor acepta, que es la falla de F4.11 al revés.

    t.panels.forEach((p, j) => {
      const tipo = p.tipo as PanelType

      if (p.metricId === '') {
        out.push({
          tab: i,
          panel: j,
          campo: 'metricId',
          mensaje: 'Sin métrica · un panel se ancla a un metricId, no a un nombre de tabla',
        })
        return
      }

      const metrica = porId.get(p.metricId)
      if (metrica === undefined) {
        // Es la mitad local de B4.11. **Se dice el hecho, no el id**: quien
        // compone no puede hacer nada con un UUID, y el caso real es una métrica
        // que estaba en el catálogo y dejó de estar.
        out.push({
          tab: i,
          panel: j,
          campo: 'metricId',
          mensaje: 'La métrica de este panel ya no está en el catálogo del cliente',
        })
        return
      }

      const falla = invalidReason(tabla, tipo, metrica.forma, p.colSpan, p.rowSpan)
      if (falla !== null) out.push({ tab: i, panel: j, campo: 'tipo', mensaje: falla })

      // Los params, con la misma función que valida al leer un layout de vuelta.
      const validado = validateParams(tipo, p.opciones, tabla.get(tipo)?.paramsDisponibles)
      for (const problema of validado.invalid) {
        out.push({ tab: i, panel: j, campo: problema.param, mensaje: problema.reason })
      }
      for (const nombre of validado.unknown) {
        out.push({
          tab: i,
          panel: j,
          campo: nombre,
          mensaje: `«${nombre}» no lo lee este tipo de panel · se va a descartar`,
        })
      }
    })
  })

  return out
}

/** Cuántos problemas tiene cada pestaña, por índice. Para marcarla sin recorrer
 *  la lista entera en cada render de fila. */
export function porPestana(problemas: readonly ProblemaLocal[]): Map<number, number> {
  const cuenta = new Map<number, number>()
  for (const p of problemas) cuenta.set(p.tab, (cuenta.get(p.tab) ?? 0) + 1)
  return cuenta
}
