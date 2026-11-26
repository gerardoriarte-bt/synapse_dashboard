/** Las rutas de las vistas de Reportes · auditoría de UX del 2026-11-18 (A3)
 *
 *  **Un dato, no un render**, como `pantallas.ts`: la vista que pide la URL y
 *  la URL de cada vista. Aparte para que se prueben sin montar nada y para
 *  que la ruta no viva como texto dentro de un componente.
 */
const RUTA_DE_REPORTES = '/admin/reportes'

export type Vista =
  | { tipo: 'lista' }
  | { tipo: 'editor'; id: string | null }
  | { tipo: 'validar'; id: string }
  | { tipo: 'envios'; id: string }

/** La vista que pide la URL · lo que no se reconoce es la lista. */
export function vistaDe(pathname: string): Vista {
  const resto = pathname.startsWith(RUTA_DE_REPORTES) ? pathname.slice(RUTA_DE_REPORTES.length) : ''
  const [id, sub] = resto.split('/').filter((x) => x !== '')
  if (id === undefined) return { tipo: 'lista' }
  if (id === 'nuevo') return { tipo: 'editor', id: null }
  if (sub === 'validar') return { tipo: 'validar', id }
  if (sub === 'envios') return { tipo: 'envios', id }
  return { tipo: 'editor', id }
}

export function rutaDe(v: Vista): string {
  if (v.tipo === 'lista') return RUTA_DE_REPORTES
  if (v.tipo === 'editor') return `${RUTA_DE_REPORTES}/${v.id === null ? 'nuevo' : encodeURIComponent(v.id)}`
  return `${RUTA_DE_REPORTES}/${encodeURIComponent(v.id)}/${v.tipo}`
}

