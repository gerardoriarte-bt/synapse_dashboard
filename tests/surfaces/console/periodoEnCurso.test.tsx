// @vitest-environment jsdom

/** El mes en curso se marca, no se deshabilita · F1.42 · §PEN:C1
 *
 *  **El defecto que cierra**: el selector ofrecía los doce meses iguales, y el
 *  actual está incompleto. Alguien compara septiembre con nueve días contra
 *  agosto entero y lee una caída que es «el mes todavía no terminó». Es el mismo
 *  modo de falla que un panel degradado mostrando un número aproximado: **la
 *  cifra es correcta y la lectura es falsa**.
 *
 *  Las tres cosas que esto puede hacer mal viéndose bien, y una por describe:
 *  marcar el que no es, marcar alguno cuando el cable no dice cuál, y
 *  deshabilitarlo —que el criterio prohíbe: mirar el mes en curso es legítimo—.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PeriodPicker } from '@/surfaces/console/PeriodPicker'
import { adaptContext } from '@/api/adapt'
import type { Period } from '@/api/types'

const periodo = (id: string, enCurso?: boolean): Period => ({
  id,
  etiqueta: id,
  grano: 'mes',
  ...(enCurso === undefined ? {} : { enCurso }),
})

/** Sin métricas el selector no limita el grano, que es lo que estas pruebas
 *  quieren: mirar la marca y no el deshabilitado por grano, que ya tiene las
 *  suyas en `periodGrain.test.ts`. */
const montar = (periods: Period[], activeId = '2026-09') =>
  render(
    <PeriodPicker periods={periods} activeId={activeId} metrics={[]} onSelect={vi.fn()} />,
  )

describe('se marca el que el CABLE declara, no el primero', () => {
  it('el período en curso lleva la palabra y los cerrados no', () => {
    montar([periodo('2026-09', true), periodo('2026-08', false), periodo('2026-07', false)])

    expect(screen.getByRole('option', { name: /2026-09 · en curso/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '2026-08' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '2026-07' })).toBeInTheDocument()
  })

  it('si el abierto NO es el primero, se marca el abierto', () => {
    // **Es la aserción que sostiene la regla.** Marcar el primero «porque suele
    // ser el mes en curso» se vería idéntico once meses de cada doce, y sería
    // adivinar en vez de leer lo que el cable declaró.
    montar([periodo('2026-09', false), periodo('2026-08', true)], '2026-08')

    expect(screen.getByRole('option', { name: /2026-08 · en curso/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '2026-09' })).toBeInTheDocument()
  })
})

describe('sin el campo, no se afirma nada de ninguno', () => {
  it('ningún chip se marca cuando el cable no lo manda', () => {
    // Es lo que pasa contra el servicio desplegado: `open_period` es del fork.
    // La respuesta correcta es el comportamiento de antes, no una adivinanza.
    const { container } = montar([periodo('2026-09'), periodo('2026-08')])
    expect(container.textContent).not.toMatch(/en curso/i)
  })

  it('el adaptador tampoco lo inventa · sin `open_period` la prop queda AUSENTE', () => {
    // Ausente y no `false`: `false` afirmaría «este período está cerrado», que
    // es una afirmación que nadie hizo.
    const ctx = adaptContext({
      user: { id: 'u', first_name: 'D', last_name: 'L', email: 'd@l' },
      tenant: { id: 't', name: 'UA' },
      role: { id: 'r', name: 'admin' },
      tabs: [],
      periods: ['2026-09', '2026-08'],
      catalog_version: 1,
    } as never)

    expect(ctx.periodos[0]).not.toHaveProperty('enCurso')
  })

  it('y con `open_period` marca ESE y ningún otro', () => {
    const ctx = adaptContext({
      user: { id: 'u', first_name: 'D', last_name: 'L', email: 'd@l' },
      tenant: { id: 't', name: 'UA' },
      role: { id: 'r', name: 'admin' },
      tabs: [],
      periods: ['2026-09', '2026-08'],
      open_period: '2026-08',
      catalog_version: 1,
    } as never)

    expect(ctx.periodos[0]?.enCurso).toBe(false)
    expect(ctx.periodos[1]?.enCurso).toBe(true)
  })
})

describe('se marca, NO se deshabilita', () => {
  it('la opción en curso se puede elegir · mirarlo es legítimo', () => {
    // El criterio lo dice con todas las letras. Deshabilitarla convertiría una
    // advertencia en una prohibición, que es otra cosa.
    montar([periodo('2026-09', true)])
    expect(screen.getByRole('option', { name: /en curso/i })).toBeEnabled()
  })

  it('con el período en curso ELEGIDO, se declara por qué importa', () => {
    montar([periodo('2026-09', true), periodo('2026-08', false)], '2026-09')
    expect(screen.getByText(/incompleto, no compara contra uno cerrado/i)).toBeVisible()
  })

  it('con un período CERRADO elegido, esa línea no está', () => {
    // El ámbito es la lectura que puede salir falsa. Dejarla siempre la vuelve
    // decoración, que es como se deja de leer una advertencia.
    const { container } = montar([periodo('2026-09', true), periodo('2026-08', false)], '2026-08')
    expect(container.textContent).not.toMatch(/incompleto, no compara/i)
  })
})

describe('el desplegable · 2026-09-24', () => {
  /** El riel de doce chips era **invención nuestra**: §PEN:C1 dibuja el
   *  `Rango` de sólo lectura —`PERÍODO` arriba, el valor debajo— y ningún
   *  control. Se notó cuando el dato se volvió real y los doce chips
   *  apretaron la cabecera. El desplegable conserva esa anatomía y suma lo
   *  que el dibujo no resuelve: cómo se cambia. */
  it('elegir un período DISPARA el callback · no alcanza con que la opción exista', async () => {
    const elegir = vi.fn()
    render(
      <PeriodPicker
        periods={[periodo('2026-09', true), periodo('2026-08', false)]}
        activeId="2026-09"
        metrics={[]}
        onSelect={elegir}
      />,
    )

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Período' }), '2026-08')
    expect(elegir).toHaveBeenCalledWith('2026-08')
  })

  it('los períodos se agrupan por grano, y el grupo lleva su rótulo', () => {
    montar([periodo('2026-09', false), periodo('2026-08', false)])
    // `optgroup` es lo que agrupa; sin él los doce salen en una lista plana y
    // se pierde de qué grano es cada uno.
    expect(screen.getByRole('group', { name: /meses/i })).toBeInTheDocument()
  })
})
