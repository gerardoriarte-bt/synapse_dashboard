/** La placa del cliente · 2026-10-20
 *
 *  El cuadrado que va antes del nombre en la barra, en el selector y en las
 *  cards de Clientes. Hoy lleva el monograma; el logo llega cuando el servicio
 *  tenga dónde guardarlo · §3 de la propuesta del 2026-10-20.
 *
 *  **Neutra, con los tokens que ya hay.** El color del cliente no entra a la
 *  paleta: un hex de marca no es token, el naranja es de acción y ámbar y
 *  amarillo están prohibidos · §4 de la misma propuesta.
 */
import { monograma } from './clienteVisible'

const TAMANO = {
  chica: 'size-6 rounded-sm text-nota',
  media: 'size-9 rounded-md text-celda',
  grande: 'size-12 rounded-lg text-titulo',
} as const

export function PlacaDeCliente({ nombre, tamano = 'media' }: { nombre: string; tamano?: keyof typeof TAMANO }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center border border-w4 bg-elev font-display font-medium text-ink ${TAMANO[tamano]}`}
    >
      {monograma(nombre)}
    </span>
  )
}
