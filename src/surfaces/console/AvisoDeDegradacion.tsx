/** El aviso de una degradación común a varios paneles · 2026-11-23 · ver
 *  `degradacionComun.ts`.
 *
 *  **La razón y lo que la desbloquea van tal cual llegan**: son copy del
 *  backend, y reescribirlos acá sería el front redactando una limitación de la
 *  que no sabe la causa. Lo único nuestro es cuántos paneles alcanza.
 *
 *  **Mismo registro que `DegradedNote`** —rótulo mono, «Qué lo desbloquea ·»
 *  con el mismo literal— para que la gramática de §8 sea una sola, esté en el
 *  panel o arriba de la grilla. **Sin rojo y sin ámbar**: el aviso se distingue
 *  por el badge, que es el del panel.
 */
import { Label } from '../../render/primitives/Label'
import { DegradedBadge } from '../../render/Panel/DegradedBadge'
import type { DegradacionComun } from './degradacionComun'

export function AvisoDeDegradacion({ degradacion }: { degradacion: DegradacionComun }) {
  const todos = degradacion.paneles.length === degradacion.total
  return (
    <section aria-label="Paneles degradados" className="flex flex-col gap-2 rounded-xl border border-w4 bg-panel px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <DegradedBadge>Degradado</DegradedBadge>
        <Label as="div">
          {todos
            ? `Los ${String(degradacion.total)} paneles · misma limitación`
            : `${String(degradacion.paneles.length)} de ${String(degradacion.total)} paneles · misma limitación`}
        </Label>
      </div>
      {degradacion.razon.trim() !== '' && <Label as="div">{degradacion.razon}</Label>}
      {degradacion.desbloqueaCon.trim() !== '' && (
        <Label as="div">{`Qué lo desbloquea · ${degradacion.desbloqueaCon}`}</Label>
      )}
    </section>
  )
}
