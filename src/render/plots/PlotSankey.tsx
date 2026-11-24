/** Diagrama de flujo · forma `flujo` · §PEN:Plot/FLUJO · 2026-09-30
 *
 *  **Lo único que un sankey promete es que el GROSOR es proporcional al valor**,
 *  en el nodo y en la cinta, y con la MISMA escala. Todo lo demás —el orden de
 *  las etapas, el color, el rótulo— es lectura. Por eso el reparto entero vive
 *  en `flowLayout` —`core/flowLayout.ts`—, que es aritmética pura y se prueba
 *  sin montar un SVG, igual que `squarify` en `core/treemap.ts` y `stack.ts`.
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
import { hue } from './core/seriesColor'
import { useSize } from './core/useSize'
import { GAP_LABEL, NODE_RADIUS, NODE_W, flowLayout } from './core/flowLayout'
import { ribbonPath } from './core/ribbonPath'
import type { FamilyStep } from '../../tokens/tokens'
import type { PlotProps } from '../types'

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
