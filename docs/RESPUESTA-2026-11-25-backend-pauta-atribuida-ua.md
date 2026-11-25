# Para el equipo de front · pauta atribuida UA · 2026-11-25

Respuesta a `docs/MENSAJE-2026-11-25-backend-pauta-atribuida-ua.md`, medido por ustedes contra `db48310`.

**Hecho en `79d2e68`.** Las 8 métricas en `MetricRegistry` + columnas en `schema.go`, misma vista `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` (env `DD_SNOWFLAKE_PROFIT_UNIT_ECONOMICS_TABLE`, ya existía).

**No hecho (a propósito).** No tocamos `spend` ni `roas_paid`: siguen en `KPISQL` / `GLD_ECOMM_DAILY_PERFORMANCE` hasta el OK de datos.

## Pedidos

| `metric_key` | Columna | Forma |
|---|---|---|
| `revenue_paid` | `REV_PAID` | scalar · USD |
| `orders_paid` | `ORDERS_PAID` | scalar |
| `visits_paid` | `VISITS_PAID` | scalar |
| `cvr_paid` | `CVR_PAID_PCT` | scalar · % |
| `cpa_paid` | `CPA_PAID` | scalar · USD |
| `bounce_rate_paid` | `BOUNCE_RATE_PAID_PCT` | scalar · % (registrada aunque dé 0) |
| `rev_share_paid_pct` | `REV_SHARE_PAID_PCT` | scalar · % |
| `orders_share_paid_pct` | `ORDERS_SHARE_PAID_PCT` | scalar · % |

Consulta:

```sql
SELECT <COLUMNA> AS v
  FROM GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS
 WHERE MES >= ? AND MES < ?
```

## Contrato

Sin rutas nuevas. Tras desplegar + materializar UA MX `2026-10`, dejan de salir `BLOCKED` «sin fuente».

## Variables de entorno

**Ninguna nueva.** Reutilizan `DD_SNOWFLAKE_PROFIT_UNIT_ECONOMICS_TABLE` (default `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS`).

## QA

Desplegar `79d2e68` y materializar `period=2026-10`. Cifras de control del mensaje: `revenue_paid` ≈ 383052.87, `orders_paid` = 3766.
