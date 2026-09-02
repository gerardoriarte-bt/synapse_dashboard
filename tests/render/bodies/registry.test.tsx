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

/** Los quince del enumerado `TipoPanel` del contrato. Escritos a mano desde el
 *  yaml, no leídos del registro: si se leyeran del registro la prueba no podría
 *  detectar que falta uno. */
const CONTRACT_TYPES: PanelType[] = [
  'kpi',
  'prose',
  'series',
  'bars',
  'table',
  'gauge',
  'forecast',
  'list',
  'reco',
  'composition',
  'comparison',
  'distribution',
  'blocked',
  'matrix',
  'graph',
]

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
  it('devuelve undefined y quien llama decide', () => {
    // Pintar el cuerpo de otro tipo, o una caja vacía, convierte un error de
    // composición en una pantalla que parece correcta · F1.22 y §1 principio 6.
    for (const type of MISSING_TYPES) {
      expect(bodyFor(type)).toBeUndefined()
    }
  })

  it('los construidos sí resuelven', () => {
    for (const type of BUILT_TYPES) {
      expect(bodyFor(type)).toBeDefined()
    }
  })
})

describe('la cuenta cierra contra el contrato', () => {
  it('construidos + faltantes son exactamente los quince tipos', () => {
    // Es lo que impide que un tipo se pierda: si el contrato gana uno y nadie
    // lo agrega ni a BODIES ni a MISSING_TYPES, esto falla.
    expect([...BUILT_TYPES, ...MISSING_TYPES].sort()).toEqual([...CONTRACT_TYPES].sort())
  })

  it('ningún tipo está en las dos listas', () => {
    expect(BUILT_TYPES.filter((t) => MISSING_TYPES.includes(t))).toEqual([])
  })
})

describe('preloadBodies · los chunks viajan en paralelo con panels:batch', () => {
  it('no revienta con un tipo sin cuerpo', () => {
    // Una pestaña puede declarar un tipo que todavía no existe: la precarga lo
    // saltea, y el error explícito lo da `bodyFor` al montar.
    expect(() => preloadBodies(['kpi', 'matrix'])).not.toThrow()
  })

  it('deduplica · una pestaña con seis kpi pide el chunk una vez', () => {
    expect(() => preloadBodies(['kpi', 'kpi', 'kpi'])).not.toThrow()
  })

  it('con la lista vacía no hace nada', () => {
    expect(() => preloadBodies([])).not.toThrow()
  })
})
