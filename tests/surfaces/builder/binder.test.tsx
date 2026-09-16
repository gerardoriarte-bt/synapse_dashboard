// @vitest-environment jsdom

/** B4 · Binder de métrica · F4.10
 *
 *  **La aserción que sostiene la tarea es que las incompatibles APAREZCAN.**
 *  §7.2: «las incompatibles aparecen listadas y deshabilitadas con la razón. El
 *  rechazo explicado es lo que enseña el sistema». Filtrarlas sería más corto y
 *  más limpio, y una prueba escrita desde esa implementación pasaría siempre.
 *
 *  Los fixtures salen de los dos cables: `BlockRule` de
 *  `synapse-console-wire.yaml` —snake_case, `accepted_shapes` en inglés— y
 *  `CatalogMetric` de `synapse-admin-wire.yaml`.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [{ id: 't-1', name: 'Under Armour México' }]
const versiones = [
  { ID: 'l-2', TenantID: 't-1', Status: 'draft', VersionID: 'v4', PublishedAt: null },
]

const detalle = {
  layout: versiones[0],
  tabs: [
    {
      tab: {
        ID: 'tab-a',
        LayoutVersionID: 'l-2',
        Name: 'Resumen',
        OperationalQuestion: '¿Cómo vamos?',
        SortOrder: 1,
        RoleIDs: [],
      },
      panels: [
        { ID: 'p-1', TabID: 'tab-a', MetricID: 'm-1', Type: 'kpi', ColStart: 1, ColSpan: 3, RowSpan: 4 },
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
    layout_params: ['maximum'],
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

/** Abre la versión y selecciona el panel que ya existe. */
async function abrirPanel() {
  await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
  await screen.findByDisplayValue('Resumen')
  // **Anclado y no exacto.** El botón del panel gana un « ·» cuando el panel
  // tiene problemas de composición —por ejemplo, una métrica que no está en el
  // catálogo de la prueba— y el nombre accesible deja de ser «kpi» a secas.
  await userEvent.click(await screen.findByRole('button', { name: /^kpi/ }))
  await screen.findByLabelText('Tipo de panel')
}

describe('§7.2 · el rechazo explicado es lo que enseña el sistema', () => {
  it('las incompatibles APARECEN, deshabilitadas y con la razón DESDE LA MÉTRICA', async () => {
    // El `.pen` la escribe así: «REQUIERE serieTemporal · ESTA ES escalar».
    // `invalidReason` la dice desde el bloque —«un bloque kpi no sabe dibujar»—
    // y ahí está bien, porque lo consume la consola: el sujeto es el panel que
    // no pudo dibujar. Acá el sujeto es la métrica que se está por elegir.
    servir()
    montar()
    await abrirPanel()

    // `kpi` acepta `escalar`; `Tendencia` es `serieTemporal`.
    const incompatible = screen.getByRole('button', { name: /Tendencia de ventas/ })
    expect(incompatible).toBeInTheDocument()
    expect(incompatible).toBeDisabled()
    expect(incompatible.textContent).toMatch(
      /Requiere escalar o escalarConIntervalo · esta es serieTemporal/,
    )
  })

  it('las separa en dos listas y declara qué acepta el tipo', async () => {
    servir()
    const { container } = montar()
    await abrirPanel()

    expect(screen.getByText(/Tipo kpi · acepta escalar · escalarConIntervalo/)).toBeInTheDocument()
    expect(container.textContent).toContain('Compatibles · 1 de 2 métricas del catálogo')
    expect(container.textContent).toContain('No compatibles · 1 · agrupadas por razón')
    // §5 gobierna la lista, y se dice.
    expect(screen.getByText(/§5 gobierna esta lista/)).toBeInTheDocument()
  })

  it('las compatibles se pueden elegir', async () => {
    servir()
    montar()
    await abrirPanel()

    expect(screen.getByRole('button', { name: /Ventas/ })).not.toBeDisabled()
  })

  it('la métrica compatible trae su procedencia · forma, capa y fuente', async () => {
    // Del `.pen`: «seriesMultiples · GOLD · ERP + GA4». Es lo que deja elegir
    // entre dos métricas que sirven las dos.
    servir()
    montar()
    await abrirPanel()
    expect(screen.getByText('escalar · GOLD · ERP')).toBeInTheDocument()
  })

  it('cambiar el tipo cambia QUIÉN es compatible', async () => {
    // La prueba que demuestra que la lista depende del tipo y no está fija.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'series')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Tendencia de ventas/ })).not.toBeDisabled(),
    )
    // Y la que servía deja de servir, con la razón dada vuelta.
    const ventas = screen.getByRole('button', { name: /^Ventas/ })
    expect(ventas).toBeDisabled()
    expect(ventas.textContent).toMatch(/Requiere serieTemporal o seriesMultiples · esta es escalar/)
  })
})

describe('§7.2 · los spans salen de la tabla del backend', () => {
  it('el rango se muestra y acota el campo', async () => {
    servir()
    montar()
    await abrirPanel()

    expect(screen.getByText(/Columnas · 3 a 4/)).toBeInTheDocument()
    const columnas = screen.getByLabelText<HTMLInputElement>(/Columnas/)
    expect(columnas.min).toBe('3')
    expect(columnas.max).toBe('4')
  })

  it('la altura se dice también en píxeles · px = 96·N − 16', async () => {
    // La fórmula es la regla: ninguna altura de panel sale de otro lado.
    servir()
    montar()
    await abrirPanel()
    expect(screen.getByText('368 px')).toBeInTheDocument()
  })

  it('cambiar de tipo RECORTA el span al rango nuevo', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'series')
    await waitFor(() =>
      expect(screen.getByLabelText<HTMLInputElement>(/Columnas/).value).toBe('6'),
    )
  })

  it('colStart se muestra y NO se edita · es del canvas', async () => {
    servir()
    montar()
    await abrirPanel()

    expect(screen.getByText(/se coloca en el canvas · F4.9/)).toBeInTheDocument()
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

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'gauge')
    expect(await screen.findByText(/maximo · espera un número/)).toBeInTheDocument()
  })

  it('un param que el front no sabe describir se declara, no se ofrece', async () => {
    // Un campo libre ahí produciría un param que `validateParams` descarta.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'gauge')
    expect(await screen.findByText(/inventado · el contrato no declara sus valores/)).toBeInTheDocument()
  })
})

describe('agregar y quitar paneles', () => {
  it('el panel nuevo se agrega sin métrica y lo dice', async () => {
    servir()
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await screen.findByDisplayValue('Resumen')

    await userEvent.click(screen.getByRole('button', { name: 'Agregar panel a Resumen' }))

    expect(await screen.findByText(/Sin métrica · el panel no se puede componer/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /kpi · sin métrica/ })).toBeInTheDocument()
  })

  it('elegir una métrica la marca y saca el aviso', async () => {
    servir()
    const { container } = montar()
    await userEvent.click(await screen.findByRole('button', { name: /v4/ }))
    await screen.findByDisplayValue('Resumen')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar panel a Resumen' }))
    await screen.findByLabelText('Tipo de panel')

    await userEvent.click(screen.getByRole('button', { name: /Ventas/ }))

    await waitFor(() =>
      expect(container.textContent).not.toContain('el panel no se puede componer'),
    )
    expect(screen.getByRole('button', { name: /Ventas/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('quitar el panel cierra el configurador', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.click(screen.getByRole('button', { name: 'Quitar panel' }))
    await waitFor(() => expect(screen.queryByLabelText('Tipo de panel')).toBeNull())
  })

  it('quitar la PESTAÑA no deja el configurador apuntando a un hueco', async () => {
    // La selección es por índice contra el borrador vigente. Sin resolver a
    // `null`, el configurador leería `panel.tipo` de un `undefined`.
    servir()
    montar()
    await abrirPanel()

    await userEvent.click(screen.getByRole('button', { name: 'Quitar Resumen' }))
    await waitFor(() => expect(screen.queryByLabelText('Tipo de panel')).toBeNull())
  })
})

describe('§7.2 · editar las opciones del panel', () => {
  it('un param de enum se elige de una lista, con «sin declarar»', async () => {
    // El vacío no es un valor: el default lo aplica el cuerpo, y escribirlo acá
    // lo congelaría el día que el cuerpo cambie de opinión.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'bars')
    const orden = await screen.findByLabelText<HTMLSelectElement>('orden')
    expect(orden.value).toBe('')
    expect(within(orden).getByText('Sin declarar')).toBeInTheDocument()

    await userEvent.selectOptions(orden, 'asc')
    expect(screen.getByLabelText<HTMLSelectElement>('orden').value).toBe('asc')
  })

  it('un param numérico se escribe y se manda como NÚMERO', async () => {
    // `opciones` viaja como JSON y `validateParams` pide `typeof === 'number'`:
    // mandar «10» degradaría el panel con razón visible, que es correcto y es un
    // error que este campo no debe crear. Se verifica por el `type` del campo y
    // por el valor que queda, que es lo observable desde acá.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'bars')
    const tope = await screen.findByLabelText<HTMLInputElement>('tope')
    expect(tope.type).toBe('number')
    expect(tope.min).toBe('1')

    await userEvent.type(tope, '10')
    expect(screen.getByLabelText<HTMLInputElement>('tope').value).toBe('10')
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

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'bars')
    await userEvent.type(await screen.findByLabelText('tope'), '10')

    await waitFor(() =>
      expect(screen.getByLabelText<HTMLInputElement>('tope').value).toBe('10'),
    )
    expect(container.textContent).not.toMatch(/«tope» tiene el valor/)
  })

  it('un valor que el esquema no acepta se explica, no se corrige solo', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'bars')
    // `tope` pide un entero de 1 en adelante.
    await userEvent.type(await screen.findByLabelText('tope'), '0')

    // Dos veces: en el configurador, mientras se escribe, y en el resumen, que
    // es lo que bloquea publicar. Las dos salen de la misma corrida.
    await waitFor(() =>
      expect(screen.getAllByText(/«tope» tiene el valor 0 y espera un número entero/)).toHaveLength(2),
    )
  })

  it('un param de estructura se DECLARA, no se ofrece un textarea', async () => {
    // `columnas` es una lista de definiciones de columna. Un textarea de JSON
    // compilaría y el error aparecería al publicar.
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'table')
    expect(await screen.findByText(/columnas · una lista · no se edita acá/)).toBeInTheDocument()
    expect(screen.queryByLabelText('columnas')).toBeNull()
  })

  it('escribir una opción ensucia el borrador · borrarla lo limpia', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'bars')
    const orden = await screen.findByLabelText<HTMLSelectElement>('orden')

    await userEvent.selectOptions(orden, 'asc')
    expect(screen.getByText(/cambio\(s\) sin guardar/)).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('orden'), '')
    // Sigue sucio porque el TIPO cambió; lo que se verifica es que la opción se
    // fue y no quedó un `opciones: {}` colgado.
    expect(screen.getByLabelText<HTMLSelectElement>('orden').value).toBe('')
  })
})

describe('§F4.11 · el resumen dice dónde y que NO decide', () => {
  it('nombra la pestaña y el panel, no «composición inválida»', async () => {
    servir()
    montar()
    await abrirPanel()

    // El panel es `kpi` sobre una métrica `escalar`: cerrado. Se rompe a
    // propósito pasándolo a `series`.
    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'series')

    const resumen = await screen.findByText(/^Resumen · panel 1 · /)
    expect(resumen.textContent).toContain('no sabe dibujar la forma')
  })

  it('declara que el servidor decide · también cuando está limpio', async () => {
    // **El caso peligroso es el limpio**: es ahí donde alguien podría leer
    // «listo para publicar». El criterio de F4.11 lo prohíbe explícitamente.
    servir()
    montar()
    await abrirPanel()

    expect(screen.getByText(/Sin problemas de composición que el front pueda ver/)).toBeInTheDocument()
    expect(screen.getByText(/El servidor decide/)).toBeInTheDocument()
  })

  it('publicar existe pero NO está autorizado sin veredicto del servidor', async () => {
    // Desde F4.15 el botón está; lo que no está es el permiso. «Nunca se publica
    // algo que el front dio por bueno y el servidor no vio»: sin validar, el
    // botón se ve y no se puede apretar.
    servir()
    montar()
    await abrirPanel()

    // **Ausente, con la razón en su lugar.** Un botón que se aprieta y no puede
    // cumplir es peor que uno ausente · la regla de `RecoBody`.
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    expect(screen.getByText(/Publicar · falta validar en el servidor/)).toBeInTheDocument()
    expect(screen.getByText(/el servidor todavía no vio esta composición/)).toBeInTheDocument()
  })

  it('el botón del panel con problemas se marca', async () => {
    servir()
    montar()
    await abrirPanel()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'series')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^series ·$/ })).toBeInTheDocument(),
    )
  })
})

describe('el contador de pestañas cuenta PESTAÑAS, no problemas', () => {
  it('dos problemas en la misma pestaña siguen siendo una', async () => {
    // **La prueba que la mutación pidió.** Con un problema por pestaña las dos
    // cuentas dan lo mismo, así que `problemas.length` pasaba por `Set(tab).size`.
    servir()
    montar()
    await abrirPanel()

    // Uno: el tipo deja de aceptar la forma de la métrica.
    await userEvent.selectOptions(screen.getByLabelText('Tipo de panel'), 'series')
    // Dos: la pregunta operativa se borra.
    await userEvent.clear(screen.getByDisplayValue('¿Cómo vamos?'))

    // Dos lugares lo dicen —la barra de guardado y el resumen— y los dos salen
    // de la misma corrida.
    await waitFor(() =>
      expect(screen.getByText('2 problema(s) de composición')).toBeInTheDocument(),
    )
    expect(screen.getByText('1 pestaña(s) con problemas de composición')).toBeInTheDocument()
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
    const { container } = montar()
    await abrirPanel()

    await waitFor(() =>
      expect(container.textContent).toContain('Compatibles · 4 de 24 métricas del catálogo'),
    )
    expect(container.textContent).toContain('No compatibles · 20 · agrupadas por razón')

    // Seis individuales · «+ 24 MÁS» en el `.pen` sobre treinta.
    expect(screen.getAllByText(/Requiere escalar/)).toHaveLength(6)

    // Y el resto, agrupado por forma con su conteo.
    expect(container.textContent).toMatch(/\+ 14 más · .*serieTemporal \(13\)/)
    expect(container.textContent).toMatch(/prosa \(5\)/)
    expect(container.textContent).toMatch(/tabular \(2\)/)
  })

  it('el resumen NO aparece cuando entran todas', async () => {
    // Con pocas incompatibles, un «+ 0 más» sería ruido.
    servir()
    const { container } = montar()
    await abrirPanel()
    expect(container.textContent).not.toMatch(/\+ \d+ más/)
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
      await screen.findByText(/Ninguna métrica de este cliente tiene una forma que este tipo acepte/),
    ).toBeInTheDocument()
  })
})
