/** A · Administración de plataforma · F4.1
 *
 *  El contenedor: trae los datos y decide qué pantalla va en el chrome. §4 separa
 *  contenedor de presentacional, así que acá viven los hooks y en `AdminChrome`,
 *  `TenantList` y `CatalogView` no hay ninguno.
 *
 *  **Cuatro pestañas desde el 2026-10-09**: Clientes —con su ficha al lado—,
 *  Usuarios, Catálogo y Feeds. Ver `pantallas.ts`.
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
import { useEffect, useMemo, useState } from 'react'
import { useTemaGuardado } from '../useTemaGuardado'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCerrarSesion } from '../useCerrarSesion'
import {
  useAgents,
  useFeeds,
  useRuns,
  useLoadPeriods,
  useAllUsers,
  useUsers,
  useEditUser,
  useAccessRequests,
  useReviewAccessRequest,
  useRolesOf,
  useAgentsOf,
  useAdminCatalog,
  useDeleteRole,
  useLayoutDetail,
  useLayouts,
  useRoles,
  useSaveRole,
  useMe,
  useTenants,
  useSaveTheme,
} from '../../api/hooks'
import { AdminChrome } from './AdminChrome'
import { CatalogView } from './CatalogView'
import { FeedHealth } from './FeedHealth'
import { RunHistory } from './RunHistory'
import { CargarPeriodos } from './CargarPeriodos'
import { ESPERA_MAXIMA_MS, faltanPorTerminar, hayQueEsperar, mesEnCurso, mesesCargados, mesesEnCurso } from './cargaDePeriodos'
import type { Pedido } from './cargaDePeriodos'
import { UserList } from './UserList'
import { AccessRequests } from './AccessRequests'
import { createFormat, LOCALE_POR_DEFECTO } from '../../render/format'
import { RoleEditor } from './RoleEditor'
import { Subprocessors } from './Subprocessors'
import { TenantIdentity } from './TenantIdentity'
import { estadoDeAlta, versionDeCatalogo } from './alta'
import { usoPorMetrica } from './uso'
import { TenantList } from './TenantList'
import { distintivo } from './distintivo'
import { useClienteDeTrabajo } from '../useClienteDeTrabajo'
import { SurfaceMessage } from '../console/SurfaceMessage'
import { AgentConfig } from './AgentConfig'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { ApiError } from '../../api/types'
import type { EstadoDeAlta } from './alta'
import type { CambioDeUsuario, Tenant, Usuario } from '../../api/admin'
import type { Formatter } from '../../render/format'
import { PANTALLAS } from './pantallas'
import type { PantallaId } from './pantallas'

/** Lo que cada pantalla pendiente espera. Acá y no en un comentario: la pantalla
 *  lo pinta, así que quien la abre se entera sin leer el código. */
/** **Vacío desde el 2026-09-25**, y se deja declarado en vez de borrarlo: las
 *  cinco pantallas de §7.3 están construidas. `usuarios` salió con F4.3 —su ruta
 *  llegó en `1e080ee`— y `feeds` con F4.24 el mismo día.
 *
 *  La forma queda porque es la que hace que una pantalla pendiente diga qué
 *  falta en vez de mostrarse vacía, y la próxima que se declare la usa. */
const PENDIENTES: Partial<Record<PantallaId, { razon: string; desbloqueaCon: string }>> = {}

export function Admin() {
  const navegar = useNavigate()
  const cerrarSesion = useCerrarSesion()
  /** **La pantalla la decide la URL** · 2026-10-07. Era estado interno, y el
   *  menú de trabajo ofrece entrar directo a cada pantalla desde cualquier
   *  superficie: sin la URL no había cómo llegar a «Usuarios» desde el builder.
   *  De paso, recargar y «atrás» dejan de devolver a «Clientes». Una ruta que
   *  no es de acá —las pruebas montan en `/`— cae en la primera. */
  const { pathname } = useLocation()
  const pantalla: PantallaId = PANTALLAS.find((p) => p.ruta === pathname)?.id ?? 'clientes'
  const setPantalla = (id: PantallaId) => {
    const destino = PANTALLAS.find((p) => p.id === id)
    if (destino !== undefined) void navegar(destino.ruta)
  }
  // La identidad del navbar · §PEN:A1. Sale del mismo `/config/me` que la
  // consola: no hay una fuente de identidad por superficie.
  // El tema se escribe igual que en la consola · `useSaveTheme` invalida `me`.
  const saveTheme = useSaveTheme()
  const contexto = useMe()
  // El tema guardado lo aplica la superficie · ver `useTemaGuardado`.
  useTemaGuardado(contexto.data?.user.preferencias?.tema)

  /** **El locale de QUIEN MIRA, no el de cada fila** · F1.13b, 2026-09-26.
   *
   *  Es una decisión y conviene que esté escrita. Las pantallas de admin cruzan
   *  clientes —A1 los lista, A3 los cruza con alcance de plataforma— y cada uno
   *  trae su propio `locale`. Formatear cada fila con el suyo haría una columna
   *  con fechas en tres formatos distintos, que es ilegible justo donde la
   *  pregunta es comparar.
   *
   *  En la consola es al revés y por la misma razón: ahí todo es de UN tenant y
   *  una cifra formateada con el locale de quien mira cambiaría según quién la
   *  abre. Son dos superficies con dos preguntas. */
  const format = useMemo(
    () => createFormat(contexto.data?.tenant.locale || LOCALE_POR_DEFECTO),
    [contexto.data?.tenant.locale],
  )
  const tenants = useTenants()

  const lista = tenants.data ?? []
  /** **El cliente de trabajo, compartido con el builder** · 2026-10-06. Antes
   *  era un `useState` propio que caía a `lista[0]`. Ver `clienteDeTrabajo.ts`. */
  const [activo, setTenant] = useClienteDeTrabajo(
    lista,
    // `undefined` mientras `/config/me` carga: «todavía no sé» no es «no tiene».
    // Si falla, `null`, y cae al primero en vez de quedarse sin cliente.
    contexto.isPending ? undefined : (contexto.data?.tenant.id ?? null),
  )

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
  // A5 · F4.24. La ruta llegó el 2026-09-25 con `1e080ee`.
  const fuentes = useFeeds(activo)
  /** **Lo pedido desde A5, y cuándo** · 2026-10-07. La carga contesta 202 y
   *  la fila aparece segundos después, así que el historial se sondea mientras
   *  falte alguno —con tope— y no un instante después de pedir. */
  const [pedido, setPedido] = useState<(Pedido & { tenantId: string; vencido: boolean }) | null>(null)
  // **El pedido es de un cliente**: cambiar de cliente no lo arrastra.
  const pedidoActivo = pedido !== null && pedido.tenantId === activo ? pedido : null
  const corridas = useRuns(activo, (cs) => hayQueEsperar(pedidoActivo, cs, Date.now()))
  const cargar = useLoadPeriods(activo)
  // **El tope de espera es un temporizador, no una cuenta en el render**: leer
  // el reloj al dibujar da una pantalla que cambia según cuándo se repinta.
  useEffect(() => {
    if (pedido === null || pedido.vencido) return undefined
    const id = setTimeout(
      () => setPedido((p) => (p === null ? p : { ...p, vencido: true })),
      ESPERA_MAXIMA_MS,
    )
    return () => clearTimeout(id)
  }, [pedido])
  const pendientes = pedidoActivo === null ? [] : faltanPorTerminar(pedidoActivo, corridas.data ?? [])
  // A3 · F4.3. **De PLATAFORMA desde el 2026-09-26**: `GET /admin/users` llegó
  // con `6e521cc` y es lo que el dibujo declara. La por-cliente —`useUsers`—
  // sigue existiendo para A2, donde el cliente ya está elegido.
  const usuarios = useAllUsers()
  // **Los de la ficha** · P2 de la auditoría del 2026-10-08: quiénes son los
  // usuarios del cliente se ve en su ficha, no en otra pantalla.
  const usuariosDelCliente = useUsers(activo)
  /* ── LAS ACCIONES SOBRE USUARIOS Y LA COLA DE SOLICITUDES · 2026-10-09 ───
   *
   * **Roles y agentes de todos los clientes**: cambiar el rol de alguien ofrece
   * los de SU cliente, y aprobar una solicitud, los agentes del cliente que se
   * elige. Comparten clave con `useRoles` y `useAgents`, así que no se piden
   * dos veces. */
  //
  // **Sólo en Usuarios, y los agentes sólo si hay a quién aprobar.** Pedirlos
  // al abrir administración eran dos vueltas por cliente que nadie miraba —y
  // rompían la regla del arranque: no pedir nada de otro cliente mientras
  // `/config/me` carga—. En la ficha alcanza con los roles del activo, que
  // `useRoles` ya trae con la misma clave.
  const solicitudes = useAccessRequests()
  const enUsuarios = pantalla === 'usuarios'
  const hayPendientes = (solicitudes.data?.solicitudes.length ?? 0) > 0
  const rolesPorCliente = useRolesOf(enUsuarios ? lista.map((t) => t.id) : [])
  const agentesPorCliente = useAgentsOf(enUsuarios && hayPendientes ? lista.map((t) => t.id) : [])
  const editarUsuario = useEditUser()
  const revisar = useReviewAccessRequest()
  const nombreDeCliente = (id: string) => {
    const t = lista.find((x) => x.id === id)
    return t === undefined ? id : `${t.nombre} · ${distintivo(t)}`
  }
  const cambiarUsuario = (u: Usuario, cambio: CambioDeUsuario) =>
    editarUsuario.mutate({ tenantId: u.clienteId, userId: u.id, cambio })
  const accionesDeUsuario = {
    rolesDe: (id: string) => rolesPorCliente[id] ?? (id === activo ? roles.data : undefined),
    yoId: contexto.data?.user.id ?? null,
    onCambiar: cambiarUsuario,
    enviando: editarUsuario.isPending ? (editarUsuario.variables?.userId ?? null) : null,
    error: editarUsuario.error === null ? null : (editarUsuario.error.message === '' ? 'No se pudo guardar el cambio' : editarUsuario.error.message),
  }
  const versiones = useLayouts(activo)
  const publicado = versiones.data?.find((v) => v.estado === 'publicado') ?? null
  const detalle = useLayoutDetail(publicado?.id ?? null)
  const guardarRol = useSaveRole(activo)
  const borrarRol = useDeleteRole(activo)

  /* ── A2 · EL ESTADO DE ALTA · §PEN:A2 · F5.20 ─────────────────────────────
   *
   * **Se deriva acá y se baja hecho**, que es la misma forma que `usoPorMetrica`:
   * el contenedor tiene los dos hooks que hacen falta y los presentacionales
   * reciben el resultado. La regla vive en `alta.ts`, aparte, porque es una
   * decisión y no un render.
   *
   * **`null` mientras alguna de las dos vueltas no llegó**, y no `'EN_ALTA'`.
   * Con los datos ausentes las dos listas son vacías, así que una derivación
   * ansiosa pintaría el chip `EN ALTA` sobre cualquier cliente durante el
   * primer render y lo sacaría después. Un cartel que aparece y desaparece es
   * peor que uno que tarda: el que mira no sabe cuál de los dos era cierto. */
  const metricas = catalogo.data?.metrics ?? []
  const listaDeRoles = roles.data ?? []
  const derivable = roles.data !== undefined && catalogo.data !== undefined
  const estado = derivable ? estadoDeAlta({ roles: listaDeRoles, metricas }) : null
  const version = derivable ? versionDeCatalogo(metricas) : null

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
      onChangeTheme={(theme) => saveTheme.mutate(theme)}
      activa={pantalla}
      onSalir={(ruta) => void navegar(ruta)}
      onIr={setPantalla}
      tenants={lista}
      tenantActivo={activo}
      onTenant={setTenant}
      {...(contexto.data === undefined
        ? {}
        : {
            identidad: {
              rol: contexto.data.role.nombre,
              nombre: contexto.data.user.nombre,
              correo: contexto.data.user.email,
            },
          })}
      onCerrarSesion={cerrarSesion}
    >
      {pendiente !== undefined ? (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Ayuda>{pendiente.razon}</Ayuda>
          <Ayuda>Se desbloquea con {pendiente.desbloqueaCon}</Ayuda>
        </div>
      ) : pantalla === 'usuarios' ? (
        <div className="flex flex-col gap-10">
          <AccessRequests
            solicitudes={solicitudes.data?.solicitudes ?? []}
            format={format}
            clientes={lista.map((t) => ({ id: t.id, etiqueta: nombreDeCliente(t.id) }))}
            agentesDe={(id) => agentesPorCliente[id]}
            enviando={revisar.isPending ? (revisar.variables?.id ?? null) : null}
            error={revisar.error === null ? null : (revisar.error.message === '' ? 'No se pudo resolver la solicitud' : revisar.error.message)}
            onAprobar={(id, destino) => revisar.mutate({ id, aprobar: true, ...(destino === undefined ? {} : { destino }) })}
            onRechazar={(id) => revisar.mutate({ id, aprobar: false })}
            cargando={solicitudes.data === undefined}
          />
          <UserList
            usuarios={usuarios.data?.usuarios ?? []}
            total={usuarios.data?.total ?? 0}
            clientesConUsuarios={usuarios.data?.clientes ?? 0}
            nombreDeCliente={nombreDeCliente}
            format={format}
            cargando={usuarios.data === undefined}
            {...accionesDeUsuario}
          />
        </div>
      ) : pantalla === 'feeds' ? (
        /* **El historial va DEBAJO de las fuentes y en la misma pantalla.** La
           pregunta que A5 contesta es «por qué una métrica está degradada, y qué
           la desbloquea»; cuándo se cargó por última vez y cómo salió es la otra
           mitad de esa misma pregunta, y hoy sólo se podía ver consultando la
           base. Es un agregado al dibujo y está declarado en `RunHistory`. */
        <div className="flex flex-col gap-10">
          <FeedHealth
            fuentes={fuentes.data ?? []}
            tenant={lista.find((x) => x.id === activo)?.nombre ?? null}
            format={format}
            cargando={fuentes.data === undefined}
          />
          <CargarPeriodos
            key={activo ?? ''}
            mesActual={mesEnCurso(new Date(), lista.find((x) => x.id === activo)?.zonaHoraria ?? null)}
            cargados={mesesCargados(corridas.data ?? [])}
            enCurso={mesesEnCurso(corridas.data ?? [])}
            {...(activo === null
              ? {}
              : {
                  onCargar: (periodos: string[]) => {
                    setPedido({ periodos, desde: Date.now(), tenantId: activo, vencido: false })
                    cargar.mutate(periodos)
                  },
                })}
            enviando={cargar.isPending}
            error={cargar.error === null ? null : cargar.error.message}
            pendientes={pedidoActivo?.vencido === true ? [] : pendientes}
            sinTerminar={pedidoActivo?.vencido === true ? pendientes : []}
            format={format}
          />
          <RunHistory
            corridas={corridas.data ?? []}
            format={format}
            cargando={corridas.data === undefined}
          />
        </div>
      ) : pantalla === 'catalogo' ? (
        // **El uso sale del layout publicado y de los roles, que A2 ya pide.**
        // No cuesta un viaje más, y contarlo sobre el publicado es lo correcto
        // para la pregunta que responde: qué ven los usuarios hoy.
        <Catalogo query={catalogo} uso={usoPorMetrica(detalle.data, roles.data ?? [])} />
      ) : (
        /* ── CLIENTES · LA LISTA Y LA FICHA LADO A LADO · 2026-10-09 ──────────
           Decisión humana (P1 de `AUDITORIA-2026-10-08-admin-clientes-y-usuarios.md`).
           Eran dos pestañas y dos formas de elegir cliente que no se hablaban;
           ahora se elige en un solo lugar y la ficha se abre al lado. Se
           aparta del `.pen`, que las une como lista y detalle con migas. */
        <div className="grid grid-cols-[360px_1fr] gap-8 items-start">
          <TenantList
            tenants={lista}
            format={format}
            seleccionado={activo}
            onElegir={setTenant}
            cargando={tenants.data === undefined}
          />
          {activo === null ? (
            <Ayuda>Elegí un cliente de la lista para ver su ficha.</Ayuda>
          ) : (
            <Cliente
              agentes={agentes}
              roles={roles}
              // **El `Tenant` de la fila activa, no un viaje nuevo**: `lista` ya lo
              // trae con sus campos desde que A1 pidió sus columnas.
              tenant={lista.find((x) => x.id === activo) ?? null}
              estado={estado}
              version={version}
              format={format}
              usuarios={
                <UserList
                  alcance="cliente"
                  usuarios={usuariosDelCliente.data ?? []}
                  format={format}
                  cargando={usuariosDelCliente.data === undefined}
                  {...accionesDeUsuario}
                />
              }
              // **La pregunta operativa y el conteo, no sólo el nombre** · A2 §9.
              pestanas={
                detalle.data?.tabs.map((t) => ({
                  id: t.tab.id,
                  clave: t.tab.clave,
                  nombre: t.tab.nombre,
                  pregunta: t.tab.pregunta,
                  paneles: t.panels.length,
                })) ?? []
              }
              metricas={metricas}
              onGuardar={(id, rol) => guardarRol.mutate({ ...(id === undefined ? {} : { id }), rol })}
              onBorrar={(id) => borrarRol.mutate(id)}
              guardando={guardarRol.isPending}
              error={mensajeDeRol(guardarRol.error) ?? mensajeDeRol(borrarRol.error)}
              // El viaje a A4 existe desde acá, así que el enlace del `.pen` se
              // pinta. Sin este manejador `RoleCard` no lo dibuja.
              onVerCatalogo={() => setPantalla('catalogo')}
            />
          )}
        </div>
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
        <Ayuda>No se pudo cargar el catálogo de este cliente.</Ayuda>
        <Ayuda>
          {query.error instanceof ApiError && query.error.httpStatus === 403
            ? 'Esta pantalla pide rol de administrador.'
            : (query.error.message === '' ? 'Sin detalle del servidor' : query.error.message)}
        </Ayuda>
        {/* `self-start` en un envoltorio: `Accion` no acepta clases de afuera. */}
        <div className="self-start">
          <Accion onClick={() => void query.refetch()}>Reintentar</Accion>
        </div>
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
    // La razón técnica, que ya no se pinta: las rutas de roles están escritas
    // en nuestro fork y el servicio desplegado no las sirve · B4.8.
    return 'La composición por rol de este cliente todavía no se puede consultar'
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
  tenant,
  estado,
  version,
  format,
  usuarios,
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
  /** Los cuatro de `TenantIdentity` · §PEN:A2. **Ninguno es opcional**, que es lo
   *  único que el compilador puede hacer contra el spread de arriba: una prop
   *  obligatoria mal escrita no compila, una opcional sí. */
  tenant: Tenant | null
  estado: EstadoDeAlta | null
  version: number | null
  format: Formatter
  /** **Los usuarios del cliente** · P2, 2026-10-09. Obligatoria por la misma
   *  razón que las cuatro de arriba. */
  usuarios: React.ReactNode
} & Omit<Parameters<typeof RoleEditor>[0], 'roles'>) {
  if (roles.isError) {
    return (
      <div className="flex flex-col gap-2">
        <Ayuda>No se pudieron cargar los roles.</Ayuda>
        <Ayuda>{mensajeDeRol(roles.error) ?? 'Sin detalle del servidor'}</Ayuda>
      </div>
    )
  }
  return (
    // **Los cuatro bloques en el orden del dibujo** · §PEN:A2: identidad, roles
    // y composición, acceso a datos, subprocesadores. El orden no es estético —
    // el dibujo lo ordena por lo que decide lo siguiente: sin roles no hay
    // acceso, y los subprocesadores aplican igual desde el alta, así que van al
    // final.
    <div className="flex flex-col gap-6">
      <TenantIdentity tenant={tenant} estado={estado} version={version} format={format} />

      <RoleEditor {...paraRoles} roles={roles.data ?? []} cargando={roles.data === undefined} />

      {/* **Después de los roles**: primero qué ve cada rol, después quién lo
          tiene. Es el orden en que se decide. */}
      {usuarios}

      {/* **El agente se pinta aunque su petición falle, y con la razón.** Hoy
          esa ruta da 500 contra el servicio —las columnas del CRUD no están en
          la base compartida, B3.11— y un bloque que desaparece haría parecer
          que el cliente no tiene agente, que es una afirmación distinta. */}
      {agentes.isError ? (
        <section className="flex flex-col gap-2">
          <Label as="div">Agente de datos</Label>
          <Ayuda>No se pudo cargar la configuración del agente.</Ayuda>
          <Ayuda>
            {agentes.error instanceof Error ? agentes.error.message : 'Sin detalle del servidor'}
          </Ayuda>
        </section>
      ) : (
        // **`sinRoles` y no `estado === 'EN_ALTA'`**, que es la distinción que el
        // dibujo hace y se puede perder: un cliente CON catálogo y SIN roles no
        // está en alta —ya tiene dato cargado— y su acceso sigue bloqueado
        // igual, porque no hay a quién otorgárselo. Son dos preguntas.
        //
        // Y `roles.data !== undefined` adelante: mientras la vuelta no llegó,
        // «cero roles» es lo que todavía no se sabe, no lo que hay.
        <AgentConfig
          agentes={agentes.data ?? []}
          sinRoles={roles.data !== undefined && roles.data.length === 0}
        />
      )}

      <Subprocessors />
    </div>
  )
}
