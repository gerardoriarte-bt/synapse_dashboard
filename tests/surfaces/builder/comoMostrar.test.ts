/** Cómo se puede mostrar un dato · 2026-11-10
 *
 *  La biblioteca del editor es de datos: dado uno, qué tipos y qué gráficos lo
 *  dibujan, y por qué no los demás. Decisión humana de ese día: lo que no
 *  sirve se ve DESACTIVADO CON SU RAZÓN, no escondido.
 *
 *  El repertorio es el de `tests/catalog/plots.test.ts`, capturado de
 *  `GET /config/plots`: la dona tiene un tope de cinco partes.
 */
import { describe, expect, it } from 'vitest'
import { comoMostrar } from '@/surfaces/builder/comoMostrar'
import { leerEleccion } from '@/surfaces/builder/eleccion'
import { plotTable } from '@/catalog/plots'
import type { Block, Metric, Payload, Plot } from '@/api/types'

const PLOTS = [
  {
    id: 'donut',
    nombre: 'DONA',
    formas: ['categorica', 'composicion'],
    soportaBanda: false,
    minimos: [{ forma: 'composicion', cuando: 'partes < 2', razon: 'una parte sola es el 100 %' }],
    tope: { cuando: 'partes > 5', razon: 'más de cinco partes, ilegible en dona' },
  },
] as unknown as Plot[]

const BLOQUES = [
  {
    tipo: 'composition',
    formasAceptadas: ['composicion'],
    colSpanMin: 4,
    colSpanMax: 8,
    rowSpanMin: 4,
    rowSpanMax: 5,
  },
  {
    tipo: 'kpi',
    formasAceptadas: ['escalar'],
    colSpanMin: 3,
    colSpanMax: 4,
    rowSpanMin: 3,
    rowSpanMax: 4,
  },
  {
    tipo: 'blocked',
    formasAceptadas: [],
    colSpanMin: 3,
    colSpanMax: 12,
    rowSpanMin: 3,
    rowSpanMax: 6,
  },
] as unknown as Block[]

const MIX = { id: 'm-mix', nombre: 'Mezcla de canales', forma: 'composicion' } as unknown as Metric

const conPartes = (n: number) =>
  ({
    estado: 'DISPONIBLE',
    valor: {
      forma: 'composicion',
      partes: Array.from({ length: n }, (_, i) => ({
        etiqueta: `p${String(i)}`,
        v: 1,
        porcentaje: 100 / n,
      })),
    },
  }) as unknown as Payload

describe('lo que sirve y lo que no', () => {
  it('primero los tipos que dibujan la forma, después los que no, con su razón', () => {
    const r = comoMostrar(MIX, BLOQUES, PLOTS, plotTable(PLOTS), undefined)
    expect(r.map((x) => x.tipo)).toEqual(['composition', 'kpi'])
    expect(r[0]?.razon).toBeNull()
    expect(r[1]?.razon).toBe('Dibuja Cifra única · este dato es Partes de un total')
    // El tipo `blocked` no se ofrece: no es una forma de mostrar nada.
    expect(r.some((x) => x.tipo === 'blocked')).toBe(false)
  })

  it('cada tipo que sirve ofrece el de por defecto y los gráficos de esa forma', () => {
    const r = comoMostrar(MIX, BLOQUES, PLOTS, plotTable(PLOTS), undefined)
    expect(r[0]?.opciones.map((o) => o.grafico)).toEqual([undefined, 'donut'])
  })
})

describe('con el dato a mano, el tope se evalúa', () => {
  it('ocho partes desactivan la dona, con la razón del repertorio', () => {
    const r = comoMostrar(MIX, BLOQUES, PLOTS, plotTable(PLOTS), conPartes(8))
    const dona = r[0]?.opciones.find((o) => o.grafico === 'donut')
    expect(dona?.razon).toBe('más de cinco partes, ilegible en dona')
    // El de por defecto sigue disponible: el tope es del gráfico, no del tipo.
    expect(r[0]?.opciones[0]?.razon).toBeNull()
  })

  it('tres partes la dejan disponible', () => {
    const r = comoMostrar(MIX, BLOQUES, PLOTS, plotTable(PLOTS), conPartes(3))
    expect(r[0]?.opciones.find((o) => o.grafico === 'donut')?.razon).toBeNull()
  })

  it('sin dato no se desactiva por tope · no se sabe', () => {
    const r = comoMostrar(MIX, BLOQUES, PLOTS, plotTable(PLOTS), undefined)
    expect(r[0]?.opciones.find((o) => o.grafico === 'donut')?.razon).toBeNull()
  })
})

describe('la elección que viaja en el arrastre', () => {
  it('se lee con su dato y su gráfico', () => {
    expect(
      leerEleccion(JSON.stringify({ metricId: 'm-1', tipo: 'kpi', grafico: 'bullet' }), 'kpi'),
    ).toEqual({
      metricId: 'm-1',
      tipo: 'kpi',
      grafico: 'bullet',
    })
  })

  it('una que no coincide con el tipo medido se DESCARTA · el panel quedaría mal medido', () => {
    expect(leerEleccion(JSON.stringify({ metricId: 'm-1', tipo: 'series' }), 'kpi')).toBeNull()
  })

  it('vacía o rota no es una elección', () => {
    expect(leerEleccion('', 'kpi')).toBeNull()
    expect(leerEleccion('kpi', 'kpi')).toBeNull()
  })
})
