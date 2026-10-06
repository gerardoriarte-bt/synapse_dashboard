// @vitest-environment jsdom

/** El cliente de trabajo, compartido entre superficies · 2026-10-06
 *
 *  Pedido humano: «Debe ser lineal: una selección de tenant unifica todas las
 *  pantallas». Hasta ese día cada superficie caía a `lista[0]` —en QA, Keralty—
 *  aunque se viniera de trabajar sobre UA. Se prueban las cuatro reglas del hook
 *  desde lo que se pidió, no desde la implementación.
 */
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { ClienteDeTrabajoProvider } from '@/surfaces/ClienteDeTrabajoProvider'
import { useClienteDeTrabajo } from '@/surfaces/useClienteDeTrabajo'

const LISTA = [{ id: 'keralty' }, { id: 'ua' }, { id: 'terpel' }]
const conProvider = ({ children }: { children: ReactNode }) => (
  <ClienteDeTrabajoProvider>{children}</ClienteDeTrabajoProvider>
)

describe('el cliente de trabajo', () => {
  it('arranca en el cliente PROPIO, no en el primero de la lista', () => {
    const { result } = renderHook(() => useClienteDeTrabajo(LISTA, 'ua'), { wrapper: conProvider })
    expect(result.current[0]).toBe('ua')
  })

  it('si el propio no está en la lista, cae al primero', () => {
    const { result } = renderHook(() => useClienteDeTrabajo(LISTA, 'otro'), { wrapper: conProvider })
    expect(result.current[0]).toBe('keralty')
  })

  it('lo que elige UNA superficie lo ve la otra · es la misma elección', () => {
    // Dos hooks bajo el mismo provider: administración y builder.
    const { result } = renderHook(
      () => ({ admin: useClienteDeTrabajo(LISTA, 'ua'), builder: useClienteDeTrabajo(LISTA, 'ua') }),
      { wrapper: conProvider },
    )
    act(() => result.current.admin[1]('terpel'))
    expect(result.current.builder[0]).toBe('terpel')
  })

  it('una elección que ya no está en la lista se ignora', () => {
    const { result, rerender } = renderHook(
      ({ lista }: { lista: { id: string }[] }) => useClienteDeTrabajo(lista, 'ua'),
      { wrapper: conProvider, initialProps: { lista: LISTA } },
    )
    act(() => result.current[1]('terpel'))
    rerender({ lista: [{ id: 'keralty' }, { id: 'ua' }] })
    expect(result.current[0]).toBe('ua')
  })
})
