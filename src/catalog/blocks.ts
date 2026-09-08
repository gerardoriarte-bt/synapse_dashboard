/** Las reglas de composición, aplicadas sobre lo que mandó el backend · F1.3.
 *
 *  LA TABLA NO ESTÁ ACÁ. Llega en `GET /config/blocks` y estas funciones operan
 *  sobre ella. Es la diferencia con v2, donde `BLOCKS` era una constante
 *  generada: si el backend agrega un tipo o mueve un rango, el front lo respeta
 *  sin recompilar.
 *
 *  Sirven para dos cosas distintas:
 *   · en el BUILDER, para no dejar componer algo inválido y decir por qué;
 *   · en la CONSOLA, para detectar en desarrollo que un layout llegó mal.
 *
 *  Nunca para «arreglar» un layout inválido en silencio. Si el backend manda un
 *  bloque que no cierra, eso es un error explícito — §1, principio 6.
 */
import type { Block, PanelType, Shape } from './types'

export type BlockTable = ReadonlyMap<PanelType, Block>

export function blockTable(blocks: readonly Block[]): BlockTable {
  return new Map(blocks.map((b) => [b.tipo, b]))
}

/** ¿Puede este tipo de panel renderizar esta forma? La primera mitad de §4.4. */
export function acceptsShape(table: BlockTable, type: PanelType, shape: Shape): boolean {
  return table.get(type)?.formasAceptadas.includes(shape) ?? false
}

/** ¿Los spans caen en el rango declarado del tipo? La otra mitad. */
export function spanInRange(
  table: BlockTable,
  type: PanelType,
  colSpan: number,
  rowSpan: number,
): boolean {
  const b = table.get(type)
  if (b === undefined) return false
  return (
    colSpan >= b.colSpanMin &&
    colSpan <= b.colSpanMax &&
    rowSpan >= b.rowSpanMin &&
    rowSpan <= b.rowSpanMax
  )
}

/** Por qué un panel no es válido, en la lengua del producto. `null` si lo es.
 *
 *  Devuelve la razón y no un booleano porque el builder tiene que poder
 *  MOSTRARLA: «un medidor no dibuja una serie temporal» ayuda, «composición
 *  inválida» no. */
export function invalidReason(
  table: BlockTable,
  type: PanelType,
  shape: Shape,
  colSpan: number,
  rowSpan: number,
): string | null {
  const b = table.get(type)
  if (b === undefined) return `El tipo de bloque «${type}» no existe en el contrato.`
  if (!acceptsShape(table, type, shape)) {
    return `Un bloque «${type}» no sabe dibujar la forma «${shape}».`
  }
  if (colSpan < b.colSpanMin || colSpan > b.colSpanMax) {
    return `«${type}» ocupa entre ${b.colSpanMin} y ${b.colSpanMax} columnas; se pidieron ${colSpan}.`
  }
  if (rowSpan < b.rowSpanMin || rowSpan > b.rowSpanMax) {
    return `«${type}» ocupa entre ${b.rowSpanMin} y ${b.rowSpanMax} filas; se pidieron ${rowSpan}.`
  }
  return null
}
