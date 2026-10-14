# Seis métricas de MMM y forecast · para registrar

> **GENERADO a mano desde dos fuentes, y las dos se citan por fila.** El informe
> de datos del 2026-09-29 —`docs/snowflake/Informe_MMM_y_Forecast.pdf`— trae las
> tablas, las columnas y el SQL; las claves y las dos decisiones de forma las
> puso el front el 2026-10-02, en `docs/MENSAJE-2026-10-02-datos-las-cuatro-de-mmm.md`.
>
> **Es lo que el backend pidió para la otra tanda**: «mándennos la clave, las
> etapas y de qué columnas sale cada una».

**Las seis son de grano SEMANAL.** Ver §7.

---

## 1 · `revenue_forecast` · `series_with_band`

```
tabla   DB_BT_UA.BT_UA_SMART_PREDICTION.GLD_REVENUE_FORECAST
filas   7.194 · 2026-07-13 → 2028-12-25
```

| Columna | Campo |
|---|---|
| `FORECAST_WEEK` | `t` |
| `FORECAST_REVENUE` | `v` |
| `LOWER_BOUND` | `lo` |
| `UPPER_BOUND` | `hi` |
| `PREDICTION_INTERVAL` | `nivel` · 0.95 |

```sql
SELECT FORECAST_WEEK AS t, FORECAST_REVENUE AS v,
       LOWER_BOUND AS lo, UPPER_BOUND AS hi, PREDICTION_INTERVAL AS nivel
FROM DB_BT_UA.BT_UA_SMART_PREDICTION.GLD_REVENUE_FORECAST
```

**La banda cruza el cero en algunas semanas** —la del 2026-10-05 proyecta
$128.756 con `lo` de −$62.311—. **No se recorta**: el front lo dibuja tal cual y
la decisión está escrita con su razón en el mensaje a datos. No necesitan hacer
nada especial.

## 2 · `inventory_forecast` · `series_with_band`

```
tabla   DB_BT_UA.BT_UA_SMART_PREDICTION.GLD_INVENTORY_FORECAST
filas   27.412 · 2026-07-20 → 2028-12-25
```

Mismo mapeo de columnas que `revenue_forecast`.

## 3 · `revenue_forecast_close` · `scalar_with_interval`

```
tabla   DB_BT_UA.BT_UA_SMART_PREDICTION.GLD_REVENUE_FORECAST · UNA fila
```

El cierre proyectado del período. Mismas columnas, reducido a un punto con su
banda.

## 4 · `media_roas_recommendation` · `scalar_with_interval`

```
tabla   DB_BT_UA.BT_UA_SMART_PREDICTION.GLD_MEDIA_RECOMMENDATION
filas   913 · 2026-08-03 → 2026-10-26
filtro  SCENARIO = 'BASE'      ← obligatorio
```

| Columna | Campo |
|---|---|
| `EXPECTED_ROAS` | `v` |
| `CONFIDENCE_LOWER` | `lo` |
| `CONFIDENCE_UPPER` | `hi` |
| — | `nivel` · **0.95 constante** |

**Es ROAS, no gasto, y la decisión importa.** La propuesta original era
`v = SPEND_RECOMMENDED` con la banda de `CONFIDENCE_*`, que son límites del ROAS:
un punto en dólares con una banda en múltiplos no es un `scalar_with_interval`.
Datos lo marcó y elegimos su opción A.

**`ROAS_CONFIDENCE` es HIGH/MEDIUM/LOW y NO va en `nivel`**, que pide un número.
Queda como etiqueta aparte si la quieren exponer.

**`SCENARIO = 'BASE'` no es opcional.** Los otros dos están medidos y no son
publicables: `OPTIMISTIC` da Criteo en 64,8x y `CONSERVATIVE` pone 40 % del
presupuesto en PMax, que ahí rinde 0,12x.

## 5 · `mmm_channel_contribution` · `composition`

```
tabla   DB_BT_UA.BT_UA_MART_ANALYTICS.MMM_RESULTS_CHANNELS
filas   7 canales · snapshot
```

```sql
SELECT CHANNEL AS etiqueta, CONTRIBUTION_USD AS v, CONTRIBUTION_PCT AS porcentaje
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.MMM_RESULTS_CHANNELS
ORDER BY CONTRIBUTION_USD DESC
```

**Son OCHO partes, no siete.** Los porcentajes de los canales suman **53,83 %**;
el ~46 % restante es el baseline —el revenue que no viene de medios pagos— y
**entra como una parte más**, etiquetada «Orgánico / baseline».

Sin esa octava parte la composición afirma que los medios explican todo el
revenue, que es falso, y además el `porcentaje` que ustedes sirven no sumaría
100 — que es justo lo que el contrato exige de esta forma.

**`FB_Brand` viene en cero y se muestra.** Es información: el modelo no le
atribuye contribución. Omitirla rompe el cierre contra el total.

## 6 · `mmm_weekly_contribution` · `multi_series`

```
tabla   DB_BT_UA.BT_UA_MART_ANALYTICS.MMM_RESULTS_WEEKLY_HIST
filas   987 · 141 semanas
filtro  MODEL_VERSION = 'v3d_20260817'
```

```sql
SELECT WEEK_DATE AS semana,
       CHANNEL,
       CONTRIBUTION,
       ANY_VALUE(BASELINE_CONTRIB) OVER (PARTITION BY WEEK_DATE) AS baseline,
       ANY_VALUE(REVENUE)          OVER (PARTITION BY WEEK_DATE) AS revenue_real
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.MMM_RESULTS_WEEKLY_HIST
WHERE MODEL_VERSION = 'v3d_20260817'
ORDER BY WEEK_DATE, CHANNEL
```

**Trampa que datos marca y conviene no repetir:** las columnas de nivel semana
—`REVENUE`, `PREDICTED`, `BASELINE_CONTRIB`— **se repiten en las 7 filas del
canal**. Un `SUM(REVENUE)` agrupando por semana multiplica por 7. Siempre
`MAX()` o `ANY_VALUE()`.

**Y NO es `MMM_RESULTS_WEEKLY`**, la tabla sin `_HIST`: tiene las columnas en
mayúscula y minúscula mezcladas —hay que citarlas— y su `WEEK` es un epoch en
nanosegundos. La vigente es `_HIST`.

---

## 7 · Las seis son semanales

`MIN_GRAIN = week` en las seis. Datos las cura así.

**El front ya lo soporta** —`PeriodPicker` agrupa por grano y apaga el que la
pestaña no puede contestar—, y **el tipo del cable también**: `DDPeriod.Grain`
existe y `ports.PeriodGrainWeek` está declarado.

Lo que falta es emitir los períodos semanales · ver el mensaje que acompaña a
este archivo.
