// @vitest-environment jsdom

/** El «ahora» de una pantalla · 2026-11-25 · `surfaces/useNow.ts`
 *
 *  Nació para sacar `new Date()` del render, que `oxlint` 1.93 marca. Lo que se
 *  fija acá son las dos mitades del cambio: **un repintado no mueve la hora**
 *  —eso era lo impuro— y **el reloj sí la mueve**, con la pantalla quieta,
 *  que es lo que antes dependía de que algo repintara.
 */
import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INTERVALO_DEL_RELOJ_MS, useNow } from '@/surfaces/useNow'
import { ThreadRail } from '@/surfaces/console/ThreadRail'
import { createFormat } from '@/render/format'

const MONTAJE = new Date('2026-09-04T15:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(MONTAJE)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useNow', () => {
  it('arranca en el instante del montaje', () => {
    const { result } = renderHook(() => useNow())
    expect(result.current.getTime()).toBe(MONTAJE.getTime())
  })

  it('un repintado NO mueve la hora · leerla en el render era lo impuro', () => {
    const { result, rerender } = renderHook(() => useNow())
    vi.setSystemTime(new Date(MONTAJE.getTime() + 2 * 3_600_000))
    rerender()
    expect(result.current.getTime()).toBe(MONTAJE.getTime())
  })

  it('el reloj SÍ la mueve, con la pantalla quieta', () => {
    const { result } = renderHook(() => useNow())
    act(() => vi.advanceTimersByTime(INTERVALO_DEL_RELOJ_MS))
    expect(result.current.getTime()).toBe(MONTAJE.getTime() + INTERVALO_DEL_RELOJ_MS)
  })

  it('al desmontar no deja un reloj corriendo', () => {
    const { unmount } = renderHook(() => useNow())
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('el riel de hilos usa ese reloj', () => {
  it('pasada la medianoche, la marca de hoy pasa a ser una fecha · sin repintar', () => {
    // **Huso del navegador a propósito**: la marca del riel es presentación, y
    // `threadStamp` compara días locales. Por eso la hora se arma local.
    const nueveDeLaManana = new Date(2026, 8, 4, 9, 0)
    vi.setSystemTime(new Date(2026, 8, 4, 23, 59, 30))
    render(
      <ThreadRail
        format={createFormat('es-MX')}
        onSelect={() => {}}
        groups={[
          {
            label: 'Hoy',
            threads: [
              {
                id: 'h-1',
                titulo: 'Por qué subió el ROAS',
                creadoEn: nueveDeLaManana.toISOString(),
                actualizadoEn: nueveDeLaManana.toISOString(),
                esDecision: false,
              },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: /ROAS/ })).toHaveTextContent('09:00')

    act(() => vi.advanceTimersByTime(INTERVALO_DEL_RELOJ_MS))

    const fila = screen.getByRole('button', { name: /ROAS/ })
    expect(fila).not.toHaveTextContent('09:00')
    expect(fila.textContent).toMatch(/4 SEP/)
  })
})
