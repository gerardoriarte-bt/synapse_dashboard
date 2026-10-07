// @vitest-environment jsdom

/** Cargar meses · A5 · 2026-10-07
 *
 *  **La regla de prueba de este repositorio: que el callback DISPARE, no que el
 *  botón exista.** Un botón muerto se ve igual que uno que funciona. Por eso
 *  cada prueba de la acción mira con qué meses se llamó `onCargar`.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CargarPeriodos } from '@/surfaces/admin/CargarPeriodos'
import { createFormat } from '@/render/format'

const format = createFormat('es-MX')

const montar = (over: Partial<Parameters<typeof CargarPeriodos>[0]> = {}) => {
  const onCargar = vi.fn()
  render(
    <CargarPeriodos
      mesActual="2026-10"
      cargados={new Set(['2026-09', '2026-10'])}
      enCurso={new Set()}
      onCargar={onCargar}
      format={format}
      {...over}
    />,
  )
  return onCargar
}

const mes = (re: RegExp) => screen.getByRole('button', { name: re })

describe('qué se ofrece', () => {
  it('los meses del año en curso hasta el actual · ninguno futuro', () => {
    montar()
    const meses = screen.getByRole('group', { name: 'Meses de 2026' })
    expect(meses.querySelectorAll('button')).toHaveLength(10)
  })

  it('cada mes dice si está cargado · es lo que explica el hueco del dashboard', () => {
    montar()
    expect(mes(/sep.*cargado/i)).toBeInTheDocument()
    expect(mes(/jun.*sin cargar/i)).toBeInTheDocument()
  })

  it('el año anterior ofrece sus doce meses', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: '2025' }))
    expect(
      screen.getByRole('group', { name: 'Meses de 2025' }).querySelectorAll('button'),
    ).toHaveLength(12)
  })
})

describe('la acción DISPARA con lo elegido', () => {
  it('elegir dos meses y cargar llama con esos dos, en orden', async () => {
    const onCargar = montar()
    await userEvent.click(mes(/jul/i))
    await userEvent.click(mes(/feb/i))
    await userEvent.click(screen.getByRole('button', { name: 'Cargar 2 meses' }))
    expect(onCargar).toHaveBeenCalledWith(['2026-02', '2026-07'])
  })

  it('«elegir los sin cargar» marca los que faltan y NO carga solo', async () => {
    const onCargar = montar()
    await userEvent.click(screen.getByRole('button', { name: /Elegir los 8 sin cargar de 2026/ }))
    expect(onCargar).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Cargar 8 meses' }))
    expect(onCargar).toHaveBeenCalledWith([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
    ])
  })

  it('lo elegido en otro año se conserva · un pedido puede cruzar el cambio de año', async () => {
    const onCargar = montar()
    await userEvent.click(mes(/ene/i))
    await userEvent.click(screen.getByRole('button', { name: '2025' }))
    await userEvent.click(mes(/dic/i))
    await userEvent.click(screen.getByRole('button', { name: 'Cargar 2 meses' }))
    expect(onCargar).toHaveBeenCalledWith(['2025-12', '2026-01'])
  })

  it('sin nada elegido, cargar está deshabilitado · no se manda una lista vacía', () => {
    montar()
    expect(screen.getByRole('button', { name: 'Cargar meses' })).toBeDisabled()
  })

  it('sin `onCargar` la acción no se pinta · un botón muerto es peor que uno ausente', () => {
    montar({ onCargar: undefined } as never)
    expect(screen.queryByRole('button', { name: /^Cargar/ })).toBeNull()
  })
})

describe('lo que pasa después de pedir', () => {
  it('dice qué se está cargando', () => {
    montar({ pendientes: ['2026-07'] })
    expect(screen.getByText(/Cargando 2026-07/)).toBeInTheDocument()
  })

  it('pasado el tope, dice qué no terminó en vez de prometer «cargando» para siempre', () => {
    montar({ sinTerminar: ['2026-07'] })
    expect(screen.getByText(/No terminaron en diez minutos: 2026-07/)).toBeInTheDocument()
  })

  it('el error del servicio se muestra con su frase', () => {
    montar({ error: 'el tenant no tiene agentes activos' })
    expect(screen.getByText(/el tenant no tiene agentes activos/)).toBeInTheDocument()
  })
})
