# Para el equipo de front · métricas de Terpel · 2026-11-03

Referencia: [`MENSAJE-2026-11-03-backend-metricas-de-terpel.md`](../MENSAJE-2026-11-03-backend-metricas-de-terpel.md), medido por ustedes contra `db91b5d`.

**Hecho en `f78d700`** (`feature/dynamic-dashboard-backend`). Las consultas de pauta de Terpel entran a `MetricRegistry`. `KPISQL` y las tablas de UA no se tocan.

**No hecho.** `media_by_campaign` no se registra: el mensaje no trae el `SELECT`, solo las columnas y la regla de `MODELO_COMPRA_NORM = 'OTRO'`. Sin el nombre de la campaña no se arma la fila. Cuando llegue la consulta, se suma.

**Contrato.** Ninguna ruta nueva. Las claves que ya estaban en el catálogo de Terpel dejan de salir en `keys_without_query`, salvo `media_by_campaign`.

**Commit en QA:** ninguno de este corte. `f78d700` no está en QA. Lo que midieron sigue en `db91b5d`.

---

## Por pedido

### Tanda A y las tres que se calculan

**Hecho.** Cada una lee `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE` en la base y el esquema del agente de Terpel. El nombre de la vista sale de `DD_SNOWFLAKE_TERPEL_PAUTA_TABLE` (ese es el default). La base `DB_BT_TERPEL_COMBS` no queda escrita en el SQL.

| Clave | Forma | Cálculo |
|---|---|---|
| `media_investment` | `scalar` | `SUM(GASTO_FINAL)`, rótulo `COP · TOTAL` |
| `media_budget_execution` | `scalar` | gasto / presupuesto × 100, con la condición de filas que mandaron. Puede pasar de 100. |
| `media_clicks` | `scalar` | `SUM(RESULTADO_CLICS)` |
| `media_impressions` | `scalar` | `SUM(RESULTADO_IMPRESIONES)` |
| `media_reach` | `scalar` | `SUM(RESULTADO_ALCANCE)` |
| `media_goal_attainment` | `categorical` | las seis ramas: alcance, impresiones, clics, interacciones, reproducciones y leads |
| `media_by_platform` | `tabular` | una fila por `PLATAFORMA_NORM`. CPC y CPM nulos se quedan nulos. |

Los cinco escalares no comparten la consulta de UA. Cada uno corre su `SELECT` sobre esa vista. UA sigue leyendo `GLD_ECOMM_DAILY_PERFORMANCE` y `GLD_PAID_MEDIA`.

`schema-check` exige la vista de pauta solo si el catálogo del cliente tiene alguna de estas claves. Un cliente UA no la pide. Terpel sigue viendo ausentes las dos Gold de UA: esas se exigen a todos, y este corte no las vuelve opcionales.

### ATL bloqueado

**Hecho.** `atl_investment` (`scalar`) y `atl_by_medium` (`composition`) quedan `Blocked`, con la razón:

> El reporte de medios ATL no trae el año de cada mes, así que todavía no se puede ubicar en un período.

No se consulta la vista de ATL. `atl_trps` no se registra: no está en el catálogo.

Si el `SHAPE` de esas dos en la vista del catálogo es otro, no importa mientras sigan bloqueadas: el materializador no compara la forma en ese caso. Cuando datos traiga el año, hay que alinear la forma antes de escribir el SQL.

### `media_by_campaign`

**No.** Falta la consulta. Con las columnas `PRESUPUESTO`, `GASTO_FINAL`, `PCT_EJECUCION_PRESUPUESTO` y `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL` no se sabe cuál es el nombre de la campaña ni si la vista ya trae una fila por campaña. Sigue en `keys_without_query` y, al materializar, `BLOCKED` con «Esta métrica todavía no tiene fuente de datos».

## QA

Después de desplegar `f78d700`, «Cargar meses» de julio a octubre de 2026 en Terpel debe dejar los cinco escalares y `media_goal_attainment` en `AVAILABLE`. Las cifras se mueven si datos sigue cargando la vista: si no cierran con la tabla del 3 de noviembre, hay que volver a correr la consulta antes de tratarlo como error. Las dos de ATL salen `BLOCKED` con la razón de arriba. `media_by_campaign` sigue sin cifra.
