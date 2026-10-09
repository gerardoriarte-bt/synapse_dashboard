# Para el equipo de backend · las tablas del chat llegan sin rótulos · 2026-10-09

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `9dc481e` el 2026-10-09**: el binario de `9dc481e`
(`feature/dynamic-dashboard-backend`, sin commits nuevos tras un `fetch` ese
día) levantado acá en `:4010` contra `SYNAPSE_UA` real, una pregunta en el chat
de pestaña con el stream capturado entero, y `dd_chat_structured.go` y
`materialize/transform.go` leídos. Del lado del front medimos primero lo
nuestro y corregimos dos cosas que eran nuestras; están al final.

Hola. Esto es **un pedido nuevo y chico**, y un dato que confirma el del
2026-10-08 (`MENSAJE-2026-10-08-backend-procedencia-por-nombre.md`) sin volver
a pedirlo.

---

## Lo que medimos

Pregunta, con `tab_context` de la pestaña `resumen` y período `2026-08`:

> ¿Cómo se distribuyó el presupuesto de medios por plataforma en agosto de 2026?

El agente consultó `DB_BT_UA.BT_UA_MART_ANALYTICS.VW_COSTOS_CAMPANAS` con
`fuente AS label`, y el stream trajo cuatro tramas `data`:

| # | `shape` | Columnas que llegaron | `metric_key` · `family` | `base` |
|---|---|---|---|---|
| 1 | `tabular` | `investment`, `platform_revenue` | `revenue` · `demand` | «Venta total del sitio medida por Adobe Analytics…» |
| 2 | `tabular` | `investment`, `share_pct` | `""` · `""` | `""` |
| 3 | `tabular` | idéntica a la 2, con otro `queried_at` | `""` · `""` | `""` |
| 4 | `raw` → `chart` | `LABEL`, `INVESTMENT` en el `chart_spec` | `""` · `""` | `""` |

**En ninguna de las tres tablas está la columna de plataforma.** Llegan nueve
filas de cifras —63,777.61 · 33,562.86 · …— sin decir de qué plataforma es
cada una. Sólo el `chart_spec` conserva los nombres.

## La causa, leída en su código

`StructuredDataFromCortex` (`dd_chat_structured.go`) convierte el `result_set`
en filas-mapa y llama a `materialize.TransformValue(…, materialize.Options{})`
sin columnas, así que `transformTabular` cae a `inferTabularColumns(dataRows[0])`
(`transform.go:212`). Y ahí:

1. **`"label": true` está en la lista de columnas que se saltean**
   (`transform.go:258`). Tiene sentido en la materialización de un KPI, donde
   `label` es el rótulo de presentación. En el chat es la dimensión de la
   tabla, y el agente la llama así casi siempre.
2. **El orden de las columnas sale de `for key, val := range row`**
   (`transform.go:264`), que en Go es aleatorio. La misma respuesta puede
   llegar con las columnas en otro orden cada vez.
3. **`Numeric` se decide mirando la primera fila** (`transform.go:272`). En la
   tabla 1, `platform_revenue` era nulo en la primera fila y llegó como
   columna de texto con `""` en ocho de nueve filas.

## Lo que pedimos

**Que el chat arme las columnas desde `resultSetMetaData.rowType`** en lugar de
inferirlas: `rowsFromResultSetPayload` ya lo recorre en orden
(`dd_chat_structured.go:122-132`) para nombrar las celdas, y después lo
descarta al pasar a mapas. Pasado como `Options.TabularColumns`, resuelve los
dos primeros puntos: no se saltea ninguna columna y el orden es el del
`SELECT`.

Para el tercero, **si el `rowType` de Cortex trae el tipo de cada columna**
—la SQL API de Snowflake lo documenta junto al nombre; **no lo verificamos en
el payload de Cortex**, porque el stream que nos llega ya viene transformado y
su `queryCol` sólo lee `name`—, `Numeric` puede salir de ahí. Si no lo trae,
alcanza con decidirlo mirando todas las filas y no sólo la primera.

**No hace falta tocar `inferTabularColumns`**: la materialización de paneles
puede seguir usándolo tal como está.

## Dos cosas que vimos y no pedimos todavía

- **La tabla 1 confirma el pedido del 2026-10-08.** Inversión en medios,
  firmada con la base de la venta del sitio porque `investment`/`revenue`
  coincidió por nombre. Sigue valiendo lo que pedimos ese día; no lo
  repetimos.
- **Las tramas 2 y 3 son la misma tabla** con distinto `queried_at`
  (`15:04:03Z` y `15:04:27Z`), y la 3 tiene el mismo `queried_at` que el
  gráfico. No sabemos si el agente la devolvió dos veces o si se emite de
  nuevo junto al `chart_spec`. ¿Lo pueden mirar?

## Lo que cambiamos en el front

- **Una tabla del chat sin una columna de texto que rotule cada fila no se
  dibuja**, con o sin familia: se declara «sus filas llegaron sin una columna
  que diga de qué es cada cifra». Es la regla de «ningún número desnudo».
- **Una tabla con rótulos y sin familia SÍ se dibuja**, sin la marca de color.
  En una tabla la familia no pinta datos, así que no hace falta inventarla.
  Con el arreglo de arriba, las tablas del chat de pestaña se van a ver.
- **La capa vacía ya no se firma `GOLD`.** El adaptador ponía GOLD por defecto
  cuando `layer` venía vacío; ahora la procedencia dice «la consulta no la
  declara».

Gracias.
