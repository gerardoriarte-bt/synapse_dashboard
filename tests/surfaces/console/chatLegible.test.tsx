// @vitest-environment jsdom

/** El chat se lee · 2026-10-27
 *
 *  **Tres cosas que el humano encontró usándolo**, y ninguna la vio una prueba:
 *
 *   1. Las tablas se dibujaban al final de la respuesta, lejos del párrafo que
 *      las presenta.
 *   2. En una tabla «se ve muy igual» todo: filas, columnas, encabezados,
 *      títulos y referencias.
 *   3. La hoja medía 940 fijos y las tablas pedían scroll horizontal.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { apply } from '@/api/useChat'
import type { Answer, ChatTurn, DatoEnRespuesta } from '@/api/useChat'
import { intercalar } from '@/surfaces/console/intercalar'
import { ChatThread } from '@/surfaces/console/ChatThread'
import { ChatFigure } from '@/surfaces/console/ChatFigure'
import { ChatOverlay } from '@/surfaces/console/ChatOverlay'
import { Markdown } from '@/surfaces/console/Markdown'
import { TableBody } from '@/render/bodies/TableBody'
import { blockTable } from '@/catalog/blocks'
import { createFormat } from '@/render/format'
import type { Block } from '@/catalog/types'
import type { ChatEvent } from '@/api/types'

const format = createFormat('es-MX')
const now = new Date('2026-10-27T12:00:00Z')
const VACIA: Answer = { texto: '', datos: [], auditoria: null, sugerencias: [] }

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

/** Una tabla con rótulos, como las del agente: la primera columna dice de qué
 *  es cada fila. */
const tabla = (titulo: string) =>
  ({
    tipo: 'dato',
    titulo,
    valor: {
      forma: 'tabular',
      columnas: [
        { clave: 'label', titulo: 'Plataforma', numerica: false },
        { clave: 'investment', titulo: 'Inversión', numerica: true },
      ],
      filas: [
        { label: 'Google', investment: 63777.61 },
        { label: 'Meta', investment: 33562.86 },
      ],
    },
    familia: null,
    base: 'Mes',
    capa: null,
    fuente: '',
    frescura: '2026-10-27T10:00:00Z',
    catalogVersion: 1,
  }) as unknown as Extract<ChatEvent, { tipo: 'dato' }>

describe('cada tabla debajo del párrafo que la presenta', () => {
  it('`apply` guarda cuánto texto había cuando llegó la cifra', () => {
    const eventos: ChatEvent[] = [
      { tipo: 'texto', delta: 'Primero la inversión.\n\n' },
      tabla('A'),
      { tipo: 'texto', delta: 'Ahora los ingresos.' },
      tabla('B'),
    ]
    const r = eventos.reduce(apply, VACIA)
    expect(r.datos.map((d) => d.enTexto)).toEqual([23, 42])
  })

  it('el corte va al FINAL del párrafo, nunca a mitad de una frase', () => {
    // El fragmento cortó en «inver»: la tabla va después del párrafo entero.
    const texto = 'La inversión subió.\n\nLos ingresos bajaron.'
    const tramos = intercalar(texto, [{ enTexto: 5 }])
    expect(tramos.map((t) => t.texto)).toEqual(['La inversión subió.', '\n\nLos ingresos bajaron.'])
    expect(tramos[0]?.datos).toHaveLength(1)
  })

  it('en el borde exacto de un párrafo, queda ahí', () => {
    const texto = 'Uno.\n\nDos.\n\nTres.'
    const tramos = intercalar(texto, [{ enTexto: 6 }])
    expect(tramos.map((t) => t.texto)).toEqual(['Uno.\n\n', 'Dos.\n\nTres.'])
  })

  it('una tabla de markdown no se parte', () => {
    const texto = '| a | b |\n|---|---|\n| 1 | 2 |\n\nSigue.'
    const tramos = intercalar(texto, [{ enTexto: 12 }])
    expect(tramos[0]?.texto).toBe('| a | b |\n|---|---|\n| 1 | 2 |')
  })

  it('sin lugar, o antes de cualquier palabra, va al final como antes', () => {
    const texto = 'Uno.\n\nDos.'
    expect(intercalar(texto, [{}]).map((t) => t.datos.length)).toEqual([1])
    expect(intercalar(texto, [{ enTexto: 0 }]).map((t) => t.datos.length)).toEqual([1])
  })

  it('no se pierde ni se repite prosa', () => {
    const texto = 'A.\n\nB.\n\nC.\n\nD.'
    const tramos = intercalar(texto, [{ enTexto: 1 }, { enTexto: 1 }, { enTexto: 9 }, {}])
    expect(tramos.map((t) => t.texto).join('')).toBe(texto)
    expect(tramos.flatMap((t) => t.datos)).toHaveLength(4)
    // Las dos primeras comparten lugar: van juntas, bajo «A.».
    expect(tramos[0]?.datos).toHaveLength(2)
  })

  it('un corte nunca vuelve atrás · una cifra al final y otra después con lugar', () => {
    // La primera va al final; la segunda dice «después de A.». Volver atrás
    // repetiría «B.» en pantalla.
    const texto = 'A.\n\nB.'
    const tramos = intercalar(texto, [{}, { enTexto: 1 }])
    expect(tramos.map((t) => t.texto).join('')).toBe(texto)
    expect(tramos.flatMap((t) => t.datos)).toHaveLength(2)
  })

  it('en pantalla, la tabla queda ENTRE los dos párrafos', async () => {
    const datos: DatoEnRespuesta[] = [{ ...tabla('Inversión por plataforma'), enTexto: 23 }]
    const turno: ChatTurn = {
      pregunta: '¿Cómo vamos?',
      respuesta: { ...VACIA, texto: 'Primero la inversión.\n\nDespués, los ingresos.', datos },
      streaming: false,
      error: null,
    }
    const { container } = render(
      <ChatThread turns={[turno]} bloques={conTabla} format={format} now={now} />,
    )
    await screen.findByText('Google')
    // Lo de adentro de la figura —su título— no cuenta: se mira el orden de la
    // respuesta, no el de la figura.
    const textos = Array.from(container.querySelectorAll('p, figure'))
      .filter((n) => n.tagName === 'FIGURE' || n.closest('figure') === null)
      .map((n) => (n.tagName === 'FIGURE' ? 'FIGURA' : n.textContent))
    const i = textos.indexOf('Primero la inversión.')
    expect(textos.slice(i, i + 3)).toEqual([
      'Primero la inversión.',
      'FIGURA',
      'Después, los ingresos.',
    ])
  })
})

describe('la tabla del chat se lee fila por fila', () => {
  it('ChatFigure le pide a la tabla la anatomía de lectura · la prop LLEGA', async () => {
    // Verifica que llegue, no que exista: el spread condicional deja pasar una
    // prop mal escrita.
    const { container } = render(
      <ChatFigure dato={tabla('Inversión')} bloques={conTabla} format={format} now={now} />,
    )
    await screen.findByText('Google')
    expect(container.querySelector('thead')?.className).toContain('bg-elev')
    expect(container.querySelector('tbody tr')?.className).toContain('even:bg-w1')
    // Sin alto fijo: crece con sus filas en vez de abrir un segundo scroll.
    expect(container.querySelector('figure > div[style]')).toBeNull()
  })

  it('líneas entre columnas, y la primera columna destacada', async () => {
    const { container } = render(
      <ChatFigure dato={tabla('Inversión')} bloques={conTabla} format={format} now={now} />,
    )
    await screen.findByText('Google')
    const [primera, segunda] = Array.from(container.querySelector('tbody tr')?.children ?? [])
    expect(primera?.className).toContain('font-medium')
    expect(primera?.className).not.toContain('border-l')
    expect(segunda?.className).toContain('border-l')
  })

  it('la tabla que el agente escribe en markdown se lee igual que la del dato', () => {
    const { container } = render(
      <Markdown
        texto={'| Plataforma | Inversión |\n|---|---|\n| Google | 63,777 |\n| Meta | 33,562 |'}
      />,
    )
    expect(container.querySelector('thead')?.className).toContain('bg-elev')
    const fila = container.querySelector('tbody tr') as HTMLElement
    expect(fila.className).toContain('even:bg-w1')
    const [primera, segunda] = Array.from(fila.children)
    expect(primera?.className).toContain('font-medium')
    expect(segunda?.className).toContain('border-l')
    expect(container.querySelectorAll('th')[1]?.className).toContain('border-l')
  })

  it('en el PANEL la tabla sigue como la dibuja el `.pen`', () => {
    const { container } = render(
      <TableBody
        value={tabla('x').valor as never}
        params={{}}
        span={{ colStart: 1, colSpan: 6, rowSpan: 4 }}
        family={null}
        format={format}
        metric=""
      />,
    )
    expect(container.querySelector('thead')?.className).not.toContain('bg-elev')
    expect(container.querySelector('tbody tr')?.className).toBe('border-b border-w1')
  })

  it('el título es un título, y las referencias van aparte, debajo de la cifra', async () => {
    const { container } = render(
      <ChatFigure
        dato={tabla('Inversión por plataforma')}
        bloques={conTabla}
        format={format}
        now={now}
      />,
    )
    await screen.findByText('Google')
    const titulo = screen.getByText('Inversión por plataforma')
    expect(titulo.className).toContain('font-semibold')
    expect(titulo.className).not.toContain('uppercase')
    const base = screen.getByText('Base · Mes')
    expect(base.parentElement?.className).toContain('border-t')
    // La base va después de la tabla, no antes.
    const tablaEl = container.querySelector('table') as HTMLElement
    expect(tablaEl.compareDocumentPosition(base) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('la hoja del chat ocupa el 80% de la pantalla', () => {
  it('nunca menos que los 940 del dibujo', () => {
    render(
      <ChatOverlay open title="Chat" onClose={() => {}}>
        <p>hola</p>
      </ChatOverlay>,
    )
    expect(screen.getByRole('dialog').className).toContain('max-w-[max(80vw,940px)]')
  })
})

describe('lo que se vio al mirarlo · 2026-10-27', () => {
  it('una lista numerada lleva sus números, y una suelta sus viñetas', () => {
    const { container } = render(<Markdown texto={'1. Reponer\n2. Pausar\n\n- Uno\n- Otro'} />)
    expect(container.querySelector('ol')?.className).toContain('list-decimal')
    expect(container.querySelector('ul')?.className).toContain('list-disc')
  })

  const columna = (valores: number[]) => ({
    forma: 'tabular',
    columnas: [
      { clave: 'label', titulo: 'Plataforma', numerica: false },
      { clave: 'n', titulo: 'Clics', numerica: true },
    ],
    filas: valores.map((n, i) => ({ label: `p${i}`, n })),
  })
  const celdas = (valores: number[]) => {
    const { container } = render(
      <TableBody
        value={columna(valores) as never}
        params={{}}
        span={{ colStart: 1, colSpan: 6, rowSpan: 4 }}
        family={null}
        format={format}
        metric=""
      />,
    )
    return Array.from(container.querySelectorAll('tbody tr')).map((f) => f.children[1]?.textContent)
  }

  it('una columna no mezcla cifras completas con abreviadas', () => {
    // 6,420 abrevia exacto y los otros no: antes salía «6.42K» entre enteros.
    expect(celdas([182340, 96120, 6420])).toEqual(['182,340', '96,120', '6,420'])
  })

  it('si todas abrevian exactas, se abrevia la columna entera', () => {
    expect(celdas([412000, 318000, 148000])).toEqual(['412K', '318K', '148K'])
  })

  it('lo que está por debajo de mil no impide abreviar', () => {
    expect(celdas([4280000, 950])).toEqual(['4.28M', '950'])
  })
})
