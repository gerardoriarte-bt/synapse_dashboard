/** Área apilada · forma `seriesMultiples` · §PEN:Plot/ÁREA APILADA
 *
 *  **Contesta una pregunta que `PlotSeries` no puede.** Su `area` está limitada a
 *  una sola serie, y con razón escrita: «con varias, las capas se tapan y ninguna
 *  se lee». Eso vale para áreas SUPERPUESTAS. Las apiladas no se tapan —cada una
 *  arranca donde termina la anterior— y a cambio contestan otra cosa: no «cómo se
 *  movió cada una» sino **«cómo se compone el total y quién lo mueve»**.
 *
 *  Es el gráfico que el dashboard de MMM necesita para la contribución por canal:
 *  `MMM_RESULTS_WEEKLY` trae una `CONTRIB_<canal>` por semana y el total es la
 *  venta explicada.
 *
 *  ── LO QUE DICE EL DIBUJO ───────────────────────────────────────────────────
 *
 *  Tres bandas, y cada una lleva **relleno más una línea de 1.8px en su borde
 *  superior**. La línea no es decorativa: es lo que deja seguir el contorno de
 *  una banda cuando la de abajo la empuja hacia arriba.
 *
 *  **El dibujo usa tres FAMILIAS distintas y acá se usan los escalones de una.**
 *  No es una divergencia nueva: es la convención que `PlotComposition` ya declara
 *  —«los escalones salen de la familia, no de una paleta»— y que la regla dura 1
 *  obliga. La familia la trae el catálogo; elegir tres sería elegir color.
 *
 *  ── POR QUÉ SE APILA POR `t` Y NO POR ÍNDICE ────────────────────────────────
 *
 *  Apilar por posición suma el punto 3 de una serie con el punto 3 de otra
 *  **aunque sean semanas distintas**, y el resultado se ve perfecto: un total
 *  compuesto de fechas que no coinciden. Con `t` como clave eso no puede pasar.
 *
 *  **Y una serie que no tiene ese `t` no aporta**, que es lo honesto que se puede
 *  hacer y conviene saber que no alcanza: en un apilado **un hueco y un cero se
 *  ven igual**. Es la distinción de siempre —`null` es «nunca», `0` es
 *  «recién»— y acá la geometría no la puede expresar. Con series desparejas el
 *  cuerpo debería preferir `multiline`.
 */
import { useSize } from './core/useSize'
import { ceiling, linearScale } from './core/scale'
import { ValueAxis } from './core/Axis'
import { MARGIN, axisReserve } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Line, Ribbon } from './core/Series'
import { stack } from './core/stack'
import type { FamiliaDeDibujo } from '../types'

export type StackableSeries = { etiqueta: string; puntos: readonly { t: string; v: number }[] }

/** La rampa tiene cinco escalones · el mismo tope que la composición. */
const RAMP = 5

export function PlotStackArea({
  series,
  family,
  format,
}: {
  series: readonly StackableSeries[]
  family: FamiliaDeDibujo
  format: (v: number) => string
}) {
  const { ref, w, h } = useSize()

  // El eje sale de la PRIMERA serie, igual que en `PlotSeries`. Las demás se
  // consultan por `t`.
  const eje = series[0]?.puntos.map((p) => p.t) ?? []
  const porT = series.map((s) => new Map(s.puntos.map((p) => [p.t, p.v])))

  // Una columna de tramos por instante: `stack` devuelve dónde arranca y dónde
  // termina cada uno, que es exactamente la frontera móvil de un apilado.
  const columnas = eje.map((t) => stack(porT.map((m) => m.get(t) ?? 0)))
  const total = columnas.map((c) => c[c.length - 1]?.end ?? 0)

  const height = Math.max(0, h - MARGIN.t - MARGIN.b)
  const y = linearScale([0, ceiling(total)], [height, 0])
  const reserve = axisReserve(y.ticks(4).map(format))
  const width = Math.max(0, w - reserve - MARGIN.r)
  const x = linearScale([0, Math.max(1, eje.length - 1)], [0, width])

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && (
        <svg width={w} height={h} role="img" aria-label={`${series.length} series apiladas`}>
          <g transform={`translate(${reserve},${MARGIN.t})`}>
            <Grid scale={y} orientation="horizontal" length={width} />
            {series.map((s, i) => {
              const tramos = columnas.map((c, j) => ({
                x: j,
                lo: c[i]?.start ?? 0,
                hi: c[i]?.end ?? 0,
              }))
              const step = (i % RAMP) as 0 | 1 | 2 | 3 | 4
              return (
                <g key={s.etiqueta}>
                  <Ribbon points={tramos} x={x} y={y} family={family} step={step} />
                  {/* El borde superior · 1.8px en el dibujo. */}
                  <Line
                    points={tramos.map((p) => ({ x: p.x, y: p.hi }))}
                    x={x}
                    y={y}
                    family={family}
                    step={step}
                  />
                </g>
              )
            })}
          </g>
          <g transform={`translate(0,${MARGIN.t})`}>
            <ValueAxis scale={y} side="left" at={reserve - 6} format={format} />
          </g>
        </svg>
      )}
    </div>
  )
}
