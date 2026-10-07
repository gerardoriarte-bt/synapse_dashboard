// @vitest-environment jsdom

/** El usuario con presencia · decisión humana del 2026-10-07
 *
 *  «No se diferencia con el resto de información.» Lo que se afirma es lo que
 *  lo distingue: las iniciales y el nombre en `ink`, no en el gris del rótulo.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChipDeUsuario } from '@/surfaces/ChipDeUsuario'
import { iniciales } from '@/surfaces/usuario'

describe('las iniciales', () => {
  it.each([
    ['María Benítez', 'MB'],
    ['Dev Local', 'DL'],
    ['ana maría paz', 'AP'],
    ['Prince', 'P'],
    ['  Otra   Persona  ', 'OP'],
    ['', ''],
  ])('%s → %s', (nombre, esperado) => {
    expect(iniciales(nombre)).toBe(esperado)
  })
})

describe('el chip', () => {
  it('pinta las iniciales SIN anunciarlas, y el nombre en ink', () => {
    const { container } = render(<ChipDeUsuario nombre="María Benítez" />)
    const circulo = screen.getByText('MB')
    expect(circulo).toHaveAttribute('aria-hidden')
    const nombre = screen.getByText('María Benítez')
    // Era `text-dim` en mono: el traje del rótulo, que es lo que lo confundía
    // con el resto de la barra.
    expect(nombre.className).toContain('text-ink')
    expect(nombre.className).toContain('font-body')
    for (const svg of Array.from(container.querySelectorAll('svg'))) {
      expect(svg).toHaveAttribute('aria-hidden')
    }
  })

  it('el rol, sólo si viene', () => {
    const { rerender } = render(<ChipDeUsuario nombre="María Benítez" />)
    expect(screen.queryByText('Super-admin')).toBeNull()
    rerender(<ChipDeUsuario nombre="María Benítez" rol="Super-admin" />)
    expect(screen.getByText('Super-admin')).toBeInTheDocument()
  })
})
