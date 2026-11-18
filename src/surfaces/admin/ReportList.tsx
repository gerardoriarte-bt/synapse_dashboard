/** Los reportes del cliente · F6.6 · §PEN:A7 · «A7 · Reportes del cliente» y
 *  «A7 · Reportes · sin reportes»
 *
 *  **Construida mirando los dos dibujos**, exportados a PNG el 2026-11-18. La
 *  pregunta operativa, el alcance, las cinco columnas, las acciones por estado y
 *  las tres reglas del pie son literales del frame.
 *
 *  **Lo que se aparta del dibujo, y por qué:**
 *  - **El resultado del último envío no está en la fila.** La lista del servicio
 *    trae la fecha del último envío y no su resultado; el resultado vive en los
 *    envíos de cada reporte. Pedirlos por fila serían N vueltas al abrir.
 *  - **«Pausado desde el …» dice sólo «Pausado».** No hay fecha de pausa.
 *  - **No hay filtro por estado.** Con pocos reportes por cliente no hace falta,
 *    y se suma cuando haga.
 *  - **No hay borrar** (P6.9): pausar es la baja, y lo dice la nota del dibujo
 *    de la lista. La nota todavía ubica «borrar» en el editor; con P6.9 no va.
 */
import type { Reporte } from '../../api/admin'
import type { Formatter } from '../../render/format'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { StatusChip } from './StatusChip'
import { SkeletonRows } from './SkeletonRows'
import { cuandoSale, MAXIMO_DE_DESTINATARIOS, NOMBRE_DE_ESTADO } from './reporte'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'
const COLUMNAS = ['Reporte', 'Estado', 'Cuándo sale', 'Destinatarios', 'Último envío', ''] as const

type Props = {
  reportes: readonly Reporte[]
  cliente: string | null
  format: Formatter
  cargando?: boolean
  onNuevo: () => void
  onEditar: (id: string) => void
  /** Un borrador se VALIDA: abre la pantalla de validar, no valida a ciegas. */
  onValidar: (id: string) => void
  /** Un validado se ACTIVA y un pausado se REANUDA: las dos son activar. */
  onActivar: (id: string) => void
  onPausar: (id: string) => void
  onEnvios: (id: string) => void
  /** El reporte cuya acción está en vuelo · deshabilita su fila. */
  enviando: string | null
  error: string | null
}

export function ReportList({
  reportes,
  cliente,
  format,
  cargando = false,
  onNuevo,
  onEditar,
  onValidar,
  onActivar,
  onPausar,
  onEnvios,
  enviando,
  error,
}: Props) {
  const activos = reportes.filter((r) => r.estado === 'activo').length
  const externos = reportes.reduce((n, r) => n + r.destinatarios.filter((d) => d.tipo === 'externo').length, 0)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <Ayuda>¿Qué le llega por correo a quién, y cuándo?</Ayuda>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-xs bg-w3 px-1 py-0.5">
            <Label>Alcance · cliente</Label>
          </span>
          <Label>
            {reportes.length === 0
              ? '0 reportes'
              : `${String(reportes.length)} ${reportes.length === 1 ? 'reporte' : 'reportes'} · ${String(activos)} ${activos === 1 ? 'activo' : 'activos'} · ${String(externos)} ${externos === 1 ? 'destinatario externo' : 'destinatarios externos'}`}
          </Label>
        </div>
      </header>

      {!cargando && reportes.length === 0 ? (
        /* ── EL VACÍO · «A7 · Reportes · sin reportes» ──────────────────────
           Con su salida propia y la frase del dibujo: qué es un reporte y que
           nada sale sin validar. */
        <section className="flex flex-col items-center gap-3 rounded-xl border border-w3 bg-panel px-6 py-14 text-center">
          <span className="font-body text-cuerpo font-medium text-ink">
            {cliente === null ? 'Este cliente no tiene reportes' : `${cliente} no tiene reportes`}
          </span>
          <Ayuda>
            Un reporte manda por correo las respuestas a entre tres y cinco preguntas de negocio, con los
            datos de este cliente. Nada sale hasta que alguien lea sus respuestas y lo valide.
          </Ayuda>
          <Accion variante="primaria" onClick={onNuevo}>
            Nuevo reporte
          </Accion>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Label as="div">{`Reportes de este cliente · ${String(reportes.length)}`}</Label>
            <Accion variante="primaria" onClick={onNuevo}>
              Nuevo reporte
            </Accion>
          </div>
          {error !== null && <p role="alert" className="m-0 font-body text-cuerpo text-ink">{error}</p>}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {COLUMNAS.map((c, i) => (
                  <th key={i} scope="col" className="text-left pb-2 border-b border-w2">
                    <Label>{c}</Label>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando && <SkeletonRows columnas={COLUMNAS.length} />}
              {reportes.map((r) => {
                const ext = r.destinatarios.filter((d) => d.tipo === 'externo').length
                const ocupado = enviando === r.id
                return (
                  <tr key={r.id} className="border-b border-w3 align-top">
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-ink text-celda">{r.nombre}</span>
                        <span className={NOTA}>{`${String(r.preguntas.length)} preguntas`}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <StatusChip>{NOMBRE_DE_ESTADO[r.estado]}</StatusChip>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-ink text-celda">{cuandoSale(r)}</span>
                        <span className={NOTA}>
                          {r.estado === 'activo' && r.proximoEnvio !== null
                            ? `Próximo · ${format.calendar(r.proximoEnvio)}`
                            : r.estado === 'validado'
                              ? 'Sale al activarlo'
                              : r.estado === 'borrador'
                                ? 'Falta validar las respuestas'
                                : 'Pausado'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-ink text-celda">{String(r.destinatarios.length)}</span>
                        {ext > 0 && <span className={NOTA}>{`${String(ext)} ${ext === 1 ? 'externo' : 'externos'}`}</span>}
                      </div>
                    </td>
                    <td className="py-3">
                      {r.ultimoEnvio === null ? (
                        <span className="font-body text-celda text-dim">Todavía no se envió</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-ink text-celda">{`${format.calendar(r.ultimoEnvio)} · ${format.clock(r.ultimoEnvio)}`}</span>
                          {/* **El resultado no está en la lista del servicio** · M6:
                              no se muestra la fecha como si todo hubiera salido bien. */}
                          <span className={NOTA}>El resultado, en Ver envíos</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        {/* **El paso que hace avanzar el estado va primero y destacado** ·
                            B2 de la auditoría de UX: Validar, Activar o Reanudar no
                            pueden pesar lo mismo que Editar. */}
                        {r.estado === 'borrador' && (
                          <Accion variante="primaria" tamano="compacta" onClick={() => onValidar(r.id)}>
                            Validar
                          </Accion>
                        )}
                        {r.estado === 'validado' && (
                          <Accion variante="primaria" tamano="compacta" deshabilitada={ocupado} onClick={() => onActivar(r.id)}>
                            Activar
                          </Accion>
                        )}
                        {r.estado === 'pausado' && (
                          <Accion variante="primaria" tamano="compacta" deshabilitada={ocupado} onClick={() => onActivar(r.id)}>
                            Reanudar
                          </Accion>
                        )}
                        {(r.estado === 'activo' || r.ultimoEnvio !== null) && (
                          <Accion tamano="compacta" onClick={() => onEnvios(r.id)}>
                            Ver envíos
                          </Accion>
                        )}
                        <Accion tamano="compacta" onClick={() => onEditar(r.id)}>
                          Editar
                        </Accion>
                        {r.estado === 'activo' && (
                          <Accion tamano="compacta" deshabilitada={ocupado} onClick={() => onPausar(r.id)}>
                            Pausar
                          </Accion>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* Las tres reglas del pie, literales del dibujo con P6.1 y P6.5 revisadas. */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-w2 pt-3">
            {/* «Sólo un reporte activo envía» se leía «sólo puede haber uno» · M7. */}
            <Label>Solo los reportes activos se envían · validar es leer antes de activar</Label>
            <Label>Cambiar una pregunta o el rol lo vuelve a borrador</Label>
            <Label>{`Un externo avisa a los superadmins · máximo ${String(MAXIMO_DE_DESTINATARIOS)} destinatarios`}</Label>
            {/* **Quien busque «Borrar» no lo encuentra** · M8: se dice dónde está la baja. */}
            <Label>No se borran: pausar es la baja</Label>
          </div>
        </section>
      )}
    </div>
  )
}
