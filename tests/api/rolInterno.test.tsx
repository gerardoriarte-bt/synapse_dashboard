// @vitest-environment jsdom

/** «superadmin» no se ofrece en ninguna lista de roles · decisión humana del 2026-10-20.
 *
 *  `d794a3e` crea el rol en CADA cliente, y el servicio lo devuelve en
 *  `/roles/composition` como uno más —medido en local ese día—. Se afirma en
 *  los dos hooks que alimentan las listas, porque de ahí salen todas: el
 *  selector de rol de cada usuario, la ficha y el builder.
 */
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { useRoles, useRolesOf } from '@/api/hooks'
import { sinRolesInternos } from '@/api/rol'
import { API, ok } from '../mocks/handlers'
import { server } from '../mocks/server'

const fila = (id: string, name: string) => ({
  id, tenant_id: 't-1', name, tab_keys: [], tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 0,
})

function conServicio() {
  server.use(
    http.get(`${API}/admin/tenants/:id/roles/composition`, () =>
      ok([fila('r-1', 'admin'), fila('r-2', 'Planner'), fila('r-3', 'superadmin')]),
    ),
  )
}

function envoltura({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('las listas de roles', () => {
  it('la del cliente no trae «superadmin»', async () => {
    conServicio()
    const { result } = renderHook(() => useRoles('t-1'), { wrapper: envoltura })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.map((r) => r.nombre)).toEqual(['admin', 'Planner'])
  })

  it('la de varios clientes tampoco', async () => {
    conServicio()
    const { result } = renderHook(() => useRolesOf(['t-1']), { wrapper: envoltura })
    await waitFor(() => expect(result.current['t-1']).toBeDefined())
    expect(result.current['t-1']?.map((r) => r.nombre)).toEqual(['admin', 'Planner'])
  })
})

describe('sinRolesInternos', () => {
  it('compara como el servicio: sin mayúsculas ni espacios', () => {
    expect(sinRolesInternos([{ nombre: ' SuperAdmin ' }, { nombre: 'admin' }])).toEqual([{ nombre: 'admin' }])
  })
})
