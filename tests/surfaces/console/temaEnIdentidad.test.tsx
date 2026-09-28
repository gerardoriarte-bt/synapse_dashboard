// @vitest-environment jsdom

/** El tema y las salidas dentro del punto de identidad · §PEN
 *  «Console/Panel de usuario» · 2026-09-28
 *
 *  **Dos cosas que el dibujo movió**, y las dos tienen consecuencia:
 *
 *  - El TEMA vivía suelto en el navbar, como un botón que ALTERNABA. Ahora está
 *    adentro del panel, con **las dos opciones a la vista**.
 *  - El `IR A` era invención nuestra del 2026-09-16 y el dibujo lo sancionó, con
 *    su `arrow-right` por salida.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu } from '@/surfaces/console/UserMenu'
import type { AppContext } from '@/api/types'

const contexto = (rol: string, alcance: 'usuario' | 'plataforma' = 'usuario') =>
  ({
    alcance,
    user: { id: 'u-1', nombre: 'Prueba Uno', email: 'p@uno.mx' },
    tenant: { id: 't-1', nombre: 'Under Armour México', etiqueta: 'UA MX', vertical: '' },
    role: { id: 'r-1', nombre: rol, puedeAprobar: false },
    tabs: [],
    periodos: [],
    dashboards: [],
    dashboardActivoId: null,
    layoutActivoId: null,
    catalogVersion: 1,
  }) as unknown as AppContext

const montar = (ctx: AppContext, onChangeTheme?: (t: 'dark' | 'light') => void) =>
  render(
    <MemoryRouter>
      <UserMenu context={ctx} {...(onChangeTheme === undefined ? {} : { onChangeTheme })} />
    </MemoryRouter>,
  )

const abrir = async () => userEvent.click(screen.getByRole('button', { name: /Prueba Uno/ }))

describe('el tema vive acá, con las DOS opciones a la vista', () => {
  it('muestra cuál está activo, y no sólo a qué se puede pasar', async () => {
    // **Un toggle no dice en qué estado estás.** «Claro» en un botón se lee como
    // «estás en claro» o como «pasá a claro», y cuál de las dos depende de saber
    // la convención. Con las dos visibles y una marcada no hay que saberla.
    montar(contexto('CEO'), vi.fn())
    await abrir()

    expect(screen.getByRole('button', { name: 'Oscuro' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Claro' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('SÓLO la activa lleva el acento · si las dos lo llevan, no distingue nada', async () => {
    // El acento acá es legítimo —§2.1 lista «estado activo»— pero **su valor es
    // la exclusividad**: dos opciones en naranja se ven idénticas y el control
    // deja de decir en qué estado estás, que es justamente por lo que dejó de
    // ser un toggle.
    montar(contexto('CEO'), vi.fn())
    await abrir()

    expect(screen.getByRole('button', { name: 'Oscuro' }).className).toContain('text-acc')
    expect(screen.getByRole('button', { name: 'Claro' }).className).not.toContain('text-acc')
  })

  it('elegir avisa a quien persiste · este control no habla con la red', async () => {
    const cambio = vi.fn()
    montar(contexto('CEO'), cambio)
    await abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Claro' }))

    expect(cambio).toHaveBeenCalledWith('light')
    expect(screen.getByRole('button', { name: 'Claro' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('SIN quien persista no se ofrece · misma regla que el resto', async () => {
    // Un control cuyo cambio nadie atiende es la familia del CTA sin manejador:
    // promete una acción que no existe. El builder monta esta consola así.
    montar(contexto('CEO'))
    await abrir()

    expect(screen.queryByRole('button', { name: 'Oscuro' })).toBeNull()
  })
})

describe('las salidas llevan su flecha, y el texto basta', () => {
  it('cada salida trae el `arrow-right` y va `aria-hidden`', async () => {
    const { container } = montar(contexto('Admin'), vi.fn())
    await abrir()

    const salida = screen.getByRole('menuitem', { name: 'Administración' })
    expect(salida).toBeVisible()
    // El icono no se anuncia: el texto ya dice a dónde lleva.
    expect(salida.querySelector('svg')).toHaveAttribute('aria-hidden')
    expect(container.textContent).toContain('Ir a')
  })

  it('un rol que NO es admin no ve salidas · ocultar no es permitir', async () => {
    montar(contexto('Planner'), vi.fn())
    await abrir()

    expect(screen.queryByRole('menuitem')).toBeNull()
    // Y el tema sigue estando: no es una entrada de admin.
    expect(screen.getByRole('button', { name: 'Oscuro' })).toBeVisible()
  })
})

describe('el ACCESO sólo con alcance de plataforma', () => {
  it('lo declara cuando el token es de plataforma', async () => {
    montar(contexto('Admin', 'plataforma'), vi.fn())
    await abrir()
    expect(screen.getByText('Acceso')).toBeVisible()
  })

  it('y no lo menciona cuando no lo es', async () => {
    montar(contexto('CEO'), vi.fn())
    await abrir()
    expect(screen.queryByText('Acceso')).toBeNull()
  })
})
