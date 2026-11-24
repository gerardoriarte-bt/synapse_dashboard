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
 *  - **«Sin dato» es una respuesta que no cita fuentes** · `5b917f7`. El
 *    servicio no distingue una pregunta sin dato de una contestada: las dos
 *    traen texto y las dos validan. Lo que sí manda es de dónde salió cada
 *    cifra, y una respuesta sin SQL llega sin fuentes. Esa es la que se marca
 *    —el dibujo la deja validar igual—, sin la frase de «qué la desbloquea»,
 *    que nadie manda.
 *  - **No hay «volver a generar esta»**: se generan todas juntas.
 *
 *  **«Enviarme una prueba» llegó con `5b917f7`**: va al correo de quien la
 *  pide y nunca a otro, no cambia el estado, y queda en los envíos marcada
 *  como prueba. Lo que dice al terminar lo escribe `Reportes`, en el aviso de
 *  arriba, como las demás acciones.
 */
import type { Reporte, RespuestaDeReporte } from '../../api/admin'
import type { Formatter } from '../../render/format'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { StatusChip } from './StatusChip'
import { aQuien, cadaCuanto, NOMBRE_DE_ESTADO } from './reporte'
import { FuentesDeRespuesta } from './FuentesDeRespuesta'

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
  /** **Manda el reporte sólo a quien lo pide** · `5b917f7`. */
  onProbar: () => void
  validando: boolean
  activando: boolean
  probando: boolean
  error: string | null
  /** Con el huso del cliente · las fechas de carga de cada fuente. */
  format: Formatter
}

/** **Sin fuentes y sin error**: el agente contestó sin consultar datos. */
const sinDato = (r: RespuestaDeReporte) => r.error === null && r.fuentes.length === 0

export function ReportValidation({
  reporte,
  respuestas,
  onValidar,
  onActivar,
  onEditar,
  onProbar,
  validando,
  activando,
  probando,
  error,
  format,
}: Props) {
  const fallaron = respuestas?.filter((r) => r.error !== null).length ?? 0
  const sinDatos = respuestas?.filter(sinDato).length ?? 0
  const respondidas = (respuestas?.length ?? 0) - fallaron - sinDatos
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
                  {r !== null && <StatusChip>{r.error !== null ? 'Falló' : sinDato(r) ? 'Sin dato' : 'Respondida'}</StatusChip>}
                </div>
                {r === null ? (
                  <Ayuda>{validando ? 'Generando…' : 'Todavía no se generó.'}</Ayuda>
                ) : r.error === null ? (
                  <>
                    <p className="m-0 whitespace-pre-line font-body text-cuerpo font-medium leading-cuerpo text-ink">{r.respuesta}</p>
                    <FuentesDeRespuesta fuentes={r.fuentes} format={format} sinFuentes="No cita ninguna fuente · el agente no consultó datos" />
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
                  : `${String(fallaron)} ${fallaron === 1 ? 'respuesta falló' : 'respuestas fallaron'} · vuelve a generarlas`}
            </Label>
            {respuestas !== null && (
              <dl className="m-0 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label as="dt">Respondidas</Label>
                  <span className="font-body text-cuerpo text-ink">{String(respondidas)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label as="dt">Sin dato · no citan fuentes</Label>
                  <span className="font-body text-cuerpo text-ink">{String(sinDatos)}</span>
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
            <Accion deshabilitada={probando} onClick={onProbar}>
              {probando ? 'Enviando la prueba…' : 'Enviarme una prueba'}
            </Accion>
            <Label>La prueba llega sólo a quien la pide y queda marcada como prueba</Label>
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
