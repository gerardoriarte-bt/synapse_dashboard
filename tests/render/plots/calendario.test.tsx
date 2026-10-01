// @vitest-environment jsdom

/** El calendario de actividad · `calendar` · §PEN:Plot/CALENDARIO · Actividad diaria
 *
 *  **Lo que estas pruebas tienen que impedir es que el calendario SEA el mapa de
 *  calor con otro nombre**, porque los dos hospedan `matriz`, comparten la
 *  rejilla y uno se puede escribir copiando al otro en diez minutos. De las 84
 *  celdas del frame y sus doce textos salen cinco diferencias que se ven en el
 *  dibujo y ninguna la ve el compilador: la rampa tiene SIETE niveles y no ocho,
 *  el eje de semanas va ABAJO y raleado cada tres, la canaleta mide 46 y no 62,
 *  **ninguna celda lleva cifra**, y la leyenda dice «DÍA» porque la celda es un
 *  día. Un calendario que falle las cinco se ve perfecto.
 *
 *  La primera prueba es aritmética pura sobre `levels()` —la función la importa
 *  de `PlotHeatmap` mientras `core/matrix.ts` no exista, y el `n` es lo que
 *  cambia— por la misma razón que la del treemap lo es sobre `squarify`: una
 *  rejilla se ve igual de prolija cuantizando bien y cuantizando mal.
 */
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlotCalendar } from '@/render/plots/PlotCalendar'
import { levels } from '@/render/plots/PlotHeatmap'
import { MARGIN, textWidth } from '@/render/plots/core/axisGeometry'
import { _resetObserver } from '@/render/plots/core/useSize'
import { createFormat } from '@/render/format'
import type { Family, Value } from '@/api/types'

const format = createFormat('es-MX')
const number = (v: number) => format.number(v, { abbreviate: true })

/** Los rótulos del frame, tal cual: los días de UNA letra —con sus dos `M`
 *  ambiguas, que están dibujadas así— y doce semanas `S21`…`S32`. */
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const SEMANAS = Array.from({ length: 12 }, (_, i) => `S${21 + i}`)

/** La caja del frame. Las aserciones de geometría clavada se miden acá y no en el
 *  600 × 300 que informa el doble de `tests/setup.ts`: los nodos que el dibujo da
 *  son los de este tamaño. */
const FRAME = { width: 340, height: 232 }

/** Los números medidos sobre el frame, que el componente tiene que reproducir. */
const RESERVE = 46 // la canaleta de rótulos de día
const LABEL_END = 32 // donde termina el texto del día
const GAP = 4 // entre celdas, en los DOS ejes
const LABEL_GAP = 14 // entre el texto del día y la celda
const RADIO = 2 // `cornerRadius` de las 84
const ROTULOS_DE_SEMANA = 4 // `S21`, `S24`, `S27`, `S30`
const EVERY = 3 // una cada tres columnas, arrancando en la primera
const BORDE = 11 // del último texto al borde inferior del frame
const LEYENDA_DY = 20 // el renglón que la leyenda le saca a la rejilla

/** Los siete pares del frame, en el orden en que son monótonos en intensidad. */
const RAMPA_ESPERADA = [
  'var(--color-fam-demanda-0)/0.5',
  'var(--color-fam-demanda-1)/0.6',
  'var(--color-fam-demanda-1)/0.7',
  'var(--color-fam-demanda-1)/0.8',
  'var(--color-fam-demanda-2)/0.8',
  'var(--color-fam-demanda-2)/0.9',
  'var(--color-fam-demanda-2)/1',
]

/** El literal del frame, verbatim. Lleva «DÍA». */
const LEYENDA = 'CONTORNO SIN RELLENO = DÍA SIN DATO CARGADO'

/** La variante DERIVADA que escribió `PlotHeatmap` para sus horas. Acá no va, y
 *  es exactamente lo que se cuela reusando el archivo hermano. */
const LEYENDA_DEL_HEATMAP = 'CONTORNO SIN RELLENO = SIN DATO CARGADO'

const matriz = (
  filas: readonly string[],
  columnas: readonly string[],
  celdas: readonly (readonly (number | null)[])[],
) => ({ forma: 'matriz', filas, columnas, celdas }) as Extract<Value, { forma: 'matriz' }>

const rects = (c: HTMLElement) => Array.from(c.querySelectorAll('rect'))
const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const num = (el: Element, a: string) => Number.parseFloat(el.getAttribute(a) ?? 'NaN')
const par = (r: Element) => `${r.getAttribute('fill')}/${r.getAttribute('fill-opacity') ?? '—'}`

/** Los rótulos de día son los que van alineados a la derecha; los de semana, los
 *  centrados. Es lo que los distingue sin agregarle al componente un atributo que
 *  existe sólo para la prueba. */
const dias = (c: HTMLElement) => textos(c).filter((t) => t.getAttribute('text-anchor') === 'end')
const semanas = (c: HTMLElement) =>
  textos(c).filter(
    (t) => t.getAttribute('text-anchor') === 'middle' && (t.textContent ?? '') !== LEYENDA,
  )

/** Una rejilla con gradiente creciente por columna: la fila `r` y la columna `c`
 *  valen `1000 · (c + 1) + 10 · r`, o sea que las semanas de la derecha son las
 *  activas. */
const GRADIENTE = DIAS.map((_, r) => SEMANAS.map((__, c) => 1000 * (c + 1) + 10 * r))

/** Renderiza contra un tamaño distinto del 600 × 300 del doble de
 *  `tests/setup.ts`. Es el patrón de `core/useSize.test.tsx` y de
 *  `lollipop.test.tsx`: el observer es un singleton de módulo, así que hay que
 *  reiniciarlo para que tome el doble nuevo. */
const drawAt = (
  size: { width: number; height: number },
  value: Extract<Value, { forma: 'matriz' }>,
  family: Family = 'demanda',
) => {
  _resetObserver()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly cb: ResizeObserverCallback
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb
      }
      observe(target: Element): void {
        this.cb(
          [{ target, contentRect: size } as unknown as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        )
      }
      unobserve(): void {}
      disconnect(): void {}
    },
  )
  return render(<PlotCalendar value={value} family={family} format={number} />)
}

afterEach(() => {
  _resetObserver()
  vi.unstubAllGlobals()
})

/* ══ La cuantización, sin montar un SVG ══════════════════════════════════════ */

describe('`levels` con los SIETE niveles del calendario', () => {
  it('el mínimo da 0, el máximo da 6, y el orden se respeta', () => {
    // **Valores NO equiespaciados y con el mínimo LEJOS de cero**, que es lo que
    // hace fallar el dominio anclado en cero: con `[0, max]` el 150 caería en el
    // nivel 5 en vez del 0.
    const nv = levels([[150, 160, 175, 200]], 7)[0] as (number | null)[]

    expect(nv[0]).toBe(0)
    // Y no 7: sin el `Math.min(n - 1, …)` el máximo da índice 7, `RAMPA[7]` es
    // `undefined` y la celda se pinta **sin color y sin error**.
    expect(nv[3]).toBe(6)
    for (let i = 1; i < nv.length; i++) {
      expect(nv[i] as number).toBeGreaterThanOrEqual(nv[i - 1] as number)
    }
  })

  it('con un solo valor distinto nadie es el más activo: todas al nivel medio', () => {
    // Mandarlas a un extremo afirma un piso o un techo que el dato no tiene, y
    // sin la rama la división por `max - min` da `NaN` y una celda sin opacidad.
    const nv = levels(
      [
        [500, 500],
        [500, null],
      ],
      7,
    )

    expect(nv[0]).toEqual([3, 3])
    expect(nv[1]).toEqual([3, null])
  })
})

/* ══ La rampa ════════════════════════════════════════════════════════════════ */

describe('la rampa son SIETE pares y no los ocho del heatmap', () => {
  it('siete valores crecientes dan los siete pares del frame, en ese orden', () => {
    // Si la rampa fuera la del heatmap, el mínimo saldría a 0.4 —que este frame
    // no dibuja nunca— y los seis siguientes se correrían.
    const { container } = drawAt(
      FRAME,
      matriz(['L'], ['s1', 's2', 's3', 's4', 's5', 's6', 's7'], [
        [100, 200, 300, 400, 500, 600, 700],
      ]),
    )

    expect(rects(container).map(par)).toEqual(RAMPA_ESPERADA)
  })

  it('los dos 0.8 se distinguen por ESCALÓN · la escalera no se aplana en el medio', () => {
    // Es la única razón por la que el cuarto y el quinto nivel se leen distinto.
    expect(RAMPA_ESPERADA[3]).toContain('demanda-1')
    expect(RAMPA_ESPERADA[4]).toContain('demanda-2')
    expect(new Set(RAMPA_ESPERADA).size).toBe(RAMPA_ESPERADA.length)
  })
})

/* ══ El color ════════════════════════════════════════════════════════════════ */

describe('el color sale de la familia que llegó por prop', () => {
  it('ni `acc`, ni ámbar, ni un hex literal · y la familia es la de la prop', () => {
    const { container } = drawAt(FRAME, matriz(DIAS, SEMANAS, GRADIENTE), 'medios')
    const fills = rects(container).map((r) => r.getAttribute('fill') ?? '')

    expect(fills.length).toBe(84)
    for (const fill of fills) {
      expect(fill).toMatch(/^var\(--color-fam-medios-[012]\)$/)
    }
    // El naranja no es color de datos, y ámbar y amarillo están prohibidos.
    expect(container.innerHTML).not.toContain('--color-acc')
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}/)
    expect(container.innerHTML).not.toMatch(/amber|amarillo|yellow/i)
  })
})

/* ══ `null` es «no hay dato», no cero ════════════════════════════════════════ */

describe('`null` no es cero · lo que el contrato encabeza', () => {
  it('sale como contorno sin relleno y no corre la escala de las demás', () => {
    const sinHueco = matriz(['L'], ['s1', 's2', 's3'], [[100, 200, 300]])
    const conHueco = matriz(['L'], ['s1', 's2', 's3', 's4'], [[100, 200, 300, null]])

    const a = drawAt(FRAME, sinHueco)
    const paresSinHueco = rects(a.container).map(par)
    a.unmount()

    const { container } = drawAt(FRAME, conHueco)
    const celdas = rects(container)
    const vacia = celdas[3] as Element

    expect(vacia.getAttribute('fill')).toBe('none')
    expect(vacia.getAttribute('stroke')).toBe('var(--color-c-grid)')
    expect(vacia.getAttribute('stroke-width')).toBe('1')
    // Y el hueco queda FUERA del rango: con `v = 0` en vez de `continue` entraría
    // como el peor valor de la escala y correría todos los demás niveles.
    expect(celdas.slice(0, 3).map(par)).toEqual(paresSinHueco)
  })

  it('la leyenda es la del frame, verbatim, y sólo cuando hay un hueco', () => {
    const con = drawAt(FRAME, matriz(['L'], ['s1', 's2'], [[100, null]]))
    expect(con.container.textContent).toContain(LEYENDA)

    // **Centrada, que NO es donde el frame la pone** —x = 24.4 de 340, que no
    // coincide con la rejilla, ni con la canaleta, ni con el centro óptico—. Es
    // la única regla que degrada parejo con un literal de largo fijo, y la
    // divergencia de 6,3px queda declarada en la cabecera del componente.
    const rotulo = textos(con.container).find((t) => t.textContent === LEYENDA) as Element
    expect(rotulo.getAttribute('text-anchor')).toBe('middle')
    expect(num(rotulo, 'x')).toBeCloseTo(FRAME.width / 2, 6)
    // La variante del heatmap se cae el sustantivo porque su celda es una hora.
    // Acá la celda ES un día: reusar su literal es el error del archivo hermano.
    expect(con.container.textContent).not.toContain(LEYENDA_DEL_HEATMAP)
    con.unmount()

    // Un rótulo que explica un hueco que no existe es ruido.
    const sin = drawAt(FRAME, matriz(['L'], ['s1', 's2'], [[100, 200]]))
    expect(sin.container.textContent).not.toContain('SIN DATO CARGADO')
  })
})

/* ══ Ninguna cifra dentro de ninguna celda ═══════════════════════════════════ */

describe('ninguna celda lleva cifra · la diferencia que impide «reusar» el heatmap', () => {
  it('con una caja holgada los únicos textos son los rótulos y nada más', () => {
    // 900 × 400: celdas de ~70 × 50, donde una cifra mono 10 entra de sobra.
    const { container } = drawAt({ width: 900, height: 400 }, matriz(DIAS, SEMANAS, GRADIENTE))

    // Los textos del heatmap van en mono 10; los rótulos, en mono 9.
    expect(textos(container).filter((t) => t.getAttribute('style')?.includes('font-size: 10px'))).toHaveLength(0)
    expect(textos(container)).toHaveLength(DIAS.length + ROTULOS_DE_SEMANA)

    // Y ninguno es una cifra formateada: traer la rama `conCifra` del hermano
    // pondría `12K` sobre las celdas de las últimas semanas.
    for (const t of textos(container)) {
      expect(t.textContent ?? '').not.toMatch(/^[\d.,]+[KM]?$/)
    }
  })
})

/* ══ El eje de semanas ═══════════════════════════════════════════════════════ */

describe('el eje de semanas va DEBAJO de la rejilla, raleado cada 3, desde la columna 0', () => {
  it('cuatro rótulos, los de las columnas 0, 3, 6 y 9, centrados en su celda', () => {
    const { container } = drawAt(FRAME, matriz(DIAS, SEMANAS, GRADIENTE))
    const ejes = semanas(container)

    expect(ejes).toHaveLength(ROTULOS_DE_SEMANA)
    expect(ejes.map((t) => t.textContent)).toEqual(['S21', 'S24', 'S27', 'S30'])

    // Centrado en SU columna: con `n % every === 1` cada rótulo queda bajo otra
    // columna y nada se ve raro.
    const celdas = rects(container)
    for (const [i, t] of ejes.entries()) {
      const celda = celdas[i * EVERY] as Element // primera fila, columna 0/3/6/9
      expect(num(t, 'x')).toBeCloseTo(num(celda, 'x') + num(celda, 'width') / 2, 6)
    }
  })

  it('su `y` cae por DEBAJO del borde inferior de la última fila', () => {
    const { container } = drawAt(FRAME, matriz(DIAS, SEMANAS, GRADIENTE))
    const celdas = rects(container)
    const ultima = celdas[celdas.length - 1] as Element
    const pie = num(ultima, 'y') + num(ultima, 'height')

    // Copiar el `HEADER - AXIS_DY` del heatmap lo pondría arriba de la primera.
    for (const t of semanas(container)) {
      expect(num(t, 'y')).toBeGreaterThan(pie)
    }
    expect(num(celdas[0] as Element, 'y')).toBeCloseTo(MARGIN.t, 6)
  })
})

describe('el raleado crece con el rótulo y con el ancho, y tiene piso 3', () => {
  it('con los rótulos de tres caracteres del frame se queda en el piso · 4 y no 6', () => {
    // Sin el `Math.max(3, …)` el término del ancho da 2 al tamaño del frame y
    // salen seis rótulos, que el frame no dibuja.
    const { container } = drawAt(FRAME, matriz(DIAS, SEMANAS, GRADIENTE))
    expect(semanas(container)).toHaveLength(ROTULOS_DE_SEMANA)
  })

  it('con un rótulo más largo el término del ancho SUBE el raleado', () => {
    // El umbral está medido: a 340 de ancho el paso es 23,83, así que el término
    // del ancho sólo pasa de 3 cuando `textWidth(n, 9) + 8 > 3 · 23,83`, o sea
    // desde DIEZ caracteres. Con nueve —`SEMANA 21`— todavía da 3, de modo que un
    // fixture de nueve no distinguiría las dos implementaciones.
    const paso = (340 - RESERVE - MARGIN.r) / 12
    expect(textWidth(9, 9) + 8).toBeLessThan(3 * paso)
    expect(textWidth(11, 9) + 8).toBeGreaterThan(3 * paso)

    const largas = SEMANAS.map((s) => `${s} · JUNIO`) // once caracteres
    const { container } = drawAt(FRAME, matriz(DIAS, largas, GRADIENTE))

    // Quitar el término del ancho y dejar el 3 fijo deja cuatro rótulos de 71px
    // sobre celdas de 20 y se solapan tres.
    expect(semanas(container).length).toBeLessThan(ROTULOS_DE_SEMANA)
  })
})

/* ══ La geometría del frame ══════════════════════════════════════════════════ */

describe('la geometría del frame llega al SVG · GAP 4, radio 2, canaleta 46', () => {
  it('cuatro píxeles entre vecinas en los DOS ejes, y `rx` 2 en las 84', () => {
    const { container } = drawAt(FRAME, matriz(DIAS, SEMANAS, GRADIENTE))
    const celdas = rects(container)

    expect(celdas).toHaveLength(84)
    for (const celda of celdas) expect(num(celda, 'rx')).toBe(RADIO)

    // Las celdas se emiten por fila: la vecina de la derecha es la siguiente, la
    // de abajo está doce más adelante.
    const a = celdas[0] as Element
    const derecha = celdas[1] as Element
    const abajo = celdas[SEMANAS.length] as Element

    expect(num(derecha, 'x') - (num(a, 'x') + num(a, 'width'))).toBeCloseTo(GAP, 6)
    expect(num(abajo, 'y') - (num(a, 'y') + num(a, 'height'))).toBeCloseTo(GAP, 6)
  })

  it('con rótulos de una letra la rejilla arranca en 46 y el texto termina en 32', () => {
    const { container } = drawAt(FRAME, matriz(DIAS, SEMANAS, GRADIENTE))

    // Con el `LABEL_MIN` de 50 del heatmap la canaleta saldría 64 y la rejilla
    // entera quedaría corrida.
    expect(num(rects(container)[0] as Element, 'x')).toBeCloseTo(RESERVE, 6)
    for (const t of dias(container)) {
      expect(num(t, 'x')).toBeCloseTo(LABEL_END, 6)
    }
  })
})

/* ══ La cola bajo la rejilla ═════════════════════════════════════════════════ */

describe('la leyenda OCUPA renglón: la cola bajo la rejilla depende de que esté', () => {
  it('con hueco la leyenda cae DENTRO de los 232 y a 11 del borde · sin hueco la cola se achica', () => {
    // **Lo encontró una mutación que sobrevivió.** Sacar `LEYENDA_DY` de la cola
    // deja la rejilla 20px más alta y manda la leyenda a y = 241 de 232: el
    // navegador la recorta y **el panel se ve sin leyenda mientras hay celdas sin
    // dato**. Ninguna aserción lo veía porque `textContent` de jsdom no recorta
    // nada — el literal sigue estando en el DOM, fuera de la caja.
    const con = drawAt(FRAME, matriz(DIAS, SEMANAS, [
      ...GRADIENTE.slice(0, 6),
      [...(GRADIENTE[6] as number[]).slice(0, 11), null],
    ]))
    const leyenda = textos(con.container).find((t) => t.textContent === LEYENDA) as Element
    const ejeConLeyenda = num(semanas(con.container)[0] as Element, 'y')

    // `232 − 8 − (15 + 20 + 11)` da 178 de rejilla, así que el eje va en 201 y la
    // leyenda en 221 — los 11 del borde, que es donde el frame la dibuja.
    expect(num(leyenda, 'y')).toBeCloseTo(FRAME.height - BORDE, 6)
    expect(num(leyenda, 'y')).toBeLessThanOrEqual(FRAME.height)
    expect(num(leyenda, 'y')).toBeGreaterThan(ejeConLeyenda)
    con.unmount()

    // Y sin hueco el renglón NO se reserva: la rejilla se queda con los 20px y el
    // eje baja hasta el mismo borde. Reservarlo siempre deja un hueco al pie que
    // nada explica.
    const sin = drawAt(FRAME, matriz(DIAS, SEMANAS, GRADIENTE))
    const ejeSinLeyenda = num(semanas(sin.container)[0] as Element, 'y')

    expect(ejeSinLeyenda).toBeCloseTo(FRAME.height - BORDE, 6)
    expect(ejeSinLeyenda - ejeConLeyenda).toBeCloseTo(LEYENDA_DY, 6)
  })
})

/* ══ El rótulo largo ════════════════════════════════════════════════════════ */

describe('un rótulo de día largo se recorta contra SU canaleta, y la canaleta tiene techo', () => {
  it('`MIÉRCOLES DE CENIZA` sale recortado a 15 con `…`, y la canaleta no pasa de un tercio', () => {
    // **Las tres garantías de esta zona estaban sin una sola prueba**, y las tres
    // las encontró una mutación que SOBREVIVIÓ. Son las que se ven sólo con un
    // rótulo que no cabe, y el frame no dibuja ninguno: rotula con UNA letra.
    //
    //  1. Sin `LABEL_MAX_SHARE` la canaleta pedida son 137,12 de 340 —`19 · 6,48
    //     + 14`— y los rótulos se comen el 40 % del panel: las celdas dejan de ser
    //     celdas. Con el techo queda clavada en 113,33.
    //  2. Sin `recorte` el texto entero se pinta y se sale por la izquierda de la
    //     canaleta, encima de nada.
    //  3. Y `recorte` es una FÁBRICA para que no se la pueda llamar con el tope
    //     del otro eje — el defecto que una mutación sobrevivida encontró en el
    //     heatmap, donde los dos ejes compartían presupuesto. Con los topes
    //     cruzados el día se recortaría a 8 —`MIÉRCOL…`, el presupuesto de la
    //     semana— y se vería igual de prolijo.
    const largo = 'MIÉRCOLES DE CENIZA' // diecinueve caracteres
    const { container } = drawAt(
      FRAME,
      matriz([largo, 'M'], ['S21', 'S22', 'S23', 'S24', 'S25', 'S26', 'S27', 'S28', 'S29', 'S30', 'S31', 'S32'], [
        SEMANAS.map((_, c) => 100 * (c + 1)),
        SEMANAS.map((_, c) => 50 * (c + 1)),
      ]),
    )

    // El techo: un tercio de 340. Sin él la rejilla arrancaría en 137,12.
    const canaleta = FRAME.width / 3
    expect(num(rects(container)[0] as Element, 'x')).toBeCloseTo(canaleta, 6)
    expect(num(dias(container)[0] as Element, 'x')).toBeCloseTo(canaleta - LABEL_GAP, 6)

    // `charsThatFit(113,33 − 14, 9)` da 15, así que `slice(0, 14) + '…'`. El
    // literal va escrito: con el tope de la semana saldría `MIÉRCOL…` y con el
    // texto sin recortar, los diecinueve caracteres.
    const pintado = dias(container)[0]?.textContent ?? ''
    expect(pintado).toBe('MIÉRCOLES DE C…')
    expect(pintado).toHaveLength(15)

    // El rótulo corto de la segunda fila no se toca.
    expect(dias(container)[1]?.textContent).toBe('M')
  })
})

/* ══ El contrato tipográfico ═════════════════════════════════════════════════ */

describe('los doce textos son mono 9, 0.12em, `dim` y en MAYÚSCULAS', () => {
  it('el contrato tipográfico, y ninguno en mono 10', () => {
    const { container } = drawAt(FRAME, matriz(DIAS, SEMANAS, [
      ...GRADIENTE.slice(0, 6),
      [...(GRADIENTE[6] as number[]).slice(0, 11), null],
    ]))

    // Siete días, cuatro semanas y la leyenda. El frame dibuja esos mismos doce.
    expect(textos(container)).toHaveLength(DIAS.length + ROTULOS_DE_SEMANA + 1)
    for (const t of textos(container)) {
      const style = t.getAttribute('style') ?? ''
      // Usar `AxisText` tal como está pondría mono 10, que es el camino que
      // alguien va a tomar.
      expect(style).toContain('font-size: 9px')
      expect(style).toContain('font-family: var(--font-mono)')
      expect(style).toContain('letter-spacing: 0.12em')
      // `ink` haría que el rótulo compitiera con el dato.
      expect(style).toContain('fill: var(--color-dim)')
    }
  })

  it('los rótulos llegan en minúscula y se pintan en mayúsculas', () => {
    const { container } = drawAt(
      FRAME,
      matriz(['l', 'm'], ['s21', 's22', 's23', 's24'], [
        [10, 20, 30, 40],
        [50, 60, 70, 80],
      ]),
    )

    expect(dias(container).map((t) => t.textContent)).toEqual(['L', 'M'])
    expect(semanas(container).map((t) => t.textContent)).toContain('S21')
  })
})

/* ══ Cada celda dice qué es ══════════════════════════════════════════════════ */

describe('cada celda dice qué es, y la cifra va FORMATEADA', () => {
  it('`<title>` con día, semana y la cifra del tenant · `sin dato` en la vacía', () => {
    const { container } = drawAt(
      FRAME,
      matriz(['L', 'M'], ['S21', 'S22'], [
        [1234567, 1200000],
        [900, null],
      ]),
    )
    const titulos = Array.from(container.querySelectorAll('title')).map((t) => t.textContent)

    // Las celdas se emiten por FILA: L·S21, L·S22, M·S21, M·S22.
    expect(titulos[0]).toBe(`L · S21 · ${number(1234567)}`)
    expect(titulos[1]).toBe('L · S22 · 1.2M')
    expect(titulos[2]).toBe('M · S21 · 900')
    expect(titulos[3]).toBe('M · S22 · sin dato')

    // Pasar `v` crudo al `<title>` deja el `toString`, que no trae el locale del
    // tenant: `1234567` sin separadores.
    expect(container.innerHTML).not.toContain('1234567')
  })

  it('el `aria-label` nombra el CALENDARIO y sus dimensiones', () => {
    // Copiar el del heatmap deja ciega a la prueba de despacho, que es el daño
    // real: los cuatro gráficos de `matriz` hospedan la misma forma.
    const { container } = drawAt(FRAME, matriz(DIAS, SEMANAS, GRADIENTE))
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
      '7 × 12 celdas en calendario de actividad',
    )
  })
})

/* ══ La matriz rala ══════════════════════════════════════════════════════════ */

describe('un hueco de PAYLOAD no se dibuja como una celda sin dato', () => {
  it('una fila corta no produce un contorno que diga «sin dato»', () => {
    // `celdas[r]?.[c] ?? null` le atribuiría al negocio un hueco que es de quien
    // produjo el dato: `null` es «nunca» y ausente es un error.
    const { container } = drawAt(
      FRAME,
      matriz(['L', 'M'], ['S21', 'S22', 'S23'], [[10, 20, 30], [40, 50]]),
    )

    expect(rects(container)).toHaveLength(5)
    for (const celda of rects(container)) {
      expect(celda.getAttribute('fill')).not.toBe('none')
    }
    expect(container.textContent).not.toContain('SIN DATO CARGADO')
  })
})

/* ══ Las dos `M` del dibujo ══════════════════════════════════════════════════ */

describe('dos filas con el MISMO rótulo ocupan dos bandas distintas', () => {
  it('las dos `M` del frame —martes y miércoles— no se dibujan una encima de otra', () => {
    // **Es el defecto que el dibujo destapó.** `bandScale` indexa su dominio con
    // un `Map<string, number>`, así que pasarle las etiquetas crudas colapsa las
    // dos `M`: con `bandScale(filas, …)` la fila 1 y la fila 2 devolvían las dos
    // la posición de la 2, el martes se dibujaba encima del miércoles y la banda
    // de arriba quedaba vacía. El heatmap no lo sufre porque sus rótulos son
    // únicos.
    const { container } = drawAt(FRAME, matriz(DIAS, SEMANAS, GRADIENTE))
    const primeraColumna = rects(container).filter((_, i) => i % SEMANAS.length === 0)

    expect(primeraColumna).toHaveLength(DIAS.length)
    const ys = primeraColumna.map((r) => num(r, 'y'))
    expect(new Set(ys).size).toBe(DIAS.length)
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i] as number).toBeGreaterThan(ys[i - 1] as number)
    }
  })
})

/* ══ El achique ══════════════════════════════════════════════════════════════ */

describe('con muchísimas filas la celda se achica pero no se invierte', () => {
  it('ochenta filas: ningún `rect` de alto o ancho negativo', () => {
    // Sin el tope de `padFor` el `bandwidth` sale negativo y **el `rect`
    // desaparece del SVG sin ningún error**: el panel se ve vacío y nada lo
    // explica.
    const filas = Array.from({ length: 80 }, (_, i) => `d${i}`)
    const { container } = drawAt(
      FRAME,
      matriz(filas, ['S21', 'S22'], filas.map((_, r) => [r, r + 1])),
    )

    for (const celda of rects(container)) {
      expect(num(celda, 'height')).toBeGreaterThan(0)
      expect(num(celda, 'width')).toBeGreaterThan(0)
    }
  })
})
