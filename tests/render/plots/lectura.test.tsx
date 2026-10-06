// @vitest-environment jsdom

/** Leer un gráfico · leyenda, eje del tiempo, hover y unidad · 2026-10-06
 *
 *  **Nació de mirar QA**: «hay cards que no se entiende qué está mostrando […]
 *  debería haber hovers que indiquen los montos y detallar qué son los ejes».
 *  Tendencia diaria tenía tres líneas sin nombre, sin fechas y sin forma de leer
 *  una cifra; Cumplimiento decía «26.5» sin el `%` que el catálogo declara.
 *
 *  **Se prueba a través del CUERPO y no del plot suelto**: lo que podía romperse
 *  es que `SeriesBody` no le pase a `PlotSeries` cómo fechar y cómo leer, y un
 *  plot probado solo lo dibujaría bien igual.
 *
 *  Los fixtures copian las formas medidas en QA ese día —`Ventas`, `Sesiones`,
 *  `Inversión` de `daily_trend`, con sus cifras—, ya con la `t` en ISO, que es
 *  como sale del adaptador. La conversión desde días epoch se prueba en
 *  `tests/api/tiempo.test.ts`.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeriesBody } from '@/render/bodies/SeriesBody'
import { BarsBody } from '@/render/bodies/BarsBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

type Multi = Extract<Value, { forma: 'seriesMultiples' }>
type Temporal = Extract<Value, { forma: 'serieTemporal' }>
type Categorica = Extract<Value, { forma: 'categorica' }>

const format = createFormat('es-MX')

const base = {
  span: { colStart: 1, colSpan: 6, rowSpan: 4 },
  family: 'demanda',
  metric: 'Tendencia diaria',
  format,
} as const

const DIAS = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']
const serie = (etiqueta: string, vs: readonly number[], ts = DIAS) => ({
  etiqueta,
  puntos: vs.map((v, i) => ({ t: ts[i] as string, v })),
})

const TENDENCIA: Multi = {
  forma: 'seriesMultiples',
  series: [
    serie('Ventas', [43520, 18289, 14064, 16906, 12470]),
    serie('Sesiones', [57126, 48424, 44857, 46642, 38578]),
    serie('Inversión', [2963, 1575, 1446, 1610, 1276]),
  ],
}

const MESES = ['2025-11-01', '2025-12-01', '2026-01-01']
const DOCE_MESES: Multi = {
  forma: 'seriesMultiples',
  series: [serie('Ventas', [1940000, 2740392, 1040000], MESES), serie('Inversión', [180580, 170000, 70000], MESES)],
}

const grafico = () => screen.getByRole('group', { name: /usá las flechas/ })

describe('la leyenda · el `.pen` la dibuja y no estaba', () => {
  it('nombra cada serie con el valor del ÚLTIMO punto', () => {
    render(<SeriesBody {...base} value={TENDENCIA} params={{}} />)
    const leyenda = screen.getByRole('list')
    expect(within(leyenda).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Ventas12,470',
      'Sesiones38,578',
      'Inversión1,276',
    ])
  })

  it('con UNA serie no hay leyenda · repetiría el título del panel', () => {
    const una: Temporal = { forma: 'serieTemporal', puntos: serie('x', [1, 2, 3]).puntos }
    render(<SeriesBody {...base} value={una} params={{}} />)
    expect(screen.queryByRole('list')).toBeNull()
  })
})

describe('el eje del tiempo', () => {
  it('una serie diaria se rotula con día y mes', () => {
    const { container } = render(<SeriesBody {...base} value={TENDENCIA} params={{}} />)
    const textos = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent)
    // **El 1 de octubre y no el 30 de septiembre**: `YYYY-MM-DD` es un día del
    // calendario, y leído en el huso de Ciudad de México retrocede uno.
    expect(textos).toContain('1 OCT')
    expect(textos).toContain('5 OCT')
  })

  it('una serie de primeros de mes se rotula con mes y año', () => {
    const { container } = render(
      <SeriesBody {...base} metric="Eficiencia de medios · 12m" value={DOCE_MESES} params={{}} />,
    )
    const textos = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent)
    expect(textos).toContain('NOV 25')
    expect(textos).toContain('ENE 26')
  })
})

describe('la lectura · el monto entero de cada serie en un instante', () => {
  it('con el teclado: la primera flecha lee el último punto, la izquierda retrocede', () => {
    render(<SeriesBody {...base} value={TENDENCIA} params={{}} />)
    fireEvent.keyDown(grafico(), { key: 'ArrowLeft' })
    fireEvent.keyDown(grafico(), { key: 'ArrowLeft' })
    fireEvent.keyDown(grafico(), { key: 'ArrowLeft' })

    const lectura = screen.getByRole('status')
    // Último (5), 4, 3: tres flechas dejan el índice 2.
    expect(lectura).toHaveTextContent('3 oct')
    // **Completo y no abreviado**: el eje dice «20K», la lectura dice la cifra.
    expect(lectura).toHaveTextContent('Ventas14,064')
    expect(lectura).toHaveTextContent('Sesiones44,857')
    expect(lectura).toHaveTextContent('Inversión1,446')
  })

  it('la leyenda sigue al punto leído', () => {
    render(<SeriesBody {...base} value={TENDENCIA} params={{}} />)
    fireEvent.keyDown(grafico(), { key: 'ArrowRight' })
    fireEvent.keyDown(grafico(), { key: 'ArrowLeft' })
    const leyenda = screen.getByRole('list')
    expect(within(leyenda).getAllByRole('listitem')[0]).toHaveTextContent('Ventas16,906')
  })

  it('con el puntero: el borde izquierdo lee el primer punto, y salir la cierra', () => {
    render(<SeriesBody {...base} value={TENDENCIA} params={{}} />)
    fireEvent.pointerMove(grafico(), { clientX: 0 })
    expect(screen.getByRole('status')).toHaveTextContent('Ventas43,520')

    fireEvent.pointerLeave(grafico())
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('un millón se lee ENTERO · «2,740,392» y no «2.7M», que es lo que dice el eje', () => {
    // La venta de diciembre de 2025 en `media_efficiency_12m`, medida en QA.
    render(<SeriesBody {...base} value={DOCE_MESES} params={{}} />)
    fireEvent.keyDown(grafico(), { key: 'ArrowRight' })
    fireEvent.keyDown(grafico(), { key: 'ArrowLeft' })
    expect(screen.getByRole('status')).toHaveTextContent('Ventas2,740,392')
    // **Y la que SÍ se podría abreviar tampoco se abrevia**: `format.number`
    // sólo abrevia sin pérdida, así que 2,740,392 sale entero de todos modos.
    // 170,000 es la que distingue: abreviada sería «170K».
    expect(screen.getByRole('status')).toHaveTextContent('Inversión170,000')
  })

  it('lleva la unidad de la métrica', () => {
    render(<SeriesBody {...base} value={TENDENCIA} params={{}} unit="USD" />)
    fireEvent.keyDown(grafico(), { key: 'ArrowRight' })
    expect(screen.getByRole('status')).toHaveTextContent('VentasUSD 12,470')
  })

  it('con base 100 NO lleva la unidad · la cifra es un índice, no un monto', () => {
    render(<SeriesBody {...base} value={TENDENCIA} params={{ normalizacion: 'base100' }} unit="USD" />)
    fireEvent.keyDown(grafico(), { key: 'ArrowRight' })
    expect(screen.getByRole('status')).not.toHaveTextContent('USD')
  })
})

describe('las barras · la cifra con su unidad', () => {
  const CUMPLIMIENTO: Categorica = {
    forma: 'categorica',
    items: [
      { etiqueta: 'Inversión', v: 11.8 },
      { etiqueta: 'Ventas', v: 26.5 },
    ],
  }

  it('«26.5%» y no «26.5» · el catálogo declara `%`', () => {
    const { container } = render(
      <BarsBody {...base} metric="Cumplimiento de objetivo" value={CUMPLIMIENTO} params={{}} unit="%" />,
    )
    const textos = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent)
    expect(textos).toContain('26.5%')
    expect(textos).toContain('11.8%')
  })

  it('cada barra se nombra al pasar · etiqueta y cifra completa', () => {
    const { container } = render(
      <BarsBody {...base} metric="Cumplimiento de objetivo" value={CUMPLIMIENTO} params={{}} unit="%" />,
    )
    const titulos = Array.from(container.querySelectorAll('rect > title')).map((t) => t.textContent)
    expect(titulos).toEqual(['Ventas · 26.5%', 'Inversión · 11.8%'])
  })
})
