// @vitest-environment jsdom

/** El primitivo `Label` · F1.13c · §ANCLA:TIPO-1
 *
 *  La cita de §2.3 de design.md es «**siempre mayúsculas**, 10px,
 *  letter-spacing 0.12em». Las tres aserciones se escriben desde esos tres
 *  números, no leyendo qué clases usa el componente.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Label } from '@/render/primitives/Label'

describe('§ANCLA:TIPO-1 · «siempre mayúsculas, 10px, letter-spacing 0.12em»', () => {
  it('lleva las tres propiedades que la cita fija', () => {
    render(<Label>Base</Label>)
    const clases = screen.getByText('Base').className

    expect(clases).toContain('uppercase')
    expect(clases).toContain('text-[10px]')
    expect(clases).toContain('tracking-[0.12em]')
  })

  it('las mayúsculas son del componente, no del llamador', () => {
    // Es la propiedad que hace la regla verificable: escrito en prosa o en
    // mayúsculas, sale igual. Si dependiera del llamador, «siempre mayúsculas»
    // sería una regla que alguien puede olvidar.
    render(
      <>
        <Label>Procedencia</Label>
        <Label>PROCEDENCIA</Label>
      </>,
    )
    const [prosa, gritado] = screen.getAllByText(/procedencia/i)
    expect(prosa?.className).toBe(gritado?.className)
  })

  it('es mono y dim · §2.3 le da a los rótulos la tipografía de datos', () => {
    render(<Label>Base</Label>)
    const clases = screen.getByText('Base').className
    expect(clases).toContain('font-mono')
    expect(clases).toContain('text-dim')
  })

  it('sin un solo hex literal · regla dura 1', () => {
    render(<Label>Base</Label>)
    expect(screen.getByText('Base').className).not.toMatch(/#[0-9a-f]{3,8}/i)
  })
})

describe('el elemento', () => {
  it('es un span por defecto y dt cuando encabeza un dato', () => {
    const { container } = render(
      <>
        <Label>Base</Label>
        <Label as="dt">Capa</Label>
      </>,
    )
    expect(container.querySelector('span')).not.toBeNull()
    expect(container.querySelector('dt')).not.toBeNull()
  })
})
