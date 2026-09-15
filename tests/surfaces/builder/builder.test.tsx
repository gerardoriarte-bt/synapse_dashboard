// @vitest-environment jsdom

/** La superficie del builder · F4.6
 *
 *  **Las pruebas citan §7.2 y §4 de `design.md`, no miran la implementación.**
 *  Y la que sostiene esta tarea es la del ancho: §4 da dos números y B5 es la
 *  excepción, así que una tabla con un solo ancho pasaría un test escrito desde
 *  el código y violaría la spec.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { PANTALLAS } from '@/surfaces/builder/pantallas'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

/** B1 ya trae datos —es F4.7— así que el chrome se monta con proveedor y con
 *  servicio. Lo que estas pruebas miran sigue siendo el chrome. */
function montar() {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok([{ id: 't-1', name: 'Under Armour México' }])),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Builder />
    </QueryClientProvider>,
  )
}

describe('§7.2 · las seis pantallas', () => {
  it('declara las seis, en el orden de la spec', () => {
    // Del dato y no del render: si una se agrega o se renombra en el diseño,
    // esto lo dice antes que una prueba de pantalla.
    expect(PANTALLAS.map((p) => p.nombre)).toEqual([
      'Contexto de edición',
      'Canvas',
      'Selector de gráfico',
      'Binder de métrica',
      'Vista previa por rol',
      'Historial de versiones',
    ])
  })
})

describe('§4 · el ancho mínimo, que no es uniforme', () => {
  it('B5 va a 1440 y las otras cinco a 1600', () => {
    // «Builder · 1600 mínimo 1600 (…) La excepción es B5, que va a 1440 porque
    // muestra la consola del cliente a su ancho real.»
    //
    // Es la regla que un test escrito desde el código no vería: una tabla con
    // 1600 en las seis se ve perfectamente coherente.
    const anchos = Object.fromEntries(PANTALLAS.map((p) => [p.id, p.ancho]))
    expect(anchos).toEqual({
      contexto: 1600,
      canvas: 1600,
      grafico: 1600,
      metrica: 1600,
      preview: 1440,
      historial: 1600,
    })
  })

  it('el chrome PINTA el mínimo de la pantalla activa', async () => {
    // Un `min-w-[1600px]` interpolado compilaría y no pintaría nada: Tailwind
    // poda lo que su escáner no ve escrito. Es el silencio de `text-labell`.
    const { container } = montar()
    expect(container.querySelector('.min-w-\\[1600px\\]')).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Vista previa por rol' }))
    expect(container.querySelector('.min-w-\\[1440px\\]')).not.toBeNull()
    expect(container.querySelector('.min-w-\\[1600px\\]')).toBeNull()
  })

  it('NO colapsa · §4 dice ancho mínimo, no menos columnas', async () => {
    // «Las otras dos superficies no son grids y declaran ancho mínimo en vez de
    // colapso.» Escalar el lienzo haría mentir a las unidades de arrastre.
    const { container } = montar()
    for (const clase of ['grid-cols-6', 'grid-cols-1', 'max-w-full']) {
      expect(container.querySelector(`.${clase}`)).toBeNull()
    }
  })

  it('el chrome DICE el ancho y por qué', async () => {
    // Sin esto, que B5 se vea más angosta se lee como un defecto de maquetado.
    montar()
    expect(screen.getByText(/1600 · lienzo 1:1 a 1200 más 300 de biblioteca/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Vista previa por rol' }))
    expect(screen.getByText(/1440 · la consola del cliente a su ancho real/)).toBeInTheDocument()
  })
})

describe('las pantallas que todavía no se pueden construir', () => {
  it('las cinco dicen qué las desbloquea en vez de mostrarse vacías', async () => {
    // Cinco y no seis: B1 está construida · F4.7. Una pantalla que se declara
    // pendiente no es lo mismo que una que no está.
    montar()
    for (const p of PANTALLAS.filter((x) => x.id !== 'contexto')) {
      await userEvent.click(screen.getByRole('button', { name: p.nombre }))
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
      expect(screen.getByText(/Se desbloquea con/)).toBeInTheDocument()
    }
  })

  it('B1 NO se declara pendiente · está construida', async () => {
    montar()
    expect(screen.queryByText('Pendiente')).toBeNull()
    expect(await screen.findByLabelText('Cliente')).toBeInTheDocument()
  })

  it('B2 espera una decisión de DISEÑO, no un endpoint', async () => {
    // La distinción que importa: §7.2 describe el resultado del arrastre —slot
    // vacío, badge HEREDADO, colisión marcada— y no la interacción. F4.9 no se
    // toma sin esa decisión, y decirlo acá es lo que impide que alguien la
    // invente creyendo que solo falta cable.
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Canvas' }))
    expect(screen.getByText(/decisión de diseño/i)).toBeInTheDocument()
    expect(screen.getByText(/no la interacción/)).toBeInTheDocument()
  })

  it('B6 nombra los dos campos que el cable no trae', async () => {
    // §7.2: «quién, cuándo, qué cambió. Permite revertir.» `LayoutVersion` trae
    // cuándo. Ni autor, ni diferencia, ni ruta de reversión.
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Historial de versiones' }))
    const texto = screen.getByText(/quién, cuándo y qué cambió/)
    expect(texto).toBeInTheDocument()
    expect(screen.getByText(/B4.10/)).toBeInTheDocument()
  })

  it('B3 nombra /config/plots, que es lo que espera', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Selector de gráfico' }))
    // Dos veces: la razón y lo que la desbloquea.
    expect(screen.getAllByText(/config\/plots/).length).toBeGreaterThan(0)
    expect(screen.getByText(/B1.21/)).toBeInTheDocument()
  })
})
