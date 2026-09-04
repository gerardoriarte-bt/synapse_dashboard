// @vitest-environment jsdom

/** Los seis estados, de punta a punta contra el batch · Fase 2
 *
 *  **Lo que esto agrega a `Panel.test.tsx` es de dónde viene el payload.** Ahí
 *  los estados se montan a mano y se verifica que el shell sobreviva; acá bajan
 *  por `/config/panels:batch` como en producción. La diferencia no es de estilo:
 *  hasta hoy MSW emitía únicamente `DISPONIBLE`, así que los otros cinco no
 *  habían atravesado nunca el contenedor, el adaptador de params ni el registro
 *  de cuerpos. Un estado que el `switch` pinta bien puede no llegar jamás.
 *
 *  **`BLOQUEADO`, `SIN_PERMISO` y `ERROR` no llevan `Gobierno`** —el contrato lo
 *  intersecta solo en los dos estados con cifra—, y ahí está la prueba de F2.6
 *  que no se puede hacer de otra forma: si la BASE sigue en pantalla con un
 *  payload que no la trae, es porque salió del catálogo. Es D6 verificada, no
 *  declarada.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, context, kpiMetric, kpiPanel, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

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

function conUnPanel(payload: unknown) {
  server.use(
    http.get(`${API}/config/catalog`, () => ok({ metrics: [kpiMetric] })),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ ...context.tabs[0], panels: [kpiPanel] })),
    http.post(`${API}/config/panels:batch`, () => ok({ [kpiPanel.id]: payload })),
  )
}

/** El gobierno que acompaña a los dos estados con cifra. Los otros cuatro NO lo
 *  llevan, y es a propósito: el contrato no se lo declara. */
const gobierno = {
  base: '48 tiendas sobre 52',
  capa: 'GOLD',
  fuente: 'Snowflake',
  frescura: '2026-09-02T08:00:00Z',
  catalogVersion: 1,
}

const DISPONIBLE = { estado: 'DISPONIBLE', valor: { forma: 'escalar', v: 4280000 }, ...gobierno }

const DEGRADADO = {
  estado: 'DEGRADADO',
  valor: { forma: 'escalar', v: 4280000 },
  razon: 'El feed de inventario tiene 31 horas',
  desbloqueaCon: 'Reconectar el snapshot de inventario',
  ...gobierno,
}

const BLOQUEADO = {
  estado: 'BLOQUEADO',
  razon: 'Falta identificador de persona en la orden',
  desbloqueaCon: 'Feed transaccional con identidad estable',
}

const SIN_PERMISO = { estado: 'SIN_PERMISO', solicitarA: 'CMO' }

const ERROR = { estado: 'ERROR', mensaje: 'El almacén no respondió a tiempo.' }

const SEIS: [string, unknown][] = [
  ['CARGANDO', { estado: 'CARGANDO' }],
  ['DISPONIBLE', DISPONIBLE],
  ['DEGRADADO', DEGRADADO],
  ['BLOQUEADO', BLOQUEADO],
  ['SIN_PERMISO', SIN_PERMISO],
  ['ERROR', ERROR],
]

describe('F2.6 · el gobierno sigue visible en los seis estados', () => {
  it.each(SEIS)('en %s el título del panel sigue en pantalla', async (_, payload) => {
    conUnPanel(payload)
    montar()
    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent('Venta diaria')
  })

  it.each(SEIS)('en %s la BASE sigue declarando denominador y ventana', async (_, payload) => {
    conUnPanel(payload)
    montar()
    const base = await screen.findByText(/^Base ·/)
    expect(base).toHaveTextContent('48 tiendas sobre 52')
    expect(base).toHaveTextContent('Últimos 30 días')
  })

  it.each(SEIS)('en %s la procedencia sigue declarando capa y fuente', async (_, payload) => {
    conUnPanel(payload)
    const { container } = montar()
    await screen.findByRole('heading', { level: 2 })
    expect(container.textContent).toContain('GOLD')
    expect(container.textContent).toContain('Snowflake')
  })

  it('la BASE de un BLOQUEADO sale del catálogo · el payload no la trae', async () => {
    // La aserción que hace a esta prueba distinta de las de arriba: se comprueba
    // que el payload NO declara base, capa ni fuente. Si alguien se los agregara
    // al fixture, las tres pruebas seguirían verdes sin verificar D6.
    expect(BLOQUEADO).not.toHaveProperty('base')
    expect(BLOQUEADO).not.toHaveProperty('capa')

    conUnPanel(BLOQUEADO)
    montar()
    expect(await screen.findByText(/^Base ·/)).toHaveTextContent('48 tiendas sobre 52')
  })
})

describe('F2.5 · la frescura es relativa a cuándo se materializó', () => {
  it('«HACE 3 H» sale de `frescura`, no de cuándo se abrió la página', async () => {
    // La marca se calcula RELATIVA al momento de la prueba, no fija: con una
    // fecha quemada esta prueba diría «HACE 8000 H» el año que viene y habría
    // que tocarla. Lo que se verifica es la distancia, que es lo que la regla
    // fija.
    const haceTresHoras = new Date(Date.now() - 3 * 3_600_000).toISOString()
    conUnPanel({ ...DISPONIBLE, frescura: haceTresHoras })
    const { container } = montar()
    await screen.findByText('USD 4.28M')
    expect(container.textContent).toContain('HACE 3 H')
  })

  it('una frescura de hace minutos dice RECIÉN y no «HACE 0 H»', async () => {
    conUnPanel({ ...DISPONIBLE, frescura: new Date(Date.now() - 120_000).toISOString() })
    const { container } = montar()
    await screen.findByText('USD 4.28M')
    expect(container.textContent).toContain('RECIÉN')
  })
})

describe('F2.1 · DEGRADADO muestra la cifra, y la limitación al lado', () => {
  it('el número está · un degradado no es un panel sin dato', async () => {
    conUnPanel(DEGRADADO)
    montar()
    expect(await screen.findByText('USD 4.28M')).toBeInTheDocument()
  })

  it('el badge lo pinta el shell · el front no decide que está degradado', async () => {
    conUnPanel(DEGRADADO)
    const { container } = montar()
    await screen.findByText('USD 4.28M')
    expect(container.textContent).toContain('Degradado')

    // Y con el mismo valor pero estado DISPONIBLE no aparece: el badge sale del
    // `estado` del backend y de nada más.
    conUnPanel(DISPONIBLE)
    const otro = montar()
    await otro.findByText('USD 4.28M')
    expect(otro.container.textContent).not.toContain('Degradado')
  })
})

describe('F2.2 · BLOQUEADO · sin cifra y sin aproximación', () => {
  it('no hay número en pantalla, ni siquiera aproximado', async () => {
    conUnPanel(BLOQUEADO)
    const { container } = montar()
    await screen.findByText(/Falta identificador de persona/)

    // Ningún grupo de dígitos con separador ni ninguna cifra con unidad: es la
    // forma de detectar que se coló un valor, sin depender del formateo exacto.
    expect(container.textContent).not.toMatch(/USD\s|\d[.,]\d{2}[MK]|\d{1,3}(,\d{3})+/)
  })

  it('declara razón y qué lo desbloquea · §8', async () => {
    conUnPanel(BLOQUEADO)
    montar()
    expect(await screen.findByText(/Falta identificador de persona/)).toBeInTheDocument()
    expect(screen.getByText(/Feed transaccional con identidad estable/)).toBeInTheDocument()
  })
})

describe('F2.3 · SIN_PERMISO · a quién pedirle acceso', () => {
  it('nombra el rol que decide, que es lo único accionable que tiene', async () => {
    conUnPanel(SIN_PERMISO)
    montar()
    // Se espera al CUERPO y no al encabezado: el shell ya está pintado durante
    // `CARGANDO`, así que esperar el `h2` deja la aserción corriendo antes de
    // que el batch conteste. Costó una prueba en rojo descubrirlo.
    expect(await screen.findByText(/Quién lo decide · CMO/)).toBeInTheDocument()
  })

  it('NO ofrece el botón de solicitar acceso · todavía no está cableado', async () => {
    // Documenta el estado real, y es correcto por la regla del CTA muerto: la
    // consola no pasa `onRequestAccess`, así que el botón no se pinta. F2.3 no
    // está cerrada hasta que el CTA vaya contra `/config/solicitudes` — y la
    // solicitud tiene que salir del servidor, no de estado local: con estado
    // local, recargar borra el pedido y la consola vuelve a ofrecerlo.
    conUnPanel(SIN_PERMISO)
    montar()
    await screen.findByText(/Quién lo decide · CMO/)
    expect(screen.queryByRole('button', { name: /solicitar acceso/i })).toBeNull()
  })
})

describe('F2.4 · ERROR · el mensaje es del backend y el reintento es de ESE panel', () => {
  it('se muestra el del servidor y no uno inventado por el front', async () => {
    conUnPanel(ERROR)
    montar()
    expect(await screen.findByText(/El almacén no respondió a tiempo/)).toBeInTheDocument()
  })

  it('el reintento pide UN panel, no el batch entero', async () => {
    // Dos paneles: uno falló y el otro cargó bien. Es el escenario donde el
    // defecto se ve — con un solo panel, «re-pedir el batch» y «re-pedir ese
    // panel» son la misma llamada y la prueba no distingue nada.
    const otro = { ...kpiPanel, id: 'p-2', colStart: 5 }
    const pedidos: string[][] = []

    server.use(
      http.get(`${API}/config/catalog`, () => ok({ metrics: [kpiMetric] })),
      http.get(`${API}/config/tabs/:tabId`, () =>
        ok({ ...context.tabs[0], panels: [kpiPanel, otro] }),
      ),
      http.post(`${API}/config/panels:batch`, async ({ request }) => {
        const body = (await request.json()) as { panelIds: string[] }
        pedidos.push(body.panelIds)
        // El segundo viaje trae el panel ya resuelto: así se comprueba que el
        // resultado se funde en la caché y no que la pantalla no cambió.
        const roto = pedidos.length === 1 ? ERROR : DISPONIBLE
        return ok({ [kpiPanel.id]: roto, [otro.id]: DISPONIBLE })
      }),
    )

    montar()
    const boton = await screen.findByRole('button', { name: /reintentar/i })
    expect(pedidos).toEqual([[kpiPanel.id, otro.id]])

    await userEvent.click(boton)

    // La aserción que importa: el segundo viaje lleva UN id, y es el del panel
    // que falló. Con `batch.refetch()` acá llegaban los dos.
    await waitFor(() => expect(pedidos).toHaveLength(2))
    expect(pedidos[1]).toEqual([kpiPanel.id])

    // Y disparó de verdad: el panel dejó de estar en error. Verificar que el
    // botón EXISTE no prueba nada —un botón muerto se ve igual—, así que la
    // prueba es que el estado cambió.
    await waitFor(() =>
      expect(screen.queryByText(/El almacén no respondió a tiempo/)).toBeNull(),
    )
  })
})

describe('§7 · cambiar de período NO vuelve a pedir el layout', () => {
  it('el layout se pide una vez y el batch dos', async () => {
    // La garantía está implementada —`keys.tab` no lleva el período— y estaba
    // escrita en un comentario de `hooks.ts`. La auditoría de F5.10 del
    // 2026-09-04 encontró que **ninguna prueba la sostenía**: se cumplía por
    // accidente de quien la escribió, que es como se pierde una garantía en la
    // siguiente refactorización.
    //
    // Es una de las trece casillas de §17: «cambiar período no re-fetch
    // layout».
    const layouts: string[] = []
    const batches: string[] = []

    server.use(
      http.get(`${API}/config/me`, () =>
        ok({
          ...context,
          periodos: [
            { id: '2026-07', etiqueta: 'JUL 2026', grano: 'mes' },
            { id: '2026-06', etiqueta: 'JUN 2026', grano: 'mes' },
          ],
        }),
      ),
      http.get(`${API}/config/catalog`, () => ok({ metrics: [kpiMetric] })),
      http.get(`${API}/config/tabs/:tabId`, ({ params }) => {
        layouts.push(String(params['tabId']))
        return ok({ ...context.tabs[0], panels: [kpiPanel] })
      }),
      http.post(`${API}/config/panels:batch`, async ({ request }) => {
        const body = (await request.json()) as { periodo: string }
        batches.push(body.periodo)
        return ok({ [kpiPanel.id]: DISPONIBLE })
      }),
    )

    montar()
    await screen.findByText('USD 4.28M')
    expect(layouts).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'JUN 2026' }))

    // El batch SÍ se vuelve a pedir —los datos dependen del período— y el
    // layout NO: la composición de la pestaña es la misma en junio y en julio.
    await waitFor(() => expect(batches).toEqual(['2026-07', '2026-06']))
    expect(layouts).toHaveLength(1)
  })
})
