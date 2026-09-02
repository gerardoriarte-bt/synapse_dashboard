// @vitest-environment jsdom

/** `useSize` · F1.13a.
 *
 *  §8 lo pide explícito: «un ResizeObserver por canvas, no uno por plot». Es la
 *  aserción central de este archivo, y la que no se puede escribir mirando el
 *  hook: hay que contar instancias.
 */
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { _resetObserver, useSize } from '@/render/plots/core/useSize'

function Probe() {
  const { ref, w, h } = useSize()
  return (
    <div ref={ref} data-testid="box">
      {w}×{h}
    </div>
  )
}

afterEach(() => {
  _resetObserver()
  vi.unstubAllGlobals()
})

describe('§8 · un observer por canvas, no uno por plot', () => {
  it('ocho plots comparten UN solo ResizeObserver', () => {
    // Ocho observers son ocho suscripciones al mismo ciclo de layout del
    // navegador. La diferencia no se nota con seis plots y sí con cuarenta y
    // cinco, que es a donde va esto.
    let instancias = 0
    const observados: Element[] = []

    _resetObserver()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor() {
          instancias++
        }
        observe(target: Element) {
          observados.push(target)
        }
        unobserve() {}
        disconnect() {}
      },
    )

    render(
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <Probe key={i} />
        ))}
      </>,
    )

    expect(instancias).toBe(1)
    expect(observados).toHaveLength(8)
  })
})

describe('sin ResizeObserver el plot no dibuja, pero no revienta', () => {
  it('devuelve 0×0 en vez de tirar', () => {
    _resetObserver()
    vi.stubGlobal('ResizeObserver', undefined)

    const { getByTestId } = render(<Probe />)
    expect(getByTestId('box').textContent).toBe('0×0')
  })
})

describe('mide el contenedor', () => {
  it('reporta el tamaño que informa el observer', () => {
    // El doble de `tests/setup.ts` avisa en el acto con 600×300.
    const { getByTestId } = render(<Probe />)
    expect(getByTestId('box').textContent).toBe('600×300')
  })

  it('deja de observar al desmontar · un nodo muerto en el observer es una fuga', () => {
    let desobservados = 0
    _resetObserver()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {
          desobservados++
        }
        disconnect() {}
      },
    )

    render(<Probe />).unmount()
    expect(desobservados).toBe(1)
  })
})
