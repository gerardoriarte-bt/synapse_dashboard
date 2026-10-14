/** Las solicitudes de acceso pendientes · A3 · 2026-10-09
 *
 *  **Es la mitad del alta de usuarios que ya se podía construir.** P4 de
 *  `docs/AUDITORIA-2026-10-08-admin-clientes-y-usuarios.md`: el login tiene
 *  «Solicitar acceso» y el servicio guarda la cola desde hace semanas, pero
 *  nadie la veía. Aprobar crea la cuenta y el servicio manda la contraseña
 *  temporal por correo, que es la invitación que el dibujo de A3 pide —«nadie
 *  fija la contraseña de otro»—.
 *
 *  La otra mitad, **invitar a alguien que no pidió acceso**, no tiene ruta: está
 *  pedida al backend en `MENSAJE-2026-10-09-backend-administracion.md`.
 *
 *  **El `.pen` no dibuja esta cola.** Va arriba de la tabla de usuarios porque
 *  es lo que espera una acción; la tabla es consulta.
 */
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { FilaDeSolicitud } from './FilaDeSolicitud'
import type { Formatter } from '../../render/format'
import type { Agente, SolicitudDeAcceso } from '../../api/admin'

type Props = {
  solicitudes: readonly SolicitudDeAcceso[]
  format: Formatter
  clientes: readonly { id: string; etiqueta: string }[]
  agentesDe: (clienteId: string) => readonly Agente[] | undefined
  /** La solicitud cuya decisión está en vuelo. */
  enviando: string | null
  error: string | null
  onAprobar: (id: string, destino?: { tenantId: string; agenteId: string }) => void
  onRechazar: (id: string) => void
  cargando?: boolean
}

export function AccessRequests({
  solicitudes,
  format,
  clientes,
  agentesDe,
  enviando,
  error,
  onAprobar,
  onRechazar,
  cargando = false,
}: Props) {
  const n = solicitudes.length

  return (
    <section className="flex flex-col gap-3" aria-label="Solicitudes de acceso">
      <Label as="div">
        {cargando
          ? 'Solicitudes de acceso · cargando'
          : n === 0
            ? 'Solicitudes de acceso · ninguna pendiente'
            : `Solicitudes de acceso · ${String(n)} ${n === 1 ? 'pendiente' : 'pendientes'}`}
      </Label>
      {n > 0 && (
        <Ayuda>
          Llegan desde «Solicitar acceso» en el inicio de sesión. Aprobar crea la cuenta y el
          servicio le manda a la persona una contraseña temporal por correo.
        </Ayuda>
      )}

      {n > 0 && (
        <ul className="flex flex-col gap-3 list-none m-0 p-0">
          {solicitudes.map((s) => (
            <FilaDeSolicitud
              key={s.id}
              s={s}
              format={format}
              clientes={clientes}
              agentesDe={agentesDe}
              enviando={enviando === s.id}
              onAprobar={(destino) => onAprobar(s.id, destino)}
              onRechazar={() => onRechazar(s.id)}
            />
          ))}
        </ul>
      )}

      {error !== null && <Ayuda>{error}</Ayuda>}
    </section>
  )
}
