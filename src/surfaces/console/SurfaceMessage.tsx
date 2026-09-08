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
}

export function SurfaceMessage({ title, detail, onRetry }: Props) {
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
      </div>
    </main>
  )
}
