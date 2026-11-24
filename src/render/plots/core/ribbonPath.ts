/** La cinta de un diagrama de flujo · 2026-11-24
 *
 *  Aparte de `PlotSankey` porque es una función y no un componente, igual que
 *  `arcPath.ts`.
 */
/** El `d` de una cinta de grosor constante.
 *
 *  Cúbica con los dos puntos de control en el punto medio horizontal, leído del
 *  path del frame: `M142 53.9 c144 0 144 53.1 288 53.1 …`, donde
 *  `dx1 = dx2 = 144 = 288/2` y las tangentes salen horizontales de los dos
 *  extremos. El grosor es idéntico en las dos puntas —23,1 y 23,1— porque el
 *  borde de abajo es el de arriba corrido.
 *
 *  **Su casa es este archivo, con su marca en `core/Ribbon.tsx`** —el mismo
 *  corte que `arcPath.ts` + `Arc.tsx`, geometría probable sin montar un SVG y
 *  componente aparte para no romper el fast refresh de Vite—. Vivió en
 *  `PlotSankey` hasta el 2026-11-24, cuando `oxlint` marcó justo eso
 *  (`only-export-components`); la marca sigue en el plot. `funnel` —que también
 *  cuelga de `flujo`— y la variante
 *  `flujo` de `network` piden la misma curva, y `core/Arc.tsx` ya avisa en su
 *  cabecera que «treemap, funnel, sankey y network» no se componen con el arco. */
export function ribbonPath({
  x0,
  x1,
  aTop,
  bTop,
  thickness,
}: {
  x0: number
  x1: number
  aTop: number
  bTop: number
  thickness: number
}): string {
  const xm = (x0 + x1) / 2
  const aBot = aTop + thickness
  const bBot = bTop + thickness
  return [
    `M${x0} ${aTop}`,
    `C${xm} ${aTop} ${xm} ${bTop} ${x1} ${bTop}`,
    `L${x1} ${bBot}`,
    `C${xm} ${bBot} ${xm} ${aBot} ${x0} ${aBot}`,
    'Z',
  ].join(' ')
}
