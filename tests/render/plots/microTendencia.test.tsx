// @vitest-environment jsdom

/** La micro tendencia · `spark` sobre `serieTemporal` · §PEN:Plot/MICRO TENDENCIA
 *
 *  **Lo que se verifica es el DOMINIO, no que el SVG exista.** Un sparkline con
 *  el dominio equivocado se ve como un sparkline: con `ceiling` —que es lo que
 *  llaman los otros nueve plots y arranca siempre en cero— una serie que se
 *  mueve entre 100 y 102 se dibuja plana contra el piso y el panel dice «esta
 *  métrica no se mueve», que es lo contrario de lo que el dato dice. Eso no se
 *  nota mirando la pantalla.
 *
 *  Los números contra los que se afirma salen del frame —banda de 248×30 en las
 *  cuatro filas, punto final sobre el último punto— y no de la implementación:
 *  una prueba escrita mirando el código no puede fallar nunca.
 *
 *  Las afirmaciones se montan contra el plot porque ningún cuerpo lo despacha
 *  todavía: `SeriesBody` y su `DIBUJA` son archivos compartidos y el cableado es
 *  una fase aparte. Las dos últimas fijan lo que ese cableado NO puede romper.
 */
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KpiBody } from '@/render/bodies/KpiBody'
import { SeriesBody } from '@/render/bodies/SeriesBody'
import { createFormat } from '@/render/format'
import { PlotSpark } from '@/render/plots/PlotSpark'
import { _resetObserver } from '@/render/plots/core/useSize'
import { TEST_SIZE } from '../../setup'
import type { Value } from '@/api/types'

const serie = (vs: readonly number[]) =>
  ({
    forma: 'serieTemporal',
    puntos: vs.map((v, i) => ({ t: String(20000 + i), v })),
  }) as unknown as Extract<Value, { forma: 'serieTemporal' }>

/** Un formateador que no abrevia: las aserciones de geometría se leen mejor
 *  contra el número que contra «1,2 K». */
const plano = (v: number) => String(v)

/** La banda del `.pen`: 248 de ancho por 30 de alto en las cuatro filas. El
 *  número se escribe acá y no se importa del componente **a propósito** — si se
 *  importara, cambiar la constante movería la prueba con ella. */
const RATIO = 248 / 30
const INSET = 4

/** Lo que el doble de `ResizeObserver` reporta · 600×300. */
const { width: W, height: H } = TEST_SIZE
/** El tope que el dibujo impone a este tamaño: 72.58, no los 292 de la caja. */
const BANDA = Math.min(H - 2 * INSET, W / RATIO)

/** El trazo · el único `path` sin relleno. El de `Area` lleva `fill` y no
 *  `stroke`, así que se distinguen sin depender del orden. */
const trazo = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path')).find((p) => p.getAttribute('fill') === 'none')

/** Los pares `x,y` de un `d` cualquiera, en orden. */
const leer = (d: string): { x: number; y: number }[] =>
  Array.from(d.matchAll(/([ML])(-?[\d.]+),(-?[\d.]+)/g)).map((m) => ({
    x: Number(m[2]),
    y: Number(m[3]),
  }))

/** Los pares `x,y` del `d`, en orden. */
const pares = (c: HTMLElement): { x: number; y: number }[] => leer(trazo(c)?.getAttribute('d') ?? '')

/** El RELLENO · el `path` que sí lleva `fill`. `trazo` lo descarta a propósito,
 *  así que sin esto nada de lo que el relleno hace queda mirado. */
const relleno = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path')).find((p) => p.getAttribute('fill') !== 'none')

/** Cuánto ocupa el trazo verticalmente. Es la banda, si el dominio es el de la
 *  serie y la serie llega a sus dos extremos. */
const extension = (c: HTMLElement) => {
  const ys = pares(c).map((p) => p.y)
  return Math.max(...ys) - Math.min(...ys)
}

describe('el dominio · lo que separa un sparkline de un área chica', () => {
  it('es el `[min, max]` de SU serie, no `[0, techo]`', () => {
    // Tres valores pegados y lejos de cero. Con `ceiling` colapsan a ~1.4px
    // sobre 72.58 y el gráfico se ve perfecto mintiendo: una métrica que se
    // movió 2% queda plana.
    const { container: pegados } = render(
      <PlotSpark value={serie([100, 101, 102])} family="demanda" format={plano} />,
    )
    const { container: abiertos } = render(
      <PlotSpark value={serie([0, 50, 100])} family="demanda" format={plano} />,
    )

    // La mitad que no se puede fingir: con dominio desde cero las dos series
    // ocuparían alturas MUY distintas.
    expect(extension(pegados)).toBeCloseTo(extension(abiertos), 6)
    expect(extension(pegados)).toBeCloseTo(BANDA, 0)
  })

  it('una serie PLANA se dibuja a media banda, no en el piso', () => {
    // `linearScale` devuelve `r0` cuando el ancho del dominio es 0, y `r0` acá
    // es el piso exacto. Una tendencia sin movimiento clavada abajo se lee como
    // una métrica en su mínimo histórico.
    const { container } = render(
      <PlotSpark value={serie([50, 50, 50, 50])} family="demanda" format={plano} />,
    )

    const ys = pares(container).map((p) => p.y)
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(0, 6)
    // El centro de la caja es `top + band/2` = `h/2`, sin importar la banda.
    expect(ys[0]).toBeCloseTo(H / 2, 1)
    // Y explícitamente NO el piso.
    expect(ys[0]).not.toBeCloseTo(H / 2 + BANDA / 2, 1)
  })
})

describe('hacia ARRIBA es más · la y del SVG crece al revés', () => {
  it('el valor más alto queda en el techo de la banda y el más bajo en el piso', () => {
    // **Es el defecto que este archivo entero no veía.** Todas las demás
    // aserciones son ciegas al signo: `extension` es una RESTA de `y`, el caso
    // plano mide un centro, y el punto final se compara contra el propio trazo,
    // así que giran juntos. Con el rango sin invertir el gráfico se dibuja
    // cabeza abajo —una métrica que sube se lee bajando— y se ve igual de
    // prolijo. Es la misma familia que el dominio desde cero: verosímil y al
    // revés de lo que el dato dice.
    const { container: sube } = render(
      <PlotSpark value={serie([0, 50, 100])} family="demanda" format={plano} />,
    )
    const ys = pares(sube).map((p) => p.y)

    // Monótona: cada punto más alto que el anterior, o sea con MENOS `y`.
    expect(ys[1]).toBeLessThan(ys[0] ?? NaN)
    expect(ys[2]).toBeLessThan(ys[1] ?? NaN)

    // Y contra la CAJA, no contra sí mismo: el techo y el piso de la banda
    // centrada, que es lo que fija de qué lado está cada extremo.
    expect(Math.min(...ys)).toBeCloseTo((H - BANDA) / 2, 1)
    expect(Math.max(...ys)).toBeCloseTo((H + BANDA) / 2, 1)

    // El punto final es el máximo de esta serie: va arriba.
    expect(Number(sube.querySelector('circle')?.getAttribute('cy'))).toBeCloseTo(
      Math.min(...ys),
      1,
    )

    // La mitad que no se puede fingir: la serie espejada se dibuja espejada. Una
    // implementación ciega al signo pasa una de las dos, nunca las dos.
    const { container: baja } = render(
      <PlotSpark value={serie([100, 50, 0])} family="demanda" format={plano} />,
    )
    const zs = pares(baja).map((p) => p.y)
    expect(zs[1]).toBeGreaterThan(zs[0] ?? NaN)
    expect(zs[2]).toBeGreaterThan(zs[1] ?? NaN)
  })
})

describe('la banda se TOPA · no llena la caja', () => {
  it('a 600×300 mide 72.6 y no 292', () => {
    // Sin el tope el sparkline se estira a los 200px de un `rowSpan` 4 y deja de
    // distinguirse de `area`. Es la misma familia que `96·N − 16` escrita y no
    // aplicada.
    const { container } = render(
      <PlotSpark value={serie([0, 100])} family="demanda" format={plano} />,
    )

    expect(extension(container)).toBeLessThanOrEqual(74)
    expect(extension(container)).toBeLessThan(H - 2 * INSET)
  })
})

describe('el punto final · sobre el ÚLTIMO punto', () => {
  it('cae en el último par del trazo, no en el primero', () => {
    // Fixture asimétrico a propósito: con una serie simétrica esta prueba
    // pasaría por casualidad con `puntos[0]`.
    const { container } = render(
      <PlotSpark value={serie([10, 80, 30])} family="demanda" format={plano} />,
    )

    const circles = Array.from(container.querySelectorAll('circle'))
    expect(circles).toHaveLength(1)

    const p = pares(container)
    const ultimo = p[p.length - 1]
    expect(ultimo).toBeDefined()
    expect(Number(circles[0]?.getAttribute('cx'))).toBeCloseTo(ultimo?.x ?? NaN, 1)
    expect(Number(circles[0]?.getAttribute('cy'))).toBeCloseTo(ultimo?.y ?? NaN, 1)
    // Y el último es el de la derecha: `x` máxima del trazo.
    expect(ultimo?.x).toBeCloseTo(Math.max(...p.map((q) => q.x)), 6)
  })

  it('es opaco · sin `r`, que es lo que apaga la opacidad de burbuja', () => {
    const { container } = render(
      <PlotSpark value={serie([10, 80, 30])} family="demanda" format={plano} />,
    )

    expect(container.querySelector('circle')?.getAttribute('fill-opacity')).toBe('1')
  })
})

describe('con menos de dos puntos no dibuja NADA', () => {
  it('un solo punto no produce ni trazo ni marca', () => {
    // `Line` sólo devuelve `null` con CERO puntos: con uno emite un `<path
    // d="M x,y">` y `Dots` emite su `<circle>`. Es el mínimo `puntos < 2` que el
    // repertorio declara para `spark` sobre `serieTemporal`, y hoy no lo
    // verifica nadie porque `GET /config/plots` no está implementado.
    const { container } = render(
      <PlotSpark value={serie([42])} family="demanda" format={plano} />,
    )

    expect(container.querySelectorAll('path, circle')).toHaveLength(0)
  })
})

describe('todo el color sale de `family` y de ningún otro lado', () => {
  it('las tres tintas siguen a la familia', () => {
    const { container: medios } = render(
      <PlotSpark value={serie([10, 80, 30])} family="medios" format={plano} />,
    )
    const { container: cliente } = render(
      <PlotSpark value={serie([10, 80, 30])} family="cliente" format={plano} />,
    )

    const tintas = (c: HTMLElement) =>
      Array.from(c.querySelectorAll('svg *'))
        .flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')])
        .filter((v): v is string => v !== null && v !== 'none')

    // Un componente que eligiera hue por su cuenta pintaría igual con las dos
    // familias: es la mitad que no se puede fingir.
    expect(tintas(medios)).toHaveLength(3)
    expect(new Set(tintas(medios))).toEqual(new Set(['var(--color-fam-medios-1)']))
    expect(new Set(tintas(cliente))).toEqual(new Set(['var(--color-fam-cliente-1)']))
  })

  it('ningún literal, ningún `acc`', () => {
    // El naranja no es color de datos: nunca en una serie. Y un hex literal es
    // un bug, regla dura.
    const { container } = render(
      <PlotSpark value={serie([10, 80, 30])} family="demanda" format={plano} />,
    )

    const tintas = Array.from(container.querySelectorAll('svg *')).flatMap((el) =>
      ['fill', 'stroke'].map((a) => el.getAttribute(a)).filter((v): v is string => v !== null),
    )

    expect(tintas.length).toBeGreaterThan(0)
    for (const t of tintas) {
      expect(t).toMatch(/^(none|var\(--color-[a-z0-9-]+\))$/)
      expect(t).not.toContain('acc')
    }
  })
})

describe('`format` es carga y no adorno', () => {
  it('el nombre accesible lleva la cifra del tenant, no el número crudo', () => {
    // Sin esto `format` es una prop obligatoria que nadie usa, que es el defecto
    // que `PlotProps` documenta haber tenido en v2. El 4.28M es el del frame.
    const format = createFormat('es-MX')
    render(
      <PlotSpark
        value={serie([1_000_000, 4_280_000])}
        family="demanda"
        format={(v) => format.number(v, { abbreviate: true })}
      />,
    )

    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('4.28M')
    expect(screen.getByRole('img').getAttribute('aria-label')).not.toContain('4280000')
  })
})

/** El doble de `tests/setup.ts` informa 600×300 fijo, así que TODO este archivo
 *  mide el plot a un solo tamaño — y a ese tamaño el piso de la banda no manda
 *  nunca. Sin cambiar de tamaño no hay forma de mirarlo. La receta es la de
 *  `useSize.test.tsx`: el observer compartido se crea perezosamente, así que hay
 *  que reiniciarlo para que tome el doble nuevo. */
function midiendo(w: number, h: number, corrida: () => void) {
  _resetObserver()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly cb: ResizeObserverCallback
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb
      }
      observe(target: Element) {
        this.cb(
          [{ target, contentRect: { width: w, height: h } } as unknown as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        )
      }
      unobserve() {}
      disconnect() {}
    },
  )
  corrida()
}

afterEach(() => {
  _resetObserver()
  vi.unstubAllGlobals()
})

describe('la banda tiene PISO · por debajo el sparkline deja de tener forma', () => {
  it('en una columna angosta no sigue encogiendo con el ancho', () => {
    // El tope de arriba —248×30— y el piso son dos reglas distintas y la suite
    // entera corre a 600×300, donde sólo manda el tope: a ese tamaño el piso se
    // puede borrar y las once pruebas siguen verdes. A 60px de ancho la
    // proporción pediría 7.3px de alto, que ya no es una tendencia sino una
    // raya.
    let c: HTMLElement | undefined
    midiendo(60, 300, () => {
      c = render(<PlotSpark value={serie([0, 100])} family="demanda" format={plano} />).container
    })

    const alto = extension(c as HTMLElement)
    // Lo que no se puede fingir: la proporción del dibujo pediría MENOS.
    expect(60 / RATIO).toBeLessThan(alto)
    expect(alto).toBeGreaterThanOrEqual(12)
  })
})

describe('el punto final entra COMPLETO en la caja', () => {
  it('su radio no se come contra el borde derecho', () => {
    // Es la razón escrita de `INSET`, y a 600×300 no la mira nadie: el `x` del
    // trazo y el `cx` del punto se mueven juntos, así que toda aserción
    // relativa pasa igual con aire cero. Acá se mide contra la CAJA.
    const { container } = render(
      <PlotSpark value={serie([10, 80, 30])} family="demanda" format={plano} />,
    )

    const punto = container.querySelector('circle')
    const cx = Number(punto?.getAttribute('cx'))
    const r = Number(punto?.getAttribute('r'))
    expect(r).toBeGreaterThan(0)
    expect(cx + r).toBeLessThanOrEqual(W)

    // Y el otro extremo: el primer punto del trazo tampoco sale por la
    // izquierda.
    expect(Math.min(...pares(container).map((p) => p.x))).toBeGreaterThanOrEqual(r)
  })
})

describe('el relleno cierra POR DEBAJO del punto más bajo', () => {
  it('a 4px, que es lo que el frame deja entre el mínimo y la base', () => {
    // El frame: fila 1 tiene su mínimo dibujado en y 44 y cierra el relleno en
    // 48. El `path` del relleno es el único que `trazo` descarta —filtra por
    // `fill="none"`— así que hoy nada de lo que hace el relleno queda mirado:
    // se le puede quitar la base y las once pruebas siguen verdes.
    const { container } = render(
      <PlotSpark value={serie([0, 100])} family="demanda" format={plano} />,
    )

    const base = leer(relleno(container)?.getAttribute('d') ?? '')[0]
    expect(base).toBeDefined()
    const masBajo = Math.max(...pares(container).map((p) => p.y))
    // Por DEBAJO: en SVG la y crece hacia abajo.
    expect((base?.y ?? NaN) - masBajo).toBeCloseTo(4, 6)
  })
})

/* ── Lo que el cableado posterior NO puede romper ──────────────────────────── */

const cuerpo = {
  span: { colStart: 1, colSpan: 6, rowSpan: 4 },
  family: 'demanda',
  metric: 'Ventas',
  format: createFormat('es-MX'),
} as const

describe('el despacho del cuerpo · lo que `spark` NO puede pedir', () => {
  it('`spark` sobre `seriesMultiples` se DECLARA, no se dibuja', () => {
    // §5 no lo lista en esa forma y el componente tipa contra UNA serie: sin
    // esta aserción, el día que alguien amplíe `DIBUJA.seriesMultiples` el plot
    // recibiría una forma que no sabe leer.
    const multiples = {
      forma: 'seriesMultiples',
      series: [
        { etiqueta: 'A', puntos: [{ t: '1', v: 1 }, { t: '2', v: 2 }] },
        { etiqueta: 'B', puntos: [{ t: '1', v: 3 }, { t: '2', v: 4 }] },
      ],
    } as unknown as Extract<Value, { forma: 'seriesMultiples' }>

    render(<SeriesBody {...cuerpo} value={multiples} params={{}} grafico="spark" />)

    expect(screen.getByText(/spark/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /Micro tendencia/ })).toBeNull()
  })

  it('`spark` sobre `escalar` se DECLARA, y eso fija el candado', () => {
    // §5 de `design.md` lista `spark` bajo `escalar`, pero `ValorEscalar` es
    // `{ forma, v }` y nada más: no hay puntos, no hay tendencia, y
    // `Presentacion` tampoco los trae. La única forma de «completar» esa mitad
    // es inventar una serie desde `v` y el `comparativo` — que es lo que esta
    // prueba existe para impedir. Destrabarla es un campo del contrato.
    const escalar = { forma: 'escalar', v: 42 } as unknown as Extract<
      Value,
      { forma: 'escalar' }
    >

    render(<KpiBody {...cuerpo} value={escalar} params={{}} grafico="spark" />)

    expect(screen.getByText(/spark/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /Micro tendencia/ })).toBeNull()
  })
})
