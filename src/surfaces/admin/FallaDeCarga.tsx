/** Una lectura que falló, dicha · §8 · auditoría de UX del 2026-11-18 (A1)
 *
 *  La lista de reportes y los envíos quedaban cargando para siempre si el
 *  servicio fallaba: no se leía el error. **El 403 tiene causa concreta** y se
 *  dice así, igual que en el resto de la administración.
 */
import { ApiError } from '../../api/types'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'

export function FallaDeCarga({ que, error, onReintentar }: { que: string; error: Error; onReintentar: () => void }) {
  return (
    <section role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-w3 bg-panel p-6">
      <span className="font-body text-cuerpo font-medium text-ink">
        {error instanceof ApiError && error.httpStatus === 403 ? 'Esta pantalla pide rol de administrador.' : `No se pudieron cargar ${que}.`}
      </span>
      {!(error instanceof ApiError && error.httpStatus === 403) && error.message !== '' && <Ayuda>{error.message}</Ayuda>}
      <Accion onClick={onReintentar}>Reintentar</Accion>
    </section>
  )
}

