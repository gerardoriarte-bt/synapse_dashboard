/** C1 · el dashboard · F1.5.
 *
 *  LA PANTALLA NO ESTÁ ESCRITA. Se recorre lo que llegó de `/config/tabs/{id}` y
 *  cada celda se resuelve contra el catálogo. Ningún panel, métrica ni posición
 *  aparece literal en este archivo.
 *
 *  Esta es la capa que SÍ tiene hooks y fetch. Lo que baja a `render/` ya son
 *  datos resueltos.
 */
import { Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { useCatalog, useMe, usePanelsBatch, useTab } from '../../api/hooks'
import { gridStyle } from '../../render/grid'
import { Panel } from '../../render/Panel/Panel'
import { bodyFor, preloadBodies } from '../../render/bodies/registry'
import { hasValue } from '../../render/state'
import { markTabConfig, measureLayoutCommit, measureLayoutPainted } from '../../render/budget'
import { createFormat } from '../../render/format'
import { Label } from '../../render/primitives/Label'
import type { Metric, PanelType, Payload } from '../../api/types'

/** El locale del tenant · F1.13b.
 *
 *  SUPUESTO DECLARADO, y es el único lugar del front donde se decide. **El
 *  contrato todavía no lo declara**: `Contexto` no trae `locale`, `moneda` ni
 *  zona horaria, así que el criterio de F1.13b —«salen del tenant vía
 *  /config/me»— no se puede cumplir entero hasta que el yaml los tenga.
 *
 *  Lo que SÍ está hecho es lo que importa: el formateador se inyecta y baja por
 *  props, así que el día que el campo llegue se cambia esta línea y nada más.
 *  Propuesta de spec abierta · va con las de B0.9. */
const format = createFormat('es-MX')

export function Console() {
  const [tabId, setTabId] = useState<string | null>(null)
  const [period, setPeriod] = useState<string | null>(null)

  // Un solo `now` para toda la pantalla. Si cada panel llamara a `new Date()`,
  // dos paneles del mismo lote podrían escribir frescuras distintas para la
  // misma corrida del feed.
  const now = new Date()

  const context = useMe()
  const catalog = useCatalog()

  // La pestaña y el período por defecto salen del backend, no de una constante.
  // Sin esto volvíamos a los `ua_mx` / `ceo` quemados que v2 arrastraba.
  const tabs = context.data?.tabs ?? []
  const active = tabs.find((p) => p.id === tabId) ?? tabs[0]
  const periods = context.data?.periodos ?? []
  const activePeriod = periods.find((p) => p.id === period) ?? periods[0]

  const layout = useTab(active?.id ?? null)
  const panels = layout.data?.panels ?? []

  // Los chunks de los cuerpos viajan EN PARALELO con `panels:batch` · §8. Sin
  // esto `lazy` recién pide el chunk cuando ya llegó el dato, y el panel
  // parpadea en esqueleto por una descarga que se podía haber hecho mientras
  // tanto. Depende del layout y NO del período: cambiar de período no cambia
  // qué tipos tiene la pestaña.
  //
  // La dependencia es la LISTA DE TIPOS serializada y no el arreglo de paneles:
  // `panels` sale de `layout.data?.panels ?? []` y estrena identidad en cada
  // render, así que con él en las dependencias el efecto corría siempre.
  const types = panels.map((p) => p.tipo).join(',')
  useEffect(() => {
    preloadBodies(types === '' ? [] : (types.split(',') as PanelType[]))
  }, [types])

  // El presupuesto de §8 · F1.13j. El reloj arranca cuando se sabe QUÉ paneles
  // hay —no cuando arranca la app, no cuando llega el primer dato— y para
  // cuando la grilla está en pantalla. Los datos llegan después.
  useEffect(() => {
    if (types !== '') markTabConfig()
  }, [types])

  // `useLayoutEffect` corre después de que React escribió el DOM y antes de que
  // el navegador pinte: es exactamente el commit. El pintado se mide un frame
  // más tarde, desde adentro.
  useLayoutEffect(() => {
    measureLayoutCommit()
    measureLayoutPainted()
  }, [types])

  const batch = usePanelsBatch(
    active?.id ?? null,
    panels.map((p) => p.id),
    activePeriod?.id ?? '',
  )

  // El catálogo resuelve `metricId` → métrica. Llega YA filtrado por rol: el
  // front no filtra nada · F1.27.
  const byId = new Map<string, Metric>((catalog.data?.metrics ?? []).map((m) => [m.id, m]))

  if (context.isLoading) return <p className="p-6 text-dim">Cargando…</p>
  if (context.isError) return <p className="p-6 text-ink">{context.error.message}</p>

  return (
    <main className="min-h-screen bg-bg p-6">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-ink text-xl">{active?.pregunta ?? ''}</h1>
        <nav className="flex gap-2">
          {tabs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setTabId(p.id)}
              className={p.id === active?.id ? 'text-acc' : 'text-dim'}
            >
              {p.nombre}
            </button>
          ))}
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={p.id === activePeriod?.id ? 'text-acc' : 'text-dim'}
            >
              {p.etiqueta}
            </button>
          ))}
        </nav>
      </header>

      <div style={gridStyle()}>
        {panels.map((panel) => {
          const metric = byId.get(panel.metricId)
          const payload: Payload = batch.data?.[panel.id] ?? { estado: 'CARGANDO' }

          // Un `metricId` que el catálogo no resuelve NO se pinta con un
          // fallback silencioso: el catálogo llega ya filtrado por rol, así que
          // una métrica ausente significa que el layout referencia algo que
          // este rol no puede ver. Es un error del backend, no una celda vacía.
          if (metric === undefined) {
            return (
              <section key={panel.id} className="rounded-xl bg-panel border border-w4 p-6">
                <Label as="div">Métrica no resuelta · {panel.metricId}</Label>
              </section>
            )
          }

          return (
            <Panel
              key={panel.id}
              metric={metric}
              payload={payload}
              placement={panel}
              format={format}
              now={now}
              onRetry={() => void batch.refetch()}
            >
              {body(panel, payload, metric)}
            </Panel>
          )
        })}
      </div>
    </main>
  )

  /** Resuelve `tipo` → cuerpo. Solo se llama con estados que tienen cifra: el
   *  `Panel` decide antes si va un estado, y en ese caso esto ni se evalúa. */
  function body(panel: (typeof panels)[number], payload: Payload, metric: Metric) {
    if (!hasValue(payload)) return null

    const Body = bodyFor(panel.tipo)

    // Sin fallback silencioso · F1.22 y §1 principio 6. Un cuerpo de otro tipo,
    // o una caja vacía, convierte un error de composición en una pantalla que
    // parece correcta.
    if (Body === undefined) {
      return <Label as="div">Sin cuerpo para el tipo «{panel.tipo}»</Label>
    }

    return (
      // El `fallback` es `null` y no un esqueleto: la precarga hace que el chunk
      // ya esté cuando llega el dato, y un esqueleto de un frame parpadea más de
      // lo que informa.
      <Suspense fallback={null}>
        <Body
          value={payload.valor}
          /* `opciones` llega como `Record<string, unknown>` y **no se valida
             acá** · F1.29: eso va en el adaptador de `api/`, no en la superficie
             ni en `render/`. Hasta entonces cada cuerpo aplica sus defaults, que
             es lo que hace v2. Un param mal escrito hoy se ignora en silencio, y
             está anotado como tal. */
          params={panel.opciones ?? {}}
          span={panel}
          family={metric.familia}
          metric={metric.nombre}
          format={format}
          {...(metric.unidad == null ? {} : { unit: metric.unidad })}
        />
      </Suspense>
    )
  }
}
