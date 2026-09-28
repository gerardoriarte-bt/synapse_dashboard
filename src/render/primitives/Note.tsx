/** El rol NOTA · mono 9 · §2.3 · 2026-09-28
 *
 *  **El hermano chico de `Label`, y existe por la misma razón.** §2.3 declara
 *  cuatro tamaños mono y los cierra —«ningún otro tamaño mono»—: nota 9, label
 *  10, cifra 11, celda 12. `Label` era el único con primitiva, así que cada vez
 *  que algo necesitaba el de 9 se escribía a mano.
 *
 *  **No es hipotético: estaba duplicado tres veces.** `AdminChrome`, `UserList` y
 *  `FeedHealth` declaran cada uno su `const NOTA = 'font-mono text-nota …'`, y el
 *  `DegradedBadge` fue el cuarto el día que siguió al dibujo. Cuatro copias de
 *  una definición de rol es cómo una cambia y las otras tres no.
 *
 *  ── POR QUÉ NO FIJA EL COLOR, QUE ES LA DIFERENCIA CON `Label` ──────────────
 *
 *  `Label` pinta `text-dim` siempre, porque §2.3 le da ese gris a todos los
 *  labels. **La nota no tiene un color propio**: el `.pen` la dibuja en `$dim`
 *  en las tablas de administración y en `$acc` dentro del badge de degradado.
 *
 *  Así que el color lo pone quien la usa y la nota lo hereda. **Lo que no puede
 *  hacer quien la usa es elegir un color de datos** —regla dura 1— y eso lo
 *  vigila `design-lint`, no este componente.
 */
import type { ReactNode } from 'react'

/** Las tres utilidades salen de tokens: `text-nota` es `--text-nota` (9px) y
 *  `tracking-rotulo` es el `0.12em` que el `.pen` guarda como `letterSpacing:
 *  1.08` sobre 9px — el mismo valor, escrito como lo escribe la escala. */
const NOTE = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase m-0'

export function Note({ children, as: As = 'span' }: { children: ReactNode; as?: 'span' | 'div' }) {
  return <As className={NOTE}>{children}</As>
}
