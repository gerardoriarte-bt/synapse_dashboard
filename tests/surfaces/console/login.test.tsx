// @vitest-environment jsdom

/** La pantalla de acceso · F0.5
 *
 *  De punta a punta contra el envelope real de `synapse-api-go`. Lo que se
 *  verifica no es que los campos existan —eso se ve mirando— sino las tres
 *  cosas que fallan en silencio: que el token se guarde, que el mensaje del
 *  servicio llegue a la pantalla, y que NO se guarde el usuario.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { Login } from '@/surfaces/console/Login'
import { currentToken, signOut } from '@/app/auth/session'
import { server } from '../../mocks/server'

const AUTH = '*/api/v1/auth/login'

const usuario = {
  id: 'u-1',
  tenant_id: 't-1',
  email: 'prueba@uamx.test',
  first_name: 'Prueba',
  last_name: 'Uno',
  phone: '',
  role: 'planner',
  password_updated: true,
}

afterEach(() => signOut())

function montar(desde = '/') {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: desde } }]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<p>LA CONSOLA</p>} />
        <Route path="/admin" element={<p>ADMIN</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function entrar(email = 'prueba@uamx.test', pass = 'secreto123') {
  await userEvent.type(screen.getByLabelText(/correo/i), email)
  await userEvent.type(screen.getByLabelText(/contraseña/i), pass)
  await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
}

describe('entrar', () => {
  it('guarda el token y lleva a donde el guardia te sacó', async () => {
    server.use(
      http.post(AUTH, () =>
        HttpResponse.json({ success: true, data: { token: 'jwt.abc', user: usuario } }),
      ),
    )
    montar('/admin')
    await entrar()

    await waitFor(() => expect(screen.getByText('ADMIN')).toBeInTheDocument())
    expect(currentToken()).toBe('jwt.abc')
  })

  it('sin destino previo lleva a la consola', async () => {
    server.use(
      http.post(AUTH, () =>
        HttpResponse.json({ success: true, data: { token: 'jwt.abc', user: usuario } }),
      ),
    )
    montar()
    await entrar()
    await waitFor(() => expect(screen.getByText('LA CONSOLA')).toBeInTheDocument())
  })

  it('NO guarda el usuario que devuelve el login · `/config/me` es la fuente', async () => {
    // El servicio manda nombre, rol y tenant, y es tentador guardarlos para
    // pintar el navbar sin esperar. Sería una segunda fuente de verdad que se
    // desincroniza en silencio en cuanto alguien cambie de rol.
    server.use(
      http.post(AUTH, () =>
        HttpResponse.json({ success: true, data: { token: 'jwt.abc', user: usuario } }),
      ),
    )
    montar()
    await entrar()
    await waitFor(() => expect(currentToken()).toBe('jwt.abc'))

    const guardado = JSON.stringify(localStorage)
    expect(guardado).not.toContain('planner')
    expect(guardado).not.toContain('prueba@uamx.test')
  })
})

describe('cuando falla', () => {
  it('muestra el mensaje DEL SERVICIO y no uno inventado', async () => {
    server.use(
      http.post(AUTH, () =>
        HttpResponse.json({ success: false, error: 'credenciales inválidas' }, { status: 401 }),
      ),
    )
    montar()
    await entrar('prueba@uamx.test', 'malamala')

    expect(await screen.findByRole('alert')).toHaveTextContent('credenciales inválidas')
    expect(currentToken()).toBeNull()
  })

  it('el error se anuncia · quien usa lector de pantalla se entera', async () => {
    server.use(
      http.post(AUTH, () =>
        HttpResponse.json({ success: false, error: 'credenciales inválidas' }, { status: 401 }),
      ),
    )
    montar()
    await entrar('prueba@uamx.test', 'malamala')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('si el servicio no responde lo dice, en vez de quedarse mudo', async () => {
    server.use(http.post(AUTH, () => HttpResponse.error()))
    montar()
    await entrar()
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo conectar/i)
  })

  it('y se puede reintentar · el botón vuelve de «Entrando»', async () => {
    server.use(
      http.post(AUTH, () =>
        HttpResponse.json({ success: false, error: 'credenciales inválidas' }, { status: 401 }),
      ),
    )
    montar()
    await entrar('prueba@uamx.test', 'malamala')
    await screen.findByRole('alert')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })
})
