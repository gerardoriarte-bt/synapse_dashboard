// @vitest-environment jsdom

/** Un solo título por pantalla de admin · §PEN A1–A5 · 2026-09-28
 *
 *  **Lo destapó una pregunta de tamaño.** El dibujo pone los títulos de
 *  superficie en 26 y el código los pintaba en 15; al ir a cambiarlo apareció que
 *  había DOS: `AdminChrome` pinta `pantalla.nombre` y las vistas repetían el
 *  mismo texto en su propio `<h1>`. El dibujo tiene uno.
 *
 *  **Y ninguna prueba lo veía**: las 1015 pasaban con el duplicado puesto. Por
 *  eso ésta existe — no para el tamaño, que lo garantiza el token, sino para que
 *  el título no vuelva a duplicarse.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminChrome } from '@/surfaces/admin/AdminChrome'
import { FeedHealth } from '@/surfaces/admin/FeedHealth'
import { UserList } from '@/surfaces/admin/UserList'
import { createFormat } from '@/render/format'

const format = createFormat('es-MX')

describe('el título de la pantalla vive en el chrome, y es uno solo', () => {
  it('con la vista adentro sigue habiendo UN `h1`', () => {
    render(
      <AdminChrome
        activa="feeds"
        onIr={vi.fn()}
        onSalir={vi.fn()}
        tenants={[]}
        tenantActivo={null}
        onTenant={vi.fn()}
      >
        <FeedHealth fuentes={[]} tenant={null} format={format} />
      </AdminChrome>,
    )

    const titulos = screen.getAllByRole('heading', { level: 1 })
    expect(titulos).toHaveLength(1)
    expect(titulos[0]).toHaveTextContent('Salud de feeds')
    // **Y con el token que el dibujo eligió**, no el vecino. El tamaño llega
    // solo —`token-drift` lo garantiza byte a byte contra el `.pen`— pero CUÁL
    // token se usa es una decisión, y volver a `titulo` dejaría estos títulos en
    // 15 donde el dibujo dice 26, sin que nada avise.
    expect(titulos[0]?.className).toContain('text-titulo-lg')
  })

  it('y con la de usuarios, también', () => {
    render(
      <AdminChrome
        activa="usuarios"
        onIr={vi.fn()}
        onSalir={vi.fn()}
        tenants={[]}
        tenantActivo={null}
        onTenant={vi.fn()}
      >
        <UserList usuarios={[]} total={0} clientes={0} format={format} />
      </AdminChrome>,
    )

    const titulos = screen.getAllByRole('heading', { level: 1 })
    expect(titulos).toHaveLength(1)
    expect(titulos[0]).toHaveTextContent('Usuarios')
  })
})

describe('la pregunta operativa SÍ es de la vista', () => {
  it('se queda cuando el título se va · es lo que esta pantalla contesta', () => {
    // §1.1 la hace obligatoria, y es de la vista y no del chrome: el chrome sabe
    // cómo se llama la pantalla, no qué pregunta contesta.
    render(<FeedHealth fuentes={[]} tenant={null} format={format} />)
    expect(
      screen.getByText('¿Por qué una métrica está degradada, y qué la desbloquea?'),
    ).toBeVisible()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })
})
