/** Los umbrales de un indicador · el semáforo · decisión humana del 2026-11-24
 *
 *  `docs/DECISIONES-2026-11-24-semaforos-y-eje-doble.md` §1: un `gauge`, un
 *  `bullet` o una `kpi` con umbrales declarados puede pintar su estado. **Es una
 *  excepción acotada a la regla 7 de `design.md`** —«el color no codifica
 *  juicio»—, que `design.md` no recoge porque no se edita: la excepción vive acá,
 *  en `render/semaforo.ts` y en los dos tokens de `tokens/decisiones.css`.
 *
 *  Va en `catalog/` porque es un tipo y su validador, y nada más: lo usan
 *  `api/params.ts`, que valida el param de layout, y `render/`, que lo dibuja.
 *
 *  ── LA DIRECCIÓN SALE DEL ORDEN DE LOS DOS CORTES ───────────────────────────
 *
 *  **No de la dirección semántica de la métrica**, y no por comodidad:
 *
 *  - `direccionSemantica` es TEXTO redactado por el catálogo —«HIGHER = BETTER»,
 *    «MÁS ALTO = MEJOR», y seis filas que llegaron como código,
 *    `HIGHER_IS_BETTER`—. Leerla para decidir un color sería el front
 *    interpretando copy de producto, y el día que datos la reescriba el
 *    semáforo se daría vuelta sin que nadie lo note.
 *  - Y no llega a `BodyProps`: es del catálogo, la pinta el shell.
 *
 *  Así que se declara con los propios cortes: **si `bien` es mayor que `mal`,
 *  más alto es mejor; si es menor, más bajo es mejor.** Con eso el corte y la
 *  dirección no pueden contradecirse, que es lo que pasaría con un tercer campo
 *  `direccion` escrito aparte. Por la misma razón **los dos cortes son
 *  obligatorios y distintos**: con uno solo no hay de dónde leer la dirección, y
 *  con dos iguales tampoco. Si datos define un indicador con un único corte, lo
 *  que falta se pide; no se adivina.
 */

/** El param de layout, tal como lo guarda el panel. Los nombres son nuestros
 *  —el servicio no lee `options`, lo guarda y lo devuelve—, igual que la
 *  `etiqueta` de la `banda`. */
export type Umbrales = {
  /** Desde dónde el indicador está BIEN. */
  bien: number
  /** Desde dónde está MAL. */
  mal: number
}

export type DireccionDeUmbrales = 'masAltoMejor' | 'masBajoMejor'

export const direccionDe = (u: Umbrales): DireccionDeUmbrales =>
  u.bien > u.mal ? 'masAltoMejor' : 'masBajoMejor'

/** `null` si el valor es un par de umbrales que se puede dibujar; si no, la
 *  razón, en la lengua de quien compone. */
export function problemaDeUmbrales(x: unknown): string | null {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) {
    return 'espera un objeto con dos cortes, «bien» y «mal»'
  }
  const o = x as Record<string, unknown>
  const sobra = Object.keys(o).filter((k) => k !== 'bien' && k !== 'mal')
  if (sobra.length > 0) return `no lee ${sobra.map((k) => `«${k}»`).join(', ')} · sólo «bien» y «mal»`
  const numero = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
  if (!numero(o['bien']) || !numero(o['mal'])) return 'necesita los dos cortes, «bien» y «mal», como números'
  if (o['bien'] === o['mal']) return 'los dos cortes son iguales · no se puede leer la dirección'
  return null
}

export const esUmbrales = (x: unknown): x is Umbrales => problemaDeUmbrales(x) === null
