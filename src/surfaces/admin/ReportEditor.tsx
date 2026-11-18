/** Crear y editar un reporte · F6.7 · §PEN:A7 · «A7 · Editor de reporte»
 *
 *  **Construida mirando el dibujo**, ajustado el 2026-11-18 a P6.1, P6.2 y P6.5
 *  revisadas: «Diaria» en la frecuencia, «N de 50», y agregar un externo avisa a
 *  los superadmins sin volver a borrador. Los avisos salen ANTES de guardar.
 *
 *  **Lo que se aparta del dibujo, y por qué:**
 *  - **Suma «Rol»**, que el dibujo no tiene. El servicio lo exige (`role_id`) y
 *    decide qué datos ve el reporte: las respuestas las da el agente de ese rol,
 *    y un usuario destinatario tiene que tenerlo. Sin él no hay alta posible.
 *  - **Las preguntas no se reordenan arrastrando.** El orden es el del correo y
 *    se respeta el escrito; reordenar se suma cuando haga falta.
 *  - **«Ver las respuestas validadas» abre los envíos**, donde está la corrida
 *    de validación con sus respuestas: no hay otra lectura de lo validado.
 *  - **El próximo envío no se recalcula al editar**: lo calcula el servicio al
 *    guardar. Se muestra el que trae.
 */
import { useEffect, useState } from 'react'
import type { FrecuenciaDeReporte, Reporte, ReporteParaGuardar, Rol, Usuario } from '../../api/admin'
import type { Formatter } from '../../render/format'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { Opcion } from '../../render/primitives/Opcion'
import { StatusChip } from './StatusChip'
import {
  DIAS_DE_SEMANA,
  esCorreo,
  MAXIMO_DE_DESTINATARIOS,
  MAXIMO_DE_PREGUNTAS,
  MINIMO_DE_PREGUNTAS,
  NOMBRE_DE_ESTADO,
  NOMBRE_DE_FRECUENCIA,
  problemaDelReporte,
  vuelveABorrador,
} from './reporte'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'
const CAMPO = 'bg-w2 text-ink text-celda rounded-sm px-2 py-1.5 border border-w4 w-full'
const CARTA = 'flex flex-col gap-4 rounded-xl border border-w3 bg-panel p-5'

type Props = {
  /** `null` es un alta: arranca vacío (P6.3 sigue abierta). */
  reporte: Reporte | null
  roles: readonly Rol[]
  /** Los usuarios del cliente · se ofrecen los que tienen el rol del reporte. */
  usuarios: readonly Usuario[]
  /** La zona del CLIENTE, escrita al lado de la hora: no la del navegador. */
  zonaHoraria: string
  format: Formatter
  /** Un alta manda todo; una edición, sólo lo que cambió. */
  onGuardar: (datos: ReporteParaGuardar | Partial<ReporteParaGuardar>) => void
  onCancelar: () => void
  onEnvios?: () => void
  /** **Si hay cambios sin guardar** · el contenedor pide confirmación al salir
   *  (auditoría de UX del 2026-11-18, M3). */
  onCambios?: (sucio: boolean) => void
  guardando: boolean
  /** El mensaje del servicio, tal cual: la regla es suya. */
  error: string | null
}

export function ReportEditor({
  reporte,
  roles,
  usuarios,
  zonaHoraria,
  format,
  onGuardar,
  onCancelar,
  onEnvios,
  onCambios,
  guardando,
  error,
}: Props) {
  const [nombre, setNombre] = useState(reporte?.nombre ?? '')
  const [rolId, setRolId] = useState(reporte?.rolId ?? '')
  // **Un alta arranca con tres campos vacíos** · B1: es el mínimo, y apretar
  // «Agregar pregunta» tres veces era un paso de más. No son las sugeridas de
  // P6.3, que siguen abiertas: están vacías.
  const [preguntas, setPreguntas] = useState<string[]>(reporte?.preguntas ?? ['', '', ''])
  const [frecuencia, setFrecuencia] = useState<FrecuenciaDeReporte>(reporte?.frecuencia ?? 'semanal')
  const [diaDeSemana, setDiaDeSemana] = useState<number | null>(reporte?.diaDeSemana ?? 1)
  const [diaDelMes, setDiaDelMes] = useState<number | null>(reporte?.diaDelMes ?? 1)
  const [hora, setHora] = useState(reporte?.hora ?? '08:00')
  const originales = {
    usuarios: (reporte?.destinatarios ?? []).flatMap((d) => (d.tipo === 'usuario' && d.usuarioId !== null ? [d.usuarioId] : [])),
    correos: (reporte?.destinatarios ?? []).flatMap((d) => (d.tipo === 'externo' ? [d.correo] : [])),
  }
  const [usuarioIds, setUsuarioIds] = useState<string[]>(originales.usuarios)
  const [correos, setCorreos] = useState<string[]>(originales.correos)
  const [correoNuevo, setCorreoNuevo] = useState('')
  const [problemaDeCorreo, setProblemaDeCorreo] = useState<string | null>(null)
  const [eligiendo, setEligiendo] = useState(false)
  /** Cuántos usuarios sacó el último cambio de rol · M2: se dice, no pasa en silencio. */
  const [sacados, setSacados] = useState<{ cuantos: number; rol: string } | null>(null)

  const externosNuevos = correos.filter((c) => !originales.correos.includes(c))
  const aBorrador = reporte !== null && vuelveABorrador(reporte, { preguntas, rolId })
  const total = usuarioIds.length + correos.length
  const problema = problemaDelReporte({ nombre, rolId, preguntas, frecuencia, diaDeSemana, diaDelMes, hora, destinatarios: total })
  const delRol = usuarios.filter((u) => u.rolId === rolId)
  const inicial = JSON.stringify([
    reporte?.nombre ?? '', reporte?.rolId ?? '', reporte?.preguntas ?? ['', '', ''], reporte?.frecuencia ?? 'semanal',
    reporte?.diaDeSemana ?? 1, reporte?.diaDelMes ?? 1, reporte?.hora ?? '08:00', originales.usuarios, originales.correos,
  ])
  const sucio =
    JSON.stringify([nombre, rolId, preguntas, frecuencia, diaDeSemana, diaDelMes, hora, usuarioIds, correos]) !== inicial
  // Se avisa al contenedor, que es quien decide salir.
  useEffect(() => onCambios?.(sucio), [sucio, onCambios])

  const agregarCorreo = () => {
    const c = correoNuevo.trim().toLowerCase()
    if (!esCorreo(c)) return setProblemaDeCorreo('Ese correo no tiene forma de correo.')
    if (correos.includes(c)) return setProblemaDeCorreo('Ese correo ya está en el reporte.')
    // **Un correo que ya es de un usuario no entra como externo** · P6.6. Se lo
    // agrega como usuario, que es lo que respeta el rol. Pedido también al
    // servicio en `docs/MENSAJE-2026-11-18-backend-ajustes-de-reportes.md`.
    if (usuarios.some((u) => u.email.toLowerCase() === c))
      return setProblemaDeCorreo('Ese correo es de un usuario de este cliente: agrégalo como usuario.')
    setCorreos([...correos, c])
    setCorreoNuevo('')
    setProblemaDeCorreo(null)
  }

  const guardar = () => {
    const completo: ReporteParaGuardar = {
      nombre: nombre.trim(),
      rolId,
      preguntas: preguntas.map((p) => p.trim()),
      frecuencia,
      ...(frecuencia === 'semanal' && diaDeSemana !== null ? { diaDeSemana } : {}),
      ...(frecuencia === 'mensual' && diaDelMes !== null ? { diaDelMes } : {}),
      hora,
      usuarioIds,
      correos,
    }
    if (reporte === null) return onGuardar(completo)
    // **Sólo lo que cambió**, como el `PUT` parcial del servicio.
    const mismo = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i])
    const cuandoCambio =
      frecuencia !== reporte.frecuencia ||
      hora !== reporte.hora ||
      (frecuencia === 'semanal' && diaDeSemana !== reporte.diaDeSemana) ||
      (frecuencia === 'mensual' && diaDelMes !== reporte.diaDelMes)
    onGuardar({
      ...(completo.nombre !== reporte.nombre ? { nombre: completo.nombre } : {}),
      ...(rolId !== reporte.rolId ? { rolId } : {}),
      ...(!mismo(completo.preguntas, reporte.preguntas) ? { preguntas: completo.preguntas } : {}),
      ...(cuandoCambio
        ? {
            frecuencia,
            hora,
            ...(completo.diaDeSemana === undefined ? {} : { diaDeSemana: completo.diaDeSemana }),
            ...(completo.diaDelMes === undefined ? {} : { diaDelMes: completo.diaDelMes }),
          }
        : {}),
      ...(!mismo([...usuarioIds].sort(), [...originales.usuarios].sort()) || rolId !== reporte.rolId ? { usuarioIds } : {}),
      ...(!mismo([...correos].sort(), [...originales.correos].sort()) ? { correos } : {}),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="m-0 font-display text-titulo-lg leading-titulo tracking-titulo text-ink">
            {reporte === null ? 'Nuevo reporte' : reporte.nombre}
          </h2>
          {reporte !== null && (
            <div className="flex items-center gap-2">
              <StatusChip>{NOMBRE_DE_ESTADO[reporte.estado]}</StatusChip>
              <Label>{`Última edición ${format.calendar(reporte.actualizadoEn)}`}</Label>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* **La pista, junto al botón**, y no un error al abrir · M1: «Falta
              el nombre» antes de escribir nada se leía como una falla. */}
          {problema !== null && <Ayuda>{`Para guardar: ${problema.charAt(0).toLowerCase()}${problema.slice(1)}`}</Ayuda>}
          {sucio && <Label>Cambios sin guardar</Label>}
          <Accion onClick={onCancelar}>Cancelar</Accion>
          <Accion variante="primaria" deshabilitada={problema !== null || guardando} onClick={guardar}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Accion>
        </div>
      </div>

      {/* ── LOS AVISOS, ANTES DE GUARDAR · P6.1 y D6.3 ──────────────────────── */}
      {(aBorrador || externosNuevos.length > 0) && (
        <div role="status" className="flex flex-col gap-1 rounded-xl border border-w4 bg-panel px-5 py-4">
          {aBorrador && (
            <>
              <span className="font-body text-cuerpo font-medium text-ink">
                Cambiaste las preguntas o el rol. Al guardar, el reporte vuelve a borrador.
              </span>
              <Ayuda>Deja de enviarse hasta que alguien lea sus respuestas y lo valide de nuevo.</Ayuda>
            </>
          )}
          {externosNuevos.length > 0 && (
            <>
              <span className="font-body text-cuerpo font-medium text-ink">
                Agregaste un destinatario externo. Al guardar, se avisa a los superadmins.
              </span>
              <Ayuda>
                {/* **«Sigue saliendo» sólo es cierto de uno activo** · visto el
                    2026-11-18: en un alta se leía como si ya saliera. */}
                {!aBorrador && reporte?.estado === 'activo'
                  ? 'El reporte sigue saliendo como está, y el externo lo recibe desde el próximo envío. Los superadmins van a recibir una advertencia con quién lo agregó, a qué reporte y a qué correo.'
                  : 'Los superadmins van a recibir una advertencia con quién lo agregó, a qué reporte y a qué correo.'}
              </Ayuda>
            </>
          )}
        </div>
      )}

      {error !== null && (
        <p role="alert" className="m-0 font-body text-cuerpo text-ink">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <section className={CARTA}>
            <label className="flex flex-col gap-2">
              <Label>Nombre</Label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={CAMPO} />
            </label>
          </section>

          <section className={CARTA}>
            <Label as="div">Rol</Label>
            <Ayuda>
              Las respuestas se contestan con los datos que ve este rol, y sólo sus usuarios pueden recibirlo.
            </Ayuda>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <Opcion
                  key={r.id}
                  forma="chip"
                  elegida={rolId === r.id}
                  onClick={() => {
                    setRolId(r.id)
                    // **Los usuarios de otro rol no pueden recibirlo**: el servicio
                    // los rechaza. Se sacan al cambiar el rol, y se dice (M2).
                    const quedan = usuarioIds.filter((id) => usuarios.find((u) => u.id === id)?.rolId === r.id)
                    setSacados(quedan.length < usuarioIds.length ? { cuantos: usuarioIds.length - quedan.length, rol: r.nombre } : null)
                    setUsuarioIds(quedan)
                  }}
                >
                  {r.nombre}
                </Opcion>
              ))}
            </div>
            {sacados !== null && (
              <Ayuda>{`Sacamos ${String(sacados.cuantos)} ${sacados.cuantos === 1 ? 'usuario que no tiene' : 'usuarios que no tienen'} el rol ${sacados.rol}.`}</Ayuda>
            )}
          </section>

          <section className={CARTA}>
            <Label as="div">{`Preguntas · ${String(preguntas.length)} de ${String(MAXIMO_DE_PREGUNTAS)} · el orden es el del correo`}</Label>
            <Ayuda>
              Se contestan con los datos de este cliente: «¿Cuánto invertimos este mes y cómo vamos contra el
              presupuesto?». Una pregunta que pide una decisión, como «¿Qué deberíamos hacer?», no tiene dato: el
              correo lo dice y no la rellena.
            </Ayuda>
            {preguntas.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={NOTA}>{String(i + 1)}</span>
                <input
                  aria-label={`Pregunta ${String(i + 1)}`}
                  value={p}
                  onChange={(e) => setPreguntas(preguntas.map((x, j) => (j === i ? e.target.value : x)))}
                  className={CAMPO}
                />
                <Accion tamano="compacta" etiqueta={`Quitar la pregunta ${String(i + 1)}`} onClick={() => setPreguntas(preguntas.filter((_, j) => j !== i))}>
                  ×
                </Accion>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Accion
                tamano="compacta"
                deshabilitada={preguntas.length >= MAXIMO_DE_PREGUNTAS}
                onClick={() => setPreguntas([...preguntas, ''])}
              >
                Agregar pregunta +
              </Accion>
              <Label>
                {preguntas.length < MINIMO_DE_PREGUNTAS
                  ? `Entre ${String(MINIMO_DE_PREGUNTAS)} y ${String(MAXIMO_DE_PREGUNTAS)} · faltan ${String(MINIMO_DE_PREGUNTAS - preguntas.length)}`
                  : `Entre ${String(MINIMO_DE_PREGUNTAS)} y ${String(MAXIMO_DE_PREGUNTAS)} · quedan ${String(MAXIMO_DE_PREGUNTAS - preguntas.length)}`}
              </Label>
            </div>
          </section>

          {reporte !== null && reporte.validadoEn !== null && (
            <section className={CARTA}>
              <Label as="div">Validación</Label>
              <span className="font-body text-cuerpo text-ink">{`Validado el ${format.calendar(reporte.validadoEn)}.`}</span>
              <Ayuda>Cambiar una pregunta o el rol lo vuelve a borrador. Cambiar los destinatarios, el día o la hora, no.</Ayuda>
              {onEnvios !== undefined && (
                <div className="flex justify-end">
                  <Accion tamano="compacta" onClick={onEnvios}>
                    Ver envíos y validaciones →
                  </Accion>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <section className={CARTA}>
            <div className="flex items-center justify-between">
              <Label as="div">Destinatarios</Label>
              <Label>{`${String(total)} de ${String(MAXIMO_DE_DESTINATARIOS)}`}</Label>
            </div>

            <Label as="div">{`Usuarios del cliente · ${String(usuarioIds.length)}`}</Label>
            {usuarioIds.map((id) => {
              const u = usuarios.find((x) => x.id === id)
              const otroRol = u !== undefined && u.rolId !== rolId
              return (
                <div key={id} className="flex items-center justify-between gap-2 border-b border-w3 pb-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-body text-cuerpo text-ink">{u?.nombre ?? id}</span>
                    {u !== undefined && <span className={NOTA}>{u.email}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {u !== undefined && !u.activo && <StatusChip>Suspendido · no recibe</StatusChip>}
                    {otroRol && <StatusChip>Otro rol · no recibe</StatusChip>}
                    <Accion tamano="compacta" etiqueta={`Quitar a ${u?.nombre ?? id}`} onClick={() => setUsuarioIds(usuarioIds.filter((x) => x !== id))}>
                      ×
                    </Accion>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center justify-end gap-3">
              {rolId === '' && <Ayuda>Elige primero el rol: decide qué datos ve el reporte y quién puede recibirlo.</Ayuda>}
              <Accion tamano="compacta" deshabilitada={rolId === ''} onClick={() => setEligiendo(!eligiendo)}>
                {eligiendo ? 'Listo' : 'Elegir usuarios'}
              </Accion>
            </div>
            {eligiendo && (
              <div className="flex flex-col gap-1">
                {delRol.length === 0 && <Ayuda>Ningún usuario de este cliente tiene ese rol.</Ayuda>}
                {delRol.map((u) => (
                  <Opcion
                    key={u.id}
                    forma="fila"
                    elegida={usuarioIds.includes(u.id)}
                    onClick={() =>
                      setUsuarioIds(usuarioIds.includes(u.id) ? usuarioIds.filter((x) => x !== u.id) : [...usuarioIds, u.id])
                    }
                  >
                    {`${u.nombre} · ${u.email}`}
                  </Opcion>
                ))}
              </div>
            )}

            <Label as="div">{`Correos externos · ${String(correos.length)}`}</Label>
            {correos.map((c) => (
              <div key={c} className="flex items-center justify-between gap-2 border-b border-w3 pb-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-body text-cuerpo text-ink">{c}</span>
                  <span className={NOTA}>{originales.correos.includes(c) ? 'Sin usuario en Synapse' : 'Sin guardar'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip>Externo</StatusChip>
                  <Accion tamano="compacta" etiqueta={`Quitar ${c}`} onClick={() => setCorreos(correos.filter((x) => x !== c))}>
                    ×
                  </Accion>
                </div>
              </div>
            ))}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                agregarCorreo()
              }}
            >
              <input
                aria-label="Correo externo"
                placeholder="nombre@empresa.com"
                value={correoNuevo}
                onChange={(e) => setCorreoNuevo(e.target.value)}
                className={CAMPO}
              />
              <Accion tipo="submit" tamano="compacta">
                Agregar +
              </Accion>
            </form>
            {problemaDeCorreo !== null && <Ayuda>{problemaDeCorreo}</Ayuda>}
            <Label>Externo es quien no tiene usuario, aunque su correo sea del cliente</Label>
          </section>

          <section className={CARTA}>
            <Label as="div">Cuándo sale</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Label>Frecuencia</Label>
              {(['diaria', 'semanal', 'mensual'] as const).map((f) => (
                <Opcion key={f} forma="chip" elegida={frecuencia === f} onClick={() => setFrecuencia(f)}>
                  {NOMBRE_DE_FRECUENCIA[f]}
                </Opcion>
              ))}
            </div>
            {frecuencia === 'semanal' && (
              <label className="flex items-center gap-3">
                <Label>Día</Label>
                <select
                  value={diaDeSemana ?? ''}
                  onChange={(e) => setDiaDeSemana(Number(e.target.value))}
                  className="bg-w2 text-ink text-celda rounded-sm px-2 py-1.5 border border-w4"
                >
                  {DIAS_DE_SEMANA.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {frecuencia === 'mensual' && (
              <label className="flex items-center gap-3">
                <Label>Día</Label>
                <select
                  value={diaDelMes ?? ''}
                  onChange={(e) => setDiaDelMes(Number(e.target.value))}
                  className="bg-w2 text-ink text-celda rounded-sm px-2 py-1.5 border border-w4"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <Label>De cada mes</Label>
              </label>
            )}
            {frecuencia === 'mensual' && (
              <Ayuda>Del 1 al 28, para que salga todos los meses, también en febrero.</Ayuda>
            )}
            <label className="flex items-center gap-3">
              <Label>Hora</Label>
              {/* **Texto `HH:MM` y no `type="time"`** · visto el 2026-11-18: el
                  campo de hora del navegador pinta «08:00 a.m.» con el reloj de
                  quien mira, y el producto usa 24 horas en todos lados. */}
              <input
                aria-label="Hora"
                inputMode="numeric"
                placeholder="08:00"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-20 bg-w2 text-ink text-celda rounded-sm px-2 py-1.5 border border-w4"
              />
              {/* **La zona del cliente, escrita** · las dos zonas de `CLAUDE.md`. */}
              <Label>{`Hora de ${zonaHoraria} · la del cliente`}</Label>
            </label>
            {reporte?.proximoEnvio !== null && reporte?.proximoEnvio !== undefined && (
              <span className="border-t border-w3 pt-3 font-body text-cuerpo text-ink">
                {`Próximo envío: ${format.calendar(reporte.proximoEnvio)}`}
              </span>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
