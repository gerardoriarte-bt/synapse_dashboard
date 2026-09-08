/** `series` · formas `serieTemporal` y `seriesMultiples` · colSpan 5–7, rowSpan 4–5 · F1.13g */
import { PlotSeries } from '../plots/PlotSeries'
import type { DrawableSeries } from '../plots/PlotSeries'
import type { BodyProps } from '../types'

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
  format,
}: BodyProps<'serieTemporal' | 'seriesMultiples', SeriesParams>) {
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
