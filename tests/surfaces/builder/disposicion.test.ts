/** La colocación de la grilla · F4.9
 *
 *  **Lo que se prueba acá no es «nuestro» algoritmo: es el de CSS.** Con
 *  `grid-auto-flow: row` los ítems se colocan en el orden del documento, cada
 *  uno en la primera fila donde su rango de columnas esté libre **desde un
 *  cursor que nunca retrocede**. Si esta simulación difiere del navegador, el
 *  canvas señala un panel y el usuario ve otro.
 */
import { describe, expect, it } from 'vitest'
import { choqueCon, disposicion, enCelda, huecos } from '@/surfaces/builder/disposicion'

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
