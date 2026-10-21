# Para el equipo de front · alta de cliente · Keralty y Terpel · 2026-10-21

Referencia: [`MENSAJE-2026-10-21-backend-alta-de-cliente.md`](../MENSAJE-2026-10-21-backend-alta-de-cliente.md), medido por ustedes contra `30c5c50`.

**Hecho en `26eae4b`** (`feature/dynamic-dashboard-backend`).

**No hecho.** No hay SQL de métricas por cliente (B). El panel en `ERROR` sigue mostrando el mensaje de Snowflake. `exists: false` sigue sin separar «no existe» de «este rol no lo ve». No miramos si Keralty y Terpel comparten el mismo usuario en la base de QA, ni si esas tablas existen.

**Contrato.**

| Qué | Cambio |
|---|---|
| Consultas SQL (materializar, `schema-check`, sync de catálogo, drill-down, sonda de feeds) | El body de la SQL API incluye `role` = `tenants.snowflake_role` de ese cliente. Vacío no se manda. |
| `PUT /api/v1/admin/tenants/{tenantId}` | Acepta `snowflake_url`, `snowflake_account`, `snowflake_user` y `snowflake_role`. Campo ausente = sin cambio. Cadena vacía = 400 y no borra el valor. La clave privada no entra por acá. |
| `GET /api/v1/admin/tenants/{tenantId}/schema-check` | Suma `snowflake_user` y `snowflake_role`: la identidad con la que se miró. |

**Commit en QA:** ninguno de este corte. `26eae4b` no está en QA. Lo que midieron sigue en `30c5c50`, donde la consulta no manda el rol y Snowflake usa el rol por defecto del usuario (`RL_BT_UA_BI`).

El chat con Cortex no manda este rol. El agente de Cortex usa el rol con el que está creado en Snowflake.

---

## Por pedido

### 1 · La conexión usa el rol del cliente

**Hecho en `26eae4b`.** En `30c5c50` `SnowflakeConfigFromTenantAgent` no copiaba `tenant.SnowflakeRole` y el pedido a `/api/v2/statements` iba sin `role`. Snowflake abría la sesión con el rol por defecto del usuario. Por eso Keralty y Terpel salían con `RL_BT_UA_BI`.

Cada cliente guarda su propio `snowflake_user` y su propio `snowflake_role`. El código no obliga a que sean el mismo. No leímos las filas de QA, así que no podemos decir si los tres quedaron cargados con el mismo usuario. El rol que vieron en el error es el de la sesión, no una prueba de que los tres tengan el mismo usuario.

### 2 · Corregir la conexión desde la plataforma

**Hecho en `26eae4b`.** `PUT /admin/tenants/{tenantId}` ahora acepta cuenta, usuario, rol y URL. Se guardan cifrados, igual que en el alta. Una cadena vacía responde 400 y deja el valor anterior. La clave privada sigue en `POST /admin/tenants/{id}/service-key`.

### 3 · `schema-check` dice con qué rol miró

**Hecho en `26eae4b`.** La respuesta trae `snowflake_user` y `snowflake_role`. `exists: false` sigue igual: INFORMATION_SCHEMA no dice si el objeto no está o si el rol no lo ve. La pantalla puede mostrar el rol al lado de ese `false`.

### 4 · Cómo se consulta un cliente que no es UA (B1.26)

**Decidido: se queda A. B no se hace en este corte y no tiene fecha.**

A es el contrato que ya corre: las consultas viven en `MetricRegistry` y leen las tablas Gold con los nombres de `DD_SNOWFLAKE_*_TABLE`. La base y el esquema salen del agente. B sería guardar un SQL por métrica y por cliente y ejecutarlo en el materializador. Eso no entra ahora: el alta no va a aceptar SQL, y no hay una tabla nueva para eso.

No construyan un editor de consultas ni un dashboard por vertical. El alta que sí pueden armar, con este contrato, es: crear el cliente, corregir cuenta/usuario/rol/URL, ver `schema-check` con el rol, sincronizar el catálogo si la vista existe, y materializar. Una métrica del catálogo que no esté en el registro ni en el mapa de alias sigue `BLOCKED` (`keys_without_query`).

Si a un cliente le falta una columna, el panel sigue en `ERROR` con el texto de Snowflake. Lo que dice qué falta es `schema-check`: `objects[].missing` y `affected_metrics`. No cambiamos el texto del panel.

La vista `SYNAPSE_METRIC_CATALOG` de cada cliente la escribe datos, en la base y el esquema del agente. El API no la crea. Si no está, el sync no tiene de dónde leer y `schema-check` la marca `exists: false`.

Keralty y Terpel, con A, solo van a mostrar métricas que quepan en esas tablas Gold. Si no son e-commerce, el dashboard de UA no les va a servir aunque el rol sea el correcto. Eso queda así hasta que exista un corte aparte para consultas por cliente. No lo prometemos en una fecha.

## QA

Hasta desplegar `26eae4b`, Keralty y Terpel siguen consultando con el rol por defecto del usuario. Después del deploy hay que corregir `snowflake_role` (y el usuario, si no es el de ese cliente) con el `PUT` y volver a correr `schema-check`. El rol guardado en el alta vieja no se reescribe solo.
