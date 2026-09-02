/** La grilla, en un solo lugar · F1.14.
 *
 *  §ANCLA:GRILLA-1 · §4 de design.md: «12 columnas. Gap 16px. Fila base 80px.»
 *  §ANCLA:GRILLA-2 · §4: «alto = rowSpan × 80 + (rowSpan − 1) × 16»
 *
 *  Doce columnas de 80px con gap de 16. La columna mide lo mismo que la fila
 *  base, así que `colSpan` y `rowSpan` comparten fórmula y un panel de 4×4 es
 *  cuadrado. De ahí que exista una sola función y no dos.
 *
 *  NINGUNA ALTURA DE PANEL SE ESCRIBE EN PÍXELES: toda pasa por acá. Es la
 *  única multiplicación del front y la razón de que este archivo exista.
 */

export const COLUMNS = 12
export const ROW = 80
export const GAP = 16
export const STEP = ROW + GAP // 96

/** px = 96·N − 16. N celdas más los gaps que quedan entre ellas.
 *  §ANCLA:GRILLA-2 */
export function span(n: number): number {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`span espera un entero >= 1, recibió ${n}`)
  }
  return STEP * n - GAP
}

/** Toda altura que salga de `span` cumple px ≡ 80 (mod 96). Sirve para que un
 *  chequeo pueda distinguir una altura de grilla de un número suelto. */
export function isGridMeasure(px: number): boolean {
  return Number.isInteger(px) && px >= ROW && px % STEP === ROW
}

/** El ancho del canvas: 12 columnas con sus gaps = 1136. */
export const CANVAS_WIDTH = span(COLUMNS)

export type Placement = {
  colStart: number
  colSpan: number
  rowSpan: number
}

/** Valida contra el borde del canvas. El rango por tipo de panel lo verifica el
 *  backend contra la tabla de bloques — acá solo el borde, que es geometría y
 *  no contrato. */
export function fitsInGrid({ colStart, colSpan }: Placement): boolean {
  return colStart >= 1 && colSpan >= 1 && colStart + colSpan - 1 <= COLUMNS
}

/** Lo que consume el contenedor de la grilla. `gridAutoRows` en `ROW` es lo que
 *  hace que la fórmula se cumpla de verdad: sin eso, `grid-row: span N` reparte
 *  altura automática y `96·N − 16` queda escrito pero no aplicado. */
export function gridStyle(columns: number = COLUMNS): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridAutoRows: `${ROW}px`,
    gap: `${GAP}px`,
  }
}

/** Cuánto ocupa un panel en una grilla recortada · §ANCLA:RESP-2
 *
 *  §4 de design.md: «por debajo de 1280px el grid colapsa a 6 columnas (**los
 *  spans se dividen a la mitad, redondeando hacia arriba**)».
 *
 *  **Dividir NO es lo mismo que recortar**, y hasta el 2026-09-02 esto recortaba
 *  con `Math.min`. Coinciden solo cuando el span excede las columnas: a seis
 *  columnas, un `colSpan` 4 debe quedar en 2 y con `Math.min` quedaba en 4, o
 *  sea ocupando dos tercios del ancho donde la spec pide un tercio. Un layout de
 *  tres paneles de 4 se veía como uno de tres paneles de 12.
 *
 *  La fórmula generaliza el enunciado: a la mitad de las columnas, la mitad del
 *  span. A una columna, todo ocupa 1, que es lo que §4 pide para el escalón de
 *  768. El redondeo hacia arriba es lo que evita que un `colSpan` 1 desaparezca.
 */
export function spanFor(colSpan: number, columns: number): number {
  return Math.min(columns, Math.max(1, Math.ceil((colSpan * columns) / COLUMNS)))
}

/** El orden de lectura con la grilla colapsada · §ANCLA:RESP-3
 *
 *  §4: «por debajo de 768px a 1 columna, **orden de lectura según `colStart` +
 *  `orden`**».
 *
 *  Con una sola columna el orden visual ES el orden del DOM, así que hay que
 *  ordenar de verdad: a doce columnas dos paneles de la misma fila se leen de
 *  izquierda a derecha, y apilados sin ordenar se leerían en el orden en que el
 *  backend los mandó, que no tiene por qué ser el mismo.
 *
 *  **PROPUESTA DE SPEC ABIERTA · `PanelConfigurado` no declara `orden`.** §4 lo
 *  nombra pero el contrato de este repositorio no lo tiene: `orden` existe en
 *  `Pestana`, no en el panel. Así que el desempate es la posición en el arreglo,
 *  que es el orden que el backend declaró. Funciona, y no es lo que la regla
 *  dice: mientras el campo no exista, dos paneles con el mismo `colStart`
 *  dependen de un orden que el contrato no promete estable.
 */
export function readingOrder<T extends { colStart: number }>(panels: readonly T[]): T[] {
  return panels
    .map((panel, index) => ({ panel, index }))
    .sort((a, b) => a.panel.colStart - b.panel.colStart || a.index - b.index)
    .map(({ panel }) => panel)
}

/** Lo que consume el panel. La altura sale de `rowSpan`, nunca del contenido: un
 *  panel que crece con sus datos rompe la fila.
 *
 *  El `colSpan` se resuelve acá y no en CSS. **El colapso no lo puede hacer solo
 *  el CSS**: cambiar `grid-template-columns` a menos columnas no achica nada
 *  —un panel con `grid-column: 1 / span 12` crea columnas implícitas y la grilla
 *  se ENSANCHA en vez de recomponerse. Verificado en v2: a «seis columnas» un
 *  panel de colSpan 12 seguía midiendo 1.852px.
 */
export function panelStyle(c: Placement, columns: number = COLUMNS): React.CSSProperties {
  const full = columns === COLUMNS
  const colSpan = full ? c.colSpan : spanFor(c.colSpan, columns)

  return {
    // Con la grilla recortada se suelta el `colStart`: con la posición fija los
    // paneles se pisarían entre sí. El orden lo preserva el orden del DOM, que
    // es lo que `readingOrder` ordena.
    gridColumn: full ? `${c.colStart} / span ${colSpan}` : `span ${colSpan}`,
    gridRow: `span ${c.rowSpan}`,
    minHeight: 0,
    minWidth: 0,
  }
}

/* ── El colapso, cableado · F1.30 ────────────────────────────────────────────
 *
 * D1 lo resolvió a favor: §3.1 es normativa vigente. `nuevo-desarrollo.md` §14.13
 * fija `repeat(12, 1fr)` sin colapso y no lo menciona; gana design.md, que es
 * más específico para esta regla.
 *
 * **El mínimo de la consola son 360px, no 768** — PS-12, 2026-08-21. Antes decía
 * 768 y §3.1 describía con precisión el escalón de una columna POR DEBAJO de ese
 * mínimo: la spec definía un ancho que ella misma declaraba fuera de soporte. Lo
 * que sobraba era el mínimo, no el escalón. Por debajo de 360 no se degrada: no
 * se soporta, y se declara.
 */
export const MIN_WIDTH = 360

/** §ANCLA:RESP-1 · §4: «por debajo de 1280px el grid colapsa a 6 columnas». */
export const COLUMNS_BY_WIDTH = [
  { upTo: 767, columns: 1 },
  { upTo: 1279, columns: 6 },
] as const

export function columnsFor(viewportWidth: number): number {
  for (const floor of COLUMNS_BY_WIDTH) {
    if (viewportWidth <= floor.upTo) return floor.columns
  }
  return COLUMNS
}
