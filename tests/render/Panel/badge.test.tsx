// @vitest-environment jsdom

/** El badge de degradado · §PEN:Panel/Badge Degradado · 2026-09-28
 *
 *  **Lo que se verifica son los TOKENS, y no es testear la implementación.** Lo
 *  que este componente promete es un par de contraste concreto —`acc` sobre
 *  `panel`, 4.91 en oscuro— y ese par sale de qué utilidades pinta. Un wash
 *  agregado de vuelta no rompe ninguna otra prueba: se ve bien, y hunde el par a
 *  4.07 sin que nada avise hasta la próxima corrida de `contraste`.
 *
 *  Es la misma razón por la que `escala.test.ts` cruza utilidades contra tokens:
 *  una clase que nombra un token inexistente compila, pasa el lint y se pinta
 *  sin tamaño.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DegradedBadge } from '@/render/Panel/DegradedBadge'

/** El chip · el `<span>` de afuera, que lleva borde, relleno y color. */
const clases = (container: HTMLElement) =>
  container.querySelector('span')?.className.split(/\s+/) ?? []

/** La nota · el elemento que lleva el texto. **Está aparte desde que el badge
 *  usa la primitiva `Note`**, y la prueba tiene que mirar dónde vive cada cosa:
 *  el tamaño es del rol tipográfico, el color es del chip. */
const clasesDelTexto = (texto: string) =>
  screen.getByText(texto).className.split(/\s+/)

describe('el badge es el chip del dibujo, no un rótulo con fondo', () => {
  it('NO lleva wash · es lo que lo hundía bajo AA', () => {
    // 4.17 con `bg-w3`, 4.91 sin él. El wash era invención nuestra: el `.pen`
    // dibuja el chip sin relleno. Ver la pregunta 13 de B0.9.
    const { container } = render(<DegradedBadge>Degradado</DegradedBadge>)
    expect(clases(container)).not.toContain('bg-w3')
    expect(clases(container).some((c) => c.startsWith('bg-'))).toBe(false)
  })

  it('pinta en `acc` y no en `dim`', () => {
    const { container } = render(<DegradedBadge>Degradado</DegradedBadge>)
    expect(clases(container)).toContain('text-acc')
    expect(clases(container)).not.toContain('text-dim')
  })

  it('el texto es mono 9 —nota— y no mono 10 —label—', () => {
    // §2.3 cierra el mono en cuatro tamaños y el dibujo elige el de nota. Por
    // eso el badge NO pasa por `Label`, que es mono 10 por definición de rol.
    render(<DegradedBadge>Degradado</DegradedBadge>)
    expect(clasesDelTexto('Degradado')).toContain('text-nota')
    expect(clasesDelTexto('Degradado')).not.toContain('text-label')
  })

  it('tiene borde · es lo que lo hace un chip y no un rótulo suelto', () => {
    const { container } = render(<DegradedBadge>Degradado</DegradedBadge>)
    expect(clases(container)).toContain('border-acc')
  })
})

describe('la marca no ensucia el árbol de accesibilidad', () => {
  it('el icono va `aria-hidden` y el texto queda solo', () => {
    // El significado lo carga el texto; un icono anunciado agregaría ruido a
    // quien lo escucha, que es la misma razón que `states/Icon`.
    const { container } = render(<DegradedBadge>Degradado · feed hace 31 h</DegradedBadge>)

    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByText('Degradado · feed hace 31 h')).toBeInTheDocument()
  })
})
