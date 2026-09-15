// @vitest-environment jsdom

/** El editor de pestañas en la pantalla · F4.8
 *
 *  Las funciones puras las cubre `borrador.test.ts`. Acá se verifica lo que solo
 *  se ve montado: **que los callbacks DISPAREN** —un botón muerto se ve igual
 *  que uno que funciona, y el spread condicional no lo detecta— y que el
 *  borrador se ate a su versión.
 */
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
    { ID: 'l-2', TenantID: 't-1', Status: 'draft', VersionID: 'v4', PublishedAt: null },
    // Del MISMO cliente · es la que destapa si el borrador se ata a su versión.
    { ID: 'l-3', TenantID: 't-1', Status: 'draft', VersionID: 'v5', PublishedAt: null },
  ],
  't-2': [{ ID: 'l-9', TenantID: 't-2', Status: 'draft', VersionID: 'k1', PublishedAt: null }],
}

/** Del cable, en PascalCase · `contracts/synapse-admin-wire.yaml`. */
const detalles: Record<string, unknown> = {
  'l-2': {
    layout: versiones['t-1'][0],
    tabs: [
      {
        tab: {
          ID: 'tab-b',
          LayoutVersionID: 'l-2',
          Name: 'Inventario',
          OperationalQuestion: '',
          SortOrder: 2,
          RoleIDs: ['a3f1c2d4-0000-0000-0000-00000000dead'],
        },
        panels: [
          { ID: 'p-1', TabID: 'tab-b', MetricID: 'm-1', Type: 'kpi', ColStart: 1, ColSpan: 3, RowSpan: 4 },
        ],
      },
      {
        tab: {
          ID: 'tab-a',
          LayoutVersionID: 'l-2',
          Name: 'Resumen',
          OperationalQuestion: '¿Cómo vamos contra el plan?',
          SortOrder: 1,
          RoleIDs: [],
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
          ID: 'tab-c',
          LayoutVersionID: 'l-3',
          Name: 'Medios',
          OperationalQuestion: '¿El gasto está rindiendo?',
          SortOrder: 1,
          RoleIDs: [],
        },
        panels: [],
      },
    ],
  },
  'l-9': { layout: versiones['t-2'][0], tabs: [] },
}

function servir() {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/layouts`, ({ params }) =>
      ok(versiones[params['id'] as keyof typeof versiones] ?? []),
    ),
    http.get(`${API}/admin/layouts/:id`, ({ params }) => ok(detalles[params['id'] as string])),
  )
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Builder />
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

    expect(container.textContent).toContain('1 pestaña(s) no se pueden componer')
    expect(screen.getByText(/una pestaña que no contesta una pregunta no se compone/)).toBeInTheDocument()
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
      expect(container.textContent).not.toContain('no se pueden componer'),
    )
  })

  it('una pestaña nueva nace inválida, no lista', async () => {
    servir()
    const { container } = montar()
    await abrirVersion()

    await userEvent.click(screen.getByRole('button', { name: 'Agregar pestaña' }))
    expect(container.textContent).toContain('2 pestaña(s) no se pueden componer')
    expect(screen.getByText(/Nueva · se crea al guardar/)).toBeInTheDocument()
  })
})

describe('lo que el editor no toca y sí viaja', () => {
  it('declara paneles y roles por pestaña · el PUT los borraría', async () => {
    // Renombrar manda el layout entero. Decirlo evita la lectura de que «quitar»
    // es lo único que borra algo.
    servir()
    montar()
    await abrirVersion()

    const fila = screen.getByDisplayValue('Inventario').closest('li')
    expect(within(fila as HTMLElement).getByText(/1 panel\(es\)/)).toBeInTheDocument()
    expect(within(fila as HTMLElement).getByText(/se conservan al guardar/)).toBeInTheDocument()
  })

  it('«vacío» significa TODOS los roles, y se dice · no «ninguno»', async () => {
    // Es la mitad del dato: una pestaña sin roles la ve todo el mundo, y
    // «ninguno» diría lo contrario.
    servir()
    montar()
    await abrirVersion()

    const fila = screen.getByDisplayValue('Resumen').closest('li')
    expect(within(fila as HTMLElement).getByText(/todos los roles/i)).toBeInTheDocument()
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

    expect(screen.getByText('Sin cambios')).toBeInTheDocument()
    await userEvent.type(screen.getByDisplayValue('Resumen'), '!')
    expect(screen.getByText('Sin guardar')).toBeInTheDocument()
  })

  it('declara que guardar todavía no existe', async () => {
    // Un botón «Guardar» que no llama a nada es peor que uno ausente.
    servir()
    const { container } = montar()
    await abrirVersion()

    expect(screen.queryByRole('button', { name: /^Guardar/ })).toBeNull()
    expect(container.textContent).toContain('este borrador vive solo en la pantalla')
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

    await userEvent.selectOptions(screen.getByLabelText('Cliente'), 't-2')
    await waitFor(() => expect(screen.queryByDisplayValue('Resumen editado')).toBeNull())
  })
})

describe('§7.2 · los campos del modelo que el cable no tiene', () => {
  it('declara los tres en vez de ofrecerlos vacíos', async () => {
    servir()
    const { container } = montar()
    await abrirVersion()

    const texto = container.textContent ?? ''
    expect(texto).toContain('Faltan 3 campos')
    expect(texto).toContain('chatSugerencias')
    expect(texto).toContain('heredadaDe')
  })
})
