/** Diagrama de flujo · forma `flujo` · §PEN:Plot/FLUJO · 2026-09-30
 *
 *  **Lo único que un sankey promete es que el GROSOR es proporcional al valor**,
 *  en el nodo y en la cinta, y con la MISMA escala. Todo lo demás —el orden de
 *  las etapas, el color, el rótulo— es lectura. Por eso el reparto entero vive
 *  en `flowLayout`, que es aritmética pura y se prueba sin montar un SVG, igual
 *  que `squarify` en `PlotTreemap` y `stack.ts`.
 *
 *  ── EL FRAME NO CIERRA, Y ELEGIR CUESTA 4 PÍXELES ───────────────────────────
 *
 *  Medido nodo por nodo sobre `Plot/FLUJO · Canal hacia división`, 580 × 200:
 *  las doce cintas están todas a la escala de la columna IZQUIERDA —sus grosores
 *  suman 160,0— y los tres rectángulos de la DERECHA suman 164,0. O sea que el
 *  dibujo estira la columna derecha un 2,5 % respecto de las cintas que la
 *  alimentan, y **`ACCESSORIES` desborda**: sus cuatro cintas terminan en
 *  `y 187,7` y su rectángulo termina en 184.
 *
 *  Acá se usa **UNA escala para todo**, la que hace caber a la columna más
 *  exigente. A 580 × 200 con los valores del frame da `k = 160/160 = 1`: la
 *  columna izquierda sale idéntica al dibujo y la derecha mide 168 en vez de
 *  172, terminando en `y 180` contra 184. **Divergencia declarada de 4 px, y es
 *  el precio de que las cintas cierren** — un sankey en el que el nodo y sus
 *  cintas no cierran se ve prolijo y miente. El `.pen` es normativo para lo
 *  visual, así que esto va como propuesta de spec y el dibujo no se toca.
 *
 *  ── LA COLUMNA NO ESTÁ EN EL DATO ───────────────────────────────────────────
 *
 *  `ValorFlujo` trae `etapas` PLANAS —siete en este frame— y ninguna dice a qué
 *  columna va. Se deriva de `enlaces`: columna 0 es la etapa sin enlace
 *  entrante, y si no, `1 + max(columna del origen)`. Es capas por camino más
 *  largo, con la relajación acotada a `etapas.length` pasadas para que un ciclo
 *  no la cuelgue. **Ahí vive el riesgo de este plot**: el contrato no declara la
 *  columna, así que una etapa suelta cae en la columna 0 sin cinta —correcto, y
 *  se ve como un nodo huérfano— y un ciclo deja lo que no se acomode en la
 *  última columna.
 *
 *  ── LAS COLUMNAS Y LA RESERVA SE NORMALIZAN A UNA SOLA ──────────────────────
 *
 *  El frame reserva 118 a la izquierda y 126 a la derecha, y la asimetría es de
 *  mano alzada: sus rótulos derechos son más largos (`ACCESSORIES`). Lo que sí
 *  manda es la curva, que va de `x 142` a `x 430` = **288 px, 0,497 del ancho**.
 *  De ahí sale `SPAN = 0.5·w` y una reserva simétrica; a 580 las columnas quedan
 *  en 133 y 435 contra 130 y 430 del dibujo, ±5 px, y el tramo en 290 contra 288
 *  (0,7 %).
 *
 *  ── LAS TRES COLUMNAS QUE NADIE DIBUJÓ ──────────────────────────────────────
 *
 *  El frame dibuja DOS. Con tres o más, el rótulo de una columna intermedia no
 *  tiene dónde ir sin pisar cintas y un enlace que salta una columna pasa por
 *  encima de nodos ajenos. Queda como límite declarado: la geometría reparte las
 *  columnas uniformes sobre el tramo y el rótulo intermedio se ancla a la
 *  izquierda de su propio nodo, que es lo menos malo y no tiene fuente
 *  normativa.
 *
 *  ── Y LO QUE EL DIBUJO NO DECIDE ────────────────────────────────────────────
 *
 *  El frame sale descendente por valor (45 % · 37,6 % · 11,8 % · 5,6 %) y eso
 *  **coincide con el orden del arreglo**, así que las dos lecturas explican lo
 *  mismo y el dibujo no decide. Se conserva el orden del dato, porque reordenar
 *  es el plot eligiendo una lectura que el backend no escribió; si diseño quiere
 *  ranking, es propuesta de spec.
 *
 *  Las cintas se pintan opacas y en orden de origen, como el frame, así que la
 *  última tapa a las anteriores en cada cruce. Bajarle opacidad es una decisión
 *  de diseño y el `.pen` no declara ninguna.
 *
 *  **La `v` de la etapa es del BACKEND y no se suma acá** —lo dice el yaml:
 *  `transformFlow` usa la suma de lo que sale, o de lo que entra si la etapa es
 *  terminal—. Si manda una `v` que no cierra con sus enlaces, el nodo y sus
 *  cintas se separan y el plot **no lo corrige**: dibuja lo que le mandan, y eso
 *  es visible, no silencioso.
 *
 *  **Y la conversión entre etapas no se dibuja** aunque el contrato la autorice:
 *  el frame no escribe una sola cifra adentro —la BASE la pone el shell— y la
 *  conversión es el trabajo de `funnel`, el otro gráfico de esta forma.
 */
import { AxisText } from './core/Axis'
import { charsThatFit } from './core/axisGeometry'
import { linearScale } from './core/scale'
import { hue } from './core/seriesColor'
import { useSize } from './core/useSize'
import type { FamilyStep } from '../../tokens/tokens'
import type { PlotProps } from '../types'
import type { Value } from '../../api/types'

type Flow = Extract<Value, { forma: 'flujo' }>

/* ── Geometría, medida nodo por nodo sobre el frame de 580 × 200 ───────────── */

/** `width: 12` en los siete rectángulos. */
const NODE_W = 12

/** El aire entre el rótulo y su nodo: los izquierdos terminan en `x 118` con el
 *  nodo en 130, y los derechos arrancan en `x 454` con el nodo terminando en
 *  442. Doce a los dos lados. */
const GAP_LABEL = 12

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
const NODE_RADIUS = 2

/** Cuánto del ancho ocupa el TRAMO de cinta, de borde de nodo a borde de nodo:
 *  `430 − 142 = 288` sobre 580 = 0,497. */
const SPAN_RATIO = 0.5

/** Cuánto del ancho se lleva la reserva de rótulos más el nodo y su aire:
 *  `130 / 580 = 0,224` a la izquierda y `(580 − 442) / 580 = 0,238` a la
 *  derecha. Con `SPAN_RATIO = 0.5` el cuarto restante se parte en dos, y de ahí
 *  sale el 0,25 — que es lo que hace la reserva simétrica. */
const RESERVE_RATIO = 0.25

/** Qué escalón de la familia le toca a cada nodo DENTRO de su columna.
 *
 *  El frame arranca la columna derecha en `$fam-demanda-1` y sigue en
 *  `$fam-demanda-0`, en ese orden; la izquierda usa cuatro familias distintas,
 *  y eso no se copia —la familia llega por prop y es UNA—. El arreglo conserva
 *  el arranque que el dibujo eligió y completa el ciclo.
 *
 *  **Por columna y no global**, que es lo que el frame hace: sus dos columnas
 *  vuelven a empezar. El costo con una sola familia es que el primer nodo de
 *  cada columna comparte escalón con el primero de la otra; lo que importa es
 *  que dentro de una columna no se repitan, porque la cinta toma el color de su
 *  ORIGEN y ahí es donde el color distingue.
 *
 *  Es el mismo arreglo que `PlotTreemap` y `PlotSmallMult` ya declaran con la
 *  misma razón escrita, y **esta es la tercera copia**: su casa es un
 *  `rampStep(i)` en `core/seriesColor.ts`, que es archivo compartido. */
const RAMPA: readonly FamilyStep[] = [
  1, // `$fam-demanda-1` · el primer nodo de la columna derecha del frame
  0, // `$fam-demanda-0` · el segundo
  2,
  3,
  4,
]

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

/** El `d` de una cinta de grosor constante.
 *
 *  Cúbica con los dos puntos de control en el punto medio horizontal, leído del
 *  path del frame: `M142 53.9 c144 0 144 53.1 288 53.1 …`, donde
 *  `dx1 = dx2 = 144 = 288/2` y las tangentes salen horizontales de los dos
 *  extremos. El grosor es idéntico en las dos puntas —23,1 y 23,1— porque el
 *  borde de abajo es el de arriba corrido.
 *
 *  **Su casa es `core/ribbonPath.ts`, con su marca en `core/Ribbon.tsx`** —el
 *  mismo corte que `arcPath.ts` + `Arc.tsx`, geometría probable sin montar un
 *  SVG y componente aparte para no romper el fast refresh de Vite—. Vive acá
 *  porque crear el archivo de `core/` quedó fuera del alcance de esta tarea, y
 *  no debería quedarse: `funnel` —que también cuelga de `flujo`— y la variante
 *  `flujo` de `network` piden la misma curva, y `core/Arc.tsx` ya avisa en su
 *  cabecera que «treemap, funnel, sankey y network» no se componen con el arco. */
export function ribbonPath({
  x0,
  x1,
  aTop,
  bTop,
  thickness,
}: {
  x0: number
  x1: number
  aTop: number
  bTop: number
  thickness: number
}): string {
  const xm = (x0 + x1) / 2
  const aBot = aTop + thickness
  const bBot = bTop + thickness
  return [
    `M${x0} ${aTop}`,
    `C${xm} ${aTop} ${xm} ${bTop} ${x1} ${bTop}`,
    `L${x1} ${bBot}`,
    `C${xm} ${bBot} ${xm} ${aBot} ${x0} ${aBot}`,
    'Z',
  ].join(' ')
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

export function PlotSankey({ value, family, format }: PlotProps<'flujo'>) {
  const { ref, w, h } = useSize()

  const plan = flowLayout(value, { w, h })
  const cap = charsThatFit(plan.reserve)

  /** El TOTAL que entra al flujo: la suma de las etapas de la columna 0. No es
   *  `Σ etapas`, que contaría cada unidad dos veces —una al salir y otra al
   *  llegar—, ni `Σ enlaces`, que no vale cuando hay más de dos columnas.
   *
   *  `toPrecision(12)` mata el ruido de coma flotante, igual que
   *  `linearScale.ticks`: los cuatro valores del frame suman
   *  `160.00000000000003` y el nombre accesible diría eso. */
  const total = Number(
    plan.nodes
      .filter((node) => node.column === 0)
      .reduce((sum, node) => sum + (Number.isFinite(node.v) ? node.v : 0), 0)
      .toPrecision(12),
  )

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          /* **Distinto del de todo otro plot a propósito**, por la razón que
             `PlotTreemap` ya escribió: `GraphBody` va a hospedar dos dibujos
             sobre la misma forma y sin nombres distintos ninguna prueba puede
             afirmar CUÁL se montó — y un despacho que cae al de por defecto se
             ve perfecto. Lleva «total» pegado a la cifra: ningún número desnudo,
             tampoco en el árbol de accesibilidad. */
          aria-label={`flujo de ${plan.nodes.length} etapas y ${plan.ribbons.length} enlaces · total ${format(total)}`}
        >
          {/* Los nodos primero y las cintas después, como el frame, donde los
              siete `rectangle` preceden a los doce `path`. */}
          {plan.nodes.map((node, i) => (
            <rect
              key={`${node.id}-${i}`}
              x={node.x}
              y={node.y}
              width={NODE_W}
              height={node.h}
              rx={NODE_RADIUS}
              fill={hue({ family, step: RAMPA[node.rank % RAMPA.length] ?? 1 })}
            />
          ))}

          {/* La cinta toma el color de su ORIGEN, que es lo que el frame fija:
              `p8`,`p9`,`p10` en `$fam-medios-1` como META, y `p17`,`p18`,`p19`
              en `$fam-inventario-1` como TIKTOK. Por destino, las tres salientes
              de una etapa saldrían de tres colores y el flujo dejaría de
              leerse. */
          plan.ribbons.map((r, i) => {
            const origin = plan.nodes[r.from]
            return (
              <path
                key={`${r.from}-${r.to}-${i}`}
                d={ribbonPath(r)}
                fill={hue({ family, step: RAMPA[(origin?.rank ?? 0) % RAMPA.length] ?? 1 })}
              />
            )
          })}

          {/* Un rótulo por nodo, CENTRADO EN SU NODO y no en su columna: con
              alturas desiguales, centrar en la columna despega el rótulo de la
              banda que nombra y el dibujo sigue viéndose ordenado. Medido en los
              siete del frame — META centra en 48,6 contra el 48,1 del nodo.

              El recorte sale de la reserva medida y no de un tope fijo en
              caracteres, que es el defecto que `charsThatFit` existe para haber
              arreglado una vez. */}
          {plan.nodes.map((node, i) => {
            const last = node.column === plan.columns - 1
            const text = node.label.length > cap ? `${node.label.slice(0, cap - 1)}…` : node.label
            return (
              <AxisText
                key={`t-${node.id}-${i}`}
                x={last ? node.x + NODE_W + GAP_LABEL : node.x - GAP_LABEL}
                y={node.y + node.h / 2}
                anchor={last ? 'start' : 'end'}
              >
                {text}
              </AxisText>
            )
          })}
        </svg>
      )}
    </div>
  )
}
