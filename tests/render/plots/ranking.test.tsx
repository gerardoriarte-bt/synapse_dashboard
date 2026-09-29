// @vitest-environment jsdom

/** El bump · `bump` · §PEN:Plot/RANKING
 *
 *  **Lo que se verifica es el RANKING, no que el SVG exista.** Un bump se dibuja
 *  igual de prolijo poniendo cada serie en la fila de su índice de entrada, y con
 *  datos que ya vienen ordenados de mayor a menor las dos versiones se ven
 *  IDÉNTICAS. Ese es el defecto que este archivo persigue, en sus tres caras: el
 *  puesto que sale del índice, el ranking congelado en la primera columna, y el
 *  empate que apila dos series en la misma fila y pierde una sin avisar.
 *
 *  **Los números esperados salen del DIBUJO y de la geometría de ejes, no del
 *  archivo que se prueba.** Están escritos otra vez acá a propósito: una prueba
 *  que importa las constantes de la implementación no puede fallar nunca, ni
 *  cuando la implementación está mal.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotBump } from '@/render/plots/PlotBump'
import { PlotSeries } from '@/render/plots/PlotSeries'
import { TEST_SIZE } from '../../setup'
import type { Value } from '@/api/types'

/* ── La geometría, calculada acá y no leída del componente ──────────────────── */

/** `MARGIN` de `core/axisGeometry.ts`: arriba 8, abajo 20. */
const MARGIN = { t: 8, b: 20, r: 8 } as const
/** Del frame: `ellipse` de 10 × 10. */
const DOT = 5
/** `MONO_ADVANCE` · 0,72 em por carácter a mono 10. */
const ADV = 7.2
/** `MIN_RESERVE` de `core/axisGeometry.ts`. */
const MIN_RESERVE = 28

const height = TEST_SIZE.height - MARGIN.t - MARGIN.b // 272

/** `axisReserve`: el rótulo más largo más 8, con piso de 28. */
const reserve = (labels: readonly string[]) =>
  Math.max(MIN_RESERVE, Math.max(0, ...labels.map((l) => l.length)) * ADV + 8)

/** La reserva izquierda con N puestos: `#1`…`#N` son dos caracteres hasta el 9,
 *  así que siempre cae en el piso de 28. */
const reserveL = MIN_RESERVE

/** La `cy` del puesto `p` sobre N series. **Sin invertir**: el #1 va arriba, que
 *  es al revés de todo eje de valor del repertorio. */
const cyDe = (p: number, n: number) =>
  n === 1 ? DOT : DOT + ((p - 1) / (n - 1)) * (height - DOT - DOT)

/** El ancho útil y la `cx` de la columna `j` de `m`. */
const anchoUtil = (etiquetas: readonly string[]) =>
  TEST_SIZE.width - reserveL - Math.min(reserve(etiquetas), TEST_SIZE.width * 0.25)
const cxDe = (j: number, m: number, etiquetas: readonly string[]) =>
  (j / Math.max(1, m - 1)) * anchoUtil(etiquetas)

/* ── Fixtures · la forma se escribe desde el contrato ───────────────────────── */

type Serie = { etiqueta: string; puntos: { t: string; v: number }[] }

const multi = (series: readonly Serie[]) =>
  ({ forma: 'seriesMultiples', series }) as unknown as Extract<
    Value,
    { forma: 'seriesMultiples' }
  >

/** El formateador ESPÍA. Se inyecta siempre —nunca el real— y acá además sirve de
 *  centinela: **un bump no pinta ni una cifra**, así que si alguna vez aparece un
 *  `«…»` en el DOM es que el plot empezó a pintar valores. */
const spy = (v: number) => `«${v}»`

const base = { family: 'medios', format: spy } as const

/* ── Lectores del DOM ──────────────────────────────────────────────────────── */

/** Un `<g>` por serie, en el orden de `value.series`. Se reconocen por tener
 *  marcas: la rejilla sólo tiene `<line>` y el eje de períodos sólo `<text>`. */
const grupos = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('svg > g > g')).filter(
    (g) => g.querySelector('circle, path') !== null,
  )

const puntosDe = (g: Element) =>
  Array.from(g.querySelectorAll('circle')).map((n) => ({
    cx: Number(n.getAttribute('cx')),
    cy: Number(n.getAttribute('cy')),
    r: n.getAttribute('r'),
    fill: n.getAttribute('fill') ?? '',
    opacity: n.getAttribute('fill-opacity'),
  }))

const trazoDe = (g: Element) => {
  const p = g.querySelector('path')
  return p === null
    ? null
    : {
        d: p.getAttribute('d') ?? '',
        stroke: p.getAttribute('stroke') ?? '',
        width: p.getAttribute('stroke-width') ?? '',
        cap: p.getAttribute('stroke-linecap') ?? '',
      }
}

/** El rótulo de serie: el único `<text>` anclado a `start`. Los de eje van a
 *  `end` (los puestos) y a `middle` (los períodos). */
const rotuloDe = (g: Element) => {
  const t = g.querySelector('text[text-anchor="start"]')
  return t === null ? null : { texto: t.textContent ?? '', fill: t.getAttribute('fill') ?? '' }
}

const rieles = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('line')).filter(
    (n) => n.getAttribute('stroke') === 'var(--color-c-grid)',
  )

/* ══ El puesto ═══════════════════════════════════════════════════════════════ */

describe('el puesto sale del ORDEN, no del índice de entrada', () => {
  it('la serie que más vale queda arriba aunque haya entrado segunda', () => {
    // **La mutación que esto mata**: dibujar cada serie en la fila de su índice
    // de entrada. Con datos ya ordenados de mayor a menor las dos versiones se
    // ven idénticas, así que el fixture entra al revés a propósito.
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'a', puntos: [{ t: 'P1', v: 1 }] },
          { etiqueta: 'b', puntos: [{ t: 'P1', v: 2 }] },
        ])}
      />,
    )

    const [a, b] = grupos(container)
    expect(puntosDe(b as Element)[0]?.cy).toBe(cyDe(1, 2))
    expect(puntosDe(a as Element)[0]?.cy).toBe(cyDe(2, 2))
    expect(puntosDe(b as Element)[0]?.cy).toBeLessThan(Number(puntosDe(a as Element)[0]?.cy))
  })

  it('el ranking se RECALCULA en cada período', () => {
    // **La mutación que esto mata y la anterior no**: calcular el orden una sola
    // vez sobre el primer `t` y reusarlo. Un ranking congelado acierta la primera
    // columna, que es justo la que la prueba de arriba mira.
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'a', puntos: [{ t: 'P1', v: 10 }, { t: 'P2', v: 1 }] },
          { etiqueta: 'b', puntos: [{ t: 'P1', v: 5 }, { t: 'P2', v: 9 }] },
        ])}
      />,
    )

    const [a, b] = grupos(container)
    expect(puntosDe(a as Element).map((p) => p.cy)).toEqual([cyDe(1, 2), cyDe(2, 2)])
    expect(puntosDe(b as Element).map((p) => p.cy)).toEqual([cyDe(2, 2), cyDe(1, 2)])
  })

  it('un EMPATE no apila dos series en la misma fila', () => {
    // **La mutación que esto mata**: el puesto como «1 + cuántas valen MÁS», que
    // es la fórmula natural del ranking competitivo. Las dos empatadas comparten
    // fila, una tapa a la otra y el dibujo pierde una serie sin avisar.
    //
    // La que entró primera queda arriba, que es lo que `sort` estable garantiza.
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'a', puntos: [{ t: 'P1', v: 5 }] },
          { etiqueta: 'b', puntos: [{ t: 'P1', v: 5 }] },
        ])}
      />,
    )

    const [a, b] = grupos(container)
    const ca = puntosDe(a as Element)[0]?.cy
    const cb = puntosDe(b as Element)[0]?.cy
    expect(ca).not.toEqual(cb)
    expect(ca).toBe(cyDe(1, 2))
    expect(cb).toBe(cyDe(2, 2))
  })

  it('una serie sin punto en ese `t` NO inventa fila', () => {
    // **La mutación que esto mata**: `?? 0` sobre el valor faltante, que es el
    // idioma que `PlotStackArea` usa a propósito —no aportar a un total es cero—
    // y que acá es mentira: un ausente rankeado último es una afirmación sobre un
    // dato que no existe.
    const etiquetas = ['a', 'b']
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'a', puntos: [{ t: 'P1', v: 10 }, { t: 'P2', v: 20 }] },
          { etiqueta: 'b', puntos: [{ t: 'P1', v: 5 }] },
        ])}
      />,
    )

    const ultimaColumna = cxDe(1, 2, etiquetas)
    const enLaUltima = Array.from(container.querySelectorAll('circle')).filter(
      (n) => Number(n.getAttribute('cx')) === ultimaColumna,
    )
    expect(enLaUltima).toHaveLength(1)

    // Y la línea de `b` no llega hasta ahí: con un solo punto no tiene tramo.
    const [, b] = grupos(container)
    expect(trazoDe(b as Element)?.d).not.toContain('L')
  })
})

/* ══ Lo que nombra cada fila ══════════════════════════════════════════════════ */

describe('cada serie lleva su rótulo, y el rótulo lleva el color de SU serie', () => {
  it('el `fill` del rótulo es el mismo `stroke` que su línea', () => {
    // **La mutación que esto mata**: pintar los rótulos con `var(--color-dim)`,
    // que es lo que `AxisText` haría sin la primitiva que falta.
    //
    // Es la forma que «ningún número desnudo» toma acá: la fila no es una cifra y
    // lo único que la nombra es este rótulo — sin él, cuatro líneas de colores no
    // dicen de quién son.
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'meta', puntos: [{ t: 'P1', v: 9 }, { t: 'P2', v: 9 }] },
          { etiqueta: 'google', puntos: [{ t: 'P1', v: 4 }, { t: 'P2', v: 4 }] },
        ])}
      />,
    )

    const gs = grupos(container)
    expect(gs).toHaveLength(2)
    for (const g of gs) {
      const r = rotuloDe(g)
      expect(r).not.toBeNull()
      expect(r?.fill).toBe(trazoDe(g)?.stroke)
      expect(r?.fill).not.toBe('var(--color-dim)')
    }

    // Y en MAYÚSCULAS, que es el contrato de §2.3 para el rol «rótulo».
    expect(screen.getByText('META')).toBeInTheDocument()
    expect(screen.getByText('GOOGLE')).toBeInTheDocument()
  })

  it('hay un riel y un rótulo por SERIE · el `count` del `Grid` no se olvida', () => {
    // **La mutación que esto mata**: dejarle a `<Grid>` su `count` por defecto de
    // 4. Con tres series salen cuatro rieles y con seis, también cuatro. Es el
    // default que se olvida sin que el compilador diga nada.
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'a', puntos: [{ t: 'P1', v: 3 }] },
          { etiqueta: 'b', puntos: [{ t: 'P1', v: 2 }] },
          { etiqueta: 'c', puntos: [{ t: 'P1', v: 1 }] },
        ])}
      />,
    )

    expect(rieles(container)).toHaveLength(3)
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(screen.queryByText('#4')).toBeNull()
  })

  it('el eje de períodos pinta `t` TAL CUAL LLEGA', () => {
    // **Se ve como una prueba que defiende un defecto y es al revés.** El `.pen`
    // dibuja FEB MAR ABR; el contrato midió el 2026-09-29 que `Punto.t` es días
    // desde epoch en una cadena, y que interpretarlo es lo que bloquea la trama
    // del degradado (B1.34). La prueba deja escrito que el front no lo resuelve
    // solo, y se cae sola el día que el backend mande una etiqueta.
    render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'a', puntos: [{ t: '20362', v: 3 }, { t: '20393', v: 4 }] },
        ])}
      />,
    )

    expect(screen.getByText('20362')).toBeInTheDocument()
    expect(screen.getByText('20393')).toBeInTheDocument()
  })
})

/* ══ El color y la marca ═════════════════════════════════════════════════════ */

describe('el color llega por prop y el plot NO elige', () => {
  it('con otra familia no queda ni un rastro de la del dibujo', () => {
    // Tres mutaciones a la vez: escribir `medios` fijo —la familia del frame—,
    // pintar al líder con `var(--color-acc)` y poner un hex.
    const { container } = render(
      <PlotBump
        {...base}
        family="inventario"
        value={multi([
          { etiqueta: 'uno', puntos: [{ t: 'P1', v: 9 }, { t: 'P2', v: 2 }] },
          { etiqueta: 'dos', puntos: [{ t: 'P1', v: 4 }, { t: 'P2', v: 8 }] },
        ])}
      />,
    )

    const html = container.innerHTML
    expect(html).not.toContain('medios')
    expect(html).not.toContain('--color-acc')
    // `#1` y `#2` son rótulos de puesto, no colores: el hex pide 3 dígitos.
    expect(html).not.toMatch(/#[0-9a-fA-F]{3}/)

    for (const g of grupos(container)) {
      expect(trazoDe(g)?.stroke).toMatch(/^var\(--color-fam-inventario-\d\)$/)
      for (const p of puntosDe(g)) expect(p.fill).toMatch(/^var\(--color-fam-inventario-\d\)$/)
    }
  })

  it('el punto tiene el radio del dibujo y OPACIDAD PLENA', () => {
    // **La mutación que esto mata**: cerrar el hueco de `Dots` con un rodeo, o
    // pasarle el radio al `Dots` de hoy —`fillOpacity={p.r === undefined ? 1 :
    // 0.55}`—, que devuelve puntos al 55 %: un color que ningún token eligió.
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([{ etiqueta: 'a', puntos: [{ t: 'P1', v: 3 }, { t: 'P2', v: 4 }] }])}
      />,
    )

    const puntos = Array.from(container.querySelectorAll('circle'))
    expect(puntos).toHaveLength(2)
    for (const p of puntos) {
      expect(p.getAttribute('r')).toBe(String(DOT))
      const op = p.getAttribute('fill-opacity')
      expect(op === null || Number(op) === 1).toBe(true)
    }
  })
})

describe('el grosor del trazo · 2.5 acá y 1.5 en el resto del repertorio', () => {
  const DOS = multi([
    { etiqueta: 'a', puntos: [{ t: 'P1', v: 9 }, { t: 'P2', v: 2 }] },
    { etiqueta: 'b', puntos: [{ t: 'P1', v: 4 }, { t: 'P2', v: 8 }] },
  ])

  it('los tramos del bump van en 2.5 · del frame', () => {
    const { container } = render(<PlotBump {...base} value={DOS} />)
    const anchos = grupos(container).map((g) => trazoDe(g)?.width)
    expect(anchos).toEqual(['2.5', '2.5'])

    // Y el remate REDONDO, que el frame declara junto con el grosor: a 2.5px un
    // remate a escuadra deja una esquina que, en el vértice de un cambio de
    // puesto, se lee como un pico que el dato no tiene.
    expect(grupos(container).map((g) => trazoDe(g)?.cap)).toEqual(['round', 'round'])
  })

  it('y `PlotSeries` sobre el mismo valor sigue en 1.5', () => {
    // **Hacen falta las DOS mitades.** Sin ésta, «agregué un grosor propio a este
    // plot» y «cambié el grosor de todo el repertorio» se leen igual.
    const { container } = render(
      <PlotSeries series={DOS.series} family="medios" format={spy} area={false} />,
    )
    const anchos = Array.from(container.querySelectorAll('path')).map((p) =>
      p.getAttribute('stroke-width'),
    )
    expect(anchos).toEqual(['1.5', '1.5'])
  })
})

describe('un bump no pinta ni una cifra', () => {
  it('el formateador llega y NO se usa', () => {
    // `format` es obligatorio en `PlotProps` a propósito: es lo que hace que
    // «ningún plot importa el formateador» lo verifique el compilador. El día que
    // el bump muestre el valor —un tooltip, el delta contra el período anterior—
    // tiene que estar ahí y no importado.
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'a', puntos: [{ t: 'P1', v: 4200 }] },
          { etiqueta: 'b', puntos: [{ t: 'P1', v: 17 }] },
        ])}
      />,
    )

    expect(container.textContent).not.toContain('«')
    expect(container.textContent).not.toContain('4200')
    expect(container.textContent).not.toContain('17')
  })
})

/* ══ AÑADIDO POR QA · 2026-09-29 ══════════════════════════════════════════════
 *
 *  Nueve mutaciones fieles sobrevivieron a las doce pruebas de arriba, y las que
 *  valen son garantías que el componente DECLARA en su cabecera y que ninguna
 *  aserción miraba: el color por orden de entrada, el eje como unión, la
 *  tipografía del rótulo de serie —que ningún chequeo puede ver, porque L15 mira
 *  utilidades de Tailwind y esto es un `<text>` de SVG—, y dónde cae cada rótulo.
 *  Cada `it` dice cuál mata.
 */

/** El rótulo de serie con su geometría · el único `<text>` anclado a `start`. */
const rotuloCompleto = (g: Element) => {
  const t = g.querySelector('text[text-anchor="start"]')
  return t === null
    ? null
    : {
        texto: t.textContent ?? '',
        x: Number(t.getAttribute('x')),
        y: Number(t.getAttribute('y')),
        estilo: t.getAttribute('style') ?? '',
      }
}

/** El aire entre el riel y sus rótulos. El dibujo deja 16 a la izquierda y ~14 a
 *  la derecha y la divergencia declarada los colapsa en uno solo. */
const GAP = 8
/** El tope proporcional de la columna de rótulos de serie. */
const LABEL_MAX = 0.25

/** Un valor que CRUZA: la que entra primera termina última. Es el único fixture
 *  donde «color por orden de entrada» y «color por puesto final» se distinguen. */
const CRUZA = multi([
  { etiqueta: 'a', puntos: [{ t: 'P1', v: 9 }, { t: 'P2', v: 1 }] },
  { etiqueta: 'b', puntos: [{ t: 'P1', v: 4 }, { t: 'P2', v: 8 }] },
])

describe('el color: uno por serie, y el puesto NO se lo cambia', () => {
  /** `FAMILY_STEPS.medios` = 5, contado del `.pen`: a la serie `i` le toca el
   *  escalón `i % 5`. Escrito acá y no importado del componente. */
  const escalon = (i: number) => `var(--color-fam-medios-${i % 5})`

  it('tres series, tres colores DISTINTOS', () => {
    // **La mutación que esto mata**: colapsar la rampa —un `RAMP` de 1, o el
    // mismo escalón para todas—. Dos líneas del mismo color en un bump es el
    // defecto exacto que el gráfico existe para no tener: cuando se cruzan no
    // queda cómo saber cuál siguió subiendo. Las doce pruebas de arriba miran el
    // color con un `/^var\(--color-fam-\w+-\d\)$/`, que no ve un empate.
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'a', puntos: [{ t: 'P1', v: 3 }] },
          { etiqueta: 'b', puntos: [{ t: 'P1', v: 2 }] },
          { etiqueta: 'c', puntos: [{ t: 'P1', v: 1 }] },
        ])}
      />,
    )

    const strokes = grupos(container).map((g) => trazoDe(g)?.stroke)
    expect(strokes).toHaveLength(3)
    expect(new Set(strokes).size).toBe(3)
  })

  it('el escalón sale del ORDEN DE ENTRADA y no del PUESTO FINAL', () => {
    // **La mutación que esto mata**: tomar el escalón del puesto —que es lo que
    // el frame dibuja, con el trazo principal para META, que termina #1—. Es la
    // divergencia que la cabecera declara y la que más costaría: una serie
    // cambiaría de color al cambiar el período, lo contrario de la persistencia
    // cromática de §2.2. `a` entra primera y termina ÚLTIMA, así que las dos
    // versiones se distinguen.
    const { container } = render(<PlotBump {...base} value={CRUZA} />)

    const gs = grupos(container)
    expect(trazoDe(gs[0] as Element)?.stroke).toBe(escalon(0))
    expect(trazoDe(gs[1] as Element)?.stroke).toBe(escalon(1))
    // Y el rótulo de cada una acompaña al trazo de la suya.
    expect(rotuloDe(gs[0] as Element)?.fill).toBe(escalon(0))
  })
})

describe('el eje de períodos es la UNIÓN de los `t`', () => {
  it('una serie que arranca tarde entra al ranking', () => {
    // **La mutación que esto mata**: tomar el eje de los puntos de la PRIMERA
    // serie, como hace `PlotStackArea`. La cabecera declara que es la unión y da
    // la razón; ninguna prueba lo miraba, porque en todos los fixtures de arriba
    // la primera serie ya trae todos los `t`. Con el eje de la primera, el `P2`
    // de `b` se vuelve invisible en vez de ausente.
    const { container } = render(
      <PlotBump
        {...base}
        value={multi([
          { etiqueta: 'a', puntos: [{ t: 'P1', v: 5 }] },
          { etiqueta: 'b', puntos: [{ t: 'P1', v: 3 }, { t: 'P2', v: 9 }] },
        ])}
      />,
    )

    expect(screen.getByText('P2')).toBeInTheDocument()
    expect(container.querySelectorAll('circle')).toHaveLength(3)
    // El conteo del `aria-label` es lo único que un lector no vidente recibe, y
    // también cuenta los períodos: con el eje mutado diría «en 1 períodos».
    expect(
      screen.getByRole('img', { name: 'Ranking de 2 series en 2 períodos' }),
    ).toBeInTheDocument()
  })
})

describe('el rótulo de serie · tipografía, recorte y dónde cae', () => {
  it('lleva el contrato tipográfico de §2.3 · mono 10 y 0.12em, por TOKEN', () => {
    // **La mutación que esto mata**: quedarse sin el contrato tipográfico. Es la
    // única garantía del componente que NINGÚN chequeo puede ver —`L15` y
    // `tipografia` miran utilidades de Tailwind en `src/`, y esto es el `style`
    // de un `<text>` de SVG—, así que si no lo mira una prueba no lo mira nadie.
    // Y el tamaño va por token: `text-[10px]` compila igual y se sale del sistema.
    const { container } = render(<PlotBump {...base} value={CRUZA} />)

    const r = rotuloCompleto(grupos(container)[0] as Element)
    expect(r?.estilo).toContain('var(--font-mono)')
    expect(r?.estilo).toContain('var(--text-label)')
    expect(r?.estilo).toContain('0.12em')
  })

  it('un rótulo largo se recorta a LO QUE QUEPA, con elipsis', () => {
    // **Las dos mutaciones que esto mata**: pintar el rótulo entero sin recortar,
    // y aflojar el tope de la columna. Ninguna de las doce de arriba usa una
    // etiqueta de más de seis caracteres, así que el recorte —y su tope, que es
    // lo que impide que la columna se coma el gráfico— no se ejercitaba nunca.
    const largo = 'plataforma-de-medios-muy-larga'
    const columna = Math.min(reserve([largo]), TEST_SIZE.width * LABEL_MAX)
    const cap = Math.max(3, Math.floor((columna - GAP) / ADV))
    expect(cap).toBeLessThan(largo.length) // el fixture tiene que desbordar

    render(
      <PlotBump {...base} value={multi([{ etiqueta: largo, puntos: [{ t: 'P1', v: 1 }] }])} />,
    )

    const esperado = `${largo.toUpperCase().slice(0, cap - 1)}…`
    expect(screen.getByText(esperado)).toBeInTheDocument()
    expect(screen.queryByText(largo.toUpperCase())).toBeNull()
  })

  it('va a la DERECHA del último período y a la ALTURA de su fila final', () => {
    // **Las dos mutaciones que esto mata**: meter el rótulo adentro del riel, y
    // anclarlo al PRIMER punto en vez del último. La segunda es la que engaña:
    // con series que se cruzan el rótulo señalaría la fila donde la serie
    // ARRANCÓ, o sea el nombre puesto sobre la línea de otra.
    const { container } = render(<PlotBump {...base} value={CRUZA} />)

    const util = anchoUtil(['a', 'b'])
    const r = rotuloCompleto(grupos(container)[0] as Element)
    expect(r?.x).toBe(util + GAP)
    // `a` entra primera y TERMINA última: su rótulo va en la fila #2.
    expect(r?.y).toBe(cyDe(2, 2))
  })
})

describe('los dos ejes caen fuera del área de dibujo', () => {
  it('los puestos a la izquierda de la reserva y los períodos abajo', () => {
    // **Las dos mutaciones que esto mata**: correr los rótulos de puesto sobre
    // los rieles, y dibujar el eje de períodos arriba. Las de arriba verifican
    // que los textos EXISTAN —`getByText('#1')`, `getByText('20362')`— y un
    // rótulo encimado sobre el gráfico existe igual.
    const { container } = render(<PlotBump {...base} value={CRUZA} />)

    const puestos = Array.from(container.querySelectorAll('text[text-anchor="end"]'))
    expect(puestos).toHaveLength(2)
    for (const p of puestos) expect(Number(p.getAttribute('x'))).toBe(reserveL - GAP)

    const periodos = Array.from(container.querySelectorAll('text[text-anchor="middle"]'))
    expect(periodos).toHaveLength(2)
    // Debajo del área de dibujo, que mide `height`: el eje vive en el `MARGIN.b`.
    for (const p of periodos) expect(Number(p.getAttribute('y'))).toBeGreaterThan(height)
  })
})
