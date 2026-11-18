/** Los reportes por correo de un cliente · el contenedor · F6.6, F6.7 y F6.10
 *  · §PEN:A7 · también «A7 · Editor · salir sin guardar»
 *
 *  **Trae los datos y decide qué vista va**, como `Admin` con sus pantallas:
 *  la lista, el editor, la validación o los envíos. Las cuatro son
 *  presentacionales y no llaman a ningún hook.
 *
 *  ── LA VISTA VIVE EN LA URL · auditoría de UX del 2026-11-18 (A3) ─────────
 *
 *  Era estado de React, y las dos salidas que cualquiera prueba primero no
 *  andaban: «Reportes» en el navbar navegaba a la misma ruta y no volvía a la
 *  lista, y «atrás» sacaba de la sección entera. Ahora cada vista tiene su ruta:
 *
 *      /admin/reportes                 la lista
 *      /admin/reportes/nuevo           el alta
 *      /admin/reportes/:id             editar
 *      /admin/reportes/:id/validar     validar
 *      /admin/reportes/:id/envios      los envíos
 *
 *  **Cada acción dice qué hizo** (A4): activar, pausar, reanudar y guardar dejan
 *  un aviso arriba de la vista a la que llevan. Y **si una edición lo devolvió a
 *  borrador, va directo a validar** (A5), que es lo que sigue.
 *
 *  **Las rutas no están en QA** · F6.4 las transcribió de `fb3ca0c`. Esto se
 *  construyó y se miró contra MSW.
 */
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  useActivateReport,
  usePauseReport,
  useReportRuns,
  useReports,
  useSaveReport,
  useValidateReport,
} from '../../api/hooks'
import type { Reporte, RespuestaDeReporte, Rol, Usuario } from '../../api/admin'
import type { Formatter } from '../../render/format'
import { Accion } from '../../render/primitives/Accion'
import { ReportList } from './ReportList'
import { ReportEditor } from './ReportEditor'
import { ReportValidation } from './ReportValidation'
import { ReportRuns } from './ReportRuns'
import { aQuien } from './reporte'
import { FallaDeCarga } from './FallaDeCarga'
import { rutaDe, vistaDe } from './rutasDeReportes'
import type { Vista } from './rutasDeReportes'

const MIGA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase'

type Props = {
  tenantId: string | null
  cliente: string | null
  zonaHoraria: string
  roles: readonly Rol[]
  usuarios: readonly Usuario[]
  format: Formatter
}

const mensaje = (e: Error | null, otro: string) => (e === null ? null : e.message === '' ? otro : e.message)

export function Reportes({ tenantId, cliente, zonaHoraria, roles, usuarios, format }: Props) {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const vista = vistaDe(pathname)
  const ir = (v: Vista) => void navegar(rutaDe(v))

  const reportes = useReports(tenantId)
  const guardar = useSaveReport(tenantId)
  const validar = useValidateReport(tenantId)
  const activar = useActivateReport(tenantId)
  const pausar = usePauseReport(tenantId)
  const idElegido = vista.tipo === 'lista' ? null : vista.id
  const corridas = useReportRuns(tenantId, vista.tipo === 'envios' ? vista.id : null)
  /** Las respuestas de la última validación de esta sesión · de ese reporte y
   *  de ninguno más. */
  const [respuestas, setRespuestas] = useState<{ id: string; lista: RespuestaDeReporte[] } | null>(null)
  /** **El aviso de lo que se hizo** · A4. Vale para la ruta a la que llevó y
   *  se apaga al ir a otra: un «Pausado» no acompaña al editor de otro. */
  const [aviso, setAviso] = useState<{ texto: string; en: string } | null>(null)
  /** **Cambios sin guardar en el editor** · M3. Salir pide confirmación. */
  const [sucio, setSucio] = useState(false)
  const [confirmarSalida, setConfirmarSalida] = useState(false)

  const lista = reportes.data ?? []
  const reporte = idElegido === null ? null : (lista.find((r) => r.id === idElegido) ?? null)

  const avisar = (texto: string, destino: Vista) => {
    setAviso({ texto, en: rutaDe(destino) })
    ir(destino)
  }
  const aLista = (forzar = false) => {
    if (!forzar && vista.tipo === 'editor' && sucio) return setConfirmarSalida(true)
    setConfirmarSalida(false)
    setSucio(false)
    guardar.reset()
    validar.reset()
    activar.reset()
    ir({ tipo: 'lista' })
  }
  const activarReporte = (id: string, alTerminar: Vista) => {
    const antes = lista.find((r) => r.id === id)
    activar.mutate(id, {
      onSuccess: (r) =>
        avisar(
          antes?.estado === 'pausado'
            ? `Reanudado. Próximo envío: ${r.proximoEnvio === null ? 'a la hora programada' : `${format.calendar(r.proximoEnvio)} a las ${r.hora}`}.`
            : `Activado. ${r.proximoEnvio === null ? 'Sale a la hora programada' : `El primer envío sale el ${format.calendar(r.proximoEnvio)} a las ${r.hora}`}, a ${aQuien(r)}.`,
          alTerminar,
        ),
    })
  }

  const textoDeAviso = aviso !== null && aviso.en === pathname ? aviso.texto : null

  return (
    <div className="flex flex-col gap-6">
      {vista.tipo !== 'lista' && (
        <nav aria-label="Migaja" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => aLista()}
            className={`flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-ink hover:text-acc ${MIGA}`}
          >
            {/* `arrow-left` de línea · hereda el color. */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Reportes
          </button>
          <span aria-hidden className={`${MIGA} text-dim`}>/</span>
          <span className={`${MIGA} text-dim`}>
            {vista.tipo === 'editor' && vista.id === null
              ? 'Nuevo'
              : `${reporte?.nombre ?? ''}${vista.tipo === 'validar' ? ' / Validar' : vista.tipo === 'envios' ? ' / Envíos' : ''}`}
          </span>
        </nav>
      )}

      {confirmarSalida && (
        <section role="alertdialog" aria-label="Salir sin guardar" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-w4 bg-panel px-5 py-4">
          <span className="font-body text-cuerpo font-medium text-ink">¿Salir sin guardar? Se pierden los cambios de este reporte.</span>
          <div className="flex gap-2">
            <Accion onClick={() => setConfirmarSalida(false)}>Seguir editando</Accion>
            <Accion variante="peligro" onClick={() => aLista(true)}>
              Salir sin guardar
            </Accion>
          </div>
        </section>
      )}

      {textoDeAviso !== null && (
        <p role="status" className="m-0 rounded-xl border border-w4 bg-panel px-5 py-3 font-body text-cuerpo text-ink">
          {textoDeAviso}
        </p>
      )}

      {/* ── LA LECTURA QUE FALLÓ · A1 ──────────────────────────────────────
          Antes quedaba cargando para siempre: no se leía el error. */}
      {reportes.isError ? (
        <FallaDeCarga que="los reportes de este cliente" error={reportes.error} onReintentar={() => void reportes.refetch()} />
      ) : vista.tipo !== 'lista' && !(vista.tipo === 'editor' && vista.id === null) && reportes.data !== undefined && reporte === null ? (
        /* Un id que la lista no tiene: de otro cliente, o una URL vieja. */
        <section className="flex flex-col items-start gap-3 rounded-xl border border-w3 bg-panel p-6">
          <span className="font-body text-cuerpo font-medium text-ink">Ese reporte no está en este cliente.</span>
          <Accion onClick={() => aLista(true)}>Ver los reportes</Accion>
        </section>
      ) : (
        <>
          {vista.tipo === 'lista' && (
            <ReportList
              reportes={lista}
              cliente={cliente}
              format={format}
              cargando={reportes.data === undefined}
              onNuevo={() => ir({ tipo: 'editor', id: null })}
              onEditar={(id) => ir({ tipo: 'editor', id })}
              onValidar={(id) => ir({ tipo: 'validar', id })}
              onActivar={(id) => activarReporte(id, { tipo: 'lista' })}
              onPausar={(id) =>
                pausar.mutate(id, { onSuccess: () => avisar('Pausado. No se envía hasta que lo reanudes.', { tipo: 'lista' }) })
              }
              onEnvios={(id) => ir({ tipo: 'envios', id })}
              enviando={activar.isPending ? (activar.variables ?? null) : pausar.isPending ? (pausar.variables ?? null) : null}
              error={mensaje(activar.error ?? pausar.error, 'No se pudo cambiar el estado del reporte')}
            />
          )}

          {vista.tipo === 'editor' && (vista.id === null || reporte !== null) && (
            <ReportEditor
              // Un formulario por reporte: el estado inicial sale del que se abre.
              key={vista.id ?? 'nuevo'}
              reporte={reporte}
              roles={roles}
              usuarios={usuarios}
              zonaHoraria={zonaHoraria}
              format={format}
              guardando={guardar.isPending}
              error={mensaje(guardar.error, 'No se pudo guardar el reporte')}
              onCancelar={() => aLista()}
              onCambios={setSucio}
              {...(reporte === null ? {} : { onEnvios: () => ir({ tipo: 'envios', id: reporte.id }) })}
              onGuardar={(datos) =>
                guardar.mutate(
                  { ...(vista.id === null ? {} : { id: vista.id }), reporte: datos },
                  {
                    onSuccess: (r: Reporte) => {
                      setSucio(false)
                      // **Un alta sigue en validar**: nada sale sin validar. Y una
                      // edición que lo devolvió a borrador también (A5).
                      if (vista.id === null)
                        return avisar('Reporte creado. Genera sus respuestas y léelas antes de activarlo.', { tipo: 'validar', id: r.id })
                      if (r.estado === 'borrador' && reporte?.estado !== 'borrador')
                        return avisar('Volvió a borrador: no se envía hasta que lo valides de nuevo.', { tipo: 'validar', id: r.id })
                      avisar('Cambios guardados.', { tipo: 'lista' })
                    },
                  },
                )
              }
            />
          )}

          {vista.tipo === 'validar' && reporte !== null && (
            <ReportValidation
              reporte={reporte}
              respuestas={respuestas?.id === reporte.id ? respuestas.lista : null}
              validando={validar.isPending}
              activando={activar.isPending}
              error={mensaje(validar.error ?? activar.error, 'No se pudo validar el reporte')}
              onValidar={() =>
                validar.mutate(reporte.id, {
                  onSuccess: (v) => {
                    setRespuestas({ id: reporte.id, lista: v.respuestas })
                    // El aviso que pedía generarlas ya se cumplió · visto el 2026-11-18.
                    setAviso(null)
                  },
                })
              }
              onActivar={() => activarReporte(reporte.id, { tipo: 'lista' })}
              onEditar={() => ir({ tipo: 'editor', id: reporte.id })}
            />
          )}

          {vista.tipo === 'envios' && reporte !== null &&
            (corridas.isError ? (
              <FallaDeCarga que="los envíos de este reporte" error={corridas.error} onReintentar={() => void corridas.refetch()} />
            ) : (
              <ReportRuns reporte={reporte} corridas={corridas.data ?? []} format={format} cargando={corridas.data === undefined} />
            ))}
        </>
      )}
    </div>
  )
}
