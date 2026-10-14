// @vitest-environment jsdom

/** El combinado · `combo` sobre `seriesMultiples` · §PEN:Plot/COMBINADO · Inversión y ROAS
 *
 *  **Todos los modos de falla de este gráfico se ven bien.** Con una sola escala
 *  la línea se aplasta contra el piso y quedan columnas impecables; con el eje de
 *  la razón el eje dice 2 · 4 · 6 · 8 al lado de columnas de un millón; con la
 *  cifra máxima en vez de la última la anotación es correcta en cualquier serie
 *  creciente. Ninguna de las tres se nota mirando la pantalla, y las tres cambian
 *  lo que el panel dice. Por eso cada prueba dice con qué mutación se puso roja.
 *
 *  Las afirmaciones se montan contra el plot porque **el cuerpo todavía no lo
 *  despacha**: `SeriesBody` y su `DIBUJA` son archivos compartidos y el cableado
 *  es una fase aparte. Lo que ese cableado no puede romper —el mínimo de dos
 *  series y que `normalizacion` no aplique— lo sostiene hoy la forma de las
 *  props: `columns` y `line` son dos props obligatorias y no un arreglo, así que
 *  «combinado con una sola serie» no es construible y el compilador lo sostiene
 *  en vez de una prueba.
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotBars } from '@/render/plots/PlotBars'
import { PlotCombo } from '@/render/plots/PlotCombo'
import { MARGIN, textWidth } from '@/render/plots/core/axisGeometry'
import { TEST_SIZE } from '../../setup'
import type { Value } from '@/api/types'

/** Un formateador que no abrevia: las aserciones de geometría se leen mejor
 *  contra el número que contra «1,2 M». */
const plano = (v: number) => String(v)

const serie = (etiqueta: string, ts: readonly string[], vs: readonly number[]) => ({
  etiqueta,
  puntos: ts.map((t, i) => ({ t, v: vs[i] ?? 0 })),
})

const MESES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
] as const

/** Inversión en el orden de 1.1M, como el dibujo: doce columnas y la última
 *  1.04M, que es la que la leyenda del `.pen` nombra. */
const INVERSION = serie('Inversión', MESES, [
  800_000, 820_000, 910_000, 1_120_000, 860_000, 790_000,
  840_000, 880_000, 950_000, 980_000, 1_000_000, 1_040_000,
])

/** El ROAS, **con el pico en el medio y 4.1 al final**: es lo que hace que
 *  «anotar el máximo» no pueda pasar por «anotar el último». */
const ROAS = serie('ROAS', MESES, [4.2, 4, 4.5, 3.8, 3.2, 6.67, 4.1, 3.5, 2.9, 3.2, 2.9, 4.1])

/** El baseline, en coordenadas del grupo trasladado: `y(0)`. */
const BASE = TEST_SIZE.height - MARGIN.t - MARGIN.b

const num = (el: Element, a: string) => Number(el.getAttribute(a))

const rects = (c: HTMLElement) => Array.from(c.querySelectorAll('rect'))
const puntos = (c: HTMLElement) => Array.from(c.querySelectorAll('circle'))
const linea = (c: HTMLElement) => c.querySelector('svg path')

const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const enDim = (c: HTMLElement) => textos(c).filter((t) => t.style.fill === 'var(--color-dim)')
/** La cifra anotada es la única en `ink`. */
const enInk = (c: HTMLElement) => textos(c).filter((t) => t.style.fill === 'var(--color-ink)')
/** Los rótulos del eje de valores · anclados al final. */
const valores = (c: HTMLElement) => enDim(c).filter((t) => t.getAttribute('text-anchor') === 'end')
/** Los del eje de categorías · centrados en su banda. */
const categorias = (c: HTMLElement) =>
  enDim(c).filter((t) => t.getAttribute('text-anchor') === 'middle')
/** La etiqueta de la serie de línea · el único `dim` anclado al principio. */
const nombreDeLinea = (c: HTMLElement) =>
  enDim(c).filter((t) => t.getAttribute('text-anchor') === 'start')

/** La reserva izquierda, leída del render en vez de recalculada: el eje de
 *  valores se dibuja en `reserve - 6` y su grupo no traslada la `x`. */
const reserva = (c: HTMLElement) => num(valores(c)[0] as Element, 'x') + 6

describe('dos escalas y no una · el modo de falla que se ve perfecto', () => {
  it('la línea usa su propio techo y no se aplasta contra la base', () => {
    // MUTACIÓN: pasarle a la línea la escala `y` de las columnas. Un ROAS de 4
    // sobre un techo de 1.5M cae a 0.0007px de la base y el gráfico queda siendo
    // sólo columnas — que es exactamente el modo de falla plausible.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    expect(puntos(container)).toHaveLength(12)
    for (const p of puntos(container)) {
      expect(Math.abs(num(p, 'cy') - BASE)).toBeGreaterThan(BASE * 0.2)
    }
  })

  it('el eje rotula las COLUMNAS, no la razón', () => {
    // MUTACIÓN: armar `ValueAxis` con la escala de la razón — el eje pasa a
    // decir 2 · 4 · 6 · 8 al lado de columnas de un millón.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    const rotulos = valores(container).map((t) => t.textContent ?? '')
    expect(rotulos.some((r) => Number(r) >= 1e6)).toBe(true)
    // El techo de la razón es 8 —`ceiling([6.67])`, el mismo del dibujo— y
    // ninguno de sus ticks puede aparecer en el eje.
    expect(rotulos).not.toContain('8')
    expect(rotulos).not.toContain('4')
  })

  it('las dos escalas arrancan en cero · la base es común', () => {
    // MUTACIÓN: `[Math.min(...valores), ceiling(...)]` para la razón. Es el
    // defecto que `envelope` existe para los intervalos y que acá sería falso:
    // un ROAS que se movió entre 3 y 4 se dibujaría ocupando el alto entero, y
    // la línea contaría una variación que el dato no tiene.
    const { container } = render(
      <PlotCombo
        columns={serie('Inversión', ['ENE', 'FEB'], [1_000_000, 500_000])}
        line={serie('ROAS', ['ENE', 'FEB'], [3, 4])}
        family="demanda"
        format={plano}
      />,
    )

    // Las columnas, sobre `y(0)`.
    for (const r of rects(container)) {
      expect(num(r, 'y') + num(r, 'height')).toBeCloseTo(BASE, 6)
    }

    // El techo de la razón es `ceiling([3, 4])` = 4, así que el 3 cae a tres
    // cuartos del alto y el 4 en el techo. Con el dominio arrancando en el
    // mínimo, el 3 se iría a la base.
    expect(num(puntos(container)[0] as Element, 'cy')).toBeCloseTo(BASE * 0.25, 1)
    expect(num(puntos(container)[1] as Element, 'cy')).toBeCloseTo(0, 1)
  })

  it('una razón nula cae en la base, no fuera del área', () => {
    const { container } = render(
      <PlotCombo
        columns={serie('Inversión', ['ENE', 'FEB'], [1_000_000, 500_000])}
        line={serie('ROAS', ['ENE', 'FEB'], [0, 4])}
        family="demanda"
        format={plano}
      />,
    )

    expect(num(puntos(container)[0] as Element, 'cy')).toBeCloseTo(BASE, 6)
  })
})

describe('la geometría · la línea se apoya en la columna', () => {
  it('el primer punto cae en el CENTRO de la primera columna', () => {
    // MUTACIÓN: usar `linearScale([0, n−1], [0, width])` como hace `PlotSeries`
    // — el primer punto se va a x 0 y la primera columna queda con su punto
    // colgando medio ancho de banda a la izquierda.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    const primera = rects(container)[0] as Element
    const centro = num(primera, 'x') + num(primera, 'width') / 2
    expect(num(puntos(container)[0] as Element, 'cx')).toBeCloseTo(centro, 1)

    // Y el último, que es donde el error de medio paso se acumula al revés.
    const ultima = rects(container)[11] as Element
    const centroUltimo = num(ultima, 'x') + num(ultima, 'width') / 2
    expect(num(puntos(container)[11] as Element, 'cx')).toBeCloseTo(centroUltimo, 1)
  })

  it('el trazo pasa por sus propios puntos', () => {
    // MUTACIÓN: pasarle a `Line` la escala de las columnas y dejar `Dots` con la
    // de la razón. **Es la que sobrevivió al primer intento**: las otras pruebas
    // miran los `<circle>`, así que el trazo quedaba sin cubrir y el gráfico
    // dibujaba doce puntos correctos unidos por una línea pegada a la base.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    const d = (linea(container) as Element).getAttribute('d') ?? ''
    const vertices = d
      .split(/[ML]/)
      .filter((s) => s.trim() !== '')
      .map((s) => s.split(',').map(Number) as [number, number])

    expect(vertices).toHaveLength(12)
    vertices.forEach(([px, py], i) => {
      const p = puntos(container)[i] as Element
      expect(px).toBeCloseTo(num(p, 'cx'), 6)
      expect(py).toBeCloseTo(num(p, 'cy'), 6)
    })
  })

  it('la columna ocupa 0.6 del paso, que es el hueco por donde se lee la línea', () => {
    // MUTACIÓN: dejar el `padding` por defecto de `bandScale` (0.2) — las
    // columnas se tocan y la línea se pierde encima de ellas.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    const xs = rects(container).map((r) => num(r, 'x'))
    const paso = (xs[1] ?? 0) - (xs[0] ?? 0)
    expect(paso).toBeGreaterThan(0)
    for (const r of rects(container)) {
      expect(num(r, 'width') / paso).toBeCloseTo(0.6, 2)
    }
  })
})

describe('la anotación · el último punto, y nunca desnudo', () => {
  it('la cifra es la ÚLTIMA, no la máxima', () => {
    // MUTACIÓN: `Math.max(...puntos.map((p) => p.v))` — sobrevive a cualquier
    // fixture donde el último sea el máximo, y por eso el pico va en el medio.
    const { container } = render(
      <PlotCombo
        columns={serie('Inversión', ['ENE', 'FEB', 'MAR'], [1_000_000, 1_000_000, 1_040_000])}
        line={serie('ROAS', ['ENE', 'FEB', 'MAR'], [3, 9, 4.1])}
        family="demanda"
        format={plano}
      />,
    )

    expect(enInk(container).map((t) => t.textContent)).toEqual(['4.1'])
    expect(textos(container).map((t) => t.textContent)).not.toContain('9')
  })

  it('la cifra se formatea con `format` · el locale es del tenant', () => {
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={(v) => `«${v}»`} />,
    )

    expect(enInk(container).map((t) => t.textContent)).toEqual(['«4.1»'])
  })

  it('la cifra va con el NOMBRE de la serie, en mayúsculas', () => {
    // Regla dura: ningún número desnudo. El `Legend Item` del dibujo no existe
    // en `src/`, así que la línea se nombra acá o no se nombra en ninguna parte.
    // DOS MUTACIONES: borrar el `<AxisText>` (queda un número solo), o escribir
    // `'ROAS'` literal (la segunda mitad se pone roja).
    const roas = render(<PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />)
    expect(nombreDeLinea(roas.container).map((t) => t.textContent)).toEqual(['ROAS'])

    const margen = render(
      <PlotCombo
        columns={INVERSION}
        line={{ ...ROAS, etiqueta: 'Margen' }}
        family="demanda"
        format={plano}
      />,
    )
    expect(nombreDeLinea(margen.container).map((t) => t.textContent)).toEqual(['MARGEN'])
  })

  it('la cifra se alinea con el último punto de la LÍNEA', () => {
    // Si la anotación saliera de la escala de las columnas, la cifra flotaría
    // lejos del punto que describe y el lector la leería contra el eje
    // equivocado.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    const cifra = enInk(container)[0] as Element
    const ultimo = puntos(container)[11] as Element
    expect(num(cifra, 'y')).toBeCloseTo(num(ultimo, 'cy'), 1)
    expect(num(cifra, 'x')).toBeGreaterThan(num(ultimo, 'cx'))
  })

  it('la anotación no se sale del SVG', () => {
    // MUTACIÓN: reservar `MARGIN.r` (8) a la derecha en vez del ancho del texto
    // — con «1.234» la cifra se corta contra el borde, y la prueba lo ve sin
    // mirar píxeles.
    const { container } = render(
      <PlotCombo
        columns={INVERSION}
        line={serie('ROAS', MESES, [4.2, 4, 4.5, 3.8, 3.2, 6.67, 4.1, 3.5, 2.9, 3.2, 2.9, 1.234])}
        family="demanda"
        format={plano}
      />,
    )

    const svg = container.querySelector('svg') as Element
    const ancho = num(svg, 'width')
    const cifra = enInk(container)[0] as Element
    const contenido = cifra.textContent ?? ''
    expect(contenido).toBe('1.234')
    expect(reserva(container) + num(cifra, 'x') + textWidth(contenido.length, 11)).toBeLessThanOrEqual(
      ancho,
    )

    // Y el nombre, que es más largo que la cifra, tampoco.
    const nombre = nombreDeLinea(container)[0] as Element
    expect(
      reserva(container) + num(nombre, 'x') + textWidth((nombre.textContent ?? '').length),
    ).toBeLessThanOrEqual(ancho)
  })
})

describe('el eje de categorías · ralo, y con el último siempre puesto', () => {
  it('cinco rótulos de doce, en las bandas 1, 4, 7, 10 y 12', () => {
    // DOS MUTACIONES: sacar el «más la última» (quedan cuatro y el mes que
    // cierra el período desaparece, que es el que más se mira), o sacar el ralo
    // entero (quedan doce, y a colSpan 5 se pisan).
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    expect(categorias(container).map((t) => t.textContent)).toEqual([
      'ENE',
      'ABR',
      'JUL',
      'OCT',
      'DIC',
    ])

    // Y cada uno centrado en SU banda: el ralo no puede desalinear el rótulo de
    // su columna, que es lo que pasa si se recorta la escala en vez del dominio.
    const centros = [0, 3, 6, 9, 11].map((i) => {
      const r = rects(container)[i] as Element
      return num(r, 'x') + num(r, 'width') / 2
    })
    expect(categorias(container).map((t) => num(t, 'x'))).toEqual(centros)
  })
})

describe('la tinta · dos escalones de UNA familia, la que llega por prop', () => {
  it('las columnas y la línea no comparten escalón, y la familia es la que llegó', () => {
    // DOS MUTACIONES: darles el mismo `step` (el combinado pasa a ser un bloque
    // de un color donde no se distingue qué es qué), o cablear `medios`/`demanda`
    // como los pinta el dibujo (con `family="cliente"` no aparecería
    // `fam-cliente` en ningún lado).
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="cliente" format={plano} />,
    )

    const relleno = (rects(container)[0] as Element).getAttribute('fill')
    const trazo = (linea(container) as Element).getAttribute('stroke')

    expect(relleno).toBe('var(--color-fam-cliente-2)')
    expect(trazo).toBe('var(--color-fam-cliente-1)')
    expect(relleno).not.toBe(trazo)
    // Los puntos siguen a la línea, no a las columnas.
    expect((puntos(container)[0] as Element).getAttribute('fill')).toBe(trazo)
  })

  it('las columnas van al 0.7 y `PlotBars` sigue opaco', () => {
    // MUTACIÓN: poner el 0.7 como default en la primitiva — la segunda mitad se
    // pone roja, y es lo que impide que un cambio de primitiva se filtre a un
    // plot que ya estaba.
    const combo = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )
    expect(combo.container.querySelectorAll('g[fill-opacity="0.7"] rect')).toHaveLength(12)

    const categorica = {
      forma: 'categorica',
      items: [
        { etiqueta: 'A', v: 9 },
        { etiqueta: 'B', v: 4 },
      ],
    } as unknown as Extract<Value, { forma: 'categorica' }>
    const barras = render(<PlotBars value={categorica} family="demanda" format={plano} />)

    for (const r of rects(barras.container)) {
      expect(r.getAttribute('fill-opacity')).toBeNull()
      expect(r.closest('[fill-opacity]')).toBeNull()
    }
  })

  it('ningún literal, ningún `acc`', () => {
    // El naranja no es color de datos: nunca en una serie, barra, celda o nodo.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    const tintas: string[] = []
    for (const el of Array.from(container.querySelectorAll('svg *'))) {
      for (const a of ['fill', 'stroke']) {
        const v = el.getAttribute(a)
        if (v !== null) tintas.push(v)
      }
      const fill = (el as unknown as { style?: CSSStyleDeclaration }).style?.fill
      if (fill !== undefined && fill !== '') tintas.push(fill)
    }

    expect(tintas.length).toBeGreaterThan(0)
    for (const t of tintas) {
      expect(t).toMatch(/^(none|var\(--color-[a-z0-9-]+\))$/)
      expect(t).not.toContain('acc')
    }
  })
})

describe('el nombre accesible dice que es un combinado', () => {
  it('nombra las dos series y qué rol tiene cada una', () => {
    // Es lo que va a distinguir el combinado del «2 series» de `PlotSeries`
    // cuando el cuerpo lo despache: sin eso, la prueba del cableado no puede
    // notar que la rama se cayó al dibujo por defecto.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'Combinado · Inversión en columnas y ROAS en línea',
    )
  })
})

/* ── AGREGADO POR QA · 2026-09-29 ────────────────────────────────────────────
 *
 * Cuatro garantías que el gráfico declara y que ninguna prueba sostenía: las
 * encontró la mutación, no la lectura. Cada una dice qué mutación sobrevivía.
 */

describe('el techo redondea hacia arriba · las dos escalas', () => {
  it('la columna más alta no toca el borde, y el eje rotula el techo redondeado', () => {
    // MUTACIÓN QUE SOBREVIVÍA: `Math.max(...items)` en vez de `ceiling(items)`.
    // El eje seguía diciendo un número ≥ 1e6 y ningún tick de la razón, así que
    // las dos pruebas del eje pasaban — con la columna más alta cortada contra
    // el borde, que es el defecto que `ceiling` existe para evitar.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    // El máximo del dato es 1.12M y el techo es 1.5M: `ceiling` sube al tick.
    expect(valores(container).map((t) => t.textContent)).toContain('1500000')
    const ys = rects(container).map((r) => num(r, 'y'))
    expect(Math.min(...ys)).toBeGreaterThan(0)
    // Y la más alta queda exactamente donde 1.12M sobre techo 1.5M la pone.
    expect(Math.min(...ys)).toBeCloseTo(BASE * (1 - 1_120_000 / 1_500_000), 6)
  })

  it('la razón también redondea · el 4.1 del dibujo cae sobre dominio [0, 8]', () => {
    // MUTACIÓN QUE SOBREVIVÍA: `Math.max(...line.puntos)` para la escala de la
    // razón. La prueba de «las dos arrancan en cero» usa [3, 4], donde `ceiling`
    // y `max` coinciden en 4, así que no podía notarlo — y con `max` el pico de
    // 6.67 queda con `cy` 0, medio punto cortado contra el techo.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    // `ceiling([… 6.67 …])` es 8, que es el techo que el dibujo midió: con él
    // (176 − 94) / 160 × 8 da el 4.1 anotado.
    expect(num(puntos(container)[11] as Element, 'cy')).toBeCloseTo(BASE * (1 - 4.1 / 8), 6)
    expect(num(puntos(container)[5] as Element, 'cy')).toBeCloseTo(BASE * (1 - 6.67 / 8), 6)
    expect(num(puntos(container)[5] as Element, 'cy')).toBeGreaterThan(0)
  })
})

describe('la anotación tampoco se sale por ARRIBA', () => {
  it('con el último punto contra el techo, la etiqueta sigue dentro del área', () => {
    // MUTACIÓN QUE SOBREVIVÍA: sacar el clampeo de `anclaY`. Es una desviación
    // DECLARADA del componente —«se clampea la y del par»— y no tenía prueba:
    // los doce fixtures anteriores terminan lejos del techo. Con el último punto
    // en el techo el nombre se dibuja en y −11 y se sale del SVG.
    const { container } = render(
      <PlotCombo
        columns={serie('Inversión', ['ENE', 'FEB'], [1_000_000, 500_000])}
        line={serie('ROAS', ['ENE', 'FEB'], [1, 8])}
        family="demanda"
        format={plano}
      />,
    )

    // El punto SÍ está contra el techo: es la condición que dispara el caso.
    expect(num(puntos(container)[1] as Element, 'cy')).toBeCloseTo(0, 6)

    const nombre = nombreDeLinea(container)[0] as Element
    const cifra = enInk(container)[0] as Element
    // En coordenadas del grupo, que ya está trasladado `MARGIN.t`.
    expect(num(nombre, 'y')).toBeGreaterThanOrEqual(0)
    expect(num(cifra, 'y')).toBeGreaterThan(num(nombre, 'y'))
    expect(num(cifra, 'y')).toBeLessThanOrEqual(BASE)
  })
})

describe('la rejilla y el eje de valores comparten escala', () => {
  it('cada rótulo cae sobre una línea de la rejilla', () => {
    // MUTACIÓN QUE SOBREVIVÍA: `<Grid scale={yLinea}>`. La rejilla pasa a marcar
    // los ticks de la razón mientras el eje rotula los de las columnas, así que
    // los números flotan entre líneas y cada uno miente sobre qué altura marca.
    // Ninguna prueba cruzaba las dos, porque las dos salen bien por separado.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    const rejilla = Array.from(container.querySelectorAll('line')).map((l) => num(l, 'y1'))
    expect(rejilla.length).toBeGreaterThan(1)
    const rotulos = valores(container).map((t) => num(t, 'y'))
    expect(rotulos).toHaveLength(rejilla.length)
    for (const y of rotulos) {
      expect(rejilla.some((g) => Math.abs(g - y) < 1e-6)).toBe(true)
    }
  })
})

describe('los rótulos de categoría no pisan las columnas', () => {
  it('caen debajo del área de dibujo y dentro del SVG', () => {
    // MUTACIÓN QUE SOBREVIVÍA: `at={height}` en vez de `height + 12`. Los meses
    // se dibujan sobre la base, solapados con el pie de las doce columnas. La
    // prueba del ralo mira QUÉ dice cada rótulo y su `x`, nunca su `y`.
    const { container } = render(
      <PlotCombo columns={INVERSION} line={ROAS} family="demanda" format={plano} />,
    )

    const alto = num(container.querySelector('svg') as Element, 'height')
    expect(categorias(container)).toHaveLength(5)
    for (const t of categorias(container)) {
      expect(num(t, 'y')).toBeGreaterThan(BASE)
      expect(num(t, 'y') + MARGIN.t).toBeLessThanOrEqual(alto)
    }
  })
})
