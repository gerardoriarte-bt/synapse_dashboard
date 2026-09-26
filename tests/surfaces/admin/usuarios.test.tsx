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
  // **Con nombre de cliente**: desde el 2026-09-26 la pantalla es de plataforma y
  // `CLIENTE` es una columna · B4.17.
  clienteNombre: 'Under Armour México',
  ...p,
})

describe('el estado son DOS, y el dibujo pinta tres', () => {
  it('activo y suspendido salen del cable', () => {
    render(
      <UserList
        usuarios={[usuario({ id: 'u-1' }), usuario({ id: 'u-2', activo: false })]}
        total={2}
        clientes={1}
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
    render(<UserList usuarios={[usuario({ id: 'u-1', ultimoAccesoEn: null })]} total={1} clientes={1} />)
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).getByText('Activo')).toBeVisible()
    expect(within(fila).queryByText(/invitaci/i)).toBeNull()
  })
})

describe('«nunca entró» se dice, no se inventa una fecha', () => {
  it('sale «Nunca» y no una fecha cualquiera', () => {
    render(<UserList usuarios={[usuario({ id: 'u-1', ultimoAccesoEn: null })]} total={1} clientes={1} />)
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).getByText('Nunca')).toBeVisible()
  })

  it('y con acceso sale la fecha formateada, no el ISO', () => {
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} total={1} clientes={1} />)
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).queryByText(/2026-09-20T/)).toBeNull()
    expect(within(fila).getByText(/20 sep 2026/i)).toBeVisible()
  })
})

describe('los dos vacíos, que no son el mismo', () => {
  it('sin usuarios es de ALTA · la plataforma está vacía', () => {
    render(<UserList usuarios={[]} total={0} clientes={0} />)
    // **El copy dejó de hablar de UN cliente** con el alcance de plataforma.
    expect(screen.getByText(/no hay usuarios en ningún cliente/i)).toBeVisible()
    // El encabezado se conserva · las columnas siguen diciendo qué habría.
    // **Seis desde el 2026-09-26**: entró `CLIENTE`.
    expect(screen.getAllByRole('columnheader')).toHaveLength(6)
  })

  it('con usuarios y búsqueda sin resultados es de FILTRO · y se puede deshacer', async () => {
    // El `.pen` lo dibuja como pantalla aparte —`A3 · Usuarios · filtro sin
    // resultados`— porque la salida cambia con la causa: acá es deshacer, no
    // invitar a alguien.
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} total={1} clientes={1} />)

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
    // El alcance lo declara `pantallas.ts`, con su razón de §7.3.
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} total={1} clientes={1} />)
    expect(screen.queryByText('Alcance · cliente')).toBeNull()
    expect(screen.queryByText('Alcance · plataforma')).toBeNull()
  })

  // ── EL AVISO VENCIDO SE FUE, Y ESTO LO SOSTIENE · 2026-09-26 ──────────────
  //
  // Esta prueba exigía el texto «Esta lista es de UN cliente · la ruta que existe
  // es por tenant y `/admin/users` da 404». Era verdad al escribirlo y **quedó
  // falso el día que la ruta llegó**.
  //
  // Se afirma su AUSENCIA, y no sólo el texto nuevo: una afirmación vencida en
  // pantalla es peor que un hueco, porque el usuario no tiene con qué dudarla.
  it('NO afirma que `/admin/users` da 404 · la ruta existe desde `6e521cc`', () => {
    const { container } = render(
      <UserList usuarios={[usuario({ id: 'u-1' })]} total={1} clientes={1} />,
    )
    const texto = container.textContent ?? ''
    expect(texto).not.toContain('404')
    expect(texto).not.toMatch(/es de UN cliente/i)
    expect(screen.getByText(/Usuarios de todos los clientes/i)).toBeVisible()
  })

  it('los CONTEOS son los del servicio, no los de la lista', () => {
    // **Es la razón por la que el hueco no se compensaba antes**: «un total
    // armado acá se leería como un número de plataforma y sería una suma
    // nuestra». Así que se pasa una lista de UNO con un total de 17, que es lo
    // que pasa de verdad cuando la ruta pagina o cuando el filtro recorta.
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} total={17} clientes={2} />)
    expect(screen.getByText(/17 usuarios/)).toBeVisible()
    expect(screen.getByText(/2 clientes con usuarios/)).toBeVisible()
  })

  it('la columna CLIENTE pinta el nombre, no el id', () => {
    render(
      <UserList
        usuarios={[usuario({ id: 'u-1', clienteNombre: 'Otro Cliente' })]}
        total={1}
        clientes={1}
      />,
    )
    expect(screen.getByRole('columnheader', { name: 'Cliente' })).toBeVisible()
    const filas = screen.getAllByRole('row')
    expect(within(filas[1] as HTMLElement).getByText('Otro Cliente')).toBeVisible()
  })

  it('y los TRES huecos que quedan siguen declarados', () => {
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} total={1} clientes={1} />)
    expect(screen.getByText(/Faltan 3 cosas/i)).toBeVisible()
    expect(screen.getByText(/el cable sólo trae activo o suspendido/i)).toBeVisible()
  })

  it('no ofrece «invitar usuario» ni «reenviar invitación» · sin ruta no hay CTA', () => {
    render(<UserList usuarios={[usuario({ id: 'u-1' })]} total={1} clientes={1} />)
    expect(screen.queryByRole('button', { name: /invitar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /reenviar/i })).toBeNull()
  })
})
