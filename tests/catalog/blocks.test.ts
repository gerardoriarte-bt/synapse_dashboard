/** `soleTypeFor` · dibujar por la forma sin elegir a dedo · §7, 2026-10-08
 *
 *  La regla tiene dos mitades y las dos importan: con UN tipo que acepta la
 *  forma, ése; con dos o más, ninguno. La segunda es la que impide que el chat
 *  decida solo si un escalar es una cifra o un medidor.
 */
import { describe, expect, it } from 'vitest'
import { blockTable, soleTypeFor } from '@/catalog/blocks'
import type { Block } from '@/catalog/types'

const bloque = (tipo: string, formasAceptadas: string[]) =>
  ({
    tipo,
    formasAceptadas,
    colSpanMin: 3, colSpanMax: 12, rowSpanMin: 3, rowSpanMax: 6,
    paramsDisponibles: [],
  }) as unknown as Block

/** Recortada de `GET /config/blocks` del binario `9dc481e`, leída el
 *  2026-10-08, **ya adaptada**: `blocked` llega con `["*"]` y `adapt.ts` lo
 *  expande a las formas dibujables. La primera versión de esta prueba le
 *  dejaba el comodín del cable, y por eso no vio el defecto. */
const tabla = blockTable([
  bloque('kpi', ['escalar']),
  bloque('gauge', ['escalar']),
  bloque('table', ['tabular']),
  bloque('bars', ['categorica', 'ranking']),
  bloque('list', ['ranking']),
  bloque('blocked', ['escalar', 'tabular', 'categorica', 'ranking']),
])

describe('soleTypeFor', () => {
  it('una forma que un solo tipo acepta devuelve ese tipo', () => {
    expect(soleTypeFor(tabla, 'tabular')).toBe('table')
    expect(soleTypeFor(tabla, 'categorica')).toBe('bars')
  })

  it('con dos candidatos o más devuelve null, no el primero', () => {
    expect(soleTypeFor(tabla, 'escalar')).toBeNull()
    expect(soleTypeFor(tabla, 'ranking')).toBeNull()
  })

  it('una forma que nadie acepta devuelve null', () => {
    expect(soleTypeFor(tabla, 'grafo')).toBeNull()
  })

  it('`blocked` no cuenta como candidato aunque acepte todo', () => {
    // Si contara, `tabular` tendría dos candidatos y dejaría de dibujarse.
    expect(soleTypeFor(tabla, 'tabular')).toBe('table')
  })
})
