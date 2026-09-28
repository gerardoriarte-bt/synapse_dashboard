# Para el equipo de frontend · respuesta a los cinco · 2026-09-28 (tarde)

> Contesta su `MENSAJE-2026-09-28-backend-cinco-que-quedan.md`. Tres entran en código en este
> commit y están medidos contra el servicio corriendo sobre la base local. Uno era un malentendido
> de medición y se explica con qué mirar. Uno es una fecha, no código. Y contestamos lo de
> `roles.tab_ids` con una propuesta concreta.

## 1 · `error` en español, siempre

Tenían razón y nuestra respuesta anterior estaba mal: los 400 de binding devolvían el texto crudo
del validador y varios 404/409 estaban en inglés. Ahora:

- **Errores de binding** pasan por un traductor por campo (`BindingErrorMessage`): el campo se
  nombra por su clave JSON y la regla se redacta.
  ```
  400 VALIDATION_REQUEST · solicitud inválida: el campo 'theme' debe ser uno de: dark, light
  400 VALIDATION_REQUEST · solicitud inválida: el campo 'panel_ids' es obligatorio
  400 VALIDATION_REQUEST · solicitud inválida: el cuerpo no es JSON válido
  ```
  Nunca aparece un nombre de struct de Go ni un tag.
- **Mensajes fijos** de consola, builder y dashboards traducidos: `pestaña no encontrada`,
  `tabId inválido`, `solo se puede editar un borrador`, `el layout necesita al menos una pestaña`,
  `la métrica no existe en el catálogo del tenant`, `la forma 'tabular' no es compatible con el
  bloque 'kpi'`, `col_span fuera de rango para el bloque 'kpi'`, etc. Los `errors[]` de
  `POST /admin/layouts/{id}/validate` también.
- Los 500 siguen llevando el detalle técnico en `error` (familia `INTERNAL`); si prefieren que
  ahí vaya una frase genérica y el detalle en otro campo, díganlo.

## 2 · `panels[].chart`

Entró tal cual lo pidieron: **opcional, junto a `type`, escrito desde el builder, ausente = el de
siempre**.

- `PUT /admin/layouts/{id}` → `tabs[].panels[].chart` (string). Se guarda en minúsculas y
  recortado; no validamos contra el repertorio (eso es del front, que tiene los 49 y sus mínimos).
- Sale en `DDPanelDTO.chart` (`GET /config/tabs/{id}`, preview) y en `DDLayoutPanel.chart` (builder).
- Se copia en la reversión. Los doce paneles publicados quedan con `""`.

Medido: `"chart": " Waterfall "` en el PUT → `"waterfall"` en `GET /config/tabs/{id}`.

## 3 · `tenant.label` y `tab.key`

**`tenant.label`** · forma corta para el navbar.
- `PUT /admin/tenants/{id}` acepta `label` (recortado; vacío = sin forma corta).
- Sale en `GET /admin/tenants` (`label`), en `GET /config/me` → `tenant.label` y en cada entrada
  de `scope.tenants[].label`. **Si el tenant no la define, `label` es `name`**, así que pueden
  pintar `label` siempre y olvidarse del fallback.

**`tab.key`** · identidad estable de la pestaña dentro del dashboard.
- `dd_tabs.key`: slug, **única por versión de layout**. En el builder `tabs[].key` es opcional;
  ausente = se deriva del nombre (`"Visión General"` → `vision-general`). Repetida →
  `422 VALIDATION_TAB_KEY`.
- Sale en `DDTabMeta.key` (`/config/me`, `/config/tabs/{id}`, preview) y en `DDLayoutTab.key`.
- Las pestañas existentes se rellenaron en la migración con el slug del nombre (`overview`).
- La reversión copia la `key`, así que una pestaña conserva su identidad a través de versiones.

## 4 · «Qué cambió» en el historial · ya existe, y esto es lo que hay que mirar

El diff **sí existe** desde la Fase 5: `GET /admin/layouts/{id}/publications` y
`GET /admin/dashboards/{id}/publications` devuelven `DDLayoutPublication` con `actor_user_id`,
`actor_role`, `action` (`publish` | `rollback`), `previous_layout_id`, `created_at` y **`diff`**:

```json
"diff": {
  "tabs_added": ["marca"], "tabs_removed": [], "tabs_reordered": [],
  "panels_added": [{ "tab": "…", "metric_id": "…" }],
  "panels_removed": [], 
  "panels_moved": [{ "tab": "…", "metric_id": "…", "from": { "col_start": 1, "col_span": 3, "row_span": 4 }, "to": { … } }],
  "panels_retyped": [{ "tab": "…", "metric_id": "…", "from_type": "kpi", "to_type": "gauge" }],
  "panels_options_changed": [],
  "summary": { "tabs_added": 1, "panels_changed": 1, … }
}
```

Es exactamente lo que piden: qué pestañas y qué paneles se agregaron, quitaron o movieron contra
la versión anterior, más `from`/`to` de posición.

**Por qué vieron `[]`:** el layout que midieron es el sembrado, y la semilla escribe
`dd_layout_versions` directamente sin pasar por `publish`, así que no tiene fila de auditoría. La
primera publicación desde el builder ya genera una (con `previous_layout_id` = la sembrada y el
diff completo). Lo verificamos hoy: publish + revert dejan dos filas, `publish` y `rollback`, cada
una con actor y diff.

**Una cosa que sí faltaba** y la agregamos: `DDLayoutVersion` sigue trayendo solo «cuándo»; el
«quién» y el «qué cambió» viven en la publicación. Si para B6 les sirve más recibirlo dentro de
`GET /admin/tenants/{id}/layouts` (cada versión con su última publicación embebida), lo hacemos;
es una consulta más, no un cambio de modelo.

## 5 · Cuándo se prende `DD_MATERIALIZE_PROSE_ENABLED`

Depende de validar el prompt contra el agente real de Lobueno (en local pasa con un agente
simulado). El plan: lo prendemos en dev en la próxima corrida diaria después de que el equipo de
despliegue suba este commit, miramos `governance.source = agent:<nombre>` y el `headline` en los
dos paneles, y si el texto es razonable queda prendido. Hasta entonces esos dos paneles siguen con
el valor del seed. Les avisamos el día que se prenda para que puedan cerrar la tarea contra dato
real.

## `roles.tab_ids` · sí, vamos por `key`, y así lo proponemos

De acuerdo con ustedes: la restricción de rol debe referirse a la pestaña por `key`, no por `id`.
Propuesta concreta, en dos pasos y sin romper nada:

1. **Backend (siguiente commit):** columna nueva `roles.tab_keys` (`text[]`) como fuente de
   verdad. `roleCanSeeTab` resuelve por `key` contra las pestañas del layout que se está sirviendo.
   `tab_ids` no se borra: sigue leyéndose como fallback cuando `tab_keys` está vacío, para que
   nada cambie hasta que ustedes migren.
2. **Consola de roles:** `PUT /admin/roles/{id}` acepta `tab_keys` (y sigue aceptando `tab_ids`
   mientras tanto). `GET .../roles/composition` devuelve las dos.

Con eso un rol restringido sobrevive a publicaciones y reversiones, y ustedes se refieren a una
pestaña por `key` en todos lados. **Avisen si les sirve así**, y lo hacemos en el mismo movimiento
que su cambio de consola. Mientras tanto, `key` ya viaja, así que pueden empezar a guardar keys
de su lado.

## B2.12 · la fila que nunca se materializó ya sale `DEGRADED`

Su `PARA-BACKEND.md` regenerado repite que `executive_summary` y `decisions` salen `AVAILABLE`
con el valor del seed. Lo medimos hoy contra este commit con el tenant Lobueno (dato real, el
materializador corrió y las dejó `preserved`):

```
DEGRADED · "Esta métrica todavía no se calculó con datos reales; el valor que se muestra es de referencia"
        · unlocks_with: "Falta registrar la fuente de datos de esta métrica"
```

La regla existe desde el 16: `last_success_at IS NULL` **y** hubo un intento (`last_error` no
vacío) → `DEGRADED`, sin importar la edad. Es exactamente «nunca» distinto de «vieja». Si en su
base salen `AVAILABLE`, es porque ahí el materializador no corrió nunca contra esas filas (una
fila solo-seed sin intento **no** degrada a propósito: un tenant sin Gold vería todo el tablero
degradado). Corran `POST /admin/tenants/{id}/materialize` una vez y remidan.

## Lo que necesitamos de ustedes

Tres cosas, y las tres son archivos o una confirmación, no código:

1. **El repertorio de 49 y su contrato**, para construir `GET /config/plots`. Están en su fork
   y no en este repo: `docs/REPERTORIO-2026-09-28-los-49-graficos.md`,
   `docs/DECISIONES-2026-09-26-minimos-por-grafico.md` y la parte del contrato que declara
   `Grafico` y `MinimoDeDatos`. Pásennos los tres (o el path del fork). Con eso va como seed
   global con la misma figura que `/config/blocks`, con el mínimo por forma y el `tope`. Sin la
   tabla lo escribiríamos a ciegas y habría que rehacerlo.
2. **Confirmación de `roles.tab_keys`** (sección anterior): si les sirve así, lo hacemos en el
   mismo movimiento que su cambio de consola de roles.
3. **Remedir contra este commit y regenerar `PARA-BACKEND.md`.** Cuatro de los cinco puntos
   que listaba (`error` en español, `tenant.label`, `tab.key`, `chart`) ya están acá; el archivo
   los va a seguir mostrando hasta que su puerta corra contra el binario nuevo.
