// @vitest-environment jsdom

/** El primitivo `Label` · F1.13c · §ANCLA:TIPO-1
 *
 *  La cita de §2.3 de design.md es «**siempre mayúsculas**, 10px,
 *  letter-spacing 0.12em». Las tres aserciones se escriben desde esos tres
 *  números, no leyendo qué clases usa el componente.
 *
 *  **F1.28 partió la aserción del número en dos, y tiene que seguir siendo
 *  una.** Cuando el componente decía `text-[10px]`, el 10 estaba en el JSX y
 *  una sola aserción lo alcanzaba. Ahora dice `text-label` y el 10 vive en
 *  `tokens.css`: comprobar solo la clase dejaría de verificar la cita —
 *  `text-label` podría valer 14px y el test seguiría verde. Por eso cada
 *  número se comprueba en los dos saltos: que el componente use el token, y
 *  que el token valga lo que §2.3 dice.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Label } from '@/render/primitives/Label'

// Ruta desde la raíz y no `import.meta.url`: este archivo corre en jsdom, donde
// `import.meta.url` es una URL http y `readFileSync` la rechaza. Vitest corre
// desde la raíz del repositorio.
const TOKENS = readFileSync(resolve(process.cwd(), 'src/tokens/tokens.css'), 'utf-8')

describe('§ANCLA:TIPO-1 · «siempre mayúsculas, 10px, letter-spacing 0.12em»', () => {
  it('lleva las tres propiedades que la cita fija', () => {
    render(<Label>Base</Label>)
    const clases = screen.getByText('Base').className

    expect(clases).toContain('uppercase')
    expect(clases).toContain('text-label')
    expect(clases).toContain('tracking-rotulo')

    // El segundo salto: los dos tokens valen los dos números de la cita.
    expect(TOKENS).toMatch(/--text-label:\s*10px;/)
    expect(TOKENS).toMatch(/--tracking-rotulo:\s*0\.12em;/)
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
