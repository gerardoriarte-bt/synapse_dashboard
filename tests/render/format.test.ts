/** El formateador · F1.13b.
 *
 *  Las cifras esperadas salen del `.pen` —son las que el diseño ya escribe— y no
 *  de correr el código y copiar lo que dio.
 */
import { describe, expect, it } from 'vitest'
import { createFormat } from '@/render/format'

const fmt = createFormat('es-MX')

describe('el locale se inyecta, no se importa', () => {
  it('dos formateadores con locales distintos producen cifras distintas', () => {
    // Es la prueba de que la inyección sirve para algo. En v2 el locale era una
    // constante de módulo y esta prueba no se podía escribir.
    expect(createFormat('es-MX').number(1284500)).toBe('1,284,500')
    expect(createFormat('de-DE').number(1284500)).toBe('1.284.500')
  })

  it('expone con qué locale se construyó', () => {
    expect(createFormat('es-MX').locale).toBe('es-MX')
  })
})

describe('cifras · es-MX separa miles con coma y decimales con punto', () => {
  it('escribe los números que el .pen ya escribe', () => {
    expect(fmt.number(1284500)).toBe('1,284,500')
    expect(fmt.number(48210)).toBe('48,210')
    expect(fmt.number(6.4)).toBe('6.4')
  })

  it('rechaza lo que no es un número finito', () => {
    expect(() => fmt.number(Number.NaN)).toThrow(RangeError)
    expect(() => fmt.number(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe('abreviar no puede perder precisión', () => {
  it('reproduce las abreviaturas del .pen cuando son exactas', () => {
    expect(fmt.number(4280000, { abbreviate: true })).toBe('4.28M')
    expect(fmt.number(1620000, { abbreviate: true })).toBe('1.62M')
    expect(fmt.number(152000, { abbreviate: true })).toBe('152K')
    expect(fmt.number(38400, { abbreviate: true })).toBe('38.4K')
    expect(fmt.number(740, { abbreviate: true })).toBe('740')
  })

  it('escribe el número entero cuando abreviar se comería dígitos', () => {
    // 12.950 SKU publicados abreviado sería 12.9K, y los 50 que faltan son SKU
    // que existen. El `.pen` lo escribe entero, y ahora se sabe por qué.
    expect(fmt.number(12950, { abbreviate: true })).toBe('12,950')
    expect(fmt.number(1284500, { abbreviate: true })).toBe('1,284,500')
  })

  it('no usa B para mil millones · un billón son 10¹² en español', () => {
    expect(fmt.number(2.5e9, { abbreviate: true })).toBe('2,500M')
  })

  it('la abreviatura TAMBIÉN respeta el locale', () => {
    // Encontrado el 2026-09-02 al probar la inyección: v2 escribía la
    // abreviatura con `String()`, así que siempre salía con punto decimal
    // mientras la cifra entera sí pasaba por `Intl`. Con el locale fijo en
    // `es-MX` las dos coincidían y el defecto era invisible.
    expect(createFormat('de-DE').number(4280000, { abbreviate: true })).toBe('4,28M')
    expect(createFormat('es-MX').number(4280000, { abbreviate: true })).toBe('4.28M')
  })

  it('la comprobación de exactitud no depende del texto', () => {
    // `Number('4,28')` es NaN en cuanto el locale usa coma: si la comprobación
    // se hiciera sobre el string, con `de-DE` nada se abreviaría nunca.
    expect(createFormat('de-DE').number(12950, { abbreviate: true })).toBe('12.950')
    expect(createFormat('de-DE').number(38400, { abbreviate: true })).toBe('38,4K')
  })
})

describe('la unidad se compone en tres casos, no en dos', () => {
  it('la moneda va delante', () => {
    expect(fmt.withUnit('38K', 'USD')).toBe('USD 38K')
  })

  it('el símbolo va pegado detrás', () => {
    expect(fmt.withUnit('6.4', '%')).toBe('6.4%')
    expect(fmt.withUnit('4.1', 'x')).toBe('4.1x')
  })

  it('el NOMBRE de la unidad no se pega · pertenece al label', () => {
    // Pegarlo daba «4.1ratio» y «38.4Kórdenes», y además empujaba la cifra
    // fuera de un panel de colSpan 3.
    expect(fmt.withUnit('4.1', 'ratio')).toBe('4.1')
    expect(fmt.withUnit('38.4K', 'órdenes')).toBe('38.4K')
    expect(fmt.withUnit('18', 'días')).toBe('18')
  })

  it('sin unidad devuelve la cifra tal cual', () => {
    expect(fmt.withUnit('740', undefined)).toBe('740')
  })
})

describe('el delta lleva signo y ningún color · regla dura 3', () => {
  it('antepone el signo', () => {
    expect(fmt.delta(6.4)).toBe('+6.4')
    expect(fmt.delta(-14)).toBe('−14')
    expect(fmt.delta(0)).toBe('0')
  })

  it('usa el menos tipográfico U+2212, no el guion', () => {
    // Es el que las tres tipografías traen y el que alinea con la retícula.
    expect(fmt.delta(-14).charCodeAt(0)).toBe(0x2212)
  })

  it('devuelve texto y nunca un token de color', () => {
    // La regla dura 3 prohíbe el verde/rojo semántico. Que la firma devuelva
    // string es lo que impide que alguien meta un color acá.
    expect(typeof fmt.delta(-14)).toBe('string')
    expect(fmt.delta(-14)).not.toMatch(/color|--|fam-/)
  })
})

describe('frescura · en horas hasta 48 y en días después', () => {
  const now = new Date('2026-09-02T12:00:00Z')

  it('escribe las formas del .pen', () => {
    expect(fmt.freshness('2026-09-02T11:40:00Z', now)).toBe('RECIÉN')
    expect(fmt.freshness('2026-09-02T08:00:00Z', now)).toBe('HACE 4 H')
    expect(fmt.freshness('2026-09-01T05:00:00Z', now)).toBe('HACE 31 H')
  })

  it('pasa a días recién en 48 h · «hace 2 días» esconde si son 31 o 47', () => {
    expect(fmt.freshness('2026-08-31T13:00:00Z', now)).toBe('HACE 47 H')
    expect(fmt.freshness('2026-08-31T12:00:00Z', now)).toBe('HACE 2 D')
  })
})
