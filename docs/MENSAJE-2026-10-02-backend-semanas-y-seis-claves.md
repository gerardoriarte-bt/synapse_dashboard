# Para el equipo de backend · períodos semanales y seis claves · 2026-10-02

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Dos pedidos**, los dos de la misma tanda: datos entregó MMM y forecast y las
seis métricas son **semanales**.

**El archivo con las seis, listo para registrar, está en nuestro repositorio**
—no adjunto, como quedamos—:

```
curl -O https://raw.githubusercontent.com/gerardoriarte-bt/synapse_dashboard/Gerardo/docs/backend/metricas-mmm-y-forecast.md
```

Ruta: `docs/backend/metricas-mmm-y-forecast.md`. Trae por métrica: clave, forma,
tabla, columna por columna, el SQL y los filtros obligatorios.

---

## 1 · Períodos semanales

**Lo que hay hoy**, medido en `79d1bab`:

```
dd_config_service.go:183   PeriodGrain:   ports.PeriodGrainMonth
dd_config_service.go:729   ports.DDPeriod{Key: k, Grain: ports.PeriodGrainMonth, …}
```

**El tipo ya lo soporta y ustedes ya lo previeron.** `DDPeriod` tiene `Grain`, y
el comentario sobre las constantes dice:

> «Granos de período soportados (B1.1). **Semanal queda declarado para cuando
> exista dato semanal**.»

`ports.PeriodGrainWeek` existe. **El dato semanal ya existe**: 7.194 filas de
forecast de revenue, 27.412 de inventario y 141 semanas de MMM.

**Qué pedimos:** que `periods` y `periods_detail` incluyan también las semanas,
con `Grain: ports.PeriodGrainWeek`.

**La clave que el front espera es `YYYY-Www`** —`2026-W32`—. Nuestro adaptador ya
la reconoce, y si `periods_detail` declara el grano ni siquiera hace falta
parsearla: el grano declarado le gana al deducido del id.

**No hace falta decidir cuántas semanas ahora.** Si les sirve, el mismo
`history_months` del dashboard puede acotarlas; si prefieren un campo aparte,
también. Lo que necesitamos es que exista al menos una semana seleccionable.

**De nuestro lado no falta nada**, y está medido: `PeriodPicker` agrupa los
períodos por grano con `optgroup`, apaga el grano que las métricas de la pestaña
no pueden contestar y lo dice en pantalla. Dos pruebas lo cubren
—`periodGrain.test.ts` y `periodGranoDeshabilitado.test.tsx`—.

## 2 · Las seis claves, en el registro de Go

| `METRIC_KEY` | Forma | Tabla |
|---|---|---|
| `revenue_forecast` | `series_with_band` | `GLD_REVENUE_FORECAST` |
| `inventory_forecast` | `series_with_band` | `GLD_INVENTORY_FORECAST` |
| `revenue_forecast_close` | `scalar_with_interval` | `GLD_REVENUE_FORECAST` · 1 fila |
| `media_roas_recommendation` | `scalar_with_interval` | `GLD_MEDIA_RECOMMENDATION` |
| `mmm_channel_contribution` | `composition` | `MMM_RESULTS_CHANNELS` |
| `mmm_weekly_contribution` | `multi_series` | `MMM_RESULTS_WEEKLY_HIST` |

Las claves las propusimos nosotros con la convención del catálogo; datos las cura
con las mismas. **Si alguna les incomoda, díganla ahora** — cambiarla después
cuesta las tres puntas.

**Por qué se las pedimos explícitamente:** lo medimos esta semana con
`platform_gap`, que está en el catálogo y contesta
`BLOCKED · No Snowflake query registered for metric "platform_gap"`. Una clave
curada sin entrada en el registro sale bloqueada sin explicación útil.

**Tres filtros que no son opcionales**, y están en el archivo con su razón:

- `media_roas_recommendation` · `SCENARIO = 'BASE'`. Los otros dos escenarios
  están medidos y no son publicables.
- `mmm_weekly_contribution` · `MODEL_VERSION = 'v3d_20260817'`, y **`MAX()` o
  `ANY_VALUE()`** sobre las columnas de nivel semana: se repiten en las 7 filas
  del canal y un `SUM` multiplica por 7.
- `mmm_channel_contribution` · **ocho partes, no siete**: los siete canales suman
  53,83 % y el baseline es el resto. Sin él la composición afirma que los medios
  explican todo el revenue.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | `periods` y `periods_detail` con semanas · `PeriodGrainWeek` | Ustedes |
| 2 | Las seis claves en el registro de Go | Ustedes · el archivo está en el repo |
| — | Curar las seis filas del catálogo | Datos · ya se lo pedimos |
