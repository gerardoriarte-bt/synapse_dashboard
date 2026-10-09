/** A3 · Usuarios · §PEN:A3 · F4.3
 *
 *  Su pregunta operativa, literal del frame: *¿Quién entra a qué cliente, y con
 *  qué rol?*
 *
 *  Presentacional: los hooks viven en `Admin`, como el resto de §4.
 *
 *  ── LA DIVERGENCIA GRANDE SE CERRÓ · 2026-09-26 ────────────────────────────
 *
 *  Acá decía que **el dibujo declara `ALCANCE · PLATAFORMA`** y la única ruta era
 *  por cliente, con `/admin/users` dando 404. La razón escrita para no compensar
 *  era buena y sigue valiendo: «un total armado acá se leería como un número de
 *  plataforma y sería una suma nuestra — si un cliente falla, el total baja sin
 *  decirlo».
 *
 *  **`GET /admin/users` llegó en `6e521cc`** —B4.17— y trae `total`, `tenants` y
 *  `tenant_name` por usuario: los conteos los cuenta el servicio, que es
 *  exactamente lo que esa razón pedía. Medida el 2026-09-26.
 *
 *  Así que la pantalla pasa a ser de plataforma, con `CLIENTE` como columna, que
 *  es como el dibujo la compone.
 *
 *  ── LOS OTROS TRES HUECOS ──────────────────────────────────────────────────
 *
 *  **`INVITACIÓN PENDIENTE`**, que el dibujo pinta como tercer estado y el cable
 *  no trae: `is_active` sólo separa activo de suspendido. **Inferirlo de «nunca
 *  entró» sería inventarlo** — alguien puede tener cuenta activa y no haber
 *  entrado todavía, que es otra cosa.
 *
 *  **Quién dio de alta** —«POR M. BENÍTEZ»— y **«REENVIAR INVITACIÓN»**, que no
 *  tiene ruta: sin manejador no se pinta el CTA.
 *
 *  ── ORGANIZADA POR CLIENTE, Y CON ACCIONES · 2026-10-09 ───────────────────
 *
 *  La auditoría de ese día (`AUDITORIA-2026-10-08-admin-clientes-y-usuarios.md`)
 *  encontró los usuarios «mezclados»: el cliente era una columna más y los
 *  filtros que el dibujo pone —`CLIENTE`, `ROL`, `ESTADO`— no estaban. Ahora
 *  están, y sin filtro de cliente las filas se agrupan por cliente.
 *
 *  **Cada fila cambia su rol o se suspende**, con `PUT` sobre el usuario del
 *  tenant. Los roles que se ofrecen son los de SU cliente: el servicio rechaza
 *  uno ajeno con 400, medido. **La fila propia no ofrece nada** —regla de A1:
 *  «nadie se revoca a sí mismo»—, porque quitarse el rol de admin es perder la
 *  pantalla en la que se está.
 *
 *  **El mismo componente es la lista de la ficha** (P2 de la misma auditoría),
 *  con `alcance="cliente"`: sin la columna ni el filtro de cliente, que ahí ya
 *  están decididos.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { EmptyRow } from './EmptyRow'
import { SkeletonRows } from './SkeletonRows'
import { FilaDeUsuario } from './FilaDeUsuario'
import type { Formatter } from '../../render/format'
import type { CambioDeUsuario, Usuario } from '../../api/admin'

const SELECT = 'bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4'

/** Las del dibujo, más la de acciones. **`CLIENTE` sólo en plataforma**: en la
 *  ficha el cliente ya está elegido y repetirlo en cada fila es ruido. */
const COLUMNAS_PLATAFORMA = ['Usuario', 'Cliente', 'Rol', 'Estado', 'Último acceso', 'Alta', 'Acción'] as const
const COLUMNAS_CLIENTE = ['Usuario', 'Rol', 'Estado', 'Último acceso', 'Alta', 'Acción'] as const

type Estado = 'todos' | 'activos' | 'suspendidos'

/** LO QUE ESTA PANTALLA TODAVÍA NO MUESTRA · fuera de la pantalla desde el
 *  2026-10-06 (decisión humana: «si no suman para el uso, quitar»):
 *
 *  · Las invitaciones pendientes: el cable sólo trae activo o suspendido.
 *  · Quién dio de alta a cada usuario: el dibujo pone «por M. Benítez» y no hay
 *    campo.
 *  · Invitar directamente o reenviar una invitación: no hay ruta. Pedido al
 *    backend el 2026-10-09.
 */

type Props = {
  usuarios: readonly Usuario[]
  /** Del locale de quien mira · F1.13b. */
  format: Formatter
  /** `plataforma` cruza clientes · A3. `cliente` es la lista dentro de la ficha. */
  alcance?: 'plataforma' | 'cliente'
  /** **Los cuenta el SERVICIO**, no esta pantalla. Sólo en plataforma. */
  total?: number
  /** Clientes con al menos un usuario · lo cuenta el servicio. */
  clientesConUsuarios?: number
  /** Cómo se llama y se distingue cada cliente, para el filtro y los grupos:
   *  hay dos «Under Armour México» y el nombre solo no alcanza. */
  nombreDeCliente?: (clienteId: string) => string
  /** Los roles del cliente de un usuario · `undefined` mientras no llegaron. */
  rolesDe?: (clienteId: string) => readonly { id: string; nombre: string }[] | undefined
  /** Quién mira · su fila no ofrece acciones. */
  yoId?: string | null
  /** Cambiar rol o suspender · **sin manejador no se pintan las acciones**. */
  onCambiar?: (u: Usuario, cambio: CambioDeUsuario) => void
  /** El usuario cuyo cambio está en vuelo. */
  enviando?: string | null
  error?: string | null
  cargando?: boolean
}

export function UserList({
  format,
  usuarios,
  alcance = 'plataforma',
  total = usuarios.length,
  clientesConUsuarios = 0,
  nombreDeCliente = (id) => id,
  rolesDe = () => undefined,
  yoId = null,
  onCambiar,
  enviando = null,
  error = null,
  cargando = false,
}: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [cliente, setCliente] = useState('')
  const [rol, setRol] = useState('')
  const [estado, setEstado] = useState<Estado>('todos')

  const dePlataforma = alcance === 'plataforma'
  const columnas = dePlataforma ? COLUMNAS_PLATAFORMA : COLUMNAS_CLIENTE

  const clientes = [...new Set(usuarios.map((u) => u.clienteId))]
  const roles = [...new Set(usuarios.map((u) => u.rol))].sort()

  const q = busqueda.trim().toLowerCase()
  const visibles = usuarios.filter(
    (u) =>
      (q === '' ||
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.clienteNombre ?? '').toLowerCase().includes(q)) &&
      (cliente === '' || u.clienteId === cliente) &&
      (rol === '' || u.rol === rol) &&
      (estado === 'todos' || u.activo === (estado === 'activos')),
  )

  const filtrando = q !== '' || cliente !== '' || rol !== '' || estado !== 'todos'
  const limpiar = () => {
    setBusqueda('')
    setCliente('')
    setRol('')
    setEstado('todos')
  }

  // **Sin filtro de cliente, agrupadas por cliente** · es lo que «organizados
  // por cliente» pide. Con filtro hay un solo grupo y el encabezado sobra.
  const agrupar = dePlataforma && cliente === ''
  const grupos = agrupar
    ? clientes
        .map((id) => ({ id, filas: visibles.filter((u) => u.clienteId === id) }))
        .filter((g) => g.filas.length > 0)
    : [{ id: '', filas: visibles }]

  const sinNada = usuarios.length === 0 && !cargando
  const filtroVacio = usuarios.length > 0 && visibles.length === 0
  const activos = usuarios.filter((u) => u.activo).length

  return (
    <div className="flex flex-col gap-6">
      {dePlataforma && (
        <header className="flex flex-col gap-2">
          {/* La pregunta operativa es de la vista; el título lo pinta el chrome. */}
          <Ayuda>¿Quién entra a qué cliente, y con qué rol?</Ayuda>
          {/* Con el filtro vacío dice CUÁNTOS hay en total: sin eso, los
              usuarios parecen perdidos y no escondidos. */}
          <Label>
            {filtroVacio
              ? `0 usuarios con este filtro · ${String(total)} en total`
              : `${String(total)} ${total === 1 ? 'usuario' : 'usuarios'} · ${String(clientesConUsuarios)} ${clientesConUsuarios === 1 ? 'cliente con usuarios' : 'clientes con usuarios'} · ${String(activos)} ${activos === 1 ? 'activo' : 'activos'}`}
          </Label>
        </header>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Label as="div">
            {dePlataforma
              ? 'Usuarios de todos los clientes'
              : `Usuarios de este cliente · ${String(usuarios.length)} · ${String(activos)} ${activos === 1 ? 'activo' : 'activos'}`}
          </Label>
          <div className="flex-1" />
          {dePlataforma && (
            <select aria-label="Cliente" className={SELECT} value={cliente} onChange={(e) => setCliente(e.target.value)}>
              <option value="">Todos los clientes</option>
              {clientes.map((id) => (
                <option key={id} value={id}>
                  {nombreDeCliente(id)}
                </option>
              ))}
            </select>
          )}
          <select aria-label="Rol" className={SELECT} value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="">Todos los roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            aria-label="Estado"
            className={SELECT}
            value={estado}
            onChange={(e) => setEstado(e.target.value as Estado)}
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="suspendidos">Suspendidos</option>
          </select>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar"
            placeholder="BUSCAR"
            className="font-mono text-label leading-rotulo tracking-rotulo uppercase text-ink bg-transparent border border-w3 rounded-md px-2 py-1"
          />
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c} scope="col" className={`${c === 'Acción' ? 'text-right' : 'text-left'} pb-2 border-b border-w2`}>
                  <Label>{c}</Label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando && <SkeletonRows columnas={columnas.length} />}

            {sinNada && (
              <EmptyRow
                clase="alta"
                columnas={columnas.length}
                razon={dePlataforma ? 'Todavía no hay usuarios en ningún cliente.' : 'Este cliente todavía no tiene usuarios.'}
                salida="Un usuario entra cuando se aprueba su solicitud de acceso."
              />
            )}

            {filtroVacio && filtrando && (
              <EmptyRow
                clase="filtro"
                columnas={columnas.length}
                razon="Ningún usuario coincide con el filtro."
                salida="Deshacer el filtro."
                onLimpiarFiltro={limpiar}
              />
            )}

            {grupos.flatMap((g) => [
              ...(agrupar
                ? [
                    <tr key={`grupo-${g.id}`}>
                      <th scope="colgroup" colSpan={columnas.length} className="text-left pt-5 pb-2 border-b border-w4">
                        <Label>{`${nombreDeCliente(g.id)} · ${String(g.filas.length)}`}</Label>
                      </th>
                    </tr>,
                  ]
                : []),
              ...g.filas.map((u) => (
                <FilaDeUsuario
                  key={u.id}
                  u={u}
                  dePlataforma={dePlataforma}
                  format={format}
                  roles={rolesDe(u.clienteId)}
                  propia={u.id === yoId}
                  enviando={enviando === u.id}
                  {...(onCambiar === undefined ? {} : { onCambiar })}
                />
              )),
            ])}
          </tbody>
        </table>

        {error !== null && <Ayuda>{error}</Ayuda>}

        {/* Las tres reglas del pie, literales del dibujo. Explican por qué esta
            pantalla no ofrece mover a alguien de cliente ni fijar una contraseña. */}
        {dePlataforma && (
          <div className="flex flex-col gap-1 border-t border-w2 pt-3">
            <Ayuda>
              El cliente no se edita después de crear: mover un usuario de cliente es eliminarlo y
              volver a invitarlo.
            </Ayuda>
            <Ayuda>
              El alta es por invitación: nadie fija la contraseña de otro, ni siquiera un
              super-admin.
            </Ayuda>
            <Ayuda>
              Suspender corta el acceso sin borrar el registro: la auditoría de quién vio qué se
              conserva.
            </Ayuda>
          </div>
        )}
      </section>
    </div>
  )
}
