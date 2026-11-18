/** Validar las respuestas antes de activar · F6.10 · §PEN:A7 · «A7 · Validar
 *  respuestas»
 *
 *  Es D6.4: nadie activa un reporte sin haber leído lo que va a mandar.
 *  **Construida mirando el dibujo**, con la tarjeta de cada respuesta, el
 *  resumen «antes de validar» y la frase «al activar».
 *
 *  **Lo que se aparta del dibujo, y por qué —todo es del servicio de hoy:**
 *  - **Generar y validar son un solo paso.** `validate` genera las respuestas y,
 *    si todas contestan, deja el reporte validado. No hay forma de verlas antes.
 *  - **Cada respuesta no dice de dónde sale su cifra**: el servicio todavía no
 *    lo manda. Se declara en la tarjeta en vez de inventar la fuente. Pedido en
 *    `docs/MENSAJE-2026-11-18-backend-ajustes-de-reportes.md`.
 *  - **No hay «sin dato»**: el servicio no distingue una pregunta sin dato de una
 *    contestada; el agente lo dice en el texto.
 *  - **No hay «volver a generar esta»**: se generan todas juntas.
 *  - **No hay «Enviarme una prueba»**: no hay ruta. Un botón sin manejador no se
 *    pinta (la regla del CTA muerto).
 */
import type { Reporte, RespuestaDeReporte } from '../../api/admin'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { StatusChip } from './StatusChip'
import { aQuien, cadaCuanto, NOMBRE_DE_ESTADO } from './reporte'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'
const CARTA = 'flex flex-col gap-3 rounded-xl border border-w3 bg-panel p-5'

type Props = {
  reporte: Reporte
  /** `null` hasta generar · las de la última validación de esta sesión. */
  respuestas: readonly RespuestaDeReporte[] | null
  onValidar: () => void
  onActivar: () => void
  /** **Corregir una pregunta sin salir por la migaja** · M4. */
  onEditar: () => void
  validando: boolean
  activando: boolean
  error: string | null
}

export function ReportValidation({ reporte, respuestas, onValidar, onActivar, onEditar, validando, activando, error }: Props) {
  const fallaron = respuestas?.filter((r) => r.error !== null).length ?? 0
  const respondidas = (respuestas?.length ?? 0) - fallaron
  // **Activar no está disponible hasta validar** · F6.10. Un pausado ya se
  // validó: reanudarlo no exige validar de nuevo.
  const activable = reporte.estado === 'validado' || reporte.estado === 'pausado'
  /** **El momento**, que decide qué dice la tarjeta · A2. Generar y validar
   *  son un solo paso en el servicio: lo que confundía era decir «Validar ✓»
   *  sobre algo que todavía nadie leyó. */
  const momento = respuestas === null ? 'antes' : fallaron > 0 ? 'fallaron' : 'leer'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-titulo-lg leading-titulo tracking-titulo text-ink">Validar las respuestas</h2>
          <Ayuda>Así saldría el correo hoy, con los datos de este cliente. Nada se envía hasta activarlo.</Ayuda>
        </div>
        <StatusChip>{NOMBRE_DE_ESTADO[reporte.estado]}</StatusChip>
      </div>

      {error !== null && (
        <p role="alert" className="m-0 font-body text-cuerpo text-ink">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {reporte.preguntas.map((p, i) => {
            const r = respuestas?.find((x) => x.pregunta === p) ?? respuestas?.[i] ?? null
            return (
              <section key={i} className={CARTA} aria-label={`Pregunta ${String(i + 1)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className={NOTA}>{String(i + 1)}</span>
                    <span className="font-body text-cuerpo text-dim">{p}</span>
                  </div>
                  {r !== null && <StatusChip>{r.error === null ? 'Respondida' : 'Falló'}</StatusChip>}
                </div>
                {r === null ? (
                  <Ayuda>{validando ? 'Generando…' : 'Todavía no se generó.'}</Ayuda>
                ) : r.error === null ? (
                  <>
                    <p className="m-0 font-body text-cuerpo font-medium leading-cuerpo text-ink">{r.respuesta}</p>
                    <Label>Todavía no dice de dónde sale esta cifra</Label>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="font-body text-cuerpo font-medium text-ink">No se pudo generar esta respuesta.</span>
                    <Ayuda>{`${r.error.replace(/\.$/, '')}. Mientras esta respuesta falle, el reporte no se puede validar.`}</Ayuda>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <div className="flex flex-col gap-4">
          <section className={CARTA}>
            <Label as="div">
              {momento === 'antes'
                ? 'Antes de activar'
                : momento === 'leer'
                  ? 'Respuestas generadas · léelas'
                  : `${String(fallaron)} ${fallaron === 1 ? 'respuesta falló' : 'respuestas fallaron'} · vuelve a generarlas para poder validar`}
            </Label>
            {respuestas !== null && (
              <dl className="m-0 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label as="dt">Respondidas</Label>
                  <span className="font-body text-cuerpo text-ink">{String(respondidas)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label as="dt">Fallaron · bloquean validar</Label>
                  <span className="font-body text-cuerpo text-ink">{String(fallaron)}</span>
                </div>
              </dl>
            )}
            <Ayuda>
              {momento === 'antes'
                ? 'Generamos las respuestas con los datos de hoy. Si todas contestan, el reporte queda validado: léelas antes de activarlo.'
                : momento === 'leer'
                  ? 'Activar confirma que leíste estas respuestas. Desde ahí sale solo.'
                  : 'Una respuesta que falló bloquea validar. Vuelve a generarlas, o cambia la pregunta.'}
            </Ayuda>
            <Accion variante={respuestas === null ? 'primaria' : 'secundaria'} deshabilitada={validando || reporte.estado === 'activo'} onClick={onValidar}>
              {validando ? 'Generando…' : respuestas === null ? 'Generar las respuestas' : 'Volver a generar todas'}
            </Accion>
            <Accion variante={respuestas === null ? 'secundaria' : 'primaria'} deshabilitada={!activable || activando} onClick={onActivar}>
              {reporte.estado === 'pausado' ? 'Reanudar' : 'Activar'}
            </Accion>
            {!activable && reporte.estado !== 'activo' && <Label>Se activa después de validar</Label>}
            <Accion tamano="compacta" onClick={onEditar}>
              Editar el reporte
            </Accion>
          </section>

          <section className={CARTA}>
            <Label as="div">Al activar</Label>
            <span className="font-body text-cuerpo leading-cuerpo text-ink">
              {`Sale ${cadaCuanto(reporte)} (hora del cliente), a ${aQuien(reporte)}. Un usuario suspendido o que ya no tiene el rol no recibe.`}
            </span>
          </section>
        </div>
      </div>
    </div>
  )
}
