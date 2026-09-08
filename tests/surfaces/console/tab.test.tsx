// @vitest-environment jsdom

/** Una pestaña completa, de punta a punta contra HTTP · F5.9
 *
 *  **Un panel no es una pestaña, y la diferencia es lo que esta prueba busca.**
 *  Las de `states.test.tsx` montan un solo panel: alcanzan para verificar que un
 *  estado llega y se pinta, y no ven nada de lo que solo existe cuando hay
 *  varios — que cada panel resuelva SU métrica y no la del vecino, que la grilla
 *  los coloque donde el layout dice, que cinco tipos distintos carguen cinco
 *  cuerpos distintos, y que un panel roto no arrastre a los otros.
 *
 *  Cinco paneles, cinco tipos, cinco formas. Todo entra por MSW: ni un fixture
 *  JS importado por la superficie.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { Metric } from '@/api/types'

const gobierno = {
  base: '48 tiendas sobre 52',
  capa: 'GOLD',
  fuente: 'Snowflake',
  frescura: '2026-09-02T08:00:00Z',
  catalogVersion: 1,
}

/** (tipo de panel, forma de la métrica, nombre, valor). Los cinco tipos que
 *  cubren cinco cuerpos distintos y cinco formas del contrato. */
const PANELES = [
  ['kpi', 'escalar', 'Venta diaria', { forma: 'escalar', v: 4280000 }],
  ['bars', 'categorica', 'Ventas por canal', {
    forma: 'categorica',
    items: [{ etiqueta: 'Tienda', v: 60 }, { etiqueta: 'Online', v: 40 }],
  }],
  ['list', 'ranking', 'Reposición prioritaria', {
    forma: 'ranking',
    items: [{ etiqueta: 'Talla M', v: 2, posicion: 1 }],
  }],
  ['prose', 'prosa', 'Lectura del mes', {
    forma: 'prosa',
    titular: 'El inventario cubre 31 días.',
    pilares: [{ label: 'Cobertura', valor: '31 d' }],
  }],
  ['table', 'tabular', 'Detalle por tienda', {
    forma: 'tabular',
    // `clave`, `titulo` y `numerica` son los tres `required` del contrato. El
    // primer intento los escribió de memoria —`etiqueta` en vez de `titulo`— y
    // la tabla se dibujaba vacía sin decir nada.
    columnas: [
      { clave: 'tienda', titulo: 'Tienda', numerica: false },
      { clave: 'venta', titulo: 'Venta', numerica: true },
    ],
    filas: [{ tienda: 'Polanco', venta: 1200 }],
  }],
] as const

const metrics = PANELES.map(([tipo, forma, nombre]) => ({
  id: `m-${tipo}`,
  key: `k_${tipo}`,
  nombre,
  forma,
  familia: 'demanda',
  capa: 'GOLD',
  fuente: 'Snowflake',
  ventana: 'Últimos 30 días',
  base: '48 tiendas sobre 52',
  granoMinimo: 'mes',
  estado: 'DISPONIBLE',
  catalogVersion: 1,
  // La unidad es de la MÉTRICA y el KPI la antepone: sin ella la cifra sale
  // «4.28M» y no «USD 4.28M».
  ...(tipo === 'kpi' ? { unidad: 'USD' } : {}),
})) as unknown as Metric[]

// La grilla es de 12: tres arriba de 4, dos abajo de 6.
const panels = PANELES.map(([tipo], i) => ({
  id: `p-${tipo}`,
  tipo,
  metricId: `m-${tipo}`,
  colStart: i < 3 ? i * 4 + 1 : (i - 3) * 6 + 1,
  colSpan: i < 3 ? 4 : 6,
  rowSpan: 4,
}))

const payloads = Object.fromEntries(
  PANELES.map(([tipo, , , valor]) => [`p-${tipo}`, { estado: 'DISPONIBLE', valor, ...gobierno }]),
)

function laPestana(payloadsUsados: Record<string, unknown> = payloads) {
  server.use(
    http.get(`${API}/config/catalog`, () => ok({ metrics })),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ ...context.tabs[0], panels })),
    http.post(`${API}/config/panels:batch`, () => ok(payloadsUsados)),
  )
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ConsoleContainer />
    </QueryClientProvider>,
  )
}

describe('cinco paneles, cinco tipos, una pestaña', () => {
  it('los cinco se dibujan, cada uno con SU título', async () => {
    laPestana()
    montar()
    // El del primero espera al batch; los otros ya están para entonces.
    expect(await screen.findByRole('heading', { name: 'Venta diaria' })).toBeInTheDocument()
    for (const [, , nombre] of PANELES) {
      expect(screen.getByRole('heading', { name: nombre, level: 2 })).toBeInTheDocument()
    }
  })

  it('cada panel resuelve SU métrica, no la del vecino', async () => {
    // Con un solo panel esto no se puede verificar: el bug de resolver siempre
    // la primera métrica del catálogo pasa desapercibido.
    laPestana()
    montar()
    await screen.findByRole('heading', { name: 'Venta diaria' })

    const detalle = screen.getByRole('heading', { name: 'Detalle por tienda' }).closest('section')
    expect(detalle).not.toBeNull()
    // El shell del panel de tabla dice «Detalle por tienda» y no «Venta diaria».
    expect(within(detalle as HTMLElement).queryByText(/Venta diaria/)).toBeNull()
  })

  it('cada cuerpo dibuja lo suyo · cinco tipos, cinco cuerpos', async () => {
    // **El timeout es más largo a propósito.** Cinco cuerpos son cinco chunks
    // diferidos que bajan en paralelo, y el segundo por defecto de
    // testing-library no alcanza. Es una propiedad de la prueba y no del
    // producto: con un panel, `states.test.tsx` resuelve sin tocar nada.
    const lento = { timeout: 4000 }
    laPestana()
    montar()
    expect(await screen.findByText('USD 4.28M', {}, lento)).toBeInTheDocument()
    expect(await screen.findByText('El inventario cubre 31 días.', {}, lento)).toBeInTheDocument()
    expect(await screen.findByText('Polanco', {}, lento)).toBeInTheDocument()
    expect(await screen.findByText(/talla m/i, {}, lento)).toBeInTheDocument()
  })

  it('la grilla los coloca donde dice el LAYOUT, no el orden del arreglo', async () => {
    // **jsdom abre en 1024px, que son SEIS columnas**, y el primer intento de
    // esta prueba asumió doce. No es un detalle del entorno: es F1.30
    // funcionando —el span se divide a la mitad redondeando hacia arriba— y la
    // prueba lo estaba tomando como un fallo. Se fija el ancho para verificar
    // los dos escalones a propósito.
    window.innerWidth = 1440
    laPestana()
    const { container } = montar()
    await screen.findByRole('heading', { name: 'Venta diaria' })

    expect(container.querySelectorAll('[style*="grid-column"]')).toHaveLength(5)

    // **La celda se busca por su panel, no por índice**, y esa es la mitad del
    // título: `readingOrder` de F1.30 ordena el DOM por `colStart`, así que la
    // posición en el DOM no es la del arreglo. Buscar por índice hacía pasar la
    // prueba por casualidad.
    const celdaDe = (titulo: string) =>
      screen
        .getByRole('heading', { name: titulo, level: 2 })
        .closest('[style*="grid-column"]') as HTMLElement

    // A doce columnas, `colStart` y `colSpan` salen del layout tal cual.
    expect(celdaDe('Venta diaria').style.gridColumn).toBe('1 / span 4')
    expect(celdaDe('Lectura del mes').style.gridColumn).toBe('1 / span 6')
    expect(celdaDe('Detalle por tienda').style.gridColumn).toBe('7 / span 6')
    // El alto NO es un `height`: es `gridRow: span N` sobre un contenedor con
    // `gridAutoRows`, que es lo que hace que `96·N − 16` quede aplicado y no
    // solo escrito. Buscar un `height` daba vacío y parecía un fallo.
    expect(celdaDe('Venta diaria').style.gridRow).toBe('span 4')
  })
})

describe('fallo parcial · un panel roto no arrastra a los otros', () => {
  it('cuatro con cifra y uno en ERROR, en la misma respuesta', async () => {
    laPestana({
      ...payloads,
      'p-table': { estado: 'ERROR', mensaje: 'El almacén no respondió.' },
    })
    montar()

    expect(await screen.findByText('USD 4.28M', {}, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getByText(/El almacén no respondió/)).toBeInTheDocument()
    // Y el shell del que falló sigue entero: título y BASE.
    expect(screen.getByRole('heading', { name: 'Detalle por tienda' })).toBeInTheDocument()
    expect(screen.getAllByText(/^Base ·/)).toHaveLength(5)
  })
})
