# Para el equipo de datos · qué de UA se puede ver por día y por mes · 2026-11-11

**Medido contra `e51225b` el 2026-11-11**, leyendo la rama
`feature/dynamic-dashboard-backend` del backend: `MetricRegistry` y `KPISQL`,
que dicen de qué tabla y con qué cuenta sale cada métrica de UA. Del front,
contra `b617ad8`: cómo se lee `MIN_GRAIN` del catálogo
(`src/surfaces/console/periodGrain.ts`). Del lado de Snowflake, el mismo día
en sólo lectura y con agregados: el grano de las ocho tablas que usa UA, la
fila del catálogo de las series que ya existen, y cada cifra de este mensaje.

Hola. Queremos que el dashboard de UA muestre las cifras **día por día dentro
del mes** y **mes por mes en los últimos doce**. Antes de pedírselo al backend
necesitamos que ustedes validen qué se puede mostrar y que creen las filas del
catálogo. **Cuando nos confirmen, le pedimos al backend el registro con el
SQL**, como hicimos con las métricas del 2026-11-09.

## 1 · Lo que ya hay

| Clave | Qué muestra |
|---|---|
| `daily_trend` | Venta, visitas e inversión, cada día del mes |
| `media_efficiency_12m` | Inversión, venta y ROAS, cada mes de los últimos doce |
| `media_platform_investment_matrix` | Inversión por plataforma, cada mes de los últimos doce |
| `ncac_registrados` | nCAC de las doce últimas cohortes |

## 2 · Por qué casi todo se puede

**`GLD_ECOMM_DAILY_PERFORMANCE` tiene una fila por día**: 2557 filas y 2557
fechas, con venta del 2022-01-01 a hoy. En los doce meses que terminan en
octubre **no hay ningún día sin visitas, sin órdenes ni sin inversión**. Los
once escalares de `KPISQL` salen de ahí, así que todos se pueden abrir por día
y por mes.

**`GLD_PRODUCTO_METRICS_DAILY` también es diaria**: 1045 filas y 1045 fechas,
desde el 2024-01-01.

**Las razones se calculan con sumas en cada día o en cada mes**, igual que lo
escribieron en la `BASE` de `cvr_total`: nunca como el promedio de los días.

## 3 · Lo que proponemos

Los nombres de las claves son propuesta; los deciden ustedes. Cada una
necesita su fila en `SYNAPSE_METRIC_CATALOG`.

### Por día · `MIN_GRAIN` `day`, ventana «Cada día del mes calendario seleccionado»

Como `daily_trend`. Una serie diaria **no cambia el período del dashboard**:
el front toma el `MIN_GRAIN` más grueso de la pestaña, y con `day` el período
sigue siendo el mes.

| Clave propuesta | Forma | Qué muestra | Unidad | Octubre de 2026 |
|---|---|---|---|---|
| `daily_orders_units` | `multi_series` | Órdenes y unidades de cada día | | 1 de octubre: 405 órdenes y 1291 unidades. El mes suma 6410 y 15 755 |
| `daily_cvr` | `time_series` | Órdenes sobre visitas del día, × 100 | `%` | 1 de octubre: 0,7090. Los días van de 0,2450 a 1,3229 |
| `daily_aov` | `time_series` | Venta sobre órdenes del día | `USD` | 1 de octubre: 107,46. Los días van de 75,02 a 176,73 |
| `daily_roas_paid` | `time_series` | `REV_PAID` sobre inversión del día | | 1 de octubre: 7,5743. Los días van de 4,1875 a 15,6760 |
| `daily_revenue_pacing` | `multi_series` | Venta acumulada y meta de venta acumulada, día a día | `USD` | Cierra en 648 106 contra 397 553 |
| `daily_budget_pacing` | `multi_series` | Inversión acumulada y presupuesto acumulado, día a día | `USD` | Cierra en 55 936 contra 75 974 |
| `daily_promo_dependency` | `time_series` | Venta en promoción sobre venta del día, × 100 | `%` | El mes da 73,78 |

**El RPV por día no lo proponemos**: es el CVR por el AOV, y ya están los dos.

**La meta y el presupuesto van acumulados, no día por día**, por cómo están
cargados:

- **La meta de venta** trae un valor distinto cada día: 31 en octubre.
- **El presupuesto no.** Octubre trae cuatro valores, uno por semana:

  | Del | Al | Por día | Suma |
  |---|---|---|---|
  | 2026-10-01 | 2026-10-08 | 1364 | 10 912 |
  | 2026-10-09 | 2026-10-15 | 3040 | 21 280 |
  | 2026-10-16 | 2026-10-22 | 1986 | 13 902 |
  | 2026-10-23 | 2026-10-31 | 3320 | 29 880 |

  Un `budget_status` de un día suelto compararía la inversión de ese día con
  la séptima parte de un tramo semanal. Acumulado, se lee como ritmo contra
  el plan del mes.

### Por mes · ventana «Últimos 12 meses calendario hasta el mes seleccionado»

Como `media_efficiency_12m`.

| Clave propuesta | Forma | Qué muestra | Unidad |
|---|---|---|---|
| `orders_units_12m` | `multi_series` | Órdenes y unidades de cada mes | |
| `cvr_12m` | `time_series` | CVR de cada mes | `%` |
| `aov_12m` | `time_series` | AOV de cada mes | `USD` |
| `roas_paid_12m` | `time_series` | ROAS pagado de cada mes | |
| `budget_status_12m` | `time_series` | Inversión sobre presupuesto de cada mes, × 100 | `%` |
| `revenue_attainment_12m` | `time_series` | Venta sobre meta de venta de cada mes, × 100 | `%` |
| `promo_dependency_12m` | `time_series` | Dependencia de promoción de cada mes | `%` |

Cada mes tiene que dar lo mismo que el escalar de ese mes. Medido el
2026-11-09:

| Mes | CVR | AOV | ROAS pagado | Inversión sobre presupuesto |
|---|---|---|---|---|
| 2026-07 | 0,4046 | 101,05 | 6,7787 | 105,18 |
| 2026-08 | 0,8391 | 98,63 | 8,8092 | 95,68 |
| 2026-09 | 0,3376 | 114,24 | 6,6992 | 76,18 |
| 2026-10 | 0,4505 | 101,11 | 6,8480 | 73,63 |

La dependencia de promoción da, de noviembre de 2025 a octubre de 2026:

66,30 · 83,17 · 80,73 · 63,22 · 75,85 · 61,55 · 75,93 · 85,36 · 81,73 ·
82,65 · 79,20 · 73,78

La venta de octubre sobre su meta da **163,02**.

## 4 · Lo que no se puede, o no conviene

| Métrica | Por qué |
|---|---|
| `ncac_registrados`, `ltv_registrados` por día | La tabla de cohortes tiene una fila por mes: 47, desde 2023-01 |
| `top_10_productos` por día | `GLD_PRODUCTO_METRICS_MONTHLY` es mensual, y tiene sólo once meses, de 2026-01 a 2026-11 |
| `top_products_revenue` y `conversion_funnel` por día | La tabla es diaria, pero un ranking o un embudo por día no se lee. La tasa del embudo ya es el CVR |
| Seguidores de Instagram | Ya es diaria, pero los datos terminan el 2026-08-01 |
| Sentimiento de TikTok | Los posts terminan el 2026-03-05 |

## 5 · Lo que necesitamos que validen

**1. La inversión de medios por plataforma no cuadra con la del reporte de
ecommerce.** Por eso no proponemos todavía ninguna serie por plataforma.
`GLD_PAID_MEDIA.COST_USD` suma, por mes:

| Mes | `COST_USD` | Dailymotion, GCM-Other y Link Factor | El resto | `GROSS_SPEND` del ecommerce |
|---|---|---|---|---|
| 2026-07 | 122 258,64 | 14 | 122 244,64 | 84 837 |
| 2026-08 | 1 504 511,73 | 1 392 328 | 112 183,73 | 71 828 |
| 2026-09 | 3 347 868,28 | 3 096 354,17 | 251 514,11 | 118 807 |
| 2026-10 | 4 158 368,07 | 3 934 056 | 224 312,07 | 55 936 |

**Desde agosto, tres fuentes ponen casi todo el costo.** Sólo Dailymotion
suma 2 439 323 en octubre. ¿Puede ser otra moneda u otra columna cargada como
costo? Sin esas tres, el resto sigue siendo cuatro veces el `GROSS_SPEND` de
octubre. **¿Cuál de las dos es la inversión, y qué mide la otra?**

Además, en octubre «Dailymotion» y «Daily Motion» salen como dos fuentes, y 19
fuentes no tienen costo, entre ellas una que se llama «None».

**No es sólo para las series nuevas.** `platform_return`,
`media_investment_composition` y `media_platform_investment_matrix` ya leen
`COST_USD` de esta tabla.

**2. El presupuesto por semana.** ¿Se carga así a propósito? ¿El acumulado es
la lectura correcta, o prefieren otra?

**3. El LTV mes por mes.** No lo propusimos. El LTV de cada cohorte se acumula
desde su primera compra hasta hoy, así que una serie de doce cohortes compara
clientes de distinta antigüedad. Hoy la de noviembre de 2025 da 158,75 y la de
octubre de 2026 da 109,34. Una baja así puede ser sólo que la cohorte nueva
lleva menos tiempo comprando. ¿Hay un LTV a una edad fija, por ejemplo a 90
días? Si no lo hay, no lo mostraríamos.

**4. La ventana de `ncac_registrados`.** Su `MEASUREMENT_WINDOW` dice «Mes
calendario seleccionado», pero la métrica es una serie de las doce cohortes
que terminan en ese mes. Proponemos «Últimos 12 meses de cohorte hasta el mes
seleccionado».

**5. Instagram y TikTok.** ¿Se siguen cargando, o quedaron en esas fechas?

## 6 · Lo que nos devuelven

- **Qué claves del §3 van**, con el nombre que ustedes decidan.
- **Su fila en el catálogo**, como la de `daily_trend` o la de
  `media_efficiency_12m`, con nombre, forma, familia, fuente, `BASE`, unidad,
  dirección, `MIN_GRAIN` y ventana.
- **La respuesta a las cinco preguntas del §5.**

Con eso le escribimos al backend: el SQL de cada clave y la cifra que tiene que
dar.

Gracias.
