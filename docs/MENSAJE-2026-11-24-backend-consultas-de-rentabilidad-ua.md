# Para el equipo de backend · UA MX: las consultas de 16 métricas de rentabilidad, CRO y clientes · 2026-11-24

**Medido contra `f1ccbbe` el 2026-11-24**. En QA, ese mismo día,
`GET /admin/tenants/{tenantId}/catalog/data?period=2026-10` de UA MX: las 12
de abajo están en el catálogo, y QA las sirve `BLOCKED` con «Esta métrica
todavía no tiene fuente de datos». En Snowflake, en solo lectura con
`RL_BT_UA_TRANSFORM`:

- las columnas y el `GET_DDL` de `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS`;
- las columnas de `GLD_ECOMM_PROFITABILITY_DAILY` y de
  `GLD_CUSTOMER_LTV_COHORTS_MATRIX`;
- los valores de agosto a noviembre de 2026;
- la vista `SYNAPSE_METRIC_CATALOG`.

El análisis completo está en `docs/AUDITORIA-2026-11-24-catalogo-ua-mx-v3.2.md`.

Hola. Datos entregó tres vistas nuevas de UA MX que **ya traen cada métrica
calculada en su columna**, así que las consultas son simples. Les mandamos el
SQL y la cifra que tiene que dar, como hicimos con Terpel.

**Antes de publicarlas, lean el punto 3.** Esta fuente no cuadra con la que
usan hoy los paneles de venta, y datos tiene que decidir cuál vale.

## 1 · Las 12 que ya están en el catálogo

Todas leen `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS`, que tiene una fila por
mes (`MES`, primer día). Como en las de Terpel, el nombre va sin base ni
esquema, y los `?` son el inicio y el fin del período:

```sql
SELECT <COLUMNA> AS v
  FROM GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS
 WHERE MES >= ? AND MES < ?
```

| `metric_key` | Columna | Forma | 2026-10 | 2026-11 |
|---|---|---|---|---|
| `brand_spend_total` | `SPEND_BRAND` | scalar · USD | 157468.978 | 58313.4478 |
| `perf_spend_total` | `SPEND_PERFORMANCE` | scalar · USD | 66843.0892 | 142790.4197 |
| `mer_total` | `MER_TOTAL` | ratio · x | 1.71 | 4.96 |
| `gpt_total` | `GPT_USD` | scalar · USD | 42.15 | 80.44 |
| `gpot_total` | `GPOT_USD` | scalar · USD | 158740.8 | 796593.06 |
| `poas_blended` | `POAS_RATIO` | scalar · x | 0.94 | 2.73 |
| `cm1_margin` | `CM1_GROSS_PROFIT` | scalar · USD | 210679.08 | 548733.31 |
| `cm2_margin` | `CM2_PROFIT_AFTER_FEES` | scalar · USD | 201102.76 | 523790.89 |
| `cm3_contribution` | `CM3_CONTRIBUTION_MARGIN_USD` | scalar · USD | -42039.31 | 273172.02 |
| `ltv_cac_ratio` | `LTV_CAC_RATIO` | scalar · x | 4.70 | 4.43 |
| `pacing_annual_30m` | `PACING_ANNUAL_30M_PCT` | scalar · % | 24.95 | 24.58 |

Y la de forma `multi_series`:

| `metric_key` | Vista | Cómo |
|---|---|---|
| `ltv_cohort_matrix` | `GLD_CUSTOMER_LTV_COHORTS_MATRIX` | Una serie por ventana (`LTV_M1_30D`, `LTV_M3_90D`, `LTV_M6_180D`, `LTV_M12_360D`, `LTV_LIFETIME`), con un punto por `MES_COHORTE` de los doce meses que terminan en el período, y `unit: "USD"` en cada serie |

Para comprobar `ltv_cohort_matrix`, la cohorte de 2026-10 tiene que dar
`LTV_M1_30D` = 113.89 y `LTV_LIFETIME` = 118.57.

**Noviembre es un mes en curso**: sus cifras cambian hasta que cierre.

**`mer_total` no tiene fila** en la vista `SYNAPSE_METRIC_CATALOG` de datos,
aunque QA la tiene en el catálogo. Se la pedimos a datos.

## 2 · Las cuatro que faltan en el catálogo

Datos va a agregar las filas; se lo pedimos en
`docs/MENSAJE-2026-11-24-datos-rentabilidad-ua.md`. Las columnas ya existen:

| `metric_key` | Consulta | 2026-10 |
|---|---|---|
| `cpa_blended` | `CPA_BLENDED` de `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS`, como las de arriba | 59.56 |
| `pacing_revenue_fy27` | `PACING_REVENUE_FY27_PCT`, de la misma vista | 36.5 |
| `atc_rate` | `ROUND(SUM(TOTAL_ATC) / NULLIF(SUM(TOTAL_SESSIONS), 0) * 100, 2)` sobre `GLD_ECOMM_PROFITABILITY_DAILY` con `DATE >= ? AND DATE < ?` | 15.51 |
| `cart_completion` | `ROUND(SUM(TOTAL_ORDERS) / NULLIF(SUM(TOTAL_ATC), 0) * 100, 2)`, misma vista | 5.77 |

Las dos tasas **se calculan sumando numerador y denominador del mes**, no
promediando la columna `_PCT` de cada día.

## 3 · Esta fuente no cuadra con la de los paneles de venta

La vista nueva toma la venta de `FCT_PERFORMANCE` y el gasto de
`COSTOS_CAMPANAS`. Los paneles actuales (`revenue`, `spend`, `daily_trend`)
leen `GLD_ECOMM_DAILY_PERFORMANCE`. Para el mismo mes no dan lo mismo:

| Mes | Venta · paneles actuales | Venta · vista nueva | Gasto · paneles actuales | Gasto · vista nueva |
|---|---|---|---|---|
| 2026-09 | 1 319 462 | 790 183.82 | 118 807 | 254 788.29 |
| 2026-10 | 648 106 | 383 052.87 | 55 936 | 224 312.07 |

En una misma pestaña, «Ingresos» diría 648 K y el MER saldría de 383 K. **No
las publiquen juntas hasta que datos diga cuál es la fuente de verdad.** Se lo
preguntamos en su mensaje.

## 4 · Y una de seguridad, de otro tema

Al construir los avisos por externos encontramos que
`GET /admin/report-external-notices` exige solo rol admin y **no filtra por
cliente**: un admin de UA MX puede leer los correos externos de los reportes
de Terpel. Lo leímos en `dd_report_handler.go` (`ListExternalNotices`) y en el
router de `f1ccbbe`. El front solo la pide con alcance de plataforma, pero la
ruta está abierta. **Pedido:** que exija operador de plataforma, como
`POST /admin/tenants`, o que filtre por el cliente del token.

Gracias.
