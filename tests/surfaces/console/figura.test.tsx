// @vitest-environment jsdom

/** La cifra del agente, dibujada · F3.6
 *
 *  **El criterio pide «un solo modelo de datos»**: la misma cifra, el mismo
 *  cuerpo y la misma anatomía que en la consola. Y la otra mitad: «una cifra en
 *  el chat también declara BASE y procedencia».
 *
 *  **Lo que estuvo bloqueado un mes era con QUÉ cuerpo.** `EventoDato` trae la
 *  forma del valor, no un `TipoPanel`, y `formasAceptadas` va de muchos a
 *  muchos. La respuesta no fue agregar un campo: **el chat se abre desde un
 *  panel, y ese panel tiene tipo.** Estas pruebas fijan las dos mitades de esa
 *  regla — se usa el tipo del panel, y sólo si acepta la forma que llegó.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatFigure } from '@/surfaces/console/ChatFigure'
import { blockTable } from '@/catalog/blocks'
import { createFormat } from '@/render/format'
import type { Block } from '@/catalog/types'
import type { ChatEvent } from '@/api/types'

const format = createFormat('es-MX')
const now = new Date('2026-09-02T12:00:00Z')

/** La tabla que llega de `/config/blocks`, recortada a lo que estas pruebas
 *  necesitan. `kpi` acepta escalar; `bars` no. */
const bloques = blockTable([
  {
    tipo: 'kpi',
    formasAceptadas: ['escalar'],
    colSpanMin: 2, colSpanMax: 6, rowSpanMin: 2, rowSpanMax: 4,
    paramsDisponibles: [],
  },
  {
    tipo: 'bars',
    formasAceptadas: ['categorica'],
    colSpanMin: 3, colSpanMax: 12, rowSpanMin: 3, rowSpanMax: 6,
    paramsDisponibles: [],
  },
] as unknown as Block[])

/** Un `dato` como lo entrega el traductor, con su procedencia pegada. */
const dato = (parche: Partial<Extract<ChatEvent, { tipo: 'dato' }>> = {}) =>
  ({
    tipo: 'dato',
    valor: { forma: 'escalar', v: 4280000 },
    familia: 'demanda',
    base: '48 tiendas sobre 52',
    capa: 'GOLD',
    fuente: 'Snowflake',
    frescura: '2026-09-02T10:00:00Z',
    catalogVersion: 1,
    ...parche,
  }) as Extract<ChatEvent, { tipo: 'dato' }>

describe('F3.6 · un solo modelo de datos', () => {
  it('la cifra se dibuja con el cuerpo DEL PANEL desde el que se preguntó', async () => {
    render(
      <ChatFigure dato={dato()} panelTipo="kpi" bloques={bloques} format={format} now={now} />,
    )
    // `KpiBody` es diferido, así que la cifra aparece cuando llega el chunk.
    expect(await screen.findByText(/4\.28/)).toBeInTheDocument()
  })

  it('la BASE y la procedencia van PEGADAS a la cifra', async () => {
    // Es la mitad del criterio que el contrato hace estructuralmente
    // imposible de separar: el `Gobierno` viaja intersectado con el dato.
    const { container } = render(
      <ChatFigure dato={dato()} panelTipo="kpi" bloques={bloques} format={format} now={now} />,
    )
    await screen.findByText(/4\.28/)
    expect(container.textContent).toContain('48 tiendas sobre 52')
    expect(container.textContent).toContain('GOLD')
    expect(container.textContent).toContain('Snowflake')
  })
})

describe('F3.6 · con qué cuerpo, que era lo que faltaba', () => {
  it('si el tipo NO acepta la forma, se declara en vez de adivinar', () => {
    // **Es la aserción que sostiene la regla.** El agente puede devolver un
    // desglose donde el panel es un KPI; dibujar una categórica con `KpiBody`
    // se vería bien y sería otra cifra.
    const { container } = render(
      <ChatFigure
        dato={dato({ valor: { forma: 'categorica', items: [] } } as never)}
        panelTipo="kpi"
        bloques={bloques}
        format={format}
        now={now}
      />,
    )
    expect(container.textContent).toMatch(/no puede dibujar/i)
    expect(container.textContent).toContain('categorica')
  })

  it('el mismo dato con OTRO panel usa otro cuerpo', async () => {
    // La regla no es «el kpi dibuja escalares»: es «el panel desde el que se
    // preguntó dibuja lo suyo». Con `bars` y una categórica, se dibuja.
    render(
      <ChatFigure
        dato={dato({
          valor: {
            forma: 'categorica',
            items: [{ etiqueta: 'Tienda', v: 60 }],
          },
        } as never)}
        panelTipo="bars"
        bloques={bloques}
        format={format}
        now={now}
      />,
    )
    // El cuerpo de barras dibuja un SVG con su nombre accesible. Asertar
    // sobre él —y no sobre el texto de un eje— prueba lo mismo y no depende
    // de cómo el plot rotule.
    expect(await screen.findByRole('img', { name: /categorías/ })).toBeInTheDocument()
  })
})
