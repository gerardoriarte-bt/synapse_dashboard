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
 *  **El botón de publicar vive en el CHROME desde el 2026-09-15** —el `.pen` lo
 *  dibuja ahí— y la condición del permiso la evalúa el contenedor con estos
 *  mismos términos. Lo que queda acá es la mitad que el chrome no tiene lugar
 *  para decir: qué contestó el servidor, y cuáles son los problemas.
 *
 *  ── LOS PROBLEMAS DEL SERVIDOR VIENEN POR ID ────────────────────────────────
 *
 *  `ValidationError` trae `tab_id` y `panel_id`, mientras que los del front van
 *  por índice —lo recién agregado no tiene id—. Acá ya no es un problema: **solo
 *  se valida lo guardado**, y lo guardado tiene id. Se resuelven contra el
 *  detalle para nombrar la pestaña en vez del UUID.
 */
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import type { ProblemaDeComposicion } from '../../api/admin'

type Props = {
  sucio: boolean
  publicada: boolean
  veredicto: { valido: boolean; problemas: readonly ProblemaDeComposicion[] } | null
  nombreDeTab: (tabId: string | null) => string
  error: string | null
}

/** **El botón de validar se mudó al chrome** el 2026-10-06, al lado de guardar
 *  y publicar: los tres pasos de una sola intención en un solo lugar · §2.4 de
 *  la auditoría. Acá queda lo que el chrome no tiene lugar para decir: qué
 *  contestó el servidor. Y no se pinta si no contestó nada. */
export function PublishBar({ sucio, publicada, veredicto, nombreDeTab, error }: Props) {
  const hayVeredicto = veredicto !== null && !sucio
  if (!hayVeredicto && error === null) return null

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-w4 bg-panel p-4">
      <Label as="div">Validación del servidor</Label>
      {hayVeredicto && (
        <Ayuda>
          {veredicto.valido
            ? publicada
              ? 'Esta versión ya está publicada.'
              : 'El servidor la dio por válida. Ya se puede publicar; publicar no despliega nada, cambia qué versión ve la consola.'
            : `El servidor encontró ${String(veredicto.problemas.length)} ${veredicto.problemas.length === 1 ? 'problema' : 'problemas'}. Hasta corregirlos no se publica.`}
        </Ayuda>
      )}
      {hayVeredicto &&
        veredicto.problemas.map((p, i) => (
          <Ayuda key={`${p.tabId ?? ''}-${p.panelId ?? ''}-${p.campo}-${String(i)}`}>
            {`${nombreDeTab(p.tabId)}${p.panelId === null ? '' : ' · un panel'} · ${p.mensaje}`}
          </Ayuda>
        ))}
      {error !== null && <Ayuda>{error}</Ayuda>}
    </div>
  )
}
