# Qué necesita un tenant en Snowflake para que Synapse lo consuma

**2026-09-11.** Verificado leyendo el código de `feature/dynamic-dashboard-backend`
y con consultas de solo lectura contra la cuenta.

---

## Hay TRES flujos, no uno, y solo uno usa el agente

Es la confusión que vale la pena deshacer antes de configurar nada.

| # | Flujo | Qué produce | ¿Agente? |
|---|---|---|---|
| 1 | **Catálogo** · `make sync-catalog` | Metadatos: qué métricas existen y su gobierno | **No.** Un `SELECT` a una vista |
| 2 | **Materialización** · `make materialize` | **Los datos que alimentan los gráficos** | **No.** 12 queries SQL escritas en Go |
| 3 | **Chat** · `/chat/stream` | Respuestas conversacionales | **Sí**, Cortex |

El agente de Snowflake aparece en los tres, pero **en los dos primeros solo aporta
credenciales y el `db.schema` donde buscar** (`agent.SnowflakeDb`,
`agent.SnowflakeSchema`). No se le pregunta nada. No hay prompt.

**La estructura de datos que alimenta los gráficos no la entrega el agente: está
escrita en `internal/core/dashboard/snowflake/queries.go`**, en un mapa de Go
llamado `MetricRegistry`. Ahí viven las doce métricas, su forma y su SQL.

---

## El contrato real: dos objetos y quince columnas

`dd_materializer_service.go` resuelve dos nombres, configurables por entorno:

| Variable | Default |
|---|---|
| `DD_SNOWFLAKE_ECOMM_TABLE` | `GLD_ECOMM_DAILY_PERFORMANCE` |
| `DD_SNOWFLAKE_PAID_MEDIA_TABLE` | `GLD_PAID_MEDIA` |

y los califica como `<agent.db>.<agent.schema>.<tabla>`.

**Los nombres de tabla son configurables. Los nombres de COLUMNA no**: están
escritos dentro del SQL de cada query.

### Objeto 1 · el de ecommerce

`DATE` · `REV_TOTAL` · `REV_TARGET` · `ORDERS_TOTAL` · `ORDERS_TARGET` ·
`UNITS_TOTAL` · `UNITS_TARGET` · `VISITS_TOTAL` · `VISITS_TARGET` ·
`GROSS_SPEND` · `BUDGET_TARGET`

### Objeto 2 · el de medios pagos

`DATE` · `FUENTE` · `COST_USD` · `INGRESOS_USD`

### Estado en UA MX · verificado

Los dos existen en `DB_BT_UA.BT_UA_MART_ANALYTICS` y **las quince columnas
están**. `GLD_ECOMM_DAILY_PERFORMANCE` es una dynamic table de 91 columnas y
2.557 filas; `GLD_PAID_MEDIA` es una vista de 33 columnas.

O sea: **el materializador funcionaría hoy contra UA MX.** Lo que falta para que
el catálogo también funcione es la vista `SYNAPSE_METRIC_CATALOG`, que no existe
— ver `SYNAPSE_METRIC_CATALOG.sql` al lado de este archivo.

---

## Las doce métricas del registro

| Clave del registro | Forma | De dónde sale |
|---|---|---|
| `revenue` `spend` `roas` `orders` `sessions` `units` | `scalar` | Una sola query (`KPISQL`) sobre la tabla de ecommerce |
| `goal_attainment` | `categorical` | Cinco `UNION ALL` de real contra objetivo |
| `daily_trend` | `multi_series` | Serie diaria de ingreso, visitas e inversión |
| `media_efficiency_12m` | `multi_series` | Doce meses agrupados |
| `platform_return` | `tabular` | Agrupado por `FUENTE` sobre medios pagos |
| `exec_resumen` `month_decisions` | `prose` | **`Blocked: true` en el código** |

Los dos últimos vienen marcados así por el propio backend:

> «Requires BT_UA_DECISION_LOG actionable framework (not in Snowflake Gold yet)»

Es la confirmación de que el resumen ejecutivo y las decisiones **no son
agregaciones de Snowflake**: son contenido que alguien produce.

---

## El punto que decide si esto escala a varios tenants

**El catálogo y el registro son dos mitades del mismo hecho, en dos lugares, y
pueden separarse sin que nadie se entere.**

- `dd_catalog_metrics.shape` dice `tabular` para `platform_return`.
- `MetricRegistry["platform_return"].Shape` dice `tabular` también.

Si uno cambia y el otro no, el panel se compone bien y falla al materializar.

Y el puente entre los dos es **un mapa de alias escrito a mano** en
`snowflake/keys.go`:

```go
"sales"      → "revenue"
"investment" → "spend"
"visits"     → "sessions"
"executive_summary" → "exec_resumen"
...
```

**Ahí es donde se rompe con el segundo tenant.** Un tenant cuyo catálogo declare
`ventas` no tiene alias, no encuentra query, y la métrica sale `BLOCKED` sin que
nada lo explique.

### Dos caminos, y hay que elegir uno antes de dar de alta el segundo tenant

**A · Contrato de forma.** Todo tenant expone dos objetos con esas quince
columnas exactas — una vista por encima de lo que ya tenga, que renombre. Es lo
que UA MX es de hecho.
*Barato y rígido:* un tenant sin `BUDGET_TARGET` no puede tener
`goal_attainment`, y no hay forma de decirlo salvo que el panel salga bloqueado.

**B · El registro pasa a ser dato.** `MetricRegistry` sale de Go y entra a una
tabla por tenant: clave, forma, SQL, columnas.
*Caro y flexible:* cada tenant declara sus métricas sin tocar el binario, y el
alias desaparece porque la clave del catálogo **es** la clave del registro.

La recomendación del front es **A para arrancar, B declarado como el destino**,
por una razón concreta: A se puede montar hoy con vistas sobre lo que cada tenant
ya tiene, y B necesita resolver antes cómo se versiona y se revisa un SQL que
vive en la base. Pero A sin fecha para B es cómo el alias de `keys.go` termina
con cuarenta entradas.

---

## Qué hay que hacer para dar de alta un tenant, hoy

1. **Una fila en `agents`** con `snowflake_db` y `snowflake_schema`.
2. **Dos objetos Gold** con las quince columnas — tablas o vistas, da igual.
3. **Una vista `SYNAPSE_METRIC_CATALOG`** en ese mismo schema, con el gobierno.
   No existe en ninguna cuenta todavía.
4. **Que las claves del catálogo caigan en `CanonicalKey`**, o agregar el alias.
5. `make sync-catalog TENANT_ID=<uuid>` y después
   `make materialize TENANT_ID=<uuid> PERIOD=<YYYY-MM>`.

**El paso 4 es el que no escala**, y es el que conviene resolver antes de tener
dos tenants en vez de después.

---

## Y qué NO cambia con nada de esto

Lo que el front necesita del backend no depende de cuál de los dos caminos se
elija: son los campos de `docs/PLAN-INTEGRACION-2026-09-11.md` §4. `ventana`,
`theme`, `unlocks_with`, `request_from` y el resto viajan por `/config/*` y son
independientes de cómo se llene `dd_panel_data`.

Salvo uno, que sí se toca acá: **`MEASUREMENT_WINDOW`**. Si la curaduría del
catálogo lo declara, el backend puede servirlo sin calcular nada.
