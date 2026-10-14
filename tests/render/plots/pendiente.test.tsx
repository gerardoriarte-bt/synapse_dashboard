// @vitest-environment jsdom

/** La pendiente · `slope` sobre `seriesMultiples` · §PEN:Plot/PENDIENTE
 *
 *  **Lo que se verifica es QUÉ dos instantes se comparan y con qué escala, no
 *  que el SVG exista.** Una pendiente mal hecha se ve exactamente como una
 *  pendiente bien hecha: tres segmentos limpios, dos columnas, cifras a los
 *  lados. Los tres defectos caros —tomar el segundo punto en vez del último,
 *  meter los intermedios en el dominio, y dibujar una serie que compara otros
 *  dos instantes bajo estos rótulos— no se notan mirando la pantalla, y los tres
 *  cambian lo que el panel dice.
 *
 *  Las afirmaciones se montan contra el plot y no contra `SeriesBody`: su
 *  `DIBUJA` es un archivo compartido y el cableado es una fase aparte. Estas
 *  pruebas fijan lo que ese cableado NO puede romper.
 *
 *  **El dominio se recalcula acá con su fórmula escrita a mano**, no importando
 *  la del componente: una prueba que llama a la misma función que verifica no
 *  puede fallar nunca. La fórmula es la del encabezado del plot —acolchado de
 *  0.3 del span a cada lado, con el piso de `envelope`— y si alguien la cambia
 *  allá, esto se pone rojo, que es el punto.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotSlope } from '@/render/plots/PlotSlope'
import { linearScale } from '@/render/plots/core/scale'
import { MARGIN } from '@/render/plots/core/axisGeometry'
import { TEST_SIZE } from '../../setup'
import type { Value } from '@/api/types'

const multi = (series: readonly { etiqueta: string; puntos: { t: string; v: number }[] }[]) =>
  ({ forma: 'seriesMultiples', series }) as unknown as Extract<Value, { forma: 'seriesMultiples' }>

/** Un formateador que no abrevia · las aserciones de geometría se leen mejor
 *  contra el número que contra «1,2 K». */
const plano = (v: number) => String(v)
/** El que el cuerpo va a inyectar cuando la métrica tiene unidad. */
const porciento = (v: number) => `${v}%`

/* ── La geometría del dibujo, recalculada acá ─────────────────────────────── */

/** Las dos columnas · 0.26 y 0.74 del ancho, medido en el `.pen` (150 y 430 de
 *  580). */
const IZQ = 0.26 * TEST_SIZE.width
const DER = 0.74 * TEST_SIZE.width

/** La franja de rótulos de período · 30 px, que es 218 − 188 en el dibujo. */
const AXIS_ROW = 30
const PISO = TEST_SIZE.height - AXIS_ROW
const RIEL = PISO - MARGIN.t

/** El acolchado de 0.3 a cada lado, con el piso de span de `envelope`. */
const escalaY = (valores: readonly number[]) => {
  const lo = Math.min(...valores)
  const hi = Math.max(...valores)
  const span = Math.max(hi - lo, Math.abs(hi) / 10, 1)
  return linearScale([lo - 0.3 * span, hi + 0.3 * span], [PISO, MARGIN.t])
}

/* ── Lectores del DOM ────────────────────────────────────────────────────── */

/** Los segmentos. `Line` es lo único que emite `<path>` en este plot. */
const segmentos = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path')).map((n) => ({
    stroke: n.getAttribute('stroke'),
    d: n.getAttribute('d') ?? '',
    vertices: [...(n.getAttribute('d') ?? '').matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    })),
  }))

const rieles = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('line')).filter(
    (n) => n.getAttribute('stroke') === 'var(--color-c-grid)',
  )

const extremos = (c: HTMLElement) => Array.from(c.querySelectorAll('circle'))
const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const enInk = (c: HTMLElement) => textos(c).filter((t) => t.style.fill === 'var(--color-ink)')
const enDim = (c: HTMLElement) => textos(c).filter((t) => t.style.fill === 'var(--color-dim)')
const num = (el: Element, a: string) => Number(el.getAttribute(a))

/* ── Fixtures ────────────────────────────────────────────────────────────── */

const JUL = ['JUL 2025', 'JUL 2026'] as const

const fila = (etiqueta: string, a: number, b: number, t: readonly string[] = JUL) => ({
  etiqueta,
  puntos: [
    { t: t[0] ?? '', v: a },
    { t: t[1] ?? '', v: b },
  ],
})

/** Las tres filas del dibujo, con sus cifras. */
const TRES = multi([fila('Footwear', 52, 54), fila('Apparel', 38, 36), fila('Accessories', 10, 10)])

describe('los dos instantes que se comparan', () => {
  it('los extremos son el PRIMERO y el ÚLTIMO, no los dos primeros', () => {
    // Con `puntos[1]` como extremo derecho, el segmento sale del 30 al 99 en vez
    // del 30 al 50: el gráfico compara dos instantes que no son los de sus
    // rótulos.
    //
    // **HACE FALTA LA SEGUNDA SERIE, y la primera versión de esta prueba no la
    // tenía: pasaba con la mutación puesta.** `spread` es afín, así que con UNA
    // sola serie el mínimo cae siempre en 0.1875 del riel y el máximo en 0.8125
    // sea el máximo 40 o 99 — la aserción salía idéntica en los dos casos. La
    // serie de anclaje fija el dominio desde afuera, y ahí las `y` se separan.
    const { container } = render(
      <PlotSlope
        value={multi([
          {
            etiqueta: 'Footwear',
            puntos: [
              { t: 'JUL 2025', v: 30 },
              { t: 'AGO 2025', v: 99 },
              { t: 'SEP 2025', v: 1 },
              { t: 'JUL 2026', v: 50 },
            ],
          },
          fila('Apparel', 10, 80),
        ])}
        family="demanda"
        format={plano}
      />,
    )

    const y = escalaY([30, 50, 10, 80])
    const [pico, ancla] = segmentos(container)
    expect(segmentos(container)).toHaveLength(2)
    expect(pico?.vertices[0]?.x).toBeCloseTo(IZQ, 6)
    expect(pico?.vertices[0]?.y).toBeCloseTo(y(30), 6)
    expect(pico?.vertices[1]?.x).toBeCloseTo(DER, 6)
    expect(pico?.vertices[1]?.y).toBeCloseTo(y(50), 6)
    expect(ancla?.vertices[0]?.y).toBeCloseTo(y(10), 6)
    expect(ancla?.vertices[1]?.y).toBeCloseTo(y(80), 6)
  })

  it('un punto INTERMEDIO no mueve la escala', () => {
    // **Es el defecto caro.** Con el dominio calculado sobre todos los puntos,
    // una participación que picó al 99 un mes aplasta las filas contra el centro
    // del riel: el gráfico se dibuja plano, prolijo, y dice otra cosa.
    const conPico = render(
      <PlotSlope
        value={multi([
          {
            etiqueta: 'Footwear',
            puntos: [
              { t: 'JUL 2025', v: 10 },
              { t: 'AGO 2025', v: 99 },
              { t: 'SEP 2025', v: 1 },
              { t: 'JUL 2026', v: 40 },
            ],
          },
        ])}
        family="demanda"
        format={plano}
      />,
    )
    const soloExtremos = render(
      <PlotSlope value={multi([fila('Footwear', 10, 40)])} family="demanda" format={plano} />,
    )

    expect(segmentos(conPico.container)[0]?.d).toEqual(segmentos(soloExtremos.container)[0]?.d)
  })

  it('el dominio NO arranca en cero · los datos ocupan más de medio riel', () => {
    // Con `[0, ceiling(...)]` las tres filas se juntan en el quinto superior y
    // el cruce —lo único que una pendiente agrega— desaparece.
    const { container } = render(<PlotSlope value={TRES} family="demanda" format={plano} />)

    const ys = segmentos(container).flatMap((s) => s.vertices.map((v) => v.y))
    const arriba = Math.min(...ys)
    const abajo = Math.max(...ys)

    expect(arriba).toBeGreaterThan(MARGIN.t)
    expect(abajo).toBeLessThan(PISO)
    expect(arriba - MARGIN.t).toBeLessThan(RIEL * 0.2)
    expect(PISO - abajo).toBeLessThan(RIEL * 0.25)
    expect(abajo - arriba).toBeGreaterThan(RIEL * 0.5)
  })

  it('los rótulos de período salen del `t` del dato y en el orden del dato', () => {
    // Rotular con el índice —«1» y «2»—, con literales «ANTES»/«DESPUÉS», o con
    // `puntos[1].t` en una serie de cuatro puntos, deja al gráfico sin decir QUÉ
    // compara. Es la única defensa contra descartar los intermedios en silencio.
    const { container } = render(<PlotSlope value={TRES} family="demanda" format={plano} />)

    const periodos = enDim(container)
    expect(periodos.map((t) => t.textContent)).toEqual(['JUL 2025', 'JUL 2026'])
    expect(num(periodos[0] as Element, 'x')).toBeCloseTo(IZQ, 6)
    expect(num(periodos[1] as Element, 'x')).toBeCloseTo(DER, 6)
  })
})

describe('las cifras · ninguna desnuda y cada una de su lado', () => {
  it('el nombre y la cifra de ORIGEN a la izquierda, la de DESTINO a la derecha', () => {
    // Los valores son 52 y 54 a propósito: intercambiar primero y último en
    // cualquiera de los dos lados tiene que ponerse rojo. Y sin la `etiqueta` la
    // fila se queda sin quién la nombre, así que las dos cifras quedan desnudas.
    const { container } = render(
      <PlotSlope value={multi([fila('Footwear', 52, 54)])} family="demanda" format={porciento} />,
    )

    const [izquierda, derecha] = enInk(container)
    expect(izquierda?.textContent).toBe('Footwear 52%')
    expect(derecha?.textContent).toBe('54%')
    expect(num(derecha as Element, 'x')).toBeGreaterThan(DER)
    expect(num(izquierda as Element, 'x')).toBeLessThan(IZQ)
  })
})

describe('el color llega por prop y no se elige acá', () => {
  it('cada fila lleva su escalón y ninguna repite con su vecina', () => {
    // Con `step` fijo, dos segmentos contiguos del mismo color son una sola
    // línea a la vista y el cruce se pierde.
    const { container } = render(<PlotSlope value={TRES} family="medios" format={plano} />)

    const strokes = segmentos(container).map((s) => s.stroke)
    expect(strokes).toEqual([
      'var(--color-fam-medios-0)',
      'var(--color-fam-medios-1)',
      'var(--color-fam-medios-2)',
    ])
    expect(new Set(strokes).size).toBe(3)

    // Los extremos van del mismo color que su segmento: dos por fila.
    const fills = extremos(container).map((n) => n.getAttribute('fill'))
    expect(fills).toEqual([
      'var(--color-fam-medios-0)',
      'var(--color-fam-medios-0)',
      'var(--color-fam-medios-1)',
      'var(--color-fam-medios-1)',
      'var(--color-fam-medios-2)',
      'var(--color-fam-medios-2)',
    ])
    expect(extremos(container).every((n) => num(n, 'r') === 5)).toBe(true)
  })

  it('con otra familia no queda ni un rastro de la anterior', () => {
    const { container } = render(<PlotSlope value={TRES} family="cliente" format={plano} />)
    expect(container.innerHTML).not.toContain('medios')
    expect(container.innerHTML).toContain('var(--color-fam-cliente-')
  })

  it('el naranja no entra, ni siquiera para marcar quién ganó', () => {
    // La tentación real de este gráfico es pintar en `--color-acc` la serie que
    // sube o la que cruza. `--color-acc` es de CTA, estado activo y enlaces.
    //
    // Se miran los ATRIBUTOS de tinta y no el HTML entero, porque «Accessories»
    // contiene esas tres letras y la prueba se pondría verde por la razón
    // equivocada el día que alguien renombre la fila.
    const { container } = render(<PlotSlope value={TRES} family="demanda" format={plano} />)

    const tinta = Array.from(container.querySelectorAll('*')).flatMap((n) => [
      n.getAttribute('stroke') ?? '',
      n.getAttribute('fill') ?? '',
      (n as SVGElement).style?.fill ?? '',
    ])
    expect(tinta.filter((v) => v.includes('acc'))).toEqual([])
  })

  it('los rieles son papel y coinciden con las columnas', () => {
    // Dibujarlos en 0 y `w` mientras los puntos van en 0.26w y 0.74w deja los
    // extremos flotando y los rótulos montados encima del riel. Pintarlos con la
    // familia convierte el papel en dato.
    const { container } = render(<PlotSlope value={TRES} family="demanda" format={plano} />)

    const dos = rieles(container)
    expect(dos).toHaveLength(2)
    for (const [i, columna] of [IZQ, DER].entries()) {
      const riel = dos[i] as Element
      expect(num(riel, 'x1')).toBeCloseTo(columna, 6)
      expect(num(riel, 'x2')).toBeCloseTo(columna, 6)
    }
    // Y todos los vértices caen sobre una de las dos, no al lado.
    const xs = segmentos(container).flatMap((s) => s.vertices.map((v) => v.x))
    expect(xs).toHaveLength(6)
    for (const x of xs) {
      expect(Math.min(Math.abs(x - IZQ), Math.abs(x - DER))).toBeLessThan(1e-6)
    }
  })
})

describe('las series que no se pueden comparar se descartan', () => {
  it('una serie de un solo punto no inventa el segundo', () => {
    // Con `puntos[puntos.length - 1] ?? puntos[0]` aparece un tercer segmento
    // horizontal que se lee «no cambió entre JUL 2025 y JUL 2026» cuando lo que
    // pasa es que no hay con qué comparar.
    const { container } = render(
      <PlotSlope
        value={multi([
          fila('Footwear', 52, 54),
          fila('Apparel', 38, 36),
          { etiqueta: 'Accessories', puntos: [{ t: 'JUL 2025', v: 10 }] },
        ])}
        family="demanda"
        format={plano}
      />,
    )

    expect(segmentos(container)).toHaveLength(2)
    expect(screen.getByRole('img', { name: '2 series · JUL 2025 → JUL 2026' })).toBeInTheDocument()
  })

  it('y si la de un solo punto va PRIMERA, no se lleva a las demás', () => {
    // **Esta prueba salió de una mutación que sobrevivió.** Quitar el filtro de
    // la serie de un punto no hacía nada en el caso de arriba, porque el cotejo
    // de `t` ya la tiraba. El caso que sí importa es que sea la PRIMERA: ella
    // fija las columnas, así que las dos saldrían con el mismo `t` —«JUL 2025
    // contra JUL 2025»— y las dos filas que sí tenían dos instantes quedarían
    // afuera por no coincidir con ella.
    const { container } = render(
      <PlotSlope
        value={multi([
          { etiqueta: 'Accessories', puntos: [{ t: 'JUL 2025', v: 10 }] },
          fila('Footwear', 52, 54),
          fila('Apparel', 38, 36),
        ])}
        family="demanda"
        format={plano}
      />,
    )

    expect(segmentos(container)).toHaveLength(2)
    expect(enDim(container).map((t) => t.textContent)).toEqual(['JUL 2025', 'JUL 2026'])
    expect(screen.getByRole('img', { name: '2 series · JUL 2025 → JUL 2026' })).toBeInTheDocument()
  })

  it('una serie que compara OTROS dos instantes no se cuela', () => {
    // Sin el cotejo del `t`, el segmento de enero aparece bajo dos rótulos que
    // dicen julio. Es la lección de `stackarea` —«se apila por `t` y no por
    // posición»— con otra cara.
    const { container } = render(
      <PlotSlope
        value={multi([
          fila('Footwear', 52, 54),
          fila('Apparel', 38, 36),
          fila('Accessories', 10, 10),
          fila('Outlet', 90, 20, ['ENE 2025', 'ENE 2026']),
        ])}
        family="demanda"
        format={plano}
      />,
    )

    expect(segmentos(container)).toHaveLength(3)
    expect(enInk(container).map((t) => t.textContent)).not.toContain('Outlet 90')
    // Y su 90 tampoco estira el dominio: el dibujo sale igual que sin ella.
    const soloJul = render(<PlotSlope value={TRES} family="demanda" format={plano} />)
    expect(segmentos(container).map((s) => s.d)).toEqual(
      segmentos(soloJul.container).map((s) => s.d),
    )
  })
})

/* ── Lo que faltaba · salió de cuatro mutaciones que SOBREVIVIERON ─────────── */

describe('el dominio, medido donde la base cero SÍ se nota', () => {
  it('se acolcha alrededor de los DATOS y no desde cero', () => {
    // **La prueba de arriba —«el dominio NO arranca en cero»— pasa con el
    // dominio arrancando en cero**, y se comprobó mutando el plot a
    // `linearScale([0, ceiling(extremos)], …)`: sus cinco aserciones siguen
    // verdes, porque con datos en [10, 54] un techo de 60 ya deja los datos
    // ocupando 73 % del riel. El fixture es el que no distingue.
    //
    // Acá los valores están LEJOS de cero y juntos entre sí, que es el caso que
    // el encabezado describe: con base cero las dos filas salen como dos rectas
    // planas apretadas contra el techo y el cruce desaparece.
    const { container } = render(
      <PlotSlope
        value={multi([fila('Footwear', 500, 520), fila('Apparel', 505, 495)])}
        family="demanda"
        format={plano}
      />,
    )

    const y = escalaY([500, 520, 505, 495])
    const [foot, app] = segmentos(container)
    expect(foot?.vertices[0]?.y).toBeCloseTo(y(500), 6)
    expect(foot?.vertices[1]?.y).toBeCloseTo(y(520), 6)
    expect(app?.vertices[0]?.y).toBeCloseTo(y(505), 6)
    expect(app?.vertices[1]?.y).toBeCloseTo(y(495), 6)

    // Y la lectura que la aserción exacta no deja ver: los datos siguen usando
    // el riel. Con `[0, ceiling(…)]` esto cae a 4 %.
    const ys = segmentos(container).flatMap((s) => s.vertices.map((v) => v.y))
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(RIEL * 0.3)
  })

  it('dos filas planas en el MISMO valor no colapsan el dominio', () => {
    // **Es el piso del span, y no tenía prueba**: quitarle el
    // `Math.max(…, Math.abs(hi) / 10, 1)` a `spread` dejaba las 12 pruebas en
    // verde. Con `span = hi - lo` el dominio queda de ancho cero, `linearScale`
    // devuelve el arranque de su rango para todo valor, y las dos filas se
    // apoyan en el piso del riel como si valieran el mínimo de la escala.
    const { container } = render(
      <PlotSlope
        value={multi([fila('Footwear', 40, 40), fila('Apparel', 40, 40)])}
        family="demanda"
        format={plano}
      />,
    )

    const ys = segmentos(container).flatMap((s) => s.vertices.map((v) => v.y))
    expect(ys).toHaveLength(4)
    // El acolchado es parejo, así que un valor único cae en el MEDIO del riel.
    for (const v of ys) expect(v).toBeCloseTo((PISO + MARGIN.t) / 2, 6)
    expect(Math.max(...ys)).toBeLessThan(PISO - RIEL * 0.25)
  })
})

describe('dónde caen los textos, que el dibujo mide y nadie afirmaba', () => {
  it('los períodos van DEBAJO del riel, en la franja propia de 30 px', () => {
    // Las dos pruebas que miran los períodos verifican su `x` y su texto, así
    // que **subirlos a `h - AXIS_ROW` —el piso del riel, encima de los extremos
    // de las filas más bajas— dejaba las 12 en verde**. El dibujo los centra en
    // y 206.7 sobre 218, o sea h − 11.3.
    const { container } = render(<PlotSlope value={TRES} family="demanda" format={plano} />)

    const periodos = enDim(container)
    expect(periodos).toHaveLength(2)
    for (const p of periodos) {
      expect(num(p, 'y')).toBe(TEST_SIZE.height - 11)
      expect(num(p, 'y')).toBeGreaterThan(PISO)
    }
  })

  it('el rótulo izquierdo TERMINA contra su riel y el derecho ARRANCA en el suyo', () => {
    // La `x` de los dos textos no alcanza: con los dos anclajes invertidos las
    // dos `x` no se mueven —siguen en riel ∓ 14— y el rótulo izquierdo crece
    // hacia la derecha, encima del riel y de los segmentos. **Las 12 pruebas
    // pasaban con el intercambio puesto.** El dibujo mide el BORDE DERECHO del
    // rótulo izquierdo en 136 = riel − 14, y eso es `end`.
    const { container } = render(
      <PlotSlope value={multi([fila('Footwear', 52, 54)])} family="demanda" format={porciento} />,
    )

    const [izquierda, derecha] = enInk(container)
    expect(izquierda?.getAttribute('text-anchor')).toBe('end')
    expect(derecha?.getAttribute('text-anchor')).toBe('start')
  })

  it('un nombre largo se recorta y la cifra sobrevive entera', () => {
    // Sin el recorte el rótulo se sale del panel por la izquierda, y **las 12
    // pruebas pasaban con la condición en `> 999`**. Lo que no se puede recortar
    // nunca es la cifra: un número a medias miente.
    const { container } = render(
      <PlotSlope
        value={multi([fila('Accessories and Footwear Combined', 52, 54)])}
        family="demanda"
        format={porciento}
      />,
    )

    const texto = enInk(container)[0]?.textContent ?? ''
    expect(texto).toContain('…')
    expect(texto.endsWith(' 52%')).toBe(true)
    expect(texto.length).toBeLessThan('Accessories and Footwear Combined 52%'.length)
  })
})
