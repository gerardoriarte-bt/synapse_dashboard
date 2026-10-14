// @vitest-environment jsdom

/** La lista de clientes, al lado de la ficha · 2026-10-09
 *
 *  **Dos clientes con el mismo nombre tienen que distinguirse.** En la base
 *  local hay dos «Under Armour México» —uno alimenta la versión anterior de
 *  Synapse— y la fila no decía cuál era cuál. La auditoría del 2026-10-08 lo
 *  encontró; el dibujo de A1 pone el id bajo el nombre por eso mismo.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createFormat } from '@/render/format'
import { TenantList } from '@/surfaces/admin/TenantList'
import type { Tenant } from '@/api/admin'

const format = createFormat('es-MX')

const cliente = (p: Partial<Tenant> & { id: string }): Tenant => ({
  nombre: 'Under Armour México',
  formaCorta: '',
  locale: 'es-MX',
  moneda: 'USD',
  zonaHoraria: 'America/Mexico_City',
  usuarios: 0,
  publicadoEn: null,
  peorFuente: 'unknown',
  peorFuenteHoras: null,
  estado: null,
  vertical: null,
  creadoEn: '2026-09-22T09:18:45Z',
  ...p,
})

const DOS = [
  cliente({ id: '11111111-1111-4111-8111-111111111111' }),
  cliente({ id: 'e65f81ae-50ba-4ceb-bb11-d4c0bb76d111', formaCorta: 'UA MX Lobueno' }),
]

describe('dos clientes con el mismo nombre', () => {
  it('se distinguen por la forma corta, o por el comienzo del id', () => {
    render(<TenantList tenants={DOS} format={format} seleccionado={null} onElegir={() => {}} />)
    expect(screen.getByRole('button', { name: 'Under Armour México · 11111111' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Under Armour México · UA MX Lobueno' })).toBeVisible()
  })

  it('elegir uno pasa SU id, y queda marcado sólo ése', async () => {
    const onElegir = vi.fn()
    const { rerender } = render(
      <TenantList tenants={DOS} format={format} seleccionado={null} onElegir={onElegir} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /UA MX Lobueno/ }))
    expect(onElegir).toHaveBeenCalledWith('e65f81ae-50ba-4ceb-bb11-d4c0bb76d111')

    rerender(
      <TenantList tenants={DOS} format={format} seleccionado="e65f81ae-50ba-4ceb-bb11-d4c0bb76d111" onElegir={onElegir} />,
    )
    expect(screen.getByRole('button', { name: /UA MX Lobueno/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /11111111/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('la búsqueda encuentra por la forma corta', async () => {
    render(<TenantList tenants={DOS} format={format} seleccionado={null} onElegir={() => {}} />)
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'lobueno')
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
