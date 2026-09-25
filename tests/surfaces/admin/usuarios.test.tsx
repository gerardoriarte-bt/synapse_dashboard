// @vitest-environment jsdom

/** A3 · Usuarios · §PEN:A3 · F4.3
 *
 *  La pantalla que contesta *«¿Quién entra a qué cliente, y con qué rol?»*.
 *  Construida el 2026-09-25, cuando su ruta llegó con `1e080ee` y el candado se
 *  abrió con la medición delante.
 *
 *  **Lo que estas pruebas fijan son las cuatro decisiones que el dibujo obliga y
 *  que son fáciles de romper sin que se note**: que el estado sean dos y no los
 *  tres dibujados, que «nunca entró» se diga y no se invente, que el vacío de
 *  filtro no se confunda con el de alta, y que el alcance no se copie del
 *  rótulo del dibujo cuando el dato es de un cliente.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { UserList } from '@/surfaces/admin/UserList'
import type { Usuario } from '@/api/admin'

const usuario = (p: Partial<Usuario> & { id: string }): Usuario => ({
  nombre: 'Sofía Marín',
  email: 'sofia.marin@underarmour.com',
  rol: 'planner',
  rolId: 'r-1',
  ultimoAccesoEn: '2026-09-20T10:00:00Z',
  activo: true,
  altaEn: '2026-08-14T10:00:00Z',
  ...p,
})

describe('el estado son DOS, y el dibujo pinta tres', () => {
  it('activo y suspendido salen del cable', () => {
    render(
      <UserList
        usuarios={[usuario({ id: 'u-1' }), usuario({ id: 'u-2', activo: false })]}
        tenant="UA MX"
      />,
    )
    const filas = screen.getAllByRole('row')
    expect(within(filas[1] as HTMLElement).getByText('Activo')).toBeVisible()
    expect(within(filas[2] as HTMLElement).getByText('Suspendido')).toBeVisible()
  })

  it('«invitación pendiente» NO se infiere de que nunca entró', () => {
    // **Es la aserción que sostiene la decisión.** Alguien puede tener cuenta
    // activa y no haber entrado todavía, que es otra cosa que una invitación sin
    // aceptar. Inferirlo pintaría un estado que nadie declaró.
    render(<UserList usuarios={[usuario({ id: 'u-1', ultimoAccesoEn: null })]} tenant="UA MX" />)
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).getByText('Activo')).toBeVisible()
    expect(within(fila).queryByText(/invitaci/i)).toBeNull()
  })
})

describe('«nunca entró» se dice, no se inventa una fecha', () => {
  it('sale «Nunca» y no una fecha cualquiera', () => {
    render(<UserList usuarios={[usuario({ id: 'u-1', ultimoAccesoEn: null })]} tenant="UA MX" />)
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).getByText('Nunca')).toBeVisible()
  })

  it('y con acceso sale la fecha formateada, no el ISO', () => {
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} tenant="UA MX" />)
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).queryByText(/2026-09-20T/)).toBeNull()
    expect(within(fila).getByText(/20 sep 2026/i)).toBeVisible()
  })
})

describe('los dos vacíos, que no son el mismo', () => {
  it('sin usuarios es de ALTA · el cliente es nuevo', () => {
    render(<UserList usuarios={[]} tenant="Cliente Nuevo" />)
    expect(screen.getByText(/todavía no tiene usuarios/i)).toBeVisible()
    // El encabezado se conserva · las columnas siguen diciendo qué habría.
    expect(screen.getAllByRole('columnheader')).toHaveLength(5)
  })

  it('con usuarios y búsqueda sin resultados es de FILTRO · y se puede deshacer', async () => {
    // El `.pen` lo dibuja como pantalla aparte —`A3 · Usuarios · filtro sin
    // resultados`— porque la salida cambia con la causa: acá es deshacer, no
    // invitar a alguien.
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} tenant="UA MX" />)

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'zzz')
    expect(screen.getByText(/0 usuarios con este filtro · 1 en total/i)).toBeVisible()

    // **Que el botón DISPARE**, no que exista: un botón muerto se ve igual.
    await userEvent.click(screen.getByRole('button', { name: /limpiar|deshacer/i }))
    expect(screen.getByText('Sofía Marín')).toBeVisible()
  })
})

describe('el alcance NO se copia del dibujo', () => {
  it('NO pone su propio chip de alcance · el chrome ya lo declara', () => {
    // **Visto en pantalla el 2026-09-25**: la pantalla decía «alcance · cliente»
    // mientras el chrome decía «alcance · plataforma · todas las cuentas», los
    // dos a la vez. Dos chips contradiciéndose es peor que uno.
    //
    // El alcance lo declara `pantallas.ts`, con su razón de §7.3. Lo que a esta
    // pantalla le toca es decir qué está mostrando de verdad.
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} tenant="UA MX" />)
    // Exacto: la lista de huecos también empieza con «Alcance ·», y ésa sí
    // tiene que estar — dice el hueco, no declara un alcance.
    expect(screen.queryByText('Alcance · cliente')).toBeNull()
    expect(screen.queryByText('Alcance · plataforma')).toBeNull()
    expect(screen.getByText(/Esta lista es de UN cliente/i)).toBeVisible()
  })

  it('y el hueco de alcance está declarado, con los otros tres', () => {
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} tenant="UA MX" />)
    expect(screen.getByText(/Faltan 4 cosas/i)).toBeVisible()
    expect(screen.getByText(/el dibujo pide plataforma y la ruta es por cliente/i)).toBeVisible()
  })

  it('no ofrece «invitar usuario» ni «reenviar invitación» · sin ruta no hay CTA', () => {
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} tenant="UA MX" />)
    expect(screen.queryByRole('button', { name: /invitar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /reenviar/i })).toBeNull()
  })
})
