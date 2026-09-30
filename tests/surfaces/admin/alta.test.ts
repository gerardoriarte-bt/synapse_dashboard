/** El estado de alta y la versión del catálogo · §PEN:A2 · F5.20
 *
 *  **La derivación se prueba sin montar nada**, que es la razón de que viva en un
 *  módulo aparte. Y las cuatro aserciones están elegidas por lo que MATAN, no por
 *  cubrir las ramas: cada una tiene escrito arriba qué mutación sobrevive sin
 *  ella. Es la lección de A5 y A3 dos veces — la mutación encontró que ninguna
 *  prueba tocaba el adaptador porque las de pantalla construían el tipo a mano.
 *
 *  Los números NO son inventados: salen de medir `GET /admin/tenants/{id}/catalog`
 *  el 2026-09-30 contra el servicio local. El cliente `e65f81ae-…` tiene 21
 *  métricas con tres versiones —1, 3 y 4— y el `1111…` tiene 12, todas en 1. Esa
 *  asimetría es exactamente lo que hace falta acá, y está explicada abajo.
 */
import { describe, expect, it } from 'vitest'
import { estadoDeAlta, versionDeCatalogo } from '@/surfaces/admin/alta'

/** Una métrica reducida a lo único que esta derivación lee. */
const m = (catalogVersion: number) => ({ catalogVersion })

describe('versionDeCatalogo · la reducción, y el vacío que no es cero', () => {
  it('sin métricas devuelve null, no 0 ni -Infinity', () => {
    // **Mata dos mutaciones de un tiro**, y las dos compilan:
    //  · `Math.max(...[])` sin el guardia devuelve `-Infinity`, que pasa
    //    cualquier `!== null` y pinta «v-Infinity»;
    //  · un `?? 0` devuelve 0, que pinta «v0» — una versión que no existe.
    // Es la misma distinción que A5 paga dos veces: `null` es «nunca» y `0` es
    // «recién».
    expect(versionDeCatalogo([])).toBeNull()
  })

  it('devuelve el MÁXIMO, no la primera fila', () => {
    // **Ésta es la aserción que la tarea necesitaba y el dato obvio no daba.**
    // Con las 12 filas del primer cliente —todas en 1— leer `metricas[0]` da
    // exactamente lo mismo que el máximo, así que la mutación sobrevive. Los
    // tres valores de acá son los del segundo cliente, y con ellos `[0]`
    // devolvería 1 donde va 4.
    //
    // Y el máximo no es una elección nuestra: es la definición del servicio. Su
    // sincronización arranca leyendo la versión más alta, y `GET /config/me` de
    // ese mismo cliente contesta 4, que es el máximo de sus 21 filas.
    expect(versionDeCatalogo([m(1), m(4), m(3)])).toBe(4)
  })

  it('con una sola métrica devuelve la suya', () => {
    expect(versionDeCatalogo([m(2)])).toBe(2)
  })
})

describe('estadoDeAlta · las dos condiciones, y son DOS', () => {
  it('sin roles y sin métricas está EN ALTA', () => {
    expect(estadoDeAlta({ roles: [], metricas: [] })).toBe('EN_ALTA')
  })

  it('con un rol y sin métricas NO está en alta', () => {
    // Alguien ya definió quién entra: el cliente arrancó aunque no tenga dato.
    expect(estadoDeAlta({ roles: ['admin'], metricas: [] })).toBe('EN_SERVICIO')
  })

  it('sin roles pero con catálogo NO está en alta', () => {
    // **Las tres juntas, y no sólo la primera.** Con una sola aserción un `||`
    // en lugar del `&&` pasa en verde: `roles.length === 0 || version === null`
    // también devuelve `'EN_ALTA'` para el caso de arriba. Las dos mitades
    // negativas son las que fijan el operador.
    expect(estadoDeAlta({ roles: [], metricas: [m(1)] })).toBe('EN_SERVICIO')
  })
})

describe('el campo `status` NO se lee · decisión del 2026-09-30', () => {
  it('un cliente suspendido sin roles ni métricas sigue dando EN ALTA', () => {
    /** **Esta prueba existe para fallar algún día, y eso es el punto.**
     *
     *  Hoy `status` llega vacío en los dos clientes sembrados —por decisión
     *  escrita del servicio, no por una foto— y el estado se deriva. El día que
     *  el campo traiga valores, alguien va a «arreglar» la derivación leyéndolo
     *  y esta prueba se va a poner roja: ahí la decisión se reabre con una
     *  conversación, en vez de cambiar en silencio.
     *
     *  **Va por variable y no como literal** porque el chequeo de propiedades en
     *  exceso rechazaría el literal — que es justo lo que se quiere demostrar:
     *  la firma no declara `status`, así que nadie lo puede estar leyendo. */
    const suspendido = { roles: [], metricas: [], status: 'SUSPENDIDO' }

    expect(estadoDeAlta(suspendido)).toBe('EN_ALTA')
  })
})
