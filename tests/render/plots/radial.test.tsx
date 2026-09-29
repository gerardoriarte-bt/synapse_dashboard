// @vitest-environment jsdom

/** Barras radiales · `radial` · §PEN:Plot/BARRAS RADIALES · Cumplimiento por región
 *
 *  **Lo que se verifica es el ÁNGULO, no que el SVG exista.** Un radial mal
 *  calculado se ve impecable: cuatro anillos prolijos, leyenda alineada, y una
 *  vuelta que es el rango en vez del valor. Por eso casi todo lo de acá lee el
 *  barrido del arco desde su propio trazo, y no la presencia de la marca.
 *
 *  La aserción central es la de la proporcionalidad: el `.pen` no escribe en
 *  ningún lado que la vuelta sea proporcional al valor —sale de dividir barrido
 *  por valor en los cuatro arcos y ver que el cociente es 0,008635 en los
 *  cuatro—, así que es lo único que ninguna otra fuente protege.
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotRadial } from '@/render/plots/PlotRadial'
import type { Family, Value } from '@/api/types'
import { _resetObserver } from '@/render/plots/core/useSize'
import { TEST_SIZE } from '../../setup'

/** Formateador de identidad: acá se mide el cálculo del plot, no el locale. */
const plain = (v: number) => String(v)

type Item = { etiqueta: string; v: number }

const categorica = (items: readonly Item[]): Extract<Value, { forma: 'categorica' }> => ({
  forma: 'categorica',
  items: [...items],
})

/** Los cuatro del frame, en el orden en que el cuerpo los entrega —`orden: desc`
 *  ya deja el mayor en el anillo de afuera—. */
const REGIONES: readonly Item[] = [
  { etiqueta: 'Norte', v: 103 },
  { etiqueta: 'Centro', v: 96 },
  { etiqueta: 'Occidente', v: 88 },
  { etiqueta: 'Sureste', v: 74 },
]

const dibujar = (
  items: readonly Item[],
  props: { family?: Family; format?: (v: number) => string; unit?: string } = {},
) =>
  render(
    <PlotRadial
      value={categorica(items)}
      family={props.family ?? 'demanda'}
      format={props.format ?? plain}
      {...(props.unit === undefined ? {} : { unit: props.unit })}
    />,
  )

/** Los arcos de VALOR se reconocen por su color: `Arc` pinta con `hue`, que
 *  siempre devuelve una variable de familia. `ArcRail` pinta el wash. */
const arcos = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path')).filter((n) =>
    (n.getAttribute('fill') ?? '').startsWith('var(--color-fam-'),
  )

const rieles = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path[fill="var(--color-w2)"]'))

/* ── Leer la geometría desde el trazo ───────────────────────────────────────
 *
 * `arcPath` emite `M{e0} A{R},{R} 0 {large} 1 {e1} L{i1} A{r},{r} 0 {large} 0
 * {i0} Z`, y arranca SIEMPRE en la vuelta `from`, que acá es 0 — el tope del
 * círculo. De ahí salen el centro, los dos radios y el barrido sin
 * reimplementar la trigonometría del plot en la prueba: si se reimplantara, la
 * prueba no podría fallar cuando el plot esté mal.
 */
const numeros = (d: string) => [...d.matchAll(/-?[\d.]+/g)].map((m) => Number(m[0]))

const radios = (d: string) => {
  const a = [...d.matchAll(/A(-?[\d.]+),(-?[\d.]+)/g)].map((m) => Number(m[1]))
  return { outer: a[0] as number, inner: a[1] as number }
}

/** El barrido del arco, en vueltas. */
const barrido = (d: string) => {
  const n = numeros(d)
  const [e0x, e0y, outer] = [n[0] as number, n[1] as number, n[2] as number]
  // `e0` está en el tope porque `from` es 0: de ahí el centro.
  const cx = e0x
  const cy = e0y + outer
  // Índices 7 y 8: el `A` emite `{R},{R} 0 {large} 1` antes del extremo.
  const [e1x, e1y] = [n[7] as number, n[8] as number]
  const turn = Math.atan2(e1x - cx, cy - e1y) / (Math.PI * 2)
  return turn < 0 ? turn + 1 : turn
}

/** Dibuja contra un contenedor de otro tamaño.
 *
 *  Hace falta porque el doble de `ResizeObserver` de `tests/setup.ts` informa un
 *  `TEST_SIZE` fijo de 600×300, y ahí el disco mide R=146: **ni el piso de la
 *  cifra ni el recorte del rótulo se activan nunca**, así que las dos garantías
 *  quedaban escritas y sin probar. Se cambia el doble, se reinicia el observer
 *  compartido —que se crea una vez y se cachea a nivel de módulo— y se restaura.
 */
const dibujarEn = (
  size: { width: number; height: number },
  items: readonly Item[],
  props: { family?: Family; format?: (v: number) => string; unit?: string } = {},
) => {
  const previo = globalThis.ResizeObserver
  globalThis.ResizeObserver = class {
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
  } as unknown as typeof ResizeObserver
  _resetObserver()
  try {
    return dibujar(items, props)
  } finally {
    globalThis.ResizeObserver = previo
    _resetObserver()
  }
}

/** El centro y el radio exterior LEÍDOS del riel, con la misma aritmética que
 *  `barrido`: el `M` cae en la vuelta 0, que es el tope. */
const disco = (d: string) => {
  const n = numeros(d)
  const outer = n[2] as number
  return { cx: n[0] as number, cy: (n[1] as number) + outer, outer }
}

/** Las dos líneas del centro. La cifra se reconoce por `--font-body` —es la
 *  única que no es mono— y el rótulo por su texto. */
const cifra = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('text')).find((n) =>
    (n.getAttribute('style') ?? '').includes('var(--font-body)'),
  )

const rotulo = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('text')).find((n) => (n.textContent ?? '') === 'PROMEDIO')

/** La `x` de la primera fila de leyenda: donde arranca la columna. */
const leyendaX = (c: HTMLElement) =>
  Math.min(
    ...Array.from(c.querySelectorAll('text'))
      .filter((n) => (n.getAttribute('text-anchor') ?? '') === 'start')
      .map((n) => Number(n.getAttribute('x'))),
  )

describe('el disco y la leyenda no se pisan', () => {
  it('ningún anillo entra en la columna de la leyenda', () => {
    // El disco se centra en `discW / 2`, no en `w / 2`: con el centro en la
    // mitad del SVG el anillo de afuera se mete debajo de las filas y el plot
    // se ve con la leyenda tachada. Nada lo veía, porque toda la geometría de
    // acá se lee RELATIVA al propio arco.
    const { container } = dibujar(REGIONES)
    const x = leyendaX(container)
    for (const n of rieles(container)) {
      const { cx, outer } = disco(n.getAttribute('d') ?? '')
      expect(cx + outer).toBeLessThanOrEqual(x)
    }
  })

  it('y el disco tampoco se sale por la izquierda', () => {
    const { container } = dibujar(REGIONES)
    for (const n of rieles(container)) {
      const { cx, outer } = disco(n.getAttribute('d') ?? '')
      expect(cx - outer).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('las dos líneas del centro están donde el frame las pone', () => {
  it('la cifra en cy − 0,03·R y PROMEDIO en cy + 0,19·R, las dos sobre el eje', () => {
    // Medidas del frame: cifra en y=147,2 y PROMEDIO en y=170,9 con cy=150 y
    // R=108. Se afirma como FRACCIÓN del radio, igual que la geometría
    // concéntrica, porque el disco de acá no mide 108.
    const { container } = dibujar(REGIONES)
    const { cx, cy, outer } = disco(rieles(container)[0]?.getAttribute('d') ?? '')

    const c = cifra(container)
    const r = rotulo(container)
    expect(c).toBeDefined()
    expect(r).toBeDefined()

    expect(Number(c?.getAttribute('x'))).toBeCloseTo(cx, 6)
    expect(Number(r?.getAttribute('x'))).toBeCloseTo(cx, 6)
    expect((Number(c?.getAttribute('y')) - cy) / outer).toBeCloseTo(-0.03, 3)
    expect((Number(r?.getAttribute('y')) - cy) / outer).toBeCloseTo(0.19, 3)
    // Y en el orden que el dibujo pide: la cifra arriba de su rótulo.
    expect(Number(c?.getAttribute('y'))).toBeLessThan(Number(r?.getAttribute('y')))
  })

  it('las dos caen DENTRO del hueco central · no encima del anillo de adentro', () => {
    const { container } = dibujar(REGIONES)
    const rs = rieles(container)
    const { cy } = disco(rs[0]?.getAttribute('d') ?? '')
    const hueco = radios(rs[3]?.getAttribute('d') ?? '').inner
    for (const n of [cifra(container), rotulo(container)]) {
      expect(Math.abs(Number(n?.getAttribute('y')) - cy)).toBeLessThan(hueco)
    }
  })
})

describe('la cifra del centro escala con el disco, y tiene piso', () => {
  const tamano = (c: HTMLElement) => Number((cifra(c)?.getAttribute('style') ?? '')
    .replace(/.*font-size:\s*([\d.]+)px.*/s, '$1'))

  it('es el 22/108 del radio · los 22px del frame sobre R=108', () => {
    const { container } = dibujar(REGIONES)
    const { outer } = disco(rieles(container)[0]?.getAttribute('d') ?? '')
    expect(tamano(container) / outer).toBeCloseTo(22 / 108, 2)
  })

  it('en un panel chico no baja de 14px · el piso que TEST_SIZE nunca activa', () => {
    // A 600×300 el radio es 146 y la cifra sale en 29px: el piso está escrito y
    // no se ejerce. Acá el disco mide R=56, la proporción pediría 11,2px, y lo
    // que tiene que salir son los 14 del mínimo legible.
    const { container } = dibujarEn({ width: 200, height: 120 }, REGIONES)
    const { outer } = disco(rieles(container)[0]?.getAttribute('d') ?? '')
    expect(outer * (22 / 108)).toBeLessThan(14)
    expect(tamano(container)).toBe(14)
  })
})

describe('el rótulo de la leyenda se RECORTA, nunca se borra', () => {
  it('en una columna angosta sale con elipsis y conserva al menos dos letras', () => {
    // Las dos mitades de `clamp` viven sin prueba a 600×300, donde entran 23
    // caracteres y ningún rótulo llega: ni el recorte ni el piso de 3 del
    // `Math.max`. Sin el piso, `slice(0, 1)` deja una sola letra y la fila dice
    // «N… 103», que no identifica ninguna región.
    const { container } = dibujarEn({ width: 200, height: 120 }, REGIONES)
    const filas = Array.from(container.querySelectorAll('text'))
      .map((n) => n.textContent ?? '')
      .filter((t) => /\d/.test(t) && /[A-ZÁÉÍÓÚÑ]/.test(t))

    expect(filas).toHaveLength(4)
    for (const fila of filas) {
      expect(fila).toContain('…')
      expect(fila).toMatch(/^[A-ZÁÉÍÓÚÑ]{2,}…/)
    }
  })

  it('y la cifra sobrevive al recorte · se recorta el rótulo, no el número', () => {
    const { container } = dibujarEn({ width: 200, height: 120 }, REGIONES)
    expect(container.textContent).toContain('103')
    expect(container.textContent).toContain('74')
  })
})

describe('la leyenda se centra en el alto', () => {
  it('las filas quedan repartidas alrededor de la mitad, no pegadas arriba', () => {
    const { container } = dibujar(REGIONES)
    const ys = Array.from(container.querySelectorAll('text'))
      .filter((n) => /\d/.test(n.textContent ?? '') && /[A-ZÁÉÍÓÚÑ]/.test(n.textContent ?? ''))
      .map((n) => Number(n.getAttribute('y')))
    const medio = (Math.min(...ys) + Math.max(...ys)) / 2
    expect(medio).toBeCloseTo(TEST_SIZE.height / 2, 6)
  })
})

describe('la vuelta es proporcional al VALOR', () => {
  it('los cuatro cocientes barrido÷valor coinciden · el 0,008635 del frame', () => {
    // La mutación que esto persigue es `(n − i) / n` en vez de `v / max`: da
    // 1 : 0,75 : 0,5 : 0,25, se ve igual de prolijo y no dice nada del dato.
    // La otra es `v / suma`, que es dibujar una dona donde va un radial.
    const { container } = dibujar(REGIONES)
    const cocientes = arcos(container).map(
      (n, i) => barrido(n.getAttribute('d') ?? '') / (REGIONES[i] as Item).v,
    )
    expect(cocientes).toHaveLength(4)
    for (const c of cocientes) expect(c).toBeCloseTo(cocientes[0] as number, 5)
  })

  it('y reproduce los grados medidos en el `.pen` · 320 · 298,5 · 273,5 · 230', () => {
    const { container } = dibujar(REGIONES)
    const grados = arcos(container).map((n) => barrido(n.getAttribute('d') ?? '') * 360)
    for (const [i, esperado] of [320.0, 298.5, 273.5, 230.0].entries()) {
      expect(grados[i] as number).toBeCloseTo(esperado, 0)
    }
  })
})

describe('el mayor NO cierra su anillo', () => {
  it('el arco mayor barre 0,889 y su riel 0,95 · quedan 22° de riel a la vista', () => {
    // Con `totalSweep = 1` el mayor cierra el anillo y se lee como «completo»,
    // que es una afirmación que `categorica` no autoriza: no hay meta contra la
    // cual estar completo.
    const { container } = dibujar(REGIONES)
    expect(barrido(arcos(container)[0]?.getAttribute('d') ?? '')).toBeCloseTo(0.889, 3)
    expect(barrido(rieles(container)[0]?.getAttribute('d') ?? '')).toBeCloseTo(0.95, 3)
  })

  it('el riel es más largo que su arco en TODA pista', () => {
    const { container } = dibujar(REGIONES)
    const a = arcos(container).map((n) => barrido(n.getAttribute('d') ?? ''))
    const r = rieles(container).map((n) => barrido(n.getAttribute('d') ?? ''))
    for (const [i, arco] of a.entries()) expect(r[i] as number).toBeGreaterThan(arco)
  })
})

describe('cada pista lleva su riel', () => {
  it('cuatro rieles y cuatro arcos, no un riel solo en la de afuera', () => {
    const { container } = dibujar(REGIONES)
    expect(rieles(container)).toHaveLength(4)
    expect(arcos(container)).toHaveLength(4)
  })
})

describe('la geometría concéntrica es la del dibujo', () => {
  it('llevada a R=108 da 108 · 86 · 64 · 42, grosor 15 y hueco 27', () => {
    // Se mide sobre el dibujo REAL y se reescala, en vez de fijar un tamaño de
    // contenedor: lo que el frame fija son las PROPORCIONES —hueco 0,25·R y
    // separación 7/15 del grosor—, y los píxeles 108/86/64/42 son su
    // consecuencia. Con hueco 0 o separación = grosor, los cuatro números se
    // corren y esto se pone rojo.
    const { container } = dibujar(REGIONES)
    const medidas = rieles(container).map((n) => radios(n.getAttribute('d') ?? ''))
    const escala = 108 / (medidas[0]?.outer ?? 1)

    for (const [i, esperado] of [108, 86, 64, 42].entries()) {
      expect((medidas[i] as { outer: number }).outer * escala).toBeCloseTo(esperado, 0)
      expect(
        ((medidas[i] as { outer: number; inner: number }).outer -
          (medidas[i] as { outer: number; inner: number }).inner) *
          escala,
      ).toBeCloseTo(15, 0)
    }
    expect((medidas[3] as { inner: number }).inner * escala).toBeCloseTo(27, 0)
  })
})

describe('reglas duras de color', () => {
  it('el color sale de la FAMILIA que llega por prop', () => {
    const { container } = dibujar(REGIONES, { family: 'inventario' })
    for (const n of arcos(container)) {
      expect(n.getAttribute('fill')).toMatch(/^var\(--color-fam-inventario-/)
    }
  })

  it('cada pista usa SU escalón · el `step` explícito', () => {
    // Sin el `step` explícito, `Arc` cae a `i % 5` con el índice dentro de sus
    // segmentos —y acá cada pista es un `<Arc>` de un segmento—, así que las
    // cuatro salen del escalón 0 y el disco queda monocromo.
    const { container } = dibujar(REGIONES, { family: 'inventario' })
    const fills = arcos(container).map((n) => n.getAttribute('fill'))
    expect(new Set(fills).size).toBe(4)
  })

  it('ni naranja ni un hex literal · las dos reglas de una vez', () => {
    const { container } = dibujar(REGIONES)
    const svg = container.querySelector('svg')?.outerHTML ?? ''
    expect(svg).not.toContain('--color-acc')
    expect(svg).not.toMatch(/#[0-9a-f]{3,8}/i)
  })
})

describe('ningún número desnudo en la leyenda', () => {
  it('una fila por ítem, con su rótulo y su cifra juntos', () => {
    // Sólo la cifra deja una columna de números sin decir de qué región; sólo
    // el rótulo deja un dibujo que no se puede comparar entre anillos.
    const { container } = dibujar(REGIONES)
    const filas = Array.from(container.querySelectorAll('text'))
      .map((n) => n.textContent ?? '')
      .filter((t) => /\d/.test(t) && /[A-ZÁÉÍÓÚÑ]/.test(t))
    expect(filas).toHaveLength(4)
    expect(filas[0]).toContain('NORTE')
    expect(filas[0]).toContain('103')
  })
})

describe('la unidad llega y se pega', () => {
  it('con `unit="%"` la primera fila dice 103% y el centro 90%', () => {
    // La mutación es que el cuerpo pase la prop con otro nombre —`unidad`,
    // `units`—, que es exactamente lo que el spread condicional deja compilar.
    const { container } = dibujar(REGIONES, { unit: '%' })
    expect(container.textContent).toContain('103%')
    expect(container.textContent).toContain('90%')
  })

  it('sin unidad no se inventa el signo · cablear "%" miente en otra métrica', () => {
    const { container } = dibujar(REGIONES)
    expect(container.textContent).not.toContain('%')
  })
})

describe('el centro es el PROMEDIO de lo dibujado', () => {
  it('con 103/96/88/74 dice 90, y lleva su rótulo', () => {
    // Sumar en vez de promediar da 361, y la mitad «hay un número» de esta
    // aserción no lo vería.
    const { container } = dibujar(REGIONES)
    expect(container.textContent).toContain('90')
    expect(container.textContent).toContain('PROMEDIO')
  })

  it('con tres anillos dice 96 · el promedio de lo que SE DIBUJA', () => {
    // El `tope` lo aplica el cuerpo: acá llegan tres ítems y el centro tiene
    // que hablar de esos tres, no del arreglo sin recortar.
    const { container } = dibujar(REGIONES.slice(0, 3))
    expect(container.textContent).toContain('96')
    expect(container.textContent).not.toContain('90')
  })
})

describe('la etiqueta distingue este dibujo de las barras', () => {
  it('dice «barras radiales» y no «categorías»', () => {
    // Copiar la etiqueta de `PlotBars` deja al cuerpo sin forma de demostrar
    // que despachó el radial y no las barras.
    const { container } = dibujar(REGIONES)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-label')).toBe('4 barras radiales')
  })
})

describe('no hay NaN ni división por cero', () => {
  it('sin ítems no se dibuja nada y el centro no imprime NaN', () => {
    const { container } = dibujar([])
    expect(container.querySelectorAll('path')).toHaveLength(0)
    expect(container.textContent ?? '').not.toContain('NaN')
  })

  it('todos negativos: no hay arco, y ninguno se pasa de su riel', () => {
    // Sin el piso de 0 en el máximo, `v / max` entre dos negativos da un
    // cociente MAYOR QUE UNO —−5/−3 = 1,67— y el anillo se cierra entero: el
    // peor valor del conjunto se dibuja como el más cumplido. Un radial no es
    // el gráfico para una serie con signo, y lo honesto es no dibujar arco.
    const { container } = dibujar([
      { etiqueta: 'Norte', v: -5 },
      { etiqueta: 'Centro', v: -3 },
    ])
    expect(rieles(container)).toHaveLength(2)
    for (const n of arcos(container)) {
      expect(barrido(n.getAttribute('d') ?? '')).toBeCloseTo(0, 6)
    }
  })

  it('todos en cero: los rieles siguen, los arcos no barren, y ningún NaN', () => {
    // Sin la guarda de `max <= 0`, `Math.max()` de vacío da −Infinity y
    // `arcPath` escribe NaN en el trazo — que en SVG no rompe: dibuja nada y no
    // avisa.
    const { container } = dibujar([
      { etiqueta: 'Norte', v: 0 },
      { etiqueta: 'Centro', v: 0 },
    ])
    expect(rieles(container)).toHaveLength(2)
    for (const n of arcos(container)) {
      const d = n.getAttribute('d') ?? ''
      expect(d).not.toContain('NaN')
      expect(barrido(d)).toBeCloseTo(0, 6)
    }
    expect(container.querySelector('svg')?.outerHTML ?? '').not.toContain('NaN')
  })
})

describe('nada se descarta en silencio', () => {
  it('siete ítems son siete rieles, siete arcos y siete filas', () => {
    // La mutación es copiar el `MAX_PARTS = 5` de `PlotComposition`, que allá
    // está justificado porque la rampa tiene cinco escalones y acá agruparía
    // regiones en un «otros» que no significa nada.
    const siete = Array.from({ length: 7 }, (_, i) => ({
      etiqueta: `Región ${i}`,
      v: 70 + i,
    }))
    const { container } = dibujar(siete)
    expect(rieles(container)).toHaveLength(7)
    expect(arcos(container)).toHaveLength(7)

    const filas = Array.from(container.querySelectorAll('text')).filter((n) =>
      (n.textContent ?? '').includes('REGIÓN'),
    )
    expect(filas).toHaveLength(7)

    // Y ninguna pista queda con grosor cero, que sería un anillo invisible.
    for (const n of rieles(container)) {
      const { outer, inner } = radios(n.getAttribute('d') ?? '')
      expect(outer - inner).toBeGreaterThan(0)
    }
  })

  it('ninguna fila de leyenda se sale del alto · no como `PlotComposition`', () => {
    const doce = Array.from({ length: 12 }, (_, i) => ({ etiqueta: `R${i}`, v: 10 + i }))
    const { container } = dibujar(doce)
    const ys = Array.from(container.querySelectorAll('text'))
      .filter((n) => (n.textContent ?? '').startsWith('R'))
      .map((n) => Number(n.getAttribute('y')))
    expect(ys).toHaveLength(12)
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(TEST_SIZE.height)
    }
  })
})

describe('el formateador se inyecta, no se importa', () => {
  it('la cifra de la leyenda y la del centro pasan por `format`', () => {
    const { container } = dibujar(REGIONES, { format: (v: number) => `«${v}»` })
    expect(container.textContent).toContain('«103»')
    expect(container.textContent).toContain('«90»')
  })
})
