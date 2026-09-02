/** El único camino a un label · §2.3 y regla dura 4 · F1.13c
 *
 *  §ANCLA:TIPO-1 · §2.3 de design.md: «**siempre mayúsculas**, 10px,
 *  letter-spacing 0.12em».
 *
 *  Existe para que L15 del lint se verifique buscando este import en vez de
 *  analizando estilos: si todo label pasa por acá, «labels en mono mayúsculas»
 *  deja de ser una regla que alguien puede olvidar y pasa a ser la única forma
 *  de escribir uno.
 *
 *  **`uppercase` va acá y no en el llamador.** Así el label se escribe en prosa
 *  normal en el código —`<Label>Base</Label>`— y sale en mayúsculas siempre, sin
 *  que nadie tenga que acordarse. Un `<Label>BASE</Label>` y un `<Label>Base
 *  </Label>` pintan idéntico, que es la propiedad que hace la regla verificable.
 */
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Por defecto `span`. `dt` cuando el label encabeza un dato en una lista de
   *  definición, que es lo que son la BASE y la procedencia. */
  as?: 'span' | 'div' | 'dt'
  id?: string
}

/** Las cuatro utilidades salen de tokens: `font-mono` de `--font-mono`,
 *  `text-dim` de `--color-dim`. El 10px y el 0.12em son valores arbitrarios
 *  porque §2.3 los fija como números y no como tokens — son la definición del
 *  rol tipográfico, no una decisión de este componente. */
const LABEL = 'font-mono text-[10px] leading-[1.2] tracking-[0.12em] uppercase text-dim m-0'

export function Label({ children, as: As = 'span', id }: Props) {
  return (
    <As className={LABEL} {...(id === undefined ? {} : { id })}>
      {children}
    </As>
  )
}
