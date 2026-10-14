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
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AgentConfig } from '@/surfaces/admin/AgentConfig'
import { adaptAgent } from '@/api/admin'
import { createFormat } from '@/render/format'
import type { WireAgent, Agente } from '@/api/admin'
import type { EstadoDelAcceso } from '@/surfaces/admin/estadoDelAcceso'

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

const format = createFormat('es-MX')
const now = new Date('2026-10-14T16:00:00Z')

/** **Con las props de la verificación** · 2026-10-14. Por defecto, sin
 *  verificar: es el estado con el que se abre la ficha. */
function bloque(agentes: readonly Agente[], extra: Partial<Parameters<typeof AgentConfig>[0]> = {}) {
  const acceso: EstadoDelAcceso = { estado: 'sin-verificar' }
  return render(
    <AgentConfig
      agentes={agentes}
      sinRoles={false}
      acceso={acceso}
      nombreDeMetrica={(k) => ({ revenue_forecast: 'Proyección de revenue' })[k] ?? k}
      format={format}
      now={now}
      {...extra}
    />,
  )
}

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
    const { container } = bloque([agente()])
    for (const plomeria of ['DB_BT_UA', 'BT_UA_MART_ANALYTICS', 'WH_SYNAPSE', 'SYNAPSE_METRIC_CATALOG']) {
      expect(container.textContent).not.toContain(plomeria)
    }
  })

  it('el rol que se muestra es el de PRODUCTO', () => {
    // `target_role` sale de `roles.name` —«Planner», «CEO»— y no es un rol
    // técnico de Snowflake, que es lo que §7.3 prohíbe.
    bloque([agente()])
    expect(screen.getByText('Planner')).toBeInTheDocument()
  })
})

describe('F4.4 · el estado del acceso se DECLARA pendiente, no se deduce', () => {
  it('un agente activo NO dice «vigente» · dice «Sin verificar»', () => {
    // **Es la aserción de la tarea.** `is_active` solo dice que nadie lo dio de
    // baja: un agente activo con la credencial vencida se ve igual que uno que
    // funciona.
    bloque([agente({ is_active: true })])

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
    bloque([agente({ is_active: false })])
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('sin verificar lo dice, y «Verificar ahora» DISPARA · 2026-10-14', async () => {
    // **Era «Pendiente · se desbloquea con una comprobación del acceso».** La
    // comprobación existe —`schema-check`— y ahora se pide desde acá.
    const onVerificar = vi.fn()
    bloque([agente()], { onVerificar })
    expect(screen.getByText('Sin verificar en esta sesión')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Verificar ahora' }))
    expect(onVerificar).toHaveBeenCalledOnce()
  })

  it('sin agentes lo dice, y no ofrece verificar', () => {
    // Un cliente sin agente y un cable sin verificación de acceso son dos cosas
    // distintas. Esconder la segunda cuando falta la primera las confunde.
    // **`sinRoles={false}` y no por defecto** · F5.20. La rama `BLOQUEADO` del
    // dibujo REEMPLAZA este cuerpo, así que estas nueve pruebas tienen que decir
    // en qué estado están: sin roles no hay declaración de acceso que hacer, hay
    // un bloqueo. La prop es obligatoria justamente para que eso no se decida por
    // omisión — y la rama nueva se prueba montando la pantalla, en `enAlta`.
    bloque([], { onVerificar: vi.fn() })
    expect(screen.getByText(/todavía no tiene un agente/)).toBeVisible()
    // **Desde el 2026-10-14, sin agente no hay nada que verificar**, así que no
    // se ofrece: un botón que contesta «no hay agente» promete algo que no hace.
    expect(screen.queryByRole('button', { name: 'Verificar ahora' })).toBeNull()
  })
})

describe('§PEN:A2 · los literales del bloque de acceso', () => {
  it('el bloque se llama «Acceso a datos», no «Agente de datos»', () => {
    // Al super-admin no le importa que haya un agente: le importa si el rol ve
    // el dato. El nombre viejo describía la plomería.
    bloque([agente()])
    expect(screen.getByText('Acceso a datos')).toBeVisible()
  })

  it('el ROL va primero · la pantalla contesta «qué ve cada rol»', () => {
    // Es la misma pregunta que encabeza la ficha de cliente.
    const { container } = bloque([agente()])
    const encabezados = Array.from(container.querySelectorAll('th')).map((t) => t.textContent)
    expect(encabezados[0]).toBe('Rol')
  })

  it('la nota dura del permiso está escrita', () => {
    // Se puede componer un panel que un rol no va a poder ver, y eso no es un
    // error de composición. Es lo que más enseña de esta pantalla.
    const { container } = bloque([agente()])
    // **«en el backend» salió de la pantalla el 2026-09-30.** Es vocabulario
    // nuestro en la ficha de un cliente, y lo que importa decir es CUÁNDO se
    // aplica el permiso —al servir el dato, no al componer—, que es lo que vuelve
    // útil la advertencia. `copy-producto` no lo marcó porque es texto suelto
    // entre etiquetas y el chequeo sólo mira cadenas entre comillas: lo encontró
    // leerlo.
    expect(container.textContent).toMatch(/El permiso se aplica al servir el dato, no al componer/)
    expect(container.textContent).toMatch(/un rol sin acceso no ve el\s+dato aunque el panel exista/)
  })
})

describe('la verificación del acceso · 2026-10-14 · la consecuencia, no la plomería', () => {
  const verificado = '2026-10-14T15:33:07Z'

  it('vigente lo dice en la fila y abajo, y ya no dice «sin verificar»', () => {
    bloque([agente()], { acceso: { estado: 'vigente', verificadoEn: verificado, sinCalculo: [] } })
    const fila = screen.getByText('Activo').closest('tr') as HTMLElement
    expect(fila.textContent).toContain('Vigente')
    expect(screen.getByText(/responden y está todo lo que el producto lee/)).toBeVisible()
    expect(screen.queryByText('Sin verificar en esta sesión')).toBeNull()
  })

  it('las métricas sin cálculo se dicen APARTE, con su nombre y no su clave', () => {
    // **Es lo que hacía que el servicio dijera `ok: false` en UA** con el
    // acceso andando. No es un problema de acceso, y la fila sigue vigente.
    bloque([agente()], {
      acceso: { estado: 'vigente', verificadoEn: verificado, sinCalculo: ['revenue_forecast', 'otra_clave'] },
    })
    expect(screen.getByText('Activo').closest('tr')?.textContent).toContain('Vigente')
    expect(
      screen.getByText(/2 métricas del catálogo todavía no tienen cálculo: Proyección de revenue, otra_clave/),
    ).toBeVisible()
  })

  it('faltan datos nombra las métricas afectadas y quién lo resuelve', () => {
    bloque([agente()], {
      acceso: { estado: 'faltan-datos', verificadoEn: verificado, afectadas: ['revenue_forecast'], sinCalculo: [] },
    })
    expect(screen.getByText('Activo').closest('tr')?.textContent).toContain('Faltan datos')
    expect(screen.getByText(/faltan para 1 métrica: Proyección de revenue\. Lo resuelve el equipo interno/)).toBeVisible()
  })

  it('sin acceso dice la razón y quién lo resuelve', () => {
    bloque([agente()], {
      acceso: { estado: 'sin-acceso', razon: 'Las credenciales de este cliente no permiten conectarse a sus datos.' },
    })
    expect(screen.getByText('Activo').closest('tr')?.textContent).toContain('Sin acceso')
    expect(screen.getByText(/no permiten conectarse a sus datos\. Lo resuelve el equipo interno/)).toBeVisible()
  })

  it('mientras verifica, el botón no se puede volver a apretar', () => {
    bloque([agente()], { acceso: { estado: 'verificando' }, onVerificar: vi.fn() })
    expect(screen.getByRole('button', { name: 'Verificar ahora' })).toBeDisabled()
  })

  it('un agente dado de baja no queda «vigente» aunque el cliente sí', () => {
    bloque([agente({ is_active: false })], { acceso: { estado: 'vigente', verificadoEn: verificado, sinCalculo: [] } })
    expect(screen.getByText('Inactivo').closest('tr')?.textContent).toContain('Sin verificar')
  })
})
