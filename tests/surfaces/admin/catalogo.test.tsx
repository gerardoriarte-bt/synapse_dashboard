// @vitest-environment jsdom

/** A4 · Catálogo de métricas · F4.5
 *
 *  **Las pruebas citan §7.3 de `design.md`, no miran la implementación.** Y la
 *  mitad que importa acá no es que la tabla pinte: es que **no pinte los dos
 *  campos que el adaptador rellena**. `ventana` sale cadena vacía y `estado` sale
 *  `DISPONIBLE` fijo, los dos para satisfacer el contrato; pintarlos compilaría,
 *  se vería bien y sería mentira.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [
  { id: 't-1', name: 'Under Armour México' },
  { id: 't-2', name: 'Keralty Colombia' },
]

/** Escritas desde `CatalogMetric` de `contracts/synapse-admin-wire.yaml`, no de
 *  memoria: es snake_case, `layer` va en mayúsculas y `semantic_direction` es
 *  TEXTO ya redactado —«HIGHER = BETTER»— y no un código · F1.39. */
const metricas = [
  {
    id: 'm-1',
    tenant_id: 't-1',
    key: 'revenue',
    name: 'Ventas',
    shape: 'scalar',
    family: 'demand',
    layer: 'GOLD',
    source: 'ERP + Analítica de sitio',
    base: '312 SKU críticos',
    min_grain: 'day',
    dimensions: ['canal'],
    semantic_direction: 'HIGHER = BETTER',
    catalog_version: 4,
  },
  {
    id: 'm-2',
    tenant_id: 't-1',
    key: 'inv_riesgo',
    name: 'Venta diaria en riesgo',
    shape: 'ranking',
    family: 'inventory',
    layer: 'SILVER',
    source: 'ERP',
    base: '18.240 SKU activos',
    min_grain: 'month',
    dimensions: [],
    semantic_direction: null,
    catalog_version: 4,
  },
]

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Admin />
    </QueryClientProvider>,
  )
}

/** A4 es de alcance `tenant`, así que se llega por la navegación del chrome. */
async function abrirCatalogo() {
  await screen.findByText('Under Armour México')
  await userEvent.click(screen.getByRole('button', { name: 'Catálogo de métricas' }))
}

function conCatalogo(rows: unknown[] = metricas) {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(rows)),
  )
}

describe('§7.3 · el inventario de lo que la plataforma puede afirmar', () => {
  it('lista cada métrica con los campos que el cable sí sostiene', async () => {
    conCatalogo()
    montar()
    await abrirCatalogo()

    expect(await screen.findByText('Ventas')).toBeInTheDocument()
    expect(screen.getByText('Venta diaria en riesgo')).toBeInTheDocument()

    // Los cuatro de los ocho que §7.3 pide y el cable trae. Adaptados: el cable
    // manda `scalar`/`demand`/`GOLD` y el contrato declara `escalar`/`demanda`/`GOLD`.
    const fila = screen.getByText('Ventas').closest('tr')
    expect(fila).not.toBeNull()
    const celdas = within(fila as HTMLElement)
    expect(celdas.getByText('escalar')).toBeInTheDocument()
    expect(celdas.getByText('GOLD')).toBeInTheDocument()
    expect(celdas.getByText('ERP + Analítica de sitio')).toBeInTheDocument()
    // Texto ya redactado, pasa tal cual · el front no lo traduce.
    expect(celdas.getByText('HIGHER = BETTER')).toBeInTheDocument()
  })

  it('una métrica sin dirección semántica muestra el hueco, no una inventada', async () => {
    conCatalogo()
    montar()
    await abrirCatalogo()

    const fila = (await screen.findByText('Venta diaria en riesgo')).closest('tr')
    expect(within(fila as HTMLElement).getByText('—')).toBeInTheDocument()
  })

  it('declara el ORIGEN de cada columna · derivado o editorial', async () => {
    // §7.3 PS-13: «sincronizar y editar no compiten: cada campo tiene un solo
    // dueño», y A4 muestra los derivados con su origen. Un campo derivado y uno
    // editorial se ven igual; la diferencia es qué les pasa en el próximo sync.
    conCatalogo()
    const { container } = montar()
    await abrirCatalogo()
    await screen.findByText('Ventas')

    const encabezado = container.querySelector('thead')
    expect(encabezado).not.toBeNull()
    const texto = (encabezado?.textContent ?? '').toLowerCase()
    expect(texto).toContain('derivado')
    expect(texto).toContain('editorial')
  })
})

describe('§7.3 · los cuatro campos que la pantalla NO puede afirmar', () => {
  it('NO pinta el `estado`, que el adaptador rellena con DISPONIBLE', async () => {
    // **La prueba que sostiene F4.5.** `adaptCatalog` escribe `estado:
    // 'DISPONIBLE'` fijo porque el contrato lo exige y el cable no lo trae. El
    // tipo dice que está, compila, y tiene valor: pintarlo diría «verificado»
    // sobre algo que nadie verificó. Con él se cae el filtro por estado.
    conCatalogo()
    const { container } = montar()
    await abrirCatalogo()
    await screen.findByText('Ventas')

    // **El alcance de la aserción es la TABLA, no la pantalla**: el bloque de
    // ausentes sí nombra `DISPONIBLE`, y tiene que hacerlo — es lo que explica
    // por qué el campo no está. Lo que no puede existir es una celda con ese
    // valor, que es lo que se leería como dato.
    const tabla = container.querySelector('table')
    expect(tabla).not.toBeNull()
    expect(tabla?.textContent ?? '').not.toContain('DISPONIBLE')
    expect((tabla?.textContent ?? '').toLowerCase()).not.toContain('disponible')
  })

  it('NO pinta la `ventana`, que el adaptador deja en cadena vacía', async () => {
    // Una columna «Ventana» con dos celdas en blanco se lee como «esta métrica
    // no tiene ventana», que es falso: no la trae el cable · B1.17 y B1.25.
    conCatalogo()
    const { container } = montar()
    await abrirCatalogo()
    await screen.findByText('Ventas')

    const encabezado = (container.querySelector('thead')?.textContent ?? '').toLowerCase()
    expect(encabezado).not.toContain('ventana')
    expect(encabezado).not.toContain('frescura')
    expect(encabezado).not.toContain('estado')
  })

  it('los declara ausentes con su razón y qué los desbloquea · §8', async () => {
    conCatalogo()
    const { container } = montar()
    await abrirCatalogo()
    await screen.findByText('Ventas')

    const texto = container.textContent ?? ''
    expect(texto).toContain('Faltan 3 datos')
    for (const campo of ['Frescura', 'Ventana', 'Estado']) {
      expect(texto).toContain(campo)
    }
    expect(texto).toContain('B1.17')
    expect(texto).toContain('B1.25')
    // **«En cuántos paneles se usa» salió de la lista el 2026-09-15**: la
    // columna `USO` lo cuenta sobre el layout publicado. Es el único de los
    // cuatro que dejó de faltar.
    expect(texto).not.toContain('En cuántos paneles se usa · contarlo')
    expect(texto).toContain('del layout publicado')
  })

  it('declara que la acción de sincronizar no existe como ruta', async () => {
    // §7.3 pide «acción de sincronizar desde el modelo semántico». Ninguna de
    // las seis rutas de `synapse-admin-wire.yaml` la expone. Un botón que no
    // llama a nada es peor que uno ausente.
    conCatalogo()
    const { container } = montar()
    await abrirCatalogo()
    await screen.findByText('Ventas')

    expect(screen.queryByRole('button', { name: /sincronizar/i })).toBeNull()
    expect((container.textContent ?? '').toLowerCase()).toContain('sincronizar')
  })
})

describe('§7.3 · el filtro', () => {
  it('filtra por capa y dice que NO es el filtro por estado que el diseño pide', async () => {
    conCatalogo()
    const { container } = montar()
    await abrirCatalogo()
    await screen.findByText('Ventas')

    expect((container.textContent ?? '').toLowerCase()).toContain(
      'el filtro por estado no se puede ofrecer',
    )

    // Y filtra de verdad: un `select` que no filtra se ve igual que uno que sí.
    await userEvent.selectOptions(screen.getByLabelText('Capa'), 'SILVER')
    await waitFor(() => expect(screen.queryByText('Ventas')).toBeNull())
    expect(screen.getByText('Venta diaria en riesgo')).toBeInTheDocument()
    expect(screen.getByText('1 de 2 métricas')).toBeInTheDocument()
  })
})

describe('las métricas que no se pueden componer', () => {
  it('se nombran con su razón en vez de desaparecer', async () => {
    // §1 principio 6. En el builder importa más que en la consola: una forma
    // fuera del enumerado no solo no se dibuja, tampoco se puede asignar.
    conCatalogo([
      ...metricas,
      { ...metricas[0], id: 'm-3', key: 'sankey_raro', name: 'Flujo', shape: 'sankey' },
    ])
    const { container } = montar()
    await abrirCatalogo()
    await screen.findByText('Ventas')

    const texto = container.textContent ?? ''
    expect(texto).toContain('sankey_raro')
    expect(texto).toContain('sankey')
    expect(texto).toContain('no se pueden componer')
    // Y no entra a la tabla.
    expect(screen.queryByText('Flujo')).toBeNull()
  })
})

describe('§7.3 · la regla dura también acá', () => {
  it('no muestra vocabulario de infraestructura aunque el cable lo mande', async () => {
    // `additionalProperties: true` en el wire: el servicio puede mandar de más.
    conCatalogo([
      {
        ...metricas[0],
        snowflake_view: 'VW_ECOMM_DAILY_SOT',
        warehouse: 'SYNAPSE_WH',
        grant_role: 'SYNAPSE_ROLE',
      },
    ])
    const { container } = montar()
    await abrirCatalogo()
    await screen.findByText('Ventas')

    const texto = (container.textContent ?? '').toLowerCase()
    for (const prohibido of ['snowflake_view', 'warehouse', 'grant', 'vw_ecomm']) {
      expect(texto).not.toContain(prohibido)
    }
  })
})

describe('los estados de A4 · §8', () => {
  it('un catálogo vacío invita a actuar y nombra la sincronización', async () => {
    conCatalogo([])
    montar()
    await abrirCatalogo()

    expect(await screen.findByText(/no tiene métricas en el catálogo/i)).toBeInTheDocument()
    expect(screen.getByText(/B1.18/)).toBeInTheDocument()
  })

  it('un 403 nombra el rol que falta, no «error del sistema»', async () => {
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(
        `${API}/admin/tenants/:id/catalog`,
        () =>
          new HttpResponse(JSON.stringify({ success: false, error: 'forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )
    montar()
    await abrirCatalogo()

    expect(await screen.findByText(/pide rol de administrador/i)).toBeInTheDocument()
  })

  it('el chrome sigue en pie cuando el catálogo falla', async () => {
    // Misma regla que «un estado reemplaza el cuerpo, nunca el shell»: el
    // selector de cliente y la navegación tienen que seguir ahí para poder
    // probar con otro tenant.
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(
        `${API}/admin/tenants/:id/catalog`,
        () =>
          new HttpResponse(JSON.stringify({ success: false, error: 'boom' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )
    montar()
    await abrirCatalogo()

    await screen.findByText(/No se pudo cargar el catálogo/i)
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clientes y plataforma' })).toBeInTheDocument()
  })
})
