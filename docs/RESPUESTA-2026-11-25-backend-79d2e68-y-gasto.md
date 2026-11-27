# Para el equipo de front · 79d2e68 y gasto · 2026-11-25

Respuesta a `docs/MENSAJE-2026-11-25-backend-79d2e68-y-gasto.md`, medido por ustedes contra `db48310`.

## 1 · Publicar `79d2e68` y desplegarlo en QA

**Hecho en local desde antes (`79d2e68` + anotación `dd9e7a3`).** La rama local estaba **ahead 2** del remoto (mismo caso que `1d3013d`): hay que hacer `git push` y desplegar. Sin push no aparece en `git ls-remote`.

Tras el deploy de este commit (`6543547`, que incluye el push de `79d2e68` + el cambio de gasto):

- materializar UA MX `2026-10` → comprobar `revenue_paid` / `orders_paid` y `bounce_rate_paid` (~17,13 %);
- en QA ya debe ir `DD_REPORTS_ENABLED=true` (y `API_PUBLIC_URL`); reactiven el reporte pausado.

## 2 · Gasto: `spend` y `roas_paid` a la fuente de datos

**Hecho en `6543547`.**

| Clave | Antes | Ahora |
|---|---|---|
| `spend` | `SUM(GROSS_SPEND)` en ecomm | `TOTAL_AD_SPEND` en unit economics |
| `roas_paid` | `REV_PAID / GROSS_SPEND` en ecomm | `ROAS_PAID` en unit economics |
| `daily_trend` (serie Inversión) | `GROSS_SPEND` | `TOTAL_AD_SPEND` vía join a `GLD_ECOMM_PROFITABILITY_DAILY` |
| `media_efficiency_12m` (spend/roas) | `GROSS_SPEND` | `TOTAL_AD_SPEND` (mismo join) |
| drill-down día/semana de `spend` | `GROSS_SPEND` | `TOTAL_AD_SPEND` en profit daily |

**No tocado (como pedían):** `budget_status` sigue con `GROSS_SPEND` / `BUDGET_TARGET` hasta que datos fije la base del presupuesto. `roas` (el KPI distinto de `roas_paid`) y la rama «Inversión» de `goal_attainment` también siguen en `GROSS_SPEND` por ahora.

Cifras de control octubre: `spend` ≈ 224 312, `roas_paid` ≈ 5,73.

## Contrato

- Mismas claves `spend` / `roas_paid` / `daily_trend`; cambian las cifras (alineadas a unit economics).
- El meter `% DE LA META` de `spend` sigue usando `BUDGET_TARGET` de ecomm (igual que antes a nivel de campo).

## Variables de entorno

**Ninguna nueva para el gasto.** Siguen valiendo las de QA ya acordadas:

```env
DD_REPORTS_ENABLED=true
DD_REPORTS_TICK=5m
API_PUBLIC_URL=https://qa-synapse.lobueno.co
```

Tablas: defaults `DD_SNOWFLAKE_PROFIT_UNIT_ECONOMICS_TABLE` / `DD_SNOWFLAKE_PROFIT_DAILY_TABLE` (ya en el binario).

## QA

Commit a desplegar: `6543547` (incluye `79d2e68` + gasto). Hasta el push/deploy, el remoto y QA siguen en `db48310`.
