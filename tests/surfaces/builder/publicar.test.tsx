// @vitest-environment jsdom

/** Validar y publicar · F4.14 y F4.15
 *
 *  **Dos trampas del servicio, y las dos se prueban acá.**
 *
 *  `POST /validate` responde **200 aunque la composición sea inválida**: el 200
 *  dice que la validación corrió, no que el layout esté bien. Y `POST /publish`
 *  rechaza con **422** si hay paneles inválidos, que es información y no un fallo
 *  del sistema.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]
const borrador = { id: 'l-2', tenant_id: 't-1', status: 'draft', version_id: 'v4', published_at: null }

const detalle = {
  layout: borrador,
  tabs: [
    {
      tab: {
        id: 'tab-a', layout_version_id: 'l-2', name: 'Resumen',
        operational_question: '¿Cómo vamos?', sort_order: 1, role_ids: [],
      },
      panels: [
        { id: 'p-1', tab_id: 'tab-a', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4 },
      ],
    },
  ],
}

const metricas = [
  {
    id: 'm-1', tenant_id: 't-1', key: 'revenue', name: 'Ventas',
    shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
]
const bloques = [
  {
    type: 'kpi', ui_name: 'KPI', accepted_shapes: ['scalar'],
    col_span_min: 3, col_span_max: 4, row_span_min: 3, row_span_max: 4, layout_params: [],
  },
]

function base(extra: Parameters<typeof server.use> = []) {
  // **Los overrides van PRIMERO.** `server.use` antepone los handlers y, entre
  // los de una misma llamada, gana el primero. Con `...extra` al final, un
  // override de una ruta que la base ya declara **nunca se aplica** — y la
  // prueba pasa por el motivo equivocado. Lo encontró una mutación que
  // sobrevivía: el override estaba escrito y no corría.
  server.use(
    ...extra,
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/config/blocks`, () => ok(bloques)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([borrador])),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.put(`${API}/admin/layouts/:id`, () => ok(detalle)),
  )
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      {/* **En un router, porque el contenedor navega.** Desde el 2026-09-16
          `Admin`/`Builder` ofrecen «volver a la consola» y eso es `useNavigate`,
          que fuera de un router lanza. Montarlos sin él probaba una app que la
          real no es. */}
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function abrir() {
  // **Sin elegir la versión**: desde el 2026-10-06 se autoelige el primer
  // borrador · auditoría de ese día. Que la pestaña aparezca sin tocar nada es
  // parte de lo que se prueba.
  await screen.findByDisplayValue('Resumen')
}

/** El botón de validar vive en el chrome desde el 2026-10-06, al lado de
 *  guardar y publicar · §2.4 de `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`.
 *  Antes era «Validar en el servidor», a media página. */
const validarBtn = () => screen.getByRole('button', { name: 'Validar' })

describe('F4.14 · el servidor valida lo GUARDADO', () => {
  it('con cambios sin guardar, validar NO se ofrece y el chrome dice por qué', async () => {
    // Un «válido» sobre otra composición es peor que no validar.
    //
    // **Reemplaza a «se deshabilita y dice por qué»** · 2026-10-06: el botón
    // ya no se deshabilita, desaparece — un CTA sin manejador no se pinta — y
    // la razón la dice la ayuda del chrome en lugar de la barra del cuerpo.
    base()
    montar()
    await abrir()
    expect(validarBtn()).toBeInTheDocument()

    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    expect(screen.queryByRole('button', { name: 'Validar' })).toBeNull()
    expect(screen.getByText('Para publicar, guardá y validá.')).toBeInTheDocument()
  })

  it('«Validar» del chrome manda el POST /validate de la versión abierta', async () => {
    // **Que el callback DISPARE, no que el botón exista.** Son tres saltos
    // —`Builder` → `BuilderChrome` → `Accion`— y cada uno puede perder la prop.
    const llamadas: string[] = []
    base([
      http.post(`${API}/admin/layouts/:id/validate`, ({ params }) => {
        llamadas.push(String(params['id']))
        return ok({ valid: true, errors: [] })
      }),
    ])
    montar()
    await abrir()

    await userEvent.click(validarBtn())
    await waitFor(() => expect(llamadas).toEqual(['l-2']))
  })

  it('mientras valida dice «Validando…» y no se puede apretar', async () => {
    let soltar: () => void = () => {}
    const espera = new Promise<void>((r) => {
      soltar = r
    })
    base([
      http.post(`${API}/admin/layouts/:id/validate`, async () => {
        await espera
        return ok({ valid: true, errors: [] })
      }),
    ])
    montar()
    await abrir()

    await userEvent.click(validarBtn())
    expect(await screen.findByRole('button', { name: 'Validando…' })).toBeDisabled()
    soltar()
    expect(await screen.findByRole('button', { name: 'Publicar' })).toBeInTheDocument()
  })

  it('un 200 con `valido: false` NO autoriza a publicar', async () => {
    // **La trampa.** El 200 dice que la validación corrió. Leer el status sería
    // dar por bueno cualquier cosa.
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () =>
        ok({
          valid: false,
          errors: [
            { tab_id: 'tab-a', panel_id: 'p-1', field: 'type', message: 'un bloque kpi no dibuja una serie' },
          ],
        }),
      ),
    ])
    montar()
    await abrir()

    await userEvent.click(validarBtn())

    expect(
      await screen.findByText('El servidor encontró 1 problema. Hasta corregirlos no se publica.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    // Y el chrome, donde iría el botón, dice por qué no está.
    expect(screen.getByText('El servidor encontró problemas.')).toBeInTheDocument()
  })

  it('nombra la PESTAÑA del problema, no su UUID', async () => {
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () =>
        ok({
          valid: false,
          errors: [{ tab_id: 'tab-a', panel_id: 'p-1', field: 'type', message: 'no dibuja esa forma' }],
        }),
      ),
    ])
    const { container } = montar()
    await abrir()

    await userEvent.click(validarBtn())

    expect(await screen.findByText(/^Resumen · un panel · no dibuja esa forma$/)).toBeInTheDocument()
    expect(container.textContent).not.toContain('tab-a')
  })

  it('un `valido: true` sí autoriza', async () => {
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
    ])
    montar()
    await abrir()

    await userEvent.click(validarBtn())
    expect(await screen.findByText(/El servidor la dio por válida/)).toBeInTheDocument()
    expect(screen.getByText('Validación del servidor')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument(),
    )
    // Con el botón a la vista, la ayuda de por qué no se publica se va.
    expect(screen.queryByText(/^Para publicar/)).toBeNull()
  })
})

describe('F4.15 · publicar', () => {
  it('sin veredicto no se publica, y el chrome dice que falta validar', async () => {
    // **Reemplaza a «Sin validar · el servidor todavía no vio esta
    // composición»**, que vivía en la barra del cuerpo · 2026-10-06. La barra
    // ahora no se pinta sin veredicto, y el porqué va en el chrome, donde
    // estaría el botón.
    base()
    montar()
    await abrir()

    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    expect(screen.getByText('Para publicar, validá.')).toBeInTheDocument()
    expect(screen.queryByText('Validación del servidor')).toBeNull()
  })

  it('la ayuda de por qué no se publica sigue al estado', async () => {
    // Una sola frase en el lugar del botón, y tiene que decir lo que falta
    // AHORA: validar, guardar y validar, o corregir.
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () =>
        ok({
          valid: false,
          errors: [{ tab_id: 'tab-a', panel_id: 'p-1', field: 'type', message: 'no dibuja esa forma' }],
        }),
      ),
    ])
    montar()
    await abrir()

    expect(screen.getByText('Para publicar, validá.')).toBeInTheDocument()

    await userEvent.click(validarBtn())
    expect(await screen.findByText('El servidor encontró problemas.')).toBeInTheDocument()
    expect(screen.queryByText('Para publicar, validá.')).toBeNull()

    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    expect(screen.getByText('Para publicar, guardá y validá.')).toBeInTheDocument()
    expect(screen.queryByText('El servidor encontró problemas.')).toBeNull()
  })

  it('una versión publicada no ofrece validar ni explica por qué no se publica', async () => {
    const publicado = { ...borrador, status: 'published', published_at: '2026-09-10T12:00:00Z' }
    base([
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([publicado])),
      http.get(`${API}/admin/layouts/:id`, () => ok({ ...detalle, layout: publicado })),
    ])
    montar()
    await abrir()

    expect(screen.getByText(/está publicada y no se edita/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Validar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    expect(screen.queryByText(/^Para publicar/)).toBeNull()
    expect(screen.queryByText('El servidor encontró problemas.')).toBeNull()
  })

  it('EDITAR después de validar retira el permiso', async () => {
    // El veredicto era sobre lo que había. Sin esto, se validaría una
    // composición y se publicaría otra — que es literalmente lo que el criterio
    // de F4.11 y F4.15 prohíbe.
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
    ])
    montar()
    await abrir()

    await userEvent.click(validarBtn())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument(),
    )

    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    // Y el veredicto viejo deja de mostrarse: era sobre otra composición.
    expect(screen.queryByText(/El servidor la dio por válida/)).toBeNull()
    expect(screen.getByText('Para publicar, guardá y validá.')).toBeInTheDocument()
  })

  it('GUARDAR después de validar también lo retira', async () => {
    // Guardar limpia el borrador, así que `sucio` deja de alcanzar: el veredicto
    // anterior es sobre una composición que ya no está guardada.
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
    ])
    montar()
    await abrir()

    await userEvent.click(validarBtn())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument(),
    )

    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(screen.queryByText(/con cambios sin guardar/)).toBeNull())
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    // **Reemplaza «todavía no vio esta composición»** · 2026-10-06: ahora es
    // la ayuda del chrome, y la barra del veredicto desaparece.
    expect(screen.getByText('Para publicar, validá.')).toBeInTheDocument()
    expect(screen.queryByText('Validación del servidor')).toBeNull()
    expect(validarBtn()).toBeInTheDocument()
  })

  it('publica mandando el versionId', async () => {
    const cuerpos: unknown[] = []
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
      http.post(`${API}/admin/layouts/:id/publish`, async ({ request }) => {
        cuerpos.push(await request.json())
        return ok({ ...borrador, status: 'published', published_at: '2026-09-15T10:00:00Z' })
      }),
    ])
    montar()
    await abrir()

    await userEvent.click(validarBtn())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument(),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    await waitFor(() => expect(cuerpos).toEqual([{ version_id: 'v4' }]))
  })

  it('un 422 dice que hay paneles inválidos, no «error del sistema»', async () => {
    // B4.15: el servidor rechaza la publicación si hay paneles inválidos. Es
    // información, no un fallo.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
      http.post(
        `${API}/admin/layouts/:id/publish`,
        () =>
          new HttpResponse(JSON.stringify({ success: false, error: 'invalid panels' }), {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    ])
    montar()
    await abrir()

    await userEvent.click(validarBtn())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument(),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(
      await screen.findByText('El servidor rechazó la publicación: hay paneles inválidos'),
    ).toBeInTheDocument()
  })

  it('declara que publicar no despliega', async () => {
    // §7.2: es un cambio de dato, no un build. **Se dice cuando se puede
    // publicar** desde el 2026-10-06 —antes era una frase fija en la barra—,
    // que es cuando la duda aparece.
    base([
      http.post(`${API}/admin/layouts/:id/validate`, () => ok({ valid: true, errors: [] })),
    ])
    montar()
    await abrir()

    await userEvent.click(validarBtn())
    expect(
      await screen.findByText(
        'El servidor la dio por válida. Ya se puede publicar; publicar no despliega nada, cambia qué versión ve la consola.',
      ),
    ).toBeInTheDocument()
  })
})

describe('F4.11 · cada problema de composición lleva a su lugar', () => {
  // §2.5 de la auditoría del 2026-10-06: la lista nombraba «panel 3» y había
  // que contar chips para encontrarlo. Ahora cada problema tiene su salida.
  //
  // **El problema de panel está en la SEGUNDA pestaña** a propósito: así ir al
  // panel exige cambiar también la pestaña del lienzo, y no sólo la selección.
  const conProblemas = {
    layout: borrador,
    tabs: [
      detalle.tabs[0],
      {
        tab: {
          id: 'tab-b', layout_version_id: 'l-2', name: 'Marca',
          operational_question: '', sort_order: 2, role_ids: [],
        },
        panels: [
          { id: 'p-2', tab_id: 'tab-b', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4 },
          // Una métrica que salió del catálogo · el problema de panel.
          { id: 'p-3', tab_id: 'tab-b', metric_id: 'm-borrada', type: 'kpi', col_start: 4, col_span: 3, row_span: 4 },
        ],
      },
    ],
  }

  async function abrirResumen() {
    await userEvent.click(screen.getByText('2 problemas de composición'))
  }

  it('«Ir al panel» abre el lienzo en esa pestaña con el panel elegido', async () => {
    base([http.get(`${API}/admin/layouts/:id`, () => ok(conProblemas))])
    montar()
    await abrir()
    await abrirResumen()

    expect(screen.getByText('Marca · panel 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ir al panel' }))

    expect(screen.getByRole('button', { name: 'Canvas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('combobox', { name: 'Componiendo' })).toHaveValue('1')
    const inspector = screen.getByRole('complementary', { name: 'Configuración del panel' })
    expect(inspector).toBeInTheDocument()
    // El elegido es el del problema, no el primero de la pestaña.
    const lienzo = screen.getByLabelText('Lienzo de composición')
    const celdas = within(lienzo).getAllByRole('gridcell', { selected: true })
    expect(celdas).toHaveLength(1)
    // `—` es el nombre que el lienzo pone a una métrica que no está en el
    // catálogo: el panel del problema y no su vecino, `Indicador · Ventas`.
    // Con el nombre de producto y no el id, que es lo que lee un lector de
    // pantalla · D6 de la auditoría del 2026-10-06.
    expect(celdas[0]).toHaveAttribute('aria-label', 'Indicador · —')
  })

  it('«Ir a la pestaña» vuelve a contexto de edición', async () => {
    base([http.get(`${API}/admin/layouts/:id`, () => ok(conProblemas))])
    montar()
    await abrir()

    // Se arranca en el lienzo: el resumen se pinta en las dos pantallas, y
    // desde contexto «ir a contexto» no probaría nada.
    await userEvent.click(screen.getByRole('button', { name: 'Canvas' }))
    await abrirResumen()
    await userEvent.click(screen.getByRole('button', { name: 'Ir a la pestaña' }))

    expect(screen.getByRole('button', { name: 'Contexto de edición' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.queryByRole('complementary', { name: 'Configuración del panel' })).toBeNull()
    expect(screen.getByDisplayValue('Marca')).toBeInTheDocument()
  })
})
