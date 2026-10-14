/** El tiempo de una serie · de días epoch a ISO, y su rótulo · 2026-10-06
 *
 *  Medido en QA ese día: `daily_trend` y `media_efficiency_12m` seguían en
 *  `"20727"` porque sus filas se materializaron antes de `c8b9247`, que es el
 *  commit donde el backend declaró el formato y pasó a ISO.
 */
import { describe, expect, it } from 'vitest'
import { adaptValue } from '@/api/adapt'
import { createFormat } from '@/render/format'
import { granoDe } from '@/render/plots/core/grano'

const tiempos = (points: { t: string; v: number }[]) => {
  const r = adaptValue({ shape: 'time_series', points })
  if (!r.ok || r.valor.forma !== 'serieTemporal') throw new Error('no adaptó')
  return r.valor.puntos.map((p) => p.t)
}

describe('`t` en el adaptador', () => {
  it('días desde epoch pasan a ISO · `20727` es el 1 de octubre de 2026', () => {
    expect(tiempos([{ t: '20727', v: 1 }, { t: '20393', v: 2 }])).toEqual(['2026-10-01', '2025-11-01'])
  })

  it('una `t` ya ISO pasa tal cual', () => {
    expect(tiempos([{ t: '2026-09-01', v: 1 }])).toEqual(['2026-09-01'])
  })

  it('una etiqueta pasa tal cual · no todo lo que llega es una fecha', () => {
    expect(tiempos([{ t: 'jul', v: 1 }, { t: 'S1', v: 2 }])).toEqual(['jul', 'S1'])
  })
})

describe('`axisDate`', () => {
  const format = createFormat('es-MX')

  it('día y mes, sin el punto de la abreviatura', () => {
    expect(format.axisDate('2026-10-01', 'dia')).toBe('1 oct')
  })

  it('mes y año corto', () => {
    expect(format.axisDate('2025-11-01', 'mes')).toBe('nov 25')
  })

  it('lo que no es fecha vuelve tal cual', () => {
    expect(format.axisDate('jul', 'dia')).toBe('jul')
  })
})

describe('`granoDe`', () => {
  const s = (ts: string[]) => [{ etiqueta: 'x', puntos: ts.map((t) => ({ t, v: 1 })) }]

  it('todos el día 1, y más de uno · mensual', () => {
    expect(granoDe(s(['2025-11-01', '2025-12-01']))).toBe('mes')
  })

  it('un solo 1 de octubre NO decide mensual · podría ser un día', () => {
    expect(granoDe(s(['2026-10-01']))).toBe('dia')
  })

  it('días seguidos · diario', () => {
    expect(granoDe(s(['2026-10-01', '2026-10-02']))).toBe('dia')
  })
})
