/** La geometría del eje · F1.13a.
 *
 *  Criterio de aceptación citado: «La reserva del eje sale del **rótulo más
 *  largo**, no del rótulo del máximo: con techo 1M el máximo es "1M" de dos
 *  caracteres y el tick "500K" son cuatro, y calculado sobre el máximo se salía
 *  por la izquierda y se leía "00K".»
 */
import { describe, expect, it } from 'vitest'
import { MIN_RESERVE, axisReserve, charsThatFit, textWidth } from '@/render/plots/core/axisGeometry'

describe('la reserva sale del rótulo más largo, no del último', () => {
  it('con ticks de 1M, reserva para «500K» y no para «1M»', () => {
    // El caso exacto que se salía por la izquierda. Los rótulos son los que
    // pinta el eje; el del máximo es el más CORTO de todos.
    const rotulos = ['0', '250K', '500K', '750K', '1M']
    const reserva = axisReserve(rotulos)

    expect(reserva).toBeGreaterThanOrEqual(textWidth('500K'.length))
    // Y es estrictamente mayor que lo que habría reservado mirando el máximo.
    expect(reserva).toBeGreaterThan(textWidth('1M'.length))
  })

  it('no baja del piso aunque los rótulos sean de un carácter', () => {
    expect(axisReserve(['0', '1', '2'])).toBe(MIN_RESERVE)
  })

  it('sin rótulos devuelve el piso en vez de -Infinity', () => {
    expect(axisReserve([])).toBe(MIN_RESERVE)
  })

  it('crece con el rótulo · un eje de millones reserva más que uno de unidades', () => {
    expect(axisReserve(['1,284,500'])).toBeGreaterThan(axisReserve(['12']))
  })
})

describe('el recorte se calcula en píxeles, no en un tope fijo', () => {
  it('en un panel angosto entran menos caracteres que en uno ancho', () => {
    // «recortar a 18» se salía por la izquierda en cuanto el panel se angostaba.
    expect(charsThatFit(60)).toBeLessThan(charsThatFit(200))
  })

  it('nunca devuelve menos de tres · con dos no entra ni «a…»', () => {
    expect(charsThatFit(0)).toBe(3)
    expect(charsThatFit(5)).toBe(3)
  })
})

describe('el avance de la mono es el medido, no el estimado', () => {
  it('diez caracteres a 10px miden 72px', () => {
    // `getComputedTextLength` en el navegador: 0.6em de avance + los 0.12em de
    // letter-spacing que §2.3 exige. El 6.7 que circula es de mono 9 y aplicado
    // acá cortaba una letra por etiqueta.
    expect(textWidth(10, 10)).toBeCloseTo(72, 5)
  })
})
