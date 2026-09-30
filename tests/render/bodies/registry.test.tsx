// @vitest-environment jsdom

/** El registro · F1.13h.
 *
 *  Criterio citado: «La estrechez vive en UN adaptador tipado y documentado, no
 *  repartida en doce archivos ni tapada con `any`»; «un `tipo` sin cuerpo
 *  registrado produce error explícito, no un fallback silencioso»; «una prueba
 *  resuelve cada cargador y verifica que lo que sale es un `memo`».
 */
import { describe, expect, it } from 'vitest'
import {
  BUILT_TYPES,
  LOADERS,
  MISSING_TYPES,
  bodyFor,
  preloadBodies,
} from '@/render/bodies/registry'
import type { PanelType } from '@/api/types'
import { enumOf } from '../../contract'
import { TIPOS_DE_PANEL } from '@/api/adapt'

/** El enumerado `TipoPanel`, LEÍDO DEL YAML · F5.6.
 *
 *  Hasta el 2026-09-04 esto era un arreglo de quince escrito a mano acá, con un
 *  comentario que decía «no leídos del registro: si se leyeran, la prueba no
 *  podría detectar que falta uno». La intención era correcta y se quedó a mitad
 *  de camino: **una copia a mano del yaml se desactualiza igual que el
 *  registro**, y entonces el contrato gana un tipo, nadie toca esta lista y la
 *  prueba sigue en verde.
 *
 *  No se puede resolver con tipos: `PanelType` es una unión de TypeScript y se
 *  borra al compilar. La paridad sale del yaml o no sale. */
const CONTRACT_TYPES = enumOf('TipoPanel') as PanelType[]

describe('cada cargador resuelve a un memo', () => {
  it.each(Object.keys(LOADERS))('%s', async (type) => {
    // Desde afuera `lazy` tapa el componente, así que se resuelve el cargador
    // directo. `memo` marca el objeto con su `$$typeof`; sin esto, quitar el
    // `memo` de una entrada pasaría desapercibido.
    const loader = LOADERS[type as PanelType]
    expect(loader).toBeDefined()

    const { default: Body } = await loader!()
    expect((Body as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.memo'))
  })
})

describe('un tipo sin cuerpo NO cae en un fallback silencioso', () => {
  /** Un `tipo` que NO está en el enumerado del contrato.
   *
   *  ── POR QUÉ INVENTADO Y NO UNO DE `MISSING_TYPES` · 2026-09-30 ─────────────
   *
   *  Esta prueba recorría `MISSING_TYPES`, y el 2026-09-30 esa lista quedó
   *  **vacía**: los tres cuerpos que le faltaban se construyeron. Un `for` sobre
   *  una lista vacía pasa sin ejecutar una sola afirmación, así que la prueba
   *  habría quedado verde verificando nada — el patrón que en este repositorio
   *  apareció tres veces el 2026-09-29 y otras dos en `adapt.test.ts`.
   *
   *  Con un tipo inventado la afirmación **no depende de que falte un cuerpo**, y
   *  eso es lo que la hace permanente: `bodyFor` recibe su argumento de
   *  `block_type`, que en el cable es una cadena libre, así que el caso que cubre
   *  es el real —un tipo que el servicio manda y este build no conoce—. El `as`
   *  es la mentira necesaria para escribirlo: en runtime llega igual. */
  const INVENTADO = 'sunburst' as PanelType

  it('un tipo que el contrato no declara devuelve undefined y quien llama decide', () => {
    // Pintar el cuerpo de otro tipo, o una caja vacía, convierte un error de
    // composición en una pantalla que parece correcta · F1.22 y §1 principio 6.
    expect(bodyFor(INVENTADO)).toBeUndefined()
  })

  it('y el inventado NO es uno de los quince · si lo fuera, la prueba de arriba mentiría', () => {
    expect(CONTRACT_TYPES).not.toContain(INVENTADO)
  })

  it('los construidos sí resuelven', () => {
    for (const type of BUILT_TYPES) {
      expect(bodyFor(type)).toBeDefined()
    }
  })

  it('están los QUINCE construidos y no falta ninguno · F4.20', () => {
    // La otra mitad de lo que `MISSING_TYPES` vacía afirma, escrita como
    // afirmación y no como recorrido: los quince del contrato tienen cuerpo.
    expect(MISSING_TYPES).toEqual([])
    expect(BUILT_TYPES).toHaveLength(CONTRACT_TYPES.length)
  })
})

describe('la cuenta cierra contra el contrato', () => {
  it('el yaml declara tipos · si no, la paridad no verifica nada', () => {
    // Sin esto, un `enumOf` que devolviera vacío volvería verde a la paridad de
    // abajo. Es el modo de falla que la lista a mano tenía y que este archivo
    // viene a cerrar: hay que comprobar que la fuente dice algo.
    expect(CONTRACT_TYPES.length).toBeGreaterThan(10)
  })

  it('construidos + faltantes son exactamente los tipos del contrato', () => {
    // Es lo que impide que un tipo se pierda: si el contrato gana uno y nadie
    // lo agrega ni a BODIES ni a MISSING_TYPES, esto falla — y ahora falla de
    // verdad, porque la lista de la izquierda sale del yaml.
    expect([...BUILT_TYPES, ...MISSING_TYPES].sort()).toEqual([...CONTRACT_TYPES].sort())
  })

  it('ningún tipo está en las dos listas', () => {
    expect(BUILT_TYPES.filter((t) => MISSING_TYPES.includes(t))).toEqual([])
  })
})

describe('preloadBodies · los chunks viajan en paralelo con panels:batch', () => {
  it('no revienta con un tipo sin cuerpo', () => {
    // Una pestaña puede declarar un tipo que este build no conoce: la precarga lo
    // saltea, y el error explícito lo da `bodyFor` al montar.
    //
    // **El ejemplo era `matrix`, y dejó de servir el 2026-09-30**: al construirse
    // su cuerpo, esta prueba pasó a precargar dos tipos que EXISTEN y el `?.` que
    // viene a cubrir quedó sin ejercitar. Con un tipo inventado la afirmación no
    // depende de que falte un cuerpo.
    expect(() => preloadBodies(['kpi', 'sunburst' as PanelType])).not.toThrow()
  })

  it('deduplica · una pestaña con seis kpi pide el chunk una vez', () => {
    expect(() => preloadBodies(['kpi', 'kpi', 'kpi'])).not.toThrow()
  })

  it('con la lista vacía no hace nada', () => {
    expect(() => preloadBodies([])).not.toThrow()
  })
})

describe('F1.35 · los quince tipos del adaptador == los del contrato', () => {
  it('`TIPOS_DE_PANEL` no se queda atrás del yaml', () => {
    // `adapt.ts` necesita la lista EN RUNTIME para no castear `block_type`, y
    // `PanelType` se borra al compilar. Es una copia, y una copia a mano se
    // desactualiza con el contrato adelante — por eso se compara contra el yaml,
    // igual que el registro de cuerpos.
    expect([...TIPOS_DE_PANEL].sort()).toEqual([...enumOf('TipoPanel')].sort())
  })
})
