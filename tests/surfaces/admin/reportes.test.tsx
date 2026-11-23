// @vitest-environment jsdom

/** Los reportes por correo, en administración · F6.6, F6.7 y F6.10 · 2026-11-18
 *
 *  **Se monta `Admin` en `/admin/reportes`** y no los componentes sueltos: cada
 *  acción baja por `Admin → Reportes → ReportList/Editor/Validation`, con un
 *  spread condicional en el camino, y lo que se prueba es que la llamada
 *  SALGA, no que el botón exista. La regla del callback que no dispara.
 *
 *  Las formas salen del contrato (`Report`, `ReportValidation`), transcripto
 *  de `fb3ca0c`. Las rutas no están en QA: los valores son sintéticos.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { reintentar } from '@/app/providers/AppProviders'
import { ApiError } from '@/api/types'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [
  {
    id: 't-1', name: 'Terpel Colombia', label: 'terpel_co', locale: 'es-CO', currency: 'COP',
    timezone: 'America/Bogota', user_count: 2, last_published_at: null,
    worst_feed_status: 'ok', worst_feed_freshness_hours: 4, status: null, vertical: null,
    created_at: '2026-09-22T09:18:45Z',
  },
]

const roles = [
  { id: 'rol-1', tenant_id: 't-1', name: 'Planner', tab_keys: [], tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 1 },
]

const usuarios = [
  {
    id: 'u-1', first_name: 'Laura', last_name: 'Méndez', email: 'laura@terpel.co', role: 'Planner', role_id: 'rol-1',
    is_active: true, last_login_at: null, created_at: '2026-09-01T00:00:00Z', tenant_id: 't-1',
  },
]

const base = {
  tenant_id: 't-1', role_id: 'rol-1', weekday: null, month_day: 3, send_time: '08:00', next_run_at: null,
  last_sent_at: null, validated_at: null, validated_by: null, created_by: 'u-9', updated_by: 'u-9',
  created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-28T15:00:00Z',
}
const preguntas = ['¿Cuánto invertimos?', '¿Cuántos clics?', '¿Qué plataforma?']
const activo = {
  ...base, id: 'r-1', name: 'Pauta digital · mensual', questions: preguntas, frequency: 'monthly', status: 'active',
  next_run_at: '2026-12-03T13:00:00Z', last_sent_at: '2026-11-03T13:00:05Z', validated_at: '2026-10-28T15:00:00Z',
  recipients: [
    { id: 'd-1', report_id: 'r-1', kind: 'user', user_id: 'u-1', added_by: 'u-9', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 'd-2', report_id: 'r-1', kind: 'external', email: 'gerencia@agencia.com', added_by: 'u-9', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  ],
}
const borrador = {
  ...base, id: 'r-2', name: 'Resumen para gerencia', questions: preguntas, frequency: 'weekly', weekday: 5,
  month_day: null, send_time: '17:00', status: 'draft', recipients: [],
}

/** Sirve la administración con los reportes dados y registra lo que se pide. */
function servir(reportes: unknown[]) {
  const pedidos: { metodo: string; ruta: string; cuerpo?: unknown }[] = []
  let lista = reportes
  server.use(
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:t/roles/composition`, () => ok(roles)),
    http.get(`${API}/admin/tenants/:t/users`, () => ok(usuarios)),
    http.get(`${API}/admin/tenants/:t/reports`, () => ok(lista)),
    http.post(`${API}/admin/tenants/:t/reports/:r/pause`, ({ params }) => {
      pedidos.push({ metodo: 'POST', ruta: `pause:${String(params['r'])}` })
      return ok({ ...activo, status: 'paused' })
    }),
    http.post(`${API}/admin/tenants/:t/reports/:r/activate`, ({ params }) => {
      pedidos.push({ metodo: 'POST', ruta: `activate:${String(params['r'])}` })
      return ok({ ...borrador, status: 'active' })
    }),
    http.post(`${API}/admin/tenants/:t/reports/:r/validate`, ({ params }) => {
      pedidos.push({ metodo: 'POST', ruta: `validate:${String(params['r'])}` })
      lista = lista.map((r) => ((r as { id: string }).id === params['r'] ? { ...(r as object), status: 'validated' } : r))
      return ok({
        report: { ...borrador, status: 'validated' },
        validated: true,
        answers: preguntas.map((q) => ({ question: q, answer: `Respuesta a ${q}` })),
      })
    }),
    http.put(`${API}/admin/tenants/:t/reports/:r`, async ({ request }) => {
      pedidos.push({ metodo: 'PUT', ruta: 'r', cuerpo: await request.json() })
      return ok(activo)
    }),
  )
  return pedidos
}

function montar(ruta = '/admin/reportes') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <Admin />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const fila = async (nombre: string) => (await screen.findByText(nombre)).closest('tr') as HTMLElement

describe('F6.6 · la lista', () => {
  it('cada fila dice estado, cuándo sale y cuántos externos', async () => {
    servir([activo, borrador])
    montar()
    const f = await fila('Pauta digital · mensual')
    expect(within(f).getByText('Activo')).toBeInTheDocument()
    expect(within(f).getByText('Mensual · día 3 · 08:00')).toBeInTheDocument()
    expect(within(f).getByText('1 externo')).toBeInTheDocument()
    expect(within(await fila('Resumen para gerencia')).getByText('Semanal · viernes · 17:00')).toBeInTheDocument()
  })

  it('PAUSAR dispara su llamada · y no hay borrar (P6.9)', async () => {
    const pedidos = servir([activo])
    montar()
    await userEvent.click(within(await fila('Pauta digital · mensual')).getByRole('button', { name: 'Pausar' }))
    await waitFor(() => expect(pedidos.map((p) => p.ruta)).toContain('pause:r-1'))
    expect(screen.queryByRole('button', { name: /borrar|eliminar/i })).toBeNull()
  })

  it('sin reportes, el vacío lleva su salida y abre el editor', async () => {
    servir([])
    montar()
    expect(await screen.findByText('Terpel Colombia no tiene reportes')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo reporte' }))
    expect(await screen.findByRole('heading', { name: 'Nuevo reporte' })).toBeInTheDocument()
  })
})

describe('F6.7 · el editor', () => {
  it('no deja guardar con menos de tres preguntas, y dice por qué', async () => {
    servir([])
    montar()
    // Se espera la lista: el botón de la tabla mientras carga se reemplaza.
    await screen.findByText('Terpel Colombia no tiene reportes')
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo reporte' }))
    await userEvent.type(screen.getByLabelText('Nombre'), 'Semanal')
    await userEvent.click(screen.getByRole('button', { name: 'Planner' }))
    // **Arranca con tres campos vacíos** (B1); se quitan dos.
    await userEvent.type(screen.getByLabelText('Pregunta 1'), '¿Cuánto vendimos?')
    await userEvent.click(screen.getByRole('button', { name: 'Quitar la pregunta 3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Quitar la pregunta 2' }))
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    // **Como pista junto al botón**, no como error al abrir (M1).
    expect(screen.getByText('Para guardar: lleva al menos 3 preguntas.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('la hora lleva la zona del CLIENTE escrita al lado', async () => {
    servir([])
    montar()
    // Se espera la lista: el botón de la tabla mientras carga se reemplaza.
    await screen.findByText('Terpel Colombia no tiene reportes')
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo reporte' }))
    expect(screen.getByText('Hora de America/Bogota · la del cliente')).toBeInTheDocument()
  })

  it('agregar un externo avisa a los superadmins ANTES de guardar, y no vuelve a borrador', async () => {
    servir([activo])
    montar()
    await userEvent.click(within(await fila('Pauta digital · mensual')).getByRole('button', { name: 'Editar' }))
    await userEvent.type(screen.getByLabelText('Correo externo'), 'nuevo@agencia.com{Enter}')
    const aviso = screen.getByRole('status')
    expect(within(aviso).getByText('Agregaste un destinatario externo. Al guardar, se avisa a los superadmins.')).toBeInTheDocument()
    expect(within(aviso).queryByText(/vuelve a borrador/)).toBeNull()
  })

  it('cambiar una pregunta de un reporte activo avisa que vuelve a borrador, antes de guardar', async () => {
    servir([activo])
    montar()
    await userEvent.click(within(await fila('Pauta digital · mensual')).getByRole('button', { name: 'Editar' }))
    await userEvent.type(screen.getByLabelText('Pregunta 1'), ' este mes')
    expect(
      within(screen.getByRole('status')).getByText('Cambiaste las preguntas o el rol. Al guardar, el reporte vuelve a borrador.'),
    ).toBeInTheDocument()
  })

  it('el correo de un usuario no entra como externo · P6.6', async () => {
    servir([activo])
    montar()
    await userEvent.click(within(await fila('Pauta digital · mensual')).getByRole('button', { name: 'Editar' }))
    await userEvent.type(screen.getByLabelText('Correo externo'), 'laura@terpel.co{Enter}')
    expect(screen.getByText('Ese correo es de un usuario de este cliente: agrégalo como usuario.')).toBeInTheDocument()
  })

  it('guardar manda SÓLO lo que cambió', async () => {
    const pedidos = servir([activo])
    montar()
    await userEvent.click(within(await fila('Pauta digital · mensual')).getByRole('button', { name: 'Editar' }))
    await userEvent.clear(screen.getByLabelText('Nombre'))
    await userEvent.type(screen.getByLabelText('Nombre'), 'Pauta mensual')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(pedidos.find((p) => p.metodo === 'PUT')?.cuerpo).toEqual({ name: 'Pauta mensual' }))
  })

  it('el 400 del servicio se muestra con SU mensaje', async () => {
    servir([activo])
    server.use(
      http.put(`${API}/admin/tenants/:t/reports/:r`, () =>
        HttpResponse.json({ success: false, error: 'un reporte admite como máximo 50 destinatarios' }, { status: 400 }),
      ),
    )
    montar()
    await userEvent.click(within(await fila('Pauta digital · mensual')).getByRole('button', { name: 'Editar' }))
    await userEvent.type(screen.getByLabelText('Nombre'), ' 2')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('un reporte admite como máximo 50 destinatarios')
  })
})

describe('F6.10 · validar antes de activar', () => {
  it('ACTIVAR no está disponible hasta validar, y después DISPARA su llamada', async () => {
    const pedidos = servir([borrador])
    montar()
    await userEvent.click(within(await fila('Resumen para gerencia')).getByRole('button', { name: 'Validar' }))
    expect(screen.getByRole('button', { name: 'Activar' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Generar las respuestas' }))
    expect(await screen.findByText('Respuesta a ¿Cuánto invertimos?')).toBeInTheDocument()
    // **Dice que hay que leerlas** (A2): el sello solo no alcanza.
    expect(screen.getByText('Respuestas generadas · léelas')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Activar' })).toBeEnabled())

    await userEvent.click(screen.getByRole('button', { name: 'Activar' }))
    await waitFor(() => expect(pedidos.map((p) => p.ruta)).toContain('activate:r-2'))
  })

  it('una respuesta que falló se ve, con su razón, y no deja activar', async () => {
    servir([borrador])
    server.use(
      http.post(`${API}/admin/tenants/:t/reports/:r/validate`, () =>
        ok({
          report: borrador,
          validated: false,
          answers: [
            { question: preguntas[0], answer: 'COP 603 M' },
            { question: preguntas[1], answer: '', error: 'el agente no devolvió respuesta' },
            { question: preguntas[2], answer: 'YouTube' },
          ],
        }),
      ),
    )
    montar()
    await userEvent.click(within(await fila('Resumen para gerencia')).getByRole('button', { name: 'Validar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Generar las respuestas' }))
    const p2 = await screen.findByRole('region', { name: 'Pregunta 2' })
    expect(within(p2).getByText('No se pudo generar esta respuesta.')).toBeInTheDocument()
    expect(within(p2).getByText(/el agente no devolvió respuesta/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activar' })).toBeDisabled()
  })
})

describe('la auditoría de UX del 2026-11-18 · lo que se corrigió', () => {
  it('A1 · si la lista falla lo DICE, con reintentar · no queda cargando', async () => {
    servir([])
    server.use(http.get(`${API}/admin/tenants/:t/reports`, () => HttpResponse.json({ success: false, error: 'se cayó' }, { status: 500 })))
    montar()
    expect(await screen.findByText('No se pudieron cargar los reportes de este cliente.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('A1 · un 403 dice que pide rol de administrador', async () => {
    servir([])
    server.use(http.get(`${API}/admin/tenants/:t/reports`, () => HttpResponse.json({ success: false, error: 'prohibido' }, { status: 403 })))
    montar()
    expect(await screen.findByText('Esta pantalla pide rol de administrador.')).toBeInTheDocument()
  })

  it('A3 · la vista vive en la URL: se entra directo a los envíos', async () => {
    servir([activo])
    server.use(http.get(`${API}/admin/tenants/:t/reports/:r/runs`, () => ok([])))
    montar('/admin/reportes/r-1/envios')
    expect(await screen.findByRole('heading', { name: 'Envíos' })).toBeInTheDocument()
  })

  it('A3 · «Reportes» en el menú vuelve a la lista desde el editor', async () => {
    servir([activo])
    montar('/admin/reportes/r-1')
    await screen.findByRole('heading', { name: 'Pauta digital · mensual' })
    const menu = screen.getByRole('navigation', { name: 'Administración' })
    await userEvent.click(within(menu).getByRole('button', { name: 'Reportes' }))
    expect(await screen.findByText('Reportes de este cliente · 1')).toBeInTheDocument()
  })

  it('A4 · pausar dice qué hizo', async () => {
    servir([activo])
    montar()
    await userEvent.click(within(await fila('Pauta digital · mensual')).getByRole('button', { name: 'Pausar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Pausado. No se envía hasta que lo reanudes.')
  })

  it('A5 · una edición que lo devuelve a borrador lleva directo a validar, y lo dice', async () => {
    servir([activo])
    server.use(http.put(`${API}/admin/tenants/:t/reports/:r`, () => ok({ ...activo, status: 'draft' })))
    montar()
    await userEvent.click(within(await fila('Pauta digital · mensual')).getByRole('button', { name: 'Editar' }))
    await userEvent.type(screen.getByLabelText('Pregunta 1'), ' este mes')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('heading', { name: 'Validar las respuestas' })).toBeInTheDocument()
    expect(screen.getByText('Volvió a borrador: no se envía hasta que lo valides de nuevo.')).toBeInTheDocument()
  })

  it('M3 · salir con cambios sin guardar pide confirmación', async () => {
    servir([activo])
    montar()
    await userEvent.click(within(await fila('Pauta digital · mensual')).getByRole('button', { name: 'Editar' }))
    await userEvent.type(screen.getByLabelText('Nombre'), ' 2')
    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    const dialogo = screen.getByRole('alertdialog', { name: 'Salir sin guardar' })
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Seguir editando' }))
    expect(screen.getByLabelText('Nombre')).toHaveValue('Pauta digital · mensual 2')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Salir sin guardar' }))
    expect(await screen.findByText('Reportes de este cliente · 1')).toBeInTheDocument()
  })

  it('M5 · sin destinatarios no se guarda, y lo dice', async () => {
    servir([])
    montar()
    await screen.findByText('Terpel Colombia no tiene reportes')
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo reporte' }))
    await userEvent.type(screen.getByLabelText('Nombre'), 'Semanal')
    await userEvent.click(screen.getByRole('button', { name: 'Planner' }))
    for (const i of [1, 2, 3]) await userEvent.type(screen.getByLabelText(`Pregunta ${String(i)}`), `¿Pregunta ${String(i)}?`)
    expect(screen.getByText('Para guardar: falta al menos un destinatario.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('M4 · desde la validación se puede editar el reporte', async () => {
    servir([borrador])
    montar()
    await userEvent.click(within(await fila('Resumen para gerencia')).getByRole('button', { name: 'Validar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Editar el reporte' }))
    expect(await screen.findByRole('heading', { name: 'Resumen para gerencia' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
  })
})

describe('lo que se vio contra el servicio real · 2026-11-18', () => {
  it('el último envío se lee en el huso del CLIENTE, como «cuándo sale»', async () => {
    // Tokio para que no coincida con el huso de quien corre la prueba: el
    // envío de las 13:00 UTC son las 22:00 allá.
    servir([activo])
    server.use(http.get(`${API}/admin/tenants`, () => ok(tenants.map((t) => ({ ...t, timezone: 'Asia/Tokyo' })))))
    montar()
    expect(within(await fila('Pauta digital · mensual')).getByText(/· 22:00$/)).toBeInTheDocument()
  })

  it('una validación no dice «Enviado»', async () => {
    servir([activo])
    server.use(
      http.get(`${API}/admin/tenants/:t/reports/:r/runs`, () =>
        ok([{ id: 'c-2', report_id: 'r-1', tenant_id: 't-1', kind: 'validation', status: 'ok', answers: [], sent_to: [], actor_user_id: 'u-9', created_at: '2026-10-28T15:00:00Z' }]),
      ),
    )
    montar('/admin/reportes/r-1/envios')
    const f = (await screen.findByText('Validación')).closest('tr') as HTMLElement
    expect(within(f).getByText('Respondidas')).toBeInTheDocument()
    expect(within(f).queryByText('Enviado')).toBeNull()
  })
})

describe('QA del 2026-11-23 · la ruta que no está desplegada', () => {
  it('un 404 sin cuerpo dice que el servidor no ofrece la función · no queda en esqueleto', async () => {
    // Lo que contesta QA de verdad: `text/plain`, «404 page not found».
    servir([])
    server.use(
      http.get(`${API}/admin/tenants/:t/reports`, () =>
        new HttpResponse('404 page not found', { status: 404, headers: { 'Content-Type': 'text/plain' } }),
      ),
    )
    montar()
    expect(await screen.findByText('No se pudieron cargar los reportes de este cliente.')).toBeInTheDocument()
    expect(screen.getByText('Este servidor todavía no ofrece esta función.')).toBeInTheDocument()
    expect(screen.queryByText(/sin cuerpo/)).not.toBeInTheDocument()
    // El encabezado del dibujo «no cargó» sigue, con «Sin datos» y no «0 reportes».
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
    expect(screen.queryByText('0 reportes')).not.toBeInTheDocument()
  })

  it('mientras carga NO dice «0 reportes»', async () => {
    servir([])
    server.use(
      http.get(`${API}/admin/tenants/:t/reports`, async () => {
        await delay('infinite')
        return ok([])
      }),
    )
    montar()
    expect(await screen.findByText('Alcance · cliente')).toBeInTheDocument()
    expect(screen.queryByText('0 reportes')).not.toBeInTheDocument()
  })

  it('un 4xx no se reintenta: TanStack pausa el reintento sin foco y la pantalla quedaba cargando', () => {
    const e = (s: number) => new ApiError('X', '', s)
    expect(reintentar(0, e(404))).toBe(false)
    expect(reintentar(0, e(403))).toBe(false)
    expect(reintentar(0, e(401))).toBe(false)
    expect(reintentar(0, e(500))).toBe(true)
    expect(reintentar(1, e(500))).toBe(false)
    expect(reintentar(0, e(429))).toBe(true)
    expect(reintentar(0, new Error('red'))).toBe(true)
  })
})
