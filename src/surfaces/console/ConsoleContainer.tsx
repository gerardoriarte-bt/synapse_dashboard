/** Los datos de la consola, fuera del componente que pinta · F1.6
 *
 *  §4 separa contenedor de presentacional, y no por gusto: `Console` sin hooks
 *  se puede montar con datos fijos en el builder y en la vista previa por rol
 *  sin tocar la red. Acá viven `useQuery`, el estado de UI y la decisión de qué
 *  se muestra mientras el contexto vuela — que es F1.26: **ningún componente de
 *  `render/` lee `isLoading` ni `isError`**.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  useBlocks,
  useDrillSupport,
  usePlots,
  useCatalog,
  useMe,
  usePanelsBatch,
  useRetryPanel,
  useSaveTheme,
  useSelectDashboard,
  useTab,
} from '../../api/hooks'
import { adaptPanelParams } from '../../api/params'
import { hasValue } from '../../render/state'
import { blockTable } from '../../catalog/blocks'
import { invalidPlotReason, plotTable } from '../../catalog/plots'
import type { PlotProblem } from '../../catalog/plots'
import { applyTheme } from '../../tokens/theme'
import { preloadBodies } from '../../render/bodies/registry'
import { createFormat, LOCALE_POR_DEFECTO } from '../../render/format'
import { currentTheme } from '../../tokens/theme'
import { markTabConfig } from '../../render/budget'
import { Console } from './Console'
import { ChatSheet } from './ChatSheet'
import { DrillSheet } from './DrillSheet'
import { SurfaceMessage } from './SurfaceMessage'
import type { Metric, PanelType, Payload } from '../../api/types'

/** **El locale del tenant, y ya no un supuesto** · F1.13b, cerrado el 2026-09-26.
 *
 *  Acá había una constante `createFormat('es-MX')` con su supuesto declarado:
 *  «el contrato todavía no lo declara». Lo declara desde hoy y `/config/me` lo
 *  trae, así que el formateador se construye con el locale del tenant.
 *
 *  **Se cambió una línea, que es lo que el comentario viejo prometía.** El
 *  formateador ya bajaba por props hasta el último plot desde F1.13b, así que
 *  todo el trabajo de inyección estaba hecho y esto sólo cambia de dónde sale
 *  el argumento.
 *
 *  **El default vive en `render/format.ts`**, con el resto del formateo: lo
 *  usan la consola y admin, y ponerlo en una de las dos obligaba a la otra a
 *  importarla. */

export function ConsoleContainer() {
  const [tabId, setTabId] = useState<string | null>(null)
  const [periodId, setPeriodId] = useState<string | null>(null)
  /** Desde qué panel se preguntó · F3.3. **Un solo estado**, que es lo que hace
   *  estructuralmente imposible tener dos hojas abiertas — la red del contador
   *  de `ChatOverlay` es para quien monte una desde otro lado. */
  const [askingPanelId, setAskingPanelId] = useState<string | null>(null)
  /** **Un booleano y no un id**: el chat de pestaña es siempre el de la pestaña
   *  activa, y guardar su id abriría la puerta a preguntarle a una que ya no se
   *  está mirando. Cambiar de pestaña con la hoja abierta la cierra. */
  const [askingTab, setAskingTab] = useState(false)
  /** Desde qué panel se abrió el detalle · F3.9 · §PEN:C2.
   *
   *  **Un estado propio, y excluyente con el del chat.** No se apilan: el pie de
   *  la hoja de detalle ofrece «preguntar sobre esta cifra», que es exactamente el
   *  caso que dejaría dos hojas abiertas, y con dos el Escape cierra una sola y el
   *  usuario no sabe cuál. La exclusión se escribe en los dos manejadores, abajo. */
  const [drillingPanelId, setDrillingPanelId] = useState<string | null>(null)

  const context = useMe()
  const catalog = useCatalog()
  // La tabla de bloques trae `paramsDisponibles`: es la mitad del esquema de
  // params que sí declara el contrato · F1.29.
  const blocks = useBlocks()
  // **Arriba con los demás hooks, y no abajo donde se usa.** Puesto junto a su
  // lógica quedaba DESPUÉS de los retornos tempranos del contenedor —el estado
  // de carga, el dashboard sin componer— así que en unos renders se llamaba y en
  // otros no: React lo marcó como cambio en el orden de los hooks y el
  // contenedor entero dejó de montar. No lo vio el compilador; lo vio la primera
  // prueba que lo ejercitó.
  const plots = usePlots()
  const saveTheme = useSaveTheme()
  const selectDashboard = useSelectDashboard()

  /** **El formateador sale del locale del TENANT** · F1.13b.
   *
   *  `useMemo` y no una constante: el locale llega con `/config/me`, así que en
   *  el primer render no está. Y no se recrea en cada render porque `format`
   *  baja por props hasta el último plot — un objeto nuevo por render haría que
   *  cada memo de abajo se invalidara solo.
   *
   *  **Una cifra formateada con el locale de quien mira cambia según quién abre
   *  la consola**, y eso no es auditable. Por eso sale del tenant y no de
   *  `navigator.language`. */
  const format = useMemo(
    () => createFormat(context.data?.tenant.locale || LOCALE_POR_DEFECTO),
    [context.data?.tenant.locale],
  )

  // La pestaña y el período por defecto salen del backend, no de una constante.
  // Sin esto volvíamos a los `ua_mx` / `ceo` quemados que v2 arrastraba.
  const tabs = context.data?.tabs ?? []
  const activeTab = tabs.find((t) => t.id === tabId) ?? tabs[0]
  const periods = context.data?.periodos ?? []
  const activePeriod = periods.find((p) => p.id === periodId) ?? periods[0]

  // ── EL LAYOUT ACTIVO SE PASA, Y SIN ESO EL MULTI-DASHBOARD NO ANDA ────────
  //
  // **Medido el 2026-09-29 contra `de881e1`**: publicando una pestaña en el
  // dashboard «Marca» y cambiando a él, `/config/me` devolvía la pestaña, la
  // consola pintaba su encabezado, y `GET /config/tabs/{ese mismo id}` contestaba
  // **404 «pestaña no encontrada»**. Pantalla con título y cero paneles.
  //
  // **No era del backend.** Su handler acepta `?layoutId=` y `?dashboardId=`, y
  // sin ninguno de los dos resuelve contra el layout del dashboard POR DEFECTO —
  // así que una pestaña que vive en otro dashboard no existe para esa consulta.
  // Acá se llamaba sin el parámetro desde siempre.
  //
  // **Andaba de casualidad**: mientras hubo un solo dashboard, el activo y el
  // de por defecto eran el mismo y la caída acertaba. Es el modo de falla que
  // este repositorio persigue — correcto por coincidencia, y el día que deja de
  // serlo no falla el código que está mal.
  //
  // `?? undefined` y no `?? ''`: el cliente omite el parámetro cuando es
  // `undefined`, y una cadena vacía viajaría como `?layoutId=` y daría 400.
  const layout = useTab(activeTab?.id ?? null, context.data?.layoutActivoId ?? undefined)
  const panels = layout.data?.panels ?? []

  const batch = usePanelsBatch(
    activeTab?.id ?? null,
    panels.map((p) => p.id),
    activePeriod?.id ?? '',
  )
  const retryPanel = useRetryPanel(activeTab?.id ?? null, activePeriod?.id ?? '')

  /** De qué paneles se puede abrir el detalle · F3.9.
   *
   *  **Una lectura por panel, y está declarada como ruido.** No hay ruta batch, y
   *  «un CTA sin manejador no se pinta» exige saberlo ANTES de dibujar el pie del
   *  panel. Son lecturas baratas —el servicio resuelve el rol, autoriza y consulta
   *  un mapa en memoria— y la caché las dedupe, pero el arreglo verdadero es que
   *  el catálogo llene el campo que ya declara: hoy llega vacío en las 21
   *  métricas. Ver `useDrillSupport`.
   *
   *  **Va arriba, con los demás hooks**, y no abajo donde se usa: puesto junto a
   *  su lógica quedaría después de los retornos tempranos del contenedor, así que
   *  en unos renders se llamaría y en otros no. Ya pasó con `usePlots`. */
  const panelIds = panels.map((p) => p.id)
  const canDrill = useDrillSupport(panelIds)

  // El catálogo resuelve `metricId` → métrica. Llega YA filtrado por rol: el
  // front no filtra nada · F1.27.
  const byId = new Map<string, Metric>((catalog.data?.metrics ?? []).map((m) => [m.id, m]))

  // **Lo que el adaptador NO pudo adaptar, con su razón** · F1.35. Una métrica
  // con una familia fuera del enumerado no se descarta en silencio: si pasara,
  // el color de su serie sería `var(--color-fam-vendors-1)` —un token que no
  // existe— y la serie se pintaría SIN COLOR sin que nada falle. Es el mismo
  // modo de silencio que una utilidad que nombra un token inexistente.
  const rejectedMetrics = new Map<string, string>(
    (catalog.data?.rejected ?? []).map((r) => [r.id, `${r.key} · ${r.razon}`]),
  )

  // El tema inicial llega en `/config/me` y lo aplica la superficie · F1.12. El
  // switcher visual no pasa por acá: escribe el atributo y ya.
  const savedTheme = context.data?.user.preferencias?.tema
  useEffect(() => {
    if (savedTheme !== undefined) applyTheme(savedTheme)
  }, [savedTheme])

  // Los chunks de los cuerpos viajan EN PARALELO con `panels:batch` · §8. Sin
  // esto `lazy` recién pide el chunk cuando ya llegó el dato, y el panel
  // parpadea en esqueleto por una descarga que se podía haber hecho mientras
  // tanto.
  //
  // La dependencia es la LISTA DE TIPOS serializada y no el arreglo de paneles:
  // `panels` sale de `layout.data?.panels ?? []` y estrena identidad en cada
  // render, así que con él en las dependencias el efecto corría siempre. Y
  // cambia con el layout, NO con el período — que es la garantía de §7.
  const types = panels.map((p) => p.tipo).join(',')
  useEffect(() => {
    preloadBodies(types === '' ? [] : (types.split(',') as PanelType[]))
  }, [types])

  // El reloj del presupuesto arranca cuando se sabe QUÉ paneles hay · F1.13j.
  useEffect(() => {
    if (types !== '') markTabConfig()
  }, [types])

  /* ── F1.26 · la carga y el error viven ACÁ, no en los cuerpos ───────────── */

  if (context.isLoading || catalog.isLoading) {
    return <SurfaceMessage title="Cargando la consola" detail="Contexto y catálogo" />
  }

  if (context.isError || context.data === undefined) {
    return (
      <SurfaceMessage
        title="No se pudo cargar tu contexto"
        detail={context.error?.message ?? 'Sin detalle del servidor'}
        onRetry={() => void context.refetch()}
      />
    )
  }

  if (catalog.isError) {
    // Sin catálogo no se puede resolver ni una métrica: la pantalla no tiene
    // nada que dibujar, y dibujar shells vacíos sería peor que decirlo.
    return (
      <SurfaceMessage
        title="No se pudo cargar el catálogo"
        detail={catalog.error?.message ?? 'Sin detalle del servidor'}
        onRetry={() => void catalog.refetch()}
      />
    )
  }

  /* ── UN DASHBOARD SIN COMPONER · F5.1 ────────────────────────────────────
   *
   * **Existe y no está compuesto, que no es un error.** `POST
   * /admin/tenants/{id}/dashboards` crea uno sin layout, y ése es su estado
   * normal hasta que alguien lo componga en el builder. Medido el 2026-09-26
   * creando «Marca»: `/config/me` devuelve `active_layout_id: null` y
   * `tabs: null`.
   *
   * **Antes de esto la consola decía «No se pudo cargar tu contexto · sin
   * detalle del servidor»**, porque el adaptador tiraba con `tabs: null`. Dos
   * cosas mal en una: se caía, y le atribuía al servicio un fallo nuestro.
   *
   * **Y NO es lo mismo que cero pestañas**, que es un rol al que no le
   * asignaron ninguna. Los dos muestran un dashboard vacío y la salida es
   * distinta: componer uno, pedir acceso el otro. Por eso se mira
   * `layoutActivoId` y no `tabs.length`. */
  if (context.data.layoutActivoId === null) {
    const activo = context.data.dashboards.find((d) => d.id === context.data?.dashboardActivoId)
    // **La salida es el default del tenant**, no «el anterior»: no guardamos
    // cuál era, y el default es el que con más probabilidad está compuesto.
    // Si el activo YA es el default, no se ofrece: volver a donde ya se está
    // es un botón que no hace nada.
    const porDefecto = context.data.dashboards.find((d) => d.esDefault)
    return (
      <SurfaceMessage
        title={
          activo === undefined
            ? 'Este cliente todavía no tiene un dashboard'
            : `«${activo.nombre}» todavía no se compuso`
        }
        detail="Un dashboard sin layout publicado no tiene pestañas que mostrar · se compone en el builder"
        {...(porDefecto === undefined || porDefecto.id === context.data.dashboardActivoId
          ? {}
          : {
              accion: {
                rotulo: `Volver a ${porDefecto.nombre}`,
                onAccion: () => {
                  setTabId(null)
                  selectDashboard.mutate({
                    theme: context.data?.user.preferencias?.tema ?? currentTheme(),
                    dashboardId: porDefecto.id,
                  })
                },
              },
            })}
      />
    )
  }

  // Un fallo del batch NO baja acá: los shells siguen visibles y cada panel
  // muestra su estado de error · F1.26. Por eso el payload cae a CARGANDO y no
  // a una pantalla de error.
  const payloadOf = (panelId: string): Payload =>
    batch.data?.[panelId] ??
    (batch.isError
      ? { estado: 'ERROR', mensaje: batch.error?.message ?? 'No se pudieron traer los datos' }
      : { estado: 'CARGANDO' })

  /* ── F1.29 · los params se validan ACÁ, en el adaptador de api/ ─────────── */

  const paramsOf = (panelId: string) => {
    const panel = panels.find((p) => p.id === panelId)
    if (panel === undefined) return { params: {}, unknown: [], invalid: [] }
    return adaptPanelParams(panel, blocks.data?.blocks)
  }

  /* ── F1.31 · el repertorio decide si el gráfico puede dibujar ──────────── */

  const repertorio = plotTable(plots.data ?? [])

  /** Por qué el gráfico de un panel no puede dibujar su valor. `undefined` si
   *  puede, o si todavía no hay con qué decidir.
   *
   *  **Mientras el repertorio no llegó, NO se bloquea nada.** `/config/plots` es
   *  una consulta aparte y puede fallar sola —igual que `/config/blocks`—, y un
   *  panel apagado por una tabla que no cargó es peor que uno dibujado sin
   *  verificar: el segundo es lo que hacía ayer, el primero es una regresión que
   *  el usuario no puede distinguir de un fallo de datos.
   *
   *  **`indeterminado` tampoco se propaga.** `invalidPlotReason` lo devuelve
   *  para que se vea en desarrollo, y apagar un panel porque este build no sabe
   *  contar un sustantivo nuevo del repertorio sería castigar al usuario por una
   *  deriva entre las dos mitades. Se avisa y se dibuja. */
  const plotProblemOf = (panelId: string): PlotProblem | undefined => {
    const panel = panels.find((p) => p.id === panelId)
    if (panel === undefined || panel.grafico === undefined) return undefined
    if (repertorio.size === 0) return undefined
    const payload = payloadOf(panelId)
    if (!hasValue(payload)) return undefined

    const problema = invalidPlotReason(repertorio, panel.grafico, payload.valor)
    if (problema === null) return undefined
    if (problema.clase === 'indeterminado') {
      // Mismo trato y mismo lugar que el aviso de params desconocidos: es de
      // DESARROLLO. En producción el panel se dibujó igual, y llenar la consola
      // del navegador con algo que sólo puede resolver quien compone el
      // repertorio no le sirve a nadie.
      if (import.meta.env.DEV) {
        console.warn(`[synapse] panel ${panelId} (${panel.grafico}): ${problema.razon}`)
      }
      return undefined
    }
    return problema
  }

  /** Un param inválido DEGRADA el panel, no se ignora ni se reemplaza por el
   *  default. Ignorarlo es el defecto que F1.29 arregla; reemplazarlo en
   *  silencio es peor, porque el panel se ve bien mostrando otra cosa.
   *
   *  Sale como `BLOQUEADO` y no como `ERROR` porque no es un fallo del sistema:
   *  es una composición que no se puede dibujar, tiene razón y tiene quien la
   *  arregle. El shell conserva título, BASE y procedencia · §5.2. */
  const payloadWithParams = (panelId: string): Payload => {
    const { invalid } = paramsOf(panelId)
    if (invalid.length > 0) {
      return {
        estado: 'BLOQUEADO',
        razon: `La composición de este panel no es válida · ${invalid.map((i) => i.reason).join(' · ')}`,
        desbloqueaCon: 'Corregir las opciones del panel en el builder',
      } as Payload
    }
    return payloadOf(panelId)
  }

  /* ── F3.3 · «Preguntar» ──────────────────────────────────────────────────
   *
   *  **La hoja se monta sólo cuando hay panel**, y con él se resuelve su métrica
   *  para titularla. Si el panel dejó de existir —cambió la pestaña con la hoja
   *  abierta— no se monta: titular «Preguntar» sobre un panel que ya no está en
   *  pantalla es peor que cerrarla.
   *
   *  **El período sale del mismo lugar que el batch**, así que la pregunta habla
   *  del mismo período que la cifra que se está mirando. Si salieran de dos
   *  lados, alguien preguntaría por septiembre mirando agosto. */
  const askingPanel = panels.find((p) => p.id === askingPanelId)
  const askingMetric = askingPanel === undefined ? undefined : byId.get(askingPanel.metricId)

  /* ── F3.9 · «Ver detalle» · §PEN:C2 ───────────────────────────────────────
   *
   *  Mismo idioma que el chat: la hoja se monta sólo cuando hay panel Y su
   *  métrica resuelve. Si el panel dejó de existir —cambió la pestaña con la hoja
   *  abierta— no se monta: titular un detalle sobre un panel que ya no está en
   *  pantalla es peor que cerrarla.
   *
   *  **El payload entra por props**, y es lo que deja que el encabezado declare la
   *  BASE y la procedencia: la respuesta de la desagregación trae nueve campos y
   *  **ninguno es de procedencia**. Se pasa `payloadWithParams`, el mismo que ve la
   *  grilla, para que la cifra de la hoja y la del panel no puedan decir distinto. */
  const drillingPanel = panels.find((p) => p.id === drillingPanelId)
  const drillingMetric = drillingPanel === undefined ? undefined : byId.get(drillingPanel.metricId)

  return (
    <>
    <Console
      context={context.data}
      activeTab={activeTab}
      activePeriodId={activePeriod?.id}
      panels={panels}
      metricsById={byId}
      payloadOf={payloadWithParams}
      paramsOf={(id) => paramsOf(id).params}
      plotProblemOf={plotProblemOf}
      rejectedMetrics={rejectedMetrics}
      format={format}
      onSelectTab={setTabId}
      onSelectPeriod={setPeriodId}
      onChangeTheme={(theme) => saveTheme.mutate(theme)}
      onSelectDashboard={(dashboardId) => {
        // **Reiniciar la pestaña es el segundo bullet del criterio**, y su
        // razón: «la pestaña de un layout no existe en el otro». Sin esto,
        // `tabId` seguiría apuntando a una pestaña del dashboard anterior y
        // `/config/tabs/{tabId}` devolvería 404 — o peor, la pestaña de otro
        // dashboard si los ids colisionaran.
        //
        // Se limpia ANTES de la mutación: el `onSuccess` invalida `me` y la
        // pestaña por defecto sale de la respuesta nueva, que es la única que
        // sabe cuáles existen.
        setTabId(null)
        selectDashboard.mutate({
          // El tema viaja obligado —el cuerpo lo declara `required`— y sale del
          // que el usuario tiene, no de uno fijo: escribir uno acá lo pisaría.
          theme: context.data?.user.preferencias?.tema ?? currentTheme(),
          dashboardId,
        })
      }}
      onRetryPanel={(panelId) => retryPanel.mutate(panelId)}
      onAskPanel={(panelId) => {
        // **Abrir el chat cierra el detalle**, y al revés también. Es la
        // exclusión que hace que no haya dos hojas abiertas, escrita en los
        // manejadores y no en la hoja: la hoja no sabe de la otra.
        setDrillingPanelId(null)
        setAskingPanelId(panelId)
      }}
      onDrillPanel={(panelId) => {
        setAskingPanelId(null)
        setAskingTab(false)
        setDrillingPanelId(panelId)
      }}
      canDrill={canDrill}
      onAskTab={() => {
        setDrillingPanelId(null)
        setAskingTab(true)
      }}
    />

    {/* ── LA HOJA DE DETALLE · F3.9 · §PEN:C2 ───────────────────────────── */}
    {drillingPanel !== undefined && drillingMetric !== undefined && activePeriod !== undefined ? (
      <DrillSheet
        // **La `key` es el panel**, por la misma razón que en el chat: sin ella,
        // abrir el detalle de otro panel reutilizaría el mismo estado y la
        // dimensión elegida en el anterior quedaría debajo de un título nuevo —
        // y peor, podría no estar entre las que el panel nuevo declara.
        key={drillingPanel.id}
        panelId={drillingPanel.id}
        metric={drillingMetric}
        payload={payloadWithParams(drillingPanel.id)}
        periodo={activePeriod.id}
        format={format}
        now={new Date()}
        onClose={() => setDrillingPanelId(null)}
        // **Cierra ésta y abre el chat: no se apilan.** Y sin este manejador el
        // botón del pie no se pintaría — la regla del CTA muerto.
        onAsk={() => {
          setDrillingPanelId(null)
          setAskingPanelId(drillingPanel.id)
        }}
      />
    ) : null}

    {askingPanel !== undefined && askingMetric !== undefined && activePeriod !== undefined ? (
      <ChatSheet
        // **La `key` es el panel, y no es decorativa.** Sin ella, abrir el chat
        // de otro panel reutilizaría el mismo `useChat` y los turnos de la
        // conversación anterior quedarían debajo de un título nuevo.
        key={askingPanel.id}
        contexto={{ panelId: askingPanel.id, periodo: activePeriod.id }}
        periodo={activePeriod.id}
        titulo={askingMetric.nombre}
        // **El tipo del panel es lo que decide con qué cuerpo se dibuja la
        // cifra del agente** · F3.6. Sale del panel desde el que se preguntó,
        // no de una elección: ver `ChatFigure`.
        panelTipo={askingPanel.tipo}
        bloques={blockTable(blocks.data?.blocks ?? [])}
        format={format}
        onClose={() => setAskingPanelId(null)}
      />
    ) : null}

    {/* ── LA HOJA DE PESTAÑA · F3.15 ─────────────────────────────────────
        **Es la misma hoja**, con el otro contexto: el servicio exige
        exactamente uno de los dos y la unión lo garantiza.

        **La `key` lleva la pestaña** por la misma razón que la de panel lleva
        el panel: sin ella, cambiar de pestaña con la hoja abierta reusaría el
        mismo `useChat` y los turnos de la conversación anterior quedarían bajo
        un título nuevo.

        **Sin `panelTipo`**, que no es un olvido: no hay panel de origen, así
        que no hay cuerpo con que dibujar una cifra. `ChatFigure` lo dice. */}
    {askingTab && activeTab !== undefined && activePeriod !== undefined ? (
      <ChatSheet
        key={`tab:${activeTab.id}`}
        contexto={{ tabId: activeTab.id, periodo: activePeriod.id }}
        periodo={activePeriod.id}
        titulo={activeTab.nombre}
        bloques={blockTable(blocks.data?.blocks ?? [])}
        format={format}
        onClose={() => setAskingTab(false)}
      />
    ) : null}
    </>
  )
}
