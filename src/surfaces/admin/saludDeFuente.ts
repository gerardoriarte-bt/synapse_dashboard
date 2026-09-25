/** El estado de una fuente · §PEN:A5 · F4.24
 *
 *  **La regla está al pie del dibujo, y es la razón de que B2.13 se pidiera como
 *  ruta y no como campo:**
 *
 *  > `EL ESTADO NO SE ESCRIBE, SE DERIVA · SI FRESCURA > CADENCIA × TOLERANCIA,
 *  > DEGRADADO`
 *
 *  El cable manda `status` igual, y **no se usa**. Guardarlo y derivarlo son dos
 *  fuentes para el mismo hecho, y se separan en el primer feed atrasado: el
 *  campo dice lo que era cierto cuando se escribió, la frescura dice lo que es
 *  cierto ahora. Por eso el pedido pidió los tres términos y no el resultado.
 *
 *  Aparte del componente porque es una decisión, no un render: se prueba sin
 *  montar nada, igual que `periodGrain`.
 */

/** Los tres estados que una fuente puede tener.
 *
 *  **`SIN_CARGA` no es un error**, y distinguirlo importa: una fuente que nunca
 *  cargó no está atrasada, está sin estrenar. Las cuatro del tenant de prueba
 *  llegan así el 2026-09-25 —`last_load_at` en `null`— porque el seguimiento de
 *  cargas es nuevo. Decir «DEGRADADA» de algo que nunca cargó sería contar una
 *  historia falsa sobre un feed que quizá está perfecto. */
export type SaludDeFuente = 'AL_DIA' | 'DEGRADADA' | 'SIN_CARGA'

export type Fuente = {
  cadenciaHoras: number
  toleranciaFactor: number
  /** `null` cuando nunca cargó. */
  frescuraHoras: number | null
}

/** El límite que la fuente declara para sí misma: `cadencia × tolerancia`.
 *
 *  Es por FUENTE y no global, que es lo que separa este cálculo del
 *  `DD_FRESHNESS_TOLERANCE_DAYS` del backend: una fuente horaria con 31 h de
 *  atraso está degradada y una diaria con 31 h no. Con un plazo único las dos
 *  darían lo mismo. */
export function limiteHoras(f: Fuente): number {
  return f.cadenciaHoras * f.toleranciaFactor
}

export function saludDe(f: Fuente): SaludDeFuente {
  if (f.frescuraHoras === null) return 'SIN_CARGA'
  // **Estrictamente mayor**, que es como el dibujo lo escribe: una fuente
  // justo en el límite está dentro. El `>=` degradaría a la que llegó a horario.
  return f.frescuraHoras > limiteHoras(f) ? 'DEGRADADA' : 'AL_DIA'
}

/** El resumen del encabezado · «9 FUENTES · 8 AL DÍA · 1 DEGRADADA».
 *
 *  **Sale de contar lo derivado**, no de un campo: si alguna vez el cable trae
 *  un conteo, seguirá contándose acá — es el mismo argumento que la regla de
 *  arriba, una vuelta más afuera. */
export function resumen(fuentes: readonly Fuente[]): Record<SaludDeFuente, number> {
  const out: Record<SaludDeFuente, number> = { AL_DIA: 0, DEGRADADA: 0, SIN_CARGA: 0 }
  for (const f of fuentes) out[saludDe(f)] += 1
  return out
}
