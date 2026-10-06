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
import { Accion } from '../../render/primitives/Accion'

type Props = {
  publicada: boolean
  error: string | null
  onDuplicar: () => void
  duplicando: boolean
}

/** **La cuenta de problemas se fue de acá** · 2026-10-06. Se decía tres veces
 *  —arriba, acá y en el resumen— y ahora la dice sólo `ValidationSummary`, que
 *  además lleva a cada uno · §2.5 de la auditoría. Esta barra queda para lo que
 *  NO es global: por qué no se puede guardar esta versión, y cómo salir. Y no
 *  se pinta vacía. */
export function SaveBar({ publicada, error, onDuplicar, duplicando }: Props) {
  if (!publicada && error === null) return null
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-w4 bg-panel p-4">
      {publicada && (
        <div className="flex flex-wrap items-center gap-3">
          <Ayuda as="span">Esta versión está publicada y no se edita. Creá un borrador para trabajar sobre ella.</Ayuda>
          <Accion variante="primaria" onClick={onDuplicar} deshabilitada={duplicando}>
            {duplicando ? 'Creando…' : 'Crear borrador desde esta versión'}
          </Accion>
        </div>
      )}
      {error !== null && <Ayuda>{error}</Ayuda>}
    </div>
  )
}
