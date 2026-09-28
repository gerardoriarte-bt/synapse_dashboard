// @vitest-environment jsdom

/** El área apilada · `stackarea` · 2026-09-28
 *
 *  **Lo que se verifica es la ARITMÉTICA del apilado, no que el SVG exista.**
 *  Un apilado mal sumado se ve perfecto: bandas prolijas, ejes correctos, y un
 *  total que no es el total. Es el mismo modo de falla que el panel dibujado
 *  con el gráfico por defecto.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeriesBody } from '@/render/bodies/SeriesBody'
import { createFormat } from '@/render/format'
import { stack } from '@/render/plots/core/stack'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const base = {
  span: { colStart: 1, colSpan: 6, rowSpan: 4 },
  family: 'medios',
  metric: 'Contribución por canal',
  format,
} as const

const multi = (series: readonly { etiqueta: string; puntos: { t: string; v: number }[] }[]) =>
  ({ forma: 'seriesMultiples', series }) as unknown as Extract<Value, { forma: 'seriesMultiples' }>

const DOS = multi([
  { etiqueta: 'Meta', puntos: [{ t: 'S1', v: 10 }, { t: 'S2', v: 20 }] },
  { etiqueta: 'Google', puntos: [{ t: 'S1', v: 5 }, { t: 'S2', v: 5 }] },
])

/** Las `y` de todos los `path` dibujados. En SVG la `y` crece hacia abajo, así
 *  que un valor NEGATIVO es tinta por encima del área de dibujo. */
const fuera = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path'))
    .flatMap((n) => [...(n.getAttribute('d') ?? '').matchAll(/,(-?[\d.]+)/g)])
    .map((m) => Number(m[1]))
    .filter((v) => v < 0)

/** Las bandas, en orden. **Se reconocen por la `Z`**: `Ribbon` cierra su
 *  contorno y ni las líneas ni la rejilla lo hacen, así que no hace falta un
 *  atributo de prueba en el componente. */
const bandas = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path'))
    .map((n) => n.getAttribute('d') ?? '')
    .filter((d) => d.trimEnd().endsWith('Z'))
    .map((d) => [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) })))

describe('`stackarea` se elige y no se adivina', () => {
  it('sin `grafico`, `seriesMultiples` sigue siendo multilínea', () => {
    render(<SeriesBody {...base} value={DOS} params={{}} />)
    expect(screen.getByRole('img', { name: '2 series' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /apiladas/ })).toBeNull()
  })

  it('con `stackarea` apila', () => {
    render(<SeriesBody {...base} value={DOS} params={{}} grafico="stackarea" />)
    expect(screen.getByRole('img', { name: '2 series apiladas' })).toBeInTheDocument()
  })

  it('`stackarea` NO se ofrece sobre una serie sola · se declara', () => {
    // Apilar una serie contra nada es el área que ya existe. Ofrecerlo como si
    // fuera otra cosa promete una composición donde hay una línea.
    const una = {
      forma: 'serieTemporal',
      puntos: [{ t: 'S1', v: 10 }],
    } as unknown as Extract<Value, { forma: 'serieTemporal' }>
    render(<SeriesBody {...base} value={una} params={{}} grafico="stackarea" />)

    expect(screen.getByText(/stackarea/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /series/ })).toBeNull()
  })
})

describe('la aritmética del apilado', () => {
  it('cada tramo arranca donde termina el anterior', () => {
    expect(stack([10, 5, 2])).toEqual([
      { start: 0, end: 10 },
      { start: 10, end: 15 },
      { start: 15, end: 17 },
    ])
  })


  it('el TECHO es el TOTAL, no la serie más alta · nada se sale del área', () => {
    // **Es lo que distingue apilar de superponer.** Acá el máximo de una serie
    // es 20 y el total apilado es 25: con el techo en 20, la banda de arriba se
    // dibuja por encima del borde.
    //
    // **No se afirma sobre los rótulos del eje**, y la primera versión de esta
    // prueba lo hacía: `ticks(4)` sobre [0, 25] no emite un rótulo en 25, así
    // que leía 20 y fallaba con el código correcto. El eje no es el dominio.
    const { container } = render(
      <SeriesBody {...base} value={DOS} params={{}} grafico="stackarea" />,
    )
    expect(fuera(container)).toEqual([])
  })
})

describe('se apila por `t` y no por posición', () => {
  it('una serie que no tiene ese instante no desplaza a las demás', () => {
    // **El defecto que esto previene**: apilando por índice, el punto 2 de una
    // serie se sumaría al punto 2 de otra aunque sean semanas distintas, y el
    // total sería la suma de fechas que no coinciden — perfecto a la vista.
    const desparejas = multi([
      { etiqueta: 'Meta', puntos: [{ t: 'S1', v: 10 }, { t: 'S2', v: 20 }] },
      // Sólo tiene S2, y en la posición 0.
      { etiqueta: 'Criteo', puntos: [{ t: 'S2', v: 100 }] },
    ])
    const { container } = render(
      <SeriesBody {...base} value={desparejas} params={{}} grafico="stackarea" />,
    )

    // **El techo NO distingue las dos lecturas**: por `t` el pico es 120 en S2 y
    // por índice es 110 en S1, y el eje sale igual de alto en los dos casos. Lo
    // que cambia es CUÁNDO. Por eso se mira el espesor de la banda de Criteo en
    // S1: por `t` no tiene ese instante y su espesor ahí es CERO; por índice su
    // primer punto valdría 100 y la banda arrancaría gruesa.
    //
    // `Ribbon` dibuja el contorno de ida por el borde superior y de vuelta por
    // el inferior, así que el PRIMER punto y el ÚLTIMO son el mismo instante:
    // con espesor cero coinciden.
    const criteo = bandas(container)[1]
    expect(criteo).toBeDefined()
    const primero = criteo?.[0]
    const ultimo = criteo?.[criteo.length - 1]
    expect(primero).toEqual(ultimo)
  })

  it('cada banda usa un escalón distinto de la rampa', () => {
    // **Sin esto el apilado no se lee.** Dos bandas contiguas del mismo color
    // son una sola banda a la vista, y el gráfico pasa a mostrar el total sin
    // mostrar la composición — que es lo único que agrega sobre una línea.
    //
    // El escalón sale de la rampa de la FAMILIA, que llega del catálogo: el
    // componente elige cuál de los cinco, nunca cuál hue.
    const { container } = render(
      <SeriesBody {...base} value={DOS} params={{}} grafico="stackarea" />,
    )
    const rellenos = Array.from(container.querySelectorAll('path'))
      .filter((n) => (n.getAttribute('d') ?? '').trimEnd().endsWith('Z'))
      .map((n) => n.getAttribute('fill'))

    expect(rellenos).toHaveLength(2)
    expect(rellenos[0]).not.toEqual(rellenos[1])
  })

  it('apilar de verdad · la segunda banda NO arranca del piso', () => {
    // **La mutación que sobrevivía**: con `lo: 0` todas las bandas salen del
    // piso y se superponen. Se ve prolijo —bandas limpias, ejes correctos— y el
    // gráfico deja de ser una composición.
    const { container } = render(
      <SeriesBody {...base} value={DOS} params={{}} grafico="stackarea" />,
    )
    const [meta, google] = bandas(container)
    expect(meta).toBeDefined()
    expect(google).toBeDefined()

    const piso = Math.max(...(meta ?? []).map((p) => p.y))
    // La de abajo toca el piso; la de arriba arranca donde termina la de abajo.
    expect(Math.max(...(google ?? []).map((p) => p.y))).toBeLessThan(piso)
  })
})
