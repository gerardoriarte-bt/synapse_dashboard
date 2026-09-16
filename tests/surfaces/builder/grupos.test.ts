/** La biblioteca de tipos, agrupada · F4.9
 *
 *  El reparto sale del `.pen`; §7.2 solo nombra los cinco grupos. Esta prueba
 *  existe sobre todo para lo que pasa **cuando el backend agrega un tipo**: la
 *  tabla vive en el front y no puede tragarse lo que no conoce.
 */
import { describe, expect, it } from 'vitest'
import { GRUPOS, agrupar } from '@/surfaces/builder/grupos'
import type { Block } from '@/api/types'

const b = (tipo: string): Block => ({
  tipo: tipo as Block['tipo'],
  formasAceptadas: ['escalar'],
  colSpanMin: 3,
  colSpanMax: 4,
  rowSpanMin: 3,
  rowSpanMax: 4,
})

const LOS_QUINCE = [
  'kpi', 'prose', 'series', 'bars', 'table', 'gauge', 'forecast', 'list',
  'reco', 'composition', 'comparison', 'distribution', 'blocked', 'matrix', 'graph',
]

describe('los cinco grupos de §7.2', () => {
  it('van en el orden de la spec', () => {
    expect([...GRUPOS]).toEqual(['Comparación', 'Composición', 'Evolución', 'Distribución', 'Estado'])
  })

  it('reparte los quince tipos y no pierde ninguno', () => {
    const { grupos, sinGrupo } = agrupar(LOS_QUINCE.map(b))
    expect(sinGrupo).toEqual([])
    expect(grupos.reduce((n, g) => n + g.bloques.length, 0)).toBe(15)
  })

  it('el reparto es el del `.pen`', () => {
    const { grupos } = agrupar(LOS_QUINCE.map(b))
    const porGrupo = Object.fromEntries(grupos.map((g) => [g.grupo, g.bloques.map((x) => x.tipo)]))
    expect(porGrupo).toEqual({
      'Comparación': ['bars', 'table', 'list', 'comparison'],
      'Composición': ['composition'],
      'Evolución': ['series', 'forecast'],
      'Distribución': ['distribution', 'matrix', 'graph'],
      'Estado': ['kpi', 'prose', 'gauge', 'reco', 'blocked'],
    })
  })

  it('los cinco aparecen aunque queden vacíos', () => {
    // Un grupo que desaparece porque el servicio no mandó ninguno de sus tipos
    // se lee como que ese grupo no existe.
    const { grupos } = agrupar([b('kpi')])
    expect(grupos).toHaveLength(5)
    expect(grupos.find((g) => g.grupo === 'Evolución')?.bloques).toEqual([])
  })
})

describe('un tipo que el backend agregue NO desaparece', () => {
  it('sale aparte, no se descarta', () => {
    // Misma decisión que `adaptCatalog` con una forma desconocida: lo que no se
    // reconoce se declara, no se traga.
    const { grupos, sinGrupo } = agrupar([b('kpi'), b('sankey')])
    expect(sinGrupo.map((x) => x.tipo)).toEqual(['sankey'])
    expect(grupos.reduce((n, g) => n + g.bloques.length, 0)).toBe(1)
  })
})
