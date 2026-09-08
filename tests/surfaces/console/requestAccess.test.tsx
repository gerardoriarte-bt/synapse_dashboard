// @vitest-environment jsdom

/** Solicitar acceso · F0.16
 *
 *  Escrita desde `docs/access-request-registration-frontend-integration.md` del
 *  servicio. Lo que se verifica son las tres cosas que el contrato exige y que
 *  se rompen en silencio: los ocho campos, los dos consentimientos en `true`, y
 *  que la respuesta —que trae la solicitud creada— no se pinte.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { RequestAccess } from '@/surfaces/console/RequestAccess'
import { server } from '../../mocks/server'

const RUTA = '*/api/v1/access-requests'

const CAMPOS: [RegExp, string][] = [
  [/nombre completo/i, 'Juan Pérez'],
  [/^correo$/i, '  Juan@Empresa.com '],
  [/empresa/i, 'Mi Empresa S.A.'],
  [/teléfono/i, '+573001234567'],
  [/cargo/i, 'Analista'],
  [/para qué/i, 'Reportes de ventas'],
]

async function completar({ consentir = true } = {}) {
  for (const [rotulo, valor] of CAMPOS) {
    await userEvent.type(screen.getByLabelText(rotulo), valor)
  }
  if (consentir) {
    await userEvent.click(screen.getByLabelText(/términos y condiciones/i))
    await userEvent.click(screen.getByLabelText(/política de privacidad/i))
  }
  await userEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }))
}

describe('lo que viaja', () => {
  it('los ocho campos del contrato, con el correo normalizado', async () => {
    let recibido: Record<string, unknown> = {}
    server.use(
      http.post(RUTA, async ({ request }) => {
        recibido = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ success: true, data: { id: 'r-1' } }, { status: 201 })
      }),
    )
    render(<RequestAccess onClose={() => {}} />)
    await completar()
    await screen.findByRole('status')

    expect(recibido).toEqual({
      company_name: 'Mi Empresa S.A.',
      full_name: 'Juan Pérez',
      email: 'juan@empresa.com',
      phone: '+573001234567',
      job_title: 'Analista',
      info_use: 'Reportes de ventas',
      accepted_terms: true,
      accepted_privacy_policy: true,
    })
  })

  it('NO manda `tenant_id` · el tenant lo asigna el admin al aprobar', async () => {
    // El documento del servicio lo cambió: «ya no se envía tenant_id». Mandarlo
    // sería inventar un dato que quien solicita no puede conocer.
    let recibido: Record<string, unknown> = {}
    server.use(
      http.post(RUTA, async ({ request }) => {
        recibido = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ success: true, data: {} }, { status: 201 })
      }),
    )
    render(<RequestAccess onClose={() => {}} />)
    await completar()
    await screen.findByRole('status')
    expect(recibido).not.toHaveProperty('tenant_id')
  })
})

describe('los dos consentimientos', () => {
  it('sin aceptarlos el formulario NO se envía', async () => {
    // El servicio rechaza con 400 si llegan en `false`. Declararlo en el
    // checkbox evita un viaje que ya se sabe cómo termina.
    const llamado = vi.fn()
    server.use(
      http.post(RUTA, () => {
        llamado()
        return HttpResponse.json({ success: true, data: {} }, { status: 201 })
      }),
    )
    render(<RequestAccess onClose={() => {}} />)
    await completar({ consentir: false })
    expect(llamado).not.toHaveBeenCalled()
  })
})

describe('la respuesta no se pinta', () => {
  it('la solicitud creada NO llega a la pantalla', async () => {
    // El 201 trae id, tenant y estado. La pantalla no tiene nada que hacer con
    // eso, y lo que no sube no se puede filtrar por accidente.
    server.use(
      http.post(RUTA, () =>
        HttpResponse.json(
          { success: true, data: { id: 'r-secreto', tenant_name: 'Keralty', status: 'pending' } },
          { status: 201 },
        ),
      ),
    )
    const { container } = render(<RequestAccess onClose={() => {}} />)
    await completar()
    await screen.findByRole('status')

    expect(container.textContent).not.toContain('r-secreto')
    expect(container.textContent).not.toContain('Keralty')
  })

  it('NO promete que ya puede entrar · un admin tiene que aprobar', async () => {
    server.use(http.post(RUTA, () => HttpResponse.json({ success: true, data: {} }, { status: 201 })))
    render(<RequestAccess onClose={() => {}} />)
    await completar()
    const texto = (await screen.findByRole('status')).textContent ?? ''

    expect(texto).toMatch(/revisa/i)
    expect(texto).not.toMatch(/ya podés entrar|tu cuenta está lista|iniciá sesión/i)
  })
})

describe('cuando el correo ya existe', () => {
  it('el 409 se muestra con el texto del servicio', async () => {
    // El servicio usa el mismo 409 para «ya hay solicitud pendiente» y para «ese
    // correo ya es un usuario», así que el mensaje no revela cuál de las dos.
    server.use(
      http.post(RUTA, () =>
        HttpResponse.json(
          { success: false, error: 'ya existe una solicitud pendiente con este correo' },
          { status: 409 },
        ),
      ),
    )
    render(<RequestAccess onClose={() => {}} />)
    await completar()
    expect(await screen.findByRole('alert')).toHaveTextContent(/ya existe una solicitud/)
  })
})
