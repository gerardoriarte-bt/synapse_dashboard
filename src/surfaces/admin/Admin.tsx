/** A · Administración de plataforma · F4.1
 *
 *  El contenedor: trae los datos y decide qué pantalla va en el chrome. §4 separa
 *  contenedor de presentacional, así que acá viven los hooks y en `AdminChrome`,
 *  `TenantList` y `CatalogView` no hay ninguno.
 *
 *  **Las cinco pantallas de §7.3 están declaradas; tres todavía no se pueden
 *  construir**, y cada una dice por qué en vez de mostrarse vacía:
 *
 *  | | Qué falta |
 *  |---|---|
 *  | A2 · Ficha de cliente | Roles por tenant · B4.8, que ahora escribimos nosotros |
 *  | A3 · Usuarios | Lo mismo: sin CRUD de roles no hay qué mostrar |
 *  | A5 · Salud de feeds | No hay endpoint de frescura por feed |
 *
 *  **A4 · Catálogo está construida desde el 2026-09-15** —F4.5—: es la única de
 *  las cuatro de tenant que tiene ruta. Muestra lo que el cable sostiene y declara
 *  los cuatro campos de §7.3 que no puede afirmar.
 *
 *  Una pantalla que se declara pendiente **no es lo mismo que una que no está**:
 *  la primera dice qué la desbloquea, que es lo que §8 pide de cualquier estado.
 */
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  useAgents,
  useAdminCatalog,
  useDeleteRole,
  useLayoutDetail,
  useLayouts,
  useRoles,
  useSaveRole,
  useTenants,
} from '../../api/hooks'
import { AdminChrome } from './AdminChrome'
import { CatalogView } from './CatalogView'
import { RoleEditor } from './RoleEditor'
import { usoPorMetrica } from './uso'
import { TenantList } from './TenantList'
import { SurfaceMessage } from '../console/SurfaceMessage'
import { AgentConfig } from './AgentConfig'
import { Label } from '../../render/primitives/Label'
import { ApiError } from '../../api/types'
import type { PantallaId } from './pantallas'

/** Lo que cada pantalla pendiente espera. Acá y no en un comentario: la pantalla
 *  lo pinta, así que quien la abre se entera sin leer el código. */
const PENDIENTES: Partial<Record<PantallaId, { razon: string; desbloqueaCon: string }>> = {
  usuarios: {
    razon: 'Sin CRUD de roles no hay permisos que mostrar por usuario.',
    desbloqueaCon: 'B4.8 · CRUD de roles por tenant',
  },
  feeds: {
    razon: 'Ningún endpoint declara la frescura por feed ni qué lo desbloquea.',
    desbloqueaCon: 'Sin tarea de backend todavía · va a PARA-BACKEND',
  },
}

export function Admin() {
  const navegar = useNavigate()
  const [pantalla, setPantalla] = useState<PantallaId>('clientes')
  const [tenant, setTenant] = useState<string | null>(null)
  const tenants = useTenants()

  const lista = tenants.data ?? []
  const activo = tenant ?? lista[0]?.id ?? null

  // **El hook del catálogo se llama siempre y se apaga por `enabled`**, que es lo
  // que las reglas de hooks exigen: no puede colgar de `pantalla`. Mientras A4 no
  // esté abierta el `queryKey` ya está calentando el cache, y eso es deseable —
  // abrir la pestaña no espera una vuelta de red.
  const catalogo = useAdminCatalog(activo)

  /* ── A2 · la ficha de cliente · F4.3 ──────────────────────────────────────
   *
   * **Las pestañas salen del layout PUBLICADO, y no de cualquiera.** `tab_ids`
   * de un rol apunta a pestañas concretas; ofrecer las de un borrador dejaría
   * marcar una que la consola no sirve, y el rol quedaría apuntando a un id que
   * nadie ve. Son dos viajes y no hay forma de hacerlo en uno. */
  const roles = useRoles(activo)

  /** El agente del cliente · F4.4. Va en A2 porque §7.3 la declara de alcance
   *  tenant, igual que los roles: las dos contestan «qué hay configurado para
   *  este cliente». */
  const agentes = useAgents(activo)
  const versiones = useLayouts(activo)
  const publicado = versiones.data?.find((v) => v.estado === 'publicado') ?? null
  const detalle = useLayoutDetail(publicado?.id ?? null)
  const guardarRol = useSaveRole(activo)
  const borrarRol = useDeleteRole(activo)

  if (tenants.isError) {
    // El 403 es el caso probable y tiene una causa concreta que conviene decir:
    // estas rutas piden rol `admin`, y un `planner` que abra `/admin` no está
    // ante un fallo del sistema sino ante un permiso que no tiene.
    return (
      <SurfaceMessage
        title="No se pudo cargar la administración"
        detail={
          // `ApiError` y no `Error`: el 403 es el caso probable y el genérico
          // no lo distingue.
          tenants.error instanceof ApiError && tenants.error.httpStatus === 403
            ? 'Esta superficie pide rol de administrador.'
            : (tenants.error.message ?? 'Sin detalle del servidor')
        }
        onRetry={() => void tenants.refetch()}
      />
    )
  }

  const pendiente = PENDIENTES[pantalla]

  return (
    <AdminChrome
      onVolver={() => void navegar('/')}
      activa={pantalla}
      onIr={setPantalla}
      tenants={lista}
      tenantActivo={activo}
      onTenant={setTenant}
    >
      {pendiente !== undefined ? (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Label as="div">{pendiente.razon}</Label>
          <Label as="div">Se desbloquea con · {pendiente.desbloqueaCon}</Label>
        </div>
      ) : pantalla === 'cliente' ? (
        <Cliente
          agentes={agentes}
          roles={roles}
          // **La pregunta operativa y el conteo, no sólo el nombre** · A2 §9.
          // El desglose por rol los necesita, y los dos ya vienen en el layout
          // publicado: no cuesta un viaje más.
          pestanas={
            detalle.data?.tabs.map((t) => ({
              id: t.tab.id,
              nombre: t.tab.nombre,
              pregunta: t.tab.pregunta,
              paneles: t.panels.length,
            })) ?? []
          }
          metricas={catalogo.data?.metrics ?? []}
          onGuardar={(id, rol) => guardarRol.mutate({ ...(id === undefined ? {} : { id }), rol })}
          onBorrar={(id) => borrarRol.mutate(id)}
          guardando={guardarRol.isPending}
          error={mensajeDeRol(guardarRol.error) ?? mensajeDeRol(borrarRol.error)}
          // El viaje a A4 existe desde acá, así que el enlace del `.pen` se
          // pinta. Sin este manejador `RoleCard` no lo dibuja.
          onVerCatalogo={() => setPantalla('catalogo')}
        />
      ) : pantalla === 'catalogo' ? (
        // **El uso sale del layout publicado y de los roles, que A2 ya pide.**
        // No cuesta un viaje más, y contarlo sobre el publicado es lo correcto
        // para la pregunta que responde: qué ven los usuarios hoy.
        <Catalogo query={catalogo} uso={usoPorMetrica(detalle.data, roles.data ?? [])} />
      ) : (
        <TenantList
          tenants={lista}
          // **El id se USA** · 2026-09-25. Esta línea era `() => setPantalla(…)`
          // y tiraba el argumento, así que «Ver ficha» de cualquier cliente
          // abría la ficha del PRIMERO —`activo` cae en `lista[0]`— y se veía
          // perfectamente bien mientras hubiera un solo cliente en la base.
          //
          // Es la familia del botón muerto que `CLAUDE.md` describe, con una
          // vuelta más: el callback SÍ dispara, así que verificar que dispara no
          // alcanza; hay que verificar que **llega el id correcto**.
          onAbrir={(id) => {
            setTenant(id)
            setPantalla('cliente')
          }}
          cargando={tenants.data === undefined}
        />
      )}
    </AdminChrome>
  )
}

/** Los tres estados de A4 dentro del chrome. **No usa `SurfaceMessage`**: aquello
 *  es de superficie entera y pinta su propio `<main>`; acá el chrome sigue en pie
 *  y lo que cambia es el contenido, igual que un estado de panel no reemplaza el
 *  shell. */
function Catalogo({
  query,
  uso,
}: {
  query: ReturnType<typeof useAdminCatalog>
  uso: ReturnType<typeof usoPorMetrica>
}) {
  if (query.isError) {
    return (
      <div className="flex flex-col gap-2">
        <Label as="div">No se pudo cargar el catálogo de este cliente</Label>
        <Label as="div">
          {query.error instanceof ApiError && query.error.httpStatus === 403
            ? 'Esta pantalla pide rol de administrador.'
            : (query.error.message === '' ? 'Sin detalle del servidor' : query.error.message)}
        </Label>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="self-start font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // **Se pinta la pantalla, no un texto.** El encabezado, los filtros y la
  // declaración de lo que falta no dependen de los datos: reemplazarlos por
  // «Cargando…» es tirar información que ya estaba lista.
  return (
    <CatalogView
      metrics={query.data?.metrics ?? []}
      rejected={query.data?.rejected ?? []}
      uso={uso}
      cargando={query.data === undefined}
    />
  )
}

/** El 409 de rol tiene dos causas y las dos tienen salida; el resto es lo que
 *  diga el servicio. Y el 404 es el caso probable mientras el fork no esté
 *  desplegado: decirlo evita que alguien lo lea como un bug de esta pantalla. */
function mensajeDeRol(e: Error | null): string | null {
  if (e === null) return null
  if (e instanceof ApiError && e.httpStatus === 404) {
    return 'El servicio desplegado todavía no sirve las rutas de roles · están escritas en el fork · B4.8'
  }
  if (e instanceof ApiError && e.httpStatus === 409) {
    return e.message === '' ? 'El nombre ya está en uso en este cliente' : e.message
  }
  return e.message === '' ? 'No se pudo guardar el rol' : e.message
}

/** A2 dentro del chrome · los tres estados, sin `SurfaceMessage`: aquel pinta su
 *  propio `<main>` y acá el chrome sigue en pie. */
function Cliente({
  agentes,
  roles,
  // **`...paraRoles` y no una prop más en la lista** · 2026-09-22. Estaba
  // escrito prop por prop, y al sumar `onVerCatalogo` —opcional— el compilador
  // no dijo nada: la prop llegaba a `Cliente`, se perdía acá, y el enlace del
  // `.pen` no se pintaba. Es la familia del spread condicional, con cuatro
  // saltos —`Admin → Cliente → RoleEditor → RoleCard`—, y **lo encontró abrir
  // la pantalla, no el compilador ni las pruebas**.
  ...paraRoles
}: {
  agentes: ReturnType<typeof useAgents>
  roles: ReturnType<typeof useRoles>
} & Omit<Parameters<typeof RoleEditor>[0], 'roles'>) {
  if (roles.isError) {
    return (
      <div className="flex flex-col gap-2">
        <Label as="div">No se pudieron cargar los roles</Label>
        <Label as="div">{mensajeDeRol(roles.error) ?? 'Sin detalle del servidor'}</Label>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <RoleEditor {...paraRoles} roles={roles.data ?? []} cargando={roles.data === undefined} />

      {/* **El agente se pinta aunque su petición falle, y con la razón.** Hoy
          esa ruta da 500 contra el servicio —las columnas del CRUD no están en
          la base compartida, B3.11— y un bloque que desaparece haría parecer
          que el cliente no tiene agente, que es una afirmación distinta. */}
      {agentes.isError ? (
        <section className="flex flex-col gap-2">
          <Label as="div">Agente de datos</Label>
          <Label as="div">No se pudo cargar la configuración del agente</Label>
          <Label as="div">
            {agentes.error instanceof Error ? agentes.error.message : 'Sin detalle del servidor'}
          </Label>
        </section>
      ) : (
        <AgentConfig agentes={agentes.data ?? []} />
      )}
    </div>
  )
}
