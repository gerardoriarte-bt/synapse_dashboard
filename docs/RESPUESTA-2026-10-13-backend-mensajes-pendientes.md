# Para el equipo de front · respuestas pendientes · 2026-10-13

Pedido de proceso (no de código): cada mensaje lleva respuesta escrita, con commit, lo que no se hace, el contrato y qué hay en QA.

**Aceptado.** De aquí en adelante cada mensaje se contesta en un `.md` de este repo, en ese formato. Esta nota cierra el pedido de proceso y el backlog que listaron (05 al 10).

**Commit del corte 08-10:** `8272085` en `feature/dynamic-dashboard-backend`. Ahí están la procedencia por SQL, las columnas `tabular` desde `rowType` y el 403 de `/admin` al cliente del token. El prompt del 07 ya estaba en `9dc481e`.

**Commit en QA:** no lo vemos desde este repo. Lo último que ustedes midieron en local fue el binario de `9dc481e`. `8272085` no está en QA hasta que se despliegue esa imagen.

---

## 2026-10-05 y 2026-10-06

**No puedo cerrarlos línea por línea.** Esos mensajes no están en este repositorio. Si los vuelven a pegar, contesto cada pedido con commit o con «no hecho».

## 2026-10-07 · respuestas del chat (`MENSAJE-2026-10-07-backend-respuestas-del-chat.md`, medido contra `7b717aa`)

| Pedido | Estado |
|---|---|
| Reescribir el prompt (conclusión, `### Recomendaciones`, consultar y graficar) | **Hecho en `9dc481e`.** Ustedes ya lo vieron andar. |
| `family` / `base` / `layer` / `source_system` en el chat de pestaña | **No desplegar el cruce de `9dc481e`.** Esa heurística por nombre de columna está en ese commit y es la que midieron mal el 08. El reemplazo (SQL + `MetricColumnUsage`) está en **`8272085`**. |
| Contrato | El frame `data` no cambió de forma: `{ shape, data, provenance }`. En pestaña, con el reemplazo, `base` va vacía si el SQL filtra por dimensión. |

## 2026-10-08 · procedencia (`front_respuesta.md`, medido contra `9dc481e`)

| Pedido | Estado |
|---|---|
| 1. No usar el cruce por nombre | **Hecho en `8272085`.** Se borra `dd_chat_tab_provenance.go`. En `9dc481e` el cruce malo sigue. |
| 2. Cruzar por SQL + columnas físicas del catálogo | **Hecho en `8272085`** (`dd_chat_sql_provenance.go`). |
| 3. `base` del catálogo solo si la consulta no filtra; también en panel | **Hecho en `8272085`.** |
| 4. Leer `chart_spec` cuando llega como texto | **Hecho en `8272085`.** |
| Contrato | Ningún campo nuevo. Cambia el valor de `provenance` cuando haya match único. Sin match, gobernanza vacía. |

## 2026-10-09 · tablas sin rótulo (mensaje pegado sobre el archivo de procedencia; medido contra `9dc481e`)

| Pedido | Estado |
|---|---|
| Columnas del `tabular` desde `resultSetMetaData.rowType`, sin saltar `label`, orden del `SELECT` | **Hecho en `8272085`.** `inferTabularColumns` de los paneles no se tocó. |
| `numeric` por tipo de `rowType` o mirando todas las filas | **Hecho en `8272085`.** |
| Por qué las tramas 2 y 3 salen duplicadas | **No mirado.** Hace falta el stream de QA sobre el commit nuevo. |
| Contrato | `shape: tabular` ahora puede traer columna `label`. No hay ruta nueva. |

Detalle: `docs/backend-respuesta-front-tabular-chat-2026-10-09.md`.

## 2026-10-10 · permisos y super-admin (medido contra `9dc481e`)

| Pedido | Estado |
|---|---|
| 1. `/admin` solo el cliente del token | **Hecho en `8272085`.** Excepción provisoria: `PLATFORM_OPERATOR_USER_IDS`. Rutas sin `:tenantId` en el path (`layouts`, `roles`, `dashboards` por UUID) **siguen abiertas**. |
| 2. Super-admin, login aparte, MFA, auditoría | **No.** No va a existir como rol `admin`. Cuando se haga, es entidad aparte. |
| 3. Permiso de editar en el rol | **No.** Sigue haciendo falta que el rol se llame `admin`. |
| 4. `GET /config/me` con ver y editar | **No.** El contrato de `/config/me` no cambia en este corte. No armen selector de cliente encima. |
| 5. Consola del super-admin en otro cliente | **No.** Cuando exista, será un token nuevo por cliente, no un `tenant_id` en cada request de `/config`. |
| 6. Quien aprueba elige el rol | **No.** Sigue `agents.target_role`. Aprobar hacia otro cliente ya queda en 403 con el corte del punto 1. |
| Contrato que sí cambia en `8272085` | **403** `no puedes administrar otro cliente` en `/admin/tenants/:tenantId/...`, en listados y en el `tenant_id` del body de usuarios, agentes y approve. `POST /admin/tenants` y `POST /admin/materialize/run` solo si el `user_id` está en `PLATFORM_OPERATOR_USER_IDS`. |

Detalle: `docs/backend-respuesta-front-permisos-2026-10-13.md`.

---

## Qué pueden medir ya

Para el prompt del 07, `9dc481e`. Para procedencia, tablas con `label` y el 403 de admin, **`8272085`**.

Ese hash no está en QA hasta el deploy. Si miden la imagen vieja van a seguir viendo el cruce por nombre y el admin que entra a otro cliente.

Antes de subir la imagen hay que definir `PLATFORM_OPERATOR_USER_IDS`. Si va vacía, Lo Bueno deja de poder operar otros clientes. La reunión del martes sirve para cerrar los mensajes del 05 y del 06, que no están en el repo, y el orden del super-admin.
