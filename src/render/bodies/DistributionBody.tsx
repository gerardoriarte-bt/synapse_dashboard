/** `distribution` · forma `distribucion` · colSpan 5–8, rowSpan 4–5 · F1.13g */
import { PlotDistribution } from '../plots/PlotDistribution'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY.
 *
 *  **Uno de los cinco de `distribucion`, y de los otros cuatro tres no se pueden
 *  dibujar aunque se construya el componente.** `scatter`, `bubble` y
 *  `cuadrantes` necesitan pares `(x, y)` y `ValorDistribucion` sólo lleva
 *  `cortes` — está medido en
 *  `docs/ENTREGA-2026-09-29-repertorio-de-graficos.md`, «TRES GRÁFICOS CUELGAN
 *  DE UNA FORMA QUE NO PUEDE LLEVARLOS», y es propuesta de spec, no una tarea.
 *  `box` sí come `cortes` y no tiene dibujo.
 *
 *  Queda `histogram`, que es lo que `PlotDistribution` dibuja: la lectura plana
 *  de la distribución sobre sus cortes. **La marca es un punto y no una barra**
 *  —§6.3, reusa `Dots`—, así que si diseño quiere la barra es un cambio del
 *  plot y no de esta lista. */
const DIBUJA = ['histogram'] as const

export type DistributionParams = { bins?: number }

export function DistributionBody({
  value,
  family,
  grafico,
  format,
}: BodyProps<'distribucion', DistributionParams>) {
  // La comprobación va ANTES de dibujar, no dentro de una rama · mismo idioma
  // que `SeriesBody` y `ForecastBody`: resuelta abajo, la rama que se olvide se
  // ve bien.
  const conocidos: readonly string[] = DIBUJA
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  return (
    <div className="h-full min-h-0">
      <PlotDistribution
        cuts={value.cortes}
        family={family}
        format={(v) => format.number(v, { abbreviate: true })}
      />
    </div>
  )
}
