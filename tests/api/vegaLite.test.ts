/** El gráfico del agente a nuestra forma de valor · 2026-10-07
 *
 *  **Los specs tienen la forma de Vega-Lite que emite `data_to_chart`**: marca,
 *  `encoding` con `field` y `type`, y los datos inline en `data.values`. Las
 *  claves en MAYÚSCULAS son las de Snowflake, y los números como texto son los
 *  de su SQL API — los dos casos que un spec escrito a mano olvidaría.
 *
 *  Lo que más importa probar es lo que NO se dibuja como gráfico: desde el
 *  2026-10-10 se muestra como tabla con su razón, en vez de desaparecer.
 */
import { describe, expect, it } from 'vitest'
import { deVegaLite } from '@/api/vegaLite'
import { adaptValue } from '@/api/adapt'

const linea = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  title: 'Ingresos por mes',
  mark: { type: 'line', color: '#E11A2B' },
  encoding: {
    x: { field: 'MES', type: 'temporal' },
    y: { field: 'INGRESOS', type: 'quantitative' },
  },
  data: {
    values: [
      { MES: '2026-07-01', INGRESOS: '1200.5' },
      { MES: '2026-08-01', INGRESOS: 1350 },
      { MES: '2026-09-01', INGRESOS: 1410.25 },
    ],
  },
}

describe('lo que se traduce', () => {
  it('una línea es una serie temporal, dibujada con `series`', () => {
    const g = deVegaLite(linea)
    expect(g).toEqual({
      tipoDePanel: 'series',
      titulo: 'Ingresos por mes',
      ejes: { medida: 'INGRESOS', dimension: 'MES', serie: null, dimensionEsFecha: true },
      valor: {
        shape: 'time_series',
        points: [
          { t: '2026-07-01', v: 1200.5 },
          { t: '2026-08-01', v: 1350 },
          { t: '2026-09-01', v: 1410.25 },
        ],
      },
    })
  })

  it('el spec llega como TEXTO desde el backend y se lee igual', () => {
    expect(deVegaLite(JSON.stringify(linea))?.tipoDePanel).toBe('series')
  })

  it('el resultado pasa por `adaptValue` · se valida con la regla de todos', () => {
    const g = deVegaLite(linea)
    const adaptado = adaptValue(g?.valor)
    expect(adaptado).toMatchObject({ ok: true, valor: { forma: 'serieTemporal' } })
  })

  it('los TÍTULOS de los ejes viajan · eran lo único que decía la unidad', () => {
    // Se descartaban hasta el 2026-10-10: un eje decía «1.5M» y no de qué.
    const g = deVegaLite({
      ...linea,
      encoding: {
        x: { field: 'MES', type: 'temporal', title: 'Mes' },
        y: { field: 'INGRESOS', type: 'quantitative', axis: { title: 'Ingresos (USD)' } },
      },
    })
    expect(g?.ejes).toEqual({ medida: 'Ingresos (USD)', dimension: 'Mes', serie: null, dimensionEsFecha: true })
  })

  it('una línea con color es multiserie, en el orden en que el agente las listó', () => {
    const g = deVegaLite({
      mark: 'line',
      encoding: {
        x: { field: 'MES', type: 'temporal', timeUnit: 'yearmonth' },
        y: { field: 'V', type: 'quantitative' },
        color: { field: 'CANAL', type: 'nominal', title: 'Canal' },
      },
      data: {
        values: [
          { MES: '2026-08-01', V: 1, CANAL: 'Web' },
          { MES: '2026-08-01', V: 2, CANAL: 'App' },
          { MES: '2026-09-01', V: 3, CANAL: 'Web' },
          { MES: '2026-09-01', V: 4, CANAL: 'App' },
        ],
      },
    })
    expect(g?.grafico).toBe('multiline')
    expect(g?.ejes.serie).toBe('Canal')
    expect(g?.valor).toEqual({
      shape: 'multi_series',
      series: [
        { label: 'Web', points: [{ t: '2026-08-01', v: 1 }, { t: '2026-09-01', v: 3 }] },
        { label: 'App', points: [{ t: '2026-08-01', v: 2 }, { t: '2026-09-01', v: 4 }] },
      ],
    })
  })

  it('una barra horizontal —la medida en `x`— es la misma categórica, en `bars`', () => {
    const g = deVegaLite({
      mark: 'bar',
      encoding: {
        y: { field: 'CANAL', type: 'nominal' },
        x: { field: 'ROAS', type: 'quantitative' },
      },
      data: {
        values: [
          { CANAL: 'Meta', ROAS: 4.2 },
          { CANAL: 'Google', ROAS: 3.1 },
        ],
      },
    })
    expect(g).toEqual({
      tipoDePanel: 'bars',
      grafico: 'bars',
      titulo: null,
      ejes: { medida: 'ROAS', dimension: 'CANAL', serie: null, dimensionEsFecha: false },
      valor: {
        shape: 'categorical',
        items: [
          { label: 'Meta', v: 4.2 },
          { label: 'Google', v: 3.1 },
        ],
      },
    })
  })

  it('una barra vertical son COLUMNAS · la orientación es la del agente', () => {
    const g = deVegaLite({
      mark: 'bar',
      encoding: { x: { field: 'MES', type: 'temporal' }, y: { field: 'V', type: 'quantitative' } },
      data: { values: [{ MES: '2026-08-01', V: 1 }, { MES: '2026-09-01', V: 2 }] },
    })
    expect(g?.grafico).toBe('columns')
    expect(g?.ejes.dimensionEsFecha).toBe(true)
  })

  it('un ÁREA es un área, y con color se apila · la marca manda', () => {
    const sola = deVegaLite({ ...linea, mark: 'area' })
    expect(sola?.grafico).toBe('area')
    const apilada = deVegaLite({
      mark: 'area',
      encoding: {
        x: { field: 'MES', type: 'temporal' },
        y: { field: 'V', type: 'quantitative' },
        color: { field: 'C', type: 'nominal' },
      },
      data: { values: [{ MES: '2026-08-01', V: 1, C: 'a' }, { MES: '2026-08-01', V: 2, C: 'b' }] },
    })
    expect(apilada?.grafico).toBe('stackarea')
  })

  it('un mapa de calor —`rect` con la cifra en el color— es una matriz', () => {
    const g = deVegaLite({
      mark: 'rect',
      encoding: {
        x: { field: 'MES', type: 'ordinal' },
        y: { field: 'CANAL', type: 'nominal' },
        color: { field: 'V', type: 'quantitative' },
      },
      data: {
        values: [
          { MES: 'ago', CANAL: 'Web', V: 1 },
          { MES: 'sep', CANAL: 'Web', V: 2 },
          { MES: 'ago', CANAL: 'App', V: 3 },
        ],
      },
    })
    expect(g?.tipoDePanel).toBe('matrix')
    expect(g?.grafico).toBe('heatmap')
    // La celda que el agente no mandó queda vacía, no en cero.
    expect(g?.valor).toEqual({
      shape: 'matrix',
      rows: ['Web', 'App'],
      columns: ['ago', 'sep'],
      cells: [
        [1, 2],
        [3, null],
      ],
    })
    expect(adaptValue(g?.valor)).toMatchObject({ ok: true, valor: { forma: 'matriz' } })
  })
})

describe('lo que no se dibuja como gráfico SE MUESTRA COMO TABLA · 2026-10-10', () => {
  /** Hasta el 2026-10-10 todo esto devolvía `null` y la trama desaparecía en
   *  silencio. Ahora se ven los datos que el agente graficó, con la razón. */
  const comoTabla = (spec: unknown) => {
    const g = deVegaLite(spec)
    expect(g?.tipoDePanel).toBe('table')
    expect(g?.razon).toEqual(expect.any(String))
    expect(adaptValue(g?.valor)).toMatchObject({ ok: true, valor: { forma: 'tabular' } })
    return g
  }

  it('un canal con `aggregate` pide sumar · se muestran las filas, no se suma', () => {
    const conSuma = {
      ...linea,
      encoding: { ...linea.encoding, y: { field: 'INGRESOS', type: 'quantitative', aggregate: 'sum' } },
    }
    expect(comoTabla(conSuma)?.razon).toContain('sumar')
  })

  it('un `transform` es un programa · tabla', () => {
    comoTabla({ ...linea, transform: [{ filter: 'datum.INGRESOS > 0' }] })
  })

  it('una barra CON color —agrupada o apilada— dice que el repertorio no la tiene', () => {
    const g = comoTabla({
      mark: 'bar',
      encoding: {
        x: { field: 'MES', type: 'temporal', title: 'Mes' },
        y: { field: 'V', type: 'quantitative', title: 'Ventas (USD)' },
        color: { field: 'C', type: 'nominal', title: 'Plataforma' },
      },
      data: { values: [{ MES: '2026-08-01', V: 1, C: 'Web' }] },
    })
    expect(g?.razon).toContain('Plataforma')
    // Las columnas de la tabla son las que el agente graficó, con SUS títulos,
    // y lo que reparte va primero —es lo que rotula cada fila—.
    expect((g?.valor as { columns: { title: string }[] } | undefined)?.columns.map((c) => c.title)).toEqual([
      'Mes',
      'Plataforma',
      'Ventas (USD)',
    ])
  })

  it('una torta pide porcentajes que no se calculan acá · tabla', () => {
    comoTabla({
      mark: 'arc',
      encoding: { theta: { field: 'V', type: 'quantitative' }, color: { field: 'C', type: 'nominal' } },
      data: { values: [{ C: 'a', V: 1 }] },
    })
  })

  it('una cifra que FALTA no es un cero · tabla, y dice cuál falta', () => {
    const g = comoTabla({ ...linea, data: { values: [...linea.data.values, { MES: '2026-10-01', INGRESOS: null }] } })
    expect(g?.razon).toContain('2026-10-01')
  })

  it('series que no cubren los mismos meses no se alinean a la fuerza · tabla', () => {
    // `PlotSeries` toma el eje del tiempo de la primera serie: desalineadas, el
    // hover diría el valor de otro mes.
    comoTabla({
      mark: 'line',
      encoding: {
        x: { field: 'MES', type: 'temporal' },
        y: { field: 'V', type: 'quantitative' },
        color: { field: 'C', type: 'nominal' },
      },
      data: { values: [{ MES: '2026-08-01', V: 1, C: 'a' }, { MES: '2026-09-01', V: 2, C: 'a' }, { MES: '2026-08-01', V: 3, C: 'b' }] },
    })
  })

  it('una marca que nadie dibuja todavía · tabla con la marca nombrada', () => {
    expect(comoTabla({ ...linea, mark: 'boxplot' })?.razon).toContain('boxplot')
  })

  it('sólo es `null` lo ilegible: un texto que no es JSON, o un spec sin datos', () => {
    expect(deVegaLite('{no es json')).toBeNull()
    expect(deVegaLite({ ...linea, data: { values: [] } })).toBeNull()
  })
})

describe('el spec REAL · capturado, no escrito', () => {
  /** **Capturado del servicio el 2026-10-07**: upstream `7b717aa` levantado
   *  acá, `POST /config/chat` con contexto de pestaña y la pregunta «Grafica los
   *  ingresos mensuales de los últimos 6 meses», contra `SYNAPSE_UA` real. Es
   *  el `chart_spec` del segundo frame `data`, tal cual.
   *
   *  Trae `timeUnit: utcyearmonth` en `x`, y la primera versión de
   *  `vegaLite.ts` lo rechazaba: habría tirado justo el gráfico que el agente
   *  manda. Lo encontró esta captura. */
  it('la línea mensual de ingresos se traduce entera', async () => {
    const spec = (await import('./fixtures/chart-spec-ingresos-2026-10-07.json')).default
    const g = deVegaLite(spec)
    expect(g?.tipoDePanel).toBe('series')
    expect(g?.titulo).toBe('Ingresos mensuales — últimos 6 meses (USD)')
    expect(adaptValue(g?.valor)).toMatchObject({
      ok: true,
      valor: { forma: 'serieTemporal', puntos: expect.arrayContaining([{ t: '2026-09-01', v: 1319462 }]) },
    })
  })
})

describe('los siete gráficos reales · auditoría del 2026-10-10', () => {
  /** **Capturados, no escritos**: los `chart_spec` guardados en
   *  `user_thread_messages` de la base local, producidos por `SYNAPSE_UA` contra
   *  Snowflake entre el 2026-09-24 y el 2026-10-09. Dos de ellos desaparecían. */
  const cargar = async (nombre: string) => (await import(`./fixtures/${nombre}.json`)).default as unknown

  it('la línea de ingresos trae los títulos de sus ejes', async () => {
    const g = deVegaLite(await cargar('chart-spec-linea-con-mes-en-curso-2026-10-07'))
    expect(g?.tipoDePanel).toBe('series')
    expect(g?.ejes).toMatchObject({ medida: 'Ingresos (USD)', dimension: 'Mes', dimensionEsFecha: true })
  })

  it('las tres plataformas por mes son una multiserie alineada', async () => {
    const g = deVegaLite(await cargar('chart-spec-multilinea-2026-10-08'))
    expect(g?.grafico).toBe('multiline')
    expect(adaptValue(g?.valor)).toMatchObject({ ok: true, valor: { forma: 'seriesMultiples' } })
    expect((g?.valor as { series: unknown[] } | undefined)?.series).toHaveLength(3)
  })

  it('las barras horizontales de inversión son `bars`, con «Inversión (USD)» y «Plataforma»', async () => {
    const g = deVegaLite(await cargar('chart-spec-barras-horizontales-2026-10-09'))
    expect(g?.grafico).toBe('bars')
    expect(g?.ejes).toMatchObject({ medida: 'Inversión (USD)', dimension: 'Plataforma' })
  })

  it('DESAPARECÍA · la multiserie con TikTok sin dato se ve como tabla y lo dice', async () => {
    const g = deVegaLite(await cargar('chart-spec-multilinea-con-nulos-2026-10-08'))
    expect(g?.tipoDePanel).toBe('table')
    expect(g?.razon).toContain('TikTok')
    // El spec real escribe `color` antes que `x`: la tabla abre igual con «Mes».
    expect((g?.valor as { columns: { title: string }[] } | undefined)?.columns.map((c) => c.title)).toEqual([
      'Mes',
      'Plataforma',
      'Ingresos (USD)',
    ])
    expect(adaptValue(g?.valor)).toMatchObject({ ok: true })
  })

  it('DESAPARECÍA · las barras agrupadas se ven como tabla y lo dicen', async () => {
    const g = deVegaLite(await cargar('chart-spec-barras-agrupadas-2026-09-24'))
    expect(g?.tipoDePanel).toBe('table')
    expect(g?.razon).toContain('Plataforma')
    expect(adaptValue(g?.valor)).toMatchObject({ ok: true })
  })
})
