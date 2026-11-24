/** El reparto de una caja por área · `squarify` · 2026-11-24
 *
 *  Aparte de `PlotTreemap` porque son funciones y no componentes, igual que
 *  `arcPath.ts`, y en la casa que su comentario ya le declaraba. Se movió
 *  cuando `oxlint` marcó que el archivo del plot exportaba una función
 *  (`only-export-components`).
 */
export type Box = { w: number; h: number }

/** Un rectángulo del reparto. `group` es la fila —lo que el frame dibuja como
 *  columna— y viaja con el rectángulo porque el color y la opacidad se leen de
 *  ahí: sin él habría que reconstruir la agrupación mirando las coordenadas,
 *  que es adivinar lo que el algoritmo ya sabe. */
export type Tile = { x: number; y: number; w: number; h: number; group: number }

/** La peor relación de aspecto de una fila candidata · el criterio de corte del
 *  algoritmo de Bruls, Huizing y van Wijk. */
function worstRatio(
  areas: readonly number[],
  from: number,
  to: number,
  sum: number,
  side: number,
): number {
  if (sum <= 0 || side <= 0) return Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  let min = Number.POSITIVE_INFINITY
  for (let k = from; k < to; k++) {
    const a = areas[k] ?? 0
    if (a > max) max = a
    if (a < min) min = a
  }
  if (min <= 0) return Number.POSITIVE_INFINITY
  const s2 = sum * sum
  const d2 = side * side
  return Math.max((d2 * max) / s2, s2 / (d2 * min))
}

/** Repartir una caja en sub-rectángulos por área.
 *
 *  **Es primitiva y no un componente a medida**: `marimekko`, `heatmap` y la
 *  dona de `composicion` reparten exactamente esto. Su casa es este archivo,
 *  junto a `scale.ts` y `stack.ts`.
 *
 *  Devuelve **un rectángulo por valor y en el orden de entrada** —el orden ya lo
 *  fijó el cuerpo con `orden` y `tope`— y reparte por el lado MÁS CORTO de la
 *  caja restante, que con una caja apaisada produce las columnas del frame.
 *
 *  **Los valores ≤ 0 se llevan área cero** y no se descartan: descartarlos acá
 *  desalinearía la salida del arreglo de entrada, que es lo que hace afirmable
 *  «el rectángulo `i` es del ítem `i`». Filtrarlos es decisión del llamador.
 *
 *  `gap` se le resta a CADA rectángulo con un piso en cero: un lado negativo
 *  hace desaparecer el `rect` del SVG sin ningún error, que es el defecto que
 *  `PlotComposition` ya documenta. */
export function squarify(values: readonly number[], box: Box, gap = 0): Tile[] {
  const n = values.length
  if (n === 0) return []

  const clamped = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0))
  const total = clamped.reduce((a, b) => a + b, 0)
  const vacio: Tile[] = clamped.map(() => ({ x: 0, y: 0, w: 0, h: 0, group: 0 }))
  if (total <= 0 || box.w <= 0 || box.h <= 0) return vacio

  // A píxeles: la suma de las áreas es exactamente el área de la caja, y de ahí
  // sale la proporcionalidad sin ninguna corrección posterior.
  const areas = clamped.map((v) => (v / total) * box.w * box.h)
  const out: Tile[] = vacio

  let x = 0
  let y = 0
  let w = box.w
  let h = box.h
  let i = 0
  let group = 0

  while (i < n) {
    const side = Math.min(w, h)

    // La fila crece mientras la relación de aspecto MEJORE; el primer candidato
    // que la empeora la cierra.
    let end = i + 1
    let sum = areas[i] ?? 0
    let best = worstRatio(areas, i, end, sum, side)
    while (end < n) {
      const next = sum + (areas[end] ?? 0)
      const candidate = worstRatio(areas, i, end + 1, next, side)
      if (candidate > best) break
      best = candidate
      sum = next
      end += 1
    }

    const thickness = side > 0 ? sum / side : 0
    if (w >= h) {
      // Caja apaisada: la fila es una COLUMNA de ancho `thickness`, con sus
      // hojas apiladas en `y`. Es lo que el frame dibuja.
      let cursor = y
      for (let k = i; k < end; k++) {
        const tall = sum > 0 ? ((areas[k] ?? 0) / sum) * h : 0
        out[k] = { x, y: cursor, w: thickness, h: tall, group }
        cursor += tall
      }
      x += thickness
      w -= thickness
    } else {
      let cursor = x
      for (let k = i; k < end; k++) {
        const wide = sum > 0 ? ((areas[k] ?? 0) / sum) * w : 0
        out[k] = { x: cursor, y, w: wide, h: thickness, group }
        cursor += wide
      }
      y += thickness
      h -= thickness
    }

    i = end
    group += 1
  }

  return out.map((t) => ({
    ...t,
    w: Math.max(0, t.w - gap),
    h: Math.max(0, t.h - gap),
  }))
}
