/** La acumulación de una respuesta · F3.8
 *
 *  `apply` es pura y se prueba sin React ni conexión, que es justamente lo que
 *  F3.8 pide: «el componente de mensajes recibe una lista y un estado; no
 *  conoce SSE». Si esto necesitara montar algo, la separación no existiría.
 */
import { describe, expect, it } from 'vitest'
import { apply } from '@/api/useChat'
import type { Answer } from '@/api/useChat'
import type { ChatEvent } from '@/api/types'

const VACIA: Answer = { texto: '', datos: [], auditoria: null, sugerencias: [] }

const dato = {
  tipo: 'dato',
  valor: { forma: 'escalar', v: 12 },
  familia: 'demanda',
  base: '48 tiendas sobre 52',
  capa: 'GOLD',
  fuente: 'Snowflake',
  frescura: '2026-09-02T08:00:00Z',
  catalogVersion: 1,
} as ChatEvent

describe('la prosa se concatena EN ORDEN', () => {
  it('tres fragmentos son una frase, no tres', () => {
    const eventos: ChatEvent[] = [
      { tipo: 'texto', delta: 'Las ventas ' },
      { tipo: 'texto', delta: 'subieron ' },
      { tipo: 'texto', delta: '12%.' },
    ]
    expect(eventos.reduce(apply, VACIA).texto).toBe('Las ventas subieron 12%.')
  })

  it('es asociativa por la izquierda · aplicar de a uno da lo mismo que en tanda', () => {
    // Importa porque el stream entrega de a uno y una prueba puede aplicar de
    // golpe: si no fueran equivalentes, la prueba no diría nada del stream.
    const eventos: ChatEvent[] = [
      { tipo: 'texto', delta: 'a' },
      dato,
      { tipo: 'texto', delta: 'b' },
    ]
    const unoAUno = eventos.reduce((acc, e) => apply(acc, e), VACIA)
    expect(unoAUno).toEqual(eventos.reduce(apply, VACIA))
    expect(unoAUno.texto).toBe('ab')
  })
})

describe('las cifras van APARTE de la prosa', () => {
  it('un `dato` no se concatena al texto · se pinta con un cuerpo de panel', () => {
    const r = apply({ ...VACIA, texto: 'Mirá: ' }, dato)
    expect(r.texto).toBe('Mirá: ')
    expect(r.datos).toHaveLength(1)
  })

  it('conserva la procedencia pegada a la cifra', () => {
    // Es la garantía del contrato: nunca hay un número sin su badge. Si el hook
    // guardara solo `valor`, la perdería en la acumulación.
    const [guardado] = apply(VACIA, dato).datos
    expect(guardado).toMatchObject({ base: '48 tiendas sobre 52', capa: 'GOLD' })
  })

  it('dos cifras se acumulan en orden y no se pisan', () => {
    const otra = { ...dato, valor: { forma: 'escalar', v: 99 } } as ChatEvent
    expect(apply(apply(VACIA, dato), otra).datos).toHaveLength(2)
  })
})

describe('auditoría y sugerencias', () => {
  it('el SQL queda disponible · §7.1 lo hace obligatorio', () => {
    const evento = { tipo: 'auditoria', sql: 'select 1', fuentesConsultadas: ['GOLD.v'] } as ChatEvent
    expect(apply(VACIA, evento).auditoria).toMatchObject({ sql: 'select 1' })
  })

  it('las sugerencias REEMPLAZAN, no se acumulan', () => {
    // El evento manda la lista completa. Acumularlas dejaría en pantalla
    // sugerencias de una vuelta anterior de la conversación.
    const a = { tipo: 'sugerencias', sugerencias: ['una'] } as ChatEvent
    const b = { tipo: 'sugerencias', sugerencias: ['otra', 'más'] } as ChatEvent
    expect(apply(apply(VACIA, a), b).sugerencias).toEqual(['otra', 'más'])
  })
})

describe('`fin` y `error` no tocan la respuesta', () => {
  it('cambian el estado del turno, que es del hook · no la acumulación', () => {
    const conTexto = apply(VACIA, { tipo: 'texto', delta: 'algo' })
    for (const evento of [
      { tipo: 'fin', hiloId: 'h-1' },
      { tipo: 'error', mensaje: 'Se cortó.', parcial: true },
    ] as ChatEvent[]) {
      expect(apply(conTexto, evento)).toEqual(conTexto)
    }
  })
})

describe('no muta lo que recibe', () => {
  it('la respuesta previa queda intacta · React compara por identidad', () => {
    const previa = apply(VACIA, dato)
    const copia = structuredClone(previa)
    apply(previa, { tipo: 'texto', delta: 'x' })
    apply(previa, dato)
    expect(previa).toEqual(copia)
  })
})
