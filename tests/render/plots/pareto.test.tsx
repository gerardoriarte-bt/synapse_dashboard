// @vitest-environment jsdom

/** El pareto · `pareto` sobre `categorica` · §PEN:Plot/PARETO · Causas de rechazo del feed
 *
 *  **Lo que se verifica es la ARITMÉTICA de la curva y la tinta, no que el SVG
 *  exista.** Un pareto mal hecho se ve como un pareto: la curva cierra igual de
 *  linda dividiendo por la cantidad de causas que por su total, y arranca igual
 *  de bien si el orden llegó al revés. Las dos cambian lo que el panel dice y
 *  ninguna se nota mirando la pantalla.
 *
 *  Las afirmaciones se montan contra el plot porque el cuerpo todavía no lo
 *  despacha: `BarsBody` y su `DIBUJA` son archivos compartidos y el cableado es
 *  una fase aparte. Las dos últimas fijan lo que ese cableado NO puede romper.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BarsBody } from '@/render/bodies/BarsBody'
import { createFormat } from '@/render/format'
import { PlotPareto } from '@/render/plots/PlotPareto'
import { MARGIN } from '@/render/plots/core/axisGeometry'
import { TEST_SIZE } from '../../setup'
import type { Value } from '@/api/types'

const categorica = (items: readonly { etiqueta: string; v: number }[]) =>
  ({ forma: 'categorica', items }) as unknown as Extract<Value, { forma: 'categorica' }>

/** Un formateador que no abrevia: las aserciones de geometría se leen mejor
 *  contra el número que contra «1,2 K». */
const plano = (v: number) => String(v)

/** Las cinco causas del dibujo, con los valores que se derivaron de sus alturas
 *  —123.7 · 90.6 · 84.1 · 49.4 · 18.1 px sobre 74 px = 250 unidades—. Su
 *  acumulado es 34 · 59 · 82 · 95 · 100 %, que es lo que el frame rotula. */
const CAUSAS = [
  { etiqueta: 'SIN IMAGEN', v: 417.8 },
  { etiqueta: 'SIN CATEGORIA', v: 306 },
  { etiqueta: 'SIN GTIN', v: 284 },
  { etiqueta: 'TITULO DUP', v: 166.9 },
  { etiqueta: 'PRECIO INC', v: 61.1 },
] as const

const CINCO = categorica(CAUSAS)

/** Las mismas cinco, barajadas. Un pareto tiene que salir idéntico. */
const DESORDENADAS = categorica([
  { etiqueta: 'PRECIO INC', v: 61.1 },
  { etiqueta: 'SIN IMAGEN', v: 417.8 },
  { etiqueta: 'SIN CATEGORIA', v: 306 },
  { etiqueta: 'TITULO DUP', v: 166.9 },
  { etiqueta: 'SIN GTIN', v: 284 },
])

/** El baseline, en coordenadas del grupo trasladado. El pie son dos filas y se
 *  lleva 46 px, no los 20 de `MARGIN.b`. */
const FOOT = 46
const BASE = TEST_SIZE.height - MARGIN.t - FOOT

const num = (el: Element, a: string) => Number(el.getAttribute(a))

const rects = (c: HTMLElement) => Array.from(c.querySelectorAll('rect'))
/** Las que llevan la opacidad reducida · van dentro del `<g opacity>`. */
const apagadas = (c: HTMLElement) => Array.from(c.querySelectorAll('g[opacity] rect'))
const plenas = (c: HTMLElement) => rects(c).filter((r) => r.closest('g[opacity]') === null)

const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const enDim = (c: HTMLElement) => textos(c).filter((t) => t.style.fill === 'var(--color-dim)')
/** La fila de acumulados es la única en `ink` · el frame la pinta en `$ink`. */
const acumulados = (c: HTMLElement) =>
  textos(c).filter((t) => t.style.fill === 'var(--color-ink)')
const categorias = (c: HTMLElement) =>
  enDim(c).filter((t) => t.getAttribute('text-anchor') === 'middle')

describe('la curva · la aritmética que se ve bien estando mal', () => {
  it('cierra en 100 %, y el 100 % sale del TOTAL', () => {
    // Dividir por `items.length` o arrancar la suma en el segundo item deja una
    // curva con la misma forma y otro significado.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    expect(acumulados(container).map((t) => t.textContent)).toEqual([
      '34%',
      '59%',
      '82%',
      '95%',
      '100%',
    ])
  })

  it('el acumulado se lee sobre el orden DESCENDENTE, no sobre el de llegada', () => {
    // Sin el `sort` el primer rótulo pasa a `5%` y la curva arranca por la causa
    // más chica: una escalera creciente que deja de ser un pareto.
    const { container } = render(
      <PlotPareto value={DESORDENADAS} family="inventario" format={plano} />,
    )

    expect(acumulados(container)[0]?.textContent).toBe('34%')
    expect(acumulados(container).map((t) => t.textContent)).toEqual([
      '34%',
      '59%',
      '82%',
      '95%',
      '100%',
    ])
  })

  it('el 100 % cae en el TOPE del área y el primer punto no', () => {
    // Las dos escalas van sobre el mismo alto: magnitud contra `ceiling` y
    // acumulado contra 100. Escalar el acumulado con la escala de magnitud pone
    // la curva pegada a la base y no se nota hasta que alguien la lee.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    const cys = Array.from(container.querySelectorAll('circle')).map((c) => num(c, 'cy'))
    expect(cys[cys.length - 1]).toBeCloseTo(0, 6)
    expect(cys[0]).toBeCloseTo(BASE * (1 - 0.338), 0)
  })

  it('el trazo pasa por sus vértices · la curva y los puntos son UNA cosa', () => {
    // Los `circle` y la `d` del `path` se calculan por separado, así que una
    // escala cambiada en una sola de las dos deja los puntos en su sitio y la
    // línea corrida — y se ve como una curva perfectamente razonable. Lo
    // encontró una mutación que SOBREVIVIÓ: escalar la línea con la escala de
    // magnitud no rompía ninguna de las quince aserciones anteriores.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    const d = container.querySelector('path')?.getAttribute('d') ?? ''
    const vertices = Array.from(d.matchAll(/[ML]([-\d.]+),([-\d.]+)/g)).map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    }))
    const puntos = Array.from(container.querySelectorAll('circle')).map((c) => ({
      x: num(c, 'cx'),
      y: num(c, 'cy'),
    }))

    expect(vertices).toHaveLength(5)
    expect(vertices).toEqual(puntos)
  })

  it('un vértice por categoría, ni uno más', () => {
    // Dibujar el punto sólo en el último, o duplicar el primero para «cerrar»
    // la curva, cambia el conteo.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    expect(container.querySelectorAll('circle')).toHaveLength(5)
  })

  it('total cero no divide por cero', () => {
    // Sin la guarda aparecen `NaN` en el `cy` de los puntos y en la `d` de la
    // curva — y un `NaN` en un atributo de SVG no falla: no se dibuja.
    const { container } = render(
      <PlotPareto
        value={categorica(CAUSAS.map((c) => ({ etiqueta: c.etiqueta, v: 0 })))}
        family="inventario"
        format={plano}
      />,
    )

    for (const el of Array.from(container.querySelectorAll('svg *'))) {
      for (const a of Array.from(el.attributes)) {
        expect(a.value).not.toContain('NaN')
      }
    }
    expect(container.querySelectorAll('circle')).toHaveLength(0)
  })
})

describe('la geometría de las barras', () => {
  it('las cinco apoyan en la base exacta', () => {
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    expect(rects(container)).toHaveLength(5)
    for (const r of rects(container)) {
      expect(num(r, 'y') + num(r, 'height')).toBeCloseTo(BASE, 6)
    }
  })

  it('la barra ocupa 0.68 del paso, que es el aire del dibujo', () => {
    // El defecto de `bandScale` es 0.2 → 0.8 del paso. El 0.32 se midió en el
    // `.pen`: paso 100.8 y barra 68.5.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    const xs = rects(container)
      .map((r) => num(r, 'x'))
      .sort((a, b) => a - b)
    const paso = (xs[1] ?? 0) - (xs[0] ?? 0)
    expect(paso).toBeGreaterThan(0)
    for (const r of rects(container)) {
      expect(num(r, 'width') / paso).toBeCloseTo(0.68, 2)
    }
  })

  it('la curva se ancla al CENTRO de la banda, no a su borde', () => {
    // Anclada al borde la curva queda media banda corrida y el último vértice
    // cae fuera de su barra. En el frame los centros son x + 68.5/2.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    const centros = rects(container)
      .map((r) => num(r, 'x') + num(r, 'width') / 2)
      .sort((a, b) => a - b)
    const cxs = Array.from(container.querySelectorAll('circle'))
      .map((c) => num(c, 'cx'))
      .sort((a, b) => a - b)

    expect(cxs).toHaveLength(centros.length)
    cxs.forEach((cx, i) => {
      expect(cx).toBeCloseTo(centros[i] ?? -1, 6)
    })
  })
})

describe('la tinta · sale del catálogo y ninguna es el acento', () => {
  it('la primera barra es el escalón 2 y las otras cuatro el 1 al 0.7', () => {
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    expect(plenas(container)).toHaveLength(1)
    expect(plenas(container)[0]?.getAttribute('fill')).toBe('var(--color-fam-inventario-2)')

    expect(apagadas(container)).toHaveLength(4)
    for (const r of apagadas(container)) {
      expect(r.getAttribute('fill')).toBe('var(--color-fam-inventario-1)')
    }
    expect(container.querySelector('g[opacity]')?.getAttribute('opacity')).toBe('0.7')
  })

  it('la curva es DATO, así que sale de la familia · escalón 3', () => {
    // El dibujo la pinta en una segunda familia y acá no se puede: la familia se
    // lee del catálogo, nunca se elige en el componente. Ver la desviación 2.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    const curva = container.querySelector('path')
    expect(curva?.getAttribute('stroke')).toBe('var(--color-fam-inventario-3)')
    for (const c of Array.from(container.querySelectorAll('circle'))) {
      expect(c.getAttribute('fill')).toBe('var(--color-fam-inventario-3)')
    }
  })

  it('el color sale de la familia que llega por PROP', () => {
    // Cablear `inventario` adentro es exactamente lo que la regla dura 1
    // prohíbe, y con la familia del dibujo puesta a mano nadie lo nota.
    const { container } = render(<PlotPareto value={CINCO} family="medios" format={plano} />)

    expect(container.innerHTML).toContain('--color-fam-medios-')
    expect(container.innerHTML).not.toContain('inventario')
    expect(container.innerHTML).not.toContain('demanda')
  })

  it('ningún hex, ningún `acc`', () => {
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

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

describe('el pie · dos filas, y el orden entre ellas se ve', () => {
  it('la categoría va ENCIMA de su acumulado, las dos bajo la base', () => {
    // Las dos filas se posicionan con dos constantes distintas y nada las ataba:
    // intercambiarlas deja el porcentaje arriba y la categoría abajo —el pie del
    // frame al revés— sin mover ni una `x`, que es lo único que se afirmaba.
    // Mutación que SOBREVIVIÓ hasta esta prueba.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    const cat = categorias(container).map((t) => num(t, 'y'))
    const pct = acumulados(container).map((t) => num(t, 'y'))

    expect(cat).toHaveLength(5)
    cat.forEach((yc, i) => {
      expect(yc).toBeGreaterThan(BASE)
      expect(yc).toBeLessThan(pct[i] ?? -1)
    })
  })

  it('el acumulado repite el contrato tipográfico de un label, en TOKENS', () => {
    // La fila es un `<text>` propio porque `AxisText` es `dim` fijo, y esa copia
    // es la desviación 3. Copiar el color y perder el tamaño deja una cifra en
    // 16px que se ve casi igual: un token mal nombrado no es un error, es
    // silencio. Mutación que SOBREVIVIÓ hasta esta prueba.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    for (const t of acumulados(container)) {
      expect(t.style.fontFamily).toBe('var(--font-mono)')
      expect(t.style.fontSize).toBe('var(--text-label)')
      expect(t.style.letterSpacing).toBe('var(--tracking-rotulo)')
    }
  })
})

describe('el recorte por ancho · la desviación 3 declarada', () => {
  it('una categoría más larga que su banda sale con elipsis, no desbordada', () => {
    // El dibujo deja «Precio inconsistente» desbordar su banda; la desviación 3
    // dice que acá se recorta, y el recorte lo hace `CategoryAxis` a partir del
    // ancho que este plot le pasa. Pasarle un ancho de más apaga el recorte sin
    // romper nada: las cinco etiquetas del fixture de arriba son cortas y ninguna
    // lo ejercitaba. Mutación que SOBREVIVIÓ hasta esta prueba.
    const { container } = render(
      <PlotPareto
        value={categorica([
          { etiqueta: 'PRECIO INCONSISTENTE', v: 417.8 },
          { etiqueta: 'TITULO DUPLICADO', v: 306 },
          { etiqueta: 'SIN GTIN', v: 284 },
          { etiqueta: 'SIN CATEGORIA', v: 166.9 },
          { etiqueta: 'SIN IMAGEN', v: 61.1 },
        ])}
        family="inventario"
        format={plano}
      />,
    )

    const largas = categorias(container).map((t) => t.textContent ?? '')
    expect(largas[0]).toContain('…')
    expect(largas[0]?.startsWith('PRECIO INCONSI')).toBe(true)
    expect(largas[0]).not.toBe('PRECIO INCONSISTENTE')
    // La que entra no se toca.
    expect(largas).toContain('SIN GTIN')
  })
})

describe('el techo de la escala de magnitud', () => {
  it('es el `ceiling` redondeado, no el máximo · la barra más alta no toca el borde', () => {
    // `ceiling(417.8)` da 500, que es EXACTAMENTE el tope que el frame dibuja, y
    // es de donde sale el aire sobre la barra más alta. Con el máximo crudo como
    // techo la barra llega al borde y se lee cortada: nada cambiaba de sitio en
    // las aserciones anteriores porque la base y la curva no dependen del techo.
    // Mutación que SOBREVIVIÓ hasta esta prueba.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    const alta = Math.max(...rects(container).map((r) => num(r, 'height')))
    expect(alta / BASE).toBeCloseTo(417.8 / 500, 3)
    expect(alta).toBeLessThan(BASE)
  })
})

describe('el payload no se toca', () => {
  it('ordena sobre una COPIA · el arreglo que llega queda como llegó', () => {
    // El arreglo viene del cache de TanStack Query y `sort` muta: ordenarlo en
    // su sitio reordena el dato de todo el que comparta esa entrada, y el propio
    // pareto sale idéntico, así que no se nota acá. Mutación que SOBREVIVIÓ
    // hasta esta prueba.
    const entrada = [
      { etiqueta: 'PRECIO INC', v: 61.1 },
      { etiqueta: 'SIN IMAGEN', v: 417.8 },
      { etiqueta: 'SIN CATEGORIA', v: 306 },
      { etiqueta: 'TITULO DUP', v: 166.9 },
      { etiqueta: 'SIN GTIN', v: 284 },
    ]
    const antes = entrada.map((i) => i.etiqueta)

    render(<PlotPareto value={categorica(entrada)} family="inventario" format={plano} />)

    expect(entrada.map((i) => i.etiqueta)).toEqual(antes)
  })
})

describe('ningún número desnudo', () => {
  it('cada acumulado lleva su categoría encima, alineada a la misma banda', () => {
    // Borrar el `<CategoryAxis>` del pie deja cinco cifras sueltas, que es la
    // regla dura que el primitivo `Label` existe para sostener.
    const { container } = render(<PlotPareto value={CINCO} family="inventario" format={plano} />)

    expect(categorias(container)).toHaveLength(5)
    expect(acumulados(container)).toHaveLength(5)

    const xs = categorias(container).map((t) => num(t, 'x'))
    for (const t of acumulados(container)) {
      expect(xs).toContain(num(t, 'x'))
    }
    expect(categorias(container)[0]?.textContent).toBe('SIN IMAGEN')
  })

  it('el eje de valores usa el `format` inyectado y no el número crudo', () => {
    // Un plot que formatea por su cuenta decide el locale del tenant, que es lo
    // que la prop `format` existe para impedir.
    const { container } = render(
      <PlotPareto value={CINCO} family="inventario" format={(v) => `«${v}»`} />,
    )

    const ejes = enDim(container).filter((t) => t.getAttribute('text-anchor') === 'end')
    expect(ejes.length).toBeGreaterThan(0)
    for (const t of ejes) {
      expect(t.textContent).toMatch(/^«.+»$/)
    }
  })
})

/* ── Lo que el cableado posterior NO puede romper ──────────────────────────── */

const cuerpo = {
  span: { colStart: 1, colSpan: 6, rowSpan: 4 },
  family: 'inventario',
  metric: 'Causas de rechazo del feed',
  format: createFormat('es-MX'),
} as const

describe('el despacho del cuerpo · hoy y después del cableado', () => {
  it('`pareto` sobre `ranking` se DECLARA, no se dibuja', () => {
    // §5 le da `pareto` sólo a `categorica`. Por eso `DIBUJA` está keyeado por
    // forma: una dona servida como barras se ve perfecta y miente.
    const ranking = {
      forma: 'ranking',
      items: [
        { etiqueta: 'A', v: 9, posicion: 1 },
        { etiqueta: 'B', v: 4, posicion: 2 },
      ],
    } as unknown as Extract<Value, { forma: 'ranking' }>

    render(<BarsBody {...cuerpo} value={ranking} params={{}} grafico="pareto" />)

    expect(screen.getByText(/pareto/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /Pareto/ })).toBeNull()
  })

  it('ausente sigue dibujando barras horizontales', () => {
    // Los doce paneles publicados traen `chart: ''`, así que mover el defecto
    // apaga la consola entera.
    render(<BarsBody {...cuerpo} value={CINCO} params={{}} />)

    expect(screen.getByRole('img', { name: /categorías/ })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Pareto/ })).toBeNull()
  })
})
