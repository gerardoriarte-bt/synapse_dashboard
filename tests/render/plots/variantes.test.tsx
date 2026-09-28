// @vitest-environment jsdom

/** Las variantes de gráfico · `grafico` · 2026-09-28
 *
 *  **Lo que se verifica es que el layout ELIJA el dibujo**, no que los
 *  componentes existan. Un plot que se monta y otro que no se ven distinto sólo
 *  si la prueba mira cuál se montó — y el idioma del spread condicional deja
 *  compilar una prop mal nombrada, así que «llega la prop» no es afirmable por
 *  el compilador.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ForecastBody } from '@/render/bodies/ForecastBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const base = {
  span: { colStart: 1, colSpan: 5, rowSpan: 4 },
  family: 'demanda',
  metric: 'Conversión del sitio',
  format,
} as const

/** Los límites son CONSTANTES, que es lo que distingue una carta de control de
 *  un pronóstico: acá `lo` y `hi` no se mueven. El del medio se sale. */
const conBanda = (puntos: readonly { t: string; v: number }[]) =>
  ({
    forma: 'serieConBanda',
    nivel: 0.95,
    puntos: puntos.map((p) => ({ ...p, lo: 1.22, hi: 1.44 })),
  }) as unknown as Extract<Value, { forma: 'serieConBanda' }>

const SERIE = conBanda([
  { t: 'D1', v: 1.3 },
  { t: 'D2', v: 1.52 },
  { t: 'D3', v: 1.28 },
])

const ESCALAR = {
  forma: 'escalarConIntervalo',
  v: 384,
  lo: 351,
  hi: 417,
  nivel: 0.95,
} as unknown as Extract<Value, { forma: 'escalarConIntervalo' }>

describe('ausente significa «el de siempre» · el campo es aditivo', () => {
  it('sin `grafico`, una serie con banda sigue siendo el pronóstico', () => {
    // Es lo que hacen los doce paneles publicados, que no declaran nada. Si
    // esto fallara, agregar el campo habría obligado a migrar cada layout.
    render(<ForecastBody {...base} value={SERIE} params={{}} />)

    expect(screen.getByRole('img', { name: /Pronóstico/ })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /banda de control/ })).toBeNull()
  })

  it('sin `grafico`, un escalar con intervalo NO dibuja la barra', () => {
    const { container } = render(<ForecastBody {...base} value={ESCALAR} params={{}} />)

    expect(screen.queryByRole('img', { name: /Rango de la estimación/ })).toBeNull()
    // Y el intervalo sigue estando, porque es regla dura y no depende del dibujo.
    expect(container.textContent).toContain('351')
    expect(container.textContent).toContain('417')
  })
})

describe('`grafico` elige el dibujo', () => {
  it('`control` monta la carta de control y NO el pronóstico', () => {
    render(<ForecastBody {...base} value={SERIE} params={{}} grafico="control" />)

    expect(screen.getByRole('img', { name: /banda de control/ })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Pronóstico/ })).toBeNull()
  })

  it('`interval` agrega la barra SIN quitar el texto del intervalo', () => {
    // **Las dos cosas a la vez, y es la regla dura 6.** Si la barra reemplazara
    // al texto, un panel angosto o un build sin el plot dejaría la cifra
    // desnuda — que es exactamente lo que la regla prohíbe.
    const { container } = render(
      <ForecastBody {...base} value={ESCALAR} params={{}} grafico="interval" />,
    )

    expect(screen.getByRole('img', { name: /Rango de la estimación/ })).toBeInTheDocument()
    expect(container.textContent).toContain('351')
    expect(container.textContent).toContain('417')
  })
})

describe('la carta de control existe para marcar lo que se SALE', () => {
  it('marca el punto fuera de límite y sólo ése', () => {
    // Sin esto la carta es una serie con un rectángulo de fondo: el dibujo del
    // `.pen` pone el punto de 10×10 justamente sobre la violación.
    const { container } = render(<ForecastBody {...base} value={SERIE} params={{}} grafico="control" />)

    expect(container.querySelectorAll('circle')).toHaveLength(1)
    expect(screen.getByRole('img', { name: /1 fuera de límite/ })).toBeInTheDocument()
  })

  it('un valor que TOCA el límite está DENTRO', () => {
    // El `>` y el `<` son estrictos, y es lo que «límite» significa. Con `>=`
    // un proceso que roza su límite se reportaría fuera de control todo el mes.
    const tocando = conBanda([
      { t: 'D1', v: 1.44 },
      { t: 'D2', v: 1.22 },
    ])
    const { container } = render(
      <ForecastBody {...base} value={tocando} params={{}} grafico="control" />,
    )

    expect(container.querySelectorAll('circle')).toHaveLength(0)
    expect(screen.getByRole('img', { name: /0 fuera de límite/ })).toBeInTheDocument()
  })
})

describe('un gráfico que el cuerpo no dibuja SE DECLARA · no se sustituye', () => {
  it('uno de otra forma no cae al de por defecto', () => {
    // **El modo de falla que esto previene**: una cascada dibujada como dona se
    // ve perfecta y miente. Misma familia que `presentation` y que el spread.
    render(<ForecastBody {...base} value={SERIE} params={{}} grafico="waterfall" />)

    expect(screen.getByText(/waterfall/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /Pronóstico/ })).toBeNull()
  })

  it('uno válido para la OTRA forma también se declara', () => {
    // `control` es legítimo en el repertorio y sirve a `serieConBanda`; sobre un
    // escalar no tiene serie que dibujar. La comprobación es por FORMA, no por
    // cuerpo — y este cuerpo hospeda dos formas, así que la distinción importa.
    const { container } = render(
      <ForecastBody {...base} value={ESCALAR} params={{}} grafico="control" />,
    )

    expect(screen.getByText(/control/)).toBeVisible()
    expect(container.textContent).not.toContain('351')
  })
})
