// @vitest-environment jsdom

/** El flujo · `sankey` · §PEN:Plot/FLUJO · 2026-09-30
 *
 *  **Lo único que un sankey promete es el GROSOR**, así que casi todo lo de acá
 *  es aritmética sobre `flowLayout` y no un render: doce cintas de grosor
 *  plausible se ven bien y no dicen nada, y un diagrama con dos escalas se ve
 *  más prolijo que uno con una —es justo lo que hace el frame, estirando su
 *  columna derecha un 2,5 %—.
 *
 *  **El fixture es el frame, con dos correcciones de 0,1 que hay que declarar.**
 *  Los rectángulos del dibujo dicen `CRITEO 18,8` y `TIKTOK 8,9` mientras sus
 *  cintas suman 18,9 y 8,8: son redondeos de mano alzada. Acá se usan las sumas
 *  de las cintas, porque la aserción que más vale es que el nodo y sus cintas
 *  CIERREN, y con los valores redondeados no cerrarían por una razón que no es
 *  la que se quiere probar.
 *
 *  Los doce enlaces se entregan **MEZCLADOS** a propósito: en el orden del
 *  dibujo, la aserción del apilado no podría fallar nunca.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GraphBody } from '@/render/bodies/GraphBody'
import { PlotSankey, flowLayout, ribbonPath } from '@/render/plots/PlotSankey'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'
import { TEST_SIZE } from '../../setup'

const format = createFormat('es-MX')
const number = (v: number) => format.number(v, { abbreviate: true })

type Flujo = Extract<Value, { forma: 'flujo' }>

/** La caja es la que informa el doble de `ResizeObserver` de `tests/setup.ts`:
 *  el plot mide su contenedor y el contenedor es `w-full h-full`. */
const BOX = { w: TEST_SIZE.width, h: TEST_SIZE.height }

/* ── El frame, nodo por nodo ─────────────────────────────────────────────────
 *
 * `Plot/FLUJO · Canal hacia división`, 580 × 200. Cuatro etapas a la izquierda
 * y tres a la derecha; las `v` de la derecha son las sumas de las cintas que
 * las alimentan —85,3 · 57,4 · 17,3—, que es lo que el dibujo NO respeta: sus
 * rectángulos miden 91 · 59,4 · 13,6 y suman 164 contra las 160 de las cintas.
 */
const ETAPAS = [
  { id: 'meta', etiqueta: 'META', v: 72.2 },
  { id: 'google', etiqueta: 'GOOGLE', v: 60.1 },
  { id: 'criteo', etiqueta: 'CRITEO', v: 18.9 },
  { id: 'tiktok', etiqueta: 'TIKTOK', v: 8.8 },
  { id: 'footwear', etiqueta: 'FOOTWEAR', v: 85.3 },
  { id: 'apparel', etiqueta: 'APPAREL', v: 57.4 },
  { id: 'accessories', etiqueta: 'ACCESSORIES', v: 17.3 },
]

/** Los doce grosores del frame, leídos de los `l0 …` de cada path. **Mezclados**:
 *  si vinieran en el orden en que el dibujo los apila, la aserción del apilado
 *  pasaría con el ordenamiento borrado. */
const ENLACES = [
  { desde: 'meta', hacia: 'accessories', v: 7.2 }, // p10
  { desde: 'tiktok', hacia: 'apparel', v: 3.9 }, // p18
  { desde: 'google', hacia: 'footwear', v: 31.2 }, // p11
  { desde: 'criteo', hacia: 'accessories', v: 2.7 }, // p16
  { desde: 'meta', hacia: 'footwear', v: 41.9 }, // p8
  { desde: 'tiktok', hacia: 'accessories', v: 1.4 }, // p19
  { desde: 'google', hacia: 'accessories', v: 6 }, // p13
  { desde: 'criteo', hacia: 'footwear', v: 8.7 }, // p14
  { desde: 'meta', hacia: 'apparel', v: 23.1 }, // p9
  { desde: 'google', hacia: 'apparel', v: 22.9 }, // p12
  { desde: 'tiktok', hacia: 'footwear', v: 3.5 }, // p17
  { desde: 'criteo', hacia: 'apparel', v: 7.5 }, // p15
]

const FRAME: Flujo = { forma: 'flujo', etapas: ETAPAS, enlaces: ENLACES } as Flujo

const flujo = (etapas: Flujo['etapas'], enlaces: Flujo['enlaces']): Flujo =>
  ({ forma: 'flujo', etapas, enlaces }) as Flujo

const rects = (c: HTMLElement) => Array.from(c.querySelectorAll('rect'))
const paths = (c: HTMLElement) => Array.from(c.querySelectorAll('path'))
const texts = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))

/** Los números del `d` de una cinta, en el orden en que `ribbonPath` los
 *  escribe: `x0 aTop · xm aTop · xm bTop · x1 bTop · x1 bBot · xm bBot · xm aBot
 *  · x0 aBot`. Se parsea en vez de confiar en el plan porque lo que se pinta es
 *  el `d`, y un plan correcto con un `d` mal armado se ve como un flujo raro. */
function cinta(d: string) {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  const x0 = n[0] as number
  const aTop = n[1] as number
  const x1 = n[6] as number
  const bTop = n[7] as number
  const bBot = n[9] as number
  const aBot = n[15] as number
  return { x0, aTop, x1, bTop, bBot, aBot, thickness: bBot - bTop, grosorOrigen: aBot - aTop }
}

/** El orden en que el plot pinta: por índice de etapa origen y después de
 *  destino. Se recalcula acá para no copiar una lista de doce a mano. */
const ORDEN = ENLACES.map((l) => ({
  ...l,
  from: ETAPAS.findIndex((e) => e.id === l.desde),
  to: ETAPAS.findIndex((e) => e.id === l.hacia),
})).sort((p, q) => p.from - q.from || p.to - q.to)

/* ══ UNA ESCALA PARA TODO ════════════════════════════════════════════════════ */

describe('el grosor es proporcional al valor, con UNA sola escala', () => {
  it('el cociente `alto / v` es el mismo número en los siete nodos', () => {
    // **Es lo único que un sankey afirma.** Renormalizar por columna —que es lo
    // que el frame hace— da un dibujo más prolijo: la columna derecha llena su
    // caja. Y afirma dos escalas a la vez, así que el grosor deja de ser
    // comparable entre columnas y el diagrama miente sin verse mal.
    const plan = flowLayout(FRAME, BOX)
    expect(plan.nodes).toHaveLength(7)

    for (const node of plan.nodes) {
      expect(node.h / node.v).toBeCloseTo(plan.k, 9)
    }
  })

  it('la escala es la de la columna MÁS EXIGENTE y la otra queda corta', () => {
    const plan = flowLayout(FRAME, BOX)

    // Izquierda: cuatro nodos, tres huecos de 4. Derecha: tres nodos, dos huecos.
    // Las dos suman 160, así que la derecha tiene 4px más de sitio y es la que
    // se queda corta.
    const util = (n: number) => BOX.h - 12 - 16 - 4 * (n - 1)
    expect(plan.k).toBeCloseTo(util(4) / 160, 9)
    expect(plan.k).toBeLessThan(util(3) / 160)

    // La divergencia declarada contra el dibujo: a la columna derecha le sobran
    // los 4px que la izquierda gasta en su cuarto hueco, así que termina más
    // arriba de donde el frame la termina. Escrita acá, el día que alguien la
    // «arregle» renormalizando, la prueba avisa.
    const barras = plan.nodes.filter((n) => n.column === 1).reduce((a, n) => a + n.h, 0)
    expect(util(3) - barras).toBeCloseTo(4, 9)
  })

  it('el grosor de cada cinta es `k · v`, con el MISMO `k` de los nodos', () => {
    // Escalar cada cinta por `v / Σ(enlaces del nodo) · alto(nodo)` da casi lo
    // mismo y rompe justo cuando el nodo no conserva el flujo, que es el caso
    // que hay que ver. Grosor constante también se ve bien.
    const { container } = render(<PlotSankey value={FRAME} family="medios" format={number} />)
    const plan = flowLayout(FRAME, BOX)

    const trazos = paths(container)
    expect(trazos).toHaveLength(12)

    trazos.forEach((p, i) => {
      const { thickness, grosorOrigen } = cinta(p.getAttribute('d') ?? '')
      const esperado = ORDEN[i] as { v: number }
      expect(thickness / esperado.v).toBeCloseTo(plan.k, 6)
      // Y el grosor es idéntico en las dos puntas, como el frame: 23,1 y 23,1.
      expect(grosorOrigen).toBeCloseTo(thickness, 6)
    })
  })
})

/* ══ EL APILADO ══════════════════════════════════════════════════════════════ */

describe('las cintas de un nodo cierran su alto, en los DOS extremos', () => {
  it('sin hueco ni solape, de `y` a `y + h`', () => {
    // **Es la aserción que atrapa el desborde que el frame tiene medido**:
    // ACCESSORIES recibe cuatro cintas que terminan en `y 187,7` y su rectángulo
    // termina en 184. Borrar el acumulador del offset arranca todas en el borde
    // superior del nodo, y con doce cintas plausibles el dibujo no se ve roto.
    const plan = flowLayout(FRAME, BOX)
    const E = 0.01

    // Los cuatro de la izquierda no reciben nada y los tres de la derecha no
    // sacan nada: el contador es lo que impide que un lado quede sin ejercitar y
    // la prueba pase por vacía.
    let comprobados = 0

    plan.nodes.forEach((node, i) => {
      for (const lado of ['salientes', 'entrantes'] as const) {
        const tramos = plan.ribbons
          .filter((r) => (lado === 'salientes' ? r.from === i : r.to === i))
          .map((r) => ({ top: lado === 'salientes' ? r.aTop : r.bTop, t: r.thickness }))
          .sort((a, b) => a.top - b.top)
        if (tramos.length === 0) continue
        comprobados += 1

        expect(tramos[0]?.top).toBeCloseTo(node.y, 6)
        tramos.forEach((tramo, k) => {
          const siguiente = tramos[k + 1]
          if (siguiente === undefined) {
            expect(tramo.top + tramo.t).toBeCloseTo(node.y + node.h, 6)
          } else {
            expect(Math.abs(tramo.top + tramo.t - siguiente.top)).toBeLessThan(E)
          }
        })
      }
    })

    // Siete nodos, un lado cada uno: cuatro que salen y tres que entran.
    expect(comprobados).toBe(7)
  })

  it('se ordenan por la posición del nodo del OTRO extremo, no por el arreglo', () => {
    // El fixture entrega los doce mezclados: la primera saliente de META en el
    // arreglo es la de ACCESSORIES. Apilar en orden de llegada cruzaría las
    // cintas consigo mismas y el diagrama seguiría viéndose como un sankey.
    const plan = flowLayout(FRAME, BOX)

    const salientesDeMeta = plan.ribbons
      .filter((r) => r.from === 0)
      .sort((a, b) => a.aTop - b.aTop)
      .map((r) => plan.nodes[r.to]?.label)
    expect(salientesDeMeta).toEqual(['FOOTWEAR', 'APPAREL', 'ACCESSORIES'])

    // Y del otro lado igual: FOOTWEAR recibe META, GOOGLE, CRITEO, TIKTOK de
    // arriba hacia abajo, que es el orden de `p8`, `p11`, `p14` y `p17`.
    const entrantesDeFootwear = plan.ribbons
      .filter((r) => r.to === 4)
      .sort((a, b) => a.bTop - b.bTop)
      .map((r) => plan.nodes[r.from]?.label)
    expect(entrantesDeFootwear).toEqual(['META', 'GOOGLE', 'CRITEO', 'TIKTOK'])
  })
})

/* ══ LA COLUMNA, QUE EL CONTRATO NO TRAE ═════════════════════════════════════ */

describe('la columna se DERIVA de los enlaces', () => {
  it('siete etapas planas dan dos columnas, no siete', () => {
    // `ValorFlujo` trae `etapas` planas y ninguna dice a qué columna va. Tomar
    // el índice del arreglo como columna dibuja siete columnas de un nodo: un
    // diagrama creíble que no es el que el dato describe.
    const plan = flowLayout(FRAME, BOX)
    const xs = [...new Set(plan.nodes.map((n) => n.x))].sort((a, b) => a - b)
    expect(xs).toHaveLength(2)

    // Y están donde la geometría del frame manda, normalizada a una reserva
    // simétrica: reserva = 0.25·w − 12 − 12 y tramo = 0.5·w.
    expect(plan.reserve).toBeCloseTo(BOX.w * 0.25 - 24, 9)
    expect(xs[0]).toBeCloseTo(plan.reserve + 12, 9)
    expect(xs[1]).toBeCloseTo(plan.reserve + 12 + 12 + BOX.w * 0.5, 9)
  })

  it('una cadena A→B→C da TRES columnas, repartidas uniformes sobre el tramo', () => {
    const plan = flowLayout(
      flujo(
        [
          { id: 'a', etiqueta: 'A', v: 10 },
          { id: 'b', etiqueta: 'B', v: 10 },
          { id: 'c', etiqueta: 'C', v: 10 },
        ],
        [
          { desde: 'a', hacia: 'b', v: 10 },
          { desde: 'b', hacia: 'c', v: 10 },
        ],
      ),
      BOX,
    )

    expect(plan.columns).toBe(3)
    const xs = plan.nodes.map((n) => n.x)
    expect(xs[0]).toBeCloseTo(plan.reserve + 12, 9)
    expect(xs[2]).toBeCloseTo(plan.reserve + 24 + BOX.w * 0.5, 9)
    // La del medio, en el medio: el tramo se reparte uniforme.
    expect(xs[1]).toBeCloseTo(((xs[0] as number) + (xs[2] as number)) / 2, 9)
  })

  it('una etapa sin ningún enlace cae en la columna 0 y no rompe el reparto', () => {
    // Nada en `ValorFlujo` lo prohíbe, y es correcto: se ve como un nodo
    // huérfano. Lo que no puede pasar es que cuelgue la derivación de columnas.
    const plan = flowLayout(
      flujo(
        [
          { id: 'a', etiqueta: 'A', v: 10 },
          { id: 'b', etiqueta: 'B', v: 10 },
          { id: 'suelta', etiqueta: 'SUELTA', v: 5 },
        ],
        [{ desde: 'a', hacia: 'b', v: 10 }],
      ),
      BOX,
    )

    expect(plan.nodes.map((n) => n.column)).toEqual([0, 1, 0])
    expect(plan.ribbons).toHaveLength(1)
  })

  it('un ciclo no cuelga la relajación y queda acotado a `etapas.length`', () => {
    const plan = flowLayout(
      flujo(
        [
          { id: 'a', etiqueta: 'A', v: 10 },
          { id: 'b', etiqueta: 'B', v: 10 },
        ],
        [
          { desde: 'a', hacia: 'b', v: 10 },
          { desde: 'b', hacia: 'a', v: 10 },
        ],
      ),
      BOX,
    )

    expect(plan.columns).toBeLessThanOrEqual(2)
    for (const node of plan.nodes) expect(Number.isFinite(node.h)).toBe(true)
  })
})

/* ══ EL COLOR, QUE ES DE DATOS ═══════════════════════════════════════════════ */

describe('todo relleno sale de la familia que llegó por prop', () => {
  it('ni `acc`, ni ámbar, ni un hex · en los nodos y en las cintas', () => {
    // El frame pinta CUATRO familias en el mismo gráfico —`medios`, `cliente`,
    // `inventario`, `demanda`— y eso no se copia: la familia se lee del catálogo
    // y llega por prop, una sola · regla dura 1.
    const { container } = render(<PlotSankey value={FRAME} family="medios" format={number} />)

    const fills = [...rects(container), ...paths(container)].map((n) => n.getAttribute('fill'))
    expect(fills).toHaveLength(19)
    for (const fill of fills) {
      expect(fill).toMatch(/^var\(--color-fam-medios-[0-4]\)$/)
    }
    expect(container.innerHTML).not.toContain('--color-acc')
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('la cinta toma el color de su ORIGEN, y la rampa no es plana', () => {
    // Lo fija el frame: `p8`,`p9`,`p10` en `$fam-medios-1` como META, y
    // `p17`,`p18`,`p19` en `$fam-inventario-1` como TIKTOK. Colorear por destino
    // parte las tres salientes de una etapa en tres colores y el flujo deja de
    // leerse; una rampa plana las junta todas y pasa la aserción de arriba.
    const { container } = render(<PlotSankey value={FRAME} family="medios" format={number} />)
    const nodos = rects(container).map((r) => r.getAttribute('fill'))
    const cintas = paths(container).map((p) => p.getAttribute('fill'))

    // Las tres primeras del orden de pintado son las de META.
    expect(new Set(cintas.slice(0, 3)).size).toBe(1)
    expect(cintas[0]).toBe(nodos[0])
    expect(cintas[3]).toBe(nodos[1])
    expect(nodos[0]).not.toBe(nodos[1])

    // El arranque es el del frame: `-1` y después `-0`, y la rampa se reinicia
    // por columna, como el dibujo.
    expect(nodos[0]).toBe('var(--color-fam-medios-1)')
    expect(nodos[1]).toBe('var(--color-fam-medios-0)')
    expect(nodos[4]).toBe(nodos[0])
    // Los cuatro de la columna izquierda —que es donde el color distingue, por
    // ser los orígenes— no repiten.
    expect(new Set(nodos.slice(0, 4)).size).toBe(4)
  })
})

/* ══ LOS RÓTULOS ═════════════════════════════════════════════════════════════ */

describe('cada nodo lleva su rótulo, centrado EN SU NODO', () => {
  it('con el contrato tipográfico del frame y la `y` del centro del rectángulo', () => {
    const { container } = render(<PlotSankey value={FRAME} family="medios" format={number} />)
    const rotulos = texts(container)
    const nodos = rects(container)
    expect(rotulos).toHaveLength(7)

    rotulos.forEach((t, i) => {
      // §2.3 y el frame: mono 10, 1.2px de tracking sobre un cuerpo de 10 son
      // 0.12em, `$dim`.
      expect(t.style.fontFamily).toBe('var(--font-mono)')
      expect(t.style.fontSize).toBe('10px')
      expect(t.style.letterSpacing).toBe('0.12em')
      expect(t.style.fill).toBe('var(--color-dim)')

      // Centrado en SU nodo. Con alturas desiguales, centrar sobre la columna
      // despega el rótulo de la banda que nombra y el dibujo se sigue viendo
      // ordenado. Medido en los siete del frame: META centra en 48,6 contra el
      // 48,1 del nodo, ACCESSORIES en 177,7 contra 177,2.
      const r = nodos[i] as SVGRectElement
      const centro = Number(r.getAttribute('y')) + Number(r.getAttribute('height')) / 2
      expect(Number(t.getAttribute('y'))).toBeCloseTo(centro, 6)
    })
  })

  it('el contenido va en MAYÚSCULAS aunque la etiqueta no venga así', () => {
    // El frame escribe los siete en mayúsculas. La etiqueta la manda el
    // catálogo y no hay nada que garantice el caso.
    render(
      <PlotSankey
        value={flujo(
          [
            { id: 'a', etiqueta: 'Meta Ads', v: 10 },
            { id: 'b', etiqueta: 'Calzado', v: 10 },
          ],
          [{ desde: 'a', hacia: 'b', v: 10 }],
        )}
        family="medios"
        format={number}
      />,
    )

    expect(screen.getByText('META ADS')).toBeInTheDocument()
    expect(screen.queryByText('Meta Ads')).toBeNull()
  })

  it('se recorta a lo que entra en su reserva, no a un tope fijo', () => {
    // Es el defecto que `charsThatFit` existe para haber arreglado una vez: un
    // tope en caracteres se sale por la izquierda en cuanto el panel se angosta.
    const largo = 'C'.repeat(40)
    const { container } = render(
      <PlotSankey
        value={flujo(
          [
            { id: 'a', etiqueta: largo, v: 10 },
            { id: 'b', etiqueta: 'B', v: 10 },
          ],
          [{ desde: 'a', hacia: 'b', v: 10 }],
        )}
        family="medios"
        format={number}
      />,
    )

    // `charsThatFit(reserva)` con la reserva del plan, no un número copiado.
    const plan = flowLayout(
      flujo(
        [
          { id: 'a', etiqueta: largo, v: 10 },
          { id: 'b', etiqueta: 'B', v: 10 },
        ],
        [{ desde: 'a', hacia: 'b', v: 10 }],
      ),
      BOX,
    )
    const cap = Math.max(3, Math.floor(plan.reserve / (10 * 0.72)))

    const rotulo = texts(container)[0] as SVGTextElement
    expect(rotulo.textContent).toHaveLength(cap)
    expect(rotulo.textContent?.endsWith('…')).toBe(true)
    // Y no se sale del SVG: el ancla es `end` a la izquierda de su nodo.
    expect(rotulo.getAttribute('text-anchor')).toBe('end')
    expect(Number(rotulo.getAttribute('x'))).toBeCloseTo(plan.reserve, 6)

    // El de la última columna se ancla al otro lado, con el mismo aire de 12.
    const derecho = texts(container)[1] as SVGTextElement
    expect(derecho.getAttribute('text-anchor')).toBe('start')
    expect(Number(derecho.getAttribute('x'))).toBeCloseTo((plan.nodes[1]?.x ?? 0) + 24, 6)
  })
})

/* ══ LO QUE PUEDE LLEGAR Y NO SE PUEDE DIBUJAR ═══════════════════════════════ */

describe('un enlace a una etapa que no existe no se dibuja ni desplaza a nadie', () => {
  it('siguen siendo doce cintas, ningún `d` con `NaN`, y el apilado no se mueve', () => {
    // Sin el filtro su `aTop` sale `NaN`, el `d` sale con `NaN` adentro y el
    // path **desaparece sin ningún error** —el mismo modo de falla que
    // `PlotComposition` documenta para el lado negativo— y de paso corre el
    // apilado de los que sí eran válidos.
    const sucio = flujo(ETAPAS, [...ENLACES, { desde: 'meta', hacia: 'fantasma', v: 9 }])
    const { container } = render(<PlotSankey value={sucio} family="medios" format={number} />)

    const trazos = paths(container)
    expect(trazos).toHaveLength(12)
    for (const p of trazos) expect(p.getAttribute('d')).not.toContain('NaN')

    const limpio = flowLayout(FRAME, BOX)
    const conFantasma = flowLayout(sucio, BOX)
    expect(conFantasma.ribbons).toEqual(limpio.ribbons)
    expect(conFantasma.nodes).toEqual(limpio.nodes)

    // Y el nombre accesible cuenta lo DIBUJADO, no lo que llegó: trece enlaces
    // con doce cintas es la misma mentira que el `aria-label` de `PlotTreemap`
    // ya evita con las hojas sin área.
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('12 enlaces')
  })
})

/* ══ EL FORMATEADOR, INYECTADO ═══════════════════════════════════════════════ */

describe('`format` se usa y el plot no importa el formateador', () => {
  it('el nombre accesible lleva el total de la columna 0, con su palabra', () => {
    // El locale es del tenant y un plot no sabe de qué tenant se trata. Que el
    // nombre se arme CON `format` es lo que lo hace verificable.
    render(<PlotSankey value={FRAME} family="medios" format={(v) => `«${v}»`} />)

    // 72,2 + 60,1 + 18,9 + 8,8 = 160, y no `Σ etapas` —que contaría cada unidad
    // dos veces, al salir y al llegar—. En coma flotante la suma da
    // 160.00000000000003, así que el `toPrecision` del plot también se prueba acá.
    expect(
      screen.getByRole('img', { name: 'flujo de 7 etapas y 12 enlaces · total «160»' }),
    ).toBeInTheDocument()
  })

  it('y el nombre es DISTINGUIBLE del de los otros plots', () => {
    // Sin eso, la prueba de despacho de abajo no puede fallar nunca: un sankey
    // pintado donde el layout pidió otra cosa se ve perfecto.
    render(<PlotSankey value={FRAME} family="medios" format={number} />)
    expect(screen.getByRole('img', { name: /^flujo de / })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /categorías/ })).toBeNull()
  })
})

/* ══ LA CURVA ════════════════════════════════════════════════════════════════ */

describe('la cinta es una cúbica con los controles en el punto medio', () => {
  it('las tangentes salen horizontales de los dos extremos', () => {
    // Leído del path del frame: `M142 53.9 c144 0 144 53.1 288 53.1 …`, donde
    // `dx1 = dx2 = 144 = 288/2`. Sin eso la cinta sale como una diagonal recta o
    // como una `S` que se despega del nodo.
    const d = ribbonPath({ x0: 142, x1: 430, aTop: 53.9, bTop: 107, thickness: 23.1 })
    expect(d).toBe(
      'M142 53.9 C286 53.9 286 107 430 107 L430 130.1 C286 130.1 286 77 142 77 Z',
    )
  })
})

/* ══ Lo que la mutación encontró sin cubrir · QA 2026-09-30 ══════════════════
 *
 *  Las de arriba dejaban pasar tres mutaciones fieles, y las tres son números
 *  medidos nodo por nodo sobre el frame que ninguna aserción ataba al SVG.
 */

describe('el ancho, el radio y el borde del nodo son los del frame', () => {
  it('12 de ancho, `r-xs` de radio, y la cinta arranca DONDE TERMINA el rectángulo', () => {
    // **Las tres sobrevivieron a la mutación.** `NODE_RADIUS = 0` y un ancho de
    // 20 no rompían nada, y `x0 = node.x` tampoco: la cinta le entra 12px al
    // rectángulo, lo tapa con su propio color —que es el mismo, porque toma el
    // del origen— y el dibujo se ve idéntico. Del lado del destino el color SÍ
    // es otro, así que ahí se vería una muesca: el defecto es asimétrico y por
    // eso conviene afirmar los dos bordes.
    const { container } = render(<PlotSankey value={FRAME} family="medios" format={number} />)
    const plan = flowLayout(FRAME, BOX)

    for (const r of rects(container)) {
      expect(r.getAttribute('width')).toBe('12')
      expect(r.getAttribute('rx')).toBe('2')
    }

    // Y las coordenadas del nodo son las del plan, no las de otra cuenta: si el
    // `PAD_T` o el `GAP_NODE` cambian, esto no da.
    rects(container).forEach((r, i) => {
      const node = plan.nodes[i] as { x: number; y: number; h: number }
      expect(Number(r.getAttribute('x'))).toBeCloseTo(node.x, 6)
      expect(Number(r.getAttribute('y'))).toBeCloseTo(node.y, 6)
      expect(Number(r.getAttribute('height'))).toBeCloseTo(node.h, 6)
    })
    expect(plan.nodes[0]?.y).toBe(12)
    expect(plan.nodes[1]?.y).toBeCloseTo((plan.nodes[0]?.h ?? 0) + 12 + 4, 6)

    paths(container).forEach((p, i) => {
      const { x0, x1 } = cinta(p.getAttribute('d') ?? '')
      const esperado = ORDEN[i] as { from: number; to: number }
      expect(x0).toBeCloseTo((plan.nodes[esperado.from]?.x ?? 0) + 12, 6)
      expect(x1).toBeCloseTo(plan.nodes[esperado.to]?.x ?? 0, 6)
    })
  })
})

/* ══ EL DESPACHO, POR LOS SALTOS EN QUE PUEDE MORIR ══════════════════════════ */

describe('`GraphBody` elige el dibujo y DECLARA el que no tiene', () => {
  const monta = (grafico?: string) =>
    render(
      <GraphBody
        value={FRAME}
        params={{}}
        span={{ colStart: 1, colSpan: 12, rowSpan: 7 }}
        family="medios"
        metric="Inversión por canal hacia división"
        format={format}
        {...(grafico === undefined ? {} : { grafico: grafico as 'sankey' })}
      />,
    )

  it('`sankey` monta el sankey, y así lo dice su nombre accesible', () => {
    // Se busca por el nombre y no por «hay un svg»: cada salto de este camino
    // usa el spread condicional y **una prop mal nombrada compila**.
    monta('sankey')
    expect(screen.getByRole('img', { name: /^flujo de 7 etapas/ })).toBeInTheDocument()
  })

  it('sin `grafico` monta el sankey · es una DECISIÓN, no una herencia', () => {
    // `flujo` no tiene gráfico por defecto escrito: los seis ids que `GraficoId`
    // declara como cuerpo-sin-gráfico son `kpi`, `list`, `matrix`, `prose`,
    // `reco` y `table`, y ninguno cuelga de esta forma.
    monta()
    expect(screen.getByRole('img', { name: /^flujo de 7 etapas/ })).toBeInTheDocument()
  })

  it('`funnel` y `network` se DECLARAN y no caen a `sankey`', () => {
    // Los dos aceptan `flujo` en el repertorio y ninguno está construido. Caer a
    // `sankey` es exactamente el modo de falla que `UnknownPlotState` existe
    // para impedir: un embudo dibujado como flujo se ve perfecto.
    monta('funnel')
    expect(screen.getByText(/funnel/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /^flujo de/ })).toBeNull()

    monta('network')
    expect(screen.getByText(/network/)).toBeInTheDocument()
  })
})

/* ══ Lo que la SEGUNDA mutación encontró sin cubrir · QA 2026-09-30 ══════════
 *
 *  Tres mutaciones fieles sobrevivieron a las 22 de arriba, y las tres son la
 *  misma clase: **una guarda escrita, con su razón escrita al lado, y ninguna
 *  aserción que la ejercite.** Las dos primeras son las dos mitades del mismo
 *  filtro —el de `enlaces`—, de las que arriba sólo se probaba una; la tercera
 *  es el salto que `GraphBody` hace al inyectar el formateador, donde el
 *  fixture del frame **no podía verlo**: su total es 160 y abreviar 160 da
 *  «160», así que pasar `String(v)` se lee idéntico.
 */

describe('un id repetido no muda las cintas del primero', () => {
  it('el PRIMERO gana, y la cinta sale de su nodo y no del clon', () => {
    // `ValorFlujo` no declara unicidad. Sin la guarda del `Map` el último pisa
    // al primero, las cintas del primero se mudan de nodo y **nada falla**: se
    // siguen dibujando tres nodos y una cinta, la cinta sale de un rectángulo
    // del mismo color y a 14px de distancia, y el diagrama se ve correcto.
    const plan = flowLayout(
      flujo(
        [
          { id: 'a', etiqueta: 'ORIGEN', v: 10 },
          { id: 'a', etiqueta: 'CLON', v: 4 },
          { id: 'b', etiqueta: 'DESTINO', v: 10 },
        ],
        [{ desde: 'a', hacia: 'b', v: 10 }],
      ),
      BOX,
    )

    // Los tres nodos se dibujan igual: la etapa duplicada existe en `etapas` y
    // el plot no la borra. Lo que la guarda decide es a quién se AMARRA la cinta.
    expect(plan.nodes).toHaveLength(3)
    expect(plan.columns).toBe(2)
    expect(plan.ribbons).toHaveLength(1)

    const r = plan.ribbons[0] as { from: number; aTop: number }
    expect(r.from).toBe(0)
    expect(plan.nodes[r.from]?.label).toBe('ORIGEN')
    // Y arranca en el borde de arriba del PRIMERO, que es `PAD_T`. Con el clon
    // ganando saldría de `12 + h(ORIGEN) + GAP_NODE`, más abajo.
    expect(r.aTop).toBeCloseTo(plan.nodes[0]?.y ?? -1, 9)
    expect(r.aTop).toBeCloseTo(12, 9)
  })
})

describe('un enlace con `v` no dibujable se descarta como el que apunta a nadie', () => {
  it('cero, negativo y `NaN`: doce cintas siguen siendo doce y el apilado no se mueve', () => {
    // **Es la otra mitad del mismo filtro**, y arriba sólo se probaba la del id
    // inexistente. Las tres llegan por el cable como `number`:
    //   · `v: 0` dibuja un path de grosor cero —invisible, y el `aria-label`
    //     empieza a contar un enlace que nadie ve;
    //   · `v: -4` dibuja la cinta invertida y **corre hacia arriba** el apilado
    //     de las que vienen después, que es el desborde que ACCESSORIES ya
    //     tiene medido en el frame;
    //   · `v: NaN` mete `NaN` en el `d` y el path **desaparece sin ningún
    //     error**, igual que el enlace fantasma.
    //
    // **El cuarto es el que obliga a `Number.isFinite`, y es el único.** `NaN > 0`
    // ya es `false`, así que `l.v > 0` sola descarta el `NaN`: lo que el chequeo
    // de finitud atrapa —y nada más— es `Infinity`, que SÍ es `> 0`. Sin él la
    // cinta sale de grosor infinito y se come el dibujo. Se supo mutando:
    // quitando sólo `Number.isFinite` las tres primeras seguían muriendo.
    const sucio = flujo(ETAPAS, [
      ...ENLACES,
      { desde: 'meta', hacia: 'footwear', v: 0 },
      { desde: 'google', hacia: 'apparel', v: -4 },
      { desde: 'criteo', hacia: 'accessories', v: Number.NaN },
      { desde: 'tiktok', hacia: 'footwear', v: Number.POSITIVE_INFINITY },
    ])

    const limpio = flowLayout(FRAME, BOX)
    const conBasura = flowLayout(sucio, BOX)
    expect(conBasura.ribbons).toHaveLength(12)
    expect(conBasura.ribbons).toEqual(limpio.ribbons)
    expect(conBasura.nodes).toEqual(limpio.nodes)

    const { container } = render(<PlotSankey value={sucio} family="medios" format={number} />)
    const trazos = paths(container)
    expect(trazos).toHaveLength(12)
    for (const p of trazos) expect(p.getAttribute('d')).not.toContain('NaN')
    for (const p of trazos) expect(p.getAttribute('d')).not.toContain('Infinity')

    // Y el nombre accesible sigue contando lo dibujado.
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('12 enlaces')
  })
})

describe('`GraphBody` inyecta SU formateador y el plot lo usa', () => {
  it('abrevia, en una magnitud donde abreviar cambia el texto', () => {
    // **El fixture del frame no podía ver esto.** Su total es 160 y
    // `format.number(160, { abbreviate: true })` da «160», idéntico a
    // `String(160)` y a `format.number(160)`: cualquier formateador pasa. A
    // 4.280.000 los tres se separan —«4.28M», «4,280,000», «4280000»— y recién
    // ahí la prop se vuelve verificable. Es el salto donde el spread condicional
    // deja compilar una prop mal nombrada.
    const millones = flujo(
      [
        { id: 'a', etiqueta: 'CANAL', v: 4280000 },
        { id: 'b', etiqueta: 'DIVISIÓN', v: 4280000 },
      ],
      [{ desde: 'a', hacia: 'b', v: 4280000 }],
    )

    render(
      <GraphBody
        value={millones}
        params={{}}
        span={{ colStart: 1, colSpan: 12, rowSpan: 7 }}
        family="medios"
        metric="Inversión por canal hacia división"
        format={format}
      />,
    )

    // El literal y no `format.number(...)`: leído de la corrida, no de memoria.
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'flujo de 2 etapas y 1 enlaces · total 4.28M',
    )
    // Y las dos formas que las otras dos escrituras darían.
    expect(screen.queryByRole('img', { name: /4,280,000/ })).toBeNull()
    expect(screen.queryByRole('img', { name: /4280000/ })).toBeNull()
  })
})
