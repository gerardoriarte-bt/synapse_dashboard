/** La unidad de cada serie y el punto parcial · desde `3651d70` · 2026-10-14
 *
 *  **El fixture es la forma medida** en `dd_panel_data` después de materializar
 *  octubre de 2026 para UA ese día: `media_efficiency_12m` con tres series, sus
 *  unidades y el mes en curso marcado. El adaptador los descartaba, y por eso el
 *  ROAS salía «11.7» sin unidad y el mes incompleto parecía un desplome.
 */
import { describe, expect, it } from 'vitest'
import { adaptValue } from '@/api/adapt'

const medido = {
  shape: 'multi_series',
  series: [
    { label: 'Inversión', unit: 'USD', points: [{ t: '2026-09-01', v: 40900 }, { t: '2026-10-01', v: 23952, partial: true }] },
    { label: 'Ventas', unit: 'USD', points: [{ t: '2026-09-01', v: 406940 }, { t: '2026-10-01', v: 280313, partial: true }] },
    { label: 'ROAS', unit: 'x', points: [{ t: '2026-09-01', v: 9.95 }, { t: '2026-10-01', v: 11.7031, partial: true }] },
  ],
}

describe('multi_series trae la unidad de cada serie', () => {
  it('cada serie conserva SU unidad', () => {
    const r = adaptValue(medido)
    expect(r.ok && r.valor.forma === 'seriesMultiples' && r.valor.series.map((s) => s.unidad)).toEqual(['USD', 'USD', 'x'])
  })

  it('una serie sin unidad no la inventa · sesiones', () => {
    const r = adaptValue({ shape: 'multi_series', series: [{ label: 'Sesiones', points: [{ t: '2026-10-01', v: 1 }] }] })
    expect(r.ok && r.valor.forma === 'seriesMultiples' && 'unidad' in (r.valor.series[0] ?? {})).toBe(false)
  })
})

describe('el punto parcial', () => {
  it('llega marcado sólo en el mes en curso', () => {
    const r = adaptValue(medido)
    const puntos = r.ok && r.valor.forma === 'seriesMultiples' ? (r.valor.series[2]?.puntos ?? []) : []
    expect(puntos.map((p) => p.parcial === true)).toEqual([false, true])
  })

  it('un `partial: false` explícito no deja marca', () => {
    const r = adaptValue({ shape: 'multi_series', series: [{ label: 'X', points: [{ t: '2026-10-01', v: 1, partial: false }] }] })
    const p = r.ok && r.valor.forma === 'seriesMultiples' ? r.valor.series[0]?.puntos[0] : undefined
    expect(p !== undefined && 'parcial' in p).toBe(false)
  })
})
