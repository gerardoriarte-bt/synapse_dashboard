// @vitest-environment jsdom

/** F5.1 · selector de dashboard cuando hay más de uno
 *
 *  Un tenant puede tener varios dashboards —«Overview», «Marca»—. Llegaron con
 *  `168a761` y estuvieron cuatro días sin transcribirse; lo encontró reverificar
 *  el cable ruta por ruta.
 *
 *  ── LO QUE SE MIDIÓ PARA PODER ESCRIBIR ESTO ───────────────────────────────
 *
 *  El tenant local tenía **un** dashboard, así que nada de esto se podía
 *  verificar. Se creó el segundo con `POST /admin/tenants/{tenantId}/dashboards`
 *  —el 2026-09-26— en vez de esperar, igual que el usuario restringido de B1.19.
 *
 *  **Y ahí apareció lo que ninguna prueba habría encontrado**: un dashboard sin
 *  layout publicado devuelve `active_layout_id: null` **y `tabs: null`**, y el
 *  adaptador tiraba. La consola decía «No se pudo cargar tu contexto · sin
 *  detalle del servidor» — atribuyéndole al servicio un fallo nuestro.
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
import type { WireContext, WirePayload } from '@/api/adapt'

const governance = {
  base: '48 tiendas sobre 52',
  layer: 'GOLD',
  source: 'Snowflake',
  freshness: '2026-09-02T08:00:00Z',
  catalog_version: 1,
  measurement_window: '',
}

const payload: WirePayload = {
  status: 'AVAILABLE',
  value: { shape: 'scalar', v: 10 },
  governance,
} as WirePayload

const DOS = [
  { id: 'd-1', name: 'Overview', slug: 'overview', is_default: true },
  { id: 'd-2', name: 'Marca', slug: 'marca', is_default: false },
]

/** Monta la consola con el contexto que se le pase, y recoge **los cuerpos de
 *  los PUT**: cambiar de dashboard es escribir una preferencia, así que lo
 *  único que prueba que la cadena llegó entera es lo que sale por la red. */
function laConsola(ctx: WireContext): { puts: Record<string, unknown>[] } {
  const puts: Record<string, unknown>[] = []
  server.use(
    http.get(`${API}/config/me`, () => ok(ctx)),
    http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab, panels: [kpiPanel] })),
    http.post(`${API}/config/panels:batch`, () => ok({ [kpiPanel.id]: payload })),
    http.put(`${API}/config/me/preferences`, async ({ request }) => {
      const cuerpo = (await request.json()) as Record<string, unknown>
      puts.push(cuerpo)
      return ok(cuerpo)
    }),
  )
  return { puts }
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

/** Abre el panel · §PEN:C6. **Era un `<select>` hasta el 2026-09-28** y ahora es
 *  un panel que cuelga del chevron del bloque de cliente, porque «de ocho
 *  elementos a 768 el navbar no entra». Lo que se afirma abajo no cambió: lo que
 *  cambió es cómo se llega. */
const abrir = async () =>
  userEvent.click(await screen.findByRole('button', { name: 'Cambiar de dashboard' }))

describe('con UNO solo no hay selector', () => {
  it('no se ofrece una elección que no existe', async () => {
    // Es el primer bullet del criterio, y la misma regla que el selector de
    // tenant: existe sólo cuando hay algo que elegir.
    laConsola(context)
    montar()
    await screen.findByRole('heading', { level: 2 })

    expect(screen.queryByRole('button', { name: 'Cambiar de dashboard' })).toBeNull()
  })
})

describe('con DOS aparece, y cambiarlo escribe la preferencia', () => {
  const conDos: WireContext = { ...context, dashboards: DOS }

  it('lista los dos y marca el activo', async () => {
    laConsola(conDos)
    montar()
    await abrir()

    // **El activo se marca con `aria-current`**, no sólo con el punto naranja:
    // el punto va `aria-hidden` porque el color no puede ser el único portador.
    expect(screen.getByRole('button', { name: /Overview/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /Marca/ })).not.toHaveAttribute('aria-current')
  })

  it('el clic AFUERA también cierra · es la otra salida de un desplegable', async () => {
    // La nota lo dice: «correcto para un control del que se puede salir haciendo
    // clic afuera». Y se escucha `mousedown` y no `click`, porque con `click` el
    // botón que abrió recibe el evento después y lo vuelve a abrir — un panel
    // que no cierra nunca se ve como un panel que parpadea.
    laConsola(conDos)
    montar()
    await abrir()
    expect(screen.getByRole('button', { name: /Marca/ })).toBeVisible()

    await userEvent.click(await screen.findByRole('heading', { level: 2 }))
    expect(screen.queryByRole('button', { name: /Marca/ })).toBeNull()
  })

  it('volver a apretar el chevron lo CIERRA · el caso que obliga a `mousedown`', async () => {
    // **El defecto que esto previene.** Con `click` en vez de `mousedown`, el
    // listener del documento corre DESPUÉS del `onClick` de React: el botón
    // alterna a cerrado y el documento vuelve a cerrarlo — o peor, el orden se
    // invierte y el panel se reabre solo. Se ve como un panel que parpadea y no
    // como un error.
    laConsola(conDos)
    montar()
    const chevron = await screen.findByRole('button', { name: 'Cambiar de dashboard' })
    await userEvent.click(chevron)
    expect(screen.getByRole('button', { name: /Marca/ })).toBeVisible()

    await userEvent.click(chevron)
    expect(screen.queryByRole('button', { name: /Marca/ })).toBeNull()
  })

  it('elegir CIERRA el panel · no se queda abierto sobre el dashboard nuevo', async () => {
    laConsola(conDos)
    montar()
    await abrir()
    await userEvent.click(screen.getByRole('button', { name: /Marca/ }))

    expect(screen.queryByRole('button', { name: /Overview/ })).toBeNull()
  })

  it('el punto naranja NO es el único portador · regla dura 3', async () => {
    // «El color no carga el juicio»: quien no distingue el naranja tiene que
    // poder saber cuál está activo. Por eso el punto va `aria-hidden` y lo dice
    // `aria-current` — si el punto se anunciara, sería ruido duplicado; si fuera
    // lo único, no habría forma de saberlo sin verlo.
    laConsola(conDos)
    const { container } = montar()
    await abrir()

    const punto = container.querySelector('.bg-acc')
    expect(punto).not.toBeNull()
    expect(punto).toHaveAttribute('aria-hidden')
  })

  it('el panel se cierra con Escape · es un desplegable, no una hoja', async () => {
    // La nota del dibujo lo decide: «un velo dice MODAL, que es lo que una hoja
    // es y un desplegable no». Sin velo, la salida es Escape o clic afuera.
    laConsola(conDos)
    montar()
    await abrir()
    expect(screen.getByRole('button', { name: /Marca/ })).toBeVisible()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: /Marca/ })).toBeNull()
  })

  it('cambiarlo manda `preferred_dashboard_id` · NO es un parámetro de consulta', async () => {
    // **El servicio resuelve el dashboard activo con preferencia > rol >
    // default**, así que la única forma de cambiarlo es escribir la preferencia.
    // Un `?dashboardId=` no existe, y creerlo habría dado un selector que no
    // cambia nada.
    const { puts } = laConsola(conDos)
    montar()

    await abrir()
    await userEvent.click(screen.getByRole('button', { name: /Marca/ }))

    await waitFor(() => expect(puts).toHaveLength(1))
    expect(puts[0]).toMatchObject({ preferred_dashboard_id: 'd-2' })
  })

  it('el `theme` viaja con él · el cuerpo lo declara requerido', async () => {
    // Medido el 2026-09-26: mandar sólo el dashboard da 400. Y sale del tema
    // del usuario, no de uno fijo — escribir uno acá pisaría el suyo.
    const { puts } = laConsola(conDos)
    montar()

    await abrir()
    await userEvent.click(screen.getByRole('button', { name: /Marca/ }))

    await waitFor(() => expect(puts).toHaveLength(1))
    expect(puts[0]).toHaveProperty('theme')
  })

  it('cambiar de dashboard REINICIA la pestaña activa', async () => {
    // Segundo bullet del criterio, con su razón: «la pestaña de un layout no
    // existe en el otro».
    //
    // **La primera versión de esta prueba no probaba nada**: afirmaba que se
    // volvía a pedir `/config/tabs`, y con una sola pestaña en el fixture el id
    // era el mismo, así que react-query servía del cache y el conteo no se
    // movía. Se necesita una SEGUNDA pestaña y elegirla: lo que se reinicia es
    // la elección del usuario, no la petición.
    const { puts } = laConsola({
      ...conDos,
      tabs: [
        tab,
        { ...tab, id: 'tab-2', name: 'Medios', operational_question: '¿Rinde?', sort_order: 2 },
      ],
    })
    montar()

    await userEvent.click(await screen.findByRole('button', { name: 'Medios' }))
    expect(screen.getByRole('button', { name: 'Medios' })).toHaveAttribute('aria-current', 'page')

    await abrir()
    await userEvent.click(screen.getByRole('button', { name: /Marca/ }))
    await waitFor(() => expect(puts).toHaveLength(1))

    // Vuelve a la primera, que es la que el contexto nuevo trae de default.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: tab.name })).toHaveAttribute('aria-current', 'page'),
    )
    expect(screen.getByRole('button', { name: 'Medios' })).not.toHaveAttribute('aria-current')
  })
})

describe('un dashboard SIN componer no es un error', () => {
  it('lo dice con su nombre, y no se cae', async () => {
    // **Es el estado normal de uno recién creado**, medido: `active_layout_id`
    // y `tabs` vienen los dos en `null`. Antes de F5.1 el adaptador tiraba acá.
    laConsola({
      ...context,
      dashboards: DOS,
      active_dashboard_id: 'd-2',
      active_layout_id: null,
      tabs: null,
    })
    montar()

    expect(await screen.findByText(/«Marca» todavía no se compuso/)).toBeVisible()
    expect(screen.getByText(/se compone en el builder/)).toBeVisible()
  })

  // ── UN VACÍO SIN SALIDA ENCIERRA · visto abriéndolo ───────────────────────
  //
  // El estado reemplaza la pantalla ENTERA, navbar incluido, así que quien
  // cambia a un dashboard sin componer **se queda sin selector para volver**.
  // No lo dijo ninguna prueba: se vio en el navegador. Mismo precedente que B5
  // el 2026-09-25 — «su vacío lleva salida propia».
  it('ofrece volver al dashboard por defecto', async () => {
    const { puts } = laConsola({
      ...context,
      dashboards: DOS,
      active_dashboard_id: 'd-2',
      active_layout_id: null,
      tabs: null,
    })
    montar()

    await userEvent.click(await screen.findByRole('button', { name: 'Volver a Overview' }))

    await waitFor(() => expect(puts).toHaveLength(1))
    expect(puts[0]).toMatchObject({ preferred_dashboard_id: 'd-1' })
  })

  it('y NO la ofrece si el vacío YA es el default · un botón que no hace nada', async () => {
    laConsola({ ...context, active_layout_id: null, tabs: null })
    montar()
    await screen.findByText(/todavía no/)

    expect(screen.queryByRole('button', { name: /Volver a/ })).toBeNull()
  })

  it('NO lo reporta como fallo del servidor', async () => {
    // La mitad que más importa: el mensaje viejo era «No se pudo cargar tu
    // contexto · Sin detalle del servidor», y el fallo era del adaptador. Un
    // error nuestro atribuido al servicio manda a buscar el problema al lugar
    // equivocado — es la familia del 401 del chat.
    laConsola({ ...context, active_layout_id: null, tabs: null })
    const { container } = montar()
    await screen.findByText(/todavía no/)

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('No se pudo cargar tu contexto')
    expect(texto).not.toContain('Sin detalle del servidor')
  })
})
