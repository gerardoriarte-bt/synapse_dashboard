/** Las escalas · F1.13a. */
import { describe, expect, it } from 'vitest'
import { bandScale, ceiling, linearScale, timeScale } from '@/render/plots/core/scale'

describe('linearScale · dominio → píxeles', () => {
  it('mapea los extremos y el medio', () => {
    const s = linearScale([0, 100], [0, 200])
    expect(s(0)).toBe(0)
    expect(s(50)).toBe(100)
    expect(s(100)).toBe(200)
  })

  it('un rango invertido dibuja hacia arriba · en SVG la y crece hacia abajo', () => {
    const s = linearScale([0, 100], [200, 0])
    expect(s(0)).toBe(200)
    expect(s(100)).toBe(0)
  })

  it('un dominio de ancho cero no divide por cero', () => {
    const s = linearScale([5, 5], [0, 200])
    expect(s(5)).toBe(0)
    expect(s(99)).toBe(0)
    expect(s.ticks()).toEqual([5])
  })
})

describe('ticks · un eje dice 0 · 20 · 40, nunca 0 · 17 · 34', () => {
  it('el paso se redondea a 1, 2, 5 o 10 por década', () => {
    expect(linearScale([0, 100], [0, 1]).ticks(5)).toEqual([0, 20, 40, 60, 80, 100])
    expect(linearScale([0, 10], [0, 1]).ticks(5)).toEqual([0, 2, 4, 6, 8, 10])
  })

  it('no arrastra ruido de coma flotante', () => {
    // 0.1 + 0.2 acumulado da 0.30000000000000004 y el eje lo pintaría entero.
    for (const t of linearScale([0, 1], [0, 1]).ticks(5)) {
      expect(String(t).length).toBeLessThan(6)
    }
  })
})

describe('ceiling · la barra más alta no toca el borde', () => {
  it('redondea hacia ARRIBA al siguiente paso, no al último tick que quepa', () => {
    // Tomando el último tick, un máximo de 81 daba techo 80 y la barra se salía
    // del área. Lo encontró la prueba antes que el render.
    expect(ceiling([81])).toBeGreaterThanOrEqual(81)
    expect(ceiling([100])).toBeGreaterThanOrEqual(100)
    expect(ceiling([4280000])).toBeGreaterThanOrEqual(4280000)
  })

  it('un conjunto en cero no da techo cero · dividir por él rompe la escala', () => {
    expect(ceiling([0, 0])).toBe(1)
    expect(ceiling([])).toBe(1)
  })

  it('el techo es un múltiplo del paso, así que cae en un tick', () => {
    const techo = ceiling([81])
    expect(linearScale([0, techo], [0, 1]).ticks(5)).toContain(techo)
  })
})

describe('bandScale · una banda por categoría', () => {
  it('reparte el rango en pasos iguales y deja aire entre barras', () => {
    const s = bandScale(['a', 'b', 'c', 'd'], [0, 400])
    expect(s.step).toBe(100)
    expect(s.bandwidth).toBe(80) // padding 0.2
    expect(s('a')).toBe(10) // centrada en su paso
    expect(s('d')).toBe(310)
  })

  it('una categoría desconocida cae al inicio en vez de dar NaN', () => {
    // Un NaN en un `x` de SVG hace desaparecer la marca entera sin decir nada.
    const s = bandScale(['a'], [0, 100])
    expect(Number.isNaN(s('z'))).toBe(false)
  })

  it('un dominio vacío no divide por cero', () => {
    expect(Number.isFinite(bandScale([], [0, 100]).step)).toBe(true)
  })
})

describe('timeScale · el tiempo es lineal sobre milisegundos', () => {
  it('mapea las fechas a los extremos del rango', () => {
    const s = timeScale([new Date('2026-01-01'), new Date('2026-12-31')], [0, 100])
    expect(s(new Date('2026-01-01').getTime())).toBe(0)
    expect(s(new Date('2026-12-31').getTime())).toBe(100)
  })
})
