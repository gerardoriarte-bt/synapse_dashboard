/** B2 · el lienzo de composición · F4.9
 *
 *  La propuesta aprobada está en `docs/PROPUESTA-CANVAS-2026-09-15.md`, revisada
 *  contra el frame `B2 · Canvas de composición` del `.pen`. Acá va lo que hay que
 *  saber para leer el código.
 *
 *  ── LAS CELDAS SON ELEMENTOS, Y ESO EVITA TODA LA MATEMÁTICA DE PÍXELES ─────
 *
 *  El lienzo pinta **12 × N celdas reales** detrás de los paneles, y cada una es
 *  su propio destino de soltado. Así «en qué celda cayó el cursor» lo contesta el
 *  navegador y no una cuenta con `getBoundingClientRect`, que además haría falta
 *  recalcular en cada scroll y cada resize.
 *
 *  Y esas mismas celdas **son las guías** que §7.2 pide —«grilla de 12 visible
 *  con guías»— y que el `.pen` dibuja como `col1..col12` y `fila1..fila11`. Una
 *  cosa sirve para las dos.
 *
 *  ── LA FILA NO EXISTE EN EL MODELO ──────────────────────────────────────────
 *
 *  `PanelConfigurado` no tiene `rowStart`: la fila la resuelve la colocación
 *  automática y el único control es el ORDEN. Así que soltar en una fila se
 *  traduce a una posición del arreglo · `ordenPara` en `disposicion.ts`.
 *
 *  **Consecuencia que conviene ver:** no se puede dejar un hueco a propósito. Los
 *  huecos que se ven son los que la colocación dejó, y por eso se derivan en vez
 *  de guardarse.
 *
 *  ── LA COLISIÓN NOMBRA AL PANEL ─────────────────────────────────────────────
 *
 *  «SE SOLAPA CON "DOCE MESES" · NO SE PUEDE SOLTAR AQUÍ», dice el `.pen`.
 *  Nombrarlo es la diferencia entre «no podés» y «movete tres columnas», y es
 *  toda la razón por la que `choqueCon` devuelve un índice y no un booleano.
 *
 *  ── EL TECLADO NO ES UN ACCESORIO ───────────────────────────────────────────
 *
 *  Flechas mueven, `shift` + flechas redimensionan, `Escape` deselecciona. No es
 *  solo accesibilidad: **es la forma de colocar con precisión**, que es lo que un
 *  builder de layouts necesita. Y las reglas son las mismas que con el mouse —
 *  el teclado no es una puerta trasera a un estado que el arrastre no permite.
 *
 *  ── LO QUE NO SE IMPLEMENTÓ, CON LA RAZÓN ───────────────────────────────────
 *
 *  **El arrastre continuo del handle.** Los handles redimensionan de a una celda
 *  por pulsación, y `shift` + flechas hace lo mismo. Un arrastre continuo que
 *  termina redondeando a la celda no agrega ninguna posición alcanzable: agrega
 *  la sensación del gesto. Queda anotado como lo que es — una mejora de
 *  interacción, no una capacidad que falte.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { COLUMNS } from '../../render/grid'
import { choqueCon, disposicion, huecos, ordenPara } from './disposicion'
import type { PanelDeBorrador } from './borrador'
import type { Metric } from '../../api/types'
import type { BlockTable } from '../../catalog/blocks'

/** Alto de fila del `.pen`: «FILA BASE 80» más el gap de 16. Es el mismo 96 del
 *  que sale `px = 96·N − 16`, escrito una sola vez. */
const FILA = 96

type Props = {
  panels: readonly PanelDeBorrador[]
  tabla: BlockTable
  metricas: readonly Pick<Metric, 'id' | 'nombre'>[]
  seleccionado: number | null
  onSeleccionar: (indice: number | null) => void
  /** Mover un panel · `colStart` nuevo y posición nueva en el orden. */
  onReubicar: (indice: number, colStart: number, indiceDestino: number) => void
  onRedimensionar: (indice: number, campo: 'colSpan' | 'rowSpan', delta: number) => void
  /** Soltar un tipo de la biblioteca en una celda. */
  onSoltarTipo: (tipo: string, colStart: number, indiceDestino: number) => void
  /** Qué tipo viene en el aire, para saber su ancho antes de soltarlo. */
  arrastrando: string | null
}

export function Canvas({
  panels,
  tabla,
  metricas,
  seleccionado,
  onSeleccionar,
  onReubicar,
  onRedimensionar,
  onSoltarTipo,
  arrastrando,
}: Props) {
  /** La celda bajo el cursor mientras se arrastra. **Solo para la vista previa
   *  del span** —«Span al soltar» en el `.pen`—: no decide nada, porque las
   *  decisiones salen del dato del soltado. */
  const [sobre, setSobre] = useState<{ col: number; fila: number } | null>(null)

  const colocaciones = disposicion(panels)
  const libres = huecos(colocaciones)
  const filas = Math.max(4, colocaciones.reduce((m, c) => Math.max(m, c.filaInicio + c.rowSpan - 1), 0) + 2)
  const nombre = (id: string) =>
    id === '' ? 'Sin métrica' : (metricas.find((m) => m.id === id)?.nombre ?? '—')

  /** El span de lo que se suelta.
   *
   *  **Sale del DATO del soltado y no del estado `arrastrando`.** Ese estado
   *  existe para que la biblioteca marque el ítem en vuelo, y puede quedar
   *  desfasado —un `dragend` perdido, un arrastre iniciado fuera de la
   *  biblioteca—. La guarda del borde y la de colisión no pueden depender de
   *  algo que a veces miente: lo que el navegador entrega al soltar es el único
   *  dato confiable. Lo encontró una prueba que soltaba sin pasar por la
   *  biblioteca y pasaba igual. */
  const spanDe = (movido: number | null, tipo: string): { colSpan: number; rowSpan: number } => {
    if (movido !== null) {
      const p = panels[movido]
      return { colSpan: p?.colSpan ?? 3, rowSpan: p?.rowSpan ?? 4 }
    }
    // «EL SPAN SE AJUSTA AL RANGO DEL TIPO» · el mínimo del bloque.
    const b = tabla.get(tipo as never)
    return { colSpan: b?.colSpanMin ?? 3, rowSpan: b?.rowSpanMin ?? 4 }
  }

  /** Qué impide soltar en esta celda · `null` si se puede. */
  const impedimento = (
    col: number,
    fila: number,
    movido: number | null,
    tipo: string,
  ): string | null => {
    const { colSpan, rowSpan } = spanDe(movido, tipo)
    if (col + colSpan - 1 > COLUMNS) return 'No entra · se pasa del borde de la grilla'
    const choque = choqueCon(
      colocaciones,
      { colStart: col, colSpan, filaInicio: fila, rowSpan },
      movido ?? -1,
    )
    if (choque === null) return null
    const conQuien = panels[choque]
    return `Se solapa con «${nombre(conQuien?.metricId ?? '')}» · no se puede soltar aquí`
  }

  const soltar = (col: number, fila: number, e: React.DragEvent) => {
    e.preventDefault()
    const dato = e.dataTransfer.getData('text/plain')
    // Un índice numérico es un panel que ya existe; cualquier otra cosa es un
    // tipo que viene de la biblioteca.
    const movido = /^\d+$/.test(dato) ? Number(dato) : null
    if (impedimento(col, fila, movido, dato) !== null) return

    const destino = ordenPara(colocaciones, fila, movido ?? -1)
    if (movido === null) onSoltarTipo(dato, col, destino)
    else onReubicar(movido, col, destino)
  }

  const teclas = (e: React.KeyboardEvent, indice: number) => {
    const p = panels[indice]
    if (p === undefined) return

    if (e.key === 'Escape') {
      onSeleccionar(null)
      return
    }
    const horizontal = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
    const vertical = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0
    if (horizontal === 0 && vertical === 0) return
    e.preventDefault()

    // **Shift redimensiona, sin shift mueve** · y las dos en unidades de grilla.
    if (e.shiftKey) {
      if (horizontal !== 0) onRedimensionar(indice, 'colSpan', horizontal)
      else onRedimensionar(indice, 'rowSpan', vertical)
      return
    }

    const actual = colocaciones.find((c) => c.indice === indice)
    if (actual === undefined) return

    if (horizontal !== 0) {
      const col = actual.colStart + horizontal
      // **Las mismas reglas que con el mouse.** El teclado no alcanza un estado
      // que el arrastre no permita.
      if (col < 1 || impedimento(col, actual.filaInicio, indice, p.tipo) !== null) return
      onReubicar(indice, col, ordenPara(colocaciones, actual.filaInicio, indice))
      return
    }

    const fila = Math.max(1, actual.filaInicio + vertical)
    if (impedimento(actual.colStart, fila, indice, p.tipo) !== null) return
    onReubicar(indice, actual.colStart, ordenPara(colocaciones, fila, indice))
  }

  return (
    <div className="flex-1 flex flex-col gap-2">
      {/* La regla del `.pen`, literal: son los números con los que se compone. */}
      <div className="flex items-center gap-6">
        <Label as="div">Grilla 12 · columna 80 · gap 16 · fila base 80</Label>
        <Label as="div">El alto se declara en rowSpan · nunca en píxeles</Label>
      </div>

      <div
        role="grid"
        aria-label="Lienzo de composición"
        className="relative w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${String(COLUMNS)}, 1fr)`,
          gridAutoRows: `${String(FILA)}px`,
          gap: '16px',
        }}
      >
        {/* Las guías · son las celdas de soltado y se ven. Una cosa para las dos. */}
        {Array.from({ length: filas }, (_, f) =>
          Array.from({ length: COLUMNS }, (_, c) => {
            const col = c + 1
            const fila = f + 1
            return (
              <div
                key={`${String(fila)}-${String(col)}`}
                role="gridcell"
                aria-label={`Columna ${String(col)}, fila ${String(fila)}`}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setSobre({ col, fila })}
                onDrop={(e) => {
                  setSobre(null)
                  soltar(col, fila, e)
                }}
                style={{ gridColumn: `${String(col)} / span 1`, gridRow: `${String(fila)} / span 1` }}
                className="border border-dashed border-w3 rounded-sm"
              />
            )
          }),
        )}

        {/* **«Span al soltar»** · el rectángulo que va a ocupar, dibujado antes
            de soltar. Es la mitad de «fácil y clara»: sin él hay que soltar para
            saber si entraba. Y dice **por qué no**, cuando no. */}
        {sobre !== null && arrastrando !== null && (() => {
          const { colSpan, rowSpan } = spanDe(null, arrastrando)
          const problema = impedimento(sobre.col, sobre.fila, null, arrastrando)
          return (
            <div
              aria-live="polite"
              style={{
                gridColumn: `${String(sobre.col)} / span ${String(Math.min(colSpan, COLUMNS - sobre.col + 1))}`,
                gridRow: `${String(sobre.fila)} / span ${String(rowSpan)}`,
              }}
              className={
                'pointer-events-none flex items-center justify-center rounded-sm border-2 ' +
                (problema === null ? 'border-acc' : 'border-w4 bg-w2')
              }
            >
              <Label>
                {problema ?? `${arrastrando} · ${String(colSpan)} × ${String(rowSpan)}`}
              </Label>
            </div>
          )
        })()}

        {/* Los huecos · derivados, con su medida como en el `.pen`.
         *
         *  **Y mientras se arrastra, dicen en cuáles ENTRA** · 2026-09-17.
         *
         *  El rectángulo de «span al soltar» ya contestaba «¿entra ACÁ?», pero
         *  hay que pasar por encima de cada celda para preguntarlo. Con el
         *  lienzo largo eso es buscar a ojo, que es lo que se reportó al usarlo.
         *
         *  Esto contesta la otra pregunta —«¿DÓNDE entra?»— antes de mover el
         *  cursor. **No mueve nada de nadie**: §7.2 dice «no se permite soltar
         *  encima», no «se reacomoda», y resaltar destinos no es reacomodar.
         *
         *  El hueco admite el tipo si su rectángulo lo contiene. No alcanza con
         *  comparar áreas: un hueco de 12 × 1 no admite un panel de 3 × 4 aunque
         *  tenga doce celdas libres. */}
        {libres.map((h) => {
          const cabe =
            arrastrando !== null &&
            (() => {
              const { colSpan, rowSpan } = spanDe(null, arrastrando)
              return h.colSpan >= colSpan && h.rowSpan >= rowSpan
            })()
          return (
            <div
              key={`hueco-${String(h.filaInicio)}-${String(h.colStart)}`}
              style={{
                gridColumn: `${String(h.colStart)} / span ${String(h.colSpan)}`,
                gridRow: `${String(h.filaInicio)} / span ${String(h.rowSpan)}`,
              }}
              className={
                'pointer-events-none flex items-center justify-center rounded-sm border border-dashed ' +
                (cabe ? 'border-acc bg-w2' : 'border-w4')
              }
            >
              <Label>
                {cabe
                  ? `Entra acá · ${String(h.colSpan)} × ${String(h.rowSpan)}`
                  : `Slot vacío · ${String(h.colSpan)} × ${String(h.rowSpan)}`}
              </Label>
            </div>
          )
        })}

        {colocaciones.map((c) => {
          const p = panels[c.indice]
          if (p === undefined) return null
          const elegido = seleccionado === c.indice
          const b = tabla.get(p.tipo as never)
          return (
            <div
              key={`panel-${String(c.indice)}`}
              draggable
              tabIndex={0}
              role="gridcell"
              aria-label={`${p.tipo} · ${nombre(p.metricId)}`}
              aria-selected={elegido}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(c.indice))
                onSeleccionar(c.indice)
              }}
              onClick={() => onSeleccionar(c.indice)}
              onKeyDown={(e) => teclas(e, c.indice)}
              style={{
                gridColumn: `${String(c.colStart)} / span ${String(c.colSpan)}`,
                gridRow: `${String(c.filaInicio)} / span ${String(c.rowSpan)}`,
              }}
              className={
                'relative rounded-xl bg-panel p-6 flex flex-col gap-1 cursor-grab ' +
                (elegido ? 'border-2 border-acc' : 'border border-w3')
              }
            >
              <Label as="div">{p.tipo}</Label>
              <span className="text-ink text-celda">{nombre(p.metricId)}</span>
              {/* La medida en unidades y en píxeles · `px = 96·N − 16`. */}
              <Label as="div">
                {`${String(c.colSpan)} × ${String(c.rowSpan)} · ${String(FILA * c.rowSpan - 16)} px de alto`}
              </Label>

              {elegido && b !== undefined && (
                // Los handles · redimensionan de a una celda. No hay arrastre
                // continuo, y no hace falta: la unidad es la grilla.
                <div className="flex gap-1">
                  {(
                    [
                      ['colSpan', -1, 'Angostar'],
                      ['colSpan', 1, 'Ensanchar'],
                      ['rowSpan', -1, 'Achicar'],
                      ['rowSpan', 1, 'Agrandar'],
                    ] as const
                  ).map(([campo, delta, texto]) => (
                    <button
                      key={texto}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRedimensionar(c.indice, campo, delta)
                      }}
                      className="text-label tracking-rotulo uppercase px-2 py-1 rounded-sm text-dim hover:bg-w3"
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
