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
import { ThreadRail } from '@/surfaces/console/ThreadRail'
import { Wordmark } from '@/surfaces/console/Wordmark'
import { createFormat } from '@/render/format'
import { blockTable } from '@/catalog/blocks'
import type { ChatTurn } from '@/api/useChat'

const format = createFormat('es-MX')
const ahora = new Date('2026-09-02T12:00:00Z')

/** `ChatThread` pide con qué dibujar las cifras desde F3.6. Estas pruebas son
 *  de los MENSAJES, no de las cifras —ésas viven en `figura.test.tsx`—, así que
 *  el tipo y la tabla van fijos y no afectan lo que miran. */
const conChrome = { panelTipo: 'kpi' as const, bloques: new Map(), format, now: ahora }

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

  it('apretar el VELO cierra · es la salida que la hoja misma ofrece', async () => {
    // **El botón de cerrar dejó de ser de la hoja el 2026-09-21.** §PEN:C3 lo
    // pone en la cabecera de la columna de conversación, así que lo monta
    // `PanelChat` y lo verifica `historial.test.tsx`. Lo que la hoja ofrece por
    // sí sola son dos salidas: el Escape y el velo.
    const cerrar = vi.fn()
    const { container } = render(
      <ChatOverlay open title="Venta diaria" onClose={cerrar}>x</ChatOverlay>,
    )
    const velo = container.querySelector('[aria-hidden].fixed.inset-0')
    expect(velo).not.toBeNull()
    await userEvent.click(velo as Element)
    expect(cerrar).toHaveBeenCalledTimes(1)
  })

  it('el velo existe · es lo que vuelve CIERTO el `aria-modal`', () => {
    // Estaba declarado desde el principio y era mentira: sin velo, todo lo de
    // atrás seguía siendo clickeable, así que a un lector de pantalla se le
    // decía que el resto estaba inerte cuando no lo estaba.
    const { container } = render(
      <ChatOverlay open title="Venta diaria" onClose={() => {}}>x</ChatOverlay>,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(container.querySelector('[aria-hidden].fixed.inset-0')).not.toBeNull()
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
    render(<ChatThread turns={[]} {...conChrome} />)
    expect(screen.getByText(/Preguntá sobre lo que estás viendo/)).toBeInTheDocument()
  })

  it('mientras no llegó el primer fragmento dice que está consultando', () => {
    render(<ChatThread turns={[turno({ streaming: true })]} {...conChrome} />)
    expect(screen.getByText('Consultando')).toBeInTheDocument()
  })

  it('en cuanto hay prosa, la prosa ES el indicador · se va el «Consultando»', () => {
    render(
      <ChatThread
        turns={[turno({ streaming: true, respuesta: { ...VACIA, texto: 'Las ventas ' } })]}
        {...conChrome}
      />,
    )
    expect(screen.queryByText('Consultando')).toBeNull()
    expect(screen.getByText(/Las ventas/)).toBeInTheDocument()
  })

  it('la región viva es la RESPUESTA, no la hoja entera', () => {
    // Si envolviera todo, un lector de pantalla releería la pregunta con cada
    // fragmento que llega.
    const { container } = render(<ChatThread turns={[turno({ streaming: true })]} {...conChrome} />)
    const viva = container.querySelector('[aria-live]')
    expect(viva).not.toBeNull()
    expect(viva?.textContent).not.toContain('¿Por qué cayeron las ventas?')
    expect(viva).toHaveAttribute('aria-busy', 'true')
  })

  it('NO dibuja un spinner · la casa usa esqueleto o nada', () => {
    const { container } = render(<ChatThread turns={[turno({ streaming: true })]} {...conChrome} />)
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
    const { container } = render(<ChatThread turns={[conSql]} {...conChrome} />)
    const detalle = container.querySelector('details')
    expect(detalle).not.toBeNull()
    expect(detalle?.open).toBe(false)
    expect(screen.getByText(/select sum\(v\)/)).toBeInTheDocument()
  })

  it('el límite declarado va con el SQL · §7.1 lo pide junto', () => {
    // «Una respuesta sin límite declarado se lee como si abarcara todo.»
    render(<ChatThread turns={[conSql]} {...conChrome} />)
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
        {...conChrome}
      />,
    )
    expect(screen.getByText(/Las ventas/)).toBeInTheDocument()
    expect(screen.getByText(/sigue arriba/)).toBeInTheDocument()
  })

  it('sin `parcial` avisa que no se conservó', () => {
    render(
      <ChatThread
        turns={[turno({ error: { mensaje: 'Se cortó.', parcial: false } })]}
        {...conChrome}
      />,
    )
    expect(screen.getByText(/no se pudo conservar/)).toBeInTheDocument()
  })
})

describe('F3.6 · las cifras del agente SE DIBUJAN desde el 2026-09-22', () => {
  it('el hilo monta una figura por cada cifra · no las cuenta', async () => {
    // **Estuvo bloqueada desde el 2026-09-03 y se declaraba cuántas traía la
    // respuesta.** El cable no mandaba con qué familia ni con qué BASE
    // pintarlas; `55e8419` agregó las dos y las otras cuatro.
    //
    // Lo que se dibuja con cada una vive en `figura.test.tsx`. Acá sólo se
    // verifica que el hilo las monte en vez de contarlas.
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
    const { container } = render(
      <ChatThread
        turns={[turno({ respuesta: { ...VACIA, datos: [dato] } as ChatTurn['respuesta'] })]}
        {...conChrome}
        bloques={blockTable([
          {
            tipo: 'kpi', formasAceptadas: ['escalar'],
            colSpanMin: 2, colSpanMax: 6, rowSpanMin: 2, rowSpanMax: 4,
            paramsDisponibles: [],
          },
        ] as never)}
      />,
    )
    expect(container.textContent).not.toMatch(/todavía no se dibuja/)
    // La BASE va pegada a la cifra · la otra mitad del criterio.
    expect(await screen.findByText(/48 tiendas/)).toBeInTheDocument()
  })
})

describe('F3.7 · el riel de hilos', () => {
  const grupos = [
    {
      label: 'Hoy',
      threads: [
        {
          id: 'h-1',
          titulo: 'Por qué subió el ROAS si la inversión está plana',
          creadoEn: '2026-09-04T09:00:00Z',
          actualizadoEn: '2026-09-04T09:00:00Z',
          esDecision: false,
        },
        {
          id: 'h-2',
          titulo: 'Quiebre de stock en talla M',
          creadoEn: '2026-09-04T08:00:00Z',
          actualizadoEn: '2026-09-04T08:00:00Z',
          esDecision: true,
        },
      ],
    },
  ]

  it('sin hilos lo dice · no deja un hueco', () => {
    render(<ThreadRail format={format} groups={[]} onSelect={() => {}} />)
    expect(screen.getByText(/Todavía no preguntaste nada/)).toBeInTheDocument()
  })

  it('el título va ENTERO · el recorte es de CSS, no de la cadena', () => {
    // El contrato: «el riel la muestra tal cual, así que no se resume ni se
    // recorta acá». Cortar la cadena la rompe también para un lector de
    // pantalla, que no tiene ancho.
    render(<ThreadRail format={format} groups={grupos} onSelect={() => {}} />)
    const boton = screen.getByRole('button', { name: /Por qué subió el ROAS/ })
    expect(boton.textContent).toContain('Por qué subió el ROAS si la inversión está plana')
  })

  it('elegir un hilo DISPARA con su id', async () => {
    const elegir = vi.fn()
    render(<ThreadRail format={format} groups={grupos} onSelect={elegir} />)
    await userEvent.click(screen.getByRole('button', { name: /Quiebre de stock/ }))
    expect(elegir).toHaveBeenCalledWith('h-2')
  })

  it('el hilo de una decisión lleva su badge · es la traza de por qué se decidió', () => {
    render(<ThreadRail format={format} groups={grupos} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /Quiebre de stock/ })).toHaveTextContent('Decisión')
    expect(screen.getByRole('button', { name: /ROAS/ })).not.toHaveTextContent('Decisión')
  })

  it('el hilo activo se marca para el lector de pantalla, no solo con color', () => {
    render(<ThreadRail format={format} groups={grupos} activeId="h-1" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /ROAS/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /Quiebre/ })).not.toHaveAttribute('aria-current')
  })

  it('el grupo es un encabezado · un lector de pantalla lo puede saltar', () => {
    render(<ThreadRail format={format} groups={grupos} onSelect={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Hoy' })).toBeInTheDocument()
  })
})

describe('§PEN · la identidad de la plataforma', () => {
  it('el wordmark tiene nombre accesible · el glifo vive en una máscara', () => {
    // Sin `role="img"` y su nombre es una caja vacía en el árbol de
    // accesibilidad: no hay texto que leer, porque el glifo es una máscara.
    render(<Wordmark />)
    expect(screen.getByRole('img', { name: 'Synapse' })).toBeInTheDocument()
  })

  it('el color sale de un token, para invertirse con el tema', () => {
    // El arte es blanco sobre transparente: como `<img>` desaparecería sobre
    // fondo claro. La máscara pintada con `bg-ink` sirve en los dos temas sin
    // un segundo archivo.
    render(<Wordmark />)
    expect(screen.getByRole('img', { name: 'Synapse' }).className).toContain('bg-ink')
  })

  /** **La regla de qué versión va dónde es del `.pen`, no nuestra** · su
   *  capítulo `Identidad` reserva el degradado para superficies SIN datos y lo
   *  prohíbe en el chrome: «el azul y el violeta caen sobre las familias
   *  demanda e inventario · usarlos como chrome rompería la persistencia
   *  cromática». Estas dos la fijan por los dos lados. */
  it('el defecto es `mono` · quien se olvide se equivoca del lado permitido', () => {
    render(<Wordmark />)
    const marca = screen.getByRole('img', { name: 'Synapse' })
    expect(marca.className).toContain('bg-ink')
    expect(marca.style.backgroundImage).toBe('')
  })

  it('la variante de marca es degradado de TOKENS, sin hex ni `bg-ink`', () => {
    // «Naranja a violeta a azul» · el orden lo declara el `.pen`. Que salga de
    // tokens es lo que impide que entre un hex literal, que es regla dura.
    render(<Wordmark variante="marca" />)
    const marca = screen.getByRole('img', { name: 'Synapse' })

    expect(marca.className).not.toContain('bg-ink')
    const fondo = marca.style.backgroundImage
    expect(fondo).toContain('--color-brand-naranja')
    expect(fondo).toContain('--color-brand-violeta')
    expect(fondo).toContain('--color-brand-azul')
    expect(fondo).not.toMatch(/#[0-9a-f]{3,8}/i)
    // Y en ese orden: invertirlo daría otra marca.
    expect(fondo.indexOf('naranja')).toBeLessThan(fondo.indexOf('violeta'))
    expect(fondo.indexOf('violeta')).toBeLessThan(fondo.indexOf('azul'))
  })
})
