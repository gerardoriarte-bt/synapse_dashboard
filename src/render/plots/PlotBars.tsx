/** Barras horizontales · formas `categorica` y `ranking` · F1.13f
 *
 *  Es la prueba de las primitivas: composición y cero SVG propio fuera de la
 *  caja del contenedor. Si un plot pide más de 60 líneas, falta una primitiva
 *  · §6.3.
 */
import { useSize } from './core/useSize'
import { bandScale, ceiling, linearScale } from './core/scale'
import { CategoryAxis, ValueAxis } from './core/Axis'
import { MARGIN } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Bars } from './core/Series'
import type { PlotProps } from '../types'

/** Cuánto ancho se lleva la columna de etiquetas. **Proporcional y no fijo**: el
 *  mismo plot vive en un panel de colSpan 4 y en el drill-down a pantalla
 *  completa, y una columna fija se ve enorme en uno y apretada en el otro. */
const LABEL_WIDTH = 0.34

export function PlotBars({ value, family, format }: PlotProps<'categorica'>) {
  const { ref, w, h } = useSize()

  const items = value.items.map((i) => ({ k: i.etiqueta, v: i.v }))
  const left = Math.round(w * LABEL_WIDTH)
  const width = Math.max(0, w - left - MARGIN.r)
  const height = Math.max(0, h - MARGIN.t - MARGIN.b)

  const x = linearScale([0, ceiling(items.map((i) => i.v))], [0, width])
  const y = bandScale(
    items.map((i) => i.k),
    [0, height],
  )

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        <svg width={w} height={h} role="img" aria-label={`${items.length} categorías`}>
          <g transform={`translate(${left},${MARGIN.t})`}>
            <Grid scale={x} orientation="vertical" length={height} />
            <Bars
              items={items}
              band={y}
              value={x}
              orientation="horizontal"
              base={x(0)}
              family={family}
            />
            <ValueAxis scale={x} side="bottom" at={height + 12} format={format} />
          </g>
          <g transform={`translate(0,${MARGIN.t})`}>
            <CategoryAxis scale={y} side="left" at={left - 8} width={left - 8} />
          </g>
        </svg>
      )}
    </div>
  )
}
