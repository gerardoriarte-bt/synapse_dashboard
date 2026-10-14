/** El registro de OPCIÓN · lo que se elige de un conjunto · 2026-10-06
 *
 *  No es una acción —no ejecuta nada, cambia qué está elegido— y tampoco es un
 *  rótulo. Hasta hoy las versiones, los paneles de una pestaña y las métricas
 *  compatibles se pintaban sin caja en reposo, y la elegida se distinguía por un
 *  fondo `w3` contra `w2`. Ver `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md` §1.2.
 *
 *  **Dos marcas para lo elegido, y ninguna depende del color solo:** borde
 *  `acc` —«estado activo», uno de sus usos permitidos— y un punto delante, que
 *  se lee aun sin distinguir el naranja. El peso sube de 500 a 600.
 *
 *  `aria-pressed` y no `aria-selected`: un `button` suelto no está en un
 *  `listbox`, y `aria-selected` fuera de un rol que lo admita no se anuncia.
 */
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  elegida: boolean
  onClick: () => void
  /** `fila` ocupa el ancho; `chip` se ajusta al texto. */
  forma?: 'fila' | 'chip'
  deshabilitada?: boolean
  etiqueta?: string
}

const BASE =
  'inline-flex items-center gap-2 rounded-md border font-body text-cuerpo leading-titulo text-ink ' +
  'cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'

const FORMA = {
  fila: 'w-full text-left px-3 py-2',
  chip: 'h-8 px-3 whitespace-nowrap',
} as const

export function Opcion({
  children,
  elegida,
  onClick,
  forma = 'chip',
  deshabilitada = false,
  etiqueta,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitada}
      aria-pressed={elegida}
      {...(etiqueta === undefined ? {} : { 'aria-label': etiqueta })}
      className={
        `${BASE} ${FORMA[forma]} ` +
        (elegida ? 'border-acc bg-w2 font-semibold' : 'border-w4 font-medium hover:bg-w2')
      }
    >
      {/* Sólo en la elegida. Reservarle el lugar en todas dejaba un hueco a la
          izquierda de cada opción sin elegir, que se leía como un error de
          alineación —visto en pantalla el 2026-10-06—. Es una caja y no el
          glifo ●: el subconjunto latin de Inter no lo trae. */}
      {elegida && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-acc" />}
      {children}
    </button>
  )
}
