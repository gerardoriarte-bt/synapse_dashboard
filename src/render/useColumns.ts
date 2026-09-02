/** Cuántas columnas tiene la grilla ahora · §3.1 y §4 · F1.30
 *
 *  **Vive en JS y no solo en CSS** porque el colapso necesita recalcular el
 *  `colSpan` de cada panel, y ese span viaja en un estilo en línea: una media
 *  query no lo alcanza. Es la trampa medida en v2 — a «seis columnas», un panel
 *  de colSpan 12 seguía midiendo 1.852px porque `grid-column: 1 / span 12` crea
 *  columnas implícitas y ensancha la grilla en vez de recomponerla.
 *
 *  Es estado de LAYOUT, no de negocio: la misma categoría que `useSize`, y por
 *  eso puede vivir en `render/`.
 */
import { useEffect, useState } from 'react'
import { COLUMNS, columnsFor } from './grid'

export function useColumns(): number {
  const [columns, setColumns] = useState<number>(() =>
    // Sin `window` —SSR, o una prueba en entorno node— se asume la grilla
    // completa: es el layout de escritorio, que es el caso de diseño.
    typeof window === 'undefined' ? COLUMNS : columnsFor(window.innerWidth),
  )

  useEffect(() => {
    const onResize = () => setColumns(columnsFor(window.innerWidth))
    window.addEventListener('resize', onResize)
    // Una vez al montar: entre el primer render y el efecto, el ancho pudo
    // cambiar —o el primer render ocurrió sin `window`.
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return columns
}
