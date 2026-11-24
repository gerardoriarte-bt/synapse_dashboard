/** El reparto de un diagrama de flujo · 2026-11-24
 *
 *  Aparte de `PlotSankey` porque es aritmética y no un componente, igual que
 *  `arcPath.ts` y `treemap.ts`. Vivió en el plot hasta que `oxlint` marcó que el
 *  archivo exportaba funciones (`only-export-components`). **La geometría del
 *  frame viaja con el reparto** porque es su entrada: el componente importa de
 *  acá las tres medidas que también dibuja.
 */
import { linearScale } from './scale'
import type { Value } from '../../../api/types'

type Flow = Extract<Value, { forma: 'flujo' }>

/* ── Geometría, medida nodo por nodo sobre el frame de 580 × 200 ───────────── */

/** `width: 12` en los siete rectángulos. */
export const NODE_W = 12

/** El aire entre el rótulo y su nodo: los izquierdos terminan en `x 118` con el
 *  nodo en 130, y los derechos arrancan en `x 454` con el nodo terminando en
 *  442. Doce a los dos lados. */
export const GAP_LABEL = 12

/** Padding vertical: las dos columnas arrancan en `y 12` y la de abajo termina
 *  en 184 de 200. **No es simétrico y no se normaliza**, al revés que la
 *  reserva horizontal: acá los dos números están medidos y son consistentes en
 *  las dos columnas, así que no hay nada que promediar. */
const PAD_T = 12
const PAD_B = 16

/** Entre nodos de una columna: 88,2 − 84,2 = 4,0 en las tres juntas de la
 *  izquierda y 107 − 103 = 4,0 en la derecha. */
const GAP_NODE = 4

/** `cornerRadius: 2` en los siete rectángulos. Es el `r-xs` de §2, que en SVG va
 *  como número y no como token — el mismo caso que `BAR_RADIUS` en
 *  `core/Series.tsx`, donde el comentario dice «es el único lugar donde vive».
 *  Esta es la tercera copia, y exportarlo de allá toca un archivo compartido. */
export const NODE_RADIUS = 2

/** Cuánto del ancho ocupa el TRAMO de cinta, de borde de nodo a borde de nodo:
 *  `430 − 142 = 288` sobre 580 = 0,497. */
const SPAN_RATIO = 0.5

/** Cuánto del ancho se lleva la reserva de rótulos más el nodo y su aire:
 *  `130 / 580 = 0,224` a la izquierda y `(580 − 442) / 580 = 0,238` a la
 *  derecha. Con `SPAN_RATIO = 0.5` el cuarto restante se parte en dos, y de ahí
 *  sale el 0,25 — que es lo que hace la reserva simétrica. */
const RESERVE_RATIO = 0.25

export type FlowBox = { w: number; h: number }

/** Un nodo colocado. `column` viaja con él porque el escalón de color se lee de
 *  su posición DENTRO de la columna: sin el dato habría que reconstruir la
 *  agrupación mirando las `x`, que es adivinar lo que el reparto ya sabe. */
export type FlowNode = {
  id: string
  label: string
  v: number
  column: number
  /** Posición dentro de su columna, en el orden del arreglo `etapas`. */
  rank: number
  x: number
  y: number
  h: number
}

/** Una cinta colocada. `from` y `to` son índices en `nodes`, no ids: el plan ya
 *  resolvió los ids y volver a buscarlos en cada render es trabajo repetido que
 *  además puede fallar distinto. */
export type FlowRibbon = {
  from: number
  to: number
  v: number
  /** Borde DERECHO del nodo origen, para que la cinta no pise el rectángulo. */
  x0: number
  /** Borde IZQUIERDO del nodo destino. */
  x1: number
  aTop: number
  bTop: number
  thickness: number
}

export type FlowPlan = {
  nodes: FlowNode[]
  ribbons: FlowRibbon[]
  /** El ancho que queda para un rótulo, igual a los dos lados. */
  reserve: number
  columns: number
  /** Píxeles por unidad. **Uno solo para todo el dibujo**, que es lo que el
   *  frame no hace y lo que hace que las cintas cierren. */
  k: number
}

/** El reparto entero: columnas, alturas, `x`, apilado de cintas y la escala.
 *
 *  Función pura y exportada a propósito, siguiendo el precedente de `squarify`:
 *  un sankey se ve igual de prolijo con dos escalas que con una, y el ojo no
 *  distingue las dos. Lo que lo distingue es la aritmética.
 */
export function flowLayout(value: Flow, box: FlowBox): FlowPlan {
  const etapas = value.etapas
  const n = etapas.length

  // El primer id gana si viniera repetido: `ValorFlujo` no declara unicidad, y
  // un `Map` sin esta guarda haría que el último pisara al primero y las cintas
  // del primero se mudaran de nodo sin que nada falle.
  const index = new Map<string, number>()
  etapas.forEach((e, i) => {
    if (!index.has(e.id)) index.set(e.id, i)
  })

  /** **Un enlace que apunta a una etapa que no existe se descarta ACÁ**, antes
   *  de cualquier aritmética. Sin el filtro su `aTop` sale `NaN`, el `d` sale
   *  con `NaN` adentro y el path **desaparece sin ningún error** —el mismo modo
   *  de falla que `PlotComposition` documenta para el lado negativo— y de paso
   *  desplaza el apilado de los enlaces que sí eran válidos. */
  const links = value.enlaces
    .map((l) => ({ from: index.get(l.desde), to: index.get(l.hacia), v: l.v }))
    .filter(
      (l): l is { from: number; to: number; v: number } =>
        l.from !== undefined && l.to !== undefined && Number.isFinite(l.v) && l.v > 0,
    )

  // ── La columna, derivada de los enlaces ──────────────────────────────────
  //
  // Capas por camino más largo sobre lo que el contrato no promete que sea un
  // DAG. Acotada a `n` pasadas y con el techo en `n − 1`: con un ciclo la
  // relajación no termina sola, y lo que no se acomode queda en la última
  // columna en vez de colgar el render.
  const column = etapas.map(() => 0)
  for (let pass = 0; pass < n; pass++) {
    let moved = false
    for (const l of links) {
      const want = Math.min((column[l.from] ?? 0) + 1, n - 1)
      if (want > (column[l.to] ?? 0)) {
        column[l.to] = want
        moved = true
      }
    }
    if (!moved) break
  }

  const columns = n === 0 ? 0 : Math.max(...column) + 1

  // Los índices de cada columna, EN EL ORDEN DEL ARREGLO. El contrato declara
  // que `etapas` viene en el orden del flujo, así que ese es el apilado.
  const byColumn = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const c = column[i] ?? 0
    const bucket = byColumn.get(c)
    if (bucket === undefined) byColumn.set(c, [i])
    else bucket.push(i)
  }

  // ── La escala, UNA para todo ─────────────────────────────────────────────
  //
  // `linearScale` y no `ceiling`: redondear hacia arriba deja aire bajo un eje y
  // acá no hay eje, así que achicaría cada nodo sin decirlo.
  let k = Number.POSITIVE_INFINITY
  for (const bucket of byColumn.values()) {
    const sum = bucket.reduce((a, i) => a + Math.max(0, etapas[i]?.v ?? 0), 0)
    const usable = box.h - PAD_T - PAD_B - GAP_NODE * (bucket.length - 1)
    if (sum <= 0 || usable <= 0) continue
    k = Math.min(k, linearScale([0, sum], [0, usable])(1))
  }
  if (!Number.isFinite(k)) k = 0

  // ── Las columnas sobre el ancho ──────────────────────────────────────────
  const reserve = Math.max(0, box.w * RESERVE_RATIO - NODE_W - GAP_LABEL)
  const xFirst = reserve + GAP_LABEL
  const span = box.w * SPAN_RATIO
  // Una sola columna no tiene tramo que repartir, y `columns − 1` sería una
  // división por cero.
  const step = columns > 1 ? (span + NODE_W) / (columns - 1) : 0

  const nodes: FlowNode[] = etapas.map((e, i) => ({
    id: e.id,
    label: e.etiqueta,
    v: e.v,
    column: column[i] ?? 0,
    rank: 0,
    x: xFirst,
    y: PAD_T,
    h: 0,
  }))

  for (const [c, bucket] of byColumn) {
    let cursor = PAD_T
    bucket.forEach((i, rank) => {
      const node = nodes[i]
      if (node === undefined) return
      const height = Math.max(0, k * (Number.isFinite(node.v) ? node.v : 0))
      node.rank = rank
      node.x = xFirst + c * step
      node.y = cursor
      node.h = height
      cursor += height + GAP_NODE
    })
  }

  // ── El apilado de las cintas ─────────────────────────────────────────────
  //
  // **Ordenadas por la posición del nodo del OTRO extremo**, no por el orden de
  // llegada del arreglo: es lo que minimiza cruces, y sin él las cintas se
  // cruzan a sí mismas. Verificado en el frame: META saca `p8→FOOTWEAR`,
  // `p9→APPAREL`, `p10→ACCESSORIES` de arriba hacia abajo, y FOOTWEAR recibe
  // `p8←META`, `p11←GOOGLE`, `p14←CRITEO`, `p17←TIKTOK` en el mismo orden.
  const aTop = new Array<number>(links.length).fill(0)
  const bTop = new Array<number>(links.length).fill(0)
  const withId = links.map((l, id) => ({ l, id }))

  for (let i = 0; i < n; i++) {
    const node = nodes[i]
    if (node === undefined) continue

    const salientes = withId
      .filter((x) => x.l.from === i)
      .sort((p, q) => (nodes[p.l.to]?.y ?? 0) - (nodes[q.l.to]?.y ?? 0) || p.id - q.id)
    let out = node.y
    for (const s of salientes) {
      aTop[s.id] = out
      out += k * s.l.v
    }

    const entrantes = withId
      .filter((x) => x.l.to === i)
      .sort((p, q) => (nodes[p.l.from]?.y ?? 0) - (nodes[q.l.from]?.y ?? 0) || p.id - q.id)
    let into = node.y
    for (const e of entrantes) {
      bTop[e.id] = into
      into += k * e.l.v
    }
  }

  // El orden de PINTADO es por etapa origen y después por destino, para que un
  // cruce se resuelva igual en cada render: las cintas son opacas y la última
  // tapa a las anteriores.
  const ribbons: FlowRibbon[] = withId
    .map(({ l, id }) => ({
      from: l.from,
      to: l.to,
      v: l.v,
      x0: (nodes[l.from]?.x ?? 0) + NODE_W,
      x1: nodes[l.to]?.x ?? 0,
      aTop: aTop[id] ?? 0,
      bTop: bTop[id] ?? 0,
      thickness: k * l.v,
    }))
    .sort((p, q) => p.from - q.from || p.to - q.to)

  return { nodes, ribbons, reserve, columns, k }
}
