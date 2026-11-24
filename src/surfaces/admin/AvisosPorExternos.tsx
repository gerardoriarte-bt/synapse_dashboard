/** Las advertencias por externos, en Clientes · P6.4 · §PEN:A7 · «A7 ·
 *  Advertencia por un externo», su mitad «2 · En Clientes (A1)»
 *
 *  **Construida mirando el dibujo**: la cabecera con su conteo, y una fila por
 *  externo con el correo, cuándo y quién lo agregó, el reporte y su cliente, y
 *  «Ver reporte». Es la lista que P6.4 pone en Clientes porque es la pantalla
 *  de alcance plataforma: **todos los clientes juntos**.
 *
 *  **Sólo con alcance de plataforma**, y no por gusto: la ruta
 *  (`GET /admin/report-external-notices`, de `5b917f7`) no filtra por cliente y
 *  un admin de cliente la puede leer entera. El front no la pide sin alcance de
 *  plataforma; cerrarla del lado del servicio es del backend.
 *
 *  **Lo que se aparta del dibujo, y por qué —es lo que el servicio manda:**
 *  - **No hay «Marcar como vista», ni «sin ver», ni el filtro**: no hay campo
 *    ni ruta para eso. Un botón sin manejador no se pinta.
 *  - **Quién lo agregó es su correo**, no su nombre: es lo que llega.
 *  - **Un externo que ya no recibe se marca «No lo recibe»**, sin decir por qué:
 *    quitado en el editor o dado de baja desde el correo se guardan igual.
 *  - **Las fechas van en el huso del navegador**: la lista cruza clientes, y no
 *    hay un huso de cliente que valga para todas las filas.
 */
import type { AvisoPorExterno } from '../../api/admin'
import type { Formatter } from '../../render/format'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { StatusChip } from './StatusChip'
import { SkeletonRows } from './SkeletonRows'
import { FallaDeCarga } from './FallaDeCarga'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'
const COLUMNAS = ['Correo externo', 'Reporte y cliente', ''] as const

type Props = {
  avisos: readonly AvisoPorExterno[]
  cargando: boolean
  error: Error | null
  onReintentar: () => void
  /** Abre el reporte en su cliente: quitar un externo se hace ahí. */
  onVerReporte: (clienteId: string, reporteId: string) => void
  format: Formatter
}

export function AvisosPorExternos({ avisos, cargando, error, onReintentar, onVerReporte, format }: Props) {
  const reciben = avisos.filter((a) => a.activo).length

  return (
    <section aria-label="Advertencias · externos en reportes" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label as="div">Advertencias · externos en reportes</Label>
        {!cargando && error === null && (
          <Label>{`${String(avisos.length)} en total · ${String(reciben)} ${reciben === 1 ? 'lo recibe' : 'lo reciben'}`}</Label>
        )}
      </div>

      {error !== null ? (
        <FallaDeCarga que="las advertencias por externos" error={error} onReintentar={onReintentar} />
      ) : (
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
            {!cargando && avisos.length === 0 && (
              <tr>
                <td colSpan={COLUMNAS.length} className="py-6">
                  <Ayuda>Ningún reporte tiene destinatarios externos.</Ayuda>
                </td>
              </tr>
            )}
            {avisos.map((a) => (
              <tr key={a.id} className="border-b border-w3 align-top">
                <td className="py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-ink text-celda">{a.correo}</span>
                    <span className={NOTA}>
                      {`${format.calendar(a.agregadoEn)} ${format.clock(a.agregadoEn)}${a.agregadoPor === null ? '' : ` · agregó ${a.agregadoPor}`}`}
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-ink text-celda">{a.reporte}</span>
                    <span className={NOTA}>{a.cliente}</span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-2">
                    {!a.activo && <StatusChip tono="apagado">No lo recibe</StatusChip>}
                    <Accion tamano="compacta" onClick={() => onVerReporte(a.clienteId, a.reporteId)}>
                      Ver reporte
                    </Accion>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-w2 pt-3">
        <Label>La advertencia informa, no bloquea · quitar un externo se hace en el propio reporte</Label>
        <Label>Externo es quien no tiene usuario en Synapse</Label>
      </div>
    </section>
  )
}
