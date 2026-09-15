/** El uso de cada métrica en el layout publicado · A4, columna `USO`
 *
 *  Lo que se prueba son las dos reglas que se pueden aplicar mal: que **una
 *  métrica repetida en la misma pestaña cuente dos paneles y una pestaña**, y
 *  que **un rol sin pestañas asignadas las vea todas** — si eso se lee como «no
 *  ve ninguna», A4 diría que editar una métrica no afecta a nadie.
 */
import { describe, expect, it } from 'vitest'
import { usoPorMetrica } from '@/surfaces/admin/uso'
import type { LayoutDetalle, Rol } from '@/api/admin'

const panel = (id: string, metricId: string) => ({
  id, tipo: 'kpi' as const, metricId, colStart: 1, colSpan: 3, rowSpan: 4,
})

const detalle: LayoutDetalle = {
  layout: { id: 'l-1', tenantId: 't-1', estado: 'publicado', versionId: 'v3', publicadoEn: null },
  tabs: [
    {
      tab: { id: 'tab-a', nombre: 'Resumen', pregunta: '¿?', orden: 1, roles: [] },
      panels: [panel('p-1', 'm-1'), panel('p-2', 'm-1'), panel('p-3', 'm-2')],
    },
    {
      tab: { id: 'tab-b', nombre: 'Inventario', pregunta: '¿?', orden: 2, roles: [] },
      panels: [panel('p-4', 'm-1')],
    },
  ],
}

const rol = (id: string, nombre: string, pestanas: string[]): Rol => ({
  id, tenantId: 't-1', nombre, pestanas, metricasOcultas: [], overrides: {}, usuarios: 0,
})

describe('cuenta paneles, no apariciones de pestaña', () => {
  it('dos paneles en la misma pestaña son dos paneles y UNA pestaña', () => {
    const uso = usoPorMetrica(detalle, [])
    expect(uso.get('m-1')?.paneles).toBe(3)
    expect(uso.get('m-1')?.pestanas).toEqual(['Resumen', 'Inventario'])
  })

  it('una métrica que no se usa no aparece · el cero lo pone la pantalla', () => {
    expect(usoPorMetrica(detalle, []).get('m-9')).toBeUndefined()
  })

  it('un panel sin métrica no cuenta', () => {
    const sinMetrica: LayoutDetalle = {
      ...detalle,
      tabs: [{ tab: detalle.tabs[0]!.tab, panels: [panel('p-9', '')] }],
    }
    expect(usoPorMetrica(sinMetrica, []).size).toBe(0)
  })

  it('sin layout publicado no hay nada que contar', () => {
    expect(usoPorMetrica(undefined, []).size).toBe(0)
  })
})

describe('qué roles la ven · la regla que se aplica mal', () => {
  it('un rol SIN pestañas asignadas las ve TODAS', () => {
    // Si esto se leyera como «no ve ninguna», A4 diría que editar una métrica no
    // afecta a nadie — que es lo contrario de lo que el aviso existe para decir.
    const uso = usoPorMetrica(detalle, [rol('r-1', 'CEO', [])])
    expect(uso.get('m-1')?.roles).toEqual(['CEO'])
  })

  it('un rol con pestañas ve solo las suyas', () => {
    const roles = [rol('r-1', 'CEO', ['tab-a', 'tab-b']), rol('r-2', 'Planner', ['tab-a'])]
    const uso = usoPorMetrica(detalle, roles)
    // `m-2` solo está en Resumen, que los dos ven.
    expect(uso.get('m-2')?.roles).toEqual(['CEO', 'Planner'])
    // `m-1` está también en Inventario, que solo ve CEO — pero Planner ya la ve
    // por Resumen, así que sigue contando.
    expect(uso.get('m-1')?.roles.sort()).toEqual(['CEO', 'Planner'])
  })

  it('un rol que no ve ninguna de sus pestañas NO aparece', () => {
    const roles = [rol('r-1', 'CEO', ['tab-a']), rol('r-3', 'Solo otra', ['tab-z'])]
    const uso = usoPorMetrica(detalle, roles)
    expect(uso.get('m-2')?.roles).toEqual(['CEO'])
  })

  it('no repite un rol que ve la métrica en dos pestañas', () => {
    const uso = usoPorMetrica(detalle, [rol('r-1', 'CEO', ['tab-a', 'tab-b'])])
    expect(uso.get('m-1')?.roles).toEqual(['CEO'])
  })
})
