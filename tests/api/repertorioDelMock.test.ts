/** El repertorio que sirve `dev:mock` pasa por el adaptador REAL
 *
 *  ── LA PRUEBA QUE NO EXISTÍA, Y EL DEFECTO QUE ESCONDÍA ────────────────────
 *
 *  `dev/mocks/browser.ts` sirve `repertorio.json` en `GET /config/plots`, y
 *  hasta el 2026-10-01 ese archivo era **la tabla con sus claves en español**
 *  —`nombre`, `formas`, `soporta_banda`— mientras `adaptPlots` lee las del
 *  cable —`name`, `shapes`, `supports_band`—.
 *
 *  **En `dev:mock` el builder reventaba**: `Cannot read properties of undefined
 *  (reading 'map')`, sobre `p.shapes`.
 *
 *  **Lo encontró el backend**, preguntando «la forma exacta de la respuesta que
 *  el builder espera» para escribir la ruta. No lo encontró ninguna prueba, y no
 *  podía: las de MSW construyen su propio payload, y las del adaptador también.
 *  **Nadie hacía pasar el archivo del mock por el adaptador** — que es
 *  exactamente la frontera que un mock puede esconder, la familia de F1.38.
 *
 *  Por eso esta prueba no afirma campos: importa el ARCHIVO que el mock sirve y
 *  lo adapta. Si el generador vuelve a emitir otra forma, falla acá.
 */
import { describe, expect, it } from 'vitest'
import repertorio from '../../dev/mocks/repertorio.json'
import { adaptPlots } from '@/api/adapt'
import type { WirePlot } from '@/api/adapt'

describe('dev/mocks/repertorio.json · lo que sirve `GET /config/plots`', () => {
  const filas = repertorio as unknown as WirePlot[]

  it('el adaptador lo entiende ENTERO · ninguna entrada se descarta', () => {
    // `adaptPlots` descarta en silencio la fila cuya forma no conoce —`continue`
    // sin aviso—, así que «adapta algo» no alcanza: se exige el conteo.
    const adaptadas = adaptPlots(filas)
    expect(filas).toHaveLength(49)
    expect(adaptadas).toHaveLength(49)
  })

  it('y las claves son las del CABLE, no las de la tabla', () => {
    // La aserción que nombra el defecto. Con las españolas el `.map` de arriba
    // tira `TypeError` y esta prueba dice cuál era la diferencia.
    const primera = filas[0] as unknown as Record<string, unknown>
    expect(Object.keys(primera)).toEqual(
      expect.arrayContaining(['id', 'name', 'shapes', 'supports_band', 'minimums']),
    )
    expect(primera).not.toHaveProperty('nombre')
    expect(primera).not.toHaveProperty('formas')
  })

  it('`cap` se OMITE cuando no hay tope · no viaja en `null`', () => {
    // Igual que el Go, con `json:"cap,omitempty"`. Un `null` explícito obligaría
    // al adaptador a distinguir dos ausencias que significan lo mismo.
    const conTope = filas.filter((p) => 'cap' in p)
    expect(conTope.length).toBeGreaterThan(0)
    expect(conTope.length).toBeLessThan(filas.length)
    for (const p of filas) {
      if ('cap' in p) expect(p.cap).not.toBeNull()
    }
  })
})
