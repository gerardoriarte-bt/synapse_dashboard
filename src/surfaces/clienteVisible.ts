/** Cómo se reconoce un cliente de un vistazo · 2026-10-20
 *
 *  `docs/PROPUESTA-2026-10-20-identidad-del-cliente-y-ficha.md` §3. Hasta acá
 *  lo único que identificaba al cliente era su nombre, y en local los dos
 *  clientes se llaman «Under Armour México»: el selector decía lo mismo antes y
 *  después de cambiar. La identidad son tres piezas —placa, nombre y forma
 *  corta— y las dos que no son el nombre salen de acá.
 *
 *  **El logo todavía no existe**: no hay campo ni ruta en el servicio. Mientras
 *  no llegue, la placa lleva el monograma; cuando llegue, lo reemplaza y nada
 *  más cambia.
 */

export type ClienteVisible = {
  id: string
  nombre: string
  /** `label` del servicio. Puede venir vacía —nadie la cargó— o igual al
   *  nombre —`/config/me` cae a `name` cuando no está—. */
  formaCorta?: string
}

/** Dos letras: la inicial de las dos primeras palabras del nombre, o las dos
 *  primeras letras si es una sola. **Del nombre y no de la forma corta**, porque
 *  la forma corta casi siempre está vacía hoy; derivarla de un campo vacío
 *  daría placas distintas para el mismo cliente según la pantalla. */
export function monograma(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter((p) => p !== '')
  const [primera = '', segunda = ''] = palabras
  const letras = palabras.length > 1 ? (primera[0] ?? '') + (segunda[0] ?? '') : primera.slice(0, 2)
  return letras.toUpperCase()
}

/** Lo que va al lado del nombre. **Si la forma corta no dice nada nuevo**
 *  —vacía, o igual al nombre—, se muestra el id corto: es lo único que separa a
 *  dos clientes con el mismo nombre. */
export function formaCortaVisible(cliente: ClienteVisible): string {
  const corta = (cliente.formaCorta ?? '').trim()
  if (corta !== '' && corta.toLowerCase() !== cliente.nombre.trim().toLowerCase()) return corta.toUpperCase()
  return cliente.id.slice(0, 8).toUpperCase()
}
