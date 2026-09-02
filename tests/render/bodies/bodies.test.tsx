// @vitest-environment jsdom

/** Los cuerpos · F1.13g.
 *
 *  Una prueba por regla que el cuerpo sostiene, no una por componente. Lo que se
 *  verifica son las reglas duras y los defectos que v2 encontró **en el render**,
 *  que son los que ninguna prueba veía.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ForecastBody } from '@/render/bodies/ForecastBody'
import { GaugeBody } from '@/render/bodies/GaugeBody'
import { ListBody } from '@/render/bodies/ListBody'
import { CompositionBody } from '@/render/bodies/CompositionBody'
import { TableBody } from '@/render/bodies/TableBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const base = { span: { colStart: 1, colSpan: 5, rowSpan: 4 }, family: 'inventario', format } as const

describe('ListBody · un ranking ya viene rankeado', () => {
  /** El defecto que v2 encontró EN EL RENDER: ordenar por `v` invierte la lista
   *  en cuanto la métrica es «más bajo = más urgente» —la reposición
   *  prioritaria se mide en días de cobertura— y mostraba el menos urgente
   *  primero, con el número 4 al lado. */
  const value = {
    forma: 'ranking',
    items: [
      { etiqueta: 'Urgente', v: 2, posicion: 1 },
      { etiqueta: 'Media', v: 9, posicion: 2 },
      { etiqueta: 'Baja', v: 30, posicion: 3 },
    ],
  } as unknown as Extract<Value, { forma: 'ranking' }>

  it('respeta `posicion` por defecto, no el valor', () => {
    render(<ListBody {...base} value={value} params={{}} metric="Días de cobertura" />)
    const filas = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(filas[0]).toContain('Urgente')
    expect(filas[2]).toContain('Baja')
  })

  it('la posición que se pinta es la del dato, no el índice de la fila', () => {
    render(
      <ListBody {...base} value={value} params={{ tope: 2, orden: 'desc' }} metric="Cobertura" />,
    )
    // Con `orden: desc` la primera fila es «Baja», y su número tiene que seguir
    // siendo el 3: pintar el índice diría 1 y mentiría sobre el ranking.
    expect(screen.getAllByRole('listitem')[0]?.textContent).toContain('3')
  })

  it('el label del lector es la MÉTRICA, no la etiqueta de la fila', () => {
    // Repetir la etiqueta decía «Nike Air, Nike Air» y nunca el número.
    render(<ListBody {...base} value={value} params={{ tope: 1 }} metric="Días de cobertura" />)
    expect(screen.getByText('Días de cobertura')).toBeInTheDocument()
  })
})

describe('CompositionBody · la rampa tiene cinco escalones', () => {
  const parts = Array.from({ length: 9 }, (_, i) => ({
    etiqueta: `Parte ${i + 1}`,
    v: 10 - i,
    porcentaje: 100 / 9,
  }))
  const value = { forma: 'composicion', partes: parts } as unknown as Extract<
    Value,
    { forma: 'composicion' }
  >

  it('agrupa en «Otros» a partir de la quinta parte', () => {
    // No es estética: una sexta parte repetiría un escalón y dos partes
    // distintas se verían iguales.
    render(<CompositionBody {...base} value={value} params={{}} metric="Mix" />)
    expect(screen.getByText(/5 partes agrupadas/)).toBeInTheDocument()
  })

  it('con cinco o menos no agrupa nada', () => {
    const pocas = { forma: 'composicion', partes: parts.slice(0, 4) } as unknown as typeof value
    render(<CompositionBody {...base} value={pocas} params={{}} metric="Mix" />)
    expect(screen.queryByText(/partes agrupadas/)).toBeNull()
  })
})

describe('ForecastBody · regla dura 6, sin banda no se publica', () => {
  it('con `escalarConIntervalo` el intervalo va en texto, pero va', () => {
    const value = {
      forma: 'escalarConIntervalo',
      v: 4280000,
      lo: 4100000,
      hi: 4460000,
      nivel: 0.9,
    } as unknown as Extract<Value, { forma: 'escalarConIntervalo' }>

    render(<ForecastBody {...base} value={value} params={{}} metric="Ventas" unit="USD" />)
    expect(screen.getByText(/Intervalo 90%/)).toBeInTheDocument()
  })

  it('los extremos del intervalo NO se abrevian', () => {
    // «4.2M – 4.3M» esconde cuánto mide el intervalo, que es justo lo que el
    // intervalo comunica.
    const value = {
      forma: 'escalarConIntervalo',
      v: 4280000,
      lo: 4100000,
      hi: 4460000,
      nivel: 0.9,
    } as unknown as Extract<Value, { forma: 'escalarConIntervalo' }>

    render(<ForecastBody {...base} value={value} params={{}} metric="Ventas" />)
    const texto = screen.getByText(/Intervalo 90%/).textContent ?? ''
    expect(texto).toContain('4,100,000')
    expect(texto).toContain('4,460,000')
  })
})

describe('GaugeBody · un medidor sin máximo no es un medidor', () => {
  const value = { forma: 'escalar', v: 72 } as unknown as Extract<Value, { forma: 'escalar' }>

  it('sin `maximo` lo dice y no dibuja el arco', () => {
    // Lo que falta es la BASE, y §1.3 no deja inventarla: 72 sobre qué.
    const { container } = render(<GaugeBody {...base} value={value} params={{}} metric="Avance" />)
    expect(screen.getByText(/Sin máximo declarado/)).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('con `maximo` en cero tampoco divide', () => {
    render(<GaugeBody {...base} value={value} params={{ maximo: 0 }} metric="Avance" />)
    expect(screen.getByText(/Sin máximo declarado/)).toBeInTheDocument()
  })
})

describe('TableBody · la columna se formatea entera, no celda por celda', () => {
  const value = {
    forma: 'tabular',
    columnas: [
      { clave: 'canal', titulo: 'Canal', numerica: false },
      { clave: 'roas', titulo: 'ROAS', numerica: true },
    ],
    filas: [
      { canal: 'Search', roas: 4.2 },
      { canal: 'Social', roas: 3 },
    ],
  } as unknown as Extract<Value, { forma: 'tabular' }>

  it('una columna con decimales los conserva en TODAS las celdas', () => {
    // Sin esto la columna sale «4.2 · 3»: el punto deja de alinearse y la
    // columna se lee mal aunque cada celda esté bien.
    render(<TableBody {...base} value={value} params={{}} metric="ROAS" />)
    expect(screen.getByText('4.2')).toBeInTheDocument()
    expect(screen.getByText('3.0')).toBeInTheDocument()
  })

  it('el encabezado lleva scope y la celda no repite su nombre', () => {
    render(<TableBody {...base} value={value} params={{}} metric="ROAS" />)
    // La celda hereda el nombre de la columna: un label propio la haría decir
    // el nombre dos veces.
    expect(screen.getByText('ROAS').closest('th')?.getAttribute('scope')).toBe('col')
    expect(screen.getAllByText('ROAS')).toHaveLength(1)
  })

  it('no muta el arreglo del payload al ordenar', () => {
    // El payload vive en la cache de TanStack Query: ordenarlo en el lugar
    // cambia lo que ve el próximo lector de esa entrada.
    const original = [...value.filas]
    render(
      <TableBody
        {...base}
        value={value}
        params={{ orden: { columna: 'roas', direccion: 'desc' } }}
        metric="ROAS"
      />,
    )
    expect(value.filas).toEqual(original)
  })
})
