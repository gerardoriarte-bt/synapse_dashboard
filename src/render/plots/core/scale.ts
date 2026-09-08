/** Escalas · dominio → píxeles. Sin d3 · F1.13a
 *
 *  Tres funciones y ni una dependencia. `d3-scale` arrastra `d3-array`,
 *  `d3-format` y `d3-time`; acá se usa un décimo de eso y el formato ya lo
 *  resuelve `format.ts` con el locale del tenant.
 */

export type LinearScale = {
  (v: number): number
  readonly domain: readonly [number, number]
  readonly range: readonly [number, number]
  ticks: (count?: number) => number[]
}

/** Redondea el paso a 1, 2, 5 o 10 por década, que es lo que hace que un eje
 *  diga 0 · 20 · 40 y no 0 · 17 · 34. */
function niceStep(raw: number): number {
  const decade = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / decade
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return step * decade
}

export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const width = d1 - d0

  const f = ((v: number) => (width === 0 ? r0 : r0 + ((v - d0) / width) * (r1 - r0))) as LinearScale

  return Object.assign(f, {
    domain,
    range,
    ticks(count = 5): number[] {
      if (width === 0) return [d0]
      const step = niceStep(width / Math.max(1, count))
      const start = Math.ceil(d0 / step) * step
      const out: number[] = []
      for (let v = start; v <= d1 + step / 1e6; v += step) {
        out.push(Number(v.toPrecision(12))) // mata el ruido de coma flotante
      }
      return out
    },
  })
}

export type BandScale = {
  (k: string): number
  readonly domain: readonly string[]
  readonly bandwidth: number
  readonly step: number
}

/** Una banda por categoría. `padding` es la fracción del paso que queda como
 *  aire entre barras; el `.pen` usa barras gruesas y aire escaso. */
export function bandScale(
  domain: readonly string[],
  range: readonly [number, number],
  padding = 0.2,
): BandScale {
  const [r0, r1] = range
  const n = Math.max(1, domain.length)
  const step = (r1 - r0) / n
  const bandwidth = step * (1 - padding)
  const index = new Map(domain.map((k, i) => [k, i]))

  const f = ((k: string) => {
    const i = index.get(k)
    return i === undefined ? r0 : r0 + i * step + (step - bandwidth) / 2
  }) as BandScale

  return Object.assign(f, { domain, bandwidth, step })
}

/** El tiempo es lineal sobre milisegundos. Los rótulos los pone el eje, que es
 *  quien sabe si el período se lee en meses o en días. */
export function timeScale(
  domain: readonly [Date, Date],
  range: readonly [number, number],
): LinearScale {
  return linearScale([domain[0].getTime(), domain[1].getTime()], range)
}

/** El máximo redondeado hacia ARRIBA al siguiente tick. Sin esto la barra más
 *  alta toca el borde y parece cortada.
 *
 *  Hacia arriba y no al último tick que quepa: tomando el último tick, un máximo
 *  de 81 daba techo 80 y la barra se salía del área. Lo encontró la prueba antes
 *  que el render. */
export function ceiling(values: readonly number[]): number {
  const max = Math.max(0, ...values)
  if (max === 0) return 1
  const step = niceStep(max / 5)
  return Math.ceil(max / step) * step
}
