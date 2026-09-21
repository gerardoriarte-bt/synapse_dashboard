/** El markdown del agente a bloques · F3.13
 *
 *  **Los casos salen del `openapi.yaml` de `82da946`, no de lo que un markdown
 *  cualquiera puede traer.** El backend declara qué emite el agente: markdown en
 *  español que abre con una conclusión de 1-2 frases y, cuando aplica, las
 *  secciones `### Puntos de lectura`, `### Fuentes consultadas` y `### Límite
 *  declarado`; y `[SIN_COMPETENCIA]` en la primera línea cuando no puede
 *  responder. Probar tablas o imágenes sería probar un parser que nadie pidió.
 *
 *  **La mitad de estas pruebas son de texto A MEDIO LLEGAR**, y es la mitad que
 *  importa: la prosa entra por fragmentos del stream, así que `parsear` corre
 *  sobre cada estado intermedio. Un parser correcto sobre el texto final y
 *  glotón sobre el parcial hace que media respuesta desaparezca y vuelva
 *  mientras se escribe.
 */
import { describe, expect, it } from 'vitest'
import { parsear } from '@/surfaces/console/parseMarkdown'
import type { Bloque } from '@/surfaces/console/parseMarkdown'

/** El texto plano de un bloque, para no repetir la estructura en cada aserción. */
function plano(b: Bloque): string {
  if (b.tipo === 'seccion') return b.texto
  if (b.tipo === 'parrafo') return b.trozos.map((t) => t.texto).join('')
  return b.items.map((i) => i.map((t) => t.texto).join('')).join(' · ')
}

describe('lo que el backend declara que el agente emite', () => {
  it('`### Límite declarado` es una SECCIÓN, no una línea con numerales', () => {
    // Es el defecto exacto que abrió F3.13: en pantalla se leía «### Límite
    // declarado» con los tres numerales.
    const { bloques } = parsear('Cayó 12%.\n\n### Límite declarado\nNo cubre tiendas sin lectura.')

    expect(bloques.map((b) => b.tipo)).toEqual(['parrafo', 'seccion', 'parrafo'])
    expect(plano(bloques[1] as Bloque)).toBe('Límite declarado')
  })

  it('los tres encabezados que el contrato nombra caen todos en `seccion`', () => {
    const { bloques } = parsear(
      '### Puntos de lectura\na\n\n### Fuentes consultadas\nb\n\n### Límite declarado\nc',
    )
    const secciones = bloques.filter((b) => b.tipo === 'seccion').map(plano)
    expect(secciones).toEqual(['Puntos de lectura', 'Fuentes consultadas', 'Límite declarado'])
  })

  it('`#` y `##` también son `seccion` · la casa tiene UN rótulo', () => {
    // Darle un tamaño distinto a cada nivel inventaría una escala tipográfica
    // que el `.pen` no dibuja.
    const { bloques } = parsear('# Uno\n\n## Dos\n\n### Tres')
    expect(bloques.every((b) => b.tipo === 'seccion')).toBe(true)
  })

  it('`[SIN_COMPETENCIA]` se separa y NO queda en el texto', () => {
    const { sinCompetencia, bloques } = parsear(
      '[SIN_COMPETENCIA]\nNo tengo la fuente de devoluciones.\n\n### Lo que sí puedo\n- Ver ventas',
    )
    expect(sinCompetencia).toBe(true)
    expect(bloques.map(plano).join(' ')).not.toContain('SIN_COMPETENCIA')
  })

  it('solo cuenta en la PRIMERA línea · mencionarlo no se rinde solo', () => {
    const { sinCompetencia } = parsear('La respuesta menciona [SIN_COMPETENCIA] al pasar.')
    expect(sinCompetencia).toBe(false)
  })

  it('las listas con viñeta y las numeradas no se mezclan', () => {
    // Fundirlas en una sola perdería la numeración o la inventaría.
    const { bloques } = parsear('- uno\n- dos\n1. primero\n2. segundo')
    expect(bloques).toHaveLength(2)
    expect(bloques[0]).toMatchObject({ tipo: 'lista', ordenada: false })
    expect(bloques[1]).toMatchObject({ tipo: 'lista', ordenada: true })
  })

  it('`**cifra**` sale marcada como énfasis y sin los asteriscos', () => {
    const { bloques } = parsear('El margen cayó **12%** este mes.')
    const trozos = (bloques[0] as Extract<Bloque, { tipo: 'parrafo' }>).trozos
    expect(trozos.find((t) => t.enfasis)?.texto).toBe('12%')
    expect(trozos.map((t) => t.texto).join('')).not.toContain('*')
  })

  it('`` `columna` `` sale como código', () => {
    const { bloques } = parsear('Se leyó de `cobertura_dias`.')
    const trozos = (bloques[0] as Extract<Bloque, { tipo: 'parrafo' }>).trozos
    expect(trozos.find((t) => t.codigo)?.texto).toBe('cobertura_dias')
  })
})

describe('texto A MEDIO LLEGAR · el stream entrega fragmentos', () => {
  it('un `**` sin cerrar se queda LITERAL y no se traga el resto', () => {
    // **Es la decisión que evita el parpadeo.** Si esperara el cierre, «12»
    // desaparecería hasta que llegue el próximo fragmento.
    const { bloques } = parsear('El margen cayó **12')
    expect(plano(bloques[0] as Bloque)).toBe('El margen cayó **12')
  })

  it('un `` ` `` sin cerrar tampoco se traga el resto', () => {
    const { bloques } = parsear('Se leyó de `cobertura')
    expect(plano(bloques[0] as Bloque)).toBe('Se leyó de `cobertura')
  })

  it('un `###` recién escrito no abre una sección VACÍA', () => {
    // Un rótulo en blanco que aparece y desaparece mientras llega el título es
    // peor que esperar un fragmento más.
    const { bloques } = parsear('Cayó 12%.\n\n###')
    expect(bloques.map((b) => b.tipo)).toEqual(['parrafo'])
  })

  it('cada prefijo del mismo texto produce algo coherente · nunca lanza', () => {
    // El stream pasa por TODOS los prefijos. Basta que uno rompa para que la
    // hoja quede en blanco a mitad de la respuesta.
    const completo =
      'Cayó **12%**.\n\n### Puntos de lectura\n- Un `sku` cayó\n- Otro no\n\n### Límite declarado\nParcial.'
    for (let i = 1; i <= completo.length; i += 1) {
      expect(() => parsear(completo.slice(0, i))).not.toThrow()
    }
    // Y el final es el que se espera.
    expect(parsear(completo).bloques.map((b) => b.tipo)).toEqual([
      'parrafo', 'seccion', 'lista', 'seccion', 'parrafo',
    ])
  })

  it('el texto vacío no produce bloques', () => {
    expect(parsear('').bloques).toEqual([])
  })
})
