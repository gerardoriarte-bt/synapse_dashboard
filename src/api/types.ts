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
import type { components as wire } from './console-generated'

type Schemas = components['schemas']

/** Los tipos del CABLE · `contracts/synapse-console-wire.yaml`.
 *
 *  Conviven con los del contrato a propósito: `Schemas` es lo que el producto
 *  necesita y `WireSchemas` lo que el servicio manda. **La diferencia entre los
 *  dos es la lista de lo que falta pedirle al backend**, así que colapsarlos
 *  sería perder la lista. El adaptador de `api/` los une en un solo lugar. */
type WireSchemas = wire['schemas']

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
export type ThreadSummary = Schemas['HiloResumen']
export type Thread = Schemas['Hilo']

export type Point = Schemas['Punto']
export type Pillar = NonNullable<Schemas['ValorProsa']['pilares']>[number]
export type Column = NonNullable<Schemas['ValorTabular']['columnas']>[number]
export type Row = NonNullable<Schemas['ValorTabular']['filas']>[number]

/** El envelope del CABLE, que no es el de §4.1 · F1.36.
 *
 *  El contrato declara el error como un OBJETO —`{ codigo, mensaje, campo?,
 *  desbloqueaCon? }`— y `synapse-api-go` lo declara como una CADENA:
 *
 *      type Response struct {
 *          Success bool        `json:"success"`
 *          Data    interface{} `json:"data,omitempty"`
 *          Error   string      `json:"error,omitempty"`
 *      }
 *
 *  Sale de `contracts/synapse-console-wire.yaml`, que es la transcripción de lo
 *  que el servicio sirve hoy. **Se tipa contra el cable y no contra el contrato
 *  a propósito**: leer esa cadena como objeto da `code: undefined` y
 *  `message: ''` —una pantalla de error sin una palabra—, y el tipo es lo que
 *  impide volver a escribirlo.
 *
 *  Cuando el servicio adopte §4.1, esto vuelve a `Schemas['RespuestaError']` y
 *  `SIN_CODIGO` desaparece. */
export type Envelope<T> = { success: true; data: T } | WireSchemas['ErrorResponse']

/** **El servicio no emite códigos de error, y esto lo dice en voz alta.**
 *
 *  §4.1 propone `FAMILIA_DETALLE` con la familia como prefijo hasta el primer
 *  `_` —`CAMPO_*`, `REGLA_*`, `FALLO_*`— para que el front decida sobre el
 *  prefijo sin conocer la lista completa. El cable no manda ninguno.
 *
 *  `SIN` **no es una de las tres familias, y eso es el punto**: ninguna rama que
 *  se escriba mañana sobre `CAMPO_`, `REGLA_` o `FALLO_` lo va a agarrar por
 *  accidente. El front no clasifica lo que el servidor no clasificó; lo que sí
 *  tiene es `httpStatus`, que el transporte sí declara. */
export const SIN_CODIGO = 'SIN_CODIGO'

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
