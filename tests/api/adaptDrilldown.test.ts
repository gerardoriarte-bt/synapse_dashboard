/** El adaptador del drill-down · F3.9 · §PEN:C2
 *
 *  **VA DE ENTRADA, y es la lección que apareció tres veces en un día.** Con A5 y
 *  A3 la mutación encontró que ninguna prueba tocaba el adaptador: las pruebas de
 *  pantalla construyen el tipo a mano, así que la frontera queda sin cubrir — y
 *  ahí vive siempre la misma clase de distinción, la que un fixture escrito en
 *  nuestro vocabulario no puede ejercitar.
 *
 *  **Los fixtures salen de `contracts/synapse-console-wire.yaml`**, recién
 *  transcripto de su código y medido contra el servicio. No de memoria: el
 *  2026-09-04 el yaml corrigió tres fixtures inventados de tres, y el tercero
 *  pasaba igual porque la prueba sólo miraba el valor.
 */
import { describe, expect, it } from 'vitest'
import { adaptDrillDimensions, adaptDrillResult } from '@/api/adapt'
import type { WireDrillDimensions, WireDrillResult } from '@/api/adapt'

/** La respuesta de dimensiones de un panel que SÍ soporta · medida el 2026-09-30
 *  sobre el panel de ventas: las tres que el registry declara para esa métrica. */
const DIMENSIONES: WireDrillDimensions = {
  panel_id: '80158182-0000-0000-0000-000000000001',
  // **La clave del CATÁLOGO y no la canónica del registry.** El servicio
  // consulta con `CanonicalKey(metric.Key)` —`sales` → `revenue`— y devuelve
  // ésta. Es por donde se entra a equivocarse.
  metric_key: 'sales',
  supported: true,
  dimensions: ['day', 'week', 'platform'],
}

/** Una desagregación por plataforma, con **los nueve campos** del cable.
 *
 *  `row_count: 39` con DOS ítems es el caso medido en chico: el servicio contestó
 *  39 con 37 ítems porque su transformador saltea en silencio toda fila sin
 *  `label` o sin `v`. */
const RESULTADO: WireDrillResult = {
  panel_id: '80158182-0000-0000-0000-000000000001',
  metric_key: 'sales',
  // **En inglés, como lo mide el servicio**: los paneles del dashboard por
  // defecto apuntan a las métricas de la semilla. Un fixture en español acá
  // escondería el pedido.
  metric_name: 'Sales',
  dimension: 'platform',
  period: '2026-09',
  shape: 'categorical',
  value: {
    shape: 'categorical',
    items: [
      { label: 'Google PMax', v: 537180.1 },
      // Un cero, que viene de verdad: medido, 29 de los 37 ítems en `0`. Una
      // plataforma sin gasto en el mes no es un hueco de datos.
      { label: 'Criteo', v: 0 },
    ],
  },
  row_count: 39,
  queried_at: '2026-10-01T00:07:50.780199Z',
}

describe('adaptDrillDimensions · sólo renombra', () => {
  it('los cuatro campos cambian de nombre y nada más', () => {
    expect(adaptDrillDimensions(DIMENSIONES)).toEqual({
      panelId: '80158182-0000-0000-0000-000000000001',
      clave: 'sales',
      soportado: true,
      dimensiones: ['day', 'week', 'platform'],
    })
  })

  it('una métrica sin drill-down llega con la lista VACÍA, no ausente', () => {
    // Medido en las ocho que no soportan: el servicio inicializa el DTO con
    // `[]string{}` y sólo después mira el registry. Por eso `[]` significa «no
    // soporta» y no «no vino», y el adaptador no tiene que inventar un default.
    const sin: WireDrillDimensions = {
      panel_id: 'p-prosa',
      metric_key: 'executive_summary',
      supported: false,
      dimensions: [],
    }
    expect(adaptDrillDimensions(sin)).toEqual({
      panelId: 'p-prosa',
      clave: 'executive_summary',
      soportado: false,
      dimensiones: [],
    })
  })

  it('las claves NO se traducen · `day` sigue siendo `day`', () => {
    // **El rótulo legible existe del otro lado y no se serializa.** Traducirlo
    // acá sería la tabla de traducción que nadie mantiene el día que aparezca una
    // cuarta dimensión. Es pedido, no hueco nuestro.
    expect(adaptDrillDimensions(DIMENSIONES).dimensiones).toEqual(['day', 'week', 'platform'])
  })
})

describe('adaptDrillResult · renombra, y el valor lo adapta el que ya existe', () => {
  it('los ocho campos se renombran y el valor pasa por el adaptador de valores', () => {
    expect(adaptDrillResult(RESULTADO)).toEqual({
      panelId: '80158182-0000-0000-0000-000000000001',
      clave: 'sales',
      nombre: 'Sales',
      dimension: 'platform',
      periodo: '2026-09',
      filas: 39,
      consultadoEn: '2026-10-01T00:07:50.780199Z',
      valor: {
        ok: true,
        valor: {
          forma: 'categorica',
          items: [
            { etiqueta: 'Google PMax', v: 537180.1 },
            { etiqueta: 'Criteo', v: 0 },
          ],
        },
      },
    })
  })

  it('`row_count` se renombra y NO se deriva de los ítems', () => {
    // **39 contra 2.** Es la trampa del cable en chico: si el adaptador
    // «corrigiera» el número contándolos, la pantalla perdería el único dato que
    // dice cuántas filas devolvió la consulta — y el 39 real se iría sin aviso.
    const r = adaptDrillResult(RESULTADO)
    expect(r.filas).toBe(39)
    expect(r.valor.ok && r.valor.valor.forma === 'categorica' && r.valor.valor.items).toHaveLength(2)
  })

  it('`queried_at` se renombra y no se confunde con la frescura', () => {
    // No hay un campo de frescura en esta respuesta: nueve campos y **ninguno es
    // de procedencia**. `consultadoEn` dice cuándo se leyó, no cuándo se
    // materializó la métrica, y son siete horas de diferencia medidas.
    const r = adaptDrillResult(RESULTADO)
    expect(r.consultadoEn).toBe('2026-10-01T00:07:50.780199Z')
    expect(r).not.toHaveProperty('frescura')
  })

  it('el `shape` de RAÍZ no se lee · el valor trae el suyo', () => {
    // Está cableado a `"categorical"` del lado del servicio y `value.shape` lo
    // repite. Leer los dos sería una segunda fuente para el mismo dato, y se
    // separarían el día que una de las dos cambie. **Con la raíz en otra cosa el
    // resultado no cambia**, que es la forma de demostrar que no se lee.
    const raro = { ...RESULTADO, shape: 'scalar' } as unknown as WireDrillResult
    expect(adaptDrillResult(raro)).toEqual(adaptDrillResult(RESULTADO))
    expect(adaptDrillResult(raro)).not.toHaveProperty('forma')
  })

  it('un valor que NO adapta devuelve su RAZÓN, no un valor vacío', () => {
    // La hoja la pinta. Una caja vacía sería el panel que no dibuja y no explica.
    const malo = {
      ...RESULTADO,
      value: { shape: 'categorical' },
    } as unknown as WireDrillResult
    const r = adaptDrillResult(malo)
    expect(r.valor.ok).toBe(false)
    expect(r.valor.ok === false && r.valor.razon).toBe('Una categórica sin ítems.')
    // Y lo demás se renombra igual: un valor que no adapta no tira el resto.
    expect(r.filas).toBe(39)
    expect(r.dimension).toBe('platform')
  })

  it('con el nombre VACÍO el adaptador no compone uno', () => {
    // Componerlo —«Detalle de la métrica», el nombre de la pestaña, lo que sea—
    // sería escribir copy de producto en el adaptador. Pasa vacío y quien pinta
    // decide.
    expect(adaptDrillResult({ ...RESULTADO, metric_name: '' }).nombre).toBe('')
  })

  it('el nombre en INGLÉS no se traduce', () => {
    // El dueño del copy que describe datos es el catálogo. Una tabla de
    // traducción acá es la que nadie mantiene el día que cambie el texto de
    // origen; un texto en inglés en pantalla es un pedido a quien lo emite.
    expect(adaptDrillResult(RESULTADO).nombre).toBe('Sales')
  })
})

/** ── LO QUE EL DIBUJO PIDE Y EL CABLE NO TRAE ─────────────────────────────────
 *
 *  **Cada ausencia con una prueba que la atestigua, no con una aserción
 *  borrada.** Una prueba borrada no avisa el día que el campo aparece; ésta
 *  falla, y entonces hay que decidir qué hacer con él.
 */
describe('las ausencias quedan atestiguadas · F3.9', () => {
  const r = adaptDrillResult(RESULTADO)

  it('no hay filas crudas · la tabla origen del dibujo no tiene de dónde salir', () => {
    // El dibujo pide fecha, canal, órdenes, unidades y USD **por fila**. Lo que
    // llega es una etiqueta y un número por categoría.
    expect(r).not.toHaveProperty('filasCrudas')
    const items = r.valor.ok && r.valor.valor.forma === 'categorica' ? r.valor.valor.items : []
    expect(Object.keys(items[0] ?? {}).sort()).toEqual(['etiqueta', 'v'])
  })

  it('no hay linaje ni descarte entre capas', () => {
    // Las cuatro capas con sus conteos y el «18.380 filas … 1,4% del lote» no
    // existen en ningún campo. Lo que hay es UNA capa, y viene del panel.
    expect(r).not.toHaveProperty('linaje')
    expect(r).not.toHaveProperty('descarte')
    expect(r).not.toHaveProperty('capa')
  })

  it('no hay total de la desagregación ni porcentaje por ítem', () => {
    // El primero no viene; el segundo sería un cálculo. Y la suma de los ítems
    // **no es** la cifra publicada: medido 1 282 259 contra 1 232 721 por día, y
    // 968 169 por plataforma, que lee otra tabla.
    expect(r).not.toHaveProperty('total')
    const items = r.valor.ok && r.valor.valor.forma === 'categorica' ? r.valor.valor.items : []
    for (const i of items) expect(i).not.toHaveProperty('porcentaje')
  })

  it('no hay rótulo legible de la dimensión', () => {
    // `dimension` es la clave resuelta del registry, no su `Label`.
    expect(r.dimension).toBe('platform')
    expect(r).not.toHaveProperty('dimensionRotulo')
  })

  it('no hay gobierno: ni BASE, ni ventana, ni fuente', () => {
    // Nueve campos y ninguno es de procedencia. El encabezado de la hoja los toma
    // del panel de origen, que es lo que §8 exige de toda métrica.
    expect(r).not.toHaveProperty('base')
    expect(r).not.toHaveProperty('ventana')
    expect(r).not.toHaveProperty('fuente')
    expect(r).not.toHaveProperty('gobierno')
  })
})
