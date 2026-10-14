// @vitest-environment jsdom

/** Dona · `donut` · §PEN:Plot/DONA · Inversión por plataforma
 *
 *  **Lo que se verifica es el REPARTO, no que el anillo exista.** Una dona mal
 *  calculada se ve impecable: cinco tramos prolijos, leyenda alineada, y cada
 *  tramo ocupando 1/n en vez de su parte. Por eso casi todo lo de acá mira la
 *  geometría del trazo o la cifra, y casi nada mira la presencia de la marca.
 *
 *  Las dos aserciones que más valen son las del TOTAL: el centro tiene que
 *  sumar los nueve ítems y no los cuatro visibles, y los porcentajes tienen que
 *  ser parte de ese mismo total. Las dos fallan hacia el lado creíble —una cifra
 *  menor y unos porcentajes más grandes—, que es el defecto que
 *  `CompositionBody` ya registró por escrito y la razón por la que el agrupado
 *  vive en el plot.
 *
 *  Los números del reparto son los del dibujo: 40 / 31 / 14 / 9 / 6.
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotDonut } from '@/render/plots/PlotDonut'
import { arcPath } from '@/render/plots/core/arcPath'
import type { Family } from '@/catalog/types'
import type { Value } from '@/api/types'
import { TEST_SIZE } from '../../setup'

/** Formateador de identidad: acá se mide el cálculo del plot, no el locale. */
const plain = (v: number) => String(v)

type Ajustes = { family: Family; format: (v: number) => string; totalLabel: string }

const base: Ajustes = { family: 'medios', format: plain, totalLabel: 'TOTAL' }

type Item = { etiqueta: string; v: number }

const categorica = (items: readonly Item[]): Extract<Value, { forma: 'categorica' }> => ({
  forma: 'categorica',
  items: [...items],
})

const dibujar = (items: readonly Item[], props: Partial<Ajustes> = {}) =>
  render(<PlotDonut {...base} {...props} value={categorica(items)} />)

/** Los tramos se reconocen por su color: `Arc` pinta con `hue`, que siempre
 *  devuelve una variable de familia. El riel no. */
const tramos = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path')).filter((n) =>
    (n.getAttribute('fill') ?? '').startsWith('var(--color-fam-'),
  )

const muestras = (c: HTMLElement) => Array.from(c.querySelectorAll('rect'))

/* ── La geometría que esta especificación fija, recalculada acá ──────────────
 *
 * No se importa del componente: una prueba que lee las constantes del código no
 * puede fallar cuando el código está mal. Los números salen del `.pen`
 * —LEGEND 156/430, GAP 254→274, grosor 42/104— sobre el `TEST_SIZE` de 600×300.
 */
const LEGEND_W = Math.max(120, Math.round(TEST_SIZE.width * 0.36))
const RING_W = TEST_SIZE.width - LEGEND_W - 20
const SIDE = Math.min(RING_W, TEST_SIZE.height)
const RADIUS = SIDE / 2 - 4
const THICKNESS = RADIUS * 0.4
const CX = RING_W / 2
const CY = TEST_SIZE.height / 2

/** Los nueve del dibujo: cuatro plataformas y una cola de cinco que suma 66K.
 *  El total es 1.040.000, que es el «USD 1.04M» del centro. */
const NUEVE: readonly Item[] = [
  { etiqueta: 'Meta', v: 412_000 },
  { etiqueta: 'Google', v: 318_000 },
  { etiqueta: 'Criteo', v: 148_000 },
  { etiqueta: 'TikTok', v: 96_000 },
  { etiqueta: 'Pinterest', v: 20_000 },
  { etiqueta: 'Snapchat', v: 16_000 },
  { etiqueta: 'Spotify', v: 12_000 },
  { etiqueta: 'Reddit', v: 10_000 },
  { etiqueta: 'LinkedIn', v: 8_000 },
]

const TOTAL_NUEVE = 1_040_000

describe('cinco tramos, y el quinto es «Otros»', () => {
  it('nueve ítems se dibujan como cuatro más la cola agrupada', () => {
    // Un sexto escalón repetiría uno anterior: la rampa tiene cinco. Es la
    // misma constante y la misma razón que `CompositionBody`.
    const { container } = dibujar(NUEVE)
    expect(tramos(container)).toHaveLength(5)
    expect(container.textContent).toContain('OTROS · 5')
  })

  it('con cinco o menos no inventa un «Otros»', () => {
    const { container } = dibujar(NUEVE.slice(0, 4))
    expect(tramos(container)).toHaveLength(4)
    expect(container.textContent).not.toContain('OTROS')
  })
})

describe('el total del centro suma TODOS los ítems', () => {
  it('no los cuatro visibles · el defecto que se ve bien y miente', () => {
    // Sumar los visibles daría 974.000: una cifra creíble, más chica, y
    // presentada como el total. Por eso el agrupado vive en el plot y no en el
    // cuerpo — el plot recibe la lista entera.
    const { container } = dibujar(NUEVE)
    expect(container.textContent).toContain(String(TOTAL_NUEVE))
    expect(container.textContent).not.toContain('974000')
  })

  it('el porcentaje es la parte del TOTAL, no del visible', () => {
    // Sobre el visible el primero sería 42%, no 40%.
    const { container } = dibujar(NUEVE)
    expect(container.textContent).toContain('412000 · 40%')
    expect(container.textContent).not.toContain('· 42%')

    const pct = [...container.textContent.matchAll(/· (\d+)%/g)].map((m) => Number(m[1]))
    expect(pct).toEqual([40, 31, 14, 9, 6])
    expect(pct.reduce((s, p) => s + p, 0)).toBeLessThanOrEqual(100)
  })
})

describe('cada tramo ocupa su parte, y el anillo cierra', () => {
  it('el trazo es el arco de su fracción, desde arriba y en sentido horario', () => {
    const { container } = dibujar(NUEVE)
    const visibles = [412_000, 318_000, 148_000, 96_000, 66_000]

    let acc = 0
    const esperados = visibles.map((v) => {
      const d = arcPath(CX, CY, RADIUS, RADIUS - THICKNESS, acc, acc + v / TOTAL_NUEVE)
      acc += v / TOTAL_NUEVE
      return d
    })

    expect(tramos(container).map((n) => n.getAttribute('d'))).toEqual(esperados)
  })

  it('el último tramo termina donde arranca el primero: el tope del círculo', () => {
    // Falla por una razón DISTINTA a la aserción de arriba: quedarse con los
    // cuatro visibles sin «Otros» deja un hueco del 6% que la comparación de
    // trazos no distingue de un redondeo.
    const { container } = dibujar(NUEVE)
    const ultimo = tramos(container).at(-1)?.getAttribute('d') ?? ''
    const fin = /A[\d.]+,[\d.]+ 0 [01] 1 (-?[\d.e+-]+),(-?[\d.e+-]+)/.exec(ultimo)

    expect(fin).not.toBeNull()
    expect(Number(fin?.[1])).toBeCloseTo(CX, 6)
    expect(Number(fin?.[2])).toBeCloseTo(CY - RADIUS, 6)
  })
})

/* ── El centro · las dos líneas y su tamaño ──────────────────────────────────
 *
 * Los tres números salen del frame y NO del componente: la cifra centra en 138,8
 * y el rótulo en 162,9 con `cy` = 148 y una cifra de 20 —9,2 y 14,9 arriba y
 * abajo, o sea 0,46 y 0,745 del tamaño de la cifra—, y 20/104 es lo que la cifra
 * mide contra el radio. La tolerancia de 1px es lo que el porte se permite al
 * redondear esas razones a dos decimales; no alcanza para tapar una que se movió.
 */
const FIGURE = RADIUS * (20 / 104)
const RISE = 0.46
const DROP = 0.745

/** Las dos líneas del centro son las únicas `middle`: la leyenda ancla `start`. */
const centro = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('text[text-anchor="middle"]'))

const cerca = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1)

describe('el centro cae donde el dibujo lo pone', () => {
  it('cifra arriba y rótulo abajo de `cy`, los dos contra el tamaño de la CIFRA', () => {
    // Sin esto el bloque del centro se puede colocar en cualquier parte —
    // encimado, fuera del hueco, sobre el anillo— y las dieciséis aserciones
    // siguen verdes: ninguna otra mira una `y`.
    const { container } = dibujar(NUEVE)
    const [cifra, rotulo] = centro(container)

    expect(cifra?.textContent).toBe(String(TOTAL_NUEVE))
    expect(rotulo?.textContent).toBe('TOTAL')

    cerca(Number(cifra?.getAttribute('y')), CY - FIGURE * RISE)
    cerca(Number(rotulo?.getAttribute('y')), CY + FIGURE * DROP)

    // Y en el centro del ANILLO, no del panel: con `w / 2` el bloque se corre
    // 118px a la derecha y queda debajo de la leyenda.
    cerca(Number(cifra?.getAttribute('x')), CX)
    cerca(Number(rotulo?.getAttribute('x')), CX)
  })

  it('la cifra escala con el radio y el rótulo NO', () => {
    // §2.3 cierra los cuatro tamaños mono —«ningún otro tamaño mono»—, así que
    // interpolar el del rótulo inventa el quinto. La cifra sí escala: es
    // `font-body`, y dentro de un plot su tamaño es una razón del dibujo.
    const { container } = dibujar(NUEVE)
    const [cifra, rotulo] = centro(container)

    cerca(Number(String(cifra?.getAttribute('style')).match(/font-size:\s*([\d.]+)px/)?.[1]), FIGURE)
    expect(rotulo?.getAttribute('style')).toContain('font-size: var(--text-nota)')
  })
})

describe('lo que lee un lector de pantalla', () => {
  it('la etiqueta accesible trae el rótulo, el total y en cuántas partes', () => {
    // Un `aria-label` sin la cifra deja al lector de pantalla con «dona» donde
    // la vista tiene el total: el mismo «número desnudo» del otro lado.
    const { container } = dibujar(NUEVE, { totalLabel: 'Inversión del mes' })
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    const etiqueta = svg?.getAttribute('aria-label') ?? ''
    expect(etiqueta).toContain('INVERSIÓN DEL MES')
    expect(etiqueta).toContain(String(TOTAL_NUEVE))
    expect(etiqueta).toContain('5 partes')
  })
})

describe('reglas duras de color', () => {
  it('el color del tramo i es el de su muestra i · anillo y leyenda no divergen', () => {
    // Dos listas de pasos son dos listas que pueden separarse, y una dona donde
    // el color no significa lo mismo a los dos lados no se ve rota.
    const { container } = dibujar(NUEVE)
    const t = tramos(container).map((n) => n.getAttribute('fill'))
    const m = muestras(container).map((n) => n.getAttribute('fill'))
    expect(t).toHaveLength(5)
    expect(m).toEqual(t)
  })

  it('la familia llega por prop y no se elige acá', () => {
    const { container: cliente } = dibujar(NUEVE, { family: 'cliente' })
    const fills = tramos(cliente).map((n) => n.getAttribute('fill'))
    for (const f of fills) expect(f).toContain('--color-fam-cliente-')
    expect(fills.join(' ')).not.toContain('--color-fam-medios-')

    // `medios` es lo que el `.pen` dibuja, y cablearlo es el error que esto
    // persigue.
    const { container: medios } = dibujar(NUEVE, { family: 'medios' })
    for (const f of tramos(medios)) expect(f.getAttribute('fill')).toContain('-medios-')
  })

  it('la muestra de la leyenda lee la MISMA familia de la prop', () => {
    // La aserción de arriba compara anillo contra leyenda con la familia por
    // defecto —`medios`, la que el `.pen` dibuja—, así que una familia cableada
    // en la muestra las deja idénticas y pasa. Media superficie de color del
    // plot elegía su familia adentro, que es la regla dura 1 al revés.
    const { container } = dibujar(NUEVE, { family: 'cliente' })
    for (const m of muestras(container)) {
      expect(m.getAttribute('fill')).toContain('--color-fam-cliente-')
    }
  })

  it('ni naranja ni un hex literal · las dos reglas de una vez', () => {
    const { container } = dibujar(NUEVE)
    const svg = container.querySelector('svg')?.outerHTML ?? ''
    expect(svg).not.toContain('--color-acc')
    expect(svg).not.toMatch(/#[0-9a-f]{3,8}/i)
  })
})

describe('ningún número desnudo', () => {
  it('cada fila lleva su rótulo en mayúsculas junto a su cifra', () => {
    const { container } = dibujar(NUEVE)
    for (const e of ['META', 'GOOGLE', 'CRITEO', 'TIKTOK', 'OTROS · 5']) {
      expect(container.textContent).toContain(e)
    }
  })

  it('la cifra del centro dice TOTAL cuando el backend no manda rótulo', () => {
    const { container } = dibujar(NUEVE)
    expect(container.textContent).toContain('TOTAL')
  })

  it('y dice lo que mandó el backend cuando lo manda', () => {
    // El `.pen` pinta «INVERSIÓN DEL MES», que es métrica + período: un plot no
    // conoce ninguno de los dos, así que llega redactado por props.
    const { container } = dibujar(NUEVE, { totalLabel: 'Inversión del mes' })
    expect(container.textContent).toContain('INVERSIÓN DEL MES')
    expect(container.textContent).not.toContain('TOTAL')
  })
})

describe('el formateador se inyecta, no se importa', () => {
  it('la cifra del centro y las de la leyenda pasan por `format`', () => {
    const { container } = dibujar(NUEVE, { format: (v: number) => `«${v}»` })
    expect(container.textContent).toContain('«1040000»')
    expect(container.textContent).toContain('«412000» · 40%')
  })
})

describe('lo que no se reparte', () => {
  it('total 0 no dibuja tramos ni produce un `NaN`', () => {
    const { container } = dibujar([
      { etiqueta: 'Meta', v: 0 },
      { etiqueta: 'Google', v: 0 },
    ])
    expect(tramos(container)).toHaveLength(0)
    expect(container.querySelectorAll('path[fill="var(--color-w2)"]')).toHaveLength(1)
    for (const n of Array.from(container.querySelectorAll('path'))) {
      expect(n.getAttribute('d')).not.toContain('NaN')
    }
  })

  it('un círculo no reparte negativos: no reciben tramo ni cuentan al total', () => {
    // §5 ofrece `bars` para una `categorica` con negativos. El plot no puede
    // avisarlo desde adentro, pero no los dibuja como si fueran parte del todo.
    const { container } = dibujar([
      { etiqueta: 'Meta', v: 300 },
      { etiqueta: 'Ajuste', v: -100 },
      { etiqueta: 'Google', v: 100 },
    ])
    expect(tramos(container)).toHaveLength(2)
    expect(container.textContent).toContain('400')
    expect(container.textContent).not.toContain('AJUSTE')
  })

  it('un solo ítem cierra la vuelta entera · `arcPath` la parte en dos mitades', () => {
    const { container } = dibujar([{ etiqueta: 'Meta', v: 500 }])
    const d = tramos(container)[0]?.getAttribute('d') ?? ''
    expect((d.match(/A/g) ?? []).length).toBe(4)
    expect(d).not.toContain('NaN')
  })
})
