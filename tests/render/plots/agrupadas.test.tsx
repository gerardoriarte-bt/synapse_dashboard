// @vitest-environment jsdom

/** Las columnas agrupadas · `grouped` sobre `categoricaComparada` · §PEN:Plot/COLUMNAS AGRUPADAS
 *
 *  **Lo que se verifica es CUÁL COLUMNA ES CUÁL y contra qué escala, no que el
 *  SVG exista.** Cuatro parejas prolijas se ven idénticas estando invertidas: el
 *  dibujo no escribe ningún delta, así que nada en la pantalla delata que la
 *  fantasma sea la medición. Los cinco defectos caros —invertir los dos miembros
 *  del par, intercambiar los escalones, calcular el techo sólo sobre `v`, darle
 *  a cada serie su propio baseline y rellenar la referencia ausente con `0` o
 *  con el propio valor— compilan todos y se ven bien todos.
 *
 *  **La geometría se recalcula acá con su fórmula escrita a mano**, no
 *  importando la del componente: una prueba que llama a la misma función que
 *  verifica no puede fallar nunca. Los números salen del frame y están anotados
 *  al lado; si alguien los cambia allá, esto se pone rojo, que es el punto.
 *
 *  **El par se lee ordenando los `rect` por `x` dentro de cada banda**, y no por
 *  orden del DOM: el plot pinta las cuatro mediciones en una llamada a `Bars` y
 *  las cuatro fantasmas en otra —`Bars` toma un solo color para todo el grupo—,
 *  así que el DOM no viene apareado. Leer la posición es además lo que hace
 *  falsable la aserción: es la posición, no el orden de pintado, lo que un lector
 *  usa para saber cuál es cuál.
 *
 *  ── LO QUE ESTA PRUEBA NO CUBRE, Y POR QUÉ ──────────────────────────────────
 *
 *  **Los dos casos de despacho que necesitan el cableado quedan afuera**, porque
 *  `ComparisonBody` es un archivo compartido y agregar `'grouped'` a su `DIBUJA`
 *  es una fase aparte, a propósito:
 *
 *   · `grafico="grouped"` saliendo con el `aria-label` de las columnas pareadas.
 *     Hoy cae a `UnknownPlotState`, y afirmar eso sería afirmar el defecto: la
 *     aserción se pondría roja el día que el cableado la arregle.
 *   · Que el formateador inyectado en la rama nueva sea el de VALOR y no el de
 *     BRECHA. Las dos firmas son `(n: number) => string`, así que equivocarse
 *     compila y sólo lo sostiene una prueba montada contra el cuerpo.
 *
 *  Lo que SÍ se puede fijar desde acá —y es la mutación que más duele, porque
 *  rompe los paneles ya publicados— es que **`grafico` ausente siga siendo la
 *  pesa**. Esa queda abajo.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ComparisonBody } from '@/render/bodies/ComparisonBody'
import { createFormat } from '@/render/format'
import { PlotGrouped } from '@/render/plots/PlotGrouped'
import { MARGIN, MIN_RESERVE } from '@/render/plots/core/axisGeometry'
import { _resetObserver } from '@/render/plots/core/useSize'
import { TEST_SIZE } from '../../setup'
import type { Family, Value } from '@/api/types'

type Item = { etiqueta: string; v: number; referencia?: number; delta?: number }

const comparada = (items: readonly Item[]) =>
  ({ forma: 'categoricaComparada', items }) as unknown as Extract<
    Value,
    { forma: 'categoricaComparada' }
  >

/** Un formateador que no abrevia: las aserciones de geometría se leen mejor
 *  contra el número que contra «1,2 K». Es además el de VALOR —sin signo—, que
 *  es el que el cuerpo tiene que inyectar en esta rama. */
const plano = (v: number) => String(v)

/* ── Los cuatro pares del dibujo, despejados de la altura ─────────────────────
 *
 * 176 px de alto para 5 unidades ⇒ 35.2 px por unidad, y cada rectángulo del
 * frame dividido por eso. **T3 es el único par donde la medición supera a la
 * referencia**, y es lo que hace falsable la primera aserción: con cuatro pares
 * monótonos, invertir los dos miembros daría un gráfico idéntico.
 */
const CUATRO: readonly Item[] = [
  { etiqueta: 'T1', v: 3.81, referencia: 3.9 },
  { etiqueta: 'T2', v: 4.02, referencia: 4.1 },
  { etiqueta: 'T3', v: 4.28, referencia: 4.15 },
  { etiqueta: 'T4', v: 4.42, referencia: 4.6 },
]

/* ── La geometría, recalculada con los números del frame ──────────────────── */

/** El alto del área de dibujo · `MARGIN.t` arriba y `MARGIN.b` abajo. */
const HEIGHT = TEST_SIZE.height - MARGIN.t - MARGIN.b

/** La reserva del eje de valores. Con techo 5 los ticks son 0, 2 y 4 —`ticks(4)`
 *  sobre un span de 5 da paso 2— así que el rótulo más largo es de un carácter y
 *  gana el piso de `axisReserve`. */
const RESERVE = MIN_RESERVE

const WIDTH = TEST_SIZE.width - RESERVE - MARGIN.r

/** `PADDING = 0.36`, del frame: par de 83 sobre un paso de 130 ⇒ 0.6385. */
const STEP = WIDTH / CUATRO.length
const BANDWIDTH = STEP * 0.64

/** El borde izquierdo de la banda `i` · `bandScale` centra la banda en su paso. */
const X0 = (i: number) => i * STEP + (STEP - BANDWIDTH) / 2

/** El hueco de adentro del par · del frame: 5 px sobre los 83 del par. */
const INNER = 5 / 83
const GAP = BANDWIDTH * INNER
const BARW = (BANDWIDTH - GAP) / 2

/** El techo del dominio con los cuatro pares del dibujo: el máximo global es la
 *  referencia de T4, 4.60, y `niceStep(4.60 / 5) = niceStep(0.92)` es 1, así que
 *  `ceil(4.60 / 1) · 1` da **exactamente 5** — el techo que el frame dibuja. */
const TECHO = 5

/* ── Lectores del DOM ────────────────────────────────────────────────────── */

const num = (el: Element, a: string) => Number(el.getAttribute(a))

/** Los ocho rectángulos ordenados por `x`, con la marca de si están dentro del
 *  `<g opacity>`. El orden espacial es el que importa: el DOM viene en dos
 *  tandas porque `Bars` pinta un color por llamada. */
const columnas = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('rect'))
    .map((n) => ({
      x: num(n, 'x'),
      y: num(n, 'y'),
      w: num(n, 'width'),
      h: num(n, 'height'),
      rx: num(n, 'rx'),
      fill: n.getAttribute('fill'),
      fantasma: n.closest('g[opacity]') !== null,
    }))
    .sort((a, b) => a.x - b.x)

/** Los pares, de a dos y en orden espacial. */
const grupos = (c: HTMLElement) => {
  const cols = columnas(c)
  return cols.flatMap((_, i) => (i % 2 === 0 ? [[cols[i]!, cols[i + 1]!] as const] : []))
}

const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const categorias = (c: HTMLElement) =>
  textos(c).filter((t) => t.getAttribute('text-anchor') === 'middle')
const valores = (c: HTMLElement) =>
  textos(c).filter((t) => t.getAttribute('text-anchor') === 'end')
const rejillas = (c: HTMLElement) => Array.from(c.querySelectorAll('line'))

const dibujar = (items: readonly Item[], family: Family = 'demanda') =>
  render(<PlotGrouped value={comparada(items)} family={family} format={plano} />)

/** Dibuja contra un contenedor de otro tamaño · el doble de `tests/setup.ts`
 *  informa 600 × 300 fijo, así que el caso «sin medir» no se puede provocar sin
 *  cambiarlo. El observer compartido se cachea a nivel de módulo, de ahí el
 *  `_resetObserver` de los dos lados. */
const dibujarEn = (size: { width: number; height: number }, items: readonly Item[]) => {
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
    return dibujar(items)
  } finally {
    globalThis.ResizeObserver = previo
    _resetObserver()
  }
}

describe('cuál columna es cuál · lo que se ve perfecto diciendo lo contrario', () => {
  it('la MEDICIÓN va primera y plena · la referencia segunda y al 40 %', () => {
    const { container } = dibujar(CUATRO)
    const pares = grupos(container)

    expect(pares).toHaveLength(4)
    for (const [medicion, fantasma] of pares) {
      // El escalón 1 a opacidad plena es la medición; el 0 dentro del `<g>` es
      // el punto de comparación. Del frame: `$fam-demanda-1` en los cuatro
      // primeros rectángulos y `$fam-demanda-0` con `opacity: 0.4` en los
      // cuatro segundos.
      expect(medicion.fantasma).toBe(false)
      expect(medicion.fill).toBe('var(--color-fam-demanda-1)')
      expect(fantasma.fantasma).toBe(true)
      expect(fantasma.fill).toBe('var(--color-fam-demanda-0)')
    }
    expect(container.querySelector('g[opacity]')?.getAttribute('opacity')).toBe('0.4')
  })

  it('T3 es el único par donde la primera columna es MÁS ALTA', () => {
    // **Es la aserción que mata la inversión.** En T1, T2 y T4 la medición está
    // por debajo de su objetivo; en T3 lo supera. Un fixture monótono dejaría
    // pasar el cambio: cuatro parejas prolijas con la misma tinta.
    const pares = grupos(dibujar(CUATRO).container)
    const primeraEsMasAlta = pares.map(([a, b]) => a.h > b.h)

    expect(primeraEsMasAlta).toEqual([false, false, true, false])
  })
})

describe('el dominio · una escala, dos series', () => {
  it('el techo cubre `v` Y `referencia` · la fantasma no se sale por arriba', () => {
    // **Fixture hecho para la mutación.** Con los cuatro pares del dibujo los dos
    // caminos dan techo 5 y `ceiling(items.map(i => i.v))` SOBREVIVE. Acá los
    // valores no pasan de 4 y una referencia es 9: calculado sólo sobre `v` el
    // techo sería 4 y la fantasma mediría 612 px sobre un área de 272.
    const { container } = dibujar([
      { etiqueta: 'A', v: 3.8, referencia: 9 },
      { etiqueta: 'B', v: 4, referencia: 3.5 },
    ])
    const cols = columnas(container)

    expect(cols).toHaveLength(4)
    for (const c of cols) {
      expect(c.y).toBeGreaterThanOrEqual(0)
      expect(c.y + c.h).toBeLessThanOrEqual(HEIGHT + 1e-6)
    }
    // `ceiling([9, 3.8, 4, 3.5])`: `niceStep(9 / 5) = 2` y `ceil(9 / 2) · 2 = 10`,
    // así que la de 9 ocupa 0.9 del área.
    expect(Math.max(...cols.map((c) => c.h))).toBeCloseTo(HEIGHT * 0.9, 6)
  })

  it('las dos columnas crecen del MISMO baseline', () => {
    // Darle a la referencia su propia `linearScale` —otro rango, otro `base`— se
    // ve perfecto y vuelve la comparación de alturas sin sentido.
    for (const c of columnas(dibujar(CUATRO).container)) {
      expect(c.y + c.h).toBeCloseTo(HEIGHT, 6)
    }
  })

  it('la altura sale del valor y del techo del frame', () => {
    const pares = grupos(dibujar(CUATRO).container)
    const esperado = CUATRO.map((i) => [
      (i.v / TECHO) * HEIGHT,
      ((i.referencia ?? 0) / TECHO) * HEIGHT,
    ])

    pares.forEach(([medicion, fantasma], g) => {
      expect(medicion.h).toBeCloseTo(esperado[g]![0]!, 6)
      expect(fantasma.h).toBeCloseTo(esperado[g]![1]!, 6)
    })
  })
})

describe('la banda · el aire adentro es lo único que agrupa', () => {
  it('la pareja va A RAS y el hueco queda en el medio', () => {
    // Las dos mutaciones que esto mata: una `bandScale` anidada con padding
    // —cada miembro se centra en su sub-paso, el primero deja de arrancar en
    // `x(k)` y el hueco cae a la mitad— y `INNER = 0`, con las dos columnas
    // tocándose y el par dejando de leerse como par.
    grupos(dibujar(CUATRO).container).forEach(([medicion, fantasma], g) => {
      expect(medicion.x).toBeCloseTo(X0(g), 6)
      expect(fantasma.x + fantasma.w).toBeCloseTo(X0(g) + BANDWIDTH, 6)
      expect(medicion.w).toBeCloseTo(BARW, 6)
      expect(fantasma.w).toBeCloseTo(BARW, 6)

      const hueco = fantasma.x - (medicion.x + medicion.w)
      expect(hueco).toBeCloseTo(GAP, 6)
      // Del frame: 5 px sobre los 83 del par.
      expect(hueco / BANDWIDTH).toBeCloseTo(0.0602, 3)
    })
  })

  it('el grupo ocupa 0.64 del paso · el mismo `PADDING` que las columnas', () => {
    // Omitir el tercer argumento de `bandScale` deja su `padding` de 0.2 y da
    // 0.8: los grupos se pegan entre sí y el aire entre parejas deja de dominar
    // sobre el aire interno.
    for (const [medicion, fantasma] of grupos(dibujar(CUATRO).container)) {
      const hueco = fantasma.x - (medicion.x + medicion.w)
      expect((medicion.w + hueco + fantasma.w) / STEP).toBeCloseTo(0.64, 5)
    }
  })

  it('el radio de la marca es el del frame · `cornerRadius: 2`', () => {
    for (const c of columnas(dibujar(CUATRO).container)) expect(c.rx).toBe(2)
  })
})

describe('la tinta · reglas duras que ningún compilador sostiene', () => {
  it('ni un hex, ni naranja, ni ámbar · todo sale de un token', () => {
    const { container } = dibujar(CUATRO)
    const pintados = [
      ...Array.from(container.querySelectorAll('[fill],[stroke]')).flatMap((n) => [
        n.getAttribute('fill'),
        n.getAttribute('stroke'),
      ]),
      // El texto pinta por `style`, no por atributo: sin esto los siete rótulos
      // quedarían fuera del barrido.
      ...textos(container).map((t) => t.style.fill),
    ].filter((v): v is string => typeof v === 'string' && v !== '' && v !== 'none')

    expect(pintados.length).toBeGreaterThan(0)
    for (const color of pintados) {
      expect(color).toMatch(/^var\(--color-[a-z0-9-]+\)$/)
      // El naranja no es color de datos, y una pareja real-contra-objetivo es
      // exactamente donde la tentación de «resaltar el real» aparece.
      expect(color).not.toBe('var(--color-acc)')
      expect(color).not.toContain('#')
    }
  })

  it('la familia llega por PROP · cablear la del dibujo es invisible', () => {
    const medios = columnas(dibujar(CUATRO, 'medios').container).map((c) => c.fill)
    const inventario = columnas(dibujar(CUATRO, 'inventario').container).map((c) => c.fill)

    expect(medios.every((f) => f?.includes('fam-medios-'))).toBe(true)
    expect(inventario.every((f) => f?.includes('fam-inventario-'))).toBe(true)
    expect(medios).not.toEqual(inventario)
  })

  it('los dos escalones siguen siendo distintos en `externo`, que tiene DOS', () => {
    // `familyVar` hace `step % largo`, así que pedir `step: 2` para la medición
    // colapsaría las dos columnas al mismo color — y seguiría viéndose bien en
    // las otras cuatro familias, que tienen cinco escalones. Es el riesgo que
    // `PlotDumbbell` declaró y no pudo evitar; acá se evita usando 0 y 1.
    const [medicion, fantasma] = grupos(dibujar(CUATRO, 'externo').container)[0]!

    expect(medicion.fill).toBe('var(--color-fam-externo-1)')
    expect(fantasma.fill).toBe('var(--color-fam-externo-0)')
    expect(medicion.fill).not.toBe(fantasma.fill)
  })
})

describe('ningún número desnudo · y ninguna rejilla sin su rótulo', () => {
  it('hay tantos rótulos de valor como rejillas', () => {
    // Un `count` distinto entre `Grid` y `ValueAxis` deja una línea sin número,
    // que es la versión en papel de «un número desnudo». El dibujo tiene tres y
    // tres: `ticks(4)` sobre [0, 5] da paso 2 ⇒ 0, 2 y 4.
    const { container } = dibujar(CUATRO)

    expect(rejillas(container)).toHaveLength(3)
    expect(valores(container)).toHaveLength(3)
    expect(valores(container).map((t) => t.textContent)).toEqual(['0', '2', '4'])
  })

  it('cada categoría tiene su rótulo y está centrado en la BANDA', () => {
    // Centrarlo en la columna de valor —`x(k) + barW / 2`— corre los cuatro
    // rótulos ~20 px a la izquierda de su pareja: se ve prolijo y asocia el
    // rótulo a la pareja de al lado en cuanto hay más grupos.
    const rotulos = categorias(dibujar(CUATRO).container)

    expect(rotulos.map((t) => t.textContent)).toEqual(['T1', 'T2', 'T3', 'T4'])
    rotulos.forEach((t, g) => {
      expect(num(t, 'x')).toBeCloseTo(X0(g) + BANDWIDTH / 2, 6)
    })
  })

  it('el dibujo NO escribe cifra sobre las columnas', () => {
    // Siete textos y ni uno más: tres de valor y cuatro de categoría. Agregar
    // una cifra «porque el dato trae `delta`» es ir contra el frame, que manda
    // en lo visual — y ocho cifras sobre pares de 39 px no entran.
    const conDelta = CUATRO.map((i) => ({ ...i, delta: i.v - (i.referencia ?? 0) }))

    expect(textos(dibujar(conDelta).container)).toHaveLength(7)
  })
})

describe('sin `referencia` no hay par · y no se rellena', () => {
  it('el par se descarta · seis rectángulos, no ocho ni siete', () => {
    // `?? 0` da ocho con una fantasma de alto cero que se lee «objetivo 0»;
    // `?? i.v` da ocho con una fantasma de igual alto que se lee «llegó a la
    // meta». Las dos compilan y las dos se ven plausibles.
    const { container } = dibujar([
      { etiqueta: 'T1', v: 3.81, referencia: 3.9 },
      { etiqueta: 'T2', v: 4.02 },
      { etiqueta: 'T3', v: 4.28, referencia: 4.15 },
      { etiqueta: 'T4', v: 4.42, referencia: 4.6 },
    ])

    expect(columnas(container)).toHaveLength(6)
    expect(categorias(container).map((t) => t.textContent)).toEqual(['T1', 'T3', 'T4'])
    // El conteo del `aria-label` es lo ÚNICO que le dice a un lector que la
    // categoría se descartó.
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      '3 categorías · valor y referencia en columnas pareadas',
    )
  })

  it('el `aria-label` NO es el de la pesa', () => {
    // Con el texto de `PlotDumbbell`, un panel que pide `grouped` y cae a
    // `dumbbell` pasa inadvertido en toda prueba que lo busque por rol y nombre.
    dibujar(CUATRO)
    const nombre = screen.getByRole('img', { name: /columnas pareadas/ })

    expect(nombre.getAttribute('aria-label')).not.toMatch(/brecha/)
    expect(nombre.getAttribute('aria-label')).toBe(
      '4 categorías · valor y referencia en columnas pareadas',
    )
  })
})

describe('sin tamaño no dibuja, y no revienta', () => {
  it('con el contenedor sin medir rinde el contenedor y ningún `svg`', () => {
    // Sin el guardia, `bandScale` trabaja sobre un rango de ancho cero y los
    // rectángulos salen con `NaN`, que el navegador descarta en silencio.
    const { container } = dibujarEn({ width: 0, height: 0 }, CUATRO)

    expect(container.querySelector('div')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('con tamaño y sin ninguna `referencia` tampoco rinde `svg`', () => {
    const { container } = dibujar([
      { etiqueta: 'T1', v: 3.81 },
      { etiqueta: 'T2', v: 4.02 },
    ])

    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('dónde cae cada rótulo · lo que la mutación encontró sin cubrir', () => {
  /** Cuánto bajan los rótulos de categoría bajo el baseline · del frame: centro
   *  en y 206.3 contra un baseline en 190 ⇒ 16.3, que el plot redondea a 16 y lo
   *  declara. Recalculado acá y no importado: el número del frame es la fuente. */
  const DROP = 16

  it('los rótulos de categoría caen BAJO el área y entran en `MARGIN.b`', () => {
    // Las dos mutaciones que esto mata, y las dos SOBREVIVÍAN: `LABEL_DROP = 0`
    // monta los cuatro rótulos sobre el baseline y encima de la base de las ocho
    // columnas, y `at={LABEL_DROP}` los manda arriba del área, cruzados con la
    // rejilla y con el techo de las columnas. Las dos se ven «un gráfico con sus
    // rótulos» en cualquier conteo y en cualquier `textContent`.
    const rotulos = categorias(dibujar(CUATRO).container)

    expect(rotulos).toHaveLength(4)
    for (const t of rotulos) {
      expect(num(t, 'y')).toBeCloseTo(HEIGHT + DROP, 6)
      // Y entran en el alto del `svg`: el `<g>` está corrido `MARGIN.t` y
      // `MARGIN.b` son exactamente los 20 px que esta línea reserva.
      expect(MARGIN.t + num(t, 'y')).toBeLessThanOrEqual(TEST_SIZE.height)
    }
    // Ninguna columna llega hasta ahí: el rótulo no pisa dato.
    for (const c of columnas(dibujar(CUATRO).container)) {
      expect(c.y + c.h).toBeLessThan(HEIGHT + DROP)
    }
  })

  it('el rótulo de valor queda a la IZQUIERDA del área, con aire', () => {
    // `at = reserve − 6`, la misma convención de los otros nueve plots que
    // montan un `ValueAxis` a la izquierda. El texto va `text-anchor: end`, así
    // que su `x` es su borde DERECHO: con `at = reserve` los tres rótulos pegan
    // contra la rejilla y contra la primera columna, y eso SOBREVIVÍA — nada
    // miraba la `x` de los rótulos de valor, sólo su conteo y su texto.
    const ejes = valores(dibujar(CUATRO).container)

    expect(ejes).toHaveLength(3)
    for (const t of ejes) {
      expect(num(t, 'x')).toBeCloseTo(RESERVE - 6, 6)
      expect(num(t, 'x')).toBeLessThan(RESERVE)
    }
  })

  it('la rejilla cruza el área ENTERA · hasta la última columna', () => {
    // `length={width / 2}` SOBREVIVÍA: las tres líneas mueren en el medio y los
    // dos últimos pares quedan sin referencia de altura. El conteo de rejillas y
    // el de rótulos siguen siendo tres y tres, que es todo lo que se miraba.
    const { container } = dibujar(CUATRO)
    const borde = Math.max(...columnas(container).map((c) => c.x + c.w))

    for (const l of rejillas(container)) {
      expect(num(l, 'x1')).toBe(0)
      expect(num(l, 'x2')).toBeCloseTo(WIDTH, 6)
      expect(num(l, 'x2')).toBeGreaterThanOrEqual(borde)
    }
  })

  it('el recorte del rótulo sale del PASO y no de la sub-banda', () => {
    // El aire entre grupos es 36 % del paso y el rótulo puede usarlo, que es por
    // qué `CategoryAxis` recibe `x.step`. Con `x.bandwidth` el cupo baja de 19 a
    // 12 caracteres —`floor(141 / 7.2)` contra `floor(90.24 / 7.2)`— y la
    // categoría se recorta sin que haga falta: con los `T1`–`T4` del frame las
    // dos opciones dan lo mismo, de ahí que la mutación SOBREVIVIERA.
    //
    // No lo fija el frame, que sólo dibuja rótulos de dos caracteres: si diseño
    // decide recortar contra la banda, ESTA es la línea que se cambia.
    const LARGO = 'CANAL MAYORISTA' // 15 caracteres: entra en 19, no en 12
    const rotulos = categorias(
      dibujar([{ ...CUATRO[0]!, etiqueta: LARGO }, ...CUATRO.slice(1)]).container,
    )

    expect(rotulos[0]?.textContent).toBe(LARGO)
    expect(rotulos[0]?.textContent).not.toContain('…')
  })
})

/* ── El despacho del cuerpo ───────────────────────────────────────────────────
 *
 * El cableado es una fase aparte y `ComparisonBody` es compartido, así que de los
 * tres casos sólo se puede fijar el que sobrevive al cableado — y es el que más
 * duele si se rompe, porque es el de los paneles publicados. Los otros dos están
 * declarados en el encabezado de este archivo.
 */
describe('`dumbbell` sigue siendo el de por defecto', () => {
  it('`grafico` ausente NO sale columnas pareadas', () => {
    // Hacer `grouped` el defecto repinta en silencio todo panel `comparison` ya
    // publicado: ninguno declara `grafico`.
    render(
      <ComparisonBody
        span={{ colStart: 1, colSpan: 5, rowSpan: 4 }}
        family="demanda"
        metric="Ingresos por trimestre"
        format={createFormat('es-MX')}
        value={comparada(CUATRO)}
        params={{}}
      />,
    )

    expect(screen.getByRole('img', { name: /su referencia y su brecha/ })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /columnas pareadas/ })).toBeNull()
  })
})
