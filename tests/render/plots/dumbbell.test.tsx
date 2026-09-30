// @vitest-environment jsdom

/** La pesa · `dumbbell` sobre `categoricaComparada` · §PEN:Plot/DUMBBELL
 *
 *  **Lo que se verifica es HACIA DÓNDE apunta la brecha y con qué escala, no que
 *  el SVG exista.** Una pesa mal hecha se ve exactamente como una pesa bien
 *  hecha: cinco conectores limpios, diez puntos, cinco cifras al costado. Los
 *  cuatro defectos caros —invertir los extremos, pintar los dos puntos del mismo
 *  escalón, arrancar el dominio en cero y derivar el delta que el backend no
 *  mandó— no se notan mirando la pantalla, y los cuatro cambian lo que el panel
 *  dice.
 *
 *  **El dominio se recalcula acá con su fórmula escrita a mano**, no importando
 *  la del componente: una prueba que llama a la misma función que verifica no
 *  puede fallar nunca. La fórmula es la del encabezado del plot —acolchado de 0.3
 *  del span a cada lado, con el piso de `envelope`— y si alguien la cambia allá,
 *  esto se pone rojo, que es el punto.
 *
 *  **Las afirmaciones se montan contra el plot y no contra `ComparisonBody`**,
 *  que todavía no existe: `bodies/registry.ts` lo tiene en `MISSING_TYPES` y el
 *  cableado es una fase aparte, a propósito. Estas pruebas fijan lo que ese
 *  cableado NO puede romper. Lo que queda sin cubrir hasta entonces son los tres
 *  pasos de despacho del cuerpo —`UnknownPlotState` para un id fuera de `DIBUJA`,
 *  el `EmptyState` cuando ningún ítem trae `referencia`, y que un panel sin
 *  `grafico` NO salga dumbbell—, y queda escrito acá para que no se pierda.
 *
 *  **El formateador que se inyecta es el de la BRECHA**, compuesto como lo va a
 *  componer el cuerpo: `format.delta` más la unidad. Es la única forma de que la
 *  prueba distinga `format.delta` de `format.number` —las dos firmas son
 *  `(n: number) => string`, así que equivocarse compila.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotDumbbell } from '@/render/plots/PlotDumbbell'
import { linearScale } from '@/render/plots/core/scale'
import { createFormat } from '@/render/format'
import { TEST_SIZE } from '../../setup'
import type { Value } from '@/api/types'

type Item = { etiqueta: string; v: number; referencia?: number; delta?: number }

const comparada = (items: readonly Item[]) =>
  ({ forma: 'categoricaComparada', items }) as unknown as Extract<
    Value,
    { forma: 'categoricaComparada' }
  >

/** El formateador de la brecha, compuesto como lo compone el cuerpo: el delta
 *  del tenant más la unidad pegada. `withUnit` no sirve acá —su política es que
 *  un nombre de unidad no se pega a la cifra— y el dibujo la pega: «+12 pp». */
const brecha = (v: number) => `${createFormat('es-MX').delta(v, { decimals: 0 })} pp`
/** El que un cableado distraído inyectaría por error. Se usa para leer qué
 *  cambia, no en las aserciones de signo. */
const plano = (v: number) => String(v)

/* ── La geometría del dibujo, recalculada acá ─────────────────────────────── */

/** 0.14 del ancho · el borde derecho de las cinco etiquetas cae en 82 de 580. */
const LEFT = Math.round(TEST_SIZE.width * 0.14)
/** 0.136 reservados a la derecha · las cifras arrancan en 501.2 de 580. */
const DELTA_X = TEST_SIZE.width - Math.round(TEST_SIZE.width * 0.136)

const GAP = 12
const DOT_R = 6
const X0 = LEFT + GAP + DOT_R
const X1 = DELTA_X - GAP - DOT_R
const RIEL = X1 - X0

/** El acolchado de 0.3 a cada lado, con el piso de span de `envelope`. */
const escalaX = (valores: readonly number[]) => {
  const lo = Math.min(...valores)
  const hi = Math.max(...valores)
  const span = Math.max(hi - lo, Math.abs(hi) / 10, 1)
  return linearScale([lo - 0.3 * span, hi + 0.3 * span], [X0, X1])
}

/* ── Lectores del DOM ────────────────────────────────────────────────────── */

const conectores = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('path')).map((n) => ({
    stroke: n.getAttribute('stroke'),
    width: Number(n.getAttribute('stroke-width')),
    desde: [...(n.getAttribute('d') ?? '').matchAll(/M(-?[\d.]+),(-?[\d.]+)/g)].map((m) =>
      Number(m[1]),
    )[0],
    hasta: [...(n.getAttribute('d') ?? '').matchAll(/L(-?[\d.]+),(-?[\d.]+)/g)].map((m) =>
      Number(m[1]),
    )[0],
  }))

const puntos = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('circle')).map((n) => ({
    cx: Number(n.getAttribute('cx')),
    cy: Number(n.getAttribute('cy')),
    r: Number(n.getAttribute('r')),
    fill: n.getAttribute('fill'),
  }))

const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const etiquetas = (c: HTMLElement) =>
  textos(c).filter((t) => t.style.fontFamily === 'var(--font-body)')
const cifras = (c: HTMLElement) =>
  textos(c).filter((t) => t.style.fontFamily === 'var(--font-mono)')

/* ── Fixtures · las cinco filas del dibujo, despejadas de su geometría ────── */

/** Referencias 92, 88, 96, 84 y 90 y valores 104, 112, 78, 71 y 118. Salieron de
 *  dividir los cinco largos de `path` por su delta impreso —5.767 px por punto,
 *  idéntico en las cinco— y de la vertical punteada en x 327.4.
 *
 *  **Ninguna referencia es 100**, que es lo que prueba que el `OBJETIVO = 100`
 *  del dibujo no está en el dato. */
const CINCO: readonly Item[] = [
  { etiqueta: 'Meta', v: 104, referencia: 92, delta: 12 },
  { etiqueta: 'Google', v: 112, referencia: 88, delta: 24 },
  { etiqueta: 'Criteo', v: 78, referencia: 96, delta: -18 },
  { etiqueta: 'TikTok', v: 71, referencia: 84, delta: -13 },
  { etiqueta: 'Email', v: 118, referencia: 90, delta: 28 },
]

const TODOS = CINCO.flatMap((i) => [i.referencia ?? 0, i.v])

describe('hacia dónde apunta la brecha', () => {
  it('el conector va de la REFERENCIA al VALOR y el escalón 2 cae en el valor', () => {
    // **Es el defecto caro y el que ninguna mirada encuentra.** Invertir los
    // extremos del `path`, o pintar el escalón 2 en la referencia, deja cinco
    // pesas simétricas idénticas a las buenas diciendo lo contrario.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    const x = escalaX(TODOS)
    const trazos = conectores(container)
    expect(trazos).toHaveLength(5)

    for (const [i, fila] of CINCO.entries()) {
      const trazo = trazos[i]
      expect(trazo?.desde).toBeCloseTo(x(fila.referencia ?? 0), 6)
      expect(trazo?.hasta).toBeCloseTo(x(fila.v), 6)
    }

    // Y el punto de VALOR —escalón 2— está en el extremo de `v`, no en el de la
    // referencia. Se leen de dos en dos: referencia primero, valor después.
    const marcas = puntos(container)
    expect(marcas).toHaveLength(10)
    for (const [i, fila] of CINCO.entries()) {
      const ref = marcas[i * 2]
      const val = marcas[i * 2 + 1]
      expect(ref?.fill).toBe('var(--color-fam-medios-0)')
      expect(val?.fill).toBe('var(--color-fam-medios-2)')
      expect(Math.abs((ref?.cx ?? 0) - x(fila.referencia ?? 0))).toBeLessThan(0.5)
      expect(Math.abs((val?.cx ?? 0) - x(fila.v))).toBeLessThan(0.5)
      expect(ref?.r).toBe(DOT_R)
      expect(val?.r).toBe(DOT_R)
    }
  })

  it('las filas que van hacia la IZQUIERDA son las de delta negativo', () => {
    // Lo que el dibujo hace con `l-103.9` y `l-75`. Sin esto una implementación
    // que ordene los extremos por valor —`Math.min` a la izquierda— dibujaría
    // cinco pesas todas apuntando en la misma dirección.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    const haciaLaDerecha = conectores(container).map((t) => (t.hasta ?? 0) > (t.desde ?? 0))
    expect(haciaLaDerecha).toEqual([true, true, false, false, true])
  })
})

describe('el dominio no arranca en cero', () => {
  it('los cinco índices usan el riel en vez de apretarse contra un borde', () => {
    // Con `[0, ceiling(valores)]` el techo sale 150 sobre datos de 71 a 118: las
    // cinco pesas ocupan el 0.31 del riel en vez del 0.625, y **se ven
    // prolijas**. Es el defecto que el dibujo probó imposible —sus diez puntos
    // cubren 0.647 del canal— y que ninguna mirada a la pantalla detecta.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    const xs = puntos(container).map((p) => p.cx)
    const izq = Math.min(...xs)
    const der = Math.max(...xs)

    expect(izq - X0).toBeGreaterThan(RIEL * 0.15)
    expect(X1 - der).toBeGreaterThan(RIEL * 0.15)
    expect(der - izq).toBeGreaterThan(RIEL * 0.5)
  })

  it('y con dos índices juntos LEJOS de cero, cada punto cae donde la fórmula dice', () => {
    // El caso que la aserción legible de arriba no distingue por sí sola: dos
    // filas alrededor de 100. Las posiciones exactas se cotejan contra el
    // dominio recalculado a mano, así que cualquier cambio de dominio —base
    // cero, `envelope`, otro acolchado— se pone rojo.
    const dos: readonly Item[] = [
      { etiqueta: 'Meta', v: 104, referencia: 92, delta: 12 },
      { etiqueta: 'Google', v: 112, referencia: 88, delta: 24 },
    ]
    const { container } = render(
      <PlotDumbbell value={comparada(dos)} family="medios" format={brecha} />,
    )

    const x = escalaX([92, 104, 88, 112])
    const xs = puntos(container).map((p) => p.cx)
    expect(xs).toHaveLength(4)
    expect(xs[0]).toBeCloseTo(x(92), 6)
    expect(xs[1]).toBeCloseTo(x(104), 6)
    expect(xs[2]).toBeCloseTo(x(88), 6)
    expect(xs[3]).toBeCloseTo(x(112), 6)
  })

  it('cinco filas con delta cero sobre el mismo valor no colapsan el dominio', () => {
    // Es el piso del span. Sin el `Math.max(…, Math.abs(hi) / 10, 1)` el dominio
    // queda de ancho cero, `linearScale` devuelve el arranque de su rango para
    // todo valor, y las cinco pesas se apoyan en el borde izquierdo.
    const { container } = render(
      <PlotDumbbell
        value={comparada([
          { etiqueta: 'Meta', v: 100, referencia: 100, delta: 0 },
          { etiqueta: 'Google', v: 100, referencia: 100, delta: 0 },
        ])}
        family="medios"
        format={brecha}
      />,
    )

    const xs = puntos(container).map((p) => p.cx)
    expect(xs).toHaveLength(4)
    // Acolchado parejo ⇒ un valor único cae en el MEDIO del riel.
    for (const at of xs) expect(at).toBeCloseTo((X0 + X1) / 2, 6)
  })
})

describe('la cifra de brecha', () => {
  it('lleva el signo del dato, y el menos es U+2212', () => {
    // **La aserción que cubre lo único que el compilador no ve.** Inyectar
    // `format.number` en vez de `format.delta` tiene la misma firma y compila; lo
    // que se pierde es el signo, que es lo que comunica dirección —regla dura 3,
    // que prohíbe verde/rojo semántico y pone la dirección en el signo.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    expect(cifras(container).map((t) => t.textContent)).toEqual([
      '+12 pp',
      '+24 pp',
      '−18 pp',
      '−13 pp',
      '+28 pp',
    ])
    // Ni valores absolutos ni cifras sin signo.
    for (const t of cifras(container)) {
      expect(t.textContent?.startsWith('+') || t.textContent?.startsWith('−')).toBe(true)
    }
  })

  it('escribe SOLO la brecha · el valor y la referencia no se pintan', () => {
    // El frame no escribe ninguna otra cifra. Con un formateador plano se ve qué
    // números llegaron al texto: si apareciera `104` o `92`, el plot estaría
    // escribiendo cifras que el dibujo no tiene.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={plano} />,
    )

    expect(cifras(container).map((t) => t.textContent)).toEqual(['12', '24', '-18', '-13', '28'])
  })

  it('un delta ausente NO se deriva de `v − referencia`', () => {
    // «Quien conoce la definición del delta —absoluto, relativo, contra qué
    // base— es quien produjo el dato». Con `item.delta ?? item.v - item.referencia`
    // salen cinco cifras y esto se pone rojo. La fila igual se dibuja: tiene
    // referencia, así que hay comparación; lo que no hay es brecha escrita.
    // Email llega con los dos números y sin `delta`. Se escribe la lista entera
    // en vez de derivarla de `CINCO`: con `exactOptionalPropertyTypes` copiar un
    // opcional propaga el `undefined`, y el fixture tiene que decir «la clave no
    // viene» y no «viene en undefined», que es lo que el cable manda.
    const sinDelta: readonly Item[] = [
      ...CINCO.slice(0, 4),
      { etiqueta: 'Email', v: 118, referencia: 90 },
    ]
    const { container } = render(
      <PlotDumbbell value={comparada(sinDelta)} family="medios" format={brecha} />,
    )

    expect(conectores(container)).toHaveLength(5)
    expect(cifras(container)).toHaveLength(4)
    expect(cifras(container).map((t) => t.textContent)).not.toContain('+28 pp')
  })
})

describe('sin referencia no hay comparación', () => {
  it('la fila que no la trae no se dibuja, y el conteo lo dice', () => {
    // `item.referencia ?? 0` sacaría el conector del origen —«inventar un
    // objetivo», que es lo que el contrato prohíbe en esta forma— y
    // `?? item.v` dibujaría una pesa de largo cero que se lee «llegó a la meta».
    const { container } = render(
      <PlotDumbbell
        value={comparada([
          { etiqueta: 'Meta', v: 104, referencia: 92, delta: 12 },
          { etiqueta: 'Google', v: 112 },
          { etiqueta: 'Criteo', v: 78, referencia: 96, delta: -18 },
        ])}
        family="medios"
        format={brecha}
      />,
    )

    expect(conectores(container)).toHaveLength(2)
    expect(puntos(container)).toHaveLength(4)
    expect(etiquetas(container).map((t) => t.textContent)).toEqual(['Meta', 'Criteo'])
    expect(
      screen.getByRole('img', { name: '2 categorías con su referencia y su brecha' }),
    ).toBeInTheDocument()
  })

  it('y si NINGUNA la trae, no se dibuja nada y tampoco revienta', () => {
    // Este caso lo ataja el cuerpo con su `EmptyState` —«Este corte llegó sin
    // punto de comparación»— y por eso el plot no lo anuncia. Lo que igual tiene
    // que sostener es no reventar: `spread([])` sobre una lista vacía daría un
    // dominio infinito, así que la guarda de `filas.length > 0` es lo que lo
    // mantiene fuera del camino.
    const { container } = render(
      <PlotDumbbell
        value={comparada([
          { etiqueta: 'Meta', v: 104 },
          { etiqueta: 'Google', v: 112 },
        ])}
        family="medios"
        format={brecha}
      />,
    )

    expect(container.querySelector('svg')).toBeNull()
    expect(conectores(container)).toHaveLength(0)
  })

  it('el nombre accesible es DISTINGUIBLE del de las columnas agrupadas', () => {
    // `grouped` sale del MISMO cuerpo y de la MISMA forma. Con el mismo texto,
    // olvidar el despacho se ve perfecto y ninguna prueba lo nota.
    render(<PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />)
    expect(
      screen.getByRole('img', { name: '5 categorías con su referencia y su brecha' }),
    ).toBeInTheDocument()
  })
})

describe('el orden es el del dato', () => {
  it('las cinco etiquetas salen de arriba a abajo como llegaron', () => {
    // Un `.sort((a, b) => b.delta - a.delta)` o por valor rompe
    // `orden: 'natural'` del cuerpo en silencio. El dibujo tampoco ordena: +12,
    // +24, −18, −13, +28.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    const filas = etiquetas(container).map((t) => ({
      k: t.textContent,
      y: Number(t.getAttribute('y')),
    }))
    expect(filas.map((f) => f.k)).toEqual(['Meta', 'Google', 'Criteo', 'TikTok', 'Email'])
    // Y no sólo en el orden del DOM: también de arriba hacia abajo en pantalla.
    for (let i = 1; i < filas.length; i += 1) {
      expect(filas[i]?.y ?? 0).toBeGreaterThan(filas[i - 1]?.y ?? 0)
    }
  })
})

describe('el color · regla dura 1, 2 y 5 de una vez', () => {
  it('los dos extremos son escalones DISTINTOS de la misma familia', () => {
    // Con `hue({ family })` —el escalón por defecto— los dos puntos salen del
    // mismo hue y la pesa pierde su única marca de qué extremo es cuál. Es
    // exactamente el modo de falla del defecto.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    const fills = new Set(puntos(container).map((p) => p.fill))
    expect(fills).toEqual(
      new Set(['var(--color-fam-medios-0)', 'var(--color-fam-medios-2)']),
    )
  })

  it('con otra familia no queda ni un rastro de la anterior', () => {
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="cliente" format={brecha} />,
    )
    expect(container.innerHTML).not.toContain('medios')
    expect(container.innerHTML).toContain('var(--color-fam-cliente-')
  })

  it('ni naranja, ni ámbar, ni amarillo, ni un hex literal', () => {
    // El naranja `--color-acc` no es color de datos: la tentación de este
    // gráfico es marcar con él la fila que no llegó al objetivo. Se miran los
    // ATRIBUTOS de tinta y no el HTML entero, para que la prueba no se ponga
    // verde por la razón equivocada el día que una etiqueta contenga «acc».
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    const tinta = Array.from(container.querySelectorAll('*')).flatMap((n) => [
      n.getAttribute('stroke') ?? '',
      n.getAttribute('fill') ?? '',
      (n as SVGElement).style?.fill ?? '',
    ])
    for (const prohibido of ['acc', '#', 'amber', 'yellow', 'ambar']) {
      expect(tinta.filter((v) => v.includes(prohibido))).toEqual([])
    }
  })

  it('el conector es PAPEL y no dato', () => {
    // `stroke={hue({ family })}` lo convierte en una tercera medida, que es la
    // misma razón por la que el umbral de `PlotBullet` no lleva familia.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    for (const trazo of conectores(container)) {
      expect(trazo.stroke).toBe('var(--color-w5)')
      expect(trazo.width).toBe(3)
    }
  })
})

describe('lo que el dibujo tiene y el dato no', () => {
  it('ni línea de objetivo ni el literal «OBJETIVO»', () => {
    // Aserción negativa a propósito: fija una decisión MEDIDA —las cinco
    // referencias del frame son 92, 88, 96, 84 y 90, ninguna es 100— para que el
    // día que alguien quiera la vertical punteada tenga que traer el número del
    // dato o del layout, no del mockup.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    expect(container.innerHTML).not.toContain('OBJETIVO')
    expect(container.querySelectorAll('[stroke-dasharray]')).toHaveLength(0)
    // Y ningún texto en `$dim`, que es el tono de esa nota.
    expect(textos(container).filter((t) => t.style.fill === 'var(--color-dim)')).toHaveLength(0)
  })
})

describe('la etiqueta se recorta con el avance de la PROPORCIONAL', () => {
  it('diez caracteres entran enteros y cuarenta se recortan con «…»', () => {
    // Con el ancho de prueba la columna mide 84 px, y a `$font-body` 12 con
    // avance 0.6 el cupo es 11 caracteres. **Usar `charsThatFit` —avance mono
    // 0.72— baja el cupo a 9**, así que `TikTok Ads` saldría recortado. Es la
    // falla que ya costó una letra por etiqueta en el eje, con otro tamaño.
    const larga = 'Meta Advantage Plus Shopping Campaigns Q4'
    expect(larga.length).toBeGreaterThan(40)

    const { container } = render(
      <PlotDumbbell
        value={comparada([
          { etiqueta: 'TikTok Ads', v: 104, referencia: 92, delta: 12 },
          { etiqueta: larga, v: 112, referencia: 88, delta: 24 },
        ])}
        family="medios"
        format={brecha}
      />,
    )

    const cap = Math.max(3, Math.floor(LEFT / (12 * 0.6)))
    expect(cap).toBe(11)

    const [corta, cortada] = etiquetas(container)
    expect(corta?.textContent).toBe('TikTok Ads')
    expect(cortada?.textContent).toBe(`${larga.slice(0, cap - 1)}…`)
    expect(cortada?.textContent).toHaveLength(cap)
  })

  it('las dos columnas de texto se anclan como el dibujo las mide', () => {
    // El borde DERECHO de la etiqueta cae en 82 de 580 ⇒ `end`; la cifra arranca
    // en 501.2 ⇒ `start`. Con los dos anclajes invertidos las `x` no se mueven y
    // los textos crecen encima del riel, que es lo que `PlotSlope` ya aprendió.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    for (const t of etiquetas(container)) {
      expect(t.getAttribute('text-anchor')).toBe('end')
      expect(Number(t.getAttribute('x'))).toBe(LEFT)
    }
    for (const t of cifras(container)) {
      expect(t.getAttribute('text-anchor')).toBe('start')
      expect(Number(t.getAttribute('x'))).toBe(DELTA_X)
    }
  })
})

/* ── Agregado por QA · lo que las 19 primeras dejaban sin cubrir ──────────────
 *
 * Diez mutaciones fieles murieron contra las 19 aserciones de arriba y **ocho
 * sobrevivieron**, todas en la misma zona: la geometría VERTICAL y los dos roles
 * tipográficos. El eje horizontal estaba cubierto hasta la posición exacta; del
 * vertical sólo se verificaba que las etiquetas bajaran monótonamente, que es
 * una aserción que no distingue «centrado en su banda» de «corrido media banda
 * hacia arriba», y del texto sólo se leía `fontFamily`, que es justo el campo
 * que los lectores `etiquetas`/`cifras` usan para filtrar — así que el tamaño
 * podía ser cualquiera de los nueve de la escala y ninguna prueba lo notaba.
 */

describe('la geometría vertical · una fila es UNA línea', () => {
  /** El centro de la banda, recalculado a mano y no importado de `bandScale`.
   *  Con `padding` p: `y(i) = i·step + (step − step·(1−p))/2` y el centro suma
   *  `bandwidth/2`, y los dos términos de `p` se cancelan: el centro es
   *  `(i + ½)·step` para cualquier padding. A 300 px y cinco filas: 30, 90, 150,
   *  210, 270. **Sin el `+ y.bandwidth / 2` del componente** salen 6, 66, 126,
   *  186 y 246: la primera fila se corta contra el borde de arriba y quedan 54 px
   *  muertos abajo. Las 19 de arriba lo dejaban pasar. */
  const centro = (i: number, n = CINCO.length) => ((i + 0.5) * TEST_SIZE.height) / n

  const alturaDelTrazo = (c: HTMLElement) =>
    Array.from(c.querySelectorAll('path')).map((n) =>
      Number([...(n.getAttribute('d') ?? '').matchAll(/M-?[\d.]+,(-?[\d.]+)/g)][0]?.[1]),
    )

  it('el conector, los dos puntos, la etiqueta y la cifra caen en el MISMO centro', () => {
    // Es la versión vertical del defecto que el encabezado llama caro: cinco
    // filas donde la cifra está 8 px más abajo que su propia pesa se ven como
    // cinco filas prolijas, y el panel dice otra cosa.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    const trazos = alturaDelTrazo(container)
    const marcas = puntos(container)
    const labs = etiquetas(container)
    const nums = cifras(container)

    for (const [i] of CINCO.entries()) {
      expect(trazos[i], `conector ${i}`).toBeCloseTo(centro(i), 6)
      expect(marcas[i * 2]?.cy, `punto de referencia ${i}`).toBeCloseTo(centro(i), 6)
      expect(marcas[i * 2 + 1]?.cy, `punto de valor ${i}`).toBeCloseTo(centro(i), 6)
      expect(Number(labs[i]?.getAttribute('y')), `etiqueta ${i}`).toBeCloseTo(centro(i), 6)
      expect(Number(nums[i]?.getAttribute('y')), `cifra ${i}`).toBeCloseTo(centro(i), 6)
    }
  })

  it('`y` es el CENTRO del texto y no su línea de base', () => {
    // Sin `dominantBaseline="middle"` el mismo `y={cy}` deja el texto colgando
    // hacia arriba: la cifra y su pesa dejan de estar en la misma línea sin que
    // ningún número del DOM cambie. Es la única forma de verlo desde jsdom.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    const todos = [...etiquetas(container), ...cifras(container)]
    expect(todos).toHaveLength(10)
    for (const t of todos) expect(t.getAttribute('dominant-baseline')).toBe('middle')
  })

  it('el svg cubre el alto y el ancho medidos · si mide menos, la última fila queda afuera', () => {
    // `height={h / 2}` no rompe ninguna posición —las filas se siguen repartiendo
    // `h`— y deja las tres últimas dibujadas fuera del viewport del `<svg>`, que
    // recorta. En jsdom no hay recorte, así que hay que mirar el atributo.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    const svg = container.querySelector('svg')
    expect(Number(svg?.getAttribute('height'))).toBe(TEST_SIZE.height)
    expect(Number(svg?.getAttribute('width'))).toBe(TEST_SIZE.width)
    // Y el centro de la última fila cae dentro de ese alto.
    expect(centro(CINCO.length - 1)).toBeLessThan(TEST_SIZE.height)
  })
})

describe('los dos roles de §2.3 que este plot usa', () => {
  it('la etiqueta es «celda» y la cifra es «cifra», las dos en TINTA', () => {
    // Divergencia 6 del encabezado del plot: `AxisText` no sirve porque es mono
    // 10 MAYÚSCULAS `$dim`, y acá hacen falta «celda» —body 12 `$ink`— y «cifra»
    // —mono 11 `$ink`—. Los lectores `etiquetas`/`cifras` filtran por
    // `fontFamily`, así que el TAMAÑO no lo miraba nadie: `var(--text-label)` en
    // la cifra pasaba las 19 aserciones y bajaba la brecha de mono 11 a mono 10.
    //
    // La tinta tampoco: la aserción de «ni naranja ni hex» busca prohibidos y la
    // de «ningún texto en `$dim`» mira sólo `--color-dim`, así que una etiqueta
    // pintada en `--color-w5` —papel sobre papel, ilegible— pasaba entera.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    for (const t of etiquetas(container)) {
      expect(t.style.fontSize).toBe('var(--text-celda)')
      expect(t.style.fill).toBe('var(--color-ink)')
    }
    for (const t of cifras(container)) {
      expect(t.style.fontSize).toBe('var(--text-cifra)')
      expect(t.style.fill).toBe('var(--color-ink)')
    }
  })

  it('la cifra va en cifras tabulares · cinco brechas que se comparan entre sí', () => {
    // El propio comentario del plot lo declara —«el tracking separa los dígitos y
    // rompe la comparación de fila a fila»— y sin `tabular-nums` los dígitos de
    // ancho variable desalinean las cinco cifras de la columna derecha.
    const { container } = render(
      <PlotDumbbell value={comparada(CINCO)} family="medios" format={brecha} />,
    )

    for (const t of cifras(container)) {
      expect(t.getAttribute('style')).toContain('tabular-nums')
    }
  })
})
