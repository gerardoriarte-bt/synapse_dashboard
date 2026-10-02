// @vitest-environment jsdom

/** El punto de identidad de admin y del builder · §PEN «A1/Identidad» y
 *  «B2/Identidad» · 2026-09-28
 *
 *  **Lo que se verifica es la SIMETRÍA**, que es el defecto que esto corrige.
 *  Administración salía por un «← Consola», la consola por su panel de
 *  identidad, y el builder no salía: tres formas para la misma acción y una
 *  faltante. Ahora las tres usan el mismo registro, así que lo que se ofrece
 *  desde cada una se puede afirmar sin conocer la implementación.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IdentityBlock } from '@/surfaces/IdentityBlock'

const montar = (
  desde: 'admin' | 'builder' | 'consola',
  esAdmin = true,
  onIr = vi.fn(),
  onChangeTheme?: (t: 'dark' | 'light') => void,
) => {
  render(
    <IdentityBlock
      rol="Super-admin"
      nombre="María Benítez"
      desde={desde}
      esAdmin={esAdmin}
      onIr={onIr}
      {...(onChangeTheme === undefined ? {} : { onChangeTheme })}
    />,
  )
  return onIr
}

const abrir = async () =>
  userEvent.click(screen.getByRole('button', { name: /Identidad · María Benítez/ }))

describe('el bloque dice quién, con el rol primero', () => {
  it('pinta rol y nombre, en el orden del dibujo', () => {
    montar('admin')
    expect(screen.getByText('Super-admin')).toBeVisible()
    expect(screen.getByText('María Benítez')).toBeVisible()
  })

  it('los iconos no se anuncian · el botón ya tiene su nombre', () => {
    // El chevron y la flecha son marcas, no contenido: con `aria-label` en el
    // botón, anunciarlos agrega un gráfico sin nombre al árbol. Mismo trato que
    // el icono de los estados.
    const { container } = render(
      <IdentityBlock rol="Super-admin" nombre="María Benítez" desde="admin" esAdmin onIr={vi.fn()} />,
    )
    for (const svg of Array.from(container.querySelectorAll('svg'))) {
      expect(svg).toHaveAttribute('aria-hidden')
    }
  })

  it('se monta SIN router · la navegación es del contenedor', () => {
    // **Es la regla que `BuilderChrome` ya declaraba**: escribir `useNavigate`
    // acá adentro «rompía doce pruebas que montan el chrome sin router, y
    // tenían razón en romperse». Esta prueba no envuelve en `MemoryRouter`: si
    // alguien mete el hook, se cae.
    expect(() => montar('builder')).not.toThrow()
  })
})

describe('cada superficie ofrece las OTRAS, y eso sale de una sola fuente', () => {
  it('desde admin, la consola y el builder · nunca admin', async () => {
    montar('admin')
    await abrir()

    expect(screen.getByRole('menuitem', { name: 'Consola' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Builder' })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Administración' })).toBeNull()
  })

  it('desde el builder, la consola y administración · nunca el builder', async () => {
    // **El builder no tenía salida ninguna.** Ésta es la mitad que faltaba.
    montar('builder')
    await abrir()

    expect(screen.getByRole('menuitem', { name: 'Consola' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Administración' })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Builder' })).toBeNull()
  })

  it('elegir avisa al contenedor con la ruta, y cierra', async () => {
    const onIr = montar('builder')
    await abrir()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Consola' }))

    expect(onIr).toHaveBeenCalledWith('/')
    expect(screen.queryByRole('menuitem')).toBeNull()
  })
})

describe('quien NO administra no ve entradas que le darían 403', () => {
  it('sin `esAdmin` el panel no ofrece nada · ocultar no es permitir', async () => {
    // El permiso lo aplica el servidor con un 403; esto es la regla de siempre,
    // «un botón que se aprieta y devuelve 403 es peor que un botón ausente».
    montar('consola', false)
    await abrir()

    expect(screen.queryByRole('menuitem')).toBeNull()
  })
})

describe('se sale del panel sin elegir', () => {
  it('Escape lo cierra', async () => {
    montar('admin')
    await abrir()
    expect(screen.getByRole('menuitem', { name: 'Consola' })).toBeVisible()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menuitem')).toBeNull()
  })

  it('volver a apretar el chevron lo cierra · el caso que C6 destapó', async () => {
    // Con el contenedor entero como referencia —y no sólo el panel— el chevron
    // queda adentro, así que el `mousedown` del documento no cierra antes de que
    // el `onClick` alterne. Sin eso el panel no cierra nunca.
    montar('admin')
    const chevron = screen.getByRole('button', { name: /Identidad · María Benítez/ })
    await userEvent.click(chevron)
    expect(screen.getByRole('menuitem', { name: 'Consola' })).toBeVisible()

    await userEvent.click(chevron)
    expect(screen.queryByRole('menuitem')).toBeNull()
  })
})

/** ── EL TEMA, QUE LLEGÓ A LAS TRES · 2026-10-02 ──────────────────────────────
 *
 *  La decisión de diseño del 2026-09-28 es «todo vive dentro del punto de
 *  identidad», y el tema entró a la consola ese día. **Admin y el builder
 *  quedaron sin él**: tenían identidad y salidas, y ninguna forma de cambiarlo.
 *
 *  Se afirma que el control **DISPARA**, no que exista. Es la regla de este
 *  repositorio y vale doble acá: el camino tiene cuatro saltos —contenedor →
 *  chrome → `IdentityBlock` → `ThemeOptions`— y cada uno usa el spread
 *  condicional, con el que una prop mal nombrada compila. */
describe('el tema vive en el panel, en las tres superficies', () => {
  it('ofrece las dos opciones y la elegida AVISA al contenedor', async () => {
    const onChangeTheme = vi.fn()
    montar('admin', true, vi.fn(), onChangeTheme)
    await abrir()

    expect(screen.getByRole('button', { name: /Oscuro/ })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /Claro/ }))

    // Que el botón exista no alcanza: un botón muerto se ve igual.
    expect(onChangeTheme).toHaveBeenCalledWith('light')
  })

  it('va ANTES de las salidas · el orden del dibujo', async () => {
    // `Console/Panel de usuario` pone Tema entre el separador y `IR A`.
    montar('builder', true, vi.fn(), vi.fn())
    await abrir()

    const texto = screen.getByRole('menu').textContent ?? ''
    expect(texto.indexOf('Tema')).toBeGreaterThanOrEqual(0)
    expect(texto.indexOf('Tema')).toBeLessThan(texto.indexOf('Ir a'))
  })

  it('sin manejador la sección no se pinta · un CTA sin manejador no se pinta', async () => {
    montar('admin')
    await abrir()

    expect(screen.queryByText('Tema')).toBeNull()
    // Y las salidas siguen estando: apagar una sección no apaga la otra.
    expect(screen.getByRole('menuitem', { name: 'Consola' })).toBeVisible()
  })

  it('SIN salidas el panel abre igual si hay tema · si no, la preferencia queda inalcanzable', async () => {
    // La condición de apertura era `salidas.length > 0`. Quien no administra no
    // tiene salidas, y con el tema adentro el chevron se pintaba sin abrir nada.
    montar('consola', false, vi.fn(), vi.fn())
    await abrir()

    expect(screen.queryByRole('menuitem')).toBeNull()
    expect(screen.getByRole('button', { name: /Claro/ })).toBeVisible()
  })
})
