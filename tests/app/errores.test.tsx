// @vitest-environment jsdom

/** Los errores del navegador se registran · 2026-11-09
 *
 *  Lo que se prueba es lo que no se ve: qué viaja —y qué NO—, que un render
 *  que se repite no llene el log, y que un error de render deje un mensaje en
 *  vez de la pantalla en blanco.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { crearReportero, escucharErroresGlobales } from '@/app/errores'

function reportero() {
  const enviados: Record<string, string>[] = []
  const reportar = crearReportero({
    enviar: (cuerpo) => enviados.push(JSON.parse(cuerpo) as Record<string, string>),
    ruta: () => '/admin/clientes',
  })
  return { enviados, reportar }
}

describe('qué viaja', () => {
  it('el tipo, el mensaje con su nombre, la pila y la ruta · y nada más', () => {
    const { enviados, reportar } = reportero()
    reportar('react', new TypeError('x is undefined'))
    expect(enviados).toHaveLength(1)
    expect(Object.keys(enviados[0] ?? {}).sort()).toEqual(['mensaje', 'pila', 'ruta', 'tipo'])
    expect(enviados[0]).toMatchObject({
      tipo: 'react',
      mensaje: 'TypeError: x is undefined',
      ruta: '/admin/clientes',
    })
  })

  it('la pila se corta en seis líneas', () => {
    const { enviados, reportar } = reportero()
    const error = new Error('hondo')
    error.stack = Array.from({ length: 20 }, (_, i) => `línea ${i}`).join('\n')
    reportar('error', error)
    expect(enviados[0]?.pila?.split('\n')).toHaveLength(6)
  })

  it('un mensaje largo se recorta · cabe en los 8 KB que nginx acepta', () => {
    const { enviados, reportar } = reportero()
    reportar('error', new Error('a'.repeat(5000)))
    expect(enviados[0]?.mensaje?.length).toBeLessThanOrEqual(301 + 'Error: '.length)
    expect(JSON.stringify(enviados[0]).length).toBeLessThan(8 * 1024)
  })

  it('lo que no es un Error se manda como texto', () => {
    const { enviados, reportar } = reportero()
    reportar('promesa', 'se cayó la red')
    expect(enviados[0]).toMatchObject({ tipo: 'promesa', mensaje: 'se cayó la red', pila: '' })
  })
})

describe('no llena el log', () => {
  it('el mismo error dos veces es uno', () => {
    const { enviados, reportar } = reportero()
    reportar('react', new Error('igual'))
    reportar('react', new Error('igual'))
    expect(enviados).toHaveLength(1)
  })

  it('el mismo mensaje con otro tipo sí se manda: es otro camino', () => {
    const { enviados, reportar } = reportero()
    reportar('react', new Error('igual'))
    reportar('promesa', new Error('igual'))
    expect(enviados).toHaveLength(2)
  })

  it('como mucho diez por carga de página', () => {
    const { enviados, reportar } = reportero()
    for (let i = 0; i < 25; i++) reportar('error', new Error(`distinto ${i}`))
    expect(enviados).toHaveLength(10)
  })
})

describe('lo que React no ve', () => {
  it('un error suelto y una promesa sin catch llegan al reportero', () => {
    const reportar = vi.fn()
    escucharErroresGlobales(reportar)
    const error = new Error('en un manejador')
    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }))
    const motivo = new Error('sin catch')
    const rechazo = new Event('unhandledrejection') as Event & { reason: unknown }
    rechazo.reason = motivo
    window.dispatchEvent(rechazo)
    expect(reportar).toHaveBeenCalledWith('error', error)
    expect(reportar).toHaveBeenCalledWith('promesa', motivo)
  })
})

describe('un error de render no deja la pantalla en blanco', () => {
  function Rompe(): never {
    throw new Error('render roto')
  }

  it('se ve un mensaje con salida, no un vacío', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <ErrorBoundary>
        <Rompe />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Algo falló en esta pantalla')).toBeTruthy()
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('sin error, pinta lo que envuelve', () => {
    render(
      <ErrorBoundary>
        <p>la consola</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('la consola')).toBeTruthy()
  })
})
