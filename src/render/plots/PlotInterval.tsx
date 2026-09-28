/** Barra de rango · forma `escalarConIntervalo` · §PEN:Plot/INTERVALO
 *
 *  **Es la mitad que faltaba de la regla dura 6.** `ForecastBody` ya mostraba el
 *  intervalo con `escalarConIntervalo`, pero **en texto**: «Intervalo 95% ·
 *  351 – 417». Cumplía la regla y no la dibujaba, así que dos estimaciones con
 *  la misma cifra y distinta incertidumbre se veían iguales hasta leer el
 *  renglón de abajo.
 *
 *  ── LO QUE DICE EL DIBUJO ───────────────────────────────────────────────────
 *
 *  Leído del `.pen` con sus coordenadas antes de escribir esto: un riel de
 *  `$w2` de 348 × 10, y encima el rango relleno con la familia **al 0.4 de
 *  opacidad**, posicionado dentro de un dominio que **no arranca en cero**.
 *
 *  **La cifra y el rango en texto NO son de este componente**: el dibujo los
 *  pone fuera del riel y los pinta `$ink` y `$dim`, que es lo que `Value` y
 *  `Label` ya hacen en el cuerpo. Un plot que escriba sus propios rótulos se
 *  saltea los primitivos y la regla del número desnudo deja de ser verificable
 *  en un solo lugar.
 *
 *  **Y no lleva marca del valor puntual**: el dibujo no la tiene. La cifra vive
 *  en el texto, y agregarla acá sería decidir por diseño.
 */
import { useSize } from './core/useSize'
import { envelope, linearScale } from './core/scale'
import { familyVar } from '../../tokens/tokens'
import type { Family } from '../../catalog/types'

/** El alto del riel · 10px en el `.pen`. */
const TRACK = 10

export function PlotInterval({
  lo,
  hi,
  family,
}: {
  lo: number
  hi: number
  family: Family
}) {
  const { ref, w, h } = useSize()

  const [from, to] = envelope(lo, hi)
  const x = linearScale([from, to], [0, w])
  const y = Math.max(0, (h - TRACK) / 2)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && (
        <svg width={w} height={h} role="img" aria-label="Rango de la estimación">
          <rect x={0} y={y} width={w} height={TRACK} rx={2} fill="var(--color-w2)" />
          <rect
            x={x(lo)}
            // Igual que en `PlotComposition`: `Math.max(0, …)` porque un ancho
            // negativo hace desaparecer el rect entero sin avisar.
            width={Math.max(0, x(hi) - x(lo))}
            y={y}
            height={TRACK}
            rx={2}
            fill={familyVar(family)}
            fillOpacity={0.4}
          />
        </svg>
      )}
    </div>
  )
}
