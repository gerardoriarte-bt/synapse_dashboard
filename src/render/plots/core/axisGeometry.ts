/** La geometría del eje · F1.13a
 *
 *  Vive aparte de `Axis.tsx` porque son funciones y constantes, no componentes:
 *  un archivo que exporta las dos cosas rompe el fast refresh de Vite, y además
 *  `.cursorrules` pide un componente por archivo. Las pruebas de reserva y
 *  recorte apuntan acá.
 */

/** El margen que todo plot reserva para sus ejes. En píxeles y no en tokens
 *  porque es geometría de SVG, no espaciado de caja. */
export const MARGIN = { t: 8, r: 8, b: 20, l: 8 } as const

/** Ancho de un carácter en JetBrains Mono, como fracción del tamaño.
 *
 *  MEDIDO EN EL NAVEGADOR, no estimado: `getComputedTextLength` sobre diez
 *  caracteres da 72px a 10px de tamaño. Son 0.6em de avance más los 0.12em de
 *  `letter-spacing` que §2.3 exige en todo label.
 *
 *  El 6.7 que circula es de mono 9 y acá el eje es mono 10: aplicarlo cortaba
 *  una letra por etiqueta, que fue exactamente lo que pasó. */
export const MONO_ADVANCE = 0.72

export const textWidth = (chars: number, size = 10) => chars * size * MONO_ADVANCE

/** Cuántos caracteres entran en un ancho dado. Es lo que convierte «recortar a
 *  18» —que se salía por la izquierda en un panel angosto— en «recortar a lo que
 *  quepa». */
export const charsThatFit = (px: number, size = 10) =>
  Math.max(3, Math.floor(px / (size * MONO_ADVANCE)))

/** Lo mínimo que reserva un eje de valores aunque sus rótulos sean cortos. */
export const MIN_RESERVE = 28

/** Cuánto ancho hay que reservar para los rótulos de un eje de valores.
 *
 *  **Sale del rótulo MÁS LARGO, no del rótulo del máximo.** Con un techo de 1M
 *  el del máximo es «1M» de dos caracteres y el tick de «500K» son cuatro, así
 *  que calculado sobre el máximo el eje se salía por la izquierda y se leía
 *  «00K».
 *
 *  En v2 estaba escrito tres veces —PlotSeries, PlotForecast, PlotDistribution—,
 *  dos de ellas con el 28 repetido a mano. El tercero ya lo había arreglado y
 *  los otros dos habrían heredado el defecto. */
export function axisReserve(labels: readonly string[]): number {
  const longest = Math.max(0, ...labels.map((r) => r.length))
  return Math.max(MIN_RESERVE, textWidth(longest) + 8)
}
