/** Los datos de servidor, fuera del árbol de render · F1.2.
 *
 *  TanStack Query es el dueño de la cache, no `useState`. Un `useState` con algo
 *  que vino del servidor es una segunda fuente de verdad que se desincroniza en
 *  silencio — anti-patrón declarado en §4 de `nuevo-desarrollo.md`.
 *
 *  Las claves se declaran acá y no en cada llamada para que invalidar sea
 *  posible desde afuera sin repetir el arreglo.
 */
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { esDePanel } from './chat'
import type { ContextoDeChat } from './chat'
import { adminApi } from './admin'
import type { Corrida, RolParaGuardar, TabParaGuardar } from './admin'
import type { Theme } from '../tokens/theme'
import type { Payload } from './types'

export const keys = {
  me: ['config', 'me'] as const,
  catalog: ['config', 'catalog'] as const,
  blocks: ['config', 'blocks'] as const,
  plots: ['config', 'plots'] as const,
  tab: (tabId: string, layoutId?: string) => ['config', 'tab', tabId, layoutId ?? null] as const,
  panels: (tabId: string, period: string) => ['panels', tabId, period] as const,
  // **La clave lleva de QUÉ es el contexto, no sólo su id** · F3.15. Un panel y
  // una pestaña pueden compartir uuid en principio, y sin el prefijo el riel de
  // una hoja se serviría del cache de la otra — el mismo defecto que el preview
  // por rol tuvo y que su prueba persigue.
  threads: (contexto?: ContextoDeChat, periodo?: string) =>
    [
      'chat',
      'hilos',
      contexto === undefined ? null : esDePanel(contexto) ? `panel:${contexto.panelId}` : `tab:${contexto.tabId}`,
      periodo ?? null,
    ] as const,
  agentesDeChat: ['chat', 'agentes'] as const,
  sugerencias: (panelId: string, periodo: string) =>
    ['chat', 'sugerencias', panelId, periodo] as const,

  /* ── El drill-down · B5.4 · F3.9 · §PEN:C2 ───────────────────────────────
   *
   * **Las dimensiones NO llevan período en la clave**, y no es un olvido: la
   * ruta no lo toma. Qué dimensiones existen es de la métrica, así que meterlo
   * en la clave multiplicaría por doce una lectura que no cambia.
   *
   * **La desagregación sí lleva las tres**, porque las tres cambian la
   * respuesta. Sin `dimension` en la clave, apretar el chip de semana serviría
   * del cache de día hasta que la red conteste — el mismo defecto que el riel
   * de hilos tuvo con el panel. */
  drillDimensions: (panelId: string) => ['drill', 'dimensiones', panelId] as const,
  drill: (panelId: string, dimension: string, periodo: string) =>
    ['drill', panelId, dimension, periodo] as const,

  /* ── Builder · F4.23 ─────────────────────────────────────────────────────
   *
   * **Viven acá y no en un archivo aparte a propósito.** Publicar un layout
   * tiene que invalidar la caché de la CONSOLA —`me` y `tab`—, y para eso las
   * dos familias de claves tienen que estar al alcance. Separarlas obligaría a
   * importar las de la consola desde el builder, que es la dependencia al revés.
   */
  tenants: ['admin', 'tenants'] as const,
  layouts: (tenantId: string) => ['admin', 'layouts', tenantId] as const,
  dashboards: (tenantId: string) => ['admin', 'dashboards', tenantId] as const,
  adminCatalog: (tenantId: string) => ['admin', 'catalog', tenantId] as const,
  roles: (tenantId: string) => ['admin', 'roles', tenantId] as const,
  agentes: (tenantId: string) => ['admin', 'agentes', tenantId] as const,
  fuentes: (tenantId: string) => ['admin', 'fuentes', tenantId] as const,
  corridas: (tenantId: string) => ['admin', 'corridas', tenantId] as const,
  usuarios: (tenantId: string) => ['admin', 'usuarios', tenantId] as const,
  // **Sin tenant en la clave, a propósito**: es de plataforma. Compartir la clave
  // con la de arriba serviría el listado de un cliente donde va el de todos, que
  // es la clase de mentira que costó el defecto del cache del preview por rol.
  usuariosDePlataforma: () => ['admin', 'usuarios', 'plataforma'] as const,
  preview: (layoutId: string, rolId: string) => ['admin', 'preview', layoutId, rolId] as const,
  layout: (layoutId: string) => ['admin', 'layout', layoutId] as const,
  /** **Por DASHBOARD y no por layout** · §PEN:B6. El historial es del dashboard:
   *  la ruta por layout devuelve una fila sola. Ver `adminApi.publicaciones`. */
  publicaciones: (dashboardId: string) => ['admin', 'publicaciones', dashboardId] as const,
}

/** Contexto al montar la app. Una sola vez: no cambia con el período. */
export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: api.me })
}

export function useCatalog() {
  return useQuery({ queryKey: keys.catalog, queryFn: api.catalog })
}

export function useBlocks() {
  return useQuery({ queryKey: keys.blocks, queryFn: api.blocks })
}

/** El repertorio de gráficos · F1.31.
 *
 *  **Misma vida de caché que los bloques**: es una tabla global que cambia
 *  cuando cambia el diseño, no cuando cambia el dato. Pedirla por período o por
 *  pestaña sería re-pedir 49 filas que no se mueven. */
export function usePlots() {
  return useQuery({ queryKey: keys.plots, queryFn: api.plots })
}

/** El layout de la pestaña. **No lleva el período en la clave** — es la mitad de
 *  la garantía de §7: cambiar de período no re-pide el layout. */
export function useTab(tabId: string | null, layoutId?: string) {
  return useQuery({
    queryKey: keys.tab(tabId ?? '', layoutId),
    queryFn: () => api.tab(tabId as string, layoutId),
    enabled: tabId !== null && tabId !== '',
  })
}

/** Los payloads. La clave se ancla al `tabId` y no a la lista de panelIds: dos
 *  renders de la misma pestaña producen arreglos distintos con el mismo
 *  contenido, y eso rompía la cache sin que se notara. */
export function usePanelsBatch(tabId: string | null, panelIds: string[], period: string) {
  return useQuery({
    queryKey: keys.panels(tabId ?? '', period),
    queryFn: () => api.panelsBatch(panelIds, period),
    enabled: tabId !== null && panelIds.length > 0 && period !== '',
  })
}

/** El riel de hilos · F3.7. Solo los del usuario del token, y el orden lo
 *  decide el backend: llegan por `actualizadoEn`, del más reciente al más
 *  viejo. El front los agrupa por tiempo pero no los reordena.
 *
 *  **El panel y el período van en la CLAVE y no solo en la petición.** Sin
 *  ellos ahí, abrir el chat de otro panel devolvería la lista cacheada del
 *  primero hasta que la red conteste — un riel que muestra las conversaciones
 *  del panel de al lado y se corrige solo un segundo después.
 *
 *  **Y el filtro lo aplica el SERVICIO.** Pedir todos y filtrar acá traería los
 *  hilos de los otros once paneles por la red para tirarlos. */
/** Qué preguntar sobre un panel · §PEN:C3.
 *
 *  **Son deterministas del lado del servicio**, así que no hay razón para
 *  refrescarlas mientras la hoja está abierta: cambian con el estado del panel,
 *  no con el tiempo. */
export function useSuggestions(panelId: string | null, periodo: string) {
  return useQuery({
    queryKey: keys.sugerencias(panelId ?? '', periodo),
    queryFn: () => api.suggestions(panelId as string, periodo),
    // **`null` es «esta hoja es de pestaña»** · F3.15. La ruta es
    // `/config/panels/{panelId}/chat-suggestions`: cuelga de un panel y no
    // existe para una pestaña. No se pide con un id vacío —eso sería un 404
    // por render— y la hoja muestra el campo sin abridores.
    enabled: panelId !== null,
  })
}

/* ── EL DRILL-DOWN · B5.4 · F3.9 · §PEN:C2 ─────────────────────────────────── */

/** Por qué dimensiones se puede desagregar este panel.
 *
 *  **`null` es «no hay panel abierto»** · mismo idioma que `useSuggestions`: la
 *  ruta cuelga de un panel, así que no se pide con un id vacío — eso sería un
 *  404 por render.
 *
 *  **No se refresca mientras la hoja está abierta.** Qué dimensiones existe lo
 *  decide un mapa en memoria del servicio: cambia cuando alguien agrega una fila
 *  a ese mapa, no con el tiempo ni con el período. */
export function useDrillDimensions(panelId: string | null) {
  return useQuery({
    queryKey: keys.drillDimensions(panelId ?? ''),
    queryFn: () => api.drillDimensions(panelId as string),
    enabled: panelId !== null,
  })
}

/** Qué paneles de la pestaña soportan drill-down · **una lectura por panel**.
 *
 *  ── POR QUÉ N LECTURAS, Y ESTÁ DECLARADO COMO RUIDO ────────────────────────
 *
 *  «Un CTA sin manejador no se pinta» exige saber `soportado` **antes** de
 *  dibujar el pie del panel, y `soportado` es por panel: quince paneles, quince
 *  lecturas. No hay ruta batch, y se midió que son baratas —el servicio resuelve
 *  el rol, autoriza y consulta un mapa en memoria: sin Snowflake, sin JWT, sin
 *  agente—. TanStack las dedupe y las cachea, así que cambiar de período no las
 *  vuelve a pedir.
 *
 *  **La alternativa es peor**: pintar el CTA siempre y que la hoja diga «este
 *  corte no está disponible» es el botón que se aprieta y no lleva a ningún
 *  lado, con un paso más.
 *
 *  **El arreglo verdadero está a medio construir del otro lado**: el catálogo ya
 *  declara `dimensiones` por métrica en el cable y en nuestro contrato, y llega
 *  vacía en las 21 — medido el 2026-09-30. Con ese campo lleno, estas lecturas
 *  desaparecen y el CTA se decide con cero peticiones extra. Está pedido.
 *
 *  **Devuelve el conjunto de los que soportan, no un arreglo de resultados**:
 *  es lo único que la decisión del CTA necesita, y un panel cuya lectura todavía
 *  no volvió —o falló— queda afuera, que es el lado seguro: antes de saber, no
 *  se promete la acción.
 */
export function useDrillSupport(panelIds: readonly string[]): ReadonlySet<string> {
  const results = useQueries({
    queries: panelIds.map((id) => ({
      queryKey: keys.drillDimensions(id),
      queryFn: () => api.drillDimensions(id),
    })),
  })
  const soportan = new Set<string>()
  for (const r of results) {
    if (r.data?.soportado === true) soportan.add(r.data.panelId)
  }
  return soportan
}

/** La desagregación · **un POST, y es una LECTURA**.
 *
 *  `useQuery` y no `useMutation`: no escribe nada —el servicio no persiste hilo
 *  ni materialización— y el resultado se cachea por panel, dimensión y período,
 *  que es lo que hace que volver a un chip ya visto sea instantáneo. Que el
 *  método sea POST es del transporte: el cuerpo lleva la dimensión y el período.
 *
 *  **`retry: false`, y es una decisión de pantalla.** La ruta comparte la cuota
 *  del chat —100 pedidos por usuario por minuto— así que un reintento automático
 *  sobre un 429 gasta la cuota que acabó de agotarse. El estado dice qué pasó y
 *  quien mira decide. */
export function useDrill(panelId: string | null, dimension: string | null, periodo: string) {
  return useQuery({
    queryKey: keys.drill(panelId ?? '', dimension ?? '', periodo),
    queryFn: () => api.drill(panelId as string, dimension as string, periodo),
    enabled: panelId !== null && dimension !== null && periodo !== '',
    retry: false,
  })
}

export function useThreads(contexto?: ContextoDeChat, periodo?: string) {
  return useQuery({
    queryKey: keys.threads(contexto, periodo),
    queryFn: () => api.threads(contexto, periodo),
  })
}

/** Los agentes del selector del chat · sólo para admin.
 *
 *  **`enabled` es la mitad de «ocultar no es permitir»**: sin él un planner
 *  pediría la ruta, recibiría 403 y el error quedaría en la caché. El servidor
 *  ya dice que no; el front no pregunta lo que sabe que le van a negar. */
export function useChatAgents(enabled: boolean) {
  return useQuery({
    queryKey: keys.agentesDeChat,
    queryFn: api.chatAgents,
    enabled,
    staleTime: 5 * 60_000,
  })
}

/** Reintento de UN panel · F2.4.
 *
 *  **Re-pide ese panel y funde el resultado en la caché del batch.** No es una
 *  optimización: `refetch()` del batch vuelve a pedir los N paneles, y N−1
 *  habían cargado bien. El usuario que aprieta «Reintentar» en el panel que
 *  falló termina pagando con el parpadeo de todos los demás — que es
 *  exactamente lo que F2.4 prohíbe: «el reintento re-pide ESE panel, no el
 *  batch entero».
 *
 *  El endpoint es el mismo `panels:batch` con una lista de uno. No hace falta
 *  una ruta nueva: el contrato ya declara fallo parcial, así que pedir un panel
 *  es pedir un batch chico.
 *
 *  `setQueryData` y no `invalidateQueries`, y la diferencia importa: invalidar
 *  dispararía de nuevo la consulta original —los N paneles— y sería el mismo
 *  defecto por otro camino. */
export function useRetryPanel(tabId: string | null, period: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (panelId: string) => api.panelsBatch([panelId], period),
    onSuccess: (fresco) => {
      client.setQueryData(
        keys.panels(tabId ?? '', period),
        (previo: Record<string, Payload> | undefined) => ({ ...previo, ...fresco }),
      )
    },
  })
}

/** Persistir el tema · F1.12. El switcher visual no pasa por acá: lo hace
 *  `tokens/theme.ts` escribiendo un atributo. Esto solo lo guarda contra el
 *  perfil, que es lo que §2.4 exige. */
export function useSaveTheme() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (theme: Theme) => api.savePreferences(theme),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.me }),
  })
}

/** Cambiar de dashboard · F5.1.
 *
 *  **Invalida `me` y nada más**, y es suficiente: `/config/me` vuelve con otras
 *  `tabs`, otro `active_layout_id` y otro `active_dashboard_id`, y todo lo
 *  demás cuelga de eso. Invalidar las pestañas o los paneles a mano sería
 *  adivinar cuáles, y el servidor ya lo sabe. */
export function useSelectDashboard() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ theme, dashboardId }: { theme: Theme; dashboardId: string | null }) =>
      api.savePreferredDashboard(theme, dashboardId),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.me }),
  })
}


/* ══ Builder · F4.23 ═════════════════════════════════════════════════════════
 *
 * **El servidor decide.** Lo que estos hooks hacen es traer y mandar; la
 * validación del front —`catalog/blocks.ts`— es feedback inmediato para no
 * dejar componer algo imposible, pero **nunca se publica algo que el front dio
 * por bueno y el servidor no vio**. Por eso `useValidateLayout` existe y llama
 * al endpoint en vez de decidir acá.
 */

export function useTenants() {
  return useQuery({ queryKey: keys.tenants, queryFn: adminApi.tenants })
}

export function useAdminCatalog(tenantId: string | null) {
  return useQuery({
    queryKey: keys.adminCatalog(tenantId ?? ''),
    queryFn: () => adminApi.catalogo(tenantId as string),
    enabled: tenantId !== null && tenantId !== '',
  })
}

/* ── B4.8 y B4.9 · del FORK ─────────────────────────────────────────────────
 *
 * **El servicio desplegado devuelve 404 en estas rutas.** Los hooks existen para
 * que F4.3 y F4.12 se construyan contra MSW, que es como se construyó la consola
 * entera antes de que existiera el servicio. El día que el fork se despliegue —o
 * que el código vuelva a su rama— dejan de dar 404 y no cambia una línea de acá.
 */

/** **Todos los usuarios de la plataforma** · A3 · F4.3 · B4.17.
 *
 *  Sin parámetro y sin `enabled`: la pregunta de A3 no es de un cliente. Es lo
 *  que el dibujo declara —`ALCANCE · PLATAFORMA`— y lo que la ruta no daba hasta
 *  `6e521cc`. */
export function useAllUsers() {
  return useQuery({
    queryKey: keys.usuariosDePlataforma(),
    queryFn: () => adminApi.usuariosDePlataforma(),
  })
}

/** Los usuarios de UN cliente · sirve a A2, donde el cliente ya está elegido. */
export function useUsers(tenantId: string | null) {
  return useQuery({
    queryKey: keys.usuarios(tenantId ?? ''),
    queryFn: () => adminApi.usuarios(tenantId as string),
    enabled: tenantId !== null && tenantId !== '',
  })
}

/** Las fuentes del cliente y su salud · A5 · F4.24.
 *
 *  **El estado no viene en la respuesta y no se pide**: se deriva de la
 *  frescura, la cadencia y la tolerancia · `surfaces/admin/saludDeFuente.ts`. */
export function useFeeds(tenantId: string | null) {
  return useQuery({
    queryKey: keys.fuentes(tenantId ?? ''),
    queryFn: () => adminApi.fuentes(tenantId as string),
    enabled: tenantId !== null && tenantId !== '',
  })
}

/** El historial de materializaciones del cliente · 2026-10-01.
 *
 *  **Quieta, salvo que haya algo que esperar** · 2026-10-07. Hasta hoy no
 *  sondeaba: una corrida casi siempre está quieta y mirarla cada N segundos era
 *  gastar una petición para nada. Desde que A5 puede pedir meses eso cambió de
 *  forma, no de regla: **la ruta de carga contesta 202 y la fila aparece
 *  segundos después** —medido, ~5 s—, así que invalidar una vez al terminar la
 *  mutación mira la lista ANTES de que la fila exista.
 *
 *  Por eso si hay que esperar lo decide quien pidió —`hayQueEsperar`, con su tope de
 *  diez minutos— y el reloj corre sólo mientras sea cierto. */
export function useRuns(tenantId: string | null, esperar?: (corridas: readonly Corrida[]) => boolean) {
  return useQuery({
    queryKey: keys.corridas(tenantId ?? ''),
    queryFn: () => adminApi.corridas(tenantId as string),
    enabled: tenantId !== null && tenantId !== '',
    refetchInterval: (q) => (esperar?.(q.state.data ?? []) === true ? 3000 : false),
    // **También con la pestaña en segundo plano** · 2026-10-07. TanStack sólo
    // dispara el intervalo con la ventana enfocada, y cargar ocho meses es
    // justo lo que uno pide y se va a otra pestaña: el historial quedaba
    // congelado diciendo «Cargando». Lo encontró probarlo contra el servicio
    // con el navegador sin foco; la prueba en jsdom no podía verlo, ahí la
    // ventana siempre lo tiene. El costo está acotado: sólo mientras se espera,
    // y con tope.
    refetchIntervalInBackground: true,
  })
}

/** Pedir que se calculen meses de un cliente · 2026-10-07.
 *
 *  Invalida el historial al arrancar, para que la primera vuelta del sondeo no
 *  espere tres segundos. Lo que sigue lo hace `useRuns` con `esperando`. */
export function useLoadPeriods(tenantId: string | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (periodos: readonly string[]) => adminApi.cargarPeriodos(tenantId as string, periodos),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.corridas(tenantId ?? '') }),
  })
}

/** Los agentes del cliente · F4.4. */
export function useAgents(tenantId: string | null) {
  return useQuery({
    queryKey: keys.agentes(tenantId ?? ''),
    queryFn: () => adminApi.agentes(tenantId as string),
    enabled: tenantId !== null && tenantId !== '',
  })
}

export function useRoles(tenantId: string | null) {
  return useQuery({
    queryKey: keys.roles(tenantId ?? ''),
    queryFn: () => adminApi.roles(tenantId as string),
    enabled: tenantId !== null && tenantId !== '',
  })
}

/** Las tres mutaciones invalidan la MISMA clave, y con eso alcanza: el listado
 *  trae `usuarios` por rol, que es lo que decide si se puede borrar. Un `setQueryData`
 *  con la respuesta de un `PUT` dejaría ese contador sin recalcular. */
export function useSaveRole(tenantId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id?: string; rol: RolParaGuardar }) =>
      v.id === undefined
        ? adminApi.crearRol(tenantId as string, v.rol)
        : adminApi.editarRol(v.id, v.rol),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.roles(tenantId ?? '') }),
  })
}

export function useDeleteRole(tenantId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rolId: string) => adminApi.borrarRol(rolId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.roles(tenantId ?? '') }),
  })
}

/** **No cachea entre roles por accidente**: la clave lleva los dos ids. Un
 *  preview servido desde el cache de otro rol es exactamente la mentira que
 *  B4.9 existe para no cometer. */
/** `conDatos` trae el dato de cada panel · `include=payloads`. Va en la clave:
 *  la respuesta con y sin datos son dos cosas distintas en el cache. */
export function usePreview(layoutId: string | null, rolId: string | null, conDatos = false) {
  return useQuery({
    queryKey: [...keys.preview(layoutId ?? '', rolId ?? ''), conDatos ? 'con-datos' : 'sin-datos'],
    queryFn: () => adminApi.previewPorRol(layoutId as string, rolId as string, conDatos),
    // **El lienzo y la vista previa piden lo mismo** con el mismo lente: sin
    // vigencia, pasar de uno a otro lo volvía a pedir. Lo que lo hace viejo
    // es guardar, y `useSaveLayout` lo invalida.
    staleTime: 60_000,
    enabled: layoutId !== null && layoutId !== '' && rolId !== null && rolId !== '',
  })
}

/** Los dashboards del cliente · el primer nivel del builder desde el 2026-10-07. */
export function useDashboards(tenantId: string | null) {
  return useQuery({
    queryKey: keys.dashboards(tenantId ?? ''),
    queryFn: () => adminApi.dashboards(tenantId as string),
    enabled: tenantId !== null && tenantId !== '',
  })
}

export function useCreateDashboard(tenantId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { nombre: string; primero: boolean }) =>
      adminApi.crearDashboard(tenantId as string, v.nombre, v.primero),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.dashboards(tenantId ?? '') }),
  })
}

export function useLayouts(tenantId: string | null) {
  return useQuery({
    queryKey: keys.layouts(tenantId ?? ''),
    queryFn: () => adminApi.layouts(tenantId as string),
    enabled: tenantId !== null && tenantId !== '',
  })
}

export function useLayoutDetail(layoutId: string | null) {
  return useQuery({
    queryKey: keys.layout(layoutId ?? ''),
    queryFn: () => adminApi.layout(layoutId as string),
    enabled: layoutId !== null && layoutId !== '',
  })
}

export function useCreateDraft(tenantId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    /** Lleva las pestañas que se están viendo · el `POST` solo crea un borrador
     *  VACÍO, y el botón promete duplicar. Ver `crearBorrador`. */
    mutationFn: (v: { versionId?: string; tabs?: readonly TabParaGuardar[]; dashboardId?: string }) =>
      adminApi.crearBorrador(tenantId as string, v.versionId, v.tabs, v.dashboardId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.layouts(tenantId ?? '') }),
  })
}

/** Guardar **reemplaza el layout entero**: el servicio no acepta parches.
 *
 *  `setQueryData` con lo que devuelve el PUT y no `invalidateQueries`: la
 *  respuesta YA es el layout guardado, así que volver a pedirlo sería un viaje
 *  para traer lo que ya está en la mano. */
export function useSaveLayout(layoutId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tabs: readonly TabParaGuardar[]) => adminApi.guardar(layoutId as string, tabs),
    onSuccess: (detalle) => {
      qc.setQueryData(keys.layout(layoutId ?? ''), detalle)
      // **El preview de esta versión quedó viejo** · 2026-10-07. Desde que el
      // lienzo dibuja con su dato, un panel nuevo o una métrica cambiada se ve
      // recién cuando el preview se vuelve a leer —«se dibuja al guardar»—.
      void qc.invalidateQueries({ queryKey: ['admin', 'preview', layoutId ?? ''] })
    },
  })
}

/** **No cachea, y es a propósito.** Validar es una pregunta sobre el estado de
 *  ESTE momento; una respuesta guardada diría «válido» sobre una composición que
 *  ya cambió. Por eso es mutación y no consulta. */
export function useValidateLayout(layoutId: string | null) {
  return useMutation({ mutationFn: () => adminApi.validar(layoutId as string) })
}

/** Publicar toca DOS cachés, y olvidar la segunda es el defecto silencioso.
 *
 *  **Publicar demota el layout publicado anterior del tenant a borrador**, así
 *  que cambia la lista de layouts —lo evidente— y también **lo que la consola
 *  está mostrando**: sus pestañas y su contexto salen del layout publicado. Sin
 *  invalidar `me` y `tab`, quien acaba de publicar sigue viendo el layout viejo
 *  en la consola y cree que no funcionó. */
export function usePublishLayout(layoutId: string | null, tenantId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (versionId?: string) => adminApi.publicar(layoutId as string, versionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.layouts(tenantId ?? '') })
      void qc.invalidateQueries({ queryKey: keys.layout(layoutId ?? '') })
      // La consola. `me` trae las pestañas del layout publicado y `tab` su
      // composición: publicar las cambia a las dos.
      void qc.invalidateQueries({ queryKey: keys.me })
      void qc.invalidateQueries({ queryKey: ['config', 'tab'] })
    },
  })
}

/* ── B6 · el historial y la reversión · §PEN:B6 ─────────────────────────────*/

/** El historial de publicaciones · **por dashboard**.
 *
 *  **No lleva el tenant en la clave** y no hace falta: el `dashboardId` es un
 *  uuid, así que dos clientes no comparten uno. Ponerlo al lado sería una
 *  segunda fuente para lo mismo. */
export function usePublications(dashboardId: string | null) {
  return useQuery({
    queryKey: keys.publicaciones(dashboardId ?? ''),
    queryFn: () => adminApi.publicaciones(dashboardId as string),
    enabled: dashboardId !== null && dashboardId !== '',
  })
}

/** Revertir · **publica una versión nueva**, así que invalida lo mismo que
 *  publicar MÁS el historial.
 *
 *  Son las cuatro de `usePublishLayout` —`layouts`, `layout`, `me` y las
 *  pestañas de la consola— y la quinta, `publicaciones`. **Olvidar la quinta es
 *  el defecto silencioso de esta pantalla**: el historial se quedaría mostrando
 *  el estado viejo justo después de la acción que lo cambió, y la fila nueva
 *  —la del `rollback`— no aparecería. Quien apretó el botón concluiría que no
 *  funcionó.
 *
 *  **El `layoutId` es el PUBLICADO y el `toLayoutId` el destino** · ver
 *  `adminApi.revertir`: el path acota, el cuerpo elige.
 *
 *  ── LOS DOS IDS VIAJAN EN LA MUTACIÓN, NO EN EL HOOK · cableado 2026-09-30 ──
 *
 *  `layoutId` era parámetro del hook, y con eso el contenedor tenía que derivar
 *  **por segunda vez** cuál es el layout publicado del dashboard: una vez para
 *  pintar el badge `EN PRODUCCIÓN` —eso vive en `VersionHistory`, que es la que
 *  tiene las filas— y otra para armar la URL. Dos derivaciones de la misma cosa
 *  en dos archivos es la forma en que una se queda vieja.
 *
 *  `VersionHistory.onRevertir` ya entrega los dos ids juntos, sacados de la
 *  misma fila que pinta. Tomándolos acá el contenedor los pasa tal cual y no
 *  queda un campo del callback **ignorado**, que es la otra mitad del defecto:
 *  un payload que se descarta se lee como si se usara. */
export function useRevertLayout(tenantId: string | null, dashboardId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { layoutId: string; toLayoutId: string }) =>
      adminApi.revertir(v.layoutId, v.toLayoutId),
    // **`variables` y no una captura**: el layout del path es el de ESTA
    // reversión, así que la clave que se invalida sale de la misma variable que
    // armó la URL.
    onSuccess: (_version, v) => {
      void qc.invalidateQueries({ queryKey: keys.layouts(tenantId ?? '') })
      void qc.invalidateQueries({ queryKey: keys.layout(v.layoutId) })
      void qc.invalidateQueries({ queryKey: keys.publicaciones(dashboardId ?? '') })
      void qc.invalidateQueries({ queryKey: keys.me })
      void qc.invalidateQueries({ queryKey: ['config', 'tab'] })
    },
  })
}
