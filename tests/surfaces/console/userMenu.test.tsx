// @vitest-environment jsdom

/** El punto de usuario y la salida a las otras superficies · 2026-09-16
 *
 *  **La decisión que estas pruebas fijan es humana**: el builder y
 *  administración los ve **solo el admin**, y las entradas cuelgan del panel de
 *  identidad — que es el lugar que `design.md` ya tenía declarado y el `.pen` no
 *  usaba para nada.
 *
 *  ── LO QUE SE AFIRMA Y LO QUE NO ────────────────────────────────────────────
 *
 *  **Que la entrada no se pinte NO es el permiso.** El permiso lo aplica
 *  `AdminOnlyMiddleware` con un 403, y quien escriba `/admin` a mano llega a la
 *  pantalla igual. Estas pruebas verifican la regla de producto —«un botón que
 *  se aprieta y devuelve 403 es peor que un botón ausente»—, no una defensa.
 *  Escribirlas como si fueran seguridad haría creer que el front protege algo.
 *
 *  **Y se verifica que NAVEGUE, no que el botón exista.** Es la trampa que este
 *  repositorio tiene registrada tres veces: con el spread condicional de JSX una
 *  prop mal nombrada compila, el botón se pinta y no llama a nada. Un botón
 *  muerto se ve igual que uno que funciona.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { UserMenu } from '@/surfaces/console/UserMenu'
import type { AppContext } from '@/api/types'

/** Del contrato · los campos que `adaptContext` compone. */
const contexto = (rol: string): AppContext =>
  ({
    alcance: 'usuario',
    user: { id: 'u-1', nombre: 'María Benítez', email: 'maria@lobueno.co' },
    tenant: { id: 't-1', nombre: 'Under Armour México', etiqueta: 'Under Armour México', vertical: '' },
    role: { id: 'r-1', nombre: rol, puedeAprobar: false },
    tabs: [],
    periodos: [],
    catalogVersion: 1,
  }) as unknown as AppContext

/** Monta el menú con un router de memoria y una pantalla por destino, para que
 *  «navegó» sea algo que se ve y no un espía sobre `useNavigate`. */
function montar(rol: string) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<UserMenu context={contexto(rol)} />} />
        <Route path="/admin" element={<p>PANTALLA DE ADMINISTRACIÓN</p>} />
        <Route path="/builder" element={<p>PANTALLA DEL BUILDER</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('el panel de identidad · lo que design.md declara', () => {
  it('el nombre ABRE un panel · no es un rótulo', async () => {
    montar('CEO')
    // Cerrado, el correo no está: si estuviera, no habría panel que abrir.
    expect(screen.queryByText('maria@lobueno.co')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'María Benítez' }))

    // «nombre, correo, rol con su descripción y cliente» · §7.1.
    expect(screen.getByText('maria@lobueno.co')).toBeInTheDocument()
    expect(screen.getByText('Rol · CEO')).toBeInTheDocument()
    expect(screen.getByText('Cliente · Under Armour México')).toBeInTheDocument()
  })

  it('se cierra con Escape', async () => {
    montar('CEO')
    await userEvent.click(screen.getByRole('button', { name: 'María Benítez' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('las superficies las ve solo el admin · decisión del 2026-09-16', () => {
  it('un rol que NO es admin no ve las entradas', async () => {
    montar('Planner')
    await userEvent.click(screen.getByRole('button', { name: 'María Benítez' }))

    // El panel abrió —la identidad es para todos— y las entradas no están.
    expect(screen.getByText('maria@lobueno.co')).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Administración' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Builder' })).not.toBeInTheDocument()
  })

  it.each([
    ['Administración', 'PANTALLA DE ADMINISTRACIÓN'],
    ['Builder', 'PANTALLA DEL BUILDER'],
  ])('el admin entra a %s · y NAVEGA de verdad', async (entrada, destino) => {
    montar('admin')
    await userEvent.click(screen.getByRole('button', { name: 'María Benítez' }))
    await userEvent.click(screen.getByRole('menuitem', { name: entrada }))

    // Lo que se afirma es el DESTINO, no que el botón estuviera.
    expect(screen.getByText(destino)).toBeInTheDocument()
  })

  it('`Admin` con mayúscula también · el servicio normaliza y nosotros también', async () => {
    // No es cosmético: el rol del usuario de prueba llega como `Admin` y
    // `/admin/tenants` le responde 200. Comparando contra 'admin' a secas, el
    // front escondería una entrada que el servidor SÍ habilita.
    montar('Admin')
    await userEvent.click(screen.getByRole('button', { name: 'María Benítez' }))
    expect(screen.getByRole('menuitem', { name: 'Administración' })).toBeInTheDocument()
  })
})
