// @vitest-environment jsdom

/** Cohortes · `cohort` · §PEN:Plot/COHORTES · Recompra por cohorte
 *
 *  **El fixture es la matriz EXACTA del frame**, con sus 20 celdas presentes y
 *  sus 10 vacías, y eso tiene un límite que conviene decir de entrada: la
 *  escalera del dibujo es un triángulo inferior-derecho perfecto, así que un plot
 *  que SUPRIMA celdas por su posición pasaría todas las aserciones que usen ese
 *  fixture. Por eso existe la de más abajo con los `null` FUERA del triángulo.
 *
 *  **La primera prueba es aritmética pura sobre `levels()`**, por la misma razón
 *  que la del treemap lo es sobre `squarify`: una cohorte se ve igual de prolija
 *  cuantizando bien y cuantizando mal. Lo único que el gráfico promete es que el
 *  color sea monótono en el valor, y eso no se ve en el dibujo.
 *
 *  **Y NO se afirma el nivel del frame celda por celda**, a propósito: los cortes
 *  del dibujo son a mano y la cuantización lineal falla en tres de las veinte
 *  —el 24, el 32 y el 39—. Lo que se afirma es monotonía y extremos, que es lo
 *  que el gráfico promete. La divergencia está declarada en la cabecera del
 *  componente como propuesta de spec.
 *
 *  **LO QUE ESTA PRUEBA NO PUEDE CUBRIR, y queda anotado:** el despacho de
 *  `MatrixBody` —`grafico === 'cohort'` → `PlotCohort`, ausente o `'heatmap'` →
 *  `PlotHeatmap`, `calendar` y `matrix` a `UnknownPlotState`—, las dos guardias
 *  de densidad con `cohort`, y la unidad llegando por el `format` del cuerpo. Las
 *  tres piden escribir `src/render/bodies/MatrixBody.tsx`, que esta tarea no
 *  toca. Lo que sí se cubre acá es su mitad verificable: que el `aria-label` sea
 *  DISTINGUIBLE del mapa de calor —sin eso ninguna prueba de despacho puede
 *  afirmar cuál se montó— y que el plot **no inventa la unidad**.
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotCohort, levels } from '@/render/plots/PlotCohort'
import { createFormat } from '@/render/format'
import type { Family, Value } from '@/api/types'

const format = createFormat('es-MX')
const number = (v: number) => format.number(v, { abbreviate: true })
/** Lo que el cuerpo arma cuando la métrica declara unidad · el frame rotula `22%`. */
const conUnidad = (unit?: string) => (v: number) => format.withUnit(format.number(v), unit)

/* ── El frame, nodo por nodo ─────────────────────────────────────────────────
 *
 * Cohortes en las filas, antigüedad en las columnas, y la escalera que el dibujo
 * muestra: MAR tiene 6 cifras, ABR 5, MAY 4, JUN 3 y JUL 2, porque una cohorte de
 * julio todavía no tiene 180 días observados.
 */
const COHORTES = ['MAR', 'ABR', 'MAY', 'JUN', 'JUL']
const ANTIGUEDAD = ['30D', '60D', '90D', '120D', '150D', '180D']
const FRAME: readonly (readonly (number | null)[])[] = [
  [22, 34, 41, 46, 49, 52],
  [24, 36, 44, 48, 51, null],
  [19, 29, 36, 40, null, null],
  [27, 39, 47, null, null, null],
  [21, 32, null, null, null, null],
]

/** Las 6 cifras que el frame pinta en `$ink` · medidas celda por celda. Con la
 *  cuantización lineal son exactamente las del nivel 4, que es la coincidencia
 *  que hace que la tinta salga clavada aunque los cortes no. */
const INK_DEL_FRAME = [46, 47, 48, 49, 51, 52]

/** El doble de `ResizeObserver` de `tests/setup.ts` informa 600 × 300. Con
 *  rótulos de tres letras la canaleta sale 62 y la primera celda en x = 62, que
 *  son los nodos del frame. */
const RESERVE = 62
/** La primera fila arranca en y = 22 · `HEADER` del componente. El mapa de calor
 *  usa 20, y heredarlo es la mutación que esta prueba atrapa. */
const HEADER = 22
/** Entre celdas, en los dos ejes · **5, y el mapa de calor usa 4**. */
const GAP = 5

const matriz = (
  filas: readonly string[],
  columnas: readonly string[],
  celdas: readonly (readonly (number | null)[])[],
) => ({ forma: 'matriz', filas, columnas, celdas }) as Extract<Value, { forma: 'matriz' }>

const rects = (c: HTMLElement) => Array.from(c.querySelectorAll('rect'))
const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const num = (el: Element, a: string) => Number.parseFloat(el.getAttribute(a) ?? 'NaN')
const par = (r: Element) => `${r.getAttribute('fill')}/${r.getAttribute('fill-opacity') ?? '—'}`

/** Las cifras de celda son mono **11**; los rótulos de eje, mono 9. Es lo que
 *  distingue una de otra sin agregarle al componente un atributo que existe sólo
 *  para la prueba. */
const cifras = (c: HTMLElement) =>
  textos(c).filter((t) => t.getAttribute('style')?.includes('font-size: 11px'))
const rotulos = (c: HTMLElement) =>
  textos(c).filter((t) => t.getAttribute('style')?.includes('font-size: 9px'))

/** El frame, montado con el formateador del tenant y la familia que se pida. */
const elFrame = (family: Family = 'cliente', fmt: (v: number) => string = number) =>
  render(<PlotCohort value={matriz(COHORTES, ANTIGUEDAD, FRAME)} family={family} format={fmt} />)
    .container

/* ══ La cuantización, sin montar un SVG ══════════════════════════════════════ */

describe('`levels` · monótono sobre las 20 del frame y sin salirse de la rampa', () => {
  it('la celda mínima da 0, la máxima da 4, y el nivel nunca baja', () => {
    const nv = levels(FRAME, 5)
    const presentes = FRAME.flat().filter((v): v is number => v !== null)
    const nivelDe = new Map<number, number>()
    FRAME.forEach((fila, r) =>
      fila.forEach((v, c) => {
        if (v !== null) nivelDe.set(v, nv[r]?.[c] as number)
      }),
    )

    // Los extremos del dibujo: la celda más fría es MAY/30D con 19 y la más
    // caliente MAR/180D con 52.
    expect(nivelDe.get(Math.min(...presentes))).toBe(0)
    // Y 4, no 5: sin el `Math.min(n - 1, …)` el máximo da índice 5, `RAMPA[5]` es
    // `undefined` y la celda se pinta **sin color y sin error**.
    expect(nivelDe.get(Math.max(...presentes))).toBe(4)

    // Recorriendo los valores ordenados, el nivel no baja nunca. Invertir
    // `RAMPA[2]` y `RAMPA[3]` rompe la monotonía del par 39/40, que es la
    // mutación que esta aserción mata.
    const ordenados = [...presentes].sort((a, b) => a - b)
    for (let i = 1; i < ordenados.length; i++) {
      expect(nivelDe.get(ordenados[i] as number) as number).toBeGreaterThanOrEqual(
        nivelDe.get(ordenados[i - 1] as number) as number,
      )
    }
  })

  it('con un solo valor distinto nadie es el más caliente: todas al nivel medio', () => {
    // Sin esta rama, `(v - min) / (max - min)` es `NaN` y la celda queda sin
    // opacidad. Y mandarlas a un extremo afirma un piso o un techo que no hay.
    expect(levels([[7, 7], [7, null]], 5).flat()).toEqual([2, 2, 2, null])
  })
})

/* ══ La rampa del frame, que son CINCO niveles y no ocho ═════════════════════ */

describe('la rampa es la del frame y no la heredada del mapa de calor', () => {
  it('los cinco niveles son los cinco pares medidos, en ese orden', () => {
    // Cinco valores equiespaciados caen uno por nivel, así que el gradiente
    // recorre la rampa entera. `cliente` tiene cinco escalones: con `externo`,
    // que tiene dos, `familyVar` hace `step % largo` y la rampa colapsa.
    const { container } = render(
      <PlotCohort
        value={matriz(['MAR'], ['30D', '60D', '90D', '120D', '150D'], [[10, 20, 30, 40, 50]])}
        family="cliente"
        format={number}
      />,
    )

    // Agregar un sexto par o subir el último a 0.8 pone esto en rojo: es la
    // aserción que impide heredar los ocho niveles del hermano sin mirar el
    // dibujo. Nunca escalón 3 ni 4, y ninguna opacidad fuera de {0.5, 0.6, 0.7}.
    expect(rects(container).map(par)).toEqual([
      'var(--color-fam-cliente-0)/0.5',
      'var(--color-fam-cliente-0)/0.6',
      // Los dos 0.6 y los dos 0.7 se distinguen POR ESCALÓN: sin eso la escalera
      // se aplana justo en el medio.
      'var(--color-fam-cliente-1)/0.6',
      'var(--color-fam-cliente-1)/0.7',
      'var(--color-fam-cliente-2)/0.7',
    ])
  })
})

/* ══ La cifra · la diferencia más grande con el mapa de calor ════════════════ */

describe('toda celda presente lleva su cifra, y ninguna ausente', () => {
  it('las 20 del frame están rotuladas y las 10 vacías no', () => {
    const container = elFrame()

    // Copiar el `CIFRA_DESDE = RAMPA.length - 2` del mapa de calor deja 6 cifras
    // en vez de 20 → rojo. Es la que se vería perfecta estando mal.
    expect(cifras(container)).toHaveLength(20)
    expect(rects(container)).toHaveLength(30)

    // Y ninguna cae sobre una vacía: cada cifra está centrada en SU celda, así
    // que las coordenadas de las 20 son las de los 20 `rect` con relleno.
    const conRelleno = rects(container).filter((r) => r.getAttribute('fill') !== 'none')
    const centros = new Set(
      conRelleno.map((r) => `${num(r, 'x') + num(r, 'width') / 2}:${num(r, 'y') + num(r, 'height') / 2}`),
    )
    expect(conRelleno).toHaveLength(20)
    for (const t of cifras(container)) {
      expect(centros.has(`${num(t, 'x')}:${num(t, 'y')}`)).toBe(true)
    }
  })

  it('la tinta se invierte a `$ink` SOLO en el nivel más caliente · DIVERGENCIA DE CONTRASTE REGISTRADA', () => {
    // **Medido componiendo sobre `panel` como hace `contraste.py`**, contra 4,5 ·
    // OSCURO: nivel 0 `$bg` 4,41 · 1 → 5,74 ✓ · 2 → 3,44 · 3 → 4,20 · 4 `$ink`
    // 7,46 ✓ · CLARO: 1,42 · 1,58 · 2,30 · 2,69 y nivel 4 `$ink` 4,12. En claro la
    // tinta correcta sería la opuesta en los cuatro pálidos y no hay token
    // «siempre oscuro». Se implementa como el frame lo dibuja y el par queda
    // clavado acá para que el día que diseño lo resuelva la prueba avise, igual
    // que los 4,17 de `DegradedBadge`.
    const container = elFrame()
    const tinta = (t: Element) =>
      (t.getAttribute('style') ?? '').includes('fill: var(--color-ink)') ? 'ink' : 'bg'

    const porValor = new Map(cifras(container).map((t) => [t.textContent ?? '', tinta(t)]))
    // Bajar el umbral a `>= RAMPA.length - 2` tiñe 40, 41 y 44 → rojo. Clavar
    // `$bg` en las 20 → rojo en estas seis.
    for (const v of INK_DEL_FRAME) expect(porValor.get(String(v))).toBe('ink')
    expect(cifras(container).filter((t) => tinta(t) === 'ink')).toHaveLength(6)
    expect(cifras(container).filter((t) => tinta(t) === 'bg')).toHaveLength(14)
  })

  it('desaparece cuando no entra, y la celda conserva su color', () => {
    // Doce columnas en 600px dan celdas de ~39, y una cifra de ocho caracteres
    // mide 8 × 11 × 0.72 ≈ 63: no entra.
    const doce = Array.from({ length: 12 }, (_, c) => `${(c + 1) * 30}D`)
    const anchas = render(
      <PlotCohort
        value={matriz(COHORTES, doce, COHORTES.map((_, r) => doce.map((__, c) => 100000 + 1000 * c + r)))}
        family="cliente"
        format={conUnidad('%')}
      />,
    ).container

    expect(cifras(anchas)).toHaveLength(0)
    // Quitar la guardia de ancho las desborda; devolver `null` por toda la celda
    // en vez de sólo por la cifra tira el conteo de `rect` → rojo por los dos
    // lados.
    expect(rects(anchas)).toHaveLength(COHORTES.length * doce.length)
    expect(rects(anchas).map(par)).toContain('var(--color-fam-cliente-2)/0.7')

    // Y con la misma cifra en seis columnas sí entra: sin este control la
    // aserción de arriba pasaría con un plot que nunca rotula.
    const seis = render(
      <PlotCohort
        value={matriz(COHORTES, ANTIGUEDAD, COHORTES.map((_, r) => ANTIGUEDAD.map((__, c) => 100000 + 1000 * c + r)))}
        family="cliente"
        format={conUnidad('%')}
      />,
    ).container
    expect(cifras(seis)).toHaveLength(COHORTES.length * ANTIGUEDAD.length)
  })

  it('el plot NO inventa la unidad · el `%` es de la métrica', () => {
    // El frame rotula `22%` y ese `%` llega adentro del closure que arma el
    // cuerpo con la `unit` de la MÉTRICA. Concatenarlo acá mentiría en toda
    // métrica que no sea un porcentaje — y si el catálogo no declara unidad, la
    // cifra sale desnuda de símbolo, que es un hueco del catálogo y no del plot.
    const con = elFrame('cliente', conUnidad('%'))
    expect(cifras(con).map((t) => t.textContent)).toContain('22%')

    const sin = elFrame('cliente', conUnidad(undefined))
    expect(cifras(sin).map((t) => t.textContent)).toContain('22')
    expect(sin.textContent).not.toContain('%')
  })
})

/* ══ La celda sin dato ═══════════════════════════════════════════════════════ */

describe('`null` no es cero · lo que el contrato encabeza', () => {
  it('las 10 vacías son contorno `$c-grid` de 1px sin relleno, y no consumen nivel', () => {
    const container = elFrame()
    const vacias = rects(container).filter((r) => r.getAttribute('fill') === 'none')

    expect(vacias).toHaveLength(10)
    for (const r of vacias) {
      expect(r.getAttribute('stroke')).toBe('var(--color-c-grid)')
      expect(r.getAttribute('stroke-width')).toBe('1')
      expect(r.getAttribute('fill-opacity')).toBeNull()
    }

    // Y los niveles de las presentes NO cambian al sacar los `null`: con
    // `celdas[r]?.[c] ?? 0` las 10 se pintan como el nivel más frío, el conteo de
    // contornos cae a 0 y además corre todos los demás niveles → rojo por dos
    // lados.
    const sinNulos = FRAME.map((fila) => fila.filter((v): v is number => v !== null))
    const comoEstan = levels(FRAME, 5).flat().filter((n) => n !== null)
    expect(comoEstan).toEqual(levels(sinNulos, 5).flat())
    expect(levels(FRAME.map((f) => f.map((v) => v ?? 0)), 5).flat()).not.toEqual(
      levels(FRAME, 5).flat(),
    )
  })

  it('la escalera es DATO: ninguna celda se suprime por su posición', () => {
    // **Los `null` van FUERA del triángulo**: vacía la de arriba-izquierda y con
    // valor la de abajo-derecha. Cualquier atajo tipo
    // `if (c >= columnas.length - r) return null` o un `slice` → rojo. Sin esta
    // aserción el fixture del dibujo, que ES triangular, no puede atrapar a un
    // plot que lo da por hecho.
    const { container } = render(
      <PlotCohort
        value={matriz(['MAR', 'ABR', 'MAY'], ['30D', '60D', '90D'], [
          [null, 22, 34],
          [24, null, 44],
          [19, 29, 52],
        ])}
        family="cliente"
        format={number}
      />,
    )

    const celdas = rects(container)
    expect(celdas).toHaveLength(9)
    // Arriba-izquierda: contorno, y sin cifra.
    expect(celdas[0]?.getAttribute('fill')).toBe('none')
    // Abajo-derecha: la más caliente, rellena y rotulada.
    expect(par(celdas[8] as Element)).toBe('var(--color-fam-cliente-2)/0.7')
    expect(cifras(container).map((t) => t.textContent)).toContain('52')
    expect(cifras(container)).toHaveLength(7)
  })
})

/* ══ El color sale de la familia que llegó por prop ══════════════════════════ */

describe('ni `acc`, ni ámbar, ni amarillo, ni un hex literal', () => {
  it('todo `fill` y `stroke` sale del juego cerrado, con la familia de la prop', () => {
    // `inventario` y no `cliente`: el frame está pintado en `cliente`, así que
    // cablear el literal del dibujo es la mutación que el dibujo invita — y con
    // `cliente` pasaría.
    const container = elFrame('inventario')
    const permitidos = new Set([
      'none',
      'var(--color-c-grid)',
      'var(--color-dim)',
      'var(--color-bg)',
      'var(--color-ink)',
      'var(--color-fam-inventario-0)',
      'var(--color-fam-inventario-1)',
      'var(--color-fam-inventario-2)',
    ])

    for (const el of Array.from(container.querySelectorAll('rect, text'))) {
      for (const attr of ['fill', 'stroke']) {
        const v = el.getAttribute(attr)
        if (v !== null) expect(permitidos.has(v)).toBe(true)
      }
      // La tinta de texto va por `style`, así que se mira ahí también.
      const fill = /fill:\s*([^;]+)/.exec(el.getAttribute('style') ?? '')?.[1]?.trim()
      if (fill !== undefined) expect(permitidos.has(fill)).toBe(true)
    }

    expect(container.innerHTML).not.toContain('--color-acc')
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

/* ══ La tipografía de los dos ejes y de la cifra ═════════════════════════════ */

describe('los ejes son mono 9 / 0.12em / `dim`; la cifra mono 11 SIN tracking', () => {
  it('los once rótulos salen en mayúsculas y con el contrato de §2.3', () => {
    // En minúscula a propósito: el frame los escribe en mayúsculas y el dato
    // llega como el contrato lo manda.
    const { container } = render(
      <PlotCohort
        value={matriz(['mar', 'abr'], ['30d', '60d'], [
          [22, 34],
          [24, 36],
        ])}
        family="cliente"
        format={number}
      />,
    )

    const ejes = rotulos(container)
    expect(ejes).toHaveLength(4)
    expect(ejes.map((t) => t.textContent)).toEqual(['30D', '60D', 'MAR', 'ABR'])
    for (const t of ejes) {
      const style = t.getAttribute('style') ?? ''
      // Mono 9 es el tamaño de nota de §2.3 y el que el frame escribe: dejar el
      // `size` por defecto de `AxisText` los pintaría en 10 → rojo.
      expect(style).toContain('font-size: 9px')
      expect(style).toContain('letter-spacing: 0.12em')
      expect(style).toContain('fill: var(--color-dim)')
    }
  })

  it('la cifra va en mono 11 y sin `letter-spacing`', () => {
    const container = elFrame()

    expect(cifras(container)).toHaveLength(20)
    for (const t of cifras(container)) {
      const style = t.getAttribute('style') ?? ''
      // Copiar el `CIFRA` del mapa de calor —mono 10 con 0.12em— rompe las dos:
      // ninguno de los 20 nodos del frame trae `letterSpacing`.
      expect(style).toContain('font-size: 11px')
      expect(style).not.toContain('letter-spacing')
    }
  })
})

/* ══ Los dos ejes, donde el frame los pone ══════════════════════════════════ */

describe('la antigüedad va ARRIBA y la cohorte a la izquierda', () => {
  it('a 600 × 300 salen los nodos del frame: canaleta 62, primera celda 62 · 22', () => {
    const container = elFrame()
    const celdas = rects(container)

    // `LABEL_GAP = 8` correría la rejilla a 58 → rojo. Y `HEADER = 20`, el del
    // mapa de calor, pone la primera fila en 20 → rojo.
    expect(num(celdas[0] as Element, 'x')).toBeCloseTo(RESERVE, 6)
    expect(num(celdas[0] as Element, 'y')).toBeCloseTo(HEADER, 6)

    const arriba = rotulos(container).filter((t) => ANTIGUEDAD.includes(t.textContent ?? ''))
    const izquierda = rotulos(container).filter((t) => COHORTES.includes(t.textContent ?? ''))
    expect(arriba).toHaveLength(ANTIGUEDAD.length)
    expect(izquierda).toHaveLength(COHORTES.length)

    arriba.forEach((t, i) => {
      const r = celdas[i] as Element
      // El centro EXACTO de la celda, leído del `rect` y no copiado.
      expect(num(t, 'x')).toBeCloseTo(num(r, 'x') + num(r, 'width') / 2, 6)
      // Y POR ENCIMA de la primera fila. Rotularlas abajo —`y = h - MARGIN.b`—
      // deja el `y` por debajo → rojo: es la que atrapa haber usado
      // `side: 'bottom'` porque `'top'` no existe en la primitiva.
      expect(num(t, 'y')).toBeLessThan(num(r, 'y'))
    })

    izquierda.forEach((t, i) => {
      const r = celdas[i * ANTIGUEDAD.length] as Element
      expect(t.getAttribute('text-anchor')).toBe('end')
      // El rótulo termina en x = 50 y la celda arranca en 62 · `LABEL_GAP` 12.
      expect(num(t, 'x')).toBeCloseTo(RESERVE - 12, 6)
      expect(num(t, 'y')).toBeCloseTo(num(r, 'y') + num(r, 'height') / 2, 6)
    })
  })
})

/* ══ La rejilla ══════════════════════════════════════════════════════════════ */

describe('`GAP` 5 en los dos ejes y `rx` 2 en las 30', () => {
  it('la separación entre vecinos es 5 y no el 4 del mapa de calor', () => {
    const container = elFrame()
    const celdas = rects(container)
    expect(celdas).toHaveLength(30)

    for (const r of celdas) expect(num(r, 'rx')).toBe(2)

    // Horizontal: dos vecinos de la primera fila.
    const [c0, c1] = [celdas[0] as Element, celdas[1] as Element]
    expect(num(c1, 'x') - (num(c0, 'x') + num(c0, 'width'))).toBeCloseTo(GAP, 1)

    // Vertical: la misma columna en dos filas seguidas. `GAP = 4` → rojo.
    const f1 = celdas[ANTIGUEDAD.length] as Element
    expect(num(f1, 'y') - (num(c0, 'y') + num(c0, 'height'))).toBeCloseTo(GAP, 1)
  })
})

/* ══ Ningún número desnudo, tampoco para un lector de pantalla ═══════════════ */

describe('cada celda dice qué es', () => {
  it('`<title>` nombra cohorte, antigüedad y la cifra FORMATEADA · `sin dato` en la vacía', () => {
    const { container } = render(
      <PlotCohort
        value={matriz(['MAR', 'ABR'], ['30D', '60D'], [
          [22000, 34000],
          [24000, null],
        ])}
        family="cliente"
        format={number}
      />,
    )

    expect(rects(container).map((r) => r.querySelector('title')?.textContent)).toEqual([
      'MAR · 30D · 22K',
      'MAR · 60D · 34K',
      'ABR · 30D · 24K',
      'ABR · 60D · sin dato',
    ])
    // `<title>{v}</title>` suelta el crudo con el locale de `toString`, que no es
    // el del tenant: sólo muere afirmando la ausencia.
    expect(container.textContent).not.toContain('22000')
  })

  it('el `aria-label` nombra la COHORTE y no es el del mapa de calor', () => {
    const container = elFrame()
    const svg = container.querySelector('svg')

    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toMatch(/cohorte/i)
    // **Es lo que hace testeable el despacho del cuerpo**, que es donde vive el
    // spread condicional con una prop mal nombrada que compila: sin un nombre
    // distinto, servir `cohort` como mapa de calor pasa callado.
    expect(svg?.getAttribute('aria-label')).not.toMatch(/mapa de calor/i)
    expect(svg?.getAttribute('aria-label')).toContain(
      `${COHORTES.length} × ${ANTIGUEDAD.length}`,
    )
  })
})

/* ══ LO QUE LA MUTACIÓN ENCONTRÓ SIN CUBRIR · QA 2026-10-01 ══════════════════
 *
 * Las cuatro de abajo nacieron de cuatro mutaciones que SOBREVIVIERON a las 16
 * aserciones de arriba. Las cuatro rompen algo que la cabecera del componente
 * declara sostener con un número medido, y ninguna se veía distinta en pantalla.
 */

describe('los números medidos del frame, y no los heredados del mapa de calor', () => {
  it('el rótulo de antigüedad cae 11,6 por encima del borde de la primera fila · y = 10,4', () => {
    // `AXIS_DY = 11` —el del mapa de calor, que la cabecera declara distinto a
    // propósito— sigue quedando «por encima» de la primera fila, así que la
    // aserción de orden de más arriba lo deja pasar: la mutación sobrevivió. El
    // número está MEDIDO sobre el frame —el centro de los rótulos cae en y = 10,4
    // y la primera fila arranca en 22— y se lee contra el `rect`, no copiado.
    const container = elFrame()
    const primera = rects(container)[0] as Element
    const arriba = rotulos(container).filter((t) => ANTIGUEDAD.includes(t.textContent ?? ''))

    expect(arriba).toHaveLength(ANTIGUEDAD.length)
    for (const t of arriba) expect(num(primera, 'y') - num(t, 'y')).toBeCloseTo(11.6, 6)
  })

  it('la cifra desaparece cuando la celda no llega al mínimo de ALTO, no sólo de ancho', () => {
    // La prueba de «no entra» de más arriba agota el presupuesto de ANCHO, así que
    // `CIFRA_MIN_H = 0` sobrevivía entera: el alto no lo miraba ninguna, y una
    // cifra mono 11 en una celda de 13px desborda su propia celda.
    // A 600 × 300: `gridH = 300 − HEADER 22 − MARGIN.b 20 = 258`; con 14 filas el
    // paso es 18,43 y el `bandwidth` 13,43 < 15. Con 10 filas da 20,8 y entra.
    const dos = ['30D', '60D']
    const conFilas = (n: number) =>
      render(
        <PlotCohort
          value={matriz(
            Array.from({ length: n }, (_, r) => `C${r}`),
            dos,
            Array.from({ length: n }, (_, r) => dos.map((__, c) => 20 + r + c)),
          )}
          family="cliente"
          format={number}
        />,
      ).container

    const apretadas = conFilas(14)
    // Las celdas siguen estando y con su color: lo único que se cae es la cifra.
    expect(rects(apretadas)).toHaveLength(14 * dos.length)
    expect(cifras(apretadas)).toHaveLength(0)

    // El control tiene el MISMO ancho de celda —dos columnas en 600px—, así que lo
    // único que cambia entre los dos es el alto. Sin él, un plot que nunca rotula
    // pasaría la aserción de arriba.
    expect(cifras(conFilas(10))).toHaveLength(10 * dos.length)
  })

  it('cada eje se recorta contra SU presupuesto, nunca contra el del otro', () => {
    // El `cap` cruzado es el defecto que una mutación encontró en el mapa de calor
    // el 2026-09-30, y acá volvió a sobrevivir: con rótulos de tres letras no se
    // recorta nada, así que da lo mismo qué presupuesto se use. Se necesita un
    // rótulo que NO entre.
    const largo = (c: string) => c.repeat(40)

    // La cohorte se recorta contra la CANALETA: el techo de `LABEL_MAX_SHARE` la
    // deja en 600/3 = 200, menos `LABEL_GAP` 12 son 188px → 29 caracteres de mono
    // 9. Recortada contra el ancho de columna —60,3px— daría 9.
    const filaLarga = render(
      <PlotCohort
        value={matriz([largo('X')], ANTIGUEDAD, [ANTIGUEDAD.map((_, c) => 20 + c)])}
        family="cliente"
        format={number}
      />,
    ).container
    const cohorte = rotulos(filaLarga).find((t) => t.textContent?.startsWith('X'))
    expect(cohorte?.textContent).toBe(`${'X'.repeat(28)}…`)

    // Y la antigüedad contra SU CELDA: canaleta 62, seis columnas en los 530px que
    // quedan dan un `bandwidth` de 83,3 → 12 caracteres. Recortada contra la
    // canaleta —50px— daría 7.
    const columnaLarga = render(
      <PlotCohort
        value={matriz(['MAR'], [largo('Y'), ...ANTIGUEDAD.slice(1)], [ANTIGUEDAD.map((_, c) => 20 + c)])}
        family="cliente"
        format={number}
      />,
    ).container
    const antiguedad = rotulos(columnaLarga).find((t) => t.textContent?.startsWith('Y'))
    expect(antiguedad?.textContent).toBe(`${'Y'.repeat(11)}…`)
  })

  it('un hueco de PAYLOAD no se pinta como celda sin dato', () => {
    // `celdas[r]?.[c] ?? null` dibuja un tablero prolijo donde el contorno afirma
    // «el futuro no observado» cuando lo que llegó es una matriz RALA. La cabecera
    // lo declara y sobrevivía a las 16: ningún fixture tenía una fila más corta
    // que `columnas`.
    const { container } = render(
      <PlotCohort
        value={matriz(['MAR', 'ABR'], ['30D', '60D', '90D'], [
          [22, 34, 41],
          [24],
        ])}
        family="cliente"
        format={number}
      />,
    )

    // Cuatro celdas, no seis: las dos que el payload no manda no existen, y
    // ninguna sale como contorno, que es lo que significaría otra cosa.
    expect(rects(container)).toHaveLength(4)
    expect(rects(container).filter((r) => r.getAttribute('fill') === 'none')).toHaveLength(0)
    expect(cifras(container)).toHaveLength(4)
  })
})
