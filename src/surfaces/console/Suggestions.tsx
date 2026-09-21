/** Las preguntas sugeridas · §PEN:C3 · F3.14
 *
 *  **El `.pen` las dibuja como chips que se aprietan y preguntan**, bajo el
 *  rótulo `SUGERIDAS` y justo encima del campo. Hasta el 2026-09-21 eran una
 *  lista de texto: se leían y no se podían usar, que es la mitad de lo que una
 *  sugerencia es para.
 *
 *  **Sin manejador no se pintan.** Es la regla del CTA muerto, y acá pesa más
 *  que en otros lados: un chip con forma de botón que no hace nada es peor que
 *  una lista, porque además promete.
 *
 *  ── DE DÓNDE SALEN, QUE SON DOS FUENTES ─────────────────────────────────────
 *
 *  **Antes de preguntar**, del servicio: `GET /config/panels/{id}/chat-suggestions`
 *  las arma con el contexto del panel, **determinista y sin Cortex**, así que
 *  cambian con el estado del panel — uno sin datos sugiere «¿qué falta para que
 *  tenga datos?» en vez de «¿por qué está en ese nivel?».
 *
 *  **Después de responder**, del agente: el evento `sugerencias` del stream.
 *
 *  Quién decide cuál se muestra es el llamador. Las dos llegan acá como una
 *  lista de texto ya redactado: **el front no escribe copy de producto.**
 */
import { Label } from '../../render/primitives/Label'

type Props = {
  preguntas: readonly string[]
  onPreguntar: (pregunta: string) => void
  /** Mientras el turno en curso transmite. Preguntar de nuevo abortaría ese
   *  stream, igual que el botón del formulario. */
  esperando?: boolean
}

export function Suggestions({ preguntas, onPreguntar, esperando = false }: Props) {
  if (preguntas.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <Label as="div">Sugeridas</Label>
      <ul className="flex list-none flex-wrap gap-2 p-0 m-0">
        {preguntas.map((pregunta) => (
          <li key={pregunta}>
            <button
              type="button"
              disabled={esperando}
              onClick={() => onPreguntar(pregunta)}
              className={
                'rounded-md border border-w3 px-3 py-1 text-left cursor-pointer bg-transparent ' +
                'font-body text-cuerpo leading-cuerpo text-dim ' +
                'hover:border-w5 hover:text-ink disabled:cursor-default disabled:hover:text-dim'
              }
            >
              {pregunta}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
