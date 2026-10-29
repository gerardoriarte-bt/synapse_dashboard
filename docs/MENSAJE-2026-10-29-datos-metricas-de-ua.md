# Para datos · las métricas nuevas de UA · 2026-10-29

**Medido contra `d296e6d` el 2026-10-29**, que es `MetricRegistry` del backend,
y con Snowflake en sólo lectura el mismo día, con el rol `RL_BT_UA_TRANSFORM`.
Cada consulta y su resultado están en
`docs/AUDITORIA-2026-10-29-metricas-de-ua-tabla-resumen.md`.

Gracias por las seis vistas del 28. Están todas en
`DB_BT_UA.BT_UA_MART_ANALYTICS`, con las columnas de la tabla resumen, y
`SYNAPSE_APP_ROLE` ya puede leerlas. Antes de cargarlas al catálogo
encontramos tres números que no cierran, y queremos resolverlos antes de que
lleguen a la consola.

## Tres correcciones

**1. El nCAC devuelve el gasto del mes, no el costo por cliente.**
`costos_cohorte` une cada cliente con todas las filas de `GLD_PAID_MEDIA` de
su mes. En la cohorte de 2026-09, `COSTO_COHORTE_USD` da 2 111 430 540, que es
254 788,29 × 8 287 clientes, y `NCAC_USD` da 254 788,29, cuando lo esperado
son unos 30,7. Lo arrastran `LTV_TO_CAC_RATIO` y `CLV_NET_USD`.

```sql
SELECT MIN(NCAC_USD), MAX(NCAC_USD), MIN(NUEVOS_CLIENTES_COHORTE)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_METRICS_COHORT
WHERE MES_COHORTE = '2026-09-01';   -- 254788.29 · 254788.29 · 8287
```

**Pedido:** sumar el gasto del mes una sola vez, por ejemplo agregando
`GLD_PAID_MEDIA` por mes antes del join.

**2. `BUDGET_STATUS` dice «🟢 ON TRACK» en las 245 filas**, aunque `PCT_SPENT`
llega a 5 447,92, y 179 filas pasan de 90.

```sql
SELECT BUDGET_STATUS, COUNT(*)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_BUDGET_EXECUTION_MONTHLY GROUP BY 1;   -- 🟢 ON TRACK · 245

SELECT COUNT_IF(PCT_SPENT > 90), COUNT_IF(PCT_SPENT > 100)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_BUDGET_EXECUTION_MONTHLY;   -- 179 · 36
```

Sospechamos que el `IFF` lee el `PCT_SPENT` de `GLD_BRAND_BUDGET` y no el alias
calculado, pero no lo verificamos. **Pedido:** revisarlo y, si se puede, dejar
el estado sin emojis. En la consola no usamos ámbar ni color de juicio, así
que mostraríamos sólo el texto.

**3. Lo atribuido a medios supera la venta del sitio.** En septiembre de 2026,
`GLD_PAID_MEDIA_METRICS_DAILY` suma 1 535 869 de `INGRESOS_USD`, y
`GLD_ECOMM_METRICS_DAILY` suma 1 319 462 de `REV_TOTAL`. De ese total,
483 494 vienen con `SCOPE_STRATEGY` nulo y sin costo, y entran en el ROAS.

```sql
SELECT SCOPE_STRATEGY, SUM(COST_USD), SUM(INGRESOS_USD)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PAID_MEDIA_METRICS_DAILY
WHERE DATE BETWEEN '2026-09-01' AND '2026-09-30' GROUP BY 1;
```

**Pedido:** que nos cuenten de dónde sale la diferencia, y si las filas sin
estrategia deberían quedar fuera del ROAS.

## Una definición: ¿cuál es la inversión?

En septiembre, el MER nuevo divide por 254 788 (`GLD_PAID_MEDIA`,
consolidada). El `roas` que hoy está en el catálogo divide por 118 807
(`GROSS_SPEND` de `GLD_ECOMM_DAILY_PERFORMANCE`). La venta es la misma, así
que la consola mostraría **5,18 y 11,11** como respuesta a la misma pregunta.

**Pedido:** decirnos cuál es la inversión de UA. Con eso proponemos retirar o
renombrar una de las dos métricas, y que el panel de inversión use la misma.

## Para cada métrica, la fila del catálogo

Como en `docs/snowflake/COMO-ENTREGAR-UNA-METRICA.md`: `SHAPE`, `FAMILY`,
`UNIT`, `SEMANTIC_DIRECTION` (en texto), `MIN_GRAIN`, `DIMENSIONS`, `BASE` y
`MEASUREMENT_WINDOW`. En §4 de la auditoría dejamos una propuesta de los ocho
campos para las once métricas, para que la corrijan en vez de empezar de cero.
Hay cuatro preguntas que no podemos contestar nosotros:

- **El top 10 de productos es diario** (`TOP10_SHARE_PCT`). ¿Pueden darnos el
  del mes, o la vista de producto para calcularlo?
- **Category Mix tiene 130 categorías en varios niveles.** ¿En qué nivel de la
  jerarquía se lee?
- **Promoción:** ¿es la venta rebajada (`INGRESOS_ONSALE`) o la venta de los
  días con promo (la columna `PROMO`)?
- **LTV:** ¿es a la fecha, desde 2023, o a un horizonte fijo?

## Lo que no hace falta

- **Permisos**: ya están.
- **Las vistas con el nombre del Excel**: usamos las que existen
  (`GLD_PRODUCTO_METRICS_DAILY`, `GLD_PRODUCTO_METRICS_BY_CATEGORY` y
  `GLD_BUDGET_EXECUTION_MONTHLY`).

Cuando estén las tres correcciones y la definición de inversión, le pedimos al
backend que programe las métricas. Antes no, para no hacerles calcular números
que van a cambiar.
