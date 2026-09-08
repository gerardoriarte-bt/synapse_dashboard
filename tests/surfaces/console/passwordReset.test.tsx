// @vitest-environment jsdom

/** Recuperar contraseña · F0.15
 *
 *  **La prueba que importa es la de no revelar quién está registrado.** El
 *  servicio responde 201 con el mismo mensaje exista o no el correo, y lo único
 *  que cambia es que trae `request` cuando existe. Si la pantalla mostrara algo
 *  distinto en cada caso, convertiría el formulario en un verificador de
 *  correos: se prueba una lista y se ve cuáles son clientes.
 *
 *  Escrita desde `docs/password-reset-frontend-integration.md` del servicio, que
 *  lo dice así: «en ambos casos mostrar el mismo mensaje de éxito. No indicar
 *  correo no encontrado».
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { PasswordReset } from '@/surfaces/console/PasswordReset'
import { server } from '../../mocks/server'

const RESET = '*/api/v1/password-reset-requests'
const GENERICO =
  'Si el correo está registrado, tu solicitud fue enviada y será revisada por el equipo.'

async function pedir(email = 'alguien@uamx.test') {
  await userEvent.type(screen.getByLabelText(/correo/i), email)
  await userEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }))
}

describe('no revela si el correo existe', () => {
  it('registrado y NO registrado dan exactamente la misma pantalla', async () => {
    // El servicio manda `request` cuando el correo existe y lo omite cuando no.
    // Lo que se verifica es que esa diferencia NO llegue a la pantalla.
    const pantallas: string[] = []

    for (const data of [
      { message: GENERICO, request: { id: 'r-1', type: 'password_reset', email: 'a@b.test' } },
      { message: GENERICO },
    ]) {
      server.use(http.post(RESET, () => HttpResponse.json({ success: true, data }, { status: 201 })))
      const { container, unmount } = render(<PasswordReset onClose={() => {}} />)
      await pedir()
      await screen.findByRole('status')
      pantallas.push(container.textContent ?? '')
      unmount()
    }

    expect(pantallas[0]).toBe(pantallas[1])
  })

  it('el `request` del payload NO se pinta · ni el id ni el correo', async () => {
    server.use(
      http.post(RESET, () =>
        HttpResponse.json(
          {
            success: true,
            data: {
              message: GENERICO,
              request: { id: 'r-secreto', tenant_name: 'Keralty', email: 'alguien@uamx.test' },
            },
          },
          { status: 201 },
        ),
      ),
    )
    const { container } = render(<PasswordReset onClose={() => {}} />)
    await pedir()
    await screen.findByRole('status')

    // Nada del objeto `request` puede filtrarse: el nombre del tenant diría a
    // qué cliente pertenece el correo, que es peor que decir que existe.
    expect(container.textContent).not.toContain('r-secreto')
    expect(container.textContent).not.toContain('Keralty')
  })
})

describe('lo que la pantalla promete', () => {
  it('muestra el mensaje DEL SERVICIO', async () => {
    server.use(
      http.post(RESET, () =>
        HttpResponse.json({ success: true, data: { message: GENERICO } }, { status: 201 }),
      ),
    )
    render(<PasswordReset onClose={() => {}} />)
    await pedir()
    expect(await screen.findByRole('status')).toHaveTextContent(GENERICO)
  })

  it('NO promete un enlace por correo · lo NIEGA explícitamente', async () => {
    // El flujo termina en una solicitud que un admin aprueba. Prometer un
    // enlace deja a la gente esperando algo que no llega.
    //
    // La primera versión de esta prueba prohibía la palabra «enlace», y falló
    // con el texto correcto: la pantalla dice «no se envía un enlace
    // automático», que es lo que hay que decir. Lo que se verifica es la
    // PROMESA, no el vocabulario.
    const { container } = render(<PasswordReset onClose={() => {}} />)
    const texto = container.textContent ?? ''

    expect(texto).toMatch(/no se envía un enlace/i)
    expect(texto).toMatch(/revisa la solicitud/i)
    // Y ninguna de las formas en que se promete uno.
    expect(texto).not.toMatch(/revisá tu correo|te enviamos|recibirás|clic en el enlace/i)
  })

  it('normaliza el correo antes de mandarlo', async () => {
    // Un correo con mayúsculas o espacios es el mismo correo. Lo hace así el
    // ejemplo del servicio.
    let recibido: unknown
    server.use(
      http.post(RESET, async ({ request }) => {
        recibido = await request.json()
        return HttpResponse.json({ success: true, data: { message: GENERICO } }, { status: 201 })
      }),
    )
    render(<PasswordReset onClose={() => {}} />)
    await pedir('  Alguien@UAMX.test ')
    await screen.findByRole('status')
    expect(recibido).toEqual({ email: 'alguien@uamx.test' })
  })
})

describe('cuando ya hay una solicitud', () => {
  it('el 409 se muestra con el texto del servicio', async () => {
    server.use(
      http.post(RESET, () =>
        HttpResponse.json(
          { success: false, error: 'ya existe una solicitud pendiente con este correo' },
          { status: 409 },
        ),
      ),
    )
    render(<PasswordReset onClose={() => {}} />)
    await pedir()
    expect(await screen.findByRole('alert')).toHaveTextContent(/ya existe una solicitud pendiente/)
  })

  it('y se puede reintentar · el formulario sigue ahí', async () => {
    server.use(
      http.post(RESET, () =>
        HttpResponse.json({ success: false, error: 'ya existe una solicitud' }, { status: 409 }),
      ),
    )
    render(<PasswordReset onClose={() => {}} />)
    await pedir()
    await screen.findByRole('alert')
    expect(screen.getByRole('button', { name: /enviar solicitud/i })).toBeEnabled()
  })
})

describe('se puede volver', () => {
  it('«Volver» dispara onClose', async () => {
    const cerrar = vi.fn()
    render(<PasswordReset onClose={cerrar} />)
    await userEvent.click(screen.getByRole('button', { name: /volver/i }))
    expect(cerrar).toHaveBeenCalledTimes(1)
  })
})
