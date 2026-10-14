/** El estado del acceso · la regla, sin montar nada · 2026-10-14
 *
 *  **El fixture es la respuesta medida en UA** ese día, contra el binario de
 *  `8272085`: `ok: false` con los tres objetos presentes y seis claves sin
 *  cálculo. Es el caso que obliga a no leer el estado de `ok`.
 */
import { describe, expect, it } from 'vitest'
import { adaptarVerificacion } from '@/api/admin'
import { ApiError } from '@/api/types'
import { estadoDelAcceso } from '@/surfaces/admin/estadoDelAcceso'
import type { WireSchemaCheck } from '@/api/admin'

const medidaEnUA: WireSchemaCheck = {
  ok: false,
  tenant_id: 'e65f81ae-50ba-4ceb-bb11-d4c0bb76d111',
  agent_name: 'Synapse UA',
  database: 'DB_BT_UA',
  schema: 'BT_UA_MART_ANALYTICS',
  objects: [
    { name: 'GLD_ECOMM_DAILY_PERFORMANCE', kind: 'table', exists: true, missing: [] },
    { name: 'GLD_PAID_MEDIA', kind: 'table', exists: true, missing: [] },
    { name: 'SYNAPSE_METRIC_CATALOG', kind: 'view', exists: true, missing: [] },
  ],
  affected_metrics: [],
  keys_without_query: [
    'inventory_forecast', 'media_roas_recommendation', 'mmm_channel_contribution',
    'mmm_weekly_contribution', 'revenue_forecast', 'revenue_forecast_close',
  ],
  catalog_source: 'view',
  checked_at: '2026-10-14T15:33:07.652337Z',
}

describe('el adaptador recorta la plomería', () => {
  it('ni base, ni esquema, ni nombres de tabla llegan a la pantalla', () => {
    const v = JSON.stringify(adaptarVerificacion(medidaEnUA))
    for (const plomeria of ['DB_BT_UA', 'BT_UA_MART_ANALYTICS', 'GLD_PAID_MEDIA', 'SYNAPSE_METRIC_CATALOG']) {
      expect(v).not.toContain(plomeria)
    }
  })

  it('una tabla que falta, o una columna, deja los datos incompletos', () => {
    const sinTabla = { ...medidaEnUA, objects: [{ name: 'X', kind: 'table' as const, exists: false, missing: [] }] }
    const sinColumna = { ...medidaEnUA, objects: [{ name: 'X', kind: 'table' as const, exists: true, missing: ['REV_TOTAL'] }] }
    expect(adaptarVerificacion(sinTabla).datosCompletos).toBe(false)
    expect(adaptarVerificacion(sinColumna).datosCompletos).toBe(false)
  })
})

describe('`ok: false` NO es «sin acceso»', () => {
  it('UA medido: vigente, con seis métricas sin cálculo dichas aparte', () => {
    const e = estadoDelAcceso(adaptarVerificacion(medidaEnUA), null, false)
    expect(e.estado).toBe('vigente')
    expect(e.estado === 'vigente' && e.sinCalculo).toHaveLength(6)
  })

  it('con datos incompletos es «faltan datos», con las métricas afectadas', () => {
    const v = adaptarVerificacion({
      ...medidaEnUA,
      objects: [{ name: 'X', kind: 'table', exists: true, missing: ['REV_TOTAL'] }],
      affected_metrics: ['revenue'],
    })
    expect(estadoDelAcceso(v, null, false)).toMatchObject({ estado: 'faltan-datos', afectadas: ['revenue'] })
  })
})

describe('los errores, por su código HTTP', () => {
  it('404 · sin agente: no hay acceso que verificar', () => {
    expect(estadoDelAcceso(undefined, new ApiError('X', 'el tenant no tiene un agente activo', 404), false).estado).toBe('sin-configurar')
  })

  it('422 · las credenciales no conectan', () => {
    expect(estadoDelAcceso(undefined, new ApiError('X', '', 422), false)).toMatchObject({ estado: 'sin-acceso', razon: expect.stringMatching(/credenciales/) })
  })

  it('502 · los datos no respondieron', () => {
    expect(estadoDelAcceso(undefined, new ApiError('X', '', 502), false)).toMatchObject({ estado: 'sin-acceso', razon: expect.stringMatching(/no respondieron/) })
  })

  it('otro error trae el mensaje del servicio', () => {
    expect(estadoDelAcceso(undefined, new ApiError('X', 'algo raro', 500), false)).toEqual({ estado: 'error', razon: 'algo raro' })
  })
})

describe('el orden de las preguntas', () => {
  it('mientras verifica gana sobre un resultado viejo', () => {
    expect(estadoDelAcceso(adaptarVerificacion(medidaEnUA), null, true).estado).toBe('verificando')
  })

  it('sin resultado ni error es «sin verificar»', () => {
    expect(estadoDelAcceso(undefined, null, false).estado).toBe('sin-verificar')
  })
})
