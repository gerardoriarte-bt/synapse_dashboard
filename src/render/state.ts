/** El estado se deriva, no se escribe · §5 de `parametros-front.md` · F1.13i
 *
 *  **Vive en `render/` y no en `api/`** porque el narrowing lo necesita quien
 *  LEE el payload, no quien lo declara. Y porque no puede ser al revés: `render/`
 *  no importa valores de `api/` (L14), así que una función que vive allá sería
 *  inalcanzable desde acá.
 */
import type { Metric, Payload, Value } from '../api/types'

/** Los dos estados que muestran cifra.
 *
 *  Es el único lugar donde se escribe la condición: en v2 estaba repetida en
 *  cuatro archivos, y el día que aparezca un tercer estado con valor hay que
 *  cambiarla en uno. */
export function hasValue(p: Payload): p is Extract<Payload, { valor: Value }> {
  return p.estado === 'DISPONIBLE' || p.estado === 'DEGRADADO'
}

/** Los cinco del contrato, más `CARGANDO` del cliente, más `VACIO` derivado.
 *
 *  `VACIO` no viene del backend a propósito: una serie sin puntos es un
 *  DISPONIBLE con cero filas, no un estado que el servidor deba declarar. Si lo
 *  declarara, dos servidores podrían discrepar sobre qué cuenta como vacío. */
export type VisualState =
  | 'DISPONIBLE'
  | 'DEGRADADO'
  | 'VACIO'
  | 'BLOQUEADO'
  | 'SIN_PERMISO'
  | 'ERROR'
  | 'CARGANDO'

/** ¿El valor no tiene nada que dibujar? Una entrada por forma con colección; las
 *  escalares nunca están vacías —**un cero es un dato**, y pintar «sin datos»
 *  sobre un cero real es mentir sobre la medición.
 *
 *  El `switch` es exhaustivo sobre las once formas del contrato. Cuando el
 *  contrato gane una forma, esto **deja de compilar** hasta que alguien decida
 *  qué significa que esté vacía — que es la decisión que no se puede tomar por
 *  omisión. */
export function isEmpty(value: Value): boolean {
  switch (value.forma) {
    case 'escalar':
    case 'escalarConIntervalo':
      return false
    case 'serieTemporal':
    case 'serieConBanda':
      return value.puntos.length === 0
    case 'seriesMultiples':
      return value.series.length === 0 || value.series.every((s) => s.puntos.length === 0)
    case 'categorica':
    case 'ranking':
      return value.items.length === 0
    case 'composicion':
      return value.partes.length === 0
    case 'distribucion':
      return value.cortes.length === 0
    case 'tabular':
      return value.filas.length === 0
    case 'prosa':
      return value.titular.trim() === ''
  }
}

/** Qué estado le toca al panel. El payload manda; lo único que el front agrega
 *  es distinguir el DISPONIBLE con datos del DISPONIBLE sin nada que dibujar. */
export function visualState(payload: Payload): VisualState {
  if (payload.estado === 'DISPONIBLE' && isEmpty(payload.valor)) return 'VACIO'
  return payload.estado
}

/** Lo que el shell necesita para pintar BASE y procedencia, venga de donde venga.
 *
 *  **Un panel bloqueado no lleva `Gobierno`**: el tipo lo impide, porque un
 *  estado sin cifra no tiene procedencia de cifra. Pero §4.1 exige que BASE y
 *  procedencia sigan visibles mientras el panel carga, falla o está bloqueado.
 *  Se resuelve cayendo a lo que declara el catálogo.
 *
 *  **Acá se cierra un hueco de v2.** Allá el catálogo traía `ventana` pero no
 *  `base`, así que el denominador solo existía cuando había payload con cifra y
 *  un panel bloqueado mostraba su ventana sin su denominador. El contrato de
 *  este repositorio declara `Metrica.base` como requerido y con esa razón
 *  escrita, así que la caída ahora es completa. */
export type Governance = {
  base: string
  ventana: string
  capa: string
  fuente: string
  /** ISO. `null` cuando no hay cifra: un panel bloqueado no tiene frescura de
   *  cifra, y poner la del catálogo sería inventar cuándo se midió algo que no
   *  se midió. */
  frescura: string | null
}

export function resolveGovernance(metric: Metric, payload: Payload): Governance {
  const withValue = hasValue(payload)
  return {
    base: withValue ? payload.base : metric.base,
    ventana: metric.ventana,
    capa: withValue ? payload.capa : metric.capa,
    fuente: withValue ? payload.fuente : metric.fuente,
    frescura: withValue ? payload.frescura : null,
  }
}
