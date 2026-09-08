/** El grano del período · F1.7
 *
 *  Aparte del componente porque es una decisión, no un render: qué granos puede
 *  contestar una pestaña se prueba sin montar nada.
 */
import type { Metric, Period } from '../../api/types'

/** De más grueso a más fino. El orden importa: `granoMinimo` de una métrica dice
 *  cuál es el corte MÁS FINO que puede contestar, así que todo lo que esté por
 *  debajo en esta escala queda fuera. */
const GRAINS = ['mes', 'semana', 'dia'] as const
type Grain = (typeof GRAINS)[number]

const GRAIN_LABEL: Record<Grain, string> = {
  mes: 'Meses',
  semana: 'Semanas',
  dia: 'Días',
}

/** El grano más grueso que exige alguna métrica de la pestaña.
 *
 *  `granoMinimo` es el corte MÁS FINO que una métrica puede contestar: una
 *  métrica de marca con `granoMinimo: 'mes'` no sabe nada de una semana.
 *
 *  Se toma el más grueso de todos —el índice más chico en `GRAINS`— porque el
 *  panel más restrictivo manda: si una sola métrica de la pestaña es mensual, un
 *  período semanal la deja sin nada que mostrar y la pestaña queda a medias.
 *
 *  Sin métricas no se restringe nada: devuelve el más fino.
 */
function coarsestRequired(metrics: readonly Metric[]): Grain {
  let coarsest = GRAINS.length - 1
  for (const m of metrics) {
    const i = GRAINS.indexOf((m.granoMinimo ?? 'dia') as Grain)
    if (i >= 0) coarsest = Math.min(coarsest, i)
  }
  return GRAINS[coarsest] ?? 'dia'
}

function grainOf(period: Period): Grain {
  return (period.grano ?? 'mes') as Grain
}

export { GRAINS, GRAIN_LABEL, coarsestRequired, grainOf }
export type { Grain }
