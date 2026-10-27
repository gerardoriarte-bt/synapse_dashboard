// @vitest-environment jsdom

/** Las microinteracciones · 2026-10-27
 *
 *  **jsdom no corre transiciones**, así que el movimiento se MIRA, y está
 *  grabado en `docs/microinteracciones/`. Lo que sí se prueba es lo que se
 *  puede romper sin que se vea: que la clase esté donde la propuesta dice, que
 *  el dato no reciba más que un fundido, que el shell no se mueva, y que con
 *  menos movimiento pedido nada se mueva.
 */
import { readFileSync } from 'node:fs'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Accion } from '@/render/primitives/Accion'
import { Opcion } from '@/render/primitives/Opcion'
import { Panel } from '@/render/Panel/Panel'
import { BarraDeCliente } from '@/surfaces/BarraDeCliente'
import { SelectorDeCliente } from '@/surfaces/SelectorDeCliente'
import { createFormat } from '@/render/format'
import type { Metric, Payload } from '@/api/types'

const CSS = readFileSync('src/tokens/decisiones.css', 'utf8')

describe('los tokens · dos duraciones y una curva', () => {
  it('120 ms, 180 ms y la curva de salida, con los nombres que Tailwind lee', () => {
    expect(CSS).toMatch(/--transition-duration-rapida:\s*120ms/)
    expect(CSS).toMatch(/--transition-duration-base:\s*180ms/)
    expect(CSS).toMatch(/--ease-salida:\s*cubic-bezier\(0\.2, 0, 0, 1\)/)
  })

  it('ninguna duración ni curva más', () => {
    expect(CSS.match(/--transition-duration-[\w-]+:/g)).toHaveLength(2)
    expect(CSS.match(/--ease-[\w-]+:/g)).toHaveLength(1)
  })

  it('con menos movimiento pedido, toda transición y animación dura cero', () => {
    const bloque = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(bloque).toContain('transition-duration: 0s !important')
    expect(bloque).toContain('animation-duration: 0s !important')
    expect(bloque).toMatch(/\*,\s*\*::before,\s*\*::after/)
  })
})

describe('1 · el hover responde, no salta', () => {
  it('una acción y una opción cambian de color en la duración rápida', () => {
    render(
      <>
        <Accion onClick={vi.fn()}>Guardar</Accion>
        <Opcion elegida={false} onClick={vi.fn()}>
          Mes
        </Opcion>
      </>,
    )
    for (const nombre of ['Guardar', 'Mes']) {
      const clases = screen.getByRole('button', { name: nombre }).className
      expect(clases).toContain('transition-colors')
      expect(clases).toContain('duration-rapida')
      expect(clases).toContain('ease-salida')
    }
  })
})

describe('2 · el menú aparece desde el disparador', () => {
  it('con un fundido y 4 px, y sólo de opacidad y desplazamiento', async () => {
    const ua = { id: 'ua', nombre: 'Under Armour México', formaCorta: '' }
    const terpel = { id: 'terpel', nombre: 'Terpel Colombia', formaCorta: 'Terpel CO' }
    render(<SelectorDeCliente clientes={[ua, terpel]} activo="ua" onElegir={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Cambiar de cliente/ }))
    const menu = screen.getByRole('menu', { name: 'Clientes' }).parentElement as HTMLElement
    expect(menu.className).toContain('starting:opacity-0')
    expect(menu.className).toContain('starting:-translate-y-1')
    expect(menu.className).toContain('transition-[opacity,translate]')
    expect(menu.className).toContain('duration-base')
  })
})

describe('3 · al cambiar de cliente, el nombre vuelve a entrar', () => {
  it('cambiar el cliente monta un elemento nuevo, que es lo que dispara el fundido', () => {
    const ua = { id: 'ua', nombre: 'Under Armour México', formaCorta: '' }
    const terpel = { id: 'terpel', nombre: 'Terpel Colombia', formaCorta: 'Terpel CO' }
    const { rerender } = render(<BarraDeCliente activo={ua} clientes={[ua, terpel]} />)
    const barra = screen.getByRole('region', { name: 'Cliente activo' })
    const antes = within(barra).getByText('Under Armour México').closest('div[class*="starting:"]')
    expect(antes?.className).toContain('starting:opacity-0')

    rerender(<BarraDeCliente activo={terpel} clientes={[ua, terpel]} />)
    const despues = within(barra).getByText('Terpel Colombia').closest('div[class*="starting:"]')
    // Si fuera el mismo nodo, `starting:` no correría y el cambio sería en seco.
    expect(despues).not.toBe(antes)
  })

  it('el mismo cliente no se vuelve a montar · no parpadea en cada render', () => {
    const ua = { id: 'ua', nombre: 'Under Armour México', formaCorta: '' }
    const { rerender } = render(<BarraDeCliente activo={ua} clientes={[ua]} />)
    const antes = screen.getByText('Under Armour México').closest('div[class*="starting:"]')
    rerender(<BarraDeCliente activo={{ ...ua }} clientes={[ua]} />)
    expect(screen.getByText('Under Armour México').closest('div[class*="starting:"]')).toBe(antes)
  })
})

describe('5 · el dato llega con un fundido, y nada más', () => {
  const format = createFormat('es-MX')
  const now = new Date('2026-09-02T12:00:00Z')
  const metric = {
    id: 'm-1',
    key: 'ventas',
    nombre: 'Ventas',
    forma: 'escalar',
    familia: 'demanda',
    capa: 'GOLD',
    fuente: 'ERP',
    ventana: 'Mes',
    base: 'Pedidos',
    estado: 'DISPONIBLE',
    direccionSemantica: null,
    catalogVersion: 1,
  } as Metric
  const conCifra = {
    estado: 'DISPONIBLE',
    valor: { forma: 'escalar', v: 4200 },
    base: 'Pedidos',
    capa: 'GOLD',
    fuente: 'ERP',
    frescura: '2026-09-02T08:00:00Z',
    catalogVersion: 1,
  } as unknown as Payload
  const panel = (payload: Payload) =>
    render(
      <Panel
        metric={metric}
        payload={payload}
        placement={{ colStart: 1, colSpan: 4, rowSpan: 4 }}
        format={format}
        now={now}
      >
        <span>la cifra</span>
      </Panel>,
    )

  it('el cuerpo entra con un fundido de opacidad · sin desplazamiento ni escala', () => {
    panel(conCifra)
    const envoltura = screen.getByText('la cifra').parentElement as HTMLElement
    expect(envoltura.className).toContain('starting:opacity-0')
    expect(envoltura.className).toContain('transition-opacity')
    expect(envoltura.className).not.toMatch(/translate|scale|rotate/)
  })

  it('el shell no se mueve · el título no está dentro del fundido', () => {
    panel(conCifra)
    const envoltura = screen.getByText('la cifra').parentElement as HTMLElement
    expect(within(envoltura).queryByText('Ventas')).toBeNull()
    expect(screen.getByText('Ventas').closest('[class*="starting:"]')).toBeNull()
  })

  it('mientras carga no hay fundido: el esqueleto no pulsa', () => {
    const { container } = panel({ estado: 'CARGANDO' } as Payload)
    expect(container.innerHTML).not.toContain('starting:')
    expect(container.innerHTML).not.toContain('animate-')
  })
})
