/** Lo que la SUPERFICIE dice cuando no hay nada que componer · F1.26
 *
 *  Distinto de los estados de panel: aquellos reemplazan un cuerpo dentro de un
 *  shell que sigue en pie. Esto es cuando falla el contexto o el catálogo y no
 *  hay pantalla que dibujar — no hay métrica que nombrar ni BASE que declarar.
 *
 *  Misma gramática de §8 igual: qué pasa, por qué, y qué se puede hacer.
 */
import { Label } from '../../render/primitives/Label'

type Props = {
  title: string
  detail: string
  onRetry?: () => void
  /** **Una salida con su propio rótulo**, para los estados que no son un fallo
   *  y donde «Reintentar» no tiene sentido · F5.1.
   *
   *  Un dashboard sin componer reemplaza la pantalla entera —navbar incluido—
   *  así que sin esto el usuario que cambia a uno vacío **queda encerrado**: no
   *  hay selector para volver. Se vio abriéndolo, no lo dijo ninguna prueba.
   *
   *  Es el mismo precedente que B5 el 2026-09-25: «su vacío lleva salida
   *  propia». */
  accion?: { rotulo: string; onAccion: () => void } | undefined
}

export function SurfaceMessage({ title, detail, onRetry, accion }: Props) {
  return (
    <main className="min-h-screen bg-bg p-6 flex items-center justify-center">
      <div className="flex flex-col gap-3 max-w-md">
        <h1 className="font-display text-titulo-lg tracking-titulo text-ink m-0">{title}</h1>
        <Label>{detail}</Label>
        {onRetry !== undefined && (
          <button
            type="button"
            onClick={onRetry}
            className="self-start font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
          >
            Reintentar
          </button>
        )}
        {accion !== undefined && (
          <button
            type="button"
            onClick={accion.onAccion}
            className="self-start font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
          >
            {accion.rotulo}
          </button>
        )}
      </div>
    </main>
  )
}
