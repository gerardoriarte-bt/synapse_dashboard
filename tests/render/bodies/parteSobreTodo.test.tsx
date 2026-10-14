// @vitest-environment jsdom

/** `donut` y `treemap` sobre una COMPOSICIÓN · 2026-10-01
 *
 *  ── POR QUÉ SE MUDARON, Y ES EL HALLAZGO QUE LO ORIGINÓ ─────────────────────
 *
 *  Los dos estaban en `BarsBody`, sobre `categorica`. **Con dato real la dona
 *  escribía `461,1` en el centro de `Cumplimiento de objetivo`**: sus cinco
 *  valores son porcentajes de METAS DISTINTAS —visitas 103,8%, órdenes 85,8%— y
 *  un gráfico de parte-sobre-todo los suma y después calcula la cuota de cada
 *  uno sobre esa suma. «VISITAS 23%» no era su cumplimiento: era cuánto aportaba
 *  a un total que no significa nada.
 *
 *  **Aritméticamente coherente y semánticamente falso**, que es el peor modo de
 *  falla de este producto.
 *
 *  **El contrato ya distinguía las dos formas**, y la distinción es exactamente
 *  ésta: `composicion` ES un todo repartido —trae su `porcentaje` calculado por
 *  el servicio, con su razón escrita— y `categorica` es etiqueta y valor.
 *
 *  Acá se verifica la mitad positiva: que sobre una composición los dos dibujen,
 *  y que el cuerpo no pierda nada al cambiar de gráfico. La negativa —que sobre
 *  una categórica NO se sirvan— vive en `graficoCableado.test.tsx`.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CompositionBody } from '@/render/bodies/CompositionBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const base = {
  span: { colStart: 1, colSpan: 5, rowSpan: 4 },
  family: 'inventario',
  metric: 'Unidades',
  format,
} as const

const valor = <F extends Value['forma']>(v: unknown) => v as unknown as Extract<Value, { forma: F }>

/** Dos partes que suman 42, con su `porcentaje` como lo manda el servicio. */
const DOS = valor<'composicion'>({
  forma: 'composicion',
  partes: [
    { etiqueta: 'Norte', v: 30, porcentaje: 71.4 },
    { etiqueta: 'Sur', v: 12, porcentaje: 28.6 },
  ],
})

/** Seis partes · con `VISIBLE = 4` sobran dos, que SÍ se agrupan. */
const SEIS = valor<'composicion'>({
  forma: 'composicion',
  partes: [
    { etiqueta: 'A', v: 50, porcentaje: 50 },
    { etiqueta: 'B', v: 20, porcentaje: 20 },
    { etiqueta: 'C', v: 15, porcentaje: 15 },
    { etiqueta: 'D', v: 8, porcentaje: 8 },
    { etiqueta: 'E', v: 5, porcentaje: 5 },
    { etiqueta: 'F', v: 2, porcentaje: 2 },
  ],
})

/** Cinco partes · sobra UNA, que **no** se agrupa. */
const CINCO = valor<'composicion'>({
  forma: 'composicion',
  partes: [
    { etiqueta: 'A', v: 50, porcentaje: 50 },
    { etiqueta: 'B', v: 20, porcentaje: 20 },
    { etiqueta: 'C', v: 15, porcentaje: 15 },
    { etiqueta: 'D', v: 8, porcentaje: 8 },
    { etiqueta: 'Inversión', v: 7, porcentaje: 7 },
  ],
})

describe('los dos dibujan, y sobre el total de verdad', () => {
  it('`donut` monta la DONA y su rótulo de centro sale del catálogo', () => {
    // El `totalLabel` es obligatorio en `PlotDonut` —«ningún número desnudo»
    // como error de compilación— y el cuerpo NO lo escribe: cae al nombre de la
    // métrica, que es copy del catálogo.
    render(<CompositionBody {...base} value={DOS} params={{}} grafico="donut" />)

    expect(screen.getByRole('img', { name: 'UNIDADES 42 repartido en 2 partes' })).toBeVisible()
  })

  it('el rótulo del centro lo gana `presentation.label`, que lo redacta el backend', () => {
    render(
      <CompositionBody
        {...base}
        value={DOS}
        params={{}}
        grafico="donut"
        presentation={{ label: 'Inversión del mes' } as never}
      />,
    )

    expect(
      screen.getByRole('img', { name: 'INVERSIÓN DEL MES 42 repartido en 2 partes' }),
    ).toBeVisible()
  })

  it('`treemap` monta el MOSAICO, no el apilado', () => {
    render(<CompositionBody {...base} value={DOS} params={{}} grafico="treemap" />)

    expect(screen.getByRole('img', { name: /mosaico/i })).toBeVisible()
    expect(screen.queryByRole('img', { name: /partes/ })).toBeNull()
  })

  it('y el TOTAL REPARTIDO no se pierde al cambiar de gráfico', () => {
    // §6 pide que este tipo declare el total repartido, y eso es del CUERPO y no
    // del dibujo. Sin esta línea, elegir la dona perdería la cifra de la que se
    // reparte — y el apilado la tiene.
    for (const id of ['donut', 'treemap', 'stacked100'] as const) {
      const { unmount } = render(
        <CompositionBody {...base} value={DOS} params={{}} grafico={id} />,
      )
      expect(screen.getByText(/Total repartido/i)).toBeVisible()
      unmount()
    }
  })
})

describe('«Otros» agrupa desde DOS · agrupar uno sólo esconde su nombre', () => {
  it('con una sola parte sobrante se muestran las cinco', () => {
    // **Visto en pantalla**: la leyenda decía `OTROS · 1`, y ese uno era
    // INVERSIÓN. Agrupar uno no ahorra un escalón de rampa ni una línea de
    // leyenda; lo único que hace es borrar el nombre.
    render(<CompositionBody {...base} value={CINCO} params={{}} />)

    // El rótulo de la parte se recorta dentro del SVG según el ancho, así que
    // la aserción va sobre lo que NO puede recortarse: que no exista un «Otros»
    // y que la pantalla no anuncie un agrupado que no hizo.
    expect(screen.queryByText(/Otros/)).toBeNull()
    expect(screen.queryByText(/partes agrupadas/)).toBeNull()
  })

  it('con dos o más sí se agrupan, y se dice cuántas', () => {
    render(<CompositionBody {...base} value={SEIS} params={{}} />)
    expect(screen.getByText(/2 partes agrupadas/)).toBeVisible()
  })

  it('la dona tampoco agrupa UNA sola · es la SEGUNDA agrupación de la cadena', () => {
    // ── POR QUÉ SE MIRA EL RÓTULO Y NO EL CONTEO ────────────────────────────
    //
    // **`PlotDonut` agrupa por su cuenta**, además del cuerpo — lo encontró una
    // mutación que sobrevivió: arreglar el agrupado del cuerpo no movía la dona.
    //
    // Y el CONTEO no distingue los dos mundos: con cinco partes y cuatro
    // visibles, agrupar la sobrante da «4 + Otros» = cinco porciones, y no
    // agruparla da cinco también. Lo único que cambia es **cómo se llama la
    // quinta**, y eso es justamente lo que el defecto borraba.
    // Los rótulos de la leyenda van en MAYÚSCULA, igual que en `dona.test.tsx`.
    const { container } = render(
      <CompositionBody {...base} value={CINCO} params={{}} grafico="donut" />,
    )

    expect(container.textContent).not.toContain('OTROS')
    expect(container.textContent).toContain('INVERSIÓN')
  })

  it('y con dos sobrantes sí agrupa, y lo nombra', () => {
    const { container } = render(
      <CompositionBody {...base} value={SEIS} params={{}} grafico="donut" />,
    )

    expect(container.textContent).toContain('OTROS · 2')
  })
})
