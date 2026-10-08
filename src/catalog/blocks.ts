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

/** El ÚNICO tipo que acepta esta forma, o `null` si son cero o varios.
 *
 *  **Sirve para dibujar por la forma sin elegir a dedo** · §7 de
 *  `PROPUESTA-2026-09-22-divergencias-con-el-pen.md`, cerrada el 2026-10-08.
 *  Un `tabular` sólo lo acepta `table`, así que dibujarlo como tabla no es una
 *  decisión: es lo que dice la tabla de `/config/blocks`. Un `escalar` lo
 *  aceptan `kpi` y `gauge`, y ahí elegir uno sí lo sería — por eso con dos o
 *  más devuelve `null` y no el primero.
 *
 *  **`blocked` no cuenta, y se excluye por TIPO**: el panel bloqueado no
 *  dibuja un dato. El cable lo declara con el comodín `'*'`, pero
 *  `adapt.ts` lo expande a todas las formas dibujables antes de llegar acá, así
 *  que mirar el comodín no lo excluía. Lo encontró abrir el chat contra el
 *  servicio: un `tabular` salía con «más de un tipo la acepta» y las pruebas
 *  pasaban, porque su tabla traía el comodín del cable y no la ya adaptada. */
export function soleTypeFor(table: BlockTable, shape: Shape): PanelType | null {
  const tipos = [...table.values()].filter(
    (b) => b.tipo !== 'blocked' && b.formasAceptadas.includes(shape),
  )
  return tipos.length === 1 ? (tipos[0] as Block).tipo : null
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
