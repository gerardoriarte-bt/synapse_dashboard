// @vitest-environment jsdom

/** El agente del cliente · A2 · F4.4
 *
 *  **Lo que se verifica acá es lo que NO se muestra.** §7.3 de `design.md`
 *  prohíbe el vocabulario de infraestructura en esta superficie —«ni base, ni
 *  rol técnico, ni grants, ni warehouse»— y el cable manda las cuatro cosas.
 *  Una prueba que solo mirara lo que se pinta pasaría con la base de datos y el
 *  warehouse a la vista.
 *
 *  Y la otra mitad: **que el estado del acceso se declare pendiente en vez de
 *  deducirse.** `is_active` es un interruptor y `updated_at` dice cuándo se
 *  editó la fila; leer cualquiera de los dos como «acceso vigente» es afirmar
 *  algo que nadie verificó.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AgentConfig } from '@/surfaces/admin/AgentConfig'
import { adaptAgent } from '@/api/admin'
import type { WireAgent } from '@/api/admin'

/** Un agente **como lo manda el servicio**, con toda su plomería.
 *
 *  Copiado de `AgentAdmin` en `contracts/synapse-admin-wire.yaml`, que es la
 *  transcripción de `82da946`. Los campos prohibidos van con valores
 *  reconocibles a propósito: si alguno se filtra a la pantalla, se ve. */
const crudo: WireAgent = {
  id: 'ag-1',
  tenant_id: 't-1',
  name: 'Agente UA MX',
  target_role: 'Planner',
  snowflake_db: 'DB_BT_UA',
  snowflake_schema: 'BT_UA_MART_ANALYTICS',
  snowflake_cortex_agent_name: 'SYNAPSE_AGENT',
  warehouse: 'WH_SYNAPSE',
  semantic_views: ['SYNAPSE_METRIC_CATALOG', 'SYNAPSE_SALES'],
  system_prompt_base: 'Sos el analista de UA MX.',
  is_active: true,
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-15T10:00:00Z',
}

const agente = (parche: Partial<WireAgent> = {}) => adaptAgent({ ...crudo, ...parche })

describe('F4.4 · §7.3 · la plomería no cruza la frontera', () => {
  it('el adaptador NO deja pasar base, esquema ni warehouse', () => {
    // **Se recorta en el adaptador y no en el componente**: si llegaran hasta
    // el render, taparlos sería una decisión de cada pantalla que los use, y
    // alcanza con que una se olvide.
    const a = agente()
    expect(JSON.stringify(a)).not.toContain('DB_BT_UA')
    expect(JSON.stringify(a)).not.toContain('BT_UA_MART_ANALYTICS')
    expect(JSON.stringify(a)).not.toContain('WH_SYNAPSE')
  })

  it('los NOMBRES de las vistas tampoco · solo cuántas son', () => {
    // Son nombres de objeto de Snowflake: la misma plomería con otro nombre.
    // Lo que sí contesta «¿tiene datos asignados?» es el conteo.
    const a = agente()
    expect(JSON.stringify(a)).not.toContain('SYNAPSE_METRIC_CATALOG')
    expect(a.vistas).toBe(2)
  })

  it('la pantalla no pinta ninguno de los cuatro', () => {
    const { container } = render(<AgentConfig agentes={[agente()]} />)
    for (const plomeria of ['DB_BT_UA', 'BT_UA_MART_ANALYTICS', 'WH_SYNAPSE', 'SYNAPSE_METRIC_CATALOG']) {
      expect(container.textContent).not.toContain(plomeria)
    }
  })

  it('el rol que se muestra es el de PRODUCTO', () => {
    // `target_role` sale de `roles.name` —«Planner», «CEO»— y no es un rol
    // técnico de Snowflake, que es lo que §7.3 prohíbe.
    render(<AgentConfig agentes={[agente()]} />)
    expect(screen.getByText('Planner')).toBeInTheDocument()
  })
})

describe('F4.4 · el estado del acceso se DECLARA pendiente, no se deduce', () => {
  it('un agente activo NO dice «vigente» · dice «Sin verificar»', () => {
    // **Es la aserción de la tarea.** `is_active` solo dice que nadie lo dio de
    // baja: un agente activo con la credencial vencida se ve igual que uno que
    // funciona.
    render(<AgentConfig agentes={[agente({ is_active: true })]} />)

    // **La aserción va sobre la FILA, no sobre la pantalla.** La palabra
    // «vigente» sí aparece abajo, en el texto que explica que esa verificación
    // no existe — y ahí es correcta. Lo que no puede pasar es que la fila de un
    // agente la afirme.
    const fila = screen.getByText('Activo').closest('tr')
    expect(fila).not.toBeNull()
    expect(fila!.textContent).toContain('Sin verificar')
    expect(fila!.textContent).not.toMatch(/vigente/i)
  })

  it('activo e inactivo se distinguen', () => {
    render(<AgentConfig agentes={[agente({ is_active: false })]} />)
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('la declaración de pendiente dice qué falta y qué lo desbloquea', () => {
    render(<AgentConfig agentes={[agente()]} />)
    expect(screen.getByText(/Pendiente · el estado del acceso/)).toBeVisible()
    expect(screen.getByText(/Se desbloquea con/)).toBeVisible()
  })

  it('sin agentes la declaración SIGUE, porque el hueco es del cable', () => {
    // Un cliente sin agente y un cable sin verificación de acceso son dos cosas
    // distintas. Esconder la segunda cuando falta la primera las confunde.
    render(<AgentConfig agentes={[]} />)
    expect(screen.getByText(/todavía no tiene un agente/)).toBeInTheDocument()
    // **`toBeVisible` y no `textContent`.** Una mutación que escondía el bloque
    // con `hidden` pasaba: `textContent` incluye lo oculto, así que la prueba
    // leía un texto que nadie ve. Lo encontró la mutación, no la lectura.
    expect(screen.getByText(/Pendiente · el estado del acceso/)).toBeVisible()
  })
})
