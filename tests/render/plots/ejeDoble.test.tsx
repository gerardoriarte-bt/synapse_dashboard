// @vitest-environment jsdom

/** El eje doble del combinado · decisión humana del 2026-11-24
 *
 *  `docs/DECISIONES-2026-11-24-semaforos-y-eje-doble.md` §2: **exactamente dos
 *  series de unidades distintas, declaradas en el cable**; cada eje con su
 *  unidad escrita, y cada serie asociada a su eje por posición y por rótulo.
 *  Con tres o más series, o con una sola unidad, nada cambia.
 *
 *  Se monta por `SeriesBody` y no por el plot, porque **quien decide cuándo hay
 *  dos ejes es el cuerpo**: una prueba del plot con `ejes` pasado a mano no
 *  vería que el cuerpo lo pase con tres series.
 *
 *  §PEN:Plot/COMBINADO · Dos ejes: visitas y conversión
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeriesBody } from '@/render/bodies/SeriesBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const MESES = ['abr', 'may', 'jun', 'jul', 'ago', 'sep']
const serie = (etiqueta: string, vs: readonly number[], unidad?: string) => ({
  etiqueta,
  ...(unidad === undefined ? {} : { unidad }),
  puntos: MESES.map((t, i) => ({ t, v: vs[i] ?? 0 })),
})

const VISITAS = [410_000, 433_000, 456_000, 479_000, 502_000, 525_000]
const CVR = [1.6, 1.4, 1.9, 2.1, 1.8, 2.3]

function montar(series: ReturnType<typeof serie>[]) {
  const value = { forma: 'seriesMultiples', series } as Extract<Value, { forma: 'seriesMultiples' }>
  return render(
    <SeriesBody
      value={value}
      params={{}}
      span={{ colStart: 1, colSpan: 7, rowSpan: 4 }}
      family="demanda"
      grafico="combo"
      metric="Visitas y conversión"
      format={createFormat('es-MX')}
    />,
  )
}

const eje = (c: HTMLElement, lado: 'izquierdo' | 'derecho') => c.querySelector(`[data-eje="${lado}"]`)
const rotulo = (c: HTMLElement, lado: 'izquierdo' | 'derecho') =>
  c.querySelector(`[data-rotulo-de-eje="${lado}"]`)?.textContent
const numeros = (g: Element | null) => Array.from(g?.querySelectorAll('text') ?? []).map((t) => t.textContent)

describe('dos series de unidades distintas · dos ejes, cada uno con su unidad', () => {
  it('cada eje lleva su serie y su unidad escritas, del lado que le toca', () => {
    const { container } = montar([serie('Visitas', VISITAS, 'sesiones'), serie('CVR', CVR, '%')])
    // Por rótulo: la serie y la unidad. `AxisText` pasa a mayúsculas.
    expect(rotulo(container, 'izquierdo')).toBe('VISITAS · SESIONES')
    expect(rotulo(container, 'derecho')).toBe('CVR · %')
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'Combinado con dos ejes · Visitas en columnas, eje izquierdo en sesiones · CVR en línea, eje derecho en %',
    )
  })

  it('cada eje tiene la ESCALA de su serie · la conversión no se lee en cientos de miles', () => {
    const { container } = montar([serie('Visitas', VISITAS, 'sesiones'), serie('CVR', CVR, '%')])
    const izquierdo = numeros(eje(container, 'izquierdo'))
    const derecho = numeros(eje(container, 'derecho'))
    expect(izquierdo.at(-1)).toMatch(/K$/)
    // El techo de la conversión es de un dígito: el eje derecho es SU escala.
    expect(derecho.length).toBeGreaterThan(1)
    for (const t of derecho) expect(Number(t)).toBeLessThan(10)
  })

  it('por posición · el eje derecho se escribe a la derecha del área, el izquierdo a la izquierda', () => {
    const { container } = montar([serie('Visitas', VISITAS, 'sesiones'), serie('CVR', CVR, '%')])
    const xs = (lado: 'izquierdo' | 'derecho') =>
      Array.from(eje(container, lado)?.querySelectorAll('text') ?? []).map((t) => ({
        x: Number(t.getAttribute('x')),
        ancla: t.getAttribute('text-anchor'),
      }))
    const izq = xs('izquierdo')
    const der = xs('derecho')
    expect(der.every((d) => d.ancla === 'start')).toBe(true)
    expect(izq.every((d) => d.ancla === 'end')).toBe(true)
    expect(Math.min(...der.map((d) => d.x))).toBeGreaterThan(Math.max(...izq.map((d) => d.x)))
  })
})

describe('fuera de ese caso, el combinado de siempre', () => {
  it('con tres series no hay segundo eje, aunque las unidades difieran', () => {
    const { container } = montar([
      serie('Visitas', VISITAS, 'sesiones'),
      serie('CVR', CVR, '%'),
      serie('Ventas', VISITAS, 'USD'),
    ])
    expect(eje(container, 'derecho')).toBeNull()
    expect(container.querySelector('[data-rotulo-de-eje]')).toBeNull()
  })

  it('con la misma unidad en las dos no hay segundo eje', () => {
    const { container } = montar([serie('Inversión', VISITAS, 'USD'), serie('Ventas', VISITAS, 'USD')])
    expect(eje(container, 'derecho')).toBeNull()
  })

  it('con una sola unidad declarada tampoco · la otra no se inventa', () => {
    const { container } = montar([serie('Visitas', VISITAS, 'sesiones'), serie('CVR', CVR)])
    expect(eje(container, 'derecho')).toBeNull()
  })

  it('sin unidades, el DOM entero es el de antes', () => {
    // **Tomada con el código de `origin/main`**, antes del eje doble: se
    // copiaron esos archivos encima, se corrió con `-u` y se restauraron.
    const { container } = montar([serie('Visitas', VISITAS), serie('CVR', CVR)])
    expect(container.innerHTML).toMatchInlineSnapshot(`"<div class="h-full min-h-0"><div class="w-full h-full min-h-0"><svg width="600" height="300" role="img" aria-label="Combinado · Visitas en columnas y CVR en línea"><g transform="translate(36.8,8)"><g aria-hidden="true"><line x1="0" x2="531.44" y1="272" y2="272" stroke="var(--color-c-grid)" stroke-width="1"></line><line x1="0" x2="531.44" y1="181.33333333333334" y2="181.33333333333334" stroke="var(--color-c-grid)" stroke-width="1"></line><line x1="0" x2="531.44" y1="90.66666666666669" y2="90.66666666666669" stroke="var(--color-c-grid)" stroke-width="1"></line><line x1="0" x2="531.44" y1="0" y2="0" stroke="var(--color-c-grid)" stroke-width="1"></line></g><g fill-opacity="0.7"><g><rect x="17.71466666666667" y="86.13333333333333" width="53.144" height="185.86666666666667" rx="2" fill="var(--color-fam-demanda-2)"></rect><rect x="106.28800000000001" y="75.70666666666665" width="53.144" height="196.29333333333335" rx="2" fill="var(--color-fam-demanda-2)"></rect><rect x="194.86133333333333" y="65.28" width="53.144" height="206.72" rx="2" fill="var(--color-fam-demanda-2)"></rect><rect x="283.4346666666667" y="54.853333333333325" width="53.144" height="217.14666666666668" rx="2" fill="var(--color-fam-demanda-2)"></rect><rect x="372.00800000000004" y="44.42666666666668" width="53.144" height="227.57333333333332" rx="2" fill="var(--color-fam-demanda-2)"></rect><rect x="460.58133333333336" y="34" width="53.144" height="238" rx="2" fill="var(--color-fam-demanda-2)"></rect></g></g><path d="M44.28666666666667,97.91999999999999 L132.86,119.68 L221.43333333333334,65.28 L310.00666666666666,43.51999999999998 L398.58000000000004,76.16 L487.15333333333336,21.76000000000002" fill="none" stroke="var(--color-fam-demanda-1)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"></path><g><circle cx="44.28666666666667" cy="97.91999999999999" r="3.5" fill="var(--color-fam-demanda-1)" fill-opacity="1"></circle><circle cx="132.86" cy="119.68" r="3.5" fill="var(--color-fam-demanda-1)" fill-opacity="1"></circle><circle cx="221.43333333333334" cy="65.28" r="3.5" fill="var(--color-fam-demanda-1)" fill-opacity="1"></circle><circle cx="310.00666666666666" cy="43.51999999999998" r="3.5" fill="var(--color-fam-demanda-1)" fill-opacity="1"></circle><circle cx="398.58000000000004" cy="76.16" r="3.5" fill="var(--color-fam-demanda-1)" fill-opacity="1"></circle><circle cx="487.15333333333336" cy="21.76000000000002" r="3.5" fill="var(--color-fam-demanda-1)" fill-opacity="1"></circle></g><text x="495.15333333333336" y="10.76000000000002" text-anchor="start" dominant-baseline="middle" style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; fill: var(--color-dim);">CVR</text><text x="495.15333333333336" y="21.76000000000002" text-anchor="start" dominant-baseline="middle" style="font-family: var(--font-mono); font-size: var(--text-cifra); fill: var(--color-ink);">2.3</text><g aria-hidden="true"><text x="44.28666666666667" y="284" text-anchor="middle" dominant-baseline="middle" style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; fill: var(--color-dim);">ABR</text><text x="310.0066666666667" y="284" text-anchor="middle" dominant-baseline="middle" style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; fill: var(--color-dim);">JUL</text><text x="487.15333333333336" y="284" text-anchor="middle" dominant-baseline="middle" style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; fill: var(--color-dim);">SEP</text></g></g><g transform="translate(0,8)"><g aria-hidden="true"><text x="30.799999999999997" y="272" text-anchor="end" dominant-baseline="middle" style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; fill: var(--color-dim);">0</text><text x="30.799999999999997" y="181.33333333333334" text-anchor="end" dominant-baseline="middle" style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; fill: var(--color-dim);">200K</text><text x="30.799999999999997" y="90.66666666666669" text-anchor="end" dominant-baseline="middle" style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; fill: var(--color-dim);">400K</text><text x="30.799999999999997" y="0" text-anchor="end" dominant-baseline="middle" style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; fill: var(--color-dim);">600K</text></g></g></svg></div></div>"`)
  })
})
