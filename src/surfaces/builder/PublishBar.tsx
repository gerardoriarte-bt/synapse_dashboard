/** Validar y publicar · F4.14 y F4.15
 *
 *  ── LA SECUENCIA, Y POR QUÉ ES UNA SECUENCIA ────────────────────────────────
 *
 *  «**Nunca se publica algo que el front dio por bueno y el servidor no vio.**»
 *  Eso hace que publicar no sea un botón suelto sino el final de tres pasos, y
 *  cada uno invalida al siguiente:
 *
 *  1. **Guardar.** `POST /validate` valida lo que está GUARDADO, no lo que se ve
 *     en pantalla. Con cambios sin guardar, un «válido» estaría contestando sobre
 *     otra composición. Por eso validar se deshabilita mientras el borrador esté
 *     sucio, y se dice.
 *  2. **Validar.** Y acá está la trampa del servicio: **responde 200 aunque la
 *     composición sea inválida**. El 200 dice que la validación corrió, no que
 *     el layout esté bien; lo que decide es `valido`. Leer el status sería dar
 *     por bueno cualquier cosa.
 *  3. **Publicar**, solo si el servidor dijo `valido`. Y cualquier edición
 *     posterior borra ese permiso: el veredicto era sobre lo que había.
 *
 *  ── LOS PROBLEMAS DEL SERVIDOR VIENEN POR ID ────────────────────────────────
 *
 *  `ValidationError` trae `tab_id` y `panel_id`, mientras que los del front van
 *  por índice —lo recién agregado no tiene id—. Acá ya no es un problema: **solo
 *  se valida lo guardado**, y lo guardado tiene id. Se resuelven contra el
 *  detalle para nombrar la pestaña en vez del UUID.
 */
import { Label } from '../../render/primitives/Label'
import type { ProblemaDeComposicion } from '../../api/admin'

type Props = {
  sucio: boolean
  publicada: boolean
  validando: boolean
  publicando: boolean
  /** `null` mientras nadie validó, o después de tocar algo. */
  veredicto: { valido: boolean; problemas: readonly ProblemaDeComposicion[] } | null
  /** Para nombrar la pestaña de un problema en vez de pintar su UUID. */
  nombreDeTab: (tabId: string | null) => string
  error: string | null
  onValidar: () => void
  onPublicar: () => void
}

export function PublishBar({
  sucio,
  publicada,
  validando,
  publicando,
  veredicto,
  nombreDeTab,
  error,
  onValidar,
  onPublicar,
}: Props) {
  // **`valido === true` y no `veredicto !== null`.** Es la diferencia entre «el
  // servidor contestó» y «el servidor dijo que sí».
  const autorizado = veredicto?.valido === true && !sucio

  return (
    <div className="flex flex-col gap-2 rounded-sm bg-w2 p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onValidar}
          disabled={sucio || validando || publicada}
          className="font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w3 disabled:opacity-40"
        >
          {validando ? 'Validando…' : 'Validar en el servidor'}
        </button>

        <button
          type="button"
          onClick={onPublicar}
          disabled={!autorizado || publicando || publicada}
          className="font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w3 disabled:opacity-40"
        >
          {publicando ? 'Publicando…' : 'Publicar'}
        </button>

        {sucio && (
          <Label as="div">
            Guardá primero · el servidor valida lo guardado, no lo que se ve acá
          </Label>
        )}
      </div>

      {!sucio && veredicto === null && !publicada && (
        // **El estado por defecto no es «listo».** Sin veredicto no hay permiso,
        // y decirlo es lo que impide leer el silencio como aprobación.
        <Label as="div">Sin validar · el servidor todavía no vio esta composición</Label>
      )}

      {veredicto !== null && !sucio && (
        <Label as="div">
          {veredicto.valido
            ? 'El servidor la dio por válida · se puede publicar'
            : `El servidor encontró ${String(veredicto.problemas.length)} problema(s) · no se publica`}
        </Label>
      )}

      {veredicto !== null &&
        !sucio &&
        veredicto.problemas.map((p, i) => (
          <Label key={`${p.tabId ?? ''}-${p.panelId ?? ''}-${p.campo}-${String(i)}`} as="div">
            {`${nombreDeTab(p.tabId)}${p.panelId === null ? '' : ' · un panel'} · ${p.mensaje}`}
          </Label>
        ))}

      {publicada && <Label as="div">Esta versión ya está publicada</Label>}

      {/* Publicar no despliega nada · §7.2: es un cambio de dato, no un build. */}
      <Label as="div">Publicar no despliega · cambia qué layout sirve la consola</Label>

      {error !== null && <Label as="div">{error}</Label>}
    </div>
  )
}
