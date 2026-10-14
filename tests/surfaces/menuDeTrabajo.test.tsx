// @vitest-environment jsdom

/** El menú hamburguesa · las opciones de trabajo · decisión humana del
 *  2026-10-07
 *
 *  «Un menú hamburguesa [con] todo lo que deba ser de administración,
 *  construcción de dashboards», con acceso directo a cada pantalla. Lo que
 *  ofrece sale de los dos registros de pantallas, así que acá se afirma contra
 *  ellos y no contra una lista escrita a mano: si una pantalla se agrega, la
 *  prueba la pide sola.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MenuDeTrabajo } from '@/surfaces/MenuDeTrabajo'
import { gruposDeTrabajo, RUTA_DEL_DASHBOARD } from '@/surfaces/trabajo'
import { PANTALLAS as DE_ADMIN } from '@/surfaces/admin/pantallas'
import { PANTALLAS as DEL_BUILDER } from '@/surfaces/builder/pantallas'

const montar = (esAdmin = true, rutaActual = '/', onIr = vi.fn()) => {
  render(<MenuDeTrabajo esAdmin={esAdmin} rutaActual={rutaActual} onIr={onIr} />)
  return onIr
}
const abrir = async () => userEvent.click(screen.getByRole('button', { name: 'Menú de trabajo' }))

describe('el registro · qué se ofrece', () => {
  it('administración con TODAS sus pantallas, y el builder con las que tienen pestaña', () => {
    const [admin, builder] = gruposDeTrabajo(true)
    expect(admin?.entradas.map((e) => e.ruta)).toEqual(DE_ADMIN.map((p) => p.ruta))
    expect(builder?.entradas.map((e) => e.ruta)).toEqual(
      DEL_BUILDER.filter((p) => p.enNav).map((p) => p.ruta),
    )
    // Las que viven DENTRO del editor no se ofrecen en frío.
    expect(builder?.entradas.map((e) => e.nombre)).toEqual(['Dashboards', 'Editor', 'Historial de versiones'])
  })

  it('quien no administra no tiene a dónde ir · ocultar no es permitir', () => {
    expect(gruposDeTrabajo(false)).toEqual([])
  })

  it('«Volver al dashboard» lleva a la consola', () => {
    expect(RUTA_DEL_DASHBOARD).toBe('/')
  })
})

describe('el menú', () => {
  it('abre con los dos grupos, cada uno con sus pantallas', async () => {
    montar()
    await abrir()

    const admin = screen.getByRole('group', { name: 'Administración' })
    expect(within(admin).getByRole('menuitem', { name: 'Usuarios' })).toBeVisible()
    expect(within(admin).getByRole('menuitem', { name: 'Catálogo de métricas' })).toBeVisible()
    const builder = screen.getByRole('group', { name: 'Construcción de dashboards' })
    expect(within(builder).getByRole('menuitem', { name: 'Editor' })).toBeVisible()
  })

  it('elegir AVISA al contenedor con la ruta de esa pantalla, y cierra', async () => {
    const onIr = montar()
    await abrir()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Historial de versiones' }))

    expect(onIr).toHaveBeenCalledWith('/builder/historial')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('marca dónde se está', async () => {
    montar(true, '/admin/usuarios')
    await abrir()

    expect(screen.getByRole('menuitem', { name: 'Usuarios' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('menuitem', { name: 'Editor' })).not.toHaveAttribute('aria-current')
  })

  it('sin entradas no se pinta · un botón que abre un menú vacío no se ofrece', () => {
    montar(false)
    expect(screen.queryByRole('button', { name: 'Menú de trabajo' })).toBeNull()
  })

  it('Escape lo cierra, y volver a apretar también', async () => {
    montar()
    await abrir()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()

    await abrir()
    await abrir()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('se monta SIN router · la navegación es del contenedor', () => {
    expect(() => montar()).not.toThrow()
  })
})
