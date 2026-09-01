/** Los tipos de la API · derivados del contrato, no escritos a mano.
 *
 *  Todo lo que viaja por la red sale de `generated.ts`, que se genera desde
 *  `contracts/synapse-api.yaml` con `npm run gen:api`. Este archivo solo les
 *  pone el nombre con el que el código los llama y agrega lo que **no viaja**.
 *
 *  Los identificadores nuestros van en inglés; las CLAVES DEL ESQUEMA no se
 *  traducen —`schemas['Metrica']`, `payload.valor`, `metric.familia`— porque son
 *  el contrato, y renombrarlas acá crearía una capa de traducción en cada
 *  frontera. No editar `generated.ts`: se pisa en la próxima generación.
 */
import type { components } from './generated'

type Schemas = components['schemas']

/** Lo que el backend devuelve. Cinco estados, ninguno con campos de otro. */
export type NetworkPayload = Schemas['Payload']

/** CARGANDO no está en el contrato y no debería: es del cliente. El panel lo usa
 *  mientras el batch vuela, y ningún servidor lo emite jamás. Tenerlo acá y no
 *  en el yaml es lo que impide que alguien lo espere de la red. */
export type Payload = NetworkPayload | { estado: 'CARGANDO' }
export type PayloadState = Payload['estado']

export type Value = Schemas['Valor']
export type Shape = Schemas['Forma']
export type PanelType = Schemas['TipoPanel']
export type Family = Schemas['Familia']
export type Layer = Schemas['Capa']
export type Governance = Schemas['Gobierno']
export type Presentation = Schemas['Presentacion']
export type Actions = Schemas['Acciones']
export type Metric = Schemas['Metrica']
export type Block = Schemas['Bloque']
export type PanelConfig = Schemas['PanelConfigurado']
export type Tab = Schemas['Pestana']
export type TabWithPanels = Schemas['PestanaConPaneles']
export type AppContext = Schemas['Contexto']
export type Period = Schemas['Periodo']
export type ChatEvent = Schemas['EventoDeChat']

export type Point = Schemas['Punto']
export type Pillar = NonNullable<Schemas['ValorProsa']['pilares']>[number]
export type Column = NonNullable<Schemas['ValorTabular']['columnas']>[number]
export type Row = NonNullable<Schemas['ValorTabular']['filas']>[number]

/** El envelope de §4.1 del contrato. */
export type Envelope<T> = { success: true; data: T } | Schemas['RespuestaError']

/** El error de negocio, ya desenvuelto. Lleva `code` para decidir en código y
 *  `message` para mostrar — §8: los errores no se disculpan y nunca son vagos. */
export class ApiError extends Error {
  // Campos declarados y asignados a mano: `erasableSyntaxOnly` del andamio
  // prohíbe las propiedades de parámetro, que emiten código en runtime.
  readonly code: string
  readonly httpStatus: number
  readonly unblockedBy: string | null

  constructor(code: string, message: string, httpStatus: number, unblockedBy?: string | null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.httpStatus = httpStatus
    this.unblockedBy = unblockedBy ?? null
  }
}
