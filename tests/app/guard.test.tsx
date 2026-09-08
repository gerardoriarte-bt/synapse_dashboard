// @vitest-environment jsdom

/** El guardia y el bloqueo por contraseña · F0.5, F0.13
 *
 *  Lo que se verifica no es que el modal aparezca —eso se ve mirando— sino que
 *  **no se pueda esquivar**: quien ya tiene token en `localStorage` no vuelve a
 *  pasar por el login, así que un bloqueo puesto ahí sería decorativo.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { AuthGuard } from '@/app/auth/AuthGuard'
import { saveToken, signOut } from '@/app/auth/session'
import { server } from '../mocks/server'

const INFO = '*/api/v1/auth/token-info'

const usuario = (password_updated: boolean) => ({
  id: 'u-1',
  tenant_id: 't-1',
  email: 'prueba@uamx.test',
  first_name: 'Prueba',
  last_name: 'Uno',
  phone: '',
  role: 'planner',
  password_updated,
})

afterEach(() => signOut())

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<p>EL LOGIN</p>} />
          <Route
            path="/admin"
            element={
              <AuthGuard>
                <p>LA SUPERFICIE</p>
              </AuthGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('sin sesión', () => {
  it('manda al login', async () => {
    montar()
    expect(await screen.findByText('EL LOGIN')).toBeInTheDocument()
  })
})

describe('F0.13 · el bloqueo por contraseña asignada', () => {
  it('con `password_updated: false` NO se llega a la superficie', async () => {
    // Es el corazón de la tarea: hay token válido y la URL es directa —ni
    // siquiera se pasó por el login— y aun así no entra.
    saveToken('jwt.abc')
    server.use(
      http.get(INFO, () => HttpResponse.json({ success: true, data: { user: usuario(false) } })),
    )
    montar()

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText('LA SUPERFICIE')).toBeNull()
  })

  it('con `true` pasa', async () => {
    saveToken('jwt.abc')
    server.use(
      http.get(INFO, () => HttpResponse.json({ success: true, data: { user: usuario(true) } })),
    )
    montar()
    expect(await screen.findByText('LA SUPERFICIE')).toBeInTheDocument()
  })

  it('MIENTRAS se verifica tampoco se pinta la superficie', async () => {
    // Dejarla pasar «mientras tanto» convierte el bloqueo en un parpadeo que se
    // puede aprovechar.
    saveToken('jwt.abc')
    server.use(
      http.get(INFO, async () => {
        await new Promise((r) => setTimeout(r, 60))
        return HttpResponse.json({ success: true, data: { user: usuario(false) } })
      }),
    )
    montar()
    expect(screen.queryByText('LA SUPERFICIE')).toBeNull()
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('el modal NO ofrece salida · no hay a dónde ir', async () => {
    saveToken('jwt.abc')
    server.use(
      http.get(INFO, () => HttpResponse.json({ success: true, data: { user: usuario(false) } })),
    )
    montar()
    await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: /cerrar|cancelar|omitir/i })).toBeNull()
  })
})

describe('cuando el servicio de acceso falla', () => {
  it('un fallo que NO es 401 lo dice y no deja pasar', async () => {
    // Ni cerrar la sesión ni dejar entrar: las dos serían mentira. El 401 sí
    // cierra, y lo maneja el `queryCache` de AppProviders.
    saveToken('jwt.abc')
    server.use(
      http.get(INFO, () =>
        HttpResponse.json({ success: false, error: 'servicio no disponible' }, { status: 503 }),
      ),
    )
    montar()

    expect(await screen.findByText(/No se pudo verificar tu sesión/)).toBeInTheDocument()
    expect(screen.queryByText('LA SUPERFICIE')).toBeNull()
    expect(screen.getByText(/servicio no disponible/)).toBeInTheDocument()
  })
})
