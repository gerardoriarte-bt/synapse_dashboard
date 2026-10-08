/** Una cifra del agente, dibujada con el cuerpo de panel que le toca · F3.6
 *
 *  **«Un solo modelo de datos»**, que es lo que el criterio pide: la misma
 *  cifra, el mismo cuerpo y la misma anatomía que en la consola. Lo que cambia
 *  es de dónde viene el valor, no cómo se dibuja.
 *
 *  ── CON QUÉ CUERPO, QUE ERA LO QUE FALTABA ──────────────────────────────────
 *
 *  `EventoDato` trae `valor` y su `forma`, **no un `TipoPanel`**. Y no se puede
 *  derivar: `Bloque.formasAceptadas` va de muchos a muchos —varios tipos
 *  aceptan `escalar`— así que elegir uno sería inventar una decisión que el
 *  contrato no tomó. Es la pregunta 11 de B0.9 y estuvo abierta desde el
 *  2026-09-03.
 *
 *  **La respuesta no era agregar un campo: era usar el contexto que ya
 *  tenemos.** El chat se abre DESDE un panel, y ese panel tiene tipo. La cifra
 *  se dibuja con el cuerpo de ese panel — no con uno elegido a dedo.
 *
 *  **Y sólo si el tipo acepta la forma que llegó**, que lo decide
 *  `acceptsShape` contra la tabla de `/config/blocks`. El agente puede devolver
 *  un desglose donde el panel es un KPI; dibujar una categórica con `KpiBody`
 *  se vería bien y sería otra cifra.
 *
 *  **Y cuando el panel no acepta, se dibuja por la forma** · §7, cerrada el
 *  2026-10-08. Contra el agente real el panel de origen casi nunca aceptaba lo
 *  que llegaba, y la rama de «no puedo dibujarlo» era la común. Ahora una forma
 *  que un solo tipo acepta se dibuja con ese tipo; **se declara sólo cuando la
 *  tabla deja dos o más candidatos**, que es donde elegir sería adivinar.
 */
import { Suspense } from 'react'
import { Label } from '../../render/primitives/Label'
import { LoadingState } from '../../render/states/LoadingState'
import { bodyFor } from '../../render/bodies/registry'
import { acceptsShape, soleTypeFor } from '../../catalog/blocks'
import { Provenance } from '../../render/Panel/Provenance'
import { span } from '../../render/grid'
import type { BlockTable } from '../../catalog/blocks'
import type { PanelType } from '../../catalog/types'
import type { Formatter } from '../../render/format'
import type { ChatEvent } from '../../api/types'

type Dato = Extract<ChatEvent, { tipo: 'dato' }>

/** Las filas de grilla que ocupa una cifra del chat. */
const FILAS = 3

/** Los cuerpos que miden su propio contenido. Los demás —los gráficos— ocupan
 *  el alto de su contenedor y sin uno no se ven. */
const CON_ALTO_PROPIO: ReadonlySet<PanelType> = new Set(['kpi', 'prose'])

type Props = {
  dato: Dato
  /** El panel desde el que se preguntó. Es el que decide el cuerpo.
   *
   *  **Ausente cuando se preguntó desde la PESTAÑA** · F3.15: ahí no hay panel
   *  de origen, así que no hay cuerpo que elegir. Ver abajo. */
  panelTipo?: PanelType | undefined
  bloques: BlockTable
  format: Formatter
  now: Date
}

export function ChatFigure({ dato, panelTipo: tipoDelPanel, bloques, format, now }: Props) {
  const forma = dato.valor.forma
  // ── CON QUÉ CUERPO · §7 cerrada el 2026-10-08 (humano): por la FORMA ──────
  //
  // En orden, y cada paso sólo si el anterior no decidió:
  //
  //  1. **La marca del agente** · 2026-10-07, «su marca, nuestros cuerpos».
  //  2. **El panel de origen, si acepta la forma.** El contexto sigue valiendo
  //     cuando sirve: un escalar preguntado desde un `gauge` sale como medidor.
  //  3. **El único tipo que acepta la forma** · `soleTypeFor`. Es lo que §7
  //     pedía: contra el agente real, una pregunta desde un `kpi` trajo
  //     `tabular`, `tabular` y `raw`, y las tres se declaraban. Un `tabular`
  //     sólo lo dibuja `table`, venga de donde venga.
  //
  // **Lo que NO se usa es la `metric_key` de la procedencia** para buscar un
  // panel en la pestaña. En pestaña la infiere el backend cruzando nombres de
  // columna, y un cruce equivocado elegiría el cuerpo de otra métrica encima de
  // declarar su BASE. Ver `MENSAJE-2026-10-08-backend-procedencia-por-nombre.md`.
  const delPanel =
    tipoDelPanel !== undefined && acceptsShape(bloques, tipoDelPanel, forma) ? tipoDelPanel : null
  const panelTipo = dato.tipoDePanel ?? delPanel ?? soleTypeFor(bloques, forma) ?? undefined
  const familia = dato.familia

  // **Sin familia no hay color, y no se inventa uno** · 2026-10-07. El chat de
  // pestaña no tiene métrica de origen; el dato llega y se declara.
  if (familia === null) {
    return (
      <div className="flex flex-col gap-1">
        {dato.titulo == null ? null : <Label as="div">{dato.titulo}</Label>}
        <Label as="div">Un gráfico que todavía no se dibuja</Label>
        <Label as="div">El catálogo no declaró de qué familia es, y sin eso no tiene color</Label>
      </div>
    )
  }

  // ── SIN UN TIPO DECIDIDO NO SE ELIGE UNO ─────────────────────────────────
  //
  // Queda para las formas que aceptan dos tipos o más —un `escalar` como `kpi`
  // o como `gauge`— cuando el panel de origen no es uno de ellos. Elegir el
  // primero sería inventar con qué se dibuja: el mismo dato dice cosas
  // distintas como cifra o como medidor.
  if (panelTipo === undefined) {
    return (
      <div className="flex flex-col gap-1">
        <Label as="div">Una cifra que todavía no se dibuja</Label>
        <Label as="div">Llegó en forma «{forma}» y más de un tipo de panel la acepta</Label>
      </div>
    )
  }

  const Body = bodyFor(panelTipo)

  // La marca del agente se vuelve a validar: el traductor de Vega-Lite la
  // elige, y la tabla de `/config/blocks` es la que manda.
  if (Body === undefined || !acceptsShape(bloques, panelTipo, forma)) {
    return (
      <div className="flex flex-col gap-1">
        <Label as="div">Una cifra que este panel no puede dibujar</Label>
        <Label as="div">
          Llegó en forma «{forma}» y «{panelTipo}» no la acepta
        </Label>
      </div>
    )
  }

  return (
    <figure className="flex flex-col gap-2 rounded-md border border-w3 p-3 m-0">
      {dato.titulo == null ? null : <Label as="div">{dato.titulo}</Label>}

      {/* **El alto es el del `rowSpan` que se le da al cuerpo** · 2026-10-07.
          Los cuerpos de gráfico ocupan el alto de su contenedor, y la figura
          no tenía: el KPI se veía porque su cifra tiene alto propio, y la
          primera serie del agente salió con título, BASE y procedencia y sin
          una línea. Lo encontró abrir el modo mock, no una prueba. Al KPI no
          se le da: con 272 px quedaba un hueco debajo de la cifra. */}
      <div style={CON_ALTO_PROPIO.has(panelTipo) ? undefined : { height: span(FILAS) }}>
        <Suspense fallback={<LoadingState />}>
          <Body
            value={dato.valor}
            params={{}}
            // La cifra del chat no vive en la grilla, pero los cuerpos piden
            // un `Placement` para decidir densidad. Se le da el de la columna de
            // conversación: 6 de ancho es la mitad de la grilla, que es lo que
            // mide la hoja contra la pantalla.
            span={{ colStart: 1, colSpan: 6, rowSpan: FILAS }}
            family={familia}
            metric={dato.titulo ?? ''}
            format={format}
            {...(dato.presentacion === undefined ? {} : { presentation: dato.presentacion })}
          />
        </Suspense>
      </div>

      {/* **La BASE y la procedencia van PEGADAS a la cifra**, que es la mitad
          del criterio: «una cifra en el chat también declara BASE y
          procedencia».

          La BASE va aparte porque `Provenance` no la lleva — en el shell la
          escribe la cabecera del panel, junto al título. Acá la cifra no tiene
          cabecera, así que la pone esta línea. */}
      {/* **Una base vacía se dice, no se deja colgando** · 2026-10-08. Es lo
          que le pedimos al backend cuando la consulta del agente no es la
          métrica del catálogo —filtra por medio, o sale de otra tabla—: que no
          copie la base del catálogo. «Base · » con nada detrás se lee como un
          defecto de pantalla y no como una declaración. */}
      <Label as="div">
        {dato.base === '' ? 'Base · la consulta no la declara' : `Base · ${dato.base}`}
      </Label>
      <Provenance
        capa={dato.capa}
        fuente={dato.fuente}
        frescura={dato.frescura}
        format={format}
        now={now}
      />
    </figure>
  )
}
