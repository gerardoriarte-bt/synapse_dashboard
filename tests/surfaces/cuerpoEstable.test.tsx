// @vitest-environment jsdom

/** El cuerpo de una cifra NO se vuelve a montar en cada render · 2026-11-24
 *
 *  `oxlint` marcaba `react(static-components)` en `MuestraDeGrafico` y en
 *  `ChatFigure`: «un componente creado durante el render pierde su estado cada
 *  vez». Si `Body` fuera un componente nuevo en cada render, React no podría
 *  reconciliarlo con el anterior y desmontaría el árbol entero —el nodo del DOM
 *  sería otro, y con `lazy` el cuerpo volvería a suspender—.
 *
 *  **No es lo que pasa**: el cuerpo sale de `BODIES`, que se arma una sola vez
 *  al cargar el registro. Esta prueba lo fija mirando lo observable —que el
 *  nodo del DOM sea EL MISMO después de volver a renderizar con otras props—,
 *  para que el día que alguien construya el cuerpo dentro del render
 *  (`lazy(LOADERS[tipo])`, por ejemplo) se vea acá y no en una pantalla que
 *  parpadea.
 */
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatFigure } from '@/surfaces/console/ChatFigure'
import { MuestraDeGrafico } from '@/surfaces/builder/MuestraDeGrafico'
import { blockTable } from '@/catalog/blocks'
import { createFormat } from '@/render/format'
import type { Block } from '@/catalog/types'
import type { ChatEvent, Metric, Payload } from '@/api/types'

const format = createFormat('es-MX')
const antes = new Date('2026-09-02T12:00:00Z')
const despues = new Date('2026-09-02T13:00:00Z')

const bloques = blockTable([
  {
    tipo: 'kpi',
    formasAceptadas: ['escalar'],
    colSpanMin: 2, colSpanMax: 6, rowSpanMin: 2, rowSpanMax: 4,
    paramsDisponibles: [],
  },
] as unknown as Block[])

const dato = {
  tipo: 'dato',
  valor: { forma: 'escalar', v: 4280000 },
  familia: 'demanda',
  base: '48 tiendas sobre 52',
  capa: 'GOLD',
  fuente: 'Snowflake',
  frescura: '2026-09-02T10:00:00Z',
  catalogVersion: 1,
} as Extract<ChatEvent, { tipo: 'dato' }>

const metrica = {
  id: 'm-1',
  key: 'revenue',
  nombre: 'Ingresos',
  forma: 'escalar',
  familia: 'demanda',
  capa: 'GOLD',
  fuente: 'Snowflake',
  ventana: 'Mes en curso',
  base: '48 tiendas sobre 52',
  estado: 'DISPONIBLE',
  direccionSemantica: null,
  catalogVersion: 1,
} as Metric

const payload = {
  estado: 'DISPONIBLE',
  valor: { forma: 'escalar', v: 4280000 },
  base: '48 tiendas sobre 52',
  capa: 'GOLD',
  fuente: 'Snowflake',
  frescura: '2026-09-02T08:00:00Z',
  catalogVersion: 1,
} as unknown as Payload

/** **Se deja asentar el render antes de comparar.** Si el cuerpo se volviera a
 *  crear, el `lazy` nuevo suspende y React ESCONDE el árbol viejo detrás del
 *  esqueleto en vez de borrarlo: buscar la cifra justo después del `rerender`
 *  encuentra el nodo viejo, escondido, y la prueba pasa con el defecto puesto.
 *  Pasó en la primera versión de esta prueba, y lo mostró la mutación. */
async function asentar() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50))
  })
}

describe('el cuerpo conserva su identidad entre renders', () => {
  it('ChatFigure · la cifra es el mismo nodo después de volver a renderizar', async () => {
    const { rerender } = render(
      <ChatFigure dato={dato} panelTipo="kpi" bloques={bloques} format={format} now={antes} />,
    )
    const primero = await screen.findByText(/4\.28/)
    rerender(
      <ChatFigure dato={dato} panelTipo="kpi" bloques={bloques} format={format} now={despues} />,
    )
    await asentar()
    const segundo = await screen.findByText(/4\.28/)
    // Un remount da un nodo nuevo; el viejo queda desprendido del documento.
    expect(segundo).toBe(primero)
    expect(primero.isConnected).toBe(true)
  })

  it('MuestraDeGrafico · la cifra es el mismo nodo después de volver a renderizar', async () => {
    const { rerender } = render(
      <MuestraDeGrafico
        tipo="kpi"
        grafico={undefined}
        metrica={metrica}
        payload={payload}
        format={format}
        now={antes}
      />,
    )
    const primero = await screen.findByText(/4\.28/)
    rerender(
      <MuestraDeGrafico
        tipo="kpi"
        grafico={undefined}
        metrica={metrica}
        payload={payload}
        format={format}
        now={despues}
      />,
    )
    await asentar()
    const segundo = await screen.findByText(/4\.28/)
    expect(segundo).toBe(primero)
    expect(primero.isConnected).toBe(true)
  })
})
