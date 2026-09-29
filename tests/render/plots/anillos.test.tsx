// @vitest-environment jsdom

/** Anillos · `rings` · §PEN:Plot/ANILLOS · Cumplimiento múltiple
 *
 *  **Lo que se verifica es la PROPORCIÓN, no que el SVG exista.** Un anillo mal
 *  calculado se ve perfecto: traza prolija, rótulo en su sitio, y un porcentaje
 *  que es el cociente al revés. Por eso casi todas las aserciones de acá miran
 *  el número o la geometría del arco, y no la presencia de la marca.
 *
 *  La aserción central es la del 110%: el `.pen` no escribe en ningún lado que
 *  la vuelta entera sea 110% —sale de dividir porcentaje por vueltas en los tres
 *  anillos dibujados—, así que es lo único que ninguna otra fuente protege.
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotRings } from '@/render/plots/PlotRings'
import type { Ring } from '@/render/plots/PlotRings'
import type { Family } from '@/catalog/types'
import { TEST_SIZE } from '../../setup'

/** Formateador de identidad: acá se mide el cálculo del plot, no el locale. */
const plain = (v: number) => String(v)

type Ajustes = { family: Family; format: (v: number) => string }

const base: Ajustes = { family: 'medios', format: plain }

const dibujar = (rings: readonly Ring[], props: Partial<Ajustes> = {}) =>
  render(<PlotRings {...base} {...props} rings={rings} />)

/** Los arcos de VALOR se reconocen por su color: `Arc` pinta con `hue`, que
 *  siempre devuelve una variable de familia. El riel no. */
const arcos = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path')).filter((n) =>
    (n.getAttribute('fill') ?? '').startsWith('var(--color-fam-'),
  )

const rieles = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path[fill="var(--color-c-grid)"]'))

/** Cuántos comandos de arco tiene un `d`. `arcPath` parte la vuelta COMPLETA en
 *  dos mitades —dos extremos que coinciden no trazan nada—, así que 4 es cerrado
 *  y 2 es abierto. Es la forma de leer «el arco dio la vuelta entera» sin
 *  reimplementar la trigonometría en la prueba. */
const comandosA = (n: Element) => ((n.getAttribute('d') ?? '').match(/A/g) ?? []).length

const UNO: readonly Ring[] = [{ k: 'a', label: 'Ventas', value: 4_120_000, max: 4_000_000 }]

const TRES: readonly Ring[] = [
  { k: 'a', label: 'Ventas', value: 103, max: 100 },
  { k: 'b', label: 'Órdenes', value: 97, max: 100 },
  { k: 'c', label: 'ROAS', value: 95, max: 100 },
]

describe('el porcentaje es contra el OBJETIVO', () => {
  it('lo logrado sobre lo prometido, y en ese orden', () => {
    // El cociente invertido es el error que esto persigue: 97% en lugar de
    // 103% se ve perfecto y dice lo contrario.
    const { container } = dibujar(UNO)
    expect(container.textContent).toContain('103%')
  })

  it('un objetivo en cero no divide por cero · no hay escala, no hay avance', () => {
    const { container } = dibujar([{ k: 'a', label: 'Ventas', value: 10, max: 0 }])
    expect(container.textContent).toContain('0%')
  })
})

describe('la vuelta entera es 110%, no 100% · la medición del `.pen`', () => {
  it('al 100% el arco NO cierra el círculo: queda el aire del dibujo', () => {
    const { container } = dibujar([{ k: 'a', label: 'Ventas', value: 100, max: 100 }])
    const arco = arcos(container)[0]
    expect(arco).toBeDefined()
    expect(comandosA(arco as Element)).toBe(2)
  })

  it('a 110% recién cierra', () => {
    const { container } = dibujar([{ k: 'a', label: 'Ventas', value: 110, max: 100 }])
    expect(comandosA(arcos(container)[0] as Element)).toBe(4)
  })

  it('por encima del aire se llena y no se desborda, PERO LA CIFRA LO DICE', () => {
    // Sin esto, un tope escrito una línea más arriba convierte un
    // sobrecumplimiento del doble en «objetivo cumplido».
    const { container } = dibujar([{ k: 'a', label: 'Ventas', value: 2, max: 1 }])
    expect(comandosA(arcos(container)[0] as Element)).toBe(4)
    expect(container.textContent).toContain('200%')
  })
})

describe('ningún número desnudo', () => {
  it('el rótulo va debajo del anillo y en mayúsculas, como el `.pen`', () => {
    const { container } = dibujar([
      { k: 'a', label: 'Cumplimiento de ventas', value: 1, max: 1 },
    ])
    expect(container.textContent).toContain('CUMPLIMIENTO DE VENTAS')
  })
})

describe('el riel · cuánto FALTA', () => {
  it('uno por anillo, de vuelta completa y en `$c-grid`', () => {
    // Sin riel el anillo no dice cuánto falta; y en `--color-w2` sería reusar
    // `ArcRail` sin mirar el dibujo, que es exactamente lo que pasaría.
    const { container } = dibujar(TRES)
    const r = rieles(container)
    expect(r).toHaveLength(3)
    for (const n of r) expect(comandosA(n)).toBe(4)
    expect(container.querySelectorAll('path[fill="var(--color-w2)"]')).toHaveLength(0)
  })
})

describe('reglas duras de color', () => {
  it('el color sale de la FAMILIA, nunca del componente', () => {
    const { container: medios } = dibujar(UNO, { family: 'medios' })
    expect(arcos(medios)[0]?.getAttribute('fill')).toBe('var(--color-fam-medios-1)')

    const { container: demanda } = dibujar(UNO, { family: 'demanda' })
    expect(arcos(demanda)[0]?.getAttribute('fill')).toBe('var(--color-fam-demanda-1)')
  })

  it('anillos adyacentes no comparten paso', () => {
    const { container } = dibujar(TRES)
    const fills = arcos(container).map((n) => n.getAttribute('fill'))
    expect(new Set(fills).size).toBe(3)
    expect(fills[0]).toBe('var(--color-fam-medios-1)')
  })

  it('ni naranja ni un hex literal · las dos reglas de una vez', () => {
    const { container } = dibujar(TRES)
    const svg = container.querySelector('svg')?.outerHTML ?? ''
    expect(svg).not.toContain('--color-acc')
    expect(svg).not.toMatch(/#[0-9a-f]{3,8}/i)
  })
})

describe('el formateador se inyecta, no se importa', () => {
  it('la cifra pasa por `format` · el locale no lo decide el plot', () => {
    const { container } = dibujar(UNO, { format: (v: number) => `«${v}»` })
    expect(container.textContent).toContain('«103»%')
  })
})

describe('un anillo por entrada, y no se solapan', () => {
  it('tres entradas son tres rieles, tres arcos y tres rótulos', () => {
    const { container } = dibujar(TRES)
    expect(rieles(container)).toHaveLength(3)
    expect(arcos(container)).toHaveLength(3)
    expect(container.querySelectorAll('text')).toHaveLength(6)
    expect(container.textContent).toContain('VENTAS')
    expect(container.textContent).toContain('ÓRDENES')
    expect(container.textContent).toContain('ROAS')
  })

  it('los centros son distintos, crecientes, y cada anillo cabe en el ancho', () => {
    // `arcPath` arranca el riel en el tope del círculo: `M cx,cy-rOuter`. De ahí
    // sale el centro sin reimplementar la geometría; y para «cabe» alcanza con
    // mirar TODAS las coordenadas del trazo, que es el contorno del anillo.
    const { container } = dibujar(TRES)
    const trazos = rieles(container).map((n) => n.getAttribute('d') ?? '')

    const cxs = trazos.map((d) => Number(/^M(-?[\d.]+),/.exec(d)?.[1]))
    expect(new Set(cxs).size).toBe(3)
    expect([...cxs].sort((a, b) => a - b)).toEqual(cxs)

    // **Reparten el ANCHO que hay**, no uno fijo. Se afirma por simetría y paso
    // constante en vez de copiar la fórmula: un ancho cableado deja los tres
    // anillos amontonados a la izquierda y las dos igualdades lo delatan.
    expect((cxs[0] as number) + (cxs[2] as number)).toBeCloseTo(TEST_SIZE.width, 6)
    expect((cxs[1] as number) - (cxs[0] as number)).toBeCloseTo(TEST_SIZE.width / 3, 6)

    for (const d of trazos) {
      const xs = [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => Number(m[1]))
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(0)
      expect(Math.max(...xs)).toBeLessThanOrEqual(TEST_SIZE.width)
    }
  })
})

/* ── Lo que la mutación encontró sin cubrir · QA 2026-09-29 ──────────────────
 *
 *  **Seis mutaciones fieles sobrevivieron a las trece pruebas de arriba**, y las
 *  cinco de acá son las que las matan. La causa de tres de ellas es una sola y
 *  conviene dejarla escrita, porque la prueba de «cada anillo cabe en el ancho»
 *  parecía cubrirla: `arcPath` emite **solo los extremos de cada arco**, y en
 *  una vuelta completa esos extremos están todos arriba y abajo del círculo, o
 *  sea **exactamente en `cx`**. El `d` real de un riel es
 *  `M100,57 A79,79 … 100,215 …`: ni un `-20` ni un `220` aparecen nunca aunque el
 *  anillo se salga de su celda. Mirar las coordenadas mide los centros y nada
 *  más; **el radio hay que leerlo del propio comando `A`**, que sí está ahí.
 */

/** Los dos radios que el comando `A` declara: exterior primero, interior
 *  después. Es de dónde se lee el tamaño del anillo sin recalcularlo. */
const radios = (n: Element) => {
  const rs = [...(n.getAttribute('d') ?? '').matchAll(/A([\d.]+),/g)].map((m) => Number(m[1]))
  return { rOuter: rs[0] as number, rInner: rs[1] as number }
}

const centro = (n: Element) => Number(/^M(-?[\d.]+),/.exec(n.getAttribute('d') ?? '')?.[1])

describe('el anillo entra en su celda · la proporción del dibujo', () => {
  it('ninguno se sale del ancho ni se solapa con su vecino', () => {
    // Mata «diámetro = la celda entera» y «radio cinco veces la celda»: las dos
    // pasaban con las trece de arriba porque el desborde no deja coordenada.
    const { container } = dibujar(TRES)
    const geo = rieles(container).map((n) => ({ cx: centro(n), ...radios(n) }))

    for (const g of geo) {
      expect(g.rOuter).toBeGreaterThan(0)
      expect(g.cx - g.rOuter).toBeGreaterThanOrEqual(0)
      expect(g.cx + g.rOuter).toBeLessThanOrEqual(TEST_SIZE.width)
    }

    // Dos anillos que se tocan son un dibujo distinto del que el `.pen` manda.
    for (let i = 1; i < geo.length; i += 1) {
      const a = geo[i - 1] as (typeof geo)[number]
      const b = geo[i] as (typeof geo)[number]
      expect(b.cx - a.cx).toBeGreaterThanOrEqual(a.rOuter + b.rOuter)
    }
  })

  it('es un ANILLO y no un sector: tiene hueco, y el grosor es el del `.pen`', () => {
    // `strokeWidth` 9 sobre radio exterior 50,5 ⇒ 0,178. Sin esto el anillo se
    // podía volver un pie relleno sin que ninguna aserción se moviera.
    const { container } = dibujar(TRES)
    for (const n of [...rieles(container), ...arcos(container)]) {
      const { rOuter, rInner } = radios(n)
      expect(rInner).toBeGreaterThan(0)
      expect((rOuter - rInner) / rOuter).toBeCloseTo(0.178, 2)
    }
  })
})

describe('el orden de los pasos es el que el dibujo manda', () => {
  it('el primero es el paso 1 y el SEGUNDO es el 0, no cualquier par distinto', () => {
    // «Adyacentes no comparten paso» deja pasar 1-3-2, que cumple la regla y no
    // es lo que el `.pen` pinta: `$fam-…-1` y después `$fam-…-0`. El primero ya
    // estaba afirmado arriba; el segundo no, y es la mitad del orden que la
    // función `stepOfRing` existe para preservar.
    const { container } = dibujar(TRES)
    const fills = arcos(container).map((n) => n.getAttribute('fill'))
    expect(fills[0]).toBe('var(--color-fam-medios-1)')
    expect(fills[1]).toBe('var(--color-fam-medios-0)')
  })
})

describe('el rótulo va DEBAJO, que es lo que el `.pen` dibuja', () => {
  it('cae por fuera del borde exterior, no sobre el anillo ni encima de él', () => {
    // «En mayúsculas» ya estaba cubierto; «debajo» no, y el rótulo se podía
    // mudar arriba del anillo con las trece pruebas en verde.
    const { container } = dibujar(UNO)
    const riel = rieles(container)[0] as Element
    const { rOuter } = radios(riel)

    const textos = Array.from(container.querySelectorAll('text'))
    const cifra = textos.find((t) => t.textContent?.includes('%')) as SVGTextElement
    const rotulo = textos.find((t) => t.textContent === 'VENTAS') as SVGTextElement

    const yCifra = Number(cifra.getAttribute('y'))
    expect(Number(rotulo.getAttribute('y'))).toBeGreaterThan(yCifra + rOuter)
  })
})

describe('el nombre accesible dice QUÉ anillo y CUÁNTO', () => {
  it('cada anillo aparece con su rótulo y su porcentaje formateado', () => {
    // El `svg` es `role="img"`: su nombre accesible es lo único que un lector de
    // pantalla recibe, y se podía quedar en el rótulo pelado —un número desnudo
    // al revés— sin que nada fallara.
    const { container } = dibujar(TRES)
    const nombre = container.querySelector('svg')?.getAttribute('aria-label') ?? ''
    expect(nombre).toContain('VENTAS 103% de su objetivo')
    expect(nombre).toContain('ÓRDENES 97% de su objetivo')
    expect(nombre).toContain('ROAS 95% de su objetivo')
  })
})

describe('el porcentaje se REDONDEA', () => {
  it('37,5% es 38% y no 37% · truncar cambia la cifra que se lee', () => {
    // Ningún fixture de arriba da un porcentaje fraccionario, así que redondear
    // o truncar daba el mismo resultado en las trece. El denominador es 8 a
    // propósito: `1005/1000` da 100,4999… en flotante y el «100%» resultante se
    // lee como un truncamiento que no ocurrió.
    const { container } = dibujar([{ k: 'a', label: 'Ventas', value: 3, max: 8 }])
    expect(container.textContent).toContain('38%')
  })
})
