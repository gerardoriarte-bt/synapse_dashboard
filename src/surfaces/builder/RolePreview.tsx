/** B5 · Vista previa por rol · F4.12
 *
 *  §7.2: «Renderiza la composición **exactamente como la verá el rol
 *  seleccionado, con datos reales y sin chrome de edición**. Un toggle vuelve a
 *  edición. Es la validación antes de publicar.»
 *
 *  ── LO QUE ESTA PANTALLA SÍ ES ──────────────────────────────────────────────
 *
 *  La composición que el rol va a ver, resuelta **por el servidor y no acá**:
 *  qué pestañas, qué paneles, en qué columna y de qué tamaño. Sale de
 *  `GET /admin/layouts/:id/preview?roleId=`, que pasa por el **mismo `GetTab`**
 *  que sirve a la consola — `tab_ids`, `hidden_metric_ids` y `layout_overrides`
 *  se aplican una sola vez, en un solo lugar.
 *
 *  **Y por eso no se simula en el cliente.** Filtrar acá lo que ya se tiene
 *  probaría el filtro del front, que no existe: el filtro es del servidor, y un
 *  preview que lo reimplemente termina mostrando algo que la consola no muestra.
 *
 *  ── LO QUE NO ES, Y ES LA MITAD QUE §7.2 PIDE ───────────────────────────────
 *
 *  **No trae datos reales.** B4.9 lo decidió y lo dejó escrito: el preview va sin
 *  payloads. Con el layout alcanza para «CEO vs Planner»; con payloads habría que
 *  decidir qué período usa y si un panel oculto llega como `SIN_PERMISO`, y
 *  materializar costaría lo mismo que la consola real.
 *
 *  **Así que los paneles NO se dibujan con `render/Panel`.** Hacerlo exigiría
 *  inventarle un payload —un `BLOQUEADO` que ningún servidor emitió, o un
 *  `CARGANDO` que no está cargando— y eso es exactamente lo que este repositorio
 *  persigue: algo que compila, se ve bien y miente. Se dibuja la GRILLA con las
 *  posiciones reales, y cada hueco dice qué métrica va ahí.
 *
 *  La grilla sale de `render/grid.ts` —`gridStyle`, `panelStyle`,
 *  `readingOrder`—, así que la colocación es la misma que la consola aplica y no
 *  una copia.
 *
 *  **§PEN:B5** · B5 · «Vista previa · rol Planner sin componer».
 */
import { Label } from '../../render/primitives/Label'
import { gridStyle, panelStyle, readingOrder } from '../../render/grid'
import type { PreviewDeRol } from '../../api/admin'
import type { Metric } from '../../api/types'

type Props = {
  preview: PreviewDeRol
  /** Para nombrar la métrica de cada panel en vez de pintar su id. */
  metricas: readonly Pick<Metric, 'id' | 'nombre'>[]
  /** El toggle de §7.2 · «un toggle vuelve a edición». */
  onVolver: () => void
}

export function RolePreview({ preview, metricas, onVolver }: Props) {
  const nombreDeMetrica = (id: string) => metricas.find((m) => m.id === id)?.nombre ?? '—'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Label as="div">{`Como lo ve · ${preview.rolNombre}`}</Label>
        <Label as="div">{`${String(preview.tabs.length)} pestaña(s)`}</Label>
        <button
          type="button"
          onClick={onVolver}
          className="font-mono text-label tracking-rotulo uppercase rounded-md px-3 py-1 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2 ml-auto"
        >
          Volver a edición
        </button>
      </div>

      {preview.tabs.length === 0 && (
        // No es un error: es un rol al que no le asignaron ninguna pestaña, y
        // eso es exactamente lo que esta pantalla existe para mostrar.
        <Label as="div">Este rol no ve ninguna pestaña de este layout</Label>
      )}

      {preview.tabs.map(({ tab, panels }) => (
        <section key={tab.id} className="flex flex-col gap-2">
          {/* **Sin chrome de edición** · §7.2. El título y la pregunta son de la
              pestaña, no controles. */}
          <h2 className="font-display text-titulo tracking-titulo text-ink m-0">{tab.nombre}</h2>
          <Label as="div">{tab.pregunta === '' ? 'Sin pregunta operativa' : tab.pregunta}</Label>
          <Label as="div">{`${String(panels.length)} panel(es)`}</Label>

          <div style={gridStyle()} className="w-full">
            {readingOrder(panels).map((p) => (
              <div
                key={p.id}
                style={panelStyle(p)}
                className="rounded-xl bg-panel border border-w3 p-6 flex flex-col gap-1"
              >
                <Label as="div">{p.tipo}</Label>
                <span className="text-ink text-celda">{nombreDeMetrica(p.metricId)}</span>
                {/* La medida en unidades de grilla, que es la que compone. */}
                <Label as="div">{`${String(p.colSpan)}×${String(p.rowSpan)} · col ${String(p.colStart)}`}</Label>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
        {/* **El aviso cuelga de `sinPayloads`, que es el campo que la respuesta
            declara.** Escribirlo fijo lo volvería una leyenda: el día que el
            servicio empiece a mandar cifras seguiría diciendo que no las hay, y
            nadie lo notaría hasta mirar. Así se apaga solo. */}
        {preview.sinPayloads && (
          <>
            <Label as="div">
              Esta vista muestra la composición, no las cifras · el preview viene sin payloads
            </Label>
            <Label as="div">
              §7.2 pide «con datos reales» · decidido en B4.9: habría que fijar qué período usa
              y qué pasa con un panel oculto
            </Label>
          </>
        )}
        <Label as="div">
          El recorte por rol lo hizo el servidor con el mismo GetTab que sirve a la consola
        </Label>
      </div>
    </div>
  )
}
