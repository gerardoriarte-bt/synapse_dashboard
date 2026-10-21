// @vitest-environment jsdom

/** La conexión del cliente, para el equipo interno · A2 · F5.55, 2026-10-21
 *
 *  **Los fixtures salen de lo medido contra `26eae4b` ese día**: la respuesta
 *  del `PUT` trae `snowflake_*` y `has_private_key`, y `schema-check` trae
 *  `snowflake_user` y `snowflake_role`. Ver `docs/AUDITORIA-2026-10-21-conexion-por-cliente.md`.
 *
 *  **Lo que se prueba son las tres cosas que pueden fallar viéndose bien**:
 *  que un admin de cliente NO la vea —§7.3—, que viaje sólo lo escrito —una
 *  cadena vacía es 400 en el servicio—, y que guardar DISPARE la verificación,
 *  que es lo que confirma que la conexión anda.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { ConexionDeDatos } from '@/surfaces/admin/ConexionDeDatos'
import { adaptarVerificacion, adminApi } from '@/api/admin'
import type { WireSchemaCheck } from '@/api/admin'
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

const roles = [
  { id: 'r-1', tenant_id: 't-2', name: 'admin', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 0 },
]

const agente = {
  id: 'a-1', tenant_id: 't-2', role_id: 'r-1', role_name: 'admin', name: 'Synapse Keralty',
  snowflake_cortex_agent_name: 'SYNAPSE_AGENT', semantic_views: [], is_active: true,
  created_at: '2026-10-01T10:00:00Z', updated_at: '2026-10-01T10:00:00Z',
}

/** **La forma de `26eae4b`**, con la identidad. Los nombres de objeto son los
 *  que Keralty marcó `exists: false` en QA el 2026-10-21. */
function verificacion(rol: string): WireSchemaCheck {
  return {
    ok: false, tenant_id: 't-2', agent_name: 'Synapse Keralty',
    database: 'DB_BT_KERALTY', schema: 'BT_KERALTY_MART',
    snowflake_user: 'SVC_KERALTY', snowflake_role: rol,
    objects: [
      { name: 'GLD_ECOMM_DAILY_PERFORMANCE', kind: 'table', exists: false, missing: [] },
      { name: 'GLD_PAID_MEDIA', kind: 'table', exists: true, missing: ['SPEND_USD'] },
      { name: 'SYNAPSE_METRIC_CATALOG', kind: 'view', exists: true, missing: [] },
    ],
    affected_metrics: ['revenue'], keys_without_query: [], catalog_source: 'view',
    checked_at: '2026-10-21T18:56:48Z',
  }
}

/** El escenario de la ficha · `alcance` es lo que esta prueba mueve. */
function base(alcance: 'plataforma' | 'usuario') {
  const cuerpos: unknown[] = []
  let verificaciones = 0
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
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(roles)),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/agents`, () => ok([agente])),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/feeds`, () => ok([])),
    http.get(`${API}/admin/users`, () => ok({ users: [], total: 0, tenants: 0 })),
    http.get(`${API}/admin/tenants/:id/schema-check`, () => {
      verificaciones += 1
      // **La primera mira con el rol viejo y la segunda con el nuevo**: así se
      // ve que lo que se muestra es la verificación de DESPUÉS de guardar.
      return ok(verificacion(verificaciones === 1 ? 'RL_BT_UA_BI' : 'RL_KERALTY'))
    }),
    http.put(`${API}/admin/tenants/:id`, async ({ request }) => {
      cuerpos.push(await request.json())
      return ok({
        id: 't-2', name: 'Keralty Colombia', label: '',
        snowflake_url: 'https://maa16864.east-us-2.azure.snowflakecomputing.com',
        snowflake_account: 'MAA16864', snowflake_user: 'SVC_KERALTY', snowflake_role: 'RL_KERALTY',
        has_private_key: true, has_kms_key: false,
        locale: 'es-CO', currency: 'COP', timezone: 'America/Bogota', created_at: '2026-09-25T10:00:00Z',
      })
    }),
  )
  return { cuerpos, verificaciones: () => verificaciones }
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
  it('un admin de UN cliente NO ve la conexión', async () => {
    // **La regla de §7.3 sigue en pie para él**: la ficha declara la
    // consecuencia y no la plomería. Lo que cambia con F5.55 es el equipo
    // interno, no el cliente.
    base('usuario')
    montar()
    await abrirFicha()
    expect(screen.getByRole('region', { name: 'Acceso a datos' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Conexión del equipo interno' })).toBeNull()
    expect(screen.queryByText(/Rol de Snowflake/)).toBeNull()
  })

  it('con alcance de plataforma SÍ la ve, dentro de «Acceso a datos»', async () => {
    base('plataforma')
    montar()
    await abrirFicha()
    const seccion = await screen.findByRole('region', { name: 'Conexión del equipo interno' })
    expect(seccion.closest('#ficha-acceso')).not.toBeNull()
  })
})

describe('corregir y verificar · el circuito entero', () => {
  it('viaja SÓLO lo escrito, y guardar DISPARA la verificación', async () => {
    const red = base('plataforma')
    montar()
    await abrirFicha()

    // Primero se verifica con el rol viejo: es lo que pasó con Keralty.
    await userEvent.click(screen.getByRole('button', { name: 'Verificar ahora' }))
    const seccion = await screen.findByRole('region', { name: 'Conexión del equipo interno' })
    expect(await within(seccion).findByText('SVC_KERALTY · RL_BT_UA_BI')).toBeVisible()

    await userEvent.type(within(seccion).getByRole('textbox', { name: /^Rol de Snowflake/ }), '  RL_KERALTY ')
    await userEvent.click(within(seccion).getByRole('button', { name: 'Guardar y verificar' }))

    // **Un solo campo, recortado**: los otros tres en blanco no viajan, porque
    // vacío es 400 en el servicio y no borra nada.
    await waitFor(() => expect(red.cuerpos).toEqual([{ snowflake_role: 'RL_KERALTY' }]))
    await waitFor(() => expect(red.verificaciones()).toBe(2))
    expect(await within(seccion).findByText('SVC_KERALTY · RL_KERALTY')).toBeVisible()
    expect(within(seccion).getByText('Quedó guardada')).toBeVisible()
    expect(within(seccion).getByText(/clave cargada/)).toBeVisible()
    // Y el formulario se vació, con lo guardado como referencia.
    expect(within(seccion).getByRole('textbox', { name: /^Rol de Snowflake/ })).toHaveValue('')
    expect(within(seccion).getByRole('textbox', { name: /^Rol de Snowflake/ })).toHaveAttribute('placeholder', 'RL_KERALTY')
  })
})

describe('la sección sola', () => {
  const props = { guardada: null, verificada: null, guardando: false, error: null }

  it('sin nada escrito no se puede guardar', () => {
    const onGuardar = vi.fn()
    render(<ConexionDeDatos {...props} onGuardar={onGuardar} />)
    expect(screen.getByRole('button', { name: 'Guardar y verificar' })).toBeDisabled()
  })

  it('un error del servicio se dice, y lo escrito NO se pierde', async () => {
    const { rerender } = render(<ConexionDeDatos {...props} onGuardar={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox', { name: /^URL/ }), 'https://app.snowflake.com/x')
    rerender(
      <ConexionDeDatos
        {...props}
        error="No se pudo guardar la conexión: tenant inválido: snowflake_url no es un host de Snowflake"
        onGuardar={vi.fn()}
      />,
    )
    expect(screen.getByText(/snowflake_url no es un host de Snowflake/)).toBeVisible()
    expect(screen.getByRole('textbox', { name: /^URL/ })).toHaveValue('https://app.snowflake.com/x')
  })

  it('un objeto que no aparece NO se declara inexistente', () => {
    // **`exists: false` es «no existe» O «este rol no lo ve»**, y el servicio no
    // los separa. «No existe» era el diagnóstico equivocado de Keralty.
    render(
      <ConexionDeDatos {...props} verificada={adaptarVerificacion(verificacion('RL_BT_UA_BI')).infraestructura} onGuardar={vi.fn()} />,
    )
    expect(screen.getByText(/GLD_ECOMM_DAILY_PERFORMANCE · tabla · No está, o este rol no la ve/)).toBeVisible()
    expect(screen.getByText(/GLD_PAID_MEDIA · tabla · Le faltan SPEND_USD/)).toBeVisible()
    expect(screen.getByText(/SYNAPSE_METRIC_CATALOG · vista · Está/)).toBeVisible()
  })

  it('un servicio anterior a 26eae4b no dice el rol, y se dice así', () => {
    // QA sigue en `30c5c50` el 2026-10-21: sin `snowflake_user` ni `snowflake_role`.
    const { snowflake_user: _u, snowflake_role: _r, ...viejo } = verificacion('x')
    render(<ConexionDeDatos {...props} verificada={adaptarVerificacion(viejo).infraestructura} onGuardar={vi.fn()} />)
    expect(screen.getByText('El servicio no dice con qué rol verificó.')).toBeVisible()
  })
})

describe('la frontera · api/admin', () => {
  it('editarConexion manda sólo lo que tiene texto, con las claves del cable', async () => {
    let cuerpo: unknown = null
    server.use(
      http.put(`${API}/admin/tenants/:id`, async ({ request }) => {
        cuerpo = await request.json()
        return HttpResponse.json({ success: true, data: { id: 't-2', name: 'K', label: '', snowflake_account: 'ACC', snowflake_user: 'U', snowflake_role: 'R', snowflake_url: '', has_private_key: false } })
      }),
    )
    const c = await adminApi.editarConexion('t-2', { rol: ' R ', usuario: 'U', cuenta: '   ' })
    expect(cuerpo).toEqual({ snowflake_role: 'R', snowflake_user: 'U' })
    expect(c).toEqual({ cuenta: 'ACC', usuario: 'U', rol: 'R', url: '', tieneClave: false })
  })

  it('la verificación sigue sin pasar la base ni el esquema', () => {
    // Lo que el equipo interno necesita es el rol y los objetos; la base y el
    // esquema siguen recortados, como desde el 2026-10-14.
    const v = adaptarVerificacion(verificacion('RL_KERALTY'))
    expect(JSON.stringify(v)).not.toContain('DB_BT_KERALTY')
    expect(JSON.stringify(v)).not.toContain('BT_KERALTY_MART')
    expect(v.infraestructura.rol).toBe('RL_KERALTY')
  })
})
