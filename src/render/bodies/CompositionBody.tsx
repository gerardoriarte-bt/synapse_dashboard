/** `composition` · forma `composicion` · colSpan 4–8, rowSpan 4–5 · F1.13g
 *
 *  **Agrupa en «Otros» a partir de la quinta parte.** La razón es de sistema y no
 *  de gusto: la rampa de familia tiene cinco escalones, así que una sexta parte
 *  repetiría un color y dos partes distintas se verían iguales. Es el mismo tope
 *  que §5 le pone a la dona, por la misma razón.
 */
import { Label } from '../primitives/Label'
import { Value } from '../primitives/Value'
import { PlotComposition } from '../plots/PlotComposition'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY.
 *
 *  **Uno de los siete que §5 le da a `composicion`.** `PlotComposition` dibuja
 *  una barra apilada al 100%, que es exactamente `stacked100`; `stacked`,
 *  `donut`, `treemap`, `marimekko`, `waterfall` y `funnel` no tienen dibujo
 *  todavía y se declaran.
 *
 *  **`donut` es el caso que más engaña**: reparte igual —el mismo prefijo
 *  acumulado que usa `<Arc>`— así que sustituirlo por la barra daría un panel
 *  creíble con la geometría equivocada. Y `stacked` tampoco es esto: apila
 *  valores absolutos, y acá el reparto es sobre `porcentaje`. */
const DIBUJA = ['stacked100'] as const

export type CompositionParams = { orden?: 'desc' | 'natural' }

/** Cuatro visibles más «Otros» = los cinco escalones de la rampa. */
const VISIBLE = 4

export function CompositionBody({
  value,
  params,
  family,
  grafico,
  unit,
  format,
}: BodyProps<'composicion', CompositionParams>) {
  // La comprobación va ANTES de dibujar, no dentro de una rama · mismo idioma
  // que `SeriesBody` y `ForecastBody`: resuelta abajo, la rama que se olvide se
  // ve bien.
  const conocidos: readonly string[] = DIBUJA
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  // ── **EL TOTAL REPARTIDO** · §6 y §PEN «Cuerpo Composición» · 2026-09-28 ────
  //
  // §6 declara este tipo como «partes de un todo · **declara el total
  // repartido**», y el dibujo lo pinta —«TOTAL REPARTIDO · USD 4.28M»—. **No
  // estaba**: el cuerpo dibujaba el plot y nada más, así que una composición
  // decía qué proporción tiene cada parte y no de cuánto.
  //
  // **Se suma acá y eso no rompe la regla del adaptador.** Lo que el contrato
  // prohíbe derivar es `porcentaje`, y con razón escrita: la suma tiene que dar
  // 100 y redondear en el cliente produce columnas que suman 99,9. Un total es
  // otra cosa — es la suma de cifras que ya llegaron, sin redondeo intermedio, y
  // es la misma clase que la conversión entre etapas de un flujo, que el
  // contrato concede como presentación.
  //
  // **Sobre TODAS las partes, no las visibles.** Se agrupa a partir de la
  // quinta, y sumar las cinco de la pantalla daría un total menor que el real —
  // que es la clase de cifra que se ve bien y miente.
  const total = value.partes.reduce((s, p) => s + p.v, 0)
  // Copia antes de ordenar: el arreglo viene del payload cacheado.
  const parts = params.orden === 'natural' ? value.partes : [...value.partes].sort((a, b) => b.v - a.v)

  const visible = parts.slice(0, VISIBLE)
  const rest = parts.slice(VISIBLE)
  const withOthers =
    rest.length === 0
      ? visible
      : [
          ...visible,
          {
            etiqueta: `Otros · ${rest.length}`,
            v: rest.reduce((s, p) => s + p.v, 0),
            porcentaje: rest.reduce((s, p) => s + p.porcentaje, 0),
          },
        ]

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <PlotComposition
        parts={withOthers}
        family={family}
        format={(v) => format.number(v, { decimals: 1 })}
      />
      <Value label="Total repartido" size="cell">
        {format.withUnit(format.number(total, { abbreviate: true }), unit)}
      </Value>
      {rest.length > 0 && (
        <Label>{`${rest.length} partes agrupadas · la rampa tiene cinco escalones`}</Label>
      )}
    </div>
  )
}
