// @vitest-environment jsdom

/** El primitivo `Value` · F1.13c.
 *
 *  Regla dura 4: ningún número desnudo. Lo que se verifica acá es que la cifra
 *  nunca salga sin label y que este componente NO formatee — el locale es del
 *  tenant y un primitivo no sabe de qué tenant se trata.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Value } from '@/render/primitives/Value'

// F1.28 movió los números de las clases a los tokens, así que cada aserción
// de §2.3 pasa por dos saltos: que el componente use el token y que el token
// valga el número de la cita. Solo el primero dejaría pasar un `text-kpi` de
// 20px. Ruta desde la raíz porque en jsdom `import.meta.url` es http.
const TOKENS = readFileSync(resolve(process.cwd(), 'src/tokens/tokens.css'), 'utf-8')

describe('regla dura 4 · ningún número desnudo', () => {
  it('pinta el label junto a la cifra', () => {
    render(<Value label="Sesiones">48,210</Value>)
    // El texto del DOM es el que se escribió: las mayúsculas las pone
    // `uppercase`, que es CSS y no toca el contenido. Es lo correcto —un lector
    // de pantalla dice «Sesiones» y no deletrea— y es lo que hay que recordar
    // al buscar un label en una prueba.
    expect(screen.getByText('Sesiones')).toBeInTheDocument()
    expect(screen.getByText('48,210')).toBeInTheDocument()
  })

  it('con labelVisibility="screenReader" el label no se ve pero sigue en el árbol', () => {
    render(
      <Value label="Sesiones" labelVisibility="screenReader">
        48,210
      </Value>,
    )
    // Sigue encontrable —está en el DOM— y va con las utilidades que lo sacan
    // de la vista sin sacarlo del árbol de accesibilidad.
    const label = screen.getByText('Sesiones')
    expect(label.className).toContain('absolute')
    expect(label.className).toContain('w-px')
  })

  it('con labelVisibility="fromContext" el label no está · el entorno ya lo nombra', () => {
    render(
      <Value label="Sesiones" labelVisibility="fromContext">
        48,210
      </Value>,
    )
    // Una celda dentro de una tabla con `scope` hereda el nombre de su columna:
    // repetirlo la haría decir el nombre dos veces.
    expect(screen.queryByText(/sesiones/i)).toBeNull()
    expect(screen.getByText('48,210')).toBeInTheDocument()
  })

  it('NO lleva aria-label sobre la cifra · lo reemplazaría en vez de acompañarlo', () => {
    render(<Value label="Sesiones">48,210</Value>)
    expect(screen.getByText('48,210').getAttribute('aria-label')).toBeNull()
  })
})

describe('no formatea · recibe el texto hecho', () => {
  it('pinta exactamente lo que recibe', () => {
    // Si formateara, «USD 4.28M» tendría que llegar como número y unidad, y el
    // componente tendría que conocer el locale del tenant.
    render(<Value label="Ventas">USD 4.28M</Value>)
    expect(screen.getByText('USD 4.28M')).toBeInTheDocument()
  })
})

describe('§2.3 · los tres roles de cifra', () => {
  it('toda cifra lleva tabular-nums, sea cual sea el rol', () => {
    // Es lo que hace que una columna de números se lea como columna.
    for (const size of ['kpi', 'cell', 'body'] as const) {
      const { unmount } = render(
        <Value label="X" size={size}>
          1,284,500
        </Value>,
      )
      expect(screen.getByText('1,284,500').className).toContain('tabular-nums')
      unmount()
    }
  })

  it('el KPI son 44px · §2.3 fija el piso y no se baja para que entre una cifra', () => {
    render(
      <Value label="Ventas" size="kpi">
        4.28M
      </Value>,
    )
    expect(screen.getByText('4.28M').className).toContain('text-kpi')
    expect(TOKENS).toMatch(/--text-kpi:\s*44px;/)
  })

  it('la celda numérica es mono 12 a la derecha', () => {
    render(
      <Value label="Ventas" size="cell">
        4.28M
      </Value>,
    )
    const clases = screen.getByText('4.28M').className
    expect(clases).toContain('font-mono')
    expect(clases).toContain('text-celda')
    expect(TOKENS).toMatch(/--text-celda:\s*12px;/)
    expect(clases).toContain('text-right')
  })
})
