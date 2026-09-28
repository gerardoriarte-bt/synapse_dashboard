# Para el equipo de frontend · respuesta a los doce · 2026-09-28

> Contesta su `MENSAJE-2026-09-26-backend-doce-pedidos.md`. Todo lo que acá dice «hecho» está en
> este commit, probado con tests y verificado contra el servicio corriendo sobre la base local
> (tenant Lobueno). Lo que sigue abierto dice por qué y de quién depende.

## Las dos preguntas

**B1.6 · `request_from` constante — sí, es la decisión.** `request_from` en `FORBIDDEN` vale siempre
`"admin"`: es el nombre canónico del rol que edita `hidden_metric_ids` en `PUT /admin/roles/{id}`,
o sea quien decide la visibilidad. No depende de la métrica ni del tenant, así que no hay nada que
calcular. Ciérrenlo.

**F1.44 · `cut` en `series` — son dos cosas distintas con el mismo nombre, y su lectura es correcta.**
- En `series`, `cut` es la granularidad declarada del panel (`day` | `month`). Ningún código del
  backend lo lee: es una pista para el render. Los dos paneles del seed traen ocho puntos mensuales
  porque es dato de demo; en producción `daily_trend` agrupa por `DATE` y trae puntos diarios.
- En `forecast` era el índice donde termina lo observado y empieza la proyección. **Ya está
  renombrado a `horizon_cut`** en el catálogo de bloques (`GET /config/blocks` → `forecast.layout_params`
  = `["horizon","interval_level","horizon_cut"]`). `series.cut` queda como está. Hoy el transformador
  `series_with_band` no calcula ni envía ese índice; cuando haya paneles forecast reales lo agregamos
  al payload con ese nombre.

## Los diez pedidos

| Pedido | Estado | Dónde se ve |
|---|---|---|
| **B4.9** paneles por pestaña en el preview | **Hecho** | `GET /admin/layouts/{id}/preview?role_id=` |
| **B4.4** `icon` y `chat_suggestions` en pestaña | **Hecho** | `PUT /admin/layouts/{id}` · `DDTabMeta` |
| **B1.13** `nota` de panel | **Hecho** | `PUT /admin/layouts/{id}` · `DDPanelDTO.note` · `presentation.note` |
| **B0.4** envelope de error estructurado | **Hecho** | todo error trae `code` |
| **B1.1** grano de período y alcance | **Hecho** | `GET /config/me` → `period_grain`, `periods_detail`, `scope` |
| **B4.2** reversión | **Hecho** | `POST /admin/layouts/{id}/revert` |
| **B2.12** prosa por agente | **Hecho, detrás de flag** | `DD_MATERIALIZE_PROSE_ENABLED=true` |
| **B1.16** «Brand Momentum» | **Retirado del doc** | `tareas-front-back (2).md` |
| **B1.21** `/config/plots` | Espera su mitad | — |
| **B3.11** migraciones en la compartida | Las corre el equipo de despliegue | — |

### B4.9 · el preview trae los paneles

`GET /admin/layouts/{layoutId}/preview?role_id=<uuid>` ahora devuelve `tabs[]` con `panels[]`
adentro, filtrados **exactamente** como los vería ese rol: sin las métricas de `hidden_metric_ids`
y con `layout_overrides` aplicados (posición, `options`, `note`). Es el mismo código que sirve
`GET /config/tabs/{tabId}`, así que no pueden divergir.

```
tabs[]: { id, name, operational_question, sort_order, icon, chat_suggestions[], panels[] }
panels[]: { id, metric_id, type, col_start, col_span, row_span, options, note }
```

Medido: con el lente `planner` salen 9 paneles y `col_span: 4` (override); con el lente `admin`,
12. `GET /config/tabs/{tabId}` **no** acepta rol simulado: siempre usa el del token. El comentario
que insinuaba `?roleId=` estaba mal y se corrigió.

### B4.4 · `icon` y `chat_suggestions`

Entran por el builder y salen por la consola:

- `PUT /admin/layouts/{id}` → `tabs[].icon` (string) y `tabs[].chat_suggestions` (array de strings).
  Se recortan, se descartan las vacías, **máximo 8** (más → `422 VALIDATION_CHAT_SUGGESTIONS`).
- `DDTabMeta` (en `GET /config/me`, `GET /config/tabs/{id}` y el preview) trae `icon` y
  `chat_suggestions`. `chat_suggestions` **siempre es lista**, nunca `null`.
- `GET /config/panels/{panelId}/chat-suggestions` (las de panel) no cambia.

### B1.13 · la `nota`

Vive en el panel del layout (`dd_panels.note`) y la escribe el admin en el builder
(`panels[].note`). Sale en dos lugares:

- `DDPanelDTO.note` en `GET /config/tabs/{id}` y el preview (vacío = sin nota).
- `presentation.note` en `POST /config/panels:batch`: se **mezcla en lectura** con la presentation
  materializada (`label`, `meter`, `comparative` siguen intactos); no se guarda en `dd_panel_data`.
  Si el panel no tiene nota, la `presentation` no cambia.

Un rol puede reemplazarla con `layout_overrides[tab_id][panel_id].note`.

### B0.4 · `code` en todos los errores

```json
{ "success": false, "error": "solo borradores se pueden editar", "code": "CONFLICT_NOT_DRAFT" }
```

`code` = `FAMILIA_DETALLE`. **Decidan por la familia** (prefijo hasta el primer `_`); nosotros
podemos sumar detalles sin avisar. Familias: `VALIDATION` (400/422, request o regla de un campo),
`AUTH` (401/403), `NOT_FOUND` (404), `CONFLICT` (409, regla de negocio sobre el estado actual),
`RATE_LIMIT` (429), `INTERNAL` (5xx).

Todo error del servicio ya trae `code`, incluidos los del middleware (`AUTH_UNAUTHORIZED`,
`AUTH_FORBIDDEN`) y el rate limit (`RATE_LIMIT_EXCEEDED`): si una ruta no fija un detalle propio,
sale el genérico de la familia (`VALIDATION_REQUEST`, `VALIDATION_RULE`, `NOT_FOUND_RESOURCE`,
`CONFLICT_STATE`, `INTERNAL_ERROR`). Detalles propios que ya existen: `CONFLICT_NOT_DRAFT`,
`VALIDATION_LAYOUT`, `VALIDATION_CHAT_SUGGESTIONS`, `NOT_FOUND_LAYOUT`, `NOT_FOUND_ROLE`,
`AUTH_DRAFT_PREVIEW`, `VALIDATION_THEME`, `VALIDATION_DASHBOARD_NOT_VISIBLE`, `CONFLICT_NO_PREVIOUS`,
`CONFLICT_REVERT_SELF`, `NOT_FOUND_REVERT_TARGET`, `VALIDATION_REVERT_TARGET`. `error` sigue siendo
el mensaje en español de siempre.

### B1.1 · grano y alcance

`GET /config/me` suma tres campos; `periods` no cambia:

```json
"period_grain": "month",
"periods_detail": [ { "key": "2026-09", "grain": "month", "start": "2026-09-01", "end": "2026-10-01" }, … ],
"scope": { "kind": "multi_tenant", "tenants": [ { "id": "…", "name": "Lobueno Analytics" }, … ] }
```

- `period_grain` es el grano de **todos** los `periods`; hoy siempre `month`. `week` queda
  declarado en el enum para cuando exista dato semanal, y entonces `periods_detail[].grain` lo dirá
  por período. `[start, end)` son fechas ISO.
- `scope.kind`: `single_tenant` (el usuario solo ve su cliente; `tenants` trae uno) o `multi_tenant`
  (rol `admin`: `tenants` trae todos los clientes para el selector del navbar). `tenants` nunca es
  `null`.

### B4.2 · reversión

`POST /admin/layouts/{layoutId}/revert` · body opcional `{ "to_layout_id": "<uuid>", "version_id": "…" }`.

Qué hace: toma la versión destino (`to_layout_id`, o por defecto el `previous_layout_id` de la
última publicación de ese layout), **copia** sus pestañas y paneles a un draft nuevo, lo valida
contra el catálogo y lo publica. Responde el `DDLayoutVersion` nuevo (`status: published`,
`version_id: "rollback-<versión copiada>"` salvo que manden uno). En `GET /admin/layouts/{id}/publications`
aparece con `action: "rollback"`, actor y `previous_layout_id` = la versión que se reemplazó.

Decisión: **nunca se reactiva una versión archivada**. El historial queda lineal y auditable; la
versión a la que se volvió sigue `archived`. Errores: `409 CONFLICT_NO_PREVIOUS` (no hay a qué
volver y no mandaron `to_layout_id`), `409 CONFLICT_REVERT_SELF`, `404 NOT_FOUND_REVERT_TARGET`
(destino de otro dashboard o inexistente), `409 CONFLICT_REVERT_TO_DRAFT`, `422 VALIDATION_REVERT_TARGET`
(la versión vieja ya no valida contra el catálogo actual).

Medido: publish de `v-b44` → revert sin body → `rollback-v1` con los 12 paneles originales;
`v-b44` y la publicada anterior quedaron `archived`.

### B2.12 · prosa por agente

`executive_summary` y `decisions` ahora los redacta el agente de Cortex del tenant, en el
materializador, al final de la corrida y con las cifras ya calculadas del período (KPI del mes,
mes anterior y mismo mes del año anterior) como contexto. El resultado tiene la misma forma
`prose` de siempre (`headline` + `pillars`) y `governance.source = "agent:<nombre del agente>"`.
Si el agente falla o no responde en el formato pedido, el panel queda `ERROR` **sin pisar** el
texto previo (misma regla que todo lo demás).

Está **detrás de `DD_MATERIALIZE_PROSE_ENABLED`** (default `false`): es una llamada a Cortex por
panel de prosa y por período materializado. Hasta que lo prendamos en dev, esos dos paneles
siguen sirviendo el valor del seed (el «4.28M» que vieron). Lo prendemos cuando validemos el
prompt con el agente real de Lobueno; en local pasa el mismo camino con un agente simulado.

### B1.16 · «Brand Momentum»

Marcado como retirado en `tareas-front-back (2).md` (B1.16 y T5), con la fecha y el motivo. La
pestaña sembrada es «Overview» con 12 paneles y la métrica no está en el catálogo de 18.

### B1.21 · `/config/plots`

Sigue esperando su mitad: los mínimos por gráfico. Cuando los declaren, va con la misma figura que
`GET /config/blocks`.

### B3.11 · migraciones en la base compartida

En local ya corrieron (con `DB_AUTO_MIGRATE=true`). En los demás ambientes **las migraciones las
corre el equipo de despliegue**, no nosotros ni ustedes: van con el deploy de este commit. Todas
las pendientes son `ADD COLUMN` y seeds idempotentes (nada borra ni reescribe datos). Si al medir
contra la compartida falta una columna nueva (`dd_tabs.icon`, `dd_tabs.chat_suggestions`,
`dd_panels.note`), es que ese deploy todavía no pasó.

## Una cosa que vimos midiendo, y que les toca a ustedes en la consola

`roles.tab_ids` guarda **ids de pestaña**, y las pestañas son filas de cada versión de layout:
al publicar una versión nueva (o revertir), las pestañas tienen ids nuevos y un rol con `tab_ids`
no vacío deja de ver **todas** (vacío = todas, así que no afecta a los roles sin restricción). El
seed deja `admin`, `user` y `planner` apuntando a la pestaña sembrada, así que la primera
publicación real desde el builder los deja sin pestañas hasta que la consola de roles los
actualice con `PUT /admin/roles/{id}`. `hidden_metric_ids` no tiene este problema (las métricas
sobreviven a las versiones). Vale para la pantalla de roles: después de publicar, ofrecer «asignar
pestañas de la versión nueva». Si prefieren que el backend lo resuelva (p. ej. identidad de
pestaña por `slug` dentro del dashboard), lo conversamos; es un cambio de modelo.

## Y para medir

- OpenAPI en `/docs` está al día con todo lo anterior (schemas `DDPreviewResponse`, `DDTabMeta`,
  `DDPanelDTO`, `DDContextResponse`, `DDLayoutRevertRequest`, `ErrorResponse`).
- El preview sigue queriendo `role_id`; `/config/tabs` sigue con `layoutId` y `dashboardId`.
  Lo dejamos así para no romperles lo que ya corrigieron; si quieren unificar a snake_case en
  `/config/tabs`, aceptamos los dos nombres un tiempo y avisamos.
