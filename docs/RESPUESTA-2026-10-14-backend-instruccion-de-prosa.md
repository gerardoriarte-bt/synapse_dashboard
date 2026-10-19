# Para el equipo de front · instrucción de prosa · respuesta backend · 2026-10-14

Referencia: [`MENSAJE-2026-10-14-backend-instruccion-de-prosa.md`](../MENSAJE-2026-10-14-backend-instruccion-de-prosa.md), medido por ustedes contra `3651d70`.

**Hecho en `5af3b86`** (`feature/dynamic-dashboard-backend`).

**Commit en QA:** no lo sabemos desde este repo. Hay que mirar el tag o la imagen desplegada. `5af3b86` no está en QA hasta que se despliegue esa imagen. El flag de prosa no se prende con el deploy solo: hay que setearlo en el entorno.

---

## Por pedido

### 1 · Encender `DD_MATERIALIZE_PROSE_ENABLED` en QA

**No hecho.** El default sigue en `false`. Prenderlo es una variable del entorno de QA, no un cambio de código: con `true` cada materialización llama a Cortex una vez por card de prosa y por período. Hasta que ese entorno lo tenga, `executive_summary` y `decisions` siguen `BLOCKED` después de la migración de semilla de `3651d70`.

### 2 · Una instrucción por métrica de prosa

**Hecho en `5af3b86`.** El campo es `prose_instruction` en `dd_catalog_metrics`. `BuildProsePrompt` lo usa cuando viene con texto. Si está vacío, sigue el `switch` de hoy: `month_decisions` con «qué mover, qué frenar y qué vigilar», y el resto con el resumen ejecutivo. El sync del catálogo no escribe esa columna.

### 3 · Cualquier métrica de forma `prose` del catálogo

**Hecho en `5af3b86`.** Si el generador está prendido, una métrica con `shape = prose` se redacta aunque no esté en el registro de Go. Las dos que ya estaban (`exec_resumen`, `month_decisions`) no cambian.

**El alta no es desde administración.** Una card nueva es una fila de la view de Snowflake, con `SHAPE = prose`, igual que `executive_summary`. La instrucción se carga después, por la ruta del punto 5. Una fila creada solo en Postgres se apartaría del sync, que es la fuente del catálogo.

Dos cards con la misma métrica siguen mostrando el mismo texto: el índice único sigue siendo `(tenant_id, metric_id, period)`. Coincide con la forma que propusieron: cada card distinta es una métrica distinta.

### 4 · Que el agente pueda consultar los datos de esa card

**Hecho en `5af3b86`, solo cuando hay instrucción.** El prompt deja de decir «usá solo las cifras del contexto» y pasa a permitir consultar los datos de ese período. Siguen las reglas de no inventar cifras, no nombrar tablas ni columnas, y responder solo el JSON `{headline, pillars}`. Sin instrucción, las dos de hoy siguen atadas al contexto de KPI.

No lo corrimos contra Cortex. Si la respuesta no trae ese JSON, la corrida queda `ERROR` y no pisa un `AVAILABLE` previo. El formato del payload de prosa no cambia.

### 5 · Ruta para editar la instrucción

**Hecho en `5af3b86`.** Solo la instrucción, no el resto de los campos editoriales.

`PATCH /api/v1/admin/tenants/{tenantId}/catalog/{metricId}`

```json
{ "prose_instruction": "Explicá qué movió el ROAS de Meta." }
```

Cadena vacía borra el encargo y vuelve al texto fijo de la clave. Máximo 2000 caracteres. Si la métrica no es `prose`, **422** `VALIDATION_PROSE_INSTRUCTION`. Si no es del cliente del token, **404** `NOT_FOUND_METRIC`.

## Contrato

| Dónde | Qué cambia |
|---|---|
| `dd_catalog_metrics` y `GET /config/catalog` (y el catálogo de admin) | `prose_instruction` (string, puede ir vacío) |
| `PATCH /api/v1/admin/tenants/{tenantId}/catalog/{metricId}` | ruta nueva, body `{ "prose_instruction": "..." }` |
| Payload de prosa | igual: `headline` y pillars |

## QA

Hasta desplegar `5af3b86` y setear `DD_MATERIALIZE_PROSE_ENABLED=true`, los dos paneles de prosa de UA quedan `BLOCKED` si ya corrió la migración de semilla. La instrucción no se redacta en la corrida siguiente si el flag sigue apagado.
