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

/** Lo que consume el panel. La altura sale de `rowSpan`, nunca del contenido: un
 *  panel que crece con sus datos rompe la fila.
 *
 *  El `colSpan` se recorta acá y no en CSS. **El colapso no lo puede hacer solo
 *  el CSS**: cambiar `grid-template-columns` a menos columnas no achica nada
 *  —un panel con `grid-column: 1 / span 12` crea columnas implícitas y la grilla
 *  se ENSANCHA en vez de recomponerse. Verificado en v2: a «seis columnas» un
 *  panel de colSpan 12 seguía midiendo 1.852px. */
export function panelStyle(c: Placement, columns: number = COLUMNS): React.CSSProperties {
  const colSpan = Math.min(c.colSpan, columns)
  const full = columns === COLUMNS

  return {
    // Con la grilla recortada se suelta el `colStart`: con la posición fija los
    // paneles se pisarían entre sí. El orden lo preserva el orden del DOM.
    gridColumn: full ? `${c.colStart} / span ${colSpan}` : `span ${colSpan}`,
    gridRow: `span ${c.rowSpan}`,
    minHeight: 0,
    minWidth: 0,
  }
}

/* ── PENDIENTE DE DECISIÓN ────────────────────────────────────────────────────
 *
 * §3.1 de `design.md` declara tres pisos de ancho —768 la consola colapsando el
 * grid, 1280 administración, 1600 el builder— y por debajo de 768 no se degrada:
 * no se soporta. En v2 está implementado y tiene ancla de spec y prueba.
 *
 * `nuevo-desarrollo.md` NO lo menciona: su §14.13 fija `repeat(12, 1fr)` sin
 * colapso. La función queda declarada para no perder la regla, pero no está
 * cableada a ninguna superficie hasta que se decida si se incorpora.
 */
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
