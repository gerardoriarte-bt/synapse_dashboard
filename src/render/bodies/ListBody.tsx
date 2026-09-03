/** `list` · forma `ranking` · colSpan 3–5, rowSpan 4–5 · F1.13g
 *
 *  No usa plot: un ranking corto se lee mejor como filas con su cifra que como
 *  barras. La barra proporcional va DETRÁS del texto, no en lugar de él — es
 *  contexto de magnitud, no el dato.
 */
import { Label } from '../primitives/Label'
import { Value } from '../primitives/Value'
import { hue } from '../plots/core/seriesColor'
import type { BodyProps } from '../types'

export type ListParams = {
  tope?: number
  /** Por defecto respeta `posicion`. Reordenar por valor es second-guessear al
   *  backend, y en varias métricas lo invierte. */
  orden?: 'posicion' | 'desc' | 'asc'
}

const DEFAULT_TOP = 5
const PERCENT = 100

export function ListBody({ value, params, family, metric, format }: BodyProps<'ranking', ListParams>) {
  const { tope = DEFAULT_TOP, orden = 'posicion' } = params

  // ORDENA POR `posicion`, NO POR VALOR. Un `ranking` ya viene rankeado: la
  // posición ES el dato. Reordenar por `v` lo invierte en cuanto la métrica es
  // «más bajo = más urgente» —la reposición prioritaria se mide en días de
  // cobertura— y la lista mostraba el menos urgente primero con el número 4 al
  // lado. Se vio en el render, no en una prueba.
  const items = [...value.items]
    .sort((a, b) =>
      orden === 'posicion' ? a.posicion - b.posicion : orden === 'desc' ? b.v - a.v : a.v - b.v,
    )
    .slice(0, tope)

  const max = Math.max(1, ...items.map((i) => Math.abs(i.v)))

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <ol className="flex flex-col gap-1 m-0 p-0 list-none">
        {items.map((item, i) => (
          <li key={item.etiqueta} className="relative flex items-center gap-2 py-1 px-2 min-w-0">
            <span
              className="absolute inset-y-0 left-0 rounded-xs opacity-20"
              style={{
                width: `${(Math.abs(item.v) / max) * PERCENT}%`,
                background: hue({ family, step: 3 }),
              }}
              aria-hidden
            />
            <span className="relative w-4 shrink-0">
              <Label>{String(item.posicion || i + 1)}</Label>
            </span>
            <span className="relative flex-1 min-w-0 truncate font-body text-cuerpo text-ink">
              {item.etiqueta}
            </span>
            <span className="relative shrink-0">
              {/* El label del lector es el nombre de la MÉTRICA y no la etiqueta
                  de la fila: la etiqueta ya se lee dos elementos antes, así que
                  repetirla decía «Nike Air, Nike Air» y nunca el número. Con
                  esto dice «Nike Air, Unidades 4.2K». */}
              <Value label={metric} size="cell" labelVisibility="screenReader">
                {format.number(item.v, { abbreviate: true })}
              </Value>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
