// @vitest-environment jsdom

/** La BASE y la procedencia detrás del ⓘ · 2026-10-06
 *
 *  Decisión humana contra las reglas 8 y 9 de `design.md`: «ensucian la lectura
 *  […] mientras más pequeña es la card es más molesto». Ver
 *  `src/render/Panel/MetaInfo.tsx`.
 *
 *  **Lo que se prueba es que se pueda LLEGAR por los tres caminos** —puntero,
 *  teclado y toque—, porque esconder la gobernanza sólo se sostiene si nadie
 *  queda sin forma de verla. Y que lo que es ESTADO, el degradado, no se esconda.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Panel } from '@/render/Panel/Panel'
import { createFormat } from '@/render/format'
import type { Metric, Payload, Value } from '@/api/types'

const format = createFormat('es-MX')
const now = new Date('2026-09-02T12:00:00Z')

const metric = {
  id: 'm-1',
  key: 'daily_trend',
  nombre: 'Tendencia diaria',
  forma: 'escalar',
  familia: 'demanda',
  capa: 'GOLD',
  fuente: 'Reporte diario de ecommerce del cliente',
  ventana: 'Cada día del mes calendario seleccionado',
  base: 'Venta, visitas e inversión de cada día, sin agregar',
  estado: 'DISPONIBLE',
  direccionSemantica: null,
  catalogVersion: 1,
} as Metric

const conCifra = {
  estado: 'DISPONIBLE',
  valor: { forma: 'escalar', v: 4200 } as Value,
  base: 'Venta, visitas e inversión de cada día, sin agregar',
  capa: 'GOLD',
  fuente: 'Reporte diario de ecommerce del cliente',
  frescura: '2026-09-02T08:00:00Z',
  catalogVersion: 1,
} as unknown as Payload

function montar(payload: Payload = conCifra) {
  return render(
    <Panel metric={metric} payload={payload} placement={{ colStart: 1, colSpan: 3, rowSpan: 4 }} format={format} now={now}>
      <p>EL CUERPO</p>
    </Panel>,
  )
}

const boton = () => screen.getByRole('button', { name: 'Base y procedencia' })

describe('cerrada, la card no muestra la gobernanza', () => {
  it('ni la BASE, ni la fuente, ni la capa', () => {
    const { container } = montar()
    expect(container.textContent).not.toContain('sin agregar')
    expect(container.textContent).not.toContain('Reporte diario')
    expect(container.textContent).not.toContain('GOLD')
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('se llega por los tres caminos', () => {
  it('pasando el cursor, y se cierra al salir', () => {
    montar()
    fireEvent.mouseEnter(boton().parentElement as HTMLElement)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Venta, visitas e inversión de cada día, sin agregar')
    fireEvent.mouseLeave(boton().parentElement as HTMLElement)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('con el foco del teclado, y se cierra al irse', () => {
    montar()
    fireEvent.focus(boton())
    expect(screen.getByRole('tooltip')).toHaveTextContent('Cada día del mes calendario seleccionado')
    fireEvent.blur(boton())
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('con un toque queda FIJADA, aunque el foco se vaya', () => {
    montar()
    fireEvent.click(boton())
    fireEvent.blur(boton())
    expect(screen.getByRole('tooltip')).toHaveTextContent('GOLD')
    expect(boton()).toHaveAttribute('aria-expanded', 'true')
  })

  it('fijada, se suelta tocando afuera', () => {
    montar()
    fireEvent.click(boton())
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('y con Escape', () => {
    montar()
    fireEvent.click(boton())
    fireEvent.keyDown(boton(), { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('tocar ADENTRO de la ficha no la cierra', () => {
    montar()
    fireEvent.click(boton())
    fireEvent.pointerDown(screen.getByRole('tooltip'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })
})

describe('lo que es estado NO se esconde', () => {
  it('el badge de DEGRADADO se ve sin abrir nada', () => {
    montar({ ...conCifra, estado: 'DEGRADADO' } as Payload)
    expect(screen.getByText('Degradado')).toBeVisible()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
