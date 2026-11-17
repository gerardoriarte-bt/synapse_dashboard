/** La configuración de nginx sostiene lo que promete · 2026-11-09
 *
 *  **El defecto que esto existe para atajar no da error**: en nginx, un
 *  `add_header` en una `location` anula TODOS los del `server`. Una caché nueva
 *  en una `location` borraba en silencio las cabeceras de seguridad de esa
 *  ruta, y la imagen arrancaba igual. Ver `deploy/seguridad.conf`.
 *
 *  Lo que esta prueba NO hace es correr nginx. Eso se midió con la imagen el
 *  2026-11-09: las cabeceras en `/`, `/admin`, los assets, la API y un 404; la
 *  CSP bloqueando un `<style>` inyectado y su reporte en el log.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const TEMPLATE = readFileSync('deploy/nginx.conf.template', 'utf8')
const SEGURIDAD = readFileSync('deploy/seguridad.conf', 'utf8')
const DOCKERFILE = readFileSync('Dockerfile', 'utf8')
const INCLUDE = 'include /etc/nginx/snippets/synapse-seguridad.conf;'

/** Sin comentarios —un `add_header` citado en prosa no es una directiva— y con
 *  `${VAR}` como `$VAR`: sus llaves cortarían el bloque de la `location`. */
const sinComentarios = (texto: string) =>
  texto
    .split('\n')
    .filter((l) => !l.trim().startsWith('#'))
    .join('\n')
    .replace(/\$\{(\w+)\}/g, '$$$1')

/** Cada `location { … }` con su cuerpo, contando llaves: `limit_except` abre
 *  un bloque adentro, y una regex hasta la primera `}` lo cortaba ahí. */
function locations(texto: string): { nombre: string; cuerpo: string }[] {
  const limpio = sinComentarios(texto)
  const salida: { nombre: string; cuerpo: string }[] = []
  for (const m of limpio.matchAll(/location\s+([^{]+)\{/g)) {
    let nivel = 1
    let k = (m.index ?? 0) + m[0].length
    const desde = k
    while (nivel > 0 && k < limpio.length) {
      if (limpio[k] === '{') nivel++
      if (limpio[k] === '}') nivel--
      k++
    }
    salida.push({ nombre: (m[1] ?? '').trim(), cuerpo: limpio.slice(desde, k - 1) })
  }
  return salida
}

describe('las cabeceras salen en todas las respuestas', () => {
  it('el template tiene tres location con add_header propio · si cambia, se mira esto', () => {
    const conAddHeader = locations(TEMPLATE).filter((l) => l.cuerpo.includes('add_header'))
    expect(conAddHeader.map((l) => l.nombre)).toEqual(['/assets/', '/api/v1', '/'])
  })

  it('toda location con add_header propio incluye las de seguridad', () => {
    for (const l of locations(TEMPLATE)) {
      if (l.cuerpo.includes('add_header')) expect(l.cuerpo, l.nombre).toContain(INCLUDE)
    }
  })

  it('el server también las incluye, para lo que no cae en ninguna location', () => {
    const server = sinComentarios(TEMPLATE).split('location')[0] ?? ''
    expect(server).toContain(INCLUDE)
  })

  it('la imagen copia el archivo al lugar que el include nombra', () => {
    expect(DOCKERFILE).toContain(
      'COPY deploy/seguridad.conf /etc/nginx/snippets/synapse-seguridad.conf',
    )
  })

  it.each([
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
  ])('%s, también en un 404 o un 500', (cabecera) => {
    const linea = sinComentarios(SEGURIDAD)
      .split('\n')
      .find((l) => l.includes(`add_header ${cabecera} `))
    expect(linea).toBeDefined()
    expect(linea?.trim().endsWith('always;')).toBe(true)
  })
})

describe('la CSP es estricta', () => {
  const csp = /Content-Security-Policy "([^"]+)"/.exec(SEGURIDAD)?.[1] ?? ''

  it('no abre la puerta a scripts ni estilos en línea', () => {
    expect(csp).not.toContain('unsafe-inline')
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("style-src 'self'")
  })

  it('nadie embebe la consola, y las violaciones se registran', () => {
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain('report-uri /_errores/csp')
  })
})

describe('el registro de errores', () => {
  const receptor = locations(TEMPLATE).find((l) => l.nombre === '/_errores')?.cuerpo ?? ''

  it('sólo POST, con tope de tamaño y de ritmo', () => {
    expect(receptor).toMatch(/limit_except POST/)
    expect(receptor).toMatch(/client_max_body_size 8k;/)
    expect(receptor).toMatch(/limit_req zone=synapse_errores/)
  })

  it('no guarda la IP de quien navega', () => {
    const formato = /log_format synapse_errores[\s\S]*?;\n/.exec(TEMPLATE)?.[0] ?? ''
    expect(formato).not.toBe('')
    expect(formato).not.toMatch(/remote_addr|forwarded_for|request_uri|args/)
  })

  it('el que contesta 204 escucha sólo en loopback', () => {
    expect(sinComentarios(TEMPLATE)).toMatch(/listen\s+127\.0\.0\.1:8099;/)
    expect(receptor).toContain('proxy_pass http://127.0.0.1:8099;')
  })
})
