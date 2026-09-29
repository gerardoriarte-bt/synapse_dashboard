// @vitest-environment jsdom

/** Las columnas · `columns` sobre `categorica` · §PEN:Plot/COLUMNAS · Ventas por mes
 *
 *  **Lo que se verifica es la GEOMETRÍA y la tinta, no que el SVG exista.** Un
 *  gráfico de columnas mal hecho se ve como un gráfico de columnas: invertido,
 *  con la más alta tocando el borde, o con las doce del mismo color. Ninguna de
 *  esas tres se nota mirando la pantalla, y las tres cambian lo que el panel
 *  dice.
 *
 *  Las afirmaciones se montan contra el plot porque el cuerpo todavía no lo
 *  despacha: `BarsBody` y su `DIBUJA` son archivos compartidos y el cableado es
 *  una fase aparte. Las dos últimas pruebas fijan lo que ese cableado NO puede
 *  romper.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BarsBody } from '@/render/bodies/BarsBody'
import { createFormat } from '@/render/format'
import { PlotColumns } from '@/render/plots/PlotColumns'
import { MARGIN, textWidth } from '@/render/plots/core/axisGeometry'
import { TEST_SIZE } from '../../setup'
import type { Value } from '@/api/types'

const categorica = (items: readonly { etiqueta: string; v: number }[]) =>
  ({ forma: 'categorica', items }) as unknown as Extract<Value, { forma: 'categorica' }>

/** Un formateador que no abrevia: las aserciones de geometría se leen mejor
 *  contra el número que contra «1,2 K». */
const plano = (v: number) => String(v)

/** Siete caracteres, que es lo que el cable manda de verdad —`2026-01`— y lo que
 *  hace que el ralo del eje se dispare. Con «ENE» de tres entran las doce. */
const MESES = [
  'ENE2026', 'FEB2026', 'MAR2026', 'ABR2026', 'MAY2026', 'JUN2026',
  'JUL2026', 'AGO2026', 'SEP2026', 'OCT2026', 'NOV2026', 'DIC2026',
] as const

const DOCE = categorica(MESES.map((etiqueta, i) => ({ etiqueta, v: i + 1 })))

/** El baseline, en coordenadas del grupo trasladado: `y(0)`. */
const BASE = TEST_SIZE.height - MARGIN.t - MARGIN.b

const rects = (c: HTMLElement) => Array.from(c.querySelectorAll('rect'))
/** Las que llevan la opacidad reducida · van dentro del `<g opacity>`. */
const apagadas = (c: HTMLElement) => Array.from(c.querySelectorAll('g[opacity] rect'))
const plenas = (c: HTMLElement) => rects(c).filter((r) => r.closest('g[opacity]') === null)

const num = (el: Element, a: string) => Number(el.getAttribute(a))

const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const enDim = (c: HTMLElement) => textos(c).filter((t) => t.style.fill === 'var(--color-dim)')
/** La cifra de la destacada es la única en `ink`. */
const enInk = (c: HTMLElement) => textos(c).filter((t) => t.style.fill === 'var(--color-ink)')
const categorias = (c: HTMLElement) =>
  enDim(c).filter((t) => t.getAttribute('text-anchor') === 'middle')
const valores = (c: HTMLElement) =>
  enDim(c).filter((t) => t.getAttribute('text-anchor') === 'end')

describe('la geometría · lo que se ve bien estando mal', () => {
  it('las columnas crecen desde la base hacia ARRIBA', () => {
    // Invertir el rango de la escala cuelga las doce del techo, y un gráfico
    // invertido se ve como un gráfico perfectamente válido.
    const { container } = render(<PlotColumns value={DOCE} family="demanda" format={plano} />)

    expect(rects(container)).toHaveLength(12)
    for (const r of rects(container)) {
      expect(num(r, 'y') + num(r, 'height')).toBeCloseTo(BASE, 6)
    }
  })

  it('el techo es `ceiling` y ninguna columna toca el borde', () => {
    // Con `Math.max` en vez de `ceiling`, la del 81 sube a y = 0 y se lee
    // cortada. Es el caso que el comentario de `ceiling` ya registra.
    const { container } = render(
      <PlotColumns
        value={categorica([{ etiqueta: 'A', v: 10 }, { etiqueta: 'B', v: 81 }])}
        family="demanda"
        format={plano}
      />,
    )

    const ys = rects(container).map((r) => num(r, 'y'))
    expect(Math.min(...ys)).toBeGreaterThan(0)
  })

  it('la columna ocupa 0.64 del paso, que es el aire del dibujo', () => {
    // El defecto de `bandScale` es 0.2 → 0.8 del paso, y eso no son columnas:
    // es un apilado sin aire. El 0.36 se midió en el `.pen`.
    const { container } = render(<PlotColumns value={DOCE} family="demanda" format={plano} />)

    const xs = rects(container).map((r) => num(r, 'x'))
    const paso = (xs[1] ?? 0) - (xs[0] ?? 0)
    expect(paso).toBeGreaterThan(0)
    for (const r of rects(container)) {
      expect(num(r, 'width') / paso).toBeCloseTo(0.64, 2)
    }
  })
})

describe('el resaltado · la única diferencia de tinta del dibujo', () => {
  it('la destacada es la ÚNICA plena y usa el escalón 1', () => {
    const { container } = render(
      <PlotColumns value={DOCE} family="demanda" format={plano} destacado="JUL2026" />,
    )

    // Intercambiar los escalones, borrar el uso de `destacado` o aplicar la
    // opacidad al grupo entero rompen alguna de estas tres.
    expect(plenas(container)).toHaveLength(1)
    expect(plenas(container)[0]?.getAttribute('fill')).toBe('var(--color-fam-demanda-1)')

    expect(apagadas(container)).toHaveLength(11)
    for (const r of apagadas(container)) {
      expect(r.getAttribute('fill')).toBe('var(--color-fam-demanda-0)')
    }
    expect(container.querySelector('g[opacity]')?.getAttribute('opacity')).toBe('0.6')
  })

  it('la cifra se formatea con `format` y no con el número crudo', () => {
    // Dibujar `String(v)` o `v.toFixed(2)` pierde el locale del tenant, que es
    // exactamente lo que la prop `format` existe para impedir.
    const { container } = render(
      <PlotColumns
        value={categorica([{ etiqueta: 'ENE', v: 4.28 }, { etiqueta: 'FEB', v: 2 }])}
        family="demanda"
        format={(v) => `«${v}»`}
        destacado="ENE"
      />,
    )

    expect(enInk(container).map((t) => t.textContent)).toEqual(['«4.28»'])
    expect(textos(container).map((t) => t.textContent)).not.toContain('4.28')
  })

  it('sin `destacado` no hay cifra · el dato no dice cuál columna es la actual', () => {
    // Resaltar «la más alta» o «la última» por cuenta del componente hace
    // aparecer una cifra que el dato no pidió. `ValorCategorica` es
    // `{ etiqueta, v }` y nada más.
    const { container } = render(<PlotColumns value={DOCE} family="demanda" format={plano} />)

    expect(enInk(container)).toHaveLength(0)
    expect(plenas(container)).toHaveLength(0)
  })
})

describe('el eje ralo · sale de que quepa, no de un «cada dos» escrito a mano', () => {
  it('con las etiquetas del cable se rotulan menos de doce', () => {
    const { container } = render(
      <PlotColumns value={DOCE} family="demanda" format={plano} destacado="AGO2026" />,
    )

    // Siete caracteres sobre un paso de ~47 dan `every` 2: seis de índice par
    // más la destacada, que es impar.
    expect(categorias(container).length).toBeLessThan(12)
    expect(categorias(container)).toHaveLength(7)
  })

  it('la destacada se rotula aunque el ralo la saltee', () => {
    // Sin la excepción, la cifra queda sobre una columna sin rótulo — que es un
    // número desnudo, y es regla dura.
    const { container } = render(
      <PlotColumns value={DOCE} family="demanda" format={plano} destacado="AGO2026" />,
    )

    const r = plenas(container)[0]
    expect(r).toBeDefined()
    const centro = num(r as Element, 'x') + num(r as Element, 'width') / 2
    expect(categorias(container).map((t) => num(t, 'x'))).toContain(centro)
    expect(categorias(container).some((t) => t.textContent?.startsWith('AGO'))).toBe(true)
  })

  it('el eje de valores reserva por el rótulo MÁS LARGO', () => {
    // Con `MIN_RESERVE` el eje se recorta a «00.000», que es el defecto que
    // `axisReserve` documenta como heredado de v2 en tres plots.
    const { container } = render(
      <PlotColumns value={DOCE} family="demanda" format={() => '1.000.000'} />,
    )

    expect(valores(container).length).toBeGreaterThan(0)
    for (const t of valores(container)) {
      expect(num(t, 'x') - textWidth((t.textContent ?? '').length)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('lo que las mutaciones que SOBREVIVIERON dejaban pasar', () => {
  it('con etiquetas CORTAS se rotulan las doce · el ralo se deriva', () => {
    // Con `const every = 2` escrito a mano las doce pruebas anteriores pasaban
    // igual, porque todas usan las etiquetas de siete caracteres del cable. La
    // afirmación de que el ralo «sale de que quepa» necesita el otro extremo:
    // con «A» de un carácter caben las doce y el eje no debe ralear nada.
    const cortas = categorica(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((etiqueta, i) => ({
        etiqueta,
        v: i + 1,
      })),
    )
    const { container } = render(<PlotColumns value={cortas} family="demanda" format={plano} />)

    expect(categorias(container)).toHaveLength(12)
  })

  it('la familia llega por prop · el plot no tiene paleta', () => {
    // Cablear `family="demanda"` en las dos llamadas a `Bars` sobrevivía a las
    // doce, porque las doce piden `demanda`. La persistencia cromática de §2.2
    // se apoya en que la familia venga del catálogo, y eso se ve con OTRA.
    const { container } = render(
      <PlotColumns value={DOCE} family="inventario" format={plano} destacado="JUL2026" />,
    )

    expect(plenas(container)[0]?.getAttribute('fill')).toBe('var(--color-fam-inventario-1)')
    for (const r of apagadas(container)) {
      expect(r.getAttribute('fill')).toBe('var(--color-fam-inventario-0)')
    }
  })

  it('la cifra va ARRIBA del tope y centrada sobre su columna', () => {
    // Mover la cifra debajo del tope, o pegarla al borde izquierdo de la banda,
    // pasaba las doce: sólo se afirmaba su TEXTO. Una cifra corrida se lee como
    // la de la columna vecina, que es peor que no tenerla.
    const { container } = render(
      <PlotColumns value={DOCE} family="demanda" format={plano} destacado="JUL2026" />,
    )

    const r = plenas(container)[0]
    const cifra = enInk(container)[0]
    expect(r).toBeDefined()
    expect(cifra).toBeDefined()

    const centro = num(r as Element, 'x') + num(r as Element, 'width') / 2
    expect(num(cifra as Element, 'x')).toBeCloseTo(centro, 6)
    expect(num(cifra as Element, 'y')).toBeLessThan(num(r as Element, 'y'))
  })
})

describe('los colores salen de tokens y ninguno es el acento', () => {
  it('ningún literal, ningún `acc`', () => {
    // «Resaltado» suena a acento, y el naranja no es color de datos: nunca en
    // una serie, barra, celda o nodo. El resaltado se hace con el escalón 1 de
    // la familia y con opacidad.
    const { container } = render(
      <PlotColumns value={DOCE} family="demanda" format={plano} destacado="JUL2026" />,
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

/* ── Lo que el cableado posterior NO puede romper ──────────────────────────── */

const cuerpo = {
  span: { colStart: 1, colSpan: 6, rowSpan: 4 },
  family: 'demanda',
  metric: 'Ventas por mes',
  format: createFormat('es-MX'),
} as const

describe('el despacho del cuerpo · hoy y después del cableado', () => {
  it('`columns` sobre `ranking` se DECLARA, no se dibuja', () => {
    // §5 le da a `ranking` sólo `bars, lollipop, bump, list, table`. Por eso
    // `DIBUJA` está keyeado por forma y no es una lista sola.
    const ranking = {
      forma: 'ranking',
      items: [
        { etiqueta: 'A', v: 9, posicion: 1 },
        { etiqueta: 'B', v: 4, posicion: 2 },
      ],
    } as unknown as Extract<Value, { forma: 'ranking' }>

    render(<BarsBody {...cuerpo} value={ranking} params={{}} grafico="columns" />)

    expect(screen.getByText(/columns/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /columnas/ })).toBeNull()
  })

  it('ausente sigue dibujando barras horizontales', () => {
    // Los doce paneles publicados traen `chart: ''`, así que mover el defecto
    // apaga la consola entera.
    render(<BarsBody {...cuerpo} value={DOCE} params={{}} />)

    expect(screen.getByRole('img', { name: /categorías/ })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /columnas/ })).toBeNull()
  })
})
