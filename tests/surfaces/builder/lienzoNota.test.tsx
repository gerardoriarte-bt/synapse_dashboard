// @vitest-environment jsdom

/** La nota de lectura en el lienzo sin dibujo · 2026-10-14
 *
 *  Cuando el lienzo no tiene quien dibuje el panel, pinta una tarjeta con el
 *  tipo, la métrica y el tamaño. La nota va ahí también, igual que bajo el
 *  título del panel en la consola. El camino con dibujo lo cubre `binder.test`.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Canvas } from '@/surfaces/builder/Canvas'
import { blockTable } from '@/catalog/blocks'
import type { Block } from '@/catalog/types'

const tabla = blockTable([
  { tipo: 'kpi', formasAceptadas: ['escalar'], colSpanMin: 3, colSpanMax: 4, rowSpanMin: 3, rowSpanMax: 4, paramsDisponibles: [] },
] as unknown as Block[])

function lienzo(nota?: string) {
  render(
    <Canvas
      panels={[{ id: 'p-1', metricId: 'm-1', tipo: 'kpi', colStart: 1, colSpan: 3, rowSpan: 4, ...(nota === undefined ? {} : { nota }) }]}
      tabla={tabla}
      metricas={[{ id: 'm-1', nombre: 'Ventas' }]}
      seleccionado={null}
      onSeleccionar={vi.fn()}
      onReubicar={vi.fn()}
      onRedimensionar={vi.fn()}
      onSoltarTipo={vi.fn()}
      arrastrando={null}
    />,
  )
}

describe('la tarjeta del lienzo', () => {
  it('muestra la nota de lectura del panel', () => {
    lienzo('Comparala contra el mes anterior.')
    expect(screen.getByText('Comparala contra el mes anterior.')).toBeVisible()
  })

  it('sin nota no deja un renglón vacío', () => {
    lienzo()
    expect(screen.getByText('Ventas').parentElement?.querySelector('p.line-clamp-2')).toBeNull()
  })
})
