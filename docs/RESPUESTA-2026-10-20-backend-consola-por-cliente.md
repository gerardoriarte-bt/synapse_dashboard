# Para el equipo de front · dashboard del superadmin según el cliente · 2026-10-20

El dashboard que se pinta sigue al cliente que elige un usuario con rol `superadmin`. Tabs, períodos, catálogo, batch, chat y drill-down salen del `tenant_id` del JWT.

**Hecho en `d794a3e`** (`feature/dynamic-dashboard-backend`).

**No hecho.** No hay `tenant_id` en cada request de `/config`. El cliente elegido no se guarda: un login nuevo vuelve al cliente de origen. No hay MFA, ni permiso ver/editar, ni un super-admin como entidad aparte de un rol. Esos pedidos del 2026-10-10 siguen abiertos.

**Contrato.** `GET /api/v1/config/me` trae `scope.kind = multi_tenant` y `scope.tenants` solo si el rol es `superadmin`. `admin` y `planner` quedan en `single_tenant`. Ruta nueva `POST /api/v1/auth/switch-tenant` con `{ "tenant_id" }`. Responde `{ token, user }` como el login. Con ese token, `/config/me`, catálogo, batch, chat y drill-down renderizan ese cliente.

**Commit en QA:** ninguno de este corte. `d794a3e` no está en QA hasta que se despliegue esa imagen. El usuario tiene que volver a iniciar sesión.

El cruce de clientes se decide por el rol `superadmin` del JWT. Ya no hace falta un `user_id` en el entorno.

---

## Qué tiene que hacer el front

1. Mostrar el selector de clientes solo cuando `GET /config/me` trae `scope.kind = "multi_tenant"`. Eso ocurre únicamente con rol `superadmin`. `admin` y `planner` llegan con `single_tenant` y no ven selector.
2. Las opciones son `scope.tenants`. En el navbar usar `label`; si viene vacío, `name`.
3. Al elegir un cliente, llamar `POST /auth/switch-tenant` con el token actual.
4. Reemplazar el JWT guardado por `data.token`. El mismo sitio donde se guarda el token del login.
5. Borrar el estado de la consola del cliente anterior (dashboard activo, pestaña, período, payloads, catálogo en memoria, hilo de chat).
6. Volver a pedir `GET /config/me` con el token nuevo y, con ese contexto, catálogo y batch. El cliente pintado es `data.tenant`, no el del login.
7. El cliente marcado en el selector es `data.tenant.id` del `/config/me` nuevo. Después del salto, `scope` sigue en `multi_tenant`: el selector no se esconde.

No mandar `tenant_id` en query, header ni body de `/config/*`. Esas rutas leen el cliente del token.

---

## Servicios

Base: `/api/v1`. Envelope de éxito: `{ "success": true, "data": ... }`. Error: `{ "success": false, "error": "...", "code": "FAMILIA_DETALLE" }`. Header en todo lo protegido: `Authorization: Bearer <token>`.

### 1. Login (ya existe)

`POST /auth/login`

No cambia. Si `data.user.role` es `superadmin`, el token trae su cliente de origen. El selector no se arma con esta respuesta: se arma con el `scope` del paso 2.

Después de cerrar sesión y volver a entrar, este token vuelve al cliente de origen. Si quieren recordar el último cliente, guárdenlo ustedes y, tras el login, llamen el paso 3 con ese `tenant_id`. El backend no lo recuerda.

### 2. Contexto de la consola (ya existe, cambia quién ve la lista)

`GET /config/me`

Llamarlo al entrar y otra vez después de cada salto, siempre con el token vigente.

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "uuid-del-cliente-del-token",
      "name": "Keralty",
      "label": "KER",
      "locale": "es-CO",
      "currency": "COP",
      "timezone": "America/Bogota"
    },
    "dashboards": [],
    "active_dashboard_id": "uuid",
    "active_layout_id": "uuid",
    "tabs": [],
    "periods": ["2026-10"],
    "open_period": "2026-10",
    "scope": {
      "kind": "multi_tenant",
      "tenants": [
        { "id": "uuid-a", "name": "Keralty", "label": "KER" },
        { "id": "uuid-b", "name": "Under Armour México", "label": "UA MX" }
      ]
    }
  }
}
```

| Campo | Uso |
|---|---|
| `scope.kind` | `multi_tenant` muestra el selector. `single_tenant` lo oculta. `tenants` nunca es `null`. |
| `scope.tenants[].id` | Valor que se manda a `switch-tenant`. |
| `scope.tenants[].label` | Texto del selector. Vacío: usar `name`. |
| `tenant` | Cliente que se está renderizando. Nombre, moneda, locale y zona de los períodos. |
| `dashboards`, `active_dashboard_id`, `tabs`, `periods`, `open_period` | Layout del cliente del token. Ignoren ids de dashboard o pestaña del cliente anterior. |

Un rol que no es `superadmin` y pide el dashboard de otro cliente recibe **403** `AUTH_FORBIDDEN`. No tienen que provocar ese caso si no llaman `switch-tenant`.

### 3. Salto de cliente (ruta nueva)

`POST /auth/switch-tenant`

Solo con un token cuyo rol sea `superadmin`.

```json
{ "tenant_id": "uuid-del-cliente-elegido" }
```

`200`, misma forma que el login:

```json
{
  "success": true,
  "data": {
    "token": "jwt-nuevo",
    "user": {
      "id": "uuid-del-usuario",
      "tenant_id": "uuid-del-cliente-elegido",
      "email": "jose.rodriguez@lobueno.co",
      "role": "superadmin",
      "password_updated": true
    }
  }
}
```

Guarden `data.token` y descarten el anterior. `data.user.tenant_id` es el cliente elegido. `data.user.role` sigue siendo `superadmin`. El usuario en base no cambia de cliente de origen.

| Status | `code` | Cuándo |
|---|---|---|
| 400 | `VALIDATION_REQUEST` | Falta `tenant_id` o no es un UUID. |
| 403 | `AUTH_FORBIDDEN` | El rol del token no es `superadmin`. |
| 404 | `NOT_FOUND_TENANT` | Ese cliente no existe. |
| 404 | `NOT_FOUND_ROLE` | Ese cliente no tiene rol `superadmin` activo. |
| 401 | `AUTH` | Token ausente o vencido. Hay que volver al login. |

El token nuevo dura 24 horas, igual que el del login.

### 4. Datos del dashboard (ya existen; se vuelven a pedir con el token nuevo)

Ninguna de estas rutas recibe el cliente. Si se llaman con el token viejo, pintan el cliente anterior.

| Método y ruta | Cuándo | Qué hacer con la respuesta |
|---|---|---|
| `GET /config/catalog` | Después de cada `/config/me` del cliente nuevo | Reemplazar el catálogo en memoria. |
| `GET /config/tabs/:tabId` | Al abrir una pestaña del layout nuevo | Usar un `tabId` de `data.tabs` del `/config/me` nuevo. |
| `POST /config/panels:batch` | Con los paneles de esa pestaña y un período de `data.periods` | Reemplazar los payloads. El período inicial es `open_period`. |
| `PUT /config/me/preferences` | Si el usuario cambia tema o dashboard preferido | `preferred_dashboard_id` es un dashboard del cliente del token, no del anterior. |
| `GET /config/blocks` y `GET /config/plots` | Como hoy | No dependen del cliente. No hace falta repetirlos en cada salto. |

### 5. Chat y drill-down (ya existen; siguen el mismo token)

| Método y ruta | Qué cambia al saltar |
|---|---|
| `POST /config/chat` | El agente y el contexto son del cliente del token nuevo. |
| `GET /config/chat/threads` y `GET /config/chat/threads/:id/messages` | Los hilos son del cliente del token. No reabran un `thread_id` del cliente anterior. |
| `GET /config/panels/:panelId/chat-suggestions` | El `panelId` tiene que ser del layout nuevo. |
| `POST /config/panels/:panelId/drilldown` y `GET /config/panels/:panelId/drilldown/dimensions` | Igual: panel del cliente del token. |

---

## Orden al cambiar de cliente

1. El usuario elige un `id` de `scope.tenants`.
2. `POST /auth/switch-tenant` con `{ "tenant_id": "<id>" }` y el token actual.
3. Si no es `200`, dejar el token y la consola como estaban y mostrar `error`.
4. Si es `200`, guardar `data.token`.
5. Vaciar dashboard activo, pestaña, período, payloads, catálogo cacheado e hilo de chat.
6. `GET /config/me` con el token nuevo.
7. Pintar `data.tenant.label` (o `name`), los `dashboards` y las `tabs` de esa respuesta.
8. `GET /config/catalog`.
9. `POST /config/panels:batch` con el período `open_period` y los paneles de la pestaña activa.

Elegir el mismo cliente que ya está en `data.tenant.id` no requiere otro salto.

---

## Qué no construir

- Un query `tenant_id` en `/config/me`, catálogo o batch. Esas rutas no lo leen.
- El selector para `admin` o `planner`. Si `scope.kind` es `single_tenant`, no hay salto.
- Reutilizar `active_dashboard_id`, `tabId`, `panelId` o `thread_id` de un cliente en el otro.
- Un `user_id` fijo para habilitar el salto. El permiso es el rol `superadmin`.

## QA

`d794a3e` no está en QA. Hasta desplegar esa imagen no existe `POST /auth/switch-tenant` y `scope.kind` no distingue al superadmin. Hay que iniciar sesión de nuevo cuando la imagen nueva esté arriba: el token viejo sigue en el cliente de origen.
