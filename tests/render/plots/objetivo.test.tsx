// @vitest-environment jsdom

/** El avance contra objetivo · `bullet` sobre `escalar` · §PEN:Plot/BULLET
 *
 *  **El defecto que esto cierra es que un bullet mal hecho se ve perfecto.** Las
 *  tres formas de arruinarlo —escalar el dominio contra el valor en vez de
 *  contra el objetivo, clampear la barra al 100 %, o dibujar una sola franja—
 *  producen un gráfico limpio, alineado y creíble que dice otra cosa. Ninguna se
 *  nota mirando la pantalla, y las tres cambian si el panel comunica que se
 *  pasó, que llegó justo, o que faltó.
 *
 *  **Las medidas se CALCULAN desde `TEST_SIZE`, no se copian.** Un número
 *  pegado a mano vuelve verde una prueba el día que `HEADROOM` cambie sin que
 *  nadie decida que cambie.
 *
 *  Las afirmaciones se montan contra el plot porque el cuerpo todavía no lo
 *  despacha: `GaugeBody` y su `DIBUJA` son archivos compartidos y el cableado es
 *  una fase aparte. El último bloque fija lo que ese cableado **no puede**
 *  romper, y está escrito para ser cierto antes y después de él.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GaugeBody } from '@/render/bodies/GaugeBody'
import { createFormat } from '@/render/format'
import { PlotBullet } from '@/render/plots/PlotBullet'
import { PlotGauge } from '@/render/plots/PlotGauge'
import { TEST_SIZE } from '../../setup'
import type { Value } from '@/api/types'
import type { Family } from '@/catalog/types'

const escalar = (v: number) => ({ forma: 'escalar', v }) as Extract<Value, { forma: 'escalar' }>

/** Un formateador que no abrevia: las aserciones se leen mejor contra el número
 *  que contra «1,2 K». */
const plano = (v: number) => String(v)

/** Lo mismo que calcula el componente, escrito acá una sola vez y derivado del
 *  tamaño que informa el doble de `ResizeObserver`. Si `HEADROOM` se mueve, se
 *  mueve en los dos lados a propósito o la prueba se pone roja. */
const HEADROOM = 0.15
const TARGET_X = TEST_SIZE.width / (1 + HEADROOM)

const num = (el: Element, a: string) => Number(el.getAttribute(a))

const rects = (c: HTMLElement) => Array.from(c.querySelectorAll('rect'))
const franjas = (c: HTMLElement) => rects(c).filter((r) => r.getAttribute('fill') === 'var(--color-w1)')
/** La barra de medida es el único rect que NO es franja. */
const barra = (c: HTMLElement) => rects(c).find((r) => r.getAttribute('fill') !== 'var(--color-w1)')
const marca = (c: HTMLElement) => c.querySelector('line')

const bullet = (v: number, objetivo: number, family: Family = 'demanda') =>
  render(<PlotBullet value={escalar(v)} objetivo={objetivo} family={family} format={plano} />)

describe('la marca del objetivo · fija, que es lo que hace comparables dos paneles', () => {
  it('no se mueve con el valor', () => {
    // Escalar el dominio contra `Math.max(v, objetivo)` separa las dos x y se ve
    // bien en cada panel por separado: el 103 % y el 40 % quedan los dos con la
    // marca en un lugar distinto, y comparar dos paneles deja de significar
    // nada. Borrar `HEADROOM` la lleva al borde, a 600.
    const pasado = bullet(103, 100)
    const corto = bullet(40, 100)

    const x1 = num(marca(pasado.container) as Element, 'x1')
    expect(x1).toBeCloseTo(TARGET_X, 6)
    expect(num(marca(corto.container) as Element, 'x1')).toBeCloseTo(x1, 6)

    // Vertical y perpendicular al eje: `x1 === x2`, y 3 px por encima y por
    // debajo del riel, que es `M432 4 l0 28` sobre un riel de 7 a 29.
    const l = marca(pasado.container) as Element
    expect(num(l, 'x2')).toBeCloseTo(x1, 6)
    const y = (TEST_SIZE.height - 22) / 2
    expect(num(l, 'y1')).toBeCloseTo(y - 3, 6)
    expect(num(l, 'y2')).toBeCloseTo(y + 22 + 3, 6)
  })

  it('el umbral es `ink` y 2.4, y NO color de datos', () => {
    // Pintarlo con `hue({ family })` lo hace leer como una segunda serie, que es
    // justo lo que un umbral no es. En el `.pen` es `$ink` en las cuatro filas,
    // con las cuatro familias distintas.
    const { container } = bullet(103, 100, 'medios')

    expect(marca(container)?.getAttribute('stroke')).toBe('var(--color-ink)')
    expect(marca(container)?.getAttribute('stroke-width')).toBe('2.4')
    expect(marca(container)?.getAttribute('stroke-linecap')).toBe('round')
  })
})

describe('la barra · el desborde es lo que el gráfico existe para mostrar', () => {
  it('el 103 % PASA la marca', () => {
    // Es el literal del dibujo: 350,2 contra un riel de 340. Con
    // `Math.min(1, v / objetivo)` —que es lo que hace el arco— la barra queda
    // clavada en la marca y el panel dice «llegó justo» donde se pasó.
    const { container } = bullet(103, 100)

    const ancho = num(barra(container) as Element, 'width')
    expect(ancho).toBeCloseTo(TARGET_X * 1.03, 6)
    expect(ancho).toBeGreaterThan(num(marca(container) as Element, 'x1'))
  })

  it('el cociente contra la marca ES el porcentaje, sin redondeo intermedio', () => {
    // El porcentaje que el cuerpo imprime y el que coloca la barra tienen que
    // salir del MISMO par de números. Leer `presentation.medidor.porcentaje`
    // para el texto deja decir 103 % con la barra en 97 %.
    for (const [v, esperado] of [[103, 1.03], [97, 0.97], [95, 0.95], [96, 0.96]] as const) {
      const { container, unmount } = bullet(v, 100)
      const razon = num(barra(container) as Element, 'width') / num(marca(container) as Element, 'x1')
      expect(razon).toBeCloseTo(esperado, 6)
      unmount()
    }
  })

  it('la barra va centrada en el riel y mide 12 de alto', () => {
    // 22 de riel y 12 de barra, en y + 5. Con la barra al tope del riel el
    // dibujo se ve «moderno» y deja de ser el del `.pen`.
    const { container } = bullet(95, 100)

    const b = barra(container) as Element
    const y = (TEST_SIZE.height - 22) / 2
    expect(num(b, 'height')).toBe(12)
    expect(num(b, 'y')).toBeCloseTo(y + 5, 6)
    expect(num(b, 'x')).toBe(0)
    // El mismo radio que el riel · `--radius-xs` · §ANCLA:RADIO-1. Iba afirmado
    // sobre las franjas y no sobre la barra, así que subirlo a 8 —que en una
    // barra de 12 de alto la deja de píldora— pasaba la suite entera.
    expect(num(b, 'rx')).toBe(2)
  })

  it('un avance negativo no dibuja barra al revés · queda en cero', () => {
    // El dibujo no contempla avance negativo y el contrato no lo prohíbe. Sin
    // el `Math.max(0, …)` el ancho negativo hace desaparecer el rect entero sin
    // avisar, que es la trampa que `PlotComposition` y `PlotInterval` ya anotan.
    const { container } = bullet(-20, 100)

    expect(num(barra(container) as Element, 'width')).toBe(0)
  })

  it('por encima del 115 % se clava en el borde, y está declarado', () => {
    // El `HEADROOM` fija cuánto desborde se ve; más allá lo dice sólo la cifra.
    // Sin el `Math.min(w, …)` el rect se sale del viewport y el recorte parece
    // un bug del navegador.
    const { container } = bullet(300, 100)

    expect(num(barra(container) as Element, 'width')).toBe(TEST_SIZE.width)
  })
})

describe('las dos franjas cualitativas · son DOS y las dos son `$w1`', () => {
  it('van al 80 % y al 100 % del objetivo', () => {
    // 272 / 340 = 0,80 exacto en el dibujo. Dibujar una sola franja borra el
    // rango cualitativo; mover el corte a 0,9 lo inventa. Y `$w1` es un wash con
    // alfa: superpuestas oscurecen el tramo 0–80 %, que es el efecto buscado —
    // pintarlas con `w2` lo pierde.
    const { container } = bullet(97, 100)

    const anchos = franjas(container).map((r) => num(r, 'width')).sort((a, b) => a - b)
    expect(anchos).toHaveLength(2)
    expect(anchos[0]).toBeCloseTo(0.8 * TARGET_X, 6)
    expect(anchos[1]).toBeCloseTo(TARGET_X, 6)

    // Las dos arrancan en cero y miden el alto del riel: son rangos desde el
    // origen, no dos tramos contiguos.
    for (const r of franjas(container)) {
      expect(num(r, 'x')).toBe(0)
      expect(num(r, 'height')).toBe(22)
      expect(num(r, 'rx')).toBe(2)
    }
  })
})

describe('la tinta sale de tokens y ninguna es el acento', () => {
  it('la barra pinta con la familia que LLEGA', () => {
    // Fijar `demanda` pasa con demanda y falla con medios: la familia se lee del
    // catálogo, nunca se elige en el componente.
    const { container } = bullet(97, 100, 'medios')

    expect(barra(container)?.getAttribute('fill')).toBe('var(--color-fam-medios-1)')
  })

  it('ni un hex ni un `acc` en todo el SVG', () => {
    const { container } = bullet(103, 100, 'medios')

    const tintas: string[] = []
    for (const el of Array.from(container.querySelectorAll('svg *'))) {
      for (const a of ['fill', 'stroke']) {
        const v = el.getAttribute(a)
        if (v !== null) tintas.push(v)
      }
    }

    expect(tintas.length).toBeGreaterThan(0)
    for (const t of tintas) {
      expect(t).toMatch(/^var\(--color-[a-z0-9-]+\)$/)
      expect(t).not.toContain('acc')
    }
  })
})

describe('el plot dibuja y no rotula', () => {
  it('no escribe una sola línea de texto', () => {
    // Mover los rótulos adentro del SVG se ve idéntico y «ningún número desnudo»
    // deja de ser verificable en un solo lugar — la razón que `PlotInterval` ya
    // dejó escrita. El rótulo, la cifra y el «N % DEL OBJETIVO» son del cuerpo.
    const { container } = bullet(103, 100)

    expect(container.querySelector('svg text')).toBeNull()
  })

  it('se distingue del arco por el nombre accesible Y por la geometría', () => {
    // Éste es el modo de falla que este repositorio ya tuvo cuatro veces:
    // agregar `'bullet'` a `DIBUJA` y olvidar el despacho deja el panel cayendo
    // al arco, y se ve perfecto. Con dos nombres distintos una prueba puede
    // afirmar CUÁL se montó; con el mismo, no.
    const b = bullet(103, 100)
    expect(screen.getByRole('img', { name: /^Avance contra objetivo · / })).toBeInTheDocument()
    // El bullet son rects y una línea; el arco son paths.
    expect(b.container.querySelectorAll('path')).toHaveLength(0)
    b.unmount()

    const g = render(
      <PlotGauge value={103} max={100} family="demanda" format={plano} />,
    )
    expect(screen.queryByRole('img', { name: /Avance contra objetivo/ })).toBeNull()
    expect(g.container.querySelectorAll('path').length).toBeGreaterThan(0)
  })

  it('el nombre accesible lee «avance de objetivo», con el formateador que LLEGA', () => {
    // La aserción de arriba ancla el prefijo y nada más, así que tres defectos
    // distintos pasaban: `${value.v}` en vez de `${format(value.v)}` —el plot
    // imprime el número crudo y quien usa lector de pantalla oye `4283910` donde
    // la pantalla dice `4,28 M`—, el objetivo sin formatear, y los dos números
    // invertidos, que dice «100 de 103» y miente sobre cuál se alcanzó.
    // El formateador marca su salida: un número que pasa sin él se nota.
    const marcado = (v: number) => `«${v}»`
    render(
      <PlotBullet value={escalar(103)} objetivo={100} family="demanda" format={marcado} />,
    )

    expect(
      screen.getByRole('img', { name: 'Avance contra objetivo · «103» de «100»' }),
    ).toBeInTheDocument()
  })
})

/* ── Lo que el cableado posterior NO puede romper ──────────────────────────── */

const cuerpo = {
  span: { colStart: 1, colSpan: 5, rowSpan: 4 },
  family: 'demanda',
  metric: 'Ventas',
  format: createFormat('es-MX'),
} as const

describe('sin objetivo no se dibuja · se dice', () => {
  it('`GaugeBody` sin `maximo` no monta ninguna geometría', () => {
    // La guarda es UNA sola rama y cubre las dos: sin denominador no hay bullet,
    // igual que no hay arco. `objetivo = maximo ?? 100` dibuja un avance contra
    // un objetivo inventado, que es la degradación no declarada que §1.3
    // prohíbe.
    render(<GaugeBody {...cuerpo} value={escalar(72)} params={{}} />)

    expect(screen.getByText(/Sin máximo declarado/)).toBeVisible()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('pedir `bullet` sin `maximo` tampoco lo monta', () => {
    // Cierto HOY —el cuerpo declara el gráfico desconocido— y cierto DESPUÉS del
    // cableado —cae en la misma guarda—. Lo que no puede pasar en ninguno de los
    // dos mundos es que aparezca un avance contra un objetivo que nadie declaró.
    render(<GaugeBody {...cuerpo} value={escalar(72)} params={{}} grafico="bullet" />)

    expect(screen.queryByRole('img', { name: /^Avance contra objetivo/ })).toBeNull()
  })
})
