# Para el equipo de front · consola por cliente, medida · 2026-10-20

Referencia: [`MENSAJE-2026-10-20-backend-consola-por-cliente-medida.md`](../MENSAJE-2026-10-20-backend-consola-por-cliente-medida.md), medido por ustedes contra `d794a3e`.

El dashboard que se pinta es el del cliente del token. Elegir otro cliente sigue siendo `POST /auth/switch-tenant`: el token nuevo trae ese cliente y el rol `superadmin` de ahí, y con él `/config/me`, el catálogo, el batch, el chat y el drill-down son de ese cliente. No hay un dashboard distinto por agente Cortex. El agente de chat de ese cliente se resuelve con el mismo token.

**Hecho en `4ceb36c`** (`feature/dynamic-dashboard-backend`). `d794a3e` no incluye este arreglo.

**No hecho.** El salto no escribe auditoría. Un `admin` sigue pudiendo asignar el rol `superadmin` por el API. El logo no entra en este corte.

**Contrato.** Ninguna ruta nueva. `POST /admin/tenants` ahora deja creado el rol `superadmin` de ese cliente en el mismo alta. `POST /auth/switch-tenant` sigue igual: 404 `NOT_FOUND_ROLE` solo si ese rol no existe o está inactivo.

**Commit en QA:** ninguno de este arreglo. `4ceb36c` no está en QA hasta desplegar esa imagen. Lo que ustedes midieron sigue en `d794a3e`.

---

## Por pedido

### 1 · Un cliente creado desde la plataforma, ¿tiene el rol `superadmin`?

**Hecho en `4ceb36c`.** En `d794a3e` no. Ahí el rol lo crean la migración de arranque y la semilla del dashboard. Un cliente dado de alta con el proceso ya corriendo no lo tenía, y `POST /auth/switch-tenant` respondía 404 `NOT_FOUND_ROLE` hasta el próximo arranque con migraciones.

Ahora `POST /admin/tenants` crea el cliente y, enseguida, el rol `superadmin` de ese cliente (`is_active = true`, sin dashboards ocultos: ve los de ese cliente). El salto puede hacerse sin reiniciar.

El alta no publica un layout. Si ese cliente todavía no tiene dashboard publicado, `/config/me` responde de ese cliente con `dashboards: []`. El dashboard aparece cuando se publica uno, o cuando corre la semilla en el próximo arranque con migraciones. Los clientes que ya tienen layout publicado se siguen pintando como los midieron.

### 2 · ¿La entrada a otro cliente queda registrada?

**No.** `SwitchTenant` firma el token y no inserta una fila. No vamos a agregar una tabla ni una ruta de auditoría en este corte. El registro queda junto con el super-admin aparte (MFA y auditoría), que sigue sin hacerse.

### Asignar `superadmin` desde un `admin`

**No cerrado.** Lo anotaron sin pedido. El front ya no lo ofrece, y está bien dejarlo así. El API sigue aceptando ese nombre en el alta de usuario y ese `role_id` en el `PATCH`. Si quieren que el API lo rechace, lo pedimos aparte.

### Logo

**No.** Sigue abierto, como en el mensaje del 20. No hay campo nuevo. La placa de dos letras sigue siendo la de ahora.

## QA

`4ceb36c` no está en QA. Hasta desplegarlo, un cliente creado en QA después del arranque sigue sin rol `superadmin` y el salto a ese cliente sigue en 404 `NOT_FOUND_ROLE`. Lo que ya midieron contra `d794a3e` en clientes que sí tienen el rol no cambia.
