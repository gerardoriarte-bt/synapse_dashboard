# Para el equipo de backend · UA MX: las consultas de 8 métricas de pauta atribuida · 2026-11-25

**Medido contra `db48310` el 2026-11-25**. En QA, ese día,
`GET /admin/tenants/{tenantId}/catalog/data?period=2026-10` de UA MX: las 8
de abajo están en el catálogo y salen `BLOCKED`. En Snowflake, en solo
lectura: las columnas de `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` y sus
valores de septiembre a noviembre. El detalle está en
`docs/AUDITORIA-2026-11-25-catalogo-ua-mx-v4.1.md`.

Hola. Datos entregó la v4.1 del catálogo de UA con una capa nueva: la venta,
las órdenes y el tráfico **atribuidos a pauta**. Las 8 ya tienen su fila y su
columna; falta la consulta. Igual que las de rentabilidad de ayer:

```sql
SELECT <COLUMNA> AS v
  FROM GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS
 WHERE MES >= ? AND MES < ?
```

| `metric_key` | Columna | Forma · unidad | 2026-10 | 2026-11 |
|---|---|---|---|---|
| `revenue_paid` | `REV_PAID` | scalar · USD | 383052.87 | 1012631.54 |
| `orders_paid` | `ORDERS_PAID` | scalar · entero | 3766 | 10119 |
| `visits_paid` | `VISITS_PAID` | scalar · entero | 561658 | 996600 |
| `cvr_paid` | `CVR_PAID_PCT` | scalar · % | 0.671 | 1.015 |
| `cpa_paid` | `CPA_PAID` | scalar · USD | 17.75 | 14.11 |
| `bounce_rate_paid` | `BOUNCE_RATE_PAID_PCT` | scalar · % | 0.00 | 0.05 |
| `rev_share_paid_pct` | `REV_SHARE_PAID_PCT` | scalar · % | 59.10 | 66.56 |
| `orders_share_paid_pct` | `ORDERS_SHARE_PAID_PCT` | scalar · % | 58.75 | 69.41 |

**Noviembre es un mes en curso**: sus cifras cambian hasta que cierre.

**`bounce_rate_paid` da 0**, y se lo preguntamos a datos. Regístrenla igual:
cuando datos corrija la columna, la cifra se corrige sola.

**No toquen todavía `spend` ni `roas_paid`.** Hoy salen del `KPISQL` sobre
`GLD_ECOMM_DAILY_PERFORMANCE` y no coinciden con la definición del catálogo
(56 K contra 224 K; 6,85 contra 5,73). Le preguntamos a datos cuál vale; si
hay que cambiar la consulta, se la pedimos aparte.

Gracias.
