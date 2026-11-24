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
 *  - **La prueba no dice quién la pidió** · `5b917f7`: la corrida guarda su id,
 *    y no el nombre. Sí dice a qué correo salió, que es el de quien la pidió.
 *
 *  **Cada respuesta dice de dónde salió**, como en la validación, y una fuente
 *  vencida se marca. Una corrida de antes de `5b917f7` no guardó fuentes y lo
 *  dice: «no cita ninguna fuente» es cierto para las dos.
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
import { FuentesDeRespuesta } from './FuentesDeRespuesta'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'
const CARTA = 'flex flex-col gap-3 rounded-xl border border-w3 bg-panel p-5'
const COLUMNAS = ['Fecha', 'Tipo', 'Destinatarios', 'Resultado'] as const

/** **Una validación no envía nada** · 2026-11-18: con una sola tabla, la fila
 *  de la validación decía «Enviado». Se lee por tipo. */
const RESULTADO: Record<CorridaDeReporte['tipo'], Record<CorridaDeReporte['estado'], string>> = {
  envio: { ok: 'Enviado', parcial: 'Con fallas', error: 'Falló' },
  prueba: { ok: 'Enviada', parcial: 'Con fallas', error: 'Falló' },
  validacion: { ok: 'Respondidas', parcial: 'Con fallas', error: 'Falló' },
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
  const pruebas = corridas.filter((c) => c.tipo === 'prueba').length
  /** Una prueba y un envío salen por correo; una validación, no. */
  const salio = (c: CorridaDeReporte) => c.tipo !== 'validacion'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-titulo-lg leading-titulo tracking-titulo text-ink">Envíos</h2>
          <Ayuda>Qué salió, a quién y con qué resultado. Cada envío guarda lo que se mandó ese día.</Ayuda>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusChip>{NOMBRE_DE_ESTADO[reporte.estado]}</StatusChip>
          <Label>{`${String(envios)} ${envios === 1 ? 'envío' : 'envíos'} · ${String(pruebas)} ${pruebas === 1 ? 'prueba' : 'pruebas'} · ninguno se reintenta solo`}</Label>
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
                    {/* **Un botón, para el teclado** · B3: la fila sola sólo se
                        elegía con el mouse. */}
                    <button
                      type="button"
                      aria-pressed={corrida?.id === c.id}
                      onClick={() => setElegida(c.id)}
                      className="flex cursor-pointer flex-col gap-1 border-0 bg-transparent p-0 text-left"
                    >
                      <span className="text-ink text-celda">{format.calendar(c.creadaEn)}</span>
                      <span className={NOTA}>{format.clock(c.creadaEn)}</span>
                    </button>
                  </td>
                  <td className="py-3">
                    <StatusChip>{c.tipo === 'envio' ? 'Envío' : c.tipo === 'prueba' ? 'Prueba' : 'Validación'}</StatusChip>
                  </td>
                  <td className="py-3">
                    <span className="text-ink text-celda">{salio(c) ? String(c.enviadoA.length) : '—'}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className={NOTA}>{RESULTADO[c.tipo][c.estado]}</span>
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
            {salio(corrida) && (
              <section className={CARTA}>
                <div className="flex justify-between">
                  <Label as="div">{`${format.calendar(corrida.creadaEn)} · ${format.clock(corrida.creadaEn)}`}</Label>
                  <Label>{`${String(corrida.enviadoA.length)} ${corrida.enviadoA.length === 1 ? 'enviado' : 'enviados'}`}</Label>
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
                {salio(corrida) ? 'Qué se mandó · las respuestas de ese día' : 'Qué se leyó al validar'}
              </Label>
              {corrida.respuestas.length === 0 && <Ayuda>Esta corrida no guardó respuestas.</Ayuda>}
              <ol className="m-0 flex list-none flex-col gap-3 p-0">
                {corrida.respuestas.map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className={NOTA}>{String(i + 1)}</span>
                    <div className="flex flex-col gap-2">
                      <span className="whitespace-pre-line font-body text-cuerpo leading-cuerpo text-ink">
                        {r.error === null ? r.respuesta : `No hubo respuesta: ${r.error}.`}
                      </span>
                      {r.error === null && <FuentesDeRespuesta fuentes={r.fuentes} format={format} />}
                    </div>
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
