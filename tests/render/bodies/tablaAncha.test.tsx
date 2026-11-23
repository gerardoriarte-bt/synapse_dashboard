// @vitest-environment jsdom

/** La tabla ancha se lee entera, sin pisarse · 2026-11-23.
 *
 *  Visto en QA con la tabla de campañas de Terpel (`media_by_campaign`): diez
 *  columnas en un panel de ocho. Con `w-full` el ancho del panel se repartía
 *  entre las diez, dos celdas de texto quedaban pegadas
 *  —«CombustiblesCombustibles»— y la columna CTR salía cortada.
 *
 *  **jsdom no mide**, así que se afirma la estructura que en el navegador lo
 *  impide: la tabla mide lo que piden sus columnas y nunca menos que el panel,
 *  ninguna celda envuelve, entre columnas hay aire, el nombre se trunca con
 *  tope y la cabecera queda fija —«CABECERA FIJA», del `.pen`—. El contenedor
 *  que scrollea es el del cuerpo.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TableBody } from '@/render/bodies/TableBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const span = { colStart: 1, colSpan: 8, rowSpan: 5 }

const CLAVES = ['campana', 'familia', 'cuenta', 'plataforma', 'inversion', 'impresiones', 'alcance', 'clics', 'cpm', 'ctr']

const value = {
  forma: 'tabular',
  columnas: CLAVES.map((clave, i) => ({ clave, titulo: clave.toUpperCase(), numerica: i >= 4 })),
  filas: [1, 2, 3].map((n) => ({
    campana: `Campaña de combustibles de temporada alta número ${String(n)}`,
    familia: 'Combustibles',
    cuenta: 'Combustibles',
    plataforma: 'Meta',
    inversion: 1000 * n,
    impresiones: 250000 * n,
    alcance: 120000 * n,
    clics: 3000 * n,
    cpm: 4.1,
    ctr: 1.2,
  })),
} as unknown as Extract<Value, { forma: 'tabular' }>

const clases = (el: Element) => (el.getAttribute('class') ?? '').split(/\s+/)

function montar() {
  return render(<TableBody value={value} params={{}} span={span} family="medios" format={format} metric="Campañas" />)
}

describe('TableBody en el panel · diez columnas en ocho', () => {
  it('la tabla mide lo que piden sus columnas, nunca menos que el panel', () => {
    montar()
    const tabla = screen.getByRole('table')
    expect(clases(tabla)).toEqual(expect.arrayContaining(['w-max', 'min-w-full']))
    // `w-full` es justo lo que repartía el panel entre las diez y las pisaba.
    expect(clases(tabla)).not.toContain('w-full')
    // Y lo que no entra scrollea en el contenedor del cuerpo, no en la página.
    expect(clases(tabla.parentElement!)).toEqual(expect.arrayContaining(['h-full', 'min-h-0', 'overflow-auto']))
  })

  it('ninguna celda envuelve, y entre columnas hay aire', () => {
    montar()
    for (const celda of screen.getAllByRole('cell')) {
      expect(clases(celda)).toContain('whitespace-nowrap')
    }
    // Las dos celdas de texto vecinas que se leían «CombustiblesCombustibles».
    const [familia, cuenta] = screen.getAllByText('Combustibles').slice(0, 2).map((e) => e.closest('td')!)
    expect(clases(familia!)).toContain('pl-4')
    expect(clases(cuenta!)).toContain('pl-4')
    // La primera columna no lleva el aire: va contra el borde del cuerpo.
    expect(clases(screen.getAllByRole('cell')[0]!)).not.toContain('pl-4')
  })

  it('la cabecera queda fija, con el fondo del panel', () => {
    montar()
    for (const th of screen.getAllByRole('columnheader')) {
      expect(clases(th)).toEqual(expect.arrayContaining(['sticky', 'top-0', 'bg-panel', 'whitespace-nowrap']))
    }
  })

  it('el nombre de la fila se trunca con tope, y entero en el title', () => {
    montar()
    const nombre = screen.getByText('Campaña de combustibles de temporada alta número 1')
    expect(clases(nombre)).toEqual(expect.arrayContaining(['truncate', 'max-w-60']))
    expect(nombre).toHaveAttribute('title', 'Campaña de combustibles de temporada alta número 1')
  })

  it('en la conversación sigue la anatomía de lectura, que no se tocó', () => {
    render(
      <TableBody value={value} params={{}} span={span} family="medios" format={format} metric="Campañas" lectura="conversacion" />,
    )
    expect(clases(screen.getByRole('table'))).toContain('w-full')
  })
})
