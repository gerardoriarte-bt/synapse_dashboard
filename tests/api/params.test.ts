/** La validación de params de layout · F1.29.
 *
 *  Criterio citado: «Un param desconocido se descarta con aviso en desarrollo;
 *  uno inválido degrada el panel con razón visible. **Nunca se ignora en
 *  silencio.**»
 */
import { describe, expect, it } from 'vitest'
import { PARAM_SCHEMAS, knownParams, validateParams } from '@/api/params'
import type { PanelType } from '@/api/types'

describe('el defecto que esto arregla', () => {
  it('`orden: "ascending"` ya no se ignora · el caso literal del plan', () => {
    // Antes el cuerpo aplicaba su default `desc` y el panel se veía correcto
    // mostrando exactamente lo contrario de lo que alguien configuró.
    const r = validateParams('bars', { orden: 'ascending' })

    expect(r.params).toEqual({})
    expect(r.invalid).toHaveLength(1)
    expect(r.invalid[0]?.param).toBe('orden')
    // La razón nombra el valor que llegó y los que se admiten: sin eso, quien
    // compone no sabe qué escribir.
    expect(r.invalid[0]?.reason).toContain('"ascending"')
    expect(r.invalid[0]?.reason).toContain('«asc»')
  })

  it('el valor correcto sí pasa', () => {
    expect(validateParams('bars', { orden: 'asc' }).params).toEqual({ orden: 'asc' })
  })
})

describe('desconocido y descartado ≠ conocido e inválido', () => {
  it('un nombre que nadie lee se descarta, no degrada', () => {
    // Un param de más es ruido de configuración; no impide dibujar el panel.
    const r = validateParams('bars', { orden: 'desc', colorcito: 'azul' })
    expect(r.params).toEqual({ orden: 'desc' })
    expect(r.unknown).toEqual(['colorcito'])
    expect(r.invalid).toEqual([])
  })

  it('un nombre conocido con valor malo SÍ degrada', () => {
    // Acá el panel no se puede dibujar como se pidió, y usar el default sería
    // mostrar otra cosa sin decirlo.
    const r = validateParams('list', { tope: 0 })
    expect(r.invalid).toHaveLength(1)
    expect(r.params).toEqual({})
  })
})

describe('paramsDisponibles manda sobre los nombres · viene del backend', () => {
  it('un param que el bloque no declara se descarta aunque el front lo conozca', () => {
    // Los NOMBRES los declara /config/blocks; los VALORES, la tabla del front.
    const r = validateParams('bars', { orden: 'desc', tope: 5 }, ['orden'])
    expect(r.params).toEqual({ orden: 'desc' })
    expect(r.unknown).toEqual(['tope'])
  })

  it('sin `paramsDisponibles` valida solo contra el esquema local', () => {
    // El catálogo de bloques es una llamada aparte y puede fallar sola: menos
    // cobertura es mejor que no validar.
    const r = validateParams('bars', { orden: 'desc', tope: 5 }, undefined)
    expect(r.params).toEqual({ orden: 'desc', tope: 5 })
  })
})

describe('los tipos de valor', () => {
  it('un número donde va un entero positivo', () => {
    expect(validateParams('list', { tope: 5 }).invalid).toEqual([])
    expect(validateParams('list', { tope: 2.5 }).invalid).toHaveLength(1)
    expect(validateParams('list', { tope: -1 }).invalid).toHaveLength(1)
    expect(validateParams('list', { tope: '5' }).invalid).toHaveLength(1)
    expect(validateParams('list', { tope: Number.NaN }).invalid).toHaveLength(1)
  })

  it('un objeto no es una lista y una lista no es un objeto', () => {
    expect(validateParams('table', { columnas: ['a', 'b'] }).invalid).toEqual([])
    expect(validateParams('table', { columnas: { a: 1 } }).invalid).toHaveLength(1)
    expect(validateParams('kpi', { medidor: { label: 'x', porcentaje: 50 } }).invalid).toEqual([])
    expect(validateParams('kpi', { medidor: [1, 2] }).invalid).toHaveLength(1)
  })

  it('`null` no pasa por objeto · `typeof null` es "object"', () => {
    expect(validateParams('kpi', { medidor: null }).invalid).toHaveLength(1)
  })

  it('`maximo: 0` de gauge es válido como número y el cuerpo lo rechaza aparte', () => {
    // Cero pasa la validación de forma —es un número ≥ 0— y `GaugeBody` lo trata
    // como «sin máximo declarado». Son dos cosas distintas: acá se valida la
    // FORMA del param, no si el panel puede dibujarse con él.
    expect(validateParams('gauge', { maximo: 0 }).invalid).toEqual([])
  })
})

describe('sin params, sin problema', () => {
  it('`opciones` ausente da params vacíos y nada que reportar', () => {
    const r = validateParams('kpi', undefined)
    expect(r).toEqual({ params: {}, unknown: [], invalid: [] })
  })

  it('un tipo sin esquema descarta todo en vez de dejar pasar todo', () => {
    // `matrix` no tiene cuerpo todavía: nada lee sus params, así que nada se
    // valida como bueno.
    const r = validateParams('matrix', { escala: 'log' })
    expect(r.params).toEqual({})
    expect(r.unknown).toEqual(['escala'])
  })
})

describe('la tabla local cubre lo que los cuerpos leen', () => {
  it('los doce tipos construidos tienen esquema', () => {
    const built: PanelType[] = [
      'kpi', 'prose', 'series', 'bars', 'table', 'gauge',
      'forecast', 'list', 'reco', 'composition', 'distribution', 'blocked',
    ]
    for (const type of built) {
      expect(PARAM_SCHEMAS[type], `falta el esquema de ${type}`).toBeDefined()
    }
  })

  it('`knownParams` expone los nombres para poder comparar con el contrato', () => {
    // Es lo que permitiría un chequeo de deriva contra `paramsDisponibles`.
    expect(knownParams('list').sort()).toEqual(['orden', 'tope'])
    expect(knownParams('matrix')).toEqual([])
  })
})
