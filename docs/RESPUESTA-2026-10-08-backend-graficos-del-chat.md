# Front — cómo graficar respuestas de `POST /api/v1/config/chat`

Guía para el equipo de front (producto / Gerardo). Parte del pedido en
[`MENSAJE-2026-10-07-backend-respuestas-del-chat.md`](MENSAJE-2026-10-07-backend-respuestas-del-chat.md).
Contrato HTTP: `internal/adapters/handler/docs/openapi.yaml` (`DDChatStructuredData`).

---

## ¿Viene la data para graficar?

**Sí, cuando el agente Cortex devuelve datos** (consulta SQL con `result_set` o
`data_to_chart` / `response.chart`). El backend no inventa cifras: traduce lo que
envía el agente a un frame SSE `data` con la misma idea que un panel materializado:

```json
{
  "shape": "<forma>",
  "data": { ... },
  "provenance": { ... }
}
```

**No hay un endpoint aparte** ni un campo `chart` fuera de ese objeto. Todo pasa por
`event: data` (y, al reabrir hilo, `structured_data` en
`GET /config/chat/threads/:id/messages`).

Si el usuario solo recibe texto (`delta`) y **ningún** frame `data`, el agente no
mandó resultado tabular/gráfico en ese turno (prompt o herramientas), no es que el
API oculte el payload.

---

## Flujo SSE (orden típico)

```http
POST /api/v1/config/chat
Accept: text/event-stream
Authorization: Bearer <jwt>
```

| `event` | Contenido | Uso en UI |
|---------|-----------|-----------|
| `thread_info` | `{ thread_id, parent_message_id, user_thread_id }` | Persistir para el siguiente turno |
| `thinking` | progreso / herramienta | Opcional |
| `delta` | `{ "text": "..." }` | Markdown de la respuesta |
| `data` | **`DDChatStructuredData`** | **Mini-bloque / gráfico** (esta guía) |
| `sql` | `{ "sql", "tool" }` | Enlace “ver consulta” |
| `error` | `{ code, message }` | Error del turno |
| `done` | `{}` | Fin del turno |

Formato de línea: `event: <nombre>\ndata: <json>\n\n`.

Puede haber **varios** `data` en un mismo turno (varias consultas o un tabular + un chart).

---

## Regla de oro para graficar

Reutilizar **los mismos renderers** que ya usan para un panel del dashboard:

- Misma `shape` + mismo cuerpo `data` que en `POST /config/panels:batch` → `payloads[].value`
  (sin `presentation` en chat; solo `shape` + `data` + `provenance`).

No hace falta un adaptador distinto “solo para chat” salvo el caso **`raw`** (abajo).

### Gobernanza (color de familia)

`provenance` trae lo necesario para pintar como en consola (F3.6):

| Campo | Uso |
|-------|-----|
| `family` | Color / familia de la métrica (**obligatorio para aplicar paleta de catálogo**) |
| `base`, `base_source` | Base declarada (`base_source: "catalog"` cuando aplica) |
| `layer`, `source_system` | Etiquetas de gobernanza |
| `metric_key`, `period` | Título / contexto |
| `catalog_version` | Versión de catálogo |
| `freshness` | Última materialización (panel); puede ir vacío en pestaña |
| `queried_at` | Momento de la consulta del agente |
| `sql_available` | Hubo frame `sql` en el mismo turno |

**Chat con `panel_context`:** `family`, `base`, `layer`, `source_system` y `metric_key`
vienen del catálogo de la métrica del panel → **deberían graficarse igual que el bloque**.

**Chat con `tab_context`:** el backend intenta inferir la métrica (columnas SQL,
`usermeta.snowflake.columnRoles`, campos del `chart_spec`) y cruzar con las métricas
**visibles en esa pestaña**. Si no hay match, `family` sigue `""` → el front debe
**mostrar el dato en modo declarado** (sin color de familia), no descartar el frame
(ver corrección que ya hicieron en el MENSAJE §85–94).

---

## Por `shape`: qué hay en `data` y cómo dibujarlo

Valores que puede enviar el backend hoy (mismo materializador que `dd_panel_data`):

### `scalar`

```json
{
  "shape": "scalar",
  "data": { "shape": "scalar", "v": 1234567 },
  "provenance": { "family": "demand", ... }
}
```

**Front:** componente KPI / cifra única (igual que bloque KPI del dashboard).

### `scalar_with_interval`

`data`: `{ "shape", "v", "lo", "hi", "level"? }`  
**Front:** KPI con intervalo.

### `time_series`

`data`: `{ "shape": "time_series", "points": [ { "t": "<fecha>", "v": <número> }, ... ] }`  
Columnas SQL típicas que el materializador entiende: `t` + `v` (nombres en minúsculas
tras el parseo del `result_set`).

**Front:** gráfico de línea / serie temporal (mismo que panel `time_series`).

### `categorical` / `ranking` / `composition`

`data`: `{ "shape", "items" | "parts": [ { "label", "v" }, ... ] }`  
**Front:** barras, ranking, dona, etc., según el bloque del panel.

### `multi_series`

`data`: `{ "shape", "series": [ { "label", "points": [ { "t", "v" } ] } ] }`  
**Front:** mismo multi-serie del dashboard.

### `tabular`

`data`: `{ "shape": "tabular", "columns": [ { "key", "title", ... } ], "rows": [ ... ] }`  
**La data para tablas y muchas “cifras” desglosadas está aquí.**

El MENSAJE del 07-10 pedía **family** en pestaña, no prohibir `tabular`. Si hoy el
front muestra *“llegó en forma tabular y esta pregunta no salió de un panel”* y no
dibuja, es una **regla de producto del cliente**, no ausencia de payload. Para
graficar:

- **Opción A:** renderizar `tabular` con el componente de tabla del dashboard (o
  derivar un mini-gráfico si hay columnas `label`/`v` o tiempo + medida).
- **Opción B:** seguir limitando tabular en pestaña, pero entonces **no** esperar
  cifras tipo KPI hasta que el backend transforme a `scalar` / `time_series` (mejora
  futura).

### `prose`

`data`: `{ "shape": "prose", "headline", "pillars": [...] }`  
**Front:** bloque de texto estructurado, no gráfico numérico.

### `raw` (importante para gráficos del agente)

Cuando el agente manda **Vega-Lite** (`response.chart` / `data_to_chart`) y no hay
`result_set` tabular, el backend suele enviar:

```json
{
  "shape": "raw",
  "data": {
    "shape": "chart",
    "chart_spec": { /* Vega-Lite */ }
  },
  "provenance": { "family": "...", "metric_key": "...", ... }
}
```

A veces `data` es el spec anidado de otra forma; siempre inspeccionar si existe
`data.shape === "chart"` y `data.chart_spec`.

**Front (lo que ya describieron en el MENSAJE):**

1. Detectar `shape === "raw"` y cuerpo con `chart_spec`.
2. Traducir Vega-Lite simple a sus formas internas (`series`, `bars`, etc.) **o**
   usar un renderer Vega si lo tienen.
3. Rechazar specs con `aggregate` / `transform` que obliguen a calcular en browser
   (decisión documentada en el MENSAJE §100–107).
4. Aplicar color con `provenance.family` cuando venga; si `family === ""`, mostrar
   gráfico en gris / declarado, no silenciar el frame.

El OpenAPI lista `shape: chart`, pero en la práctica **muchas respuestas de chart
llegan como `raw`**; el adaptador debe contemplar ambos.

---

## Cómo decide el backend la `shape` del frame

1. **Panel (`panel_context`):** usa la `shape` de la métrica del panel en catálogo.
   - Intenta `TransformValue(shape, filas SQL)`.
   - Si falla → `tabular`.
   - Si no hay filas → `raw`.

2. **Pestaña (`tab_context`):** sin métrica única en el contexto.
   - Si infiere `metric_key` en la pestaña → usa la `shape` de esa métrica en catálogo
     (mismo flujo que arriba).
   - Si no infiere métrica → `shape` vacía en transform → casi siempre **`tabular`**
     o **`raw`** (chart).

Por eso en pestaña es frecuente ver `tabular` aunque la pregunta pida “un gráfico”:
el SQL del agente no coincide con columnas `t`/`v` de `time_series` hasta que se
identifica la métrica y su shape.

---

## Checklist de integración (graficar “como el dashboard”)

1. **Por cada `event: data` del stream** (y `structured_data` del historial), parsear
   JSON raíz `{ shape, data, provenance }`.
2. **Switch por `shape`** usando los mismos componentes que `panels:batch`.
3. **Caso `raw`:** desanidar `chart` → `chart_spec` → vuestra conversión a `series` /
   `bars` (fixture de referencia que citaron:
   `tests/api/fixtures/chart-spec-ingresos-2026-10-07.json` en el repo front, si existe).
4. **`provenance.family`:**
   - Con valor → paleta de familia igual que en consola.
   - Vacío → UI declarada (“sin familia en catálogo”), **pero seguir mostrando** tabla
     o gráfico si `data` es válido (acuerdo MENSAJE).
5. **`panel_context` vs `tab_context`:** no exigir `panel_id` en el request para
   dibujar un `time_series` válido; el contexto solo afecta **de dónde sale
   `provenance`** (panel = siempre completa; pestaña = a veces incompleta).
6. **Varios `data` en un turno:** renderizar en orden (p. ej. varias cifras + un
   gráfico de paid media).
7. **Desplegar backend** con enriquecimiento de provenance en pestaña; sin ese
   build, `family` en `tab_context` seguirá vacía siempre.

---

## Ejemplo mínimo (panel — debería graficar sin trucos)

Request:

```json
{
  "question": "¿Cómo evolucionó la métrica en los últimos 6 meses?",
  "panel_context": { "panel_id": "<uuid>", "period": "2026-10" }
}
```

Frame `data` esperable (ilustrativo):

```json
{
  "shape": "time_series",
  "data": {
    "shape": "time_series",
    "points": [
      { "t": "2026-05-01", "v": 100 },
      { "t": "2026-06-01", "v": 120 }
    ]
  },
  "provenance": {
    "source": "cortex_agent",
    "metric_key": "ingresos",
    "period": "2026-10",
    "family": "demand",
    "layer": "GOLD",
    "source_system": "Shopify",
    "base": "ALL CHANNELS",
    "base_source": "catalog",
    "catalog_version": 1,
    "queried_at": "2026-10-08T12:00:00Z",
    "sql_available": true
  }
}
```

**Front:** mismo gráfico de línea que si ese `data` viniera del batch del panel.

---

## Ejemplo pestaña (data sí llega; family puede faltar)

Request:

```json
{
  "question": "Ingresos por medio paid media ene-jul",
  "tab_context": { "tab_id": "<uuid>", "period": "2026-10" }
}
```

Posibles frames:

1. `shape: "tabular"` con filas por medio → **hay datos**; pintar tabla o gráfico de
   barras si mapean columnas; `family` solo si el backend cruzó la métrica del catálogo.
2. `shape: "raw"` + `chart_spec` → **hay datos** para gráfico tras adaptador Vega.

Si solo aparecen placeholders grises, revisar en DevTools el JSON real de cada `data`:
casi siempre es **regla de render** (tabular/pestaña, `family` vacía) y no falta de
evento en el stream.

---

## Qué pidió el MENSAJE y quién lo cubre

| Tema | Backend (después del cambio post-MENSAJE) | Front |
|------|-------------------------------------------|--------|
| Respuestas más largas + recomendaciones | Prompt actualizado | Render markdown (`### Recomendaciones`, etc.) |
| Más consultas y charts del agente | Prompt + instrucciones `data_to_chart` | Consumir frames `data` |
| `family` en pestaña | Heurística vs métricas de la pestaña | Color si viene; declarar si no |
| `raw` + `chart_spec` | Sigue enviando `raw` | Adaptador Vega → `series`/`bars` (MENSAJE §87–92) |
| Tablas en markdown | — | Parser de tablas (MENSAJE §94–95) |

---

## Debug rápido (QA)

1. Network → respuesta SSE de `POST /config/chat` → buscar líneas `event: data`.
2. Copiar el JSON: ¿`shape`? ¿`provenance.family`?
3. Repetir con **`panel_context`** en un panel conocido: si ahí grafica y en
   **`tab_context`** no, el gap es provenance/shape en pestaña o reglas UI de tabular.
4. Comparar el mismo `data` con lo que devolvería `panels:batch` para esa métrica y
   período (deberían ser compatibles cuando el agente devuelve filas estándar).

---

## Referencias en este repo

| Pieza | Ubicación |
|-------|-----------|
| Transformación filas → shape | `internal/core/services/dd_chat_structured.go` → `StructuredDataFromCortex` |
| Provenance panel / pestaña | `provenanceFromContext`, `enrichTabProvenance` |
| Traducción Cortex → `data` | `internal/core/services/cortex_sse.go` |
| OpenAPI | `DDChatStructuredData`, `POST /config/chat` |

Si necesitan un cambio de contrato (p. ej. backend emite siempre `time_series` en vez
de `tabular` en pestaña), conviene acordarlo aparte; hoy el API **sí entrega datos
graficables** en `data` cuando el agente los produce, con las salvedades de `raw`/chart
y `provenance.family` en pestaña descritas arriba.
