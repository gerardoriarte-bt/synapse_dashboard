# Para datos · UA MX: el catálogo v3.2, lo que adoptamos y lo que falta · 2026-11-24

**Medido contra `f1ccbbe` el 2026-11-24**. En Snowflake, en solo lectura con
`RL_BT_UA_TRANSFORM`:

- el `GET_DDL` de `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS`;
- los valores de agosto a noviembre de 2026 en esa vista, en
  `GLD_ECOMM_PROFITABILITY_DAILY`, en `GLD_ECOMM_DAILY_PERFORMANCE` y en
  `GLD_CUSTOMER_LTV_COHORTS_MATRIX`;
- la vista `SYNAPSE_METRIC_CATALOG`.

En QA, el catálogo de UA MX y su estado de octubre. El detalle está en
`docs/AUDITORIA-2026-11-24-catalogo-ua-mx-v3.2.md`.

Hola. Revisamos `RESPUESTA-2026-11-24-datos-catalogo-ua-mx-v3.2.md` v3.2.
**Lo adoptamos**:

- **Semáforos por umbral** en los indicadores con meta.
- **Ejes dobles** cuando dos series tienen unidades distintas.

Era algo que nuestras reglas de diseño no permitían; ahora las adaptamos. Le
pedimos al backend las consultas de las 16 métricas en
`docs/MENSAJE-2026-11-24-backend-consultas-de-rentabilidad-ua.md`.

Para que salgan bien, necesitamos cinco cosas.

## 1 · ¿Cuál es la venta de verdad? · lo que bloquea

Los paneles de venta de hoy leen `GLD_ECOMM_DAILY_PERFORMANCE`. La vista nueva
lee `FCT_PERFORMANCE` y `COSTOS_CAMPANAS`. No coinciden:

| Mes | Venta · `GLD_ECOMM_DAILY_PERFORMANCE` | Venta · `UNIT_ECONOMICS` | Gasto · `GLD_ECOMM_DAILY_PERFORMANCE` | Gasto · `UNIT_ECONOMICS` |
|---|---|---|---|---|
| 2026-09 | 1 319 462 | 790 183.82 | 118 807 | 254 788.29 |
| 2026-10 | 648 106 | 383 052.87 | 55 936 | 224 312.07 |

Con las dos en la consola, el MER y el margen se calculan sobre una venta
distinta de la que muestra «Ingresos». **¿Cuál vale, y la otra se ajusta o se
retira?**

## 2 · Que la BASE diga los supuestos

El DDL calcula con valores fijos:

- margen bruto de 55 % (`* 0.55`, en CM1, CM2, CM3 y POAS);
- comisiones de 2,5 % (CM2);
- USD 5 de logística por orden (CM3);
- metas de 14 M y 3 M repartidas con pesos escritos en el código (pacing de
  FY27);
- meta de 30 M (pacing anual).

Si son supuestos, **la `BASE` de cada fila del catálogo tiene que decirlo**,
por ejemplo «Venta × margen supuesto de 55 %». Así el panel no lo presenta como
medido. Hoy `cm1_margin` dice solo «Revenue».

Y sobre los nombres: «GPT» (`AOV − CPA`) y «GPOT» (`venta − pauta`) no restan
el costo de lo vendido. ¿Se puede aclarar en la BASE que es antes del costo
del producto?

## 3 · Las filas que faltan en el catálogo

Las columnas ya existen. Faltan las filas de `SYNAPSE_METRIC_CATALOG` para:

- `atc_rate`
- `cart_completion`
- `cpa_blended`
- `pacing_revenue_fy27`
- `mer_total`, que QA tiene pero la vista no

## 4 · Dos cifras para revisar

- **`cart_completion` da 4,8 % a 6,8 %** de septiembre a noviembre (órdenes
  sobre add-to-carts del mes). El documento espera más de 25 %. ¿`TOTAL_ATC`
  cuenta productos agregados y no carritos?
- **`ltv_cac_ratio`** cruza el mes de cohorte con el mes calendario
  (`ch.MES_COHORTE = e.MES`). ¿Es la intención, o es el LTV/CAC de la cohorte
  del mes?

## 5 · Los umbrales de los semáforos

Para pintar los semáforos necesitamos, por indicador, **dónde empieza y dónde
termina la zona aceptable**. Del documento tomamos los que ya trae; confirmen
o corrijan:

| Indicador | Mal | Aceptable | Bien |
|---|---|---|---|
| `ltv_cac_ratio` | < 1,5× | 1,5× – 3,0× | > 3,0× |
| `poas_blended` | — | — | > 2,0× |
| `mer_total` | < 3,5× | 3,5× – 4,5× | > 4,5× |
| `rpv_total` | — | — | > USD 1,50 |
| `cart_completion` | — | — | > 25 % |
| `cm3_margin_pct` | — | — | > 18 % |

Donde hay «—», díganos el corte.

**Y una que seguimos pidiendo:** `SEMANTIC_DIRECTION` llega como código
(`HIGHER_IS_BETTER`, `NEUTRAL`) en las filas nuevas. La consola lo muestra
tal cual. Va el texto («MÁS ALTO = MEJOR»).

Gracias.
