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
 *  se vería bien y sería otra cifra. Cuando no acepta, **se declara en vez de
 *  adivinar** — que es la misma regla que el panel sin cuerpo registrado.
 *
 *  Queda como propuesta de spec: si algún día el evento declara su tipo, esto
 *  se simplifica y la regla de abajo desaparece.
 */
import { Suspense } from 'react'
import { Label } from '../../render/primitives/Label'
import { LoadingState } from '../../render/states/LoadingState'
import { bodyFor } from '../../render/bodies/registry'
import { acceptsShape } from '../../catalog/blocks'
import { Provenance } from '../../render/Panel/Provenance'
import type { BlockTable } from '../../catalog/blocks'
import type { PanelType } from '../../catalog/types'
import type { Formatter } from '../../render/format'
import type { ChatEvent } from '../../api/types'

type Dato = Extract<ChatEvent, { tipo: 'dato' }>

type Props = {
  dato: Dato
  /** El panel desde el que se preguntó. Es el que decide el cuerpo. */
  panelTipo: PanelType
  bloques: BlockTable
  format: Formatter
  now: Date
}

export function ChatFigure({ dato, panelTipo, bloques, format, now }: Props) {
  const Body = bodyFor(panelTipo)

  if (Body === undefined || !acceptsShape(bloques, panelTipo, dato.valor.forma)) {
    return (
      <div className="flex flex-col gap-1">
        <Label as="div">Una cifra que este panel no puede dibujar</Label>
        <Label as="div">
          Llegó en forma «{dato.valor.forma}» y «{panelTipo}» no la acepta
        </Label>
      </div>
    )
  }

  return (
    <figure className="flex flex-col gap-2 rounded-md border border-w3 p-3 m-0">
      {dato.titulo == null ? null : <Label as="div">{dato.titulo}</Label>}

      <Suspense fallback={<LoadingState />}>
        <Body
          value={dato.valor}
          params={{}}
          // La cifra del chat no vive en la grilla, pero los cuerpos piden
          // un `Placement` para decidir densidad. Se le da el de la columna de
          // conversación: 6 de ancho es la mitad de la grilla, que es lo que
          // mide la hoja contra la pantalla.
          span={{ colStart: 1, colSpan: 6, rowSpan: 3 }}
          family={dato.familia}
          metric={dato.titulo ?? ''}
          format={format}
          {...(dato.presentacion === undefined ? {} : { presentation: dato.presentacion })}
        />
      </Suspense>

      {/* **La BASE y la procedencia van PEGADAS a la cifra**, que es la mitad
          del criterio: «una cifra en el chat también declara BASE y
          procedencia».

          La BASE va aparte porque `Provenance` no la lleva — en el shell la
          escribe la cabecera del panel, junto al título. Acá la cifra no tiene
          cabecera, así que la pone esta línea. */}
      <Label as="div">Base · {dato.base}</Label>
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
