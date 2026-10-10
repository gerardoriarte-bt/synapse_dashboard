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
import { ChatFigure, hasRowLabels } from '@/surfaces/console/ChatFigure'
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

  it('una BASE vacía se declara en vez de quedar colgando · 2026-10-08', async () => {
    // Es lo que pedimos al backend cuando la consulta del agente no es la
    // métrica: base vacía antes que la del catálogo. Vacía tiene que leerse.
    const { container } = render(
      <ChatFigure dato={dato({ base: '' })} panelTipo="kpi" bloques={bloques} format={format} now={now} />,
    )
    await screen.findByText(/4\.28/)
    expect(container.textContent).toContain('Base · la consulta no la declara')
  })
})

describe('F3.6 · con qué cuerpo, que era lo que faltaba', () => {
  it('si el panel NO acepta la forma, se dibuja por la forma · §7, 2026-10-08', async () => {
    // **Era el caso común contra el agente real**: desde un KPI llegaba un
    // desglose y se declaraba. Dibujarlo con `KpiBody` seguiría siendo otra
    // cifra; lo que cambia es que `bars` es el único que acepta la categórica,
    // así que se dibuja con barras.
    const { container } = render(
      <ChatFigure
        dato={dato({
          valor: { forma: 'categorica', items: [{ etiqueta: 'Meta', v: 1 }] },
        } as never)}
        panelTipo="kpi"
        bloques={bloques}
        format={format}
        now={now}
      />,
    )
    expect(await screen.findByRole('img', { name: '1 categorías' })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/no puede dibujar/i)
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

describe('§7 · por la forma, y sólo cuando la tabla no deja dudas · 2026-10-08', () => {
  /** `escalar` lo aceptan dos tipos: es la tabla real de `/config/blocks`. */
  const ambigua = blockTable([
    {
      tipo: 'kpi',
      formasAceptadas: ['escalar'],
      colSpanMin: 2, colSpanMax: 6, rowSpanMin: 2, rowSpanMax: 4,
      paramsDisponibles: [],
    },
    {
      tipo: 'gauge',
      formasAceptadas: ['escalar'],
      colSpanMin: 3, colSpanMax: 7, rowSpanMin: 4, rowSpanMax: 4,
      paramsDisponibles: [],
    },
  ] as unknown as Block[])

  it('desde la PESTAÑA, una forma con un solo tipo se dibuja', async () => {
    // Es lo que §7 pedía: antes decía «no salió de un panel» y no dibujaba.
    render(
      <ChatFigure
        dato={dato({
          valor: { forma: 'categorica', items: [{ etiqueta: 'Meta', v: 1 }] },
        } as never)}
        bloques={bloques}
        format={format}
        now={now}
      />,
    )
    expect(await screen.findByRole('img', { name: '1 categorías' })).toBeInTheDocument()
  })

  it('con dos candidatos y sin panel, se declara en vez de elegir', () => {
    const { container } = render(
      <ChatFigure dato={dato()} bloques={ambigua} format={format} now={now} />,
    )
    expect(container.textContent).toContain('más de un tipo de panel la acepta')
    expect(container.querySelector('figure')).toBeNull()
  })

  it('con dos candidatos, el panel de origen desempata si es uno de ellos', async () => {
    render(
      <ChatFigure dato={dato()} panelTipo="kpi" bloques={ambigua} format={format} now={now} />,
    )
    expect(await screen.findByText(/4\.28/)).toBeInTheDocument()
  })
})

describe('el gráfico del agente · 2026-10-07 · «su marca, nuestros cuerpos»', () => {
  const barras = {
    forma: 'categorica',
    items: [
      { etiqueta: 'Meta', v: 4.2 },
      { etiqueta: 'Google', v: 3.1 },
    ],
  }

  it('si el agente eligió la marca, manda la suya y no la del panel', async () => {
    // El panel es un KPI, que no acepta una categórica. Sin `tipoDePanel` esto
    // se declararía; con él, el agente pidió barras y se dibujan barras.
    render(
      <ChatFigure
        dato={dato({ valor: barras, tipoDePanel: 'bars' } as never)}
        panelTipo="kpi"
        bloques={bloques}
        format={format}
        now={now}
      />,
    )
    expect(await screen.findByRole('img', { name: '2 categorías' })).toBeInTheDocument()
  })

  it('también desde la PESTAÑA, donde no hay panel de origen', async () => {
    render(
      <ChatFigure
        dato={dato({ valor: barras, tipoDePanel: 'bars' } as never)}
        bloques={bloques}
        format={format}
        now={now}
      />,
    )
    expect(await screen.findByRole('img', { name: '2 categorías' })).toBeInTheDocument()
  })

  it('SIN familia se dibuja en NEUTRO y lo dice · decisión humana del 2026-10-09', async () => {
    // Hasta el 2026-10-09 esto se declaraba sin dibujarse, y en QA el chat se
    // quedó sin un gráfico que no fuera tabla. Ahora se dibuja con la rampa
    // `consulta` —neutra, de `decisiones.css`— y un rótulo que lo declara.
    const { container } = render(
      <ChatFigure
        dato={dato({
          valor: barras,
          tipoDePanel: 'bars',
          familia: null,
          titulo: 'ROAS por canal',
        } as never)}
        bloques={bloques}
        format={format}
        now={now}
      />,
    )
    expect(await screen.findByRole('img', { name: '2 categorías' })).toBeInTheDocument()
    expect(container.textContent).toContain('Consulta fuera del catálogo')
    // **El color sale de `consulta` y de ninguna familia del catálogo**: que se
    // pinte con `demanda` sería elegir una familia, que es lo que la regla
    // prohíbe.
    expect(container.innerHTML).toContain('--color-fam-consulta-')
    expect(container.innerHTML).not.toMatch(/--color-fam-(demanda|medios|inventario|cliente|externo)-/)
  })

  it('CON familia no hay rótulo de neutro · el rótulo es sólo para lo que no es métrica', async () => {
    const { container } = render(
      <ChatFigure dato={dato({ valor: barras, tipoDePanel: 'bars' } as never)} bloques={bloques} format={format} now={now} />,
    )
    await screen.findByRole('img', { name: '2 categorías' })
    expect(container.textContent).not.toContain('Consulta fuera del catálogo')
    expect(container.innerHTML).toContain('--color-fam-demanda-')
  })
})

describe('el alto del gráfico · lo encontró abrir el modo mock', () => {
  /** **Un cuerpo de gráfico ocupa el alto de su contenedor**, y la figura del
   *  chat no tenía: la primera serie del agente salió con título, BASE y
   *  procedencia y sin una línea. Las pruebas de arriba pasaban, porque jsdom
   *  no mide — por eso ésta mira el alto declarado y no el dibujo. */
  it('un gráfico lleva el alto de su `rowSpan`, que sale de la grilla', async () => {
    const { container } = render(
      <ChatFigure
        dato={dato({
          valor: { forma: 'categorica', items: [{ etiqueta: 'Meta', v: 1 }] },
          tipoDePanel: 'bars',
        } as never)}
        bloques={bloques}
        format={format}
        now={now}
      />,
    )
    await screen.findByRole('img', { name: '1 categorías' })
    const caja = container.querySelector('figure > div[style]') as HTMLElement | null
    expect(caja?.style.height).toBe('272px')
  })

  it('un KPI no · mide su propia cifra y con 272 px quedaba un hueco', async () => {
    const { container } = render(
      <ChatFigure dato={dato()} panelTipo="kpi" bloques={bloques} format={format} now={now} />,
    )
    await screen.findByText(/4\.28/)
    expect(container.querySelector('figure > div[style]')).toBeNull()
  })
})

describe('la tabla del chat · ningún número desnudo, y la familia es una marca · 2026-10-09', () => {
  const conTabla = blockTable([
    {
      tipo: 'table',
      formasAceptadas: ['tabular'],
      colSpanMin: 5, colSpanMax: 8, rowSpanMin: 4, rowSpanMax: 5,
      paramsDisponibles: [],
    },
  ] as unknown as Block[])

  /** **Capturada del servicio** · `9dc481e`, 2026-10-09, la primera de las
   *  cuatro tramas: inversión por plataforma SIN la columna de plataforma —el
   *  backend descarta `label`— y `platform_revenue` como texto vacío. Llegó con
   *  `family: demand`, así que el filtro de familia no la paraba. */
  const sinRotulos = {
    forma: 'tabular',
    columnas: [
      { clave: 'investment', titulo: 'investment', numerica: true },
      { clave: 'platform_revenue', titulo: 'platform_revenue', numerica: false },
    ],
    filas: [
      { investment: 63777.6114, platform_revenue: '' },
      { investment: 2399.1272, platform_revenue: '131562.73880000002' },
    ],
  }

  /** La misma tabla con el rótulo que el agente sí pidió —`fuente AS label`—
   *  y las cifras de la captura. Es lo que llegaría con el pedido al backend. */
  const conRotulos = {
    forma: 'tabular',
    columnas: [
      { clave: 'label', titulo: 'label', numerica: false },
      { clave: 'investment', titulo: 'investment', numerica: true },
    ],
    filas: [
      { label: 'Google', investment: 63777.61 },
      { label: 'Facebook', investment: 33562.86 },
    ],
  }

  const marca = (c: HTMLElement) => c.querySelector('span[aria-hidden].rounded-xs')

  it('una tabla sin rótulos se declara AUNQUE traiga familia', () => {
    const { container } = render(
      <ChatFigure dato={dato({ valor: sinRotulos } as never)} bloques={conTabla} format={format} now={now} />,
    )
    expect(container.textContent).toContain('sin una columna que diga de qué es cada cifra')
    expect(container.querySelector('figure')).toBeNull()
  })

  it('una columna de texto VACÍA no es un rótulo', () => {
    expect(hasRowLabels(sinRotulos as never)).toBe(false)
    expect(hasRowLabels(conRotulos as never)).toBe(true)
  })

  it('con rótulos y SIN familia se dibuja, sin la marca', async () => {
    const { container } = render(
      <ChatFigure
        dato={dato({ valor: conRotulos, familia: null, capa: null, base: '', fuente: '' } as never)}
        bloques={conTabla}
        format={format}
        now={now}
      />,
    )
    expect(await screen.findByText('Google')).toBeInTheDocument()
    expect(marca(container)).toBeNull()
  })

  it('con familia, la misma tabla lleva su marca · el control de la de arriba', async () => {
    const { container } = render(
      <ChatFigure dato={dato({ valor: conRotulos } as never)} bloques={conTabla} format={format} now={now} />,
    )
    expect(await screen.findByText('Google')).toBeInTheDocument()
    expect(marca(container)).not.toBeNull()
  })

  it('sin capa la procedencia se declara · no sale «GOLD ·» ni un separador colgando', async () => {
    const { container } = render(
      <ChatFigure
        dato={dato({ valor: conRotulos, familia: null, capa: null, base: '', fuente: '' } as never)}
        bloques={conTabla}
        format={format}
        now={now}
      />,
    )
    await screen.findByText('Google')
    expect(container.textContent).toContain('Procedencia · la consulta no la declara')
    expect(container.textContent).not.toContain('GOLD')
  })
})

describe('lo que hace legible una cifra del agente · auditoría del 2026-10-10', () => {
  const conTodo = blockTable([
    { tipo: 'bars', formasAceptadas: ['categorica'], colSpanMin: 3, colSpanMax: 12, rowSpanMin: 3, rowSpanMax: 6, paramsDisponibles: [] },
    { tipo: 'series', formasAceptadas: ['serieTemporal', 'seriesMultiples'], colSpanMin: 5, colSpanMax: 7, rowSpanMin: 4, rowSpanMax: 5, paramsDisponibles: [] },
    { tipo: 'table', formasAceptadas: ['tabular'], colSpanMin: 5, colSpanMax: 8, rowSpanMin: 4, rowSpanMax: 5, paramsDisponibles: [] },
  ] as unknown as Block[])

  const ingresos = {
    forma: 'serieTemporal',
    puntos: [
      { t: '2026-08-01', v: 920000 },
      { t: '2026-09-01', v: 1310000 },
      { t: '2026-10-01', v: 130000 },
    ],
  }
  const ejes = { medida: 'Ingresos (USD)', dimension: 'Mes', serie: null, dimensionEsFecha: true }

  it('dice qué mide y cómo se reparte, con las palabras del agente', async () => {
    const { container } = render(
      <ChatFigure dato={dato({ valor: ingresos, tipoDePanel: 'series', ejes } as never)} bloques={conTodo} format={format} now={now} />,
    )
    await screen.findByRole('group', { name: /usá las flechas/ })
    expect(container.textContent).toContain('Ingresos (USD) · por mes')
  })

  it('el MES EN CURSO se dice · su cifra es incompleta y parece una caída', async () => {
    const { container } = render(
      <ChatFigure
        dato={dato({ valor: ingresos, tipoDePanel: 'series', ejes } as never)}
        bloques={conTodo}
        format={format}
        now={now}
        mesEnCurso="2026-10"
      />,
    )
    await screen.findByRole('group', { name: /usá las flechas/ })
    expect(container.textContent).toContain(`${format.axisDate('2026-10-01', 'mes')} es el mes en curso`)
  })

  it('sin el mes en curso dentro del gráfico, no se dice nada', async () => {
    const { container } = render(
      <ChatFigure
        dato={dato({ valor: ingresos, tipoDePanel: 'series', ejes } as never)}
        bloques={conTodo}
        format={format}
        now={now}
        mesEnCurso="2026-11"
      />,
    )
    await screen.findByRole('group', { name: /usá las flechas/ })
    expect(container.textContent).not.toContain('mes en curso')
  })

  it('una barra por mes rotula la FECHA como la lee el cliente, no `2026-09-01`', async () => {
    const meses = { forma: 'categorica', items: [{ etiqueta: '2026-08-01', v: 1 }, { etiqueta: '2026-09-01', v: 2 }] }
    const { container } = render(
      <ChatFigure dato={dato({ valor: meses, tipoDePanel: 'bars', ejes } as never)} bloques={conTodo} format={format} now={now} />,
    )
    await screen.findByRole('img', { name: '2 categorías' })
    expect(container.textContent).toContain(format.axisDate('2026-09-01', 'mes'))
    expect(container.textContent).not.toContain('2026-09-01')
  })

  it('cuando va como tabla, dice POR QUÉ · antes desaparecía', async () => {
    const tabla = {
      forma: 'tabular',
      columnas: [
        { clave: 'P', titulo: 'Plataforma', numerica: false },
        { clave: 'V', titulo: 'Ventas (USD)', numerica: true },
      ],
      filas: [{ P: 'Google', V: 1 }],
    }
    const { container } = render(
      <ChatFigure
        dato={dato({ valor: tabla, tipoDePanel: 'table', familia: null, aviso: 'las barras agrupadas todavía no tienen un gráfico · TikTok en 2026-04-01' } as never)}
        bloques={conTodo}
        format={format}
        now={now}
      />,
    )
    await screen.findByText('Google')
    expect(container.textContent).toContain('Se muestran los datos como tabla · las barras agrupadas')
    // Las fechas del aviso, como las del resto de la figura.
    expect(container.textContent).toContain(`TikTok en ${format.axisDate('2026-04-01', 'mes')}`)
    expect(container.textContent).not.toContain('2026-04-01')
  })
})
