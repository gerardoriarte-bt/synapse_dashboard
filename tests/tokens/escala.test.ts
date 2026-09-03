/** La escala tipográfica · F1.28 · §ANCLA:TIPO-2
 *
 *  Dos cosas distintas, y las dos hacen falta.
 *
 *  La primera es la cita: §2.3 cierra la escala mono en cuatro roles —«Ningún
 *  otro tamaño mono»— y `tokens.css` tiene que declarar esos cuatro números.
 *  Eso también lo verifica `spec-anclas` con su aserción estática; acá está
 *  además como prueba porque la aserción estática es un regex sobre el archivo
 *  y no dice nada sobre lo que el código hace con él.
 *
 *  La segunda no sale de design.md sino de cómo falla Tailwind: **una utilidad
 *  que nombra un token inexistente no es un error, es silencio.** `text-labell`
 *  compila, pasa el lint, se pinta sin tamaño y se ve casi igual. Es el mismo
 *  modo de falla que el spread condicional con una prop mal nombrada, anotado
 *  en CLAUDE.md: no lo ve el compilador ni el lint, y solo se nota mirando.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const RAIZ = process.cwd()
const TOKENS = readFileSync(resolve(RAIZ, 'src/tokens/tokens.css'), 'utf-8')

const declarados = (prefijo: string): Map<string, string> =>
  new Map(
    [...TOKENS.matchAll(new RegExp(`--${prefijo}-([a-z0-9-]+):\\s*([^;]+);`, 'g'))].map(
      (m) => [m[1] as string, (m[2] as string).trim()],
    ),
  )

const tsx = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? tsx(p) : p.endsWith('.tsx') ? [p] : []
  })

// `text-` es el único prefijo compartido: Tailwind lo usa para el tamaño, para
// el color y para la alineación. Estas son las de alineación y flujo, que no
// son tokens de nadie.
const TEXT_NO_TOKEN = new Set([
  'left', 'center', 'right', 'justify', 'start', 'end',
  'wrap', 'nowrap', 'balance', 'pretty', 'ellipsis', 'clip',
])

describe('§ANCLA:TIPO-2 · «Ningún otro tamaño mono»', () => {
  it('declara los cuatro roles de §2.3 con sus cuatro números', () => {
    const texto = declarados('text')
    expect(texto.get('nota')).toBe('9px')
    expect(texto.get('label')).toBe('10px')
    expect(texto.get('cifra')).toBe('11px')
    expect(texto.get('celda')).toBe('12px')
  })

  it('el tracking va en em, que es lo que lo hace un token y no una medida', () => {
    // 1.2px sobre el label de 10 y 1.08px sobre la nota de 9 son el mismo
    // 0.12em. En px harían falta dos tokens y uno de los dos se olvidaría.
    expect(declarados('tracking').get('rotulo')).toBe('0.12em')
  })

  it('la altura de línea va sin unidad · multiplica el tamaño, no lo fija', () => {
    for (const [nombre, valor] of declarados('leading')) {
      expect(valor, `--leading-${nombre}`).toMatch(/^[0-9.]+$/)
    }
  })
})

describe('toda utilidad de tipografía nombra un token que existe', () => {
  const tamaños = declarados('text')
  const colores = declarados('color')
  const usos = tsx(resolve(RAIZ, 'src')).flatMap((archivo) => {
    const src = readFileSync(archivo, 'utf-8')
    return [...src.matchAll(/\b(text|tracking|leading)-([a-z][a-z0-9-]*)\b/g)].map((m) => ({
      archivo,
      prefijo: m[1] as string,
      nombre: m[2] as string,
    }))
  })

  it('encuentra utilidades para revisar · si no, la prueba no prueba nada', () => {
    expect(usos.length).toBeGreaterThan(20)
  })

  it.each(['text', 'tracking', 'leading'])('%s-*', (prefijo) => {
    const declarado = prefijo === 'text' ? tamaños : declarados(prefijo)
    const huérfanas = usos
      .filter((u) => u.prefijo === prefijo)
      .filter((u) => !declarado.has(u.nombre))
      .filter((u) => !(prefijo === 'text' && (colores.has(u.nombre) || TEXT_NO_TOKEN.has(u.nombre))))
      .map((u) => `${u.prefijo}-${u.nombre} en ${u.archivo.slice(RAIZ.length + 1)}`)

    expect(huérfanas).toEqual([])
  })
})
