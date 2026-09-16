// @vitest-environment jsdom

/** La consola de punta a punta, contra HTTP mockeado · F1.6, F1.26.
 *
 *  **Contra MSW y no contra fixtures importados.** Importar un fixture desde una
 *  superficie acopla la UI a datos falsos y el acoplamiento sobrevive al deploy
 *  — es el anti-patrón que declara §4. Acá el contenedor hace los mismos fetch
 *  que en producción; lo único distinto es quién responde.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, context, fail, kpiMetric, kpiPanel, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

function montar() {
  // Sin reintentos: con ellos, una prueba de error espera tres viajes y falla
  // por timeout en vez de por lo que verifica.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      {/* En un router: desde el 2026-09-16 el Topbar monta `UserMenu`, que
          navega a las otras superficies. */}
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function conUnPanel(payload: unknown) {
  server.use(
    http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
    http.get(`${API}/config/tabs/:tabId`, () =>
      ok({ tab: context.tabs[0], panels: [kpiPanel] }),
    ),
    http.post(`${API}/config/panels:batch`, () => ok({ [kpiPanel.id]: payload })),
  )
}

describe('la pantalla no está escrita · sale del layout', () => {
  it('dibuja el panel que devolvió /config/tabs con la cifra del batch', async () => {
    conUnPanel({
      status: 'AVAILABLE',
      value: { shape: 'scalar', v: 4280000 },
      governance: {
        base: '48 tiendas sobre 52',
        layer: 'GOLD',
        source: 'Snowflake',
        freshness: '2026-09-02T08:00:00Z',
        catalog_version: 1,
      },
    })

    montar()

    // El shell, con la anatomía obligatoria.
    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent('Venta diaria')
    // Y el cuerpo, que llega por un chunk diferido.
    expect(await screen.findByText('USD 4.28M')).toBeInTheDocument()
  })

  it('la pregunta operativa de la pestaña ES el título de la pantalla', async () => {
    conUnPanel({ estado: 'CARGANDO' })
    montar()
    // Por texto y no por `role`+`level`: el mensaje de carga de la superficie
    // también es un `h1`, así que buscar el primer encabezado de nivel 1
    // engancha ese y pasa antes de que lleguen los datos.
    const titulo = await screen.findByText('¿Tenemos stock y lo estamos mostrando?')
    expect(titulo.tagName).toBe('H1')
  })
})

describe('F1.26 · la carga y el error viven en la superficie', () => {
  it('un fallo de /config/me deja la pantalla diciéndolo, no en blanco', async () => {
    server.use(http.get(`${API}/config/me`, () => fail('Token vencido.', { status: 401 })))
    montar()

    expect(await screen.findByText(/No se pudo cargar tu contexto/)).toBeInTheDocument()
    expect(screen.getByText('Token vencido.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('un fallo del BATCH no tira la pantalla · los shells siguen con su estado', async () => {
    // Es la diferencia que F1.26 pide: contexto y catálogo son la pantalla; el
    // batch son los datos de cada panel, y un panel roto no rompe los otros.
    server.use(
      http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
      http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: context.tabs[0], panels: [kpiPanel] })),
      http.post(`${API}/config/panels:batch`, () =>
        fail('No se pudieron traer los datos.', { status: 500 }),
      ),
    )
    montar()

    // El shell sigue en pie con su título y su BASE.
    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent('Venta diaria')
    expect(screen.getByText(/^Base ·/)).toHaveTextContent('48 tiendas sobre 52')
    // Y el cuerpo es el estado de error, con reintento POR PANEL.
    expect(await screen.findByText('No se pudieron traer los datos.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar este panel/i })).toBeInTheDocument()
  })
})

describe('un metricId que el catálogo no resuelve', () => {
  it('lo dice con el identificador, sin fallback silencioso', async () => {
    // El catálogo llega ya filtrado por rol, así que una métrica ausente
    // significa que el layout referencia algo que este rol no puede ver.
    server.use(
      http.get(`${API}/config/tabs/:tabId`, () =>
        ok({ tab: context.tabs[0], panels: [{ ...kpiPanel, metric_id: 'm-fantasma' }] }),
      ),
    )
    montar()
    expect(await screen.findByText(/Métrica no resuelta/)).toBeInTheDocument()
    expect(screen.getByText(/m-fantasma/)).toBeInTheDocument()
  })
})

describe('el selector de período respeta el granoMinimo · F1.7', () => {
  it('con una métrica mensual, un período semanal queda deshabilitado y con razón', async () => {
    server.use(
      http.get(`${API}/config/me`, () =>
        ok({
          ...context,
          // Cadenas sueltas: el grano lo deduce el adaptador de la forma del
          // id, que es lo que el contrato sanciona cuando no llega.
          periods: ['2026-07', '2026-W32'],
        }),
      ),
      http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
      http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: context.tabs[0], panels: [kpiPanel] })),
      http.post(`${API}/config/panels:batch`, () => ok({ [kpiPanel.id]: { estado: 'CARGANDO' } })),
    )
    montar()

    // Ofrecer un período que la métrica no puede contestar es el mismo problema
    // que un panel sin BASE: promete algo que no puede cumplir.
    await waitFor(() => expect(screen.getByRole('button', { name: '2026-W32' })).toBeDisabled())
    expect(screen.getByRole('button', { name: '2026-07' })).toBeEnabled()
    expect(screen.getByText(/No aplica · alguna métrica se mide por mes/)).toBeInTheDocument()
  })
})

describe('F1.29 · un param inválido degrada el panel con la razón visible', () => {
  it('no se ignora, no se reemplaza por el default, y el shell queda en pie', async () => {
    // Antes: el cuerpo aplicaba `desc` y el panel se veía correcto mostrando
    // exactamente lo contrario de lo que el tenant configuró.
    server.use(
      http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
      // Arreglo desnudo, y con la forma del cable **en los dos campos**.
      //
      // Hasta F1.41 este fixture tenía `layout_params` en español, con la deuda
      // escrita al lado: no era fiel al cable. Ahora sí lo es — `order` y `cap`,
      // como los manda el servicio— y el adaptador los traduce.
      http.get(`${API}/config/blocks`, () =>
        ok([
          {
            type: 'bars',
            ui_name: 'Barras',
            accepted_shapes: ['categorical'],
            col_span_min: 4,
            col_span_max: 8,
            row_span_min: 4,
            row_span_max: 5,
            layout_params: ['order', 'cap'],
          },
        ]),
      ),
      http.get(`${API}/config/tabs/:tabId`, () =>
        ok({ tab: context.tabs[0], panels: [{ ...kpiPanel, type: 'bars', options: { order: 'ascending' } }],
        }),
      ),
      http.post(`${API}/config/panels:batch`, () =>
        ok({
          [kpiPanel.id]: {
            status: 'AVAILABLE',
            value: { shape: 'categorical', items: [{ label: 'A', v: 1 }] },
            governance: {
              base: '48 tiendas sobre 52',
              layer: 'GOLD',
              source: 'Snowflake',
              freshness: '2026-09-02T08:00:00Z',
              catalog_version: 1,
            },
          },
        }),
      ),
    )
    montar()

    // La razón nombra el param, el valor que llegó y los admitidos.
    const razon = await screen.findByText(/La composición de este panel no es válida/)
    expect(razon).toHaveTextContent('"ascending"')
    expect(razon).toHaveTextContent('«asc»')

    // Y §5.2 se sostiene: el estado reemplaza el cuerpo, nunca el shell.
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Venta diaria')
    expect(screen.getByText(/^Base ·/)).toBeInTheDocument()
    expect(screen.getByText(/Corregir las opciones del panel/)).toBeInTheDocument()
  })

  it('un param desconocido se descarta y el panel dibuja igual', async () => {
    // Un param de más es ruido de configuración, no un panel que no se puede
    // componer: se descarta y se avisa en desarrollo.
    server.use(
      http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
      http.get(`${API}/config/tabs/:tabId`, () =>
        ok({ tab: context.tabs[0], panels: [{ ...kpiPanel, options: { colorcito: 'azul' } }] }),
      ),
      http.post(`${API}/config/panels:batch`, () =>
        ok({
          [kpiPanel.id]: {
            status: 'AVAILABLE',
            value: { shape: 'scalar', v: 4280000 },
            governance: {
              base: '48 tiendas sobre 52',
              layer: 'GOLD',
              source: 'Snowflake',
              freshness: '2026-09-02T08:00:00Z',
              catalog_version: 1,
            },
          },
        }),
      ),
    )
    montar()

    expect(await screen.findByText('USD 4.28M')).toBeInTheDocument()
    expect(screen.queryByText(/no es válida/)).toBeNull()
  })
})

describe('la cadena de callbacks llega hasta el botón', () => {
  it('el reintento del panel vuelve a pedir el batch', async () => {
    // Cuatro saltos: Console → PanelInGrid → Panel → ErrorState. Cada uno pasa
    // el callback con `{...(x === undefined ? {} : { x })}`, que apaga el
    // chequeo de propiedades en exceso: una prop mal nombrada en cualquiera de
    // los cuatro compila y deja el botón muerto. Ya pasó tres veces.
    let intentos = 0
    server.use(
      http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
      http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: context.tabs[0], panels: [kpiPanel] })),
      http.post(`${API}/config/panels:batch`, () => {
        intentos++
        return fail('No se pudieron traer los datos.', { status: 500 })
      }),
    )
    montar()

    const boton = await screen.findByRole('button', { name: /reintentar este panel/i })
    expect(intentos).toBe(1)

    await userEvent.click(boton)
    await waitFor(() => expect(intentos).toBe(2))
  })
})

describe('F1.35 · una métrica que el adaptador rechaza dice POR QUÉ', () => {
  // El modo de silencio que esto cierra: una `family` fuera del enumerado
  // produce `var(--color-fam-vendors-1)`, un token que no existe, y la serie se
  // pinta SIN COLOR sin que nada falle. Igual que `text-labell`.
  //
  // El adaptador ya la separaba desde F1.33; lo que faltaba era que la razón
  // llegara a la pantalla en vez de quedarse en un arreglo que nadie leía.

  it('la pantalla nombra el valor que llegó, no «no resuelta» a secas', async () => {
    server.use(
      http.get(`${API}/config/catalog`, () => ok([{ ...kpiMetric, family: 'vendors' }])),
      http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: context.tabs[0], panels: [kpiPanel] })),
    )
    montar()

    // Dice qué métrica y qué valor: sin eso hay que ir a buscar a la base.
    const aviso = await screen.findByText(/Métrica no dibujable/)
    expect(aviso).toHaveTextContent('ventas_dia')
    expect(aviso).toHaveTextContent('vendors')
  })

  it('una sola métrica rota NO vacía la pestaña', async () => {
    // Fallo parcial, igual que en el batch: lo que se puede dibujar se dibuja.
    const otra = { ...kpiMetric, id: 'm-ok', key: 'ok' }
    server.use(
      http.get(`${API}/config/catalog`, () =>
        ok([{ ...kpiMetric, family: 'vendors' }, otra]),
      ),
      http.get(`${API}/config/tabs/:tabId`, () =>
        ok({
          tab: context.tabs[0],
          panels: [kpiPanel, { ...kpiPanel, id: 'p-2', metric_id: 'm-ok', col_start: 5 }],
        }),
      ),
      http.post(`${API}/config/panels:batch`, () =>
        ok({
          'p-2': {
            status: 'AVAILABLE',
            value: { shape: 'scalar', v: 4280000 },
            governance: {
              base: '48 tiendas sobre 52', layer: 'GOLD', source: 'Snowflake',
              freshness: '2026-09-02T08:00:00Z', catalog_version: 1,
            },
          },
        }),
      ),
    )
    montar()

    expect(await screen.findByText(/Métrica no dibujable/)).toBeInTheDocument()
    expect(await screen.findByText('USD 4.28M')).toBeInTheDocument()
  })

  it('una métrica ausente sigue diciendo «no resuelta» · son cosas distintas', async () => {
    // No rechazada: simplemente no está. La causa probable es otra —el layout
    // referencia algo que este rol no ve— y confundirlas manda a buscar mal.
    server.use(
      http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
      http.get(`${API}/config/tabs/:tabId`, () =>
        ok({ tab: context.tabs[0], panels: [{ ...kpiPanel, metric_id: 'm-fantasma' }] }),
      ),
    )
    montar()
    expect(await screen.findByText(/Métrica no resuelta/)).toBeInTheDocument()
  })
})
