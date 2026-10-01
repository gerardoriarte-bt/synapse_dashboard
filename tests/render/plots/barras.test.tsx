// @vitest-environment jsdom

/** Las barras horizontales · `PlotBars` · §PEN:Plot/BARRAS · Venta por categoría
 *
 *  ── POR QUÉ ESTE ARCHIVO NACE EL 2026-10-01 ────────────────────────────────
 *
 *  **`PlotBars` no tenía ninguna prueba propia** —se usaba desde tres archivos y
 *  ninguno lo miraba— y por eso una divergencia con el dibujo sobrevivió desde
 *  el port: **el `.pen` pone la cifra de cada barra y el componente no la
 *  dibujaba.**
 *
 *  El frame escribe `Running · USD 1.62M`, `Training · USD 1.08M` y así las
 *  seis, en `$font-mono 11` y `$ink`, todas alineadas a la misma `x`.
 *
 *  **Con dato real la consecuencia se veía**: `Goals vs actual` dibujaba cinco
 *  barras entre 72 y 104 sobre un eje `0–150`, y no había forma de saber ninguno
 *  de los cinco números. Es «ningún número desnudo» al revés — la regla persigue
 *  una cifra sin rótulo, y acá había un rótulo sin cifra.
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotBars } from '@/render/plots/PlotBars'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const number = (v: number) => format.number(v, { abbreviate: true })

const categorica = (items: readonly { etiqueta: string; v: number }[]) =>
  ({ forma: 'categorica', items }) as Extract<Value, { forma: 'categorica' }>

/** Los cinco de `Goals vs actual` con dato real, que es el caso que lo originó.
 *  **Valores distintos y cercanos entre sí** a propósito: con cifras lejanas se
 *  distinguen por el largo de la barra y la prueba no probaría nada. */
const METAS = categorica([
  { etiqueta: 'Visitas', v: 103.8 },
  { etiqueta: 'Unidades', v: 101.6 },
  { etiqueta: 'Ventas', v: 96.7 },
  { etiqueta: 'Órdenes', v: 85.8 },
  { etiqueta: 'Inversión', v: 73.2 },
])

const dibujar = (v = METAS) =>
  render(<PlotBars value={v} family="demanda" format={number} />)

const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const num = (el: Element, a: string) => Number.parseFloat(el.getAttribute(a) ?? 'NaN')

/** Las cifras son mono 11; los rótulos de categoría y el eje van en otros
 *  tamaños. Es lo que las distingue sin agregarle al SVG un atributo que exista
 *  sólo para la prueba. */
const cifras = (c: HTMLElement) =>
  textos(c).filter((t) => (t.getAttribute('style') ?? '').includes('--text-cifra'))

describe('cada barra lleva SU cifra · el dibujo las pone y faltaban', () => {
  it('las cinco se escriben, y son las cinco del dato', () => {
    const { container } = dibujar()
    const escritas = cifras(container).map((t) => t.textContent)

    expect(escritas).toHaveLength(5)
    for (const v of [103.8, 101.6, 96.7, 85.8, 73.2]) {
      expect(escritas).toContain(number(v))
    }
  })

  it('cada cifra está a la ALTURA de su barra · cruzarlas se ve bien', () => {
    // **Es la aserción que importa**, y la que un conteo no da: cinco cifras
    // correctas en el orden equivocado se ven perfectamente prolijas y dicen que
    // Inversión cumplió el 103,8%.
    const { container } = dibujar()
    const porAltura = [...cifras(container)].sort((a, b) => num(a, 'y') - num(b, 'y'))

    expect(porAltura.map((t) => t.textContent)).toEqual(
      [103.8, 101.6, 96.7, 85.8, 73.2].map(number),
    )
  })

  it('y TODAS terminan en la misma x · alineadas entre sí, no al final de su barra', () => {
    // El dibujo las pone todas en la misma columna —`x: 477.8` en las seis— y
    // eso es lo que deja compararlas de un vistazo. Pegadas al final de cada
    // barra formarían una escalera y habría que leerlas de a una.
    const { container } = dibujar()
    const xs = new Set(cifras(container).map((t) => t.getAttribute('x')))

    expect(xs.size).toBe(1)
  })

  it('la cifra pasa por el FORMATEADOR que llega por prop', () => {
    // Un plot no formatea por su cuenta: el locale lo decide quien sabe de qué
    // tenant se trata. Con el crudo, `103.8` saldría con punto decimal donde el
    // tenant usa coma.
    const { container } = dibujar(categorica([{ etiqueta: 'Uno', v: 1_620_000 }]))

    expect(cifras(container)[0]?.textContent).toBe(number(1_620_000))
    expect(cifras(container)[0]?.textContent).not.toBe('1620000')
  })
})

describe('la columna de cifras entra en el lienzo', () => {
  it('su borde derecho no se sale del SVG', () => {
    // ── LA MUTACIÓN QUE SOBREVIVIÓ, Y POR QUÉ ───────────────────────────────
    //
    // La primera versión de esta prueba medía SOLAPAMIENTO entre la barra más
    // larga y la cifra, y no servía: si el área de barras no reserva el ancho de
    // la columna, la cifra **también** se corre a la derecha —su `x` sale de
    // `width`— así que nunca se pisan. Lo que pasa de verdad es que el conjunto
    // se va afuera del lienzo.
    //
    // Medido a 600 de ancho: con la reserva, `left + width + figureW` da
    // exactamente el ancho útil; sin ella, se pasa por 97px.
    const { container } = dibujar()
    const svg = container.querySelector('svg') as SVGElement
    const ancho = num(svg, 'width')

    // La `x` de la cifra es relativa al `<g>` que desplaza por la columna de
    // etiquetas, así que el borde absoluto es la suma de los dos.
    const g = cifras(container)[0]?.closest('g') as SVGElement
    const left = Number.parseFloat(
      /translate\(([-\d.]+)/.exec(g.getAttribute('transform') ?? '')?.[1] ?? 'NaN',
    )
    const derecha = Math.max(...cifras(container).map((t) => left + num(t, 'x')))

    expect(derecha).toBeLessThanOrEqual(ancho)
  })
})
