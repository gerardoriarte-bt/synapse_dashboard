// @vitest-environment jsdom

/** La nota de lectura llega del layout al panel · 2026-10-14
 *
 *  **La cadena tiene spreads condicionales en cada salto** —`PanelInGrid →
 *  Panel → PanelShell`—, y ahí una prop mal nombrada compila. La regla del
 *  repositorio: verificar que el dato LLEGUE, no que el componente lo sepa
 *  pintar cuando se lo dan directo.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PanelInGrid } from '@/surfaces/console/PanelInGrid'
import { createFormat } from '@/render/format'
import type { Metric, PanelConfig, Payload } from '@/api/types'

const format = createFormat('es-MX')
const now = new Date('2026-10-14T12:00:00Z')

const metric = {
  id: 'm-1', key: 'executive_summary', nombre: 'Resumen ejecutivo', forma: 'prosa', familia: 'cliente',
  capa: 'GOLD', fuente: 'Agente', ventana: '', base: 'Mes en curso', estado: 'DISPONIBLE',
  direccionSemantica: null, catalogVersion: 1,
} as unknown as Metric

const bloqueado = {
  estado: 'BLOQUEADO',
  razon: 'No hay datos calculados para este período',
  desbloqueaCon: 'Se calcula en la próxima materialización',
} as unknown as Payload

describe('del layout al panel', () => {
  it('la nota del panel se ve aunque el panel esté bloqueado', () => {
    const panel = {
      id: 'p-1', tipo: 'prose', metricId: 'm-1', colStart: 1, colSpan: 8, rowSpan: 3,
      nota: 'Resume ventas, inversión y eficiencia del mes contra el anterior.',
    } as unknown as PanelConfig
    render(<PanelInGrid panel={panel} metric={metric} payload={bloqueado} params={{}} format={format} now={now} />)
    expect(screen.getByText('Resume ventas, inversión y eficiencia del mes contra el anterior.')).toBeVisible()
  })
})
