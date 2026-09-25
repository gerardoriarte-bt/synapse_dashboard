/** El estado de una fuente se DERIVA · §PEN:A5 · F4.24
 *
 *  **La regla citada, del pie del dibujo:**
 *
 *  > «EL ESTADO NO SE ESCRIBE, SE DERIVA · SI FRESCURA > CADENCIA × TOLERANCIA,
 *  > DEGRADADO»
 *
 *  Y es la razón por la que B2.13 se pidió como ruta y no como un campo
 *  `estado`: guardarlo y derivarlo son dos fuentes para el mismo hecho, y se
 *  separan en el primer feed atrasado — el campo dice lo que era cierto cuando
 *  se escribió, la frescura dice lo que es cierto ahora.
 *
 *  Las aserciones salen de la regla, no de leer `saludDeFuente.ts`.
 */
import { describe, expect, it } from 'vitest'
import { limiteHoras, resumen, saludDe } from '@/surfaces/admin/saludDeFuente'

const fuente = (frescuraHoras: number | null, cadenciaHoras = 1, toleranciaFactor = 2) => ({
  cadenciaHoras,
  toleranciaFactor,
  frescuraHoras,
})

describe('el límite es cadencia × tolerancia, y es POR FUENTE', () => {
  it('lo calcula de los dos términos de la fuente', () => {
    expect(limiteHoras(fuente(null, 1, 2))).toBe(2)
    expect(limiteHoras(fuente(null, 24, 3))).toBe(72)
  })

  it('una horaria y una diaria con la MISMA frescura dan distinto', () => {
    // **Es el punto entero del pedido.** El ejemplo del dibujo: «el snapshot
    // tiene 31 h y la fuente se refresca cada hora», y esa está degradada. Una
    // fuente diaria con las mismas 31 h no lo está. Con un plazo global —como
    // el `DD_FRESHNESS_TOLERANCE_DAYS` del backend— las dos darían lo mismo.
    expect(saludDe(fuente(31, 1, 2))).toBe('DEGRADADA')
    expect(saludDe(fuente(31, 24, 3))).toBe('AL_DIA')
  })
})

describe('el corte es ESTRICTAMENTE mayor', () => {
  it('justo en el límite está dentro', () => {
    // El dibujo escribe `>`: una fuente que llegó a horario no se degrada.
    expect(saludDe(fuente(2, 1, 2))).toBe('AL_DIA')
  })

  it('un pelo por encima degrada', () => {
    expect(saludDe(fuente(2.1, 1, 2))).toBe('DEGRADADA')
  })
})

describe('«nunca cargó» NO es «degradada»', () => {
  it('sin frescura el estado es SIN_CARGA', () => {
    // Las cuatro fuentes del tenant llegan así el 2026-09-25: el seguimiento de
    // cargas es nuevo. Decir «degradada» de algo que nunca cargó cuenta una
    // historia falsa sobre un feed que quizá está perfecto.
    expect(saludDe(fuente(null))).toBe('SIN_CARGA')
  })

  it('y CERO horas de frescura sí es al día · no se confunde con la ausencia', () => {
    // `?? 0` en el adaptador habría convertido «nunca cargó» en «cargó recién»,
    // que es lo contrario. Por eso el campo viaja como `null`.
    expect(saludDe(fuente(0))).toBe('AL_DIA')
  })
})

describe('el resumen cuenta lo derivado', () => {
  it('«N fuentes · N al día · N degradadas» sale de contar, no de un campo', () => {
    const r = resumen([fuente(1), fuente(31), fuente(null), fuente(0)])
    expect(r).toEqual({ AL_DIA: 2, DEGRADADA: 1, SIN_CARGA: 1 })
  })

  it('sin fuentes, los tres en cero · el vacío de alta no rompe el conteo', () => {
    expect(resumen([])).toEqual({ AL_DIA: 0, DEGRADADA: 0, SIN_CARGA: 0 })
  })
})
