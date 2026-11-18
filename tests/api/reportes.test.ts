// @vitest-environment jsdom

/** Los reportes por correo, en la frontera · F6.6, F6.7 y F6.10 · 2026-11-18
 *
 *  **La prueba del adaptador va de entrada**, que es la lección de A5 y A3: las
 *  pruebas de pantalla construyen el tipo a mano y la frontera queda sin cubrir.
 *
 *  La FORMA sale de `Report`, `ReportValidation` y `ReportRun` en
 *  `contracts/synapse-admin-wire.yaml`, transcriptos de `fb3ca0c` en F6.4. Las
 *  rutas no están en QA, así que no hay respuesta capturada: el día que
 *  lleguen, el humo es el que confirma. Los VALORES son sintéticos.
 */
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { adminApi } from '@/api/admin'
import { ok } from '../mocks/handlers'
import { server } from '../mocks/server'

const API = '*/api/v1'
const T = 't-1'

const reporte = {
  id: 'r-1',
  tenant_id: T,
  name: 'Pauta digital · mensual',
  role_id: 'rol-1',
  questions: ['¿Cuánto invertimos?', '¿Cuántos clics?', '¿Qué plataforma?'],
  frequency: 'monthly',
  weekday: null,
  month_day: 3,
  send_time: '08:00',
  status: 'active',
  next_run_at: '2026-12-03T13:00:00Z',
  last_sent_at: '2026-11-03T13:00:05Z',
  validated_at: '2026-10-28T15:00:00Z',
  validated_by: 'u-9',
  created_by: 'u-9',
  updated_by: 'u-9',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-28T15:00:00Z',
  recipients: [
    { id: 'd-1', report_id: 'r-1', kind: 'user', user_id: 'u-1', added_by: 'u-9', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 'd-2', report_id: 'r-1', kind: 'external', email: 'gerencia@agencia.com', added_by: 'u-9', notified_at: '2026-10-01T00:00:01Z', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  ],
}

describe('la lista · `GET …/reports`', () => {
  it('traduce frecuencia y estado, y distingue usuario de externo', async () => {
    server.use(http.get(`${API}/admin/tenants/:t/reports`, () => ok([reporte])))
    const [r] = await adminApi.reportes(T)
    expect(r?.frecuencia).toBe('mensual')
    expect(r?.estado).toBe('activo')
    expect(r?.diaDelMes).toBe(3)
    expect(r?.diaDeSemana).toBeNull()
    expect(r?.destinatarios.map((d) => d.tipo)).toEqual(['usuario', 'externo'])
    expect(r?.destinatarios[0]?.usuarioId).toBe('u-1')
    // El aviso a los superadmins sólo existe en el externo.
    expect(r?.destinatarios[0]?.avisadoEn).toBeNull()
    expect(r?.destinatarios[1]?.avisadoEn).toBe('2026-10-01T00:00:01Z')
  })
})

describe('guardar · lo que viaja', () => {
  it('el alta manda las claves del contrato, y el día que no corresponde no viaja', async () => {
    const cuerpos: unknown[] = []
    server.use(
      http.post(`${API}/admin/tenants/:t/reports`, async ({ request }) => {
        cuerpos.push(await request.json())
        return ok({ ...reporte, status: 'draft' })
      }),
    )
    await adminApi.crearReporte(T, {
      nombre: 'Resumen',
      rolId: 'rol-1',
      preguntas: ['a', 'b', 'c'],
      frecuencia: 'diaria',
      hora: '07:30',
      usuarioIds: ['u-1'],
      correos: ['x@y.co'],
    })
    expect(cuerpos[0]).toEqual({
      name: 'Resumen',
      role_id: 'rol-1',
      questions: ['a', 'b', 'c'],
      frequency: 'daily',
      send_time: '07:30',
      user_ids: ['u-1'],
      emails: ['x@y.co'],
    })
  })

  it('la edición es PARCIAL: sólo lo que cambió', async () => {
    const cuerpos: unknown[] = []
    server.use(
      http.put(`${API}/admin/tenants/:t/reports/:r`, async ({ request }) => {
        cuerpos.push(await request.json())
        return ok(reporte)
      }),
    )
    await adminApi.editarReporte(T, 'r-1', { hora: '09:00' })
    expect(cuerpos[0]).toEqual({ send_time: '09:00' })
  })

  it('el 400 del servicio llega con SU mensaje · la regla es de ellos', async () => {
    server.use(
      http.post(`${API}/admin/tenants/:t/reports`, () =>
        HttpResponse.json(
          { success: false, error: 'un reporte lleva de 3 a 5 preguntas', code: 'VALIDATION_REPORT' },
          { status: 400 },
        ),
      ),
    )
    await expect(
      adminApi.crearReporte(T, {
        nombre: 'x', rolId: 'rol-1', preguntas: ['a'], frecuencia: 'semanal', diaDeSemana: 1, hora: '08:00', usuarioIds: [], correos: [],
      }),
    ).rejects.toThrow('un reporte lleva de 3 a 5 preguntas')
  })
})

describe('validar · `POST …/validate`', () => {
  it('una respuesta que falló trae su error; una que contestó, `null`', async () => {
    server.use(
      http.post(`${API}/admin/tenants/:t/reports/:r/validate`, () =>
        ok({
          report: { ...reporte, status: 'draft' },
          validated: false,
          answers: [
            { question: '¿Cuánto invertimos?', answer: 'COP 603.703.707' },
            { question: '¿Qué plataforma?', answer: '', error: 'el agente no devolvió respuesta' },
          ],
        }),
      ),
    )
    const v = await adminApi.validarReporte(T, 'r-1')
    expect(v.validado).toBe(false)
    expect(v.reporte.estado).toBe('borrador')
    expect(v.respuestas.map((a) => a.error)).toEqual([null, 'el agente no devolvió respuesta'])
  })
})

describe('los envíos · `GET …/runs`', () => {
  it('distingue validación de envío, y a quién salió', async () => {
    server.use(
      http.get(`${API}/admin/tenants/:t/reports/:r/runs`, () =>
        ok([
          { id: 'c-1', report_id: 'r-1', tenant_id: T, kind: 'delivery', status: 'partial', answers: [], sent_to: ['a@b.co'], actor_user_id: null, error: 'c@d.co: rebotó', created_at: '2026-11-03T13:00:05Z' },
          { id: 'c-2', report_id: 'r-1', tenant_id: T, kind: 'validation', status: 'ok', answers: null, sent_to: [], actor_user_id: 'u-9', created_at: '2026-10-28T15:00:00Z' },
        ]),
      ),
    )
    const [envio, validacion] = await adminApi.corridasDeReporte(T, 'r-1')
    expect(envio?.tipo).toBe('envio')
    expect(envio?.estado).toBe('parcial')
    expect(envio?.enviadoA).toEqual(['a@b.co'])
    expect(envio?.actorId).toBeNull()
    expect(validacion?.tipo).toBe('validacion')
    // `answers: null` no rompe: queda vacía.
    expect(validacion?.respuestas).toEqual([])
    expect(validacion?.error).toBe('')
  })
})
