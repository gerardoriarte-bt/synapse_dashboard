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
 *     avisa cuántos quedan, no se impide.
 */
import { Label } from '../../render/primitives/Label'

type Props = {
  sucio: boolean
  guardando: boolean
  /** Cuántos problemas ve el front. **No bloquean guardar** · ver arriba. */
  problemas: number
  /** Una versión publicada no acepta `PUT`. */
  publicada: boolean
  /** El 409 ya ocurrido, o cualquier otro error del PUT. */
  error: string | null
  onGuardar: () => void
  onDuplicar: () => void
  duplicando: boolean
}

export function SaveBar({
  sucio,
  guardando,
  problemas,
  publicada,
  error,
  onGuardar,
  onDuplicar,
  duplicando,
}: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-sm bg-w2 p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onGuardar}
          // Sin cambios no hay nada que mandar, y un PUT de reemplazo completo
          // sobre lo mismo no es inocuo: toca `updated_at` de todo el layout.
          disabled={!sucio || guardando || publicada}
          className="font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w3 disabled:opacity-40"
        >
          {guardando ? 'Guardando…' : 'Guardar borrador'}
        </button>

        <Label as="div">{sucio ? 'Sin guardar' : 'Sin cambios'}</Label>

        {problemas > 0 && (
          // **Se avisa, no se impide.** Un borrador es donde una composición a
          // medias puede vivir; lo que no se puede es publicarla.
          <Label as="div">
            {`${String(problemas)} problema(s) de composición · se guardan igual, no se publican`}
          </Label>
        )}
      </div>

      {publicada && (
        <div className="flex items-center gap-3">
          <Label as="div">
            Esta versión está publicada y no se edita · duplicala para trabajar sobre ella
          </Label>
          <button
            type="button"
            onClick={onDuplicar}
            disabled={duplicando}
            className="font-mono text-label tracking-rotulo uppercase rounded-md px-3 py-1 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w3 disabled:opacity-40"
          >
            {duplicando ? 'Creando…' : 'Crear borrador desde esta versión'}
          </button>
        </div>
      )}

      {error !== null && <Label as="div">{error}</Label>}
    </div>
  )
}
