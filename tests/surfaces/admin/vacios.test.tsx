// @vitest-environment jsdom

/** Los tres tipos de vacío · divergencia 4
 *
 *  Las tres notas de vacío del `.pen` repiten la misma frase: «un estado sin
 *  salida es una queja (…) **los tres tipos de vacío declaran qué pasó y qué se
 *  puede hacer, y la salida cambia con la causa**».
 *
 *  | | Qué pasó | La salida |
 *  |---|---|---|
 *  | sistema | Nadie dio de alta nada | Crear el primero |
 *  | filtro | Los datos están · el filtro los esconde | **Deshacer** |
 *  | alta | El cliente es nuevo | El siguiente paso |
 *
 *  **Confundir el de filtro con el de sistema manda a crear lo que ya existe**,
 *  y es el error que estas pruebas persiguen.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'
const tenants = [{ id: 't-1', name: 'Under Armour México' }]

const metrica = (id: string, layer: string) => ({
  id, tenant_id: 't-1', key: id, name: `Métrica ${id}`,
  shape: 'scalar', family: 'demand', layer, source: 'ERP',
  base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
})

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      {/* **En un router, porque el contenedor navega.** Desde el 2026-09-16
          `Admin`/`Builder` ofrecen «volver a la consola» y eso es `useNavigate`,
          que fuera de un router lanza. Montarlos sin él probaba una app que la
          real no es. */}
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function abrirCatalogo() {
  await screen.findByText('Under Armour México')
  await userEvent.click(screen.getByRole('button', { name: 'Catálogo de métricas' }))
  await screen.findByRole('table')
}

describe('vacío de SISTEMA · nadie dio de alta nada', () => {
  it('A1 dice qué crea el primero, y conserva el encabezado', async () => {
    server.use(http.get(`${API}/admin/tenants`, () => ok([])))
    const { container } = montar()

    expect(await screen.findByText(/Ningún cliente dado de alta todavía/)).toBeInTheDocument()
    expect(container.textContent).toContain('plantilla de vertical')
    // **Sin botón de deshacer**: no hay nada que deshacer.
    expect(screen.queryByRole('button', { name: 'Limpiar el filtro' })).toBeNull()
  })

  it('A4 sin métricas manda a sincronizar', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
    )
    montar()
    await abrirCatalogo()

    expect(screen.getByText(/no tiene métricas en el catálogo/)).toBeInTheDocument()
    expect(screen.getByText(/sincronizando desde el modelo semántico · B1.18/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpiar el filtro' })).toBeNull()
  })
})

describe('vacío de FILTRO · los datos están y el filtro los esconde', () => {
  it('dice CUÁNTAS hay en total · sin eso parecen perdidas', async () => {
    // «0 MÉTRICAS CON ESTE FILTRO · 28 EN TOTAL». Sin el total, cero con filtro
    // y cero sin nada se leen igual.
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/catalog`, () =>
        ok([metrica('m-1', 'GOLD'), metrica('m-2', 'GOLD')]),
      ),
    )
    montar()
    await abrirCatalogo()

    await userEvent.type(screen.getByLabelText('Buscar'), 'zzz')
    expect(
      await screen.findByText('0 métricas con este filtro · 2 en total'),
    ).toBeInTheDocument()
  })

  it('la salida es DESHACER, no crear', async () => {
    // **Es el error que importa**: un CTA de alta acá manda a crear lo que ya
    // existe.
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/catalog`, () =>
        ok([metrica('m-1', 'GOLD'), metrica('m-2', 'SILVER')]),
      ),
    )
    const { container } = montar()
    await abrirCatalogo()

    // **Por búsqueda y no por capa.** El selector de capa se arma con las capas
    // que hay, así que elegir una siempre devuelve al menos una métrica: el
    // vacío de filtro era inalcanzable por ahí. Lo encontró esta prueba.
    await userEvent.type(screen.getByLabelText('Buscar'), 'zzz')

    await waitFor(() =>
      expect(screen.getByText(/0 métricas con este filtro · 2 en total/)).toBeInTheDocument(),
    )
    expect(container.textContent).not.toContain('sincronizando desde el modelo semántico')
    expect(screen.getByRole('button', { name: 'Limpiar el filtro' })).toBeInTheDocument()
  })

  it('el botón limpia el filtro de verdad', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/catalog`, () =>
        ok([metrica('m-1', 'GOLD'), metrica('m-2', 'SILVER')]),
      ),
    )
    montar()
    await abrirCatalogo()

    await userEvent.type(screen.getByLabelText('Buscar'), 'zzz')
    await userEvent.click(await screen.findByRole('button', { name: 'Limpiar el filtro' }))

    await waitFor(() => expect(screen.getByText('2 de 2 métricas')).toBeInTheDocument())
    expect(screen.getByText('Métrica m-1')).toBeInTheDocument()
  })

  it('conserva el encabezado · las columnas dicen qué habría acá', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/catalog`, () => ok([metrica('m-1', 'GOLD')])),
    )
    montar()
    await abrirCatalogo()

    await userEvent.type(screen.getByLabelText('Buscar'), 'zzz')
    const tabla = screen.getByRole('table')
    expect(within(tabla).getByText('Métrica')).toBeInTheDocument()
    expect(within(tabla).getByText('Grano mínimo')).toBeInTheDocument()

    // **Y el mensaje ocupa el ancho entero.** Sin `colSpan` la fila del vacío
    // mide una columna y el encabezado se desalinea — que es romper justo lo
    // que este estado existe para conservar.
    const celda = tabla.querySelector('tbody td')
    expect(celda?.getAttribute('colspan')).toBe(String(within(tabla).getAllByRole('columnheader').length))
  })
})

describe('vacío de ALTA · el cliente es nuevo', () => {
  it('A2 dice la consecuencia y el siguiente paso, no «no hay roles»', async () => {
    // «No falta un filtro ni falla nada: el cliente es nuevo y el trabajo está
    // por hacerse» · nota de `A2 · Ficha · tenant en alta`.
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/roles`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
    )
    montar()
    await screen.findByText('Under Armour México')
    await userEvent.click(screen.getByRole('button', { name: 'Ficha de cliente' }))

    expect(await screen.findByText(/todavía no tiene roles · está en alta/)).toBeInTheDocument()
    // La consecuencia, que es lo que lo vuelve accionable.
    expect(screen.getByText(/nadie puede entrar a la consola de este cliente/)).toBeInTheDocument()
    expect(screen.getByText(/El siguiente paso es crear el primero/)).toBeInTheDocument()
  })
})
