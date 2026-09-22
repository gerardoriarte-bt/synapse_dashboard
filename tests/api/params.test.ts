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
    // Con `gauge.banda` y no con `kpi.medidor`: el 2026-09-22 `medidor` pasó a
    // ser un interruptor booleano y dejó de ser ejemplo de objeto.
    expect(validateParams('gauge', { banda: { lo: 0, hi: 1, etiqueta: 'x' } }).invalid).toEqual([])
    expect(validateParams('gauge', { banda: [1, 2] }).invalid).toHaveLength(1)
  })

  it('`null` no pasa por objeto · `typeof null` es "object"', () => {
    expect(validateParams('gauge', { banda: null }).invalid).toHaveLength(1)
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

describe('los interruptores del layout sembrado · capturado el 2026-09-22', () => {
  /** **Lo que el servicio manda de verdad**, campo por campo, leído de
   *  `GET /config/tabs/5b5e27ae…` contra el binario local en `82da946` con la
   *  base de `dev/postgres` recién migrada. **No se escribió de memoria**: los
   *  doce paneles de la pestaña sembrada, con sus `options` tal cual llegan, en
   *  inglés y antes de `traducirParams`.
   *
   *  Está acá y no en un `.json` aparte porque son doce líneas y porque el que
   *  lea la prueba tiene que ver el payload sin abrir otro archivo. */
  const SEMBRADO = [
    ['prose', {}],
    ['kpi', { meter: true, comparative: true }],
    ['kpi', { meter: true, comparative: true }],
    ['kpi', { comparative: true }],
    ['kpi', { meter: true, comparative: true }],
    ['bars', { order: 'desc' }],
    ['kpi', { meter: true }],
    ['kpi', { meter: true }],
    ['series', { cut: 'day' }],
    ['series', { cut: 'month' }],
    ['table', { order: 'investment' }],
    ['reco', { cap: 6 }],
  ] as const

  /** El mismo renombre que hace `adaptTab`. Se repite acá —tres pares— en vez
   *  de importar `traducirParams`, que es privada: exportarla para una prueba
   *  ensancharía la superficie del adaptador. */
  const traducir = (o: Record<string, unknown>) => {
    const N: Record<string, string> = {
      meter: 'medidor',
      comparative: 'comparativo',
      order: 'orden',
      cut: 'corte',
      cap: 'tope',
    }
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [N[k] ?? k, v]))
  }

  it('los SEIS paneles `kpi` del layout ya no degradan', () => {
    // **El defecto, en una línea.** Hasta hoy el esquema pedía un objeto para
    // `medidor` y una lista para `comparativo` —la forma que tenían antes de
    // F1.40—, así que todo `meter: true` degradaba: **seis de doce paneles** en
    // BLOQUEADO diciendo «"medidor" tiene el valor true y espera un objeto».
    //
    // Seis y no siete: el conteo se escribió de memoria y esta misma aserción
    // lo corrigió antes de que llegara a un commit.
    const kpis = SEMBRADO.filter(([tipo]) => tipo === 'kpi')
    expect(kpis).toHaveLength(6)

    for (const [tipo, options] of kpis) {
      const r = validateParams(tipo, traducir(options))
      expect(r.invalid).toEqual([])
      expect(r.unknown).toEqual([])
      // Y llegan al cuerpo: descartarlos en silencio apagaría el medidor, que
      // es lo mismo que el layout pidió encender.
      expect(r.params).toEqual(traducir(options))
    }
  })

  it('`medidor` es un interruptor · un objeto ya NO pasa', () => {
    // La otra mitad. Sin esta aserción, `{ kind: 'boolean' }` podría relajarse
    // a algo que acepte las dos formas y la prueba de arriba seguiría verde.
    const r = validateParams('kpi', { medidor: { label: 'Avance', porcentaje: 61 } })
    expect(r.invalid[0]?.reason).toContain('«true» o «false»')
    expect(r.params).toEqual({})
  })

  it('`orden` de `table` llega como texto y SÍ degrada · es del backend', () => {
    // **Se deja degradando a propósito.** `TableBody` ordena con
    // `{ columna, direccion }` y el servicio manda el nombre de la columna
    // solo. Aceptarlo obligaría a elegir una dirección que nadie declaró, y el
    // adaptador no inventa: el panel muestra la razón y la pregunta va escrita
    // en `docs/PARA-BACKEND.md`.
    const r = validateParams('table', traducir({ order: 'investment' }))
    expect(r.invalid[0]?.param).toBe('orden')
    expect(r.invalid[0]?.reason).toContain('"investment"')
  })

  it('`cut` de `series` se descarta · ningún cuerpo de series lo lee', () => {
    // `/config/blocks` lo declara para `series` y para `forecast`, y sólo
    // `ForecastBody` lo usa —ahí es el punto donde termina lo observado—. En
    // `series` parece granularidad, que es otra cosa con el mismo nombre. Se
    // descarta con aviso, que es lo correcto mientras la pregunta esté abierta.
    const r = validateParams('series', traducir({ cut: 'day' }))
    expect(r.unknown).toEqual(['corte'])
    expect(r.invalid).toEqual([])
  })
})
