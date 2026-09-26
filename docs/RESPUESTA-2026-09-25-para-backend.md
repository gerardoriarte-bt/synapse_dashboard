# Para el equipo de front · respuesta a `PARA-BACKEND.md` · punto por punto · 2026-09-25

> Contesta los 26 pedidos de su `PARA-BACKEND.md` en el mismo orden y con el mismo identificador.
> Cada punto dice **estado**, **qué ruta usar** (método, ruta, campos) y **cómo probarlo**. Medido contra
> el commit posterior a `6e521cc` en `feature/dynamic-dashboard-backend`. La mayoría de sus mediciones
> son contra `82da946` o `6e595e3`, que son anteriores a todo lo de hoy.

## Cómo levantar el backend para verificar

```bash
git pull                                   # rama feature/dynamic-dashboard-backend
DB_AUTO_MIGRATE=true make run              # crea/agrega columnas nuevas y siembra; nunca borra
```

Postman: importar `postman/Synapse-API-Admin.postman_collection.json` y `postman/Synapse-Local.postman_environment.json`.
Corren `0 · Login (admin)` primero; el resto usa `{{jwtAdmin}}` y `{{tenantId}}`. Contrato completo en `/docs`
(`DOCS_ENABLED=true`), que ahora sí incluye `/config/*` y el builder (B0.6).

**Columnas que agrega la migración desde `82da946`** (para B3.11, todas aditivas):

| Tabla | Columnas |
|---|---|
| `user_threads` | `panel_id`, `period`, `deleted_at`, `tab_id` |
| `agents` | `is_active`, `semantic_views`, `system_prompt_base` |
| `dd_panel_data` | `last_error`, `last_error_at`, `last_success_at` + índice `idx_dd_panel_data_tenant_metric_period` |
| `dd_catalog_metrics` | `measurement_window` |
| `users` | `last_login_at`, `is_active` |
| `roles` | `is_active` |
| `tenants` | `locale`, `currency`, `timezone` |
| `dd_feeds` | tabla nueva (con seed de 4 feeds por tenant) |

**Regla que se mantiene:** no se toma código del fork. Todo lo de abajo está escrito en este repo.

---

## Resumen en una tabla

| # | Pedido | Estado | Ruta / campo |
|---|---|---|---|
| B0.4 | Envelope de error con código | Pendiente nuestro | — |
| B0.6 | `/config/*` y builder en OpenAPI | **Hecho hoy** | `/docs` |
| B1.1 | `theme` en `/config/me` | **Hecho hoy** | `GET /config/me` → `user.theme` |
| B1.6 | `unlocks_with` en BLOCKED, `request_from` real | **Hecho** (`8da70de` + hoy) | `POST /config/panels:batch` |
| B1.13 | `nota` de panel | Pendiente de definir juntos | — |
| B1.14 | `decimals`/`unit` en `tabular` | **Hecho** (`6e521cc`) | `value.columns[]` |
| B1.15 | `percentage` siempre; `scalar_with_interval` estricto | **Hecho hoy** | — |
| B1.16 | Métrica «Brand Momentum» | Producto | — |
| B1.21 | `/config/plots` | Esperamos sus mínimos | `GET /config/blocks` mientras tanto |
| B1.17 / B1.25 | `measurement_window` | **Hecho** (`6e521cc`) | `GET /config/catalog[].measurement_window` |
| B1.19 | Usuario de prueba restringido | Lo creamos en QA | — |
| B1.27 | `open_period` | **Hecho** (`6e521cc`) | `GET /config/me` → `open_period` |
| B2.12 | `presentation` real, «nunca materializado» | **Hecho** (`6e595e3`); prosa por agente: Fase 6 | `POST /config/panels:batch` |
| B2.13 | Salud de feeds | **Hecho** (`1e080ee`) | `GET /admin/tenants/{id}/feeds` |
| B3.1 | Chat SSE | Ruta hecha; falta clave RSA (datos) | `POST /config/chat` |
| B3.9 | CRUD de agentes | **Ya existía** (5 rutas) | `/admin/tenants/{id}/agents` |
| B3.11 | Migraciones en la compartida | Decisión de ops | tabla de arriba |
| B4.1 | `GET /admin/tenants` con columnas | **Hecho** (`6e521cc`), 3 de 5 | `GET /admin/tenants` |
| B4.2 | Autor, diff, revertir | **Ya existía** | `GET /admin/layouts/{id}/publications` |
| B4.4 | `icon`, `chat_suggestions` en pestaña | Pendiente nuestro | — |
| B4.17 | Listado de usuarios | **Hecho** (`1e080ee` + `6e521cc`) | `GET /admin/users`, `GET /admin/tenants/{id}/users` |
| B4.10 | Etiquetas `json:` en layout/tab/panel | **Hecho hoy** | `GET /admin/layouts/{id}` |
| B5.1 | Layouts visibles en `/config/me` | **Ya existía** (`168a761`) | `GET /config/me` → `dashboards[]` |
| F1.44 | Qué significa `cut` | Aclarado abajo | — |
| F3.15 | Chat con contexto de pestaña | **Hecho** (`8da70de`) | `POST /config/chat { tab_context }` |

---

## Punto por punto

### B0.4 · Envelope de error estructurado

**Pendiente, nuestro.** Hoy `error` es una cadena. El código `FAMILIA_DETALLE` toca todos los handlers y va en
un cambio aparte. Mientras tanto, la familia se puede inferir por el status HTTP: 400 campo, 404 no existe,
409 regla de negocio, 422 composición inválida, 500 técnico.

### B0.6 · `/config/*` y `/admin/layouts/*` en el OpenAPI

**Hecho hoy.** `/docs` ahora declara `GET /config/me`, `PUT /config/me/preferences`, `GET /config/catalog`,
`GET /config/blocks`, `GET /config/tabs/{tabId}`, `POST /config/panels:batch`, `GET|POST /admin/tenants/{id}/layouts`,
`GET /admin/tenants/{id}/catalog`, `GET|PUT /admin/layouts/{id}`, `POST .../validate`, `POST .../publish`, más
los schemas `DDContextResponse`, `DDTabWithPanels`, `DDPanelPayload`, `DDCatalogMetric`, `DDBlockRule`,
`DDLayoutDetail`, `DDLayoutUpdateRequest`, `DDLayoutValidationResult`. Con eso su
`contracts/synapse-console-wire.yaml` se reemplaza por el nuestro. Total: 59 rutas documentadas.

### B1.1 · `theme` en `/config/me`

**Hecho hoy.**

```
GET /config/me
→ data.user: { id, email, first_name, last_name, theme: "light" | "dark" }
```

Es la misma columna que escribe `PUT /config/me/preferences`. Postman: `Referencia · blocks (consola) → GET /config/me`.

El resto (`alcance`, `tenant.etiqueta`, `vertical`, `role.puedeAprobar`, `user.capabilities`, `tab.key/icon/chat_suggestions`)
son definiciones de producto que no existen en el modelo. `vertical` va con B4.1; `icon`/`chat_suggestions` con B4.4.

### B1.6 · `unlocks_with` en BLOCKED y `request_from` real

**Hecho.** Desde `8da70de` un panel `BLOCKED` trae `reason` («Esta métrica todavía no tiene fuente de datos») y
`unlocks_with` («Se calcula en la próxima materialización cuando haya datos»). Hoy `request_from` en `FORBIDDEN`
pasa de `"administrator"` a `"admin"`, que es el nombre del rol que decide sobre las métricas ocultas (el que edita
`hidden_metric_ids` en `PUT /admin/roles/{id}`).

```
POST /config/panels:batch  { "panel_ids": ["…"], "period": "2026-09" }
→ data["<panel_id>"] = { status: "FORBIDDEN", request_from: "admin" }
```

### B1.13 · `nota` de panel

**Pendiente de definir.** Coincidimos en que `presentation` la lee solo el KPI. La `nota` al pie no existe en el
modelo y no está claro de dónde sale (¿opción del panel en el builder? ¿del catálogo?). Propongan el origen y se agrega.

### B1.14 · `decimals` y `unit` en `tabular`

**Hecho** (`6e521cc`).

```json
{ "shape": "tabular",
  "columns": [ { "key": "roas", "title": "ROAS", "numeric": true, "decimals": 2, "unit": "x" } ],
  "rows": [ … ] }
```

Sin `decimals` o `unit` la columna no trae esas claves. `investment_by_platform` ya los declara (USD 0 decimales,
ROAS 2 y `x`, share 1 y `%`). Sobre las cinco formas v1.1: de acuerdo, entran juntas cuando ustedes las declaren en
su contrato y datos tenga una tabla que las alimente. Nada que hacer de nuestro lado hasta entonces.

### B1.15 · `percentage` siempre en `composition`; `scalar_with_interval` estricto

**Hecho hoy.**

- `composition`: cada parte trae `percentage`. Si la fila no lo trae, el backend lo calcula sobre la suma total
  con un decimal, y **la última parte absorbe el redondeo para que sumen exactamente 100**. Suma cero → 0 en todas.
- `scalar_with_interval`: `lo`, `hi` y `level` (> 0) son obligatorios; sin alguno la métrica queda `ERROR` con
  el motivo en `last_error`. Misma regla que `series_with_band` desde `75b8ecc`.

Coincidimos en que ninguna métrica actual usa `composition`; es prevención.

### B1.16 · «Brand Momentum»

**Producto.** No hay fuente para esa métrica. Sugerimos sacarla de `tareas-front-back.md`.

### B1.21 · `/config/plots`

**Esperamos los mínimos de ustedes**, como proponen. Cuando los declaren, los servimos con la misma figura que
`GET /config/blocks` (tabla global). Mientras tanto, `GET /config/blocks` ya dice qué formas acepta cada bloque y
sus spans: es lo que valida `POST /admin/layouts/{id}/validate`.

### B1.17 / B1.25 · `measurement_window`

**Hecho** (`6e521cc`), las dos mitades: columna en el catálogo, sync desde `MEASUREMENT_WINDOW` de la view, y
el campo en `GET /config/catalog`, `GET /admin/tenants/{id}/catalog` y en `governance.measurement_window` de cada
panel del batch. Verificado contra la view real de Lobueno: 10 de 18 métricas la traen (las prose no la declaran).
Nombre: `measurement_window`, igual que la columna.

```
GET /config/catalog → data[]: { …, "min_grain": "month", "measurement_window": "Mes calendario seleccionado", … }
```

Postman: `Referencia · blocks (consola) → GET /config/catalog (measurement_window)`.

### B1.19 · Usuario de prueba con rol restringido

**Lo creamos nosotros en QA** con el CRUD de roles (`POST /admin/tenants/{id}/roles` con `tab_ids` y
`hidden_metric_ids`) y `POST /admin/users`. Credenciales por el canal privado. Si quieren crearlo ustedes en
local: Postman `Admin · Roles (B4.8) → POST` y luego `Setup plataforma → POST /admin/users` con ese rol.

### B1.27 · `open_period`

**Hecho** (`6e521cc`), como campo al lado de `periods`, que es la forma que propusieron.

```
GET /config/me → { "periods": ["2026-09", "2026-08", …], "open_period": "2026-09" }
```

`open_period` es siempre igual a `periods[0]`. Comparar el período elegido contra él para rotular «mes en curso».

### B2.12 · `presentation`, «nunca materializado» y prosa

- **`presentation` real: hecho** en `6e595e3`. Los seis KPI escalares traen `label`, `meter` («% DE LA META») y
  `comparative` («VS MES ANTERIOR», «VS AÑO ANTERIOR») calculados desde Snowflake. Ustedes mismos lo verificaron.
- **Fila nunca materializada: hecho** en `6e595e3`. Una fila con `last_success_at` nulo y un intento fallido sale
  `DEGRADED` con `reason` y `unlocks_with`, no `AVAILABLE`.
- **Prosa por agente: Fase 6, pendiente.** Coincidimos en el diseño (el materializador llama al agente por
  dashboard y período, después del resto de paneles; procedencia `agent:<nombre>`). Sin fecha todavía.

### B2.13 · Salud de feeds

**Hecho** (`1e080ee`). Entidad `dd_feeds` por tenant con cadencia, tolerancia y última carga real (`MAX(DATE)` de
la tabla Gold, sondeada en cada materialización y a demanda).

```
GET  /admin/tenants/{id}/feeds            → [{ key, name, gold_table, cadence_hours, tolerance_factor, source_labels,
                                              last_load_at, last_load_checked_at, last_load_error, is_active,
                                              freshness_hours, status: fresh|stale|unknown, metric_count, metric_keys }]
POST /admin/tenants/{id}/feeds/refresh    → sondea Snowflake y devuelve la lista
POST /admin/tenants/{id}/feeds            → { key, name, gold_table?, cadence_hours?, tolerance_factor?, source_labels? }
PUT  /admin/tenants/{id}/feeds/{feedId}   → parcial
DELETE …/feeds/{feedId}                   → soft delete
GET  /admin/tenants/{id}/catalog/health   → por métrica: status = peor de sus feeds activos, feeds[]
```

El estado se deriva en lectura: `unknown` sin última carga, `stale` si `freshness_hours > cadence_hours × tolerance_factor`,
`fresh` si no. `rows_processed` / `rows_failed` van `null` hasta que datos exponga una tabla de auditoría. Sobre su punto b:
`PanelDegradation` del batch sigue con la tolerancia global; pasar a la del feed es decisión de producto (dos relojes
distintos). Postman: carpeta `Admin · Feeds y salud`.

### B3.1 · Chat SSE

**La ruta está y acepta `panel_context` o `tab_context`** (`8da70de`). Lo que frena en la compartida es el par de
claves RSA del agente, que es del equipo de datos. Nada pendiente del backend salvo cargar tenant y agente cuando llegue.

### B3.9 · Agentes por tenant

**Ya existía**, medido mal: hay cinco rutas.

```
GET    /admin/tenants/{id}/agents                incluye inactivos
POST   /admin/tenants/{id}/agents
GET    /admin/tenants/{id}/agents/{agentId}
PUT    /admin/tenants/{id}/agents/{agentId}      parcial, is_active
DELETE /admin/tenants/{id}/agents/{agentId}      soft delete
```

Y lo que piden para F4.4, «si el acceso está vigente», es `GET /agents/ping`: firma el JWT con las credenciales
del tenant y ejecuta `SELECT 1` contra Snowflake en vivo (200 ok, 422 credenciales inválidas, 502 Snowflake caído).
Lo que no existe es «cuándo se verificó por última vez» persistido; si lo quieren, es una columna `last_ping_at` en
`agents`. Postman: carpeta `Agentes por tenant (B3.9)`.

### B3.11 · Migraciones en la base compartida

**Decisión de ops, no de código.** Con `DB_AUTO_MIGRATE=true` en una ventana se aplican todas las de la tabla del
inicio; son aditivas (ninguna borra). La lista de columnas que ustedes midieron creció con lo de hoy.

### B4.1 · `GET /admin/tenants`

**Hecho** (`6e521cc`), 3 de las 5 columnas. La ruta ahora devuelve la banda de clientes de A1:

```
GET /admin/tenants → [{ id, name, locale, currency, timezone, user_count, last_published_at,
                        worst_feed_status, worst_feed_freshness_hours, status, vertical, created_at }]
```

- `last_published_at` es `null` si nunca publicó (no se reemplaza por la fecha de alta).
- `worst_feed_status` mira los feeds **sondeados**: `stale` si alguno lo está, `fresh` si todos están al día,
  `unknown` si ninguno tiene última carga. `worst_feed_freshness_hours` son las horas del más atrasado.
- `status` y `vertical` van `null`: **necesitamos que el cliente defina la lista de valores**. Con eso son dos
  columnas más y un campo en `PUT /admin/tenants/{id}`, que ya existe.

Postman: `Admin · Ficha de tenant y preview → GET /admin/tenants`.

### B4.2 · Autor, diferencia y reversión

**Ya existía** (`168a761`), medido contra un binario anterior.

```
GET /admin/layouts/{id}/publications
GET /admin/dashboards/{id}/publications?limit=
→ [{ id, layout_id, version_id, action, actor_user_id, actor_role, previous_layout_id,
     diff: { tabs_added, tabs_removed, tabs_reordered, panels_added, panels_removed, panels_moved,
             panels_retyped, panels_options_changed, summary }, created_at }]
```

**Quién**: `actor_user_id` + `actor_role`. **Qué cambió**: `diff` contra el published anterior. **Revertir**: no hay ruta
`revert`; el camino es crear un draft (`POST /admin/tenants/{id}/layouts`), cargarle el contenido de la versión
anterior (`PUT /admin/layouts/{id}` con lo que devuelve `GET /admin/layouts/{versión vieja}`) y publicar. Cada
publicación archiva la anterior, nunca la borra. Postman: `F5 · Multi-dashboard → B5.5`.

### B4.4 · `chat_suggestions` e `icon` en la pestaña

**Pendiente, nuestro.** No están en `DDTab` ni en `DDLayoutTabInput`. Son dos columnas y el builder; va en el
siguiente bloque. Sobre `operational_question` obligatorio en `validate`: de acuerdo con hacerlo en backend; lo
sumamos al mismo cambio si confirman que ninguna pestaña existente en producción la tiene vacía.

### B4.17 · Listado de usuarios

**Hecho** (`1e080ee` por tenant, `6e521cc` plataforma).

```
GET /admin/tenants/{id}/users                      → [{ id, email, first_name, last_name, phone, role_id, role,
                                                        last_login_at, is_active, created_at }]
GET /admin/users?tenant_id=&role=&is_active=&q=    → { total, tenants, users: [ …, tenant_name ] }
PUT /admin/tenants/{id}/users/{userId}             → { role_id?, is_active? }
DELETE /admin/tenants/{id}/users/{userId}          → soft delete; el usuario recibe 403 al hacer login
```

Para «17 usuarios · 2 clientes»: `total` y `tenants` los cuenta el backend sobre el mismo filtro. Postman: carpeta
`Admin · Usuarios (A3)`. Y B4.8 (roles) está desde `1e080ee`: carpeta `Admin · Roles (B4.8)`, ruta
`GET /admin/tenants/{id}/roles/composition`, la que ustedes propusieron.

### B4.10 · Etiquetas `json:` en `DDLayoutVersion`, `DDTab`, `DDPanel`

**Hecho hoy.** Las tres respuestas del builder salen en snake_case: `GET /admin/tenants/{id}/layouts` → `status`,
`version_id`, `published_at`; `GET /admin/layouts/{id}` → `tabs[].tab.name`, `tabs[].panels[].col_start`. Los
back-refs `Tenant`, `LayoutVersion` y `Tab` llevan `json:"-"`, así que aunque alguien precargue el tenant no viaja
nada. Sus scripts de Postman (`lv.status`, `d.tabs[0].tab.name`) ahora pasan sin adaptador.

### B5.1 · Layouts visibles en `/config/me`

**Ya existía** (`168a761`).

```
GET /config/me → { dashboards: [{ id, name, slug, is_default }], active_dashboard_id, active_layout_id, tabs: [...] }
```

`dashboards` son los que el rol puede ver; para cambiar de dashboard, `GET /config/tabs/{tabId}?dashboardId=`.
La preferencia del usuario se guarda con `PUT /config/me/preferences { preferred_dashboard_id }`.

### F1.44 · Qué significa `cut`

Son dos cosas con el mismo nombre, y tienen razón en que no se deduce del dato:

- En `series`, `cut` es la **granularidad declarada del panel** (`day` | `month`): cómo el admin quiere ver la serie.
- En `forecast`, `cut` es el **índice donde termina lo observado y empieza la proyección**.

Y el segundo hallazgo es real: el dato del seed de `daily_trend` es mensual aunque el panel declare `cut: day`; en
producción `daily_trend` sí trae puntos diarios (`GROUP BY DATE`). Mientras tanto, descartarlo con aviso es correcto.
Queda anotado renombrar el de `forecast` a `horizon_cut` para que no colisionen; lo hacemos con B4.4.

### F3.15 · Chat con contexto de pestaña

**Hecho** (`8da70de`).

```
POST /config/chat  { "question": "…", "tab_context": { "tab_id": "…", "period": "2026-09" } }
```

Exactamente uno de `panel_context` o `tab_context`; ninguno o ambos → 400. `GET /config/chat/threads?tab_id=` filtra
el historial por pestaña.

---

## Lo que sigue pendiente, y de quién

| Qué | De quién | Nota |
|---|---|---|
| B0.4 códigos de error, B4.4 `icon`/`chat_suggestions`, B1.13 `nota` | Backend | Siguiente bloque; B1.13 necesita que definan el origen |
| Prosa por agente (Fase 6) | Backend | Diseño acordado, sin fecha |
| `status` y `vertical` del tenant; `locale`/moneda/zona por tenant | Cliente / producto | Sin eso van `null` / defaults |
| Mínimos por gráfico (B1.21) | Front | Después los servimos |
| Contrato de las 5 formas v1.1 | Front | Y una tabla Gold por forma, de datos |
| Clave RSA del agente Cortex | Datos | Frena el chat en la compartida |
| Tabla de auditoría Silver→Gold | Datos | `rows_processed` / `rows_failed` |
| Aplicar migraciones en la compartida (B3.11) | Ops | `DB_AUTO_MIGRATE=true` en ventana |
