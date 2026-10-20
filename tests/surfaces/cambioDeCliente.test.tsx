// @vitest-environment jsdom

/** La barra del cliente activo · 2026-10-20
 *
 *  `docs/PROPUESTA-2026-10-20-identidad-del-cliente-y-ficha.md`: el cliente se
 *  reconocía sólo por el nombre, y en local los dos se llaman «Under Armour
 *  México». Lo que se afirma es lo que los separa —la forma corta o el id
 *  corto— y que elegir otro DISPARE.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BarraDeCliente } from '@/surfaces/BarraDeCliente'
import { SelectorDeCliente } from '@/surfaces/SelectorDeCliente'
import { formaCortaVisible, monograma } from '@/surfaces/clienteVisible'

const UA = { id: 'e65f81ae-50ba-4ceb-bb11-d4c0bb76d111', nombre: 'Under Armour México', formaCorta: '' }
const SEMILLA = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Under Armour México', formaCorta: '' }
const TERPEL = { id: 'terpel', nombre: 'Terpel Colombia', formaCorta: 'Terpel CO' }

describe('la identidad del cliente', () => {
  it.each([
    ['Under Armour México', 'UA'],
    ['Terpel Colombia', 'TC'],
    ['Keralty', 'KE'],
    ['  grupo   axo ', 'GA'],
    ['', ''],
  ])('monograma de «%s» → %s', (nombre, esperado) => {
    expect(monograma(nombre)).toBe(esperado)
  })

  it('la forma corta, si dice algo que el nombre no', () => {
    expect(formaCortaVisible(TERPEL)).toBe('TERPEL CO')
  })

  it('vacía o igual al nombre, el id corto: es lo único que separa dos clientes con el mismo nombre', () => {
    expect(formaCortaVisible(UA)).toBe('E65F81AE')
    expect(formaCortaVisible(SEMILLA)).toBe('11111111')
    // `/config/me` cae al nombre cuando `label` está vacío.
    expect(formaCortaVisible({ ...UA, formaCorta: 'under armour méxico' })).toBe('E65F81AE')
  })
})

describe('la barra', () => {
  it('nombra el cliente activo con su forma corta', () => {
    render(<BarraDeCliente activo={TERPEL} clientes={[UA, TERPEL]} onElegir={vi.fn()} />)
    const barra = screen.getByRole('region', { name: 'Cliente activo' })
    expect(within(barra).getByText('Terpel Colombia')).toBeInTheDocument()
    expect(within(barra).getByText('TERPEL CO')).toBeInTheDocument()
    expect(within(barra).getByRole('button', { name: /Cambiar de cliente/ })).toBeInTheDocument()
  })

  it('sin selector con un solo cliente, o sin manejador', () => {
    const { rerender } = render(<BarraDeCliente activo={UA} clientes={[UA]} onElegir={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Cambiar de cliente/ })).toBeNull()
    rerender(<BarraDeCliente activo={UA} clientes={[UA, TERPEL]} />)
    expect(screen.queryByRole('button', { name: /Cambiar de cliente/ })).toBeNull()
  })

  it('mientras carga no afirma un cliente', () => {
    render(<BarraDeCliente activo={null} clientes={[]} />)
    const barra = screen.getByRole('region', { name: 'Cliente activo' })
    expect(barra.textContent).toBe('')
  })
})

describe('el selector', () => {
  it('cada opción lleva nombre y forma corta, y los dos «Under Armour México» se distinguen', async () => {
    render(<SelectorDeCliente clientes={[UA, SEMILLA, TERPEL]} activo={UA.id} onElegir={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Cambiar de cliente/ }))
    const opciones = screen.getAllByRole('menuitemradio')
    expect(opciones.map((o) => o.textContent)).toEqual([
      'UAUnder Armour MéxicoE65F81AE',
      'UAUnder Armour México11111111',
      'TCTerpel ColombiaTERPEL CO',
    ])
    expect(opciones[0]).toHaveAttribute('aria-checked', 'true')
    expect(opciones[1]).toHaveAttribute('aria-checked', 'false')
  })

  it('elegir otro DISPARA y cierra', async () => {
    const onElegir = vi.fn()
    render(<SelectorDeCliente clientes={[UA, TERPEL]} activo={UA.id} onElegir={onElegir} />)
    await userEvent.click(screen.getByRole('button', { name: /Cambiar de cliente/ }))
    await userEvent.click(screen.getByRole('menuitemradio', { name: /Terpel Colombia/ }))
    expect(onElegir).toHaveBeenCalledWith('terpel')
    expect(screen.queryByRole('menu', { name: 'Clientes' })).toBeNull()
  })

  it('elegir el que ya está activo no dispara', async () => {
    const onElegir = vi.fn()
    render(<SelectorDeCliente clientes={[UA, TERPEL]} activo={UA.id} onElegir={onElegir} />)
    await userEvent.click(screen.getByRole('button', { name: /Cambiar de cliente/ }))
    await userEvent.click(screen.getByRole('menuitemradio', { name: /E65F81AE/ }))
    expect(onElegir).not.toHaveBeenCalled()
  })

  it('con siete o más, se puede buscar por nombre o forma corta', async () => {
    const muchos = Array.from({ length: 6 }, (_, i) => ({ id: `c${String(i)}`, nombre: `Cliente ${String(i)}` }))
    render(<SelectorDeCliente clientes={[...muchos, TERPEL]} activo="c0" onElegir={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Cambiar de cliente/ }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'terpel co')
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(1)
  })

  it('Escape cierra', async () => {
    render(<SelectorDeCliente clientes={[UA, TERPEL]} activo={UA.id} onElegir={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Cambiar de cliente/ }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: 'Clientes' })).toBeNull()
  })
})
