// @vitest-environment jsdom

/** El semáforo por umbral · decisión humana del 2026-11-24
 *
 *  `docs/DECISIONES-2026-11-24-semaforos-y-eje-doble.md` §1. Las aserciones se
 *  escriben leyendo la decisión, no el código:
 *
 *  - tres estados, y el que toca depende del corte **y de la dirección**;
 *  - el estado se ESCRIBE junto al color, siempre;
 *  - sin umbrales, el panel se dibuja exactamente como antes;
 *  - los deltas siguen neutros · §ANCLA:DELTA-1.
 *
 *  **Todos sus modos de falla se ven bien.** Un semáforo con la dirección dada
 *  vuelta pinta de verde un CPA que se disparó, y la pantalla se ve tan
 *  prolija como con la dirección correcta.
 */
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GaugeBody } from '@/render/bodies/GaugeBody'
import { KpiBody } from '@/render/bodies/KpiBody'
import { createFormat } from '@/render/format'
import { estadoPorUmbral, textoDeEstado } from '@/render/semaforo'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const escalar = (v: number) => ({ forma: 'escalar', v }) as Extract<Value, { forma: 'escalar' }>

const cuerpo = {
  span: { colStart: 1, colSpan: 4, rowSpan: 4 },
  family: 'demanda',
  metric: 'ROAS',
  format,
} as const

/** Más alto es mejor: bien desde 3, mal por debajo de 2. */
const ROAS = { bien: 3, mal: 2 }
/** Más bajo es mejor: bien hasta 20, mal por encima de 40 · un CPA. */
const CPA = { bien: 20, mal: 40 }

/** El arco del valor · el último trazo: el riel se dibuja antes. */
const arco = (c: HTMLElement) => Array.from(c.querySelectorAll('svg path')).at(-1)
const estado = (c: HTMLElement) => c.querySelector('[data-estado]')

describe('el estado sale del corte Y de la dirección', () => {
  it('más alto es mejor · bien desde el corte, mal por debajo del otro', () => {
    expect(estadoPorUmbral(3.4, ROAS)).toBe('bien')
    expect(estadoPorUmbral(3, ROAS)).toBe('bien')
    expect(estadoPorUmbral(2.5, ROAS)).toBe('aceptable')
    expect(estadoPorUmbral(2, ROAS)).toBe('aceptable')
    expect(estadoPorUmbral(1.9, ROAS)).toBe('mal')
  })

  it('más bajo es mejor · la MISMA cifra cae del otro lado', () => {
    // Es la prueba que mata la dirección dada vuelta: un CPA de 45 es malo, y
    // con la regla de «más alto es mejor» saldría bien.
    expect(estadoPorUmbral(12, CPA)).toBe('bien')
    expect(estadoPorUmbral(20, CPA)).toBe('bien')
    expect(estadoPorUmbral(30, CPA)).toBe('aceptable')
    expect(estadoPorUmbral(40, CPA)).toBe('aceptable')
    expect(estadoPorUmbral(45, CPA)).toBe('mal')
  })

  it('el texto dice el corte que decide, con el signo de la dirección', () => {
    const cifra = (v: number) => `${String(v)}x`
    expect(textoDeEstado('bien', ROAS, cifra)).toBe('Bien · ≥ 3x')
    expect(textoDeEstado('mal', ROAS, cifra)).toBe('Mal · < 2x')
    expect(textoDeEstado('aceptable', ROAS, cifra)).toBe('Aceptable · entre 2x y 3x')
    expect(textoDeEstado('bien', CPA, cifra)).toBe('Bien · ≤ 20x')
    expect(textoDeEstado('mal', CPA, cifra)).toBe('Mal · > 40x')
    expect(textoDeEstado('aceptable', CPA, cifra)).toBe('Aceptable · entre 20x y 40x')
  })
})

describe('el medidor pinta su estado, y lo escribe', () => {
  it.each([
    [3.4, 'bien', 'var(--color-estado-bien)', 'Bien · ≥ 3x'],
    [2.5, 'aceptable', 'var(--color-dim)', 'Aceptable · entre 2x y 3x'],
    [1.2, 'mal', 'var(--color-estado-mal)', 'Mal · < 2x'],
  ])('ROAS %s → %s', (v, nombre, tono, texto) => {
    const { container } = render(
      <GaugeBody {...cuerpo} unit="x" value={escalar(v)} params={{ maximo: 5, umbrales: ROAS }} />,
    )
    expect(arco(container)?.getAttribute('fill')).toBe(tono)
    // **El color nunca va solo**: el estado está escrito, y es el mismo.
    const rotulo = estado(container) as HTMLElement
    expect(rotulo.getAttribute('data-estado')).toBe(nombre)
    expect(rotulo.textContent).toBe(texto)
  })

  it('con más bajo es mejor, un CPA alto es MAL aunque el arco esté casi lleno', () => {
    const { container } = render(
      <GaugeBody {...cuerpo} value={escalar(45)} params={{ maximo: 50, umbrales: CPA }} />,
    )
    expect(arco(container)?.getAttribute('fill')).toBe('var(--color-estado-mal)')
    expect(estado(container)?.textContent).toBe('Mal · > 40')
  })

  it('el texto del estado va en el color del estado · y aceptable en el gris', () => {
    const { container } = render(
      <GaugeBody {...cuerpo} value={escalar(3.4)} params={{ maximo: 5, umbrales: ROAS }} />,
    )
    const texto = within(estado(container) as HTMLElement).getByText(/^Bien/)
    expect(texto.className).toContain('text-estado-bien')

    const otro = render(<GaugeBody {...cuerpo} value={escalar(2.5)} params={{ maximo: 5, umbrales: ROAS }} />)
    expect(within(estado(otro.container) as HTMLElement).getByText(/^Aceptable/).className).toContain('text-dim')
  })

  it('el bullet pinta la barra de medida · el objetivo y las franjas no cambian', () => {
    const { container } = render(
      <GaugeBody {...cuerpo} grafico="bullet" value={escalar(1.2)} params={{ maximo: 5, umbrales: ROAS }} />,
    )
    const [franja, interior, medida] = Array.from(container.querySelectorAll('svg rect'))
    expect(medida?.getAttribute('fill')).toBe('var(--color-estado-mal)')
    expect(franja?.getAttribute('fill')).toBe('var(--color-w1)')
    expect(interior?.getAttribute('fill')).toBe('var(--color-w1)')
    expect(container.querySelector('svg line')?.getAttribute('stroke')).toBe('var(--color-ink)')
    expect(estado(container)?.textContent).toBe('Mal · < 2')
  })

  it('los anillos NO llevan semáforo · la decisión nombra medidor, bullet y kpi', () => {
    const { container } = render(
      <GaugeBody {...cuerpo} grafico="rings" value={escalar(1.2)} params={{ maximo: 5, umbrales: ROAS }} />,
    )
    expect(estado(container)).toBeNull()
    expect(container.innerHTML).not.toContain('estado-')
  })
})

describe('la kpi pinta la cifra, nunca los comparativos', () => {
  const presentation = {
    label: 'ROAS',
    comparativo: [
      { label: 'vs mes anterior', delta: 12.4 },
      { label: 'vs año anterior', delta: -8.1 },
    ],
  }

  it('la cifra toma el color del estado, y el estado se escribe debajo', () => {
    render(
      <KpiBody {...cuerpo} value={escalar(1.4)} presentation={presentation} params={{ umbrales: ROAS }} />,
    )
    expect(screen.getByText('1.4').className).toContain('text-estado-mal')
    expect(screen.getByText('Mal · < 2')).toBeInTheDocument()
  })

  it('aceptable deja la cifra en la tinta de siempre', () => {
    render(
      <KpiBody {...cuerpo} value={escalar(2.5)} presentation={presentation} params={{ umbrales: ROAS }} />,
    )
    expect(screen.getByText('2.5').className).toContain('text-ink')
    expect(screen.getByText('Aceptable · entre 2 y 3')).toBeInTheDocument()
  })

  it('§ANCLA:DELTA-1 · los deltas siguen neutros con el semáforo encendido', () => {
    // La regla 7 de `design.md` vale entera para «VS MES ANTERIOR»: es
    // dirección, no juicio. Un delta que sube y uno que baja, con la cifra en
    // BIEN y en MAL: ninguno de los dos toma color.
    for (const v of [3.4, 1.4]) {
      const { container, unmount } = render(
        <KpiBody {...cuerpo} value={escalar(v)} presentation={presentation} params={{ umbrales: ROAS }} />,
      )
      for (const delta of [/12\.4%$/, /8\.1%$/]) {
        const el = within(container).getByText(delta)
        expect(el.className).toContain('text-dim')
        expect(el.className).not.toMatch(/estado-/)
        expect(el.closest('[data-estado]')).toBeNull()
      }
      unmount()
    }
  })
})

describe('sin umbrales, igual que antes · el DOM entero', () => {
  // **Las tres instantáneas se tomaron con el código de `origin/main`**, antes
  // del semáforo —se copiaron esos archivos encima, se corrió con `-u` y se
  // restauraron—, así que no fijan lo que el código nuevo hace: fijan lo que el
  // viejo hacía, y el nuevo tiene que hacer lo mismo.
  it('el medidor', () => {
    const { container } = render(<GaugeBody {...cuerpo} unit="x" value={escalar(3.4)} params={{ maximo: 5 }} />)
    expect(container.innerHTML).toMatchInlineSnapshot(`"<div class="h-full min-h-0 flex flex-col gap-2"><div class="w-full h-full min-h-0"><svg width="600" height="300" role="img" aria-label="3.4 de 5"><path d="M196.76240994676408,253.23759005323595 A146,146 0 1 1 403.2375900532361,253.2375900532358 L384.65482384365356,234.6548238436534 A119.72,119.72 0 1 0 215.34517615634655,234.65482384365347 Z" fill="var(--color-w2)"></path><g><path d="M196.76240994676408,253.23759005323595 A146,146 0 1 1 409.516216166047,53.448467662746765 L389.80329725615854,70.82774348345235 A119.72,119.72 0 1 0 215.34517615634655,234.65482384365347 Z" fill="var(--color-fam-demanda-1)"></path></g><text x="300" y="150" text-anchor="middle" dominant-baseline="central" style="font-family: var(--font-body); font-weight: 700; font-size: 70.08px; fill: var(--color-ink);">3.4</text></svg></div><span class="font-mono text-label leading-rotulo tracking-rotulo uppercase text-dim m-0">Sobre 5</span></div>"`)
  })

  it('el bullet', () => {
    const { container } = render(
      <GaugeBody {...cuerpo} grafico="bullet" value={escalar(3.4)} params={{ maximo: 5 }} />,
    )
    expect(container.innerHTML).toMatchInlineSnapshot(`"<div class="h-full min-h-0 flex flex-col gap-2"><div class="w-full h-full min-h-0"><svg width="600" height="300" role="img" aria-label="Avance contra objetivo · 3.4 de 5"><rect x="0" y="139" width="521.7391304347826" height="22" rx="2" fill="var(--color-w1)"></rect><rect x="0" y="139" width="417.3913043478261" height="22" rx="2" fill="var(--color-w1)"></rect><rect x="0" y="144" width="354.78260869565213" height="12" rx="2" fill="var(--color-fam-demanda-1)"></rect><line x1="521.7391304347826" x2="521.7391304347826" y1="136" y2="164" stroke="var(--color-ink)" stroke-width="2.4" stroke-linecap="round"></line></svg></div><span class="font-mono text-label leading-rotulo tracking-rotulo uppercase text-dim m-0">Sobre 5</span></div>"`)
  })

  it('la kpi, con sus comparativos', () => {
    const { container } = render(
      <KpiBody
        {...cuerpo}
        value={escalar(3.4)}
        params={{}}
        presentation={{ label: 'ROAS', comparativo: [{ label: 'vs mes anterior', delta: 12.4 }] }}
      />,
    )
    expect(container.innerHTML).toMatchInlineSnapshot(`"<div class="flex flex-col gap-4 h-full min-h-0"><div class="flex flex-col gap-1 min-w-0"><span class="font-mono text-label leading-rotulo tracking-rotulo uppercase text-dim m-0">ROAS</span><span class="block tabular-nums font-body font-bold text-kpi leading-kpi tracking-kpi text-ink">3.4</span></div><div class="flex flex-col gap-1 mt-auto"><div class="flex items-baseline justify-between gap-2"><span class="font-mono text-label leading-rotulo tracking-rotulo uppercase text-dim m-0">vs mes anterior</span><span class="font-mono text-label leading-rotulo tracking-rotulo uppercase text-dim m-0">+12.4%</span></div></div></div>"`)
  })
})
