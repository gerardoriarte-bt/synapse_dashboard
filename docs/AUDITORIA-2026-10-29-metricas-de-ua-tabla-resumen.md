# Auditoría · la tabla resumen de métricas de UA, contra Snowflake · 2026-10-29

**Qué se revisó:** `TABLA RESUMEN - MÉTRICAS SYNAPSE UA MX.xlsx`, versión 3.2,
del 2026-10-29, con 11 métricas. Es la propuesta para ampliar el catálogo de UA.
El archivo está en el `docs/` local sin commitear; este documento no lo copia.

**Cómo se midió:** en Snowflake, sólo lectura, con Cortex Code y la conexión
`ANALYTICS` (rol `RL_BT_UA_TRANSFORM`), el 2026-10-29 a las 14:31 hora del
Pacífico. Las consultas van escritas abajo, junto a cada hallazgo, para que
cualquiera las vuelva a correr. Del lado del backend se leyó `MetricRegistry`
en `d296e6d`.

**El pedido que sale de acá** está en
`docs/MENSAJE-2026-10-29-datos-metricas-de-ua.md`.

## En una frase

Las vistas existen y tienen las columnas: datos las creó el 2026-10-28. Pero
**tres de los números salen mal hoy** (el nCAC, el estado del presupuesto y el
ROAS por estrategia), **dos definiciones de «inversión» dan resultados que
difieren el doble**, y faltan los campos que el catálogo exige para mostrar una
métrica.

## 1. Dónde vive cada métrica

Todas están en `DB_BT_UA.BT_UA_MART_ANALYTICS` y todas son **vistas**. Dos
tienen otro nombre que el del Excel.

| # | Métrica | El Excel dice | Existe como | Columna |
|---|---|---|---|---|
| 1 | MER | `GLD_ECOMM_METRICS_DAILY` | ✔ igual | `MER_TOTAL`, `MER_PAID`, `MER_BRAND` |
| 2 | RPV | `GLD_ECOMM_METRICS_DAILY` | ✔ igual | `RPV_*` |
| 3 | CVR | `GLD_ECOMM_METRICS_DAILY` | ✔ igual | `CVR_*` |
| 4 | AOV | `GLD_ECOMM_METRICS_DAILY` | ✔ igual | `AOV_*` |
| 5 | ROAS | `GLD_PAID_MEDIA_METRICS_DAILY` | ✔ igual | `ROAS` |
| 6 | Promo Dependency | `GLD_ECOMM_METRICS_DAILY` | ✘ está en **`GLD_PRODUCTO_METRICS_DAILY`** | `PROMO_DEPENDENCY_PCT` |
| 7 | Category Mix | `GLD_PRODUCT_MIX_METRICS` | ✘ no existe · está en **`GLD_PRODUCTO_METRICS_BY_CATEGORY`** | `CATEGORY_MIX_PCT` |
| 8 | SKU Concentration | `GLD_PRODUCT_MIX_METRICS` | ✘ no existe · está en **`GLD_PRODUCTO_METRICS_DAILY`** | **`TOP10_SHARE_PCT`**, no `SKU_CONCENTRATION_RISK_PCT` |
| 9 | Budget Pacing | `GLD_BUDGET_CONTROL` | ✘ no existe · está en **`GLD_BUDGET_EXECUTION_MONTHLY`** | `PCT_SPENT`, `BUDGET_STATUS` |
| 10 | nCAC | `GLD_CUSTOMER_METRICS_COHORT` | ✔ igual | `NCAC_USD` |
| 11 | LTV | `GLD_CUSTOMER_METRICS_COHORT` | ✔ igual | `LTV_INGRESOS_USD` |

```sql
SHOW TABLES LIKE 'GLD_BUDGET_CONTROL' IN ACCOUNT;       -- 0 filas
SHOW VIEWS  LIKE 'GLD_BUDGET_CONTROL' IN ACCOUNT;       -- 0 filas
SHOW TABLES LIKE 'GLD_PRODUCT_MIX_METRICS' IN ACCOUNT;  -- 0 filas
SHOW VIEWS  LIKE 'GLD_PRODUCT_MIX_METRICS' IN ACCOUNT;  -- 0 filas
SHOW VIEWS  LIKE 'GLD_%' IN ACCOUNT;  -- las seis nuevas, creadas el 2026-10-28
```

| Vista | Filas | Desde | Hasta |
|---|---|---|---|
| `GLD_ECOMM_METRICS_DAILY` | 2 557 | 2022-01-01 | 2028-12-31 (con venta hasta 2026-10-29) |
| `GLD_PAID_MEDIA_METRICS_DAILY` | 71 794 | 2023-01-01 | 2026-10-29 |
| `GLD_CUSTOMER_METRICS_COHORT` | 389 094, una por cliente | 2023-01-01 | 2026-10-27 |
| `GLD_BUDGET_EXECUTION_MONTHLY` | 245, una por campaña y mes | 2021-02-01 | 2026-10-01 |
| `GLD_PRODUCTO_METRICS_BY_CATEGORY` | 81 268 · 130 categorías | 2024-01-01 | 2026-10-28 |
| `GLD_PRODUCTO_METRICS_DAILY` | 1 032 | 2024-01-01 | 2026-10-28 |

**Permisos: no falta nada.** `SYNAPSE_APP_ROLE` y `RL_BT_UA_BI` tienen
`SELECT` directo sobre las vistas nuevas, y además `SELECT` futuro sobre las
vistas del esquema (`SHOW GRANTS ON VIEW …` y
`SHOW FUTURE GRANTS IN SCHEMA DB_BT_UA.BT_UA_MART_ANALYTICS`).

**El catálogo todavía no las nombra.** `SYNAPSE_METRIC_CATALOG` de UA tiene 16
filas, y ninguna es MER, RPV, CVR, AOV, nCAC, LTV, mix, concentración o pacing.

## 2. Tres números que salen mal hoy

### 2.1 · El nCAC es el gasto del mes entero, no el costo por cliente

En `GLD_CUSTOMER_METRICS_COHORT`, `costos_cohorte` une **cada cliente** con
**todas las filas** de `GLD_PAID_MEDIA` de su mes, y después suma `COST_USD`.
Así, el gasto queda multiplicado por la cantidad de clientes nuevos. Al
dividir por esa misma cantidad, vuelve a dar el gasto total.

```sql
SELECT COUNT(*), MIN(NCAC_USD), MAX(NCAC_USD), MIN(COSTO_COHORTE_USD), MIN(NUEVOS_CLIENTES_COHORTE)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_METRICS_COHORT
WHERE MES_COHORTE = '2026-09-01';
```

| Cohorte 2026-09 | Valor |
|---|---|
| Clientes nuevos | 8 287 |
| `COSTO_COHORTE_USD` | 2 111 430 540 · que es 254 788,29 × 8 287 |
| `NCAC_USD` | **254 788,29** · el gasto del mes en `GLD_PAID_MEDIA` |
| Lo esperado | 254 788,29 / 8 287 ≈ **30,7** |

**Arrastra a `LTV_TO_CAC_RATIO` y `CLV_NET_USD`**, que usan el mismo costo. Y
como el Excel avisa que el nCAC sólo sirve como tendencia relativa, conviene
notar que este error **no se ve en la tendencia**: la tendencia sería la del
gasto, no la del costo por cliente.

### 2.2 · `BUDGET_STATUS` dice «ON TRACK» en los 245 meses

```sql
SELECT BUDGET_STATUS, COUNT(*) FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_BUDGET_EXECUTION_MONTHLY GROUP BY 1;
-- 🟢 ON TRACK · 245

SELECT COUNT(*), MIN(PCT_SPENT), MAX(PCT_SPENT), COUNT_IF(PCT_SPENT > 90), COUNT_IF(PCT_SPENT > 100)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_BUDGET_EXECUTION_MONTHLY;
-- 245 · 10,31 · 5 447,92 · 179 · 36
```

Con la regla de la propia vista —más de 100 es «OVER», más de 90 es «NEAR»—,
**179 filas no deberían decir «ON TRACK»**. Junio de 2026 gastó 120 656 sobre un
presupuesto de 62 241.

**La causa probable no está verificada.** `GLD_BRAND_BUDGET`, la fuente, también
tiene una columna `PCT_SPENT`. Lo más probable es que el `IFF` esté leyendo esa
columna y no el alias que se calcula en la misma consulta. Hay dos cosas más en
esta vista:

- **Es el presupuesto de BRAND**, por el nombre de la fuente, y viene por
  campaña. El Excel lo presenta como «% presupuesto ejecutado» en general y
  pide una cascada por canal, pero la vista no tiene canal.
- **El grano es mensual.** «Día 15 = 50 % ideal» necesita el gasto acumulado
  por día, y esta vista no lo tiene.

### 2.3 · El ingreso atribuido a medios supera la venta del sitio

```sql
-- septiembre de 2026
SELECT SCOPE_STRATEGY, SUM(COST_USD), SUM(INGRESOS_USD)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PAID_MEDIA_METRICS_DAILY
WHERE DATE BETWEEN '2026-09-01' AND '2026-09-30' GROUP BY 1;
```

| | Costo | Ingreso atribuido | ROAS | Venta del sitio en `GLD_ECOMM_METRICS_DAILY` |
|---|---|---|---|---|
| PERFORMANCE | 147 765 | 1 004 014 | 6,79 | `REV_PAID` 795 916 |
| BRAND | 107 023 | 48 362 | 0,45 | `REV_BRAND` 40 049 |
| **NULL** | — | **483 494** | — | — |
| Total | 254 788 | **1 535 869** | 6,03 | `REV_TOTAL` **1 319 462** |

- **Lo atribuido a medios (1,54 M) es más que todo lo que vendió el sitio (1,32 M).**
  Con atribución por last-click, cada orden debería contarse una sola vez.
- **483 494 de ingreso no tienen estrategia ni costo.** Entran en el ROAS total
  y lo inflan: con ese ingreso da 6,03; sin él, 4,13.

## 3. Dos «inversiones» que difieren el doble

`MER_TOTAL` divide por el costo de `GLD_PAID_MEDIA` (`SOURCE_TABLE =
'CONSOLIDADA'`). El `roas` que hoy está en el catálogo y en la consola divide
por `GROSS_SPEND` de `GLD_ECOMM_DAILY_PERFORMANCE`. La venta es la misma en
los dos casos.

| Septiembre de 2026 | Inversión | Venta | Ratio |
|---|---|---|---|
| MER nuevo | 254 788 (`GLD_PAID_MEDIA`, consolidada) | 1 319 462 | **5,18** |
| `roas` del catálogo | 118 807 (`GROSS_SPEND`) | 1 319 462 | **11,11** |

**Las dos métricas dividen la venta del sitio por la inversión**, así que son
la misma métrica con distinto denominador. Si se cargan las dos, la consola
muestra 5,18 y 11,11 para la misma pregunta. Además, el panel `spend` muestra
118 807 como «Inversión» del mes.

**Cuál de las dos inversiones es la correcta no lo decide el front.** Lo que sí
sabemos es que **no pueden convivir con nombres distintos y sin explicación**.

**El ROAS del Excel (#5) es un tercer número.** Divide el ingreso atribuido por
Adobe en last-click por el costo de cada plataforma, por eso el Excel pide no
usarlo en TikTok ni en Display. No es el `roas` del catálogo (bruto) ni
`platform_return` (lo que reporta cada plataforma).

## 4. Lo que el catálogo exige y el Excel no trae

`docs/snowflake/COMO-ENTREGAR-UNA-METRICA.md` pide por métrica: `SHAPE`,
`FAMILY`, `UNIT`, `SEMANTIC_DIRECTION`, `MIN_GRAIN`, `DIMENSIONS`, `BASE` y
`MEASUREMENT_WINDOW`. El Excel no trae ninguno de los ocho. Esta es una
propuesta para que datos la confirme o la corrija:

| # | Métrica | SHAPE | FAMILY | UNIT | Dirección | Grano mín. | Dimensiones |
|---|---|---|---|---|---|---|---|
| 1 | MER | scalar | media | x | HIGHER = BETTER | day | alcance (total · paid · brand) |
| 2 | RPV | scalar | demand | USD | HIGHER = BETTER | day | alcance |
| 3 | CVR | scalar | demand | % | HIGHER = BETTER | day | alcance |
| 4 | AOV | scalar | demand | USD | HIGHER = BETTER | day | alcance |
| 5 | ROAS last-click | tabular o categorical | media | x | HIGHER = BETTER | day | `FUENTE`, `SCOPE_STRATEGY` |
| 6 | Promo Dependency | scalar | demand | % | **LOWER = BETTER** | day | — |
| 7 | Category Mix | composition | demand | % | — | day | `CATEGORIA_PRODUCTO` (130) |
| 8 | Concentración top 10 | scalar | demand | % | **LOWER = BETTER** | **ver abajo** | — |
| 9 | Pacing | scalar | media | % | — | **month** | campaña |
| 10 | nCAC | time_series | customer | USD | **LOWER = BETTER** | month (cohorte) | — |
| 11 | LTV | distribution | customer | USD | HIGHER = BETTER | month (cohorte) | `SEGMENTO_VALOR` |

**Qué hay que decidir para cada una, porque cambia la cifra:**

- **Los ratios del mes se calculan como suma sobre suma, no como promedio de
  los días.** Medido en septiembre: el CVR es 0,338 % con suma sobre suma y
  0,379 % promediando el `CVR_TOTAL` diario. El MER da 5,18 y 5,06. Por eso
  las vistas diarias tienen que traer también los numeradores y los
  denominadores. Hoy los traen, salvo algunas excepciones.
- **`TOP10_SHARE_PCT` es el top 10 de cada día.** El top 10 del mes no sale
  de sumar los días: hay que calcularlo a nivel de producto, que está en
  `GLD_PRODUCTO_ANALYTICS`. Se necesita una vista mensual, o que el backend lo
  calcule.
- **`CATEGORY_MIX_PCT` sí se puede llevar al mes**, porque la vista trae
  `INGRESOS_USD` por categoría. Pero con 130 categorías no entra en una torta
  de 8 porciones, y en «Hombre > Ropa > Calzado» y «Calzado» la misma familia
  aparece en dos niveles. Hace falta decidir el nivel de la jerarquía.
- **¿Qué es «promoción»?** `PROMO_DEPENDENCY_PCT` mide la venta de productos
  con precio rebajado (`INGRESOS_ONSALE`). `GLD_ECOMM_METRICS_DAILY` tiene
  además una columna `PROMO` del día, y la fórmula del Excel («Rev Promo / Rev
  Total») se puede leer de las dos formas. Esa columna tiene cuatro valores:
  `FALSE`, `PROMO`, `FULL PRICE` y `TRUE`.
- **LTV: la ventana es desde la primera compra, con datos desde 2023.** Un
  cliente de 2023 lleva tres años acumulando y uno de septiembre lleva un mes.
  Para la BASE hay que decir si el LTV es «a la fecha» o a un horizonte fijo
  (12 meses, por ejemplo). Los umbrales de los segmentos están en la vista:
  VIP ≥ 200 USD, MID ≥ 100, ENTRY ≥ 50 y LOW el resto.
- **nCAC: «no usar valores absolutos».** La consola muestra la cifra por
  defecto. Si la regla va en serio, el panel muestra la variación contra el
  mes anterior o un índice, y eso es una decisión de producto. Primero hay que
  arreglar §2.1.

## 5. Gráficos: la mayoría ya existen

El repertorio tiene 49 gráficos (`docs/repertorio-de-graficos.json`). Line,
gauge, bullet, barras, embudo, mapa de calor, cohortes, histograma, caja,
dispersión, treemap, cascada, pareto y área apilada **ya están**. Lo que choca:

| El Excel pide | Por qué no | Alternativa |
|---|---|---|
| Pie (top 8) | No hay torta, y la dona se corta en 5 partes | Treemap o barras |
| Heatmap día/hora | Todo tiene grano diario; no hay datos por hora | Heatmap día × semana |
| Line con bandas (CVR) | La banda tiene que venir en el dato (`series_with_band`) | La calcula datos, o va sin banda |
| Line con promos | No hay un calendario de promociones como fuente | La columna `EVENT`, si datos la limpia (tiene más de 60 variantes escritas a mano) |
| Waterfall por canal (pacing) | La vista es por campaña, sin canal | Por campaña |

## 6. Los benchmarks y el semáforo

- **El semáforo ✅/⚠️ no se pinta.** `design.md` prohíbe que el color exprese
  un juicio y prohíbe el ámbar. Un umbral puede mostrarse como referencia
  escrita («OBJETIVO 3,0+») o como el objetivo de un gauge o un bullet.
- **Por la misma razón, `BUDGET_STATUS` no se muestra con sus emojis.** Su
  🟡 es justo el color prohibido. Si se muestra, va el texto solo.
- **Los benchmarks dependen de la inversión de §3.** «MER > 2,5» se cumple con
  las dos inversiones (5,18 y 11,11), pero un umbral sólo sirve contra un
  denominador fijo.
- **El CVR de septiembre (0,34 %) cae entre «alerta» (< 0,3 %) y «saludable»
  (> 0,5 %).** Está bien que pase. Lo anotamos para que nadie piense que el
  número está mal.
- **«$» quiere decir USD**, porque las vistas están en USD. Conviene escribirlo
  en el Excel: en México, «$» se lee como pesos.
- **«Ratio LTV/CAC» está en los benchmarks pero no entre las 11 métricas.**
  Existe como `LTV_TO_CAC_RATIO` y depende de §2.1.

## 7. Lo que falta además de datos

**Un renglón en el catálogo no alcanza para que la cifra aparezca.** Con B1.26
en A, cada métrica necesita su entrada en `MetricRegistry`, que es código Go
del backend. Hoy hay 18 claves y ninguna lee estas vistas. Es el mismo caso
que el de Keralty y Terpel
(`docs/AUDITORIA-2026-10-22-catalogo-de-keralty-y-terpel.md`). Ese pedido se
hace **después** de que datos cierre §2 y §3. Pedirlo antes es hacerles
programar sobre números que van a cambiar.

## 8. Lo que no se midió

- La causa de §2.2 sin ver el DDL de `GLD_BRAND_BUDGET`.
- Si 254 788 (consolidada) o 118 807 (`GROSS_SPEND`) es la inversión real de
  septiembre. Eso lo sabe quien carga los costos.
- De dónde sale el excedente de §2.3: si es atribución duplicada entre fuentes
  o diferencia de ventana.
- Los meses anteriores a septiembre de 2026. Todo lo de arriba es de un solo
  mes, salvo el pacing, que se midió completo.
