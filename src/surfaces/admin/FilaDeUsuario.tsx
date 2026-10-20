/** Una fila de usuario, con sus acciones · A3 y la ficha · 2026-10-09
 *
 *  **Las acciones son dos y no tres.** Cambiar el rol, y suspender o reactivar.
 *  El servicio tiene además un `DELETE`, y hace lo mismo que suspender —baja
 *  lógica, la fila se conserva—: ofrecerlo como «dar de baja» prometería una
 *  acción distinta que no existe.
 *
 *  **El rol se elige entre los de SU cliente**, que es lo único que el servicio
 *  acepta —medido: un rol ajeno es 400—. Mientras esos roles no llegaron, el
 *  selector no se pinta: ofrecer una lista vacía se leería como «este cliente no
 *  tiene roles».
 *
 *  **La fila propia no ofrece nada**, y lo dice. Es la regla de A1 —«nadie se
 *  revoca a sí mismo»—: quitarse el rol de admin es perder la pantalla en la
 *  que se está, y suspenderse es cerrar la propia sesión sin vuelta.
 *
 *  **Suspender no es «peligro»**: el rojo es de lo que borra —decisión del
 *  2026-10-06— y suspender se deshace con un clic.
 *
 *  **Pero sí se confirma, igual que cambiar el rol** · F5.24, 2026-10-19. Las
 *  dos se aplicaban en el acto: el `<select>` mandaba el cambio al elegir, y
 *  una rueda de mouse sobre él le cambiaba el permiso a una persona. Ahora
 *  quedan PENDIENTES y la fila dice qué va a pasar y a quién antes de mandar
 *  nada. Reactivar no se confirma: devuelve un acceso, no lo quita.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Accion } from '../../render/primitives/Accion'
import type { Formatter } from '../../render/format'
import type { CambioDeUsuario, Usuario } from '../../api/admin'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'
const SELECT = 'bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4'

type Props = {
  u: Usuario
  dePlataforma: boolean
  format: Formatter
  /** Los roles de su cliente · `undefined` mientras no llegaron. */
  roles: readonly { id: string; nombre: string }[] | undefined
  propia: boolean
  enviando: boolean
  /** Sin manejador no se pintan las acciones. */
  onCambiar?: (u: Usuario, cambio: CambioDeUsuario) => void
}

export function FilaDeUsuario({ u, dePlataforma, format, roles, propia, enviando, onCambiar }: Props) {
  const conAcciones = onCambiar !== undefined && !propia
  const [pendiente, setPendiente] = useState<CambioDeUsuario | null>(null)
  const rolPendiente =
    pendiente?.rolId === undefined ? null : (roles?.find((r) => r.id === pendiente.rolId)?.nombre ?? null)
  const confirmar = () => {
    if (pendiente === null || onCambiar === undefined) return
    setPendiente(null)
    onCambiar(u, pendiente)
  }

  return (
    <tr className="border-b border-w3 align-top">
      <td className="py-3">
        <div className="flex flex-col gap-1">
          <span className="text-ink text-celda">{u.nombre}</span>
          <span className={NOTA}>{u.email}</span>
        </div>
      </td>
      {dePlataforma && (
        <td className="py-3">
          {/* `—` cuando no llega, y no el id: un guion dice «no sé». */}
          <span className="text-ink text-celda">{u.clienteNombre ?? '—'}</span>
        </td>
      )}
      <td className="py-3">
        {conAcciones && roles !== undefined ? (
          <select
            aria-label={`Rol de ${u.nombre}`}
            className={SELECT}
            value={pendiente?.rolId ?? u.rolId}
            disabled={enviando}
            onChange={(e) => setPendiente(e.target.value === u.rolId ? null : { rolId: e.target.value })}
          >
            {/* El rol actual va siempre, aunque la lista no lo trajera: un
                selector que no muestra el valor vigente lo cambia sin querer. */}
            {!roles.some((r) => r.id === u.rolId) && <option value={u.rolId}>{u.rol}</option>}
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-ink text-celda">{u.rol}</span>
        )}
      </td>
      <td className="py-3">
        <Label>{u.activo ? 'Activo' : 'Suspendido'}</Label>
      </td>
      <td className="py-3">
        <span className="text-ink text-celda">
          {u.ultimoAccesoEn === null ? 'Nunca' : format.calendar(u.ultimoAccesoEn)}
        </span>
      </td>
      <td className="py-3">
        <span className="text-ink text-celda">{format.calendar(u.altaEn)}</span>
      </td>
      <td className="py-3 text-right">
        {propia ? (
          <Label>Vos · sin acciones sobre tu cuenta</Label>
        ) : conAcciones && pendiente !== null ? (
          <div className="flex flex-col items-end gap-2" role="group" aria-label={`Confirmar el cambio de ${u.nombre}`}>
            <Label as="span">
              {pendiente.activo === false
                ? `¿Suspender a ${u.nombre}? Deja de entrar hasta que lo reactiven`
                : `¿Pasar a ${u.nombre} al rol ${rolPendiente ?? 'elegido'}?`}
            </Label>
            <div className="flex items-center gap-2">
              <Accion tamano="compacta" variante="primaria" onClick={confirmar}>
                {pendiente.activo === false ? 'Suspender' : 'Cambiar rol'}
              </Accion>
              <Accion tamano="compacta" onClick={() => setPendiente(null)}>
                Cancelar
              </Accion>
            </div>
          </div>
        ) : conAcciones ? (
          <Accion
            tamano="compacta"
            deshabilitada={enviando}
            onClick={() => (u.activo ? setPendiente({ activo: false }) : onCambiar(u, { activo: true }))}
            etiqueta={`${u.activo ? 'Suspender' : 'Reactivar'} a ${u.nombre}`}
          >
            {enviando ? 'Guardando…' : u.activo ? 'Suspender' : 'Reactivar'}
          </Accion>
        ) : null}
      </td>
    </tr>
  )
}
