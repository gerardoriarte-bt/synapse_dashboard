/** Los mensajes del hilo · F3.5
 *
 *  **Recibe una lista y un estado. No sabe qué es SSE**, no abre nada y no
 *  acumula: eso es `useChat`. Es lo que permite montarlo con turnos fijos en una
 *  prueba sin una conexión, y lo que pide el criterio de F3.8.
 *
 *  **El estado de streaming se anuncia, no se dibuja girando.** La casa no usa
 *  spinners —`LoadingState` lo dice para los paneles— y acá hay algo mejor: la
 *  prosa que aparece ES el indicador. Lo único que hace falta es cubrir el hueco
 *  ANTES del primer fragmento, que es cuando el agente está consultando Gold y
 *  la pantalla no tiene nada que mostrar.
 *
 *  **Las cifras del agente todavía no se pintan · F3.6 está bloqueada.** El
 *  evento `dato` trae `valor`, `familia` y su procedencia, pero NO declara con
 *  qué tipo de panel se dibuja, y varios tipos aceptan la misma forma. Elegir
 *  uno acá sería inventar una decisión que el contrato no tomó. Hasta que la
 *  tome, se declara cuántas cifras trajo la respuesta en vez de pintar una mal.
 */
import type { ChatTurn } from '../../api/useChat'
import { Label } from '../../render/primitives/Label'

export function ChatThread({ turns }: { turns: readonly ChatTurn[] }) {
  if (turns.length === 0) {
    return (
      <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
        Preguntá sobre lo que estás viendo. La respuesta llega con su SQL y su
        procedencia.
      </p>
    )
  }

  return (
    <ol className="flex list-none flex-col gap-6 p-0 m-0">
      {turns.map((turn, i) => (
        <li key={i} className="flex flex-col gap-2">
          <p className="font-body text-cuerpo leading-cuerpo text-ink m-0">
            <Label as="span">Preguntaste</Label> {turn.pregunta}
          </p>

          {/* `aria-live` en la respuesta y no en la hoja entera: si envolviera
              todo, un lector de pantalla releería la pregunta en cada
              fragmento que llega. */}
          <div aria-live="polite" aria-busy={turn.streaming} className="flex flex-col gap-2">
            {turn.streaming && turn.respuesta.texto === '' ? (
              <p className="font-mono text-label tracking-rotulo uppercase text-dim m-0">
                Consultando
              </p>
            ) : null}

            {turn.respuesta.texto === '' ? null : (
              <p className="font-body text-cuerpo leading-cuerpo text-ink m-0 whitespace-pre-wrap">
                {turn.respuesta.texto}
              </p>
            )}

            {turn.respuesta.datos.length === 0 ? null : (
              <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
                {turn.respuesta.datos.length === 1
                  ? 'La respuesta trae una cifra que todavía no se dibuja.'
                  : `La respuesta trae ${turn.respuesta.datos.length} cifras que todavía no se dibujan.`}
              </p>
            )}

            {turn.error === null ? null : (
              <p className="font-body text-cuerpo leading-cuerpo text-ink m-0">
                {turn.error.mensaje}{' '}
                {turn.error.parcial
                  ? 'Lo que alcanzó a responder sigue arriba.'
                  : 'La respuesta no se pudo conservar.'}
              </p>
            )}
          </div>

          {/* §7.1: «toda respuesta muestra el SQL generado en un desplegable».
              Cerrado por defecto — es auditabilidad, no lectura. */}
          {turn.respuesta.auditoria === null ? null : (
            <details className="border-t border-w2 pt-2">
              <summary className="font-mono text-label tracking-rotulo uppercase text-dim cursor-pointer">
                Cómo se calculó
              </summary>
              <pre className="font-mono text-celda text-ink overflow-x-auto m-0 mt-2">
                {turn.respuesta.auditoria.sql}
              </pre>
              {turn.respuesta.auditoria.limiteDeclarado == null ? null : (
                <p className="font-body text-cuerpo leading-cuerpo text-dim m-0 mt-2">
                  <Label as="span">No afirma</Label>{' '}
                  {turn.respuesta.auditoria.limiteDeclarado}
                </p>
              )}
            </details>
          )}

          {turn.respuesta.sugerencias.length === 0 ? null : (
            <ul className="flex list-none flex-col gap-1 p-0 m-0">
              {turn.respuesta.sugerencias.map((s) => (
                <li key={s} className="font-body text-cuerpo leading-cuerpo text-dim">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  )
}
