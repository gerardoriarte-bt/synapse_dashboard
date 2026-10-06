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
import { useMemo, useState } from 'react'
import { useTemaGuardado } from '../useTemaGuardado'
import { useNavigate } from 'react-router-dom'
import {
  useAgents,
  useFeeds,
  useRuns,
  useAllUsers,
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
import { UserList } from './UserList'
import { createFormat, LOCALE_POR_DEFECTO } from '../../render/format'
import { RoleEditor } from './RoleEditor'
import { Subprocessors } from './Subprocessors'
import { TenantIdentity } from './TenantIdentity'
import { estadoDeAlta, versionDeCatalogo } from './alta'
import { usoPorMetrica } from './uso'
import { TenantList } from './TenantList'
import { SurfaceMessage } from '../console/SurfaceMessage'
import { AgentConfig } from './AgentConfig'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { ApiError } from '../../api/types'
import type { EstadoDeAlta } from './alta'
import type { Tenant } from '../../api/admin'
import type { Formatter } from '../../render/format'
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
  const [pantalla, setPantalla] = useState<PantallaId>('clientes')
  const [tenant, setTenant] = useState<string | null>(null)
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
  // A5 · F4.24. La ruta llegó el 2026-09-25 con `1e080ee`.
  const fuentes = useFeeds(activo)
  const corridas = useRuns(activo)
  // A3 · F4.3. **De PLATAFORMA desde el 2026-09-26**: `GET /admin/users` llegó
  // con `6e521cc` y es lo que el dibujo declara. La por-cliente —`useUsers`—
  // sigue existiendo para A2, donde el cliente ya está elegido.
  const usuarios = useAllUsers()
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
        : { identidad: { rol: contexto.data.role.nombre, nombre: contexto.data.user.nombre } })}
    >
      {pendiente !== undefined ? (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Ayuda>{pendiente.razon}</Ayuda>
          <Ayuda>Se desbloquea con {pendiente.desbloqueaCon}</Ayuda>
        </div>
      ) : pantalla === 'cliente' ? (
        <Cliente
          agentes={agentes}
          roles={roles}
          // **El `Tenant` de la fila activa, no un viaje nuevo**: `lista` ya lo
          // trae con sus trece campos desde que A1 pidió las cinco columnas.
          tenant={lista.find((x) => x.id === activo) ?? null}
          estado={estado}
          version={version}
          format={format}
          // **La pregunta operativa y el conteo, no sólo el nombre** · A2 §9.
          // El desglose por rol los necesita, y los dos ya vienen en el layout
          // publicado: no cuesta un viaje más.
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
      ) : pantalla === 'usuarios' ? (
        <UserList
          usuarios={usuarios.data?.usuarios ?? []}
          total={usuarios.data?.total ?? 0}
          clientes={usuarios.data?.clientes ?? 0}
          format={format}
          cargando={usuarios.data === undefined}
        />
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
        <TenantList
          tenants={lista}
          format={format}
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
