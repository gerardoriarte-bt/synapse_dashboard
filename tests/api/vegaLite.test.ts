/** El gráfico del agente a nuestra forma de valor · 2026-10-07
 *
 *  **Los specs tienen la forma de Vega-Lite que emite `data_to_chart`**: marca,
 *  `encoding` con `field` y `type`, y los datos inline en `data.values`. Las
 *  claves en MAYÚSCULAS son las de Snowflake, y los números como texto son los
 *  de su SQL API — los dos casos que un spec escrito a mano olvidaría.
 *
 *  Lo que más importa probar es lo que se RECHAZA: un spec que pide sumar o
 *  filtrar devuelve `null` en vez de una cifra que nadie consultó.
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

  it('una línea con color es multiserie, en el orden en que el agente las listó', () => {
    const g = deVegaLite({
      mark: 'line',
      encoding: {
        x: { field: 'MES', type: 'temporal', timeUnit: 'yearmonth' },
        y: { field: 'V', type: 'quantitative' },
        color: { field: 'CANAL', type: 'nominal' },
      },
      data: {
        values: [
          { MES: '2026-08-01', V: 1, CANAL: 'Web' },
          { MES: '2026-08-01', V: 2, CANAL: 'App' },
          { MES: '2026-09-01', V: 3, CANAL: 'Web' },
        ],
      },
    })
    expect(g?.valor).toEqual({
      shape: 'multi_series',
      series: [
        {
          label: 'Web',
          points: [
            { t: '2026-08-01', v: 1 },
            { t: '2026-09-01', v: 3 },
          ],
        },
        { label: 'App', points: [{ t: '2026-08-01', v: 2 }] },
      ],
    })
  })

  it('una barra horizontal —la medida en `x`— es la misma categórica', () => {
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
      titulo: null,
      valor: {
        shape: 'categorical',
        items: [
          { label: 'Meta', v: 4.2 },
          { label: 'Google', v: 3.1 },
        ],
      },
    })
  })
})

describe('lo que se RECHAZA · el adaptador no calcula', () => {
  it('un canal con `aggregate` pide sumar · no se suma acá', () => {
    const conSuma = {
      ...linea,
      encoding: {
        ...linea.encoding,
        y: { field: 'INGRESOS', type: 'quantitative', aggregate: 'sum' },
      },
    }
    expect(deVegaLite(conSuma)).toBeNull()
  })

  it('un `transform` es un programa, no un gráfico', () => {
    expect(deVegaLite({ ...linea, transform: [{ filter: 'datum.INGRESOS > 0' }] })).toBeNull()
  })

  it('una barra CON color —agrupada o apilada— no tiene cuerpo que la dibuje así', () => {
    const g = deVegaLite({
      mark: 'bar',
      encoding: {
        x: { field: 'MES', type: 'ordinal' },
        y: { field: 'V', type: 'quantitative' },
        color: { field: 'CANAL', type: 'nominal' },
      },
      data: { values: [{ MES: 'ago', V: 1, CANAL: 'Web' }] },
    })
    expect(g).toBeNull()
  })

  it('una torta no se convierte en barras · sería volver a elegir por el agente', () => {
    const g = deVegaLite({
      mark: 'arc',
      encoding: {
        theta: { field: 'V', type: 'quantitative' },
        color: { field: 'C', type: 'nominal' },
      },
      data: { values: [{ V: 1, C: 'a' }] },
    })
    expect(g).toBeNull()
  })

  it('una fila con la cifra rota invalida el gráfico entero · no se salta', () => {
    const roto = {
      ...linea,
      data: { values: [...linea.data.values, { MES: '2026-10-01', INGRESOS: 'n/d' }] },
    }
    expect(deVegaLite(roto)).toBeNull()
  })

  it('un texto que no es JSON es `null`, no una excepción', () => {
    expect(deVegaLite('{no es json')).toBeNull()
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
