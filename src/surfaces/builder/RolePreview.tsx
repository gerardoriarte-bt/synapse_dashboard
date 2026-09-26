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
 *  ── **LO DE ARRIBA DEJÓ DE SER CIERTO** · 2026-09-26 ───────────────────────
 *
 *  Esta pantalla pintaba la grilla con `render/grid.ts` para que la colocación
 *  fuera la misma que aplica la consola y no una copia. **Upstream tomó B4.9 con
 *  otra forma** —medida en `8633b10`— que devuelve qué pestañas ve el rol y no
 *  sus paneles, y no existe otra ruta que dé una pestaña con el lente de otro
 *  rol: `GetTab` resuelve el rol desde el token.
 *
 *  Así que hoy contesta **«qué pestañas ve este rol»**, que es menos de lo que
 *  §7.2 pide, y lo dice en pantalla. La grilla no se reemplaza por una armada
 *  del lado nuestro: sería afirmar «esto ve el Planner» sobre paneles que nadie
 *  filtró por `hidden_metric_ids`, que es exactamente lo que esta pantalla
 *  existe para no adivinar.
 *
 *  **§PEN:B5** · B5 · «Vista previa · rol Planner sin componer».
 */
import { Label } from '../../render/primitives/Label'
import type { PreviewDeRol } from '../../api/admin'

type Props = {
  preview: PreviewDeRol
  /** El toggle de §7.2 · «un toggle vuelve a edición». */
  onVolver: () => void
}

export function RolePreview({ preview, onVolver }: Props) {

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Label as="div">{`Como lo ve · ${preview.rol.nombre}`}</Label>
        <Label as="div">{`${String(preview.tabs.length)} pestaña(s)`}</Label>
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

      {/* ── ACÁ HABÍA UNA GRILLA DE PANELES · 2026-09-26 ────────────────────
          Se pintaba un panel por cada uno que el rol ve, con su tipo, su
          métrica y su medida en unidades de grilla. **El servicio dejó de
          mandarlos**: upstream tomó B4.9 con una forma que devuelve las
          pestañas y no sus paneles, y no hay otra ruta que las dé con el lente
          de otro rol.

          No se reemplaza por una grilla vacía ni por un conteo derivado del
          layout de edición: eso diría «esto ve el Planner» sobre paneles que
          nadie filtró por `hidden_metric_ids`, y esta pantalla existe justamente
          para no adivinar eso. */}
      {preview.tabs.map((tab) => (
        <section key={tab.id} className="flex flex-col gap-2">
          {/* **Sin chrome de edición** · §7.2. El título y la pregunta son de la
              pestaña, no controles. */}
          <h2 className="font-display text-titulo tracking-titulo text-ink m-0">{tab.nombre}</h2>
          <Label as="div">{tab.pregunta === '' ? 'Sin pregunta operativa' : tab.pregunta}</Label>
        </section>
      ))}

      <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
        {/* **Antes este aviso colgaba de `sinPayloads`**, un campo que la
            respuesta de nuestro fork declaraba, y se apagaba solo el día que el
            servicio mandara cifras. La respuesta de upstream no lo tiene, así que
            el aviso pasó a ser fijo — y con él se pierde esa propiedad.

            Para que no quede como leyenda, lo que se declara es lo que se PUEDE
            comprobar mirando la pantalla: que no hay paneles. */}
        <Label as="div">
          Esta vista muestra qué pestañas ve el rol · no sus paneles ni sus cifras
        </Label>
        <Label as="div">
          §7.2 pide la composición por rol · la ruta devuelve las pestañas y no los paneles,
          y no hay otra que acepte el rol como lente
        </Label>
        <Label as="div">
          El recorte por pestaña lo hizo el servidor · `roles.tab_ids`
        </Label>
      </div>
    </div>
  )
}
