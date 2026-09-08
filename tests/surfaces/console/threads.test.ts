/** El agrupado del riel · F3.7
 *
 *  Puro y sin React: el agrupado es una decisión de presentación con reglas
 *  —hoy, esta semana, el mes— y esas reglas se prueban con fechas, no montando
 *  una lista.
 *
 *  El contrato delega esto al front explícitamente: «el agrupado por tiempo
 *  —HOY, ESTA SEMANA, JULIO— lo hace el front: es presentación y depende del
 *  huso del usuario».
 */
import { describe, expect, it } from 'vitest'
import { groupByRecency } from '@/surfaces/console/threads'
import { createFormat } from '@/render/format'
import type { ThreadSummary } from '@/api/types'

const format = createFormat('es-MX')
const AHORA = new Date('2026-09-04T15:00:00')

const hilo = (id: string, actualizadoEn: string): ThreadSummary => ({
  id,
  titulo: `pregunta ${id}`,
  creadoEn: actualizadoEn,
  actualizadoEn,
  esDecision: false,
})

describe('los tres escalones', () => {
  it('lo de hoy va en Hoy, aunque sea de la madrugada', () => {
    // Contra medianoche LOCAL y no contra «hace 24 horas»: a las 15:00 un hilo
    // de las 02:00 de hoy sigue siendo de hoy.
    const grupos = groupByRecency([hilo('a', '2026-09-04T02:00:00')], AHORA, format)
    expect(grupos.map((g) => g.label)).toEqual(['Hoy'])
  })

  it('ayer NO es hoy, aunque hayan pasado menos de 24 horas', () => {
    const grupos = groupByRecency([hilo('a', '2026-09-03T23:00:00')], AHORA, format)
    expect(grupos[0]?.label).toBe('Esta semana')
  })

  it('más de siete días atrás cae en su mes', () => {
    const grupos = groupByRecency([hilo('a', '2026-07-15T10:00:00')], AHORA, format)
    expect(grupos[0]?.label).toBe('julio')
  })

  it('los tres a la vez, en el orden en que vinieron', () => {
    const grupos = groupByRecency(
      [
        hilo('hoy', '2026-09-04T09:00:00'),
        hilo('semana', '2026-09-01T09:00:00'),
        hilo('julio', '2026-07-20T09:00:00'),
      ],
      AHORA,
      format,
    )
    expect(grupos.map((g) => g.label)).toEqual(['Hoy', 'Esta semana', 'julio'])
  })
})

describe('el mes del año pasado lleva el año, y no es un detalle', () => {
  it('«julio 2025» y «julio» son grupos distintos y se distinguen', () => {
    // La retención es de 12 meses y el contrato nombra «reabrir la consulta del
    // mismo mes del año previo». Sin el año, dos grupos se llamarían igual.
    const grupos = groupByRecency(
      [hilo('a', '2026-07-20T09:00:00'), hilo('b', '2025-07-20T09:00:00')],
      AHORA,
      format,
    )
    expect(grupos.map((g) => g.label)).toEqual(['julio', 'julio 2025'])
  })
})

describe('no reordena · el orden lo decide el backend', () => {
  it('conserva el orden de llegada dentro de cada grupo', () => {
    const grupos = groupByRecency(
      [hilo('primero', '2026-09-04T09:00:00'), hilo('segundo', '2026-09-04T08:00:00')],
      AHORA,
      format,
    )
    expect(grupos[0]?.threads.map((t) => t.id)).toEqual(['primero', 'segundo'])
  })

  it('una lista desordenada deja DOS bloques del mismo mes, a la vista', () => {
    // Fundirlos escondería que el backend mandó algo raro. El contrato promete
    // orden por `actualizadoEn`; si no llega así, se ve.
    const grupos = groupByRecency(
      [
        hilo('a', '2026-07-20T09:00:00'),
        hilo('b', '2026-09-04T09:00:00'),
        hilo('c', '2026-07-19T09:00:00'),
      ],
      AHORA,
      format,
    )
    expect(grupos.map((g) => g.label)).toEqual(['julio', 'Hoy', 'julio'])
  })
})

describe('sin hilos', () => {
  it('no inventa grupos vacíos', () => {
    expect(groupByRecency([], AHORA, format)).toEqual([])
  })
})
