// @vitest-environment jsdom

/** El lollipop · `lollipop` · §PEN:Plot/LOLLIPOP
 *
 *  **Los números esperados salen del DIBUJO, no del archivo que se prueba.** Las
 *  fracciones de abajo son las que se midieron sobre el frame
 *  `Plot/LOLLIPOP · Estilos con mayor venta`; están escritas acá otra vez a
 *  propósito, porque una prueba que importa las constantes de la implementación
 *  no puede fallar nunca — ni cuando la implementación está mal.
 *
 *  Y lo que se verifica no es que el SVG exista. Un lollipop con el punto a un
 *  par de píxeles de la punta del tallo, o con la cifra pintada como si fuera un
 *  rótulo, se ve bien en una captura y está mal en las dos cosas.
 */
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlotLollipop } from '@/render/plots/PlotLollipop'
import { charsThatFit } from '@/render/plots/core/axisGeometry'
import { _resetObserver } from '@/render/plots/core/useSize'
import { TEST_SIZE } from '../../setup'
import type { Family, Value } from '@/api/types'

/* ── La geometría del frame, 580 × 208 ─────────────────────────────────────── */

/** Borde derecho de las etiquetas en 140 ⇒ 140/580. */
const LABEL_WIDTH = 0.24
/** Las cifras arrancan en 485,6 ⇒ el borde queda a 94,4/580 del derecho. */
const VALUE_WIDTH = 0.16
/** 152 − 140, el aire entre la etiqueta y el origen del tallo. */
const GAP = 12
/** `ellipse` de 11 × 11. */
const DOT_R = 5.5

const left = Math.round(TEST_SIZE.width * LABEL_WIDTH)
const originX = left + GAP
const valueX = TEST_SIZE.width - Math.round(TEST_SIZE.width * VALUE_WIDTH)
const trackW = valueX - GAP - DOT_R - originX

const categorica = (items: readonly { etiqueta: string; v: number }[]) =>
  ({ forma: 'categorica', items }) as unknown as Extract<Value, { forma: 'categorica' }>

/** El formateador ESPÍA. Se inyecta siempre —nunca el real— porque lo que hay
 *  que poder afirmar es que el plot lo llama y no que la cifra «se ve bien». */
const spy = (v: number) => `«${v}»`

const base = { family: 'demanda', format: spy } as const

/** Las siete filas del frame, con sus valores. */
const SIETE = categorica([
  { etiqueta: 'Charged Assert 10', v: 184 },
  { etiqueta: 'HOVR Phantom 4', v: 162 },
  { etiqueta: 'Tech 2.0 Tee', v: 118 },
  { etiqueta: 'Rival Fleece Hoodie', v: 104 },
  { etiqueta: 'Project Rock Tank', v: 86 },
  { etiqueta: 'Storm Backpack', v: 61 },
  { etiqueta: 'Speedform Slip', v: 44 },
])

/** Los tallos leídos del DOM: de dónde arrancan, dónde terminan y a qué altura.
 *  El `path` de un tallo es el único del dibujo —no hay rejilla ni eje—, así que
 *  no hace falta un atributo de prueba. */
const stems = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path')).map((p) => {
    const m = /^M(-?[\d.]+),(-?[\d.]+)L(-?[\d.]+),(-?[\d.]+)$/.exec(p.getAttribute('d') ?? '')
    if (m === null) throw new Error(`tallo ilegible: ${p.getAttribute('d')}`)
    return {
      from: Number(m[1]),
      to: Number(m[3]),
      y: Number(m[2]),
      stroke: p.getAttribute('stroke') ?? '',
    }
  })

const dots = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('circle')).map((n) => ({
    cx: Number(n.getAttribute('cx')),
    cy: Number(n.getAttribute('cy')),
    r: Number(n.getAttribute('r')),
    fill: n.getAttribute('fill') ?? '',
  }))

/** Los `<text>` con su estilo crudo. Se lee el atributo y no `el.style` porque
 *  el valor es una `var()` y lo que importa es qué token se pidió. */
const texts = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('text')).map((n) => ({
    content: n.textContent ?? '',
    x: Number(n.getAttribute('x')),
    y: Number(n.getAttribute('y')),
    style: n.getAttribute('style') ?? '',
  }))

const draw = (value: Extract<Value, { forma: 'categorica' }>, family: Family = 'demanda') =>
  render(<PlotLollipop {...base} family={family} value={value} />)

/** Renderiza contra un tamaño distinto del 600 × 300 que informa el doble de
 *  `tests/setup.ts`. Es el patrón de `core/useSize.test.tsx`: el observer es un
 *  singleton de módulo, así que hay que reiniciarlo para que tome el doble
 *  nuevo. Existe porque dos garantías del plot —el piso del recorte y la guarda
 *  de tamaño cero— sólo se ven a un tamaño que el doble por defecto no produce
 *  nunca. */
const drawAt = (
  size: { width: number; height: number } | null,
  value: Extract<Value, { forma: 'categorica' }>,
) => {
  _resetObserver()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly cb: ResizeObserverCallback
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb
      }
      /** Con `size === null` NO notifica, que es lo que hace el observer real en
       *  el primer frame: el hook se queda en 0 × 0. */
      observe(target: Element): void {
        if (size === null) return
        this.cb(
          [{ target, contentRect: size } as unknown as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        )
      }
      unobserve(): void {}
      disconnect(): void {}
    },
  )
  return render(<PlotLollipop {...base} family="demanda" value={value} />)
}

afterEach(() => {
  _resetObserver()
  vi.unstubAllGlobals()
})

describe('el tallo dice la magnitud', () => {
  /** **NINGÚN valor es cero, y es deliberado.** Con un cero en la lista,
   *  `[min, max]` y `[min(0, …), max(0, …)]` dan el mismo dominio y la mutación
   *  que borra el origen en cero sobrevive sin que nada se ponga rojo. */
  const V = categorica([
    { etiqueta: 'A', v: 100 },
    { etiqueta: 'B', v: 50 },
    { etiqueta: 'C', v: 25 },
  ])

  it('es proporcional, arranca en cero y el máximo llena el riel', () => {
    // **Las dos mitades hacen falta.** Sólo con la proporción, un techo con aire
    // —`ceiling`— sobrevive: B seguiría siendo la mitad de A y ninguno llegaría
    // al final del riel. Y sólo con el máximo, un dominio `[min, max]` sobrevive.
    const { container } = draw(V)
    const [a, b, c] = stems(container)

    expect(a?.to).toBeCloseTo(originX + trackW, 6)
    expect(b?.to).toBeCloseTo(originX + trackW / 2, 6)
    expect(c?.to).toBeCloseTo(originX + trackW / 4, 6)
    // Y los tres arrancan en `x(0)`, que con dominio `[25, 100]` caería fuera
    // del riel por la izquierda.
    expect([a?.from, b?.from, c?.from]).toEqual([originX, originX, originX])
  })

  it('un valor de cero es un tallo de largo cero, no una fila que falta', () => {
    const { container } = draw(categorica([{ etiqueta: 'A', v: 100 }, { etiqueta: 'Z', v: 0 }]))
    const [, z] = stems(container)

    expect(z?.to).toBeCloseTo(originX, 6)
    expect(dots(container)).toHaveLength(2)
  })

  it('un valor NEGATIVO sale hacia la izquierda del origen', () => {
    // No está en el dibujo y el contrato lo permite: `items[].v` es `number` a
    // secas. La decisión —dominio `[min(0, …), max(0, …)]` con el tallo saliendo
    // de `x(0)`— es de la especificación, no del `.pen`, y si diseño la quiere de
    // otra forma cambia acá.
    const { container } = draw(categorica([{ etiqueta: 'sube', v: 100 }, { etiqueta: 'baja', v: -40 }]))
    const [sube, baja] = stems(container)

    expect(baja?.to).toBeLessThan(baja?.from ?? 0)
    expect(sube?.from).toBe(baja?.from)
    expect(baja?.to).toBeCloseTo(originX, 6)
  })

  it('el punto se para EN la punta, no cerca', () => {
    // Dibujarlo en `x(v) + DOT_R` «para que no se salga», o tomar `y(k)` en vez
    // del centro de la banda, separa el caramelo del palito — y las dos cosas se
    // ven casi bien en una captura.
    const { container } = draw(V)
    const tallos = stems(container)
    const puntos = dots(container)

    expect(puntos).toHaveLength(tallos.length)
    puntos.forEach((p, i) => {
      expect(p.cx).toBe(tallos[i]?.to)
      expect(p.cy).toBe(tallos[i]?.y)
      expect(p.r).toBe(DOT_R)
    })
  })
})

describe('una fila por ítem, en el orden del payload', () => {
  it('siete ítems son siete filas con paso `h/n`', () => {
    const { container } = draw(SIETE)
    const tallos = stems(container)

    expect(tallos).toHaveLength(7)
    expect(dots(container)).toHaveLength(7)

    const ys = tallos.map((s) => s.y)
    // **El centro ABSOLUTO, no sólo el paso.** Tomar `y(k)` en vez de
    // `y(k) + bandwidth/2` deja el paso intacto y corre las siete filas hacia
    // arriba: sin este número la mutación sobrevive, porque tallo y punto usan
    // la misma variable y siguen coincidiendo entre sí.
    expect(ys[0]).toBeCloseTo(TEST_SIZE.height / 14, 6)
    ys.forEach((y, i) => {
      if (i === 0) return
      expect(y).toBeGreaterThan(ys[i - 1] ?? 0)
      expect(y - (ys[i - 1] ?? 0)).toBeCloseTo(TEST_SIZE.height / 7, 6)
    })
  })

  it('NO reordena: con el payload ascendente, el primero sigue arriba', () => {
    // `orden` es un param declarado de `BarsParams` y lo aplica el cuerpo. Un
    // plot que ordene adentro rompe `orden: 'natural'` en silencio.
    const { container } = draw(
      categorica([
        { etiqueta: 'chico', v: 10 },
        { etiqueta: 'grande', v: 90 },
      ]),
    )
    const tallos = stems(container)

    expect(tallos[0]?.to).toBeLessThan(tallos[1]?.to ?? 0)
    expect(texts(container)[0]?.content).toBe('chico')
  })
})

describe('ningún número desnudo', () => {
  it('cada fila lleva su etiqueta Y su cifra, a la misma altura', () => {
    // Borrar la columna de etiquetas es lo que tienta a hacer un lollipop
    // «limpio»; borrar la de cifras deja un gráfico que no dice ningún valor,
    // porque acá no hay eje que lo diga.
    const { container } = draw(SIETE)
    const ys = stems(container).map((s) => s.y)

    SIETE.items.forEach((item, i) => {
      const fila = texts(container).filter((t) => t.y === ys[i])
      expect(fila.map((t) => t.content)).toEqual([item.etiqueta, `«${item.v}»`])
    })
  })

  it('`format` se usa y no se esquiva', () => {
    // Un `String(v)` adentro compila, se ve bien en `es-MX` y decide el locale de
    // un tenant que el plot no conoce.
    const { container } = draw(SIETE)
    const cifras = texts(container)
      .filter((t) => t.style.includes('var(--font-mono)'))
      .map((t) => t.content)

    expect(cifras).toEqual(SIETE.items.map((i) => `«${i.v}»`))
  })

  it('la cifra usa el rol §2.3 «cifra», no el del rótulo', () => {
    // El atajo obvio es resolverla con `AxisText`, que ya está en `core/`: le
    // mete 0.12em, la pasa a MAYÚSCULAS y la pinta `$dim`. Las tres se ven
    // razonables y las tres violan §2.3 sobre una columna de dígitos.
    const { container } = draw(SIETE)
    const [etiqueta, cifra] = texts(container)

    expect(etiqueta?.style).toContain('var(--font-body)')
    expect(etiqueta?.style).toContain('var(--text-celda)')

    expect(cifra?.style).toContain('var(--font-mono)')
    expect(cifra?.style).toContain('var(--text-cifra)')
    expect(cifra?.style).toContain('tabular-nums')
    expect(cifra?.style).not.toContain('letter-spacing')

    // Las otras dos cosas que `AxisText` haría: MAYÚSCULAS y `$dim`. Las dos
    // columnas son `$ink` en el frame, y la etiqueta conserva su caja.
    expect(etiqueta?.content).toBe('Charged Assert 10')
    expect(etiqueta?.style).toContain('var(--color-ink)')
    expect(cifra?.style).toContain('var(--color-ink)')
    expect(cifra?.style).not.toContain('var(--color-dim)')

    // Y las dos columnas caen donde el frame las pone.
    expect(etiqueta?.x).toBe(left)
    expect(cifra?.x).toBe(valueX)
  })
})

describe('el color sale de la familia y de ningún otro lado', () => {
  it('todo trazo y todo relleno son un escalón de la familia que llegó', () => {
    const { container } = draw(SIETE, 'cliente')
    const usados = [...stems(container).map((s) => s.stroke), ...dots(container).map((d) => d.fill)]

    expect(usados).toHaveLength(14)
    usados.forEach((c) => expect(c).toMatch(/^var\(--color-fam-cliente-[0-4]\)$/))

    // Regla dura: un hex literal es un bug, y el naranja no es color de datos —
    // ni siquiera para «destacar el primero».
    const svg = container.querySelector('svg')?.outerHTML ?? ''
    expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}/)
    expect(svg).not.toContain('var(--color-acc)')
  })

  it('el bandeo en tercios reproduce el dibujo · 7 filas y 6', () => {
    // **Hacen falta los dos tamaños.** `Math.floor(i / (n/3))` da tres grupos
    // parejos y con n=6 coincide; con n=7 sale `0,0,0,1,1,2,2` y el dibujo dice
    // `1,1,0,0,2,2,2`. Un escalón único para todas también cae acá.
    const siete = draw(SIETE)
    expect(stems(siete.container).map((s) => s.stroke)).toEqual(
      [1, 1, 0, 0, 2, 2, 2].map((n) => `var(--color-fam-demanda-${n})`),
    )
    siete.unmount()

    const seis = draw(categorica(SIETE.items.slice(0, 6)))
    expect(stems(seis.container).map((s) => s.stroke)).toEqual(
      [1, 1, 0, 0, 2, 2].map((n) => `var(--color-fam-demanda-${n})`),
    )
  })

  it('sobre una familia CORTA no pide un color que no existe', () => {
    // `externo` tiene 2 escalones. Armar `var(--color-fam-${family}-${step})` a
    // mano pediría `externo-2`, y el modo de falla es que NO falla: se pinta sin
    // color. Ésa es toda la razón de que `familyVar` haga `% largo`.
    const { container } = draw(SIETE, 'externo')
    const usados = stems(container).map((s) => s.stroke)

    usados.forEach((c) => expect(c).toMatch(/^var\(--color-fam-externo-[01]\)$/))
    expect(usados).not.toContain('var(--color-fam-externo-2)')
  })
})

describe('la etiqueta se recorta con el avance de SU fuente', () => {
  it('recorta a lo que entra de Inter 12, que no es lo que entra de mono', () => {
    const larga = 'x'.repeat(40)
    const { container } = draw(categorica([{ etiqueta: larga, v: 10 }]))
    const etiqueta = texts(container)[0]?.content ?? ''

    // Inter 12 a 0,6 em de avance: 20 caracteres en los 144px de la columna.
    expect(etiqueta).toHaveLength(20)
    expect(etiqueta.endsWith('…')).toBe(true)

    // **La segunda mitad es la que lo pilla:** con el avance del mono el recorte
    // sigue funcionando y sigue estando mal — deja media columna vacía.
    // Se compara al MISMO tamaño a propósito: `charsThatFit` asume mono 10 por
    // defecto, y 10 × 0,72 da exactamente lo mismo que 12 × 0,6, así que a la
    // talla por defecto los dos números coinciden por casualidad y la aserción
    // no diría nada.
    expect(charsThatFit(left, 12)).toBe(16)
    expect(etiqueta).not.toHaveLength(charsThatFit(left, 12))
  })

  it('una etiqueta que el dibujo pinta entera no se recorta', () => {
    // «Rival Fleece Hoodie» son 19 caracteres y en el frame entra completa en la
    // columna de 140px. Es el caso que fija el avance en 0,6 y no en el promedio.
    const { container } = draw(SIETE)
    expect(
      texts(container)
        .map((t) => t.content)
        .includes('Rival Fleece Hoodie'),
    ).toBe(true)
  })
})

describe('el contenedor', () => {
  it('se anuncia con un nombre distinguible del de `PlotBars`', () => {
    // `PlotBars` es exactamente `N categorías`. Los dos salen del mismo cuerpo y
    // es por el nombre que una prueba de despacho sabe cuál se montó.
    draw(SIETE)
    const svg = screen.getByRole('img', { name: '7 categorías con marca y cifra' })

    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('aria-label')).not.toBe('7 categorías')
  })

  it('no acepta `className` ni pinta riel de fondo', () => {
    // §4 regla 9: el componente es dueño de su apariencia. Y el frame de LOLLIPOP
    // no tiene el `$w2` que sí dibuja el de BARRAS — un riel detrás de un tallo
    // de 2px lo convierte en una barra fantasma.
    const { container } = draw(SIETE)

    expect(container.firstElementChild?.className).toBe('w-full h-full min-h-0')
    expect(container.querySelectorAll('rect')).toHaveLength(0)
    expect(container.querySelector('svg')?.outerHTML ?? '').not.toContain('var(--color-w2)')
  })
})

/* ══ Lo que las mutaciones encontraron sin prueba ════════════════════════════ */

describe('cada columna se ancla por el borde que el frame le da', () => {
  it('la etiqueta por su borde DERECHO y la cifra por su borde IZQUIERDO', () => {
    // **`x` afirmado a secas no dice dónde cae el texto**, y era todo lo que
    // había. `x={left}` con `textAnchor: start` arranca la etiqueta EN 144 y la
    // tira encima de los tallos; `x={valueX}` con `end` pinta la cifra hacia la
    // izquierda, dentro del riel que `trackW` reservó. Las dos versiones dejan
    // `x` intacto, así que las dos pasaban.
    const { container } = draw(SIETE)
    const nodos = Array.from(container.querySelectorAll('text'))

    expect(nodos).toHaveLength(14)
    nodos.forEach((n) => {
      const esCifra = (n.getAttribute('style') ?? '').includes('var(--font-mono)')
      expect(n.getAttribute('text-anchor')).toBe(esCifra ? 'start' : 'end')
    })
  })
})

describe('el tallo tiene el trazo del frame', () => {
  it('grosor 2 y remate redondo en los siete `path`', () => {
    // Del frame: `strokeWidth: 2`, `strokeLinecap: "round"`. Están medidos y
    // escritos como constantes y no los tocaba ninguna aserción: un tallo de 1px
    // a punta cuadrada dibuja el mismo lollipop más flaco, y con el punto de 11
    // encima la diferencia se lee como un defecto de render, no de código.
    const { container } = draw(SIETE)
    const tallos = Array.from(container.querySelectorAll('path'))

    expect(tallos).toHaveLength(7)
    tallos.forEach((p) => {
      expect(p.getAttribute('stroke-width')).toBe('2')
      expect(p.getAttribute('stroke-linecap')).toBe('round')
      // Y sin relleno: un `path` de dos puntos rellenado no se ve, hasta que
      // alguien le agregue un tercero.
      expect(p.getAttribute('fill')).toBe('none')
    })
  })
})

describe('los dos extremos del tamaño', () => {
  it('sin tamaño medido todavía no dibuja nada', () => {
    // El primer frame no tiene medida: el `ResizeObserver` real notifica en uno
    // posterior. Sin la guarda se monta un `<svg width={0}>` con siete filas de
    // largo cero — y el doble de `setup.ts` avisa EN EL ACTO, así que ninguna
    // prueba de este archivo pasaba nunca por acá.
    const { container } = drawAt(null, SIETE)

    expect(container.querySelector('svg')).toBeNull()
    expect(container.firstElementChild?.className).toBe('w-full h-full min-h-0')
  })

  it('en una columna muy angosta la etiqueta baja a 3 caracteres, no a uno', () => {
    // A 50px de ancho la columna mide 12 y a Inter 12 entra UN carácter. Sin el
    // piso de 3 el recorte es `slice(0, 0) + '…'`: la etiqueta desaparece entera
    // y queda un puntito suspensivo que no nombra ninguna fila. El piso está
    // escrito en el código y sólo se ve a un ancho que el doble no produce.
    const { container } = drawAt({ width: 50, height: 100 }, categorica([
      { etiqueta: 'Charged Assert 10', v: 10 },
    ]))
    const etiqueta = texts(container)[0]?.content ?? ''

    expect(etiqueta).toBe('Ch…')
    expect(etiqueta).not.toBe('…')
  })
})
