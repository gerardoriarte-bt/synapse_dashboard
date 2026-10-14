// @vitest-environment jsdom

/** Los tres registros que separan leer de tocar · 2026-10-06
 *
 *  `Ayuda`, `Accion` y `Opcion`, escritos desde lo que la auditoría pidió
 *  —`docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md` §1.4— y no desde
 *  las clases que el componente usa:
 *
 *  - una frase de ayuda **no** es un rótulo: ni mono ni mayúsculas;
 *  - una acción **dispara** —la regla de prueba de CLAUDE.md: que el callback
 *    se llame, no que el botón exista— y deshabilitada no dispara;
 *  - una opción dice si está elegida de una forma que se anuncia, no sólo con
 *    color;
 *  - lo destructivo usa `peligro`, que existe en los dos temas.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Accion } from '@/render/primitives/Accion'
import { Ayuda } from '@/render/primitives/Ayuda'
import { Opcion } from '@/render/primitives/Opcion'

const DECISIONES = readFileSync(resolve(process.cwd(), 'src/tokens/decisiones.css'), 'utf-8')

describe('Ayuda · una frase se escribe como frase', () => {
  it('no lleva el traje del rótulo', () => {
    render(<Ayuda>Arrastrá un tipo al lienzo</Ayuda>)
    const clases = screen.getByText('Arrastrá un tipo al lienzo').className
    expect(clases).not.toContain('uppercase')
    expect(clases).not.toContain('font-mono')
    expect(clases).not.toContain('tracking-rotulo')
  })
})

describe('Accion · lo que se toca tiene caja y dispara', () => {
  it('dispara el callback', () => {
    const fn = vi.fn()
    render(<Accion onClick={fn}>Guardar</Accion>)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('deshabilitada no dispara', () => {
    const fn = vi.fn()
    render(
      <Accion onClick={fn} deshabilitada>
        Publicar
      </Accion>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
    expect(fn).not.toHaveBeenCalled()
  })

  it('tiene borde en reposo y no viste el rótulo', () => {
    render(<Accion onClick={() => {}}>Componer</Accion>)
    const clases = screen.getByRole('button', { name: 'Componer' }).className
    expect(clases).toMatch(/\bborder\b/)
    expect(clases).not.toContain('uppercase')
    expect(clases).not.toContain('font-mono')
  })

  it('el nombre accesible puede ser más largo que el texto', () => {
    render(
      <Accion onClick={() => {}} etiqueta="Quitar la pestaña Ventas">
        Quitar
      </Accion>,
    )
    expect(screen.getByRole('button', { name: 'Quitar la pestaña Ventas' })).toBeTruthy()
  })

  it('lo destructivo va en `peligro`, que existe en los dos temas', () => {
    render(
      <Accion onClick={() => {}} variante="peligro">
        Quitar
      </Accion>,
    )
    expect(screen.getByRole('button', { name: 'Quitar' }).className).toContain('text-peligro')
    expect(DECISIONES).toMatch(/@theme static\s*\{[^}]*--color-peligro:/)
    expect(DECISIONES).toMatch(/data-theme='light'\]\s*\{[^}]*--color-peligro:/)
  })

  it('la primaria es la única con relleno de acento', () => {
    const { rerender } = render(<Accion onClick={() => {}}>A</Accion>)
    expect(screen.getByRole('button').className).not.toContain('bg-acc')
    rerender(
      <Accion onClick={() => {}} variante="primaria">
        A
      </Accion>,
    )
    expect(screen.getByRole('button').className).toContain('bg-acc')
  })
})

describe('Opcion · lo elegido se anuncia', () => {
  it('declara su estado con aria-pressed', () => {
    const { rerender } = render(
      <Opcion elegida={false} onClick={() => {}}>
        Ventas
      </Opcion>,
    )
    expect(screen.getByRole('button', { name: 'Ventas' }).getAttribute('aria-pressed')).toBe('false')
    rerender(
      <Opcion elegida onClick={() => {}}>
        Ventas
      </Opcion>,
    )
    expect(screen.getByRole('button', { name: 'Ventas' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('dispara al elegirla', () => {
    const fn = vi.fn()
    render(
      <Opcion elegida={false} onClick={fn}>
        Ventas
      </Opcion>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ventas' }))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('tiene caja también sin elegir', () => {
    render(
      <Opcion elegida={false} onClick={() => {}}>
        Ventas
      </Opcion>,
    )
    expect(screen.getByRole('button', { name: 'Ventas' }).className).toMatch(/\bborder\b/)
  })
})
