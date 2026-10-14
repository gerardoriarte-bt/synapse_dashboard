/** La hoja lateral del chat · F3.1 · §PEN:C3
 *
 *  **Desde el 2026-09-30 las mecánicas viven en `SideSheet`**, y este archivo es
 *  lo que §PEN:C3 mide: el ancho, la superficie, el radio y el filo. Apareció la
 *  segunda hoja —el drill-down de §PEN:C2— y **no comparte ninguna de las
 *  cuatro**, así que lo que se compartió es el comportamiento.
 *
 *  **Conserva su nombre y su ancla a propósito.** La extracción no es un cambio
 *  de pantalla, y la forma de demostrarlo fue dejar `tests/surfaces/console/
 *  foco.test.tsx` y `preguntar.test.tsx` verdes **sin tocarlas**: si una hubiera
 *  necesitado un ajuste para pasar, la extracción habría cambiado comportamiento
 *  y había que parar.
 *
 *  Lo que estaba acá y ahora está en `SideSheet`: el Escape con
 *  `stopPropagation`, el foco al abrir, la devolución del foco al disparador, el
 *  velo que cierra al apretarlo, el `role="dialog"` con `aria-modal`, y el
 *  contador de hojas abiertas —que tiene que ser **uno solo** para que el chat y
 *  el drill-down se vean entre ellos—.
 *
 *  ── LA FORMA SALE DEL DIBUJO · 2026-09-21 ───────────────────────────────────
 *
 *  Hasta ese día medía 480 y no tenía velo. El frame `Chat` de §PEN:C3 dice otra
 *  cosa, campo por campo:
 *
 *   · **940 de ancho**, pegada a la derecha — `x=500` sobre un lienzo de 1440.
 *   · **`radius [16, 0, 0, 16]`**: redondeada **solo del lado que entra**.
 *   · **`Filo`**, 940 × 2 en `$acc`, arriba de todo.
 *   · **`Velo`** a pantalla completa por detrás.
 *   · fondo `$dock`, no `$elev`.
 *
 *  **El velo es lo que hace honesto el `aria-modal`.** Estaba declarado desde el
 *  principio y era mentira: sin velo, todo lo de atrás seguía siendo clickeable
 *  y alcanzable por teclado, así que a un lector de pantalla se le decía que el
 *  resto estaba inerte cuando no lo estaba.
 *
 *  ── DOS VALORES QUE EL `.pen` ESCRIBE COMO LITERAL ──────────────────────────
 *
 *  Y acá el `.pen` se contradice consigo mismo, así que no se copia:
 *
 *   · **El radio 16.** Los otros nodos de esa misma pantalla usan tokens
 *     —`$r-lg` en el botón—, pero la hoja lleva un 16 crudo, y **la escala que
 *     el propio `.pen` emite termina en `--radius-xl: 10px`**. Se usa el token.
 *   · **El velo `#0B0B0CCC`.** No hay token con ese valor, y «un hex literal es
 *     un bug» es regla dura. Se usa `shad`, que es el único negro translúcido
 *     del sistema y **se invierte con el tema**, que un hex fijo no hace.
 *     **El frame de §PEN:C2 lo dibuja con `$shad`**, lo que confirma que el token
 *     existe y que el hex de este frame es el descuido.
 *
 *  Las dos quedan como propuesta de spec: o la escala gana un radio de 16 y un
 *  color de velo, o el dibujo usa los que ya hay. Escritas y juntas con las
 *  otras en `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` · §1.
 */
import { SideSheet } from './SideSheet'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  /** Nombra la hoja para el lector de pantalla. */
  title: string
  /** De qué se está hablando · se suma al nombre accesible, para que las hojas
   *  de dos paneles no se llamen igual. */
  contexto?: string
  onClose: () => void
  children: ReactNode
}

export function ChatOverlay({ open, title, contexto, onClose, children }: Props) {
  return (
    <SideSheet
      open={open}
      title={title}
      {...(contexto === undefined ? {} : { contexto })}
      onClose={onClose}
      // 940 del dibujo, pegada a la derecha.
      ancho="w-full max-w-[940px]"
      // `$dock`, y redondeada **solo a la izquierda** — el lado por el que entra.
      superficie="rounded-l-xl bg-dock shadow-[0_0_40px_var(--color-shad)]"
      // El `Filo`: 2px de `$acc` arriba de todo, a lo ancho de la hoja.
      filo="absolute inset-x-0 top-0 z-10 h-0.5 bg-acc"
    >
      {children}
    </SideSheet>
  )
}
