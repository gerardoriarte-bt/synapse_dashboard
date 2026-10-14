/** Las líneas de diff de una publicación · B6 · §PEN:B6
 *
 *  **Es la función donde muerden las mutaciones**, y por eso se prueba aparte del
 *  render: el reparto de los tres glifos y el conteo exacto de entradas son las
 *  dos cosas que pueden estar mal sin que la pantalla se vea rota.
 *
 *  El diff de entrada se arma con la forma YA ADAPTADA, que es lo que la función
 *  recibe. La tolerancia `null`-o-`[]` la verifica `tests/api/publicaciones.test.ts`
 *  sobre el adaptador, que es donde vive — cubrirla dos veces esconde cuál de las
 *  dos capas la sostiene.
 */
import { describe, expect, it } from 'vitest'
import { cambios } from '@/surfaces/builder/cambios'
import type { DiffDePublicacion } from '@/api/admin'

const METRICA = '0ec90430-794c-5626-9863-a88b610515bd'

const vacio = (): DiffDePublicacion => ({
  contadores: {
    pestanasAnadidas: 0,
    pestanasQuitadas: 0,
    panelesAnadidos: 0,
    panelesQuitados: 0,
    panelesCambiados: 0,
  },
  pestanasAnadidas: [],
  pestanasQuitadas: [],
  pestanasReordenadas: [],
  panelesAnadidos: [],
  panelesQuitados: [],
  panelesMovidos: [],
  panelesRetipados: [],
  panelesConParametroCambiado: [],
})

/** El diff del FIXTURE B de `publicaciones.test.ts`, ya adaptado: la fila
 *  `rollback-v-1790630106` del 2026-09-28 con las tres formas de cambio. */
const diffDelRollback = (): DiffDePublicacion => ({
  ...vacio(),
  contadores: {
    pestanasAnadidas: 0,
    pestanasQuitadas: 1,
    panelesAnadidos: 0,
    panelesQuitados: 1,
    panelesCambiados: 3,
  },
  pestanasQuitadas: ['segunda'],
  panelesQuitados: [{ pestana: 'segunda', tipo: 'kpi', metricId: METRICA }],
  panelesMovidos: [
    {
      pestana: 'marca',
      tipo: 'kpi',
      metricId: METRICA,
      desde: { colStart: 4, colSpan: 3, rowSpan: 4 },
      hasta: { colStart: 1, colSpan: 3, rowSpan: 4 },
    },
  ],
  panelesRetipados: [{ pestana: 'marca', tipo: 'kpi', metricId: METRICA, tipoAnterior: 'gauge' }],
  panelesConParametroCambiado: [{ pestana: 'marca', tipo: 'kpi', metricId: METRICA }],
})

describe('cambios() · el glifo y el rótulo de cada lista', () => {
  it('sobre el diff del rollback devuelve CINCO entradas, en orden y con estos glifos', () => {
    // **El conteo exacto rompe si una de las ocho listas se olvida**, y los
    // glifos rompen si se reasignan. Las dos cosas compilan.
    //
    // **Son cinco y no seis.** La especificación de esta tarea decía «seis
    // entradas» y enumeraba cinco: el fixture tiene una pestaña quitada, un panel
    // quitado, uno movido, uno retipado y uno con parámetro cambiado. Se contó
    // sobre el fixture, no sobre la frase.
    const cs = cambios(diffDelRollback())
    expect(cs).toHaveLength(5)
    expect(cs.map((c) => `${c.glifo} ${c.rotulo}`)).toEqual([
      '! PESTAÑA QUITADA',
      '! QUITADO',
      '~ MOVIDO',
      '~ RETIPADO',
      '~ PARÁMETRO',
    ])
  })

  it('no hay ninguna `+` cuando no se agregó nada', () => {
    expect(cambios(diffDelRollback()).filter((c) => c.glifo === '+')).toHaveLength(0)
  })

  it('el `+` es para lo AÑADIDO, y cubre las dos listas de alta', () => {
    const cs = cambios({
      ...vacio(),
      pestanasAnadidas: ['repertorio con dato real'],
      panelesAnadidos: [
        { pestana: 'repertorio con dato real', tipo: 'bars', metricId: METRICA },
      ],
    })
    expect(cs.map((c) => `${c.glifo} ${c.rotulo}`)).toEqual(['+ PESTAÑA AÑADIDA', '+ AÑADIDO'])
  })

  it('el `!` es para lo DESTRUCTIVO · es lo que el dibujo hace con él en v2', () => {
    const cs = cambios({
      ...vacio(),
      pestanasQuitadas: ['marca'],
      panelesQuitados: [{ pestana: 'marca', tipo: 'kpi', metricId: METRICA }],
    })
    expect(cs.every((c) => c.glifo === '!')).toBe(true)
  })

  it('MOVIDO conserva la geometría de las dos puntas', () => {
    const c = cambios(diffDelRollback()).find((x) => x.rotulo === 'MOVIDO')
    expect(c?.desde).toEqual({ colStart: 4, colSpan: 3, rowSpan: 4 })
    expect(c?.hasta).toEqual({ colStart: 1, colSpan: 3, rowSpan: 4 })
  })

  it('RETIPADO conserva el tipo anterior · sin él la línea no dice qué cambió', () => {
    expect(cambios(diffDelRollback()).find((x) => x.rotulo === 'RETIPADO')?.tipoAnterior).toBe(
      'gauge',
    )
  })

  it('las entradas de PESTAÑA no traen `tipo` ni `metricId`: una pestaña no es un panel', () => {
    const c = cambios({ ...vacio(), pestanasQuitadas: ['marca'] })[0]
    expect(c?.tipo).toBeUndefined()
    expect(c?.metricId).toBeUndefined()
  })
})

describe('cambios() · el único cruce que el servicio permite verificar', () => {
  it('las entradas `~` DE PANEL suman `contadores.panelesCambiados` · 3 = 3', () => {
    // **Se compara, no se deriva.** El contador se lee del cable; esto verifica
    // que las tres listas que el servicio suma sean las tres que acá se pintan
    // con `~`. Si una se olvidara, el número de la tarjeta y sus líneas dirían
    // cosas distintas.
    const diff = diffDelRollback()
    const tildesDePanel = cambios(diff).filter((c) => c.glifo === '~' && c.metricId !== undefined)
    expect(tildesDePanel).toHaveLength(diff.contadores.panelesCambiados)
  })

  it('PESTAÑAS REORDENADAS queda FUERA de ese cruce · el resumen no las cuenta', () => {
    // El cable lo dice leyendo `DiffLayouts`: `summary` no tiene contador de
    // reordenamiento. Así que una pantalla que dijera «sin cambios» mirando sólo
    // los cinco contadores mentiría sobre este caso — y esta prueba lo fija.
    const diff: DiffDePublicacion = { ...vacio(), pestanasReordenadas: ['marca', 'segunda'] }
    const cs = cambios(diff)
    expect(cs).toHaveLength(2)
    expect(cs.every((c) => c.rotulo === 'PESTAÑAS REORDENADAS')).toBe(true)
    // Dos cambios reales con el resumen en cero.
    expect(diff.contadores.panelesCambiados).toBe(0)
    expect(cs.filter((c) => c.metricId !== undefined)).toHaveLength(0)
  })
})

describe('cambios() · las dos serializaciones de colección vacía', () => {
  it('con las ocho listas vacías devuelve `[]` · la tarjeta pinta un rótulo, no un bloque vacío', () => {
    // Rompe si se pinta el contenedor del diff sin contenido — el mismo modo de
    // falla que la línea de BASE con el separador colgando.
    expect(cambios(vacio())).toEqual([])
  })

  it('una lista con elementos y otra vacía no se contaminan', () => {
    // El defecto que esto persigue es un `for` que itere la lista equivocada:
    // con dos listas de forma parecida —`panelesQuitados` y
    // `panelesConParametroCambiado`, las dos `RefDePanel`— es un copiar y pegar
    // que compila.
    const cs = cambios({ ...vacio(), panelesConParametroCambiado: [{ pestana: 'marca', tipo: 'kpi', metricId: METRICA }] })
    expect(cs).toHaveLength(1)
    expect(cs[0]?.rotulo).toBe('PARÁMETRO')
  })
})

describe('cambios() · QA · el ORDEN de los cuatro grupos, con las ocho listas a la vez', () => {
  /** **Una mutación que pone lo QUITADO antes que lo AÑADIDO sobrevivía.**
   *
   *  El orden está declarado en la cabecera de `cambios.ts` como normativo —«acá
   *  van añadido → quitado → cambiado → reordenado, que es el orden en que el
   *  dibujo las pinta: lo nuevo arriba y el detalle abajo»— y ninguna prueba lo
   *  cubría entre grupos: la del rollback no tiene ninguna alta y la del `+` no
   *  tiene ninguna baja, así que cada una fija el orden DENTRO de su grupo y
   *  ninguna el orden ENTRE grupos.
   *
   *  Este diff tiene las OCHO listas con un elemento, que es el único fixture que
   *  puede fijar los cuatro grupos de una vez. */
  const lasOcho = (): DiffDePublicacion => ({
    contadores: {
      pestanasAnadidas: 1,
      pestanasQuitadas: 1,
      panelesAnadidos: 1,
      panelesQuitados: 1,
      panelesCambiados: 3,
    },
    pestanasAnadidas: ['nueva'],
    pestanasQuitadas: ['vieja'],
    pestanasReordenadas: ['marca'],
    panelesAnadidos: [{ pestana: 'nueva', tipo: 'bars', metricId: METRICA }],
    panelesQuitados: [{ pestana: 'vieja', tipo: 'kpi', metricId: METRICA }],
    panelesMovidos: [
      {
        pestana: 'marca',
        tipo: 'kpi',
        metricId: METRICA,
        desde: { colStart: 4, colSpan: 3, rowSpan: 4 },
        hasta: { colStart: 1, colSpan: 3, rowSpan: 4 },
      },
    ],
    panelesRetipados: [{ pestana: 'marca', tipo: 'kpi', metricId: METRICA, tipoAnterior: 'gauge' }],
    panelesConParametroCambiado: [{ pestana: 'marca', tipo: 'kpi', metricId: METRICA }],
  })

  it('las OCHO entradas salen añadido → quitado → cambiado → reordenado', () => {
    expect(cambios(lasOcho()).map((c) => `${c.glifo} ${c.rotulo}`)).toEqual([
      '+ PESTAÑA AÑADIDA',
      '+ AÑADIDO',
      '! PESTAÑA QUITADA',
      '! QUITADO',
      '~ MOVIDO',
      '~ RETIPADO',
      '~ PARÁMETRO',
      '~ PESTAÑAS REORDENADAS',
    ])
  })

  it('las ocho listas se leen y ninguna se pierde · una por una', () => {
    // El conteo de 8 rompe si un `for` se olvida; el reparto de glifos rompe si
    // se reasignan. Los dos compilan.
    const cs = cambios(lasOcho())
    expect(cs).toHaveLength(8)
    expect(cs.filter((c) => c.glifo === '+')).toHaveLength(2)
    expect(cs.filter((c) => c.glifo === '!')).toHaveLength(2)
    expect(cs.filter((c) => c.glifo === '~')).toHaveLength(4)
  })

  it('el cruce con el contador sigue cerrando con las ocho · 3 de las 4 `~` son de panel', () => {
    // La cuarta `~` es el reordenamiento, que el resumen no cuenta. Es el caso
    // que la prueba de arriba no podía mostrar, porque ahí `pestanasReordenadas`
    // venía vacía.
    const diff = lasOcho()
    const tildesDePanel = cambios(diff).filter((c) => c.glifo === '~' && c.metricId !== undefined)
    expect(tildesDePanel).toHaveLength(diff.contadores.panelesCambiados)
    expect(tildesDePanel).toHaveLength(3)
  })
})
