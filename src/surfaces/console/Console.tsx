/** C1 · el dashboard · F1.5
 *
 *  LA PANTALLA NO ESTÁ ESCRITA. Se recorre lo que llegó de `/config/tabs/{id}` y
 *  cada celda se resuelve contra el catálogo. Ningún panel, métrica ni posición
 *  aparece literal en este archivo.
 *
 *  **Sin un solo hook de datos** · F1.6. Todo llega por props, así que este
 *  componente se puede montar con datos fijos en el builder y en la vista previa
 *  por rol sin tocar la red. Quien hace fetch es `ConsoleContainer`.
 *
 *  **§PEN:C1** · C1 · las cuatro pestañas del `.pen` son la misma pantalla: la composición la manda el layout.
 */
import { useLayoutEffect } from 'react'
import { Label } from '../../render/primitives/Label'
import { COLUMNS, gridStyle, readingOrder } from '../../render/grid'
import { useColumns } from '../../render/useColumns'
import { measureLayoutCommit, measureLayoutPainted } from '../../render/budget'
import { PanelInGrid } from './PanelInGrid'
import type { PlotProblem } from '../../catalog/plots'
import { Topbar } from './Topbar'
import { BarraDeCliente } from '../BarraDeCliente'
import { Accion } from '../../render/primitives/Accion'
import type { ClienteVisible } from '../clienteVisible'
import { ConsoleDock } from './ConsoleDock'
import { AvisoDeFalla } from './AvisoDeFalla'
import { fallaComun } from './fallaComun'
import { esAdmin } from '../../api/rol'
import type { Formatter } from '../../render/format'
import type { Theme } from '../../tokens/theme'
import type { AppContext, Metric, PanelConfig, Payload, Tab } from '../../api/types'

type Props = {
  context: AppContext
  activeTab: Tab | undefined
  activePeriodId: string | undefined
  /** **Por qué se muestra un período que nadie eligió** · 2026-10-01 · baja
   *  hasta `PeriodPicker`. Lo redacta el contenedor porque es el único que ve la
   *  sustitución; acá sólo viaja. */
  avisoDePeriodo?: string | undefined
  panels: readonly PanelConfig[]
  metricsById: ReadonlyMap<string, Metric>
  payloadOf: (panelId: string) => Payload
  /** Por qué una métrica del catálogo NO se pudo adaptar · F1.35. Llega desde
   *  `adaptCatalog`, que las separa en vez de descartarlas: una métrica que
   *  desaparece sin decir por qué deja un panel que no dibuja y no explica. */
  rejectedMetrics?: ReadonlyMap<string, string>

  /** Los params YA validados · F1.29. La superficie no los lee: solo los pasa.
   *  Quien valida es el adaptador de `api/`. */
  paramsOf: (panelId: string) => Record<string, unknown>
  /** Por qué el gráfico de un panel no puede dibujar su valor · F1.31.
   *
   *  **Mismo idioma que `payloadOf` y `paramsOf`**: llega resuelto y esta
   *  superficie sólo lo pasa. Quien decide es el contenedor, que es el que tiene
   *  la tabla del repertorio. Ausente —o `undefined` para un panel— significa
   *  que se dibuja. */
  plotProblemOf?: (panelId: string) => PlotProblem | undefined
  format: Formatter
  onSelectTab: (id: string) => void
  onSelectPeriod: (id: string) => void
  onChangeTheme?: (theme: Theme) => void
  /** Reintento de UN panel · F2.4. Lleva el `panelId` porque el reintento es
   *  de ese panel y no del batch: los otros ya cargaron bien. */
  onRetryPanel?: (panelId: string) => void
  /** Reintento de VARIOS paneles en una vuelta · el aviso de una falla común. */
  onRetryPanels?: ((panelIds: string[]) => void) | undefined
  /** «Preguntar» · F3.3. Lleva el `panelId` porque el contexto del chat es el
   *  panel desde el que se preguntó: `panel_context: {panel_id, period}`.
   *
   *  **Es un callback y no una navegación escrita acá**, igual que `onRetry`.
   *  `Console` no sabe si abre una hoja, una ruta o nada — quien decide el
   *  viaje es quien monta la consola, que en el builder y en la vista previa
   *  por rol no es el mismo. */
  onAskPanel?: (panelId: string) => void
  /** «Ver detalle» · F3.9 · §PEN:C2. Lleva el `panelId` porque la desagregación
   *  es de ese panel: la lectura cuelga de él.
   *
   *  **Es un callback y no una navegación escrita acá**, igual que `onAskPanel`.
   *  `Console` no sabe si abre una hoja, una ruta o nada — quien decide el viaje
   *  es quien monta la consola, que en el builder y en la vista previa por rol no
   *  es el mismo.
   *
   *  **Y se pasa por panel, no para todos.** Quien monta decide de cuáles: si una
   *  métrica no se puede desagregar, su CTA no se pinta. Es la regla del CTA
   *  muerto, y acá es lo único que distingue este diseño del que abre una hoja
   *  para decir que no hay nada. */
  onDrillPanel?: ((panelId: string) => void) | undefined
  /** De qué paneles se puede abrir el detalle · F3.9.
   *
   *  **Separado de `onDrillPanel` a propósito.** El manejador es uno y la
   *  respuesta es por panel, así que fundirlos obligaría a quien monta a pasar un
   *  manejador por panel o a devolver `undefined` desde dentro del callback — y
   *  lo segundo es un botón que se aprieta y no hace nada, que es justo lo que la
   *  regla prohíbe.
   *
   *  Ausente significa **ninguno**: antes de saber, no se promete la acción. */
  canDrill?: ReadonlySet<string>
  /** Abre el chat con contexto de PESTAÑA · F3.15 · la barra y el CTA del
   *  navbar. **Sin él ninguno de los dos se pinta.** */
  onAskTab?: (() => void) | undefined
  /** Cambiar de dashboard · F5.1. **Sin él no hay selector.** */
  onSelectDashboard?: ((id: string) => void) | undefined
  /** **La barra del cliente activo** · 2026-10-20. `clientes` vacío —quien no
   *  administra— la deja sin selector. */
  clientes?: readonly ClienteVisible[]
  clienteActivo?: string
  onElegirCliente?: ((id: string) => void) | undefined
  /** La salida cuando el cliente elegido no es el de la sesión. */
  onAbrirEnAdministracion?: ((id: string) => void) | undefined
  /** **El servicio no dejó saltar a ese cliente** · 2026-10-20. Con él, el
   *  bloqueo dice la razón del servicio en vez de «todavía no se puede». */
  motivoDelBloqueo?: string | undefined
}

export function Console({
  context,
  activeTab,
  activePeriodId,
  avisoDePeriodo,
  panels,
  metricsById,
  payloadOf,
  paramsOf,
  plotProblemOf,
  rejectedMetrics,
  format,
  onSelectTab,
  onSelectPeriod,
  onChangeTheme,
  onRetryPanel,
  onRetryPanels,
  onAskPanel,
  onDrillPanel,
  canDrill,
  onAskTab,
  onSelectDashboard,
  clientes = [],
  clienteActivo,
  onElegirCliente,
  onAbrirEnAdministracion,
  motivoDelBloqueo,
}: Props) {
  // El colapso · F1.30. No lo puede hacer solo el CSS: el `colSpan` viaja en un
  // estilo en línea y una media query no lo alcanza.
  const columns = useColumns()

  /** El período activo, con su etiqueta · para la línea de contexto del dock. */
  const periodoActivo = context.periodos.find((p) => p.id === activePeriodId)

  /** **El cliente activo y el de la sesión** · 2026-10-20. Casi siempre son el
   *  mismo. Cuando no, la barra nombra el elegido y el cuerpo NO pinta los
   *  paneles: serían del cliente de la sesión —`/config/*` sirve el del token—
   *  con el nombre de otro arriba. Ver §4 de la propuesta del 2026-10-20. */
  const sesion: ClienteVisible = { id: context.tenant.id, nombre: context.tenant.nombre, formaCorta: context.tenant.etiqueta }
  const activoId = clienteActivo ?? sesion.id
  const activo = clientes.find((c) => c.id === activoId) ?? sesion
  const otroCliente = activo.id !== sesion.id ? activo : null

  /** **Una falla repetida se dice una vez** · 2026-10-21 · `fallaComun.ts`. */
  const falla = fallaComun(panels.map((p) => ({ id: p.id, payload: payloadOf(p.id) })))
  const agrupados = new Set(falla?.paneles ?? [])

  // Un solo `now` para toda la pantalla. Si cada panel llamara a `new Date()`,
  // dos paneles del mismo lote podrían escribir frescuras distintas para la
  // misma corrida del feed.
  const now = new Date()

  const tabMetrics = panels
    .map((p) => metricsById.get(p.metricId))
    .filter((m): m is Metric => m !== undefined)

  // El presupuesto de §8 · F1.13j. `useLayoutEffect` corre después de que React
  // escribió el DOM y antes de que el navegador pinte: es exactamente el commit.
  // El pintado se mide un frame más tarde, desde adentro.
  const layoutKey = panels.map((p) => p.id).join(',')
  useLayoutEffect(() => {
    measureLayoutCommit()
    measureLayoutPainted()
  }, [layoutKey])

  // **El padding NO envuelve la cabecera** · §PEN:C1 la dibuja como bandas a
  // ancho completo, con su propio fondo y su borde. Con `p-6` en el `main` la
  // banda del navbar quedaba flotando con aire a los costados, que es lo
  // contrario de una banda. Cada zona pone el suyo.
  return (
    <main className="min-h-screen bg-bg">
      <Topbar
        context={context}
        activeTab={activeTab}
        activePeriodId={activePeriodId}
        {...(avisoDePeriodo === undefined ? {} : { avisoDePeriodo })}
        format={format}
        tabMetrics={tabMetrics}
        onSelectTab={onSelectTab}
        onSelectPeriod={onSelectPeriod}
        {...(onChangeTheme === undefined ? {} : { onChangeTheme })}
        {...(onAskTab === undefined ? {} : { onAskTab })}
        {...(onSelectDashboard === undefined ? {} : { onSelectDashboard })}
        barra={<BarraDeCliente activo={activo} clientes={clientes} onElegir={onElegirCliente} />}
        soloNavbar={otroCliente !== null}
      />

      {otroCliente !== null && (
        // **Bloqueado, con la gramática de §8**: estado, razón, qué lo
        // desbloquea y una salida. No se pinta una cifra de otro cliente.
        <div className="p-6">
          <section
            aria-labelledby="consola-de-otro-cliente"
            className="flex max-w-2xl flex-col gap-3 rounded-xl border border-w4 bg-panel p-6"
          >
            <Label as="div">Bloqueado</Label>
            <h2 id="consola-de-otro-cliente" className="m-0 font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
              La consola de {otroCliente.nombre} todavía no se puede abrir
            </h2>
            {motivoDelBloqueo === undefined ? (
              <>
                <p className="m-0 font-body text-cuerpo text-dim">
                  La consola muestra los datos de la sesión, que es de {sesion.nombre}. Tu rol no puede abrir la
                  consola de otro cliente.
                </p>
                <Label as="div">Lo desbloquea · un rol con alcance de plataforma</Label>
              </>
            ) : (
              <>
                <p className="m-0 font-body text-cuerpo text-dim">
                  El servicio no abrió la sesión de {otroCliente.nombre}: {motivoDelBloqueo}
                </p>
                <Label as="div">La sesión sigue en {sesion.nombre}</Label>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              {onElegirCliente !== undefined && (
                <Accion variante="primaria" onClick={() => onElegirCliente(sesion.id)}>
                  Volver a la consola de {sesion.nombre}
                </Accion>
              )}
              {onAbrirEnAdministracion !== undefined && (
                <Accion onClick={() => onAbrirEnAdministracion(otroCliente.id)}>
                  Abrir {otroCliente.nombre} en administración
                </Accion>
              )}
            </div>
          </section>
        </div>
      )}

      {otroCliente === null && (
      <>

      {falla !== null && (
        <div className="px-6 pt-6">
          <AvisoDeFalla falla={falla} conDetalle={esAdmin(context.role)} onReintentar={onRetryPanels} />
        </div>
      )}

      {/* El cuerpo sí lleva el padding de la grilla · §4. */}
      <div className="p-6" style={gridStyle(columns)}>
        {/* **Se reordena SOLO con la grilla colapsada** · §ANCLA:RESP-3, que lo
            pide «por debajo de 768px a 1 columna». Ahí el orden visual ES el
            orden del DOM y hay que ordenar de verdad.

            **A doce columnas reordenar ROMPE la composición, y acá decía lo
            contrario.** Medido en el navegador el 2026-09-16 sobre el layout
            publicado: `readingOrder` ordena por `colStart` globalmente, así que
            el DOM quedaba `prosa(1/12) · kpi(1/3) · bars(1/6) · series(1/6) ·
            tabla(1/7)` y recién después los de `colStart` 4, 7 y 10. CSS grid
            coloca en el orden del DOM con un cursor que **no retrocede** —sin
            `dense`—, así que el kpi de la columna 4 ya no entraba en la fila del
            de la columna 1 y bajaba. El dashboard se veía apilado en una
            columna con doce paneles bien compuestos detrás.

            **El orden del arreglo ES la fila**, porque `PanelConfigurado` no
            declara `rowStart`: ordenarlo por `colStart` borra la única
            información de fila que existe. */}
        {(columns === COLUMNS ? panels : readingOrder(panels)).map((panel) => {
          const metric = metricsById.get(panel.metricId)

          // Un `metricId` que el catálogo no resuelve NO se pinta con un
          // fallback silencioso: el catálogo llega ya filtrado por rol, así que
          // una métrica ausente significa que el layout referencia algo que este
          // rol no puede ver. Es un error del backend, no una celda vacía.
          //
          // **Y desde F1.35 dice POR QUÉ cuando se sabe.** El adaptador rechaza
          // las métricas con una forma, familia o capa que no están en el
          // contrato, y esas no son «no resueltas»: son conocidas y no se pueden
          // dibujar. «No resuelta» a secas mandaba a buscar un problema de
          // permisos donde había un valor fuera del enumerado.
          if (metric === undefined) {
            const razon = rejectedMetrics?.get(panel.metricId)
            return (
              <section key={panel.id} className="rounded-xl bg-panel border border-w4 p-6">
                <Label as="div">
                  {razon === undefined
                    ? `Métrica no resuelta · ${panel.metricId}`
                    : `Métrica no dibujable · ${razon}`}
                </Label>
              </section>
            )
          }

          // **Sin manejador NO se pinta el botón** · la regla del CTA muerto. El
          // shell ya la aplica sobre `onChat`, y acá se sostiene hacia arriba:
          // el builder monta esta misma consola sin `onAskPanel`, y ahí
          // «Preguntar» no aparece en vez de aparecer y no hacer nada.
          // ── «VER DETALLE» · F3.9 · §PEN:C2 ───────────────────────────
          //
          // **Los DOS tienen que estar.** Sin manejador no hay quien reciba el
          // clic; sin que el panel esté en `canDrill` no se sabe si la métrica se
          // puede desagregar, y pintar el CTA por si acaso es el botón muerto con
          // un paso más — la hoja se abriría para decir que no hay nada.
          //
          // **Se resuelve acá y no en el atributo** porque el idioma del spread
          // condicional no deja escribir un comentario entre atributos, y esta es
          // la decisión que más falta explicar de las tres.
          const verDetalle =
            onDrillPanel !== undefined && canDrill?.has(panel.id) === true
              ? () => onDrillPanel(panel.id)
              : undefined

          return (
            <PanelInGrid
              key={panel.id}
              panel={panel}
              metric={metric}
              payload={payloadOf(panel.id)}
              params={paramsOf(panel.id)}
              columns={columns}
              format={format}
              now={now}
              {...(onRetryPanel === undefined ? {} : { onRetry: () => onRetryPanel(panel.id) })}
              errorAgrupado={agrupados.has(panel.id)}
              {...(onAskPanel === undefined ? {} : { onChat: () => onAskPanel(panel.id) })}
              {...(verDetalle === undefined ? {} : { onDrill: verDetalle })}
              {...(plotProblemOf?.(panel.id) === undefined ? {} : { plotProblem: plotProblemOf(panel.id) as PlotProblem })}
            />
          )
        })}
      </div>

      {/* ── LA BARRA INFERIOR · §PEN:C1 · F3.15 ────────────────────────────
          **Es la presencia del chat**, y va DESPUÉS de la grilla y no fija al
          viewport: el `.pen` la dibuja como el último hijo del frame, con el
          canvas midiendo 2329 arriba. Fijarla taparía la última fila de paneles
          en los anchos donde la grilla es alta, que es donde más paneles hay.

          **Declara el contexto que va a viajar**: la pestaña activa, su período
          y cuántos paneles tiene. `panels` ya viene filtrado por rol desde
          `/config/tabs/{tabId}`, así que ese número es el mismo que el servicio
          mete en `tab_context` — lo que la barra dice es lo que se pregunta. */}
      {activeTab !== undefined && periodoActivo !== undefined && (
        <ConsoleDock
          tenant={context.tenant.etiqueta}
          pestana={activeTab.nombre}
          // **La etiqueta del período, no su id** · es la misma que pinta el
          // selector. Hoy las dos son `2026-09` porque el cable no manda
          // etiqueta —lo declara B1.1—, y el día que la mande esto la sigue sin
          // tocarse. Formatearla acá sería una segunda fuente para el mismo
          // texto, y se separarían.
          periodo={periodoActivo.etiqueta}
          paneles={panels.length}
          {...(onAskTab === undefined ? {} : { onPreguntar: onAskTab })}
        />
      )}
      </>
      )}
    </main>
  )
}
