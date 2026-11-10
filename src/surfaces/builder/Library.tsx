/** La biblioteca del editor · los DATOS del cliente · 2026-11-10
 *
 *  **Era una biblioteca de tipos y pasó a ser de datos**, por decisión humana
 *  de ese día: «se centra en un gráfico y no en los datos que se quieren
 *  transmitir». Cada cliente tiene datos distintos, así que lo primero que se
 *  elige es QUÉ se muestra; el cómo sale del dato. Ver `comoMostrar.ts` y
 *  `docs/PROPUESTA-2026-11-10-biblioteca-de-datos.md`.
 *
 *  **El `.pen` dibuja lo contrario** —B2 arrastra un tipo, B3 elige el gráfico,
 *  B4 la métrica— y la divergencia está escrita en esa propuesta. §PEN:B2 · la
 *  columna izquierda del lienzo, con otro contenido.
 *
 *  **Tres decisiones del mismo día:** los datos reemplazan a los tipos; lo que
 *  no sirve para el dato se ve desactivado con su razón, no escondido; y se
 *  listan todas las métricas del catálogo del cliente.
 *
 *  ── LO QUE TODAVÍA NO PUEDE ───────────────────────────────────────────────
 *
 *  **El estado del dato y el espécimen de una métrica que no está en el
 *  lienzo.** El dato se guarda por métrica y período (`dd_panel_data`), pero el
 *  servicio sólo lo sirve a través de un panel. Para las que ya están en el
 *  lienzo se usa su dato real; para las otras, la evaluación fina —topes como
 *  el de la dona— llega al ponerlas. Pedido al backend.
 *
 *  ── EL ARRASTRE ────────────────────────────────────────────────────────────
 *
 *  **Viajan dos cosas**, y la razón es del lienzo: `text/plain` lleva el TIPO,
 *  que es lo que `Canvas` usa para calcular el tamaño y el choque mientras se
 *  arrastra; `application/x-synapse-eleccion` lleva el dato y el gráfico, que
 *  se leen al soltar. Así el lienzo no cambió su forma de medir.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { Note } from '../../render/primitives/Note'
import { COLUMNA_FIJA } from './columnaFija'
import { comoMostrar } from './comoMostrar'
import { hasValue } from '../../render/state'
import { nombreDeForma, nombreDeTipo } from './rotulos'
import type { PlotTable } from '../../catalog/plots'
import { FORMATO_ELECCION } from './eleccion'
import type { Eleccion } from './eleccion'
import type { Block, Metric, Payload, Plot } from '../../api/types'

/** Las cinco familias del contrato, con su nombre de producto y en el orden en
 *  que se leen. Una que el contrato agregue y esto no conozca va al final, con
 *  su id: mejor eso que perderla. */
const FAMILIAS: readonly { id: string; nombre: string }[] = [
  { id: 'demanda', nombre: 'Demanda' },
  { id: 'medios', nombre: 'Medios' },
  { id: 'cliente', nombre: 'Cliente' },
  { id: 'inventario', nombre: 'Inventario' },
  { id: 'externo', nombre: 'Externo' },
]

type Props = {
  metricas: readonly Metric[]
  bloques: readonly Block[]
  plots: readonly Plot[]
  repertorio: PlotTable
  /** El dato de una métrica, si ya está en el lienzo. */
  datoDe: (metricId: string) => Payload | undefined
  /** Qué tipo se está arrastrando · el lienzo lo usa para medir. */
  arrastrando: string | null
  onArrastrar: (tipo: string | null) => void
  /** Agregar sin arrastrar · al final de la pestaña. */
  onAgregar: (eleccion: Eleccion) => void
}

export function Library({
  metricas,
  bloques,
  plots,
  repertorio,
  datoDe,
  arrastrando,
  onArrastrar,
  onAgregar,
}: Props) {
  const [abierta, setAbierta] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const q = busqueda.trim().toLowerCase()
  const visibles = q === '' ? metricas : metricas.filter((m) => m.nombre.toLowerCase().includes(q))
  const conocidas = new Set(FAMILIAS.map((f) => f.id))
  const grupos = [
    ...FAMILIAS.map((f) => ({ ...f, metricas: visibles.filter((m) => m.familia === f.id) })),
    { id: 'otras', nombre: 'Otras', metricas: visibles.filter((m) => !conocidas.has(m.familia)) },
  ].filter((g) => g.metricas.length > 0)

  return (
    <aside
      className={`w-[300px] shrink-0 flex flex-col gap-4 self-start ${COLUMNA_FIJA}`}
      aria-label="Datos del cliente"
    >
      <div className="flex flex-col gap-1">
        <Label as="div">Datos del cliente</Label>
        <Ayuda>
          Elegí qué querés mostrar, y después cómo. Arrastralo al lienzo, o tocá + para agregarlo al
          final.
        </Ayuda>
      </div>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        aria-label="Buscar un dato"
        placeholder="Buscar un dato"
        // **`shrink-0`**: la columna tiene alto máximo y scroll, y sin esto un
        // `input` se encoge a la altura de su texto —medido: 16,5 en vez de 32—.
        className="h-8 shrink-0 rounded-md border border-w4 bg-transparent px-3 font-body text-celda text-ink placeholder:text-dim"
      />

      {metricas.length === 0 ? (
        <Ayuda>Este cliente todavía no tiene datos en su catálogo.</Ayuda>
      ) : grupos.length === 0 ? (
        <Ayuda>{`Ningún dato se llama «${busqueda.trim()}».`}</Ayuda>
      ) : (
        grupos.map((g) => (
          <div key={g.id} className="flex flex-col gap-2">
            <Label as="div">{g.nombre}</Label>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {g.metricas.map((m) => (
                <Dato
                  key={m.id}
                  metrica={m}
                  abierto={abierta === m.id}
                  onAbrir={() => setAbierta(abierta === m.id ? null : m.id)}
                  formas={comoMostrar(m, bloques, plots, repertorio, datoDe(m.id))}
                  // **Con VALOR, no con payload**: un panel bloqueado también trae
                  // payload, y sin cifra no hay tope que evaluar. Visto en local.
                  conDato={(() => {
                    const d = datoDe(m.id)
                    return d !== undefined && hasValue(d)
                  })()}
                  arrastrando={arrastrando}
                  onArrastrar={onArrastrar}
                  onAgregar={onAgregar}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </aside>
  )
}

function Dato({
  metrica,
  abierto,
  onAbrir,
  formas,
  conDato,
  arrastrando,
  onArrastrar,
  onAgregar,
}: {
  metrica: Metric
  abierto: boolean
  onAbrir: () => void
  formas: ReturnType<typeof comoMostrar>
  conDato: boolean
  arrastrando: string | null
  onArrastrar: (tipo: string | null) => void
  onAgregar: (eleccion: Eleccion) => void
}) {
  const disponibles = formas.filter((f) => f.razon === null)
  const otras = formas.filter((f) => f.razon !== null)

  return (
    <li className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={abierto}
        onClick={onAbrir}
        className={
          'flex w-full cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2 text-left ' +
          (abierto ? 'border-acc bg-w2' : 'border-w4 bg-panel hover:bg-w2')
        }
      >
        <span className="font-body text-cuerpo font-semibold text-ink">{metrica.nombre}</span>
        {/* La forma del dato, que es lo que decide cómo se puede mostrar. La
            base va adentro, al abrirlo. */}
        <Label as="span">{nombreDeForma(metrica.forma)}</Label>
      </button>

      {abierto && (
        <div
          className="flex flex-col gap-3 border-l border-w4 pl-3"
          aria-label={`Cómo mostrar ${metrica.nombre}`}
          role="group"
        >
          {/* **La base, recién acá** · cerrada ocupaba tres o cuatro líneas en
              mayúsculas por dato, y la lista se volvía larguísima —visto en
              pantalla—. Con el dato abierto es lo que confirma que es ése. */}
          {metrica.base !== '' && <Note as="div">{metrica.base}</Note>}
          <Label as="div">Cómo se puede mostrar</Label>
          {!conDato && (
            <Ayuda>
              Sin el dato a mano se elige por su forma. Los topes de cada gráfico se revisan al
              ponerlo en el lienzo.
            </Ayuda>
          )}
          {disponibles.length === 0 && (
            <Ayuda>Ningún tipo de panel dibuja este dato todavía.</Ayuda>
          )}
          {disponibles.map((f) => (
            <div key={f.tipo} className="flex flex-col gap-1">
              <Label as="div">{nombreDeTipo(f.tipo)}</Label>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {f.opciones.map((o) => {
                  const eleccion: Eleccion = {
                    metricId: metrica.id,
                    tipo: f.tipo,
                    ...(o.grafico === undefined ? {} : { grafico: o.grafico }),
                  }
                  const usable = o.razon === null
                  return (
                    <li
                      key={o.grafico ?? 'por-defecto'}
                      draggable={usable}
                      aria-disabled={!usable}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', f.tipo)
                        e.dataTransfer.setData(FORMATO_ELECCION, JSON.stringify(eleccion))
                        e.dataTransfer.effectAllowed = 'copy'
                        onArrastrar(f.tipo)
                      }}
                      onDragEnd={() => onArrastrar(null)}
                      className={
                        'flex items-center gap-2 rounded-md border px-3 py-2 ' +
                        (!usable
                          ? 'border-w3 opacity-60'
                          : arrastrando === f.tipo
                            ? 'cursor-grab border-acc bg-w2'
                            : 'cursor-grab border-w4 bg-panel hover:bg-w2')
                      }
                    >
                      <span className="flex min-w-0 flex-col">
                        <span
                          className={'font-body text-celda ' + (usable ? 'text-ink' : 'text-dim')}
                        >
                          {o.nombre}
                        </span>
                        {!usable && <Note as="span">{o.razon}</Note>}
                      </span>
                      {usable && (
                        <div className="ml-auto">
                          <Accion
                            tamano="compacta"
                            onClick={() => onAgregar(eleccion)}
                            etiqueta={`Agregar ${metrica.nombre} como ${o.nombre}`}
                          >
                            +
                          </Accion>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {otras.length > 0 && (
            // **Desactivados y explicados**, plegados: se ven si se buscan, y no
            // empujan lo que sí sirve fuera de la pantalla.
            <details className="flex flex-col gap-1">
              <summary className="cursor-pointer font-body text-celda text-dim">
                {`${String(otras.length)} tipos no sirven para este dato`}
              </summary>
              <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                {otras.map((f) => (
                  <li
                    key={f.tipo}
                    aria-disabled
                    className="flex flex-col gap-0.5 rounded-md border border-w3 px-3 py-2 opacity-60"
                  >
                    <span className="font-body text-celda text-dim">{nombreDeTipo(f.tipo)}</span>
                    <Note as="span">{f.razon}</Note>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </li>
  )
}
