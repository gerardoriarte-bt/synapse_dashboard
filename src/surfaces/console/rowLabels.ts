/** Si una tabla del agente dice de qué es cada fila · 2026-11-24
 *
 *  Aparte de `ChatFigure` porque es una función y no un componente: en el
 *  archivo de la figura rompía el fast refresh de Vite, y `oxlint` lo marcaba
 *  (`only-export-components`).
 */
import type { Value } from '../../api/types'

/** ¿Cada fila dice de qué es? Hay una columna no numérica con texto en TODAS
 *  las filas. Una columna de texto vacía no cuenta: medido el 2026-10-09,
 *  `platform_revenue` llegó como texto con `""` en ocho de nueve filas, y eso
 *  no es un rótulo — es una cifra que se perdió. */
export function hasRowLabels(valor: Extract<Value, { forma: 'tabular' }>): boolean {
  return valor.columnas.some(
    (c) =>
      !c.numerica &&
      valor.filas.length > 0 &&
      valor.filas.every((f) => {
        const celda = f[c.clave]
        return typeof celda === 'string' && celda.trim() !== ''
      }),
  )
}
