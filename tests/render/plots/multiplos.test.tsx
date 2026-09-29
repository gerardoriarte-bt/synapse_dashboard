// @vitest-environment jsdom

/** Los múltiplos pequeños · `smallmult` · §PEN:Plot/MÚLTIPLOS · 2026-09-29
 *
 *  **Lo que define este gráfico es la escala COMPARTIDA, y es lo único que no se
 *  ve mirando la pantalla.** Tres áreas una al lado de la otra se ven igual de
 *  prolijas con una escala por división: lo que cambia es que ahí las tres
 *  llenan su caja y el dibujo afirma que las tres valen lo mismo. Por eso la
 *  segunda prueba es la que manda, y sale medida del frame —79.4/113.9 = 6.2/8.9.
 *
 *  Las demás atan lo que el frame fija y `design.md` exige: una división por
 *  serie, la cifra del ÚLTIMO punto, el rótulo en mayúsculas al lado de cada
 *  cifra, el eje común, y que ningún color salga de otro lado que la familia.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeriesBody } from '@/render/bodies/SeriesBody'
import { PlotSmallMult, facetRects } from '@/render/plots/PlotSmallMult'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const number = (v: number) => format.number(v, { abbreviate: true })

const serie = (etiqueta: string, vs: readonly number[], desde = 1) => ({
  etiqueta,
  puntos: vs.map((v, i) => ({ t: `S${i + desde}`, v })),
})

/* ── Lectores del SVG ──────────────────────────────────────────────────────
 *
 * Ninguno usa un atributo de prueba: el riel se reconoce por su token, el
 * rótulo por su anclaje `start` y la cifra por el `end`, que es lo que el frame
 * dibuja (`textAlign: right` contra el borde derecho de la división).
 */
const rieles = (c: HTMLElement) => Array.from(c.querySelectorAll('line[stroke="var(--color-c-grid)"]'))
const rotulos = (c: HTMLElement) => Array.from(c.querySelectorAll('text[text-anchor="start"]'))
const cifras = (c: HTMLElement) => Array.from(c.querySelectorAll('text[text-anchor="end"]'))

/** Los contornos · `Line` es el único `path` con `fill="none"`. */
const trazos = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path[fill="none"]')).map((n) =>
    [...(n.getAttribute('d') ?? '').matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    })),
  )

/** El `translate` de un `<g>`, que es como cada división se coloca. Sin leerlo
 *  no hay forma de comparar una coordenada local del riel con una de la cifra,
 *  que vive un nivel más arriba. */
const traslado = (el: Element | null | undefined) => {
  const m = /translate\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/.exec(el?.getAttribute('transform') ?? '')
  return { x: Number(m?.[1] ?? NaN), y: Number(m?.[2] ?? NaN) }
}

/** Las divisiones · un `<g>` por serie, hijo directo del `<svg>`. */
const divisiones = (c: HTMLElement) => Array.from(c.querySelectorAll('svg > g'))

/** El relleno del área de una división. `Area` es el único `path` con
 *  `fill-opacity`; `Line` va con `fill="none"`. */
const relleno = (d: Element) => d.querySelector('path[fill-opacity]')?.getAttribute('fill')

/** Las `y` del recorrido de un `path`. */
const ys = (n: Element | null | undefined) =>
  [...(n?.getAttribute('d') ?? '').matchAll(/,(-?[\d.]+)/g)].map((m) => Number(m[1]))

/** El alto de cada área sobre su riel. `Area` cierra contra la base, así que la
 *  `y` mayor del recorrido ES el riel y la menor es el pico. */
const alturas = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path'))
    .filter((n) => (n.getAttribute('d') ?? '').trimEnd().endsWith('Z'))
    .map((n) => [...(n.getAttribute('d') ?? '').matchAll(/,(-?[\d.]+)/g)].map((m) => Number(m[1])))
    .map((ys) => Math.max(...ys) - Math.min(...ys))

const plot = (series: readonly { etiqueta: string; puntos: { t: string; v: number }[] }[], unit?: string) =>
  render(
    <PlotSmallMult
      series={series}
      family="medios"
      format={number}
      {...(unit === undefined ? {} : { unit })}
    />,
  )

/* ══ El teselado, sin montar un SVG ═════════════════════════════════════════ */

describe('`facetRects` · el teselado', () => {
  it('reparte el ancho en tantas divisiones como series, con la separación del frame', () => {
    // El frame: tres divisiones de 178 con 16 de separación. Acá el ancho es el
    // medido y lo que se conserva es la relación.
    const [a, b, c] = facetRects(3, 580, 182)
    expect(a).toBeDefined()
    expect(b?.x).toBeCloseTo((a?.x ?? 0) + (a?.w ?? 0) + 16, 6)
    expect(c?.x).toBeCloseTo((b?.x ?? 0) + (b?.w ?? 0) + 16, 6)
    // Nada se sale por la derecha.
    expect((c?.x ?? 0) + (c?.w ?? 0)).toBeCloseTo(580, 6)
  })

  it('por debajo del ancho mínimo de división envuelve a otra fila', () => {
    // 120px es donde `charsThatFit` deja 16 caracteres de rótulo. Con seis
    // divisiones en 600 de ancho no entran seis de 120 más sus separaciones.
    const seis = facetRects(6, 600, 300)
    const filas = new Set(seis.map((r) => r.y))
    expect(filas.size).toBeGreaterThan(1)
    for (const r of seis) expect(r.w).toBeGreaterThanOrEqual(120)
  })
})

/* ══ Lo que el frame fija ══════════════════════════════════════════════════ */

describe('una división por serie', () => {
  it('tres series dan tres rieles, tres rótulos y tres cifras', () => {
    // Cubre el caso que el frame dibuja sin cablear el tres: sale de `series`.
    const { container } = plot([
      serie('Footwear', [10, 12, 14]),
      serie('Apparel', [8, 9, 7]),
      serie('Accessories', [3, 2, 4]),
    ])
    expect(rieles(container)).toHaveLength(3)
    expect(rotulos(container)).toHaveLength(3)
    expect(cifras(container)).toHaveLength(3)
  })
})

describe('LA ESCALA ES COMPARTIDA', () => {
  it('la altura de un área es proporcional a su valor ENTRE divisiones', () => {
    // **Es la aserción que define el gráfico.** Con `ceiling` por división las
    // dos áreas llenan su caja y la razón pasa a ser 1: el dibujo se ve igual de
    // prolijo afirmando que 25 y 100 son lo mismo.
    //
    // Sale medida del frame: las alturas de cierre son 113.9 · 79.4 · 23 y las
    // cifras 8.9K · 6.2K · 1.8K, y las razones coinciden al tercer decimal.
    const { container } = plot([serie('Alta', [100, 100]), serie('Baja', [25, 25])])
    const [alta, baja] = alturas(container)

    expect(alta).toBeGreaterThan(0)
    expect(Math.abs((baja ?? 0) - (alta ?? 0) / 4)).toBeLessThan(1)
  })
})

describe('la cifra de cada división', () => {
  it('es su ÚLTIMO punto, no su máximo', () => {
    // El frame lo decide en su segunda división: el mínimo de `y` del trazo da
    // altura 81.9 y el cierre 79.4, y la cifra rotulada —6.2K— cuadra con el
    // cierre. En la primera coinciden por casualidad.
    const { container } = plot([serie('Footwear', [10, 30, 12])])
    const textos = cifras(container).map((n) => n.textContent)

    expect(textos).toEqual([number(12)])
    expect(textos.join(' ')).not.toContain(number(30))
  })

  it('lleva la unidad de la métrica cuando llega · «8.9K u.» del frame', () => {
    // La prop es opcional y viaja con el spread condicional, así que un nombre
    // mal escrito COMPILA. Por eso se mira la cifra pintada y no que la prop
    // exista.
    const { container } = plot([serie('Footwear', [8900])], 'u.')
    expect(cifras(container)[0]?.textContent).toBe(`${number(8900)} u.`)
  })

  it('va con su rótulo, y el rótulo es la `etiqueta` en MAYÚSCULAS', () => {
    // Ata «ningún número desnudo» a una aserción y no a una lectura: una cifra
    // sin su rótulo de división no dice de quién es.
    const { container } = plot([serie('Footwear', [10, 12])])
    expect(rotulos(container)).toHaveLength(1)
    expect(container.innerHTML).toContain('FOOTWEAR')
    expect(container.innerHTML).not.toContain('Footwear')
  })
})

describe('el eje x es COMÚN a todas las divisiones', () => {
  it('el mismo `t` cae en la misma x en todas', () => {
    // **La lección del apilado trasplantada**: comparar la posición 2 de una
    // división con la posición 2 de otra cuando son meses distintos se ve
    // perfecto. Acá B no tiene S1, así que su primer punto dibujado tiene que
    // caer en la x que A usa para S2 — no pegado al borde izquierdo.
    const { container } = plot([serie('A', [10, 20, 30]), serie('B', [5, 7], 2)])
    const [a, b] = trazos(container)

    expect(a).toHaveLength(3)
    expect(b).toHaveLength(2)
    expect(b?.[0]?.x).toBeGreaterThan(0)
    expect(b?.[0]?.x).toBeCloseTo(a?.[1]?.x ?? -1, 6)
  })
})

describe('todo color sale de la familia que llegó por prop', () => {
  it('ningún `fill` ni `stroke` es un hex, el acento ni otra familia', () => {
    // `design-lint` ve el hex y el `acc`; **no ve una familia cableada**, que es
    // lo que el frame hace —`$fam-demanda-*` y `$fam-inventario-1`— y lo que la
    // regla dura 1 prohíbe. Esta aserción sí.
    const { container } = plot([serie('A', [10, 20]), serie('B', [5, 7])])
    const pintados = Array.from(container.querySelectorAll('*')).flatMap((n) => [
      n.getAttribute('fill'),
      n.getAttribute('stroke'),
      (n as SVGElement).style?.fill,
    ])

    const permitidos = /^var\(--color-(fam-medios-[0-4]|c-grid|dim|ink)\)$/
    for (const c of pintados) {
      if (c === null || c === undefined || c === '' || c === 'none') continue
      expect(c).toMatch(permitidos)
    }
    // Y que la lista no esté vacía por un selector que no encuentra nada.
    expect(pintados.filter((c) => c?.startsWith('var(--color-fam-medios-'))).not.toHaveLength(0)
  })
})

/* ══ La geometría que el frame mide ════════════════════════════════════════
 *
 * Las cuatro de abajo salieron de mutaciones que SOBREVIVIERON a las once
 * primeras: el riel dibujado en el borde de arriba, la cifra encima del riel, las
 * dos bandas sin reservar y la rampa plana pasaban las once. Son garantías que el
 * archivo declara con número medido del frame y que nada ataba.
 */

describe('el riel de cero', () => {
  it('está en la BASE de la escala, no en un borde de la división', () => {
    // El frame lo pone en 150 con el dibujo de 16 a 150, y **es contra ese riel
    // que se miden las tres alturas 113.9 · 79.4 · 23**. Un riel en el borde de
    // arriba se ve como una línea prolija y deja de ser el cero.
    const { container } = plot([serie('Footwear', [10, 30, 20])])
    const area = Array.from(container.querySelectorAll('path')).find((n) =>
      (n.getAttribute('d') ?? '').trimEnd().endsWith('Z'),
    )
    const recorrido = ys(area)
    const riel = rieles(container)[0]

    expect(recorrido.length).toBeGreaterThan(0)
    expect(Number(riel?.getAttribute('y1'))).toBeCloseTo(Math.max(...recorrido), 6)
    expect(Number(riel?.getAttribute('y2'))).toBeCloseTo(Math.max(...recorrido), 6)
    // Y el pico queda POR ENCIMA: si el riel fuera el borde de arriba, la
    // aserción de igualdad de arriba se cumpliría con un área degenerada.
    expect(Math.min(...recorrido)).toBeLessThan(Math.max(...recorrido))
  })
})

describe('las dos bandas que la división reserva', () => {
  it('el rótulo va ARRIBA del dibujo y la cifra DEBAJO del riel, las dos adentro', () => {
    // `alto − 48` del archivo son las dos bandas: 16 de rótulo y 32 de cifra. Sin
    // aserción, ponerlas en cero deja el dibujo llenando la celda y la cifra
    // fuera del `svg` — que no se ve porque el `svg` no recorta.
    const { container } = plot([serie('Footwear', [10, 12, 14]), serie('Apparel', [8, 9, 7])])
    const alto = Number(container.querySelector('svg')?.getAttribute('height'))
    const divs = divisiones(container)
    expect(divs).toHaveLength(2)

    for (const d of divs) {
      const fuera = traslado(d)
      const dentro = traslado(d.querySelector('g'))
      const rielY = fuera.y + dentro.y + Number(rieles(d as HTMLElement)[0]?.getAttribute('y1'))
      const cifraY = fuera.y + Number(cifras(d as HTMLElement)[0]?.getAttribute('y'))
      const rotuloY = fuera.y + Number(rotulos(d as HTMLElement)[0]?.getAttribute('y'))

      // La banda del rótulo existe y el rótulo cae dentro de ella.
      expect(dentro.y).toBeGreaterThan(0)
      expect(rotuloY).toBeGreaterThan(fuera.y)
      expect(rotuloY).toBeLessThan(fuera.y + dentro.y)

      // La cifra cuelga del riel —no lo pisa— y no se sale de la celda.
      expect(cifraY).toBeGreaterThan(rielY)
      expect(cifraY).toBeLessThan(fuera.y + alto)
    }
  })
})

describe('el escalón de la familia cicla entre divisiones', () => {
  it('tres divisiones contiguas llevan tres escalones distintos', () => {
    // `RAMPA` existe sólo para esto y nada la ataba: aplanarla a un escalón único
    // pasaba las once pruebas. Fija la decisión de HOY —el frame varía el color
    // entre divisiones— y su contraargumento está escrito en el componente y en
    // `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md`: si diseño resuelve
    // que un múltiplo va a un solo escalón, esta prueba cambia con la decisión.
    const { container } = plot([serie('A', [10, 12]), serie('B', [8, 9]), serie('C', [3, 4])])
    const escalones = divisiones(container).map(relleno)

    expect(escalones).toHaveLength(3)
    for (const e of escalones) expect(e).toMatch(/^var\(--color-fam-medios-[0-4]\)$/)
    expect(new Set(escalones).size).toBe(3)
  })
})

describe('el rótulo se recorta a lo que quepa', () => {
  it('un nombre que no entra en su división termina en puntos suspensivos', () => {
    // El recorte sale de `charsThatFit`, que es de donde sale el mínimo de 120px:
    // «por debajo de eso el rótulo se recorta a nada y la división deja de decir
    // de quién es». Con seis divisiones en 600 cada una mide 138 y entran 19
    // caracteres.
    const largo = 'Accessories y calzado XXL'
    const { container } = plot(
      [largo, 'B', 'C', 'D', 'E', 'F'].map((n) => serie(n, [10, 12])),
    )
    const primero = rotulos(container)[0]?.textContent ?? ''

    expect(primero.endsWith('…')).toBe(true)
    expect(primero.length).toBeLessThan(largo.length)
    expect(largo.toUpperCase().startsWith(primero.slice(0, -1))).toBe(true)
  })
})

describe('el gráfico declara qué es', () => {
  it('su nombre accesible dice cuántas divisiones tiene', () => {
    // Es el único texto que un lector de pantalla recibe del dibujo: el `.pen` no
    // dibuja eje de valores, así que sin esto el `svg` no dice nada.
    plot([serie('A', [10, 12]), serie('B', [8, 9]), serie('C', [3, 4])])
    expect(screen.getByRole('img', { name: '3 divisiones' })).toBeInTheDocument()
  })
})

/* ══ Que se PIDA y no se adivine ═══════════════════════════════════════════ */

const multi = (series: readonly { etiqueta: string; puntos: { t: string; v: number }[] }[]) =>
  ({ forma: 'seriesMultiples', series }) as unknown as Extract<Value, { forma: 'seriesMultiples' }>

const base = {
  span: { colStart: 1, colSpan: 6, rowSpan: 4 },
  family: 'medios',
  metric: 'Unidades por división',
  format,
} as const

const DOS = multi([serie('Footwear', [10, 20]), serie('Apparel', [5, 5])])

describe('`smallmult` se declara, no se cae al área', () => {
  it('sobre `serieTemporal` cae a `UnknownPlotState`', () => {
    // Facetear una sola serie contra nada es el área que `PlotSeries` ya dibuja
    // — el mismo argumento escrito que `stackarea`.
    //
    // **HOY pasa por una segunda razón**, y conviene no perderla: el cableado de
    // `smallmult` en `SeriesBody` es de una fase posterior, así que el id
    // todavía no está en ninguna de las dos formas. Cuando se cablee en
    // `seriesMultiples`, esta prueba pasa a verificar sólo lo que dice.
    const una = {
      forma: 'serieTemporal',
      puntos: [{ t: 'S1', v: 10 }],
    } as unknown as Extract<Value, { forma: 'serieTemporal' }>
    render(<SeriesBody {...base} value={una} params={{}} grafico="smallmult" />)

    expect(screen.getByText(/smallmult/)).toBeVisible()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('sin `grafico`, `seriesMultiples` sigue siendo multilínea', () => {
    // Sin esto, agregar un gráfico al repertorio puede cambiar en silencio lo
    // que ven los paneles ya publicados.
    render(<SeriesBody {...base} value={DOS} params={{}} />)
    expect(screen.getByRole('img', { name: '2 series' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /divisiones/ })).toBeNull()
  })
})
