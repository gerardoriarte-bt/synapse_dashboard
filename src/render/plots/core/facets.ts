/** El teselado de los múltiplos pequeños · 2026-11-24
 *
 *  Aparte de `PlotSmallMult` porque es aritmética y no un componente, igual que
 *  `arcPath.ts`. Las dos medidas del frame viajan con el teselado porque son su
 *  entrada, y el plot no las usa para nada más.
 */
/** Separación entre divisiones · 202 − 186 en el frame, y la misma en vertical
 *  cuando hay más de una fila. */
const GAP = 16

/** El ancho mínimo de una división antes de envolver a otra fila.
 *  **No es un número elegido mirando la pantalla**: es el ancho en el que
 *  `charsThatFit` deja 16 caracteres de rótulo, que es donde un nombre de
 *  división todavía se lee. */
const MIN_FACET = 120

export type FacetRect = { x: number; y: number; w: number; h: number }

/** El teselado de las divisiones.
 *
 *  `cycle`, `cohort`, `calendar` y `matrix` van a pedir exactamente esto, y su
 *  casa declarada era este archivo. Vivió en `PlotSmallMult` hasta el
 *  2026-11-24, cuando `oxlint` marcó que el plot exportaba una función
 *  (`only-export-components`). Va suelta, igual que `squarify`, porque es
 *  aritmética pura y se prueba sin montar un SVG: un teselado mal repartido se
 *  ve prolijo.
 */
export function facetRects(n: number, w: number, h: number): FacetRect[] {
  if (n <= 0 || w <= 0 || h <= 0) return []
  const columns = Math.max(1, Math.min(n, Math.floor((w + GAP) / (MIN_FACET + GAP))))
  const rows = Math.ceil(n / columns)
  const fw = (w - (columns - 1) * GAP) / columns
  const fh = (h - (rows - 1) * GAP) / rows
  return Array.from({ length: n }, (_, i) => ({
    x: (i % columns) * (fw + GAP),
    y: Math.floor(i / columns) * (fh + GAP),
    w: fw,
    h: fh,
  }))
}
