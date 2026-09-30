// @vitest-environment jsdom

/** Los tres cuerpos de las formas v1.1 · F4.17, F4.18 y F4.19 · 2026-09-30
 *
 *  ── QUÉ CUBRE ESTO Y NO CUBREN LAS PRUEBAS DE PLOT ──────────────────────────
 *
 *  `dumbbell.test.tsx`, `mapaDeCalor.test.tsx` y `flujo.test.tsx` rinden **el
 *  plot directo**: verifican la geometría y dejan sin cubrir lo único que esta
 *  capa decide. Es la misma distinción que cerró `graficoViaja.test.tsx` el
 *  2026-09-28 —nueve pruebas rendían el cuerpo y ninguna seguía el id por los
 *  cuatro saltos—, y el modo de falla es el mismo: **el spread condicional de
 *  JSX apaga el chequeo de props en exceso**, así que una prop mal nombrada en
 *  cualquiera de estos cuerpos compila.
 *
 *  Lo que se verifica acá es el DESPACHO, y son cuatro decisiones que no están
 *  en ningún plot:
 *
 *  1. **La rama por forma**, antes que la de gráfico. Los tres bloques hospedan
 *     dos formas —`comparison` y `graph`— o una sola pero con cuatro gráficos
 *     —`matrix`—, y una forma sin dibujo **no cae a la que sí lo tiene**.
 *  2. **La guardia de densidad de la matriz**, que `PlotHeatmap` dejó anotada
 *     como pendiente en su propio comentario.
 *  3. **El `EmptyState` de la comparación sin referencia**, que es lo que el
 *     esquema del contrato pide que se diga en vez de inventar un objetivo.
 *  4. **Que cada uno se pueda montar por el REGISTRO**, que es el camino real:
 *     ninguna superficie importa un cuerpo directo.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ComparisonBody } from '@/render/bodies/ComparisonBody'
import { GraphBody } from '@/render/bodies/GraphBody'
import { MatrixBody } from '@/render/bodies/MatrixBody'
import { LOADERS } from '@/render/bodies/registry'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const base = {
  span: { colStart: 1, colSpan: 6, rowSpan: 5 },
  family: 'medios',
  metric: 'Inversión',
  format,
} as const

const valor = <F extends Value['forma']>(v: unknown) => v as unknown as Extract<Value, { forma: F }>

/* ── LOS FIXTURES SON LA SALIDA REAL, RECORTADA ──────────────────────────────
 *
 * Capturados de `dd_panel_data` del servicio local el 2026-09-30, después de
 * correr contra Snowflake las tres entradas de `MetricRegistry` que escribimos.
 * Se recortan FILAS y no campos: un fixture inventado verifica el fixture.
 */

/** `platform_gap`, tres de sus 37 ítems. El tercero llega sin `reference`, que
 *  es el caso real de quince de ellos. */
const COMPARADA = valor<'categoricaComparada'>({
  forma: 'categoricaComparada',
  items: [
    { etiqueta: 'Google PMax', v: 502449.76, referencia: 85134.28, delta: 417315.48 },
    { etiqueta: 'MGID', v: 221.48, referencia: 7842.45, delta: -7620.97 },
    { etiqueta: 'YouTube', v: 12455.52 },
  ],
})

/** La misma, sin una sola referencia. Es lo que devolvería la métrica el día que
 *  `COST_USD` no sume nada en ninguna plataforma. */
const COMPARADA_SIN_REFERENCIA = valor<'categoricaComparada'>({
  forma: 'categoricaComparada',
  items: [
    { etiqueta: 'YouTube', v: 12455.52 },
    { etiqueta: 'Spotify', v: 0 },
  ],
})

const PERFIL = valor<'perfilMultiatributo'>({
  forma: 'perfilMultiatributo',
  perfiles: [
    {
      etiqueta: 'Under Armour',
      atributos: [
        { clave: 'NOTORIEDAD', v: 72 },
        { clave: 'RELEVANCIA', v: 64 },
        { clave: 'CALIDAD', v: 81 },
      ],
    },
  ],
})

/** `platform_month_matrix`, dos filas por dos meses. El `null` es real: la
 *  plataforma no tuvo inversión ese mes. */
const MATRIZ = valor<'matriz'>({
  forma: 'matriz',
  filas: ['Criteo', 'Adsmovil'],
  columnas: ['2025-10', '2025-11'],
  celdas: [
    [7933.11, 1939.7],
    [1766.49, null],
  ],
})

/** `spend_flow`, dos plataformas hacia el nodo `total`. */
const FLUJO = valor<'flujo'>({
  forma: 'flujo',
  etapas: [
    { id: 'Dailymotion', etiqueta: 'Dailymotion', v: 1883185 },
    { id: 'TikTok', etiqueta: 'TikTok', v: 18358.88 },
    { id: 'total', etiqueta: 'Total invertido', v: 1901543.88 },
  ],
  enlaces: [
    { desde: 'Dailymotion', hacia: 'total', v: 1883185 },
    { desde: 'TikTok', hacia: 'total', v: 18358.88 },
  ],
})

const GRAFO = valor<'grafo'>({
  forma: 'grafo',
  nodos: [
    { id: 'a', etiqueta: 'Primera compra' },
    { id: 'b', etiqueta: 'Segunda compra' },
  ],
  aristas: [{ desde: 'a', hacia: 'b', peso: 12 }],
})

describe('ComparisonBody · dos formas, un dibujo', () => {
  it('`categoricaComparada` sin gráfico declarado dibuja el dumbbell', () => {
    render(<ComparisonBody {...base} value={COMPARADA} params={{}} />)
    // **Dos de los tres ítems**, no tres: `PlotDumbbell` descarta el que no trae
    // referencia, y el conteo del `aria-label` es lo único que lo delata.
    expect(screen.getByRole('img', { name: '2 categorías con su referencia y su brecha' })).toBeVisible()
  })

  it('`perfilMultiatributo` NO se sirve como dumbbell · nombra `radar`', () => {
    // La rama por FORMA, y es la que un `BodyProps<'categoricaComparada'>` no
    // habría impedido: el registro ancha `value` a la unión entera, así que el
    // tipo estrecho sólo esconde la rama.
    render(<ComparisonBody {...base} value={PERFIL} params={{}} />)

    expect(screen.getByText(/radar/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /categorías/ })).toBeNull()
  })

  it('un gráfico que no dibuja se declara · `tornado` NO cae al dumbbell', () => {
    // `tornado` es de los 49 y sirve `compared_categorical`: un layout lo puede
    // pedir legítimamente y acá no hay componente.
    render(<ComparisonBody {...base} value={COMPARADA} params={{}} grafico="tornado" />)

    expect(screen.getByText(/tornado/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /categorías/ })).toBeNull()
  })

  it('sin ninguna `referencia` dice qué falta · y NO dibuja un SVG vacío', () => {
    render(<ComparisonBody {...base} value={COMPARADA_SIN_REFERENCIA} params={{}} />)

    // **El texto exacto y no «hay un estado»**: sin la guardia el panel también
    // se queda sin dibujo —`PlotDumbbell` filtra las dos filas— así que una
    // aserción laxa no distinguiría nada. Es la mutación que sobrevivió el
    // 2026-09-29 en la guardia del repertorio vacío, con otra cara.
    expect(screen.getByText('Ninguna categoría trae contra qué compararse')).toBeVisible()
    expect(screen.queryByRole('img')).toBeNull()
    // Y es «Sin datos», no «Gráfico no disponible»: el dibujo se sabe hacer.
    expect(screen.queryByText(/todavía no lo dibuja/)).toBeNull()
  })
})

describe('MatrixBody · la guardia de densidad que el plot dejó anotada', () => {
  it('la matriz densa se dibuja, con su celda vacía', () => {
    render(<MatrixBody {...base} value={MATRIZ} params={{}} />)
    expect(screen.getByRole('img', { name: '2 × 2 celdas en mapa de calor' })).toBeVisible()
  })

  it('menos filas de celdas que etiquetas · lo dice con los dos números', () => {
    const rala = valor<'matriz'>({ ...MATRIZ, celdas: [[7933.11, 1939.7]] })
    render(<MatrixBody {...base} value={rala} params={{}} />)

    // **Los dos números, no sólo que haya un estado.** `PlotHeatmap` con una
    // fila de menos dibuja una rejilla prolija de una fila —no revienta— así que
    // una aserción sobre «hay error» pasaría sin la guardia puesta.
    expect(screen.getByText(/2 etiquetas de fila y 1 filas de celdas/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /celdas en mapa de calor/ })).toBeNull()
  })

  it('una fila corta · nombra CUÁL y cuántas columnas hay', () => {
    const corta = valor<'matriz'>({ ...MATRIZ, celdas: [[7933.11, 1939.7], [1766.49]] })
    render(<MatrixBody {...base} value={corta} params={{}} />)

    // La fila 2 en base 1, que es cómo la cuenta quien mira la pantalla.
    expect(screen.getByText(/la fila 2 trae 1 celdas y hay 2 columnas/)).toBeVisible()
  })

  it('`cohort` NO se sirve como mapa de calor', () => {
    // Los tres que faltan —`cohort`, `calendar`, `matrix`— son la misma rejilla
    // con otra lectura, así que caer a `heatmap` se vería correcto.
    render(<MatrixBody {...base} value={MATRIZ} params={{}} grafico="cohort" />)

    expect(screen.getByText(/cohort/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /celdas en mapa de calor/ })).toBeNull()
  })
})

describe('GraphBody · `flujo` dibuja, `grafo` se declara', () => {
  it('`flujo` sin gráfico declarado dibuja el sankey', () => {
    render(<GraphBody {...base} value={FLUJO} params={{}} />)
    expect(screen.getByRole('img', { name: /flujo de 3 etapas y 2 enlaces/ })).toBeVisible()
  })

  it('`grafo` NO se sirve como sankey · nombra `network`', () => {
    // Sin esta rama `PlotSankey` leería `etapas` de un valor que trae `nodos`:
    // `undefined`, y el SVG saldría vacío sin decir por qué.
    render(<GraphBody {...base} value={GRAFO} params={{}} />)

    expect(screen.getByText(/network/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /flujo de/ })).toBeNull()
  })

  it('`funnel` NO se sirve como sankey', () => {
    // Un embudo dibujado como flujo se ve perfecto y miente sobre qué se mira —y
    // además `transformFlow` deriva el valor de cada etapa de su flujo SALIENTE,
    // así que la última mostraría el de la anterior.
    render(<GraphBody {...base} value={FLUJO} params={{}} grafico="funnel" />)

    expect(screen.getByText(/funnel/)).toBeVisible()
    expect(screen.queryByRole('img', { name: /flujo de/ })).toBeNull()
  })
})

describe('los tres se montan POR EL REGISTRO, que es el camino real', () => {
  // Ninguna superficie importa un cuerpo directo: `bodyFor` resuelve el `lazy` y
  // el cargador es lo único que ata el `tipo` del panel a este archivo. Un
  // cargador que apunte al cuerpo equivocado compila.
  it.each([
    ['comparison', ComparisonBody],
    ['matrix', MatrixBody],
    ['graph', GraphBody],
  ] as const)('%s resuelve al cuerpo que le toca', async (tipo, esperado) => {
    const { default: Body } = await LOADERS[tipo]()
    // `memo` envuelve el componente, así que se compara el envuelto.
    expect((Body as unknown as { type: unknown }).type).toBe(esperado)
  })
})
