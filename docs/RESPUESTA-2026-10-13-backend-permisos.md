# Para el equipo de front · permisos y super-admin · respuesta backend · 2026-10-13

Referencia: [`MENSAJE-2026-10-10-backend-permisos-y-super-admin.md`](MENSAJE-2026-10-10-backend-permisos-y-super-admin.md), medido por ustedes contra `9dc481e`.

**Hecho en `8272085`** (`feature/dynamic-dashboard-backend`).

**Commit en QA:** no lo sabemos desde este repo. Hay que mirar el tag o la imagen desplegada. Hasta que `8272085` no esté en esa imagen, QA sigue con el agujero de `9dc481e`.

---

## Por pedido

### 1 · Cerrar el agujero de `/admin/*` (cliente de la ruta = cliente del token)

**Hecho en `8272085`.**

- Toda ruta `/admin` con `:tenantId` responde **403** `no puedes administrar otro cliente` si ese id no es el `tenant_id` del JWT.
- `GET /admin/tenants` devuelve solo el cliente del token.
- `GET /admin/users` queda filtrado al cliente del token. Si mandan `tenant_id` de otro, **403**.
- `POST /admin/users` y `POST /admin/agents` con `tenant_id` de otro cliente: **403**.
- `POST /admin/access-requests/:id/approve` con `tenant_id` de otro cliente: **403**.
- `POST /admin/tenants` (alta de cliente) y `POST /admin/materialize/run` (todos los clientes): **403** `esta acción es solo para operadores de plataforma`.

**Excepción provisoria**, hasta el plano de plataforma: variable `PLATFORM_OPERATOR_USER_IDS` (UUIDs de `user_id`, separados por coma). Quien esté en esa lista conserva el cruce de clientes. Vacía = nadie cruza. No es el super-admin del diseño; es el puente para no dejar a Lo Bueno sin operar el día del deploy.

**No cerrado en este corte:** rutas que no llevan `:tenantId` en el path (`/admin/layouts/:layoutId`, `/admin/roles/:roleId`, `/admin/dashboards/:dashboardId`, listado global de access-requests). Siguen abiertas si se conoce el UUID. El siguiente corte las ata al cliente del recurso.

### 2 · Plano de plataforma (entidad super-admin, login aparte, MFA, lista de clientes, auditoría)

**No hecho.** Es un producto distinto: tabla nueva, sesión distinta y MFA. No lo metimos en el rol `admin` para no repetir el agujero. El puente es `PLATFORM_OPERATOR_USER_IDS`. Lo armamos cuando cerremos las rutas por UUID y definamos el login.

### 3 · Permiso de editar en el rol, en lugar del nombre `admin`

**No hecho.** `/admin/*` sigue exigiendo que el rol se llame `admin`, y además el cliente del token. El permiso `can_edit` en el rol va después del aislamiento, para no cambiar las dos reglas a la vez.

### 4 · `GET /config/me` con qué se puede ver y qué se puede editar

**No hecho.** El contrato de `/config/me` no cambió. Cuando exista el permiso del rol (pedido 3) y la lista del super-admin (pedido 2), ese endpoint dirá clientes y dashboards con nivel ver/editar. Hasta entonces el front no debe armar un selector de cliente.

### 5 · Consola del super-admin abre otro cliente de su lista

**No hecho.** Cuando exista, la forma será **un token nuevo por cliente**: `/config/*` no cambia y el front cambia de sesión al entrar. No vamos a aceptar un `tenant_id` suelto en cada request de consola.

### 6 · Al aprobar una solicitud, el rol lo elige quien aprueba

**No hecho.** Sigue asignándose `agents.target_role`. El aislamiento del pedido 1 ya impide que un admin de un cliente apruebe hacia otro cliente. El body de approve no tiene `role_id` todavía.

---

## Contrato que sí cambió

| Ruta | Cambio |
|---|---|
| `GET/POST/PUT/DELETE /admin/tenants/:tenantId/...` | **403** si `:tenantId` ≠ `tenant_id` del JWT (salvo `PLATFORM_OPERATOR_USER_IDS`) |
| `GET /admin/tenants` | Solo el cliente del token, salvo operador de plataforma |
| `GET /admin/users` | Filtrado al cliente del token |
| `POST /admin/users`, `POST /admin/agents` | **403** si el `tenant_id` del body es otro cliente |
| `POST /admin/access-requests/:id/approve` | **403** si el `tenant_id` del body es otro cliente |
| `POST /admin/tenants`, `POST /admin/materialize/run` | **403** si el usuario no está en `PLATFORM_OPERATOR_USER_IDS` |

No hay campos nuevos en `GET /config/me`.

## Preguntas del mensaje

- **Cliente «Sistema»:** no está identificado en código como plano de plataforma. El puente es la lista de `user_id`, no el nombre del cliente.
- **Token por cliente vs cliente en cada pedido:** token nuevo por cliente, cuando exista el super-admin.

## QA

`8272085` **no está en QA** hasta la imagen y el deploy. El binario `9dc481e` que midieron sigue con el agujero.
