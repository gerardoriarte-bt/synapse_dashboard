// @vitest-environment jsdom

/** Lo que sumó `5b917f7` a los reportes · la prueba, las fuentes y los avisos
 *
 *  **Se monta `Admin`**, como en `reportes.test.tsx`: la prueba y los avisos
 *  bajan por `Admin → Reportes → ReportValidation` y `Admin → AvisosPorExternos`
 *  con spreads en el camino, y lo que se prueba es que la llamada SALGA y que su
 *  resultado se diga, no que el botón exista.
 *
 *  **Las formas salen del contrato** —`ReportTestResult`, `ReportAnswerSource`,
 *  `ReportExternalNotice`—, transcripto de `f1ccbbe`: `freshness` siempre llega
 *  —vacía si no se sabe— y `stale` sólo cuando es `true`, que es lo que hacen
 *  sus etiquetas `json:`. Los valores son sintéticos.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { context, ok } from '../../mocks/handlers'
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
const preguntas = ['¿Cuánto invertimos?', '¿Cuánto vendimos?', '¿Qué hacemos?']
const borrador = {
  id: 'r-2', tenant_id: 't-1', role_id: 'rol-1', name: 'Resumen para gerencia', questions: preguntas,
  frequency: 'weekly', weekday: 5, month_day: null, send_time: '17:00', status: 'draft', next_run_at: null,
  last_sent_at: null, validated_at: null, validated_by: null, created_by: 'u-9', updated_by: 'u-9',
  created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-28T15:00:00Z',
  recipients: [{ id: 'd-1', report_id: 'r-2', kind: 'user', user_id: 'u-1', added_by: 'u-9', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' }],
}

/** Las tres respuestas del dibujo: al día, con una fuente vencida, y sin
 *  fuentes. `stale` falta en la que está al día, como lo manda el servicio. */
const respuestas = [
  {
    question: preguntas[0],
    answer: 'COP 1.228 M en pauta.',
    sources: [{ source: 'GLD_PAID_MEDIA', period: '2026-10', freshness: '2026-11-24T11:10:00Z' }],
  },
  {
    question: preguntas[1],
    answer: 'COP 2.310 M en el sitio.',
    sources: [
      { source: 'GLD_ECOMM_DAILY_PERFORMANCE', period: '2026-10', freshness: '2026-11-22T06:00:00Z', stale: true },
      { source: 'GLD_PRODUCTO_ANALYTICS', period: '2026-10', freshness: '' },
    ],
  },
  { question: preguntas[2], answer: 'No hay un dato que conteste esta pregunta.' },
]

function servir() {
  const pedidos: string[] = []
  server.use(
    http.get(`${API}/admin/tenants`, () => ok(tenants)),
    http.get(`${API}/admin/tenants/:t/roles/composition`, () => ok(roles)),
    http.get(`${API}/admin/tenants/:t/users`, () => ok([])),
    http.get(`${API}/admin/tenants/:t/reports`, () => ok([borrador])),
    http.post(`${API}/admin/tenants/:t/reports/:r/validate`, () =>
      ok({ report: borrador, validated: true, answers: respuestas }),
    ),
    http.post(`${API}/admin/tenants/:t/reports/:r/test`, ({ params }) => {
      pedidos.push(`test:${String(params['r'])}`)
      return ok({ report: borrador, sent_to: 'maria@terpel.co', answers: respuestas, run_kind: 'test' })
    }),
    http.get(`${API}/admin/report-external-notices`, () => {
      pedidos.push('avisos')
      return ok([
        {
          recipient_id: 'e-1', tenant_id: 't-1', tenant_name: 'Terpel Colombia', report_id: 'r-2',
          report_name: 'Resumen para gerencia', email: 'planeacion@mediaplan.co', added_by: 'u-9',
          added_by_email: 'maria@terpel.co', created_at: '2026-11-04T15:38:00Z', notified_at: '2026-11-04T15:38:01Z', is_active: true,
        },
        {
          recipient_id: 'e-2', tenant_id: 't-1', tenant_name: 'Terpel Colombia', report_id: 'r-2',
          report_name: 'Resumen para gerencia', email: 'director@consultora.co', created_at: '2026-09-22T15:00:00Z', is_active: false,
        },
      ])
    }),
  )
  return pedidos
}

function conAlcance(alcance: 'plataforma' | 'usuario') {
  const leido = { me: false }
  server.use(
    http.get(`${API}/config/me`, () => {
      leido.me = true
      return ok({
        ...context,
        scope:
          alcance === 'plataforma'
            ? { kind: 'multi_tenant', tenants: [{ id: 't-1', name: 'Terpel Colombia', label: 'terpel_co' }] }
            : context.scope,
      })
    }),
  )
  return leido
}

function montar(ruta: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>
        <Admin />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function validar() {
  montar('/admin/reportes/r-2/validar')
  await userEvent.click(await screen.findByRole('button', { name: 'Generar las respuestas' }))
  await screen.findByText('COP 1.228 M en pauta.')
}

describe('«Enviarme una prueba» · `5b917f7`', () => {
  it('DISPARA su llamada y dice a quién llegó', async () => {
    const pedidos = servir()
    montar('/admin/reportes/r-2/validar')
    await userEvent.click(await screen.findByRole('button', { name: 'Enviarme una prueba' }))
    await waitFor(() => expect(pedidos).toContain('test:r-2'))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Prueba enviada a maria@terpel.co. Queda en los envíos, marcada como prueba.',
    )
  })

  it('si falla, dice el mensaje del servicio', async () => {
    servir()
    server.use(
      http.post(`${API}/admin/tenants/:t/reports/:r/test`, () =>
        HttpResponse.json({ success: false, error: 'el envío de correo no está configurado' }, { status: 409 }),
      ),
    )
    montar('/admin/reportes/r-2/validar')
    await userEvent.click(await screen.findByRole('button', { name: 'Enviarme una prueba' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('el envío de correo no está configurado')
  })

  it('en los envíos, la prueba va marcada como prueba', async () => {
    servir()
    server.use(
      http.get(`${API}/admin/tenants/:t/reports/:r/runs`, () =>
        ok([
          {
            id: 'c-1', report_id: 'r-2', tenant_id: 't-1', kind: 'test', status: 'ok', answers: respuestas,
            sent_to: ['maria@terpel.co'], actor_user_id: 'u-9', created_at: '2026-11-24T15:00:00Z',
          },
        ]),
      ),
    )
    montar('/admin/reportes/r-2/envios')
    const f = (await screen.findByText('Prueba')).closest('tr') as HTMLElement
    expect(within(f).getByText('Enviada')).toBeInTheDocument()
    expect(screen.getByText('0 envíos · 1 prueba · ninguno se reintenta solo')).toBeInTheDocument()
    // Y lo que se mandó dice de dónde salió.
    expect(screen.getAllByText(/^GLD_PAID_MEDIA · octubre 2026/)).not.toHaveLength(0)
    // Sin fuentes, un envío no afirma que el agente no consultó datos: las
    // corridas de antes de `5b917f7` no las guardaban. Visto en `dev:mock`.
    expect(screen.getByText('No cita ninguna fuente')).toBeInTheDocument()
  })
})

describe('las fuentes de cada respuesta · B6.5', () => {
  it('cada respuesta dice su fuente, el mes y cuándo se cargó', async () => {
    servir()
    await validar()
    const p1 = screen.getByRole('region', { name: 'Pregunta 1' })
    expect(within(p1).getByText('Respondida')).toBeInTheDocument()
    expect(within(p1).getByText('Gold')).toBeInTheDocument()
    // 11:10 UTC son las 06:10 en Bogotá: la hora es la del CLIENTE.
    expect(within(p1).getByText(/^GLD_PAID_MEDIA · octubre 2026 · cargado el .* 06:10$/)).toBeInTheDocument()
  })

  it('una fuente vencida se marca «Degradado» y dice su última carga', async () => {
    servir()
    await validar()
    const p2 = screen.getByRole('region', { name: 'Pregunta 2' })
    const vencida = within(p2).getByText(/^GLD_ECOMM_DAILY_PERFORMANCE · /).closest('li') as HTMLElement
    expect(within(vencida).getByText('Degradado')).toBeInTheDocument()
    expect(within(vencida).getByText(/· última carga el .* 01:00$/)).toBeInTheDocument()
    // La otra fuente de la misma respuesta sigue al día, y sin fecha no inventa una.
    const sinFecha = within(p2).getByText(/^GLD_PRODUCTO_ANALYTICS · /).closest('li') as HTMLElement
    expect(within(sinFecha).getByText('Gold')).toBeInTheDocument()
    expect(within(sinFecha).getByText(/· sin fecha de carga$/)).toBeInTheDocument()
  })

  it('una respuesta sin fuentes se marca «Sin dato» y se cuenta aparte', async () => {
    servir()
    await validar()
    const p3 = screen.getByRole('region', { name: 'Pregunta 3' })
    expect(within(p3).getByText('Sin dato')).toBeInTheDocument()
    expect(within(p3).getByText('No cita ninguna fuente · el agente no consultó datos')).toBeInTheDocument()
    const conteo = screen.getByText('Sin dato · no citan fuentes').parentElement as HTMLElement
    expect(within(conteo).getByText('1')).toBeInTheDocument()
  })
})

describe('las advertencias por externos, en Clientes · P6.4', () => {
  it('con alcance de plataforma se listan, y «Ver reporte» abre el reporte en su cliente', async () => {
    servir()
    conAlcance('plataforma')
    montar('/admin')
    const lista = await screen.findByRole('region', { name: 'Advertencias · externos en reportes' })
    const fila = (await within(lista).findByText('planeacion@mediaplan.co')).closest('tr') as HTMLElement
    expect(within(fila).getByText(/· agregó maria@terpel.co$/)).toBeInTheDocument()
    expect(within(fila).getByText('Resumen para gerencia')).toBeInTheDocument()
    // El que ya no lo recibe se marca.
    const vieja = within(lista).getByText('director@consultora.co').closest('tr') as HTMLElement
    expect(within(vieja).getByText('No lo recibe')).toBeInTheDocument()
    expect(within(lista).getByText('2 en total · 1 lo recibe')).toBeInTheDocument()

    await userEvent.click(within(fila).getByRole('button', { name: 'Ver reporte' }))
    expect(await screen.findByRole('heading', { name: 'Resumen para gerencia' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Resumen para gerencia')
  })

  it('sin alcance de plataforma ni se piden: la ruta no filtra por cliente', async () => {
    const pedidos = servir()
    const leido = conAlcance('usuario')
    montar('/admin')
    await screen.findAllByText('Terpel Colombia')
    // Que `/config/me` ya contestó: el alcance sale de ahí.
    await waitFor(() => expect(leido.me).toBe(true))
    expect(screen.queryByRole('region', { name: 'Advertencias · externos en reportes' })).toBeNull()
    expect(pedidos).not.toContain('avisos')
  })
})
