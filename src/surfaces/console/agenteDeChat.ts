/** Qué agente arranca elegido en el selector del admin · 2026-10-06
 *
 *  ── POR QUÉ HAY UN DEFECTO Y NO UN «ELEGÍ UNO» ───────────────────────────────
 *
 *  **Sin `agent_id` el servicio busca el agente cuyo `target_role` es el rol del
 *  JWT en el tenant del JWT.** En QA, UA tiene un solo agente y es `Planner`,
 *  así que un admin que no elige recibe 409 y no puede preguntar nada — medido
 *  el 2026-10-06, y era «el agente no me funciona». Dejar el selector vacío por
 *  defecto reproduce exactamente esa falla.
 *
 *  **El orden, y por qué:**
 *
 *  1. Si el tenant del usuario tiene un agente para `admin`, **ninguno**: el
 *     servicio ya lo resuelve solo, y forzar otro le quitaría al admin el
 *     agente que configuraron para él.
 *  2. Si no, **el primero de su tenant**: es el dato que el admin está mirando,
 *     y preguntarle al agente de otro cliente por defecto mezclaría tenants.
 *  3. Si su tenant no tiene ninguno, **ninguno**: el 409 que vuelva dice por
 *     qué, y elegir el de otro cliente en silencio sería peor.
 *
 *  La comparación del rol se normaliza igual que `esAdmin`, porque en QA
 *  conviven `admin` y `Planner` con mayúsculas distintas.
 */
import { ROL_ADMIN } from '../../api/rol'
import type { ChatAgent } from '../../api/types'

export function agentePorDefecto(agentes: ChatAgent[], tenantId: string): string | undefined {
  const propios = agentes.filter((a) => a.tenantId === tenantId)
  if (propios.some((a) => a.rolObjetivo.trim().toLowerCase() === ROL_ADMIN)) return undefined
  return propios[0]?.id
}

/** La etiqueta de una opción · la que sugiere el backend: tenant, agente, rol.
 *  Con el tenant primero, porque es lo que distingue a dos agentes que se
 *  llaman parecido —hay dos de Terpel—. */
export function etiquetaDeAgente(a: ChatAgent): string {
  return `${a.tenantNombre} · ${a.nombre} · ${a.rolObjetivo}`
}
