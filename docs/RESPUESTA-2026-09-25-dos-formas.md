# Para el equipo de front · respuesta a «las dos formas que el materializador no emite» · 2026-09-25

> Respuesta al mensaje `MENSAJE-2026-09-25-backend-dos-formas.md`. Con evidencia para verificar en el backend local.

**Resumen.** Las dos formas ya se emiten. `distribution` y `series_with_band` están en el `switch` de transformación desde el commit `168a761` (2026-09-21), y el commit `6e595e3` que midieron ya las incluía. Lo que falta no es un caso en el `switch`: es una fuente de datos en Snowflake que las alimente. Eso es del equipo de datos, no del backend ni del front.

## 1 · Lo que midieron y por qué salió mal

El `switch` de `internal/core/dashboard/materialize/transform.go` tiene **quince** casos, no ocho. Los ocho que contaron son los de v1.0. Debajo siguen los siete de v1.1, y los dos que piden están ahí:

```
transform.go:59   case ShapeDistribution:    → transformDistribution(rows)
transform.go:61   case ShapeSeriesWithBand:  → transformSeriesWithBand(rows)
transform.go:64   default:                   → ErrUnknownShape
```

Las constantes y los transformers están en `internal/core/dashboard/materialize/transform_v11.go`. Los tests que los ejercitan, en `tests/dashboard/materialize_v11_test.go`:

- `TestTransformV11_DistributionSortsByLo`
- `TestTransformV11_SeriesWithBand`

El cable que citan («una décima sincroniza bien y falla al materializar con `ErrUnknownShape`») es anterior al 21 de septiembre. Ya no describe el código.

## 2 · Cómo verificarlo en su local

Con el repo en `6e595e3` o posterior:

```bash
# Los dos casos existen en el switch
grep -n "ShapeDistribution\|ShapeSeriesWithBand" internal/core/dashboard/materialize/transform.go

# Los transformers pasan sus tests
go test ./tests/dashboard/ -run 'TestTransformV11_(DistributionSortsByLo|SeriesWithBand)' -v
```

Y la prueba de que la plataforma los emite de punta a punta: `ShapeFixtureRows(shape)` en `transform_v11.go` devuelve filas demo por forma. Pasarlas por `TransformValue` produce exactamente el payload de la sección 3.

**Esto no se verifica corriendo la materialización.** Lo que midieron es código fuente, y el cron solo cambia `dd_panel_data`. Correrlo no va a mostrar estas formas por dos razones ajenas al `switch`: el catálogo real no declara ninguna métrica con ellas, y no hay consulta SQL registrada porque no hay tabla Gold que las alimente (sección 4). Si el `grep` de arriba no devuelve nada, el checkout local es anterior a `168a761` y hace falta `git pull`.

## 3 · Contrato del cable, nombre por nombre

Estos son los nombres que emitimos. El renombre a su vocabulario (`forma`, `cortes`, `puntos`) lo hace su adaptador, como dicen.

| Ustedes piden | Nombre interno de la forma | Payload que emitimos |
|---|---|---|
| `distribucion` | `distribution` | `{ "shape": "distribution", "bins": [ { "label", "v", "lo"?, "hi"? } ] }` |
| `serieConBanda` | `series_with_band` | `{ "shape": "series_with_band", "points": [ { "t", "v", "lo"?, "hi"? } ] }` |

Dos diferencias con lo que escribieron en el mensaje:

- **`series_with_band`, no `series_band`.** Es el nombre que valida el builder (`dd_blocks`, bloque `forecast`) y el que tiene que declarar la view del catálogo en la columna `SHAPE`. Con `series_band` la métrica no entra en ningún bloque.
- **`bins`, no `cuts`.** Cada bin trae `label` y `v`; `lo` y `hi` son opcionales y, si vienen todos, los bins salen ordenados por `lo`.

Sobre `level` en la serie con banda: hoy no lo emitimos por punto ni por serie. El nivel del intervalo es una opción del panel (`interval_level` en las `options` del bloque `forecast`), no un dato de la fila. Si lo necesitan en el payload, díganlo y se agrega como campo de nivel superior; es un cambio chico.

Sobre `lo` y `hi` por punto: son opcionales en el transformer porque una serie sin banda es válida como dato. La regla «un pronóstico sin banda no se publica» es de presentación y la aplica el front, que es donde vive `design.md`. Si prefieren que el backend rechace filas de pronóstico sin `lo`/`hi`, se puede hacer estricto para esa forma; también es chico.

## 4 · Lo que sí falta, y de quién es

Una métrica declarada `distribution` o `series_with_band` hoy **sincroniza bien y queda `BLOCKED`**, no falla. El motivo que ve el usuario es «Esta métrica todavía no tiene fuente de datos», y en `last_error` va el detalle técnico: `No Snowflake query registered for metric "<key>"`.

Es el comportamiento diseñado. El materializador toma la consulta SQL de un registro por métrica (`internal/core/dashboard/snowflake/queries.go`, `MetricRegistry`). Para estas dos formas no hay consulta registrada porque **ninguna tabla Gold de Snowflake entrega histogramas ni pronósticos con intervalo**. No se puede escribir un `SELECT` contra una tabla que no existe.

Lo que hace falta, y es del equipo de datos:

| Forma | Lo que tiene que existir en Gold |
|---|---|
| `distribution` | Una tabla o view con una fila por bin: etiqueta, valor y, si se puede, `lo` y `hi` del rango |
| `series_with_band` | Una tabla o view de pronóstico con una fila por fecha: valor estimado, límite inferior y límite superior |

El día que existan, registrar la consulta es una entrada en `MetricRegistry` por métrica. El transformer, el builder, el bloque y el estado del panel ya están.

## 5 · Sus mocks

Tienen razón en que `npm run dev:mock` no las ejercita porque el cable no las tiene. Para que las puedan agregar hoy, sin esperar a datos, el payload exacto sale de las fixtures del backend:

```bash
go test ./tests/dashboard/ -run 'TestTransformV11_(DistributionSortsByLo|SeriesWithBand)' -v
```

Y con el backend local corriendo, cualquier panel con esas formas responde el envelope estándar con `data_status: BLOCKED` y `reason` en español. Eso también lo pueden mockear ya.

## 6 · Lo que no cambia

- No hace falta curar métricas de esas formas para UA MX. Coincidimos.
- No hay trabajo pendiente de backend para que la plataforma «pueda emitirlas». Ya puede.
- Lo que sí queda abierto, y depende de ustedes: confirmar si quieren `level` en el payload y si quieren `lo`/`hi` obligatorios en `series_with_band`.
