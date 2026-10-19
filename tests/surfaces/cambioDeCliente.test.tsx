// @vitest-environment jsdom

/** Cambiar de cliente se entiende · F5.39 y F5.40, 2026-10-19
 *
 *  `docs/AUDITORIA-2026-10-19-cambio-de-cliente.md`: nada marcaba el cliente de
 *  la sesión, y «Volver al dashboard» llevaba a la consola del propio sin decirlo
 *  aunque se viniera trabajando sobre otro.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SelectorDeCliente } from '@/surfaces/SelectorDeCliente'
import { VolverAlDashboard } from '@/surfaces/VolverAlDashboard'

const CLIENTES = [
  { id: 'ua', nombre: 'Synapse UA HTML' },
  { id: 'keralty', nombre: 'Keralty' },
]

describe('el selector marca el cliente propio', () => {
  it('«tu cliente» va sólo en el de la sesión', () => {
    render(<SelectorDeCliente clientes={CLIENTES} activo="keralty" onElegir={vi.fn()} propio="ua" />)
    expect(screen.getByRole('option', { name: 'Synapse UA HTML · tu cliente' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Keralty' })).toBeInTheDocument()
  })
})

describe('«Volver al dashboard» dice adónde va', () => {
  it('con otro cliente de trabajo, nombra la consola a la que vuelve', async () => {
    const onIr = vi.fn()
    render(<VolverAlDashboard onIr={onIr} alCliente="Synapse UA HTML" />)
    const boton = screen.getByRole('button', { name: 'Volver a la consola de Synapse UA HTML, el cliente de tu sesión' })
    expect(boton).toHaveTextContent('Volver a la consola de Synapse UA HTML')
    // Y sigue llevando a la consola: el botón que se renombra DISPARA.
    await userEvent.click(boton)
    expect(onIr).toHaveBeenCalledWith('/')
  })

  it('trabajando sobre el propio, sigue diciendo «Volver al dashboard»', () => {
    render(<VolverAlDashboard onIr={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Volver al dashboard' })).toBeInTheDocument()
  })
})
