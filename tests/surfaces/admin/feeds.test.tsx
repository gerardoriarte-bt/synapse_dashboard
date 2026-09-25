// @vitest-environment jsdom

/** A5 · Salud de feeds · §PEN:A5 · F4.24
 *
 *  La quinta pantalla de §7.3, dibujada desde siempre y construida el
 *  2026-09-25, el mismo día que llegó su ruta —`1e080ee`, B2.13—.
 *
 *  **Lo que estas pruebas fijan no es que la tabla se dibuje**, sino las tres
 *  cosas que el dibujo declara al pie y que son fáciles de romper sin que se
 *  note: que el estado se derive y no se lea, que «nunca cargó» no se cuente
 *  como degradada, y que lo que el cable no manda se declare en vez de
 *  inventarse.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FeedHealth } from '@/surfaces/admin/FeedHealth'
import type { Fuente } from '@/api/admin'

const fuente = (p: Partial<Fuente> & { clave: string }): Fuente => ({
  nombre: p.clave,
  tablaGold: '',
  cadenciaHoras: 1,
  toleranciaFactor: 2,
  ultimaCargaEn: null,
  frescuraHoras: null,
  filasProcesadas: null,
  filasFallidas: null,
  metricas: [],
  activa: true,
  ...p,
})

describe('el estado se DERIVA · el pie del dibujo', () => {
  it('una fuente horaria con 31 h sale DEGRADADA · el ejemplo del `.pen`', () => {
    render(
      <FeedHealth
        fuentes={[fuente({ clave: 'merchant', frescuraHoras: 31, cadenciaHoras: 1, toleranciaFactor: 2 })]}
        tenant="UA MX"
      />,
    )
    // Acotado a la FILA: «degradado» aparece también en la regla del pie y en
    // el resumen del encabezado, que son otra cosa.
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).getByText('Degradada')).toBeVisible()
  })

  it('la MISMA frescura en una fuente diaria está DENTRO DE LÍMITE', () => {
    // Es lo que hace que el pedido tuviera sentido: la tolerancia es por fuente.
    render(
      <FeedHealth
        fuentes={[fuente({ clave: 'erp', frescuraHoras: 31, cadenciaHoras: 24, toleranciaFactor: 3 })]}
        tenant="UA MX"
      />,
    )
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).getByText('Dentro de límite')).toBeVisible()
  })

  it('y NO se lee `status` · el tipo ni siquiera lo trae', () => {
    // La garantía más fuerte es de tipos: `Fuente` no declara `status`, así que
    // leerlo no compila. Esta aserción lo fija por si alguien lo agrega.
    const f = fuente({ clave: 'x' })
    expect(Object.keys(f)).not.toContain('status')
    expect(Object.keys(f)).not.toContain('estado')
  })
})

describe('«nunca cargó» no es «degradada»', () => {
  it('sale SIN CARGA y el resumen la cuenta aparte', () => {
    render(<FeedHealth fuentes={[fuente({ clave: 'ga4' })]} tenant="UA MX" />)
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).getByText('Sin carga')).toBeVisible()
    expect(screen.getByText(/1 fuente · 0 al día · 0 degradadas · 1 sin carga/i)).toBeVisible()
  })

  it('y al expandirla dice que está SIN ESTRENAR, no atrasada', async () => {
    render(<FeedHealth fuentes={[fuente({ clave: 'ga4' })]} tenant="UA MX" />)
    await userEvent.click(screen.getByRole('button', { name: /por qué/i }))
    expect(screen.getByText(/nunca registró una carga/i)).toBeVisible()
    expect(screen.getByText(/sin estrenar/i)).toBeVisible()
  })
})

describe('la fila expandida contesta la pregunta del título', () => {
  it('dice el cálculo con sus tres términos, no sólo el veredicto', async () => {
    render(
      <FeedHealth
        fuentes={[fuente({ clave: 'merchant', frescuraHoras: 31, cadenciaHoras: 1, toleranciaFactor: 2, metricas: ['feed_gap'] })]}
        tenant="UA MX"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /por qué/i }))
    // «El límite es cadencia × tolerancia = 2 h», literal del dibujo.
    expect(screen.getByText(/cadencia × tolerancia = 2 h/i)).toBeVisible()
  })

  it('y QUÉ LO DESBLOQUEA, que es la mitad de la pregunta', async () => {
    render(
      <FeedHealth
        fuentes={[fuente({ clave: 'merchant', frescuraHoras: 31, metricas: ['feed_gap'] })]}
        tenant="UA MX"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /por qué/i }))
    expect(screen.getByText(/Lo desbloquea/i)).toBeVisible()
    expect(screen.getByText('feed_gap')).toBeVisible()
  })
})

describe('la última carga se formatea · el dibujo no muestra un ISO', () => {
  it('sale la fecha y la hora, no `2026-08-14T08:12:00Z`', () => {
    // §PEN:A5 pone «14 ago» y «08:12» en dos líneas. El ISO crudo se veía en la
    // primera versión, el 2026-09-25, y lo encontró abrirla.
    render(
      <FeedHealth
        fuentes={[fuente({ clave: 'm', ultimaCargaEn: '2026-08-14T08:12:00Z' })]}
        tenant="UA MX"
      />,
    )
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).queryByText(/2026-08-14T/)).toBeNull()
    expect(within(fila).getByText(/14 ago/i)).toBeVisible()
  })

  it('y sin carga no inventa una fecha', () => {
    render(<FeedHealth fuentes={[fuente({ clave: 'm' })]} tenant="UA MX" />)
    const fila = screen.getAllByRole('row')[1] as HTMLElement
    expect(within(fila).getAllByText('—').length).toBeGreaterThan(0)
  })
})

describe('el vacío de ALTA · el tercer tipo', () => {
  it('sin fuentes dice que el cliente es nuevo, y el encabezado se conserva', () => {
    render(<FeedHealth fuentes={[]} tenant="Cliente Nuevo" />)
    // «Las columnas siguen diciendo qué habría acá» · la nota del `.pen`.
    expect(screen.getAllByRole('columnheader')).toHaveLength(8)
    expect(screen.getByText(/todavía no tiene fuentes/i)).toBeVisible()
  })
})

describe('lo que el cable NO manda se declara', () => {
  it('nombra los tres huecos, y la capa entre ellos', () => {
    render(<FeedHealth fuentes={[fuente({ clave: 'x' })]} tenant="UA MX" />)
    expect(screen.getByText(/Faltan 3 cosas/i)).toBeVisible()
    expect(screen.getByText(/Capa · el dibujo la pone como columna/i)).toBeVisible()
  })

  it('y NO pinta «sincronizar todo» ni «ver rechazos» · sin ruta no hay CTA', () => {
    // Los dos están dibujados. Pintarlos sin manejador sería prometer una acción
    // que no existe · la regla del botón muerto.
    render(<FeedHealth fuentes={[fuente({ clave: 'x' })]} tenant="UA MX" />)
    expect(screen.queryByRole('button', { name: /sincronizar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /rechazos/i })).toBeNull()
  })
})
