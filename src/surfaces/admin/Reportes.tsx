/** Los reportes por correo de un cliente · el contenedor · F6.6, F6.7 y F6.10
 *
 *  **Trae los datos y decide qué vista va**, como `Admin` con sus pantallas:
 *  la lista, el editor, la validación o los envíos. Las cuatro son
 *  presentacionales y no llaman a ningún hook.
 *
 *  **La vista es estado y no URL**, igual que la ficha de cliente: recargar
 *  vuelve a la lista, y el cliente activo sobrevive porque lo lleva la URL.
 *  Cambiar de cliente vuelve a la lista: `Admin` lo monta con `key`.
 *
 *  **Las rutas no están en QA** · F6.4 las transcribió de `fb3ca0c`. Esto se
 *  construyó y se miró contra MSW, que es como se construyó la consola antes de
 *  que existiera el servicio.
 */
import { useState } from 'react'
import {
  useActivateReport,
  usePauseReport,
  useReportRuns,
  useReports,
  useSaveReport,
  useValidateReport,
} from '../../api/hooks'
import type { RespuestaDeReporte, Rol, Usuario } from '../../api/admin'
import type { Formatter } from '../../render/format'
import { ReportList } from './ReportList'
import { ReportEditor } from './ReportEditor'
import { ReportValidation } from './ReportValidation'
import { ReportRuns } from './ReportRuns'

type Vista =
  | { tipo: 'lista' }
  | { tipo: 'editor'; id: string | null }
  | { tipo: 'validar'; id: string }
  | { tipo: 'envios'; id: string }

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
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' })
  const reportes = useReports(tenantId)
  const guardar = useSaveReport(tenantId)
  const validar = useValidateReport(tenantId)
  const activar = useActivateReport(tenantId)
  const pausar = usePauseReport(tenantId)
  const idElegido = vista.tipo === 'lista' ? null : vista.id
  const corridas = useReportRuns(tenantId, vista.tipo === 'envios' ? vista.id : null)
  /** Las respuestas de la última validación de esta sesión · del reporte que se
   *  está validando y de ninguno más. */
  const [respuestas, setRespuestas] = useState<{ id: string; lista: RespuestaDeReporte[] } | null>(null)

  const lista = reportes.data ?? []
  const reporte = idElegido === null ? null : (lista.find((r) => r.id === idElegido) ?? null)
  const aLista = () => {
    guardar.reset()
    validar.reset()
    activar.reset()
    setVista({ tipo: 'lista' })
  }

  return (
    <div className="flex flex-col gap-6">
      {vista.tipo !== 'lista' && (
        <nav aria-label="Migaja" className="flex items-center gap-2">
          <button
            type="button"
            onClick={aLista}
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

      {vista.tipo === 'lista' && (
        <ReportList
          reportes={lista}
          cliente={cliente}
          format={format}
          cargando={reportes.data === undefined}
          onNuevo={() => setVista({ tipo: 'editor', id: null })}
          onEditar={(id) => setVista({ tipo: 'editor', id })}
          onValidar={(id) => setVista({ tipo: 'validar', id })}
          onActivar={(id) => activar.mutate(id)}
          onPausar={(id) => pausar.mutate(id)}
          onEnvios={(id) => setVista({ tipo: 'envios', id })}
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
          onCancelar={aLista}
          {...(reporte === null ? {} : { onEnvios: () => setVista({ tipo: 'envios', id: reporte.id }) })}
          onGuardar={(datos) =>
            guardar.mutate(
              { ...(vista.id === null ? {} : { id: vista.id }), reporte: datos },
              // **Un alta sigue en validar**: nada sale sin validar, y es el
              // paso que sigue. Una edición vuelve a la lista.
              { onSuccess: (r) => (vista.id === null ? setVista({ tipo: 'validar', id: r.id }) : aLista()) },
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
            validar.mutate(reporte.id, { onSuccess: (v) => setRespuestas({ id: reporte.id, lista: v.respuestas }) })
          }
          onActivar={() => activar.mutate(reporte.id, { onSuccess: aLista })}
        />
      )}

      {vista.tipo === 'envios' && reporte !== null && (
        <ReportRuns reporte={reporte} corridas={corridas.data ?? []} format={format} cargando={corridas.data === undefined} />
      )}
    </div>
  )
}
