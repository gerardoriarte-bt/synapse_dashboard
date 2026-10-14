// @vitest-environment jsdom

/** El punto de usuario de la consola · y el menú de trabajo · 2026-09-16
 *
 *  **Desde el 2026-10-07 son dos menús** —decisión humana—: el nombre despliega
 *  lo de la persona y cerrar sesión; un menú hamburguesa, las superficies de
 *  administración y construcción con cada una de sus pantallas. La decisión del
 *  2026-09-16 sigue en pie y ahora vale para el hamburguesa: **lo ve sólo el
 *  admin**.
 *
 *  ── LO QUE SE AFIRMA Y LO QUE NO ────────────────────────────────────────────
 *
 *  **Que la entrada no se pinte NO es el permiso.** El permiso lo aplica
 *  `AdminOnlyMiddleware` con un 403, y quien escriba `/admin` a mano llega a la
 *  pantalla igual. Estas pruebas verifican la regla de producto —«un botón que
 *  se aprieta y devuelve 403 es peor que un botón ausente»—, no una defensa.
 *
 *  **Y se verifica que NAVEGUE, no que el botón exista.** Con el spread
 *  condicional de JSX una prop mal nombrada compila, el botón se pinta y no
 *  llama a nada. Un botón muerto se ve igual que uno que funciona.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu } from '@/surfaces/console/UserMenu'
import { Topbar } from '@/surfaces/console/Topbar'
import { createFormat } from '@/render/format'
import { currentToken, saveToken } from '@/app/auth/session'
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
    dashboards: [],
    dashboardActivoId: null,
    layoutActivoId: null,
    catalogVersion: 1,
  }) as unknown as AppContext

/** Monta con un router de memoria y una pantalla por destino, para que
 *  «navegó» sea algo que se ve y no un espía sobre `useNavigate`. **Con su
 *  `QueryClient`**: cerrar sesión vacía el cache, y sin proveedor el menú no
 *  monta. */
function montar(rol: string, client = new QueryClient()) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<UserMenu context={contexto(rol)} />} />
          <Route path="/login" element={<p>PANTALLA DE INGRESO</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** El navbar entero · el menú de trabajo vive en el `Topbar`, al lado del
 *  logotipo, y no dentro del menú del nombre. */
function montarNavbar(rol: string) {
  const barra = (
    <Topbar
      context={contexto(rol)}
      activeTab={undefined}
      activePeriodId={undefined}
      tabMetrics={[]}
      format={createFormat('es-MX')}
      onSelectTab={vi.fn()}
      onSelectPeriod={vi.fn()}
    />
  )
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={barra} />
          <Route path="/admin/usuarios" element={<p>PANTALLA DE USUARIOS</p>} />
          <Route path="/builder/canvas" element={<p>PANTALLA DEL EDITOR</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
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
    // **Rótulo arriba y valor abajo** · §PEN «Console/Panel de usuario». Era
    // `Rol · CEO` en una línea; el dibujo los separa porque el rótulo es nota y
    // el valor es celda — en una sola línea el rótulo compartía el tamaño del
    // valor, que es un rol tipográfico que no le toca.
    expect(screen.getByText('Rol')).toBeInTheDocument()
    expect(screen.getByText('CEO')).toBeInTheDocument()
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Under Armour México')).toBeInTheDocument()
  })

  it('se cierra con Escape', async () => {
    montar('CEO')
    await userEvent.click(screen.getByRole('button', { name: 'María Benítez' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('el nombre es de la PERSONA · decisión humana del 2026-10-07', () => {
  it('ya NO ofrece ir a otras superficies, ni al admin', async () => {
    montar('admin')
    await userEvent.click(screen.getByRole('button', { name: 'María Benítez' }))

    expect(screen.queryByText('Ir a')).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Administración' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Builder' })).not.toBeInTheDocument()
  })

  it('«Cerrar sesión» BORRA el token, vacía el cache y lleva al ingreso', async () => {
    // **Las tres cosas, y la que no se ve es el cache**: sin vaciarlo, quien
    // entre después en la misma pestaña vería un instante los datos del
    // anterior.
    saveToken('jwt-de-prueba')
    const client = new QueryClient()
    client.setQueryData(['config', 'me'], { del: 'anterior' })
    montar('CEO', client)
    await userEvent.click(screen.getByRole('button', { name: 'María Benítez' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))

    expect(currentToken()).toBeNull()
    expect(client.getQueryData(['config', 'me'])).toBeUndefined()
    expect(screen.getByText('PANTALLA DE INGRESO')).toBeInTheDocument()
  })

  it('cerrar sesión lo tiene cualquier rol · no es una entrada de admin', async () => {
    montar('Planner')
    await userEvent.click(screen.getByRole('button', { name: 'María Benítez' }))
    expect(screen.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })
})

describe('el menú de TRABAJO lo ve sólo el admin · decisión del 2026-09-16', () => {
  it('un rol que NO es admin no lo ve', () => {
    montarNavbar('Planner')
    expect(screen.queryByRole('button', { name: 'Menú de trabajo' })).not.toBeInTheDocument()
  })

  it.each([
    ['Usuarios', 'PANTALLA DE USUARIOS'],
    ['Editor', 'PANTALLA DEL EDITOR'],
  ])('el admin entra directo a %s · y NAVEGA de verdad', async (entrada, destino) => {
    montarNavbar('admin')
    await userEvent.click(screen.getByRole('button', { name: 'Menú de trabajo' }))
    await userEvent.click(screen.getByRole('menuitem', { name: entrada }))

    // Lo que se afirma es el DESTINO, no que el botón estuviera.
    expect(screen.getByText(destino)).toBeInTheDocument()
  })

  it('va A LA DERECHA del usuario, al final · decisión humana del 2026-10-07', () => {
    // Empezó antes del logotipo y se pidió moverlo: Preguntar · usuario · menú.
    montarNavbar('admin')
    const usuario = screen.getByRole('button', { name: 'María Benítez' })
    const menu = screen.getByRole('button', { name: 'Menú de trabajo' })
    expect(usuario.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const logo = screen.getByRole('img', { name: /Synapse/ })
    expect(logo.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('`Admin` con mayúscula también · el servicio normaliza y nosotros también', () => {
    // No es cosmético: el rol del usuario de prueba llega como `Admin` y
    // `/admin/tenants` le responde 200. Comparando contra 'admin' a secas, el
    // front escondería un menú que el servidor SÍ habilita.
    montarNavbar('Admin')
    expect(screen.getByRole('button', { name: 'Menú de trabajo' })).toBeInTheDocument()
  })
})
