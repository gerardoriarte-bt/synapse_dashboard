// @vitest-environment jsdom

/** Un gráfico que el cuerpo no dibuja SE DECLARA · 2026-09-29
 *
 *  **El defecto que esto cierra, medido el 2026-09-29:** `BodyProps.grafico`
 *  declara la regla —«uno que el cuerpo no sepa dibujar no cae al de por
 *  defecto: se declara»— y sólo `SeriesBody` y `ForecastBody` la cumplían. Los
 *  otros nueve cuerpos **ni siquiera desestructuraban `grafico`**, así que un
 *  panel que pedía «dona» sobre una métrica `categorica` recibía BARRAS, en
 *  silencio.
 *
 *  **Cada prueba afirma las DOS mitades**, y la segunda es la que vale: que
 *  aparezca `UnknownPlotState` y que **NO** aparezca el dibujo por defecto. Con
 *  sólo la primera, un cuerpo que pintara el estado encima del plot pasaría
 *  igual; y si se borra el guardia del componente, el dibujo por defecto vuelve
 *  y la prueba se pone roja — que es el punto.
 *
 *  **El id elegido en cada caso es CONOCIDO** —de los 49 de §5— y no una cadena
 *  inventada: lo que se prueba es el hueco entre el repertorio y lo construido,
 *  no el estrechamiento del enum, que ya lo hace el adaptador.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BarsBody } from '@/render/bodies/BarsBody'
import { CompositionBody } from '@/render/bodies/CompositionBody'
import { DistributionBody } from '@/render/bodies/DistributionBody'
import { GaugeBody } from '@/render/bodies/GaugeBody'
import { KpiBody } from '@/render/bodies/KpiBody'
import { ListBody } from '@/render/bodies/ListBody'
import { ProseBody } from '@/render/bodies/ProseBody'
import { RecoBody } from '@/render/bodies/RecoBody'
import { SeriesBody } from '@/render/bodies/SeriesBody'
import { TableBody } from '@/render/bodies/TableBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const base = {
  span: { colStart: 1, colSpan: 5, rowSpan: 4 },
  family: 'inventario',
  metric: 'Unidades',
  format,
} as const

/** Los fixtures se escriben desde el contrato y no de memoria: las claves son
 *  las del yaml —`items`/`posicion`, `partes`/`porcentaje`, `columnas` con
 *  `titulo` y `numerica`—. El `as unknown as` es el idioma del resto de
 *  `tests/render/`: estrecha la unión sin repetir los campos opcionales. */
const valor = <F extends Value['forma']>(v: unknown) => v as unknown as Extract<Value, { forma: F }>

const CATEGORICA = valor<'categorica'>({
  forma: 'categorica',
  items: [
    { etiqueta: 'Norte', v: 30 },
    { etiqueta: 'Sur', v: 12 },
  ],
})

const RANKING = valor<'ranking'>({
  forma: 'ranking',
  items: [
    { etiqueta: 'Nike Air', v: 42, posicion: 1 },
    { etiqueta: 'Adidas', v: 18, posicion: 2 },
  ],
})

const COMPOSICION = valor<'composicion'>({
  forma: 'composicion',
  partes: [
    { etiqueta: 'Retail', v: 70, porcentaje: 70 },
    { etiqueta: 'Mayoreo', v: 30, porcentaje: 30 },
  ],
})

const DISTRIBUCION = valor<'distribucion'>({
  forma: 'distribucion',
  cortes: [
    { etiqueta: 'p25', v: 10 },
    { etiqueta: 'p50', v: 22 },
    { etiqueta: 'p75', v: 41 },
  ],
})

const ESCALAR = valor<'escalar'>({ forma: 'escalar', v: 72 })

const TABULAR = valor<'tabular'>({
  forma: 'tabular',
  columnas: [
    { clave: 'canal', titulo: 'Canal', numerica: false },
    { clave: 'inversion', titulo: 'Inversión', numerica: true },
  ],
  filas: [{ canal: 'Meta', inversion: 412000 }],
})

const PROSA = valor<'prosa'>({
  forma: 'prosa',
  titular: 'El trimestre cerró por encima del plan',
  pilares: [{ label: 'Ingresos', valor: 'USD 4.28M', ref: 'r1' }],
})

const SERIE = valor<'serieTemporal'>({
  forma: 'serieTemporal',
  puntos: [
    { t: 'S1', v: 10 },
    { t: 'S2', v: 20 },
  ],
})

describe('cada cuerpo declara el gráfico que no dibuja · no lo sustituye', () => {
  it('BarsBody · `bump` sobre un `ranking` NO se sirve como barras', () => {
    // ── TERCER ID EN UN DÍA, Y ESO ES LO QUE HAY QUE LEER ─────────────────
    //
    // Fue `donut`, después `treemap`, y ahora `bump`. **Las dos veces la prueba
    // se rompió porque el id que usaba pasó a dibujarse**, que es exactamente lo
    // que tiene que pasar: un caso negativo cuyo ejemplo se vuelve positivo
    // queda verificando algo que ya no existe, y la puerta lo atrapó las dos
    // veces en rojo en vez de dejarlo pasar en verde.
    //
    // **De `categorica` ya no queda ninguno**: los siete que §5 le da —`bars`,
    // `columns`, `lollipop`, `donut`, `radial`, `pareto` y `treemap`— se
    // dibujan. Por eso el caso se mudó a la OTRA forma de este cuerpo. `bump` es
    // de `ranking` según §5, **lo dibuja `SeriesBody` y no éste**, así que un
    // layout lo puede pedir legítimamente sobre un ranking y acá no hay con qué.
    //
    // El día que no quede ningún id sin dibujar en ninguna forma de este cuerpo,
    // esta prueba no se borra: se convierte en la de un id inexistente, que es
    // el otro caso que `UnknownPlotState` cubre.
    render(<BarsBody {...base} value={RANKING} params={{}} grafico="bump" />)

    expect(screen.getByText(/bump/)).toBeVisible()
    // Exacto y no `/categorías/`: `PlotLollipop` y `PlotPareto` también nombran
    // «categorías», así que el patrón laxo dejaría de distinguir cuál se montó.
    expect(screen.queryByRole('img', { name: '3 categorías' })).toBeNull()
  })

  it('CompositionBody · `waterfall` no se sirve como barra apilada', () => {
    // Una cascada y un apilado al 100% reparten distinto: la cascada muestra
    // el saldo acumulado y el apilado, la proporción sobre el total.
    render(<CompositionBody {...base} value={COMPOSICION} params={{}} grafico="waterfall" />)

    expect(screen.getByText(/waterfall/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /partes/ })).toBeNull()
    // Y el cuerpo entero se reemplaza, no sólo el plot: el total repartido es
    // parte del dibujo, no del shell.
    expect(screen.queryByText(/Total repartido/i)).toBeNull()
  })

  it('DistributionBody · `box` no se sirve como los cortes sueltos', () => {
    // `box` come `cortes` —a diferencia de `scatter`, `bubble` y `cuadrantes`,
    // que piden pares (x, y) que la forma no lleva—, así que es el id que un
    // layout razonable pediría y el que más engañaría al caer al de por defecto.
    render(<DistributionBody {...base} value={DISTRIBUCION} params={{}} grafico="box" />)

    expect(screen.getByText(/box/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /cortes/ })).toBeNull()
  })

  it('GaugeBody · `spark` no se sirve como el arco', () => {
    // Fue `bullet`, después `rings`, y los dos pasaron a dibujarse en este mismo
    // cuerpo. **Y el de `rings` se escribió sobre una premisa dada vuelta**: que
    // «`PlotRings` pide una LISTA y `ValorEscalar` es `{ forma, v }`, no hay de
    // dónde sacar los otros». Una lista de UNO sale de un escalar sin inventar
    // nada, y la cabecera del propio plot ya lo decía —«hoy el cuerpo le pasa un
    // elemento y se ve un anillo solo, que es lo honesto»—. Lo que no se puede
    // es dibujar los tres del `.pen`, que es otra cosa.
    //
    // Queda `spark`, que §5 le da a `escalar` y **dibuja `SeriesBody`**: acá no
    // hay con qué, y sobre un escalar suelto tampoco habría puntos.
    render(<GaugeBody {...base} value={ESCALAR} params={{ maximo: 100 }} grafico="spark" />)

    expect(screen.getByText(/spark/)).toBeVisible()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('KpiBody · `spark` no se sirve como la cifra sola', () => {
    // Una micro tendencia dice si viene subiendo; la cifra sola no. Servirla en
    // su lugar contesta otra pregunta con cara de haber contestado la que se
    // hizo.
    const { container } = render(
      <KpiBody {...base} value={ESCALAR} params={{}} grafico="spark" />,
    )

    expect(screen.getByText(/spark/)).toBeVisible()
    expect(container.textContent).not.toContain('72')
  })

  it('ListBody · `bump` no se sirve como la lista', () => {
    render(<ListBody {...base} value={RANKING} params={{}} grafico="bump" />)

    expect(screen.getByText(/bump/)).toBeVisible()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('TableBody · `list` no se sirve como la tabla', () => {
    // `list` es un id conocido —de los seis que no son plots— y sirve a
    // `ranking`, no a `tabular`. Un panel que lo pida acá está mal compuesto, y
    // eso se dice.
    render(<TableBody {...base} value={TABULAR} params={{}} grafico="list" />)

    expect(screen.getByText(/list/)).toBeVisible()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('ProseBody · `reco` no se sirve como prosa', () => {
    // Comparten forma y no anatomía. Sin esto, un panel de recomendaciones se
    // leería como un titular y **los botones desaparecerían sin avisar**.
    render(<ProseBody {...base} value={PROSA} params={{}} grafico="reco" />)

    expect(screen.getByText(/reco/)).toBeVisible()
    expect(screen.queryByText(/por encima del plan/)).toBeNull()
  })

  it('RecoBody · `prose` no se sirve como recomendaciones', () => {
    const actions = { porRef: { r1: { accionableId: 'a1', puedeResponder: true } } }
    render(
      <RecoBody
        {...base}
        value={PROSA}
        params={{}}
        actions={actions as never}
        grafico="prose"
      />,
    )

    expect(screen.getByText(/prose/)).toBeVisible()
    expect(screen.queryByRole('button', { name: /Aprobar/ })).toBeNull()
  })

  it('SeriesBody · `control` no se sirve como una línea pelada', () => {
    // **El segundo defecto del 2026-09-29.** `PlotControl` existe y lo usa
    // `ForecastBody`; un `serieTemporal` que pedía `control` dibujaba la serie
    // sin límites y sin marcar el punto que se sale — o sea, sin lo único que
    // una carta de control agrega.
    render(<SeriesBody {...base} value={SERIE} params={{}} grafico="control" />)

    expect(screen.getByText(/control/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /series/ })).toBeNull()
  })
})

describe('AUSENTE sigue significando el gráfico por defecto', () => {
  // **Los doce paneles publicados traen `chart: ''`**, que `adapt.ts` convierte
  // en ausencia. Si esto fallara, cerrar el defecto habría apagado la consola
  // entera — que es el riesgo real de una lista de permitidos.
  it('los nueve cuerpos sin `grafico` dibujan lo de siempre', () => {
    const { container: bars } = render(<BarsBody {...base} value={CATEGORICA} params={{}} />)
    expect(bars.textContent).not.toContain('todavía no lo dibuja')

    render(<CompositionBody {...base} value={COMPOSICION} params={{}} />)
    expect(screen.getByText(/Total repartido/i)).toBeVisible()

    render(<DistributionBody {...base} value={DISTRIBUCION} params={{}} />)
    render(<GaugeBody {...base} value={ESCALAR} params={{ maximo: 100 }} />)

    const { container: kpi } = render(<KpiBody {...base} value={ESCALAR} params={{}} />)
    expect(kpi.textContent).toContain('72')

    render(<ListBody {...base} value={RANKING} params={{}} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    render(<TableBody {...base} value={TABULAR} params={{}} />)
    expect(screen.getByRole('table')).toBeVisible()

    render(<ProseBody {...base} value={PROSA} params={{}} />)
    expect(screen.getByText(/por encima del plan/)).toBeVisible()

    render(<SeriesBody {...base} value={SERIE} params={{}} />)

    // Ninguno de los nueve cayó en el estado.
    expect(screen.queryByText(/todavía no lo dibuja/)).toBeNull()
  })
})
