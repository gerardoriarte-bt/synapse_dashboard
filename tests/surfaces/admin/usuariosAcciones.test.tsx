// @vitest-environment jsdom

/** Usuarios organizados por cliente, y con acciones · 2026-10-09
 *
 *  Sale de `docs/AUDITORIA-2026-10-08-admin-clientes-y-usuarios.md`: los
 *  usuarios estaban «mezclados» y no había ninguna acción por fila. Lo que estas
 *  pruebas fijan es lo que se puede romper sin que se vea:
 *
 *  · que cada acción DISPARE con el usuario y el cambio correctos —un botón
 *    muerto se ve igual que uno vivo—;
 *  · que el rol se elija entre los de SU cliente —el servicio rechaza otro—;
 *  · que la fila propia no ofrezca nada —«nadie se revoca a sí mismo»—;
 *  · y que aprobar diga con qué rol entra la persona ANTES de apretar.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createFormat } from '@/render/format'
import { UserList } from '@/surfaces/admin/UserList'
import { AccessRequests } from '@/surfaces/admin/AccessRequests'
import type { Agente, SolicitudDeAcceso, Usuario } from '@/api/admin'

const format = createFormat('es-MX')

const usuario = (p: Partial<Usuario> & { id: string }): Usuario => ({
  nombre: 'Sofía Marín',
  email: 'sofia@ua.test',
  rol: 'planner',
  rolId: 'r-planner',
  ultimoAccesoEn: null,
  activo: true,
  altaEn: '2026-08-14T10:00:00Z',
  clienteNombre: 'Under Armour México',
  clienteId: 'c-ua',
  ...p,
})

const USUARIOS = [
  usuario({ id: 'u-1', nombre: 'Ana', rol: 'admin', rolId: 'r-admin' }),
  usuario({ id: 'u-2', nombre: 'Bruno' }),
  usuario({ id: 'u-3', nombre: 'Carla', clienteId: 'c-k', clienteNombre: 'Keralty', rol: 'ceo', rolId: 'r-ceo', activo: false }),
]

const ROLES: Record<string, { id: string; nombre: string }[]> = {
  'c-ua': [
    { id: 'r-admin', nombre: 'admin' },
    { id: 'r-planner', nombre: 'planner' },
  ],
  'c-k': [{ id: 'r-ceo', nombre: 'ceo' }],
}

const nombres: Record<string, string> = { 'c-ua': 'UA MX · ua_mx', 'c-k': 'Keralty · ker' }

function lista(extra: Partial<Parameters<typeof UserList>[0]> = {}) {
  const onCambiar = vi.fn()
  render(
    <UserList
      format={format}
      usuarios={USUARIOS}
      total={3}
      clientesConUsuarios={2}
      nombreDeCliente={(id) => nombres[id] ?? id}
      rolesDe={(id) => ROLES[id]}
      yoId="u-1"
      onCambiar={onCambiar}
      {...extra}
    />,
  )
  return onCambiar
}

const fila = (nombre: string) => screen.getByText(nombre).closest('tr') as HTMLElement

describe('organizados por cliente', () => {
  it('sin filtro, un grupo por cliente con su nombre y cuántos tiene', () => {
    lista()
    expect(screen.getByRole('columnheader', { name: 'UA MX · ua_mx · 2' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Keralty · ker · 1' })).toBeVisible()
  })

  it('el filtro de cliente deja sólo los suyos', async () => {
    lista()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Cliente' }), 'c-k')
    expect(screen.getByText('Carla')).toBeVisible()
    expect(screen.queryByText('Bruno')).toBeNull()
  })

  it('los filtros de rol y de estado también filtran', async () => {
    lista()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'suspendidos')
    expect(screen.getByText('Carla')).toBeVisible()
    expect(screen.queryByText('Bruno')).toBeNull()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'todos')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rol' }), 'planner')
    expect(screen.getByText('Bruno')).toBeVisible()
    expect(screen.queryByText('Carla')).toBeNull()
  })
})

describe('las acciones DISPARAN, con el usuario y el cambio correctos', () => {
  it('suspender manda `activo: false` del usuario de esa fila', async () => {
    const onCambiar = lista()
    await userEvent.click(within(fila('Bruno')).getByRole('button', { name: 'Suspender a Bruno' }))
    expect(onCambiar).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-2', clienteId: 'c-ua' }), { activo: false })
  })

  it('a un suspendido se lo reactiva', async () => {
    const onCambiar = lista()
    await userEvent.click(within(fila('Carla')).getByRole('button', { name: 'Reactivar a Carla' }))
    expect(onCambiar).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-3' }), { activo: true })
  })

  it('el rol se elige entre los de SU cliente, y el cambio llega', async () => {
    const onCambiar = lista()
    const selector = within(fila('Bruno')).getByRole('combobox', { name: 'Rol de Bruno' })
    // Los dos de UA y ninguno de Keralty: el servicio rechaza un rol ajeno.
    expect(within(selector).getAllByRole('option').map((o) => o.textContent)).toEqual(['admin', 'planner'])

    await userEvent.selectOptions(selector, 'r-admin')
    expect(onCambiar).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-2' }), { rolId: 'r-admin' })
  })

  it('mientras no llegaron sus roles, no hay selector · una lista vacía mentiría', () => {
    lista({ rolesDe: () => undefined })
    expect(within(fila('Bruno')).queryByRole('combobox')).toBeNull()
    expect(within(fila('Bruno')).getByText('planner')).toBeVisible()
  })

  it('la fila PROPIA no ofrece nada, y lo dice', () => {
    lista()
    const propia = fila('Ana')
    expect(within(propia).queryByRole('combobox')).toBeNull()
    expect(within(propia).queryByRole('button')).toBeNull()
    expect(within(propia).getByText(/Vos · sin acciones sobre tu cuenta/)).toBeVisible()
  })

  it('sin manejador no se pinta ninguna acción', () => {
    render(<UserList format={format} usuarios={USUARIOS} rolesDe={(id) => ROLES[id]} />)
    expect(screen.queryByRole('button', { name: /Suspender|Reactivar/ })).toBeNull()
    expect(screen.queryByRole('combobox', { name: /^Rol de / })).toBeNull()
  })
})

describe('dentro de la ficha · alcance de cliente', () => {
  it('sin la columna ni el filtro de cliente, que ahí ya están decididos', () => {
    render(<UserList alcance="cliente" format={format} usuarios={USUARIOS.slice(0, 2)} />)
    expect(screen.queryByRole('columnheader', { name: 'Cliente' })).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'Cliente' })).toBeNull()
    expect(screen.getByText(/Usuarios de este cliente · 2/)).toBeVisible()
  })
})

/* ── La cola de solicitudes ─────────────────────────────────────────────── */

const solicitud = (p: Partial<SolicitudDeAcceso> = {}): SolicitudDeAcceso => ({
  id: 'ar-1',
  tipo: 'alta',
  nombre: 'Solicitante Prueba',
  email: 'solicitante@prueba.test',
  empresa: 'Prueba',
  cargo: 'Analista',
  telefono: '000',
  uso: 'medir la cola',
  estado: 'pendiente',
  creadaEn: '2026-10-09T09:50:04Z',
  clienteNombre: null,
  ...p,
})

const agente = (p: Partial<Agente> & { id: string }): Agente => ({
  nombre: 'Synapse UA',
  rol: 'admin',
  activo: true,
  vistas: 1,
  editadoEn: '2026-09-25T08:33:47Z',
  ...p,
})

function cola(solicitudes: SolicitudDeAcceso[], agentes: Record<string, Agente[]>) {
  const onAprobar = vi.fn()
  const onRechazar = vi.fn()
  render(
    <AccessRequests
      solicitudes={solicitudes}
      format={format}
      clientes={[
        { id: 'c-ua', etiqueta: 'UA MX · ua_mx' },
        { id: 'c-k', etiqueta: 'Keralty · ker' },
      ]}
      agentesDe={(id) => agentes[id]}
      enviando={null}
      error={null}
      onAprobar={onAprobar}
      onRechazar={onRechazar}
    />,
  )
  return { onAprobar, onRechazar }
}

describe('aprobar dice con qué rol entra, ANTES de apretar', () => {
  it('sin cliente y agente elegidos no se puede aprobar', () => {
    cola([solicitud()], { 'c-ua': [agente({ id: 'ag-1' })] })
    expect(screen.getByRole('button', { name: /^Aprobar/ })).toBeDisabled()
  })

  it('elegidos, dice «entra como admin» y la aprobación lleva cliente y agente', async () => {
    const { onAprobar } = cola([solicitud()], { 'c-ua': [agente({ id: 'ag-1' })] })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /^Cliente para/ }), 'c-ua')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /^Agente para/ }), 'ag-1')

    // **Medido el 2026-10-09**: el usuario aprobado entra con el rol del agente.
    expect(screen.getByText(/Entra como admin/)).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: /^Aprobar/ }))
    expect(onAprobar).toHaveBeenCalledWith('ar-1', { tenantId: 'c-ua', agenteId: 'ag-1' })
  })

  it('un agente dado de baja no se ofrece', async () => {
    cola([solicitud()], { 'c-ua': [agente({ id: 'ag-1' }), agente({ id: 'ag-2', nombre: 'Viejo', activo: false })] })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /^Cliente para/ }), 'c-ua')
    const opciones = within(screen.getByRole('combobox', { name: /^Agente para/ })).getAllByRole('option')
    expect(opciones.map((o) => o.textContent)).not.toContain('Viejo · admin')
  })

  it('un cliente sin agente activo lo dice, y no deja aprobar', async () => {
    cola([solicitud()], { 'c-k': [] })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /^Cliente para/ }), 'c-k')
    expect(screen.getByText(/no tiene un agente activo/)).toBeVisible()
    expect(screen.getByRole('button', { name: /^Aprobar/ })).toBeDisabled()
  })

  it('un cambio de contraseña se aprueba sin destino', async () => {
    const { onAprobar } = cola([solicitud({ id: 'ar-2', tipo: 'contrasena' })], {})
    await userEvent.click(screen.getByRole('button', { name: /^Aprobar/ }))
    expect(onAprobar).toHaveBeenCalledWith('ar-2', undefined)
    expect(screen.getByText(/Enviar contraseña temporal/)).toBeVisible()
  })

  it('rechazar dispara con su id', async () => {
    const { onRechazar } = cola([solicitud()], {})
    await userEvent.click(screen.getByRole('button', { name: /^Rechazar/ }))
    expect(onRechazar).toHaveBeenCalledWith('ar-1')
  })

  it('sin pendientes lo dice en una línea, sin texto de más', () => {
    cola([], {})
    expect(screen.getByText('Solicitudes de acceso · ninguna pendiente')).toBeVisible()
    expect(screen.queryByText(/Llegan desde/)).toBeNull()
  })
})
