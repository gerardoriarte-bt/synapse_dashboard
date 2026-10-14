// @vitest-environment jsdom

/** El editor de pestañas en la pantalla · F4.8, mudado al editor el 2026-10-07
 *
 *  Las funciones puras las cubre `borrador.test.ts`. Acá se verifica lo que solo
 *  se ve montado: **que los callbacks DISPAREN** —un botón muerto se ve igual
 *  que uno que funciona, y el spread condicional no lo detecta— y que el
 *  borrador se ate a su versión.
 *
 *  **Desde el 2026-10-07 las pestañas viven en el editor**, como pestañas, y sus
 *  ajustes —nombre, pregunta, quién la ve, posición, quitar— en el inspector
 *  «Ajustes de la pestaña» (`TabInspector`, que reemplazó a `TabEditor`) ·
 *  `docs/AUDITORIA-2026-10-07-flujo-de-edicion.md` §2.2. Las pruebas son las
 *  mismas intenciones de antes, recorridas por ese camino.
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

const tenants = [
  { id: 't-1', name: 'Under Armour México' },
  { id: 't-2', name: 'Keralty Colombia' },
]

/** `LayoutDashboard` del cable · desde el 2026-10-07 el builder elige
 *  dashboards y el editor abre el borrador del elegido. */
const dashboards = {
  't-1': [
    { id: 'd-1', tenant_id: 't-1', name: 'Overview', slug: 'overview', is_default: true, history_months: 12 },
    // Del MISMO cliente · es el que destapa si el borrador se ata a su versión.
    { id: 'd-2', tenant_id: 't-1', name: 'Medios', slug: 'medios', is_default: false, history_months: 12 },
  ],
  't-2': [{ id: 'd-9', tenant_id: 't-2', name: 'Salud', slug: 'salud', is_default: true, history_months: 12 }],
}

const versiones = {
  't-1': [
    { id: 'l-2', tenant_id: 't-1', dashboard_id: 'd-1', status: 'draft', version_id: 'v4', published_at: null },
    { id: 'l-3', tenant_id: 't-1', dashboard_id: 'd-2', status: 'draft', version_id: 'v5', published_at: null },
  ],
  't-2': [{ id: 'l-9', tenant_id: 't-2', dashboard_id: 'd-9', status: 'draft', version_id: 'k1', published_at: null }],
}

/** Del cable, en PascalCase · `contracts/synapse-admin-wire.yaml`. */
const detalles: Record<string, unknown> = {
  'l-2': {
    layout: versiones['t-1'][0],
    tabs: [
      {
        tab: {
          id: 'tab-b',
          layout_version_id: 'l-2',
          name: 'Inventario',
          operational_question: '',
          sort_order: 2,
          role_ids: ['a3f1c2d4-0000-0000-0000-00000000dead'],
        },
        panels: [
          { id: 'p-1', tab_id: 'tab-b', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4 },
        ],
      },
      {
        tab: {
          id: 'tab-a',
          layout_version_id: 'l-2',
          name: 'Resumen',
          operational_question: '¿Cómo vamos contra el plan?',
          sort_order: 1,
          role_ids: [],
        },
        panels: [],
      },
    ],
  },
  'l-3': {
    layout: versiones['t-1'][1],
    tabs: [
      {
        tab: {
          id: 'tab-c',
          layout_version_id: 'l-3',
          name: 'Medios',
          operational_question: '¿El gasto está rindiendo?',
          sort_order: 1,
          role_ids: [],
        },
        panels: [],
      },
    ],
  },
  'l-9': { layout: versiones['t-2'][0], tabs: [] },
}

/** Los roles del tenant · `GET /admin/tenants/{id}/roles/composition`, del
 *  cable. Sin ellos `TabInspector` no pinta las opciones de «La ven», y desde el
 *  2026-10-06 son la forma en que una pestaña dice quién la ve. */
const roles = [
  { id: 'r-1', tenant_id: 't-1', name: 'CEO', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 1 },
  { id: 'r-2', tenant_id: 't-1', name: 'Planner', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 3 },
]

function servir() {
  server.use(
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(roles)),
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/dashboards`, ({ params }) =>
      ok(dashboards[params['id'] as keyof typeof dashboards] ?? []),
    ),
    // Las dos que el contenedor pide siempre para B6 y que acá no se miran.
    http.get(`${API}/admin/tenants/:id/users`, () => ok([])),
    http.get(`${API}/admin/dashboards/:id/publications`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/layouts`, ({ params }) =>
      ok(versiones[params['id'] as keyof typeof versiones] ?? []),
    ),
    http.get(`${API}/admin/layouts/:id`, ({ params }) => ok(detalles[params['id'] as string])),
    // El catálogo del tenant · sin él, `validarBorrador` marcaría cada panel
    // como «su métrica ya no está en el catálogo», que es cierto y no es lo que
    // estas pruebas miran.
    http.get(`${API}/admin/tenants/:id/catalog`, () =>
      ok([
        {
          id: 'm-1', tenant_id: 't-1', key: 'revenue', name: 'Ventas',
          shape: 'scalar', family: 'demand', layer: 'GOLD', source: 'ERP',
          base: 'x', min_grain: 'day', dimensions: [], catalog_version: 1,
        },
      ]),
    ),
    http.get(`${API}/config/blocks`, () =>
      ok([
        {
          type: 'kpi', ui_name: 'KPI', accepted_shapes: ['scalar'],
          col_span_min: 3, col_span_max: 4, row_span_min: 3, row_span_max: 4,
          layout_params: [],
        },
      ]),
    ),
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

/** Cliente → Dashboard → Editor · B1 es el punto de entrada y el editor cuelga
 *  de ahí. Abre el borrador del dashboard elegido. */
async function abrirEditor(dashboard = 'Overview', primera = 'Resumen') {
  await userEvent.click(await screen.findByRole('button', { name: new RegExp(`^${dashboard}`) }))
  await userEvent.click(screen.getByRole('button', { name: `Abrir el editor de ${dashboard}` }))
  await screen.findByRole('tab', { name: primera })
}

/** Los nombres de las pestañas del editor, en el orden en que se pintan. */
const pestanas = () =>
  within(screen.getByRole('tablist', { name: 'Pestañas del dashboard' }))
    .getAllByRole('tab')
    .map((t) => t.textContent)

/** **Tocar la pestaña activa abre sus ajustes**; una que no lo está, primero
 *  se activa. Devuelve el inspector. */
async function ajustes(nombre: string) {
  const tab = screen.getByRole('tab', { name: nombre })
  if (tab.getAttribute('aria-selected') !== 'true') await userEvent.click(tab)
  await userEvent.click(screen.getByRole('tab', { name: nombre }))
  return within(await screen.findByRole('complementary', { name: 'Ajustes de la pestaña' }))
}

describe('§7.2 · el editor pinta las pestañas en orden y editables', () => {
  it('las pestañas van como pestañas, ordenadas por `orden`', async () => {
    // El servicio las devuelve al revés a propósito: confiar en el orden del
    // arreglo es confiar en el servidor.
    servir()
    montar()
    await abrirEditor()

    expect(pestanas()).toEqual(['Resumen', 'Inventario'])
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveAttribute('aria-selected', 'true')
  })

  it('los ajustes traen nombre y pregunta como campos', async () => {
    servir()
    montar()
    await abrirEditor()

    const inspector = await ajustes('Resumen')
    expect(inspector.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Resumen')
    expect(inspector.getByRole('textbox', { name: 'Pregunta operativa' })).toHaveValue('¿Cómo vamos contra el plan?')

    const otro = await ajustes('Inventario')
    expect(otro.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Inventario')
  })

  it('escribir en el nombre CAMBIA el valor · y la pestaña lo dice', async () => {
    // «La regla de prueba es: verificar que el callback DISPARE, no que el campo
    // exista.» Un input controlado sin `onChange` cableado no acepta una letra.
    servir()
    montar()
    await abrirEditor()

    const inspector = await ajustes('Resumen')
    await userEvent.type(inspector.getByRole('textbox', { name: 'Nombre' }), ' ejecutivo')
    expect(inspector.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Resumen ejecutivo')
    expect(screen.getByRole('tab', { name: 'Resumen ejecutivo' })).toBeInTheDocument()
  })
})

describe('el inspector de la pestaña · se abre y se cierra', () => {
  it('no está hasta que se pide · «Ajustes de la pestaña» lo abre para la activa', async () => {
    servir()
    montar()
    await abrirEditor()

    expect(screen.queryByRole('complementary', { name: 'Ajustes de la pestaña' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Ajustes de la pestaña' }))
    const inspector = within(await screen.findByRole('complementary', { name: 'Ajustes de la pestaña' }))
    expect(inspector.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Resumen')
  })

  it('tocar OTRA pestaña la activa sin abrir ajustes; tocar la activa los abre', async () => {
    servir()
    montar()
    await abrirEditor()

    await userEvent.click(screen.getByRole('tab', { name: 'Inventario' }))
    expect(screen.getByRole('tab', { name: 'Inventario' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('complementary', { name: 'Ajustes de la pestaña' })).toBeNull()

    await userEvent.click(screen.getByRole('tab', { name: 'Inventario' }))
    expect(await screen.findByRole('complementary', { name: 'Ajustes de la pestaña' })).toBeInTheDocument()
  })

  it('«Cerrar» y Escape lo cierran', async () => {
    servir()
    montar()
    await abrirEditor()

    await ajustes('Resumen')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar los ajustes de la pestaña' }))
    expect(screen.queryByRole('complementary', { name: 'Ajustes de la pestaña' })).toBeNull()

    const inspector = await ajustes('Resumen')
    await userEvent.click(inspector.getByRole('textbox', { name: 'Nombre' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('complementary', { name: 'Ajustes de la pestaña' })).toBeNull()
  })
})

describe('§7.2 · la pregunta operativa es una regla, no un campo opcional', () => {
  it('la pestaña sin pregunta se marca y se CUENTA', async () => {
    servir()
    const { container } = montar()
    await abrirEditor()

    // El resumen cuenta PROBLEMAS, plegado arriba del cuerpo · `ValidationSummary`.
    expect(container.textContent).toContain('1 problema de composición')
    // Y la marca es de ESA pestaña, no de la otra.
    const inventario = await ajustes('Inventario')
    expect(inventario.getByText(/una pestaña que no contesta una pregunta no se compone/)).toBeInTheDocument()
    expect(inventario.getByRole('textbox', { name: 'Pregunta operativa' })).toHaveAttribute('aria-invalid', 'true')

    const resumen = await ajustes('Resumen')
    expect(resumen.queryByText(/no contesta una pregunta/)).toBeNull()
    expect(resumen.getByRole('textbox', { name: 'Pregunta operativa' })).not.toHaveAttribute('aria-invalid')
  })

  it('escribirla baja la cuenta a cero', async () => {
    servir()
    const { container } = montar()
    await abrirEditor()

    const inspector = await ajustes('Inventario')
    await userEvent.type(
      inspector.getByRole('textbox', { name: 'Pregunta operativa' }),
      '¿Hay stock y se está mostrando?',
    )

    await waitFor(() => expect(container.textContent).not.toContain('problema de composición'))
  })

  it('una pestaña nueva nace inválida, no lista · y con sus ajustes abiertos', async () => {
    servir()
    const { container } = montar()
    await abrirEditor()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar una pestaña' }))
    expect(container.textContent).toContain('2 problemas de composición')
    const inspector = within(screen.getByRole('complementary', { name: 'Ajustes de la pestaña' }))
    expect(inspector.getByText(/Nueva · se crea al guardar/)).toBeInTheDocument()
    expect(inspector.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Pestaña nueva')
    expect(screen.getByRole('tab', { name: 'Pestaña nueva' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('lo que el inspector no toca y sí dice', () => {
  it('declara cuántos paneles tiene la pestaña, en singular y plural de verdad', async () => {
    servir()
    montar()
    await abrirEditor()

    expect((await ajustes('Inventario')).getByText('1 panel.')).toBeInTheDocument()
    expect((await ajustes('Resumen')).getByText('0 paneles.')).toBeInTheDocument()
  })

  it('«vacío» significa TODOS los roles, y se dice · no «ninguno»', async () => {
    // Es la mitad del dato: una pestaña sin roles la ve todo el mundo.
    servir()
    montar()
    await abrirEditor()

    await ajustes('Resumen')
    expect(screen.getByRole('button', { name: 'Resumen · la ven todos los roles' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Resumen · la ve CEO' })).toHaveAttribute('aria-pressed', 'false')
    // `Inventario` declara un rol —que no es ninguno de estos dos—, así que NO
    // la ven todos.
    await ajustes('Inventario')
    expect(screen.getByRole('button', { name: 'Inventario · la ven todos los roles' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('elegir un rol en «La ven» se lo asigna a la pestaña · el callback dispara', async () => {
    // Un `Opcion` sin `onRoles` cableado se ve idéntico, así que se mira el
    // efecto: la opción queda elegida, «Todos» se apaga, y la cabecera lo cuenta.
    servir()
    montar()
    await abrirEditor()
    await ajustes('Resumen')

    await userEvent.click(screen.getByRole('button', { name: 'Resumen · la ve CEO' }))

    expect(screen.getByRole('button', { name: 'Resumen · la ve CEO' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Resumen · la ven todos los roles' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Resumen · la ve Planner' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()

    // Volver a «Todos» la deja como venía del servidor: el contador se apaga.
    await userEvent.click(screen.getByRole('button', { name: 'Resumen · la ven todos los roles' }))
    expect(screen.getByRole('button', { name: 'Resumen · la ve CEO' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText(/con cambios/)).toBeNull()
  })

  it('agregar una pestaña con un rol elegido la crea PARA ese rol', async () => {
    // D5: con el filtro en un rol, una pestaña que naciera para todos aparecería
    // igual —vacío es «todos»— y la prueba pasaría mirando sólo que esté. Se mira
    // a quién se le asignó. El rol se elige en el paso 2 de «Dashboards».
    servir()
    montar()
    await userEvent.click(await screen.findByRole('button', { name: /^Overview/ }))
    await userEvent.click(
      within(await screen.findByRole('group', { name: 'Rol' })).getByRole('button', { name: 'Planner' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Abrir el editor de Overview' }))
    await screen.findByRole('tab', { name: 'Resumen' })

    await userEvent.click(screen.getByRole('button', { name: 'Agregar una pestaña' }))

    expect(await screen.findByRole('tab', { name: 'Pestaña nueva' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pestaña nueva · la ve Planner' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Pestaña nueva · la ven todos los roles' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Pestaña nueva · la ve CEO' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('NO pinta los UUID de rol', async () => {
    servir()
    const { container } = montar()
    await abrirEditor()
    await ajustes('Inventario')

    expect(container.textContent ?? '').not.toContain('a3f1c2d4')
  })
})

describe('mover y quitar', () => {
  it('«Mover a la izquierda» reordena de verdad', async () => {
    servir()
    montar()
    await abrirEditor()
    await ajustes('Inventario')

    await userEvent.click(screen.getByRole('button', { name: 'Mover Inventario a la izquierda' }))

    expect(pestanas()).toEqual(['Inventario', 'Resumen'])
    // El inspector sigue a la pestaña que se movió, no al índice.
    const inspector = within(screen.getByRole('complementary', { name: 'Ajustes de la pestaña' }))
    expect(inspector.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Inventario')
  })

  it('los extremos no se mueven hacia afuera', async () => {
    servir()
    montar()
    await abrirEditor()
    await ajustes('Resumen')
    expect(screen.getByRole('button', { name: 'Mover Resumen a la izquierda' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mover Resumen a la derecha' })).toBeEnabled()
    await ajustes('Inventario')
    expect(screen.getByRole('button', { name: 'Mover Inventario a la derecha' })).toBeDisabled()
  })

  it('«Quitar» saca la pestaña y cierra sus ajustes', async () => {
    servir()
    montar()
    await abrirEditor()
    await ajustes('Inventario')

    await userEvent.click(screen.getByRole('button', { name: 'Quitar Inventario' }))
    await waitFor(() => expect(screen.queryByRole('tab', { name: 'Inventario' })).toBeNull())
    expect(pestanas()).toEqual(['Resumen'])
    expect(screen.queryByRole('complementary', { name: 'Ajustes de la pestaña' })).toBeNull()
  })
})

describe('el indicador de cambios sin guardar', () => {
  it('arranca limpio y cuenta PESTAÑAS al editar', async () => {
    servir()
    montar()
    await abrirEditor()

    expect(screen.queryByText(/con cambios/)).toBeNull()
    await userEvent.type((await ajustes('Resumen')).getByRole('textbox', { name: 'Nombre' }), '!')
    expect(screen.getByText('1 pestaña con cambios · se guarda solo en unos segundos')).toBeInTheDocument()
    await userEvent.type((await ajustes('Inventario')).getByRole('textbox', { name: 'Nombre' }), '!')
    expect(screen.getByText('2 pestañas con cambios · se guarda solo en unos segundos')).toBeInTheDocument()
  })

  it('el botón no desaparece: «Guardado» sin cambios, «Guardar» con cambios · D2', async () => {
    // **Era al revés hasta el 2026-10-07**: sin cambios el botón no estaba, y
    // un botón ausente se ve igual que uno roto. D2: «el guardar se debe ver
    // explícito, mostrando los estados del botón».
    servir()
    montar()
    await abrirEditor()

    expect(screen.getByRole('button', { name: 'Guardado' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
    await userEvent.type((await ajustes('Resumen')).getByRole('textbox', { name: 'Nombre' }), '!')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Guardado' })).toBeNull()
  })
})

describe('el borrador se ata a SU versión', () => {
  it('pasar a OTRO dashboard del mismo cliente no arrastra lo editado', async () => {
    // **La prueba que la mutación pidió.** Entre dos versiones del mismo
    // cliente el editor sigue en pantalla, y sin atar el borrador a su
    // `layoutId` la segunda mostraría las pestañas de la primera.
    servir()
    montar()
    await abrirEditor()

    await userEvent.type((await ajustes('Resumen')).getByRole('textbox', { name: 'Nombre' }), ' editado')
    expect(screen.getByRole('tab', { name: 'Resumen editado' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Dashboards' }))
    await abrirEditor('Medios', 'Medios')

    expect(pestanas()).toEqual(['Medios'])
    expect(screen.queryByRole('tab', { name: 'Resumen editado' })).toBeNull()
  })

  it('cambiar de cliente lo descarta y vuelve a «Dashboards»', async () => {
    // Sin atarlo, las pestañas editadas de un cliente aparecerían bajo otro.
    servir()
    montar()
    await abrirEditor()

    await userEvent.type((await ajustes('Resumen')).getByRole('textbox', { name: 'Nombre' }), ' editado')
    expect(screen.getByRole('tab', { name: 'Resumen editado' })).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Cliente' }), 't-2')
    expect(await screen.findByRole('button', { name: /^Salud/ })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Resumen editado' })).toBeNull()
    expect(screen.queryByRole('textbox', { name: 'Nombre' })).toBeNull()
  })
})

describe('§7.2 · los campos del modelo que el cable no tiene', () => {
  it('ni los anuncia ni los ofrece vacíos', async () => {
    // **Cambió el 2026-10-06** · `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`.
    // No se pinta un campo que el cable no tiene: los ajustes tienen Nombre y
    // Pregunta operativa, y nada más que se escriba.
    servir()
    const { container } = montar()
    await abrirEditor()
    const inspector = await ajustes('Resumen')

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('Cada pestaña va a poder declarar más cosas')
    expect(texto).not.toMatch(/preguntas sugeridas/i)
    expect(texto).not.toMatch(/plantilla/i)
    expect(inspector.getAllByRole('textbox')).toHaveLength(2)
  })
})
