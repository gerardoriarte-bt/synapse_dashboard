// @vitest-environment jsdom

/** Los huecos del preview · §3.4 regla 3 · §PEN:B5 · 2026-09-28
 *
 *  **«El hueco se muestra en el builder, nunca en la consola.** B5 dibuja los
 *  huecos en su posición original —es la vista de diagnóstico, y por eso avisa
 *  cuántos hay y de qué ancho—.»
 *
 *  Lo que se verifica es de dónde sale el hueco, que es donde está el error
 *  fácil: deducirlo de un espacio vacío en la grilla daría huecos donde el admin
 *  dejó lugar a propósito, y la pantalla afirmaría «no llega a este rol» sobre
 *  una causa que nadie verificó.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RolePreview } from '@/surfaces/builder/RolePreview'
import type { LayoutDetalle, PreviewDeRol } from '@/api/admin'

const panel = (id: string, colStart: number, colSpan: number) => ({
  id,
  tipo: 'kpi' as const,
  metricId: `m-${id}`,
  colStart,
  colSpan,
  rowSpan: 4,
})

const tab = { id: 'tab-a', nombre: 'Resumen', pregunta: '¿Cómo vamos?', orden: 1, roles: [] }

/** El rol ve dos de los tres: falta el del medio, de 5 columnas. */
const preview: PreviewDeRol = {
  layoutId: 'l-1',
  dashboardId: 'd-1',
  estado: 'borrador',
  rol: { id: 'r-pla', nombre: 'Planner' },
  tabs: [{ tab, paneles: [panel('p-1', 1, 3), panel('p-3', 9, 4)] }],
}

const completo: LayoutDetalle = {
  layout: {} as LayoutDetalle['layout'],
  tabs: [{ tab, panels: [panel('p-1', 1, 3), panel('p-2', 4, 5), panel('p-3', 9, 4)] }],
}

describe('el hueco sale de la DIFERENCIA, no de un espacio vacío', () => {
  it('lo declara con su ancho real y su razón', () => {
    render(<RolePreview preview={preview} completo={completo} onVolver={vi.fn()} />)

    expect(screen.getByText('Hueco · 5 columnas')).toBeVisible()
    expect(screen.getByText('No llega a este rol')).toBeVisible()
    expect(screen.getByText('Al publicar se cierra')).toBeVisible()
  })

  it('lo cuenta arriba, como el dibujo', () => {
    render(<RolePreview preview={preview} completo={completo} onVolver={vi.fn()} />)
    expect(screen.getByText('1 hueco(s) · 5 columnas')).toBeVisible()
  })

  it('el hueco conserva la POSICIÓN del panel que falta', () => {
    // «En su posición original», dice §3.4. Si se dibujara al final o se
    // recompusiera, la vista de diagnóstico dejaría de mostrar dónde estaba.
    const { container } = render(
      <RolePreview preview={preview} completo={completo} onVolver={vi.fn()} />,
    )
    const conPosicion = Array.from(container.querySelectorAll('[style*="grid-column"]')).map((n) =>
      n.getAttribute('style'),
    )
    // El que falta arrancaba en la columna 4 y medía 5.
    expect(conPosicion.some((s) => s?.includes('4') === true && s.includes('span 5'))).toBe(true)
  })
})

describe('un panel MOVIDO por un override no es un hueco', () => {
  it('se identifica por id y no por posición', () => {
    // **El caso real**, medido el 2026-09-28: el lente `planner` devuelve los
    // paneles con `col_span` 4 donde el admin tiene 12, o sea que un override
    // los mueve y los reduce.
    //
    // Comparando por POSICIÓN, el panel movido contaría dos veces: ausente en su
    // columna original —un hueco fantasma— y presente en la nueva. La pantalla
    // diría «no llega a este rol» sobre un panel que el rol sí ve.
    const movido: PreviewDeRol = {
      ...preview,
      tabs: [{ tab, paneles: [panel('p-1', 1, 3), panel('p-2', 7, 5), panel('p-3', 9, 4)] }],
    }
    render(<RolePreview preview={movido} completo={completo} onVolver={vi.fn()} />)

    // `p-2` está en las dos, movido de la columna 4 a la 7. No hay hueco.
    expect(screen.queryByText(/Hueco ·/)).toBeNull()
    expect(screen.queryByText(/hueco\(s\)/)).toBeNull()
  })
})

describe('sin el layout sin lente NO se inventan', () => {
  it('no se deduce un hueco de un espacio vacío · se declara que no se puede', () => {
    // **El error que esto previene.** El rol ve las columnas 1–3 y 9–12, así que
    // hay un espacio libre de 4 a 8 — y sin el layout completo no se sabe si ahí
    // había un panel o si el admin lo dejó libre.
    render(<RolePreview preview={preview} onVolver={vi.fn()} />)

    expect(screen.queryByText(/Hueco ·/)).toBeNull()
    expect(screen.getByText('Los huecos no se pueden calcular sin el layout sin lente')).toBeVisible()
  })
})

describe('sin huecos no se dice nada', () => {
  it('un rol que ve todo no muestra el aviso', () => {
    const todo: LayoutDetalle = {
      layout: {} as LayoutDetalle['layout'],
      tabs: [{ tab, panels: [panel('p-1', 1, 3), panel('p-3', 9, 4)] }],
    }
    render(<RolePreview preview={preview} completo={todo} onVolver={vi.fn()} />)

    expect(screen.queryByText(/hueco\(s\)/)).toBeNull()
    expect(screen.queryByText(/Hueco ·/)).toBeNull()
  })
})
