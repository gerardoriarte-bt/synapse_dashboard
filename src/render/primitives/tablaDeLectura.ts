/** La tabla que se LEE, no la que se mira de un vistazo · 2026-10-27
 *
 *  **Para la conversación del chat**, las dos que hay: la que el agente escribe
 *  en markdown (`Markdown.tsx`) y la que manda como dato (`TableBody` con
 *  `lectura="conversacion"`). Una sola anatomía, para que las dos se lean igual.
 *
 *  **Por qué no es la del panel.** La del panel —rótulo, línea `w2` bajo el
 *  encabezado, `w1` entre filas, nada entre columnas— es la del `.pen` y sirve
 *  para cinco o seis filas que se miran juntas. En el chat el agente manda
 *  tablas de diez columnas y veinte filas que hay que recorrer, y con esa
 *  anatomía el humano lo dijo así: «se ve muy igual». Se perdía en qué fila y
 *  en qué columna estaba cada cifra, y el encabezado no se distinguía de los
 *  datos.
 *
 *  **Lo que cambia, todo con tokens:** el encabezado sobre `elev` y separado
 *  por `w4`, las filas alternadas con el lavado `w1`, una línea `w2` entre
 *  columnas, aire horizontal en cada celda y la primera columna —la que dice
 *  de qué es la fila— en `font-medium`. Sin color de datos y sin el naranja:
 *  `design.md` no lo deja en una celda.
 *
 *  Es divergencia con el `.pen`, que no dibuja tablas en C3 · §17 de
 *  `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md`.
 */
export const TABLA_DE_LECTURA = {
  /** El scroll horizontal es de la tabla, no de la hoja. */
  marco: 'overflow-x-auto rounded-md border border-w3',
  tabla: 'w-full border-collapse',
  encabezado: 'bg-elev',
  /** Toda celda de encabezado. */
  th: 'px-3 py-2 text-left align-bottom border-b border-w4 whitespace-nowrap',
  fila: 'border-b border-w2 last:border-b-0 even:bg-w1',
  /** Toda celda de dato. */
  td: 'px-3 py-1.5 align-top',
  /** Se suma a cada celda que no es la primera de su fila. */
  entreColumnas: 'border-l border-w2',
  /** La primera columna, la que dice de qué es la fila. */
  rotuloDeFila: 'font-medium',
} as const
