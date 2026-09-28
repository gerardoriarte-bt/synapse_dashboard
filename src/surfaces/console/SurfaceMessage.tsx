/** Lo que la SUPERFICIE dice cuando no hay nada que componer · F1.26
 *
 *  Distinto de los estados de panel: aquellos reemplazan un cuerpo dentro de un
 *  shell que sigue en pie. Esto es cuando falla el contexto o el catálogo y no
 *  hay pantalla que dibujar — no hay métrica que nombrar ni BASE que declarar.
 *
 *  Misma gramática de §8 igual: qué pasa, por qué, y qué se puede hacer.
 *
 *  ── LA SALIDA RECIBE EL FOCO · §PEN «Sec · Foco y estados de control» ────────
 *
 *  «UN ESTADO QUE REEMPLAZA LA PANTALLA RECIBE EL FOCO EN SU SALIDA», dice el
 *  dibujo. Es la única de las cinco reglas de foco que no estaba construida —el
 *  anillo, `:focus-visible` y su razón ya viven en `tokens/base.css`.
 *
 *  **Y es específica de este componente, no general.** Un estado de PANEL no
 *  debe robar el foco: doce paneles compitiendo por él dejarían al lector en
 *  cualquier lado. Éste reemplaza la pantalla entera —navbar incluido—, así que
 *  el foco no tiene dónde más estar: lo que había se desmontó.
 */
import { useEffect, useRef } from 'react'
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
  const salida = useRef<HTMLButtonElement>(null)

  // **Al montar, no en cada render.** Con `[]` el foco se pone una vez: si se
  // repusiera, cualquier cambio de estado se lo arrancaría a quien ya hubiera
  // tabulado a otro lado.
  //
  // **Y no se fuerza si no hay salida.** Un mensaje sin acción no tiene a qué
  // dar el foco, y mandarlo al `<main>` sería anunciar un contenedor.
  useEffect(() => {
    salida.current?.focus()
  }, [])

  return (
    <main className="min-h-screen bg-bg p-6 flex items-center justify-center">
      <div className="flex flex-col gap-3 max-w-md">
        <h1 className="font-display text-titulo-lg tracking-titulo text-ink m-0">{title}</h1>
        <Label>{detail}</Label>
        {onRetry !== undefined && (
          <button
            ref={salida}
            type="button"
            onClick={onRetry}
            className="self-start font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
          >
            Reintentar
          </button>
        )}
        {accion !== undefined && (
          <button
            {...(onRetry === undefined ? { ref: salida } : {})}
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
