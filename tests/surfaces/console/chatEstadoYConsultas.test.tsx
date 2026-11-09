// @vitest-environment jsdom

/** Lo que la evaluación de UX encontró en el chat · 2026-11-09
 *
 *  Dos defectos que se veían como «raro» en las capturas y en el código eran
 *  condiciones mal escritas. Ver `docs/AUDITORIA-2026-11-09-recomendaciones-de-ux.md`.
 *
 *   · EV-024 · «Consultando» seguía con la tabla ya dibujada: el esqueleto
 *     miraba sólo si había llegado TEXTO.
 *   · EV-027 · la consulta desplegada no era la que armó la tabla: cada trama
 *     `sql` pisaba a la anterior, y el agente consulta más de una vez.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { apply } from '@/api/useChat'
import type { Answer, ChatTurn } from '@/api/useChat'
import { ChatThread } from '@/surfaces/console/ChatThread'
import { blockTable } from '@/catalog/blocks'
import { createFormat } from '@/render/format'
import type { Block } from '@/catalog/types'
import type { ChatEvent } from '@/api/types'

const format = createFormat('es-MX')
const now = new Date('2026-11-09T12:00:00Z')
const VACIA: Answer = { texto: '', datos: [], consultas: [], sugerencias: [] }

const conTabla = blockTable([
  {
    tipo: 'table',
    formasAceptadas: ['tabular'],
    colSpanMin: 5,
    colSpanMax: 8,
    rowSpanMin: 4,
    rowSpanMax: 5,
    paramsDisponibles: [],
  },
] as unknown as Block[])
const chrome = { bloques: conTabla, format, now }

/** Una tabla como las del agente, con la columna de rótulos. */
const tabla = {
  tipo: 'dato',
  titulo: 'Unidades por día',
  valor: {
    forma: 'tabular',
    columnas: [
      { clave: 'label', titulo: 'Día', numerica: false },
      { clave: 'unidades', titulo: 'Unidades', numerica: true },
    ],
    filas: [
      { label: '28 oct', unidades: 1200 },
      { label: '29 oct', unidades: 310 },
    ],
  },
  familia: null,
  base: 'Día',
  capa: null,
  fuente: '',
  frescura: '2026-11-09T10:00:00Z',
  catalogVersion: 1,
} as unknown as ChatEvent

const turno = (respuesta: Answer, streaming: boolean): ChatTurn => ({
  pregunta: '¿Dónde encuentro las unidades vendidas?',
  respuesta,
  streaming,
  error: null,
})

describe('EV-024 · la carga no convive con la respuesta', () => {
  it('con la tabla ya dibujada y sin texto, el esqueleto se va', async () => {
    const r = [tabla].reduce(apply, VACIA)
    render(<ChatThread turns={[turno(r, true)]} {...chrome} />)
    // El cuerpo de tabla es un chunk diferido: se espera a que pinte.
    expect(await screen.findByText('28 oct')).toBeInTheDocument()
    expect(screen.queryByText(/^Consultando/)).toBeNull()
  })

  it('pero sigue diciendo que la respuesta está en curso', () => {
    // La tabla puede llegar antes de la prosa, y el agente puede volver a
    // consultar después: que se vaya el esqueleto no puede leerse como «terminó».
    const r = [tabla].reduce(apply, VACIA)
    const { rerender } = render(<ChatThread turns={[turno(r, true)]} {...chrome} />)
    expect(screen.getByText('Escribiendo')).toBeInTheDocument()

    rerender(<ChatThread turns={[turno(r, false)]} {...chrome} />)
    expect(screen.queryByText('Escribiendo')).toBeNull()
  })
})

describe('EV-027 · se ven TODAS las consultas de la respuesta', () => {
  const diaria = 'select fecha, unidades from gold.ventas_dia'
  const totales = 'select sum(unidades) as unidades_totales from gold.ventas_dia'
  const eventos: ChatEvent[] = [
    { tipo: 'auditoria', sql: diaria } as ChatEvent,
    tabla,
    { tipo: 'texto', delta: 'En octubre se vendieron 1 510 unidades.' },
    { tipo: 'auditoria', sql: totales } as ChatEvent,
  ]

  it('la segunda trama `sql` no pisa a la primera', () => {
    const r = eventos.reduce(apply, VACIA)
    render(<ChatThread turns={[turno(r, false)]} {...chrome} />)
    expect(screen.getByText(diaria)).toBeInTheDocument()
    expect(screen.getByText(totales)).toBeInTheDocument()
  })

  it('en el orden en que corrieron, y el desplegable dice cuántas son', () => {
    const r = eventos.reduce(apply, VACIA)
    const { container } = render(<ChatThread turns={[turno(r, false)]} {...chrome} />)
    const sqls = [...container.querySelectorAll('details pre')].map((p) => p.textContent)
    expect(sqls).toEqual([diaria, totales])
    expect(
      screen.getByText('Ver las 2 consultas que produjeron esta respuesta'),
    ).toBeInTheDocument()
  })
})
