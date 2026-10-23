// @vitest-environment jsdom

/** La llave de servicio y el warehouse de cada agente · A2 · F5.56, 2026-10-23
 *
 *  **Los fixtures salen de lo medido contra `26eae4b` ese día**, sobre un
 *  cliente y un agente de prueba en la base local: `GET service-key` sin llave
 *  da 404 `NOT_FOUND_KEY`, `POST` da 201 con `public_key_pem`, `fingerprint` y
 *  `generated_at`, y el `PUT` del agente devuelve `AgentAdminDTO` con el
 *  `warehouse` tal como llegó —sin recortar—.
 *
 *  **Lo que se prueba es lo que puede fallar viéndose bien**: que un admin de
 *  cliente ni siquiera PIDA la llave, que reemplazar exija confirmación y mande
 *  `rotate`, que lo que se copia sea la pública SIN delimitadores, y que el
 *  warehouse viaje recortado y al agente correcto.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { LlaveDeServicio } from '@/surfaces/admin/LlaveDeServicio'
import { adaptarLlave, adminApi } from '@/api/admin'
import { context, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [
  {
    id: 't-2', name: 'Keralty Colombia', label: '',
    locale: 'es-CO', currency: 'COP', timezone: 'America/Bogota',
    user_count: 0, last_published_at: null,
    worst_feed_status: 'unknown', worst_feed_freshness_hours: null,
    status: null, vertical: null, created_at: '2026-09-25T10:00:00Z',
  },
]

/** Recortada: la medida tiene seis líneas de cuerpo. */
const PEM = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsXS80Fna5gWqaEulwVQx\nW//Coe1jvD1l53Cx9B1ZJHPPGTZKAUWMXBoHvXf+KCmxmrdRobTBLvlJhYlQOrOt\nsQIDAQAB\n-----END PUBLIC KEY-----\n'
const CUERPO = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsXS80Fna5gWqaEulwVQxW//Coe1jvD1l53Cx9B1ZJHPPGTZKAUWMXBoHvXf+KCmxmrdRobTBLvlJhYlQOrOtsQIDAQAB'
const HUELLA_VIEJA = 'SHA256:XqagUSTIe+N32SCXvMqWiTClL8qXxBKFvxV4Ojmnk6A='
const HUELLA_NUEVA = 'SHA256:NCkdx8F8mIPMNog/pB+nOuuzO7Edj4xIw8yUFmc0Qwk='

/** `AgentAdminDTO` como lo devolvió el alta del agente de prueba. */
function agente(id: string, nombre: string, rol: string, warehouse: string) {
  return {
    id, tenant_id: 't-2', name: nombre, target_role: rol,
    snowflake_db: 'DB_HNO_KERALTY', snowflake_schema: 'HNO_KY_MART_ANALYTICS',
    snowflake_cortex_agent_name: 'AG_X', warehouse, semantic_views: [],
    system_prompt_base: '', is_active: true,
    created_at: '2026-10-23T10:28:13Z', updated_at: '2026-10-23T10:28:13Z',
  }
}

function base(alcance: 'plataforma' | 'usuario', conLlave: boolean) {
  const red = { lecturasDeLlave: 0, lecturasDeAgentes: 0, generaciones: [] as unknown[], cambios: [] as { agentId: string; cuerpo: unknown }[] }
  let llave = conLlave
  const warehouses: Record<string, string> = { 'a-1': 'WH_BT_UA_BI', 'a-2': 'WH_BT_UA_BI' }
  server.use(
    http.get(`${API}/config/me`, () =>
      ok({
        ...context,
        scope:
          alcance === 'plataforma'
            ? { kind: 'multi_tenant', tenants: [{ id: 't-2', name: 'Keralty Colombia', label: '' }] }
            : context.scope,
      }),
    ),
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () =>
      ok([{ id: 'r-1', tenant_id: 't-2', name: 'admin', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 0 }]),
    ),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/agents`, () => {
      red.lecturasDeAgentes += 1
      return ok([
        agente('a-1', 'Synapse Keralty', 'admin', warehouses['a-1'] ?? ''),
        agente('a-2', 'Synapse Keralty Planner', 'planner', warehouses['a-2'] ?? ''),
      ])
    }),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/feeds`, () => ok([])),
    http.get(`${API}/admin/users`, () => ok({ users: [], total: 0, tenants: 0 })),
    http.get(`${API}/admin/tenants/:id/service-key`, () => {
      red.lecturasDeLlave += 1
      return llave
        ? ok({ public_key_pem: PEM, fingerprint: HUELLA_VIEJA })
        : HttpResponse.json({ success: false, error: 'el tenant no tiene clave de servicio', code: 'NOT_FOUND_KEY' }, { status: 404 })
    }),
    http.post(`${API}/admin/tenants/:id/service-key`, async ({ request }) => {
      red.generaciones.push(await request.json())
      llave = true
      return HttpResponse.json(
        { success: true, data: { public_key_pem: PEM, fingerprint: HUELLA_NUEVA, generated_at: '2026-10-23T15:27:58Z' } },
        { status: 201 },
      )
    }),
    http.put(`${API}/admin/tenants/:id/agents/:agentId`, async ({ request, params }) => {
      const cuerpo = (await request.json()) as { warehouse: string }
      const agentId = String(params.agentId)
      red.cambios.push({ agentId, cuerpo })
      warehouses[agentId] = cuerpo.warehouse
      return ok(agente(agentId, 'Synapse Keralty Planner', 'planner', cuerpo.warehouse))
    }),
  )
  return red
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function abrirFicha() {
  await userEvent.click(await screen.findByRole('button', { name: /^Keralty Colombia · / }))
  await screen.findByRole('navigation', { name: 'Migaja' })
  await screen.findByRole('button', { name: 'Verificar ahora' })
}

describe('§7.3 · quién la ve', () => {
  it('un admin de UN cliente no ve la llave ni el warehouse, y NI SIQUIERA se piden', async () => {
    const red = base('usuario', true)
    montar()
    await abrirFicha()
    expect(screen.queryByRole('region', { name: 'Llave de servicio' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Almacén virtual de cada agente' })).toBeNull()
    expect(red.lecturasDeLlave).toBe(0)
    // **Una sola lectura de agentes**, la de la ficha. La del warehouse es la
    // misma ruta con otra clave de cache, y para él no se pide.
    await waitFor(() => expect(red.lecturasDeAgentes).toBe(1))
    await new Promise((listo) => setTimeout(listo, 50))
    expect(red.lecturasDeAgentes).toBe(1)
  })

  it('con alcance de plataforma se ven, en el orden en que se cambia de usuario', async () => {
    base('plataforma', true)
    montar()
    await abrirFicha()
    const llave = await screen.findByRole('region', { name: 'Llave de servicio' })
    const conexion = screen.getByRole('region', { name: 'Conexión del equipo interno' })
    const warehouse = screen.getByRole('region', { name: 'Almacén virtual de cada agente' })
    // La llave antes que el usuario, y el warehouse al final.
    expect(llave.compareDocumentPosition(conexion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(conexion.compareDocumentPosition(warehouse) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('la llave', () => {
  it('sin llave se genera SIN rotate, y aparece la pública para registrar', async () => {
    const red = base('plataforma', false)
    montar()
    await abrirFicha()
    const seccion = await screen.findByRole('region', { name: 'Llave de servicio' })
    expect(await within(seccion).findByText('Este cliente no tiene llave.')).toBeVisible()

    await userEvent.click(within(seccion).getByRole('button', { name: 'Generar llave' }))
    await waitFor(() => expect(red.generaciones).toEqual([{ rotate: false }]))
    expect(await within(seccion).findByText(HUELLA_NUEVA)).toBeVisible()
    expect(within(seccion).getByRole('textbox', { name: /^Pública, para registrar/ })).toHaveValue(CUERPO)
  })

  it('reemplazar pide confirmación, cancelar no manda nada, y confirmar manda rotate', async () => {
    const red = base('plataforma', true)
    montar()
    await abrirFicha()
    const seccion = await screen.findByRole('region', { name: 'Llave de servicio' })
    expect(await within(seccion).findByText(HUELLA_VIEJA)).toBeVisible()

    await userEvent.click(within(seccion).getByRole('button', { name: 'Reemplazar la llave' }))
    expect(within(seccion).getByText(/deja al cliente sin conexión/)).toBeVisible()
    await userEvent.click(within(seccion).getByRole('button', { name: 'Cancelar' }))
    expect(red.generaciones).toEqual([])

    await userEvent.click(within(seccion).getByRole('button', { name: 'Reemplazar la llave' }))
    await userEvent.click(within(seccion).getByRole('button', { name: 'Sí, reemplazar' }))
    await waitFor(() => expect(red.generaciones).toEqual([{ rotate: true }]))
    expect(await within(seccion).findByText(HUELLA_NUEVA)).toBeVisible()
    // Y la confirmación se cerró: era de la llave anterior.
    expect(within(seccion).queryByRole('button', { name: 'Sí, reemplazar' })).toBeNull()
  })

  it('copiar copia la pública SIN delimitadores', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(
      <LlaveDeServicio
        llave={adaptarLlave({ public_key_pem: PEM, fingerprint: HUELLA_VIEJA })}
        errorDeLectura={null}
        generando={false}
        error={null}
        onGenerar={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Copiar la pública' }))
    expect(writeText).toHaveBeenCalledWith(CUERPO)
    expect(await screen.findByRole('button', { name: 'Copiada' })).toBeVisible()
  })

  it('una lectura que falla NO se lee como «sin llave»', () => {
    render(
      <LlaveDeServicio llave={undefined} errorDeLectura="El servicio respondió 500" generando={false} error={null} onGenerar={vi.fn()} />,
    )
    expect(screen.getByText(/No se pudo leer la llave/)).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Generar llave' })).toBeNull()
  })
})

describe('el warehouse', () => {
  it('viaja recortado, al agente correcto, y la lista se relee', async () => {
    const red = base('plataforma', true)
    montar()
    await abrirFicha()
    const seccion = await screen.findByRole('region', { name: 'Almacén virtual de cada agente' })
    expect(await within(seccion).findAllByText('Hoy usa WH_BT_UA_BI.')).toHaveLength(2)

    const campo = within(seccion).getByRole('textbox', { name: 'Nuevo para Synapse Keralty Planner' })
    await userEvent.type(campo, '  WH_HNO_KY_BI ')
    const fila = campo.closest('li') as HTMLElement
    await userEvent.click(within(fila).getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(red.cambios).toEqual([{ agentId: 'a-2', cuerpo: { warehouse: 'WH_HNO_KY_BI' } }]))
    expect(await within(fila).findByText('Hoy usa WH_HNO_KY_BI.')).toBeVisible()
    expect(within(seccion).getByRole('textbox', { name: 'Nuevo para Synapse Keralty Planner' })).toHaveValue('')
  })

  it('en blanco o igual al actual no se puede guardar', async () => {
    base('plataforma', true)
    montar()
    await abrirFicha()
    const seccion = await screen.findByRole('region', { name: 'Almacén virtual de cada agente' })
    const campo = await within(seccion).findByRole('textbox', { name: 'Nuevo para Synapse Keralty' })
    const fila = campo.closest('li') as HTMLElement
    expect(within(fila).getByRole('button', { name: 'Guardar' })).toBeDisabled()
    await userEvent.type(campo, '   ')
    expect(within(fila).getByRole('button', { name: 'Guardar' })).toBeDisabled()
    await userEvent.clear(campo)
    await userEvent.type(campo, 'WH_BT_UA_BI')
    expect(within(fila).getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })
})

describe('la frontera · api/admin', () => {
  it('editarWarehouse no manda un valor en blanco: el servicio lo aceptaría', async () => {
    let llamadas = 0
    server.use(
      http.put(`${API}/admin/tenants/:id/agents/:agentId`, () => {
        llamadas += 1
        return ok(agente('a-1', 'x', 'admin', ''))
      }),
    )
    await expect(adminApi.editarWarehouse('t-2', 'a-1', '   ')).rejects.toThrow(/no puede ir vacío/)
    expect(llamadas).toBe(0)
  })

  it('editarWarehouse recorta: el servicio guardaría los espacios', async () => {
    let cuerpo: unknown = null
    server.use(
      http.put(`${API}/admin/tenants/:id/agents/:agentId`, async ({ request }) => {
        cuerpo = await request.json()
        return ok(agente('a-1', 'x', 'admin', 'WH_HNO_KY_BI'))
      }),
    )
    await adminApi.editarWarehouse('t-2', 'a-1', '  WH_HNO_KY_BI ')
    expect(cuerpo).toEqual({ warehouse: 'WH_HNO_KY_BI' })
  })

  it('un 404 de la llave es «sin llave»; otro error se propaga', async () => {
    server.use(
      http.get(`${API}/admin/tenants/:id/service-key`, () =>
        HttpResponse.json({ success: false, error: 'sin clave', code: 'NOT_FOUND_KEY' }, { status: 404 }),
      ),
    )
    expect(await adminApi.llaveDeServicio('t-2')).toBeNull()
    server.use(
      http.get(`${API}/admin/tenants/:id/service-key`, () =>
        HttpResponse.json({ success: false, error: 'falló' }, { status: 500 }),
      ),
    )
    await expect(adminApi.llaveDeServicio('t-2')).rejects.toThrow('falló')
  })
})
