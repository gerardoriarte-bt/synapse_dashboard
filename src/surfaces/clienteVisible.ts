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

/** Lo que va al lado del nombre. Vacío cuando no hay nada que decir.
 *
 *  **Hasta el 2026-11-23, sin forma corta se mostraba el id corto** —«2B5008F3»—
 *  en todas partes. En QA se vio debajo de cada cliente sin forma corta, y para
 *  negocio es ruido: el `.pen` (A1 y su propuesta en cards) nunca dibuja un id
 *  ahí, siempre una forma corta legible. Así que sin forma corta no se muestra
 *  nada.
 *
 *  **Salvo un caso, que es por el que el id estaba**: dos clientes con el mismo
 *  nombre —en la base local hay dos «Under Armour México»—. Si `entre` trae la
 *  lista y otro cliente se llama igual, el id corto vuelve: es lo único que los
 *  separa. Sin `entre` no se sabe, y no se muestra. */
export function formaCortaVisible(cliente: ClienteVisible, entre?: readonly ClienteVisible[]): string {
  const nombre = cliente.nombre.trim().toLowerCase()
  const corta = (cliente.formaCorta ?? '').trim()
  if (corta !== '' && corta.toLowerCase() !== nombre) return corta.toUpperCase()
  const homonimo = (entre ?? []).some((c) => c.id !== cliente.id && c.nombre.trim().toLowerCase() === nombre)
  return homonimo ? cliente.id.slice(0, 8).toUpperCase() : ''
}
