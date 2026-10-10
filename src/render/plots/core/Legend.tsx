/** La leyenda de un gráfico · §PEN «Componentes de gráfico» · 2026-10-06
 *
 *  **El `.pen` la dibuja y no se había portado.** «Legend Item» es un trazo de
 *  18×3 en el color de la serie, el NOMBRE en mono 10 gris y el VALOR en mono 11
 *  tinta —«VENTAS · USD 152K»—, y «Legend Slot» la pone entre la cabecera y el
 *  plot. Sin ella, tres líneas de una misma familia eran tres líneas sin nombre:
 *  lo encontró el humano mirando QA, «no se entiende qué está mostrando».
 *
 *  **El valor es el del punto que se está leyendo**: el último por defecto, el
 *  del cursor cuando hay uno. Así la leyenda es también la lectura, que es lo
 *  que el dibujo sugiere al poner una cifra al lado de cada nombre.
 *
 *  Es HTML y no SVG porque envuelve: con cinco series en un panel angosto, el
 *  texto de SVG no salta de línea y se sale por la derecha.
 */
import { hue } from './seriesColor'
import { Label } from '../../primitives/Label'
import type { FamiliaDeDibujo } from '../../types'

export type LegendEntry = {
  nombre: string
  /** Ya formateado, con su unidad. Ausente cuando la serie no tiene punto ahí. */
  valor?: string | undefined
  step: 0 | 1 | 2 | 3
}

export function Legend({ entries, family }: { entries: readonly LegendEntry[]; family: FamiliaDeDibujo }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 m-0 p-0 list-none">
      {entries.map((e) => (
        <li key={e.nombre} className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className="block w-4.5 h-0.75 shrink-0"
            style={{ background: hue({ family, step: e.step }) }}
          />
          <Label>{e.nombre}</Label>
          {e.valor === undefined ? null : (
            <span className="font-mono text-cifra text-ink tabular-nums">{e.valor}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
