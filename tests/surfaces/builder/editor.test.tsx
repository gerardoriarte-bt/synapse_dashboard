// @vitest-environment jsdom

/** El editor de pestañas en la pantalla · F4.8
 *
 *  Las funciones puras las cubre `borrador.test.ts`. Acá se verifica lo que solo
 *  se ve montado: **que los callbacks DISPAREN** —un botón muerto se ve igual
 *  que uno que funciona, y el spread condicional no lo detecta— y que el
 *  borrador se ate a su versión.
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

const versiones = {
  't-1': [
    { id: 'l-2', tenant_id: 't-1', status: 'draft', version_id: 'v4', published_at: null },
    // Del MISMO cliente · es la que destapa si el borrador se ata a su versión.
    { id: 'l-3', tenant_id: 't-1', status: 'draft', version_id: 'v5', published_at: null },
  ],
  't-2': [{ id: 'l-9', tenant_id: 't-2', status: 'draft', version_id: 'k1', published_at: null }],
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
 *  cable. Sin ellos `TabEditor` no pinta las opciones de «La ven», y desde el
 *  2026-10-06 son la forma en que una pestaña dice quién la ve. */
const roles = [
  { id: 'r-1', tenant_id: 't-1', name: 'CEO', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 1 },
  { id: 'r-2', tenant_id: 't-1', name: 'Planner', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 3 },
]

function servir() {
  server.use(
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(roles)),
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
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

/** B1 es el punto de entrada y el editor cuelga de ahí. */
async function abrirVersion(etiqueta = /v4/) {
  await userEvent.click(await screen.findByRole('button', { name: etiqueta }))
  await screen.findByDisplayValue('Resumen')
}

describe('§7.2 · el editor pinta las pestañas en orden y editables', () => {
  it('cada pestaña trae nombre y pregunta como campos', async () => {
    servir()
    montar()
    await abrirVersion()

    expect(screen.getByDisplayValue('Resumen')).toBeInTheDocument()
    expect(screen.getByDisplayValue('¿Cómo vamos contra el plan?')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Inventario')).toBeInTheDocument()
  })

  it('escribir en el nombre CAMBIA el valor · el callback dispara', async () => {
    // «La regla de prueba es: verificar que el callback DISPARE, no que el campo
    // exista.» Un input controlado sin `onChange` cableado se ve idéntico y no
    // acepta una letra.
    servir()
    montar()
    await abrirVersion()

    const campo = screen.getByDisplayValue('Resumen')
    await userEvent.type(campo, ' ejecutivo')
    expect(screen.getByDisplayValue('Resumen ejecutivo')).toBeInTheDocument()
  })
})

describe('§7.2 · la pregunta operativa es una regla, no un campo opcional', () => {
  it('la pestaña sin pregunta se marca y se CUENTA', async () => {
    servir()
    const { container } = montar()
    await abrirVersion()

    // Desde el 2026-10-06 el resumen cuenta PROBLEMAS, no pestañas, y vive
    // plegado arriba del cuerpo · `ValidationSummary`.
    expect(container.textContent).toContain('1 problema de composición')
    // Dos veces: junto a la pestaña y en el resumen. Las dos salen de la misma
    // corrida de `validarBorrador`, así que no pueden discrepar.
    expect(screen.getAllByText(/una pestaña que no contesta una pregunta no se compone/)).toHaveLength(2)
    // Y la marca es de ESA pestaña, no de la otra.
    const fila = screen.getByDisplayValue('Inventario').closest('li') as HTMLElement
    expect(within(fila).getByText(/no contesta una pregunta/)).toBeInTheDocument()
    expect(within(fila).getByLabelText('Pregunta operativa')).toHaveAttribute('aria-invalid', 'true')
  })

  it('escribirla baja la cuenta a cero', async () => {
    servir()
    const { container } = montar()
    await abrirVersion()

    const fila = screen.getByDisplayValue('Inventario').closest('li')
    await userEvent.type(
      within(fila as HTMLElement).getByLabelText('Pregunta operativa'),
      '¿Hay stock y se está mostrando?',
    )

    await waitFor(() =>
      expect(container.textContent).not.toContain('problema de composición'),
    )
  })

  it('una pestaña nueva nace inválida, no lista', async () => {
    servir()
    const { container } = montar()
    await abrirVersion()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar pestaña' }))
    expect(container.textContent).toContain('2 problemas de composición')
    expect(screen.getByText(/Nueva · se crea al guardar/)).toBeInTheDocument()
  })
})

describe('lo que el editor no toca y sí viaja', () => {
  it('declara cuántos paneles tiene cada pestaña', async () => {
    // **Cambió el 2026-10-06** · auditoría §2.3 y D1–D2: la tarjeta ya no lista
    // los paneles ni dice «se conservan al guardar», porque configurarlos se
    // mudó al inspector del canvas. Lo que queda es el conteo, en singular y
    // plural de verdad —«1 panel», no «1 panel(es)»—.
    servir()
    montar()
    await abrirVersion()

    const inventario = screen.getByDisplayValue('Inventario').closest('li') as HTMLElement
    expect(within(inventario).getByText('1 panel')).toBeInTheDocument()
    const resumen = screen.getByDisplayValue('Resumen').closest('li') as HTMLElement
    expect(within(resumen).getByText('0 paneles')).toBeInTheDocument()
    // Y no ofrece agregar paneles acá: eso es del lienzo.
    expect(screen.queryByRole('button', { name: /Agregar panel/ })).toBeNull()
  })

  it('«vacío» significa TODOS los roles, y se dice · no «ninguno»', async () => {
    // Es la mitad del dato: una pestaña sin roles la ve todo el mundo, y
    // «ninguno» diría lo contrario. Desde el 2026-10-06 se dice con la opción
    // «Todos los roles» elegida en «La ven».
    servir()
    montar()
    await abrirVersion()

    expect(screen.getByRole('button', { name: 'Resumen · la ven todos los roles' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Resumen · la ve CEO' })).toHaveAttribute('aria-pressed', 'false')
    // `Inventario` declara un rol —que no es ninguno de estos dos—, así que NO
    // la ven todos.
    expect(screen.getByRole('button', { name: 'Inventario · la ven todos los roles' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('elegir un rol en «La ven» se lo asigna a la pestaña · el callback dispara', async () => {
    // **Nuevo el 2026-10-06** · D5. Un `Opcion` sin `onRoles` cableado se ve
    // idéntico, así que se mira el efecto: la opción queda elegida, «Todos» se
    // apaga, y el contador del chrome lo cuenta como cambio sin guardar.
    servir()
    montar()
    await abrirVersion()

    await userEvent.click(screen.getByRole('button', { name: 'Resumen · la ve CEO' }))

    expect(screen.getByRole('button', { name: 'Resumen · la ve CEO' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Resumen · la ven todos los roles' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Resumen · la ve Planner' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('1 pestaña con cambios sin guardar')).toBeInTheDocument()

    // Volver a «Todos» la deja como venía del servidor: el contador se apaga.
    await userEvent.click(screen.getByRole('button', { name: 'Resumen · la ven todos los roles' }))
    expect(screen.getByRole('button', { name: 'Resumen · la ve CEO' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText(/con cambios sin guardar/)).toBeNull()
  })

  it('agregar una pestaña con un rol filtrado la crea PARA ese rol', async () => {
    // **Nuevo el 2026-10-06** · D5: con el filtro en un rol, una pestaña nueva
    // que naciera para todos aparecería igual —vacío es «todos»— y la prueba
    // pasaría mirando sólo que esté. Se mira a quién se le asignó.
    servir()
    montar()
    await abrirVersion()

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Rol' })).getByRole('button', { name: 'Planner' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Agregar pestaña' }))

    expect(await screen.findByDisplayValue('Pestaña nueva')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pestaña nueva · la ve Planner' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Pestaña nueva · la ven todos los roles' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Pestaña nueva · la ve CEO' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('NO pinta los UUID de rol', async () => {
    servir()
    const { container } = montar()
    await abrirVersion()

    expect(container.textContent ?? '').not.toContain('a3f1c2d4')
  })
})

describe('mover y quitar', () => {
  it('«Subir» reordena de verdad', async () => {
    servir()
    const { container } = montar()
    await abrirVersion()

    await userEvent.click(screen.getByRole('button', { name: 'Subir Inventario' }))

    const nombres = Array.from(container.querySelectorAll('li input')).map(
      (i) => (i as HTMLInputElement).value,
    )
    expect(nombres[0]).toBe('Inventario')
  })

  it('«Subir» está deshabilitado en la primera', async () => {
    servir()
    montar()
    await abrirVersion()
    expect(screen.getByRole('button', { name: 'Subir Resumen' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bajar Inventario' })).toBeDisabled()
  })

  it('«Quitar» saca la pestaña', async () => {
    servir()
    montar()
    await abrirVersion()

    await userEvent.click(screen.getByRole('button', { name: 'Quitar Inventario' }))
    await waitFor(() => expect(screen.queryByDisplayValue('Inventario')).toBeNull())
    expect(screen.getByDisplayValue('Resumen')).toBeInTheDocument()
  })
})

describe('el indicador de cambios sin guardar', () => {
  it('arranca limpio y se ensucia al editar', async () => {
    servir()
    montar()
    await abrirVersion()

    // Desde el 2026-10-06 el contador cuenta PESTAÑAS con cambios, en frase.
    expect(screen.queryByText(/con cambios sin guardar/)).toBeNull()
    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    expect(screen.getByText('1 pestaña con cambios sin guardar')).toBeInTheDocument()
    await userEvent.type(screen.getByDisplayValue('Inventario'), '!')
    expect(screen.getByText('2 pestañas con cambios sin guardar')).toBeInTheDocument()
  })

  it('guardar está deshabilitado mientras no haya cambios · F4.13', async () => {
    // §7.2 B2: «guardado explícito». Sin cambios no hay nada que mandar, y un
    // PUT de reemplazo completo sobre lo mismo toca `updated_at` de todo.
    servir()
    montar()
    await abrirVersion()

    // **Ausente sin cambios, presente con cambios.** Un botón deshabilitado y
    // uno ausente dicen cosas distintas; acá no hay nada que mandar.
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })
})

describe('el borrador se ata a SU versión', () => {
  it('cambiar a OTRA VERSIÓN del mismo cliente no arrastra lo editado', async () => {
    // **La prueba que la mutación pidió.** Cambiar de cliente no alcanzaba: ahí
    // la versión se limpia a `null`, el detalle vuelve `undefined` y el editor
    // desaparece entero, así que pasaba con o sin la atadura. Entre dos
    // versiones del mismo cliente el editor sigue en pantalla, y sin atar el
    // borrador a su `layoutId` la segunda mostraría las pestañas de la primera.
    servir()
    montar()
    await abrirVersion()

    await userEvent.type(screen.getByDisplayValue('Resumen'), ' editado')
    expect(screen.getByDisplayValue('Resumen editado')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /v5/ }))

    expect(await screen.findByDisplayValue('Medios')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Resumen editado')).toBeNull()
  })

  it('cambiar de cliente lo descarta', async () => {
    // Sin atarlo, las pestañas editadas de un cliente aparecerían bajo otro.
    servir()
    montar()
    await abrirVersion()

    await userEvent.type(screen.getByDisplayValue('Resumen'), ' editado')
    expect(screen.getByDisplayValue('Resumen editado')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Cliente' }), 't-2')
    await waitFor(() => expect(screen.queryByDisplayValue('Resumen editado')).toBeNull())
  })
})

describe('§7.2 · los campos del modelo que el cable no tiene', () => {
  it('ni los anuncia ni los ofrece vacíos', async () => {
    // **Cambió el 2026-10-06** · `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`.
    // Esta prueba exigía el bloque «Cada pestaña va a poder declarar más cosas»
    // —preguntas sugeridas, plantilla—. Era una nota del plan dicha al usuario y
    // se quitó. La mitad que sigue en pie es la otra: no se pinta un campo que
    // el cable no tiene. La tarjeta tiene Nombre y Pregunta operativa, y nada más.
    servir()
    const { container } = montar()
    await abrirVersion()

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('Cada pestaña va a poder declarar más cosas')
    expect(texto).not.toMatch(/preguntas sugeridas/i)
    expect(texto).not.toMatch(/plantilla/i)
    const fila = screen.getByDisplayValue('Resumen').closest('li') as HTMLElement
    expect(within(fila).getAllByRole('textbox')).toHaveLength(2)
  })
})
