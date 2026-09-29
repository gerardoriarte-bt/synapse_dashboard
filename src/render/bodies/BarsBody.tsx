/** `bars` · formas `categorica` y `ranking` · colSpan 4–8, rowSpan 4–5 · F1.13g */
import { PlotBars } from '../plots/PlotBars'
import { PlotColumns } from '../plots/PlotColumns'
import { PlotLollipop } from '../plots/PlotLollipop'
import { PlotDonut } from '../plots/PlotDonut'
import { PlotRadial } from '../plots/PlotRadial'
import { PlotPareto } from '../plots/PlotPareto'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY, POR FORMA.
 *
 *  ── SEIS DE LOS SIETE DE `categorica` · cableados el 2026-09-29 ─────────────
 *
 *  §5 le asigna a `categorica` siete —`columns`, `bars`, `lollipop`, `donut`,
 *  `treemap`, `radial`, `pareto`— y hoy se dibujan seis. **El que falta es
 *  `treemap`, y su archivo EXISTE**: `PlotTreemap.tsx` está construido y su QA
 *  quedó sin aprobar, así que no se cablea. Cae en `UnknownPlotState`, que dice
 *  el id en pantalla en vez de servir barras con cara de mosaico.
 *
 *  Va por forma, igual que en `SeriesBody`: este cuerpo hospeda dos y un id
 *  puede ser legítimo en una y no en la otra. **`lollipop` es el único de los
 *  seis que §5 le da también a `ranking`** —el resto son de `categorica` sola—,
 *  y acá se dibuja igual en las dos porque este cuerpo ya las trata igual:
 *  ordena, recorta y arma un `categorica` para el plot.
 *
 *  `bump` y `table`, los otros dos que §5 le da a `ranking`, **no entran acá**:
 *  `bump` come `seriesMultiples` —lo dibuja `SeriesBody`— y `table` es de
 *  `TableBody`. */
const DIBUJA = {
  categorica: ['bars', 'columns', 'lollipop', 'donut', 'radial', 'pareto'],
  ranking: ['bars', 'lollipop'],
} as const

export type BarsParams = {
  /** `desc` es el defecto: un ranking se lee de mayor a menor. */
  orden?: 'desc' | 'asc' | 'natural'
  tope?: number
}

/** ── LA COLUMNA DESTACADA DEL DIBUJO NO ES ALCANZABLE, Y NO SE RELLENÓ ────────
 *
 *  `PlotColumns` acepta `destacado?: string` —la etiqueta de la columna a
 *  resaltar— y el `.pen` la dibuja: es lo único que distingue una columna de las
 *  otras once en `Plot/COLUMNAS`. Acá **no se pasa**, y la razón es la frontera
 *  y no el olvido.
 *
 *  Un param de layout no alcanza con declararlo en `BarsParams`: `validateParams`
 *  lo cruza contra `paramsDisponibles` de `/config/blocks`, **que lo declara el
 *  backend**. Un nombre que el servicio no lista se descarta como desconocido,
 *  así que un `destacado` escrito sólo de este lado sería un param que compila,
 *  valida contra la tabla local y **nunca llega** — el mismo silencio que F1.29
 *  existe para cerrar.
 *
 *  Queda como pedido al backend, no como hueco del plot: la rama del componente
 *  está construida y probada, y se enciende el día que `bars` liste `destacado`
 *  entre sus params. Escrito en el informe de la auditoría del 2026-09-29. */

export function BarsBody({
  value,
  params,
  family,
  grafico,
  metric,
  presentation,
  unit,
  format,
}: BodyProps<'categorica' | 'ranking', BarsParams>) {
  // La comprobación va ANTES de dibujar, no dentro de una rama · mismo idioma
  // que `SeriesBody` y `ForecastBody`: resuelta abajo, la rama que se olvide se
  // ve bien.
  const conocidos: readonly string[] = DIBUJA[value.forma]
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  const { orden = 'desc', tope } = params

  const items = value.items.map((i) => ({ etiqueta: i.etiqueta, v: i.v }))
  // Copia antes de ordenar: `sort` muta, y el arreglo viene del payload que
  // TanStack Query tiene en cache. Ordenarlo en el lugar cambia lo que ve el
  // próximo lector de esa entrada.
  const sorted =
    orden === 'natural'
      ? items
      : [...items].sort((a, b) => (orden === 'desc' ? b.v - a.v : a.v - b.v))
  const trimmed = tope === undefined ? sorted : sorted.slice(0, tope)

  const figure = (v: number) => format.number(v, { abbreviate: true })

  // ── **DOS GRÁFICOS RECIBEN LA LISTA ENTERA, ANTES DE `tope`** ──────────────
  //
  // No es una excepción cómoda: los dos derivan una cifra del TOTAL de lo que
  // reciben, así que recortar antes convierte el recorte en una mentira.
  //
  //  · `donut` suma el centro sobre lo que le llegó y agrupa el resto en
  //    «Otros» adentro del plot. Con `tope` aplicado antes, el centro sumaría
  //    una parte y la presentaría como el total — el mismo defecto que
  //    `CompositionBody` ya tiene registrado por escrito.
  //  · `pareto` cierra su curva en 100 %. Sobre una lista recortada afirma que
  //    las N mostradas son todas las causas, que es justo lo que un pareto no
  //    puede afirmar de más.
  //
  // `sorted` y no `items`: los dos ordenan o reparten desde el mayor, y el
  // pareto además vuelve a ordenar adentro porque un pareto ES el orden.
  if (grafico === 'donut') {
    return (
      <div className="h-full min-h-0">
        <PlotDonut
          value={{ forma: 'categorica', items: sorted }}
          family={family}
          format={figure}
          // **El rótulo del centro no lo escribe el front.** Sale de
          // `presentation.label`, que lo redacta el backend con su período, y si
          // no viene cae al NOMBRE DE LA MÉTRICA, que es del catálogo. Las dos
          // fuentes son de quien manda el copy; inventar «Total» acá sería
          // escribir copy de producto en el cuerpo.
          totalLabel={presentation?.label ?? metric}
        />
      </div>
    )
  }

  if (grafico === 'pareto') {
    return (
      <div className="h-full min-h-0">
        <PlotPareto
          value={{ forma: 'categorica', items: sorted }}
          family={family}
          format={figure}
        />
      </div>
    )
  }

  if (grafico === 'columns') {
    return (
      <div className="h-full min-h-0">
        <PlotColumns
          value={{ forma: 'categorica', items: trimmed }}
          family={family}
          format={figure}
        />
      </div>
    )
  }

  if (grafico === 'lollipop') {
    return (
      <div className="h-full min-h-0">
        <PlotLollipop
          value={{ forma: 'categorica', items: trimmed }}
          family={family}
          format={figure}
        />
      </div>
    )
  }

  if (grafico === 'radial') {
    return (
      <div className="h-full min-h-0">
        <PlotRadial
          value={{ forma: 'categorica', items: trimmed }}
          family={family}
          format={figure}
          {...(unit === undefined ? {} : { unit })}
        />
      </div>
    )
  }

  return (
    <div className="h-full min-h-0">
      <PlotBars
        value={{ forma: 'categorica', items: trimmed }}
        family={family}
        format={figure}
      />
    </div>
  )
}
