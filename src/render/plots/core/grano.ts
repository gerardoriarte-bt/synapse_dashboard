/** El grano de una serie temporal · aparte del cuerpo para no romper el fast
 *  refresh de Vite: un `.tsx` que exporta funciones además de componentes lo
 *  pierde. Ver `seriesColor.ts`, que existe por lo mismo. */
import type { DrawableSeries } from '../PlotSeries'

const FECHA = /^\d{4}-\d{2}-(\d{2})$/

/** ¿Es una serie de meses o de días? · 2026-10-06.
 *
 *  **Se decide sobre la serie entera y no punto por punto**: un 1 de octubre
 *  solo no dice si es un día o un mes. Es mensual cuando hay más de un punto y
 *  TODOS caen el día 1 —`media_efficiency_12m` manda `2025-11-01`,
 *  `2025-12-01`…—; cualquier otra cosa es diaria. Un `t` que no es fecha no
 *  decide nada: `axisDate` lo devuelve tal cual. */
export function granoDe(series: readonly DrawableSeries[]): 'dia' | 'mes' {
  const ts = series[0]?.puntos.map((p) => p.t) ?? []
  const dias = ts.map((t) => FECHA.exec(t)?.[1])
  return ts.length > 1 && dias.every((d) => d === '01') ? 'mes' : 'dia'
}
