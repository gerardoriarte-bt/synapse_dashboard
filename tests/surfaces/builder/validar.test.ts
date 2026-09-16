/** Validación de composición del lado del front · F4.11
 *
 *  **Usa las mismas funciones que la consola** —`catalog/blocks.ts` y
 *  `api/params.ts`—, así que lo que se prueba acá no son las reglas sino que se
 *  apliquen sobre el borrador entero y que cada problema diga **dónde** y **por
 *  qué**. «Composición inválida» no sirve: la diferencia es entre «arreglá esto»
 *  y «buscá cuál de los doce».
 */
import { describe, expect, it } from 'vitest'
import { blockTable } from '@/catalog/blocks'
import { porPestana, validarBorrador } from '@/surfaces/builder/validar'
import type { Block, Metric } from '@/api/types'
import type { TabParaGuardar } from '@/api/admin'

const bloques: Block[] = [
  {
    tipo: 'kpi',
    formasAceptadas: ['escalar'],
    colSpanMin: 3,
    colSpanMax: 4,
    rowSpanMin: 3,
    rowSpanMax: 4,
    paramsDisponibles: ['medidor'],
  },
  {
    tipo: 'bars',
    formasAceptadas: ['categorica'],
    colSpanMin: 4,
    colSpanMax: 12,
    rowSpanMin: 4,
    rowSpanMax: 8,
    paramsDisponibles: ['orden', 'tope'],
  },
]
const tabla = blockTable(bloques)

const metrica = (id: string, forma: Metric['forma']): Metric => ({
  id,
  key: id,
  nombre: id,
  forma,
  familia: 'demanda',
  capa: 'GOLD',
  fuente: 'ERP',
  ventana: '',
  base: 'x',
  estado: 'DISPONIBLE',
  granoMinimo: 'dia',
  catalogVersion: 1,
})
const metrics = [metrica('m-escalar', 'escalar'), metrica('m-cat', 'categorica')]

const tab = (panels: TabParaGuardar['panels']): TabParaGuardar => ({
  id: 't',
  nombre: 'Resumen',
  pregunta: '¿Cómo vamos?',
  orden: 1,
  roles: [],
  panels,
})

const panel = (extra: Partial<TabParaGuardar['panels'][number]> = {}) => ({
  id: 'p',
  metricId: 'm-escalar',
  tipo: 'kpi',
  colStart: 1,
  colSpan: 3,
  rowSpan: 4,
  ...extra,
})

describe('un borrador que cierra no tiene problemas', () => {
  it('sin problemas', () => {
    expect(validarBorrador([tab([panel()])], tabla, metrics)).toEqual([])
  })
})

describe('el tipo contra la forma de la métrica', () => {
  it('dice cuál bloque y cuál forma, no «inválido»', () => {
    // El criterio de F4.11: «un tipo incompatible con la forma de la métrica se
    // marca con la razón, no con “inválido”».
    const p = validarBorrador([tab([panel({ metricId: 'm-cat' })])], tabla, metrics)
    expect(p).toHaveLength(1)
    expect(p[0]?.mensaje).toContain('kpi')
    expect(p[0]?.mensaje).toContain('categorica')
    expect(p[0]?.campo).toBe('tipo')
  })

  it('un span fuera de rango dice el rango y lo que se pidió', () => {
    const p = validarBorrador([tab([panel({ colSpan: 9 })])], tabla, metrics)
    expect(p[0]?.mensaje).toMatch(/entre 3 y 4 columnas.*9/)
  })
})

describe('la métrica', () => {
  it('sin métrica lo dice en la lengua del producto', () => {
    const p = validarBorrador([tab([panel({ metricId: '' })])], tabla, metrics)
    expect(p[0]?.campo).toBe('metricId')
    expect(p[0]?.mensaje).toMatch(/se ancla a un metricId/)
  })

  it('una métrica que salió del catálogo se declara SIN pintar el id', () => {
    // Es la mitad local de B4.11. Quien compone no puede hacer nada con un UUID.
    const p = validarBorrador([tab([panel({ metricId: 'm-borrada' })])], tabla, metrics)
    expect(p).toHaveLength(1)
    expect(p[0]?.mensaje).toMatch(/ya no está en el catálogo/)
    expect(p[0]?.mensaje).not.toContain('m-borrada')
  })

  it('sin métrica NO se pregunta además por la forma', () => {
    // Un panel sin métrica daría también «kpi no sabe dibujar undefined», que es
    // ruido: el problema es uno y tiene una salida.
    expect(validarBorrador([tab([panel({ metricId: '' })])], tabla, metrics)).toHaveLength(1)
  })
})

describe('los params', () => {
  it('un valor inválido se explica con lo que el esquema espera', () => {
    const p = validarBorrador(
      [tab([panel({ tipo: 'bars', metricId: 'm-cat', colSpan: 6, opciones: { tope: 0 } })])],
      tabla,
      metrics,
    )
    expect(p[0]?.campo).toBe('tope')
    expect(p[0]?.mensaje).toMatch(/espera un número entero/)
  })

  it('un param que el tipo no lee se declara descartado, no inválido', () => {
    // «Desconocido y descartado ≠ conocido e inválido», y la diferencia es de
    // consecuencia · F1.29.
    const p = validarBorrador(
      [tab([panel({ tipo: 'bars', metricId: 'm-cat', colSpan: 6, opciones: { maximo: 9 } })])],
      tabla,
      metrics,
    )
    expect(p[0]?.mensaje).toMatch(/se va a descartar/)
  })
})

describe('la pestaña', () => {
  it('la pregunta vacía sale con la regla del producto', () => {
    const p = validarBorrador([{ ...tab([panel()]), pregunta: '' }], tabla, metrics)
    expect(p[0]?.panel).toBeNull()
    expect(p[0]?.mensaje).toMatch(/no se compone/)
  })

  it('una pestaña SIN paneles NO es un problema', () => {
    // Deliberado, y escrito: era la regla obvia de agregar y no está en ningún
    // lado — §7.2 B2 hasta contempla el slot vacío. Inventarla haría que el
    // front bloqueara una publicación que el servidor acepta.
    expect(validarBorrador([tab([])], tabla, metrics)).toEqual([])
  })
})

describe('la dirección · qué pestaña y qué panel', () => {
  it('apunta por ÍNDICE, porque lo nuevo no tiene id', () => {
    const borrador = [
      tab([panel()]),
      // Sin `id`: es una pestaña recién agregada, que es el caso que obliga a
      // direccionar por índice.
      (({ id: _, ...resto }) => resto)({ ...tab([panel({ metricId: 'm-cat' })]), nombre: 'Nueva' }),
    ]
    const p = validarBorrador(borrador, tabla, metrics)
    expect(p).toHaveLength(1)
    expect(p[0]?.tab).toBe(1)
    expect(p[0]?.panel).toBe(0)
  })

  it('porPestana cuenta por índice', () => {
    const borrador = [
      { ...tab([panel({ metricId: '' }), panel({ metricId: 'm-cat' })]), pregunta: '' },
      tab([panel()]),
    ]
    expect(porPestana(validarBorrador(borrador, tabla, metrics))).toEqual(new Map([[0, 3]]))
  })
})
