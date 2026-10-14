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
import { PlotDonut } from '../plots/PlotDonut'
import { PlotTreemap } from '../plots/PlotTreemap'
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
/** ── `donut` Y `treemap` LLEGARON ACÁ · 2026-10-01 ───────────────────────────
 *
 *  **Estaban en `BarsBody`, sobre `categorica`, y ahí mentían.** Los dos dibujan
 *  parte-sobre-todo: calculan la cuota de cada ítem sobre la suma. Con una
 *  categórica cuyos valores son porcentajes de METAS DISTINTAS, esa suma no
 *  significa nada — la dona llegó a escribir `461,1` en el centro con dato real.
 *
 *  **Acá sí vale**, y por la definición de la forma: `composicion` ES un todo
 *  repartido, tanto que el contrato le hace traer el `porcentaje` de cada parte
 *  calculado por el servicio. Las partes suman el total por construcción.
 *
 *  `docs/AUDITORIA-2026-10-01-comprension-de-graficos.md` §1. */
const DIBUJA = ['stacked100', 'donut', 'treemap'] as const

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
  presentation,
  metric,
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
  // **Se agrupa a partir de DOS**, no de uno · 2026-10-01. Con una sola parte
  // sobrante la leyenda decía `Otros · 1`: agrupar uno no ahorra un escalón de
  // rampa ni una línea de leyenda, y lo único que hace es esconder su nombre.
  // Visto en pantalla — el `Otros · 1` de la dona era INVERSIÓN.
  const withOthers =
    rest.length <= 1
      ? parts
      : [
          ...visible,
          {
            etiqueta: `Otros · ${rest.length}`,
            v: rest.reduce((s, p) => s + p.v, 0),
            porcentaje: rest.reduce((s, p) => s + p.porcentaje, 0),
          },
        ]

  /** Lo que los dos gráficos de parte-sobre-todo comen, en la forma que esperan.
   *
   *  **Va la lista YA agrupada, y hoy eso no cambia el dibujo.** `PlotDonut`
   *  agrupa por su cuenta con el mismo `VISIBLE = 4`, así que pasarle las partes
   *  crudas daría el mismo resultado — está comprobado: la mutación que cambia
   *  esta línea por `parts` sobrevive, y es equivalente.
   *
   *  **Se deja agrupada igual**, por una razón que la equivalencia no cubre: el
   *  día que un plot elija otro tope, el cuerpo seguiría repartiendo lo mismo en
   *  los tres gráficos. Si dependiera del plot, el mismo panel agruparía o no
   *  según cuál eligió quien compuso. */
  const comoCategorica = {
    forma: 'categorica' as const,
    items: withOthers.map((x) => ({ etiqueta: x.etiqueta, v: x.v })),
  }

  if (grafico === 'donut' || grafico === 'treemap') {
    return (
      <div className="h-full min-h-0 flex flex-col gap-2">
        {grafico === 'donut' ? (
          <PlotDonut
            value={comoCategorica}
            family={family}
            format={(v) => format.number(v, { abbreviate: true })}
            /* **El rótulo del centro no lo escribe el front.** Sale de
               `presentation.label`, que lo redacta el backend con su período, y
               si no viene cae al NOMBRE DE LA MÉTRICA, que es del catálogo. Las
               dos fuentes son de quien manda el copy; inventar «Total» acá sería
               escribir copy de producto en el cuerpo. Es la misma resolución que
               `BarsBody` tenía, y se mudó con el gráfico. */
            totalLabel={presentation?.label ?? metric}
          />
        ) : (
          <PlotTreemap
            value={comoCategorica}
            family={family}
            format={(v) => format.number(v, { abbreviate: true })}
          />
        )}
        {/* **El total va también acá**, y no sólo en el apilado: §6 pide que este
            tipo declare el total repartido, y eso es del CUERPO, no del dibujo.
            Sin esta línea, elegir la dona perdería la cifra de la que se reparte. */}
        <Value label="Total repartido" size="cell">
          {format.withUnit(format.number(total, { abbreviate: true }), unit)}
        </Value>
      </div>
    )
  }

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
      {/* **`> 1` y no `> 0`**, igual que el agrupado de arriba y por la misma
          razón: con una sola parte sobrante no se agrupa nada, y anunciar «1
          partes agrupadas» sobre una lista sin agrupar es peor que el silencio.
          Lo encontró la prueba del `Otros · 1`, no la lectura. */}
      {rest.length > 1 && (
        <Label>{`${rest.length} partes agrupadas · la rampa tiene cinco escalones`}</Label>
      )}
    </div>
  )
}
