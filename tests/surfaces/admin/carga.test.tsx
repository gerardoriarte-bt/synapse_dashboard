// @vitest-environment jsdom

/** El estado de carga de las tablas de administración · divergencia 3
 *
 *  Del `.pen`, nota de `A1 · Clientes · cargando`:
 *
 *  > «Esqueleto y NUNCA spinner (…) la tabla ya sabe cuántas columnas tiene y de
 *  > qué ancho, así que puede prometer la forma que va a llegar. Un spinner solo
 *  > dice "esperá". El encabezado se pinta completo desde el principio —no
 *  > depende de los datos— y los conteos dicen CARGANDO en vez de una cifra:
 *  > decir "3 TENANTS" mientras carga sería afirmar algo que todavía no llegó.»
 *
 *  **Las respuestas se dejan colgadas a propósito.** Sin eso el estado de carga
 *  dura un tick y no hay nada que mirar; con `delay: 'infinite'` la pantalla se
 *  queda donde importa.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'
const tenants = [{ id: 't-1', name: 'Under Armour México' }]

/** Nunca contesta · deja la pantalla en carga. */
const colgada = async () => {
  await delay('infinite')
  return ok([])
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Admin />
    </QueryClientProvider>,
  )
}

describe('A1 · la lista de clientes mientras carga', () => {
  it('pinta el encabezado completo · no depende de los datos', async () => {
    server.use(http.get(`${API}/admin/tenants`, colgada))
    montar()

    const tabla = await screen.findByRole('table')
    expect(within(tabla).getByText('Cliente')).toBeInTheDocument()
    expect(within(tabla).getByText('Acción')).toBeInTheDocument()
  })

  it('el conteo dice CARGANDO, no una cifra', async () => {
    // «Decir "3 TENANTS" mientras carga sería afirmar algo que todavía no llegó.»
    server.use(http.get(`${API}/admin/tenants`, colgada))
    const { container } = montar()

    expect(await screen.findByText('Clientes · cargando')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Clientes · \d/)
  })

  it('pone filas de esqueleto y NO un spinner', async () => {
    server.use(http.get(`${API}/admin/tenants`, colgada))
    const { container } = montar()

    const tabla = await screen.findByRole('table')
    expect(tabla).toHaveAttribute('aria-busy', 'true')
    // Cuatro, como el `.pen`.
    expect(tabla.querySelectorAll('tbody tr')).toHaveLength(4)
    // Ni animación ni ruleta: la forma alcanza.
    expect(container.querySelector('[class*="animate"]')).toBeNull()
    expect(container.textContent).not.toMatch(/cargando…|espera/i)
  })

  it('las barras NO son todas del mismo ancho', async () => {
    // **La afirmación del componente, verificada.** Una grilla de barras
    // idénticas se lee como un patrón decorativo y no como texto que va a
    // llegar. Sin esta prueba el comentario decía algo que nadie comprobaba —
    // lo encontró una mutación que las igualaba y sobrevivía.
    server.use(http.get(`${API}/admin/tenants`, colgada))
    const { container } = montar()
    await screen.findByRole('table')

    const anchos = new Set(
      Array.from(container.querySelectorAll('tbody td > div')).map(
        (d) => Array.from(d.classList).find((c) => c.startsWith('w-')) ?? '',
      ),
    )
    expect(anchos.size).toBeGreaterThan(1)
  })

  it('NO dice «no hay clientes» mientras todavía está cargando', async () => {
    // El vacío y el todavía-no son cosas distintas, y confundirlas manda a
    // alguien a crear un cliente que ya existe.
    server.use(http.get(`${API}/admin/tenants`, colgada))
    montar()

    await screen.findByRole('table')
    expect(screen.queryByText(/No hay clientes todavía/)).toBeNull()
  })

  it('al llegar los datos, el esqueleto se va', async () => {
    server.use(http.get(`${API}/admin/tenants`, () => ok(tenants)))
    montar()

    expect(await screen.findByText('Under Armour México')).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false')
    expect(screen.getByText('Clientes · 1')).toBeInTheDocument()
  })
})

describe('A4 · el catálogo mientras carga', () => {
  it('conserva el filtro y la declaración de lo que falta', async () => {
    // **Reemplazar la pantalla por «Cargando…» tira información que ya estaba
    // lista.** El filtro, el encabezado y los cuatro campos que §7.3 pide y el
    // cable no trae no dependen de los datos.
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/catalog`, colgada),
    )
    const { container } = montar()
    await screen.findByText('Under Armour México')
    await userEvent.click(screen.getByRole('button', { name: 'Catálogo de métricas' }))

    expect(await screen.findByLabelText('Capa')).toBeInTheDocument()
    expect(container.textContent).toContain('Faltan 3 datos')

    const tabla = screen.getByRole('table')
    expect(tabla).toHaveAttribute('aria-busy', 'true')
    // Y el esqueleto está, con una fila por columna declarada. Sin esta
    // aserción la tabla podía quedar vacía y marcada como ocupada.
    expect(tabla.querySelectorAll('tbody tr')).toHaveLength(4)
    expect(within(tabla).getByText('Grano mínimo')).toBeInTheDocument()
  })

  it('el conteo dice CARGANDO en vez de «0 de 0 métricas»', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/catalog`, colgada),
    )
    const { container } = montar()
    await screen.findByText('Under Armour México')
    await userEvent.click(screen.getByRole('button', { name: 'Catálogo de métricas' }))

    await screen.findByRole('table')
    expect(container.textContent).not.toContain('0 de 0 métricas')
  })

  it('NO dice «no tiene métricas» mientras carga', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/catalog`, colgada),
    )
    montar()
    await screen.findByText('Under Armour México')
    await userEvent.click(screen.getByRole('button', { name: 'Catálogo de métricas' }))

    await screen.findByRole('table')
    expect(screen.queryByText(/no tiene métricas en el catálogo/i)).toBeNull()
  })
})

describe('A2 · los roles mientras cargan', () => {
  it('esqueleto con forma de ficha, y el conteo en CARGANDO', async () => {
    // No es una tabla, así que su esqueleto son tarjetas — misma idea, otra
    // forma. La nota del `.pen` pide un patrón, no un componente único.
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/roles`, colgada),
    )
    montar()
    await screen.findByText('Under Armour México')
    await userEvent.click(screen.getByRole('button', { name: 'Ficha de cliente' }))

    expect(await screen.findByText('Roles · cargando')).toBeInTheDocument()
    expect(screen.queryByText(/no tiene roles definidos todavía/i)).toBeNull()
    // El CTA no depende de los datos y sigue ahí.
    expect(screen.getByRole('button', { name: 'Nuevo rol' })).toBeInTheDocument()
  })
})
