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
 *  ── EL DATO DE CADA MÉTRICA · 2026-11-10 ──────────────────────────────────
 *
 *  **Desde `a80c318` el servicio da el dato de todo el catálogo**, esté o no en
 *  el lienzo —pedido ese mismo día—. Con él la lista dice qué datos no tienen
 *  cifra en el período, y los topes de cada gráfico —la dona con más de cinco
 *  partes— se revisan antes de soltar. Contra un servicio sin la ruta queda lo
 *  de antes: el dato de lo que ya está en el lienzo.
 *
 *  **Sin cifra no es desactivado.** La decisión fue listar todas, con su
 *  estado: un dato sin cifra este mes se puede poner igual, y el panel lo dice
 *  hasta que la tenga.
 *
 *  **Lo que todavía no hace: el espécimen**, cada opción dibujada con la cifra
 *  real, que B3 del `.pen` pide. Falta definir su tamaño en una columna de 300
 *  · punto 3 de `docs/PROPUESTA-2026-11-10-biblioteca-de-datos.md`.
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
  /** El dato de una métrica en el período · de todo el catálogo cuando el
   *  servicio lo da, o sólo de lo que ya está en el lienzo. */
  datoDe: (metricId: string) => Payload | undefined
  /** El mes de ese dato, legible —«octubre de 2026»—. Ausente: no se tiene el
   *  dato de todo el catálogo, y la lista no promete un estado que no sabe. */
  periodo?: string
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
  periodo,
  arrastrando,
  onArrastrar,
  onAgregar,
}: Props) {
  const [abierta, setAbierta] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  // **Ninguno con cifra se dice UNA vez**, arriba · visto en local el
  // 2026-11-10: el editor pide el mes en curso, que todavía no tenía dato, y
  // las 33 decían «sin cifra en noviembre 2026». Repetido en todas no
  // distingue nada; marcar cada una sirve cuando unas tienen y otras no.
  const conocidos = metricas.filter((m) => datoDe(m.id) !== undefined)
  const ningunaConCifra =
    conocidos.length > 0 && conocidos.every((m) => {
      const d = datoDe(m.id)
      return d === undefined || !hasValue(d)
    })

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
        {ningunaConCifra ? (
          <Ayuda>
            {`${periodo === undefined ? 'En este período' : `En ${periodo}`} ningún dato tiene cifra todavía. Se pueden poner igual: cada panel lo dice hasta que la tenga.`}
          </Ayuda>
        ) : (
          periodo !== undefined && <Ayuda>{`El estado de cada dato es el de ${periodo}.`}</Ayuda>
        )}
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
                  dato={datoDe(m.id)}
                  periodo={periodo}
                  marcarSinCifra={!ningunaConCifra}
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
  dato,
  periodo,
  marcarSinCifra,
  arrastrando,
  onArrastrar,
  onAgregar,
}: {
  metrica: Metric
  abierto: boolean
  onAbrir: () => void
  formas: ReturnType<typeof comoMostrar>
  /** `undefined`: no se sabe. Con payload y sin cifra: se sabe que no hay. */
  dato: Payload | undefined
  periodo: string | undefined
  /** Si se marca en la lista · no cuando ninguno tiene cifra: ver arriba. */
  marcarSinCifra: boolean
  arrastrando: string | null
  onArrastrar: (tipo: string | null) => void
  onAgregar: (eleccion: Eleccion) => void
}) {
  const disponibles = formas.filter((f) => f.razon === null)
  const otras = formas.filter((f) => f.razon !== null)
  // **Con VALOR, no con payload**: un dato bloqueado también trae payload, y
  // sin cifra no hay tope que evaluar. Visto en local.
  const conDato = dato !== undefined && hasValue(dato)
  const sinCifra = dato !== undefined && !conDato
  const enElMes = periodo === undefined ? 'en el período' : `en ${periodo}`

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
        <span className={'font-body text-cuerpo font-semibold ' + (sinCifra && marcarSinCifra ? 'text-dim' : 'text-ink')}>
          {metrica.nombre}
        </span>
        {/* La forma del dato, que es lo que decide cómo se puede mostrar. La
            base va adentro, al abrirlo. **Y si no tiene cifra este mes, se dice
            acá**, sin abrirlo: es lo que se viene a buscar. */}
        <Label as="span">
          {sinCifra && marcarSinCifra ? `${nombreDeForma(metrica.forma)} · Sin cifra` : nombreDeForma(metrica.forma)}
        </Label>
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
          {dato === undefined && (
            <Ayuda>
              Sin el dato a mano se elige por su forma. Los topes de cada gráfico se revisan al
              ponerlo en el lienzo.
            </Ayuda>
          )}
          {sinCifra && (
            <Ayuda>
              {`${razonDe(dato) ?? `No tiene cifra ${enElMes}`}. Se puede poner igual: el panel lo dice hasta que la tenga, y los topes de cada gráfico se revisan cuando llegue.`}
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

/** Por qué un dato no tiene cifra, con las palabras del servicio. Sin punto
 *  final: la frase sigue. */
function razonDe(dato: Payload | undefined): string | null {
  if (dato === undefined || !('razon' in dato) || typeof dato.razon !== 'string' || dato.razon === '') return null
  return dato.razon.replace(/\.\s*$/, '')
}
