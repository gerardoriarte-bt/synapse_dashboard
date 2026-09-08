# Auditoría · qué servicios consume el front y cuáles no

**2026-09-08.** Se cruzaron los dos contratos contra `src/api/` para ver si
quedaba algún endpoint documentado sin consumir. Salieron dos cosas: los huecos
de la consola están todos justificados, y **el servicio de acceso tiene cuatro
funcionalidades documentadas que nuestro plan no menciona.**

**Método.** Se extrajeron las rutas de `contracts/synapse-api.yaml` y
`contracts/synapse-auth.yaml`, y las llamadas de `src/api/client.ts` y
`src/api/auth.ts`. Repetible.

---

## Consola · 9 de 14 · los cinco huecos están justificados

| Sin consumir | Por qué |
|---|---|
| `/config/accionables` · `/config/accionables/{id}/respuesta` | **F3.10, diferida por D3** |
| `/config/decisiones` · `/config/decisiones/{decisionId}` | **F3.10, diferida por D3** |
| `/config/solicitudes` | **F2.3, parcial**: el CTA no se cablea porque no se sabe si el servicio existe |

Ninguno es un olvido. Los cuatro primeros son las superficies que D3 dejó
diferidas; el quinto es la decisión de no pintar un botón que puede devolver 403.

---

## Acceso · 3 de 20 · y acá sí hay algo

Consumimos `login`, `token-info` y `change-password`. Los diecisiete restantes se
reparten así:

| Cuántos | Cuáles | Estado |
|---|---|---|
| **10** | `/chat/stream`, `/cortex/threads*`, `/history/threads*`, `/access-requests*`, `/admin/access-requests*` | **Esperan la pregunta 1**: están definidos dos veces, acá y en el contrato de la consola |
| **3** | `/admin/tenants`, `/admin/users`, `/admin/agents` | Fase 4. Existen acá y **no** en el contrato de la consola — ver el punto 0 de `PARA-BACKEND.md` |
| **1** | `/agents/ping` | Salud del servicio. No es del front |
| **3** | `/password-reset-requests`, `/tickets`, `/tickets/{ticket_id}/seen` | **No están en nuestro plan.** Ver abajo |

---

## Lo que encontró la auditoría: cuatro funcionalidades sin tarea

El repositorio del servicio tiene **cinco documentos escritos para el front**,
1.690 líneas en total, que describen funcionalidades que **`plan-de-trabajo.md`
no menciona en ninguna de sus 173 tareas**:

| Documento | Líneas | Qué pide |
|---|---|---|
| `access-request-registration-frontend-integration.md` | 403 | Modal de registro, panel admin/planner de pendientes e historial, y asignación de tenant y agente al aprobar |
| `password-reset-frontend-integration.md` | 607 | Flujo de «olvidé mi contraseña», y el campo `type` que distingue registro de recuperación |
| `access-requests-list-frontend-integration.md` | 186 | El listado unificado de solicitudes, con filtro por estado |
| `admin-chat-agent-selector-frontend-integration.md` + `...ultimos-ajustes.md` | 494 | Chat multi-agente con selector, **solo para rol `admin`** |

Y `/tickets` no tiene documento: es una funcionalidad entera —crear, listar,
marcar visto— de la que no hay una palabra en ningún lado nuestro.

**No están «faltando».** Son de un alcance que nadie definió como nuestro, y hay
señales de que se escribieron para otro front: el documento del listado dice
«registro, aprobación, rechazo y demás flujos **ya están integrados**». Se buscó
quién los consume —`~/Documents/GitHub/Synapse/frontend`, el Next— y **no llama a
ninguna de esas rutas**. Así que o hay un tercer front, o los documentos van
adelante de la implementación.

---

## La pregunta

**¿Cuáles de estas cuatro funcionalidades son del dashboard nuevo?**

Se cruzan con lo que ya tenemos de tres maneras distintas, y cada una lleva a un
trabajo diferente:

- **Solicitudes de acceso** ya está en nuestro contrato como `/config/solicitudes`
  y es F2.3. La versión de ellos es más completa. **Es la pregunta 1**, no una
  nueva.
- **Chat con selector de agente** se cruza con toda la Fase 3, que ya está
  construida contra `/config/chat`. También es la pregunta 1.
- **Olvidé mi contraseña** no se cruza con nada: es una pantalla que el
  dashboard no tiene y el servicio ya soporta. Si la queremos, es una tarea
  nueva y **no está bloqueada por nadie**.
- **Tickets** no se cruza con nada y no está documentado en ningún lado nuestro.
  Es una decisión de producto antes que de código.

Las dos primeras se contestan solas cuando se conteste la pregunta 1. Las dos
últimas necesitan que alguien diga si van.

---

*Ver también · `PARA-BACKEND.md` (la pregunta 1 y el punto 0),
`ENTREGA-2026-09-08-login.md`*
