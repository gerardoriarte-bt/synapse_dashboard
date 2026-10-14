// @vitest-environment jsdom

/** El mes abierto sin dato cae al anterior, y lo dice · 2026-10-01
 *
 *  ── EL DEFECTO QUE CIERRA, MEDIDO EL DÍA QUE PASÓ ───────────────────────────
 *
 *  El 2026-10-01, al cambiar la fecha de mes, `/config/me` pasó a ofrecer
 *  `2026-10` primero y a declararlo `open_period` — y `dd_panel_data` tenía
 *  **cero filas** de ese período. El contenedor elegía `periods[0]`, así que los
 *  quince paneles salían `BLOQUEADO · No hay datos calculados para este período`.
 *  **Un cliente que abre el día 1 ve el dashboard entero apagado.**
 *
 *  ── POR QUÉ ESTAS PRUEBAS Y NO UNA ──────────────────────────────────────────
 *
 *  Lo que se construyó tiene cuatro formas de verse bien y estar mal, y cada una
 *  tiene su `it`:
 *
 *  1. **No caer** cuando el mes nuevo SÍ tiene algo — que es lo pedido: mostrar
 *     el mes nuevo en cuanto se tenga.
 *  2. **Caer** cuando no tiene nada.
 *  3. **Decirlo.** Caer en silencio es peor que no caer: la cifra de septiembre
 *     bajo el rótulo de octubre es correcta y se lee falsa.
 *  4. **No pisar la elección de quien mira.** Elegir octubre a mano tiene que
 *     mostrar octubre, con sus paneles declarando por qué están vacíos.
 *
 *  Y el modo de falla de la cadena es el de siempre: el aviso baja por
 *  `ConsoleContainer → Console → Topbar → PeriodPicker` con un spread condicional
 *  en cada salto, y **una prop mal nombrada compila**. Por eso se verifica que el
 *  aviso LLEGUE a la pantalla, no que el contenedor lo calcule.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, context, kpiMetric, kpiPanel, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'

/** Dos meses, el primero abierto · es la forma que el servicio manda el día 1. */
const DOS_MESES = {
  ...context,
  periods: ['2026-10', '2026-09'],
  open_period: '2026-10',
  periods_detail: [
    { key: '2026-10', grain: 'month' as const, start: '2026-10-01', end: '2026-11-01' },
    { key: '2026-09', grain: 'month' as const, start: '2026-09-01', end: '2026-10-01' },
  ],
}

const BLOQUEADO = {
  status: 'BLOCKED',
  reason: 'No hay datos calculados para este período',
  unlocks_with: '',
  governance: { base: '48 tiendas', layer: 'GOLD', source: 'Snowflake', freshness: '2026-10-01T00:00:00Z' },
}

const CON_CIFRA = {
  status: 'AVAILABLE',
  value: { shape: 'scalar', v: 4280000 },
  governance: { base: '48 tiendas', layer: 'GOLD', source: 'Snowflake', freshness: '2026-10-01T00:00:00Z' },
}

/** El batch responde SEGÚN EL PERÍODO que le pidan, que es lo único que hace
 *  distinguibles los cuatro casos. Devuelve también cuántas veces se pidió cada
 *  uno: sin eso, «cayó» y «nunca pidió el abierto» se leen igual. */
function servir(porPeriodo: Record<string, unknown>) {
  const pedidos: string[] = []
  server.use(
    http.get(`${API}/config/me`, () => ok(DOS_MESES)),
    http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab, panels: [kpiPanel] })),
    http.post(`${API}/config/panels:batch`, async ({ request }) => {
      const body = (await request.json()) as { period?: string }
      const p = body.period ?? ''
      pedidos.push(p)
      return ok({ [kpiPanel.id]: porPeriodo[p] ?? BLOQUEADO })
    }),
  )
  return pedidos
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('el mes abierto SIN dato cae al anterior', () => {
  it('cae, y la cifra que se ve es la del mes anterior', async () => {
    servir({ '2026-10': BLOQUEADO, '2026-09': CON_CIFRA })
    montar()

    // La cifra de septiembre es lo que prueba que el batch se rehizo con el otro
    // período: con la caída rota, acá habría un panel bloqueado.
    expect(await screen.findByText(/4\.280\.000|4,280,000|4\.28M/)).toBeInTheDocument()
  })

  it('y lo DICE · caer en silencio es peor que no caer', async () => {
    // Una cifra de septiembre bajo el rótulo de octubre es correcta y se lee
    // falsa — el mismo modo de falla que un panel degradado sin su aviso.
    servir({ '2026-10': BLOQUEADO, '2026-09': CON_CIFRA })
    montar()

    expect(
      await screen.findByText(/2026-10 todavía no tiene datos calculados/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/se muestra 2026-09/i)).toBeInTheDocument()
  })

  it('PIDIÓ el mes abierto antes de caer · no lo saltea a ciegas', async () => {
    // **Es la aserción que distingue esto de «arrancar siempre en el cerrado».**
    // Sin ella, saltear el abierto sin mirarlo pasaría las dos de arriba — y es
    // justo la opción que se descartó, porque el día 20 el mes nuevo ya tiene
    // dato y hay que mostrarlo.
    const pedidos = servir({ '2026-10': BLOQUEADO, '2026-09': CON_CIFRA })
    montar()
    await screen.findByText(/todavía no tiene datos calculados/i)

    expect(pedidos[0]).toBe('2026-10')
    expect(pedidos).toContain('2026-09')
  })
})

describe('el mes abierto CON dato no se toca', () => {
  it('con un solo panel con cifra se queda en el mes nuevo, y sin aviso', async () => {
    // **El umbral es estricto a propósito**: apenas el mes nuevo materializa UN
    // panel se deja de caer. Con un umbral laxo —«la mayoría»— un mes a medio
    // cargar seguiría mostrando el anterior.
    servir({ '2026-10': CON_CIFRA, '2026-09': CON_CIFRA })
    montar()

    expect(await screen.findByText(/4\.280\.000|4,280,000|4\.28M/)).toBeInTheDocument()
    expect(screen.queryByText(/todavía no tiene datos calculados/i)).toBeNull()
  })
})

describe('las dos cosas que NO son «un mes sin dato»', () => {
  it('un panel DEGRADADO cuenta como dato · lleva cifra, aunque vieja', async () => {
    // **Lo encontró una mutación que sobrevivió.** Sacar `DEGRADADO` del test de
    // «tiene valor» no rompía nada, porque ningún fixture lo usaba. Y es el caso
    // que más importa del mes nuevo: lo primero que aparece cuando una fuente se
    // atrasa es un degradado, y caer al mes anterior lo escondería — justo el
    // dato más fresco que hay.
    servir({
      '2026-10': {
        status: 'DEGRADED',
        value: { shape: 'scalar', v: 4280000 },
        reason: 'Su fuente tiene 31 h',
        unlocks_with: 'esperar la próxima materialización',
        governance: { base: '48 tiendas', layer: 'GOLD', source: 'Snowflake', freshness: '2026-10-01T00:00:00Z' },
      },
      '2026-09': CON_CIFRA,
    })
    montar()

    expect(await screen.findByText(/4\.280\.000|4,280,000|4\.28M/)).toBeInTheDocument()
    expect(screen.queryByText(/todavía no tiene datos calculados/i)).toBeNull()
  })

  it('una pestaña SIN paneles no es un mes sin dato', async () => {
    // **La otra mutación que sobrevivió.** Sin la guarda de `panels.length`, un
    // batch vacío se lee como «ningún panel con valor» y la consola cae al mes
    // anterior mientras el layout todavía vuela — o para siempre, si la pestaña
    // de verdad no tiene paneles. Caer por no haber preguntado es lo contrario
    // de lo que esto hace.
    const pedidos: string[] = []
    server.use(
      http.get(`${API}/config/me`, () => ok(DOS_MESES)),
      http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
      http.get(`${API}/config/tabs/:tabId`, () => ok({ tab, panels: [] })),
      http.post(`${API}/config/panels:batch`, async ({ request }) => {
        const body = (await request.json()) as { period?: string }
        pedidos.push(body.period ?? '')
        return ok({})
      }),
    )
    montar()

    // Se espera a que la pestaña esté montada para que la ausencia signifique
    // algo: una aserción negativa sobre una pantalla que todavía no cargó pasa
    // siempre y no verifica nada.
    expect(await screen.findByText(tab.operational_question ?? '')).toBeInTheDocument()
    expect(screen.queryByText(/todavía no tiene datos calculados/i)).toBeNull()
    expect(pedidos).not.toContain('2026-09')
  })
})

describe('elegir a mano gana sobre la caída', () => {
  it('quien elige el mes abierto lo ve, con sus paneles declarando por qué', async () => {
    servir({ '2026-10': BLOQUEADO, '2026-09': CON_CIFRA })
    montar()
    await screen.findByText(/todavía no tiene datos calculados/i)

    await userEvent.selectOptions(await screen.findByLabelText(/período/i), '2026-10')

    await waitFor(() => {
      expect(screen.getByText(/No hay datos calculados para este período/i)).toBeInTheDocument()
    })
    // Y el aviso se va: ya no hay sustitución que explicar.
    expect(screen.queryByText(/todavía no tiene datos calculados · se muestra/i)).toBeNull()
  })
})
