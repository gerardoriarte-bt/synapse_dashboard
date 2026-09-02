// @vitest-environment jsdom

/** El presupuesto de render · F1.13j.
 *
 *  Criterio citado: «Mide desde que llega la config de la pestaña hasta el
 *  commit y hasta el pintado» y «no se activa en producción salvo bajo un flag».
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BUDGET_MS, markTabConfig, measureLayoutCommit, measureLayoutPainted } from '@/render/budget'

beforeEach(() => {
  performance.clearMarks()
  performance.clearMeasures()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('el techo es el que declara §8', () => {
  it('son 100 ms', () => {
    expect(BUDGET_MS).toBe(100)
  })
})

describe('el reloj arranca con la config de la pestaña', () => {
  it('marca al recibirla', () => {
    markTabConfig()
    expect(performance.getEntriesByName('synapse:tabs-received', 'mark')).toHaveLength(1)
  })

  it('un cambio de pestaña limpia lo anterior · no se acumulan marcas', () => {
    // Sin limpiar, `measure` mediría contra la primera marca de la sesión y el
    // número crecería toda la tarde.
    markTabConfig()
    markTabConfig()
    expect(performance.getEntriesByName('synapse:tabs-received', 'mark')).toHaveLength(1)
  })
})

describe('sin marca no hay medida', () => {
  it('medir el commit antes de marcar no produce nada', () => {
    // Es el caso real: el primer render ocurre antes de que llegue /config/tabs.
    measureLayoutCommit()
    expect(performance.getEntriesByName('synapse:layout-commit', 'measure')).toHaveLength(0)
  })

  it('y no llama al callback', () => {
    const onMeasure = vi.fn()
    measureLayoutCommit(onMeasure)
    expect(onMeasure).not.toHaveBeenCalled()
  })
})

describe('con marca, mide el commit', () => {
  it('emite la medida y avisa con los milisegundos', () => {
    const onMeasure = vi.fn()
    markTabConfig()
    measureLayoutCommit(onMeasure)

    expect(performance.getEntriesByName('synapse:layout-commit', 'measure')).toHaveLength(1)
    expect(onMeasure).toHaveBeenCalledTimes(1)
    expect(typeof onMeasure.mock.calls[0]?.[0]).toBe('number')
  })
})

describe('el pintado necesita DOS frames', () => {
  it('mide recién en el segundo rAF', async () => {
    // El primer rAF corre ANTES del pintado del frame en curso; el segundo,
    // después. Medir en el primero excluiría el trabajo que interesa.
    const onMeasure = vi.fn()
    markTabConfig()
    measureLayoutPainted(onMeasure)

    expect(onMeasure).not.toHaveBeenCalled()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise((r) => setTimeout(r, 0))

    expect(onMeasure).toHaveBeenCalledTimes(1)
  })

  it('un tab oculto NO agenda nada · no hay nada que pintar', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    const rAF = vi.spyOn(globalThis, 'requestAnimationFrame')

    markTabConfig()
    measureLayoutPainted()

    // Sin esto la medida quedaría agendada para siempre en una pestaña de fondo.
    expect(rAF).not.toHaveBeenCalled()
  })
})
