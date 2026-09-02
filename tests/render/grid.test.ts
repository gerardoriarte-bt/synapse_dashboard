/** La grilla · F1.14.
 *
 *  Las aserciones se escriben DESDE LA REGLA CITADA, no leyendo `grid.ts`. Una
 *  prueba derivada de la implementación no puede fallar nunca, ni cuando el
 *  código está mal — es exactamente lo que pasó el 2026-08-20 con 184 pruebas en
 *  verde sobre una implementación que violaba §3.1 de tres formas.
 *
 *  Regla citada de `CLAUDE.md`, y de §14.13 de `nuevo-desarrollo.md`:
 *  «Toda altura de panel es un `rowSpan`: px = 96·N − 16».
 */
import { describe, expect, it } from 'vitest'
import {
  CANVAS_WIDTH,
  COLUMNS,
  columnsFor,
  fitsInGrid,
  GAP,
  gridStyle,
  isGridMeasure,
  panelStyle,
  ROW,
  span,
} from '@/render/grid'

describe('§ANCLA:GRILLA-1 · «12 columnas. Gap 16px. Fila base 80px.»', () => {
  it('declara los tres números de la cita', () => {
    // Los tres salen de §4 de design.md, no de leer grid.ts.
    expect(COLUMNS).toBe(12)
    expect(GAP).toBe(16)
    expect(ROW).toBe(80)
  })
})

describe('§ANCLA:GRILLA-2 · «alto = rowSpan × 80 + (rowSpan − 1) × 16»', () => {
  it('span(n) es exactamente lo que dice la fórmula de la cita', () => {
    // La aserción se escribe DESDE la cita: se transcribe la fórmula tal como
    // design.md la enuncia, y se compara contra lo que el código devuelve. Si
    // se escribiera llamando a span() a ambos lados, no podría fallar nunca.
    for (let rowSpan = 1; rowSpan <= 12; rowSpan++) {
      const segunLaSpec = rowSpan * 80 + (rowSpan - 1) * 16
      expect(span(rowSpan)).toBe(segunLaSpec)
    }
  })
})

describe('§ANCLA:RESP-1 · «por debajo de 1280px el grid colapsa a 6 columnas»', () => {
  it('colapsa a 6 justo por debajo de 1280 y no a 1280', () => {
    expect(columnsFor(1279)).toBe(6)
    expect(columnsFor(1280)).toBe(COLUMNS)
  })
})

describe('span · px = 96·N − 16', () => {
  it('cumple la fórmula para N de 1 a 12', () => {
    // Los esperados salen de la regla, calculados a mano, no de llamar a span().
    const expected = [80, 176, 272, 368, 464, 560, 656, 752, 848, 944, 1040, 1136]

    for (const [i, px] of expected.entries()) {
      expect(span(i + 1)).toBe(px)
    }
  })

  it('rechaza lo que no es un entero >= 1', () => {
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => span(bad)).toThrow(RangeError)
    }
  })
})

describe('el canvas', () => {
  it('mide 12 columnas con sus gaps = 1136', () => {
    expect(CANVAS_WIDTH).toBe(1136)
  })
})

describe('isGridMeasure · distingue una altura de grilla de un número suelto', () => {
  it('acepta lo que sale de span y rechaza lo vecino', () => {
    expect(isGridMeasure(span(3))).toBe(true)
    expect(isGridMeasure(span(3) + 1)).toBe(false)
    expect(isGridMeasure(96)).toBe(false)
  })
})

describe('gridStyle · sin gridAutoRows la fórmula queda escrita y no aplicada', () => {
  it('fija la fila base en 80px', () => {
    // La trampa está documentada en CLAUDE.md: con altura automática,
    // `grid-row: span N` reparte lo que sobra y 96·N − 16 no se cumple.
    expect(gridStyle().gridAutoRows).toBe('80px')
    expect(gridStyle().gap).toBe('16px')
  })

  it('declara tantas columnas como se le piden', () => {
    expect(gridStyle(6).gridTemplateColumns).toBe('repeat(6, minmax(0, 1fr))')
  })
})

describe('panelStyle · el colapso se hace en JS, no en CSS', () => {
  it('recorta el colSpan al ancho de la grilla', () => {
    // Medido en v2: a «seis columnas», un panel de colSpan 12 con
    // `grid-column: 1 / span 12` crea columnas implícitas y la grilla se
    // ENSANCHA a 1.852px en vez de recomponerse.
    expect(panelStyle({ colStart: 1, colSpan: 12, rowSpan: 2 }, 6).gridColumn).toBe('span 6')
  })

  it('suelta el colStart con la grilla recortada, para que no se pisen', () => {
    const collapsed = panelStyle({ colStart: 7, colSpan: 6, rowSpan: 2 }, 6)
    expect(collapsed.gridColumn).not.toContain('7 /')
  })

  it('conserva la posición con las doce columnas', () => {
    expect(panelStyle({ colStart: 7, colSpan: 6, rowSpan: 2 }).gridColumn).toBe('7 / span 6')
  })

  it('la altura sale del rowSpan y nunca del contenido', () => {
    expect(panelStyle({ colStart: 1, colSpan: 4, rowSpan: 3 }).gridRow).toBe('span 3')
  })
})

describe('fitsInGrid · el borde del canvas', () => {
  it('acepta lo que termina en la columna 12 y rechaza lo que se pasa', () => {
    expect(fitsInGrid({ colStart: 7, colSpan: 6, rowSpan: 1 })).toBe(true)
    expect(fitsInGrid({ colStart: 8, colSpan: 6, rowSpan: 1 })).toBe(false)
    expect(fitsInGrid({ colStart: 0, colSpan: 1, rowSpan: 1 })).toBe(false)
  })
})
