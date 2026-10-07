// @vitest-environment jsdom

/** El punto de identidad de admin y del builder · §PEN «A1/Identidad» y
 *  «B2/Identidad» · 2026-09-28
 *
 *  **Desde el 2026-10-07 es sólo lo de la persona** —decisión humana—: quién
 *  es, su rol, el tema y cerrar sesión. Las salidas a otras superficies, que
 *  vivían acá en la sección «IR A», se fueron al menú de trabajo y las prueba
 *  `menuDeTrabajo.test.tsx`. Lo que sí se afirma acá es que **ya no están**:
 *  dos lugares para la misma acción es lo que la separación corrige.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IdentityBlock } from '@/surfaces/IdentityBlock'

type Opciones = {
  onChangeTheme?: (t: 'dark' | 'light') => void
  onCerrarSesion?: () => void
  correo?: string
}

const montar = ({ onChangeTheme, onCerrarSesion, correo }: Opciones = {}) =>
  render(
    <IdentityBlock
      rol="Super-admin"
      nombre="María Benítez"
      {...(correo === undefined ? {} : { correo })}
      {...(onChangeTheme === undefined ? {} : { onChangeTheme })}
      {...(onCerrarSesion === undefined ? {} : { onCerrarSesion })}
    />,
  )

const abrir = async () =>
  userEvent.click(screen.getByRole('button', { name: /Identidad · María Benítez/ }))

describe('el bloque dice quién, con el rol primero', () => {
  it('pinta rol y nombre, en el orden del dibujo', () => {
    montar()
    expect(screen.getByText('Super-admin')).toBeVisible()
    expect(screen.getByText('María Benítez')).toBeVisible()
  })

  it('los iconos no se anuncian · el botón ya tiene su nombre', () => {
    const { container } = montar()
    for (const svg of Array.from(container.querySelectorAll('svg'))) {
      expect(svg).toHaveAttribute('aria-hidden')
    }
  })

  it('se monta SIN router · la navegación es del contenedor', () => {
    // Esta prueba no envuelve en `MemoryRouter`: si alguien mete `useNavigate`
    // acá adentro —para cerrar sesión, por ejemplo—, se cae.
    expect(() => montar({ onCerrarSesion: vi.fn() })).not.toThrow()
  })
})

describe('el panel es de la PERSONA · decisión humana del 2026-10-07', () => {
  it('abre con nombre, correo y rol · la identidad misma es contenido', async () => {
    montar({ correo: 'maria@ejemplo.com' })
    await abrir()

    const panel = screen.getByRole('menu', { name: 'Usuario · María Benítez' })
    expect(panel).toHaveTextContent('maria@ejemplo.com')
    expect(panel).toHaveTextContent('Rol')
    expect(panel).toHaveTextContent('Super-admin')
  })

  it('ya NO ofrece ir a otras superficies · eso es del menú de trabajo', async () => {
    montar({ onChangeTheme: vi.fn(), onCerrarSesion: vi.fn() })
    await abrir()

    expect(screen.queryByText('Ir a')).toBeNull()
    for (const nombre of ['Consola', 'Administración', 'Builder']) {
      expect(screen.queryByRole('menuitem', { name: nombre })).toBeNull()
    }
  })

  it('«Cerrar sesión» AVISA al contenedor, y cierra el panel', async () => {
    const onCerrarSesion = vi.fn()
    montar({ onCerrarSesion })
    await abrir()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))

    expect(onCerrarSesion).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('sin manejador, «Cerrar sesión» no se pinta', async () => {
    montar()
    await abrir()
    expect(screen.queryByRole('menuitem', { name: 'Cerrar sesión' })).toBeNull()
  })
})

describe('se sale del panel sin elegir', () => {
  it('Escape lo cierra', async () => {
    montar()
    await abrir()
    expect(screen.getByRole('menu')).toBeVisible()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('volver a apretar el chevron lo cierra · el caso que C6 destapó', async () => {
    // Con el contenedor entero como referencia —y no sólo el panel— el chevron
    // queda adentro, así que el `mousedown` del documento no cierra antes de que
    // el `onClick` alterne. Sin eso el panel no cierra nunca.
    montar()
    const chevron = screen.getByRole('button', { name: /Identidad · María Benítez/ })
    await userEvent.click(chevron)
    expect(screen.getByRole('menu')).toBeVisible()

    await userEvent.click(chevron)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})

/** ── EL TEMA, EN LAS TRES · 2026-10-02 ──────────────────────────────────────
 *
 *  Se afirma que el control **DISPARA**, no que exista: el camino tiene cuatro
 *  saltos —contenedor → chrome → `IdentityBlock` → `ThemeOptions`— y cada uno
 *  usa el spread condicional, con el que una prop mal nombrada compila. */
describe('el tema vive en el panel', () => {
  it('ofrece las dos opciones y la elegida AVISA al contenedor', async () => {
    const onChangeTheme = vi.fn()
    montar({ onChangeTheme })
    await abrir()

    expect(screen.getByRole('button', { name: /Oscuro/ })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /Claro/ }))
    expect(onChangeTheme).toHaveBeenCalledWith('light')
  })

  it('va ANTES de cerrar sesión · la preferencia, y después la salida', async () => {
    montar({ onChangeTheme: vi.fn(), onCerrarSesion: vi.fn() })
    await abrir()

    const texto = screen.getByRole('menu').textContent ?? ''
    expect(texto.indexOf('Tema')).toBeGreaterThanOrEqual(0)
    expect(texto.indexOf('Tema')).toBeLessThan(texto.indexOf('Cerrar sesión'))
  })

  it('sin manejador la sección no se pinta · un CTA sin manejador no se pinta', async () => {
    montar({ onCerrarSesion: vi.fn() })
    await abrir()

    expect(screen.queryByText('Tema')).toBeNull()
    // Apagar una sección no apaga la otra.
    expect(screen.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeVisible()
  })
})
