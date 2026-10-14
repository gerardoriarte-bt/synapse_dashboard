/** Una solicitud de acceso pendiente, con lo que hace falta para decidirla · 2026-10-09
 *
 *  **Para aprobar un alta hay que elegir cliente y agente, y el ROL sale del
 *  agente.** Medido contra el servicio ese día: con el único agente de UA, cuyo
 *  rol es `admin`, la persona aprobada entró como admin. Por eso el rol se dice
 *  ANTES de apretar —«Entra como admin»— y no se deduce después mirando la
 *  lista de usuarios.
 *
 *  **Del agente se muestra el nombre y el rol que atiende, y nada más**: el
 *  servicio también manda base, esquema y warehouse, y §7.3 no deja pintar
 *  vocabulario de infraestructura.
 *
 *  **La contraseña temporal no aparece.** El servicio la devuelve al aprobar y
 *  la manda por correo; el alta es por invitación y nadie ve la contraseña de
 *  otro (§PEN:A3).
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import type { Formatter } from '../../render/format'
import type { Agente, SolicitudDeAcceso } from '../../api/admin'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'
const SELECT = 'bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4'

type Props = {
  s: SolicitudDeAcceso
  format: Formatter
  clientes: readonly { id: string; etiqueta: string }[]
  /** Los agentes de un cliente · `undefined` mientras no llegaron. */
  agentesDe: (clienteId: string) => readonly Agente[] | undefined
  enviando: boolean
  onAprobar: (destino?: { tenantId: string; agenteId: string }) => void
  onRechazar: () => void
}

export function FilaDeSolicitud({ s, format, clientes, agentesDe, enviando, onAprobar, onRechazar }: Props) {
  const [cliente, setCliente] = useState('')
  const [agente, setAgente] = useState('')

  // Sólo los activos: aprobar con un agente dado de baja crearía una cuenta
  // que no puede preguntar nada.
  const agentes = cliente === '' ? undefined : agentesDe(cliente)?.filter((a) => a.activo)
  const elegido = agentes?.find((a) => a.id === agente)
  const esAlta = s.tipo === 'alta'

  return (
    <li className="flex flex-col gap-3 border border-w3 rounded-md p-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-ink text-celda">{s.nombre}</span>
          <span className={NOTA}>{s.email}</span>
        </div>
        <Label>
          {`${esAlta ? 'Pide entrar' : 'Olvidó su contraseña'} · ${format.calendar(s.creadaEn)}`}
        </Label>
      </div>

      {esAlta && (
        <>
          {/* La empresa es lo que la persona ESCRIBIÓ; el cliente lo elige quien
              aprueba. Por eso van en lugares distintos. */}
          <Label as="div">{`${s.empresa} · ${s.cargo}`}</Label>
          {s.uso !== '' && <Ayuda>{`«${s.uso}»`}</Ayuda>}

          <div className="flex items-center gap-3 flex-wrap">
            <select
              aria-label={`Cliente para ${s.nombre}`}
              className={SELECT}
              value={cliente}
              onChange={(e) => {
                setCliente(e.target.value)
                setAgente('')
              }}
            >
              <option value="">Elegir cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.etiqueta}
                </option>
              ))}
            </select>

            {agentes !== undefined && agentes.length > 0 && (
              <select
                aria-label={`Agente para ${s.nombre}`}
                className={SELECT}
                value={agente}
                onChange={(e) => setAgente(e.target.value)}
              >
                <option value="">Elegir agente</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {`${a.nombre} · ${a.rol}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {agentes !== undefined && agentes.length === 0 && (
            <Ayuda>
              Este cliente no tiene un agente activo. Sin agente no se puede aprobar: el rol de la
              persona sale de él.
            </Ayuda>
          )}
          {elegido !== undefined && (
            <Ayuda>{`Entra como ${elegido.rol === '' ? 'user' : elegido.rol}. El rol sale del agente elegido.`}</Ayuda>
          )}
        </>
      )}

      <div className="flex items-center gap-3">
        <Accion
          variante="primaria"
          tamano="compacta"
          deshabilitada={enviando || (esAlta && elegido === undefined)}
          onClick={() => onAprobar(esAlta ? { tenantId: cliente, agenteId: agente } : undefined)}
          etiqueta={`Aprobar la solicitud de ${s.nombre}`}
        >
          {enviando ? 'Enviando…' : esAlta ? 'Aprobar' : 'Enviar contraseña temporal'}
        </Accion>
        <Accion
          tamano="compacta"
          deshabilitada={enviando}
          onClick={onRechazar}
          etiqueta={`Rechazar la solicitud de ${s.nombre}`}
        >
          Rechazar
        </Accion>
      </div>
    </li>
  )
}
