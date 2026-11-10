/** El período en curso, dibujado igual en todo gráfico de tiempo · EV-015, 2026-11-10
 *
 *  La evaluación de UX: «octubre 2026 se dibuja como un punto más de la serie y
 *  aparece como una caída pronunciada». El servicio marca el punto —`partial`,
 *  que el adaptador pasa a `parcial`—; esto es lo que hace un gráfico con esa
 *  marca. **Un solo lugar** para que el recurso sea el mismo en todos: la
 *  evaluación pide «un recurso visual consistente».
 *
 *  **Lo cerrado se dibuja como siempre; lo en curso, punteado, sin área y con
 *  el punto hueco.** El tramo en curso arranca en el último punto cerrado para
 *  que el trazo no se corte. La palabra «en curso» la pone cada gráfico donde
 *  escribe su fecha o su cifra: el punteado solo se confundiría con la
 *  proyección del pronóstico.
 */
import type { PointXY } from './Series'

/** Parte una serie en lo cerrado y lo en curso, desde el primer punto marcado.
 *  Sin ninguno marcado, todo es cerrado. */
export function partirEnCurso(
  puntos: readonly PointXY[],
  parciales: readonly (boolean | undefined)[],
): { cerrados: PointXY[]; abiertos: PointXY[]; enCurso: PointXY[] } {
  const desde = parciales.findIndex((p) => p === true)
  if (desde < 0) return { cerrados: [...puntos], abiertos: [], enCurso: [] }
  return {
    cerrados: puntos.slice(0, desde),
    abiertos: puntos.slice(Math.max(0, desde - 1)),
    enCurso: puntos.filter((_, i) => parciales[i] === true),
  }
}
