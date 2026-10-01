// @vitest-environment jsdom

/** El historial de materializaciones · A5 · 2026-10-01
 *
 *  **Es un agregado nuestro al dibujo**: el frame `A5 · Salud de feeds` no dibuja
 *  corridas. Se construyó porque el 2026-10-01 se corrieron ocho períodos a mano
 *  y no había desde dónde mirar cómo salieron.
 *
 *  ── LOS DOS MODOS DE FALLA QUE ESTA PANTALLA TIENE ──────────────────────────
 *
 *  1. **Cruzar dos contadores.** Son cinco cifras seguidas con sus rótulos, y
 *     poner la de `bloqueadas` bajo «Errores» se ve perfectamente bien. Por eso
 *     los cinco valores de los fixtures son **distintos entre sí**: con ceros o
 *     repetidos, un intercambio no se puede detectar.
 *  2. **Leer una corrida EN VUELO como una que falló.** Mientras corre no hay
 *     fin, y una celda vacía en esa columna se lee como un error silencioso.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RunHistory } from '@/surfaces/admin/RunHistory'
import { createFormat } from '@/render/format'
import type { Corrida } from '@/api/admin'

const format = createFormat('es-MX')

/** Los cinco contadores DISTINTOS a propósito · ver el encabezado. */
const corrida = (over: Partial<Corrida> = {}): Corrida => ({
  id: `r-${over.periodo ?? '2026-08'}`,
  tenantId: 't-1',
  periodo: '2026-08',
  disparo: 'manual',
  estado: 'done',
  disponibles: 19,
  bloqueadas: 2,
  errores: 3,
  salteadas: 4,
  preservadas: 5,
  arrancadaEn: '2026-08-15T10:30:00-05:00',
  terminadaEn: '2026-08-15T10:30:05-05:00',
  error: '',
  ...over,
})

const fila = (periodo: string) => screen.getByText(periodo).closest('tr') as HTMLElement

describe('cada contador va bajo SU rótulo · cruzarlos se ve bien', () => {
  it('los cinco se leen por su columna, no por su orden', () => {
    render(<RunHistory corridas={[corrida()]} format={format} />)

    const cabeceras = screen.getAllByRole('columnheader').map((h) => h.textContent ?? '')
    const celdas = within(fila('2026-08')).getAllByRole('cell').map((c) => c.textContent ?? '')
    const valor = (rotulo: string) => celdas[cabeceras.findIndex((h) => h.includes(rotulo))]

    expect(valor('Disponibles')).toBe('19')
    expect(valor('Bloqueadas')).toBe('2')
    expect(valor('Errores')).toBe('3')
    expect(valor('Preservadas')).toBe('5')
  })

  it('y se dice que preservadas NO es una falla · si no, el total engaña', () => {
    render(<RunHistory corridas={[corrida()]} format={format} />)
    expect(screen.getByText(/no son una falla/i)).toBeVisible()
  })
})

describe('una corrida EN VUELO se dice, no se deja en blanco', () => {
  it('sin fin dice «En curso» y no una fecha inventada', () => {
    render(
      <RunHistory corridas={[corrida({ terminadaEn: null, estado: 'running' })]} format={format} />,
    )
    expect(within(fila('2026-08')).getByText(/en curso/i)).toBeVisible()
  })

  it('terminada muestra CUÁNDO arrancó', () => {
    render(<RunHistory corridas={[corrida()]} format={format} />)
    // El día que el formateador del tenant escribe, sin fijar su redacción.
    expect(within(fila('2026-08')).getByText(/15/)).toBeVisible()
    expect(within(fila('2026-08')).queryByText(/en curso/i)).toBeNull()
  })
})

describe('el año se elige, y sale del DATO', () => {
  const dosAnios = [
    corrida({ periodo: '2026-03', id: 'r-2026' }),
    corrida({ periodo: '2025-11', id: 'r-2025', disponibles: 16 }),
  ]

  it('arranca en el más reciente CON corridas · no en el del reloj', () => {
    // **No es `new Date()`**: eso haría que la pantalla cambiara sola el 1 de
    // enero y mostrara un año vacío — el mismo defecto que la consola tuvo con
    // el mes abierto, el mismo día.
    render(<RunHistory corridas={dosAnios} format={format} />)

    expect(screen.getByText('2026-03')).toBeVisible()
    expect(screen.queryByText('2025-11')).toBeNull()
  })

  it('si NADIE corrió el año en curso, igual se ve el último que sí · no queda vacía', () => {
    // ── LA MUTACIÓN QUE SOBREVIVIÓ, Y POR QUÉ ───────────────────────────────
    //
    // Cambiar el año por defecto por `new Date().getFullYear()` NO rompía
    // ninguna prueba, porque los fixtures tienen 2026 y el reloj también está en
    // 2026: los dos mundos se ven idénticos **hoy**.
    //
    // Y el defecto es real: el 1 de enero de 2027, con el reloj, esta pantalla
    // abriría en un año sin una sola corrida y mostraría la tabla vacía — que es
    // exactamente lo que la consola hizo con el mes abierto el 2026-10-01.
    //
    // **El único fixture que los distingue es uno sin corridas del año en
    // curso**, y por eso es el que vale. Esta prueba no envejece: el año del
    // fixture se queda atrás solo.
    render(<RunHistory corridas={[corrida({ periodo: '2025-11', id: 'r-2025' })]} format={format} />)

    expect(screen.getByText('2025-11')).toBeVisible()
    expect(screen.queryByText(/todavía no hay cargas/i)).toBeNull()
  })

  it('y se puede sumar un año anterior', () => {
    render(<RunHistory corridas={dosAnios} format={format} />)
    expect(screen.getByRole('button', { name: '2025' })).toBeVisible()
  })

  it('al elegirlo se ven SUS corridas y no las del otro', async () => {
    render(<RunHistory corridas={dosAnios} format={format} />)
    await userEvent.click(screen.getByRole('button', { name: '2025' }))

    expect(screen.getByText('2025-11')).toBeVisible()
    expect(screen.queryByText('2026-03')).toBeNull()
  })

  it('un año que nadie corrió NO se ofrece', () => {
    // Ofrecer 2024 porque «existió» llevaría a una tabla vacía sin razón.
    render(<RunHistory corridas={dosAnios} format={format} />)
    expect(screen.queryByRole('button', { name: '2024' })).toBeNull()
  })
})

describe('los estados de la tabla', () => {
  it('sin corridas lo dice y explica cuándo aparecerá una', () => {
    render(<RunHistory corridas={[]} format={format} />)
    expect(screen.getByText(/todavía no hay cargas registradas/i)).toBeVisible()
    expect(screen.getByText(/cada vez que se calculan las métricas/i)).toBeVisible()
  })

  it('mientras trae no dice que no hay · son cosas distintas', () => {
    // «Vacío» y «todavía no llegó» leídos igual es el defecto que `SkeletonRows`
    // existe para evitar en las otras tablas de admin.
    render(<RunHistory corridas={[]} format={format} cargando />)
    expect(screen.getByText(/trayendo el historial/i)).toBeVisible()
    expect(screen.queryByText(/todavía no hay cargas/i)).toBeNull()
  })
})
