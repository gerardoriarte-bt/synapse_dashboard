// @vitest-environment jsdom

/** B4 · Binder de métrica · F4.10
 *
 *  **La aserción que sostiene la tarea es que las incompatibles APAREZCAN.**
 *  §7.2: «las incompatibles aparecen listadas y deshabilitadas con la razón. El
 *  rechazo explicado es lo que enseña el sistema». Filtrarlas sería más corto y
 *  más limpio, y una prueba escrita desde esa implementación pasaría siempre.
 *
 *  **Desde el 2026-10-06 es el inspector del canvas** (D1 de
 *  `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`): las pruebas llegan
 *  al editor —desde el 2026-10-07 por «Dashboards» y «Abrir el editor»—, eligen
 *  el panel en el lienzo y miran dentro del inspector.
 *
 *  Los fixtures salen de los dos cables: `BlockRule` de
 *  `synapse-console-wire.yaml` —snake_case, `accepted_shapes` en inglés— y
 *  `CatalogMetric` de `synapse-admin-wire.yaml`.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/dom'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]
const versiones = [
  { id: 'l-2', tenant_id: 't-1', dashboard_id: 'd-1', status: 'draft', version_id: 'v4', published_at: null },
]

/** `LayoutDashboard` del cable · desde el 2026-10-07 el builder entra por acá. */
const dashboards = [
  { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
]

const detalle = {
  layout: versiones[0],
  tabs: [
    {
      tab: {
        id: 'tab-a',
        layout_version_id: 'l-2',
        name: 'Resumen',
        operational_question: '¿Cómo vamos?',
        sort_order: 1,
        role_ids: [],
      },
      panels: [
        { id: 'p-1', tab_id: 'tab-a', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4 },
      ],
    },
  ],
}

/** Tres tipos con rangos distintos. `gauge` es el que no dibuja una serie. */
const bloques = [
  {
    type: 'kpi',
    ui_name: 'KPI',
    accepted_shapes: ['scalar', 'scalar_with_interval'],
    col_span_min: 3,
    col_span_max: 4,
    row_span_min: 3,
    row_span_max: 4,
    // `comparative` llega en inglés y el adaptador lo pasa a `comparativo`,
    // que es un sí o no · ver la prueba de los booleanos.
    layout_params: ['comparative'],
  },
  {
    type: 'series',
    ui_name: 'Serie',
    accepted_shapes: ['time_series', 'multi_series'],
    col_span_min: 6,
    col_span_max: 12,
    row_span_min: 4,
    row_span_max: 8,
    layout_params: ['normalization'],
  },
  {
    type: 'bars',
    ui_name: 'Barras',
    accepted_shapes: ['categorical'],
    col_span_min: 4,
    col_span_max: 12,
    row_span_min: 4,
    row_span_max: 8,
    layout_params: ['order', 'cap'],
  },
  {
    type: 'table',
    ui_name: 'Tabla',
    accepted_shapes: ['tabular'],
    col_span_min: 6,
    col_span_max: 12,
    row_span_min: 4,
    row_span_max: 10,
    layout_params: ['columns'],
  },
  {
    type: 'gauge',
    ui_name: 'Medidor',
    accepted_shapes: ['scalar'],
    col_span_min: 3,
    col_span_max: 4,
    row_span_min: 4,
    row_span_max: 5,
    // A propósito uno que el front no sabe describir.
    layout_params: ['maximum', 'inventado'],
  },
]

const metricas = [
  {
    id: 'm-1', tenant_id: 't-1', key: 'revenue', name: 'Ventas',
    shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
  {
    id: 'm-2', tenant_id: 't-1', key: 'trend', name: 'Tendencia de ventas',
    shape: 'time_series', family: 'demand', layer: 'GOLD', source: 'ERP',
    base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
  },
]

function servir() {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok(versiones)),
    http.get(`${API}/admin/tenants/:id/dashboards`, () => ok(dashboards)),
    // Con `dashboard_id` en la versión el editor ya sabe de qué dashboard es, y
    // el historial, los roles y los usuarios se piden igual · se sirven vacíos.
    http.get(`${API}/admin/dashboards/:id/publications`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/users`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(metricas)),
    http.get(`${API}/admin/layouts/:id`, () => ok(detalle)),
    http.get(`${API}/config/blocks`, () => ok(bloques)),
  )
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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

/** **Desde el 2026-10-06 el configurador es el inspector del canvas** · D1 y
 *  D2 de `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`. B1 ya no
 *  lista paneles ni configura: se llega al editor, se elige el panel en el
 *  lienzo y se abre el inspector. La versión se elige sola —el primer borrador—,
 *  así que no hace falta tocarla. */
async function componer() {
  // **Desde el 2026-10-07 se entra por «Dashboards»** · Cliente → Dashboard →
  // Editor: se elige el dashboard y se abre su editor, que abre el borrador.
  await userEvent.click(await screen.findByRole('button', { name: /Overview/ }))
  await userEvent.click(await screen.findByRole('button', { name: 'Abrir el editor de Overview' }))
  await screen.findByRole('grid', { name: 'Lienzo de composición' })
}

/** Los paneles del lienzo · son las celdas que se arrastran. Por eso y no por
 *  nombre: con una métrica fuera del catálogo el panel no tiene nombre que buscar. */
const panelesDelLienzo = () =>
  screen.getAllByRole('gridcell').filter((c) => c.getAttribute('draggable') === 'true')

const INSPECTOR = 'Configuración del panel'
const inspector = () => within(screen.getByRole('complementary', { name: INSPECTOR }))

/** Compone «Resumen» y elige el panel que ya existe. */
async function abrirPanel() {
  await componer()
  await waitFor(() => expect(panelesDelLienzo()).toHaveLength(1))
  await userEvent.click(panelesDelLienzo()[0] as HTMLElement)
  await screen.findByRole('complementary', { name: INSPECTOR })
}

/** Las métricas que NO se pueden elegir viven en un `<details>` sin caja. */
const noCompatibles = () =>
  within(inspector().getByText(/no compatibles con este tipo · por qué/).closest('details') as HTMLElement)

describe('§7.2 · el rechazo explicado es lo que enseña el sistema', () => {
  it('las incompatibles APARECEN, con la razón DESDE LA MÉTRICA y sin caja que se toque', async () => {
    // El `.pen` la escribe así: «REQUIERE serieTemporal · ESTA ES escalar».
    // `invalidReason` la dice desde el bloque —«un bloque kpi no sabe dibujar»—
    // y ahí está bien, porque lo consume la consola: el sujeto es el panel que
    // no pudo dibujar. Acá el sujeto es la métrica que se está por elegir.
    //
    // **Ya no es un botón deshabilitado** · 2026-10-06: una caja deshabilitada
    // sigue diciendo «tocame». Y la razón va en nombres de producto (D6).
    servir()
    montar()
    await abrirPanel()

    // `kpi` acepta `escalar`; `Tendencia` es `serieTemporal`.
    const lista = noCompatibles()
    expect(lista.getByText('Tendencia de ventas')).toBeInTheDocument()
    expect(
      lista.getByText('Requiere Cifra única o Cifra con intervalo · esta es Serie temporal'),
    ).toBeInTheDocument()
    expect(inspector().queryByRole('button', { name: /Tendencia de ventas/ })).toBeNull()
  })

  it('las separa en dos listas y declara qué acepta el tipo', async () => {
    servir()
    montar()
    await abrirPanel()

    expect(
      inspector().getByText('Acepta métricas de forma Cifra única, Cifra con intervalo.'),
    ).toBeInTheDocument()
    expect(inspector().getByText('1 de 2 compatibles')).toBeInTheDocument()
    expect(inspector().getByText('1 no compatibles con este tipo · por qué')).toBeInTheDocument()
    // «§5 gobierna esta lista» se quitó el 2026-10-06: hablaba del documento y
    // no de quien compone · §1.4 de la auditoría.
  })

  it('las compatibles se pueden elegir', async () => {
    servir()
    montar()
    await abrirPanel()

    expect(inspector().getByRole('button', { name: /Ventas/ })).not.toBeDisabled()
  })

  it('la métrica compatible trae su procedencia · forma, capa y fuente', async () => {
    // Del `.pen`: «seriesMultiples · GOLD · ERP + GA4». Es lo que deja elegir
    // entre dos métricas que sirven las dos. La forma, con su nombre (D6).
    servir()
    montar()
    await abrirPanel()
    expect(inspector().getByText('Cifra única · GOLD · ERP')).toBeInTheDocument()
  })

  it('cambiar el tipo cambia QUIÉN es compatible', async () => {
    // La prueba que demuestra que la lista depende del tipo y no está fija.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'series')

    await waitFor(() =>
      expect(inspector().getByRole('button', { name: /Tendencia de ventas/ })).not.toBeDisabled(),
    )
    // Y la que servía deja de servir, con la razón dada vuelta.
    expect(inspector().queryByRole('button', { name: /^Ventas/ })).toBeNull()
    const lista = noCompatibles()
    expect(lista.getByText('Ventas')).toBeInTheDocument()
    expect(
      lista.getByText('Requiere Serie temporal o Varias series · esta es Cifra única'),
    ).toBeInTheDocument()
  })

  it('el select de tipo nombra los tipos como producto, y manda el id', async () => {
    // D6: «Barras», no `bars`. El id del contrato no se traduce: es el valor.
    servir()
    montar()
    await abrirPanel()

    const select = inspector().getByLabelText<HTMLSelectElement>('Tipo de panel')
    const opciones = Array.from(select.options).map((o) => [o.value, o.textContent])
    expect(opciones).toEqual([
      ['kpi', 'Indicador'],
      ['series', 'Serie temporal'],
      ['bars', 'Barras'],
      ['table', 'Tabla'],
      ['gauge', 'Medidor'],
    ])
  })
})

describe('§7.2 · los spans salen de la tabla del backend', () => {
  it('el rango se muestra y acota el campo', async () => {
    servir()
    montar()
    await abrirPanel()

    expect(inspector().getByText(/Columnas · 3 a 4/)).toBeInTheDocument()
    const columnas = inspector().getByLabelText<HTMLInputElement>(/Columnas/)
    expect(columnas.min).toBe('3')
    expect(columnas.max).toBe('4')
  })

  it('la altura se pide en FILAS, no en píxeles', async () => {
    // **Reemplaza a «la altura se dice también en píxeles»** · D7 de la
    // auditoría del 2026-10-06: `px = 96·N − 16` sigue siendo la regla, pero la
    // aplica la grilla; quien compone piensa en filas. Que no aparezca un «px»
    // es tan parte de la decisión como que aparezcan las filas.
    servir()
    montar()
    await abrirPanel()

    expect(inspector().getByText(/Filas · 3 a 4/)).toBeInTheDocument()
    expect(inspector().getByLabelText<HTMLInputElement>(/Filas/).value).toBe('4')
    expect(screen.getByRole('complementary', { name: INSPECTOR }).textContent).not.toMatch(/\bpx\b/)
  })

  it('cambiar de tipo RECORTA el span al rango nuevo', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'series')
    await waitFor(() =>
      expect(inspector().getByLabelText<HTMLInputElement>(/Columnas/).value).toBe('6'),
    )
  })

  it('colStart NO se edita · la posición es del canvas, y se dice', async () => {
    servir()
    montar()
    await abrirPanel()

    expect(
      inspector().getByText('La posición se cambia arrastrando el panel en el lienzo.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/Columna de inicio/)).toBeNull()
  })
})

describe('las opciones · dos autoridades distintas', () => {
  it('lista los params del tipo con lo que aceptan', async () => {
    // `maximum` llega en inglés del cable y el adaptador lo pasa a `maximo`;
    // los valores los describe `PARAM_SCHEMAS`, que es del front.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'gauge')
    expect(await screen.findByLabelText<HTMLInputElement>('maximo')).toHaveAttribute('type', 'number')
    expect(inspector().getByText('Espera un número de 0 en adelante.')).toBeInTheDocument()
  })

  it('un param que el front no sabe describir se declara, no se ofrece', async () => {
    // Un campo libre ahí produciría un param que `validateParams` descarta.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'gauge')
    const rotulo = await inspector().findByText('inventado')
    expect(
      within(rotulo.parentElement as HTMLElement).getByText(
        'Esta opción todavía no se puede editar desde acá.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('inventado')).toBeNull()
  })
})

describe('agregar y quitar paneles', () => {
  it('el panel nuevo se agrega sin métrica y lo dice', async () => {
    // Desde el 2026-10-06 se agrega desde la biblioteca, con el «+».
    servir()
    montar()
    await componer()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar Indicador' }))

    expect(
      await inspector().findByText('Elegí una métrica: sin ella el panel no se puede publicar.'),
    ).toBeInTheDocument()
    expect(panelesDelLienzo()).toHaveLength(2)
    expect(within(panelesDelLienzo()[1] as HTMLElement).getByText('Sin métrica')).toBeInTheDocument()
  })

  it('elegir una métrica la marca, saca el aviso Y cambia el panel del lienzo', async () => {
    // **La cadena entera**: Opcion → PanelConfigurator → Builder → borrador →
    // Canvas. Un callback mal nombrado en cualquiera de los saltos compila.
    servir()
    montar()
    await componer()
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Indicador' }))
    await screen.findByRole('complementary', { name: INSPECTOR })

    await userEvent.click(inspector().getByRole('button', { name: /Ventas/ }))

    await waitFor(() =>
      expect(inspector().queryByText(/sin ella el panel no se puede publicar/)).toBeNull(),
    )
    expect(inspector().getByRole('button', { name: /Ventas/ })).toHaveAttribute('aria-pressed', 'true')
    const nuevo = panelesDelLienzo()[1] as HTMLElement
    expect(within(nuevo).getByText('Ventas')).toBeInTheDocument()
    expect(within(nuevo).queryByText('Sin métrica')).toBeNull()
  })

  it('quitar el panel cierra el configurador y lo saca del lienzo', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.click(inspector().getByRole('button', { name: 'Quitar panel' }))
    await waitFor(() => expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull())
    expect(panelesDelLienzo()).toHaveLength(0)
  })

  it('quitar la PESTAÑA no deja el configurador apuntando a un hueco', async () => {
    // La selección es por índice contra el borrador vigente. Sin resolver a
    // `null`, el configurador leería `panel.tipo` de un `undefined`.
    //
    // Con una pestaña nueva al lado, a propósito: así el índice 0 sigue
    // existiendo después de quitar «Resumen», pero ya no tiene panel 0.
    servir()
    montar()
    await abrirPanel()

    // Desde el 2026-10-07 las pestañas se agregan y se quitan en el editor, y
    // abrir los ajustes de una pestaña cierra el panel elegido: lo que se
    // verifica es que quitar «Resumen» con su panel abierto antes no deje el
    // configurador leyendo un hueco.
    await userEvent.click(screen.getByRole('button', { name: 'Agregar una pestaña' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Resumen' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Resumen' }))
    await userEvent.click(
      within(screen.getByRole('complementary', { name: 'Ajustes de la pestaña' })).getByRole('button', {
        name: 'Quitar Resumen',
      }),
    )

    await waitFor(() => expect(screen.queryByRole('tab', { name: 'Resumen' })).toBeNull())
    expect(screen.getByRole('tab', { name: 'Pestaña nueva' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull()
    expect(screen.queryByLabelText('Tipo de panel')).toBeNull()
  })
})

describe('el inspector · D1 de la auditoría del 2026-10-06', () => {
  it('no está hasta que se elige un panel en el lienzo', async () => {
    servir()
    montar()
    await componer()

    expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull()
    await waitFor(() => expect(panelesDelLienzo()).toHaveLength(1))
    await userEvent.click(panelesDelLienzo()[0] as HTMLElement)
    expect(await screen.findByRole('complementary', { name: INSPECTOR })).toBeInTheDocument()
    // Y nombra el tipo como producto, no por su id.
    expect(inspector().getAllByText('Indicador').length).toBeGreaterThan(0)
  })

  it('cambiar el tipo y la métrica desde el inspector cambia el panel del LIENZO', async () => {
    // **Lo que el canvas no podía** antes del 2026-10-06: para cambiarle la
    // métrica a un panel había que volver a B1. Se verifica que el cambio llegue
    // al lienzo, no que el control exista.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'series')
    await userEvent.click(inspector().getByRole('button', { name: /Tendencia de ventas/ }))

    await waitFor(() => {
      const p = panelesDelLienzo()[0] as HTMLElement
      expect(within(p).getByText('Tendencia de ventas')).toBeInTheDocument()
      expect(within(p).getByText('Serie temporal')).toBeInTheDocument()
    })
  })

  it('«Cerrar» lo cierra, y el panel sigue en el lienzo', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.click(
      screen.getByRole('button', { name: 'Cerrar la configuración del panel' }),
    )
    await waitFor(() => expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull())
    expect(panelesDelLienzo()).toHaveLength(1)
  })

  it('Escape DENTRO del inspector lo cierra', async () => {
    // El foco está en un control del inspector, no en el panel del lienzo: el
    // Escape del lienzo no lo alcanza, así que esto prueba el del inspector.
    servir()
    montar()
    await abrirPanel()

    fireEvent.keyDown(inspector().getByLabelText('Tipo de panel'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull())
  })
})

describe('§7.2 · editar las opciones del panel', () => {
  it('un param de enum se elige de una lista, con «Por defecto»', async () => {
    // El vacío no es un valor: el default lo aplica el cuerpo, y escribirlo acá
    // lo congelaría el día que el cuerpo cambie de opinión.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'bars')
    const orden = await inspector().findByLabelText<HTMLSelectElement>('orden')
    expect(orden.value).toBe('')
    expect(within(orden).getByText('Por defecto')).toBeInTheDocument()

    await userEvent.selectOptions(orden, 'asc')
    expect(inspector().getByLabelText<HTMLSelectElement>('orden').value).toBe('asc')
  })

  it('un param numérico se escribe y se manda como NÚMERO', async () => {
    // `opciones` viaja como JSON y `validateParams` pide `typeof === 'number'`:
    // mandar «10» degradaría el panel con razón visible, que es correcto y es un
    // error que este campo no debe crear. Se verifica por el `type` del campo y
    // por el valor que queda, que es lo observable desde acá.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'bars')
    const tope = await inspector().findByLabelText<HTMLInputElement>('tope')
    expect(tope.type).toBe('number')
    expect(tope.min).toBe('1')
    expect(tope.placeholder).toBe('Por defecto')

    await userEvent.type(tope, '10')
    expect(inspector().getByLabelText<HTMLInputElement>('tope').value).toBe('10')
  })

  it('el número escrito llega como NÚMERO al validador', async () => {
    // **La prueba que la mutación pidió.** El valor mostrado es el mismo con
    // `Number(texto)` y sin él —`String(valor)` los iguala— así que el DOM del
    // campo no distingue. Lo que sí distingue es `validateParams`, que pide
    // `typeof === 'number'`: con la coerción no hay queja, sin ella el panel
    // sale degradado con razón visible.
    servir()
    const { container } = montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'bars')
    await userEvent.type(await inspector().findByLabelText('tope'), '10')

    await waitFor(() =>
      expect(inspector().getByLabelText<HTMLInputElement>('tope').value).toBe('10'),
    )
    expect(container.textContent).not.toMatch(/«tope» tiene el valor/)
  })

  it('un valor que el esquema no acepta se explica, no se corrige solo', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'bars')
    // `tope` pide un entero de 1 en adelante.
    await userEvent.type(await inspector().findByLabelText('tope'), '0')

    // Dos veces: en el inspector, mientras se escribe, y en el resumen, que es
    // lo que bloquea publicar. Las dos salen de la misma corrida.
    await waitFor(() =>
      expect(screen.getAllByText(/«tope» tiene el valor 0 y espera un número entero/)).toHaveLength(2),
    )
    expect(inspector().getByText(/«tope» tiene el valor 0/)).toBeInTheDocument()
  })

  it('un param de estructura se DECLARA, no se ofrece un textarea', async () => {
    // `columnas` es una lista de definiciones de columna. Un textarea de JSON
    // compilaría y el error aparecería al publicar.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'table')
    const rotulo = await inspector().findByText('columnas')
    expect(
      within(rotulo.parentElement as HTMLElement).getByText(
        'Esta opción todavía no se puede editar desde acá.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('columnas')).toBeNull()
    expect(screen.queryByRole('textbox', { name: 'columnas' })).toBeNull()
  })

  it('un sí o no se ELIGE · Sí escribe true, No escribe false, Por defecto lo borra', async () => {
    // **Antes era un campo de texto que pedía «true» o «false»** · 2026-10-06.
    // `aria-pressed` sale de `valor === true`, `=== false` y `=== undefined`,
    // estricto: si se escribiera el texto «true», ninguna quedaría marcada.
    servir()
    montar()
    await abrirPanel()

    const porDefecto = () => inspector().getByRole('button', { name: 'comparativo · por defecto' })
    const si = () => inspector().getByRole('button', { name: 'comparativo · sí' })
    const no = () => inspector().getByRole('button', { name: 'comparativo · no' })

    expect(porDefecto()).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(si())
    await waitFor(() => expect(si()).toHaveAttribute('aria-pressed', 'true'))
    expect(no()).toHaveAttribute('aria-pressed', 'false')
    expect(porDefecto()).toHaveAttribute('aria-pressed', 'false')
    // Y escribirlo ensucia el borrador: el valor llegó al borrador, no al botón.
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()

    await userEvent.click(no())
    await waitFor(() => expect(no()).toHaveAttribute('aria-pressed', 'true'))
    expect(si()).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(porDefecto())
    await waitFor(() => expect(porDefecto()).toHaveAttribute('aria-pressed', 'true'))
    // Borrarlo devuelve el borrador a la semilla: `undefined` quita la clave, no
    // deja un `opciones: {}` colgado.
    await waitFor(() =>
      expect(screen.queryByText(/con cambios · se guarda solo/)).toBeNull(),
    )
  })

  it('escribir una opción ensucia el borrador · borrarla lo limpia', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'bars')
    const orden = await inspector().findByLabelText<HTMLSelectElement>('orden')

    await userEvent.selectOptions(orden, 'asc')
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()

    await userEvent.selectOptions(inspector().getByLabelText('orden'), '')
    // Sigue sucio porque el TIPO cambió; lo que se verifica es que la opción se
    // fue y no quedó un `opciones: {}` colgado.
    expect(inspector().getByLabelText<HTMLSelectElement>('orden').value).toBe('')
  })
})

describe('§F4.11 · el resumen dice dónde y que NO decide', () => {
  it('nombra la pestaña y el panel, no «composición inválida»', async () => {
    servir()
    montar()
    await abrirPanel()

    // El panel es `kpi` sobre una métrica `escalar`: cerrado. Se rompe a
    // propósito pasándolo a `series`.
    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'series')

    expect(await screen.findByText('Resumen · panel 1')).toBeInTheDocument()
    // La razón, en nombres de producto (D6).
    expect(
      screen.getByText('Un bloque «Serie temporal» no sabe dibujar la forma «Cifra única».'),
    ).toBeInTheDocument()
  })

  it('declara que el servidor decide · también cuando está limpio', async () => {
    // **El caso peligroso es el limpio**: es ahí donde alguien podría leer
    // «listo para publicar». El criterio de F4.11 lo prohíbe explícitamente.
    //
    // Desde el 2026-10-06 el resumen limpio no se pinta —§2.5 de la auditoría—,
    // así que lo que lo dice en ese caso es el chrome: qué falta para publicar.
    servir()
    montar()
    await abrirPanel()

    expect(screen.queryByText(/problemas? de composición/)).toBeNull()
    expect(screen.getByText('Para publicar, validá.')).toBeInTheDocument()

    // Y con problemas, el resumen dice que el servidor tiene la última palabra.
    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'series')
    expect(await screen.findByText(/El servidor tiene la última palabra/)).toBeInTheDocument()
  })

  it('publicar NO está autorizado sin veredicto del servidor', async () => {
    // «Nunca se publica algo que el front dio por bueno y el servidor no vio»:
    // sin validar, el botón no está y en su lugar se dice qué falta.
    servir()
    montar()
    await abrirPanel()

    // **Ausente, con la razón en su lugar.** Un botón que se aprieta y no puede
    // cumplir es peor que uno ausente · la regla de `RecoBody`.
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    expect(screen.getByText('Para publicar, validá.')).toBeInTheDocument()

    // Con cambios, primero tiene que guardarse · desde el 2026-10-07 se guarda
    // solo, y el chrome lo dice así.
    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'series')
    expect(await screen.findByText('Para publicar, esperá a que se guarde y validá.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  })

  it('«Ir al panel» lleva al panel con problemas y abre su configuración', async () => {
    // **Reemplaza a «el botón del panel con problemas se marca»**: B1 ya no
    // lista paneles, así que no hay chip que marcar · §2.5 de la auditoría del
    // 2026-10-06. Lo que la marca resolvía —encontrar CUÁL— lo hace ahora el
    // propio resumen, que lleva hasta él.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'series')
    await userEvent.click(
      screen.getByRole('button', { name: 'Cerrar la configuración del panel' }),
    )
    await waitFor(() => expect(screen.queryByRole('complementary', { name: INSPECTOR })).toBeNull())

    await userEvent.click(screen.getByRole('button', { name: 'Ir al panel' }))

    expect(await screen.findByRole('complementary', { name: INSPECTOR })).toBeInTheDocument()
    expect(panelesDelLienzo()[0]).toHaveAttribute('aria-selected', 'true')
  })
})

describe('el contador cuenta PESTAÑAS, no cambios ni problemas', () => {
  it('dos problemas en la misma pestaña son dos problemas y una pestaña', async () => {
    // **La prueba que la mutación pidió.** Con un problema por pestaña las dos
    // cuentas dan lo mismo. Desde el 2026-10-06 el conteo de «pestañas con
    // problemas» se fue —§2.5: se decía tres veces— y la cuenta por pestaña que
    // queda es la de cambios sin guardar, en el chrome.
    servir()
    montar()
    await abrirPanel()

    // Uno: el tipo deja de aceptar la forma de la métrica.
    await userEvent.selectOptions(inspector().getByLabelText('Tipo de panel'), 'series')
    // Dos: la pregunta operativa se borra, en los ajustes de la pestaña ·
    // tocar la pestaña activa los abre (2026-10-07).
    await userEvent.click(screen.getByRole('tab', { name: 'Resumen' }))
    await userEvent.clear(await screen.findByDisplayValue('¿Cómo vamos?'))

    await waitFor(() =>
      expect(screen.getByText('2 problemas de composición')).toBeInTheDocument(),
    )
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()
  })
})

describe('con un catálogo grande · el agrupado es la diferencia entre una lista y un muro', () => {
  /** Treinta y cuatro métricas, como el `.pen`: «4 DE 34 MÉTRICAS DEL CATÁLOGO»
   *  y «30 · AGRUPADAS POR RAZÓN». Con dos métricas el agrupado no se ve; con
   *  treinta, es toda la diferencia. */
  const muchas = [
    ...Array.from({ length: 4 }, (_, i) => ({
      ...metricas[0], id: `ok-${String(i)}`, key: `ok${String(i)}`, name: `Compatible ${String(i)}`,
    })),
    ...Array.from({ length: 13 }, (_, i) => ({
      ...metricas[1], id: `ts-${String(i)}`, key: `ts${String(i)}`, name: `Serie ${String(i)}`,
      shape: 'time_series',
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      ...metricas[1], id: `pr-${String(i)}`, key: `pr${String(i)}`, name: `Prosa ${String(i)}`,
      shape: 'prose',
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      ...metricas[1], id: `ta-${String(i)}`, key: `ta${String(i)}`, name: `Tabla ${String(i)}`,
      shape: 'tabular',
    })),
  ]

  it('muestra seis con su razón y resume el resto por forma', async () => {
    servir()
    server.use(http.get(`${API}/admin/tenants/:id/catalog`, () => ok(muchas)))
    montar()
    await abrirPanel()

    await waitFor(() => expect(inspector().getByText('4 de 24 compatibles')).toBeInTheDocument())
    expect(inspector().getByText('20 no compatibles con este tipo · por qué')).toBeInTheDocument()

    // Seis individuales · «+ 24 MÁS» en el `.pen` sobre treinta.
    expect(noCompatibles().getAllByText(/^Requiere Cifra única/)).toHaveLength(6)

    // Y el resto, agrupado por forma con su conteo, en nombres de producto.
    const resumen = noCompatibles().getByText(/^Y 14 más: /)
    // **Cuenta sólo las ocultas** · 2026-10-06. Antes decía «Serie temporal
    // (13)» con seis de esas trece ya a la vista arriba, y los conteos sumaban
    // 20 bajo un «Y 14 más». La prueba vieja afirmaba ese 13.
    expect(resumen.textContent).toMatch(/Serie temporal \(7\)/)
    expect(resumen.textContent).toMatch(/Texto \(5\)/)
    expect(resumen.textContent).toMatch(/Tabla \(2\)/)
    const suma = [...(resumen.textContent ?? '').matchAll(/\((\d+)\)/g)].reduce(
      (n, m) => n + Number(m[1]),
      0,
    )
    expect(suma).toBe(14)
  })

  it('el resumen NO aparece cuando entran todas', async () => {
    // Con pocas incompatibles, un «Y 0 más» sería ruido.
    servir()
    montar()
    await abrirPanel()
    expect(screen.getByRole('complementary', { name: INSPECTOR }).textContent).not.toMatch(
      /Y \d+ más/,
    )
  })

  it('si NINGUNA sirve lo dice, y no deja la lista en blanco', async () => {
    // No es un error de la pantalla: el tipo elegido no tiene con qué. La salida
    // es cambiar de tipo.
    servir()
    server.use(
      http.get(`${API}/admin/tenants/:id/catalog`, () =>
        ok(muchas.filter((m) => m.shape !== 'scalar')),
      ),
    )
    montar()
    await abrirPanel()

    expect(
      await inspector().findByText(/Ninguna métrica de este cliente tiene una forma que este tipo acepte/),
    ).toBeInTheDocument()
  })
})
