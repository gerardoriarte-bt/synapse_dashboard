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
 *  **La prosa es MARKDOWN y se dibuja · F3.13.** Hasta el 2026-09-21 se volcaba
 *  tal cual y en pantalla se leía `### Límite declarado` con los tres numerales.
 *  Lo encontró abrir la aplicación, no una prueba. Quien lo dibuja es
 *  `Markdown`, sin inyectar HTML del agente en ningún caso.
 *
 *  **Las cifras del agente todavía no se pintan · F3.6 está bloqueada.** El
 *  evento `dato` trae `valor`, `familia` y su procedencia, pero NO declara con
 *  qué tipo de panel se dibuja, y varios tipos aceptan la misma forma. Elegir
 *  uno acá sería inventar una decisión que el contrato no tomó. Hasta que la
 *  tome, se declara cuántas cifras trajo la respuesta en vez de pintar una mal.
 */
import { ChatFigure } from './ChatFigure'
import type { ChatTurn } from '../../api/useChat'
import type { BlockTable } from '../../catalog/blocks'
import type { PanelType } from '../../catalog/types'
import type { Formatter } from '../../render/format'
import { Label } from '../../render/primitives/Label'
import { Markdown } from './Markdown'
import { useEffect, useState } from 'react'

/** El hueco antes del primer fragmento · 2026-10-06.
 *
 *  **Medido contra QA ese día: 5,8 s hasta la primera palabra y 15,6 s la
 *  respuesta entera.** Un «Consultando» quieto durante seis segundos no se
 *  distingue de una hoja colgada, y fue lo primero que se notó al usarlo.
 *
 *  **Esqueleto y contador, nunca spinner**, que es la regla del `.pen` —«un
 *  spinner sólo dice esperá»—: el esqueleto promete la forma que llega, prosa,
 *  y el contador es la prueba de vida. Cuenta segundos de reloj, no avance: el
 *  front no sabe cuánto falta y no lo finge con una barra.
 *
 *  **Lo que NO muestra son los `thinking`.** El servicio manda las fases del
 *  agente y su razonamiento palabra por palabra, en inglés; es estado interno,
 *  no respuesta —ver `chat.ts`—, y pintarlo sería pintar el borrador.
 *
 *  **El contador va fuera de la región viva.** Dentro de `aria-live`, un lector
 *  de pantalla anunciaría cada segundo. */
function Consultando() {
  const [segundos, setSegundos] = useState(0)
  useEffect(() => {
    const inicio = Date.now()
    const reloj = setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 1000)
    return () => clearInterval(reloj)
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-label tracking-rotulo uppercase text-dim m-0">
        Consultando
        {segundos === 0 ? null : <span aria-hidden="true"> · {segundos} s</span>}
      </p>
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="bg-w2 rounded-xs h-3 w-4/5" />
        <div className="bg-w2 rounded-xs h-3 w-3/5" />
        <div className="bg-w2 rounded-xs h-3 w-2/5" />
      </div>
    </div>
  )
}

type Props = {
  turns: readonly ChatTurn[]
  /** Con qué cuerpo se dibujan las cifras · F3.6. Es el tipo del panel desde
   *  el que se preguntó: la cifra se dibuja como se dibuja ese panel. */
  /** Ausente con contexto de pestaña · ver `ChatFigure`. */
  panelTipo?: PanelType | undefined
  bloques: BlockTable
  format: Formatter
  now: Date
}

export function ChatThread({ turns, panelTipo, bloques, format, now }: Props) {
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
            {turn.streaming && turn.respuesta.texto === '' ? <Consultando /> : null}

            {turn.respuesta.texto === '' ? null : <Markdown texto={turn.respuesta.texto} />}

            {/* **Mientras escribe, también se dice** · 2026-10-06. Con el texto
                ya empezado el agente todavía puede pararse a consultar —una
                llamada a una herramienta a mitad de respuesta— y sin esto la
                hoja se ve terminada cuando no lo está. */}
            {turn.streaming && turn.respuesta.texto !== '' ? (
              <p className="font-mono text-label tracking-rotulo uppercase text-dim m-0">
                Escribiendo
              </p>
            ) : null}

            {/* **Las cifras se DIBUJAN desde el 2026-09-22** · F3.6. Hasta el
                21 sólo se declaraba cuántas traía la respuesta, porque el cable
                no mandaba con qué familia ni con qué BASE pintarlas. */}
            {turn.respuesta.datos.map((dato, j) => (
              <ChatFigure
                key={j}
                dato={dato}
                panelTipo={panelTipo}
                bloques={bloques}
                format={format}
                now={now}
              />
            ))}

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
                Ver la consulta que produjo esta respuesta
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

        </li>
      ))}
    </ol>
  )
}
