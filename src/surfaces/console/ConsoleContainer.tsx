/** Los datos de la consola, fuera del componente que pinta · F1.6
 *
 *  §4 separa contenedor de presentacional, y no por gusto: `Console` sin hooks
 *  se puede montar con datos fijos en el builder y en la vista previa por rol
 *  sin tocar la red. Acá viven `useQuery`, el estado de UI y la decisión de qué
 *  se muestra mientras el contexto vuela — que es F1.26: **ningún componente de
 *  `render/` lee `isLoading` ni `isError`**.
 */
import { useEffect, useState } from 'react'
import {
  useBlocks,
  useCatalog,
  useMe,
  usePanelsBatch,
  useRetryPanel,
  useSaveTheme,
  useTab,
} from '../../api/hooks'
import { adaptPanelParams } from '../../api/params'
import { applyTheme } from '../../tokens/theme'
import { preloadBodies } from '../../render/bodies/registry'
import { createFormat } from '../../render/format'
import { markTabConfig } from '../../render/budget'
import { Console } from './Console'
import { PanelChat } from './PanelChat'
import { SurfaceMessage } from './SurfaceMessage'
import type { Metric, PanelType, Payload } from '../../api/types'

/** El locale del tenant · F1.13b.
 *
 *  SUPUESTO DECLARADO, y **el único lugar del front donde se decide**. El
 *  contrato todavía no lo declara: `Contexto` no trae `locale`, `moneda` ni zona
 *  horaria, así que el criterio de F1.13b —«salen del tenant vía
 *  `/config/me`»— no se puede cumplir entero hasta que el yaml los tenga.
 *
 *  Lo que sí está hecho es lo que importa: el formateador se inyecta y baja por
 *  props hasta el último plot, así que el día que el campo llegue se cambia esta
 *  línea y nada más. Propuesta de spec abierta · va con B0.9. */
const format = createFormat('es-MX')

export function ConsoleContainer() {
  const [tabId, setTabId] = useState<string | null>(null)
  const [periodId, setPeriodId] = useState<string | null>(null)
  /** Desde qué panel se preguntó · F3.3. **Un solo estado**, que es lo que hace
   *  estructuralmente imposible tener dos hojas abiertas — la red del contador
   *  de `ChatOverlay` es para quien monte una desde otro lado. */
  const [askingPanelId, setAskingPanelId] = useState<string | null>(null)

  const context = useMe()
  const catalog = useCatalog()
  // La tabla de bloques trae `paramsDisponibles`: es la mitad del esquema de
  // params que sí declara el contrato · F1.29.
  const blocks = useBlocks()
  const saveTheme = useSaveTheme()

  // La pestaña y el período por defecto salen del backend, no de una constante.
  // Sin esto volvíamos a los `ua_mx` / `ceo` quemados que v2 arrastraba.
  const tabs = context.data?.tabs ?? []
  const activeTab = tabs.find((t) => t.id === tabId) ?? tabs[0]
  const periods = context.data?.periodos ?? []
  const activePeriod = periods.find((p) => p.id === periodId) ?? periods[0]

  const layout = useTab(activeTab?.id ?? null)
  const panels = layout.data?.panels ?? []

  const batch = usePanelsBatch(
    activeTab?.id ?? null,
    panels.map((p) => p.id),
    activePeriod?.id ?? '',
  )
  const retryPanel = useRetryPanel(activeTab?.id ?? null, activePeriod?.id ?? '')

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
      rejectedMetrics={rejectedMetrics}
      format={format}
      onSelectTab={setTabId}
      onSelectPeriod={setPeriodId}
      onChangeTheme={(theme) => saveTheme.mutate(theme)}
      onRetryPanel={(panelId) => retryPanel.mutate(panelId)}
      onAskPanel={setAskingPanelId}
    />

    {askingPanel !== undefined && askingMetric !== undefined && activePeriod !== undefined ? (
      <PanelChat
        // **La `key` es el panel, y no es decorativa.** Sin ella, abrir el chat
        // de otro panel reutilizaría el mismo `useChat` y los turnos de la
        // conversación anterior quedarían debajo de un título nuevo.
        key={askingPanel.id}
        panelId={askingPanel.id}
        periodo={activePeriod.id}
        titulo={askingMetric.nombre}
        onClose={() => setAskingPanelId(null)}
      />
    ) : null}
    </>
  )
}
