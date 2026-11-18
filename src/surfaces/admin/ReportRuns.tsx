/** Los envíos de un reporte · F6.6 · §PEN:A7 · «A7 · Envíos de un reporte»
 *
 *  **Construida mirando el dibujo**: la tabla de envíos a la izquierda y, al
 *  elegir uno, lo que se mandó ese día a la derecha. Cada envío guarda sus
 *  respuestas, así que lo de octubre se lee como salió en octubre.
 *
 *  **Lo que se aparta del dibujo, y por qué —es lo que el servicio guarda:**
 *  - **No hay resultado por destinatario ni rebotes.** Una corrida guarda la
 *    lista de correos a los que salió y un texto con las fallas; se muestran así.
 *  - **Las validaciones también están**, marcadas: son la otra mitad de la
 *    historia —qué se leyó antes de activar— y el servicio las guarda juntas.
 *  - **No hay pruebas**: todavía no se pueden pedir.
 *  - **«Ver el correo completo» no va**: no hay una lectura del correo enviado.
 */
import { useState } from 'react'
import type { CorridaDeReporte, Reporte } from '../../api/admin'
import type { Formatter } from '../../render/format'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { StatusChip } from './StatusChip'
import { SkeletonRows } from './SkeletonRows'
import { NOMBRE_DE_ESTADO } from './reporte'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'
const CARTA = 'flex flex-col gap-3 rounded-xl border border-w3 bg-panel p-5'
const COLUMNAS = ['Fecha', 'Tipo', 'Destinatarios', 'Resultado'] as const

const RESULTADO: Record<CorridaDeReporte['estado'], string> = {
  ok: 'Bien',
  parcial: 'Con fallas',
  error: 'Falló',
}

type Props = {
  reporte: Reporte
  corridas: readonly CorridaDeReporte[]
  format: Formatter
  cargando: boolean
}

export function ReportRuns({ reporte, corridas, format, cargando }: Props) {
  const [elegida, setElegida] = useState<string | null>(null)
  const corrida = corridas.find((c) => c.id === elegida) ?? corridas[0] ?? null
  const envios = corridas.filter((c) => c.tipo === 'envio').length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-titulo-lg leading-titulo tracking-titulo text-ink">Envíos</h2>
          <Ayuda>Qué salió, a quién y con qué resultado. Cada envío guarda lo que se mandó ese día.</Ayuda>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusChip>{NOMBRE_DE_ESTADO[reporte.estado]}</StatusChip>
          <Label>{`${String(envios)} ${envios === 1 ? 'envío' : 'envíos'} · ninguno se reintenta solo`}</Label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3">
          <Label as="div">{`Envíos y validaciones de este reporte · ${String(corridas.length)}`}</Label>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {COLUMNAS.map((c) => (
                  <th key={c} scope="col" className="text-left pb-2 border-b border-w2">
                    <Label>{c}</Label>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando && <SkeletonRows columnas={COLUMNAS.length} />}
              {!cargando && corridas.length === 0 && (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-6">
                    <Ayuda>Este reporte todavía no se validó ni se envió.</Ayuda>
                  </td>
                </tr>
              )}
              {corridas.map((c) => (
                <tr
                  key={c.id}
                  aria-selected={corrida?.id === c.id}
                  onClick={() => setElegida(c.id)}
                  className={`cursor-pointer border-b border-w3 align-top ${corrida?.id === c.id ? 'bg-w2' : ''}`}
                >
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-ink text-celda">{format.calendar(c.creadaEn)}</span>
                      <span className={NOTA}>{format.clock(c.creadaEn)}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <StatusChip>{c.tipo === 'envio' ? 'Envío' : 'Validación'}</StatusChip>
                  </td>
                  <td className="py-3">
                    <span className="text-ink text-celda">{c.tipo === 'envio' ? String(c.enviadoA.length) : '—'}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className={NOTA}>{RESULTADO[c.estado]}</span>
                      {c.error !== '' && <span className={NOTA}>{c.error}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {corrida !== null && (
          <div className="flex flex-col gap-4">
            {corrida.tipo === 'envio' && (
              <section className={CARTA}>
                <div className="flex justify-between">
                  <Label as="div">{`${format.calendar(corrida.creadaEn)} · ${format.clock(corrida.creadaEn)}`}</Label>
                  <Label>{`${String(corrida.enviadoA.length)} enviados`}</Label>
                </div>
                {corrida.enviadoA.map((correo) => (
                  <div key={correo} className="flex items-center justify-between border-b border-w3 pb-2">
                    <span className="font-body text-cuerpo text-ink">{correo}</span>
                    <StatusChip>Enviado</StatusChip>
                  </div>
                ))}
                {corrida.error !== '' && <Ayuda>{corrida.error}</Ayuda>}
              </section>
            )}
            <section className={CARTA}>
              <Label as="div">
                {corrida.tipo === 'envio' ? 'Qué se mandó · las respuestas de ese día' : 'Qué se leyó al validar'}
              </Label>
              {corrida.respuestas.length === 0 && <Ayuda>Esta corrida no guardó respuestas.</Ayuda>}
              <ol className="m-0 flex list-none flex-col gap-3 p-0">
                {corrida.respuestas.map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className={NOTA}>{String(i + 1)}</span>
                    <span className="font-body text-cuerpo leading-cuerpo text-ink">
                      {r.error === null ? r.respuesta : `No hubo respuesta: ${r.error}.`}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
