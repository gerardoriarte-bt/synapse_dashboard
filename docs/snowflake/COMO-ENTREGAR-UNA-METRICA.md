# Cómo entregarnos una métrica · qué y en qué orden · 2026-09-29

> **Entregable a ingeniería de datos.** No es un mensaje con fecha: es la
> especificación de qué necesitamos y con qué forma. Se actualiza cuando el
> contrato cambie.

---

## 0 · Por qué el INVENTARIO va primero, y no la métrica

Veníamos pidiendo métricas de a una: «necesitamos una de forma `matrix`». Eso
está al revés, y se ve al intentar contestarlo.

**Casi todas las decisiones de qué se grafica salen de saber qué hay.** Un panel
se elige cuando se sabe que existe el cruce; un gráfico se elige cuando se sabe
cuántas categorías tiene la dimensión; un mínimo se verifica cuando se sabe
cuántas filas devuelve el corte más chico. **Sin la biblioteca a la vista, cada
una de esas decisiones es una suposición** — y las suposiciones acá se pagan
construyendo un panel que después no tiene con qué dibujarse.

Hoy vemos las tablas Gold **de forma indirecta**: las columnas que conocemos las
dedujimos de las consultas que el backend ya escribió, no de mirar el esquema.
Son quince, y no sabemos si son todas.

**Por eso el primer entregable no es una métrica: es el inventario.**

---

## 1 · Entregable A · el inventario de Gold

**Lo primero y lo más barato.** Con esto escribimos el SQL de varias métricas sin
volver a preguntar nada.

### Qué

Por cada tabla o vista Gold que el tenant tenga disponible:

| Campo | Ejemplo | Por qué lo pedimos |
|---|---|---|
| Nombre completo | `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE` | Es lo que va en la consulta |
| Grano de la fila | `un día` · `un día × plataforma` | **Decide qué formas puede servir.** Una tabla de grano día×plataforma puede dar una `matriz`; una de grano día sola, no |
| Columnas | nombre · tipo · si es medida, dimensión o fecha | Sin esto no hay SQL |
| Cardinalidad de cada dimensión | `FUENTE: 6 valores` | **Decide el gráfico.** Seis plataformas entran en una dona; sesenta no — y el repertorio declara ese tope |
| Rango de fechas con dato | `2025-01-01 → 2026-09-28` | Decide qué períodos se pueden ofrecer |
| Qué columnas pueden ser `NULL` | | Un `NULL` en una medida cambia si el panel degrada o no |

### Cómo

**Como más les convenga.** Un `DESCRIBE TABLE` pegado en un mensaje sirve. Un
`.md` sirve. Una vista `SYNAPSE_GOLD_INVENTORY` sería lo mejor porque no envejece,
pero no la pedimos: no queremos que el inventario cueste más que las métricas.

**Lo único que sí pedimos es que diga el GRANO y la CARDINALIDAD**, porque son
las dos cosas que no se leen de un `DESCRIBE` y son las que deciden.

### Lo que ya sabemos, para que no lo repitan

Estas quince columnas las conocemos porque el backend las tiene cableadas:

```
GLD_ECOMM_DAILY_PERFORMANCE
  DATE · REV_TOTAL · REV_TARGET · ORDERS_TOTAL · ORDERS_TARGET
  UNITS_TOTAL · UNITS_TARGET · VISITS_TOTAL · VISITS_TARGET
  GROSS_SPEND · BUDGET_TARGET

GLD_PAID_MEDIA
  DATE · FUENTE · COST_USD · INGRESOS_USD
```

**Lo que no sabemos es si hay más.** `schema-check` verifica que **estas** existan
—y hoy contesta `ok: true`—, pero no puede descubrir una columna que el backend
no sepa que existe.

---

## 2 · Entregable B · la fila del catálogo

Una por métrica, en `SYNAPSE_METRIC_CATALOG`. **El sync lee exactamente estas
doce columnas** —está en `CatalogViewColumns` del backend— y lo que no esté ahí
no llega.

| Columna | Qué es | Valores válidos |
|---|---|---|
| `METRIC_KEY` | La clave canónica | minúsculas con guión bajo · `revenue`, `platform_return` |
| `NAME` | **El título del panel, en pantalla** | texto libre, en el idioma del tenant |
| `SHAPE` | **Lo que decide qué panel puede dibujarla** | las 16 de la tabla de abajo |
| `FAMILY` | Decide el color · el front NO lo elige | `demand` · `media` · `inventory` · `customer` · `external` |
| `LAYER` | Capa Medallion | `GOLD` · `SILVER` · `BRONZE` |
| `SOURCE` | **La procedencia, en pantalla** | `Reporte diario de ecommerce del cliente · venta medida por Adobe Analytics` |
| `BASE` | **El denominador, en pantalla** | `Venta total del sitio medida por Adobe Analytics, en USD, sumada sobre los días del mes` |
| `UNIT` | `USD`, `%`, `x`, o un nombre como `órdenes` | vacío si no tiene |
| `SEMANTIC_DIRECTION` | **En pantalla** · texto redactado, **no el código** | `HIGHER = BETTER` · **no** `HIGHER_IS_BETTER` |
| `MIN_GRAIN` | El corte **más fino** que puede contestar | `day` · `week` · `month` |
| `DIMENSIONS` | Por dónde se puede desagregar | arreglo JSON · `["FUENTE"]` · `[]` si no |
| `MEASUREMENT_WINDOW` | **En pantalla** · el período que mide | `Mes calendario seleccionado` |

### Los cinco que se pintan TEXTUALES

`NAME`, `BASE`, `SOURCE`, `MEASUREMENT_WINDOW` y `SEMANTIC_DIRECTION` **se
muestran al usuario tal como los escriban**. No los traducimos, no los
recortamos y no los redactamos.

**Es una decisión y no una comodidad**: si el copy que describe un dato lo
escribiéramos en el front, el día que ustedes cambien el texto de origen habría
una tabla de traducción que nadie mantiene. **Un texto que describe un dato lo
redacta quien es dueño del dato.**

El costo de ese acuerdo es que un error de tipeo se ve en pantalla. Hoy hay seis
filas con `SEMANTIC_DIRECTION` en código —`HIGHER_IS_BETTER`— y salen con guiones
bajos a la vista: `goal_attainment`, `orders`, `revenue`, `roas`, `sessions`,
`units`.

### Dos que engañan

- **`MIN_GRAIN` es el más FINO, no el más grueso.** Una métrica que puede
  contestar por día declara `day`, aunque el panel la pida por mes. Hoy las
  dieciocho declaran `month`, incluida `daily_trend`, que viene de un reporte
  diario y sirve 28 puntos por día — sospechamos que se está llenando con un
  valor por defecto.
- **`SHAPE` no es el tipo de panel.** Es la forma del DATO. Un mismo `scalar`
  puede verse como cifra, como arco o como barra contra objetivo; lo que elige es
  el layout, no la métrica.

---

## 3 · Qué forma puede dar cada tabla · la tabla que decide

Esto es para que **ustedes puedan decirnos qué sale** sin esperar a que
preguntemos métrica por métrica.

| Forma | Qué necesita la fila | Ejemplo con lo que ya existe |
|---|---|---|
| `scalar` | Una medida agregada | `SUM(REV_TOTAL)` |
| `scalar_with_interval` | Valor más `lo`, `hi` y `level` | — |
| `categorical` | Una dimensión y una medida | Cumplimiento por indicador |
| `ranking` | Igual, más la posición | Top plataformas por inversión |
| `time_series` | Una fecha y una medida | `DATE` + `REV_TOTAL` |
| `multi_series` | Fecha, medida y **el nombre de la serie** | `DATE` + `REV_TOTAL`/`GROSS_SPEND` |
| `series_with_band` | Fecha, valor, `lo`, `hi`, `level` | — |
| `compared_categorical` | Una dimensión con **dos** medidas: valor y referencia | Real contra objetivo, **sin dividir** |
| `composition` | Partes que suman un total | Venta por división |
| `distribution` | Cortes con su cuenta | Profundidad de inventario |
| **`matrix`** | **Dos dimensiones y una medida** | `FUENTE × mes` |
| `flow` | Etapas ordenadas, o enlaces origen→destino | `VISITS → SESSIONS → ORDERS` |
| `graph` | Nodos y **aristas origen→destino** | **No vemos ninguna tabla que las tenga** |
| `multi_attribute_profile` | Varios perfiles sobre los **mismos** atributos, **en la misma unidad** | `% de cumplimiento` por plataforma |
| `tabular` | Filas y columnas declaradas | Inversión y retorno por plataforma |
| `prosa` | La escribe el agente, no una consulta | — |

**La regla del radar no es un capricho**: si los atributos tienen unidades
distintas —pesos en un eje, porcentaje en otro— el área del polígono depende de
en qué orden se pusieron los ejes, y eso es lo que el usuario lee.

---

## 4 · Lo que NO les pedimos

**El SQL.** La consulta de cada métrica vive en el Go del backend —`MetricRegistry`,
con `Shape` y `BuildSQL`— y **la escribimos nosotros**, en un fork que el backend
toma. Es lo mismo que hicimos con `GET /config/plots`.

**Decidir qué se grafica.** Esa es nuestra, y es justamente la que necesita el
inventario para tomarse bien.

**Que la métrica sea la definitiva.** Una que devuelva el cruce que ya existe
alcanza para desbloquear el trabajo: el cuerpo del panel se construye una vez y
sirve para la métrica que el producto termine queriendo.

---

## 5 · Cómo sabemos que quedó bien, sin preguntarles

Tres comprobaciones que corremos nosotros, en este orden:

```
GET  /api/v1/agents/ping                         → 200 · hay salida a Snowflake
GET  /admin/tenants/{id}/schema-check            → ok:true · existen los objetos
POST /admin/tenants/{id}/sync-catalog            → created/updated/unchanged
POST /admin/tenants/{id}/materialize             → available/blocked/errors
```

**Y una que corren ustedes**: la vista `SYNAPSE_METRIC_CATALOG_ISSUES`, que ya
detecta sola las filas mal formadas —es la que encuentra los
`SEMANTIC_DIRECTION` en código— y por eso no depende de que alguien mire la
consola.

**Si `materialize` devuelve `blocked` para una métrica nueva**, el motivo suele
ser uno de dos y los dos son nuestros, no de ustedes: falta la entrada en
`MetricRegistry`, o el SQL devuelve columnas con otro nombre del que el
transformador espera.

---

## 6 · El orden, en una línea

**Inventario → nosotros escribimos el SQL → ustedes curan la fila → sync →
materialize → construimos el panel.**

Lo único que bloquea todo lo demás es el primero.
