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
import type { Presentation, Value } from '@/api/types'

const format = createFormat('es-MX')
const span = { colStart: 1, colSpan: 4, rowSpan: 4 }
const value = { forma: 'escalar', v: 4280000 } as Value as Extract<Value, { forma: 'escalar' }>

/** **Los datos van en `presentation`, los interruptores en `params`** · F1.40.
 *
 *  Hasta hoy este helper metía el rótulo, el medidor y los comparativos en
 *  `params`, y por eso las pruebas pasaban con `KpiBody` leyendo del layout — la
 *  prueba fijaba el defecto en vez de encontrarlo. El contrato declara esos tres
 *  en el payload: «viajan con el dato y no con el layout porque dependen del
 *  período». */
function montar(
  presentation?: Presentation,
  opts: { unit?: string; params?: Parameters<typeof KpiBody>[0]['params'] } = {},
) {
  return render(
    <KpiBody
      value={value}
      params={opts.params ?? {}}
      span={span}
      family="inventario"
      metric="Ventas"
      format={format}
      {...(presentation === undefined ? {} : { presentation })}
      {...(opts.unit === undefined ? {} : { unit: opts.unit })}
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
    montar({ label: 'Total' }, { unit: 'USD' })
    expect(screen.getByText('USD 4.28M')).toBeInTheDocument()
  })

  it('NO va en la cifra cuando el label ya la nombra', () => {
    // El `.pen` escribe «USD · TOTAL» arriba y «4.28M» abajo, y no por gusto: a
    // 44px «USD 4.28M» no entra en un panel de colSpan 3.
    montar({ label: 'USD · Total' }, { unit: 'USD' })
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

describe('F1.40 · los rótulos vienen del PAYLOAD, no del layout', () => {
  // El defecto que esto cierra: `BodyProps.presentation` estaba declarada desde
  // el port y nadie la pasaba, así que `KpiBody` leía del layout. Con el
  // servicio real el payload trae la presentación completa —medidor al 61%, dos
  // comparativos, el label «USD · TOTAL»— y la pantalla mostraba la cifra sola.

  it('un `params` con forma de datos ya NO puede pintar nada', () => {
    // La mitad que importa: si el rótulo volviera a leerse del layout, esto
    // pintaría «VENTAS» y la regresión pasaría sin que nadie se entere.
    // `as never` porque el tipo ya lo prohíbe — la prueba verifica el runtime.
    montar(undefined, { params: { label: 'VENTAS' } as never })
    expect(screen.queryByText('VENTAS')).toBeNull()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('el medidor y los comparativos del payload se pintan', () => {
    const { container } = montar({
      label: 'USD · TOTAL',
      medidor: { label: 'PESO DE PERFORMANCE', porcentaje: 61, nota: 'USD 2.61M DE USD 4.28M' },
      comparativo: [{ label: 'VS MES ANTERIOR', delta: 6.4 }],
    })

    expect(screen.getByText('USD · TOTAL')).toBeInTheDocument()
    expect(screen.getByText('PESO DE PERFORMANCE')).toBeInTheDocument()
    expect(container.textContent).toContain('61%')
    expect(screen.getByText('USD 2.61M DE USD 4.28M')).toBeInTheDocument()
    expect(screen.getByText('VS MES ANTERIOR')).toBeInTheDocument()
  })

  it('el mismo layout con otro payload cambia el medidor · la garantía de §5', () => {
    // Es la razón por la que `Presentacion` existe: «el medidor marca 61% este
    // mes y otra cosa el siguiente». Con los rótulos en el layout, cambiar de
    // período dejaba el medidor congelado hasta republicar.
    const julio = montar({ medidor: { label: 'AVANCE', porcentaje: 61 } })
    expect(julio.container.textContent).toContain('61%')
    julio.unmount()

    const agosto = montar({ medidor: { label: 'AVANCE', porcentaje: 74 } })
    expect(agosto.container.textContent).toContain('74%')
    expect(agosto.container.textContent).not.toContain('61%')
  })

  it('el interruptor del layout apaga lo que el payload trae', () => {
    // `opciones` son interruptores de composición: un `false` explícito oculta.
    // Ausente muestra — el interruptor dice «acá va», no «inventá uno».
    const { container } = montar(
      { medidor: { label: 'AVANCE', porcentaje: 61 }, comparativo: [{ label: 'VS JUN', delta: 6.4 }] },
      { params: { medidor: false, comparativo: false } },
    )
    expect(container.textContent).not.toContain('61%')
    expect(screen.queryByText('VS JUN')).toBeNull()
  })

  it('con el interruptor en `true` y sin dato no se inventa nada', () => {
    const { container } = montar(undefined, { params: { medidor: true, comparativo: true } })
    expect(container.textContent).not.toContain('%')
  })
})
