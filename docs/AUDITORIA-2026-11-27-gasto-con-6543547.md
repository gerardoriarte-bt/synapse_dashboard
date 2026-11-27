# El gasto de UA con 6543547, contra Snowflake y contra la pantalla · 2026-11-27

**Qué se revisó:** `docs/RESPUESTA-2026-11-25-backend-79d2e68-y-gasto.md`, la
respuesta a `docs/MENSAJE-2026-11-25-backend-79d2e68-y-gasto.md`.

**Medido el 2026-11-27.**

- **Remoto:** `79d2e68` y `6543547` están en `feature/dynamic-dashboard-backend`,
  con `8435296` como cabeza. Se leyó el diff de `6543547` y
  `periodBindings`/`loadKPISnapshot` en
  `internal/core/services/dd_materializer_service.go`.
- **Snowflake**, en solo lectura con `RL_BT_UA_TRANSFORM`, septiembre a
  noviembre de 2026: `GLD_ECOMM_PROFITABILITY_DAILY`,
  `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` y `GLD_ECOMM_DAILY_PERFORMANCE`.
- **QA, sin medir.** El front sirve un bundle del 2026-11-26 a las 19:49 GMT,
  con el chunk principal de 455 KB que deja #147. Del backend no se sabe qué
  commit corre: medirlo pide sesión, y no la había.

## 1 · Lo que está bien

| Qué | Medido |
|---|---|
| `spend` = `TOTAL_AD_SPEND` | Octubre **224 312,07**, igual a su cifra de control |
| `roas_paid` = `ROAS_PAID` | Octubre **5,73** |
| `bounce_rate_paid` | Octubre **17,13 %**: el «~17,13 %» que anuncian |
| La serie diaria cruza con `GLD_ECOMM_PROFITABILITY_DAILY` | **Una fila por día** (31 en octubre), así que el `LEFT JOIN` no duplica la venta. La suma diaria da los 224 312,07 del mes |
| Los seis `?` de `KPISQL` | `periodBindings` alterna inicio y fin, así que tres pares reciben los mismos límites. Correcto |

En noviembre la vista diaria tiene 26 días y la de ecomm 30: los días sin
fila salen con la inversión vacía en la serie, no en cero.

## 2 · Lo que se rompe en la pantalla de UA

El dashboard de UA (`dev/dashboards/ua-mx.json`) pone juntos `spend`, `roas`,
`goal_attainment`, `media_efficiency_12m` y `daily_trend`. Con `6543547`,
octubre se vería así:

| Panel | Qué calcula | Octubre |
|---|---|---|
| `spend` · la cifra | `TOTAL_AD_SPEND` | 224 312 |
| `spend` · **«% DE LA META»** | `TOTAL_AD_SPEND / SUM(BUDGET_TARGET)` | **295 %** (antes 73,6 %) |
| `goal_attainment` · «Inversión» | `GROSS_SPEND / BUDGET_TARGET` | 73,6 % |
| `budget_status` | `GROSS_SPEND / BUDGET_TARGET` | 73,6 % |
| `roas` | `REV_TOTAL / GROSS_SPEND` | **11,59** |
| `media_efficiency_12m` · roas | `REV_TOTAL / TOTAL_AD_SPEND` | 2,89 |

1. **La meta de `spend` cambió de base sin que nadie lo pidiera.**
   `spend_target` sigue siendo `SUM(BUDGET_TARGET)`, que está en la base de
   `GROSS_SPEND` (75 974 contra 55 936). La tarjeta diría «295 % de la meta»
   y el avance a la meta, «Inversión 73,6 %». **Es en parte nuestro**: §5 de
   `AUDITORIA-2026-11-25-catalogo-ua-mx-v4.2.md` listó lo que leía
   `GROSS_SPEND`, y no vio que la meta de `spend` se arma con
   `BUDGET_TARGET`.
2. **`roas` y la inversión ya no se leen juntos.** Venta / Inversión en la
   misma pantalla da 2,89 (el MER), y el panel `roas` dice 11,59. No se pidió
   cambiarlo: el mensaje lo nombró sólo como consumidor de `GROSS_SPEND`.
   `REV_TOTAL / GROSS_SPEND` no es ninguna métrica que datos haya definido:
   no es el MER (2,89) ni el `ROAS_PAID` (5,73).

**Lo que destraba el punto 1 es la base de `BUDGET_TARGET`**, que ya se le
preguntó a datos en `MENSAJE-2026-11-25-datos-catalogo-ua-mx-v4.2.md` §3. El
punto 2 es una decisión del dashboard: qué panel de retorno va al lado de la
inversión.
