// @vitest-environment jsdom

/** C2 · el drill-down de punta a punta · F3.9 · §PEN:C2
 *
 *  **La cadena tiene cinco saltos y cada uno usa el spread condicional**:
 *  `ConsoleContainer → Console → PanelInGrid → Panel → PanelShell`. Con
 *  `exactOptionalPropertyTypes` ese idioma es obligatorio y tiene un costo
 *  conocido: **una prop mal nombrada compila**, y el síntoma es siempre el mismo
 *  —un callback que no se dispara—. Por eso acá no se verifica que el botón
 *  exista: **se verifica que la petición SALGA con el panel y la dimensión
 *  correctos.** Un botón muerto se ve igual que uno vivo.
 *
 *  Y los mocks hablan **el cable**, no nuestro vocabulario: un mock que habla el
 *  dialecto propio esconde la frontera en vez de probarla.
 *
 *  ── LAS DIVERGENCIAS VAN ATADAS, NO SUELTAS EN UN COMENTARIO ────────────────
 *
 *  Lo declarado en prosa y sin aserción se deshace solo el día que alguien lo
 *  «arregla». Las cuatro de esta pantalla tienen su prueba acá: la frase de
 *  cierre y los porcentajes ausentes, la tabla origen y el linaje declarados, el
 *  conteo de filas rotulado por lo que cuenta, y los ejes saliendo de la lectura
 *  y no del catálogo.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, fail, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { WireMetric, WirePanel, WirePayload } from '@/api/adapt'

/** El gobierno del panel, **con la ventana VACÍA** · es el valor real medido: el
 *  panel de ventas publica `measurement_window: ""`. Es lo que hace que la
 *  aserción de la línea de BASE signifique algo. */
const governance = {
  base: 'ALL CHANNELS',
  layer: 'GOLD',
  source: 'ERP',
  freshness: '2026-09-30T17:37:34Z',
  catalog_version: 1,
  measurement_window: '',
}

/** DOS paneles, y son dos a propósito: con uno solo, un `onDrill` cableado
 *  siempre al primero pasa desapercibido. */
const METRICAS = [
  ['p-ventas', 'm-ventas', 'Ventas', 'sales'],
  ['p-ordenes', 'm-ordenes', 'Órdenes', 'orders'],
] as const

const metrics = METRICAS.map(([, id, name, key]) => ({
  id,
  tenant_id: 't-1',
  key,
  name,
  shape: 'scalar',
  family: 'demand',
  layer: 'GOLD',
  source: 'ERP',
  base: 'ALL CHANNELS',
  unit: 'USD',
  min_grain: 'month',
  measurement_window: '',
  // **VACÍA, que es lo medido**: 0 de 21 métricas del catálogo declaran una sola
  // dimensión. La prueba de los ejes la llena a propósito para demostrar que NO
  // es la fuente.
  dimensions: [],
  catalog_version: 1,
})) as unknown as WireMetric[]

const panels = METRICAS.map(([id, metricId], i) => ({
  id,
  type: 'kpi',
  metric_id: metricId,
  col_start: i * 6 + 1,
  col_span: 6,
  row_span: 4,
})) as unknown as WirePanel[]

const payloads: Record<string, WirePayload> = {
  'p-ventas': {
    status: 'AVAILABLE',
    value: { shape: 'scalar', v: 1232721 },
    governance,
    presentation: { label: 'USD · TOTAL' },
  } as WirePayload,
  'p-ordenes': {
    status: 'AVAILABLE',
    value: { shape: 'scalar', v: 4821 },
    governance,
  } as WirePayload,
}

/** Las tres categorías del fixture · pocas y con un cero, que es lo que el
 *  servicio manda de verdad: medido 29 de 37 ítems en `0`. */
const ITEMS = [
  { label: 'Google PMax', v: 537180.1 },
  { label: 'Meta Advantage+', v: 212044 },
  { label: 'Criteo', v: 0 },
]

type Opciones = {
  /** Qué dimensiones declara cada panel. Un panel que no está acá contesta
   *  `supported: false`, que es cómo se prueba el CTA ausente. */
  dimensiones?: Record<string, string[]>
  /** Para forzar un fallo del servicio en la desagregación. */
  fallo?: { status: number; mensaje: string }
  /** Para el caso del conteo que no cierra con los ítems. */
  filas?: number
  /** Las métricas del catálogo, cuando la prueba necesita otras. */
  catalogo?: WireMetric[]
}

/** Monta los handlers y devuelve los cuerpos de los POST que llegaron. */
function laConsola(opciones: Opciones = {}) {
  const { dimensiones = { 'p-ventas': ['day', 'week', 'platform'] }, fallo, filas, catalogo } = opciones
  const cortes: { panelId: string; cuerpo: Record<string, unknown> }[] = []

  server.use(
    http.get(`${API}/config/catalog`, () => ok(catalogo ?? metrics)),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab, panels })),
    http.post(`${API}/config/panels:batch`, () => ok(payloads)),
    http.get(`${API}/config/panels/:panelId/drilldown/dimensions`, ({ params }) => {
      const id = String(params['panelId'])
      const dims = dimensiones[id]
      return ok({
        panel_id: id,
        metric_key: id === 'p-ventas' ? 'sales' : 'orders',
        supported: dims !== undefined,
        dimensions: dims ?? [],
      })
    }),
    http.post(`${API}/config/panels/:panelId/drilldown`, async ({ request, params }) => {
      const panelId = String(params['panelId'])
      const cuerpo = (await request.json()) as Record<string, unknown>
      cortes.push({ panelId, cuerpo })
      if (fallo !== undefined) return fail(fallo.mensaje, { status: fallo.status })
      return ok({
        panel_id: panelId,
        metric_key: 'sales',
        // **En inglés, como lo mide el servicio.** Un fixture en español acá
        // escondería que el título sale traducido del catálogo.
        metric_name: 'Sales',
        dimension: String(cuerpo['dimension']),
        period: String(cuerpo['period']),
        shape: 'categorical',
        value: { shape: 'categorical', items: ITEMS },
        row_count: filas ?? ITEMS.length,
        queried_at: '2026-10-01T00:07:50.780199Z',
      })
    }),
  )

  return { cortes }
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** El botón «Ver detalle» del panel que lleva ese título, o `undefined`. */
async function ctaDe(titulo: string): Promise<HTMLButtonElement | undefined> {
  const seccion = (await screen.findByRole('heading', { name: titulo })).closest('section')
  expect(seccion).not.toBeNull()
  return Array.from(seccion!.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === 'Ver detalle',
  ) as HTMLButtonElement | undefined
}

/** Abre el detalle del panel que lleva ese título. */
async function verDetalleDe(titulo: string) {
  const usuario = userEvent.setup()
  const boton = await waitFor(async () => {
    const b = await ctaDe(titulo)
    expect(b).toBeDefined()
    return b!
  })
  await usuario.click(boton)
  return usuario
}

describe('1 · `onDrill` DISPARA y lleva ESE panel', () => {
  it('abre el detalle del SEGUNDO panel y la petición trae SU panel', async () => {
    // Los dos soportan, para que la diferencia no pueda ser el filtro del CTA.
    const { cortes } = laConsola({
      dimensiones: { 'p-ventas': ['day'], 'p-ordenes': ['day', 'week'] },
    })
    montar()
    await verDetalleDe('Órdenes')

    await waitFor(() => expect(cortes).toHaveLength(1))
    // `p-ordenes`, no `p-ventas`: el panel apretado.
    expect(cortes[0]?.panelId).toBe('p-ordenes')

    // Y el nombre accesible de la hoja nombra la métrica de ESE panel.
    const hoja = await screen.findByRole('dialog')
    expect(hoja.getAttribute('aria-label')).toContain('Órdenes')
    expect(hoja.getAttribute('aria-label')).not.toContain('Ventas')
  })
})

describe('2 · sin `supported` NO hay CTA · la regla del CTA muerto', () => {
  it('aparece en el panel que soporta y NO en el que no', async () => {
    laConsola({ dimensiones: { 'p-ventas': ['day', 'week'] } })
    montar()

    await waitFor(async () => expect(await ctaDe('Ventas')).toBeDefined())
    expect(await ctaDe('Órdenes')).toBeUndefined()
  })

  it('con NINGUNO soportado no hay un solo «Ver detalle»', async () => {
    laConsola({ dimensiones: {} })
    montar()
    await screen.findByRole('heading', { name: 'Ventas' })
    // Esperar un tick de red para que las dos lecturas vuelvan antes de negar.
    await waitFor(() => expect(screen.getAllByRole('heading', { name: /Ventas|Órdenes/ })).toHaveLength(2))
    expect(screen.queryByText('Ver detalle')).not.toBeInTheDocument()
  })
})

describe('3 · la dimensión inicial es la PRIMERA que el servicio declara', () => {
  it('con `[day, week]` el primer corte pide `day`', async () => {
    const { cortes } = laConsola({ dimensiones: { 'p-ventas': ['day', 'week'] } })
    montar()
    await verDetalleDe('Ventas')
    await waitFor(() => expect(cortes).toHaveLength(1))
    expect(cortes[0]?.cuerpo).toEqual({ dimension: 'day', period: '2026-07' })
  })

  it('con `[week, day]` pide `week` · no hay un defecto escrito en el front', async () => {
    const { cortes } = laConsola({ dimensiones: { 'p-ventas': ['week', 'day'] } })
    montar()
    await verDetalleDe('Ventas')
    await waitFor(() => expect(cortes).toHaveLength(1))
    expect(cortes[0]?.cuerpo).toEqual({ dimension: 'week', period: '2026-07' })
  })
})

describe('4 · cambiar el chip cambia lo que VIAJA', () => {
  it('apretar el segundo chip manda un POST con ESA dimensión', async () => {
    const { cortes } = laConsola({ dimensiones: { 'p-ventas': ['day', 'week'] } })
    montar()
    const usuario = await verDetalleDe('Ventas')
    await waitFor(() => expect(cortes).toHaveLength(1))

    const hoja = await screen.findByRole('dialog')
    await usuario.click(within(hoja).getByRole('button', { name: 'week' }))

    // **Se afirma el CUERPO de la petición**, no que el chip se vea activo.
    await waitFor(() => expect(cortes).toHaveLength(2))
    expect(cortes[1]?.cuerpo).toEqual({ dimension: 'week', period: '2026-07' })
  })
})

describe('5 · los ejes salen de la LECTURA y no del catálogo · F3.9', () => {
  it('con `region` en el catálogo y `[day, week]` en la lectura, se pintan DAY y WEEK', async () => {
    // El criterio de la tarea dice «las dimensiones salen del catálogo, no de una
    // lista escrita en el front». La mitad que es nuestra se cumple —el front no
    // escribe ninguna lista—; la otra es pedido: el campo del catálogo existe y
    // llega vacío en las 21. Esta prueba fija cuál de las dos fuentes manda hoy.
    const conRegion = metrics.map((m) =>
      m.id === 'm-ventas' ? { ...m, dimensions: ['region'] } : m,
    )
    laConsola({ dimensiones: { 'p-ventas': ['day', 'week'] }, catalogo: conRegion })
    montar()
    await verDetalleDe('Ventas')

    const hoja = await screen.findByRole('dialog')
    expect(within(hoja).getByRole('button', { name: 'day' })).toBeInTheDocument()
    expect(within(hoja).getByRole('button', { name: 'week' })).toBeInTheDocument()
    expect(within(hoja).queryByRole('button', { name: /region/i })).not.toBeInTheDocument()
    expect(within(hoja).queryByText(/REGION/i)).not.toBeInTheDocument()
  })
})

describe('6 · el valor se dibuja con el cuerpo del REGISTRO', () => {
  it('tres ítems · el rótulo accesible del plot dice las categorías', async () => {
    // **El mismo cuerpo que la grilla y el chat.** Si la hoja dibujara la lista
    // de cuotas a mano —que es lo que el dibujo pide— este rótulo desaparece:
    // ese visual no está en el repertorio y un gráfico que la tabla no declara no
    // se puede validar contra ella.
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()
    await verDetalleDe('Ventas')

    const hoja = await screen.findByRole('dialog')
    expect(await within(hoja).findByRole('img', { name: '3 categorías' })).toBeInTheDocument()
  })
})

describe('7 · la frase de cierre y los porcentajes están AUSENTES', () => {
  it('no se afirma que la desagregación cierre contra el total', async () => {
    // **Es falsa contra dato real en las tres dimensiones**, medido: la cifra
    // publicada es 1 232 721, por día y por semana suma 1 282 259 y por
    // plataforma 968 169. Y además sería copy de producto compuesto acá.
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')
    await within(hoja).findByRole('img', { name: '3 categorías' })

    expect(within(hoja).queryByText(/CIERRA CONTRA EL TOTAL/i)).not.toBeInTheDocument()
    expect(within(hoja).queryByText(/SUMAN/i)).not.toBeInTheDocument()
  })

  it('no hay un solo `%` en la sección de la desagregación', async () => {
    // El denominador que el dibujo implica —la cifra publicada— no es la suma de
    // los ítems, así que la cuota afirmaría una parte de un total que la pantalla
    // muestra distinto.
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')
    const seccion = (await within(hoja).findByRole('img', { name: '3 categorías' })).closest(
      'section',
    )
    expect(seccion).not.toBeNull()
    expect(seccion!.textContent).not.toMatch(/%/)
  })
})

describe('8 · `row_count` NO se lee como cantidad de ítems', () => {
  it('con 39 filas y 3 ítems, el 39 va bajo el rótulo que nombra las filas', async () => {
    // Es la trampa medida: el transformador del servicio saltea en silencio toda
    // fila sin etiqueta o sin valor, así que «mostrando 39» sobre una lista de 3
    // sería una cifra que no cierra con lo que se ve.
    laConsola({ dimensiones: { 'p-ventas': ['platform'] }, filas: 39 })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')
    await within(hoja).findByRole('img', { name: '3 categorías' })

    expect(within(hoja).getByText(/39 FILAS DEVOLVIÓ LA CONSULTA/i)).toBeInTheDocument()
    expect(within(hoja).queryByText(/MOSTRANDO/i)).not.toBeInTheDocument()
    expect(within(hoja).queryByText(/3 FILAS/i)).not.toBeInTheDocument()
  })
})

describe('9 · la tabla origen y el linaje están DECLARADOS como ausentes', () => {
  it('las dos secciones existen y dicen qué falta', async () => {
    // **Se declara, no se esconde**, que es la gramática de los estados. Lo que
    // no se hace es fingirlas con un dato compuesto.
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')

    expect(within(hoja).getByText(/TABLA ORIGEN/i)).toBeInTheDocument()
    expect(within(hoja).getByText(/todavía no se publican/i)).toBeInTheDocument()
    expect(within(hoja).getByText(/LINAJE HASTA LA FUENTE CRUDA/i)).toBeInTheDocument()
    expect(within(hoja).getByText(/El recorrido del dato entre capas/i)).toBeInTheDocument()
  })

  it('y NO se fingen: ninguna fila cruda ni conteo de capa del dibujo', async () => {
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')

    // Los literales del dibujo que no tienen de dónde salir.
    expect(within(hoja).queryByText(/1\.284\.500/)).not.toBeInTheDocument()
    expect(within(hoja).queryByText(/18\.380/)).not.toBeInTheDocument()
    expect(within(hoja).queryByText(/BRONZE/)).not.toBeInTheDocument()
    expect(within(hoja).queryByText(/ÓRDENES TAL COMO LLEGAN/i)).not.toBeInTheDocument()
  })

  it('la declaración NO nombra una ruta, un método ni una tarea', async () => {
    // La otra mitad la cubre el chequeo de copy, que corre sobre toda cadena de
    // JSX de las superficies. Acá se afirma sobre lo que llegó al DOM.
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')
    const texto = hoja.textContent ?? ''

    expect(texto).not.toMatch(/\/(?:config|admin|auth)\//)
    expect(texto).not.toMatch(/\b(?:GET|POST|PUT|DELETE|PATCH)\s+\//)
    expect(texto).not.toMatch(/\b[BFD]\d+\.\d+\b/)
    expect(texto).not.toMatch(/§\s?\d/)
  })
})

describe('10 · el pie NO apila hojas', () => {
  it('preguntar sobre esta cifra cierra el detalle y abre el chat', async () => {
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()
    const usuario = await verDetalleDe('Ventas')

    const detalle = await screen.findByRole('dialog')
    expect(detalle.getAttribute('aria-label')).toContain('Detalle')
    await usuario.click(within(detalle).getByRole('button', { name: /Preguntar sobre esta cifra/i }))

    // **Una sola hoja**, y es la del chat.
    await waitFor(() => {
      const hojas = screen.getAllByRole('dialog')
      expect(hojas).toHaveLength(1)
      expect(hojas[0]?.getAttribute('aria-label')).toContain('Preguntar a Synapse')
    })
  })

  it('y abrir el detalle con el chat abierto cierra el chat', async () => {
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()

    // Primero el chat, desde el mismo panel.
    const usuario = userEvent.setup()
    const seccion = (await screen.findByRole('heading', { name: 'Ventas' })).closest('section')
    const preguntar = Array.from(seccion!.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Preguntar',
    )
    await usuario.click(preguntar!)
    await screen.findByRole('dialog')

    await verDetalleDe('Ventas')
    await waitFor(() => {
      const hojas = screen.getAllByRole('dialog')
      expect(hojas).toHaveLength(1)
      expect(hojas[0]?.getAttribute('aria-label')).toContain('Detalle')
    })
  })
})

describe('11 · Escape cierra y el foco vuelve al CTA que la abrió', () => {
  it('la hoja se va y el foco queda en «Ver detalle»', async () => {
    // Lo hereda de la hoja compartida, y la extracción se verificó dejando verdes
    // las pruebas de foco del chat sin tocarlas. Acá se afirma para ESTA hoja.
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()
    const usuario = await verDetalleDe('Ventas')
    await screen.findByRole('dialog')

    await usuario.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.activeElement?.textContent?.trim()).toBe('Ver detalle')
  })
})

describe('12 · los dos fallos del servicio se leen DISTINTO', () => {
  it('sin filas para ese período es un VACÍO, no un error', async () => {
    laConsola({
      dimensiones: { 'p-ventas': ['platform'] },
      fallo: { status: 422, mensaje: 'Snowflake no devolvió filas para ese período y dimensión' },
    })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')

    // El nombre del estado va al árbol de accesibilidad: es cómo se distingue sin
    // ver la marca. «Sin datos», no «Error».
    expect(await within(hoja).findByText('Sin datos')).toBeInTheDocument()
    expect(within(hoja).queryByText('Error')).not.toBeInTheDocument()
    // Y el mensaje del servicio tal cual · §8 manda sobre él.
    expect(within(hoja).getByText(/no devolvió filas para ese período/)).toBeInTheDocument()
  })

  it('el límite de peticiones excedido es un ERROR, y la hoja no reintenta sola', async () => {
    const { cortes } = laConsola({
      dimensiones: { 'p-ventas': ['platform'] },
      fallo: {
        status: 429,
        mensaje: 'límite de peticiones por usuario excedido; reintenta más tarde',
      },
    })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')

    expect(await within(hoja).findByText('Error')).toBeInTheDocument()
    expect(within(hoja).getByText(/límite de peticiones por usuario excedido/)).toBeInTheDocument()
    // **Un solo POST.** Reintentar sobre un límite excedido gasta la cuota que
    // acaba de agotarse, y esta ruta la comparte con el chat.
    await waitFor(() => expect(cortes).toHaveLength(1))
    expect(cortes).toHaveLength(1)
  })
})

describe('14 · la línea de BASE no cuelga el separador', () => {
  it('con la ventana vacía el texto termina en la base', async () => {
    // Misma corrección que la cabecera del panel ya lleva. Se afirma de nuevo
    // porque es otro componente, y un segundo lugar donde la regla se olvida.
    laConsola({ dimensiones: { 'p-ventas': ['platform'] } })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')

    const base = within(hoja).getByText(/^Base · ALL CHANNELS$/i)
    expect(base).toBeInTheDocument()
    expect(base.textContent?.trim().endsWith('·')).toBe(false)
  })

  it('la BASE y la procedencia del PANEL siguen visibles mientras el corte carga', async () => {
    // **Un estado reemplaza el cuerpo, nunca el shell.** Acá el «shell» es el
    // encabezado: la respuesta del corte trae nueve campos y ninguno es de
    // procedencia, así que si no saliera del panel no habría de dónde.
    laConsola({
      dimensiones: { 'p-ventas': ['platform'] },
      fallo: { status: 429, mensaje: 'límite de peticiones por usuario excedido' },
    })
    montar()
    await verDetalleDe('Ventas')
    const hoja = await screen.findByRole('dialog')
    await within(hoja).findByText('Error')

    expect(within(hoja).getByText(/^Base · ALL CHANNELS$/i)).toBeInTheDocument()
    expect(within(hoja).getByText('GOLD')).toBeInTheDocument()
    expect(within(hoja).getByText(/ERP/)).toBeInTheDocument()
  })
})
