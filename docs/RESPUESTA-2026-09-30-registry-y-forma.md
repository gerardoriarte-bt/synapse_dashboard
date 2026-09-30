# Para el equipo de frontend · registry y forma · 2026-09-30

> Contesta `MENSAJE-2026-09-30-backend-registry-y-forma.md`. Aceptamos las dos correcciones y
> la propuesta de la sección 3 está implementada en `feature/dynamic-dashboard-backend`.

## 1 · `MIN_GRAIN` · sin cambios

Queda el default a `month` en el sync. La corrección va en la view y la consulta para
desambiguar es de datos, como ya acordamos.

## 2 · Corrección aceptada · una métrica fuera de `MetricRegistry` sale `BLOCKED`

Tenían razón y nuestra nota anterior estaba mal: «se materializa sin cambios de código» era
falso. El materializador busca la clave canónica en `MetricRegistry` y, si no está, guarda
`BLOCKED` con «No Snowflake query registered». La fila de la view sola hace que el front vea la
métrica, pero el panel nace bloqueado.

El orden que describen es el correcto: primero la entrada en el registry con su `BuildSQL`,
después la fila de la view. Lo dejamos escrito en `docs/dynamic-dashboard-backend.md` (Fase 2).

Sobre la entrada en el registry en un fork: el registry vive acá y lo escribimos nosotros.
Mándennos la clave, la forma y las columnas que devuelve el SQL y la agregamos, con su
declaración en `snowflake/schema.go` (un test cruza ambos lados) y su test de transformación.

## 3 · Implementado · una discrepancia de forma es `ERROR`, no un `Warn`

`dd_materializer_service.go`: si `metric.Shape` (catálogo) difiere de `spec.Shape` (registry),
la métrica queda `ERROR` con este mensaje, que llega a `message` y `last_error`:

```
Forma inconsistente para "sales": el catálogo declara "matrix" y el registro "scalar"; corregir SHAPE en la view
```

Aplica la regla de preservación de siempre: si había un `AVAILABLE` previo, no se pisa; solo
se escribe `last_error` / `last_error_at` y el panel sale `DEGRADED` con la causa.

Elegimos que falle, no que gane el catálogo ni que el registry deje de declarar forma. El
registry define el SQL y el transformer, así que su forma es la única que se puede
materializar; si el catálogo dice otra cosa, el que está mal es el catálogo y el mensaje lo
dice. Tests: `TestMaterializer_FormaInconsistenteEsError` y
`TestMaterializer_FormaInconsistenteNoPisaAvailablePrevio`.

### Medido antes de cambiarlo

Cruzamos `dd_catalog_metrics.shape` contra el registry en todos los tenants (copia de prod del
2026-09-15). Una sola discrepancia, y era nuestra: el seed creaba `daily_trend` como
`time_series` y el registry dice `multi_series`. Afectaba a Keralty, Terpel, Sistema y
zz-alta-test (tenants de seed, sin Gold: ya fallaban antes en la consulta). En Lobueno y Synapse
UA HTML la view ya dice `multi_series`. Corregido el seed y agregada
`migrateDDCatalogDailyTrendShape` (UPDATE idempotente, solo filas con la forma vieja). Ningún
panel que hoy esté `AVAILABLE` cambia de estado por este fix.

## 4 · Dónde quedamos

| | Quién | Qué |
|---|---|---|
| Inventario de Gold y fila de la view con `SHAPE` y `MIN_GRAIN` | Datos | Sin cambios |
| Entrada en `MetricRegistry` con `BuildSQL` | **Backend**, con la spec de ustedes | Clave, forma, columnas del SQL |
| Discrepancia de forma falla | Backend | **Hecho** |
