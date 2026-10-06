# Integración front — Admin: selección de agente en chat

Guía para integrar el **selector de agente** cuando el JWT tiene rol **`admin`**, sin romper el flujo actual de **user** / **planner**.

El caso principal en producto es el **chat del panel del dashboard**:

```http
POST /api/v1/config/chat
```

No confundir con el backoffice **`/admin/tenants/.../agents`** (CRUD de configuración).

---

## Resumen en 30 segundos

| Quién | Listar agentes | Body del chat |
|--------|------------------|---------------|
| **admin** | `GET /api/v1/chat/agents` | Mismo JSON de siempre + **`agent_id` opcional** (raíz del body) |
| **user / planner** | No usar (403) | **Sin** `agent_id` — igual que hoy |

| Endpoint | Cuándo |
|----------|--------|
| **`POST /api/v1/config/chat`** | Chat con **`panel_context`** o **`tab_context`** (dashboard) |
| `POST /api/v1/chat/stream` | Chat genérico solo con `messages[]` (legacy; opcional) |

Credenciales Snowflake **nunca** van en JSON; el backend usa el **tenant del agente elegido**.

---

## 1. Autenticación

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "...", "password": "..." }
```

Respuesta: `{ "success": true, "data": { "token": "<jwt>", "user": { ... } } }`.

Errores HTTP (no SSE) usan el envelope `{ "success": false, "error": "<texto>", "code": "<FAMILIA_DETALLE>" }` (ver `response.go`). Binding JSON en `/config/chat` puede devolver `code: VALIDATION_REQUEST`.

Claims relevantes (también en `GET /api/v1/auth/token-info`):

| Claim | Uso en front |
|-------|----------------|
| `role` | `"admin"` → mostrar selector + permitir `agent_id` |
| `tenant_id` | Tenant del usuario (no cambia al elegir agente de otro tenant) |
| `user_id`, `role_id` | Internos; el chat los usa del JWT |

Todas las peticiones:

```http
Authorization: Bearer <jwt>
```

---

## 2. Flujo dashboard (panel) — **integración principal**

### 2.1 Detectar admin

```ts
const isAdmin = user.role === "admin"; // login o token-info
```

### 2.2 Cargar selector (solo admin)

```http
GET /api/v1/chat/agents
Authorization: Bearer <jwt>
```

- Requiere rol **`admin`** (`AdminOnlyMiddleware`). Otros roles → **403** `acceso no autorizado`.
- Solo agentes **`is_active = true`**, **todos los tenants**.

**Respuesta** (`success` + array en `data`):

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Agente Planner Acme",
    "target_role": "planner",
    "tenant_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "tenant_name": "Acme Corp"
  }
]
```

**UI:** etiqueta sugerida `tenant_name · name · target_role`. Guardar `selectedAgentId` en estado (store / sessionStorage).

**No usar** para este combo:

- `GET /api/v1/admin/tenants/:tenantId/agents` (CRUD, incluye inactivos, otro DTO).
- `GET /api/v1/admin/agents?tenant_id=` (un tenant; flujo access requests).

### 2.3 Enviar pregunta (nuevo hilo)

```http
POST /api/v1/config/chat
Authorization: Bearer <jwt>
Content-Type: application/json
Accept: text/event-stream
```

**Body — panel (ejemplo QA):**

```json
{
  "question": "¿Cuál es el riesgo principal que menciona el resumen?",
  "panel_context": {
    "panel_id": "08c29b56-18f4-53f9-86a3-40b064991bc6",
    "period": "2026-10"
  },
  "agent_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Body — pestaña (alternativa a panel):**

```json
{
  "question": "¿Qué destaca en esta vista?",
  "tab_context": {
    "tab_id": "<uuid-tab>",
    "period": "2026-10"
  },
  "agent_id": "<uuid-opcional-solo-admin>"
}
```

| Campo | Obligatorio | Reglas |
|-------|-------------|--------|
| `question` | Sí | No vacía; máx. **4000 runes** (`chatQuestionMaxRunes`). |
| `panel_context` | Uno de dos | `panel_id` (UUID), `period` (`YYYY-MM`). |
| `tab_context` | Uno de dos | `tab_id` (UUID), `period` (`YYYY-MM`). |
| | | Exactamente **uno** de `panel_context` o `tab_context`. |
| `agent_id` | No | Solo **admin**. Activo, cualquier tenant. Omitir = agente del rol `admin` en el tenant del JWT. |
| `thread_id` | No (1.er turno) | Ver §2.5. |

**Comportamiento sin romper usuarios normales:**

- **user / planner:** no envíen `agent_id` → igual que antes (agente con `target_role` = su rol).
- **admin sin selector:** omitir `agent_id` → agente `target_role = admin` en su tenant.
- **admin con selector:** incluir `agent_id` → Cortex con ese agente (Snowflake del tenant **del agente**).

Si **user/planner** envían `agent_id` → **403** `solo administradores pueden seleccionar un agente`.

### 2.4 Respuesta SSE (`/config/chat`)

- Status: **200**
- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`
- Formato de cada evento (dos líneas + línea en blanco):

```text
event: thread_info
data: {"thread_id":777,"parent_message_id":0,"user_thread_id":"..."}

event: delta
data: {"text":"fragmento"}

event: done
data: {}
```

| `event` | Descripción |
|---------|-------------|
| `thread_info` | **Primero.** IDs para siguientes turnos y historial. |
| `thinking` | Progreso / herramienta (opcional). |
| `delta` | Texto incremental (`data.text`). |
| `data` | Bloque estructurado (métrica, chart, etc.). |
| `sql` | SQL generado (si aplica). |
| `error` | `{ "code", "message" }` — puede ir antes de `done`. |
| `done` | Fin del turno. |

**`thread_info` (guardar en estado):**

| Campo | Tipo | Uso |
|-------|------|-----|
| `thread_id` | number | Enviar en el **siguiente** `POST /config/chat` como `thread_id`. |
| `parent_message_id` | number | Informativo en el stream; **no** se reenvía en el body de config/chat. |
| `user_thread_id` | UUID string | Id interno Synapse → `GET /config/chat/threads/:id/messages`. |

Errores HTTP **antes** del stream (JSON envelope, no SSE):

| HTTP | Cuándo |
|------|--------|
| 400 | Validación (`question`, contexto, `period`, `agent_id` inválido, panel/tab no encontrado, etc.). A veces `code: VALIDATION_REQUEST`. |
| 403 | Sin acceso al panel/tab (`ErrChatPanelForbidden`) o `agent_id` con rol ≠ admin. |
| 404 | Panel/tab/hilo no encontrado. |
| 409 | Sin agente usable (`no hay agente activo disponible para este tenant y rol` / agente inactivo en hilo). |
| 502 | Fallo upstream Cortex al iniciar. |

### 2.5 Continuar conversación (mismo panel / hilo)

```json
{
  "question": "Desglosa por canal",
  "panel_context": {
    "panel_id": "08c29b56-18f4-53f9-86a3-40b064991bc6",
    "period": "2026-10"
  },
  "thread_id": 777
}
```

- **`thread_id`:** el `thread_id` numérico de Cortex del evento `thread_info` (no confundir con `user_thread_id`).
- **No hace falta** `parent_message_id` en el body: el backend lo toma de `user_threads.last_message_id`.
- **`agent_id` se ignora** si hay `thread_id` → agente fijado al crear el hilo.
- Cambiar agente en UI → **nuevo hilo** (quitar `thread_id`, enviar `agent_id` de nuevo).

### 2.6 Historial del chat contextual (mismo producto)

Listar hilos del panel/período:

```http
GET /api/v1/config/chat/threads?panel_id=<uuid>&period=2026-10&limit=50
GET /api/v1/config/chat/threads?tab_id=<uuid>&period=2026-10
```

Respuesta JSON (`data`: array de `DDChatThreadDTO`):

| Campo | Uso en front |
|-------|----------------|
| `id` | UUID Synapse → path de mensajes (mismo valor que `thread_info.user_thread_id`). |
| `thread_id` | Id Cortex → body `thread_id` al continuar chat. |
| `agent_id`, `agent_name` | Agente fijado en el hilo. |
| `first_message_preview`, `period`, `panel_id` / `tab_id`, … | UI de historial. |

Mensajes persistidos:

```http
GET /api/v1/config/chat/threads/{id}/messages?limit=50&before=<RFC3339>
```

`{id}` = campo `id` del listado o `user_thread_id` del SSE.

> **Nota admin:** el hilo se guarda con el **`tenant_id` del JWT** (no cambia al elegir agente de otro tenant). Cortex/Snowflake usan el tenant **del agente**; el listado sigue siendo por usuario + tenant del token.

Sugerencias de preguntas (sin agente):

```http
GET /api/v1/config/panels/{panelId}/chat-suggestions?period=2026-10
```

---

## 3. Resolución de agente (backend)

Aplica a **`POST /config/chat`** (y análogo en **`POST /chat/stream`**).

```
Si thread_id > 0:
  → agente = user_threads.agent_id del usuario + thread (mismo tenant_id en JWT)
  → ignorar agent_id del body

Si thread_id ausente o 0:
  → ResolveForChat(JWT.tenant_id, JWT.role, agent_id opcional)
      si agent_id:
        solo admin; agente activo por id (cualquier tenant)
      si no:
        agente del tenant JWT con target_role = JWT.role
```

---

## 4. Chat legacy — `POST /api/v1/chat/stream`

Solo si el producto tiene chat **sin** contexto de panel. **No** sustituye `/config/chat` en el dashboard.

```http
POST /api/v1/chat/stream
Accept: text/event-stream
```

```json
{
  "agent_id": "<uuid-opcional-admin>",
  "messages": [
    {
      "role": "user",
      "content": [{ "type": "text", "text": "Hola" }]
    }
  ],
  "thread_id": 123,
  "parent_message_id": 456
}
```

| Diferencia vs `/config/chat` |
|------------------------------|
| Body con `messages[]` Cortex, no `question` + `panel_context`. |
| SSE: líneas tipo `data: {...}` (sin nombres `event:` traducidos igual). |
| Continuación usa **`thread_id` + `parent_message_id`** en el body. |

Listado agentes admin: el mismo **`GET /api/v1/chat/agents`**.

---

## 5. Otros endpoints (opcional)

| Endpoint | Admin | Notas |
|----------|-------|--------|
| `GET /api/v1/history/threads` | Ve hilos en **todos los tenants** | `?agent_id=` filtra por agente |
| `GET /api/v1/cortex/threads/:id` | Resolución con `?agent_id=` | Lectura mensajes Snowflake |
| `GET /api/v1/agents/ping` | — | Primer agente activo del **tenant del JWT**; no refleja agente seleccionado |

---

## 6. Errores frecuentes (`agent_id` y agentes)

| HTTP | Mensaje (ejemplo) | Acción front |
|------|-------------------|--------------|
| 403 | `solo administradores pueden seleccionar un agente` | Quitar `agent_id` o usar usuario admin |
| 403 | `acceso no autorizado` | `GET /chat/agents` sin rol admin |
| 400 | `agent_id inválido` | UUID mal formado |
| 400 | `agente no encontrado` | ID inexistente |
| 400 | `el agente está inactivo` | Elegir otro en selector |
| 409 | `no hay agente activo disponible para este tenant y rol` | Sin agente para el rol en el tenant JWT, agente del hilo inactivo, o fallo al resolver rol → crear agente o (admin) enviar `agent_id` |

---

## 7. Estado sugerido (TypeScript)

```ts
type PanelChatState = {
  jwt: string;
  isAdmin: boolean;
  selectedAgentId: string | null; // GET /chat/agents
  cortexThreadId: number | null;  // thread_info.thread_id
  userThreadId: string | null;    // thread_info.user_thread_id
  panelId: string;
  period: string;                 // YYYY-MM
};
```

**Reglas:**

1. `isAdmin === false` → nunca `agent_id` en el body.
2. Cambiar `selectedAgentId` → `cortexThreadId = null` (nueva conversación).
3. Tras `thread_info`, guardar `cortexThreadId` para el siguiente turno.
4. Mismo `panel_context` en cada turno del mismo hilo.

---

## 8. Rate limit

`/config/chat` y `/chat/*` comparten **límite por usuario** (`UserRateLimitMiddleware`). Ante 429, reintentar con backoff.

---

## 9. Smoke test (panel + agente)

```bash
BASE=https://qa-synapse.lobueno.co
TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@...","password":"..."}' \
  | jq -r '.data.token')

curl -s "$BASE/api/v1/chat/agents" -H "Authorization: Bearer $TOKEN" | jq .

AGENT_ID="<uuid>"
PANEL_ID="<uuid>"

curl -N -X POST "$BASE/api/v1/config/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d "{
    \"question\": \"Resumen del panel\",
    \"panel_context\": { \"panel_id\": \"$PANEL_ID\", \"period\": \"2026-10\" },
    \"agent_id\": \"$AGENT_ID\"
  }"
```

Postman: consola `postman/Synapse-API.postman_collection.json` — añadir request `POST /config/chat` con `agent_id` si no existe; `List Agents (admin)` ya está en F0.

---

## 10. Checklist de integración (front)

- [ ] `role === "admin"` desde login o `token-info`.
- [ ] Selector solo con **`GET /api/v1/chat/agents`**.
- [ ] Dashboard: **`POST /config/chat`** (no migrar panel a `/chat/stream`).
- [ ] Admin: `agent_id` en **nuevo** hilo; user/planner: **sin** `agent_id`.
- [ ] Parser SSE con `event:` + `data:`; guardar `thread_info`.
- [ ] Siguientes turnos: mismo `panel_context` + `thread_id` (sin `agent_id`).
- [ ] Cambio de agente → limpiar `thread_id`.
- [ ] Manejar 403 / 409 / 400 según tabla §6.
- [ ] (Opcional) `GET /config/chat/threads` y `/messages` con `user_thread_id`.

---

## 11. Referencias en código

| Pieza | Ubicación |
|-------|-----------|
| Chat panel + `agent_id` | `DDChatHandler.Ask` · `dd_chat_handler.go` |
| Resolución agente | `ddChatService.resolveAgentAndThread` · `ResolveForChat` |
| Lista selector | `ChatHandler.ListAgents` · `AgentService.ListAll` |
| SSE traducido | `dd_chat_service.pump` · `cortex_sse.go` |
| Stream legacy | `ChatHandler.Stream` |
| Rutas | `router.go` — `config.POST("/chat")`, `chat.GET("/agents")` |
| CRUD agentes (no selector) | `AgentHandler` · `/admin/tenants/:tenantId/agents/...` |

Versión API: desplegar build que incluya `agent_id` en **`POST /config/chat`** (campo `json:"agent_id"` en handler).
