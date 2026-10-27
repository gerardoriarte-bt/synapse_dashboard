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
  /** `*así*` · desde el 2026-10-27. El agente marca así un nombre propio
   *  —«*Armour Week*»— y en pantalla se leían los dos asteriscos. */
  cursiva: boolean
}

export type Bloque =
  /** `### Lo que sea` · **todos los niveles caen acá a propósito**: darle un
   *  tamaño distinto a `##` que a `###` inventaría una escala que el `.pen` no
   *  dibuja. Cómo se pinta lo decide `Markdown.tsx`. */
  | { tipo: 'seccion'; texto: string }
  | { tipo: 'parrafo'; trozos: Trozo[] }
  /** `> así` · desde el 2026-10-27. El agente abre así una nota —«> ⚠️ Nota
   *  clave: …»— y el `>` se veía al principio del párrafo. Varias líneas
   *  seguidas con `>` son UNA cita. */
  | { tipo: 'cita'; trozos: Trozo[] }
  /** `---` solo en su línea · desde el 2026-10-27. El agente separa así las
   *  secciones de un análisis largo, y medido en QA ese día una sola
   *  respuesta tenía diez `---` sueltos en pantalla. */
  | { tipo: 'separador' }
  | { tipo: 'lista'; ordenada: boolean; items: Trozo[][] }
  /** `| a | b |` · desde el 2026-10-07. Hasta ese día una tabla del agente se
   *  unía en UN párrafo de pipes —`| Canal | ROAS | |---|---| | Meta | 4.2 |`—
   *  y es lo que más escribe un analista: en Snowflake Intelligence la misma
   *  respuesta se leía como tabla. `numericas` dice qué columnas se alinean a
   *  la derecha, y sale de las celdas, no de una decisión nuestra. */
  | { tipo: 'tabla'; encabezado: Trozo[][]; filas: Trozo[][][]; numericas: boolean[] }

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
// `---`, `***` o `___`, tres o más, y nada más en la línea. Va ANTES que la
// viñeta: `* * *` también empieza como una.
const REGLA = /^\s*([-*_])(?:\s*\1){2,}\s*$/
const CITA = /^\s*>\s?(.*)$/
const FILA_DE_TABLA = /^\s*\|/
// `|---|:---:|` · y también `|--` a medio llegar, que durante el streaming no
// tiene que verse como una fila.
const SEPARADOR = /^\s*\|?[\s:|-]*-[\s:|-]*$/
// Una celda que se lee como cifra: signo, moneda, miles, decimales, `%` o `x`.
// **`~` y `≈` delante, y `+` detrás, desde el 2026-10-27**: el agente escribe
// «~$52,567» y «$61+», y esa columna se alineaba a la izquierda entre otras
// dos de cifras.
const CIFRA = /^[~≈]?\s*[-+−]?\s*[$€]?\s*[\d.,]+\s*(%|x|[kKmM])?\+?$/

export function parsear(markdown: string): Respuesta {
  const lineas = markdown.split('\n')

  // El marcador va en la PRIMERA línea y solo. Buscarlo en cualquier lado haría
  // que una respuesta que lo menciona se rinda sola.
  const sinCompetencia = lineas[0]?.trim() === SIN_COMPETENCIA
  if (sinCompetencia) lineas.shift()

  const bloques: Bloque[] = []
  let parrafo: string[] = []
  let lista: { ordenada: boolean; items: string[] } | null = null
  let tabla: string[] | null = null
  let cita: string[] | null = null

  const cerrarParrafo = () => {
    if (parrafo.length === 0) return
    bloques.push({ tipo: 'parrafo', trozos: inline(parrafo.join(' ')) })
    parrafo = []
  }
  const cerrarCita = () => {
    if (cita === null) return
    // Un `>` que todavía no trajo texto —recién llegado por el stream— no
    // abre una cita vacía.
    if (cita.length > 0) bloques.push({ tipo: 'cita', trozos: inline(cita.join(' ')) })
    cita = null
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
  // **Sin separador también es tabla.** Durante el streaming el encabezado
  // llega antes que `|---|`, y pintarlo como párrafo un instante haría saltar
  // la respuesta. Las líneas separadoras se descartan donde estén.
  const cerrarTabla = () => {
    if (tabla === null) return
    const [cabeza = [], ...cuerpo] = tabla.filter((l) => !SEPARADOR.test(l)).map(celdas)
    const numericas = cabeza.map((_, j) => {
      const columna = cuerpo.map((f) => f[j] ?? '').filter((c) => c !== '')
      return columna.length > 0 && columna.every((c) => CIFRA.test(c.replace(/\*/g, '')))
    })
    bloques.push({
      tipo: 'tabla',
      encabezado: cabeza.map(inline),
      filas: cuerpo.map((f) => cabeza.map((_, j) => inline(f[j] ?? ''))),
      numericas,
    })
    tabla = null
  }

  for (const cruda of lineas) {
    const linea = cruda.trimEnd()

    if (linea.trim() === '') {
      cerrarParrafo()
      cerrarLista()
      cerrarTabla()
      cerrarCita()
      continue
    }

    if (FILA_DE_TABLA.test(linea)) {
      cerrarParrafo()
      cerrarLista()
      cerrarCita()
      if (tabla === null) tabla = []
      tabla.push(linea)
      continue
    }
    cerrarTabla()

    const enCita = CITA.exec(linea)
    if (enCita !== null) {
      cerrarParrafo()
      cerrarLista()
      if (cita === null) cita = []
      // Una línea de `>` sola, sin texto, no agrega nada: es el renglón en
      // blanco dentro de la cita.
      const texto = (enCita[1] ?? '').trim()
      if (texto !== '') cita.push(texto)
      continue
    }
    cerrarCita()

    if (REGLA.test(linea)) {
      cerrarParrafo()
      cerrarLista()
      bloques.push({ tipo: 'separador' })
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
  cerrarTabla()
  cerrarCita()

  return { sinCompetencia, bloques }
}

/** `| a | b |` → `['a', 'b']`. Los pipes de los bordes son opcionales. */
function celdas(linea: string): string[] {
  const t = linea.trim().replace(/^\|/, '').replace(/\|$/, '')
  return t.split('|').map((c) => c.trim())
}

/** `**énfasis**`, `*cursiva*` y `` `código` ``, sin anidarse.
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
    trozos.push({ texto: plano, enfasis: false, codigo: false, cursiva: false })
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
      trozos.push({ texto: contenido, enfasis: doble, codigo: tilde, cursiva: false })
      i = cierre + marca.length
      continue
    }

    // **La cursiva, con las reglas que evitan leer un `*` suelto como marca**:
    // el que abre no va seguido de espacio y el que cierra no va precedido de
    // uno —«5 * 3 * 2» sigue literal—, y el que cierra no es la mitad de un
    // `**`. Sin cierre, literal, como los otros dos.
    if (texto[i] === '*') {
      const cierre = texto.indexOf('*', i + 1)
      const contenido = cierre === -1 ? '' : texto.slice(i + 1, cierre)
      const valida =
        cierre !== -1 &&
        texto[cierre + 1] !== '*' &&
        contenido !== '' &&
        contenido.trim() === contenido
      if (valida) {
        soltarPlano()
        trozos.push({ texto: contenido, enfasis: false, codigo: false, cursiva: true })
        i = cierre + 1
        continue
      }
    }

    plano += texto[i]
    i += 1
  }

  soltarPlano()
  return trozos
}
