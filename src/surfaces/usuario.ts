/** Lo que comparten los dos menús del nombre · decisión humana del 2026-10-07
 *
 *  Aparte de `ChipDeUsuario` porque son datos, no un render: §4 regla 3 pide un
 *  componente por archivo, y `design-lint` lo hace cumplir.
 */

/** Las iniciales · primera letra del primer y del último nombre. Con un solo
 *  nombre, una. */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter((p) => p !== '')
  const primera = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : ''
  return (primera + ultima).toUpperCase()
}

/** Las clases del disparador · las comparten los dos menús del nombre. */
export const DISPARADOR_DE_USUARIO =
  'flex h-8 cursor-pointer items-center gap-2 rounded-full border border-w4 bg-panel py-0 pl-1 pr-2.5 hover:bg-w2'
