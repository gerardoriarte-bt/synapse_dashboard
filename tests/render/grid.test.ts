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
  MIN_WIDTH,
  panelStyle,
  readingOrder,
  ROW,
  span,
  spanFor,
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

describe('§ANCLA:RESP-2 · «los spans se dividen a la mitad, redondeando hacia arriba»', () => {
  it('a seis columnas, cada span es la mitad del original', () => {
    // La aserción se escribe DESDE la cita: se divide a mano y se redondea
    // hacia arriba, y se compara contra lo que devuelve el código. Escrita
    // llamando a `spanFor` de los dos lados no podría fallar nunca.
    for (const colSpan of [2, 4, 6, 8, 10, 12]) {
      expect(spanFor(colSpan, 6)).toBe(colSpan / 2)
    }
  })

  it('redondea HACIA ARRIBA los impares', () => {
    expect(spanFor(3, 6)).toBe(2) // 1.5 → 2
    expect(spanFor(5, 6)).toBe(3) // 2.5 → 3
    expect(spanFor(7, 6)).toBe(4) // 3.5 → 4
  })

  it('un colSpan 1 no desaparece · el redondeo hacia arriba es lo que lo salva', () => {
    expect(spanFor(1, 6)).toBe(1)
    expect(spanFor(1, 1)).toBe(1)
  })

  it('DIVIDIR no es RECORTAR · es la diferencia que el código tenía mal', () => {
    // Hasta el 2026-09-02 esto usaba `Math.min(colSpan, columns)`. Coinciden
    // solo cuando el span excede las columnas: un colSpan 4 a seis columnas
    // quedaba en 4 —dos tercios del ancho— donde la spec pide 2, un tercio.
    expect(spanFor(4, 6)).toBe(2)
    expect(spanFor(4, 6)).not.toBe(Math.min(4, 6))
  })

  it('a doce columnas no se toca nada', () => {
    for (const colSpan of [1, 3, 4, 7, 12]) {
      expect(spanFor(colSpan, COLUMNS)).toBe(colSpan)
    }
  })

  it('panelStyle aplica la división y suelta el colStart', () => {
    expect(panelStyle({ colStart: 5, colSpan: 4, rowSpan: 2 }, 6).gridColumn).toBe('span 2')
    // Con la posición fija los paneles se pisarían entre sí.
    expect(panelStyle({ colStart: 5, colSpan: 4, rowSpan: 2 }, 6).gridColumn).not.toContain('5 /')
  })
})

describe('§ANCLA:RESP-3 · «por debajo de 768px a 1 columna, orden de lectura según colStart»', () => {
  it('a 767 la grilla es de una columna y todo ocupa 1', () => {
    expect(columnsFor(767)).toBe(1)
    expect(spanFor(12, 1)).toBe(1)
    expect(spanFor(3, 1)).toBe(1)
  })

  it('ordena por colStart · apilados, el orden del DOM ES el orden visual', () => {
    // A doce columnas dos paneles de la misma fila se leen de izquierda a
    // derecha; apilados sin ordenar se leerían como los mandó el backend.
    const panels = [
      { id: 'derecha', colStart: 9 },
      { id: 'izquierda', colStart: 1 },
      { id: 'medio', colStart: 5 },
    ]
    expect(readingOrder(panels).map((p) => p.id)).toEqual(['izquierda', 'medio', 'derecha'])
  })

  it('con el mismo colStart conserva el orden del backend', () => {
    // `PanelConfigurado` no declara `orden` —§4 lo nombra y el contrato no lo
    // tiene—, así que el desempate es la posición en el arreglo.
    const panels = [
      { id: 'a', colStart: 1 },
      { id: 'b', colStart: 1 },
      { id: 'c', colStart: 1 },
    ]
    expect(readingOrder(panels).map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('no muta el arreglo que recibe', () => {
    const panels = [{ id: 'b', colStart: 9 }, { id: 'a', colStart: 1 }]
    const antes = [...panels]
    readingOrder(panels)
    expect(panels).toEqual(antes)
  })
})

describe('los tres escalones de §3.1', () => {
  it('12 · 6 · 1, en sus bordes', () => {
    expect(columnsFor(1280)).toBe(12)
    expect(columnsFor(1279)).toBe(6)
    expect(columnsFor(768)).toBe(6)
    expect(columnsFor(767)).toBe(1)
  })

  it('el mínimo de la consola son 360, no 768 · PS-12', () => {
    // design.md, 2026-08-21: «Antes decía 768, y §3.1 definía con precisión el
    // escalón de una columna POR DEBAJO de ese mínimo: la spec describía un
    // ancho que ella misma declaraba fuera de soporte. Lo que sobraba era el
    // mínimo, no el escalón.»
    expect(MIN_WIDTH).toBe(360)
    // Y a 360 la consola responde: una columna, no una pantalla en blanco.
    expect(columnsFor(MIN_WIDTH)).toBe(1)
  })
})

describe('a UNA columna el `rowSpan` es un PISO y no una medida · §4', () => {
  /** **La regla citada**, de §4 desde el 2026-08-21 y de la nota de
   *  `C1 · 360 · una columna` en el `.pen`:
   *
   *  > «EL RESUMEN EJECUTIVO CRECIÓ a 462. A 360 su prosa necesita catorce
   *  > líneas y en los 368 que manda su rowSpan entran nueve: **el texto se
   *  > salía del panel**. Desde el 2026-08-21 §4 declara que a UNA columna el
   *  > rowSpan es un piso y no una medida — **la razón del alto fijo es la
   *  > alineación horizontal, y acá no hay con qué alinearse**.»
   *
   *  **Estaba escrita y no aplicada.** Medido el 2026-09-25 abriendo la consola
   *  a 360px con el catálogo real: los doce paneles medían exactamente 368. Es
   *  el mismo par que la trampa de `gridAutoRows` que este archivo ya cubre —
   *  una fórmula escrita y no aplicada— por el otro extremo.
   *
   *  No se vio antes porque nadie había mirado la consola a un ancho de
   *  teléfono con datos que llenaran un panel.
   */
  it('a una columna la fila se suelta y el alto pasa a `minHeight`', () => {
    const e = panelStyle({ colStart: 1, colSpan: 12, rowSpan: 4 }, 1)

    // `auto` es lo que deja crecer: con `span 4` la fila vuelve a ser exacta.
    expect(e.gridRow).toBe('auto')
    // Y el piso sigue siendo la fórmula, no un número suelto.
    expect(e.minHeight).toBe(span(4))
    expect(isGridMeasure(e.minHeight as number)).toBe(true)

    // **Con DOS rowSpan distintos**, porque `span(4)` son 368 y un 368 quemado
    // pasaría la aserción de arriba sin calcular nada. Lo cazó una mutación.
    expect(panelStyle({ colStart: 1, colSpan: 12, rowSpan: 5 }, 1).minHeight).toBe(span(5))
    expect(panelStyle({ colStart: 1, colSpan: 12, rowSpan: 2 }, 1).minHeight).toBe(span(2))
  })

  it('con MÁS de una columna el alto sigue siendo una medida exacta', () => {
    // El ámbito: la alineación horizontal es la razón del alto fijo, así que
    // donde hay con qué alinearse no cambia nada. Sin esto, soltar la fila en
    // todos lados pasaría la prueba de arriba y rompería la grilla entera.
    for (const columnas of [6, COLUMNS]) {
      const e = panelStyle({ colStart: 1, colSpan: 4, rowSpan: 4 }, columnas)
      expect(e.gridRow).toBe('span 4')
      expect(e.minHeight).toBe(0)
    }
  })

  it('y el contenedor deja de fijar la fila · si no, el piso no sirve de nada', () => {
    // `gridAutoRows: 80px` vuelve exacta cualquier fila. Con el panel en `auto`
    // pero el contenedor en `80px`, el piso no crecería y esto se vería igual
    // de bien que el defecto.
    expect(gridStyle(1).gridAutoRows).toBe('auto')
    expect(gridStyle(6).gridAutoRows).toBe('80px')
  })
})
