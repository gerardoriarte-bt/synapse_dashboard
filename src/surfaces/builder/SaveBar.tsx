/** Guardar el borrador · F4.13
 *
 *  §7.2 B2: «**Guardado explícito**, con indicador de cambios sin guardar». Nada
 *  se guarda solo: lo que se ve en pantalla es del navegador hasta que alguien
 *  aprieta.
 *
 *  ── LAS TRES COSAS QUE ESTA BARRA TIENE QUE SOSTENER ────────────────────────
 *
 *  1. **Un layout PUBLICADO no se edita.** El servicio contesta 409 y el front lo
 *     nombra `REGLA_LAYOUT_PUBLICADO`. Se dice **antes** de intentar, no después:
 *     dejar apretar para que falle es enseñar que el botón a veces no anda. Y la
 *     salida existe —duplicar la versión en un borrador nuevo—, así que se ofrece.
 *  2. **El 409 igual puede llegar**, porque alguien puede publicar entre que esta
 *     pantalla leyó la versión y el PUT sale. Ahí se dice lo mismo, con la misma
 *     salida.
 *  3. **Guardar con problemas de composición no se bloquea.** Un borrador es
 *     justamente el lugar donde una composición a medias puede vivir; lo que no
 *     se puede es PUBLICARLA, y eso lo decide el servidor en F4.14 y F4.15. Se
 *     avisa, no se impide — desde el 2026-10-06 lo avisa `ValidationSummary`,
 *     que es el único que cuenta.
 */
import { Ayuda } from '../../render/primitives/Ayuda'

type Props = {
  error: string | null
}

/** **La cuenta de problemas se fue de acá** · 2026-10-06. Se decía tres veces
 *  —arriba, acá y en el resumen— y ahora la dice sólo `ValidationSummary`, que
 *  además lleva a cada uno · §2.5 de la auditoría.
 *
 *  **Y el aviso de la versión publicada también** · 2026-10-07. Desde que el
 *  editor la abre en sólo lectura lo dice el propio editor, con «Editar en un
 *  borrador»; acá quedaba el mismo aviso con otro texto y un segundo botón que
 *  hacía lo mismo. Esta barra queda para el error de guardado, y no se pinta
 *  vacía. */
export function SaveBar({ error }: Props) {
  if (error === null) return null
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-w4 bg-panel p-4">
      <Ayuda>{error}</Ayuda>
    </div>
  )
}
