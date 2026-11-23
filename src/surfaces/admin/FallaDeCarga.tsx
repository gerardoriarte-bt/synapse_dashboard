/** Una lectura que falló, dicha · §8 · auditoría de UX del 2026-11-18 (A1) ·
 *  §PEN:A7 · «A7 · Reportes · no cargó»
 *
 *  La lista de reportes y los envíos quedaban cargando para siempre si el
 *  servicio fallaba: no se leía el error. **El 403 tiene causa concreta** y se
 *  dice así, igual que en el resto de la administración.
 *
 *  **El 404 sin cuerpo también** · 2026-11-23. Es lo que contesta el servidor
 *  cuando la ruta no existe —medido en QA: `text/plain`, «404 page not
 *  found»—, y el detalle que llegaba era «El servicio respondió 404 sin
 *  cuerpo.», que no le dice nada a quien administra. Lo que sí se sabe es que
 *  el servidor no tiene esa función; por qué, no, y no se adivina.
 */
import { ApiError } from '../../api/types'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'

export function FallaDeCarga({ que, error, onReintentar }: { que: string; error: Error; onReintentar: () => void }) {
  const status = error instanceof ApiError ? error.httpStatus : null
  const sinRuta = status === 404 && /sin cuerpo/.test(error.message)
  return (
    <section role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-w3 bg-panel p-6">
      <span className="font-body text-cuerpo font-medium text-ink">
        {status === 403 ? 'Esta pantalla pide rol de administrador.' : `No se pudieron cargar ${que}.`}
      </span>
      {sinRuta ? (
        <Ayuda>Este servidor todavía no ofrece esta función.</Ayuda>
      ) : (
        status !== 403 && error.message !== '' && <Ayuda>{error.message}</Ayuda>
      )}
      <Accion onClick={onReintentar}>Reintentar</Accion>
    </section>
  )
}
