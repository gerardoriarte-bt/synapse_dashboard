// @vitest-environment jsdom

/** El panel · F1.13e.
 *
 *  Regla citada de `CLAUDE.md` y §5.2 de `parametros-front.md`:
 *  «**Un estado reemplaza el cuerpo, nunca el shell.** Título, BASE y
 *  procedencia siguen visibles mientras el panel carga, falla o está bloqueado.»
 *
 *  Esa frase es la aserción: se recorren los SIETE estados y en los siete se
 *  exige que la cabecera siga ahí. Escrita mirando el código, esta prueba
 *  verificaría que `Panel` llama a `PanelShell` — que es cierto por
 *  construcción y no demuestra nada.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Panel } from '@/render/Panel/Panel'
import { createFormat } from '@/render/format'
import type { Metric, Payload, Value } from '@/api/types'

const format = createFormat('es-MX')
const now = new Date('2026-09-02T12:00:00Z')

const metric = {
  id: 'm-1',
  key: 'inv_riesgo',
  nombre: 'Venta diaria en riesgo',
  forma: 'escalar',
  familia: 'inventario',
  capa: 'SILVER',
  fuente: 'ERP',
  ventana: 'Últimos 30 días',
  base: '312 SKU críticos',
  estado: 'DISPONIBLE',
  direccionSemantica: null,
  catalogVersion: 1,
} as Metric

const placement = { colStart: 1, colSpan: 4, rowSpan: 4 }
const scalar = { forma: 'escalar', v: 4200 } as Value

const conCifra = {
  estado: 'DISPONIBLE',
  valor: scalar,
  base: '48 tiendas sobre 52',
  capa: 'GOLD',
  fuente: 'Snowflake',
  frescura: '2026-09-02T08:00:00Z',
  catalogVersion: 1,
} as unknown as Payload

/** Los siete estados que el panel tiene que saber pintar. */
const ESTADOS: Array<[string, Payload]> = [
  ['CARGANDO', { estado: 'CARGANDO' }],
  ['DISPONIBLE', conCifra],
  ['DEGRADADO', { ...conCifra, estado: 'DEGRADADO' } as Payload],
  [
    'VACIO',
    {
      estado: 'DISPONIBLE',
      valor: { forma: 'serieTemporal', puntos: [] },
      base: 'x',
      capa: 'GOLD',
      fuente: 'Snowflake',
      frescura: '2026-09-02T08:00:00Z',
      catalogVersion: 1,
    } as unknown as Payload,
  ],
  [
    'BLOQUEADO',
    {
      estado: 'BLOQUEADO',
      razon: 'El feed de inventario no corrió hoy.',
      desbloqueaCon: 'Corrida del ETL de inventario',
    } as unknown as Payload,
  ],
  ['SIN_PERMISO', { estado: 'SIN_PERMISO', solicitarA: 'Dirección comercial' } as unknown as Payload],
  ['ERROR', { estado: 'ERROR', mensaje: 'Fallo al resolver la métrica.' } as unknown as Payload],
]

function montar(payload: Payload) {
  return render(
    <Panel metric={metric} payload={payload} placement={placement} format={format} now={now}>
      <p>EL CUERPO</p>
    </Panel>,
  )
}

describe('§5.2 · un estado reemplaza el cuerpo, nunca el shell', () => {
  it.each(ESTADOS)('en %s el título sigue visible', (_, payload) => {
    montar(payload)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Venta diaria en riesgo')
  })

  it.each(ESTADOS)('en %s la BASE sigue visible con denominador y ventana', (_, payload) => {
    montar(payload)
    // Los dos, siempre: el denominador y la ventana. Sin denominador la cifra
    // no se puede interpretar, y sin ventana no se sabe de cuándo es.
    expect(screen.getByText(/^Base ·/)).toHaveTextContent('Últimos 30 días')
    expect(screen.getByText(/^Base ·/).textContent).toMatch(/Base · .+ · Últimos 30 días/)
  })

  it.each(ESTADOS)('en %s la procedencia sigue visible con capa y fuente', (_, payload) => {
    const { container } = montar(payload)
    expect(container.textContent).toMatch(/GOLD|SILVER/)
    expect(container.textContent).toMatch(/Snowflake|ERP/)
  })
})

describe('el cuerpo solo se pinta cuando hay cifra', () => {
  it('aparece en DISPONIBLE y DEGRADADO', () => {
    for (const payload of [conCifra, { ...conCifra, estado: 'DEGRADADO' } as Payload]) {
      const { unmount } = montar(payload)
      expect(screen.getByText('EL CUERPO')).toBeInTheDocument()
      unmount()
    }
  })

  it('NO aparece en ninguno de los cinco sin cifra', () => {
    const sinCifra = ESTADOS.filter(([nombre]) => !['DISPONIBLE', 'DEGRADADO'].includes(nombre))
    expect(sinCifra).toHaveLength(5)

    for (const [, payload] of sinCifra) {
      const { unmount } = montar(payload)
      expect(screen.queryByText('EL CUERPO')).toBeNull()
      unmount()
    }
  })
})

describe('cada estado dice qué pasa, por qué y qué se puede hacer · §8', () => {
  it('el bloqueado declara la razón, qué lo desbloquea, y no muestra cifra', () => {
    const [, bloqueado] = ESTADOS.find(([n]) => n === 'BLOQUEADO')!
    const { container } = montar(bloqueado)

    expect(screen.getByText('El feed de inventario no corrió hoy.')).toBeInTheDocument()
    expect(container.textContent).toContain('Corrida del ETL de inventario')
    // «Degradación declarada»: si un feed está vencido, el panel no muestra un
    // número aproximado. La ausencia de cifra ES la información.
    expect(container.textContent).toContain('sin valor aproximado')
    expect(container.textContent).not.toContain('4,200')
  })

  it('el error ofrece reintentar ESTE panel, no recargar la página', () => {
    const [, error] = ESTADOS.find(([n]) => n === 'ERROR')!
    render(
      <Panel
        metric={metric}
        payload={error}
        placement={placement}
        format={format}
        now={now}
        onRetry={() => {}}
      >
        <p>EL CUERPO</p>
      </Panel>,
    )
    // El resto de los paneles cargó bien: recargar los tiraría también.
    expect(screen.getByRole('button', { name: /reintentar este panel/i })).toBeInTheDocument()
  })

  it('el degradado marca la limitación sin ocultar el dato', () => {
    montar({ ...conCifra, estado: 'DEGRADADO' } as Payload)
    expect(screen.getByText('Degradado')).toBeInTheDocument()
    expect(screen.getByText('EL CUERPO')).toBeInTheDocument()
  })

  it('ningún estado se queda sin salida · pero la salida es el DETALLE, no el botón', () => {
    // §8 pide que un estado diga qué se puede hacer, y eso lo dice el detalle:
    // «qué lo desbloquea», «quién lo decide». El CTA es el atajo, y solo se
    // pinta si hay quien lo atienda — un botón que promete una acción que no
    // existe es peor que ninguno.
    for (const nombre of ['BLOQUEADO', 'SIN_PERMISO', 'ERROR']) {
      const [, payload] = ESTADOS.find(([n]) => n === nombre)!
      const { container, unmount } = montar(payload)
      expect(container.textContent).toMatch(/desbloquea|decide|cargó normalmente/)
      unmount()
    }
  })
})

describe('la altura sale del rowSpan y nunca del contenido', () => {
  it('el panel declara su span en la grilla', () => {
    const { container } = montar(conCifra)
    const section = container.querySelector('section')
    expect(section?.style.gridRow).toBe('span 4')
    expect(section?.style.gridColumn).toBe('1 / span 4')
  })
})
