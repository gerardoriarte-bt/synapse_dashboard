# El catálogo de UA MX v4.1, contra lo que existe · 2026-11-25

**Qué se revisó:** `docs/RESPUESTA-2026-11-25-datos-catalogo-ua-mx-v4.1.md`,
la respuesta de datos a `docs/MENSAJE-2026-11-24-datos-rentabilidad-ua.md`.
Trae la venta de verdad, los supuestos en la BASE, las filas que faltaban, los
umbrales de 17 indicadores y una capa nueva de pauta atribuida (8 métricas).

**Medido el 2026-11-25** en Snowflake, en solo lectura con
`RL_BT_UA_TRANSFORM`:

- `SYNAPSE_METRIC_CATALOG`: 20 filas, y la distribución de
  `SEMANTIC_DIRECTION`;
- las columnas de `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` y de
  `GLD_ECOMM_PROFITABILITY_DAILY`;
- septiembre a noviembre en esa vista mensual y en
  `GLD_ECOMM_DAILY_PERFORMANCE`.

En QA, ese mismo día:
`GET /admin/tenants/{tenantId}/catalog` (68 métricas) y
`GET /admin/tenants/{tenantId}/catalog/data?period=2026-10` de UA MX. Del
backend se leyó `internal/core/dashboard/snowflake/queries.go` de `db48310`.

## 1 · Lo que quedó resuelto

| Pedido del 2026-11-24 | Estado |
|---|---|
| ¿Cuál venta vale? | **Resuelto.** La vista de rentabilidad lee ahora la venta total: octubre da 648 106 en las dos fuentes |
| Supuestos en la BASE | **Resuelto**, y ya se ve en QA: `cm1_margin` dice «margen bruto supuesto de 55 %» |
| Las 5 filas que faltaban | **Resuelto**: `atc_rate`, `cart_completion`, `cpa_blended`, `pacing_revenue_fy27` y `mer_total` están en el catálogo y en QA con cifra |
| `cart_completion` bajo | **Explicado**: el denominador son productos agregados, no carritos |
| `ltv_cac_ratio` | **Confirmado** que cruza la cohorte con el gasto del mismo mes |
| Umbrales | **Entregados** para 17 indicadores (§5) |

## 2 · El gasto todavía no cuadra

La fila `spend` del catálogo dice «suma consolidada de pauta Brand (64,4 %) +
Performance (35,6 %)». Pero el panel lee otra columna:

| Mes | `spend` en QA (`GROSS_SPEND`) | Consolidado (`TOTAL_AD_SPEND`) | `SPEND_PERFORMANCE` |
|---|---|---|---|
| 2026-09 | 118 807 | 254 788 | — |
| 2026-10 | 55 936 | 224 312 | 66 843 |

`spend` y `roas_paid` salen del `KPISQL` sobre `GLD_ECOMM_DAILY_PERFORMANCE`.
**`roas_paid` da 6,85 en QA y 5,73 en la vista** (`REV_PAID /
SPEND_PERFORMANCE`). Con «Inversión» en 56 K al lado de un MER calculado
sobre 224 K, la pantalla se contradice.

## 3 · Las 8 de pauta atribuida

Están en el catálogo de QA y salen `BLOCKED` porque el backend no tiene su
consulta: `revenue_paid`, `orders_paid`, `visits_paid`, `cvr_paid`,
`cpa_paid`, `bounce_rate_paid`, `rev_share_paid_pct` y
`orders_share_paid_pct`. Las columnas existen en las dos vistas.

**`BOUNCE_RATE_PAID_PCT` da 0,00** en septiembre y octubre, y 0,05 en
noviembre. No es un rebote creíble.

## 4 · Lo que sigue pendiente de datos

- **`SEMANTIC_DIRECTION` sigue mezclado**: 26 «MÁS ALTO = MEJOR» y 4 «MÁS
  BAJO = MEJOR», pero también 7 «HIGHER = BETTER», 1 `HIGHER_IS_BETTER`, 1
  «LOWER = BETTER», 2 `NEUTRAL`, 2 «—» y 7 vacías.
- **`cm3_margin_pct` tiene umbral pero no es métrica.** La columna
  `CM3_MARGIN_PCT` existe; falta su fila. `cm3_contribution` es en USD.
- **El documento sigue nombrando `SYSADMIN`** entre los roles de consumo.

## 5 · Los umbrales, en el formato del panel

Se cargan como `thresholds` en el layout del panel cuando el front de `main`
esté en QA. Datos escribe el lado bueno con «>» y el front lo incluye («≥»):
una cifra justo en el corte se pinta bien. La diferencia está en el borde, y
conviene que datos la confirme.

| Indicador | `thresholds` |
|---|---|
| `ltv_cac_ratio` | `{ bien: 3.0, mal: 1.5 }` |
| `poas_blended` | `{ bien: 2.0, mal: 1.5 }` |
| `mer_total` | `{ bien: 4.5, mal: 3.5 }` |
| `gpt_total` | `{ bien: 40, mal: 25 }` |
| `rpv_total` | `{ bien: 1.5, mal: 1.0 }` |
| `cvr_total` | `{ bien: 1.8, mal: 1.2 }` |
| `atc_rate` | `{ bien: 10, mal: 6 }` |
| `cart_completion` | `{ bien: 6, mal: 4 }` |
| `roas_paid` | `{ bien: 4.0, mal: 3.0 }` |
| `cpa_blended` | `{ bien: 25, mal: 35 }` |
| `cpa_paid` | `{ bien: 20, mal: 30 }` |
| `bounce_rate_paid` | `{ bien: 35, mal: 45 }` |
| `ncac_registrados` | `{ bien: 30, mal: 45 }` |
| `ltv_registrados` | `{ bien: 110, mal: 80 }` |
| `promo_dependency` | `{ bien: 25, mal: 45 }` |
| `pacing_revenue_fy27` | `{ bien: 95, mal: 85 }` |
| `cm3_margin_pct` | `{ bien: 18, mal: 12 }` · espera su fila |

Donde `bien` es menor que `mal`, más bajo es mejor.

## 6 · La zona horaria

**Decisión humana del 2026-11-25: «la hora lo decide el usuario».** UA MX
sigue en `America/Bogota` en QA y el front no la cambia: es configuración del
cliente, y la define quien lo administra.
