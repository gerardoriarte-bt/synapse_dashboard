/** Lo que se elige en la biblioteca y viaja al lienzo · 2026-11-10
 *
 *  La biblioteca es de datos: se elige qué se muestra y cómo, y el panel nace
 *  con las dos cosas. Ver `Library.tsx`.
 *
 *  **Viaja aparte del tipo**: `text/plain` sigue llevando el tipo, que es con lo
 *  que el lienzo mide el tamaño y el choque mientras se arrastra —`dataTransfer`
 *  no se puede leer antes de soltar—, y la elección va en este formato.
 */
import type { ChartId } from '../../catalog/types'

export type Eleccion = { metricId: string; tipo: string; grafico?: ChartId }

export const FORMATO_ELECCION = 'application/x-synapse-eleccion'

/** La elección que vino en el arrastre, o `null` si no vino o no coincide con
 *  el tipo que el lienzo midió. **No coincidir es descartarla**: soltar con el
 *  tamaño de un tipo y la elección de otro dejaría un panel mal medido. */
export function leerEleccion(crudo: string, tipo: string): Eleccion | null {
  if (crudo === '') return null
  try {
    const e = JSON.parse(crudo) as Partial<Eleccion>
    if (typeof e.metricId !== 'string' || e.tipo !== tipo) return null
    return {
      metricId: e.metricId,
      tipo,
      ...(typeof e.grafico === 'string' ? { grafico: e.grafico } : {}),
    }
  } catch {
    return null
  }
}
