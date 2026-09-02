/** La geometría del arco · F1.13a
 *
 *  Aparte de `Arc.tsx` porque son funciones y no componentes. La prueba del
 *  trazo apunta acá.
 */
const TAU = Math.PI * 2

/** Un punto de la circunferencia. **Ángulo en vueltas**: 0 arriba, 0.25 a la
 *  derecha. Vueltas y no radianes porque los datos vienen en proporciones, y
 *  convertir una sola vez es más difícil de equivocar que convertir en cada
 *  llamada. */
function onCircle(cx: number, cy: number, r: number, turn: number) {
  const a = turn * TAU - Math.PI / 2
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

/** El `d` de un arco anular entre dos vueltas. */
export function arcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  from: number,
  to: number,
): string {
  const sweep = Math.max(0, Math.min(1, to - from))

  // Un arco de vuelta completa no se puede trazar con un solo `A`: los dos
  // extremos coinciden y el path queda vacío. Se parte en dos mitades.
  if (sweep >= 0.999) {
    return [
      arcPath(cx, cy, outerR, innerR, from, from + 0.5),
      arcPath(cx, cy, outerR, innerR, from + 0.5, from + 1),
    ].join(' ')
  }

  const large = sweep > 0.5 ? 1 : 0
  const e0 = onCircle(cx, cy, outerR, from)
  const e1 = onCircle(cx, cy, outerR, to)
  const i1 = onCircle(cx, cy, innerR, to)
  const i0 = onCircle(cx, cy, innerR, from)

  return [
    `M${e0.x},${e0.y}`,
    `A${outerR},${outerR} 0 ${large} 1 ${e1.x},${e1.y}`,
    `L${i1.x},${i1.y}`,
    `A${innerR},${innerR} 0 ${large} 0 ${i0.x},${i0.y}`,
    'Z',
  ].join(' ')
}

export type PlacedSegment = { start: number; end: number }

/** Reparte los tramos sobre la vuelta: cada uno arranca donde termina la suma
 *  de los anteriores.
 *
 *  Vive acá y no dentro de `<Arc>` porque es aritmética, no render. Con el
 *  acumulador adentro del componente el lint marcaba —con razón— una
 *  reasignación durante el render, y sacarla además la hace verificable sin
 *  montar un SVG. */
export function placeSegments(
  fractions: readonly number[],
  from: number,
  totalSweep: number,
): PlacedSegment[] {
  const out: PlacedSegment[] = []
  let cursor = from
  for (const fraction of fractions) {
    const start = cursor
    cursor += fraction * totalSweep
    out.push({ start, end: cursor })
  }
  return out
}
