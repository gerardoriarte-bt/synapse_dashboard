/** La derivación de estado · F1.13i.
 *
 *  Reglas citadas de `CLAUDE.md` y §5 de `parametros-front.md`:
 *  «Un estado reemplaza el cuerpo, nunca el shell» y «toda métrica declara su
 *  BASE (denominador + ventana) y su PROCEDENCIA (capa, fuente, frescura)».
 */
import { describe, expect, it } from 'vitest'
import { hasValue, isEmpty, resolveGovernance, visualState } from '@/render/state'
import type { Metric, Payload, Value } from '@/api/types'

const metric = {
  id: 'm-1',
  key: 'inv_riesgo',
  nombre: 'Venta diaria en riesgo',
  forma: 'escalar',
  familia: 'inventario',
  capa: 'SILVER',
  fuente: 'ERP',
  ventana: 'Últimos 30 días',
  base: '312 SKU críticos sobre 18.240 activos',
  estado: 'DISPONIBLE',
  catalogVersion: 1,
} as Metric

const scalar = { forma: 'escalar', v: 0 } as Value

describe('hasValue · los dos estados que muestran cifra', () => {
  it('es cierto solo en DISPONIBLE y DEGRADADO', () => {
    expect(hasValue({ estado: 'DISPONIBLE', valor: scalar } as Payload)).toBe(true)
    expect(hasValue({ estado: 'DEGRADADO', valor: scalar } as Payload)).toBe(true)
    expect(hasValue({ estado: 'CARGANDO' })).toBe(false)
    expect(hasValue({ estado: 'ERROR', mensaje: 'x' } as Payload)).toBe(false)
  })
})

describe('isEmpty · un cero es un dato', () => {
  it('una escalar NUNCA está vacía, ni siquiera en cero', () => {
    // Pintar «sin datos» sobre un cero real es mentir sobre la medición: el
    // cero significa que se midió y dio cero.
    expect(isEmpty({ forma: 'escalar', v: 0 } as Value)).toBe(false)
  })

  it('una colección sin elementos sí lo está', () => {
    expect(isEmpty({ forma: 'serieTemporal', puntos: [] } as unknown as Value)).toBe(true)
    expect(isEmpty({ forma: 'ranking', items: [] } as unknown as Value)).toBe(true)
    expect(isEmpty({ forma: 'tabular', filas: [], columnas: [] } as unknown as Value)).toBe(true)
  })

  it('seriesMultiples está vacía también si TODAS sus series lo están', () => {
    const conSeriesVacias = {
      forma: 'seriesMultiples',
      series: [{ puntos: [] }, { puntos: [] }],
    } as unknown as Value
    expect(isEmpty(conSeriesVacias)).toBe(true)
  })

  it('una prosa sin titular está vacía', () => {
    expect(isEmpty({ forma: 'prosa', titular: '   ' } as unknown as Value)).toBe(true)
  })
})

describe('visualState · VACIO se deriva, no se recibe', () => {
  it('un DISPONIBLE sin nada que dibujar es VACIO', () => {
    const sinPuntos = {
      estado: 'DISPONIBLE',
      valor: { forma: 'serieTemporal', puntos: [] },
    } as unknown as Payload
    expect(visualState(sinPuntos)).toBe('VACIO')
  })

  it('el resto pasa tal cual: el payload manda', () => {
    expect(visualState({ estado: 'CARGANDO' })).toBe('CARGANDO')
    expect(visualState({ estado: 'BLOQUEADO' } as Payload)).toBe('BLOQUEADO')
    expect(visualState({ estado: 'DISPONIBLE', valor: scalar } as Payload)).toBe('DISPONIBLE')
  })
})

describe('resolveGovernance · la anatomía sobrevive a los estados sin cifra', () => {
  it('con cifra, la procedencia sale del payload', () => {
    const payload = {
      estado: 'DISPONIBLE',
      valor: scalar,
      base: '48 tiendas sobre 52',
      capa: 'GOLD',
      fuente: 'Snowflake',
      frescura: '2026-09-02T08:00:00Z',
      catalogVersion: 1,
    } as unknown as Payload

    expect(resolveGovernance(metric, payload)).toEqual({
      base: '48 tiendas sobre 52',
      ventana: 'Últimos 30 días',
      capa: 'GOLD',
      fuente: 'Snowflake',
      frescura: '2026-09-02T08:00:00Z',
    })
  })

  it('SIN cifra cae al catálogo · la BASE sigue visible §4.1', () => {
    // Es lo que hace posible «un estado reemplaza el cuerpo, nunca el shell»:
    // un panel bloqueado no lleva Gobierno y aun así declara su denominador.
    const bloqueado = {
      estado: 'BLOQUEADO',
      razon: 'El feed de inventario no corrió',
      desbloqueaCon: 'Corrida del ETL',
    } as unknown as Payload

    expect(resolveGovernance(metric, bloqueado)).toEqual({
      base: '312 SKU críticos sobre 18.240 activos',
      ventana: 'Últimos 30 días',
      capa: 'SILVER',
      fuente: 'ERP',
      frescura: null,
    })
  })

  it('la frescura es null sin cifra · no se inventa cuándo se midió', () => {
    const cargando = { estado: 'CARGANDO' } as Payload
    expect(resolveGovernance(metric, cargando).frescura).toBeNull()
  })
})
