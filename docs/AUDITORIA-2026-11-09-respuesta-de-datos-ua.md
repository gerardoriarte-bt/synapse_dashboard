# Auditoría · la respuesta de datos sobre las métricas de UA · 2026-11-09

**Qué se mide:** `docs/RESPUESTA-2026-11-09-datos-metricas-de-ua.md`, la
respuesta a `docs/MENSAJE-2026-11-03-datos-entrega-de-ua-medida.md` (H1–H10).
Llegó el 2026-11-09 como `RESPUESTA_OFICIAL_FRONTEND_SYNAPSE_2026-11-09.md` y
se renombró al patrón `RESPUESTA-*` sin tocar el contenido.

**Medido en Snowflake el 2026-11-09**, en sólo lectura con Cortex y el rol
`RL_BT_UA_TRANSFORM` (verificado con `CURRENT_ROLE()` en las dos corridas).
Las consultas son agregados, metadatos y DDL. Cortex corrió algunas en
paralelo y no en el orden pedido; como todas son lecturas, no cambia nada.

## En una frase

**Lo de datos está cerrado.** La vista de control quedó con 10 filas y las 10
son claves que el backend todavía no registró. Las cifras de septiembre se
reproducen, y las columnas que faltaban existen. Quedan tres detalles chicos,
y ninguno frena el pedido al backend (F6.2).

## 1 · Hallazgo por hallazgo

| | Lo que dicen | Lo que medimos | Estado |
|---|---|---|---|
| **H1** · cifras de septiembre | RPV 0,385635 · CVR 0,3376 % · AOV 114,24 · MER 11,11 · ROAS pagado 6,70 | Las sumas de `GLD_ECOMM_DAILY_PERFORMANCE` dan exactamente las suyas: 1 319 462 · 3 421 532 · 11 550 · 118 807 · 795 916 | **Cerrado.** No explican de dónde salían las cifras anteriores (24,12, 4,15), pero las nuevas son las nuestras con su fórmula |
| **H2** · promo | `SUM(INGRESOS_ONSALE) / SUM(INGRESOS_USD_TOTAL)` en `GLD_PRODUCTO_METRICS_DAILY` = 79,195949 % | 1 044 958,91 / 1 319 460,05 = **79,19594900 %**. Las dos columnas existen | **Cerrado.** Definición elegida: venta con precio rebajado |
| **H2** · mix por categoría | `DIVISION` en `GLD_PRODUCTO_PERFORMANCE`: Footwear 46,81 %, Apparel 35,19 %, «None» 9,08 %, Accessories 8,91 % | Las cuatro sumas coinciden al centavo. **Ver §2**: el «None» es una división nula y la base no es la venta del sitio | **Cerrado, con dos detalles** |
| **H3** · catálogo | 10 issues, sólo de clave | `SYNAPSE_METRIC_CATALOG_ISSUES` = **10 filas, las 10 `CLAVE DESCONOCIDA`**. Las filas tienen `NAME`, `BASE`, `SOURCE` y `MEASUREMENT_WINDOW` en español, `UNIT`, `DIMENSIONS` en JSON, `FAMILY` y `SHAPE` válidas | **Cerrado** |
| **H4** · `mer_total` | `IS_ACTIVE = FALSE` | En `DD_METRIC_CURATION` está en `FALSE`, y el catálogo bajó de 27 a **26** filas, sin `mer_total` | **Cerrado** |
| **H5** · la inversión | 118 807 es la oficial; 254 788 es la suma de plataformas sin deduplicar; `GROSS_SPEND` incluye el fee | La `BASE` de `roas_paid` dice «incluye fee de agencia», y la de `ncac_registrados`, «inversión bruta consolidada» | **Cerrado.** Lo de 254 788 es lectura de su documento, no medición |
| **H6** · nCAC y LTV | Cliente nuevo = primera orden histórica; 8 287 contaba visitantes con ID. nCAC 27,86 | Cohorte 2026-09: 4 264 clientes, costo 118 807, **nCAC 27,862805**. La `BASE` declara el ~71 % y que sobreestima | **Cerrado.** El LTV da hoy 122,97 y ellos dicen 122,30: es acumulado hasta hoy, así que se mueve cada día. No es un error |
| **H7** · presupuesto | Sin emojis, cortes continuos, métrica escalar en % = 76,175424 | Seis estados sin emoji. El DDL usa `>=` y `<`. `PLANNED_BUDGET` es `SUM(BUDGET_TARGET)` de `GLD_ECOMM_DAILY_PERFORMANCE`, o sea el total de UA. Septiembre: 155 965 planificado, 118 807 gastado, **76,175400 %** | **Cerrado.** Los 25 `NO DATA` son los meses de 2026-12 a 2028-12, todos sin presupuesto cargado. Lo medimos nosotros: no lo contestaron |
| **H8** · ingreso sin estrategia | 477 123,26 sin canal ni fuente: tráfico directo, orgánico o de referidos. Se excluye de `roas_paid` | **No reproduce.** Ver §3 | **Abierto, y no frena nada** |
| **H9** · recomendación MMM | Vista puente en `BT_UA_MART_ANALYTICS` | La vista existe, es `SELECT *` de `DB_BT_UA.BT_UA_SMART_PREDICTION.GLD_MEDIA_RECOMMENDATION`, tiene 1 249 filas y `SYNAPSE_APP_ROLE` puede leerla desde el 2026-11-09 | **Cerrado** |
| **H10** · top 10 | Ranking sin «Unspecified» | Septiembre coincide puesto por puesto. El DDL filtra `unspecified` y los `SAP_PRODUCT_CODE` nulos | **Cerrado.** Eligieron el ranking y no la concentración |

## 2 · `category_mix`: dos detalles

**La cuarta porción es venta sin producto identificado.** Las 85 filas con
`DIVISION` nula suman 111 116,34, la misma cifra que el producto
«Unspecified». Es la venta que el top 10 excluye y que el mix incluye. Su
documento la llama «None (Sin Clasificar)», pero en la vista **llega nula**.
La `SOURCE` de la fila menciona sólo tres divisiones.

**El total del mix no es la venta del sitio.** El mix reparte 1 223 279,89, que
es la suma de `REVENUE_USD` en `GLD_PRODUCTO_PERFORMANCE`. La venta del sitio
es 1 319 462, y `GLD_PRODUCTO_METRICS_DAILY`, la fuente de promo, da
1 319 460,05. Las dos fuentes de producto difieren en **96 180**, el 7,3 %. Los
porcentajes del mix están bien, porque cada parte se divide por su propio
total. Pero quien sume las divisiones en USD no va a llegar a los ingresos del
panel de al lado.

**Qué hace falta:** que datos decida si la porción nula se muestra o se
excluye, y con qué nombre. Ese texto es de ellos, no del front. También, que
la `BASE` diga sobre qué total se reparte.

## 3 · H8: la cifra no aparece

Septiembre en `GLD_PAID_MEDIA_METRICS_DAILY`, agrupando por si falta la
estrategia o el canal:

| Sin estrategia | Sin canal | Costo | Ingreso | Filas |
|---|---|---|---|---|
| no | no | 254 788,29 | 1 020 309,07 | 1 004 |
| no | sí | — | 23 754,21 | 884 |
| sí | sí | — | **483 494,01** | 69 |

Ninguna combinación da 477 123,26. Puede salir de otro filtro, por ejemplo
uno que mire `FUENTE`, y no lo suponemos.

**No frena nada.** `roas_paid` se calcula con `REV_PAID` de
`GLD_ECOMM_DAILY_PERFORMANCE`, no con esta vista. Además, el exceso sobre la
venta del sitio, que fue la pregunta 3 del H8, queda explicado: sin las filas
sin estrategia, lo atribuido suma 1 044 063, por debajo de 1 319 462. Esto
importa el día que se arme un ROAS por plataforma sobre esta vista.

## 4 · Lo que no pedimos y apareció

- **`roas` está firmada por «Nombre Apellido»** en `DD_METRIC_CURATION`. Es un
  valor de relleno en una métrica que ya está publicada. Es menor, pero el
  `CURATED_BY` es lo que hace auditable el dato.
- **`spend` tiene `SEMANTIC_DIRECTION` nula.** No lo comparamos con lo que
  había el 3, así que no sabemos si cambió.
- **Permisos.** `SYNAPSE_APP_ROLE` no tiene `SELECT` directo sobre
  `GLD_PRODUCTO_PERFORMANCE`, que es la fuente del mix y del top 10.
  `RL_BT_UA_BI` sí lo tiene, y es el rol con el que el backend consulta UA
  (`docs/AUDITORIA-2026-10-21-keralty-sin-datos.md`). Para Synapse alcanza;
  lo anotamos por si algún día cambia el rol.

## 5 · Lo que sale de acá

| Qué | De quién |
|---|---|
| Pedirle al backend nueve claves en `MetricRegistry`, con el `SELECT` y la cifra de cada una (F6.2 → B6.2). `category_mix` espera a datos | Front · redactado, lo manda el humano |
| La porción nula de `category_mix`: mostrarla o no, y su nombre. La `BASE` sobre qué total | Datos · no frena el pedido, sí esa métrica |
| De dónde sale 477 123,26 | Datos · sin pedir todavía |
| Firmar `roas` | Datos · sin pedir todavía |

**Sobre el candado de F6.2 y B6.2.** El criterio dice «la vista de control de
UA en cero filas para esas claves». Hoy hay 10, y las 10 son
`CLAVE DESCONOCIDA`, que **sólo** desaparece cuando el backend registra la
clave. El mensaje del 3 ya fijaba esa condición: «devuelve 11, que son sólo
las claves desconocidas del backend». El criterio quedó escrito más estricto
de lo que se quería decir. **El humano lo destrabó el 2026-11-09**, y el
pedido es `docs/MENSAJE-2026-11-09-backend-metricas-de-ua.md`.
