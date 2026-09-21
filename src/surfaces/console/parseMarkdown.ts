/** El markdown del agente a bloques · F3.13
 *
 *  **Un parser propio y mínimo, no una biblioteca, y la razón no es el peso.**
 *  Un renderizador de markdown general emite HTML: encabezados con tamaños que
 *  no son los nuestros, enlaces que el agente podría inventar, e imágenes. Acá
 *  el texto lo compone un modelo que consulta datos del tenant, así que **lo que
 *  no se declara explícitamente no se pinta**. Esta función devuelve una
 *  estructura cerrada y el componente decide con qué token dibuja cada caso; no
 *  existe una ruta por la que llegue HTML a la pantalla.
 *
 *  **Soporta lo que el backend dice que emite y nada más.** Su `openapi.yaml`
 *  declara: markdown en español que abre con una conclusión de 1-2 frases y,
 *  cuando aplica, las secciones `### Puntos de lectura`, `### Fuentes
 *  consultadas` y `### Límite declarado`. Más listas y énfasis, que es lo que
 *  un modelo escribe sin que se lo pidan.
 *
 *  **Y tiene que aguantar texto A MEDIO LLEGAR.** La prosa entra por fragmentos
 *  del stream, así que esto se ejecuta sobre `«### Límite decl»` y sobre
 *  `«el margen cayó **12`. Un marcador sin cerrar se pinta literal en vez de
 *  tragarse el resto de la respuesta: durante el streaming se ve un asterisco
 *  un instante, que es preferible a que media frase desaparezca y vuelva.
 */

/** Un trozo de texto con su énfasis ya resuelto. */
export type Trozo = {
  texto: string
  /** `**así**` · el modelo lo usa para las cifras que quiere destacar. */
  enfasis: boolean
  /** `` `así` `` · nombres de columna, claves, valores literales. */
  codigo: boolean
}

export type Bloque =
  /** `### Lo que sea` · **todos los niveles caen acá a propósito**. La casa
   *  tiene UN rótulo de sección —mono, mayúsculas, `0.12em`— y darle un tamaño
   *  distinto a `##` que a `###` inventaría una escala que el `.pen` no dibuja. */
  | { tipo: 'seccion'; texto: string }
  | { tipo: 'parrafo'; trozos: Trozo[] }
  | { tipo: 'lista'; ordenada: boolean; items: Trozo[][] }

export type Respuesta = {
  /** El agente declaró que no puede responder con las fuentes que tiene.
   *  La primera línea es **exactamente** `[SIN_COMPETENCIA]` y lo que sigue es
   *  el motivo · lo declara su `openapi.yaml`. */
  sinCompetencia: boolean
  bloques: Bloque[]
}

const SIN_COMPETENCIA = '[SIN_COMPETENCIA]'

// El texto es OPCIONAL a propósito: `###` a secas es un encabezado que el
// stream todavía no terminó de escribir. Exigir el espacio lo dejaba caer a
// párrafo, y los tres numerales se veían en pantalla — el defecto de F3.13 en
// chico, y lo encontró la prueba de prefijos.
const ENCABEZADO = /^#{1,6}(?:\s+(.*))?$/
const VINETA = /^\s*[-*]\s+(.*)$/
const NUMERADA = /^\s*\d+[.)]\s+(.*)$/

export function parsear(markdown: string): Respuesta {
  const lineas = markdown.split('\n')

  // El marcador va en la PRIMERA línea y solo. Buscarlo en cualquier lado haría
  // que una respuesta que lo menciona se rinda sola.
  const sinCompetencia = lineas[0]?.trim() === SIN_COMPETENCIA
  if (sinCompetencia) lineas.shift()

  const bloques: Bloque[] = []
  let parrafo: string[] = []
  let lista: { ordenada: boolean; items: string[] } | null = null

  const cerrarParrafo = () => {
    if (parrafo.length === 0) return
    bloques.push({ tipo: 'parrafo', trozos: inline(parrafo.join(' ')) })
    parrafo = []
  }
  const cerrarLista = () => {
    if (lista === null) return
    bloques.push({
      tipo: 'lista',
      ordenada: lista.ordenada,
      items: lista.items.map(inline),
    })
    lista = null
  }

  for (const cruda of lineas) {
    const linea = cruda.trimEnd()

    if (linea.trim() === '') {
      cerrarParrafo()
      cerrarLista()
      continue
    }

    const enc = ENCABEZADO.exec(linea)
    if (enc !== null) {
      cerrarParrafo()
      cerrarLista()
      // Un `###` recién escrito, sin texto todavía, no abre una sección vacía:
      // durante el streaming aparecería un rótulo en blanco y desaparecería.
      const texto = (enc[1] ?? '').trim()
      if (texto !== '') bloques.push({ tipo: 'seccion', texto })
      continue
    }

    const num = NUMERADA.exec(linea)
    const vin = num === null ? VINETA.exec(linea) : null
    if (num !== null || vin !== null) {
      cerrarParrafo()
      const ordenada = num !== null
      // Cambiar de tipo de lista cierra la anterior: mezclarlas en una sola
      // perdería la numeración o la inventaría.
      if (lista !== null && lista.ordenada !== ordenada) cerrarLista()
      if (lista === null) lista = { ordenada, items: [] }
      lista.items.push(((num ?? vin)?.[1] ?? '').trim())
      continue
    }

    cerrarLista()
    parrafo.push(linea.trim())
  }

  cerrarParrafo()
  cerrarLista()

  return { sinCompetencia, bloques }
}

/** `**énfasis**` y `` `código` ``, sin anidarse.
 *
 *  **Un marcador sin cerrar se queda literal.** Es la decisión que hace que el
 *  streaming no parpadee: con `«cayó **12»` a medio llegar, tragarse el `**` y
 *  esperar el cierre haría desaparecer «12» hasta que llegue el siguiente
 *  fragmento. */
function inline(texto: string): Trozo[] {
  const trozos: Trozo[] = []
  let plano = ''

  const soltarPlano = () => {
    if (plano === '') return
    trozos.push({ texto: plano, enfasis: false, codigo: false })
    plano = ''
  }

  let i = 0
  while (i < texto.length) {
    const doble = texto.startsWith('**', i)
    const tilde = texto[i] === '`'

    if (doble || tilde) {
      const marca = doble ? '**' : '`'
      const cierre = texto.indexOf(marca, i + marca.length)
      const contenido = cierre === -1 ? '' : texto.slice(i + marca.length, cierre)

      // Sin cierre, o con un par vacío (`****`), va literal.
      if (cierre === -1 || contenido === '') {
        plano += marca
        i += marca.length
        continue
      }

      soltarPlano()
      trozos.push({ texto: contenido, enfasis: doble, codigo: tilde })
      i = cierre + marca.length
      continue
    }

    plano += texto[i]
    i += 1
  }

  soltarPlano()
  return trozos
}
