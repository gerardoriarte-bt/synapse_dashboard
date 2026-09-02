/** Apilar · la suma prefija, en un solo lugar · F1.13f
 *
 *  Un arco de dona y una barra apilada al 100% hacen exactamente lo mismo: cada
 *  tramo arranca donde termina la suma de los anteriores. Estaba escrito dos
 *  veces —una en `<Arc>`, otra en `<PlotComposition>`— y las dos con un
 *  acumulador que se reasignaba durante el render, que es lo que el lint marca
 *  con razón: el orden en que React evalúe un `map` no es algo sobre lo que
 *  convenga apoyarse.
 *
 *  Acá afuera es aritmética pura, se prueba sin montar un SVG, y las dos formas
 *  de apilar no pueden separarse.
 */

export type Span = { start: number; end: number }

/**  @param values   cuánto ocupa cada tramo, en las unidades que use el llamador
 *  @param from     dónde arranca el primero
 *  @param scale    factor sobre cada valor · 1 para porcentajes, `totalSweep`
 *                  para un arco que no da la vuelta entera */
export function stack(values: readonly number[], from = 0, scale = 1): Span[] {
  const out: Span[] = []
  let cursor = from
  for (const value of values) {
    const start = cursor
    cursor += value * scale
    out.push({ start, end: cursor })
  }
  return out
}
