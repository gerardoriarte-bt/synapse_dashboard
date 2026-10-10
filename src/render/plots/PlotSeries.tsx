/** Series temporales · una línea o varias · F1.13f
 *
 *  ── LO QUE SE AGREGÓ EL 2026-10-06, Y POR QUÉ ────────────────────────────────
 *
 *  El humano, mirando QA: «hay cards que no se entiende qué está mostrando […]
 *  debería haber hovers que indiquen los montos y detallar qué son los ejes».
 *  Era cierto en tres cosas a la vez, y las tres eran de acá:
 *
 *  1. **Sin leyenda.** Tres líneas de la misma familia y ninguna decía qué era,
 *     con el nombre de cada serie llegando en el payload. El `.pen` la dibuja
 *     —«Legend Item» en «Componentes de gráfico»— y no se había portado. Ver
 *     `core/Legend.tsx`.
 *  2. **Sin eje del tiempo.** Este plot pintaba sólo el eje de valores; cuándo
 *     era cada punto no se podía saber. `fechar` lo pone abajo, en el margen que
 *     `MARGIN.b` ya reservaba.
 *  3. **Sin forma de leer un monto.** El eje da órdenes de magnitud y nada más.
 *     **El `.pen` no dibuja un hover**, ni `design.md` lo pide: es una decisión
 *     humana del 2026-10-06, registrada en la PROPUESTA del 2026-09-22 §11.
 *
 *  **La lectura es de UN instante y de todas las series a la vez**, con una
 *  guía vertical y un punto por serie, y sale también con el teclado —flechas—,
 *  porque una cifra que sólo aparece con un mouse no existe para quien navega
 *  sin uno.
 *
 *  **El valor se lee completo, no abreviado.** El eje dice «40K» porque es un
 *  orden de magnitud; la lectura dice «43,520», que es la cifra. Abreviar las
 *  dos haría del hover un eje más.
 */
import { useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { useSize } from './core/useSize'
import { ceiling, linearScale } from './core/scale'
import { AxisText, ValueAxis } from './core/Axis'
import { MARGIN, axisReserve, textWidth } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Area, Line } from './core/Series'
import { Legend } from './core/Legend'
import { hue } from './core/seriesColor'
import { Label } from '../primitives/Label'
import type { FamiliaDeDibujo } from '../types'

export type DrawableSeries = { etiqueta: string; puntos: { t: string; v: number }[] }

/** Cuánto aire pide cada rótulo del eje del tiempo, además de su texto. */
const AIRE_ENTRE_FECHAS = 24

export function PlotSeries({
  series,
  family,
  format,
  area = true,
  fechar,
  leer,
}: {
  series: readonly DrawableSeries[]
  family: FamiliaDeDibujo
  /** El rótulo del eje de valores · abreviado. */
  format: (v: number) => string
  /** El área solo tiene sentido con UNA serie: con varias, las capas se tapan y
   *  ninguna se lee. */
  area?: boolean
  /** El rótulo de un `t` en el eje del tiempo. Sin él no hay eje X, que es como
   *  estaba este plot antes del 2026-10-06. */
  fechar?: ((t: string) => string) | undefined
  /** La cifra completa, con su unidad, para la lectura y la leyenda. Sin él no
   *  hay lectura: un plot no inventa cómo se escribe un monto. */
  leer?: ((v: number) => string) | undefined
}) {
  const { ref, w, h } = useSize()
  const [activo, setActivo] = useState<number | null>(null)

  const all = series.flatMap((s) => s.puntos)
  const max = ceiling(all.map((p) => p.v))
  const height = Math.max(0, h - MARGIN.t - MARGIN.b)

  // La reserva sale del rótulo MÁS LARGO, no del rótulo del máximo · F1.13a.
  const y = linearScale([0, max], [height, 0]) // invertido: la y crece hacia abajo
  const reserve = axisReserve(y.ticks(4).map(format))
  const width = Math.max(0, w - reserve - MARGIN.r)

  // **El eje del tiempo es la PRIMERA serie**, y eso asume series alineadas
  // —mismos `t` en el mismo orden—, que es lo que el resto del repertorio ya
  // asume y lo que el servicio emite para `multi_series`.
  const tiempos = series[0]?.puntos.map((p) => p.t) ?? []
  const steps = Math.max(1, tiempos.length - 1)
  const x = linearScale([0, steps], [0, width])

  const pointsOf = (s: DrawableSeries) => s.puntos.map((p, i) => ({ x: i, y: p.v }))
  const single = series.length === 1
  const conLectura = leer !== undefined && tiempos.length > 0

  // **Cuántas fechas entran sin pisarse**, del rótulo más largo. Con 31 días en
  // un panel de seis columnas no entran todas, y apretarlas las superpone.
  const rotulos = fechar === undefined ? [] : tiempos.map(fechar)
  const largo = Math.max(1, ...rotulos.map((r) => r.length))
  const caben = Math.max(2, Math.floor(width / (textWidth(largo) + AIRE_ENTRE_FECHAS)))
  const salto = Math.max(1, Math.ceil(rotulos.length / caben))

  const indiceEn = (px: number) =>
    Math.min(tiempos.length - 1, Math.max(0, Math.round(((px - reserve) / Math.max(1, width)) * steps)))

  // La leyenda lee el punto activo; sin uno, el último, que es el «ahora» de la
  // serie y lo que el `.pen` pone al lado de cada nombre.
  const indiceLeyenda = activo ?? tiempos.length - 1
  const leyenda = series.map((s, i) => {
    const v = s.puntos[indiceLeyenda]?.v
    return {
      nombre: s.etiqueta,
      valor: v === undefined || leer === undefined ? undefined : leer(v),
      step: (i % 4) as 0 | 1 | 2 | 3,
    }
  })

  const lecturaX = activo === null ? 0 : reserve + x(activo)
  // La lectura cambia de lado pasada la mitad, para no salirse por la derecha.
  const aLaIzquierda = lecturaX > w / 2

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-3">
      {/* Con una sola serie la leyenda repetiría el título del panel. */}
      {single ? null : <Legend entries={leyenda} family={family} />}

      <div
        ref={ref}
        className="relative flex-1 min-h-0 outline-none focus-visible:ring-1 focus-visible:ring-w5 rounded-xs"
        {...(conLectura
          ? {
              tabIndex: 0,
              role: 'group',
              'aria-label': 'Gráfico · usá las flechas para leer cada punto',
              onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
                const caja = e.currentTarget.getBoundingClientRect()
                setActivo(indiceEn(e.clientX - caja.left))
              },
              onPointerLeave: () => setActivo(null),
              onBlur: () => setActivo(null),
              onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                e.preventDefault()
                const paso = e.key === 'ArrowRight' ? 1 : -1
                setActivo((a) =>
                  Math.min(tiempos.length - 1, Math.max(0, (a ?? tiempos.length - 1) + (a === null ? 0 : paso))),
                )
              },
            }
          : {})}
      >
        {w > 0 && h > 0 && (
          <svg width={w} height={h} role="img" aria-label={`${series.length} series`}>
            <g transform={`translate(${reserve},${MARGIN.t})`}>
              <Grid scale={y} orientation="horizontal" length={width} />
              {series.map((s, i) => (
                <g key={s.etiqueta}>
                  {area && single && (
                    <Area points={pointsOf(s)} x={x} y={y} base={height} family={family} />
                  )}
                  <Line
                    points={pointsOf(s)}
                    x={x}
                    y={y}
                    family={family}
                    step={(i % 4) as 0 | 1 | 2 | 3}
                  />
                </g>
              ))}

              {activo === null ? null : (
                <g aria-hidden>
                  <line
                    x1={x(activo)}
                    x2={x(activo)}
                    y1={0}
                    y2={height}
                    stroke="var(--color-w5)"
                    strokeWidth={1}
                  />
                  {series.map((s, i) => {
                    const p = s.puntos[activo]
                    return p === undefined ? null : (
                      <circle
                        key={s.etiqueta}
                        cx={x(activo)}
                        cy={y(p.v)}
                        r={3.5}
                        fill={hue({ family, step: (i % 4) as 0 | 1 | 2 | 3 })}
                        stroke="var(--color-panel)"
                        strokeWidth={1.5}
                      />
                    )
                  })}
                </g>
              )}

              {rotulos.length === 0 ? null : (
                <g aria-hidden>
                  {rotulos.map((r, i) => {
                    // **El último siempre**: es el «ahora» y el que más se busca. Los
                    // demás cada `salto`, y el que quedaría pegado al último cede.
                    const ultimo = rotulos.length - 1
                    const visible = i === ultimo || (i % salto === 0 && (i === 0 || ultimo - i >= salto))
                    if (!visible) return null
                    return (
                      <AxisText
                        key={i}
                        x={x(i)}
                        y={height + 14}
                        anchor={i === 0 ? 'start' : i === rotulos.length - 1 ? 'end' : 'middle'}
                      >
                        {r}
                      </AxisText>
                    )
                  })}
                </g>
              )}
            </g>
            <g transform={`translate(0,${MARGIN.t})`}>
              <ValueAxis scale={y} side="left" at={reserve - 6} format={format} />
            </g>
          </svg>
        )}

        {/* **La lectura**, en HTML para que envuelva y para que el lector de
            pantalla la anuncie: `aria-live` sobre el texto, no sobre el SVG. */}
        {activo === null || leer === undefined ? null : (
          <div
            role="status"
            className="absolute top-0 pointer-events-none flex flex-col gap-1 bg-elev border border-w3 rounded-md px-3 py-2"
            style={
              aLaIzquierda
                ? { right: `${w - lecturaX + 12}px` }
                : { left: `${lecturaX + 12}px` }
            }
          >
            <Label>{fechar === undefined ? tiempos[activo] : (rotulos[activo] ?? tiempos[activo])}</Label>
            {series.map((s, i) => {
              const p = s.puntos[activo]
              return p === undefined ? null : (
                <span key={s.etiqueta} className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    aria-hidden
                    className="block w-2 h-2 rounded-xs shrink-0"
                    style={{ background: hue({ family, step: (i % 4) as 0 | 1 | 2 | 3 }) }}
                  />
                  {single ? null : (
                    <Label>{s.etiqueta}</Label>
                  )}
                  <span className="font-mono text-cifra text-ink tabular-nums">{leer(p.v)}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
