/** B · Builder · composición visual · F4.6
 *
 *  El contenedor. §4 separa contenedor de presentacional, así que acá van los
 *  hooks y en `BuilderChrome` no hay ninguno.
 *
 *  **Las seis pantallas de §7.2 están declaradas; cinco todavía no se pueden
 *  construir**, y cada una dice qué la desbloquea en vez de mostrarse vacía. Lo
 *  que las frena no es lo mismo en todas, y esa distinción es la que importa:
 *
 *  | | Qué falta | De qué orden |
 *  |---|---|---|
 *  | B2 · Canvas | La interacción de arrastre no está especificada en `design.md` | **Diseño**, no cable |
 *  | B3 · Selector de gráfico | `/config/plots` · B1.21 · es F4.21 | Cable |
 *  | B4 · Binder de métrica | Nada: es F4.10 y se puede tomar | Orden del plan |
 *  | B5 · Vista previa por rol | Roles por tenant · B4.9, que escribimos nosotros | Cable |
 *  | B6 · Historial | El cable no dice **quién** publicó ni **qué cambió** | Cable |
 *
 *  **ESA TABLA ESTÁ VENCIDA Y SE DEJA COMO REGISTRO DE CÓMO SE VENCEN.** Cinco de
 *  las seis filas eran falsas al 2026-09-30: B3 (F4.21), B4 (F4.10), B5 (F4.12) y
 *  B6 (F5.19) están construidas, y la de B6 nombraba dos campos que el cable trae
 *  desde `168a761`. La única viva es B2, que espera una decisión de diseño.
 *
 *  **B6 · Historial de versiones se cableó el 2026-09-30** · §PEN:B6. Lo que la
 *  frenaba —«el cable no dice quién publicó ni qué cambió»— venció:
 *  `GET /admin/dashboards/{dashboardId}/publications` contesta 200 con
 *  `actor_user_id`, `actor_role`, `created_at` y un `diff` con resumen y detalle
 *  por panel. Medido contra `:4010` con `dev@synapse.local`: **cinco filas** en
 *  «Marca» y **cero** en «Overview».
 *
 *  **B1 · Contexto de edición está construida desde el 2026-09-15** —F4.7—: es la
 *  única de las seis con cable suficiente, y aun así sostiene dos de las cuatro
 *  cosas que §7.2 le pide.
 *
 *  Una pantalla que se declara pendiente no es lo mismo que una que no está: la
 *  primera dice qué la desbloquea, que es lo que §8 pide de cualquier estado.
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { useCerrarSesion } from '../useCerrarSesion'
import { useTemaGuardado } from '../useTemaGuardado'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  useAdminCatalog,
  useBlocks,
  usePlots,
  useCreateDraft,
  useCreateDashboard,
  useDashboards,
  useLayoutDetail,
  useLayouts,
  usePreview,
  usePublications,
  usePublishLayout,
  useMe,
  useRevertLayout,
  useRoles,
  useSaveLayout,
  useTenants,
  useUsers,
  useValidateLayout,
  useSaveTheme,
} from '../../api/hooks'
import { BuilderChrome } from './BuilderChrome'
import { ContextView } from './ContextView'
import { TabInspector } from './TabInspector'
import type { DashboardEnLista } from './ContextView'
import { Canvas } from './Canvas'
import { Library } from './Library'
import { PanelConfigurator } from './PanelConfigurator'
import type { Profundidad } from './PanelConfigurator'
import { tipoPara } from './tipoPara'
import type { PanelDeBorrador } from './borrador'
import { PublishBar } from './PublishBar'
import { RolePreview } from './RolePreview'
import { VersionHistory } from './VersionHistory'
import { createFormat, LOCALE_POR_DEFECTO } from '../../render/format'
import type { LayoutDetalle } from '../../api/admin'
import { SaveBar } from './SaveBar'
import { ValidationSummary } from './ValidationSummary'
import { validarBorrador } from './validar'
import {
  adoptarIds,
  agregar,
  agregarPanel,
  asignarRoles,
  laVe,
  cambiarTipo,
  redimensionarPanel,
  reubicarPanel,
  editar,
  editarOpcion,
  editarPanel, quitarOPonerGrafico,
  mover,
  quitar,
  quitarPanel,
  sembrar,
  sucio,
} from './borrador'
import { blockTable } from '../../catalog/blocks'
import { SurfaceMessage } from '../console/SurfaceMessage'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { useClienteDeTrabajo } from '../useClienteDeTrabajo'
import { ApiError } from '../../api/types'
import type { TabParaGuardar } from '../../api/admin'
import type { PanelConfig, Payload } from '../../api/types'
import { PanelConDato } from './PanelConDato'
import { plotTable } from '../../catalog/plots'
import { CANVAS_WIDTH } from '../../render/grid'
import { PANTALLAS } from './pantallas'
import type { PantallaId } from './pantallas'

/** Qué espera cada pantalla. Acá y no en un comentario: la pantalla lo pinta, así
 *  que quien la abre se entera sin leer el código. */
/** ── LAS DOS ENTRADAS ESTABAN VENCIDAS Y SE PINTAN EN LA PANTALLA · 2026-09-30 ──
 *
 *  Esto no es un comentario: es copy que el cliente lee. Las dos filas decían
 *  algo falso y llevaban días diciéndolo.
 *
 *  · `grafico` decía «esa lista la sirve /config/plots, que no existe».
 *    **Existe desde el 2026-09-29** —la escribimos nosotros, `b6f0e09`— y
 *    `PlotPicker` está construido (F4.21). No era una pantalla pendiente: era
 *    una pantalla **que vive en otra**, igual que el binder. Se mudó abajo.
 *  · `historial` decía que no hay autor, ni diferencia, ni ruta para revertir.
 *    **Las tres son falsas**: `GET /admin/layouts/{id}/publications` contesta
 *    200 con `actor_user_id`, `actor_role`, `created_at` y un `diff` con
 *    resumen y detalle por panel, y `POST /admin/layouts/{id}/revert` existe.
 *    Medido contra el servicio el 2026-09-30.
 *
 *  **Y el copy cambió de idioma**, que es la otra mitad. Decía «§7.2 pide» y
 *  «LayoutVersion trae» en la pantalla de un cliente — está levantado en
 *  `docs/AUDITORIA-2026-09-30-usabilidad.md` §1.1. Lo que falta se sigue
 *  declarando; lo que cambia es a quién se le habla.
 *
 *  ── Y QUEDÓ VACÍO EL MISMO DÍA · B6 CABLEADA ───────────────────────────────
 *
 *  La entrada de `historial` decía «Está en construcción» con la pantalla ya
 *  escrita —`VersionHistory`, `VersionCard`, `cambios`— y sin montar: un aviso de
 *  andamio en la superficie de un cliente. **Un aviso que describe el estado del
 *  trabajo y no el del producto es un defecto**, igual que las dos entradas de
 *  arriba.
 *
 *  **La forma se deja declarada y no se borra**, mismo criterio que `Admin.tsx`
 *  desde el 2026-09-25: es la que hace que una pantalla pendiente diga qué falta
 *  en vez de mostrarse vacía, y la próxima que se declare la usa. */
const PENDIENTES: Partial<Record<PantallaId, { razon: string; desbloqueaCon: string }>> = {}

/** Pantallas de §7.2 que SÍ están construidas y **viven en otra**. No es lo
 *  mismo que pendiente, y decirlo «Pendiente» sería mentir sobre trabajo hecho.
 *
 *  `design.md` describe B4 como pantalla propia. Acá vive dentro de B1 porque
 *  **configurar un panel exige tenerlo elegido**, y elegirlo es de B1: una
 *  pantalla suelta obligaría a duplicar la selección de pestaña y de panel para
 *  llegar al mismo formulario. Es una desviación de la spec y va dicha. */
const EN_OTRA_PANTALLA: Partial<Record<PantallaId, string>> = {
  // **2026-10-06 · se mudaron al inspector del canvas** y salieron de la
  // navegación (D3). F4.10 y F4.21 siguen siendo una desviación de §7.2, que las
  // describe como pantallas propias, y va dicha: configurar un panel exige
  // tenerlo elegido, y donde se lo elige es el lienzo.
  metrica: 'La métrica de un panel se elige en el editor: tocá un panel y se abre su configuración a la derecha.',
  grafico: 'El gráfico de un panel se elige en el editor: tocá un panel y se abre su configuración a la derecha.',
}

/** Cuánto se espera sin editar antes de guardar solo. */
const AUTOGUARDADO_MS = 3000

export function Builder() {
  const navegar = useNavigate()
  // El tema se escribe igual que en la consola · `useSaveTheme` invalida `me`.
  const saveTheme = useSaveTheme()
  const yo = useMe()
  // El tema guardado lo aplica la superficie · ver `useTemaGuardado`.
  useTemaGuardado(yo.data?.user.preferencias?.tema)
  /** **La pantalla la decide la URL** · 2026-10-07. Era estado interno, y el
   *  menú de trabajo ofrece entrar directo a «Editor» o «Historial» desde
   *  cualquier superficie. De paso, recargar y «atrás» dejan de devolver a
   *  «Dashboards». Una ruta que no es de acá —las pruebas montan en `/`— cae
   *  en la primera. */
  const { pathname } = useLocation()
  const pantalla: PantallaId = PANTALLAS.find((p) => p.ruta === pathname)?.id ?? 'contexto'
  /** **Cambiar de pantalla vuelve arriba** · visto el 2026-10-06: «Componer»
   *  se aprieta al fondo de B1 y el lienzo abría con el scroll de B1, a media
   *  grilla. Asignación y no `scrollTo`, que jsdom no implementa. */
  const setPantalla = (p: PantallaId) => {
    const destino = PANTALLAS.find((x) => x.id === p)
    if (destino !== undefined && destino.ruta !== pathname) void navegar(destino.ruta)
    document.documentElement.scrollTop = 0
  }
  const cerrarSesion = useCerrarSesion()
  const [versionElegida, setVersion] = useState<string | null>(null)

  const tenants = useTenants()
  const lista = tenants.data ?? []
  /** **El cliente de trabajo, compartido con administración** · 2026-10-06.
   *  Caía a `lista[0]` —en QA, Keralty— aunque se viniera de trabajar sobre
   *  UA. Ver `clienteDeTrabajo.ts`. */
  const [tenantActivo, setTenant] = useClienteDeTrabajo(lista, yo.data?.tenant.id ?? null)

  // **Los tres hooks se llaman siempre y se apagan por `enabled`.** No pueden
  // colgar de `pantalla` sin violar las reglas de hooks, y además calientan el
  // cache: cambiar de pantalla no espera una vuelta de red.
  const versiones = useLayouts(tenantActivo)

  /** ── EL DASHBOARD DE TRABAJO · 2026-10-07 ─────────────────────────────────
   *
   *  El builder se organiza Cliente → Dashboard → Editor
   *  (`docs/AUDITORIA-2026-10-07-flujo-de-edicion.md`, D1). Las versiones se
   *  listaban por cliente, mezclando dashboards; ahora se miran las del
   *  dashboard elegido, y sin elección, las del POR DEFECTO.
   *
   *  **Si la lista de dashboards no llegó** —un servicio sin la ruta, un mock que
   *  no la sirve—, `dashboardDeTrabajo` es `null` y no se filtra: se vuelve al
   *  comportamiento anterior en vez de mostrar un builder vacío. */
  const dashboards = useDashboards(tenantActivo)
  const crearDashboard = useCreateDashboard(tenantActivo)
  const [dashboardElegido, setDashboardElegido] = useState<string | null>(null)
  /** **Sin la ruta de dashboards, se arman desde las versiones** · cada una
   *  dice de qué dashboard es. El nombre sale de `/config/me` cuando es el
   *  cliente propio; si no, se numera. Mejor un builder que funciona con
   *  nombres genéricos que uno vacío. */
  const listaDeDashboards =
    dashboards.data ??
    (dashboards.isError
      ? [...new Set((versiones.data ?? []).map((v) => v.dashboardId))].map((id, i) => ({
          id,
          tenantId: tenantActivo ?? '',
          nombre: yo.data?.dashboards.find((d) => d.id === id)?.nombre ?? `Dashboard ${String(i + 1)}`,
          porDefecto: i === 0,
        }))
      : null)
  const dashboardDeTrabajo =
    dashboardElegido !== null && listaDeDashboards?.some((d) => d.id === dashboardElegido) === true
      ? dashboardElegido
      : ((listaDeDashboards?.find((d) => d.porDefecto) ?? listaDeDashboards?.[0])?.id ?? null)
  const deEsteDashboard = (versiones.data ?? []).filter(
    (v) => dashboardDeTrabajo === null || v.dashboardId === dashboardDeTrabajo,
  )
  /** **La versión se elige sola si nadie eligió** · 2026-10-06. B1 abría con la
   *  lista de versiones y nada más, y el canvas decía «Elegí una versión»: dos
   *  pasos antes de ver una pestaña. El borrador es casi siempre lo que se viene
   *  a editar; si no hay, la más reciente. Elegir otra sigue a un toque. */
  const version =
    versionElegida ??
    (deEsteDashboard.find((v) => v.estado === 'borrador') ?? deEsteDashboard[0])?.id ??
    null
  const detalle = useLayoutDetail(version)

  // **El borrador se ata al layout que lo originó y se deriva en el render.**
  // Sin el `layoutId` adentro, elegir otra versión mostraría las pestañas de la
  // anterior hasta que algo volviera a montar; con un `useEffect` que lo
  // sincronice, el primer render pinta el borrador viejo y el segundo lo
  // corrige, que es un parpadeo y una ventana donde `sucio` miente.
  const [borrador, setBorrador] = useState<{ layoutId: string; tabs: TabParaGuardar[] } | null>(null)
  const [seleccion, elegirPanel] = useState<{ tab: number; panel: number } | null>(null)
  /** **Qué profundidad del panel está abierta** · D6 del 2026-10-07. Elegir
   *  otro panel empieza de cero; uno sin métrica abre en «Qué muestra», que es
   *  lo único que le falta. */
  const [profundidad, setProfundidad] = useState<Profundidad | null>(null)
  const setSeleccion = (s: { tab: number; panel: number } | null) => {
    elegirPanel(s)
    if (s === null) return setProfundidad(null)
    // Un panel recién agregado todavía no está en `tabs` de este render: es
    // nuevo, y lo que le falta es la métrica.
    const p = tabs[s.tab]?.panels[s.panel]
    setProfundidad(p === undefined || p.metricId === '' ? 'metrica' : null)
  }
  /** **La pestaña que se compone en B2.** El `.pen` la pone en el chrome —
   *  `PESTAÑA · eCommerce Overview`— porque el canvas compone UNA, no todas: un
   *  lienzo con los paneles de las cuatro pestañas encimados no es una
   *  composición, es una superposición. */
  const [tabActiva, setTabActiva] = useState(0)
  const [arrastrando, setArrastrando] = useState<string | null>(null)

  // **Las dos tablas que el binder necesita** · F4.10. `/config/blocks` manda qué
  // formas acepta cada tipo y qué spans; el catálogo de admin manda las métricas
  // del tenant SIN filtrar por rol, que es la lista que quien compone necesita.
  const bloques = useBlocks()
  // El repertorio · F4.21. Arriba con los demás hooks, y no junto a su uso:
  // puesto abajo quedaría después de los retornos tempranos, que es como se
  // rompió el contenedor de la consola el mismo día.
  const plots = usePlots()
  const catalogo = useAdminCatalog(tenantActivo)
  const semilla = detalle.data === undefined ? null : sembrar(detalle.data)
  const tabs =
    borrador !== null && borrador.layoutId === version ? borrador.tabs : (semilla ?? [])

  // `api.blocks` devuelve `{ blocks }`, no un arreglo.
  const listaDeBloques = bloques.data?.blocks ?? []
  const tabla = blockTable(listaDeBloques)
  // **El panel elegido se resuelve por índice contra el borrador vigente**, y
  // puede no existir: quitar una pestaña deja una selección apuntando a un hueco.
  // Devolver `null` ahí es lo que impide un `undefined` que se propague hasta el
  // configurador y explote al leer `panel.tipo`.
  const configurable =
    seleccion === null ? null : (tabs[seleccion.tab]?.panels[seleccion.panel] ?? null)

  // **Se recalcula en cada render y eso es el punto** · F4.11: es feedback
  // inmediato. Memorizarlo por `tabs` sería la optimización obvia y la trampa
  // conocida — el borrador es un objeto nuevo en cada cambio, así que la memo
  // nunca acertaría y solo agregaría una comparación.
  const problemas = validarBorrador(tabs, tabla, catalogo.data?.metrics ?? [])

  /** **El rol es del CONTEXTO de edición, no de B5.** Lo elige B1 —«el rol
   *  define qué pestañas se editan», dice el `.pen`— y B5 lo usa para pedir su
   *  preview. Tenerlo acá arriba es lo que deja pintarlo en el chrome de todas
   *  las pantallas de composición. */
  const [rol, setRol] = useState<string | null>(null)
  const roles = useRoles(tenantActivo)
  /** **`null` es «todos los roles»**, el filtro apagado · D5 de la auditoría
   *  del 2026-10-06. Hasta hoy caía al primer rol, y el selector se movía sin
   *  cambiar nada en pantalla. Ahora filtra las pestañas de B1 y del canvas. */
  const rolActivo = rol !== null && roles.data?.some((r) => r.id === rol) === true ? rol : null
  /** **B5 sí necesita UN rol**: previsualizar «todos» no es una vista de nadie. */
  const rolDePreview = rolActivo ?? roles.data?.[0]?.id ?? null
  // **Con datos** · 2026-10-07: B5 dibuja los paneles con su cifra.
  const preview = usePreview(pantalla === 'preview' ? version : null, rolDePreview, true)

  /** ── EL DATO DEL LIENZO · 2026-10-07 ──────────────────────────────────────
   *
   *  D1 de `docs/AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`: el lienzo
   *  dibuja cada panel con su gráfico y su cifra. Sale del preview del borrador
   *  abierto con `include=payloads`, que usa **el cliente del layout** —el
   *  batch de la consola usaría el del token, que puede ser otro—.
   *
   *  **El lente (D2)**: el rol del filtro si hay uno —así lo que ese rol no ve
   *  se ve donde se compone—; con «Todos los roles», `admin`, que ve todo. */
  const rolDeDatos =
    rolActivo ?? roles.data?.find((r) => r.nombre.toLowerCase() === 'admin')?.id ?? roles.data?.[0]?.id ?? null
  const datosDelLienzo = usePreview(pantalla === 'canvas' ? version : null, rolDeDatos, true)
  /** **El dato es por métrica y período**, no por panel —`dd_panel_data`—: un
   *  panel nuevo con una métrica que ya está en el lienzo se dibuja sin esperar
   *  al guardado. */
  const datoPorMetrica = new Map<string, Payload>()
  for (const t of datosDelLienzo.data?.tabs ?? []) {
    for (const x of t.paneles) {
      const d = datosDelLienzo.data?.datos?.porPanel.get(x.id)
      if (d !== undefined && !datoPorMetrica.has(x.metricId)) datoPorMetrica.set(x.metricId, d)
    }
  }

  const guardar = useSaveLayout(version)
  const validar = useValidateLayout(version)
  const publicar = usePublishLayout(version, tenantActivo)
  const duplicar = useCreateDraft(tenantActivo)
  const publicada = detalle.data?.layout.estado === 'publicado'

  /* ── B6 · EL HISTORIAL Y LA REVERSIÓN · §PEN:B6 · 2026-09-30 ───────────────
   *
   * **El dashboard sale de la versión abierta, y es el único camino.** El
   * historial se pide por dashboard —`GET /admin/dashboards/{id}/publications`,
   * cinco filas contra una de la ruta por layout— y lo que B1 elige es un
   * LAYOUT. `adaptarVersion` tiraba `dashboard_id` hasta hoy, así que hasta hoy
   * no había forma de llegar de lo elegido a lo que hay que pedir.
   *
   * Los tres hooks se llaman siempre y se apagan por `enabled`, como los de
   * arriba: no pueden colgar de `pantalla` sin violar las reglas de hooks.
   */
  const dashboardId = detalle.data?.layout.dashboardId ?? null
  const publicaciones = usePublications(dashboardId)
  const usuarios = useUsers(tenantActivo)
  const revertir = useRevertLayout(tenantActivo, dashboardId)

  /** **El locale de QUIEN MIRA**, igual que en administración y por la misma
   *  razón escrita en `Admin.tsx`: el builder CRUZA clientes —B1 los elige, y
   *  cada uno trae el suyo—, así que formatear con el del cliente haría que la
   *  misma columna de fechas cambiara de formato al cambiar de selector. En la
   *  consola es al revés porque ahí todo es de un tenant. */
  const format = useMemo(
    () => createFormat(yo.data?.tenant.locale || LOCALE_POR_DEFECTO),
    [yo.data?.tenant.locale],
  )

  /** El nombre del dashboard · **puede no resolverse, y se dice en vez de
   *  inventarse**.
   *
   *  `/config/me` es el único cable transcripto que trae nombres de dashboard, y
   *  es del usuario que MIRA: sirve mientras se compone el cliente propio. Para
   *  uno ajeno haría falta `GET /admin/tenants/{tenantId}/dashboards`, que el
   *  servicio tiene desde `168a761` y **nuestro cable no declara** — eso es
   *  trabajo nuestro, no un hueco suyo.
   *
   *  **El caso se ve de entrada**, medido el 2026-09-30: la base local tiene dos
   *  clientes con el nombre «Under Armour México» y el que el builder elige por
   *  defecto —`lista[0]`— no es el del usuario sembrado.
   *
   *  **Desde el 2026-10-07 la ruta está transcripta** y es la primera fuente:
   *  sirve para cualquier cliente. `/config/me` queda como respaldo cuando la
   *  ruta no contesta. **No se usa `listaDeDashboards`**: en ese respaldo numera
   *  —«Dashboard 2»— y un título no lleva un nombre inventado. */
  const dashboardNombre =
    dashboardId === null
      ? null
      : (dashboards.data?.find((d) => d.id === dashboardId)?.nombre ??
        (yo.data !== undefined && yo.data.tenant.id === tenantActivo
          ? (yo.data.dashboards.find((d) => d.id === dashboardId)?.nombre ?? null)
          : null))

  /** El cliente, por nombre. `null` mientras `GET /admin/tenants` no volvió. */
  const clienteNombre = lista.find((t) => t.id === tenantActivo)?.nombre ?? null

  /** **El mensaje del servidor y no uno nuestro.** El envelope trae `error` como
   *  cadena ya redactada en español desde `f70cec2`, así que traducir los códigos
   *  acá sería una segunda fuente para el mismo texto. Lo único propio es el
   *  caso en que la cadena viene vacía. */
  const errorAlRevertir =
    revertir.error === null
      ? null
      : revertir.error.message === ''
        ? 'No se pudo revertir'
        : revertir.error.message

  /** El 409 tiene nombre propio y una salida concreta; el resto, lo que diga el
   *  servicio. Sin distinguirlos, «error al guardar» taparía la única acción que
   *  desatasca. */
  const errorAlGuardar =
    guardar.error === null
      ? null
      : guardar.error instanceof ApiError && guardar.error.code === 'REGLA_LAYOUT_PUBLICADO'
        ? 'Alguien publicó esta versión mientras la editabas · duplicala para conservar los cambios'
        : (guardar.error.message === '' ? 'No se pudo guardar' : guardar.error.message)

  // Elegir otra versión no necesita limpiar el borrador: se descarta por
  // identidad, porque su `layoutId` deja de coincidir.
  const cambiar = (siguiente: TabParaGuardar[]) => {
    if (version === null || publicada) return
    // Un error de guardado se olvida al seguir editando: el próximo guardado
    // automático lo vuelve a intentar con lo nuevo.
    if (guardar.isError) guardar.reset()
    setBorrador({ layoutId: version, tabs: siguiente })
  }

  /** ── GUARDAR · AUTOMÁTICO Y EXPLÍCITO · 2026-10-07 ────────────────────────
   *
   *  Decisión humana (D2 de `docs/AUDITORIA-2026-10-07-flujo-de-edicion.md`):
   *  «ambos, pero el guardar se debe ver explícito, mostrando los estados del
   *  botón cuando quede guardado». Hasta hoy «Guardar» aparecía sólo con
   *  cambios y desaparecía al guardar, sin dejar nada: se veía igual que si se
   *  hubiera roto.
   *
   *  **Guardar invalida el veredicto anterior**, igual que antes. Lo que cambió
   *  es qué pasa con el borrador local: se descartaba entero, y con el guardado
   *  automático **se puede seguir editando mientras el `PUT` viaja**. Si nada
   *  cambió desde que salió, se descarta como antes; si cambió, se conserva y
   *  sólo adopta los ids que el servidor asignó · `adoptarIds`. */
  /** **De QUÉ versión es la hora** · visto en pantalla el 2026-10-07: al pasar
   *  a otro dashboard seguía diciendo «Guardado a las 09:49», que era la hora
   *  del anterior. */
  const [ultimoGuardado, setUltimoGuardado] = useState<{ layoutId: string; hora: string } | null>(null)
  const hayCambios = semilla !== null && sucio(tabs, semilla)
  const guardarBorrador = () => {
    if (version === null || publicada) return
    const enviado = tabs
    const layoutId = version
    validar.reset()
    guardar.mutate(enviado, {
      onSuccess: (guardadoDetalle) => {
        setUltimoGuardado({ layoutId, hora: new Date().toISOString() })
        setBorrador((actual) =>
          actual === null || actual.layoutId !== layoutId || actual.tabs === enviado
            ? null
            : { layoutId, tabs: adoptarIds(actual.tabs, enviado, sembrar(guardadoDetalle)) },
        )
      },
    })
  }

  // **El automático espera a que se deje de editar** · cada cambio reinicia la
  // cuenta. No corre con un guardado en vuelo ni después de un error: el error
  // se muestra y espera «Reintentar» o el próximo cambio.
  useEffect(() => {
    if (!hayCambios || publicada || guardar.isPending || guardar.isError) return
    const t = window.setTimeout(guardarBorrador, AUTOGUARDADO_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, hayCambios, publicada, guardar.isPending, guardar.isError])

  // **Salir con cambios sin guardar avisa.** El navegador pone su propio texto;
  // lo que importa es que pregunte.
  useEffect(() => {
    if (!hayCambios) return
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hayCambios])

  /** ── ABRIR EL EDITOR · resuelve el borrador del dashboard ─────────────────
   *
   *  Tres casos, y la pantalla dice cuál antes de apretar · `queVaAPasar`:
   *  hay borrador → se abre; sólo hay publicada → se crea un borrador a partir
   *  de ella; no hay nada → se crea el primero, vacío. **Siempre con el
   *  `dashboard_id`**: sin él el servicio usa el dashboard por defecto. */
  const versionDeTrabajo = (versiones.data ?? []).find((v) => v.id === version) ?? null
  const siguienteVersion = () => {
    const numeros = (versiones.data ?? [])
      .map((v) => /^v(\d+)$/.exec(v.versionId)?.[1])
      .filter((n): n is string => n !== undefined)
      .map(Number)
    return `v${String(Math.max(0, ...numeros) + 1)}`
  }
  const [avisoDelEditor, setAvisoDelEditor] = useState<string | null>(null)
  /** La pestaña cuyos ajustes están abiertos en el inspector · `null` cerrado. */
  const [ajustesDe, setAjustesDe] = useState<number | null>(null)
  const crearBorradorDesde = (origen: 'publicada' | 'vacio', alAbrir: boolean) => {
    const nueva = siguienteVersion()
    duplicar.mutate(
      {
        versionId: nueva,
        ...(dashboardDeTrabajo === null ? {} : { dashboardId: dashboardDeTrabajo }),
        ...(origen === 'publicada' && semilla !== null ? { tabs: semilla } : {}),
      },
      {
        onSuccess: (nuevo) => {
          setBorrador(null)
          setSeleccion(null)
          setVersion(nuevo.id)
          setAvisoDelEditor(
            origen === 'publicada'
              ? `Se creó el borrador ${nuevo.versionId} a partir de la versión publicada ${versionDeTrabajo?.versionId ?? ''}. Lo publicado no cambia hasta que publiques.`
              : `Se creó el borrador ${nuevo.versionId}, vacío. Empezá agregando una pestaña.`,
          )
          if (alAbrir) setPantalla('canvas')
        },
      },
    )
  }
  const queVaAPasar =
    versionDeTrabajo === null
      ? 'Todavía no se compuso. Se va a crear su primer borrador, vacío.'
      : versionDeTrabajo.estado === 'borrador'
        ? `Vas a editar el borrador ${versionDeTrabajo.versionId}. Los cambios se guardan solos.`
        : `Se va a crear un borrador a partir de la versión publicada ${versionDeTrabajo.versionId}. Lo publicado no cambia hasta que publiques.`
  const abrirEditor = () => {
    if (versionDeTrabajo === null) return crearBorradorDesde('vacio', true)
    if (versionDeTrabajo.estado === 'borrador') return setPantalla('canvas')
    return crearBorradorDesde('publicada', true)
  }

  if (tenants.isError) {
    // Mismo caso probable que en administración: estas rutas piden rol `admin`,
    // y un `planner` que abra `/builder` no está ante un fallo sino ante un
    // permiso que no tiene.
    return (
      <SurfaceMessage
        title="No se pudo abrir el builder"
        detail={
          tenants.error instanceof ApiError && tenants.error.httpStatus === 403
            ? 'Esta superficie pide rol de administrador.'
            : (tenants.error.message ?? 'Sin detalle del servidor')
        }
        onRetry={() => void tenants.refetch()}
      />
    )
  }

  const pendiente = PENDIENTES[pantalla]
  const reubicada = EN_OTRA_PANTALLA[pantalla]


  /** Las pestañas que ve el rol del filtro, con su índice en el borrador
   *  entero · D5. El filtro sólo decide qué se pinta. */
  const visibles = tabs.map((t, i) => ({ t, i })).filter(({ t }) => laVe(t, rolActivo))
  /** La pestaña del lienzo · si la elegida quedó fuera del filtro, la primera
   *  visible. Sin esto, cambiar de rol dejaba el lienzo en una pestaña que el
   *  selector ya no ofrece. */
  const tabEnLienzo = visibles.some(({ i }) => i === tabActiva) ? tabActiva : (visibles[0]?.i ?? 0)

  /** Ir a un problema · lleva al panel en el lienzo, o a B1 si es de la
   *  pestaña. Es lo que la lista de problemas no tenía. */
  /** Ir a un problema · al panel, o a los ajustes de la pestaña. Desde el
   *  2026-10-07 los dos viven en el editor. */
  const irA = (tab: number, panel: number | null) => {
    setTabActiva(tab)
    if (panel === null) {
      setSeleccion(null)
      setAjustesDe(tab)
    } else {
      setAjustesDe(null)
      setSeleccion({ tab, panel })
    }
    setPantalla('canvas')
  }

  const revisionDelBorrador =
    semilla === null ? null : (
      <>
        <SaveBar error={errorAlGuardar} />
        <PublishBar
          sucio={sucio(tabs, semilla)}
          publicada={publicada}
          veredicto={
            validar.data === undefined
              ? null
              : { valido: validar.data.valido, problemas: validar.data.problemas }
          }
          nombreDeTab={(tabId) =>
            detalle.data?.tabs.find((t) => t.tab.id === tabId)?.tab.nombre ?? 'El layout'
          }
          error={
            publicar.error === null
              ? validar.error === null
                ? null
                : `No se pudo validar · ${validar.error.message}`
              : // 422 es «hay paneles inválidos», que es información, no un
                // fallo de red: se dice con las palabras del caso.
                publicar.error instanceof ApiError && publicar.error.httpStatus === 422
                ? 'El servidor rechazó la publicación: hay paneles inválidos'
                : `No se pudo publicar · ${publicar.error.message}`
          }
        />
        <ValidationSummary problemas={problemas} nombres={tabs.map((t) => t.nombre)} onIr={irA} />
      </>
    )

  /** ── DIBUJAR UN PANEL DEL LIENZO CON SU DATO · 2026-10-07 ─────────────── */
  const metricasPorId = new Map((catalogo.data?.metrics ?? []).map((m) => [m.id, m]))
  const repertorio = plotTable(plots.data ?? [])
  /** **Los números en el idioma del CLIENTE**, como los ve él en la consola. El
   *  `format` del builder es el de quien mira —ver arriba—, y sirve para las
   *  fechas de las tablas del builder, no para el dibujo de un panel ajeno. */
  const clienteDeTrabajo = lista.find((t) => t.id === tenantActivo)
  const formatDelCliente = createFormat(clienteDeTrabajo?.locale || LOCALE_POR_DEFECTO)
  const ahora = new Date()
  const rolDelLente = roles.data?.find((r) => r.id === rolDeDatos)
  const nombreDeGrafico = (id: string) => plots.data?.find((x) => x.id === id)?.nombre ?? id
  const ocultaParaElLente = (p: PanelDeBorrador) =>
    rolActivo !== null && rolDelLente?.metricasOcultas.includes(p.metricId) === true
  /** El dato de un panel del borrador · por su id si ya se guardó, y si no por
   *  su métrica, que es como el servicio lo guarda. */
  const payloadDe = (p: PanelDeBorrador): Payload | undefined =>
    ocultaParaElLente(p)
      ? undefined
      : ((p.id === undefined ? undefined : datosDelLienzo.data?.datos?.porPanel.get(p.id)) ??
        datoPorMetrica.get(p.metricId))
  const dibujarPanel = (indice: number) => {
    const p = tabs[tabEnLienzo]?.panels[indice]
    if (p === undefined) return null
    const oculta = ocultaParaElLente(p)
    const payload = payloadDe(p)
    const sinDato = oculta
      ? `${rolDelLente?.nombre ?? 'Este rol'} no ve esta métrica: la tiene oculta.`
      : roles.data !== undefined && roles.data.length === 0
        ? // **Sin roles no hay con qué pedirlo**: la ruta exige `role_id`, y
          // «Trayendo el dato…» quedaría para siempre.
          'Este cliente todavía no tiene roles, y el dato se pide como lo ve un rol.'
        : datosDelLienzo.isError
        ? `No se pudo traer el dato · ${datosDelLienzo.error.message === '' ? 'sin detalle del servidor' : datosDelLienzo.error.message}`
        : datosDelLienzo.data === undefined
          ? 'Trayendo el dato…'
          : 'Se dibuja al guardar.'
    return (
      <PanelConDato
        // **`colStart` 1**: la celda del lienzo ya ubica el panel; adentro es
        // una grilla de su propio ancho.
        panel={{ ...p, id: p.id ?? `nuevo-${String(indice)}`, colStart: 1 } as PanelConfig}
        metrica={p.metricId === '' ? undefined : metricasPorId.get(p.metricId)}
        payload={payload}
        sinDato={sinDato}
        bloques={listaDeBloques}
        repertorio={repertorio}
        format={formatDelCliente}
        now={ahora}
      />
    )
  }

  const configurador =
    configurable === null || seleccion === null ? null : (
      <PanelConfigurator
        // **Una instancia por panel**: la profundidad abierta es de ESTE panel,
        // y elegir otro empieza de cero.
        key={`${String(seleccion.tab)}-${String(seleccion.panel)}`}
        plots={plots.data ?? []}
        repertorio={repertorio}
        payload={payloadDe(configurable)}
        format={formatDelCliente}
        onComoSeVe={(tipo, grafico) => {
          let siguiente = tabs
          if (tipo !== configurable.tipo) {
            const b = tabla.get(tipo as PanelConfig['tipo'])
            if (b === undefined) return
            siguiente = cambiarTipo(
              siguiente,
              seleccion.tab,
              seleccion.panel,
              tipo,
              b.colSpanMin,
              b.colSpanMax,
              b.rowSpanMin,
              b.rowSpanMax,
            )
          }
          cambiar(quitarOPonerGrafico(siguiente, seleccion.tab, seleccion.panel, grafico))
        }}
        panel={configurable}
        bloques={listaDeBloques}
        tabla={tabla}
        metrics={catalogo.data?.metrics ?? []}
        problemas={problemas.filter(
          (p) => p.tab === seleccion.tab && p.panel === seleccion.panel,
        )}
        onMetrica={(metricId) => {
          // **Una métrica de otra forma cambia el tipo** al que la dibuja · la
          // lista lo dijo antes de apretar. Sin esto, «qué muestra» primero
          // obligaría a elegir el dibujo antes que el dato.
          const m = metricasPorId.get(metricId)
          const actual = tabla.get(configurable.tipo as PanelConfig['tipo'])
          let siguiente = tabs
          if (m !== undefined && actual !== undefined && !actual.formasAceptadas.includes(m.forma)) {
            const otro = tipoPara(listaDeBloques, m.forma)
            const b = otro === undefined ? undefined : tabla.get(otro as PanelConfig['tipo'])
            if (otro !== undefined && b !== undefined) {
              siguiente = cambiarTipo(
                siguiente,
                seleccion.tab,
                seleccion.panel,
                otro,
                b.colSpanMin,
                b.colSpanMax,
                b.rowSpanMin,
                b.rowSpanMax,
              )
            }
          }
          cambiar(editarPanel(siguiente, seleccion.tab, seleccion.panel, { metricId }))
        }}
        onSpan={(campo, valor) => cambiar(editarPanel(tabs, seleccion.tab, seleccion.panel, { [campo]: valor }))}
        onOpcion={(nombre, valor) => cambiar(editarOpcion(tabs, seleccion.tab, seleccion.panel, nombre, valor))}
        onQuitar={() => {
          cambiar(quitarPanel(tabs, seleccion.tab, seleccion.panel))
          setSeleccion(null)
        }}
        onCerrar={() => setSeleccion(null)}
        abierta={profundidad}
        onAbrir={setProfundidad}
      />
    )

  /** El estado de cada dashboard, en palabras, para la tarjeta del paso 1. */
  const dashboardsParaElegir: DashboardEnLista[] = (listaDeDashboards ?? []).map((d) => {
    const suyas = (versiones.data ?? []).filter((v) => v.dashboardId === d.id)
    const enCurso = suyas.find((v) => v.estado === 'borrador')
    const publicadaDe = suyas.find((v) => v.estado === 'publicado')
    const estado =
      enCurso !== undefined
        ? `Borrador ${enCurso.versionId} en curso${publicadaDe === undefined ? '' : ` · publicada ${publicadaDe.versionId}`}`
        : publicadaDe !== undefined
          ? `Publicado ${publicadaDe.versionId}${publicadaDe.publicadoEn === null ? '' : ` · ${format.calendar(publicadaDe.publicadoEn)}`}`
          : 'Todavía no se compuso'
    return { id: d.id, nombre: d.nombre, porDefecto: d.porDefecto, estado }
  })

  return (
    <BuilderChrome
      onChangeTheme={(theme) => saveTheme.mutate(theme)}
      // **La identidad sale del mismo `/config/me` que la consola y admin**:
      // no hay una fuente de identidad por superficie.
      onSalir={(ruta) => void navegar(ruta)}
      clientes={lista}
      clienteActivo={tenantActivo}
      onCliente={(id) => {
        setTenant(id)
        setDashboardElegido(null)
        setVersion(null)
        setRol(null)
        setSeleccion(null)
        setAjustesDe(null)
        setPantalla('contexto')
      }}
      // **Sin versión no hay nada que previsualizar** · 2026-10-06.
      onVistaPrevia={version === null ? null : () => setPantalla('preview')}
      {...(yo.data === undefined
        ? {}
        : {
            identidad: {
              rol: yo.data.role.nombre,
              nombre: yo.data.user.nombre,
              correo: yo.data.user.email,
            },
          })}
      onCerrarSesion={cerrarSesion}
      activa={pantalla}
      onIr={(p) => {
        // **Ir al editor sin borrador lo resuelve igual que el paso 3**: abre el
        // borrador, o lo crea. Sin esto, la pestaña «Editor» abría la versión
        // publicada, donde no se puede guardar.
        if (p === 'canvas' && pantalla !== 'canvas' && versionDeTrabajo?.estado !== 'borrador') {
          abrirEditor()
          return
        }
        setPantalla(p)
      }}
      contexto={{
        tenant: lista.find((t) => t.id === tenantActivo)?.nombre ?? null,
        dashboard: listaDeDashboards?.find((d) => d.id === dashboardDeTrabajo)?.nombre ?? null,
        version:
          versionDeTrabajo === null
            ? null
            : `${versionDeTrabajo.estado === 'borrador' ? 'Borrador' : 'Publicada'} ${versionDeTrabajo.versionId}`,
        rol: roles.data?.find((r) => r.id === rolActivo)?.nombre ?? null,
        pestana: pantalla === 'canvas' ? (tabs[tabEnLienzo]?.nombre ?? null) : null,
        // **Cuenta pestañas tocadas, no pulsaciones.**
        cambios: semilla === null ? 0 : tabs.filter((t, i) => JSON.stringify(t) !== JSON.stringify(semilla[i])).length,
      }}
      guardado={{
        estado:
          semilla === null
            ? 'sin-borrador'
            : publicada
              ? 'lectura'
              : guardar.isPending
                ? 'guardando'
                : guardar.isError
                  ? 'error'
                  : hayCambios
                    ? 'sucio'
                    : 'limpio',
        ultimo:
          ultimoGuardado === null || ultimoGuardado.layoutId !== version
            ? null
            : format.clock(ultimoGuardado.hora),
        error: errorAlGuardar,
        onGuardar: guardarBorrador,
      }}
      onValidar={
        semilla !== null && !hayCambios && !publicada ? () => validar.mutate() : null
      }
      validando={validar.isPending}
      porQueNoPublicar={
        semilla === null || publicada
          ? null
          : hayCambios
            ? 'Para publicar, esperá a que se guarde y validá.'
            : validar.data?.valido === false
              ? 'El servidor encontró problemas.'
              : 'Para publicar, validá.'
      }
      onPublicar={
        // El permiso es el mismo que usa `PublishBar`: el servidor dijo válido y
        // no se tocó nada desde entonces.
        validar.data?.valido === true && semilla !== null && !hayCambios && !publicada
          ? () => publicar.mutate(detalle.data?.layout.versionId)
          : null
      }
    >
      {reubicada !== undefined ? (
        <div className="flex flex-col items-start gap-3">
          <Ayuda>{reubicada}</Ayuda>
          <Accion onClick={() => setPantalla('canvas')}>Ir al editor</Accion>
        </div>
      ) : pendiente !== undefined ? (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Ayuda>{pendiente.razon}</Ayuda>
          <Ayuda>{`Se desbloquea con: ${pendiente.desbloqueaCon}`}</Ayuda>
        </div>
      ) : pantalla === 'canvas' ? (
        semilla === null ? (
          <div className="flex flex-col items-start gap-3">
            <Ayuda>Elegí un dashboard para abrir su editor.</Ayuda>
            <Accion onClick={() => setPantalla('contexto')}>Ir a Dashboards</Accion>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {revisionDelBorrador}

            {/* El aviso de lo que pasó al abrir · «se creó un borrador a partir
                de la publicada». Se puede cerrar: se dice una vez. */}
            {avisoDelEditor !== null && (
              <div className="flex items-center gap-3 rounded-xl border border-w4 bg-panel p-4">
                <Ayuda as="span">{avisoDelEditor}</Ayuda>
                <div className="ml-auto">
                  <Accion tamano="compacta" onClick={() => setAvisoDelEditor(null)}>
                    Entendido
                  </Accion>
                </div>
              </div>
            )}

            {/* **La versión publicada no se edita en el lugar** · §2.4 de la
                auditoría del flujo. Antes se podía arrastrar, cambiar métricas y
                sumar cambios sobre ella, y «Guardar» nunca aparecía. */}
            {publicada && (
              <div className="flex items-center gap-3 rounded-xl border border-acc bg-panel p-4">
                <Ayuda as="span">
                  Estás viendo la versión publicada: no se edita. Para cambiarla, creá un borrador a partir
                  de ella.
                </Ayuda>
                <div className="ml-auto">
                  <Accion
                    variante="primaria"
                    onClick={() => crearBorradorDesde('publicada', false)}
                    deshabilitada={duplicar.isPending}
                  >
                    {duplicar.isPending ? 'Creando…' : 'Editar en un borrador'}
                  </Accion>
                </div>
              </div>
            )}

            {/* ── LAS PESTAÑAS, COMO PESTAÑAS · §2.2 de la auditoría del flujo ──
                Reemplazan al `<select>` «Componiendo». Sólo las que ve el rol
                del filtro · D5. Tocar la activa abre sus ajustes. */}
            <div
              className="flex flex-wrap items-end gap-1 border-b border-w4"
              role="tablist"
              aria-label="Pestañas del dashboard"
            >
              {visibles.map(({ t, i }) => (
                <button
                  key={t.id ?? `nueva-${String(i)}`}
                  type="button"
                  role="tab"
                  aria-selected={i === tabEnLienzo}
                  onClick={() => {
                    if (i === tabEnLienzo) {
                      setSeleccion(null)
                      setAjustesDe(i)
                      return
                    }
                    setTabActiva(i)
                    setSeleccion(null)
                    setAjustesDe(null)
                  }}
                  className={
                    'px-3 py-2 -mb-px font-body text-cuerpo cursor-pointer border-b-2 ' +
                    (i === tabEnLienzo
                      ? 'border-acc text-ink font-semibold'
                      : 'border-transparent text-dim font-medium hover:text-ink')
                  }
                >
                  {t.nombre === '' ? 'Pestaña sin nombre' : t.nombre}
                </button>
              ))}
              {!publicada && (
                <div className="ml-2 mb-1 flex gap-2">
                  <Accion
                    tamano="compacta"
                    onClick={() => {
                      const conNueva = agregar(tabs, rolActivo === null ? [] : [rolActivo])
                      cambiar(conNueva)
                      setTabActiva(conNueva.length - 1)
                      setSeleccion(null)
                      setAjustesDe(conNueva.length - 1)
                    }}
                    etiqueta="Agregar una pestaña"
                  >
                    + Pestaña
                  </Accion>
                  {visibles.length > 0 && (
                    <Accion
                      tamano="compacta"
                      onClick={() => {
                        setSeleccion(null)
                        setAjustesDe(tabEnLienzo)
                      }}
                    >
                      Ajustes de la pestaña
                    </Accion>
                  )}
                </div>
              )}
            </div>

            {visibles.length === 0 ? (
              <Ayuda>
                {tabs.length === 0
                  ? 'Este dashboard todavía no tiene pestañas. Agregá la primera con «+ Pestaña».'
                  : 'Este rol no ve ninguna pestaña de este dashboard. Agregá una con «+ Pestaña».'}
              </Ayuda>
            ) : (
              <div className="flex items-start gap-6">
                {/* ── LA COLUMNA DE LA IZQUIERDA · D6 del 2026-10-07 ──────────
                    La biblioteca, o —con algo elegido— la configuración en
                    columnas que se abren hacia el lienzo. **No lo tapan: lo
                    corren**, y el lienzo trae el panel elegido a la vista. Eran
                    paneles fijos a la derecha que tapaban un tercio del lienzo,
                    a veces el panel que se estaba configurando. */}
                {!publicada &&
                  (configurador !== null && seleccion?.tab === tabEnLienzo ? (
                    configurador
                  ) : ajustesDe !== null && tabs[ajustesDe] !== undefined ? (
                    <aside
                      aria-label="Ajustes de la pestaña"
                      className="sticky top-[calc(var(--alto-cabecera-builder,0px)+16px)] flex w-75 shrink-0 flex-col gap-3 self-start"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setAjustesDe(null)
                      }}
                    >
                      <div className="flex justify-end">
                        <Accion
                          tamano="compacta"
                          onClick={() => setAjustesDe(null)}
                          etiqueta="Cerrar los ajustes de la pestaña"
                        >
                          Cerrar
                        </Accion>
                      </div>
                        <TabInspector
                          tab={tabs[ajustesDe]}
                          indice={ajustesDe}
                          total={tabs.length}
                          roles={roles.data ?? []}
                          problemas={problemas
                            .filter((pr) => pr.tab === ajustesDe && pr.panel === null)
                            .map((pr) => pr.mensaje)}
                          onEditar={(campo, valor) => cambiar(editar(tabs, ajustesDe, campo, valor))}
                          onRoles={(r) => cambiar(asignarRoles(tabs, ajustesDe, r))}
                          onMover={(d) => {
                            cambiar(mover(tabs, ajustesDe, d))
                            setTabActiva(ajustesDe + d)
                            setAjustesDe(ajustesDe + d)
                          }}
                          onQuitar={() => {
                            cambiar(quitar(tabs, ajustesDe))
                            setAjustesDe(null)
                            setTabActiva(0)
                          }}
                        />
                    </aside>
                  ) : (
                    <Library
                      bloques={listaDeBloques}
                      arrastrando={arrastrando}
                      onArrastrar={setArrastrando}
                      onAgregar={(tipo) => {
                        const b = tabla.get(tipo as PanelConfig['tipo'])
                        if (b === undefined) return
                        const conNuevo = agregarPanel(tabs, tabEnLienzo, tipo, b.colSpanMin, b.rowSpanMin)
                        cambiar(conNuevo)
                        setAjustesDe(null)
                        setSeleccion({ tab: tabEnLienzo, panel: (conNuevo[tabEnLienzo]?.panels.length ?? 1) - 1 })
                      }}
                    />
                  ))}
                {/* **El lienzo a su ancho 1:1** —las 12 columnas de 80 con su
                    separación, `CANVAS_WIDTH`—: las columnas lo corren, no lo
                    achican. A otra escala las unidades de arrastre mentirían. */}
                {/* **Con su propio scroll horizontal**: las columnas no se mueven
                    y el lienzo se recorre al lado, así ni el panel elegido ni la
                    configuración quedan fuera de la pantalla. */}
                <div className="min-w-0 flex-1 overflow-x-auto pt-3">
                <div className="flex flex-col gap-3" style={{ width: CANVAS_WIDTH }}>
                  <Canvas
                    panels={tabs[tabEnLienzo]?.panels ?? []}
                    tabla={tabla}
                    metricas={catalogo.data?.metrics ?? []}
                    soloLectura={publicada}
                    seleccionado={seleccion?.tab === tabEnLienzo ? seleccion.panel : null}
                    onSeleccionar={(i) => {
                      setAjustesDe(null)
                      setSeleccion(i === null ? null : { tab: tabEnLienzo, panel: i })
                    }}
                    onReubicar={(i, colStart, destino) =>
                      cambiar(reubicarPanel(tabs, tabEnLienzo, i, colStart, destino))
                    }
                    onRedimensionar={(i, campo, delta) => {
                      const p = tabs[tabEnLienzo]?.panels[i]
                      const b = p === undefined ? undefined : tabla.get(p.tipo as PanelConfig['tipo'])
                      if (b === undefined) return
                      cambiar(
                        redimensionarPanel(
                          tabs,
                          tabEnLienzo,
                          i,
                          campo,
                          delta,
                          campo === 'colSpan' ? b.colSpanMin : b.rowSpanMin,
                          campo === 'colSpan' ? b.colSpanMax : b.rowSpanMax,
                        ),
                      )
                    }}
                    onSoltarTipo={(tipo, colStart, destino) => {
                      const b = tabla.get(tipo as PanelConfig['tipo'])
                      if (b === undefined) return
                      const conNuevo = agregarPanel(tabs, tabEnLienzo, tipo, b.colSpanMin, b.rowSpanMin)
                      const ultimo = (conNuevo[tabEnLienzo]?.panels.length ?? 1) - 1
                      cambiar(reubicarPanel(conNuevo, tabEnLienzo, ultimo, colStart, destino))
                      setAjustesDe(null)
                      setSeleccion({ tab: tabEnLienzo, panel: ultimo })
                      setArrastrando(null)
                    }}
                    arrastrando={arrastrando}
                    dibujar={dibujarPanel}
                    nombreDeGrafico={nombreDeGrafico}
                    encuadre={profundidad ?? ''}
                  />
                </div>
                </div>
              </div>
            )}

          </div>
        )
      ) : pantalla === 'preview' ? (
        <Preview
          roles={roles.data ?? []}
          rolActivo={rolDePreview}
          onRol={setRol}
          query={preview}
          // Se vuelve al EDITOR, que es de donde se vino · 2026-10-07.
          onVolver={() => setPantalla('canvas')}
          hayVersion={version !== null}
          {...(detalle.data === undefined ? {} : { completo: detalle.data })}
          dibujar={(x) => (
            <PanelConDato
              panel={x}
              metrica={metricasPorId.get(x.metricId)}
              payload={preview.data?.datos?.porPanel.get(x.id)}
              sinDato="El servidor no mandó dato para este panel."
              bloques={listaDeBloques}
              repertorio={repertorio}
              format={formatDelCliente}
              now={ahora}
            />
          )}
        />
      ) : pantalla === 'historial' ? (
        /* ── B6 · §PEN:B6 ──────────────────────────────────────────────────
         *
         * **Los tres estados los decide el contenedor**, y eso lo declara el
         * propio `VersionHistory`: el `.pen` no dibuja carga ni error para B6
         * —sus vacíos y su esqueleto son de TABLAS de administración, y B6 es
         * una lista de tarjetas—. El vacío SÍ lo pinta la pantalla, porque
         * «cero publicaciones» es un dato y no una espera.
         */
        version === null ? (
          // Mismo vacío con salida que los dos de B5, y por la misma razón:
          // un texto que manda a otra pantalla sin forma de llegar es «un
          // estado sin salida», que §8 llama una queja.
          <div className="flex flex-col items-start gap-3">
            {/* **Con un dashboard elegido y sin versiones, decirlo** · visto en
                pantalla el 2026-10-07: un dashboard recién creado pedía «elegí
                un dashboard» teniéndolo elegido. */}
            <Ayuda>
              {dashboardDeTrabajo === null
                ? 'Elegí un dashboard en «Dashboards» para ver su historial.'
                : `${listaDeDashboards?.find((d) => d.id === dashboardDeTrabajo)?.nombre ?? 'Este dashboard'} todavía no tiene versiones: el historial empieza con la primera.`}
            </Ayuda>
            <Accion onClick={() => setPantalla('contexto')}>Ir a Dashboards</Accion>
          </div>
        ) : publicaciones.isError ? (
          <SurfaceMessage
            title="No se pudo traer el historial"
            detail={
              publicaciones.error.message === ''
                ? 'Sin detalle del servidor'
                : publicaciones.error.message
            }
            onRetry={() => void publicaciones.refetch()}
          />
        ) : publicaciones.data === undefined || clienteNombre === null ? (
          <Label as="div">Trayendo el historial…</Label>
        ) : (
          <div className="flex flex-col gap-3">
            {/* El fallo de la reversión va ARRIBA de la lista y no dentro de la
                tarjeta: la acción cambia la lista entera, así que su resultado
                no es de una fila. */}
            {errorAlRevertir !== null && <Label as="div">{errorAlRevertir}</Label>}
            {revertir.isPending && <Label as="div">Revirtiendo…</Label>}
            <VersionHistory
              publicaciones={publicaciones.data}
              layouts={versiones.data ?? []}
              dashboardNombre={dashboardNombre}
              clienteNombre={clienteNombre}
              usuarios={usuarios.data ?? []}
              metricas={catalogo.data?.metrics ?? []}
              format={format}
              // **Los dos ids se pasan TAL CUAL.** El `layoutId` es el publicado
              // y el `toLayoutId` el destino, y los dos salen de la fila que se
              // apretó: derivar acá cuál es el publicado sería la segunda
              // derivación de lo mismo, que es cómo una se queda vieja.
              //
              // La guarda de `isPending` evita dos reversiones por dos clics:
              // cada una PUBLICA una versión nueva, así que la segunda no es
              // idempotente.
              onRevertir={(v) => {
                if (revertir.isPending) return
                revertir.mutate(v)
              }}
            />
          </div>
        )
      ) : (
        <ContextView
          dashboards={dashboardsParaElegir}
          cargando={listaDeDashboards === null}
          elegido={dashboardElegido}
          onElegir={(id) => {
            setDashboardElegido(id)
            setVersion(null)
            setSeleccion(null)
            setAjustesDe(null)
          }}
          onCrear={(nombre) =>
            crearDashboard.mutate(
              // **`is_default` sólo para el primero**: un dashboard nuevo no
              // cambia lo que ven los usuarios al entrar · `crearDashboard`.
              { nombre, primero: (listaDeDashboards?.length ?? 0) === 0 },
              {
                onSuccess: (d) => {
                  setDashboardElegido(d.id)
                  setVersion(null)
                },
              },
            )
          }
          creando={crearDashboard.isPending}
          errorAlCrear={
            crearDashboard.error === null
              ? null
              : crearDashboard.error.message === ''
                ? 'No se pudo crear el dashboard.'
                : crearDashboard.error.message
          }
          roles={roles.data ?? []}
          rolActivo={rolActivo}
          onRol={(id) => {
            setRol(id)
            setSeleccion(null)
          }}
          queVaAPasar={queVaAPasar}
          onAbrir={abrirEditor}
          // Con sólo una publicada, abrir copia sus pestañas: hasta que llegan
          // no hay qué copiar.
          abriendo={duplicar.isPending || (versionDeTrabajo?.estado === 'publicado' && semilla === null)}
          errorAlAbrir={
            duplicar.error === null
              ? null
              : duplicar.error.message === ''
                ? 'No se pudo crear el borrador.'
                : duplicar.error.message
          }
        />
      )}
    </BuilderChrome>
  )
}

/** B5 dentro del chrome · el selector de rol más los tres estados del preview.
 *
 *  **El selector de rol vive acá y no en `RolePreview`**: aquel pinta lo que el
 *  servidor devolvió y no decide de quién. §4 separa contenedor de
 *  presentacional, y acá la separación además evita que la vista previa —que
 *  §7.2 pide «sin chrome de edición»— tenga adentro un control de edición. */
function Preview({
  roles,
  rolActivo,
  onRol,
  query,
  onVolver,
  hayVersion,
  completo,
  dibujar,
}: {
  roles: readonly { id: string; nombre: string }[]
  rolActivo: string | null
  onRol: (id: string) => void
  query: ReturnType<typeof usePreview>
  onVolver: () => void
  hayVersion: boolean
  /** El layout SIN lente · de acá salen los huecos, por diferencia contra lo
   *  que el preview devuelve. Ya está cargado para el editor, así que no cuesta
   *  una consulta más. */
  completo?: LayoutDetalle | undefined
  /** Dibujar un panel con su dato · ver `RolePreview`. */
  dibujar: (panel: PanelConfig) => ReactNode
}) {
  // ── LOS DOS VACÍOS DE B5 LLEVAN SALIDA · 2026-09-25 ────────────────────────
  //
  // **B5 no tiene chrome, y eso es del dibujo**: `sinChrome(forma)` en
  // `BuilderChrome` — el `.pen` dibuja «Vista previa · rol Planner sin componer»
  // sin cabecera. Lo que NO es del dibujo es que estos dos vacíos mandaran a
  // «Contexto de edición» sin ninguna forma de llegar: medido el 2026-09-25,
  // nueve botones antes de entrar y **cero** después. El texto pedía ir a un
  // lugar inalcanzable sin escribir la URL.
  //
  // «Un estado sin salida es una queja» · §8, y es la misma frase que
  // `StateBody` lleva escrita. El manejador ya venía pasado —`onVolver`— y sólo
  // lo usaba la rama con datos, así que el CTA no promete nada que no exista:
  // es la regla del CTA muerto cumplida, no esquivada.
  if (!hayVersion) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Ayuda>Elegí un dashboard en «Dashboards» para previsualizarlo.</Ayuda>
        <Accion onClick={onVolver}>Volver</Accion>
      </div>
    )
  }
  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Ayuda>Este cliente todavía no tiene roles. Se definen en su ficha, en administración.</Ayuda>
        <Accion onClick={onVolver}>Volver</Accion>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Label id="preview-rol">Rol</Label>
        <select
          aria-labelledby="preview-rol"
          className="bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
          value={rolActivo ?? ''}
          onChange={(e) => onRol(e.target.value)}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      {query.isError ? (
        <div className="flex flex-col gap-2">
          <Label as="div">No se pudo resolver el preview</Label>
          <Label as="div">
            {query.error instanceof ApiError && query.error.httpStatus === 404
              ? // La ruta de vista previa por rol está escrita en nuestro fork y el servicio
      // desplegado no la sirve · B4.9.
      'La vista previa por rol todavía no se puede consultar'
              : (query.error.message === '' ? 'Sin detalle del servidor' : query.error.message)}
          </Label>
        </div>
      ) : query.data === undefined ? (
        <Label as="div">Resolviendo el preview…</Label>
      ) : (
        <RolePreview
          preview={query.data}
          {...(completo === undefined ? {} : { completo })}
          onVolver={onVolver}
          dibujar={dibujar}
        />
      )}
    </div>
  )
}
