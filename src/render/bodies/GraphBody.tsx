/** `graph` · formas `flujo` y `grafo` · colSpan 6–12, rowSpan 7–7 · F4.19
 *
 *  ── HOSPEDA DOS FORMAS Y DIBUJA UNA ─────────────────────────────────────────
 *
 *  `/config/blocks` declara el bloque `graph` con `accepted_shapes: ['graph',
 *  'flow']` —medido contra el servicio corriendo—, así que el cuerpo ramifica
 *  por `value.forma` ANTES que por `grafico`. De `grafo` no hay un solo dibujo:
 *  `network` es el único id del repertorio que la sirve y `PlotNetwork` no
 *  existe.
 *
 *  **EL TIPO ACEPTA LAS DOS, Y ESO CAMBIÓ AL REGISTRARLO · 2026-09-30.** Hasta
 *  acá era `BodyProps<'flujo'>` con el argumento de que restringir el tipo es
 *  más fuerte que una rama. **Es falso apenas el cuerpo entra al registro**:
 *  `ErasedBodyProps` ancha `value` a la unión entera —está escrito en su propio
 *  comentario, «que el `tipo` del panel case con la `forma` de su métrica es un
 *  invariante del catálogo, no del sistema de tipos»—, así que un `grafo`
 *  compuesto sobre un bloque `graph` llega igual y `PlotSankey` leería `etapas`
 *  de un valor que trae `nodos`: `undefined`, y el SVG sale vacío sin decir por
 *  qué. El tipo estrecho no impedía nada; sólo escondía la rama.
 *
 *  ── EL DEFECTO DE `flujo` ES `sankey`, Y ES UNA DECISIÓN ─────────────────────
 *
 *  `BodyProps.grafico` ausente significa «el gráfico por defecto del cuerpo», y
 *  `flujo` **no tiene uno escrito**: los seis ids que `GraficoId` declara como
 *  cuerpo-sin-gráfico son `kpi`, `list`, `matrix`, `prose`, `reco` y `table`, y
 *  ninguno cuelga de `flujo`. Así que se decide acá y queda declarado: **el
 *  dibujo por defecto de `GraphBody` para `flujo` es `sankey`**.
 *
 *  Los otros dos que el repertorio le da a `flujo` —`funnel` y `network`— no
 *  están construidos, y **no caen a `sankey`**: se declaran. Un embudo dibujado
 *  como sankey se ve perfecto y miente sobre qué se está mirando.
 *
 *  ── NINGÚN PARAM LLEGA, Y ESO TAMBIÉN ES EL TIPO ────────────────────────────
 *
 *  `clustering` es el único `layout_param` del bloque y está en la lista que
 *  `adapt.ts` **no traduce a propósito**, con su razón escrita: pasa sin tocar y
 *  `validateParams` lo reporta como desconocido. Declararlo acá con un nombre
 *  inventado sería la deriva que esa lista evita, así que `GraphParams` es
 *  `Record<string, never>` y un sankey no puede ignorar un param en silencio.
 *
 *  ── LO QUE TODAVÍA NO LO ALCANZA ────────────────────────────────────────────
 *
 *  **`grafo` no llega de ningún lado, y por eso no está en `DIBUJABLES`.** Es la
 *  única de las cinco formas v1.1 que ninguna métrica puede emitir con el dato
 *  que hay: ninguna columna de las dos tablas Gold tiene aristas origen→destino,
 *  medido el 2026-09-29. La rama existe igual porque el registro borra los tipos
 *  y el builder puede componerla.
 *
 *  **`flujo` sí llega**, desde `spend_flow` · corrida contra Snowflake real el
 *  2026-09-30 y adaptada en `adaptValue`. Los 22 enlaces del período son las
 *  plataformas de paid media hacia un único nodo `total`.
 */
import { PlotSankey } from '../plots/PlotSankey'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY, POR FORMA.
 *
 *  De los tres que el repertorio le da a `flujo`, uno: `funnel` y `network`
 *  aceptan la forma y no tienen componente. Y `funnel` no caería bien ni con
 *  componente sobre este dato — `transformFlow` deriva el valor de cada etapa de
 *  su flujo SALIENTE, así que en un embudo la última etapa mostraría el valor de
 *  la anterior. Está medido en la prueba de contrato del fork. */
const DIBUJA = {
  flujo: ['sankey'],
  // **Vacía y no ausente**: una forma sin entrada haría `DIBUJA[value.forma]`
  // `undefined` y el `includes` de abajo reventaría. Vacía dice «esta forma no
  // tiene ningún dibujo», que es la verdad medida contra el repertorio.
  grafo: [],
} as const

/** El único gráfico que el repertorio le da a `grafo`. Se nombra para que el
 *  estado diga un id de `GET /config/plots` y no una frase nuestra. */
const NETWORK = 'network'

export type GraphParams = Record<string, never>

export function GraphBody({
  value,
  family,
  grafico,
  format,
}: BodyProps<'flujo' | 'grafo', GraphParams>) {
  // La comprobación va ANTES de dibujar y con lista blanca, igual que
  // `DistributionBody` y `SeriesBody`: resuelta dentro de una rama, la rama que
  // se olvide se ve bien.
  const conocidos: readonly string[] = DIBUJA[value.forma]
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  // **Sin gráfico declarado tampoco se cae al otro brazo.** `grafico` ausente
  // significa «el de por defecto del cuerpo» y `grafo` no tiene uno, así que el
  // estado nombra el único id que la sirve.
  if (value.forma === 'grafo') {
    return <UnknownPlotState grafico={NETWORK} />
  }

  return (
    <div className="h-full min-h-0">
      <PlotSankey
        value={value}
        family={family}
        format={(v) => format.number(v, { abbreviate: true })}
      />
    </div>
  )
}
