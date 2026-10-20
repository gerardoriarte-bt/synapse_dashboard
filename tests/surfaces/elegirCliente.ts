/** Cambiar de cliente desde la barra · 2026-10-20. Lo comparten las pruebas
 *  de las tres superficies: abrir «Cambiar de cliente» y elegir la opción. */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export async function elegirCliente(nombre: RegExp | string) {
  await userEvent.click(await screen.findByRole('button', { name: /Cambiar de cliente/ }))
  await userEvent.click(screen.getByRole('menuitemradio', { name: nombre }))
}
