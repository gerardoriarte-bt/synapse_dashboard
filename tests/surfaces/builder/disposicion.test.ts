/** La colocación de la grilla · F4.9
 *
 *  **Lo que se prueba acá no es «nuestro» algoritmo: es el de CSS.** Con
 *  `grid-auto-flow: row` los ítems se colocan en el orden del documento, cada
 *  uno en la primera fila donde su rango de columnas esté libre **desde un
 *  cursor que nunca retrocede**. Si esta simulación difiere del navegador, el
 *  canvas señala un panel y el usuario ve otro.
 */
import { describe, expect, it } from 'vitest'
import {
  cambioDeTamano,
  celdaAgarrada,
  choqueCon,
  disposicion,
  enCelda,
  huecos,
  leerAgarre,
} from '@/surfaces/builder/disposicion'

const p = (colStart: number, colSpan: number, rowSpan = 4) => ({ colStart, colSpan, rowSpan })

describe('la fila se DERIVA · no se guarda', () => {
  it('dos paneles que entran en la misma fila comparten fila', () => {
    const d = disposicion([p(1, 6), p(7, 6)])
    expect(d.map((c) => c.filaInicio)).toEqual([1, 1])
  })

  it('el tercero que no entra baja', () => {
    const d = disposicion([p(1, 6), p(7, 6), p(1, 6)])
    expect(d.map((c) => c.filaInicio)).toEqual([1, 1, 5])
  })

  it('el alto cuenta · un panel alto empuja al siguiente más abajo', () => {
    // El primero ocupa las filas 1–8 en las columnas 1–6.
    const d = disposicion([p(1, 6, 8), p(1, 6, 4)])
    expect(d.map((c) => c.filaInicio)).toEqual([1, 9])
  })
})

describe('el cursor NO retrocede · es `row` y no `row dense`', () => {
  it('un hueco que quedó atrás NO se rellena con un panel posterior', () => {
    // Fila 1: un panel de 6 en 1–6 → quedan libres 7–12 en las filas 1–4.
    // El segundo es de 12 y no entra: baja a la fila 5 y ocupa hasta la 8.
    // El tercero es de 3 en 7–9, que **entraría** en el hueco de la fila 1 — y
    // no entra, porque el cursor ya pasó. Va a la 9.
    //
    // **La primera versión de esta prueba esperaba 5 y el código decía 9.** El
    // código tenía razón: el segundo panel ocupa cuatro filas, no una.
    const d = disposicion([p(1, 6), p(1, 12), p(7, 3)])
    expect(d[2]?.filaInicio).not.toBe(1)
    expect(d[2]?.filaInicio).toBe(9)
  })
})

describe('lo que viene mal del servidor se acomoda, no se descarta', () => {
  it('un colStart fuera de la grilla se recorta', () => {
    // Una pantalla en blanco no explica nada; el layout puede venir del servidor.
    expect(disposicion([p(15, 3)])[0]?.colStart).toBe(10)
  })

  it('un colSpan más ancho que la grilla se recorta a 12', () => {
    expect(disposicion([p(1, 20)])[0]?.colSpan).toBe(12)
  })

  it('un colStart que desborda con su span se corre hacia la izquierda', () => {
    expect(disposicion([p(11, 4)])[0]).toMatchObject({ colStart: 9, colSpan: 4 })
  })
})

describe('enCelda · quién está bajo el cursor', () => {
  const d = disposicion([p(1, 6), p(7, 6)])

  it('devuelve el índice del panel en esa celda', () => {
    expect(enCelda(d, 3, 2)).toBe(0)
    expect(enCelda(d, 9, 2)).toBe(1)
  })

  it('devuelve null en una celda libre', () => {
    expect(enCelda(d, 3, 9)).toBeNull()
  })

  it('el borde derecho de un panel NO lo incluye', () => {
    // Un panel en 1–6 ocupa las columnas 1 a 6; la 7 ya es del otro.
    expect(enCelda(d, 6, 1)).toBe(0)
    expect(enCelda(d, 7, 1)).toBe(1)
  })
})

describe('choqueCon · quién impide soltar acá', () => {
  const d = disposicion([p(1, 6), p(7, 6)])

  it('dice CON QUIÉN choca, no que hay choque', () => {
    // §7.2 en el `.pen`: «SE SOLAPA CON "DOCE MESES"». Nombrar el panel es la
    // diferencia entre «no podés» y «movete tres columnas».
    expect(choqueCon(d, { colStart: 5, colSpan: 4, filaInicio: 1, rowSpan: 4 }, 0)).toBe(1)
  })

  it('un panel NO choca consigo mismo', () => {
    // Sin ignorarlo no se podría mover ni una columna.
    expect(choqueCon(d, { colStart: 1, colSpan: 6, filaInicio: 1, rowSpan: 4 }, 0)).toBeNull()
  })

  it('pegado no es encima', () => {
    // 1–6 y 7–12 se tocan y no se cruzan.
    expect(choqueCon(d, { colStart: 7, colSpan: 6, filaInicio: 1, rowSpan: 4 }, 1)).toBeNull()
  })

  it('cruzarse en columnas pero no en filas no es choque', () => {
    expect(choqueCon(d, { colStart: 1, colSpan: 6, filaInicio: 5, rowSpan: 4 }, 0)).toBeNull()
  })
})

describe('los huecos son DERIVADOS · §7.2 «slot vacío»', () => {
  it('encuentra el espacio libre de una fila a medio llenar', () => {
    // **Un rectángulo, no cuatro tiras.** El `.pen` lo etiqueta «SLOT VACÍO ·
    // 3 × 4», con las dos medidas: un hueco por fila diría «6 × 1» cuatro veces.
    const d = disposicion([p(1, 6)])
    expect(huecos(d)).toEqual([{ colStart: 7, colSpan: 6, filaInicio: 1, rowSpan: 4 }])
  })

  it('una fila llena no tiene huecos', () => {
    expect(huecos(disposicion([p(1, 12)]))).toEqual([])
  })

  it('NO inventa huecos abajo de la última fila ocupada', () => {
    // El lienzo sigue vacío hacia abajo, y pintar filas de huecos hasta el
    // infinito no dice nada.
    const d = disposicion([p(1, 12, 2)])
    expect(huecos(d).every((h) => h.filaInicio <= 2)).toBe(true)
  })

  it('parte el hueco en tramos contiguos, no en celdas sueltas', () => {
    // Con un panel en 5–8, quedan dos tramos: 1–4 y 9–12.
    const d = disposicion([p(5, 4)])
    expect(huecos(d)).toEqual([
      { colStart: 1, colSpan: 4, filaInicio: 1, rowSpan: 4 },
      { colStart: 9, colSpan: 4, filaInicio: 1, rowSpan: 4 },
    ])
  })

  it('NO funde dos tramos de anchos distintos', () => {
    // Fila 1–4 libre en 7–12; filas 5–8 libres en 4–12. No son un rectángulo, y
    // fundirlos daría una medida que no es la del hueco.
    const d = disposicion([p(1, 6), p(1, 3)])
    const anchos = huecos(d).map((h) => `${String(h.colStart)}+${String(h.colSpan)}x${String(h.rowSpan)}`)
    expect(anchos).toEqual(['7+6x4', '4+9x4'])
  })
})

/** ── MOVER Y ESTIRAR · 2026-11-10 ─────────────────────────────────────────── */

describe('celdaAgarrada · de dónde se agarró el panel', () => {
  // Un panel de 6 × 4 con la columna de 80 y la separación de 16: 560 × 368.
  const rect = { left: 100, top: 50, width: 6 * 80 + 5 * 16, height: 4 * 80 + 3 * 16 }

  it('cuenta celdas desde la esquina, con el paso de columna más separación', () => {
    expect(celdaAgarrada(rect, { x: 100 + 3 * 96 + 10, y: 50 + 2 * 96 + 5 }, 6, 4)).toEqual({ dCol: 3, dFila: 2 })
  })

  it('la esquina es cero · y no se sale del panel', () => {
    expect(celdaAgarrada(rect, { x: 101, y: 51 }, 6, 4)).toEqual({ dCol: 0, dFila: 0 })
    expect(celdaAgarrada(rect, { x: 5000, y: 5000 }, 6, 4)).toEqual({ dCol: 5, dFila: 3 })
  })

  it('sin medida —jsdom, o sin pintar— agarra por la esquina', () => {
    expect(celdaAgarrada({ left: 0, top: 0, width: 0, height: 0 }, { x: 300, y: 300 }, 6, 4)).toEqual({ dCol: 0, dFila: 0 })
  })
})

describe('leerAgarre · lo que viajó en el arrastre', () => {
  it('lee el par de enteros', () => {
    expect(leerAgarre('{"dCol":2,"dFila":1}')).toEqual({ dCol: 2, dFila: 1 })
  })

  it('cualquier otra cosa es la esquina · nunca un salto inventado', () => {
    for (const crudo of ['', '0', 'no-json', '{"dCol":-1,"dFila":0}', '{"dCol":1.5,"dFila":0}', 'null'])
      expect(leerAgarre(crudo)).toEqual({ dCol: 0, dFila: 0 })
  })
})

describe('cambioDeTamano · un tamaño que no entra se bloquea, no empuja', () => {
  const nombres = ['Ingresos', 'Inversión', 'ROAS', 'Órdenes']
  const opciones = { tipo: 'Indicador', nombre: (i: number) => nombres[i] ?? '?' }

  it('en una fila llena, ensanchar nombra con quién se solapa · el caso medido en local', () => {
    // Cuatro indicadores de 3 llenan las doce columnas.
    const fila = [p(1, 3), p(4, 3), p(7, 3), p(10, 3)]
    expect(cambioDeTamano(fila, 1, { colStart: 4, colSpan: 4, rowSpan: 4 }, opciones)).toBe('Se solapa con «ROAS»')
  })

  it('el que se correría SIN solaparse también se nombra · achicar puede subir a otro', () => {
    // A ocupa 1–9 y C, en 7–9, espera abajo. Achicar A a 6 libera 7–9 en la
    // fila 1 y la colocación subiría a C: no se solapa con nadie, y se mueve.
    const panels = [p(1, 9), p(10, 3), p(7, 3)]
    expect(cambioDeTamano(panels, 0, { colStart: 1, colSpan: 6, rowSpan: 4 }, opciones)).toBe(
      'Correría a «ROAS» de su lugar',
    )
  })

  it('el rango del tipo, cuando se pide, se dice con sus dos números', () => {
    const rango = { colSpanMin: 3, colSpanMax: 4, rowSpanMin: 3, rowSpanMax: 4 }
    expect(cambioDeTamano([p(1, 4)], 0, { colStart: 1, colSpan: 5, rowSpan: 4 }, { ...opciones, rango })).toBe(
      '«Indicador» ocupa entre 3 y 4 columnas',
    )
    expect(cambioDeTamano([p(1, 4)], 0, { colStart: 1, colSpan: 4, rowSpan: 5 }, { ...opciones, rango })).toBe(
      '«Indicador» ocupa entre 3 y 4 filas',
    )
  })

  it('el borde de la grilla', () => {
    expect(cambioDeTamano([p(10, 3)], 0, { colStart: 10, colSpan: 4, rowSpan: 4 }, opciones)).toBe(
      'No entra · se pasa del borde de la grilla',
    )
  })

  it('con lugar, se puede · y el que está abajo de otra columna no cuenta', () => {
    expect(cambioDeTamano([p(1, 3), p(7, 3)], 0, { colStart: 1, colSpan: 6, rowSpan: 5 }, opciones)).toBeNull()
  })
})
