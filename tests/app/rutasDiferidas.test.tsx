// @vitest-environment jsdom

/** El arranque directo en `/admin` y `/builder` con las superficies diferidas
 *  · mejora #1 de `docs/AUDITORIA-2026-11-25-calidad-de-codigo.md`.
 *
 *  **Monta las rutas de VERDAD**, las de `routes.tsx`, y no las superficies
 *  sueltas: lo que puede romperse con `lazy()` es el camino entre la URL y la
 *  pantalla —el `Suspense`, el `.then` que convierte el export con nombre en
 *  `default`—, y las pruebas de cada superficie lo saltean porque importan el
 *  componente directo.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useRoutes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { routes } from '@/app/router/routes'
import { saveToken, signOut } from '@/app/auth/session'
import { ClienteDeTrabajoProvider } from '@/surfaces/ClienteDeTrabajoProvider'
import { ok } from '../mocks/handlers'
import { server } from '../mocks/server'

/** Espera generosa: el primer `import()` del chunk entero de una superficie
 *  compite con las otras pruebas que corren en la máquina. */
const lento = { timeout: 8000 }

afterEach(() => signOut())

function Rutas() {
  return useRoutes(routes)
}

function montarEn(ruta: string) {
  saveToken('jwt.abc')
  server.use(
    // Lo que administración pide al arrancar y el juego por defecto no trae.
    http.get('*/api/v1/admin/tenants', () => ok([])),
    http.get('*/api/v1/admin/users', () => ok({ total: 0, tenants: [], users: [] })),
    http.get('*/api/v1/auth/token-info', () =>
      HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 'u-1',
            tenant_id: 't-1',
            email: 'prueba@uamx.test',
            first_name: 'Prueba',
            last_name: 'Uno',
            phone: '',
            role: 'admin',
            password_updated: true,
          },
        },
      }),
    ),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <ClienteDeTrabajoProvider>
          <Rutas />
        </ClienteDeTrabajoProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('arranque directo en una superficie diferida', () => {
  // **Ésta va primera, y el orden importa.** `lazy()` resuelve una sola vez por
  // módulo: después de que otra prueba bajó el chunk de administración, el
  // `Suspense` ya no suspende y el mensaje no aparece nunca.
  it('mientras llega el código se dice qué se está cargando', async () => {
    // El `Suspense` reemplaza la pantalla con el mismo mensaje de superficie
    // que usa el guardia. Con un `fallback` vacío la pantalla quedaría en
    // blanco sin decir por qué.
    montarEn('/admin')
    expect(await screen.findByText('Cargando Administración', {}, lento)).toBeInTheDocument()
    expect(await screen.findByRole('navigation', { name: 'Administración' }, lento)).toBeInTheDocument()
    expect(screen.queryByText('Cargando Administración')).toBeNull()
  }, 20_000)

  it('`/admin` pinta administración', async () => {
    montarEn('/admin')
    expect(await screen.findByRole('navigation', { name: 'Administración' }, lento)).toBeInTheDocument()
  }, 20_000)

  it('`/builder` pinta el builder', async () => {
    montarEn('/builder')
    expect(await screen.findByRole('navigation', { name: 'Builder' }, lento)).toBeInTheDocument()
  }, 20_000)
})
