# Para el equipo de datos · cuatro métricas nuevas · el SQL lo escribimos nosotros · 2026-09-29

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. **Este pedido se reescribió dos veces antes de mandarse**, y las dos
correcciones cambian qué les toca, así que van adelante:

1. Empezó siendo para el equipo de **backend** —«que materialicen cinco formas de
   dato»— y al medirlo resultó que las materializa **todas**.
2. Después iba a pedirles a ustedes **la métrica completa**, y al leer el código
   apareció que **la consulta SQL vive en el Go del backend, no en Snowflake**.
   Así que el SQL lo escribimos nosotros.

**Lo que queda para ustedes es chico, y es lo que sólo ustedes pueden dar.** Está
en el punto 3.

---

## 1 · Por qué hacen falta cuatro métricas nuevas

Nuestro repertorio tiene 49 gráficos. **Veintiuno se pueden dibujar hoy y los
otros veintiocho no** — y no por falta de código: **porque ninguna métrica del
catálogo declara la forma de dato que necesitan.**

Medido contra el servicio corriendo:

| Pieza de la cadena | Estado |
|---|---|
| El transformador del backend | **Las 16 formas** · sin lista blanca: transforma lo que le llegue |
| Nuestro contrato | **Las 16** |
| `GET /config/blocks` | **Las 16** |
| **El catálogo de métricas** | **5 de 16** · `scalar`, `multi_series`, `categorical`, `prose`, `tabular` |

Tres capas saben recibir once formas que ninguna métrica emite.

---

## 2 · Lo que hacemos NOSOTROS · el SQL

La consulta de cada métrica es una entrada en `MetricRegistry`, de
`internal/core/dashboard/snowflake/queries.go`:

```go
"goals_vs_actual": {
    Shape:    "categorical",
    BuildSQL: func(t Tables, b Bounds) string { /* el SELECT, escrito en Go */ },
},
```

**Eso lo escribimos nosotros y se lo devolvemos al backend en un fork**, que es
como venimos trabajando — la ruta `GET /config/plots` salió así esta semana.

**Y tres de las cuatro salen del dato que YA existe**, leído de las consultas que
el backend ya tiene escritas:

| Forma nueva | De dónde sale | Qué gráficos abre |
|---|---|---|
| `compared_categorical` | Lo mismo que `goals_vs_actual`, devolviendo **`v` y `ref` por separado** en vez del cociente `real/objetivo` | TORNADO, DUMBBELL, COLUMNAS AGRUPADAS, PENDIENTE |
| `matrix` | `FUENTE × mes` de `GLD_PAID_MEDIA`, o día-de-semana × semana de la diaria | MAPA DE CALOR, COHORTES, CALENDARIO |
| `flow` | `VISITS_TOTAL → SESSIONS → ORDERS_TOTAL` de la diaria · tres etapas | EMBUDO, FLUJO |

**Las otras dos no salen, y lo decimos ahora para no pedirlas mal:**

- **`graph`** necesita aristas origen→destino y en las dos tablas Gold no hay
  ninguna columna que las tenga. Si ese cruce existe en algún lado, es lo único
  de esta lista que sí sería un pedido de dato nuevo.
- **`multi_attribute_profile`** —el RADAR— exige que **todos los atributos
  compartan la unidad**. Lo declara nuestro contrato, y la razón es que un radar
  con pesos en un eje y porcentaje en otro dibuja un polígono cuya área no
  significa nada: depende de en qué orden se pusieron los ejes. Mezclar inversión
  con ROAS no sirve. Con **`% de cumplimiento` por indicador** sí saldría, si hay
  meta por plataforma.

---

## 3 · Lo que necesitamos de USTEDES · dos cosas

### a) La fila en `SYNAPSE_METRIC_CATALOG`, con su copy

Una por métrica nueva. **No es metadata interna: son los textos que el usuario
lee en pantalla.** Así se ve hoy una métrica del catálogo, con sus valores reales:

| Columna | Valor de `revenue` hoy | Dónde se pinta |
|---|---|---|
| `NAME` | `Ingresos` | El título del panel |
| `BASE` | `Venta total del sitio medida por Adobe Analytics, en USD, sumada sobre los días del mes` | La línea de BASE |
| `SOURCE` | `Reporte diario de ecommerce del cliente · venta medida por Adobe Analytics` | La procedencia |
| `MEASUREMENT_WINDOW` | `Mes calendario seleccionado` | La ventana de medición |
| `SEMANTIC_DIRECTION` | `HIGHER = BETTER` | La dirección |
| `SHAPE` | `scalar` | **Lo que decide qué panel puede dibujarla** |

**Ese copy es de ustedes y no lo escribimos nosotros**, y la razón es concreta: si
lo escribiéramos acá, el día que cambie el texto de origen habría una tabla de
traducción en el front que nadie mantiene. **Un texto que describe un dato lo
redacta quien es dueño del dato.**

Las cuatro nuevas necesitan, además del copy, su `SHAPE`:
`compared_categorical`, `matrix`, `flow` y —si se puede— `multi_attribute_profile`.

### b) El esquema de las dos tablas Gold

**Nuestra vista de Gold es indirecta**: las columnas que conocemos las dedujimos
de las consultas que el backend ya escribió, no de mirar el esquema. Hoy vemos
esto y nada más:

```
GLD_ECOMM_DAILY_PERFORMANCE   DATE · REV_TOTAL/REV_TARGET · ORDERS_TOTAL/ORDERS_TARGET
                              UNITS_TOTAL/UNITS_TARGET · VISITS_TOTAL/VISITS_TARGET
                              SESSIONS · SPEND_TARGET · BUDGET_TARGET
GLD_PAID_MEDIA                FUENTE · COST_USD · INGRESOS_USD · GROSS_SPEND
```

**Con la lista completa de columnas de las dos, el SQL de las cuatro lo
escribimos sin volver a preguntar** — y es probable que descubramos cruces que no
estamos usando.

`schema-check` no sirve para esto: verifica que los objetos existan, no lista
columnas.

---

## 4 · El orden que proponemos

1. **Ustedes nos mandan el esquema de las dos Gold.** Es lo más barato y
   desbloquea todo lo demás.
2. **Nosotros escribimos las cuatro entradas de `MetricRegistry`** y las
   devolvemos en el fork.
3. **Ustedes curan las cuatro filas del catálogo**, con su copy y su `SHAPE`.
4. Corre `sync-catalog`, corre el materializador, y nosotros construimos los tres
   cuerpos de panel que faltan.

**Con una métrica de cada forma alcanza.** No hace falta la familia entera ni que
sean las definitivas: la que el producto necesite se define después y el cuerpo
del panel ya va a estar hecho.

---

## 5 · Lo que sigue abierto del mensaje anterior

Las **seis filas con `SEMANTIC_DIRECTION` como código** en vez de texto
redactado, medidas sobre el catálogo recién sincronizado:

```
goal_attainment · orders · revenue · roas · sessions · units   → HIGHER_IS_BETTER
```

Las otras ocho traen `HIGHER = BETTER`, que es lo correcto. Sale en pantalla con
guiones bajos.

**Y una que apareció hoy**, del mismo tipo: `daily_trend` declara
`MIN_GRAIN = month` y viene con fuente «Reporte **diario** de ecommerce del
cliente», y su panel sirve 28 puntos diarios. Las dieciocho métricas declaran
`month`, así que conviene mirar si la columna se está llenando con un valor por
defecto en vez del grano real.

Gracias.
