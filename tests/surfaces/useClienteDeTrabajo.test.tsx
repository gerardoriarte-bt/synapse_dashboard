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

  /** **La carrera del arranque** · 2026-10-07. Mientras `/config/me` no
   *  contestó, el propio no se sabe, y el hook caía a `lista[0]`: cada pantalla
   *  de administración pedía un instante los datos del primer cliente —se vio
   *  en la red, `runs?tenant_id=1111…` y después el propio— y una selección
   *  hecha en ese instante se perdía al cambiar. `undefined` es «todavía no
   *  sé»; `null` es «no tiene». */
  it('mientras el propio NO SE SABE, no elige ninguno · no cae al primero', () => {
    const { result } = renderHook(() => useClienteDeTrabajo(LISTA, undefined), { wrapper: conProvider })
    expect(result.current[0]).toBeNull()
  })

  it('y cuando llega, arranca en el propio sin haber pasado por otro', () => {
    const vistos: (string | null)[] = []
    const { rerender } = renderHook(
      ({ propio }: { propio: string | null | undefined }) => {
        const [activo] = useClienteDeTrabajo(LISTA, propio)
        vistos.push(activo)
        return activo
      },
      { wrapper: conProvider, initialProps: { propio: undefined as string | null | undefined } },
    )
    rerender({ propio: 'ua' })
    expect(vistos).not.toContain('keralty')
    expect(vistos.at(-1)).toBe('ua')
  })

  it('sin cliente propio —`null`, ya sabido— sí cae al primero', () => {
    const { result } = renderHook(() => useClienteDeTrabajo(LISTA, null), { wrapper: conProvider })
    expect(result.current[0]).toBe('keralty')
  })

  it('una elección ya hecha manda aunque el propio todavía no se sepa', () => {
    const { result } = renderHook(() => useClienteDeTrabajo(LISTA, undefined), { wrapper: conProvider })
    act(() => result.current[1]('terpel'))
    expect(result.current[0]).toBe('terpel')
  })
})
