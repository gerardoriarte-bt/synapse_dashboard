/** C1 · el dashboard · F1.5.
 *
 *  LA PANTALLA NO ESTÁ ESCRITA. Se recorre lo que llegó de `/config/tabs/{id}` y
 *  cada celda se resuelve contra el catálogo. Ningún panel, métrica ni posición
 *  aparece literal en este archivo.
 *
 *  Esta es la capa que SÍ tiene hooks y fetch. Lo que baja a `render/` ya son
 *  datos resueltos.
 */
import { useState } from 'react'
import { useCatalog, useMe, usePanelsBatch, useTab } from '../../api/hooks'
import { gridStyle, panelStyle } from '../../render/grid'
import type { Metric, Payload } from '../../api/types'

export function Console() {
  const [tabId, setTabId] = useState<string | null>(null)
  const [period, setPeriod] = useState<string | null>(null)

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

          /* ANDAMIO · se reemplaza en F1.9 por <PanelInGrid>, que monta
             <Panel> con la anatomía obligatoria y el cuerpo de `panel.tipo`.
             Hasta entonces la celda solo prueba que la geometría de la grilla
             sale del layout: no pinta ni una cifra. */
          return (
            <section
              key={panel.id}
              style={panelStyle(panel)}
              data-pendiente="F1.9"
              className="rounded-xl bg-panel border border-w2 p-6"
            >
              <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">
                {panel.tipo} · {panel.colSpan}×{panel.rowSpan} · {payload.estado}
              </p>
              <p className="text-ink">{metric?.nombre ?? panel.metricId}</p>
            </section>
          )
        })}
      </div>
    </main>
  )
}
