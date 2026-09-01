/** Tipos del catálogo · F1.4.
 *
 *  `catalog/` NO tiene tablas de datos. En v2 era un espejo generado de
 *  `contracts/*.js`; acá el catálogo llega por `GET /config/catalog` y los
 *  bloques por `GET /config/blocks`, así que lo único que queda del lado del
 *  front son los tipos y los validadores que operan sobre lo que llegó.
 *
 *  Se re-exportan desde `api/` —que es donde el contrato los define— para que
 *  `render/` pueda importar `Family` o `PanelType` sin importar de `api/`, que
 *  es la frontera de §4.
 */
export type { Block, Family, Layer, Metric, PanelConfig, PanelType, Shape } from '../api/types'

/** Dónde va un panel en la grilla. Es la parte de `PanelConfig` que `render/`
 *  necesita, sin `metricId` ni `opciones`: un componente de render no tiene por
 *  qué saber a qué métrica se ancla la celda que está midiendo. */
export type Placement = {
  colStart: number
  colSpan: number
  rowSpan: number
}
