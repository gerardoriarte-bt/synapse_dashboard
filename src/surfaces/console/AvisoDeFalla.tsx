/** El aviso de una falla común a varios paneles · 2026-10-21 · ver `fallaComun.ts`.
 *
 *  **Gramática de §8**: estado, razón, y salida. La razón para quien no
 *  administra es que no se pudo calcular; el texto del servicio —que nombra
 *  bases, esquemas y roles de Snowflake— queda detrás de «Ver el detalle
 *  técnico», y sólo para quien administra.
 *
 *  **Sin rojo**: el rojo es de acción, nunca de dato ni de estado (D4).
 */
import { Accion } from '../../render/primitives/Accion'
import { Label } from '../../render/primitives/Label'
import type { FallaComun } from './fallaComun'

type Props = {
  falla: FallaComun
  /** Quien administra ve el texto del servicio. */
  conDetalle: boolean
  /** Reintenta los paneles de la falla, en una sola vuelta. Sin él no se pinta. */
  onReintentar?: ((panelIds: string[]) => void) | undefined
}

export function AvisoDeFalla({ falla, conDetalle, onReintentar }: Props) {
  const todos = falla.paneles.length === falla.total
  return (
    <section
      aria-labelledby="aviso-de-falla"
      className="flex flex-col gap-3 rounded-xl border border-w4 bg-panel p-6"
    >
      <Label as="div">
        Error · {todos ? `los ${falla.total} paneles` : `${falla.paneles.length} de ${falla.total} paneles`}
      </Label>
      <h2 id="aviso-de-falla" className="m-0 font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
        {todos ? 'Ningún panel de esta pestaña se pudo calcular' : `${falla.paneles.length} paneles no se pudieron calcular`}
      </h2>
      <p className="m-0 font-body text-cuerpo text-dim">
        Fallaron todos por la misma causa, así que se dice una vez y no en cada panel.
        {conDetalle ? '' : ' Quien administra este cliente ve el detalle.'}
      </p>
      {conDetalle && (
        <details>
          <summary className="cursor-pointer font-body text-cuerpo text-ink">Ver el detalle técnico</summary>
          <p className="mt-2 mb-0 break-words font-mono text-celda text-dim">{falla.mensaje}</p>
        </details>
      )}
      {onReintentar !== undefined && (
        <div>
          <Accion onClick={() => onReintentar(falla.paneles)}>
            {todos ? 'Reintentar todos' : `Reintentar los ${falla.paneles.length}`}
          </Accion>
        </div>
      )}
    </section>
  )
}
