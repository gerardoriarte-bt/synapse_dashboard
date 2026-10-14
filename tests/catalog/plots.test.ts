/** Las reglas del repertorio · F1.31 · 2026-09-29
 *
 *  **Los fixtures están CAPTURADOS de `GET /config/plots`**, la ruta que
 *  escribimos ese día, medida contra `b6f0e09`. No se escribieron de memoria y
 *  no se inventó un umbral: `treemap` pide 2 en `categorica` y 3 en
 *  `composicion` porque eso es lo que el servicio devuelve.
 *
 *  Lo que se verifica no es que las funciones corran —eso lo dice el
 *  compilador— sino las tres decisiones que se pueden equivocar sin que nada
 *  falle: que el mínimo se busque **por forma**, que un sustantivo desconocido
 *  **no pase**, y que la razón que sale sea la del repertorio y no una compuesta
 *  acá.
 */
import { describe, expect, it } from 'vitest'
import { acceptsShape, evaluar, invalidPlotReason, plotTable, supportsBand } from '@/catalog/plots'
import type { Plot, Value } from '@/catalog/types'

/** Cuatro entradas, tal como las devolvió el servicio. `treemap` es la que
 *  importa: dos formas con umbrales distintos. */
const REPERTORIO = [
  {
    id: 'treemap',
    nombre: 'TREEMAP',
    formas: ['categorica', 'composicion'],
    soportaBanda: false,
    minimos: [
      { forma: 'categorica', cuando: 'items < 2', razon: 'una barra sola no compara nada' },
      { forma: 'composicion', cuando: 'partes < 3', razon: 'con dos rectángulos es una barra apilada' },
    ],
    tope: null,
  },
  {
    id: 'donut',
    nombre: 'DONA',
    formas: ['categorica', 'composicion'],
    soportaBanda: false,
    minimos: [
      { forma: 'categorica', cuando: 'items < 2', razon: 'una barra sola no compara nada' },
      { forma: 'composicion', cuando: 'partes < 2', razon: 'una parte sola es el 100 %' },
    ],
    tope: { cuando: 'partes > 5', razon: 'más de cinco partes, ilegible en dona' },
  },
  {
    id: 'forecast',
    nombre: 'PRONÓSTICO',
    formas: ['escalarConIntervalo', 'serieConBanda'],
    soportaBanda: true,
    minimos: [{ forma: 'serieConBanda', cuando: 'puntos < 2', razon: 'un punto no es una tendencia' }],
    tope: null,
  },
  {
    // **`radar` es la única entrada donde el mínimo y el tope pueden fallar A LA
    // VEZ**, porque cuentan sustantivos distintos: los ejes y los perfiles. Con
    // la dona no se puede —`partes < 2` y `partes > 5` se excluyen—, así que sin
    // esta entrada la prueba de orden no discrimina nada. Lo encontró una
    // mutación que SOBREVIVIÓ.
    id: 'radar',
    nombre: 'RADAR',
    formas: ['perfilMultiatributo'],
    soportaBanda: false,
    minimos: [
      { forma: 'perfilMultiatributo', cuando: 'atributos < 3', razon: 'con dos ejes el radar es una línea' },
    ],
    tope: { cuando: 'perfiles > 3', razon: 'por encima de tres, los polígonos se superponen y ninguno se lee' },
  },
  {
    // Uno de los seis SIN mínimo. Vacío es legítimo y el servicio lo manda `[]`,
    // nunca `null` — verificado en la ruta.
    id: 'kpi',
    nombre: 'KPI',
    formas: ['escalar'],
    soportaBanda: false,
    minimos: [],
    tope: null,
  },
] as unknown as Plot[]

const T = plotTable(REPERTORIO)

const valor = <F extends Value['forma']>(v: unknown) => v as unknown as Extract<Value, { forma: F }>

const categorica = (n: number) =>
  valor<'categorica'>({
    forma: 'categorica',
    items: Array.from({ length: n }, (_, i) => ({ etiqueta: `c${String(i)}`, v: i + 1 })),
  })

const composicion = (n: number) =>
  valor<'composicion'>({
    forma: 'composicion',
    partes: Array.from({ length: n }, (_, i) => ({ etiqueta: `p${String(i)}`, v: i + 1 })),
  })

describe('la tabla y sus preguntas simples', () => {
  it('`acceptsShape` sale de las formas que declaró el repertorio', () => {
    expect(acceptsShape(T, 'treemap', 'categorica')).toBe(true)
    expect(acceptsShape(T, 'treemap', 'serieTemporal')).toBe(false)
    // **Un id que no está en la tabla no acepta nada** — y no revienta.
    // Era `radar` hasta que `radar` entró al fixture para la prueba de orden, y
    // entonces esto seguía en verde **verificando otra cosa**: que un gráfico
    // presente rechace una forma ajena, que ya lo cubre la línea de arriba. Es
    // el caso negativo que se vuelve positivo, tercera vez en el día.
    expect(acceptsShape(T, 'sankey', 'categorica')).toBe(false)
  })

  it('`supportsBand` sostiene la regla dura 6', () => {
    expect(supportsBand(T, 'forecast')).toBe(true)
    expect(supportsBand(T, 'donut')).toBe(false)
  })
})

describe('el mínimo se busca POR FORMA, y ahí está el error fácil', () => {
  it('`treemap` pide 2 en `categorica` y 3 en `composicion`', () => {
    // **Esta es la prueba que vale.** Tomar el primer mínimo de la lista en vez
    // de buscarlo por forma acierta en cuarenta de los 49 y falla en nueve —los
    // que sirven dos formas con umbrales distintos— y el que falla se ve bien.
    expect(invalidPlotReason(T, 'treemap', categorica(2))).toBeNull()
    expect(invalidPlotReason(T, 'treemap', composicion(2))).toEqual({
      clase: 'minimo',
      razon: 'con dos rectángulos es una barra apilada',
    })
    expect(invalidPlotReason(T, 'treemap', composicion(3))).toBeNull()
  })

  it('la razón es la del REPERTORIO, textual', () => {
    // No se compone acá: viene redactada de `design.md` y se pinta tal cual.
    expect(invalidPlotReason(T, 'donut', categorica(1))?.razon).toBe(
      'una barra sola no compara nada',
    )
  })

  it('una forma sin mínimo declarado no bloquea nada', () => {
    // `forecast` declara mínimo sólo para `serieConBanda`; sobre
    // `escalarConIntervalo` no hay umbral y no se inventa uno.
    const escalarConIntervalo = valor<'escalarConIntervalo'>({
      forma: 'escalarConIntervalo',
      v: 10,
      lo: 8,
      hi: 12,
      nivel: 0.8,
    })
    expect(invalidPlotReason(T, 'forecast', escalarConIntervalo)).toBeNull()
  })

  it('un gráfico con `minimos: []` nunca cae por mínimo', () => {
    expect(invalidPlotReason(T, 'kpi', valor<'escalar'>({ forma: 'escalar', v: 42 }))).toBeNull()
  })
})

describe('el tope, que es la otra mitad', () => {
  it('seis partes exceden la dona y la razón lo dice', () => {
    expect(invalidPlotReason(T, 'donut', composicion(6))).toEqual({
      clase: 'tope',
      razon: 'más de cinco partes, ilegible en dona',
    })
    expect(invalidPlotReason(T, 'donut', composicion(5))).toBeNull()
  })

  it('el MÍNIMO se evalúa antes que el tope · con los DOS incumplidos', () => {
    // **La primera versión de esta prueba usaba la dona y no demostraba nada**:
    // `partes < 2` y `partes > 5` se excluyen, así que invertir el orden daba el
    // mismo resultado y la mutación sobrevivía. `radar` sí discrimina — cuenta
    // ejes para el mínimo y perfiles para el tope— así que un perfil de dos ejes
    // repetido cuatro veces incumple los dos.
    //
    // Y el orden importa para el usuario: «faltan ejes» se puede arreglar
    // pidiendo el dato; «sobran perfiles» manda a recortar algo que no es el
    // problema.
    const cortoYnumeroso = valor<'perfilMultiatributo'>({
      forma: 'perfilMultiatributo',
      perfiles: Array.from({ length: 4 }, (_, i) => ({
        etiqueta: `p${String(i)}`,
        atributos: [
          { clave: 'NOTORIEDAD', v: 1 },
          { clave: 'CALIDAD', v: 2 },
        ],
      })),
    })

    expect(evaluar('atributos < 3', cortoYnumeroso)).toBe(true)
    expect(evaluar('perfiles > 3', cortoYnumeroso)).toBe(true)
    expect(invalidPlotReason(T, 'radar', cortoYnumeroso)).toEqual({
      clase: 'minimo',
      razon: 'con dos ejes el radar es una línea',
    })
  })
})

describe('la incompatibilidad y el id que no existe', () => {
  it('un gráfico que no sirve la forma se rechaza CON su nombre', () => {
    const p = invalidPlotReason(T, 'forecast', categorica(3))
    expect(p?.clase).toBe('incompatible')
    // El nombre del repertorio y no el id: es lo que el usuario ve en el selector.
    expect(p?.razon).toContain('PRONÓSTICO')
  })

  it('un id fuera del repertorio se declara, no se ignora', () => {
    expect(invalidPlotReason(T, 'sankey', categorica(3))).toEqual({
      clase: 'incompatible',
      razon: 'el gráfico «sankey» no está en el repertorio',
    })
  })
})

describe('evaluar una condición · lo que NO se puede dar por cumplido', () => {
  it('cuenta el sustantivo del contrato', () => {
    expect(evaluar('items < 2', categorica(1))).toBe(true)
    expect(evaluar('items < 2', categorica(2))).toBe(false)
    expect(evaluar('partes > 5', composicion(6))).toBe(true)
  })

  it('la `o` es disyunción · es la de `matriz`', () => {
    const matriz = (f: number, c: number) =>
      valor<'matriz'>({
        forma: 'matriz',
        filas: Array.from({ length: f }, (_, i) => `f${String(i)}`),
        columnas: Array.from({ length: c }, (_, i) => `c${String(i)}`),
        celdas: [],
      })
    expect(evaluar('filas < 2 o columnas < 2', matriz(1, 5))).toBe(true)
    expect(evaluar('filas < 2 o columnas < 2', matriz(5, 1))).toBe(true)
    expect(evaluar('filas < 2 o columnas < 2', matriz(2, 2))).toBe(false)
  })

  it('**un sustantivo desconocido devuelve `null`, NO `false`**', () => {
    // La decisión más importante del módulo. `false` diría «la condición no se
    // cumple, así que el gráfico pasa» — apagando una regla en silencio el día
    // que el repertorio agregue un sustantivo que este build no cuenta.
    expect(evaluar('celdas < 4', categorica(3))).toBeNull()
    expect(evaluar('items < dos', categorica(3))).toBeNull()
  })

  it('una cuenta que NO APLICA a la forma también es `null`', () => {
    // Un escalar no tiene `items`. Contarlo como 0 diría «llegaron cero» donde
    // lo cierto es «esa cuenta no existe para esta forma», y `items < 2` saldría
    // cumplido — apagando el gráfico por una razón falsa.
    expect(evaluar('items < 2', valor<'escalar'>({ forma: 'escalar', v: 1 }))).toBeNull()
  })

  it('no evaluable NO apaga el panel · se reporta y se dibuja', () => {
    // **Se usa un id REAL del repertorio** y no uno inventado: `ChartId` es un
    // enumerado del contrato, así que `'raro'` ni compila — y eso está bien, es
    // el enumerado haciendo su trabajo. Lo que se prueba acá es la condición que
    // este build no sabe contar, no un id fantasma.
    const raro = [
      { ...REPERTORIO[0], minimos: [{ forma: 'categorica', cuando: 'celdas < 4', razon: 'x' }] },
    ] as unknown as Plot[]
    const p = invalidPlotReason(plotTable(raro), 'treemap', categorica(3))
    expect(p?.clase).toBe('indeterminado')
    // Es la misma elección que `adaptPanelParams` con un param desconocido:
    // informar sin castigar al usuario por una deriva entre las dos mitades.
    expect(p?.razon).toContain('celdas < 4')
  })
})
