/** La biblioteca de tipos · F4.9
 *
 *  §7.2: «Panel lateral izquierdo con la biblioteca de gráficos agrupada
 *  (Comparación · Composición · Evolución · Distribución · Estado)». El `.pen`
 *  la titula «BIBLIOTECA DE TIPOS» y le pone la instrucción arriba: «ARRASTRAR AL
 *  LIENZO · EL SPAN SE AJUSTA AL RANGO DEL TIPO».
 *
 *  **Cada ítem declara qué acepta y cuánto ocupa** —«bars · categorica · ranking
 *  · 4–8 ×4–5»—, y eso no es decoración: es lo que deja elegir el tipo antes de
 *  saber qué métrica va adentro. Sale entero de `/config/blocks`.
 *
 *  ── LOS 300px DE ANCHO NO SON UNA ELECCIÓN ──────────────────────────────────
 *
 *  §4: el builder son 1600 = **1200 de lienzo 1:1 + 300 de biblioteca**. Si la
 *  biblioteca se ensancha, el lienzo deja de estar a escala y las unidades de
 *  arrastre mienten.
 */
import { Label } from '../../render/primitives/Label'
import { agrupar } from './grupos'
import type { Block } from '../../api/types'

type Props = {
  bloques: readonly Block[]
  /** Qué tipo se está arrastrando, para que el ítem lo diga. */
  arrastrando: string | null
  onArrastrar: (tipo: string | null) => void
}

function Item({
  b,
  activo,
  onArrastrar,
}: {
  b: Block
  activo: boolean
  onArrastrar: (tipo: string | null) => void
}) {
  return (
    <li
      draggable
      aria-grabbed={activo}
      onDragStart={(e) => {
        // El tipo viaja por `dataTransfer` **y** por estado. Lo primero es lo que
        // el navegador entrega al soltar; lo segundo es lo que deja pintar el
        // lienzo mientras se arrastra, que `dataTransfer` no permite leer.
        e.dataTransfer.setData('text/plain', b.tipo)
        e.dataTransfer.effectAllowed = 'copy'
        onArrastrar(b.tipo)
      }}
      onDragEnd={() => onArrastrar(null)}
      className={
        'flex flex-col gap-1 rounded-sm px-3 py-2 cursor-grab ' +
        (activo ? 'bg-w3' : 'bg-w2 hover:bg-w3')
      }
    >
      <span className="text-ink text-celda">{b.tipo}</span>
      {/* Las formas que acepta · es la mitad que evita elegir un tipo que
          después ninguna métrica va a poder llenar. */}
      <Label as="div">{b.formasAceptadas.join(' · ')}</Label>
      <Label as="div">
        {`${String(b.colSpanMin)}–${String(b.colSpanMax)} × ${String(b.rowSpanMin)}–${String(b.rowSpanMax)}`}
      </Label>
    </li>
  )
}

export function Library({ bloques, arrastrando, onArrastrar }: Props) {
  const { grupos, sinGrupo } = agrupar(bloques)

  return (
    // **Pegada al scroll, y la razón es de uso, no de estética.**
    //
    // El lienzo mide 1200 y crece hacia abajo con cada fila; la biblioteca son
    // los 300 de al lado —§4—. Al bajar a buscar un hueco libre, la biblioteca
    // salía de pantalla y había que volver arriba, tomar el tipo, y bajar otra
    // vez arrastrando a ciegas. Reportado el 2026-09-17 al usarlo.
    //
    // `sticky` y no `fixed`: `fixed` la saca del flujo y deja de respetar el
    // ancho de la columna y el chrome de arriba. Con `sticky` sigue siendo la
    // columna izquierda y solo deja de subir.
    //
    // `max-h` + `overflow-y-auto` porque los cinco grupos con quince tipos son
    // más altos que la ventana: sin eso, pegarla esconde los últimos grupos, que
    // es cambiar un problema por otro.
    <aside
      className="w-[300px] shrink-0 flex flex-col gap-4 sticky top-6 self-start max-h-[calc(100vh-6rem)] overflow-y-auto"
      aria-label="Biblioteca de tipos"
    >
      <div className="flex flex-col gap-1">
        <Label as="div">Biblioteca de tipos</Label>
        <Label as="div">Arrastrar al lienzo · el span se ajusta al rango del tipo</Label>
      </div>

      {grupos.map(({ grupo, bloques: items }) => (
        <div key={grupo} className="flex flex-col gap-2">
          <Label as="div">{grupo}</Label>
          {items.length === 0 ? (
            // El grupo va igual, vacío y dicho: uno que desaparece se lee como
            // que no existe.
            <Label as="div">Sin tipos en este grupo</Label>
          ) : (
            <ul className="flex flex-col gap-1 m-0 p-0 list-none">
              {items.map((b) => (
                <Item key={b.tipo} b={b} activo={arrastrando === b.tipo} onArrastrar={onArrastrar} />
              ))}
            </ul>
          )}
        </div>
      ))}

      {sinGrupo.length > 0 && (
        // **Un tipo que el servicio agregó y esta tabla no conoce.** No se
        // descarta: se ofrece, y se dice que el agrupado vive en el front.
        <div className="flex flex-col gap-2">
          <Label as="div">Sin grupo · el agrupado vive en el front, no en /config/blocks</Label>
          <ul className="flex flex-col gap-1 m-0 p-0 list-none">
            {sinGrupo.map((b) => (
              <Item key={b.tipo} b={b} activo={arrastrando === b.tipo} onArrastrar={onArrastrar} />
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
