// @vitest-environment jsdom

/** El período en curso no es una caída · EV-015 de la evaluación de UX · 2026-11-10
 *
 *  «En "Eficiencia de medios", octubre 2026 se dibuja como un punto más de la
 *  serie y aparece como una caída pronunciada frente a septiembre.» El servicio
 *  ya marcaba el punto —`partial`, que el adaptador pasa a `parcial`— y el
 *  gráfico no lo usaba.
 *
 *  **Se prueba a través del cuerpo**, igual que `lectura.test.tsx`: lo que
 *  puede romperse es que `SeriesBody` no le pase el `parcial` al plot.
 *
 *  Los meses copian la forma de `media_efficiency_12m`, con cifras sintéticas.
 */
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeriesBody } from '@/render/bodies/SeriesBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

type Multi = Extract<Value, { forma: 'seriesMultiples' }>

const format = createFormat('es-MX')
const base = {
  span: { colStart: 1, colSpan: 6, rowSpan: 4 },
  family: 'medios',
  metric: 'Eficiencia de medios',
  format,
} as const

const MESES = ['2026-08-01', '2026-09-01', '2026-10-01']
const serie = (etiqueta: string, vs: readonly number[], abierto: boolean) => ({
  etiqueta,
  puntos: vs.map((v, i) => ({
    t: MESES[i] as string,
    v,
    ...(abierto && i === vs.length - 1 ? { parcial: true } : {}),
  })),
})

const conOctubreAbierto: Multi = {
  forma: 'seriesMultiples',
  series: [serie('Ventas', [2100000, 2300000, 400000], true), serie('Inversión', [180000, 190000, 30000], true)],
}
const cerrada: Multi = {
  forma: 'seriesMultiples',
  series: [serie('Ventas', [2100000, 2300000, 2200000], false), serie('Inversión', [180000, 190000, 185000], false)],
}

describe('EV-015 · el mes en curso se reconoce como parcial', () => {
  it('su fecha lo dice en el eje · la palabra, que es lo que no se confunde', () => {
    const { container } = render(<SeriesBody {...base} value={conOctubreAbierto} params={{}} />)
    const textos = Array.from(container.querySelectorAll('svg text'), (t) => t.textContent ?? '')
    // El eje escribe sus rótulos en mayúsculas: «OCT 26 · EN CURSO».
    expect(textos.filter((t) => /· en curso$/i.test(t))).toHaveLength(1)
  })

  it('la leyenda, que lee el último punto, también dice que es en curso', () => {
    render(<SeriesBody {...base} value={conOctubreAbierto} params={{}} />)
    const leyenda = screen.getByRole('list')
    expect(within(leyenda).getAllByRole('listitem')[0]?.textContent).toMatch(/· en curso$/)
  })

  it('el tramo que llega a él va punteado, con el punto hueco · uno por serie', () => {
    const { container } = render(<SeriesBody {...base} value={conOctubreAbierto} params={{}} />)
    const tramos = container.querySelectorAll('[data-en-curso]')
    expect(tramos).toHaveLength(2)
    for (const t of Array.from(tramos)) {
      expect(t.querySelector('path')?.getAttribute('stroke-dasharray')).toBe('4 3')
      expect(t.querySelector('circle')?.getAttribute('fill')).toBe('var(--color-panel)')
    }
  })

  it('una serie cerrada se dibuja como siempre · sin punteado y sin la palabra', () => {
    const { container } = render(<SeriesBody {...base} value={cerrada} params={{}} />)
    expect(container.querySelector('[data-en-curso]')).toBeNull()
    expect(container.querySelector('path[stroke-dasharray]')).toBeNull()
    expect(container.textContent).not.toMatch(/en curso/i)
  })

  it('los múltiplos dibujan el mismo tramo · un recurso para todos los gráficos de tiempo', () => {
    // Ya decían «· en curso» junto a la cifra y el trazo seguía cayendo: era la
    // captura de «Eficiencia de medios» en local.
    const { container } = render(
      <SeriesBody {...base} grafico="smallmult" value={conOctubreAbierto} params={{}} />,
    )
    const tramos = container.querySelectorAll('[data-en-curso]')
    expect(tramos).toHaveLength(2)
    expect(tramos[0]?.querySelector('path')?.getAttribute('stroke-dasharray')).toBe('4 3')
  })
})
