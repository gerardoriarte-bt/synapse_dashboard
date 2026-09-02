// @vitest-environment jsdom

/** `KpiBody` · F1.13g.
 *
 *  Reglas citadas: «Ningún número desnudo: todo valor lleva label» (regla dura
 *  4) y «Deltas en color neutro. El signo comunica dirección; prohibido
 *  verde/rojo semántico» (regla dura 3).
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KpiBody } from '@/render/bodies/KpiBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const span = { colStart: 1, colSpan: 4, rowSpan: 4 }
const value = { forma: 'escalar', v: 4280000 } as Value as Extract<Value, { forma: 'escalar' }>

function montar(params: Parameters<typeof KpiBody>[0]['params'], unit?: string) {
  return render(
    <KpiBody
      value={value}
      params={params}
      span={span}
      family="inventario"
      metric="Ventas"
      format={format}
      {...(unit === undefined ? {} : { unit })}
    />,
  )
}

describe('regla dura 4 · la cifra nunca va sin label', () => {
  it('pinta la cifra abreviada con su label', () => {
    montar({})
    expect(screen.getByText('4.28M')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('la cifra la formatea el formateador INYECTADO, no el componente', () => {
    render(
      <KpiBody
        value={value}
        params={{}}
        span={span}
        family="inventario"
        metric="Ventas"
        format={createFormat('de-DE')}
      />,
    )
    // Con locale alemán la abreviatura usa coma decimal. Si el cuerpo importara
    // el formateador, esto daría «4.28M» y la inyección sería decorativa.
    expect(screen.getByText('4,28M')).toBeInTheDocument()
  })
})

describe('la unidad no se escribe dos veces', () => {
  it('va pegada a la cifra cuando el label no la lleva', () => {
    montar({ label: 'Total' }, 'USD')
    expect(screen.getByText('USD 4.28M')).toBeInTheDocument()
  })

  it('NO va en la cifra cuando el label ya la nombra', () => {
    // El `.pen` escribe «USD · TOTAL» arriba y «4.28M» abajo, y no por gusto: a
    // 44px «USD 4.28M» no entra en un panel de colSpan 3.
    montar({ label: 'USD · Total' }, 'USD')
    expect(screen.getByText('4.28M')).toBeInTheDocument()
    expect(screen.queryByText('USD 4.28M')).toBeNull()
  })
})

describe('regla dura 3 · el signo comunica dirección, el color no', () => {
  it('el delta lleva signo', () => {
    montar({ comparativo: [{ label: 'vs. mes anterior', delta: -14.2 }] })
    expect(screen.getByText('−14.2%')).toBeInTheDocument()
  })

  it('ningún delta lleva clase de color verde ni rojo', () => {
    const { container } = montar({
      comparativo: [
        { label: 'sube', delta: 6.4 },
        { label: 'baja', delta: -6.4 },
      ],
    })
    // La prohibición es de color SEMÁNTICO. Se verifica sobre el marcado, que
    // es donde viviría: una clase, un estilo en línea o una familia.
    expect(container.innerHTML).not.toMatch(/green|red|emerald|rose|#0f0|#f00/i)

    const subeYBaja = [screen.getByText('+6.4%'), screen.getByText('−6.4%')]
    expect(subeYBaja[0]?.className).toBe(subeYBaja[1]?.className)
  })
})

describe('el medidor', () => {
  it('se llena hasta el porcentaje y por encima de 100 no se desborda', () => {
    const { container } = montar({ medidor: { label: 'Avance', porcentaje: 137 } })
    const relleno = container.querySelector('[style*="width"]') as HTMLElement | null
    expect(relleno?.style.width).toBe('100%')
    // El exceso lo dice la cifra, no la barra.
    expect(screen.getByText('137%')).toBeInTheDocument()
  })

  it('un porcentaje negativo no dibuja una barra al revés', () => {
    const { container } = montar({ medidor: { label: 'Avance', porcentaje: -20 } })
    const relleno = container.querySelector('[style*="width"]') as HTMLElement | null
    expect(relleno?.style.width).toBe('0%')
  })

  it('el color sale de la FAMILIA del catálogo, no de una paleta del componente', () => {
    const { container } = montar({ medidor: { label: 'Avance', porcentaje: 50 } })
    expect(container.innerHTML).toContain('--color-fam-inventario-1')
  })
})
