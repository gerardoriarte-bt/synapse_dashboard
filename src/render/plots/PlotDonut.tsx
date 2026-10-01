/** Dona · el reparto de un todo · forma `categorica` · §PEN:Plot/DONA
 *
 *  Medido nodo por nodo sobre el frame `Plot/DONA · Inversión por plataforma`
 *  (430×268, `layout: "none"`). Los cinco `path` salen de un mismo centro —
 *  `M150 44` con `a104 104` y vuelta interior `a62 62`—, así que cx=150, cy=148,
 *  radio exterior 104, interior 62. Lo que se porta son las RAZONES y no los
 *  píxeles: grosor/radio = 42/104 = 0,40 y hueco/exterior = 62/104 = 0,60.
 *  Allá la geometría es fija; acá se llena la caja medida, igual que en los
 *  otros diez plots.
 *
 *  **El agrupado en «Otros» vive ACÁ y no en el cuerpo**, al revés que en
 *  composición, y es a propósito: el total del centro se calcula sobre lo que el
 *  plot recibió ENTERO. Si el cuerpo recortara antes, el centro sumaría una
 *  parte y la presentaría como el total — que es exactamente el defecto que
 *  `CompositionBody` ya registró por escrito sobre su total repartido. Por la
 *  misma razón `tope` no se le aplica a la dona.
 *
 *  **El primer tramo arranca ARRIBA y va en sentido horario.** No es estética:
 *  el extremo del primer `path` del dibujo, (214,8 · 229,4), cae a 0,393 de
 *  vuelta desde (150,44) —el tope del círculo—, que es el 40% de META. Con
 *  `from = 0` y `totalSweep = 1` `Arc` reproduce eso sin una constante propia.
 *
 *  **DIVERGENCIA DECLARADA CON EL DIBUJO.** El `.pen` pinta los cinco tramos en
 *  CINCO familias distintas —`fam-medios-1`, `fam-medios-2`, `fam-cliente-1`,
 *  `fam-inventario-1`, `fam-externo-0`— y este porte usa los cinco escalones de
 *  UNA sola rampa, porque la familia se lee del catálogo y no se elige en el
 *  componente (regla dura 1). Es la misma resolución que ya tomó
 *  `PlotComposition` por la misma razón.
 *
 *  **Y el porcentaje es DERIVADO.** `categorica` no trae `porcentaje` —eso es de
 *  `composicion`, donde el contrato PROHÍBE derivarlo—, así que acá se calcula y
 *  se redondea a entero: cinco tramos pueden sumar 99 o 101. No hay alternativa
 *  —una dona sin participaciones es un anillo de colores— pero se dice en vez de
 *  esconderse.
 */
import { Arc, ArcRail } from './core/Arc'
import { hue } from './core/seriesColor'
import { AxisText } from './core/Axis'
import { charsThatFit } from './core/axisGeometry'
import { useSize } from './core/useSize'
import type { PlotProps } from '../types'

/** La columna de leyenda del dibujo va de 274 a 430: 156 de 430 = 0,363. El
 *  piso de 120px es lo que hace que el rótulo mono de 10 siga entrando cuando el
 *  panel se angosta. */
const LEGEND = 0.36
const LEGEND_MIN = 120

/** El aire entre el anillo y la leyenda · 254 → 274 en el dibujo. */
const GAP = 20

/** Cuatro visibles más «Otros» = los cinco escalones de la rampa. Es la misma
 *  constante y la misma razón que `CompositionBody`: no hay un sexto escalón que
 *  no repita uno anterior. */
const VISIBLE = 4

/** Las cinco muestras del dibujo están en y = 54, 86, 118, 150 y 182. */
const ROW_STEP = 32

/** La cifra cae 15,5px debajo del rótulo de su fila: el rótulo centra en 58,4
 *  (y 50,4 + media altura) y la cifra en 73,9. */
const FIGURE_DROP = 15.5

/** La muestra es un cuadrado de 8 con radio 2, y el rótulo arranca 18px a su
 *  derecha (292 − 274). */
const SAMPLE = 8
const LABEL_INDENT = 18

/** 42/104 · el grosor del anillo contra su radio exterior. */
const THICKNESS_RATIO = 0.4

/** 20/104 · el tamaño de la cifra del centro contra el radio. El 20 es
 *  `--text-titulo-lg`; dentro de un plot escala con el dibujo, como ya hacen
 *  `PlotGauge` y `PlotRings` con las suyas. */
const FIGURE_RATIO = 0.19

/** Dónde caen las dos líneas del centro respecto de `cy`, en unidades del
 *  tamaño de la CIFRA — las dos, también el rótulo. Del dibujo: 138,8 = 148 −
 *  9,2 (9,2/20 = 0,46) y 162,9 = 148 + 14,9 (14,9/20 = 0,745). */
const FIGURE_RISE = 0.46
const CAPTION_DROP = 0.75

type Slice = { etiqueta: string; v: number }

export function PlotDonut({
  value,
  family,
  format,
  /** **Obligatorio, y ahí está el punto**: es lo que convierte «ningún número
   *  desnudo» en error de compilación en vez de hallazgo del lint, igual que el
   *  `label` obligatorio del primitivo `Value`. El dibujo pinta «INVERSIÓN DEL
   *  MES», que es métrica + período, y un plot no conoce ninguno de los dos. */
  totalLabel,
}: PlotProps<'categorica'> & { totalLabel: string }) {
  const { ref, w, h } = useSize()

  // Un círculo no reparte negativos: los ítems que no suman no reciben tramo y
  // no cuentan para el total. Una `categorica` con negativos no es una dona —
  // §5 ofrece `bars` para eso.
  const positive = value.items.filter((i) => i.v > 0)
  const total = positive.reduce((s, i) => s + i.v, 0)

  // **Se agrupa desde DOS, no desde uno** · 2026-10-01. Con una sola porción
  // sobrante la leyenda decía `Otros · 1`: agrupar una no ahorra un escalón de
  // la rampa ni una línea de leyenda, y lo único que hace es borrar su nombre.
  // Visto en pantalla con dato real — ese `Otros · 1` era INVERSIÓN.
  //
  // **Y esta agrupación es la SEGUNDA.** `CompositionBody` ya agrupa antes de
  // llamar, así que las dos tienen que decidir igual: con criterios distintos,
  // el mismo panel agruparía o no según qué gráfico eligió quien compuso.
  const rest = positive.slice(VISIBLE)
  const slices: readonly Slice[] =
    rest.length <= 1
      ? positive
      : [
          ...positive.slice(0, VISIBLE),
          { etiqueta: `Otros · ${rest.length}`, v: rest.reduce((s, i) => s + i.v, 0) },
        ]

  const legendW = Math.max(LEGEND_MIN, Math.round(w * LEGEND))
  const legendX = w - legendW
  const ringW = Math.max(0, w - legendW - GAP)
  const side = Math.min(ringW, h)
  // El mismo −4 de `PlotGauge`: el trazo no se come el borde de la caja.
  const radius = Math.max(0, side / 2 - 4)
  const thickness = Math.max(6, radius * THICKNESS_RATIO)
  const cx = ringW / 2
  const cy = h / 2

  const figureSize = Math.max(12, radius * FIGURE_RATIO)

  // El bloque de leyenda se centra en vertical contra el alto que hay.
  const blockH = (slices.length - 1) * ROW_STEP + FIGURE_DROP
  const firstRowY = Math.max(12, (h - blockH) / 2)
  const cap = charsThatFit(legendW - LABEL_INDENT)

  const share = (v: number) => (total <= 0 ? 0 : v / total)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && radius > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`${totalLabel.toUpperCase()} ${format(total)} repartido en ${slices.length} partes`}
        >
          {/* Sin total no hay reparto: se pinta el riel y NADA MÁS. Ni tramos ni
              porcentajes — es lo honesto, y de paso evita el `NaN` en el `d`. */}
          {total <= 0 ? (
            <ArcRail cx={cx} cy={cy} radius={radius} thickness={thickness} />
          ) : (
            <Arc
              cx={cx}
              cy={cy}
              radius={radius}
              thickness={thickness}
              family={family}
              totalSweep={1}
              from={0}
              // Sin `step` explícito: el paso sale del defecto `i % 5` de `Arc`,
              // que es la MISMA expresión que usa la muestra de leyenda. Dos
              // listas de pasos son dos listas que pueden divergir, y una dona
              // donde el color no significa lo mismo a los dos lados no se ve
              // rota.
              segments={slices.map((s) => ({ k: s.etiqueta, fraction: share(s.v) }))}
            />
          )}

          {/* El centro · cifra y rótulo. Las dos líneas se posicionan contra el
              tamaño de la CIFRA, que es lo que el dibujo mide. */}
          <text
            x={cx}
            y={cy - figureSize * FIGURE_RISE}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: figureSize,
              letterSpacing: 'var(--tracking-titulo)',
              fill: 'var(--color-ink)',
            }}
          >
            {format(total)}
          </text>
          <text
            x={cx}
            y={cy + figureSize * CAPTION_DROP}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              // FIJO, no escala. §2.3 cierra los cuatro tamaños mono —«ningún
              // otro tamaño mono»—, así que interpolarlo inventaría el quinto.
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-nota)',
              letterSpacing: 'var(--tracking-rotulo)',
              fill: 'var(--color-dim)',
            }}
          >
            {totalLabel.toUpperCase()}
          </text>

          {/* La leyenda es parte del plot y no del cuerpo: sin ella el anillo es
              una rueda de colores sin significado. */}
          {slices.map((s, i) => {
            const rowY = firstRowY + i * ROW_STEP
            // La fila cuya cifra caiga fuera de la caja no se pinta · el mismo
            // idioma de `PlotComposition`.
            if (rowY + FIGURE_DROP > h) return null
            const label =
              s.etiqueta.length > cap ? `${s.etiqueta.slice(0, cap - 1)}…` : s.etiqueta
            return (
              <g key={s.etiqueta}>
                <rect
                  x={legendX}
                  y={rowY - 4}
                  width={SAMPLE}
                  height={SAMPLE}
                  rx={2}
                  fill={hue({ family, step: (i % 5) as 0 | 1 | 2 | 3 | 4 })}
                />
                <AxisText x={legendX + LABEL_INDENT} y={rowY} anchor="start">
                  {label}
                </AxisText>
                <text
                  x={legendX + LABEL_INDENT}
                  y={rowY + FIGURE_DROP}
                  textAnchor="start"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-cifra)',
                    fill: 'var(--color-ink)',
                  }}
                >
                  {`${format(s.v)} · ${Math.round(share(s.v) * 100)}%`}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
