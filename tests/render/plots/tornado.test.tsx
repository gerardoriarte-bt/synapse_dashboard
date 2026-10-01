// @vitest-environment jsdom

/** El tornado · `tornado` sobre `categoricaComparada` · §PEN:Plot/TORNADO
 *
 *  **Lo que se verifica es con qué vara se miden los dos lados y quién decide de
 *  qué lado va cada barra, no que el SVG exista.** Un tornado mal hecho se ve
 *  exactamente como uno bien hecho: ocho barras simétricas, un eje al centro,
 *  ocho cifras colgando. Los cuatro defectos caros —escalar cada lado contra su
 *  propio máximo, derivar el dominio de `[min, max]` del dato, codificar el lado
 *  por campo en vez de por signo, y alinear las cifras en una columna— no se
 *  notan mirando la pantalla, y los cuatro cambian lo que el panel dice.
 *
 *  **La geometría se recalcula acá con su fórmula escrita a mano**, no importando
 *  la del componente: una prueba que llama a la misma función que verifica no
 *  puede fallar nunca. Las fórmulas son las del encabezado del plot —cero en
 *  `w/2`, dominio `[−m, +m]`, reserva de `GAP + textWidth(maxChars)`, barra al
 *  0.55 del paso y al tope de su franja— y si alguien las cambia allá, esto se
 *  pone rojo, que es el punto.
 *
 *  **Las afirmaciones se montan contra el plot y no contra `ComparisonBody`**: el
 *  cableado es una fase aparte, a propósito, y tocar el cuerpo no entra en esta
 *  tarea. Lo que queda sin cubrir hasta entonces son los tres pasos de despacho
 *  —que `grafico="tornado"` dibuje ESTO y no el dumbbell, que el defecto sin
 *  `grafico` siga siendo el dumbbell, y el `EmptyState` cuando ningún ítem trae
 *  `referencia`—, y queda escrito acá para que no se pierda.
 *
 *  **El formateador que se inyecta es `format.delta`, y no es un detalle del
 *  arnés.** El frame escribe `+42K` y `−38K`: el signo es la mitad de lo que el
 *  gráfico dice, porque sin él no hay nada que distinga el upside del downside
 *  —no hay leyenda posible y la forma no nombra los dos campos—. `format.delta` y
 *  `format.number` tienen la misma firma `(n: number) => string`, así que
 *  **inyectar el equivocado compila y se ve perfecto**. Lo sostiene la aserción
 *  de signo, no el compilador.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotTornado } from '@/render/plots/PlotTornado'
import { linearScale } from '@/render/plots/core/scale'
import { createFormat } from '@/render/format'
import { TEST_SIZE } from '../../setup'
import type { Value } from '@/api/types'

type Item = { etiqueta: string; v: number; referencia?: number }

const comparada = (items: readonly Item[]) =>
  ({ forma: 'categoricaComparada', items }) as unknown as Extract<
    Value,
    { forma: 'categoricaComparada' }
  >

/** El formateador que el cuerpo tiene que inyectar: el delta del tenant
 *  abreviado, que es lo que el frame escribe. */
const efecto = (v: number) => createFormat('es-MX').delta(v, { abbreviate: true })
/** El que un cableado distraído inyectaría por error —la misma firma, y es la del
 *  dumbbell—. Se usa para leer qué cambia, no en las aserciones de signo. */
const plano = (v: number) => createFormat('es-MX').number(v, { abbreviate: true })

/* ── La geometría del dibujo, recalculada acá ─────────────────────────────── */

/** x 290 sobre 580 de ancho: el cero está en el centro del canal y no donde cae
 *  el dominio del dato. */
const CERO = TEST_SIZE.width / 2
/** Los 10 px entre el extremo de la barra y su cifra, medidos ocho veces. */
const GAP = 10
/** `MONO_ADVANCE` de `core/axisGeometry`, repetido a mano a propósito. */
const MONO = 0.72
/** 22 de 40. */
const BAR = 0.55

/** El semicanal: simétrico, que es lo que mantiene el cero centrado aunque el
 *  dato sea asimétrico. Sale de la cifra MÁS LARGA de las 2n. */
const medioDe = (cifras: readonly string[]) =>
  Math.max(0, CERO - GAP - Math.max(0, ...cifras.map((c) => c.length)) * 10 * MONO)

/** El dominio SIMÉTRICO `[−m, +m]`. **No es `spread` ni `envelope` ni
 *  `ceiling`**: los tres acolchan un dominio de datos o parten de cero en un
 *  extremo, y acá el cero va adentro y en el centro. */
const escalaX = (items: readonly Item[], format: (v: number) => string) => {
  const valores = items.flatMap((i) => (i.referencia === undefined ? [] : [i.v, i.referencia]))
  const m = Math.max(0, ...valores.map(Math.abs)) || 1
  const medio = medioDe(valores.map(format))
  return linearScale([-m, m], [CERO - medio, CERO + medio])
}

const filasDe = (items: readonly Item[]) => items.filter((i) => i.referencia !== undefined)
const pasoDe = (items: readonly Item[]) => TEST_SIZE.height / filasDe(items).length

/* ── Lectores del DOM ────────────────────────────────────────────────────── */

type Barra = {
  x: number
  y: number
  width: number
  height: number
  rx: number
  fill: string | null
  /** Si cae bajo el velo del 0.6, que es lo que el frame le pone a la
   *  referencia. */
  velada: boolean
}

/** Las barras, separadas por el velo y NO por su color: así la aserción del lado
 *  no depende de la del escalón, que es lo que la mutación de color tiene que
 *  poder romper sola. */
const barras = (c: HTMLElement) => {
  const todas: Barra[] = Array.from(c.querySelectorAll('rect')).map((n) => ({
    x: Number(n.getAttribute('x')),
    y: Number(n.getAttribute('y')),
    width: Number(n.getAttribute('width')),
    height: Number(n.getAttribute('height')),
    rx: Number(n.getAttribute('rx')),
    fill: n.getAttribute('fill'),
    velada: n.closest('g[opacity]') !== null,
  }))
  return {
    todas,
    deValor: todas.filter((b) => !b.velada),
    deReferencia: todas.filter((b) => b.velada),
  }
}

const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
/** La cifra es `$ink`; el rótulo, `$dim`. Es la única diferencia estructural
 *  entre los dos —los dos son mono 10 con el mismo tracking— y es la que el
 *  frame dibuja. */
const cifras = (c: HTMLElement) =>
  textos(c)
    .filter((t) => t.style.fill === 'var(--color-ink)')
    .map((t) => ({
      x: Number(t.getAttribute('x')),
      y: Number(t.getAttribute('y')),
      anchor: t.getAttribute('text-anchor'),
      texto: t.textContent ?? '',
    }))
const rotulos = (c: HTMLElement) =>
  textos(c)
    .filter((t) => t.style.fill === 'var(--color-dim)')
    .map((t) => ({
      x: Number(t.getAttribute('x')),
      y: Number(t.getAttribute('y')),
      anchor: t.getAttribute('text-anchor'),
      texto: t.textContent ?? '',
    }))

const eje = (c: HTMLElement) => {
  const n = c.querySelector('line')
  return {
    x1: Number(n?.getAttribute('x1')),
    x2: Number(n?.getAttribute('x2')),
    y1: Number(n?.getAttribute('y1')),
    y2: Number(n?.getAttribute('y2')),
    stroke: n?.getAttribute('stroke'),
    width: Number(n?.getAttribute('stroke-width')),
  }
}

/* ── Fixtures ────────────────────────────────────────────────────────────── */

/** Las cuatro filas del dibujo, despejadas de su geometría: largo de barra ÷ 3
 *  px por millar. Los cuatro rótulos son los literales del frame.
 *
 *  **La cuarta es la que enseña**: +8K contra −34K es el único factor con upside
 *  chico y downside grande, y el rótulo que le toca es `Stock crítico`. Es lo que
 *  confirma el emparejamiento rótulo↔fila por semántica y no sólo por posición. */
const CUATRO: readonly Item[] = [
  { etiqueta: 'Inversión ±10%', v: 42000, referencia: -38000 },
  { etiqueta: 'Conversión ±0.1pp', v: 31000, referencia: -29000 },
  { etiqueta: 'Precio ±3%', v: 22000, referencia: -24000 },
  { etiqueta: 'Stock crítico', v: 8000, referencia: -34000 },
]

describe('una sola vara para los dos lados', () => {
  it('la escala es la MISMA a izquierda y a derecha, con el dato asimétrico', () => {
    // **Es el defecto más caro y el que ninguna mirada encuentra.** Dos escalas
    // —una por lado, cada una contra su propio máximo— llenan el canal a los dos
    // lados y se ven perfectas diciendo que un −34K pesa lo mismo que un +42K.
    const una: readonly Item[] = [{ etiqueta: 'Inversión ±10%', v: 42000, referencia: -34000 }]
    const { container } = render(
      <PlotTornado value={comparada(una)} family="demanda" format={efecto} />,
    )

    const { deValor, deReferencia } = barras(container)
    const derecha = deValor[0]
    const izquierda = deReferencia[0]
    const porPunto = medioDe(['+42K', '−34K']) / 42000

    expect((derecha?.width ?? 0) / 42000).toBeCloseTo(porPunto, 9)
    expect((izquierda?.width ?? 0) / 34000).toBeCloseTo(porPunto, 9)
    expect((izquierda?.width ?? 0) / 34000).toBeCloseTo((derecha?.width ?? 0) / 42000, 9)
  })

  it('el cero está en el centro del canal y el dominio es simétrico', () => {
    // **Mutación: dominio `[min, max]` de los valores dibujados**, que es lo que
    // haría cualquier escala derivada del dato —y lo que `spread` hace—. El cero
    // se corre del centro y arranca a moverse fila a fila.
    const { container } = render(
      <PlotTornado value={comparada(CUATRO)} family="demanda" format={efecto} />,
    )

    const linea = eje(container)
    expect(linea.x1).toBe(CERO)
    expect(linea.x2).toBe(CERO)
    expect(linea.y1).toBe(0)
    expect(linea.y2).toBe(TEST_SIZE.height)
    // El eje es PAPEL, no dato: sin familia y de 1px.
    expect(linea.stroke).toBe('var(--color-w5)')
    expect(linea.width).toBe(1)

    // Y toda barra positiva ARRANCA en el cero, toda negativa TERMINA ahí.
    for (const b of barras(container).deValor) {
      expect(Math.abs(b.x - CERO)).toBeLessThan(0.5)
    }
    for (const b of barras(container).deReferencia) {
      expect(Math.abs(b.x + b.width - CERO)).toBeLessThan(0.5)
    }
  })
})

describe('el lado lo decide el signo, no el campo', () => {
  it('un `v` negativo sale a la IZQUIERDA y una `referencia` positiva a la derecha', () => {
    // **Mutación: fijar `v` a la derecha y `referencia` a la izquierda** —`x =
    // cero`, `width = Math.abs(v) * k`—. Reproduce el dibujo exacto, donde campo
    // y lado coinciden en las cuatro filas, y miente con cualquier otro dato.
    const cruzada: readonly Item[] = [{ etiqueta: 'Precio ±3%', v: -10000, referencia: 6000 }]
    const { container } = render(
      <PlotTornado value={comparada(cruzada)} family="demanda" format={efecto} />,
    )

    const x = escalaX(cruzada, efecto)
    const valor = barras(container).deValor[0]
    const referencia = barras(container).deReferencia[0]

    // La de `v` termina en el cero y arranca a su izquierda.
    expect(Math.abs((valor?.x ?? 0) + (valor?.width ?? 0) - CERO)).toBeLessThan(0.5)
    expect(valor?.x).toBeCloseTo(x(-10000), 6)
    expect(valor?.x ?? 0).toBeLessThan(CERO)

    // La de `referencia` arranca en el cero y crece hacia la derecha.
    expect(Math.abs((referencia?.x ?? 0) - CERO)).toBeLessThan(0.5)
    expect((referencia?.x ?? 0) + (referencia?.width ?? 0)).toBeCloseTo(x(6000), 6)
  })
})

describe('el color sale de la familia', () => {
  it('`v` va al escalón 1 opaco y `referencia` al 0 bajo el velo del 0.6', () => {
    // Tres mutaciones, tres rojas: el mismo `step` en los dos —se pierde cuál es
    // cuál—, la familia escrita a mano o un hex literal, y quitar el `opacity`.
    const { container } = render(
      <PlotTornado value={comparada(CUATRO)} family="demanda" format={efecto} />,
    )

    const { deValor, deReferencia } = barras(container)
    expect(deValor).toHaveLength(4)
    expect(deReferencia).toHaveLength(4)
    for (const b of deValor) expect(b.fill).toBe('var(--color-fam-demanda-1)')
    for (const b of deReferencia) expect(b.fill).toBe('var(--color-fam-demanda-0)')

    const velo = container.querySelector('g[opacity]')
    expect(velo?.getAttribute('opacity')).toBe('0.6')
    // Y el velo cubre SÓLO la referencia: con las ocho barras adentro se pierde
    // la jerarquía que el frame dibuja.
    expect(velo?.querySelectorAll('rect')).toHaveLength(4)
  })
})

describe('cada cifra lleva su signo', () => {
  it('las ocho cifras del dibujo salen con `+` y con U+2212', () => {
    // **Mutación: inyectar `format.number` en vez de `format.delta`** desde el
    // cuerpo. Misma firma, compila, y acá se pone rojo: desaparece el `+` y el
    // menos vuelve a ser guion. Es la única forma de distinguir las dos
    // inyecciones, y el signo es la mitad de lo que este gráfico dice.
    const { container } = render(
      <PlotTornado value={comparada(CUATRO)} family="demanda" format={efecto} />,
    )

    const escritas = cifras(container).map((c) => c.texto)
    expect(escritas).toHaveLength(8)
    expect(escritas).toEqual(
      expect.arrayContaining(['+42K', '+31K', '+22K', '+8K', '−38K', '−29K', '−24K', '−34K']),
    )
    // U+2212 y no el guion del dibujo: la divergencia está declarada en el plot.
    for (const t of escritas) expect(t).toMatch(/^[+−]/)

    // Y el formateador plano —el que el dumbbell recibe— produce otra cosa, que
    // es lo que hace verificable que la inyección sea la correcta.
    expect(plano(42000)).toBe('42K')
    expect(plano(-38000)).not.toContain('−')
  })
})

describe('la cifra cuelga del extremo de su barra', () => {
  it('a 10 px del fin de SU barra, y no alineada en una columna', () => {
    // **Mutación: alinearlas en una columna fija** —`x = w - reserva`, que es lo
    // que hace `PlotBars` y es correcto allá—. Acá rompe la lectura de «hasta
    // dónde llega este efecto». Segunda mutación: el mismo `textAnchor` en los
    // dos lados; la cifra se mete sobre su barra y la x medida deja de cerrar.
    const dos: readonly Item[] = [
      { etiqueta: 'Inversión ±10%', v: 42000, referencia: -38000 },
      { etiqueta: 'Stock crítico', v: 8000, referencia: -34000 },
    ]
    const { container } = render(
      <PlotTornado value={comparada(dos)} family="demanda" format={efecto} />,
    )

    const { deValor, deReferencia } = barras(container)
    const escritas = cifras(container)
    // Dos por fila, en el orden en que el plot las pinta: valor y después
    // referencia.
    expect(escritas).toHaveLength(4)

    for (const [i] of dos.entries()) {
      const derecha = escritas[i * 2]
      const izquierda = escritas[i * 2 + 1]
      const barraDerecha = deValor[i]
      const barraIzquierda = deReferencia[i]

      expect(derecha?.x).toBeCloseTo((barraDerecha?.x ?? 0) + (barraDerecha?.width ?? 0) + GAP, 6)
      expect(derecha?.anchor).toBe('start')
      expect(izquierda?.x).toBeCloseTo((barraIzquierda?.x ?? 0) - GAP, 6)
      expect(izquierda?.anchor).toBe('end')
    }

    // Y las dos de la derecha están en x DISTINTA, porque sus barras miden
    // distinto: es lo que una columna fija aplasta.
    expect(escritas[0]?.x).not.toBeCloseTo(escritas[2]?.x ?? 0, 3)
  })
})

describe('ningún número desnudo', () => {
  it('cada fila trae su rótulo, centrado en el cero y en mayúsculas', () => {
    // **Mutaciones: borrar el rótulo** —quedan ocho cifras sin decir de qué
    // factor son— **o pasarlo a una columna izquierda** tipo `CategoryAxis`, con
    // x ≠ w/2. Las dos rojas.
    const { container } = render(
      <PlotTornado value={comparada(CUATRO)} family="demanda" format={efecto} />,
    )

    const escritos = rotulos(container)
    expect(escritos).toHaveLength(4)
    expect(escritos.map((r) => r.texto)).toEqual([
      'INVERSIÓN ±10%',
      'CONVERSIÓN ±0.1PP',
      'PRECIO ±3%',
      'STOCK CRÍTICO',
    ])
    for (const r of escritos) {
      expect(r.anchor).toBe('middle')
      expect(r.x).toBe(CERO)
    }
  })
})

describe('la franja y su canal', () => {
  it('la barra es 0.55 del paso, va al TOPE, y el último rótulo entra', () => {
    // **Mutación: `bandScale(claves, [0, h], 1 - BAR)` sin el corrimiento** —la
    // forma «natural» de escribirlo—: la barra queda centrada en su franja y el
    // rótulo de la última fila cae exactamente en `y = h`, cortado. Es un defecto
    // que sólo se ve mirando el borde de abajo de un panel.
    const { container } = render(
      <PlotTornado value={comparada(CUATRO)} family="demanda" format={efecto} />,
    )

    const paso = pasoDe(CUATRO)
    const { todas, deValor, deReferencia } = barras(container)
    for (const [i] of CUATRO.entries()) {
      expect(deValor[i]?.y).toBeCloseTo(i * paso, 6)
      expect(deReferencia[i]?.y).toBeCloseTo(i * paso, 6)
      expect(deValor[i]?.height).toBeCloseTo(BAR * paso, 6)
    }
    // `cornerRadius: 2` en los ocho rectángulos del frame.
    for (const b of todas) expect(b.rx).toBe(2)

    const ultimo = rotulos(container)[3]
    expect(ultimo?.y ?? 0).toBeLessThanOrEqual(TEST_SIZE.height - 4)
    // Y el rótulo está DEBAJO de su barra, no encima ni sobre la siguiente.
    expect(ultimo?.y ?? 0).toBeGreaterThan(3 * paso + BAR * paso)
  })
})

describe('el plot no ordena', () => {
  it('se respeta el orden del dato aunque no parezca un tornado', () => {
    // **Mutación: ordenar por amplitud descendente dentro del plot**, que es
    // exactamente lo que hace falta para que se vea como el dibujo. Roja: «el
    // cuerpo ordena y recorta; este archivo no». La autoridad del orden es el
    // `ORDER BY` de la consulta.
    const alRevés: readonly Item[] = [...CUATRO].reverse()
    const { container } = render(
      <PlotTornado value={comparada(alRevés)} family="demanda" format={efecto} />,
    )

    expect(rotulos(container).map((r) => r.texto)).toEqual([
      'STOCK CRÍTICO',
      'PRECIO ±3%',
      'CONVERSIÓN ±0.1PP',
      'INVERSIÓN ±10%',
    ])
  })
})

describe('sin referencia no hay comparación', () => {
  it('la fila se descarta y el conteo lo dice', () => {
    // **Mutación: `i.referencia ?? 0`**, que es el atajo que parece inofensivo:
    // aparece una barra de largo cero pegada al eje —que se lee «el downside es
    // cero», y es mentira—, el conteo pasa a 3 y queda roja.
    const incompleta: readonly Item[] = [
      { etiqueta: 'Inversión ±10%', v: 42000, referencia: -38000 },
      { etiqueta: 'Sin escenario bajo', v: 19000 },
      { etiqueta: 'Stock crítico', v: 8000, referencia: -34000 },
    ]
    render(<PlotTornado value={comparada(incompleta)} family="demanda" format={efecto} />)

    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', '2 factores con su efecto en los dos sentidos')

    const { todas } = barras(svg.parentElement as HTMLElement)
    expect(todas).toHaveLength(4)
    for (const b of todas) expect(b.width).toBeGreaterThan(0)
    expect(rotulos(svg.parentElement as HTMLElement).map((r) => r.texto)).toEqual([
      'INVERSIÓN ±10%',
      'STOCK CRÍTICO',
    ])
  })
})

/* ── Las cuatro que faltaban, y las encontró una mutación cada una ─────────── */

describe('la familia cromática llega por prop', () => {
  it('con otra familia los dos escalones cambian, porque no está cableada', () => {
    // **Mutación que SOBREVIVÍA: `const family = 'demanda'` escrito a mano.** Las
    // siete aserciones de color de arriba pasan `family="demanda"` y ninguna otra,
    // así que cablear justo esa familia se veía idéntico. `design.md` dice que la
    // familia **se lee del catálogo, nunca se elige en el componente**, y lo que lo
    // verifica es renderizar con una familia DISTINTA de la del resto del archivo.
    const { container } = render(
      <PlotTornado value={comparada(CUATRO)} family="inventario" format={efecto} />,
    )

    const { deValor, deReferencia } = barras(container)
    expect(deValor).toHaveLength(4)
    expect(deReferencia).toHaveLength(4)
    for (const b of deValor) expect(b.fill).toBe('var(--color-fam-inventario-1)')
    for (const b of deReferencia) expect(b.fill).toBe('var(--color-fam-inventario-0)')
    // Y el eje cero sigue sin familia: es papel, y una familia nueva no se lo tiñe.
    expect(eje(container).stroke).toBe('var(--color-w5)')
  })
})

describe('la reserva sale de la cifra MÁS LARGA', () => {
  it('no de la cifra del máximo, que es la que parece', () => {
    // **Mutación que SOBREVIVÍA: calcular la reserva sobre el valor de mayor
    // módulo.** En los cuatro fixtures de arriba las dos cuentas dan lo mismo —la
    // cifra más larga es justo la del máximo—, así que la razón escrita en el plot
    // («con “+8K” de tres caracteres y “−34K” de cuatro…») no tenía quien la
    // rompiera. Acá se separan: el máximo es 1M y se escribe `+1M`, tres
    // caracteres, mientras que `−900K` son cinco.
    const abreviada: readonly Item[] = [{ etiqueta: 'Inversión ±10%', v: 1000000, referencia: -900000 }]
    expect(efecto(1000000)).toBe('+1M')
    expect(efecto(-900000)).toBe('−900K')

    const { container } = render(
      <PlotTornado value={comparada(abreviada)} family="demanda" format={efecto} />,
    )

    // El semicanal se calcula con los CINCO caracteres de `−900K`, no con los tres
    // de `+1M`: con la cuenta corta la barra se estira 14.4 px más y la cifra de la
    // fila corta se sale por el borde.
    const largo = medioDe(['+1M', '−900K'])
    const corto = medioDe(['+1M'])
    expect(largo).toBeLessThan(corto)

    const x = escalaX(abreviada, efecto)
    const valor = barras(container).deValor[0]
    const referencia = barras(container).deReferencia[0]
    expect((valor?.x ?? 0) + (valor?.width ?? 0)).toBeCloseTo(CERO + largo, 6)
    expect(referencia?.x).toBeCloseTo(x(-900000), 6)

    // Y la cifra más larga entra: su borde izquierdo queda dentro del canal.
    const izquierda = cifras(container).find((c) => c.texto === '−900K')
    expect(izquierda?.x ?? 0).toBeGreaterThan(MONO * 10 * 5)
  })
})

describe('un payload de puros ceros no se va al borde', () => {
  it('el cero sigue en el centro del canal con amplitud 0', () => {
    // **Mutación que SOBREVIVÍA: `const m = amplitud`, sin el piso de 1.** Es la
    // divergencia 3 que el plot declara y no tenía prueba: con `m = 0` el ancho del
    // dominio es cero, `linearScale` manda TODO a `r0` —el borde izquierdo— y las
    // ocho barras más el eje dejan de coincidir. El eje se dibuja en `w/2` pase lo
    // que pase, así que el síntoma es un eje solo en el centro y la tinta amontonada
    // contra el borde izquierdo.
    const ceros: readonly Item[] = [
      { etiqueta: 'Inversión ±10%', v: 0, referencia: 0 },
      { etiqueta: 'Stock crítico', v: 0, referencia: 0 },
    ]
    const { container } = render(
      <PlotTornado value={comparada(ceros)} family="demanda" format={efecto} />,
    )

    const { todas } = barras(container)
    expect(todas).toHaveLength(4)
    for (const b of todas) {
      // Largo cero —no hay efecto que mostrar— pero PEGADAS AL EJE, que es lo que
      // dice «cero» y no «el mínimo».
      expect(b.width).toBeCloseTo(0, 6)
      expect(Math.abs(b.x - CERO)).toBeLessThan(0.5)
    }
    // Y las cifras cuelgan del eje, no del borde.
    for (const c of cifras(container)) expect(Math.abs(Math.abs(c.x - CERO) - GAP)).toBeLessThan(0.5)
  })
})

describe('un rótulo que no entra se recorta', () => {
  it('se corta a lo que quepa y lo dice con el puntuado', () => {
    // **Mutación que SOBREVIVÍA: pintar `f.k` entero.** Los cuatro rótulos del
    // dibujo son cortos, así que el recorte nunca se ejercía: `charsThatFit(600)`
    // son 83 caracteres. Sin recorte un rótulo largo se sale por los dos lados del
    // panel, porque va centrado en el cero.
    const cap = Math.floor(TEST_SIZE.width / (10 * MONO))
    const largo = 'Inversión en medios pagos sobre la ventana completa del trimestre anterior y el actual'
    expect(largo.length).toBeGreaterThan(cap)

    const { container } = render(
      <PlotTornado
        value={comparada([{ etiqueta: largo, v: 42000, referencia: -38000 }])}
        family="demanda"
        format={efecto}
      />,
    )

    const escrito = rotulos(container)[0]?.texto ?? ''
    expect(escrito).toHaveLength(cap)
    expect(escrito.endsWith('…')).toBe(true)
    expect(escrito.slice(0, -1)).toBe(largo.slice(0, cap - 1).toUpperCase())
  })
})
