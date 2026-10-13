# Para el equipo de front · tablas del chat con rótulos · respuesta backend · 2026-10-09

Referencia: mensaje en [`backend-respuesta-front-procedencia-chat-2026-10-08.md`](backend-respuesta-front-procedencia-chat-2026-10-08.md) (pedido tabular del 2026-10-09).

---

## Qué pedían

Armar columnas `tabular` del chat desde **`resultSetMetaData.rowType`** (orden del `SELECT`), no desde `inferTabularColumns` sobre la primera fila-mapa:

- Incluir **`label`** (dimensión de fila), no saltarla como en KPIs de panel.
- Orden estable (no depender del orden del `map` en Go).
- **`numeric`:** tipo Snowflake en `rowType` cuando venga; si no, inferir revisando **todas** las filas.

Sin cambiar `inferTabularColumns` para materialización de paneles.

---

## Qué hicimos

| Cambio | Ubicación |
|--------|-----------|
| `parseResultSetPayload` arma filas + `[]ColumnDef` en orden `rowType` | `dd_chat_structured.go` |
| `StructuredDataFromCortex` pasa `materialize.Options{TabularColumns: …}` al transformar | mismo archivo |
| `ColumnNumericFromRows` (todas las filas) | `materialize/rows.go` |
| Tipos numéricos Snowflake en `rowType.type` (`fixed`, `real`, …) | `snowflakeRowTypeNumeric` en `dd_chat_structured.go` |

**Efecto:** tablas con `fuente AS label` (clave `label`) llegan al front con columna de texto + medidas en el orden del `result_set`.

Tests: `TestStructuredDataFromCortex_TabularColumnasDesdeRowType`, `TestStructuredDataFromCortex_TabularNumericConNullsEnPrimeraFila`.

---

## Provenance (mensaje 2026-10-08)

El stream que midieron contra `9dc481e` sin merge del cruce por SQL es otro tema. En builds actuales:

- Cruce por **SQL + `MetricColumnUsage`** (no por alias `investment`/`revenue` en columnas del result set).
- `base` vacía con filtros de dimensión en el `WHERE`.

Si en QA siguen viendo `metric_key: revenue` + base Adobe en paid media, confirmar **versión desplegada** (debe incluir `dd_chat_sql_provenance.go`).

---

## Tramas 2 y 3 duplicadas

No reproducimos aún si Cortex devuelve el mismo `result_set` dos veces o si `translateToolResult` + `response.chart` emiten pares `data` separados. Si persiste en QA con build nuevo, enviar los tres frames `data` consecutivos (mismo turno) y revisamos el traductor SSE.

---

## Validación sugerida

Misma pregunta de presupuesto por plataforma (agosto 2026, pestaña `resumen`):

- Frame `tabular` con columna **`label`** (o equivalente) poblada en cada fila.
- Orden de columnas estable entre recargas.
- Tabla dibujable en front con su regla «filas con rótulo».

Gracias.
