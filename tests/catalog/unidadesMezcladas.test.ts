/** Unidades distintas en un multiserie · F5.25, 2026-10-19 · ver `catalog/plots.ts`. */
import { describe, expect, it } from 'vitest'
import { unidadesMezcladas } from '@/catalog/plots'
import type { Value } from '@/catalog/types'

const serie = (etiqueta: string, unidad?: string) => ({
  etiqueta,
  ...(unidad === undefined ? {} : { unidad }),
  puntos: [{ t: '2026-10-01', v: 1 }],
})
const multi = (...series: ReturnType<typeof serie>[]) => ({ forma: 'seriesMultiples', series }) as unknown as Value

describe('unidadesMezcladas', () => {
  it('dos series con unidades distintas sugieren «combo»', () => {
    expect(unidadesMezcladas(multi(serie('Inversión', 'USD'), serie('ROAS', 'x')))).toEqual({ unidades: ['USD', 'x'], sugerido: 'combo' })
  })
  it('tres sugieren «smallmult» · combo dibuja sólo las dos primeras', () => {
    expect(unidadesMezcladas(multi(serie('Inversión', 'USD'), serie('Ventas', 'USD'), serie('ROAS', 'x')))?.sugerido).toBe('smallmult')
  })
  it('una sola unidad no avisa', () => {
    expect(unidadesMezcladas(multi(serie('Inversión', 'USD'), serie('Ventas', 'USD')))).toBeNull()
  })
  it('una serie sin unidad no cuenta · no se inventa una', () => {
    expect(unidadesMezcladas(multi(serie('Sesiones'), serie('Ventas', 'USD')))).toBeNull()
  })
  it('otra forma no aplica', () => {
    expect(unidadesMezcladas({ forma: 'escalar', v: 1 } as unknown as Value)).toBeNull()
  })
})
