/** El registro de ACCIÓN · todo lo que ejecuta algo · 2026-10-06
 *
 *  Hasta hoy cada botón del builder escribía su clase a mano —dieciséis
 *  variantes en `src/surfaces/builder/`— y dieciocho de veintiuno vestían el
 *  traje del rótulo: mono de 10, mayúsculas, gris. `SUBIR` se veía igual que
 *  `ORDEN 1` al lado. Ver `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`.
 *
 *  **Una acción siempre tiene caja**, en reposo y no sólo al pasar el cursor:
 *  es la marca que separa lo que se toca de lo que se lee. Y va en Inter con
 *  peso 600 —el eje de peso de Inter variable, que estaba sin usar—, no en mono.
 *
 *  Cuatro variantes, una por intención:
 *
 *  | Variante | Para | Cómo |
 *  |---|---|---|
 *  | `primaria` | La acción que avanza la pantalla · una por zona | Relleno `acc`, texto `on-acc` |
 *  | `secundaria` | Todas las demás | Caja `w5`, texto `ink` |
 *  | `peligro` | Lo que borra | Caja `w5`, texto `peligro` · `decisiones.css` |
 *
 *  `acc` como relleno está dentro de sus usos permitidos —CTA—, y `peligro`
 *  nunca toca un dato: es color de acción.
 *
 *  **Un CTA sin manejador no se pinta**, como en `RecoBody`: por eso `onClick`
 *  es obligatoria. Si la acción no está disponible, `deshabilitada` y una
 *  `Ayuda` al lado que diga por qué.
 */
import type { ReactNode } from 'react'

type Comun = {
  children: ReactNode
  variante?: 'primaria' | 'secundaria' | 'peligro'
  /** `compacta` para las que viven dentro de una fila o un panel angosto. */
  tamano?: 'normal' | 'compacta'
  deshabilitada?: boolean
  /** El nombre accesible cuando el texto visible no alcanza —«Quitar» a secas
   *  en una lista de pestañas no dice cuál—. */
  etiqueta?: string
}

/** **El manejador es obligatorio salvo en un formulario**: un `submit` lo
 *  maneja el `onSubmit` del `<form>`, que es lo que hace funcionar Enter. */
type Props = Comun & ({ tipo?: 'button'; onClick: () => void } | { tipo: 'submit'; onClick?: () => void })

const BASE =
  'inline-flex items-center justify-center gap-2 shrink-0 rounded-md border font-body font-semibold ' +
  'leading-titulo whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'

const VARIANTE = {
  primaria: 'bg-acc border-acc text-on-acc hover:bg-acc-hover hover:border-acc-hover',
  secundaria: 'bg-transparent border-w5 text-ink hover:bg-w2',
  peligro: 'bg-transparent border-w5 text-peligro hover:bg-w2',
} as const

const TAMANO = {
  normal: 'h-8 px-3 text-cuerpo',
  compacta: 'h-7 px-2 text-celda',
} as const

export function Accion({
  children,
  onClick,
  tipo = 'button',
  variante = 'secundaria',
  tamano = 'normal',
  deshabilitada = false,
  etiqueta,
}: Props) {
  return (
    <button
      type={tipo}
      {...(onClick === undefined ? {} : { onClick })}
      disabled={deshabilitada}
      {...(etiqueta === undefined ? {} : { 'aria-label': etiqueta })}
      className={`${BASE} ${VARIANTE[variante]} ${TAMANO[tamano]}`}
    >
      {children}
    </button>
  )
}
