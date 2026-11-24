# Para el equipo de front · consultas de rentabilidad UA · 2026-11-24

Respuesta a `docs/MENSAJE-2026-11-24-backend-consultas-de-rentabilidad-ua.md`, medido por ustedes contra `f1ccbbe`.

**Hecho en `1d3013d`.** Registry SQL de las 16 métricas + seguridad de avisos externos.

**No hecho (producto / datos).** No publicamos juntas en la misma pestaña las métricas nuevas con `revenue` / `spend` / `daily_trend` hasta que datos diga cuál es la fuente de verdad (punto 3 del mensaje). El código materializa las nuevas; el layout no debe mezclarlas todavía.

**Pendiente de datos.** `cpa_blended`, `pacing_revenue_fy27`, `atc_rate` y `cart_completion` ya tienen SQL; faltan las filas en `SYNAPSE_METRIC_CATALOG` (y sync). `mer_total` también: en catálogo de QA sí, en la vista de datos no.

## 1 · Las 12 del catálogo (+ 4 que faltan)

Todas en `MetricRegistry`. Tablas (override por env, default Gold):

| Env | Default |
|-----|---------|
| `DD_SNOWFLAKE_PROFIT_UNIT_ECONOMICS_TABLE` | `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` |
| `DD_SNOWFLAKE_PROFIT_DAILY_TABLE` | `GLD_ECOMM_PROFITABILITY_DAILY` |
| `DD_SNOWFLAKE_LTV_COHORTS_MATRIX_TABLE` | `GLD_CUSTOMER_LTV_COHORTS_MATRIX` |

| `metric_key` | Fuente | Forma |
|---|---|---|
| `brand_spend_total` … `pacing_annual_30m` (11) | unit economics · `MES` | scalar |
| `ltv_cohort_matrix` | LTV cohorts · 12 meses | multi_series · `unit: "USD"` por serie |
| `cpa_blended`, `pacing_revenue_fy27` | unit economics | scalar |
| `atc_rate`, `cart_completion` | daily · suma mes (no promedio `_PCT`) | scalar |

Tras materializar el período, dejan de venir `BLOCKED` «sin fuente» (si la vista existe en el schema del agente).

## 2 · Fuente vs paneles de venta

Las nuevas leen `FCT_PERFORMANCE` / `COSTOS_CAMPANAS` vía las vistas de rentabilidad. `revenue` / `spend` / `daily_trend` siguen en `GLD_ECOMM_DAILY_PERFORMANCE`. **No las junten en un layout publicado** hasta el OK de datos.

## 3 · Seguridad · `GET /admin/report-external-notices`

**Hecho.** Exige operador de plataforma (`RequirePlatformOperator`), igual que `POST /admin/tenants`. Un admin de un solo cliente ya no lista externos de otros tenants.

## Contrato

- Sin rutas nuevas de catálogo.
- `report-external-notices`: mismo JSON; auth más estricta → **403** si no es operador de plataforma.

## QA

Desplegar `1d3013d`, migrar si hace falta, materializar UA MX `2026-10` y comprobar cifras del mensaje (p. ej. `brand_spend_total` ≈ 157468.978). Cohorte oct-2026: `LTV_M1_30D` = 113.89, `LTV_LIFETIME` = 118.57.
