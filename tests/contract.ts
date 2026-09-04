/** Leer un enumerado del contrato, desde una prueba · F5.6
 *
 *  **Por qué existe.** `registry.test.tsx` comparaba el registro contra un
 *  arreglo de quince tipos escrito a mano en el propio archivo. La intención era
 *  correcta —el comentario decía «no leídos del registro: si se leyeran, la
 *  prueba no podría detectar que falta uno»— pero se quedó a mitad de camino:
 *  una copia a mano del yaml se desactualiza igual que el registro, y entonces
 *  la prueba pasa a verde con el contrato adelante.
 *
 *  **Y no se puede resolver con tipos.** `PanelType` es una unión de TypeScript
 *  y se borra al compilar, así que no hay forma de enumerarla en runtime desde
 *  `generated.ts`. La paridad tiene que salir del yaml, que es donde vive el
 *  enumerado de verdad — el mismo camino que ya toman `spec-anclas` con
 *  `design.md` y `token-drift` con el `.pen`.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Ruta desde la raíz: vitest corre desde ahí, y en jsdom `import.meta.url` es
// una URL http que `readFileSync` rechaza.
const YAML = readFileSync(resolve(process.cwd(), 'contracts/synapse-api.yaml'), 'utf-8')

/** Solo `components/schemas`, y no es paranoia: el contrato tiene un
 *  `components/responses/NoExiste` —el 404— y buscar por nombre en el archivo
 *  entero lo encontraba. Un esquema y una respuesta pueden llamarse igual, así
 *  que la búsqueda se acota a la sección correcta. */
const SCHEMAS = (() => {
  const desde = YAML.indexOf('\n  schemas:\n')
  if (desde === -1) throw new Error('contracts/synapse-api.yaml no tiene `components/schemas`')
  // Hasta la próxima clave de dos espacios, que es la sección siguiente.
  const resto = YAML.slice(desde + 1)
  const hasta = /\n {2}[a-z]/.exec(resto.slice(1))
  return hasta === null ? resto : resto.slice(0, hasta.index + 1)
})()

/** Los valores del `enum` de un esquema de `components/schemas`.
 *
 *  Acepta las dos formas que usa el contrato: en una línea —`enum: [BRONZE,
 *  SILVER, GOLD]`— y la de bloque, que parte la lista en varias líneas.
 *
 *  **Tira si no lo encuentra, en vez de devolver vacío.** Un arreglo vacío
 *  volvería verde a toda comparación de paridad, que es el modo de falla que
 *  esta función viene a cerrar. */
export function enumOf(schema: string): string[] {
  const bloque = new RegExp(`^ {4}${schema}:\\n(?: {5,}.*\\n|\\n)*`, 'm').exec(SCHEMAS)
  if (bloque === null) {
    throw new Error(`contracts/synapse-api.yaml no declara el esquema '${schema}'`)
  }

  // `enum:` a SEIS espacios, que es el nivel del esquema. Sin acotarlo agarraba
  // el `enum` de una propiedad anidada: `Metrica` tiene varios adentro y
  // devolvía el primero como si fuera el del esquema.
  const lista = /^ {6}enum:\s*\[([^\]]*)\]/m.exec(bloque[0])
  if (lista === null) {
    throw new Error(`el esquema '${schema}' del contrato no tiene un \`enum\``)
  }

  return (lista[1] as string)
    .split(',')
    .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
    .filter((v) => v !== '')
}
