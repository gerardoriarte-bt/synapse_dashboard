/** `series` · formas `serieTemporal` y `seriesMultiples` · colSpan 5–7, rowSpan 4–5 · F1.13g */
import { PlotSeries } from '../plots/PlotSeries'
import { PlotStackArea } from '../plots/PlotStackArea'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { DrawableSeries } from '../plots/PlotSeries'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar, POR FORMA.
 *
 *  **`stackarea` no está en `serieTemporal` y no es un olvido**: apilar una sola
 *  serie contra nada es el área que `PlotSeries` ya dibuja, y ofrecerlo como si
 *  fuera otra cosa prometería una composición donde hay una línea. */
const DIBUJA = {
  serieTemporal: ['columns', 'area', 'step', 'multiline', 'spark', 'cycle', 'candle', 'control'],
  seriesMultiples: ['multiline', 'stackarea', 'combo', 'smallmult', 'bump', 'slope'],
} as const

export type SeriesParams = {
  /** Normaliza todas las series a base 100 para compararlas cuando sus
   *  magnitudes son distintas. */
  normalizacion?: 'ninguna' | 'base100'
}

const BASE_100 = 100

export function SeriesBody({
  value,
  params,
  family,
  grafico,
  format,
}: BodyProps<'serieTemporal' | 'seriesMultiples', SeriesParams>) {
  // Antes de elegir el dibujo, y no dentro de cada rama · misma razón que en
  // `ForecastBody`: resuelto abajo, la rama que se olvide se ve bien.
  const conocidos: readonly string[] = DIBUJA[value.forma]
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  const series: DrawableSeries[] =
    value.forma === 'serieTemporal'
      ? [{ etiqueta: 'serie', puntos: value.puntos }]
      : value.series

  const normalized =
    params.normalizacion === 'base100'
      ? series.map((s) => {
          const first = s.puntos[0]?.v
          // Un primer punto en cero no se normaliza: dividir por él daría
          // Infinity y la serie desaparecería del área de dibujo sin avisar.
          return first === undefined || first === 0
            ? s
            : { ...s, puntos: s.puntos.map((p) => ({ ...p, v: (p.v / first) * BASE_100 })) }
        })
      : series

  // **La normalización a base 100 y el apilado no se pueden combinar**, y por
  // eso se decide acá y no adentro del plot: apilar series ya normalizadas suma
  // porcentajes de bases distintas, y el total resultante no significa nada.
  if (grafico === 'stackarea') {
    return (
      <div className="h-full min-h-0">
        <PlotStackArea
          series={series}
          family={family}
          format={(v) => format.number(v, { abbreviate: true })}
        />
      </div>
    )
  }

  return (
    <div className="h-full min-h-0">
      <PlotSeries
        series={normalized}
        family={family}
        format={(v) => format.number(v, { abbreviate: true })}
        area={normalized.length === 1}
      />
    </div>
  )
}
