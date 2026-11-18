/** Dónde cae cada panel en la grilla · F4.9
 *
 *  ── EL HECHO QUE CONDICIONA TODO EL CANVAS ──────────────────────────────────
 *
 *  **`PanelConfigurado` no tiene `rowStart`.** Declara `colStart`, `colSpan` y
 *  `rowSpan`, y nada más — lo verifican el contrato y `render/grid.ts`, que pinta
 *  `gridColumn: colStart / span N` y `gridRow: span N`. La fila **no se guarda:
 *  la resuelve la colocación automática de CSS grid**, y el único control que
 *  queda sobre ella es el ORDEN de los paneles en la pestaña.
 *
 *  Eso tiene dos consecuencias que el canvas no puede esquivar:
 *
 *  1. **Mover un panel hacia arriba o hacia abajo es reordenar, no fijar fila.**
 *     No hay nada que escribir: se cambia de lugar en el arreglo.
 *  2. **No se puede dejar un hueco a propósito.** Si un panel no entra en la
 *     fila en curso, la colocación lo baja y el hueco queda; pero pedir «que
 *     quede vacío acá» no tiene dónde escribirse.
 *
 *  **Y por eso la fila se calcula acá**, para saber qué panel está bajo el
 *  cursor sin leer el DOM.
 *
 *  ── NO ERA EL ALGORITMO DE CSS, Y ACÁ DECÍA QUE SÍ · 2026-11-18 ─────────────
 *
 *  Este encabezado decía que repetía `grid-auto-flow: row` y que por eso lo
 *  dibujado y lo calculado coincidían. **No coincidían.** CSS lleva un cursor de
 *  fila Y de columna: un panel con columna fija que arranca a la izquierda del
 *  anterior baja de fila aunque la fila tenga lugar. Este cálculo sólo lleva la
 *  fila, así que lo pone al lado. Medido en QA ese día: UA MX con Órdenes en la
 *  columna 10 y Visitas en la 7 — el editor las ponía en la misma fila y la
 *  consola, que dejaba la fila a CSS, en escalera.
 *
 *  **Se quedó el del editor**, porque es lo que quien compone ve y aprueba. Vive
 *  en `render/grid.ts` como `rowStarts`, y la consola escribe la fila que
 *  devuelve en vez de dejársela a CSS.
 */
import { COLUMNS, GAP, clampToGrid, rowStarts } from '../../render/grid'

export type Colocacion = {
  /** Índice en el arreglo de paneles de la pestaña. */
  indice: number
  colStart: number
  colSpan: number
  /** Fila donde arranca, 1-based · **derivada, no guardada**. */
  filaInicio: number
  rowSpan: number
}

type Entrada = { colStart: number; colSpan: number; rowSpan: number }

/** La fila de cada panel · **la misma que pinta la consola** desde el
 *  2026-11-18: el algoritmo vive en `render/grid.ts` (`rowStarts`) y lo usan los
 *  dos. Antes estaba sólo acá, la consola dejaba la fila a CSS, y CSS coloca
 *  distinto: el dashboard publicado se veía en escalera y el editor no. */
export function disposicion(panels: readonly Entrada[]): Colocacion[] {
  const filas = rowStarts(panels)
  return panels.map((p, indice) => {
    const { colStart, colSpan } = clampToGrid(p)
    return { indice, colStart, colSpan, filaInicio: filas[indice] ?? 1, rowSpan: Math.max(1, p.rowSpan) }
  })
}

/** Qué panel ocupa una celda · `null` si está libre. Devuelve el ÍNDICE. */
export function enCelda(
  colocaciones: readonly Colocacion[],
  col: number,
  fila: number,
): number | null {
  for (const c of colocaciones) {
    const dentroCol = col >= c.colStart && col < c.colStart + c.colSpan
    const dentroFila = fila >= c.filaInicio && fila < c.filaInicio + c.rowSpan
    if (dentroCol && dentroFila) return c.indice
  }
  return null
}

/** Con quién choca una colocación propuesta · `null` si no choca con nadie.
 *
 *  **`ignorar` es el propio panel que se está moviendo.** Sin él, todo panel
 *  chocaría consigo mismo y no se podría mover ni una columna. */
export function choqueCon(
  colocaciones: readonly Colocacion[],
  propuesta: { colStart: number; colSpan: number; filaInicio: number; rowSpan: number },
  ignorar: number,
): number | null {
  for (const c of colocaciones) {
    if (c.indice === ignorar) continue
    const cruzaCol =
      propuesta.colStart < c.colStart + c.colSpan && c.colStart < propuesta.colStart + propuesta.colSpan
    const cruzaFila =
      propuesta.filaInicio < c.filaInicio + c.rowSpan && c.filaInicio < propuesta.filaInicio + propuesta.rowSpan
    if (cruzaCol && cruzaFila) return c.indice
  }
  return null
}

export type Hueco = { colStart: number; colSpan: number; filaInicio: number; rowSpan: number }

/** Los huecos de la disposición, fila por fila.
 *
 *  **Son derivados y no un estado.** §7.2 los llama «slot vacío» y les pone un
 *  label con su medida; acá salen de lo que la colocación dejó libre, así que no
 *  hay nada que guardar ni que se pueda desincronizar.
 *
 *  Solo hasta la última fila ocupada: abajo de eso el lienzo está vacío entero y
 *  pintar filas de huecos hasta el infinito no dice nada.
 *
 *  **Y se funden hacia abajo**, que es lo que los vuelve legibles: el `.pen` los
 *  etiqueta «SLOT VACÍO · 3 × 4», con las dos medidas. Un hueco por fila daría
 *  cuatro rectángulos de alto 1 donde el diseño muestra uno de alto 4, y la
 *  etiqueta diría «3 × 1» cuatro veces. */
export function huecos(colocaciones: readonly Colocacion[]): Hueco[] {
  const ultima = colocaciones.reduce((m, c) => Math.max(m, c.filaInicio + c.rowSpan - 1), 0)
  const porFila: Hueco[] = []

  for (let fila = 1; fila <= ultima; fila++) {
    let col = 1
    while (col <= COLUMNS) {
      if (enCelda(colocaciones, col, fila) !== null) {
        col += 1
        continue
      }
      const desde = col
      while (col <= COLUMNS && enCelda(colocaciones, col, fila) === null) col += 1
      porFila.push({ colStart: desde, colSpan: col - desde, filaInicio: fila, rowSpan: 1 })
    }
  }

  // Funde el tramo con el de la fila de arriba cuando son la misma columna y el
  // mismo ancho. Solo eso: dos tramos de anchos distintos no forman un
  // rectángulo, y fundirlos daría una medida que no es la del hueco.
  const out: Hueco[] = []
  for (const h of porFila) {
    const arriba = out.find(
      (o) =>
        o.colStart === h.colStart &&
        o.colSpan === h.colSpan &&
        o.filaInicio + o.rowSpan === h.filaInicio,
    )
    if (arriba === undefined) out.push({ ...h })
    else arriba.rowSpan += 1
  }
  return out
}

/** En qué POSICIÓN del arreglo hay que insertar un panel para que caiga en esa
 *  fila.
 *
 *  **Es la traducción entre lo que el usuario hace y lo que el modelo guarda.**
 *  El usuario suelta en una fila; el modelo no tiene filas, tiene orden. Así que
 *  «soltar en la fila 5» se convierte en «ponerlo antes del primer panel que hoy
 *  empieza en la fila 5 o más abajo».
 *
 *  `ignorar` es el panel que se está moviendo: contarlo daría un destino corrido
 *  en uno cada vez que se mueve hacia abajo. */
export function ordenPara(
  colocaciones: readonly Colocacion[],
  fila: number,
  ignorar: number,
): number {
  const otros = colocaciones.filter((c) => c.indice !== ignorar)
  const i = otros.findIndex((c) => c.filaInicio >= fila)
  // Ninguno empieza tan abajo: va al final.
  if (i < 0) return otros.length
  return i
}

/** ── MOVER Y ESTIRAR CON EL MOUSE · 2026-11-10 ──────────────────────────────
 *
 *  Pedido del humano: «refinar la grilla … para mover y ajustar los tamaños».
 *  Medido ese día en local, con el dashboard descartable: correr un panel una
 *  columna con el mouse no se podía —el cursor terminaba encima del propio
 *  panel, que no acepta soltar—, el panel caía con la ESQUINA en la celda del
 *  cursor sin importar de dónde se lo agarró, y un «Ancho +» en una fila llena
 *  bajó a dos paneles de fila. Decisión humana del mismo día: **un tamaño que
 *  no entra se bloquea y se avisa; no empuja a nadie.** */


/** De qué celda del panel se lo agarró, contando desde su esquina · `0, 0` es
 *  la de arriba a la izquierda.
 *
 *  **Sin esto el panel salta.** Al soltar, la celda bajo el cursor se tomaba
 *  como la esquina del panel: uno de 6 columnas agarrado por el medio caía tres
 *  columnas a la derecha, o se rechazaba por pasarse del borde.
 *
 *  El paso sale del propio rectángulo —`(ancho + GAP) / colSpan`— y no de la
 *  grilla, así que no depende de cuánto mida el lienzo. Sin medida (jsdom, o
 *  un panel que todavía no se pintó) devuelve la esquina. */
export function celdaAgarrada(
  rect: { left: number; top: number; width: number; height: number },
  punto: { x: number; y: number },
  colSpan: number,
  rowSpan: number,
): { dCol: number; dFila: number } {
  if (rect.width <= 0 || rect.height <= 0) return { dCol: 0, dFila: 0 }
  const pasoX = (rect.width + GAP) / colSpan
  const pasoY = (rect.height + GAP) / rowSpan
  const acotar = (v: number, max: number) => Math.max(0, Math.min(max, v))
  return {
    dCol: acotar(Math.floor((punto.x - rect.left) / pasoX), colSpan - 1),
    dFila: acotar(Math.floor((punto.y - rect.top) / pasoY), rowSpan - 1),
  }
}

/** **El agarre viaja en el arrastre**, igual que la elección de la biblioteca
 *  · ver `eleccion.ts`. Al soltar se lee de ahí y no del estado del lienzo,
 *  que puede quedar desfasado con un `dragend` perdido. */
export const FORMATO_AGARRE = 'application/x-synapse-agarre'

export function leerAgarre(crudo: string): { dCol: number; dFila: number } {
  try {
    const a = JSON.parse(crudo) as unknown
    if (typeof a === 'object' && a !== null && 'dCol' in a && 'dFila' in a) {
      const { dCol, dFila } = a as { dCol: unknown; dFila: unknown }
      if (Number.isInteger(dCol) && Number.isInteger(dFila) && (dCol as number) >= 0 && (dFila as number) >= 0)
        return { dCol: dCol as number, dFila: dFila as number }
    }
  } catch {
    // Sin agarre legible se suelta por la esquina, como antes.
  }
  return { dCol: 0, dFila: 0 }
}

export type Medida = { colStart: number; colSpan: number; rowSpan: number }
export type Rango = { colSpanMin: number; colSpanMax: number; rowSpanMin: number; rowSpanMax: number }

/** ¿Se puede dar esta medida a este panel? · `null` si se puede, o la razón.
 *
 *  **Tres condiciones, en el orden en que conviene leerlas:**
 *
 *  1. **El rango del tipo**, cuando se pide · `/config/blocks` dice que un
 *     indicador va de 3 a 4 columnas. Llegar al tope sin que nada lo dijera
 *     era el «el botón no hace nada» que se reportó.
 *  2. **El borde de la grilla.**
 *  3. **Que nadie más se mueva.** Se simula la disposición con la medida nueva
 *     y se compara panel por panel: el que se solapa se nombra igual que al
 *     soltar, y el que cambiaría de lugar sin solaparse —la colocación
 *     automática lo correría— también. Comparar sólo solapes no alcanza:
 *     achicar un panel puede subir a otro que estaba esperando lugar. */
export function cambioDeTamano(
  panels: readonly Entrada[],
  indice: number,
  propuesta: Medida,
  opciones: { rango?: Rango; tipo: string; nombre: (indice: number) => string },
): string | null {
  const { rango, tipo, nombre } = opciones
  if (rango !== undefined) {
    if (propuesta.colSpan < rango.colSpanMin || propuesta.colSpan > rango.colSpanMax)
      return `«${tipo}» ocupa entre ${String(rango.colSpanMin)} y ${String(rango.colSpanMax)} columnas`
    if (propuesta.rowSpan < rango.rowSpanMin || propuesta.rowSpan > rango.rowSpanMax)
      return `«${tipo}» ocupa entre ${String(rango.rowSpanMin)} y ${String(rango.rowSpanMax)} filas`
  }
  if (propuesta.colSpan < 1 || propuesta.rowSpan < 1) return 'No puede medir menos de una celda'
  if (propuesta.colStart < 1 || propuesta.colStart + propuesta.colSpan - 1 > COLUMNS)
    return 'No entra · se pasa del borde de la grilla'

  const antes = disposicion(panels)
  const propio = antes.find((c) => c.indice === indice)
  if (propio === undefined) return null
  const choque = choqueCon(antes, { ...propuesta, filaInicio: propio.filaInicio }, indice)
  if (choque !== null) return `Se solapa con «${nombre(choque)}»`

  const despues = disposicion(panels.map((p, i) => (i === indice ? { ...p, ...propuesta } : p)))
  for (const d of despues) {
    const a = antes[d.indice]
    if (a === undefined) continue
    if (d.indice === indice ? a.filaInicio !== d.filaInicio : a.filaInicio !== d.filaInicio || a.colStart !== d.colStart)
      return d.indice === indice
        ? 'No entra en esta fila'
        : `Correría a «${nombre(d.indice)}» de su lugar`
  }
  return null
}
