/** Cargar meses · la lógica · 2026-10-07
 *
 *  **Lo que más importa probar es cuándo se deja de esperar.** La carga
 *  contesta 202 y la fila aparece segundos después, así que hay dos modos de
 *  falla opuestos: dar por terminado un pedido con una corrida VIEJA del mismo
 *  mes —se ve cargado antes de arrancar—, y esperar para siempre una fila que
 *  nunca llega.
 */
import { describe, expect, it } from 'vitest'
import {
  ESPERA_MAXIMA_MS,
  aniosOfrecidos,
  faltanPorTerminar,
  hayQueEsperar,
  mesEnCurso,
  mesesCargados,
  mesesDelAnio,
  mesesEnCurso,
} from '@/surfaces/admin/cargaDePeriodos'
import type { Corrida } from '@/api/admin'

const corrida = (periodo: string, over: Partial<Corrida> = {}): Corrida => ({
  id: `r-${periodo}`,
  tenantId: 't-1',
  periodo,
  disparo: 'manual',
  estado: 'done',
  disponibles: 21,
  bloqueadas: 12,
  errores: 0,
  salteadas: 0,
  preservadas: 5,
  arrancadaEn: '2026-10-07T20:00:00Z',
  terminadaEn: '2026-10-07T20:00:08Z',
  error: '',
  ...over,
})

describe('el mes en curso es el del CLIENTE, no el del navegador', () => {
  it('a la 1:00 UTC del 1 de octubre, en Ciudad de México sigue siendo septiembre', () => {
    const instante = new Date('2026-10-01T01:00:00Z')
    expect(mesEnCurso(instante, 'America/Mexico_City')).toBe('2026-09')
    expect(mesEnCurso(instante, 'UTC')).toBe('2026-10')
  })

  it('un huso que Intl no conoce cae a UTC en vez de romper la pantalla', () => {
    expect(mesEnCurso(new Date('2026-10-07T12:00:00Z'), 'Marte/Olympus')).toBe('2026-10')
    expect(mesEnCurso(new Date('2026-10-07T12:00:00Z'), null)).toBe('2026-10')
  })
})

describe('qué se ofrece', () => {
  it('tres años, del en curso hacia atrás', () => {
    expect(aniosOfrecidos('2026-10')).toEqual(['2026', '2025', '2024'])
  })

  it('nunca un mes futuro · calcularlo dejaría una fila que se lee como «cargado»', () => {
    expect(mesesDelAnio('2026', '2026-10')).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ])
    expect(mesesDelAnio('2025', '2026-10')).toHaveLength(12)
  })

  it('cargado es una corrida TERMINADA y sin error · una fallida no cuenta', () => {
    const cs = [
      corrida('2026-08'),
      corrida('2026-07', { error: 'timeout' }),
      corrida('2026-06', { terminadaEn: null }),
    ]
    expect([...mesesCargados(cs)]).toEqual(['2026-08'])
    expect([...mesesEnCurso(cs)]).toEqual(['2026-06'])
  })
})

describe('cuándo terminó lo pedido', () => {
  const pedido = { periodos: ['2026-07', '2026-08'], desde: Date.parse('2026-10-07T20:00:00Z') }

  it('una corrida VIEJA del mismo mes no da el pedido por terminado', () => {
    const vieja = corrida('2026-07', {
      arrancadaEn: '2026-09-24T10:00:00Z',
      terminadaEn: '2026-09-24T10:00:08Z',
    })
    expect(faltanPorTerminar(pedido, [vieja])).toEqual(['2026-07', '2026-08'])
  })

  it('una nueva y terminada sí · y la que sigue en vuelo, no', () => {
    const cs = [corrida('2026-07'), corrida('2026-08', { terminadaEn: null })]
    expect(faltanPorTerminar(pedido, cs)).toEqual(['2026-08'])
  })

  it('con el reloj del navegador un minuto adelantado igual reconoce la corrida', () => {
    const adelantado = { ...pedido, desde: pedido.desde + 50_000 }
    expect(faltanPorTerminar(adelantado, [corrida('2026-07'), corrida('2026-08')])).toEqual([])
  })

  it('se espera mientras falte algo · y no después del tope', () => {
    expect(hayQueEsperar(pedido, [], pedido.desde + 1000)).toBe(true)
    expect(hayQueEsperar(pedido, [], pedido.desde + ESPERA_MAXIMA_MS + 1)).toBe(false)
    expect(
      hayQueEsperar(pedido, [corrida('2026-07'), corrida('2026-08')], pedido.desde + 1000),
    ).toBe(false)
  })

  it('sin pedido propio, una corrida en vuelo —la del scheduler— también se mira', () => {
    expect(hayQueEsperar(null, [corrida('2026-10', { terminadaEn: null })], 0)).toBe(true)
    expect(hayQueEsperar(null, [corrida('2026-10')], 0)).toBe(false)
  })
})
