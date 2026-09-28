// @vitest-environment jsdom

/** El foco de un estado que reemplaza la pantalla · §PEN «Sec · Foco y estados
 *  de control» · 2026-09-28
 *
 *  «UN ESTADO QUE REEMPLAZA LA PANTALLA RECIBE EL FOCO EN SU SALIDA.»
 *
 *  **Es la regla que quedaba sin construir de esa sección.** El anillo de 2 en
 *  `$acc`, el `:focus-visible` y el hover sobre `$elev` ya estaban; se verificó
 *  antes de escribir esto en vez de rehacerlos.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SurfaceMessage } from '@/surfaces/console/SurfaceMessage'

describe('la salida recibe el foco', () => {
  it('con una acción propia · el caso de un dashboard sin componer', () => {
    // Éste reemplaza la pantalla ENTERA, navbar incluido: lo que tenía el foco
    // se desmontó, así que sin esto el foco queda en el `<body>` y quien navega
    // con teclado tiene que tabular desde el principio para encontrar la única
    // salida que hay.
    render(
      <SurfaceMessage
        title="«Marca» todavía no se compuso"
        detail="Se compone en el builder"
        accion={{ rotulo: 'Volver a Overview', onAccion: vi.fn() }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Volver a Overview' })).toHaveFocus()
  })

  it('con «Reintentar» · el foco va ahí y no al otro botón', () => {
    render(
      <SurfaceMessage
        title="No se pudo cargar tu contexto"
        detail="Sin detalle del servidor"
        onRetry={vi.fn()}
        accion={{ rotulo: 'Volver a Overview', onAccion: vi.fn() }}
      />,
    )

    // Con los dos, el foco va al primero en el orden de lectura.
    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveFocus()
  })
})

describe('se pone UNA vez y no se repone', () => {
  it('un re-render NO le arranca el foco a quien ya tabuló', () => {
    // **El defecto que esto previene**, y sobrevivió a la primera tanda de
    // mutaciones: sin el arreglo de dependencias vacío el efecto corre en cada
    // render, así que cualquier cambio del padre —una consulta que resuelve, un
    // reloj— le devuelve el foco al botón mientras alguien está leyendo otra
    // cosa. Se ve como un salto y no como un error.
    const { rerender } = render(
      <SurfaceMessage
        title="«Marca» todavía no se compuso"
        detail="Se compone en el builder"
        accion={{ rotulo: 'Volver a Overview', onAccion: vi.fn() }}
      />,
    )
    const salida = screen.getByRole('button', { name: 'Volver a Overview' })
    expect(salida).toHaveFocus()

    // Quien lee se mueve a otro lado, y el padre vuelve a renderizar.
    salida.blur()
    expect(salida).not.toHaveFocus()
    rerender(
      <SurfaceMessage
        title="«Marca» todavía no se compuso"
        detail="Se compone en el builder · detalle actualizado"
        accion={{ rotulo: 'Volver a Overview', onAccion: vi.fn() }}
      />,
    )

    expect(salida).not.toHaveFocus()
  })
})

describe('sin salida no se fuerza nada', () => {
  it('un mensaje sin acción deja el foco donde estaba', () => {
    // **No se manda el foco al contenedor.** Anunciar un `<main>` no informa de
    // nada, y robarlo sin tener a dónde llevarlo es peor que no tocarlo.
    const { container } = render(
      <SurfaceMessage title="Este cliente todavía no tiene un dashboard" detail="Se crean en administración" />,
    )

    expect(container.querySelector('button')).toBeNull()
    expect(document.activeElement).toBe(document.body)
  })
})
