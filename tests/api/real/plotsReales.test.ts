/** El adaptador contra la RESPUESTA REAL de `/config/plots` · 2026-09-29 */
import { describe, expect, it } from 'vitest'
import { adaptPlots } from '@/api/adapt'
import { invalidPlotReason, plotTable } from '@/catalog/plots'
import type { Value } from '@/catalog/types'
import crudo from './plots-wire.json'
import type { WirePlot } from '@/api/adapt'

const valor = <F extends Value['forma']>(v: unknown) => v as unknown as Extract<Value, { forma: F }>

describe('la respuesta real atraviesa el adaptador', () => {
  it('las 49 sobreviven · ninguna se descarta por una forma desconocida', () => {
    const ps = adaptPlots(crudo as unknown as WirePlot[])
    expect(ps).toHaveLength(49)
  })

  it('las formas quedan en el idioma del CONTRATO', () => {
    const ps = adaptPlots(crudo as unknown as WirePlot[])
    const treemap = ps.find((p) => p.id === 'treemap')
    expect(treemap?.formas).toEqual(['categorica', 'composicion'])
    expect(treemap?.nombre).toBe('TREEMAP')
  })

  it('y las reglas deciden sobre la tabla real', () => {
    const T = plotTable(adaptPlots(crudo as unknown as WirePlot[]))
    const dos = valor<'composicion'>({
      forma: 'composicion',
      partes: [{ etiqueta: 'a', v: 1 }, { etiqueta: 'b', v: 1 }],
    })
    expect(invalidPlotReason(T, 'treemap', dos)?.razon).toBe(
      'con dos rectángulos es una barra apilada',
    )
    expect(invalidPlotReason(T, 'donut', dos)).toBeNull()
  })
})
