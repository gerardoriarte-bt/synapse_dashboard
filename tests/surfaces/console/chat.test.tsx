// @vitest-environment jsdom

/** La hoja y los mensajes · F3.1, F3.5
 *
 *  Los dos se montan con turnos FIJOS, sin conexión y sin `useChat`. Que se
 *  pueda es la prueba de que la separación de F3.8 existe de verdad: si para
 *  probar la UI hiciera falta un stream, el componente conocería SSE.
 */
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatOverlay } from '@/surfaces/console/ChatOverlay'
import { ChatThread } from '@/surfaces/console/ChatThread'
import type { ChatTurn } from '@/api/useChat'

const VACIA = { texto: '', datos: [], auditoria: null, sugerencias: [] }

const turno = (parche: Partial<ChatTurn> = {}): ChatTurn => ({
  pregunta: '¿Por qué cayeron las ventas?',
  respuesta: VACIA,
  streaming: false,
  error: null,
  ...parche,
})

describe('F3.1 · la hoja', () => {
  it('cerrada no está en el DOM · no es que esté oculta', () => {
    render(<ChatOverlay open={false} title="Venta diaria" onClose={() => {}}>x</ChatOverlay>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('el Escape cierra', async () => {
    const cerrar = vi.fn()
    render(<ChatOverlay open title="Venta diaria" onClose={cerrar}>x</ChatOverlay>)
    await userEvent.keyboard('{Escape}')
    expect(cerrar).toHaveBeenCalledTimes(1)
  })

  it('el botón de cerrar DISPARA · no alcanza con que exista', async () => {
    // Un botón muerto se ve igual que uno que funciona.
    const cerrar = vi.fn()
    render(<ChatOverlay open title="Venta diaria" onClose={cerrar}>x</ChatOverlay>)
    await userEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(cerrar).toHaveBeenCalledTimes(1)
  })

  it('el foco ENTRA al abrir', () => {
    render(<ChatOverlay open title="Venta diaria" onClose={() => {}}>x</ChatOverlay>)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })

  it('y VUELVE al disparador al cerrar', async () => {
    // Sin esto, cerrar con Escape deja el foco en el body y quien navega con
    // teclado tiene que recorrer la página para volver al panel.
    function Caso() {
      const [abierta, setAbierta] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setAbierta(true)}>
            Preguntar
          </button>
          <ChatOverlay open={abierta} title="Venta diaria" onClose={() => setAbierta(false)}>
            x
          </ChatOverlay>
        </>
      )
    }
    render(<Caso />)
    const disparador = screen.getByRole('button', { name: 'Preguntar' })

    await userEvent.click(disparador)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))

    await userEvent.keyboard('{Escape}')
    expect(document.activeElement).toBe(disparador)
  })

  it('se anuncia como diálogo modal y con nombre', () => {
    render(<ChatOverlay open title="Venta diaria" onClose={() => {}}>x</ChatOverlay>)
    const hoja = screen.getByRole('dialog')
    expect(hoja).toHaveAttribute('aria-modal', 'true')
    expect(hoja).toHaveAccessibleName('Venta diaria')
  })
})

describe('F3.5 · los mensajes', () => {
  it('sin turnos invita a preguntar · no muestra un hueco', () => {
    render(<ChatThread turns={[]} />)
    expect(screen.getByText(/Preguntá sobre lo que estás viendo/)).toBeInTheDocument()
  })

  it('mientras no llegó el primer fragmento dice que está consultando', () => {
    render(<ChatThread turns={[turno({ streaming: true })]} />)
    expect(screen.getByText('Consultando')).toBeInTheDocument()
  })

  it('en cuanto hay prosa, la prosa ES el indicador · se va el «Consultando»', () => {
    render(
      <ChatThread
        turns={[turno({ streaming: true, respuesta: { ...VACIA, texto: 'Las ventas ' } })]}
      />,
    )
    expect(screen.queryByText('Consultando')).toBeNull()
    expect(screen.getByText(/Las ventas/)).toBeInTheDocument()
  })

  it('la región viva es la RESPUESTA, no la hoja entera', () => {
    // Si envolviera todo, un lector de pantalla releería la pregunta con cada
    // fragmento que llega.
    const { container } = render(<ChatThread turns={[turno({ streaming: true })]} />)
    const viva = container.querySelector('[aria-live]')
    expect(viva).not.toBeNull()
    expect(viva?.textContent).not.toContain('¿Por qué cayeron las ventas?')
    expect(viva).toHaveAttribute('aria-busy', 'true')
  })

  it('NO dibuja un spinner · la casa usa esqueleto o nada', () => {
    const { container } = render(<ChatThread turns={[turno({ streaming: true })]} />)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.innerHTML).not.toMatch(/animate-spin|spinner/i)
  })
})

describe('F3.5 · §7.1 · toda respuesta muestra su SQL', () => {
  const conSql = turno({
    respuesta: {
      ...VACIA,
      texto: 'Cayeron 12%.',
      auditoria: {
        tipo: 'auditoria',
        sql: 'select sum(v) from gold.ventas',
        limiteDeclarado: 'No cubre tiendas sin feed.',
      },
    } as ChatTurn['respuesta'],
  })

  it('el SQL está, en un desplegable CERRADO · es auditabilidad, no lectura', () => {
    const { container } = render(<ChatThread turns={[conSql]} />)
    const detalle = container.querySelector('details')
    expect(detalle).not.toBeNull()
    expect(detalle?.open).toBe(false)
    expect(screen.getByText(/select sum\(v\)/)).toBeInTheDocument()
  })

  it('el límite declarado va con el SQL · §7.1 lo pide junto', () => {
    // «Una respuesta sin límite declarado se lee como si abarcara todo.»
    render(<ChatThread turns={[conSql]} />)
    expect(screen.getByText(/No cubre tiendas sin feed/)).toBeInTheDocument()
  })
})

describe('F3.5 · el corte dice si lo recibido sigue valiendo', () => {
  it('con `parcial` conserva lo que llegó y lo dice', () => {
    render(
      <ChatThread
        turns={[
          turno({
            respuesta: { ...VACIA, texto: 'Las ventas ' },
            error: { mensaje: 'Se cortó la conexión.', parcial: true },
          }),
        ]}
      />,
    )
    expect(screen.getByText(/Las ventas/)).toBeInTheDocument()
    expect(screen.getByText(/sigue arriba/)).toBeInTheDocument()
  })

  it('sin `parcial` avisa que no se conservó', () => {
    render(
      <ChatThread
        turns={[turno({ error: { mensaje: 'Se cortó.', parcial: false } })]}
      />,
    )
    expect(screen.getByText(/no se pudo conservar/)).toBeInTheDocument()
  })
})

describe('F3.6 está bloqueada, y la UI lo declara en vez de inventar', () => {
  it('una cifra del agente se cuenta, no se dibuja con un cuerpo elegido a dedo', () => {
    // `DatoDeRespuesta` trae `valor`, `familia` y su procedencia, pero NO
    // declara con qué tipo de panel se dibuja, y varios tipos aceptan la misma
    // forma. Elegir uno acá sería inventar una decisión del contrato.
    const dato = {
      tipo: 'dato',
      valor: { forma: 'escalar', v: 12 },
      familia: 'demanda',
      base: '48 tiendas',
      capa: 'GOLD',
      fuente: 'Snowflake',
      frescura: '2026-09-02T08:00:00Z',
      catalogVersion: 1,
    }
    render(
      <ChatThread
        turns={[turno({ respuesta: { ...VACIA, datos: [dato] } as ChatTurn['respuesta'] })]}
      />,
    )
    expect(screen.getByText(/una cifra que todavía no se dibuja/)).toBeInTheDocument()
  })
})
