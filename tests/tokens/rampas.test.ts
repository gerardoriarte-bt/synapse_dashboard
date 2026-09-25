/** Ninguna familia se queda sin color · 2026-09-25
 *
 *  **El defecto que cierra.** `gen-tokens.py` emitía
 *  `export type FamilyStep = 0 | 1 | 2 | 3 | 4` **escrito a mano**, y el `.pen`
 *  no le da cinco escalones a todas: `externo` tiene **dos**. El tipo prometía
 *  cinco para cualquier familia, así que `hue({ family: 'externo', step: 2 })`
 *  compilaba y pedía `var(--color-fam-externo-2)`.
 *
 *  **Y una variable que no existe no falla: se pinta sin color.** Es el mismo
 *  silencio que `text-labell`, que este repositorio ya tiene registrado y que
 *  `escala.test.ts` cubre para la escala tipográfica. Esto es su par para las
 *  rampas de datos.
 *
 *  **Alcanzable, aunque hoy no ocurra.** El catálogo de UA MX no tiene métricas
 *  de familia externa, pero el contrato admite `external` —está en `FAMILIAS`
 *  del adaptador— y `PlotComposition` reparte `i % MAX_PARTS` sobre la familia
 *  que le toque, sea cual sea. Producto lo dijo el 2026-09-25: la intención es
 *  que la plataforma sirva a cualquier cliente, no sólo a éste.
 *
 *  Encontrado abriendo el tema claro por primera vez, buscando otra cosa.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FAMILY_STEPS, familyVar } from '@/tokens/tokens'

/** Lo que el CSS declara de verdad, contado del archivo generado. */
function pasosDeclarados(): Map<string, Set<number>> {
  const css = readFileSync('src/tokens/tokens.css', 'utf-8')
  const out = new Map<string, Set<number>>()
  for (const m of css.matchAll(/--color-fam-([a-z]+)-(\d+)\s*:/g)) {
    const familia = m[1] as string
    if (!out.has(familia)) out.set(familia, new Set())
    out.get(familia)?.add(Number(m[2]))
  }
  return out
}

describe('`FAMILY_STEPS` dice la verdad sobre el CSS', () => {
  it('cada familia declara exactamente los escalones que dice tener', () => {
    const real = pasosDeclarados()

    expect([...real.keys()].sort()).toEqual(Object.keys(FAMILY_STEPS).sort())
    for (const [familia, n] of Object.entries(FAMILY_STEPS)) {
      // `0..n-1`, sin huecos: una rampa con el 3 y sin el 2 pintaría un hueco.
      expect([...(real.get(familia) ?? [])].sort((a, b) => a - b)).toEqual(
        Array.from({ length: n }, (_, i) => i),
      )
    }
  })

  it('las familias NO tienen todas el mismo largo · es el hecho que se ignoraba', () => {
    // Si algún día el `.pen` las empareja, esta prueba falla y hay que releer
    // si el ajuste de `familyVar` sigue haciendo falta. Falla por de más, que
    // es el lado correcto.
    const largos = new Set(Object.values(FAMILY_STEPS))
    expect(largos.size).toBeGreaterThan(1)
  })
})

describe('`familyVar` nunca nombra una variable que no existe', () => {
  it('para toda familia y todo escalón que el tipo admite', () => {
    const real = pasosDeclarados()

    for (const familia of Object.keys(FAMILY_STEPS)) {
      for (const step of [0, 1, 2, 3, 4] as const) {
        const v = familyVar(familia, step)
        const m = /--color-fam-([a-z]+)-(\d+)\)/.exec(v)
        expect(m).not.toBeNull()
        // **La aserción es que el número pedido EXISTE en el CSS**, no que la
        // cadena tenga buena pinta: `var(--color-fam-externo-2)` se ve
        // perfectamente bien y no pinta nada.
        expect(real.get(m?.[1] ?? '')?.has(Number(m?.[2]))).toBe(true)
      }
    }
  })

  it('y el escalón principal sigue siendo el 1 donde la familia lo tiene', () => {
    // El ajuste no puede cambiar el trazo principal de las familias largas: el
    // 1 es el que el diseño declara como principal.
    expect(familyVar('demanda')).toBe('var(--color-fam-demanda-1)')
    expect(familyVar('medios', 3)).toBe('var(--color-fam-medios-3)')
    // Y en la corta, el 2 vuelve al 0 en vez de nombrar lo que no hay.
    expect(familyVar('externo', 2)).toBe('var(--color-fam-externo-0)')
  })
})
