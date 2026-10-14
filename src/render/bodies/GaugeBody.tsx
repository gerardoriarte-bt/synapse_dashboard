/** `gauge` · forma `escalar` · colSpan 3–7, rowSpan 4 · F1.13g
 *
 *  **Sin `maximo` no se dibuja el arco.** Un medidor es una proporción, y sin
 *  denominador es un número con un adorno circular. Cae a decirlo, que es lo
 *  honesto: lo que falta es la BASE, y §1.3 no deja inventarla.
 */
import { Label } from '../primitives/Label'
import { PlotGauge } from '../plots/PlotGauge'
import { PlotBullet } from '../plots/PlotBullet'
import { PlotRings } from '../plots/PlotRings'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY.
 *
 *  **Dos de los cinco que §5 le da a `escalar`** · `bullet` se cableó el
 *  2026-09-29. `PlotGauge` dibuja el arco de tres cuartos de vuelta y
 *  `PlotBullet` la barra contra el objetivo — **y la diferencia entre las dos no
 *  es estética**: el arco clampea a 1, así que un 103 % y un 100 % dibujan el
 *  mismo arco cerrado, y la barra pasa la marca. Sustituir una por la otra
 *  borraría el sobrecumplimiento sin decir nada.
 *
 *  Los dos comen el MISMO param —`maximo`, que es el denominador— y por eso
 *  viven en el mismo cuerpo: sin él ninguno de los dos se puede leer como
 *  proporción, y la caída es una sola, más abajo.
 *
 *  `rings` queda afuera y **no por falta de dibujo**: `PlotRings.tsx` existe
 *  desde hoy y pide una LISTA de anillos —`{ rings: readonly Ring[] }`—, que
 *  `ValorEscalar` no lleva: es `{ forma, v }`. No hay de dónde sacar los otros
 *  anillos. Y `spark` come `puntos`, así que su cuerpo es `SeriesBody`. `kpi`
 *  tampoco entra acá: es la cifra sola, y la dibuja `KpiBody`. */
const DIBUJA = ['gauge', 'bullet', 'rings'] as const

export type GaugeParams = {
  /** Contra qué se mide. Sin esto un medidor no dice nada: 72 sobre qué. */
  maximo?: number
  banda?: { lo: number; hi: number; etiqueta: string }
}

export function GaugeBody({
  value,
  params,
  family,
  grafico,
  unit,
  format,
  // **Los dos son del rótulo del anillo**, y sólo los lee `rings`. Mismo par y
  // misma precedencia que el total de la dona en `BarsBody`: el backend redacta
  // con su período, y sin eso manda el catálogo.
  presentation,
  metric,
}: BodyProps<'escalar', GaugeParams>) {
  // La comprobación va ANTES de dibujar, no dentro de una rama · mismo idioma
  // que `SeriesBody` y `ForecastBody`: resuelta abajo, la rama que se olvide se
  // ve bien.
  const conocidos: readonly string[] = DIBUJA
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  const { maximo, banda } = params
  const figure = (v: number) => format.number(v, { abbreviate: true })

  if (maximo === undefined || maximo <= 0) {
    return (
      <div className="h-full min-h-0 flex items-center">
        <Label>Sin máximo declarado · no se puede leer como proporción</Label>
      </div>
    )
  }

  // **El shell no cambia con el dibujo.** La línea de BASE —«Sobre N», o la
  // banda— queda abajo en los dos casos: es lo que declara el denominador, y §1
  // lo pide del panel y no del plot.
  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      {grafico === 'rings' ? (
        // ── UN ANILLO, Y ESO ES LO HONESTO ────────────────────────────────
        //
        // La cabecera de `PlotRings` lo dejó resuelto al construirlo: el plot
        // recibe una LISTA porque el `.pen` dibuja tres —VENTAS, ÓRDENES y
        // ROAS— y **un panel se ancla a UN `metricId`**. Así que el cuerpo le
        // pasa un elemento y se ve un anillo solo. *«El día que el cable traiga
        // el dato múltiple cambia el cuerpo y no este archivo.»*
        //
        // **Por eso se cablea y no queda como propuesta de spec.** La auditoría
        // del lote lo anotó como candado —«pide `{ rings: Ring[] }` y
        // `ValorEscalar` es `{ forma, v }`»— y la premisa estaba dada vuelta:
        // una lista de uno se construye desde un escalar sin inventar nada. Lo
        // que NO se puede hoy es dibujar los tres, y eso es del cable.
        //
        // `label` sale de `presentation.label` y cae al nombre de la métrica,
        // igual que el total de la dona: las dos son de quien manda el copy.
        <PlotRings
          rings={[{ k: 'uno', label: presentation?.label ?? metric, value: value.v, max: maximo }]}
          family={family}
          format={figure}
        />
      ) : grafico === 'bullet' ? (
        <PlotBullet value={value} objetivo={maximo} family={family} format={figure} />
      ) : (
        <PlotGauge
          value={value.v}
          max={maximo}
          family={family}
          format={figure}
          {...(unit === undefined ? {} : { unit })}
        />
      )}
      <Label>
        {banda === undefined
          ? `Sobre ${figure(maximo)}`
          : `${banda.etiqueta} · ${figure(banda.lo)}–${figure(banda.hi)}`}
      </Label>
    </div>
  )
}
