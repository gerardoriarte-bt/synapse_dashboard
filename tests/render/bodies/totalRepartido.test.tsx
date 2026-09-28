// @vitest-environment jsdom

/** El total repartido de una composición · §6 · §PEN «Cuerpo Composición»
 *
 *  §6 declara este tipo como «partes de un todo · **declara el total
 *  repartido**», y el dibujo lo pinta. **No estaba**: el cuerpo dibujaba el plot
 *  y nada más, así que una composición decía qué proporción tiene cada parte y
 *  no de cuánto. Lo encontró la sesión que dibuja, cruzando dibujo contra código.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CompositionBody } from '@/render/bodies/CompositionBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const base = {
  span: { colStart: 1, colSpan: 6, rowSpan: 4 },
  family: 'medios',
  metric: 'Inversión por plataforma',
  format: createFormat('es-MX'),
} as const

const composicion = (partes: readonly { etiqueta: string; v: number }[]) =>
  ({
    forma: 'composicion',
    partes: partes.map((p) => ({ ...p, porcentaje: 0 })),
  }) as unknown as Extract<Value, { forma: 'composicion' }>

describe('el total se declara', () => {
  it('con su rótulo y su unidad', () => {
    render(
      <CompositionBody
        {...base}
        value={composicion([
          { etiqueta: 'Meta', v: 400 },
          { etiqueta: 'Google', v: 600 },
        ])}
        params={{}}
        unit="USD"
      />,
    )

    expect(screen.getByText('Total repartido')).toBeVisible()
    // **La unidad va con la cifra**, que es lo que el dibujo pinta: «USD 4.28M».
    // Sale de la MÉTRICA y no del valor, y la compone `format.withUnit`.
    const total = screen.getByText('Total repartido').parentElement
    expect(total?.textContent).toContain('USD')
    expect(total?.textContent).toMatch(/1[.,]?0?K|1000/)
  })
})

describe('el total es de TODAS las partes, no de las visibles', () => {
  it('cuenta también las agrupadas en «Otros»', () => {
    // **El defecto que esto previene.** El cuerpo agrupa a partir de la quinta
    // parte —la rampa tiene cinco escalones—, así que sumar lo que está en
    // pantalla daría un total menor que el real. Y se vería perfecto: una cifra
    // redonda, bien rotulada, y equivocada.
    render(
      <CompositionBody
        {...base}
        value={composicion([
          { etiqueta: 'A', v: 100 },
          { etiqueta: 'B', v: 100 },
          { etiqueta: 'C', v: 100 },
          { etiqueta: 'D', v: 100 },
          { etiqueta: 'E', v: 100 },
          { etiqueta: 'F', v: 100 },
          { etiqueta: 'G', v: 100 },
        ])}
        params={{}}
      />,
    )

    // Siete partes de 100 · si contara sólo las cinco del plot diría 500.
    expect(screen.getByText('700')).toBeVisible()
    expect(screen.queryByText('500')).toBeNull()
    // Y sigue declarando cuántas agrupó, que es otra cosa.
    expect(screen.getByText(/3 partes agrupadas/)).toBeVisible()
  })
})

describe('el orden no cambia el total', () => {
  it('ordenar por valor o dejarlo natural da lo mismo', () => {
    // Suena obvio y por eso se escribe: el cuerpo COPIA antes de ordenar, y una
    // suma sobre el arreglo ya ordenado en el lugar habría mutado el payload
    // cacheado.
    const partes = [
      { etiqueta: 'A', v: 30 },
      { etiqueta: 'B', v: 70 },
    ]
    const { unmount } = render(
      <CompositionBody {...base} value={composicion(partes)} params={{ orden: 'natural' }} />,
    )
    expect(screen.getByText('100')).toBeVisible()
    unmount()

    render(<CompositionBody {...base} value={composicion(partes)} params={{}} />)
    expect(screen.getByText('100')).toBeVisible()
  })
})
