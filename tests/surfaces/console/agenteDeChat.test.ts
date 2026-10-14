/** Qué agente arranca elegido, y el adaptador de `GET /chat/agents` · 2026-10-06
 *
 *  **La prueba del adaptador va de entrada**, que es la lección de A5 y A3: las
 *  pruebas de pantalla construyen el tipo a mano y la frontera queda sin cubrir.
 */
import { describe, expect, it } from 'vitest'
import { adaptChatAgent } from '@/api/adapt'
import { agentePorDefecto } from '@/surfaces/console/agenteDeChat'
import type { ChatAgent } from '@/api/types'

const agente = (id: string, tenantId: string, rolObjetivo: string): ChatAgent => ({
  id,
  nombre: id,
  rolObjetivo,
  tenantId,
  tenantNombre: tenantId,
})

describe('agentePorDefecto', () => {
  it('el tenant tiene agente para admin · ninguno, lo resuelve el servicio', () => {
    // Con mayúscula distinta a propósito: en QA conviven `admin` y `Planner`.
    const lista = [agente('p', 't-1', 'Planner'), agente('a', 't-1', ' Admin ')]
    expect(agentePorDefecto(lista, 't-1')).toBeUndefined()
  })

  it('el tenant NO tiene agente para admin · el primero de SU tenant', () => {
    // El caso de UA en QA: sin esto, 409.
    const lista = [agente('otro', 't-9', 'admin'), agente('ua', 't-1', 'Planner')]
    expect(agentePorDefecto(lista, 't-1')).toBe('ua')
  })

  it('el tenant no tiene ninguno · ninguno, y NO el de otro cliente', () => {
    expect(agentePorDefecto([agente('otro', 't-9', 'Planner')], 't-1')).toBeUndefined()
  })

  it('un agente para admin de OTRO tenant no cuenta como propio', () => {
    const lista = [agente('terpel', 't-9', 'admin'), agente('ua', 't-1', 'Planner')]
    expect(agentePorDefecto(lista, 't-1')).toBe('ua')
  })
})

describe('adaptChatAgent', () => {
  it('renombra los cinco campos y recorta el espacio de la carga', () => {
    // La forma medida en QA el 2026-10-06, con su espacio al final.
    expect(
      adaptChatAgent({
        id: '6deffca1-013a-4489-9a98-5b0d8f1c8ced',
        name: 'Terpel Lubricantes ',
        target_role: 'admin',
        tenant_id: '68d48f6c-56c1-4c62-8d81-c61723c3399e',
        tenant_name: 'Lobueno Analytics Terpel',
      }),
    ).toEqual({
      id: '6deffca1-013a-4489-9a98-5b0d8f1c8ced',
      nombre: 'Terpel Lubricantes',
      rolObjetivo: 'admin',
      tenantId: '68d48f6c-56c1-4c62-8d81-c61723c3399e',
      tenantNombre: 'Lobueno Analytics Terpel',
    })
  })
})
