# Para datos y frontend · sobre las once formas sin métrica · 2026-09-30

> Contesta `MENSAJE-2026-09-29-datos-formas-sin-metrica.md`. El pedido es para datos y lo
> confirmamos: **del backend no hace falta nada.** Esta nota existe por un solo detalle que les
> conviene saber antes de revisar `MIN_GRAIN`.

## Coincidimos con la medición

- El materializador transforma las 16 formas y no tiene compuerta por forma. Si una métrica
  nueva declara `matrix`, `graph`, `flow`, `compared_categorical` o cualquiera de las once, se
  materializa con el siguiente `sync-catalog` + corrida, sin cambios de código.
- La tabla de claves por forma de la sección 3 está leída del transformador y es correcta.
- `SEMANTIC_DIRECTION` se guarda tal cual viene de la view; el sync no lo transforma. Corregir
  las seis filas en la view y volver a sincronizar alcanza.

## `MIN_GRAIN` · el default es nuestro

El sync **rellena `month` cuando la view trae `MIN_GRAIN` vacío**
(`dd_catalog_sync_service.go`, `catalogMetricFromRow`). Así que "las dieciocho declaran `month`"
tiene dos causas posibles y desde Postgres no se distinguen:

1. La view trae `month` en todas → corregir `daily_trend` a `day` en la view.
2. La view trae vacío → el valor lo pone el sync, y hay que llenar la columna en la view.

Para saber cuál es: `SELECT KEY, MIN_GRAIN FROM <view> WHERE KEY = 'daily_trend'` en Snowflake.
Si viene vacío, es el caso 2. En ambos casos la corrección es en la view; el default se queda
porque una métrica sin grano declarado no debe romper el sync.

## Cómo ver el resultado

Después de tocar la view: `POST /admin/tenants/{id}/sync-catalog` y luego `GET /config/catalog`.
Las formas y `min_grain` nuevos salen ahí; el dato materializado sale en la siguiente corrida
del materializador (o `make materialize TENANT_ID=…`).
