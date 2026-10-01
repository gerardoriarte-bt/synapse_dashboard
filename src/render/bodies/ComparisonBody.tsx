/** `comparison` · formas `categoricaComparada` y `perfilMultiatributo` · colSpan 5–8, rowSpan 4–5 · F4.17
 *
 *  ── HOSPEDA DOS FORMAS Y DIBUJA UNA ────────────────────────────────────────
 *
 *  `GET /config/blocks` declara el bloque con `accepted_shapes:
 *  ['compared_categorical', 'multi_attribute_profile']` —medido contra el
 *  servicio corriendo—, así que el cuerpo tiene que **ramificar por
 *  `value.forma` antes que por `grafico`**. El tipo acepta las dos: si aceptara
 *  sólo una, el registro —que borra los tipos— dejaría pasar la otra en runtime
 *  y `PlotDumbbell` leería `items` de un perfil, que es `undefined`.
 *
 *  **De `perfilMultiatributo` el repertorio da UN gráfico y no está
 *  construido.** `radar` es el único de los 49 que sirve esa forma, y
 *  `PlotRadar` no existe: se declara con `UnknownPlotState`, que dice el id en
 *  pantalla. **No cae a `dumbbell`**, que es la sustitución silenciosa que ese
 *  estado existe para impedir — un radar de seis ejes dibujado como cinco pesas
 *  se ve perfecto y no es lo que alguien pidió.
 *
 *  ── POR QUÉ `dumbbell` Y NO LOS OTROS TRES ──────────────────────────────────
 *
 *  `categoricaComparada` tiene cuatro gráficos en el repertorio —`tornado`,
 *  `slope`, `grouped` y `dumbbell`— y hoy se dibujan tres:
 *
 *   · **`tornado` y `grouped` se construyeron el 2026-10-01 y se cablean acá.**
 *     Hasta ese día esta línea decía «no tienen componente», y siguió diciéndolo
 *     después de que los dos existieran: es otra vez lo declarado en prosa que
 *     se deshace solo. **Lo encontró el QA de cada gráfico** avisando que su
 *     propio plot era código muerto —`DIBUJA` no lo nombraba y nadie lo
 *     importaba fuera de su prueba—, no una prueba ni la puerta.
 *   · **`slope` tiene componente y no sirve acá.** `PlotSlope` es
 *     `PlotProps<'seriesMultiples'>`: para pasarle esta forma habría que
 *     fabricar dos series con un punto cada una, y esa traducción es una
 *     decisión de dibujo que nadie tomó. Cuando se tome, es una rama más acá y
 *     no un cambio del plot.
 *
 *  ── SIN `referencia` NO HAY COMPARACIÓN, Y EL ESTADO LO DICE ─────────────────
 *
 *  El contrato lo declara opcional y su propio comentario dice qué significa que
 *  falte: «es una categórica común con otro nombre, y el panel tiene que decirlo
 *  en vez de inventar un objetivo». `PlotDumbbell` ya descarta las filas sin
 *  referencia —sin `?? 0`, con su razón escrita—, así que un payload donde
 *  ninguna la trae le llega vacío y dibuja un SVG en blanco.
 *
 *  **Un panel vacío que no dice por qué es el defecto**, así que la guardia es
 *  de acá: `EmptyState` con qué falta. Es `EmptyState` y no `UnknownPlotState`
 *  porque el gráfico SÍ se sabe dibujar — lo que falta es el dato, y eso es lo
 *  que §8 pide que se diga. Mismo reparto que el `combo` de `SeriesBody`.
 *
 *  ── NINGÚN PARAM SE LEE, Y ES MEDIDO ───────────────────────────────────────
 *
 *  El bloque declara `reference`, `order` y `profile_cap`. Los tres quedan sin
 *  leer, cada uno por su razón:
 *
 *   · `reference` no puede agregar una referencia que el dato no trae — vive en
 *     `items[].referencia`, no en el layout.
 *   · `profile_cap` recortaría perfiles de un radar que no se dibuja.
 *   · `order` sí se podría aplicar, y **no se aplica**: el payload llega ordenado
 *     por el `ORDER BY` de la consulta y `PlotDumbbell` respeta el orden natural
 *     —hay una mutación que lo mata—. Ordenar acá pondría dos autoridades sobre
 *     lo mismo. Es la misma resolución que `TableBody` tomó en F1.44.
 *
 *  Por eso `ComparisonParams` es `Record<string, never>` y `PARAM_SCHEMAS` no
 *  declara `comparison`: los tres se reportan como desconocidos, que es la regla
 *  de `api/params.ts` —«lo que no se lee, no se valida»— y acá además es cierto.
 */
import { PlotDumbbell } from '../plots/PlotDumbbell'
import { PlotGrouped } from '../plots/PlotGrouped'
import { PlotTornado } from '../plots/PlotTornado'
import { EmptyState } from '../states/EmptyState'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY, POR FORMA.
 *
 *  **`perfilMultiatributo` queda en lista vacía a propósito, y no ausente**: una
 *  forma sin entrada haría `DIBUJA[value.forma]` `undefined` y el `includes`
 *  reventaría. Vacía significa «esta forma no tiene ningún dibujo», que es la
 *  verdad medida y lo que decide la rama de abajo. */
const DIBUJA = {
  categoricaComparada: ['dumbbell', 'tornado', 'grouped'],
  perfilMultiatributo: [],
} as const

/** **`dumbbell` sigue siendo el de por defecto**, y la razón no es la
 *  antigüedad: es el único de los tres que dibuja la comparación SIN decidir
 *  nada más por el lector. El tornado ordena por desvío y el agrupado pone la
 *  referencia como una columna fantasma al lado — las dos son lecturas, y
 *  elegirlas es de quien compone el panel, no del cuerpo. */
const DEFECTO = 'dumbbell'

/** El único gráfico que el repertorio le da a `perfilMultiatributo`.
 *
 *  Se nombra para que el estado diga un id del repertorio y no una frase
 *  nuestra: quien lo lea puede buscarlo en `GET /config/plots`. */
const RADAR = 'radar'

export type ComparisonParams = Record<string, never>

export function ComparisonBody({
  value,
  family,
  grafico,
  format,
}: BodyProps<'categoricaComparada' | 'perfilMultiatributo', ComparisonParams>) {
  // Antes de elegir el dibujo, y no dentro de cada rama · mismo idioma que
  // `SeriesBody`: resuelta abajo, la rama que se olvide se ve bien.
  const conocidos: readonly string[] = DIBUJA[value.forma]
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  // **Sin gráfico declarado y sin ninguno que dibujar tampoco se cae al otro
  // brazo.** `grafico` ausente significa «el de por defecto del cuerpo» y esta
  // forma no tiene uno, así que el estado nombra el único id que la sirve.
  if (value.forma === 'perfilMultiatributo') {
    return <UnknownPlotState grafico={RADAR} />
  }

  if (!value.items.some((i) => i.referencia !== undefined)) {
    return (
      <EmptyState
        phrase="Ninguna categoría trae contra qué compararse"
        detail="Sin referencia esto es una categórica · elegí otro gráfico o pedí el objetivo a la métrica"
      />
    )
  }

  // La cifra se formatea una vez y se pasa igual a los tres · si cada rama
  // armara la suya, dos gráficos del mismo panel abreviarían distinto.
  const figure = (v: number) => format.number(v, { abbreviate: true })

  // El defecto se resuelve ACÁ y una vez, no en el orden de las ramas: con
  // `grafico ?? DEFECTO` la última rama es la del dumbbell PORQUE la constante
  // lo dice, y no porque quedó al final.
  const elegido = grafico ?? DEFECTO

  if (elegido === 'tornado') {
    return (
      <div className="h-full min-h-0">
        <PlotTornado value={value} family={family} format={figure} />
      </div>
    )
  }

  if (elegido === 'grouped') {
    return (
      <div className="h-full min-h-0">
        <PlotGrouped value={value} family={family} format={figure} />
      </div>
    )
  }

  return (
    <div className="h-full min-h-0">
      <PlotDumbbell value={value} family={family} format={figure} />
    </div>
  )
}
