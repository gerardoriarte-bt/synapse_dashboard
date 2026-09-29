// @vitest-environment jsdom

/** Cada gráfico CABLEADO monta SU dibujo · 2026-09-29 (tarde)
 *
 *  ── LA PRUEBA QUE EL QA DE ESTE LOTE PIDIÓ POR ESCRITO ──────────────────────
 *
 *  Los trece plots del lote llegaron con su batería propia, y las trece **rinden
 *  el plot directo** —`render(<PlotBullet … />)`—. Eso verifica el dibujo y deja
 *  sin cubrir lo único que el cableado puede romper: que el id **llegue al
 *  dibujo que le toca**. El QA del bullet lo dijo con esas palabras —«no se
 *  cierra el gráfico sin ella»— y el de `smallmult` lo encontró al revés: su
 *  plot no lo importaba nadie y sus dos pruebas de cuerpo **pasaban por
 *  ausencia**.
 *
 *  **Y es el modo de falla que este repositorio ya tuvo cuatro veces.** Agregar
 *  el id a `DIBUJA` y olvidar el despacho deja el panel dibujando el gráfico por
 *  defecto: compila, pasa el lint, y se ve perfecto. El spread condicional de
 *  JSX —obligatorio con `exactOptionalPropertyTypes`— apaga el chequeo de props
 *  en exceso, así que una prop mal nombrada tampoco la ve el compilador.
 *
 *  ── POR QUÉ LA ASERCIÓN ES EL NOMBRE ACCESIBLE ──────────────────────────────
 *
 *  Es la misma decisión que `graficoViaja.test.tsx`: se afirma sobre el DIBUJO y
 *  no sobre la prop. Cada plot del lote eligió un `aria-label` distinguible a
 *  propósito —`PlotBullet` lo dice en su comentario: «distinto del de
 *  `PlotGauge` para que una prueba pueda afirmar CUÁL de las dos geometrías se
 *  montó»— así que el rótulo alcanza para separar las once ramas sin un atributo
 *  de prueba.
 *
 *  **Cada caso afirma las dos mitades**: que aparezca el nombre del plot pedido
 *  y que NO aparezca el del gráfico por defecto del cuerpo. Con sólo la primera,
 *  un cuerpo que montara los dos pasaría igual.
 *
 *  ── LA OTRA MITAD DEL CAMINO YA ESTÁ CUBIERTA ───────────────────────────────
 *
 *  De `cable → adapt.ts → Console → PanelInGrid → Panel → cuerpo` se ocupa
 *  `tests/surfaces/console/graficoViaja.test.tsx`, que verifica el MECANISMO —el
 *  `chart` del servicio llegando al cuerpo y cambiando el dibujo— con
 *  `stackarea`. Acá se verifica el último salto para los nueve ids nuevos, que
 *  es el que el cableado agregó.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BarsBody } from '@/render/bodies/BarsBody'
import { GaugeBody } from '@/render/bodies/GaugeBody'
import { SeriesBody } from '@/render/bodies/SeriesBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const base = {
  span: { colStart: 1, colSpan: 5, rowSpan: 4 },
  family: 'inventario',
  metric: 'Unidades',
  format,
} as const

/** Mismo idioma que `graficoDeclarado.test.tsx`: estrecha la unión sin repetir
 *  los opcionales. Las claves son las del yaml y no de memoria. */
const valor = <F extends Value['forma']>(v: unknown) => v as unknown as Extract<Value, { forma: F }>

const CATEGORICA = valor<'categorica'>({
  forma: 'categorica',
  items: [
    { etiqueta: 'Norte', v: 30 },
    { etiqueta: 'Sur', v: 12 },
  ],
})

/** Tres ítems, para que `tope: 1` tenga algo que recortar. Suman 60. */
const TRES = valor<'categorica'>({
  forma: 'categorica',
  items: [
    { etiqueta: 'Norte', v: 30 },
    { etiqueta: 'Sur', v: 20 },
    { etiqueta: 'Centro', v: 10 },
  ],
})

const RANKING = valor<'ranking'>({
  forma: 'ranking',
  items: [
    { etiqueta: 'Nike Air', v: 42, posicion: 1 },
    { etiqueta: 'Adidas', v: 18, posicion: 2 },
    { etiqueta: 'Puma', v: 9, posicion: 3 },
  ],
})

const ESCALAR = valor<'escalar'>({ forma: 'escalar', v: 72 })

const SERIE = valor<'serieTemporal'>({
  forma: 'serieTemporal',
  puntos: [
    { t: 'S1', v: 10 },
    { t: 'S2', v: 20 },
  ],
})

const MULTIPLES = valor<'seriesMultiples'>({
  forma: 'seriesMultiples',
  series: [
    {
      etiqueta: 'Meta',
      puntos: [
        { t: 'S1', v: 10 },
        { t: 'S2', v: 40 },
      ],
    },
    {
      etiqueta: 'Google',
      puntos: [
        { t: 'S1', v: 30 },
        { t: 'S2', v: 20 },
      ],
    },
  ],
})

describe('GaugeBody · el id elige entre el arco y la barra', () => {
  it('`bullet` monta la BARRA contra el objetivo, no el arco', () => {
    render(<GaugeBody {...base} value={ESCALAR} params={{ maximo: 100 }} grafico="bullet" />)

    expect(screen.getByRole('img', { name: 'Avance contra objetivo · 72 de 100' })).toBeVisible()
    // El nombre de `PlotGauge`, exacto. Si el despacho se olvidara, el arco
    // seguiría ahí y esto lo encontraría.
    expect(screen.queryByRole('img', { name: '72 de 100' })).toBeNull()
  })

  it('`maximo` es el objetivo del bullet, y sin él NINGUNO de los dos se dibuja', () => {
    // La caída es una sola para los dos gráficos, y es lo correcto: un avance
    // contra objetivo sin objetivo es la misma cifra desnuda que un arco sin
    // máximo. §1.3 no deja inventar el denominador.
    render(<GaugeBody {...base} value={ESCALAR} params={{}} grafico="bullet" />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText(/Sin máximo declarado/)).toBeVisible()
  })

  it('el shell no se va con el dibujo · la línea de BASE queda en los dos', () => {
    // «Un estado reemplaza el cuerpo, nunca el shell» tiene su equivalente acá:
    // cambiar el DIBUJO no puede borrar el denominador, que es lo que hace
    // legible la cifra.
    render(<GaugeBody {...base} value={ESCALAR} params={{ maximo: 100 }} grafico="bullet" />)
    expect(screen.getByText('Sobre 100')).toBeVisible()
  })
})

describe('SeriesBody · los tres ids nuevos montan su propio dibujo', () => {
  it('`spark` monta la MICRO TENDENCIA, no el área', () => {
    render(<SeriesBody {...base} value={SERIE} params={{}} grafico="spark" />)

    expect(
      screen.getByRole('img', { name: 'Micro tendencia · 2 puntos · último 20' }),
    ).toBeVisible()
    // El nombre de `PlotSeries` con una sola serie.
    expect(screen.queryByRole('img', { name: '1 series' })).toBeNull()
  })

  it('`bump` monta el RANKING por puesto, no las líneas', () => {
    render(<SeriesBody {...base} value={MULTIPLES} params={{}} grafico="bump" />)

    expect(screen.getByRole('img', { name: 'Ranking de 2 series en 2 períodos' })).toBeVisible()
    expect(screen.queryByRole('img', { name: '2 series' })).toBeNull()
  })

  it('`slope` monta las DOS COLUMNAS, no las líneas', () => {
    render(<SeriesBody {...base} value={MULTIPLES} params={{}} grafico="slope" />)

    expect(screen.getByRole('img', { name: '2 series · S1 → S2' })).toBeVisible()
    expect(screen.queryByRole('img', { name: '2 series' })).toBeNull()
  })

  it('`bump` NO recibe las series normalizadas · un ranking se compara entre series', () => {
    // **Es la decisión del cableado y la única que no se lee del plot.**
    // `base100` divide cada serie por su PROPIO primer punto: con eso las dos
    // empatan en 100 en `S1` y el orden del primer período deja de ser el del
    // dato. Acá Google arranca por encima de Meta (30 contra 10), así que si la
    // normalización llegara al plot el puesto 1 de `S1` cambiaría de dueño.
    //
    // Se afirma sobre el DIBUJO y no sobre la prop: la línea de cada serie
    // arranca en la `y` de su puesto, y el rótulo de puesto 1 está en el riel de
    // arriba. Con el empate, las dos arrancarían a la misma altura.
    const { container } = render(
      <SeriesBody
        {...base}
        value={MULTIPLES}
        params={{ normalizacion: 'base100' }}
        grafico="bump"
      />,
    )

    // `Array.from` y no un spread: el `lib` de `tsconfig.test.json` no le da
    // iterador a `NodeListOf`, y el spread rompe `typecheck` sin romper la
    // prueba — que es la mitad silenciosa de la puerta.
    const trazos = Array.from(container.querySelectorAll('path')).filter(
      (p) => p.getAttribute('fill') === 'none',
    )
    expect(trazos).toHaveLength(2)

    const primeraY = (p: Element) => {
      const d = p.getAttribute('d') ?? ''
      const m = /^M\s*[\d.-]+[ ,]([\d.-]+)/.exec(d)
      return Number(m?.[1] ?? Number.NaN)
    }

    const [meta, google] = trazos.map(primeraY)
    expect(meta).not.toBeNaN()
    expect(google).not.toBeNaN()
    // Google vale más en `S1`, así que sale ARRIBA —el #1 va arriba— y Meta
    // debajo. Empatadas en 100 las dos, esto sería una igualdad.
    expect(google ?? Number.NaN).toBeLessThan(meta ?? Number.NaN)
  })
})

describe('BarsBody · los cinco ids nuevos montan su propio dibujo', () => {
  it('`columns` monta las COLUMNAS verticales, no las barras', () => {
    render(<BarsBody {...base} value={CATEGORICA} params={{}} grafico="columns" />)

    expect(screen.getByRole('img', { name: '2 columnas' })).toBeVisible()
    expect(screen.queryByRole('img', { name: '2 categorías' })).toBeNull()
  })

  it('`lollipop` monta el TALLO con su marca, no las barras', () => {
    render(<BarsBody {...base} value={CATEGORICA} params={{}} grafico="lollipop" />)

    expect(screen.getByRole('img', { name: '2 categorías con marca y cifra' })).toBeVisible()
    expect(screen.queryByRole('img', { name: '2 categorías' })).toBeNull()
  })

  it('`radial` monta las BARRAS RADIALES, no las barras', () => {
    render(<BarsBody {...base} value={CATEGORICA} params={{}} grafico="radial" />)

    expect(screen.getByRole('img', { name: '2 barras radiales' })).toBeVisible()
    expect(screen.queryByRole('img', { name: '2 categorías' })).toBeNull()
  })

  it('`pareto` monta las barras CON su curva de acumulado', () => {
    render(<BarsBody {...base} value={TRES} params={{}} grafico="pareto" />)

    expect(screen.getByRole('img', { name: 'Pareto · 3 categorías' })).toBeVisible()
    expect(screen.queryByRole('img', { name: '3 categorías' })).toBeNull()
  })

  it('`donut` monta la DONA y su rótulo de centro sale del catálogo', () => {
    // El `totalLabel` es obligatorio en `PlotDonut` —«ningún número desnudo»
    // como error de compilación— y el cuerpo NO lo escribe: cae al nombre de la
    // métrica, que es copy del catálogo.
    render(<BarsBody {...base} value={CATEGORICA} params={{}} grafico="donut" />)

    expect(
      screen.getByRole('img', { name: 'UNIDADES 42 repartido en 2 partes' }),
    ).toBeVisible()
    expect(screen.queryByRole('img', { name: '2 categorías' })).toBeNull()
  })

  it('el rótulo del centro lo gana `presentation.label`, que lo redacta el backend', () => {
    render(
      <BarsBody
        {...base}
        value={CATEGORICA}
        params={{}}
        grafico="donut"
        presentation={{ label: 'Inversión del mes' } as never}
      />,
    )

    expect(
      screen.getByRole('img', { name: 'INVERSIÓN DEL MES 42 repartido en 2 partes' }),
    ).toBeVisible()
  })

  it('`lollipop` también sirve a `ranking`, que es la otra forma que §5 le da', () => {
    render(<BarsBody {...base} value={RANKING} params={{}} grafico="lollipop" />)

    expect(screen.getByRole('img', { name: '3 categorías con marca y cifra' })).toBeVisible()
  })
})

describe('`tope` NO recorta la dona ni el pareto · las dos derivan del total', () => {
  it('la dona suma el centro sobre la lista ENTERA aunque haya `tope`', () => {
    // Con `tope: 1` aplicado antes, el centro diría 30 y lo presentaría como el
    // total: el defecto que `CompositionBody` ya tiene registrado por escrito.
    render(<BarsBody {...base} value={TRES} params={{ tope: 1 }} grafico="donut" />)

    expect(
      screen.getByRole('img', { name: 'UNIDADES 60 repartido en 3 partes' }),
    ).toBeVisible()
  })

  it('el pareto cierra su curva sobre todas las causas aunque haya `tope`', () => {
    // Recortar a una y dejar que la curva llegue al 100 % afirma que la causa
    // mostrada es la única — que es justo lo que un pareto no puede afirmar.
    render(<BarsBody {...base} value={TRES} params={{ tope: 1 }} grafico="pareto" />)

    expect(screen.getByRole('img', { name: 'Pareto · 3 categorías' })).toBeVisible()
  })

  it('y `tope` SÍ recorta los otros cuatro · no es una excepción general', () => {
    // La prueba que impide que «no recortar» se generalice sin que nadie lo
    // note: si alguien mueve el `trimmed` de estas ramas a `sorted`, esto se
    // pone rojo.
    render(<BarsBody {...base} value={TRES} params={{ tope: 2 }} grafico="columns" />)
    expect(screen.getByRole('img', { name: '2 columnas' })).toBeVisible()
  })
})

// ── LOS CUATRO QUE EL LOTE DEJÓ SIN CABLEAR · 2026-09-29 ─────────────────────
//
// Los cuatro llegaron con `aprobado: false` y **ninguno por un defecto del
// componente**: los QA de `treemap` y `combo` lo dicen con esas palabras —«no
// encontré ningún defecto en el componente»— y los cuatro cerraron sus huecos
// con pruebas propias antes de firmar. Lo que faltaba era esto: el despacho.
//
// **`smallmult` es el que enseña.** Su QA encontró que `grep -rn PlotSmallMult
// src/` devolvía una sola línea y era un COMENTARIO, así que sus dos pruebas de
// cuerpo pasaban **por ausencia**: afirmaban que el cuerpo no lo montaba, y eso
// era cierto porque no existía la rama. Una prueba que pasa porque el código no
// está no distingue «correcto» de «sin construir».
describe('los cuatro que faltaban · el despacho es lo único que les faltaba', () => {
  it('`treemap` monta el MOSAICO, no las barras', () => {
    render(<BarsBody {...base} value={TRES} params={{}} grafico="treemap" />)

    // **Nombre exacto y no `/categorías/`.** `PlotTreemap` dice «3 categorías en
    // mosaico» y `PlotBars` «3 categorías»: un patrón laxo matchea los dos y
    // deja de distinguir cuál se montó, que es el único punto de esta prueba.
    expect(screen.getByRole('img', { name: '3 categorías en mosaico' })).toBeVisible()
    expect(screen.queryByRole('img', { name: '3 categorías' })).toBeNull()
  })

  it('`treemap` recibe la lista SIN recortar · su cuota sale del total', () => {
    // Misma razón que la dona y el pareto: deriva `v / Σv`. Con `tope` aplicado
    // antes, cada porcentaje se calcularía contra un total que no es el total y
    // la suma seguiría dando 100 % — impecable y falso.
    render(<BarsBody {...base} value={TRES} params={{ tope: 1 }} grafico="treemap" />)

    expect(screen.getByRole('img', { name: '3 categorías en mosaico' })).toBeVisible()
  })

  it('`combo` monta el COMBINADO y reparte los roles por ORDEN del payload', () => {
    render(<SeriesBody {...base} value={MULTIPLES} params={{}} grafico="combo" />)

    // La primera del payload va en columnas y la segunda en la línea. El nombre
    // accesible lleva las dos etiquetas, así que esto afirma el reparto y no
    // sólo que el plot se montó.
    expect(
      screen.getByRole('img', { name: 'Combinado · Meta en columnas y Google en línea' }),
    ).toBeVisible()
    expect(screen.queryByRole('img', { name: '2 series' })).toBeNull()
  })

  it('`combo` con UNA serie no cae a la línea · dice qué falta', () => {
    // Un combinado de una serie es una serie, y pintarla como si fuera un
    // combinado es la sustitución silenciosa con otra cara: acá el id SÍ se sabe
    // dibujar y lo que falta es el dato, así que el estado es `EmptyState` y no
    // `UnknownPlotState`.
    const una = valor<'seriesMultiples'>({
      forma: 'seriesMultiples',
      series: [{ etiqueta: 'Meta', puntos: [{ t: 'S1', v: 10 }] }],
    })
    render(<SeriesBody {...base} value={una} params={{}} grafico="combo" />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText(/necesita dos series y llegó una/)).toBeVisible()
  })

  it('`smallmult` monta las DIVISIONES, no las líneas', () => {
    render(<SeriesBody {...base} value={MULTIPLES} params={{}} grafico="smallmult" />)

    expect(screen.getByRole('img', { name: '2 divisiones' })).toBeVisible()
    expect(screen.queryByRole('img', { name: '2 series' })).toBeNull()
  })

  it('`rings` monta UN anillo desde el escalar, con su objetivo', () => {
    // La cabecera de `PlotRings` lo dejó resuelto: recibe una lista porque el
    // `.pen` dibuja tres, y un panel se ancla a UN `metricId`. Una lista de uno
    // se construye desde un escalar sin inventar nada — que es por qué esto se
    // cablea en vez de quedar como propuesta de spec.
    render(<GaugeBody {...base} value={ESCALAR} params={{ maximo: 100 }} grafico="rings" />)

    expect(screen.getByRole('img', { name: 'UNIDADES 72% de su objetivo' })).toBeVisible()
    // El nombre de `PlotGauge`, exacto: si el despacho se olvidara, el arco
    // seguiría montándose y el anillo no.
    expect(screen.queryByRole('img', { name: '72 de 100' })).toBeNull()
  })

  it('el shell tampoco se va con el anillo · la línea de BASE queda', () => {
    render(<GaugeBody {...base} value={ESCALAR} params={{ maximo: 100 }} grafico="rings" />)
    expect(screen.getByText('Sobre 100')).toBeVisible()
  })
})
