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
 *  ── MOVER Y ESTIRAR CON EL MOUSE · 2026-11-10 ──────────────────────────────
 *
 *  Acá decía que el arrastre continuo de los handles «no agrega ninguna
 *  posición alcanzable, agrega la sensación del gesto». **Usado, no alcanzaba**:
 *  pedido del humano ese día, «refinar la grilla … para mover y ajustar los
 *  tamaños», y medido en local:
 *
 *  - **Correr un panel una columna con el mouse no se podía.** El cursor
 *    terminaba encima del propio panel, que no aceptaba soltar. Ahora, mientras
 *    algo vuela, los paneles dejan pasar el puntero a las celdas de abajo.
 *  - **El panel caía con la esquina en la celda del cursor**, sin importar de
 *    dónde se lo agarró · `celdaAgarrada`.
 *  - **Mover no mostraba dónde iba a caer**: el rectángulo sólo salía para lo
 *    que venía de la biblioteca.
 *  - **Un «Ancho +» en una fila llena bajó a dos paneles de fila**, y con el
 *    guardado automático quedó guardado. Decisión humana: **un tamaño que no
 *    entra se bloquea y se avisa**, no empuja · `cambioDeTamano`.
 *
 *  **Las asas son cinco de las ocho del `.pen`**: derecha, izquierda, abajo y
 *  las dos esquinas de abajo. Las tres de arriba no, y la razón es el modelo:
 *  la fila no se guarda, así que el borde de arriba lo decide la colocación y
 *  no hay qué estirar.
 *
 *  **§PEN:B2** · B2 · «Canvas de composición».
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { nombreDeTipo } from './rotulos'
import { COLUMNS, GAP, ROW } from '../../render/grid'
import {
  FORMATO_AGARRE,
  cambioDeTamano,
  celdaAgarrada,
  choqueCon,
  disposicion,
  huecos,
  leerAgarre,
  ordenPara,
} from './disposicion'
import type { Medida } from './disposicion'
import { Accion } from '../../render/primitives/Accion'
import type { PanelDeBorrador } from './borrador'
import { FORMATO_ELECCION, leerEleccion } from './eleccion'
import type { Eleccion } from './eleccion'
import type { Metric } from '../../api/types'
import type { BlockTable } from '../../catalog/blocks'

type Props = {
  panels: readonly PanelDeBorrador[]
  tabla: BlockTable
  metricas: readonly Pick<Metric, 'id' | 'nombre'>[]
  seleccionado: number | null
  onSeleccionar: (indice: number | null) => void
  /** Mover un panel · `colStart` nuevo y posición nueva en el orden. */
  onReubicar: (indice: number, colStart: number, indiceDestino: number) => void
  /** **Una medida ya validada** · columna, ancho y alto juntos. El lienzo
   *  aplica la regla —rango, borde, que nadie más se mueva— antes de llamar. */
  onAjustar: (indice: number, medida: Medida) => void
  /** Soltar un tipo de la biblioteca en una celda. */
  /** `eleccion` trae el dato y el gráfico cuando el arrastre vino de la
   *  biblioteca · ver `eleccion.ts`. */
  onSoltarTipo: (tipo: string, colStart: number, indiceDestino: number, eleccion: Eleccion | null) => void
  /** Qué tipo viene en el aire, para saber su ancho antes de soltarlo. */
  arrastrando: string | null
  /** **La versión publicada no se edita en el lugar** · 2026-10-07. Sin
   *  arrastre, sin teclas que muevan y sin controles de tamaño: se mira. */
  soloLectura?: boolean
  /** **El panel dibujado con su dato** · 2026-10-07, D1 de
   *  `docs/AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`: «es como
   *  construir de memoria». Lo resuelve el contenedor —tiene el dato, el
   *  catálogo y el repertorio— y el lienzo sólo lo ubica. Sin él, la ficha. */
  dibujar?: (indice: number) => ReactNode
  /** El nombre del gráfico elegido · la ficha decía el BLOQUE —«Barras»— de un
   *  panel que se dibuja como anillo. Visto en pantalla el 2026-10-07. */
  nombreDeGrafico?: (id: string) => string
  /** Cambia cuando la configuración se abre más o menos: el lienzo se corrió y
   *  el panel elegido se vuelve a traer a la vista. */
  encuadre?: string
  /** **Deshacer y rehacer** · 2026-11-10. `null` es «no hay nada»: el botón se
   *  ve apagado, que dice que existe. */
  deshacer?: { onDeshacer: (() => void) | null; onRehacer: (() => void) | null }
}

/** Desde qué borde se estira · las cinco asas. */
type Borde = 'e' | 'o' | 's' | 'se' | 'so'

const ASAS: readonly { borde: Borde; clase: string }[] = [
  { borde: 'e', clase: '-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize' },
  { borde: 'o', clase: '-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize' },
  { borde: 's', clase: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
  { borde: 'se', clase: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
  { borde: 'so', clase: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
]

/** El paso de una columna cuando el lienzo no tiene medida —jsdom—: la columna
 *  de 80 y la separación de 16 del `.pen`. */
const PASO_POR_DEFECTO = 96

type Estiramiento = {
  indice: number
  borde: Borde
  x0: number
  y0: number
  inicial: Medida
  propuesta: Medida
  /** El rango del tipo, cuando la propuesta se topó con él. */
  tope: string | null
}

export function Canvas({
  panels,
  tabla,
  metricas,
  seleccionado,
  onSeleccionar,
  onReubicar,
  onSoltarTipo,
  arrastrando,
  soloLectura = false,
  dibujar,
  nombreDeGrafico,
  encuadre,
  onAjustar,
  deshacer,
}: Props) {
  /** **El panel elegido, a la vista** · D6 del 2026-10-07. Las columnas de la
   *  configuración corren el lienzo hacia la derecha, y el panel que se está
   *  configurando no puede quedar fuera de la pantalla: es lo que hay que
   *  mirar. `scrollIntoView` no existe en jsdom; ahí no hace falta. */
  const grilla = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (seleccionado === null) return
    const el = grilla.current?.querySelector<HTMLElement>(`[data-panel="${String(seleccionado)}"]`)
    if (el !== null && el !== undefined && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    }
  }, [seleccionado, encuadre])
  /** La celda bajo el cursor mientras se arrastra. **Solo para la vista previa
   *  del span** —«Span al soltar» en el `.pen`—: no decide nada, porque las
   *  decisiones salen del dato del soltado. */
  const [sobre, setSobre] = useState<{ col: number; fila: number } | null>(null)
  /** El panel que se está moviendo y de qué celda se lo agarró. Sólo para
   *  DIBUJAR —el rectángulo, el panel levantado, el puntero que pasa—: al
   *  soltar manda lo que viaja en el arrastre. */
  const [moviendo, setMoviendo] = useState<{ indice: number; dCol: number; dFila: number } | null>(null)
  const [estirando, setEstirando] = useState<Estiramiento | null>(null)
  /** Por qué no se aplicó el último cambio de tamaño · se dice junto a los
   *  controles del panel, que es donde se miró. */
  const [aviso, setAviso] = useState<{ indice: number; texto: string } | null>(null)
  useEffect(() => setAviso(null), [seleccionado])

  const colocaciones = disposicion(panels)
  const libres = huecos(
    moviendo === null ? colocaciones : colocaciones.filter((c) => c.indice !== moviendo.indice),
  )
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

  /** Lo que está en el aire, con su medida y de dónde se lo agarró · `null`
   *  si no vuela nada. Un panel que se mueve y un tipo de la biblioteca se
   *  dibujan igual: el rectángulo, y la razón cuando no entra. */
  const enVuelo = (() => {
    if (moviendo !== null) {
      const p = panels[moviendo.indice]
      const c = colocaciones.find((x) => x.indice === moviendo.indice)
      if (p === undefined || c === undefined) return null
      return { ...moviendo, movido: moviendo.indice, tipo: p.tipo, colSpan: c.colSpan, rowSpan: c.rowSpan, rotulo: nombre(p.metricId) }
    }
    if (arrastrando === null) return null
    const { colSpan, rowSpan } = spanDe(null, arrastrando)
    return { dCol: 0, dFila: 0, movido: null, tipo: arrastrando, colSpan, rowSpan, rotulo: nombreDeTipo(arrastrando) }
  })()

  const soltar = (celdaCol: number, celdaFila: number, e: React.DragEvent) => {
    e.preventDefault()
    setMoviendo(null)
    if (soloLectura) return
    const dato = e.dataTransfer.getData('text/plain')
    // Un índice numérico es un panel que ya existe; cualquier otra cosa es un
    // tipo que viene de la biblioteca.
    const movido = /^\d+$/.test(dato) ? Number(dato) : null
    // **La celda del cursor no es la esquina** · se descuenta de dónde se lo
    // agarró. Lo de la biblioteca no trae agarre: cae por la esquina.
    const ag = movido === null ? { dCol: 0, dFila: 0 } : leerAgarre(e.dataTransfer.getData(FORMATO_AGARRE))
    const col = Math.max(1, celdaCol - ag.dCol)
    const fila = Math.max(1, celdaFila - ag.dFila)
    if (impedimento(col, fila, movido, dato) !== null) return

    const destino = ordenPara(colocaciones, fila, movido ?? -1)
    // **El dato y el gráfico viajan aparte** · 2026-11-10, ver `Library.tsx`:
    // el tipo sigue en `text/plain` porque es con lo que esta función mide.
    if (movido === null) onSoltarTipo(dato, col, destino, leerEleccion(e.dataTransfer.getData(FORMATO_ELECCION), dato))
    else onReubicar(movido, col, destino)
  }

  /** **Toda medida nueva pasa por acá**: los botones, `shift` + flechas y las
   *  asas. Si no entra, no se aplica y se dice por qué. */
  const razonDeTamano = (indice: number, medida: Medida): string | null => {
    const p = panels[indice]
    if (p === undefined) return null
    const b = tabla.get(p.tipo as never)
    return cambioDeTamano(panels, indice, medida, {
      ...(b === undefined ? {} : { rango: b }),
      tipo: nombreDeTipo(p.tipo),
      nombre: (i) => nombre(panels[i]?.metricId ?? ''),
    })
  }
  const intentar = (indice: number, medida: Medida) => {
    const razon = razonDeTamano(indice, medida)
    if (razon !== null) {
      setAviso({ indice, texto: razon })
      return
    }
    setAviso(null)
    onAjustar(indice, medida)
  }
  const medidaDe = (indice: number): Medida | null => {
    const c = colocaciones.find((x) => x.indice === indice)
    return c === undefined ? null : { colStart: c.colStart, colSpan: c.colSpan, rowSpan: c.rowSpan }
  }

  /** La medida que propone el asa a esta altura del gesto · acotada al rango
   *  del tipo y a la grilla, y con el tope dicho si se llegó a él. Acotar y no
   *  rechazar es lo que hace que estirar «de más» deje el panel en su máximo. */
  const medirEstiramiento = (est: Estiramiento, x: number, y: number): Pick<Estiramiento, 'propuesta' | 'tope'> => {
    const ancho = grilla.current?.getBoundingClientRect().width ?? 0
    const pasoX = ancho > 0 ? (ancho + GAP) / COLUMNS : PASO_POR_DEFECTO
    const dC = Math.round((x - est.x0) / pasoX)
    const dF = Math.round((y - est.y0) / (ROW + GAP))
    const p = panels[est.indice]
    const b = p === undefined ? undefined : tabla.get(p.tipo as never)
    const colMin = b?.colSpanMin ?? 1
    const colMax = b?.colSpanMax ?? COLUMNS
    const filaMin = b?.rowSpanMin ?? 1
    const filaMax = b?.rowSpanMax ?? 99
    const { inicial, borde } = est
    const tipo = nombreDeTipo(p?.tipo ?? '')
    let tope: string | null = null
    const acotar = (v: number, min: number, max: number, deGrilla: number, unidad: 'columnas' | 'filas') => {
      if (v < min || v > max) tope = `«${tipo}» ocupa entre ${String(min)} y ${String(max)} ${unidad}`
      else if (v > deGrilla) tope = 'Llega al borde de la grilla'
      return Math.max(min, Math.min(max, deGrilla, v))
    }
    let { colStart, colSpan, rowSpan } = inicial
    if (borde === 'e' || borde === 'se') {
      colSpan = acotar(inicial.colSpan + dC, colMin, colMax, COLUMNS - colStart + 1, 'columnas')
    }
    if (borde === 'o' || borde === 'so') {
      // El borde derecho queda quieto: se mueven la columna y el ancho juntos.
      const derecha = inicial.colStart + inicial.colSpan
      colSpan = acotar(inicial.colSpan - dC, colMin, colMax, derecha - 1, 'columnas')
      colStart = derecha - colSpan
    }
    if (borde === 's' || borde === 'se' || borde === 'so') {
      rowSpan = acotar(inicial.rowSpan + dF, filaMin, filaMax, filaMax, 'filas')
    }
    return { propuesta: { colStart, colSpan, rowSpan }, tope }
  }

  // **El gesto se sigue en la ventana**, no en el asa: el cursor sale de ella
  // en cuanto se estira una celda. Con el mouse y no con el arrastre de HTML,
  // que es para llevar algo a un destino y acá no hay destino.
  useEffect(() => {
    if (estirando === null) return
    const mover = (e: MouseEvent) => {
      setEstirando((est) => (est === null ? null : { ...est, ...medirEstiramiento(est, e.clientX, e.clientY) }))
    }
    const terminar = (e: MouseEvent) => {
      const { propuesta } = medirEstiramiento(estirando, e.clientX, e.clientY)
      setEstirando(null)
      const { inicial } = estirando
      if (
        propuesta.colStart === inicial.colStart &&
        propuesta.colSpan === inicial.colSpan &&
        propuesta.rowSpan === inicial.rowSpan
      )
        return
      intentar(estirando.indice, propuesta)
    }
    window.addEventListener('mousemove', mover)
    window.addEventListener('mouseup', terminar)
    return () => {
      window.removeEventListener('mousemove', mover)
      window.removeEventListener('mouseup', terminar)
    }
    // Las funciones se rehacen en cada render; lo que cambia el gesto es
    // `estirando`, y con él se vuelve a suscribir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estirando])

  const teclas = (e: React.KeyboardEvent, indice: number) => {
    const p = panels[indice]
    if (p === undefined || soloLectura) return

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
      const m = medidaDe(indice)
      if (m === null) return
      intentar(
        indice,
        horizontal !== 0 ? { ...m, colSpan: m.colSpan + horizontal } : { ...m, rowSpan: m.rowSpan + vertical },
      )
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
      {/* **D7 de la auditoría del 2026-10-06**: las reglas de la grilla —«GRILLA
          12 · COLUMNA 80 · GAP 16», «EL ALTO SE DECLARA EN rowSpan»— son
          literales del `.pen`, pero hablan del handoff y no de quien compone:
          `rowSpan` es un nombre de campo. El humano dejó la decisión a la
          usabilidad, y lo que sirve acá es decir los gestos, en una frase.

          El gesto de mover tiene historia: reportado el 2026-09-17, «no veo la
          capacidad de mover un bloque». Estaba, y nada lo anunciaba. */}
      {!soloLectura && (
        <div className="flex items-start gap-4">
          <Ayuda>
            Arrastrá un dato de la biblioteca a un espacio libre. Elegí un panel para configurarlo:
            arrastralo para moverlo, o usá las flechas. Para cambiar su tamaño, estiralo desde sus
            bordes; con Shift y las flechas cambiás su tamaño de a una celda.
          </Ayuda>
          {/* **Deshacer, porque el borrador se guarda solo** · 2026-11-10. Un
              cambio que desacomodó el lienzo quedaba guardado sin vuelta. */}
          {deshacer !== undefined && (
            <div className="ml-auto flex gap-2">
              <Accion
                tamano="compacta"
                deshabilitada={deshacer.onDeshacer === null}
                onClick={() => deshacer.onDeshacer?.()}
                etiqueta="Deshacer · Cmd o Ctrl + Z"
              >
                Deshacer
              </Accion>
              <Accion
                tamano="compacta"
                deshabilitada={deshacer.onRehacer === null}
                onClick={() => deshacer.onRehacer?.()}
                etiqueta="Rehacer · Cmd o Ctrl + Shift + Z"
              >
                Rehacer
              </Accion>
            </div>
          )}
        </div>
      )}

      <div
        ref={grilla}
        role="grid"
        aria-label="Lienzo de composición"
        className="relative w-full"
        // **Filas de 80 y separación de 16, las de la consola** · corregido el
        // 2026-10-07. Eran filas de 96 MÁS la separación de 16: el espacio
        // entre filas se contaba dos veces y un panel de 4 filas medía 432 en
        // vez de los 368 de `96·N − 16`. Con la ficha no se notaba; con el panel
        // real adentro quedaba un hueco abajo. Las constantes son las de
        // `render/grid`, para que el lienzo no pueda volver a medir distinto.
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${String(COLUMNS)}, minmax(0, 1fr))`,
          gridAutoRows: `${String(ROW)}px`,
          gap: `${String(GAP)}px`,
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
        {/* **Desde el 2026-11-10 también al MOVER** un panel, y descontando de
            dónde se lo agarró: el rectángulo cae donde va a caer el panel. Por
            encima de los paneles (`z-10`), que si no lo tapaban. */}
        {sobre !== null && enVuelo !== null && (() => {
          const { colSpan, rowSpan } = enVuelo
          const col = Math.max(1, sobre.col - enVuelo.dCol)
          const fila = Math.max(1, sobre.fila - enVuelo.dFila)
          const problema = impedimento(col, fila, enVuelo.movido, enVuelo.tipo)
          return (
            <div
              aria-live="polite"
              style={{
                gridColumn: `${String(col)} / span ${String(Math.min(colSpan, COLUMNS - col + 1))}`,
                gridRow: `${String(fila)} / span ${String(rowSpan)}`,
              }}
              className={
                'pointer-events-none relative z-10 flex items-center justify-center rounded-sm border-2 ' +
                (problema === null ? 'border-acc' : 'border-w4 bg-w2')
              }
            >
              <Label>
                {problema ?? `${enVuelo.rotulo} · ${String(colSpan)} × ${String(rowSpan)}`}
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
          const cabe = enVuelo !== null && h.colSpan >= enVuelo.colSpan && h.rowSpan >= enVuelo.rowSpan
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
              draggable={!soloLectura && estirando === null}
              tabIndex={0}
              role="gridcell"
              data-panel={c.indice}
              aria-label={`${nombreDeTipo(p.tipo)} · ${nombre(p.metricId)}`}
              aria-selected={elegido}
              onDragStart={(e) => {
                const agarre = celdaAgarrada(
                  e.currentTarget.getBoundingClientRect(),
                  { x: e.clientX, y: e.clientY },
                  c.colSpan,
                  c.rowSpan,
                )
                e.dataTransfer.setData('text/plain', String(c.indice))
                e.dataTransfer.setData(FORMATO_AGARRE, JSON.stringify(agarre))
                onSeleccionar(c.indice)
                // **Después del `dragstart`, no adentro**: cambiar el elemento
                // que se arrastra mientras el navegador toma su imagen puede
                // cancelar el arrastre.
                window.setTimeout(() => setMoviendo({ indice: c.indice, ...agarre }), 0)
              }}
              onDragEnd={() => {
                setMoviendo(null)
                setSobre(null)
              }}
              onClick={() => onSeleccionar(c.indice)}
              onKeyDown={(e) => teclas(e, c.indice)}
              style={{
                gridColumn: `${String(c.colStart)} / span ${String(c.colSpan)}`,
                gridRow: `${String(c.filaInicio)} / span ${String(c.rowSpan)}`,
              }}
              className={
                'relative rounded-xl ' + (soloLectura ? 'cursor-default ' : 'cursor-grab ') +
                // **Mientras algo vuela, los paneles dejan pasar el puntero** a
                // las celdas de abajo, que son los destinos. Sin esto, correr un
                // panel una columna terminaba con el cursor sobre él mismo, que
                // no acepta soltar. El que se mueve, además, se ve levantado.
                (enVuelo !== null ? 'pointer-events-none ' : '') +
                (moviendo?.indice === c.indice ? 'opacity-40 ' : '') +
                (dibujar === undefined
                  ? 'bg-panel p-6 flex flex-col gap-1 ' + (elegido ? 'border-2 border-acc' : 'border border-w3')
                  : // **Con dato, el borde es del panel**: la selección va como
                    // anillo por FUERA para no correr el dibujo un píxel.
                    elegido
                    ? 'outline-2 outline-offset-2 outline-acc'
                    : '')
              }
            >
              {dibujar === undefined ? (
                <>
                  <Label as="div">{p.grafico !== undefined && nombreDeGrafico !== undefined ? nombreDeGrafico(p.grafico) : nombreDeTipo(p.tipo)}</Label>
                  <span className="font-body text-cuerpo font-medium text-ink">{nombre(p.metricId)}</span>
                  {/* La nota de lectura · 2026-10-14, igual que bajo el título
                      del panel en la consola. */}
                  {p.nota === undefined || p.nota === '' ? null : (
                    <p className="font-body text-celda leading-cuerpo text-dim m-0 line-clamp-2">{p.nota}</p>
                  )}
                  {/* La medida en unidades de grilla · las mismas que pide el
                      configurador. Los píxeles los decide `96·N − 16`, no quien
                      compone. */}
                  <Label as="div">{`${String(c.colSpan)} col × ${String(c.rowSpan)} filas`}</Label>
                </>
              ) : (
                <>
                  {/* **El panel como lo verá el cliente**, en una grilla del
                      ancho de la celda con las filas de la consola: mide lo
                      mismo que allá sin tocar `render/`. **Sin eventos**: es un
                      dibujo; tocarlo elige el panel, no abre su ⓘ. */}
                  <div
                    aria-hidden
                    className="pointer-events-none h-full"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${String(c.colSpan)}, minmax(0, 1fr))`,
                      gridAutoRows: `${String(ROW)}px`,
                      gap: `${String(GAP)}px`,
                    }}
                  >
                    {dibujar(c.indice)}
                  </div>
                  {/* **La ficha, como banda** · qué gráfico y de qué tamaño. Es
                      lo que el dibujo no dice solo. */}
                  <div className="absolute -top-2.5 left-4 flex items-center gap-2 rounded-sm border border-w4 bg-bg px-2 py-0.5">
                    <Label>{p.grafico !== undefined && nombreDeGrafico !== undefined ? nombreDeGrafico(p.grafico) : nombreDeTipo(p.tipo)}</Label>
                    <Label>{`${String(c.colSpan)} × ${String(c.rowSpan)}`}</Label>
                  </div>
                </>
              )}

              {elegido && b !== undefined && !soloLectura && (
                // Los handles · redimensionan de a una celda. **Dos grupos de
                // − y +** donde había cuatro palabras que desbordaban un panel
                // de 3 columnas —«AGRANDA» cortado, medido el 2026-10-06—. El
                // nombre accesible sigue diciendo la acción entera.
                <div
                  className={
                    dibujar === undefined
                      ? 'mt-2 flex flex-wrap gap-3'
                      : 'absolute bottom-3 right-3 flex flex-wrap gap-3 rounded-md border border-w4 bg-bg p-2 shadow-[0_8px_24px_var(--color-shad)]'
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-wrap gap-3">
                  {(
                    [
                      ['colSpan', 'Ancho', 'Angostar', 'Ensanchar'],
                      ['rowSpan', 'Alto', 'Achicar', 'Agrandar'],
                    ] as const
                  ).map(([campo, rotulo, menos, mas]) => (
                    <div key={campo} className="flex items-center gap-1">
                      <Label>{rotulo}</Label>
                      {(
                        [
                          [-1, '−', menos],
                          [1, '+', mas],
                        ] as const
                      ).map(([delta, signo, accion]) => (
                        <button
                          key={accion}
                          type="button"
                          aria-label={accion}
                          onClick={(e) => {
                            e.stopPropagation()
                            intentar(c.indice, {
                              colStart: c.colStart,
                              colSpan: c.colSpan,
                              rowSpan: c.rowSpan,
                              [campo]: c[campo] + delta,
                            })
                          }}
                          className="size-7 inline-flex items-center justify-center rounded-md border border-w5 font-body text-cuerpo font-semibold text-ink cursor-pointer hover:bg-w2"
                        >
                          {signo}
                        </button>
                      ))}
                    </div>
                  ))}
                  </div>
                  {/* **Por qué no**, junto a lo que se apretó. Antes el botón
                      no hacía nada al llegar al tope, y se leía como roto. */}
                  {aviso?.indice === c.indice && (
                    <p role="status" className="m-0 max-w-72 font-body text-celda leading-cuerpo text-ink">
                      {aviso.texto}
                    </p>
                  )}
                </div>
              )}

              {/* **Las asas del `.pen`** · cinco de ocho, ver arriba. Se agarran
                  con el mouse; el teclado tiene Shift y las flechas, y los
                  botones. */}
              {elegido && b !== undefined && !soloLectura &&
                ASAS.map(({ borde, clase }) => (
                  <span
                    key={borde}
                    aria-hidden
                    data-asa={borde}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => {
                      // Sin esto el `mousedown` arranca el arrastre del panel.
                      e.preventDefault()
                      e.stopPropagation()
                      const inicial = { colStart: c.colStart, colSpan: c.colSpan, rowSpan: c.rowSpan }
                      setAviso(null)
                      setEstirando({ indice: c.indice, borde, x0: e.clientX, y0: e.clientY, inicial, propuesta: inicial, tope: null })
                    }}
                    className={`absolute z-20 size-3 rounded-sm border border-acc bg-bg ${clase}`}
                  />
                ))}
            </div>
          )
        })}

        {/* **Lo que va a medir mientras se estira** · con la medida, o por qué
            no entra. Encima de todo, en la fila del panel. */}
        {estirando !== null && (() => {
          const propio = colocaciones.find((x) => x.indice === estirando.indice)
          if (propio === undefined) return null
          const { propuesta, tope } = estirando
          const razon = razonDeTamano(estirando.indice, propuesta)
          return (
            <div
              aria-live="polite"
              style={{
                gridColumn: `${String(propuesta.colStart)} / span ${String(propuesta.colSpan)}`,
                gridRow: `${String(propio.filaInicio)} / span ${String(propuesta.rowSpan)}`,
              }}
              className={
                'pointer-events-none relative z-10 flex flex-col items-center justify-center gap-1 rounded-xl border-2 ' +
                (razon === null ? 'border-acc bg-w2' : 'border-w4 bg-w2')
              }
            >
              <Label>{razon ?? `${String(propuesta.colSpan)} × ${String(propuesta.rowSpan)}`}</Label>
              {razon === null && tope !== null && <Label>{tope}</Label>}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
