import type { Block } from '../../api/types'

/** El tipo que dibuja una forma · el primero de la tabla que la acepta, sin el
 *  bloqueado —acepta `*` y no dibuja nada—. Lo usa el contenedor al elegir una
 *  métrica de otra forma, y la lista para decir qué va a pasar. */
export function tipoPara(bloques: readonly Block[], forma: string): string | undefined {
  return bloques.find((b) => b.tipo !== 'blocked' && b.formasAceptadas.includes(forma as never))?.tipo
}
