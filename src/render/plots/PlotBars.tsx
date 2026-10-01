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

/** ── LA CIFRA DE CADA BARRA · 2026-10-01 ────────────────────────────────────
 *
 *  **El `.pen` las dibuja y acá faltaban.** El frame `Plot/BARRAS · Venta por
 *  categoría` pone, a la derecha de cada barra, su valor en `$font-mono 11` y
 *  `$ink`: `Running · USD 1.62M`, `Training · USD 1.08M`, y así las seis.
 *
 *  **No es una mejora, es una divergencia que se cierra.** Sin la cifra, cinco
 *  barras parecidas no se pueden leer: se ve cuál es más larga y no cuánto vale
 *  ninguna. Con dato real, `Goals vs actual` dibujaba cinco barras entre 72 y
 *  104 sobre un eje `0–150` y no había forma de saber ninguno de los cinco
 *  números.
 *
 *  Y es «ningún número desnudo» al revés: la regla persigue una cifra sin
 *  rótulo, y acá había un rótulo sin cifra.
 *
 *  `docs/AUDITORIA-2026-10-01-comprension-de-graficos.md` §3.1.
 *
 *  ── LO QUE SIGUE SIN ESTAR, Y QUEDA DECLARADO ──────────────────────────────
 *
 *  **El RIEL de fondo.** El dibujo pone, debajo de cada barra, un rectángulo de
 *  ancho completo en `$w2` —medido: `x: 120, width: 380` contra una barra de
 *  342— que es lo que deja ver cuánto falta. No se agrega acá porque sale de la
 *  primitiva `Bars`, que comparten las columnas y el pareto, y cambiarla toca
 *  tres gráficos a la vez. Va como propuesta.
 *
 *  Del ancho reservado a la derecha: el dibujo da 94,2 sobre 580 ⇒ 0,162. */
const FIGURE_WIDTH = 0.162

/** Del frame: `fontSize: 11` en las seis cifras · es `--text-cifra`, el mismo
 *  tamaño que `Value` usa para una cifra dentro de una fila. */
const FIGURE = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-cifra)',
  fill: 'var(--color-ink)',
  // Las seis cifras se alinean por la coma · sin esto, `1.62M` y `0.86M` bailan.
  fontVariantNumeric: 'tabular-nums',
} as const

export function PlotBars({ value, family, format }: PlotProps<'categorica'>) {
  const { ref, w, h } = useSize()

  const items = value.items.map((i) => ({ k: i.etiqueta, v: i.v }))
  const left = Math.round(w * LABEL_WIDTH)
  // El ancho de la cifra sale del dibujo y se le resta al área de barras: sin
  // esto la barra más larga se mete debajo del número.
  const figureW = Math.round(w * FIGURE_WIDTH)
  const width = Math.max(0, w - left - figureW - MARGIN.r)
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

            {/* **A la derecha de la barra y alineadas entre sí**, no al final de
                cada una: el dibujo las pone todas en la misma `x`, que es lo que
                deja compararlas de un vistazo. Van ancladas al final porque la
                columna crece hacia la izquierda cuando la cifra es más larga. */}
            {items.map((i) => (
              <text
                key={`f-${i.k}`}
                x={width + figureW - 4}
                y={(y(i.k) ?? 0) + y.bandwidth / 2}
                textAnchor="end"
                dominantBaseline="middle"
                style={FIGURE}
              >
                {format(i.v)}
              </text>
            ))}
          </g>
          <g transform={`translate(0,${MARGIN.t})`}>
            <CategoryAxis scale={y} side="left" at={left - 8} width={left - 8} />
          </g>
        </svg>
      )}
    </div>
  )
}
