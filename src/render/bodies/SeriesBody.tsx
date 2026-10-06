/** `series` · formas `serieTemporal` y `seriesMultiples` · colSpan 5–7, rowSpan 4–5 · F1.13g */
import { PlotSeries } from '../plots/PlotSeries'
import { PlotStackArea } from '../plots/PlotStackArea'
import { PlotSpark } from '../plots/PlotSpark'
import { PlotBump } from '../plots/PlotBump'
import { PlotSlope } from '../plots/PlotSlope'
import { PlotCombo } from '../plots/PlotCombo'
import { PlotSmallMult } from '../plots/PlotSmallMult'
import { EmptyState } from '../states/EmptyState'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { DrawableSeries } from '../plots/PlotSeries'
import { granoDe } from '../plots/core/grano'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY, POR FORMA.
 *
 *  ── LA LISTA SE ACHICÓ DE CATORCE A TRES · 2026-09-29 ───────────────────────
 *
 *  **Hasta hoy declaraba los ids que el REPERTORIO le asigna, no los que
 *  dibuja**, y con eso doce de los catorce caían a `PlotSeries` en silencio —
 *  que es exactamente lo que `UnknownPlotState` existe para impedir. El caso que
 *  lo deja ver es `control`: el componente existe —`PlotControl`, lo usa
 *  `ForecastBody`— y un `serieTemporal` que lo pedía dibujaba una línea pelada,
 *  sin límites y sin marcar el punto que se sale.
 *
 *  Lo que queda es lo que hay:
 *
 *   · `serieTemporal` → **`area`**. Con una sola serie `PlotSeries` rellena
 *     —`area={normalized.length === 1}`—, así que es un área y no una línea.
 *     Por eso `multiline` **no** está acá aunque §5 lo liste en esta forma: se
 *     pide una línea y se recibe un área.
 *   · `seriesMultiples` → **`multiline`**, que es lo que `PlotSeries` dibuja sin
 *     relleno, y **`stackarea`**, el único con dibujo propio.
 *
 *  **`stackarea` no está en `serieTemporal` y no es un olvido**: apilar una sola
 *  serie contra nada es el área que `PlotSeries` ya dibuja, y ofrecerlo como si
 *  fuera otra cosa prometería una composición donde hay una línea.
 *
 *  Los once que salieron —`columns`, `step`, `spark`, `cycle`, `candle`,
 *  `control`, `combo`, `smallmult`, `bump`, `slope` y `multiline` sobre una
 *  serie— no son un hueco nuevo: eran un hueco tapado.
 *
 *  ── Y VOLVIERON TRES · 2026-09-29, por la tarde ─────────────────────────────
 *
 *  `spark`, `bump` y `slope` se cablearon el mismo día, con su dibujo propio:
 *  `PlotSpark`, `PlotBump` y `PlotSlope`. Los tres son geometrías que
 *  `PlotSeries` no sabe hacer —una micro tendencia sin ejes, un ranking por
 *  puesto y un par de columnas— así que caer al área nunca fue una sustitución
 *  aceptable, y ahora no hace falta.
 *
 *  **`combo` y `smallmult` NO se cablearon aunque el archivo exista**, y no es
 *  un olvido: su QA quedó sin aprobar. Lo que falta está escrito en el informe
 *  de la auditoría del 2026-09-29 y el efecto es el correcto mientras tanto —
 *  los dos caen en `UnknownPlotState`, que dice el id en pantalla. */
const DIBUJA = {
  serieTemporal: ['area', 'spark'],
  seriesMultiples: ['multiline', 'stackarea', 'bump', 'slope', 'combo', 'smallmult'],
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
  // **De la MÉTRICA y no del valor** · sólo la lee `smallmult`, que la usa para
  // completar el «8.9K u.» que su frame dibuja. Los demás gráficos de este
  // cuerpo sacan sus rótulos de las etiquetas de cada serie.
  unit,
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

  // **`spark` dibuja UNA serie y esta forma trae una sola**, así que sale de
  // `normalized[0]`. Se reconstruye el valor en vez de pasar `value` porque el
  // despacho es por `grafico` y no por forma: con `value` haría falta estrechar
  // la unión otra vez acá, y una rama que no estreche cae al área en silencio —
  // que es lo que el guardia de arriba existe para impedir.
  if (grafico === 'spark') {
    return (
      <div className="h-full min-h-0">
        <PlotSpark
          value={{ forma: 'serieTemporal', puntos: normalized[0]?.puntos ?? [] }}
          family={family}
          format={(v) => format.number(v, { abbreviate: true })}
        />
      </div>
    )
  }

  // **`bump` recibe las series CRUDAS, igual que `stackarea` y por una razón
  // igual de concreta.** Un ranking compara las series ENTRE SÍ en cada período;
  // `base100` divide cada una por su PROPIO primer punto, así que en el primer
  // período las empata todas en 100 y el orden que sale de ahí no es el del
  // dato. La normalización sirve para comparar magnitudes distintas en un eje de
  // valores, y acá el eje es de puestos.
  // ── `combo` · EL CUERPO REPARTE LOS ROLES, Y POR ESO PIDE DOS ──────────────
  //
  // `PlotCombo` no recibe un arreglo: recibe `columns` y `line` por separado, y
  // su cabecera dice por qué —«para que "combinado con una sola serie" no sea
  // construible»—. El reparto es de acá, y la única fuente honesta del orden es
  // **el orden del payload**: la primera va en columnas y la segunda en la
  // línea, que es como el `.pen` dibuja `Inversión y ROAS`. Elegir cuál es cuál
  // mirando las magnitudes sería el cuerpo adivinando.
  //
  // **Con menos de dos no se dibuja, y no cae a la línea.** Un combinado de una
  // serie es una serie, y pintarla como si fuera un combinado es la sustitución
  // silenciosa que `UnknownPlotState` existe para impedir — acá con otra cara,
  // porque el id SÍ se sabe dibujar y lo que falta es el dato. Por eso el estado
  // es `EmptyState` y no el del gráfico desconocido: dice qué falta, que es lo
  // que §8 pide.
  //
  // **Va con las series CRUDAS.** `base100` divide cada una por su primer punto
  // y las deja en la misma escala; un combinado existe precisamente porque las
  // dos NO son comparables —una inversión en millones contra un ROAS de 4,1— y
  // aplanarlas a la misma base borra la razón de tener dos ejes.
  if (grafico === 'combo') {
    const columnas = series[0]
    const linea = series[1]
    if (columnas === undefined || linea === undefined) {
      return (
        <EmptyState
          phrase="Un combinado necesita dos series y llegó una"
          detail="Una sola serie se dibuja como línea · elegí otro gráfico o agregá la segunda"
        />
      )
    }
    return (
      <div className="h-full min-h-0">
        <PlotCombo
          columns={columnas}
          line={linea}
          family={family}
          format={(v) => format.number(v, { abbreviate: true })}
        />
      </div>
    )
  }

  // ── `smallmult` · LA NORMALIZACIÓN SÍ VALE ACÁ, Y NO ES OBVIO ──────────────
  //
  // La cabecera de `PlotSmallMult` lo dice medido: «la escala es compartida **y**
  // el dominio» entre las divisiones. Con escala compartida, dos series de
  // magnitudes distintas dejan a la chica pegada al piso y su forma no se puede
  // comparar con nada — que es justo para lo que `base100` existe. Así que acá
  // se pasa `normalized` y no `series`, al revés que `bump`.
  if (grafico === 'smallmult') {
    return (
      <div className="h-full min-h-0">
        <PlotSmallMult
          series={normalized}
          family={family}
          format={(v) => format.number(v, { abbreviate: true })}
          {...(unit === undefined ? {} : { unit })}
        />
      </div>
    )
  }

  if (grafico === 'bump') {
    return (
      <div className="h-full min-h-0">
        <PlotBump
          value={{ forma: 'seriesMultiples', series }}
          family={family}
          format={(v) => format.number(v, { abbreviate: true })}
        />
      </div>
    )
  }

  // `slope` sí la respeta: son dos columnas sobre un eje de VALORES, que es
  // exactamente el caso para el que `base100` existe —comparar series cuyas
  // magnitudes no son comparables—.
  if (grafico === 'slope') {
    return (
      <div className="h-full min-h-0">
        <PlotSlope
          value={{ forma: 'seriesMultiples', series: normalized }}
          family={family}
          format={(v) => format.number(v, { abbreviate: true })}
        />
      </div>
    )
  }

  // **La lectura escribe la cifra entera y con su unidad** · 2026-10-06. Con
  // `base100` la unidad deja de valer —la cifra es un índice, no un monto— y
  // por eso se cae: «USD 112» sobre una serie normalizada sería mentir.
  const unidadDeLectura = params.normalizacion === 'base100' ? undefined : unit
  return (
    <div className="h-full min-h-0">
      <PlotSeries
        series={normalized}
        family={family}
        format={(v) => format.number(v, { abbreviate: true })}
        area={normalized.length === 1}
        fechar={(t) => format.axisDate(t, granoDe(normalized))}
        leer={(v) => format.withUnit(format.number(v), unidadDeLectura)}
      />
    </div>
  )
}
