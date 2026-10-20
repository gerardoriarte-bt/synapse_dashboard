// @vitest-environment jsdom

/** El menú de trabajo para «superadmin» · 2026-10-20
 *
 *  Visto en QA: al pasar a José a «superadmin» desapareció el menú hamburguesa,
 *  aunque el servidor le contesta 200 en `/admin/*`. Se prueba la cadena entera
 *  —`/config/me` → `esAdmin` → `Topbar`—, no sólo la función.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

function montar(rol: string) {
  server.use(http.get(`${API}/config/me`, () => ok({ ...context, role: { id: 'r-x', name: rol } })))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('el menú de trabajo en la consola', () => {
  it('con «superadmin» está', async () => {
    montar('superadmin')
    expect(await screen.findByRole('button', { name: 'Menú de trabajo' })).toBeInTheDocument()
  })
  it('con «Planner» no', async () => {
    montar('Planner')
    await screen.findByRole('button', { name: 'Preguntar sobre esta pestaña' })
    expect(screen.queryByRole('button', { name: 'Menú de trabajo' })).toBeNull()
  })
})
