/** El presupuesto de §8, medido y no supuesto · F1.13j
 *
 *  «Una pestaña de 8 paneles debe pintar el layout en menos de 100ms desde que
 *  llega `/config/tabs`, **sin esperar los datos**.»
 *
 *  Las dos palabras que definen qué se mide: el reloj arranca cuando se sabe QUÉ
 *  paneles hay —no cuando arranca la app, no cuando llega el primer dato— y para
 *  cuando la grilla está en pantalla. Los datos llegan después y el panel ya
 *  está ahí con su shell, su BASE y su procedencia.
 *
 *  Se emiten DOS medidas, y la diferencia entre ellas importa:
 *
 *  - `synapse:layout-commit` — hasta que el DOM de la grilla está armado. Es el
 *    trabajo que este código controla, y se puede leer siempre.
 *  - `synapse:layout-painted` — hasta el frame en que se ve. Es la que el
 *    presupuesto nombra, y **solo existe si la pestaña está visible**: un tab en
 *    segundo plano no pinta y `requestAnimationFrame` no corre. No es un fallo
 *    de la medición: no hay nada que medir.
 *
 *  Usa la User Timing API, así que marcas y medidas aparecen tal cual en el
 *  panel Performance de DevTools junto a las del navegador, sin instrumentación
 *  aparte.
 *
 *  ── EL FLAG ────────────────────────────────────────────────────────────────
 *
 *  **En producción está apagado salvo que se pida.** Medir cuesta poco —una
 *  llamada a `performance.mark` por cambio de pestaña— pero no cuesta nada, y
 *  las entradas de User Timing se acumulan en el buffer del navegador de una
 *  consola que vive abierta todo el día. Se enciende con `VITE_BUDGET=1`, que es
 *  lo que se hace para medir una regresión sin recompilar el árbol entero.
 */

const MARK_CONFIG = 'synapse:tabs-received'
const MEASURE_COMMIT = 'synapse:layout-commit'
const MEASURE_PAINTED = 'synapse:layout-painted'

/** El techo declarado en §8, en milisegundos. */
export const BUDGET_MS = 100

/** En desarrollo siempre; en producción solo con el flag. Se lee una vez: es una
 *  variable de build y no cambia en runtime. */
const ENABLED = import.meta.env.DEV || import.meta.env.VITE_BUDGET === '1'

function hasClock(): boolean {
  return ENABLED && typeof performance !== 'undefined' && typeof performance.mark === 'function'
}

function hasMark(): boolean {
  return hasClock() && performance.getEntriesByName(MARK_CONFIG, 'mark').length > 0
}

/** Arranca el reloj: la configuración de la pestaña ya está resuelta. */
export function markTabConfig(): void {
  if (!hasClock()) return
  // Se limpia lo anterior antes de marcar: sin esto, cambiar de pestaña deja
  // marcas viejas y `measure` mide contra la primera de todas.
  performance.clearMarks(MARK_CONFIG)
  performance.clearMeasures(MEASURE_COMMIT)
  performance.clearMeasures(MEASURE_PAINTED)
  performance.mark(MARK_CONFIG)
}

function measure(name: string, onMeasure?: (ms: number) => void): void {
  try {
    const m = performance.measure(name, MARK_CONFIG)
    onMeasure?.(m.duration)
  } catch {
    // La marca se limpió por un cambio de pestaña en el medio. No hay nada que
    // medir y tampoco nada que reportar.
  }
}

/** Para el reloj cuando el DOM de la grilla ya está armado.
 *
 *  Se llama desde un `useLayoutEffect`, que corre después de que React escribió
 *  el DOM y antes de que el navegador pinte. */
export function measureLayoutCommit(onMeasure?: (ms: number) => void): void {
  if (!hasMark()) return
  measure(MEASURE_COMMIT, onMeasure)
}

/** Para el reloj en el primer frame en que la grilla ya está en pantalla.
 *
 *  **El doble `requestAnimationFrame` no es superstición**: el primero corre
 *  ANTES del pintado del frame en curso, el segundo después. Medir en el primero
 *  daría un número que excluye justamente el trabajo que interesa. */
export function measureLayoutPainted(onMeasure?: (ms: number) => void): void {
  if (!hasMark() || typeof requestAnimationFrame !== 'function') return
  // Un tab oculto no pinta: rAF nunca se dispara y la medida no llegaría nunca.
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return

  requestAnimationFrame(() => {
    requestAnimationFrame(() => measure(MEASURE_PAINTED, onMeasure))
  })
}
