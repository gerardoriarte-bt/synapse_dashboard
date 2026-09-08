/** Qué granos puede ofrecer una pestaña · F1.7.
 *
 *  Regla citada del contrato: «las métricas de marca son **mensuales**
 *  —`BR_MONTH_TD`, `REPORT_MONTH`— y las de ecommerce diarias. Con el selector
 *  en una semana, una pestaña de marca no tiene nada que mostrar.» Y la decisión
 *  del 2026-08-19: «la métrica lo declara y el selector deshabilita lo que no
 *  aplica, con la razón visible».
 */
import { describe, expect, it } from 'vitest'
import { coarsestRequired, grainOf } from '@/surfaces/console/periodGrain'
import type { Metric, Period } from '@/api/types'

const metric = (granoMinimo: Metric['granoMinimo']) => ({ granoMinimo }) as Metric

describe('coarsestRequired · el panel más restrictivo manda', () => {
  it('una sola métrica mensual obliga a toda la pestaña a meses', () => {
    // Es el caso del contrato: mezclar una métrica de marca con las de
    // ecommerce en la misma pestaña.
    expect(coarsestRequired([metric('dia'), metric('dia'), metric('mes')])).toBe('mes')
  })

  it('con todas diarias no restringe nada', () => {
    expect(coarsestRequired([metric('dia'), metric('dia')])).toBe('dia')
  })

  it('semanal + diaria queda en semanal', () => {
    expect(coarsestRequired([metric('dia'), metric('semana')])).toBe('semana')
  })

  it('sin métricas no restringe · una pestaña vacía no deshabilita nada', () => {
    expect(coarsestRequired([])).toBe('dia')
  })

  it('sin `granoMinimo` cae al defecto del contrato, que es `dia`', () => {
    // El tipo generado lo declara SIEMPRE presente —el yaml le pone
    // `default: dia`, y openapi-typescript emite un defaulted como requerido—,
    // así que el `??` del código es defensa contra un servidor que lo omita
    // pese al contrato. Se prueba igual: el guard existe para el runtime, no
    // para el compilador.
    expect(coarsestRequired([metric(undefined as unknown as Metric['granoMinimo'])])).toBe('dia')
  })

  it('un valor que no está en la escala no rompe ni restringe de más', () => {
    // El contrato podría ganar un grano —un trimestre— antes de que este código
    // lo conozca. Ignorarlo es mejor que devolver `undefined` y dejar el
    // selector entero deshabilitado.
    expect(coarsestRequired([metric('trimestre' as Metric['granoMinimo'])])).toBe('dia')
  })
})

describe('grainOf · el defecto del contrato', () => {
  it('sin `grano` un período es mensual', () => {
    // `Periodo.grano` declara `default: mes` en el yaml.
    expect(grainOf({ id: '2026-07', etiqueta: 'JUL' } as Period)).toBe('mes')
  })

  it('con `grano` usa el que vino', () => {
    expect(grainOf({ id: '2026-W32', etiqueta: 'S32', grano: 'semana' } as Period)).toBe('semana')
  })
})
