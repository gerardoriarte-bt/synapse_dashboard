# Para el equipo de backend · las métricas nuevas de UA · 2026-11-09

**Medido contra `dc58ef5` el 2026-11-09**, leyendo su rama
`feature/dynamic-dashboard-backend`: `MetricRegistry`, `KPISQL`, los alias de
`keys.go`, `Tables` y `periodBindings`. Del front, contra `d612b2a`: las formas
y las familias que acepta `src/api/adapt.ts`. Del lado de Snowflake, cada cifra
de este mensaje se midió ese mismo día en sólo lectura, con
`RL_BT_UA_TRANSFORM` y sólo agregados. Los permisos de `RL_BT_UA_BI`, el rol
con el que ustedes consultan UA, también se midieron.

Hola. Es lo mismo que hicieron con Terpel en `f78d700`, ahora para UA: **cada
métrica, una entrada en `MetricRegistry`**, con el SQL y la cifra que tiene que
dar. Es la tarea B6.2 de `plan-fase-6.md`.

Datos cerró su parte el 2026-11-09. La vista de control
`SYNAPSE_METRIC_CATALOG_ISSUES` de UA devuelve **10 filas, y las 10 son
`CLAVE DESCONOCIDA`**: las claves de este mensaje, que desaparecen cuando
ustedes las registran. La medición está en
`docs/AUDITORIA-2026-11-09-respuesta-de-datos-ua.md`.

## 1 · Lo que encontramos en su código

**Ninguna de las diez claves está registrada, y ninguna choca** con
`MetricRegistry` ni con los alias de `keys.go`.

**Cinco salen de la tabla que ya leen.** `rpv_total`, `cvr_total`,
`aov_total`, `roas_paid` y `budget_status` se calculan sobre
`GLD_ECOMM_DAILY_PERFORMANCE` (`Tables.EcommFact`). **Proponemos sumarlas a
`KPISQL`** con su `KPIField`, como `roas`. Así traen los comparativos
(«VS MES ANTERIOR», «VS AÑO ANTERIOR») sin trabajo extra. Las de Terpel no los
tienen porque no pasan por ahí.

**Las otras necesitan tres vistas nuevas en `Tables`**, cada una con su
variable `DD_SNOWFLAKE_*_TABLE`, igual que `TerpelPauta`:

| Vista, en `DB_BT_UA.BT_UA_MART_ANALYTICS` | La usan |
|---|---|
| `GLD_PRODUCTO_METRICS_DAILY` | `promo_dependency` |
| `GLD_PRODUCTO_METRICS_MONTHLY` | `top_10_productos` |
| `GLD_CUSTOMER_METRICS_COHORT` | `ncac_registrados`, `ltv_registrados` |

**`RL_BT_UA_BI` tiene `SELECT` sobre las tres**, medido con
`SHOW GRANTS ON VIEW`. `SYNAPSE_APP_ROLE` también.

**`MetricColumnUsage` necesita sus entradas**, y conviene que las tres vistas
sean `Optional`, como la de pauta de Terpel. Así `schema-check` no se las exige
a Keralty ni a Terpel.

**Ninguna forma es nueva**: `scalar`, `ranking` y `time_series` ya se
transforman y el front las dibuja. Las familias del catálogo (`demand`,
`media`, `customer`) también las acepta.

## 2 · Lo que pedimos: nueve claves

### Cinco escalares en `KPISQL`

Cinco columnas más en la consulta que ya existe:

```sql
       ROUND(SUM(REV_TOTAL) / NULLIF(SUM(VISITS_TOTAL), 0), 4)          AS rpv_total,
       ROUND(SUM(ORDERS_TOTAL) / NULLIF(SUM(VISITS_TOTAL), 0) * 100, 4) AS cvr_total,
       ROUND(SUM(REV_TOTAL) / NULLIF(SUM(ORDERS_TOTAL), 0), 2)          AS aov_total,
       ROUND(SUM(REV_PAID) / NULLIF(SUM(GROSS_SPEND), 0), 4)            AS roas_paid,
       ROUND(SUM(GROSS_SPEND) / NULLIF(SUM(BUDGET_TARGET), 0) * 100, 2) AS budget_status
```

**Es suma sobre suma, nunca el promedio de los días.** Datos lo escribió así
en la `BASE` de `cvr_total`, y la diferencia se nota: el 2026-10-29 medimos
el CVR promediando los días y dio 0,379 %; sobre sumas, septiembre da 0,338 %.

| Clave | Rótulo | Meta |
|---|---|---|
| `rpv_total` | Proponemos `USD · POR VISITA` | Sin meta |
| `cvr_total` | `TOTAL` | Sin meta |
| `aov_total` | Proponemos `USD · POR ORDEN` | Sin meta |
| `roas_paid` | `TOTAL`, como `roas` | Sin meta |
| `budget_status` | `TOTAL` | Sin meta |

**Los dos rótulos nuevos son propuesta.** `USD · TOTAL` en un promedio por
visita o por orden haría pensar que es un total. Si prefieren otro texto,
díganlo; el front no lo traduce.

**Lo que tiene que dar**, medido el 2026-11-09:

| Mes | `rpv_total` | `cvr_total` | `aov_total` | `roas_paid` | `budget_status` |
|---|---|---|---|---|---|
| 2026-07 | 0,4088 | 0,4046 | 101,05 | 6,7787 | 105,18 |
| 2026-08 | 0,8277 | 0,8391 | 98,63 | 8,8092 | 95,68 |
| 2026-09 | 0,3856 | 0,3376 | 114,24 | 6,6992 | 76,18 |
| 2026-10 | 0,4555 | 0,4505 | 101,11 | 6,8480 | 73,63 |

**Agosto no es un error de la consulta.** El RPV y el CVR dan el doble que en
los otros meses porque las visitas de agosto son menos, y el AOV, que no
depende de las visitas, sigue igual. Si hay que explicarlo, es una pregunta
para datos.

### `promo_dependency` · `scalar`

```sql
SELECT ROUND(SUM(INGRESOS_ONSALE) / NULLIF(SUM(INGRESOS_USD_TOTAL), 0) * 100, 2) AS v
  FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PRODUCTO_METRICS_DAILY
 WHERE DATE >= ? AND DATE < ?
```

Rótulo `TOTAL`. Puede usar el mismo armado que `terpelScalar`, con otra
vista. Tiene que dar **81,73** en julio, **82,65** en agosto, **79,20** en
septiembre y **73,78** en octubre.

La vista trae una columna `PROMO_DEPENDENCY_PCT` por día, pero **no hay que
usarla**: promediarla no da el porcentaje del mes.

### `top_10_productos` · `ranking`

```sql
SELECT PRODUCT_NAME AS label,
       INGRESOS_MES_USD AS v
  FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PRODUCTO_METRICS_MONTHLY
 WHERE MES >= ? AND MES < ?
 ORDER BY RANK
```

La vista ya trae los diez del mes, sin la venta «Unspecified» y sin productos
sin código SAP. `MES` es el primer día del mes, así que el filtro de período
funciona tal cual.

| Mes | 1.º | 10.º |
|---|---|---|
| 2026-09 | UA Charged Assert 10 Men's Running Shoes-3026175 · 41 835,41 | UA Charged+ Chase Men's Running Shoes-6014417 · 13 079,70 |
| 2026-10 | UA Charged Assert 10 Men's Running Shoes-3026175 · 28 318,54 | UA Charged Edge Men's Training Shoes-3026727 · 3 720,98 |

**Se parece a `top_products_revenue`, que ya está registrada, y no da lo
mismo.** Esa consulta lee `GLD_PRODUCTO_ANALYTICS` agrupando por
`PRODUCT_ID`. En septiembre su primer puesto es **una fila con producto nulo,
de 125 002,78**, y los demás son variantes de talla y color («… Black US 7 -
MX 5»). La nueva agrupa por modelo y excluye lo que no tiene producto. **No
pedimos tocar `top_products_revenue`**: qué panel queda en el dashboard lo
decide producto. Lo avisamos para que no se lean como la misma métrica.

### `ncac_registrados` · `time_series`

Los doce meses de cohorte que terminan en el seleccionado, como
`media_efficiency_12m`:

```sql
SELECT MES_COHORTE AS t,
       NCAC_USD AS v
  FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_METRICS_COHORT
 WHERE MES_COHORTE >= DATEADD(month, -12, TO_DATE(?)) AND MES_COHORTE < TO_DATE(?)
 ORDER BY MES_COHORTE
```

**Los dos `?` tienen que ser el fin del período.** `periodBindings` los liga
así sólo cuando el texto contiene `DATEADD(month, -12`. Por eso va escrito
igual que en `media_efficiency_12m`: con otra forma, el primero sería el
inicio del mes y la serie tendría un punto menos. El `ProcessRows` es
`isoSeriesDates`.

Con octubre de 2026 seleccionado tiene que dar, de noviembre de 2025 a octubre
de 2026: 37,24 · 16,67 · 17,32 · 30,33 · 20,03 · 27,15 · 55,80 · 45,12 ·
31,69 · 21,85 · **27,86** (septiembre) · 25,26.

**El mes en curso entra en la serie.** Hoy la cohorte de noviembre tiene 61
clientes y un nCAC de 62,79. La consola maneja el mes abierto con su propio
aviso, así que no hay que filtrarlo.

### `ltv_registrados` · `scalar`

El LTV de la cohorte del mes seleccionado:

```sql
SELECT LTV_PROMEDIO_USD AS v
  FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_METRICS_COHORT
 WHERE MES_COHORTE >= ? AND MES_COHORTE < ?
```

Proponemos el rótulo `USD · POR CLIENTE`, por la misma razón que los de arriba. Septiembre da hoy **122,97** y octubre **109,16**.

**Esta cifra cambia todos los días**, porque es lo acumulado desde la primera
compra hasta hoy. Datos midió 122,30 para septiembre unos días antes. Si al
comprobarla no coincide en los decimales, no es un error.

**Es nuestra lectura del catálogo, y la confirma datos.** La `BASE` habla de
«cliente registrado desde su mes de primera compra», y la vista trae una fila
por cohorte, así que la del mes seleccionado es la única que se puede leer sin
promediar cohortes.

## 3 · Lo que no pedimos todavía

**`category_mix` queda para después.** La forma y la vista están claras
(`composition` sobre `GLD_PRODUCTO_PERFORMANCE`, por `DIVISION`). Pero el 9 %
de la venta llega con la división nula: es la venta sin producto identificado.
Si se muestra, y con qué nombre, lo decide datos. **Mandar el SQL antes sería
repetir lo de `media_by_campaign`.**

**`mer_total` no se registra**: datos la desactivó porque es la misma cuenta
que `roas`.

**Una cosa para producto, no para ustedes.** `budget_status` da el mismo
número que el medidor «% DE LA META» del panel `spend`: inversión sobre
presupuesto. Las dos en el mismo dashboard dicen lo mismo dos veces. Lo
registramos igual, porque el catálogo la tiene activa. Si se decide no
mostrarla, alcanza con desactivarla en el catálogo.

## 4 · Cómo lo comprobamos

Cuando esté en QA, el humano corre «Cargar meses» de julio a octubre en UA, y
nosotros comparamos cada panel con las tablas de arriba. Es la tarea F6.3. Si
la vista de control queda vacía para estas nueve claves, el registro está
completo.

Gracias.
