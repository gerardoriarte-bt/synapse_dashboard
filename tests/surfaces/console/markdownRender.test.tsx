// @vitest-environment jsdom

/** La respuesta del agente, dibujada · F3.13
 *
 *  El parser tiene sus pruebas aparte y sin React. Acá se verifica lo que solo
 *  se ve montado: **que no exista ninguna ruta por la que el agente inyecte
 *  marcado**, y que cada bloque caiga en el elemento y el token que le toca.
 *
 *  La inyección es lo que más importa. El texto lo compone un modelo que
 *  consulta datos del tenant; si algún día alguien cambia esto por un
 *  renderizador general, esta prueba es la que avisa.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Markdown } from '@/surfaces/console/Markdown'

describe('F3.13 · el markdown se dibuja, no se vuelca', () => {
  it('`### Límite declarado` NO aparece con los numerales', () => {
    // El defecto que abrió la tarea, visto desde la pantalla.
    const { container } = render(
      <Markdown texto={'Cayó 12%.\n\n### Límite declarado\nNo cubre todo.'} />,
    )
    expect(container.textContent).not.toContain('###')
    expect(screen.getByText('Límite declarado')).toBeInTheDocument()
  })

  it('la sección lleva el rótulo de la casa · mono, mayúsculas, tracking', () => {
    // No un encabezado grande: la escala tipográfica no tiene un tamaño para
    // «subtítulo dentro de una respuesta de chat».
    render(<Markdown texto="### Puntos de lectura" />)
    const clases = screen.getByText('Puntos de lectura').className
    expect(clases).toContain('font-mono')
    expect(clases).toContain('uppercase')
    expect(clases).toContain('tracking-rotulo')
  })

  it('una lista se pinta como lista, con sus items', () => {
    render(<Markdown texto={'- Un sku cayó\n- Otro no'} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('una lista numerada usa `ol` · la numeración es del agente', () => {
    const { container } = render(<Markdown texto={'1. primero\n2. segundo'} />)
    expect(container.querySelector('ol')).not.toBeNull()
    expect(container.querySelector('ul')).toBeNull()
  })

  it('NO inyecta HTML del agente · ni una etiqueta llega al DOM', () => {
    // **La aserción que sostiene la regla.** Un renderizador general convertiría
    // esto en un `<img>` con un `onerror`, que es una respuesta del modelo
    // ejecutándose en la sesión de quien preguntó.
    const veneno = '<img src=x onerror="alert(1)"> y <b>negrita</b> y <script>alert(2)</script>'
    const { container } = render(<Markdown texto={veneno} />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    // Lo que sí: el texto literal, visible y sin ejecutarse.
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">')
  })

  it('`[SIN_COMPETENCIA]` se traduce y no se muestra crudo', () => {
    const { container } = render(
      <Markdown texto={'[SIN_COMPETENCIA]\nNo tengo la fuente de devoluciones.'} />,
    )
    expect(container.textContent).not.toContain('SIN_COMPETENCIA')
    // §PEN:C3 le dedica un bloque: el rótulo y la aclaración de que no es una
    // negativa genérica. Los dos CTAs del dibujo no se pintan — no hay
    // manejador, y la regla del CTA muerto lo prohíbe.
    expect(screen.getByText('Sin competencia')).toBeInTheDocument()
    expect(screen.getByText('No es una negativa genérica')).toBeInTheDocument()
    // Y el motivo sigue visible: es lo que el usuario necesita leer.
    expect(container.textContent).toContain('No tengo la fuente de devoluciones.')
  })

  it('el énfasis usa el naranja, que §2 concede a la cifra resaltada en prosa', () => {
    render(<Markdown texto="El margen cayó **12%** este mes." />)
    expect(screen.getByText('12%').className).toContain('text-acc')
  })
})
