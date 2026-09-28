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
 *  ── **LA GRILLA VOLVIÓ** · 2026-09-28 ──────────────────────────────────────
 *
 *  Entre el 26 y el 28 esta pantalla contestó sólo «qué pestañas ve este rol»,
 *  porque la forma que upstream tomó de B4.9 devolvía las pestañas sin sus
 *  paneles. **Se pidió y llegó**: `5924bf2b` devuelve `tabs[].panels[]` ya
 *  filtrados por `hidden_metric_ids` y con los `layout_overrides` aplicados.
 *
 *  Medido ese día sobre el mismo layout publicado: lente `admin` **12 paneles**
 *  con `col_span` 12; lente `planner` **9 con `col_span` 4**. Los dos recortes
 *  que §7.2 pide, en una sola respuesta.
 *
 *  **La colocación sale de `render/grid.ts`**, la misma que aplica la consola.
 *  No es una copia: si el reflujo cambiara, cambian las dos.
 *
 *  ── LOS HUECOS, QUE SON LA MITAD DEL DIAGNÓSTICO ───────────────────────────
 *
 *  §3.4 regla 3: «**el hueco se muestra en el builder, nunca en la consola**. B5
 *  dibuja los huecos en su posición original —es la vista de diagnóstico, y por
 *  eso avisa cuántos hay y de qué ancho—. La consola aplica el reflujo y no
 *  muestra agujeros: un hueco le dice al usuario "acá hay algo que no podés
 *  ver", que es ruido, no información.»
 *
 *  **Un hueco NO se deduce de un espacio vacío en la grilla.** Un layout puede
 *  tener un espacio libre porque el admin lo dejó, y decir «no llega a este rol»
 *  ahí sería afirmar una causa que nadie verificó.
 *
 *  Se calcula por DIFERENCIA: un hueco es **un panel que está en el layout
 *  completo y no en el preview**. Así el hueco conserva su `colStart`, su
 *  `colSpan` y su `rowSpan` reales —que es lo que el dibujo rotula, «HUECO · 3
 *  COLUMNAS»— y su causa es un hecho, no una inferencia.
 *
 *  **§PEN:B5** · B5 · «Vista previa · rol Planner sin componer».
 */
import { Label } from '../../render/primitives/Label'
import { gridStyle, panelStyle } from '../../render/grid'
import type { LayoutDetalle, PreviewDeRol } from '../../api/admin'
import type { PanelConfig } from '../../api/types'

type Props = {
  preview: PreviewDeRol
  /** El layout SIN el lente del rol · de acá salen los huecos, por diferencia.
   *  **Ausente es legítimo**: sin él la grilla se pinta igual y los huecos se
   *  declaran como no calculables, que es mejor que inferirlos de un espacio
   *  vacío. */
  completo?: LayoutDetalle | undefined
  /** El toggle de §7.2 · «un toggle vuelve a edición». */
  onVolver: () => void
}

/** Los paneles que el layout tiene y este rol no ve · §3.4 regla 3.
 *
 *  **Por id y no por posición.** Un `colStart` repetido no identifica un panel
 *  —dos pestañas pueden empezar en la columna 1— y comparar posiciones daría
 *  huecos donde hay un panel movido por un override. */
function huecosDe(
  paneles: readonly PanelConfig[],
  completos: readonly PanelConfig[] | undefined,
): PanelConfig[] {
  if (completos === undefined) return []
  const visibles = new Set(paneles.map((x) => x.id))
  return completos.filter((x) => !visibles.has(x.id))
}

export function RolePreview({ preview, completo, onVolver }: Props) {
  const total = preview.tabs.reduce((s, x) => s + x.paneles.length, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Label as="div">{`Como lo ve · ${preview.rol.nombre}`}</Label>
        <Label as="div">{`${String(preview.tabs.length)} pestaña(s) · ${String(total)} paneles`}</Label>
        {/* **El estado del layout, y no es decoración**: se puede previsualizar
            un BORRADOR, y sin decirlo alguien compara «lo que ve el Planner»
            contra algo que el Planner todavía no ve. */}
        <Label as="div">{preview.estado === 'borrador' ? 'Borrador' : 'Publicado'}</Label>
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

      {preview.tabs.map(({ tab, paneles }) => {
        const completos = completo?.tabs.find((x) => x.tab.id === tab.id)?.panels
        const huecos = huecosDe(paneles, completos)
        return (
          <section key={tab.id} className="flex flex-col gap-2">
            {/* **Sin chrome de edición** · §7.2. El título y la pregunta son de
                la pestaña, no controles. */}
            <h2 className="font-display text-titulo tracking-titulo text-ink m-0">{tab.nombre}</h2>
            <Label as="div">{tab.pregunta === '' ? 'Sin pregunta operativa' : tab.pregunta}</Label>
            {huecos.length > 0 && (
              // El dibujo lo pone arriba de la grilla: cuántos y de qué ancho.
              <Label as="div">
                {`${String(huecos.length)} hueco(s) · ${huecos.map((h) => `${String(h.colSpan)} columnas`).join(' · ')}`}
              </Label>
            )}

            <div style={gridStyle()}>
              {paneles.map((p) => (
                // **No se dibuja con `render/Panel`**, y la razón no cambió: el
                // preview va sin payloads, así que habría que inventarle uno —un
                // `BLOQUEADO` que nadie emitió— y eso es lo que este repositorio
                // persigue. Se pinta la CAJA con su posición real.
                <div
                  key={p.id}
                  style={panelStyle(p)}
                  className="rounded-xl border border-w4 bg-panel p-3 flex flex-col gap-1 min-w-0"
                >
                  <Label as="div">{p.tipo}</Label>
                  <Label as="div">{`${String(p.colSpan)} × ${String(p.rowSpan)}`}</Label>
                  {p.nota !== undefined && <Label as="div">{p.nota}</Label>}
                </div>
              ))}

              {huecos.map((h) => (
                // **En su posición original** · §3.4 regla 3. Punteado y sin
                // relleno: un hueco no es un panel vacío, es un lugar donde no
                // va a haber nada para este rol.
                <div
                  key={`h-${h.id}`}
                  style={panelStyle(h)}
                  className="rounded-xl border border-dashed border-w4 p-3 flex flex-col gap-1 min-w-0"
                >
                  <Label as="div">{`Hueco · ${String(h.colSpan)} columnas`}</Label>
                  <Label as="div">No llega a este rol</Label>
                  <Label as="div">Al publicar se cierra</Label>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
        {/* **Antes este aviso colgaba de `sinPayloads`**, un campo que la
            respuesta de nuestro fork declaraba, y se apagaba solo el día que el
            servicio mandara cifras. La respuesta de upstream no lo tiene, así que
            el aviso pasó a ser fijo — y con él se pierde esa propiedad.

            Para que no quede como leyenda, lo que se declara es lo que se PUEDE
            comprobar mirando la pantalla: que no hay paneles. */}
        <Label as="div">
          Esta vista muestra la composición · sin cifras, que el preview no manda
        </Label>
        <Label as="div">
          Los dos recortes los hizo el servidor · `roles.tab_ids` y `hidden_metric_ids`
        </Label>
        {completo === undefined && (
          // **Se declara en vez de inferirlos.** Sin el layout completo un hueco
          // sería un espacio vacío, y un espacio vacío puede ser una decisión
          // del admin. Decir «no llega a este rol» ahí afirmaría una causa que
          // nadie verificó.
          <Label as="div">
            Los huecos no se pueden calcular sin el layout sin lente
          </Label>
        )}
      </div>
    </div>
  )
}
