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
 *
 *  ── Y DE DOS LADOS, CUANDO LO BUENO ESTÁ EN EL MEDIO · 2026-11-24 ──────────
 *
 *  El catálogo de Terpel define el pacing —gasto sobre presupuesto— como malo
 *  por los dos lados: por debajo de 90 % se subejecuta, por encima de 110 % se
 *  sobregasta. Con dos cortes sueltos eso no se puede decir, y un tercer campo
 *  `direccion: 'medio'` volvería a abrir la contradicción que el orden cierra.
 *
 *  Así que **la forma dice el modelo, igual que el orden dice la dirección**:
 *  si `bien` es un RANGO, `[90, 110]`, lo bueno es estar adentro. `mal` es otro
 *  rango y es opcional: **sin él, el de mal es el mismo que el de bien** y no
 *  hay tramo aceptable, que es el caso de Terpel. Con él, `[80, 120]`, lo que
 *  queda entre los dos rangos es aceptable. Las dos formas no se mezclan: un
 *  `bien` número con un `mal` rango no dice nada que se pueda dibujar.
 */

/** El param de layout, tal como lo guarda el panel. Los nombres son nuestros
 *  —el servicio no lee `options`, lo guarda y lo devuelve—, igual que la
 *  `etiqueta` de la `banda`. */
export type UmbralesDeUnLado = {
  /** Desde dónde el indicador está BIEN. */
  bien: number
  /** Desde dónde está MAL. */
  mal: number
}

/** `[desde, hasta]`, de menor a mayor y con los dos bordes distintos. Una
 *  tupla y no `{ desde, hasta }` porque así se escribe un rango en el JSON del
 *  panel, y es lo que datos manda: «< 90 %, > 110 %». */
export type Rango = [number, number]

export type UmbralesDeDosLados = {
  /** Adentro, bordes incluidos, está BIEN. */
  bien: Rango
  /** Afuera, bordes excluidos, está MAL. Contiene al de `bien`; sin él, es
   *  el mismo. */
  mal?: Rango
}

export type Umbrales = UmbralesDeUnLado | UmbralesDeDosLados

export type DireccionDeUmbrales = 'masAltoMejor' | 'masBajoMejor'

export const esDeDosLados = (u: Umbrales): u is UmbralesDeDosLados => Array.isArray(u.bien)

export const direccionDe = (u: UmbralesDeUnLado): DireccionDeUmbrales =>
  u.bien > u.mal ? 'masAltoMejor' : 'masBajoMejor'

/** Los dos rangos de un semáforo de dos lados, con el de mal ya resuelto. */
export const rangosDe = (u: UmbralesDeDosLados): { bien: Rango; mal: Rango } => ({ bien: u.bien, mal: u.mal ?? u.bien })

const numero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** `null` si es un rango que se puede leer; si no, qué le falta. */
function problemaDeRango(nombre: 'bien' | 'mal', v: unknown): string | null {
  if (!Array.isArray(v) || v.length !== 2 || !numero(v[0]) || !numero(v[1])) {
    return `el rango de «${nombre}» necesita dos números, [desde, hasta]`
  }
  if (v[0] >= v[1]) return `el rango de «${nombre}» va de menor a mayor, con dos bordes distintos`
  return null
}

/** `null` si el valor es un par de umbrales que se puede dibujar; si no, la
 *  razón, en la lengua de quien compone. */
export function problemaDeUmbrales(x: unknown): string | null {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) {
    return 'espera un objeto con dos cortes, «bien» y «mal», o con el rango de «bien»'
  }
  const o = x as Record<string, unknown>
  const sobra = Object.keys(o).filter((k) => k !== 'bien' && k !== 'mal')
  if (sobra.length > 0) return `no lee ${sobra.map((k) => `«${k}»`).join(', ')} · sólo «bien» y «mal»`

  // ── Dos lados: lo decide la forma de `bien`, o la de `mal` si `bien` falta.
  if (Array.isArray(o['bien']) || Array.isArray(o['mal'])) {
    if (numero(o['bien']) || numero(o['mal'])) {
      return 'no mezcla formas · o los dos son cortes, o los dos son rangos'
    }
    if (!Array.isArray(o['bien'])) return 'con «mal» como rango falta el rango de «bien»'
    const enBien = problemaDeRango('bien', o['bien'])
    if (enBien !== null) return enBien
    if (o['mal'] === undefined) return null
    const enMal = problemaDeRango('mal', o['mal'])
    if (enMal !== null) return enMal
    const [b0, b1] = o['bien'] as Rango
    const [m0, m1] = o['mal'] as Rango
    if (m0 > b0 || m1 < b1) return 'el rango de «mal» tiene que contener al de «bien»'
    return null
  }

  if (!numero(o['bien']) || !numero(o['mal'])) return 'necesita los dos cortes, «bien» y «mal», como números'
  if (o['bien'] === o['mal']) return 'los dos cortes son iguales · no se puede leer la dirección'
  return null
}

export const esUmbrales = (x: unknown): x is Umbrales => problemaDeUmbrales(x) === null
