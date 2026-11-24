/** Lo que comparten los gráficos de `matriz` · 2026-11-24
 *
 *  Aparte de los plots porque son funciones y no componentes, igual que
 *  `arcPath.ts`. Es la casa que las cabeceras de `PlotHeatmap`, `PlotCohort` y
 *  `PlotCalendar` le declaraban a `levels()`: hasta este día vivía exportada
 *  desde `PlotHeatmap`, el calendario la importaba de ahí —un plot atado a
 *  otro— y la cohorte tenía una **copia declarada**, idéntica salvo un
 *  comentario. Se movió cuando `oxlint` marcó que un archivo de componentes
 *  exportaba una función (`only-export-components`), y con eso las tres
 *  quedaron leyendo la misma.
 *
 *  **Lo demás que las cabeceras le asignan a este archivo** —`RAMPA`, `GAP`,
 *  `padFor()`, `rowReserve()`— sigue en cada plot: tienen números medidos en
 *  frames distintos, y unificarlos es una tarea con su propia medición.
 */
/** El nivel de cada celda, o `null` donde no hay dato · aritmética pura.
 *
 *  Vive afuera del componente por la misma razón que `squarify`: se prueba sin
 *  montar un SVG, y es donde puede estar el defecto que el dibujo no muestra —
 *  una rejilla se ve igual de prolija cuantizando bien y mal.
 *
 *  **El `Math.min(n - 1, …)` no es defensa decorativa.** Sin él el máximo da
 *  índice `n` , `RAMPA[n]` es `undefined` y la celda se pinta **sin color y sin
 *  error**, que es el modo de falla que `familyVar` ya documenta.
 *
 *  **Con `max === min` nadie es el más caliente y nadie el más frío**: todas las
 *  presentes van al nivel MEDIO, porque mandarlas a un extremo afirma un piso o
 *  un techo que el dato no tiene. Y sin esa rama la división por `max - min` da
 *  `NaN` y una celda sin opacidad.
 */
export function levels(
  celdas: readonly (readonly (number | null)[])[],
  n: number,
): (number | null)[][] {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  let presentes = 0
  for (const fila of celdas) {
    for (const v of fila) {
      // `null` es «nunca» —o, en la cohorte, «el futuro no observado»— y queda FUERA del rango: adentro, el hueco se pinta
      // como el peor valor de la escala y además corre todos los demás niveles.
      if (v === null || !Number.isFinite(v)) continue
      presentes += 1
      if (v < min) min = v
      if (v > max) max = v
    }
  }

  const medio = Math.floor((n - 1) / 2)
  return celdas.map((fila) =>
    fila.map((v) => {
      if (v === null || !Number.isFinite(v)) return null
      if (presentes === 0 || max === min) return medio
      return Math.min(n - 1, Math.floor(((v - min) / (max - min)) * n))
    }),
  )
}
