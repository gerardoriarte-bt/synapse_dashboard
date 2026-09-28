/** Lo que llegó el 2026-09-28 y ahora atraviesa el adaptador
 *
 *  **Cuatro campos que estuvieron pedidos entre trece días y dos semanas.** Lo
 *  que se verifica no es que el adaptador los copie —eso lo dice el
 *  compilador— sino las CUATRO DECISIONES que hubo que tomar al pasarlos, que
 *  son las que se pueden equivocar sin que nada falle.
 */
import { describe, expect, it } from 'vitest'
import { adaptContext, adaptTab } from '@/api/adapt'
import type { WireContext, WireTabWithPanels } from '@/api/adapt'

const base = {
  user: { id: 'u', first_name: 'D', last_name: 'L', email: 'd@l' },
  tenant: { id: 't', name: 'UA' },
  role: { id: 'r', name: 'admin' },
  tabs: [],
  catalog_version: 1,
  scope: { kind: 'single_tenant', tenants: [{ id: 't', name: 'UA' }] },
} as unknown as WireContext

describe('el rango del período · B1.1', () => {
  it('pasa los BORDES y no una cadena redactada', () => {
    // **El adaptador no formatea fechas.** Redactar «1 – 30 sep» depende del
    // locale del tenant, y acá no se conoce: el formateador se inyecta en la
    // superficie. Componer la cadena sería el adaptador escribiendo copy.
    const ctx = adaptContext({
      ...base,
      periods: ['2026-09'],
      periods_detail: [{ key: '2026-09', grain: 'month', start: '2026-09-01', end: '2026-10-01' }],
    } as unknown as WireContext)

    expect(ctx.periodos[0]?.rango).toEqual({ desde: '2026-09-01', hasta: '2026-10-01' })
  })

  it('el grano DECLARADO le gana al deducido del id', () => {
    // `granoDelId` existe porque no había otra fuente. Ahora la hay, y si el
    // deducido ganara el campo nuevo no serviría para nada — que es el modo en
    // que un campo llega y nadie se entera.
    const ctx = adaptContext({
      ...base,
      periods: ['2026-Q3'],
      periods_detail: [{ key: '2026-Q3', grain: 'week', start: '2026-07-01', end: '2026-10-01' }],
    } as unknown as WireContext)

    // Por el id sería `mes` —no matchea semana ni día—; declarado es semana.
    expect(ctx.periodos[0]?.grano).toBe('semana')
  })

  it('sin detalle, el período NO se descarta · cae a lo de antes', () => {
    // El cable declara `periods_detail`, pero `periods` sigue siendo la fuente
    // de qué períodos hay. Un período sin detalle tiene que seguir apareciendo:
    // perderlo del selector sería peor que mostrarlo sin rango.
    const ctx = adaptContext({
      ...base,
      periods: ['2026-09', '2026-W32'],
      periods_detail: [{ key: '2026-09', grain: 'month', start: '2026-09-01', end: '2026-10-01' }],
    } as unknown as WireContext)

    expect(ctx.periodos).toHaveLength(2)
    expect(ctx.periodos[1]?.rango).toBeUndefined()
    expect(ctx.periodos[1]?.grano).toBe('semana')
  })
})

describe('el alcance · B1.1', () => {
  it('`multi_tenant` es `plataforma`, y la lista trae la FORMA CORTA', () => {
    // **Las dos son distintas a propósito, y por eso esta prueba sirve.** Hasta
    // el 2026-09-28 el fixture mandaba sólo `name` y el adaptador leía `name`:
    // la prueba pasaba y el navbar mostraba el nombre largo en el selector con
    // la forma corta al lado, dos nombres para el mismo cliente en la misma
    // barra. **Con `label === name` ninguna aserción distingue cuál se leyó.**
    //
    // Se vio abriendo la aplicación, no acá. Lo que esta prueba hace ahora es
    // que no vuelva a pasar sin avisar.
    const ctx = adaptContext({
      ...base,
      periods: [],
      scope: {
        kind: 'multi_tenant',
        tenants: [
          { id: 'a', name: 'Under Armour México', label: 'UA México' },
          { id: 'b', name: 'Terpel Colombia', label: 'Terpel' },
        ],
      },
    } as unknown as WireContext)

    expect(ctx.alcance).toBe('plataforma')
    expect(ctx.tenantsDisponibles).toEqual([
      { id: 'a', etiqueta: 'UA México' },
      { id: 'b', etiqueta: 'Terpel' },
    ])
  })

  it('con UN solo tenant no se ofrece lista · aunque el cable la mande', () => {
    // Misma regla que el selector de dashboard: un control que no ofrece una
    // elección es ruido. El cable manda la lista siempre.
    const ctx = adaptContext({ ...base, periods: [] } as unknown as WireContext)

    expect(ctx.alcance).toBe('usuario')
    expect(ctx).not.toHaveProperty('tenantsDisponibles')
  })
})

describe('la pestaña · B4.4', () => {
  const tab = (icon: string, sug: string[]): WireTabWithPanels =>
    ({
      tab: {
        id: 'tab-1',
        name: 'T',
        operational_question: '¿?',
        sort_order: 1,
        icon,
        chat_suggestions: sug,
      },
      panels: [],
    }) as unknown as WireTabWithPanels

  it('el icono VACÍO se omite · no se pasa como cadena vacía', () => {
    // Un `icono: ''` obliga a cada consumidor a distinguir «sin icono» de
    // «icono vacío», que es la misma cadena y no significan lo mismo.
    expect(adaptTab(tab('', [])).tab).not.toHaveProperty('icono')
  })

  it('el icono presente pasa', () => {
    expect(adaptTab(tab('box', [])).tab.icono).toBe('box')
  })

  it('la lista VACÍA sí se pasa · y la asimetría es a propósito', () => {
    // El servicio la emite siempre como lista, así que `[]` es «no hay» y no
    // «no sé». Omitirla obligaría a un `?? []` en cada consumidor.
    expect(adaptTab(tab('', [])).tab.chatSugerencias).toEqual([])
    expect(adaptTab(tab('', ['¿Cuánto?'])).tab.chatSugerencias).toEqual(['¿Cuánto?'])
  })
})

describe('la nota del panel · B1.13', () => {
  const conNota = (note: string): WireTabWithPanels =>
    ({
      tab: {
        id: 'tab-1',
        name: 'T',
        operational_question: '¿?',
        sort_order: 1,
        icon: '',
        chat_suggestions: [],
      },
      panels: [
        { id: 'p-1', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4, note },
      ],
    }) as unknown as WireTabWithPanels

  it('la nota VACÍA se omite · el cuerpo no pinta un renglón en blanco', () => {
    expect(adaptTab(conNota('')).panels[0]).not.toHaveProperty('nota')
  })

  it('la nota presente pasa tal cual · es copy del admin y no se toca', () => {
    expect(adaptTab(conNota('Excluye devoluciones')).panels[0]?.nota).toBe('Excluye devoluciones')
  })
})

describe('el gráfico del panel · llegó el 2026-09-28', () => {
  const conChart = (chart: string): WireTabWithPanels =>
    ({
      tab: {
        id: 'tab-1',
        name: 'T',
        key: 't',
        operational_question: '¿?',
        sort_order: 1,
        icon: '',
        chat_suggestions: [],
      },
      panels: [
        {
          id: 'p-1',
          metric_id: 'm-1',
          type: 'composition',
          col_start: 1,
          col_span: 3,
          row_span: 4,
          note: '',
          chart,
        },
      ],
    }) as unknown as WireTabWithPanels

  it('vacío se omite · es el gráfico por defecto del cuerpo', () => {
    // Los doce paneles publicados llegan así, medido. Pasarlo como `''`
    // obligaría a cada cuerpo a distinguirlo de «no declarado».
    expect(adaptTab(conChart('')).panels[0]).not.toHaveProperty('grafico')
  })

  it('presente pasa', () => {
    expect(adaptTab(conChart('waterfall')).panels[0]?.grafico).toBe('waterfall')
  })

  it('UNO DESCONOCIDO SE PASA IGUAL · no se descarta en silencio', () => {
    // **Es la decisión que importa de este campo.** Ellos no lo validan contra
    // el repertorio —«eso es del front, que tiene los 49»—, así que un id que
    // no existe puede llegar.
    //
    // Descartarlo acá haría que el panel cayera al gráfico por defecto **sin que
    // nadie se entere**: una cascada dibujada como dona se ve perfecta y miente.
    // El producto decidió que el panel lo declare, y para eso el cuerpo tiene
    // `UnknownPlotState` — pero sólo lo puede declarar si el valor le llega.
    expect(adaptTab(conChart('inventado')).panels[0]?.grafico).toBe('inventado')
  })
})

describe('la key de la pestaña · ya no cae al id', () => {
  it('pasa la que el servicio manda', () => {
    // Caía al `id` con la razón «es estable y único», y era falsa a medias: el
    // id es estable dentro de una VERSIÓN y se recrea en la siguiente. Por eso
    // un rol restringido perdía sus pestañas al publicar.
    const t = adaptTab({
      tab: {
        id: 'uuid-de-fila',
        key: 'overview',
        name: 'T',
        operational_question: '¿?',
        sort_order: 1,
        icon: '',
        chat_suggestions: [],
      },
      panels: [],
    } as unknown as WireTabWithPanels)

    expect(t.tab.key).toBe('overview')
    expect(t.tab.key).not.toBe('uuid-de-fila')
  })
})
