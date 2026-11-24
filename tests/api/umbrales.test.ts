/** Los umbrales del semáforo como param de layout · decisión humana del 2026-11-24
 *
 *  Llegan igual que la `banda` del medidor: en `options` del panel, con nombre
 *  del cable —`thresholds`—, se traducen al nuestro —`umbrales`— y se validan
 *  contra `PARAM_SCHEMAS` y contra `paramsDisponibles`. **Un par que no se puede
 *  dibujar degrada el panel con la razón**, no se ignora: ignorarlo dibujaría el
 *  panel sin semáforo y nadie sabría por qué.
 */
import { describe, expect, it } from 'vitest'
import { paramsAlCable, traducirParams } from '@/api/adapt'
import { validateParams } from '@/api/params'

const DISPONIBLES = ['comparativo', 'medidor', 'umbrales']

describe('el cable dice `thresholds` y el cuerpo lee `umbrales`', () => {
  it('se traduce de ida y de vuelta, con los cortes intactos', () => {
    const cable = { meter: true, thresholds: { bien: 3, mal: 2 } }
    const nuestro = traducirParams(cable)
    expect(nuestro).toEqual({ medidor: true, umbrales: { bien: 3, mal: 2 } })
    expect(paramsAlCable(nuestro)).toEqual(cable)
  })
})

describe('qué par se puede dibujar', () => {
  it.each(['kpi', 'gauge'] as const)('en `%s`, dos cortes distintos pasan', (tipo) => {
    const r = validateParams(tipo, { umbrales: { bien: 3, mal: 2 } }, tipo === 'kpi' ? DISPONIBLES : ['maximo', 'umbrales'])
    expect(r.invalid).toEqual([])
    expect(r.params['umbrales']).toEqual({ bien: 3, mal: 2 })
  })

  it('más bajo es mejor también pasa · `bien` menor que `mal`', () => {
    expect(validateParams('kpi', { umbrales: { bien: 20, mal: 40 } }, DISPONIBLES).invalid).toEqual([])
  })

  it.each([
    [{ bien: 3 }, 'necesita los dos cortes'],
    [{ bien: 2, mal: 2 }, 'los dos cortes son iguales'],
    [{ bien: 3, mal: 2, direccion: 'mayor' }, 'no lee «direccion»'],
    [{ bien: '3', mal: 2 }, 'necesita los dos cortes'],
    [[3, 2], 'espera un objeto'],
  ])('%j se rechaza y dice por qué', (valor, razon) => {
    const r = validateParams('kpi', { umbrales: valor }, DISPONIBLES)
    expect(r.params['umbrales']).toBeUndefined()
    expect(r.invalid).toHaveLength(1)
    expect(r.invalid[0]?.reason).toContain(razon)
    expect(r.invalid[0]?.reason.startsWith('«umbrales» ')).toBe(true)
  })

  it('si el servicio no lo declara en `layout_params`, se descarta como desconocido', () => {
    // Es el estado de hoy en el servicio real: `dd_seed_blocks.go` no tiene
    // `thresholds` en ninguna fila. Se descarta con aviso, que es la regla de
    // `params.ts`: qué params existen lo dice el backend.
    const r = validateParams('kpi', { umbrales: { bien: 3, mal: 2 } }, ['comparativo', 'medidor'])
    expect(r.unknown).toEqual(['umbrales'])
    expect(r.params).toEqual({})
  })
})
