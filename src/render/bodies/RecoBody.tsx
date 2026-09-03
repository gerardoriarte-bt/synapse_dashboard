/** `reco` · forma `prosa` · colSpan 4–5, rowSpan 4–5 · F1.13g
 *
 *  Comparte forma con `prose` y no anatomía: `prose` sostiene un titular con
 *  tres cifras, `reco` enumera acciones que alguien aprueba o rechaza. Cada
 *  recomendación es un pilar; el titular es el marco.
 *
 *  **APROBAR y RECHAZAR viven acá y el cuerpo sigue siendo puro**: la acción
 *  entra por props —`actions`— y sale por callback. No hay `fetch`, no sabe
 *  quién persiste, y `render/` no importa de `api/`.
 *
 *  **`actions` está keyeado por `ref`, no por índice.** `tope` recorta los
 *  pilares antes de pintarlos, así que la posición no identifica nada: alinear
 *  posicionalmente pondría el botón de aprobar sobre la recomendación
 *  equivocada, en silencio y solo con cierta configuración.
 *
 *  Y `puedeResponder` lo decide el servidor. Si no se puede, el cuerpo **dice por
 *  qué** en vez de pintar un botón muerto — §8: un estado no es una queja, y un
 *  botón que devuelve 403 promete una acción que no existe.
 */
import { Label } from '../primitives/Label'
import type { BodyProps } from '../types'

export type RecoParams = {
  tope?: number
  ventana?: string
}

const DEFAULT_TOP = 3

const CTA =
  'font-mono text-label tracking-rotulo uppercase rounded-md px-3 py-1 ' +
  'cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2'

export function RecoBody({ value, params, actions, onRespond }: BodyProps<'prosa', RecoParams>) {
  const items = (value.pilares ?? []).slice(0, params.tope ?? DEFAULT_TOP)

  return (
    <div className="h-full min-h-0 flex flex-col gap-3 overflow-y-auto">
      <p className="font-body text-cuerpo leading-cuerpo text-ink m-0">{value.titular}</p>

      <div className="flex flex-col gap-3">
        {items.map((r) => {
          // Por `ref`, nunca por índice: `tope` ya recortó la lista.
          const action = r.ref !== undefined ? actions?.porRef[r.ref] : undefined
          return (
            <div key={r.label} className="flex flex-col gap-1">
              <Label>{r.label}</Label>
              <span className="font-body text-cuerpo leading-cuerpo text-ink">{r.valor}</span>
              {r.nota !== undefined && <Label>{r.nota}</Label>}

              {action !== undefined && (
                <div className="flex gap-2 mt-1">
                  {action.puedeResponder ? (
                    <>
                      <button
                        type="button"
                        className={CTA}
                        onClick={() => onRespond?.(action.accionableId, 'aceptado')}
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className={CTA}
                        onClick={() => onRespond?.(action.accionableId, 'rechazado')}
                      >
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <Label>{action.razonSiNo ?? 'Sin acción disponible'}</Label>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {params.ventana !== undefined && <Label>{`Ventana · ${params.ventana}`}</Label>}
    </div>
  )
}
