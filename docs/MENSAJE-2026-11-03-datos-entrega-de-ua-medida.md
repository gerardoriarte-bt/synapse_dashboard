# Para datos · la entrega de UA del 29, medida · 2026-11-03

**Medido contra `a5a4493` el 2026-11-03**, que es el front: qué familias y qué
formas acepta (`FAMILIAS` y `NOMBRE_DE_FORMA` en `src/api/adapt.ts`). Del lado
de ustedes, Snowflake en sólo lectura el mismo día, con el rol
`RL_BT_UA_TRANSFORM`. Las consultas y su salida literal están en el anexo, al
final, para que puedan volver a correrlas.

**Responde a** `docs/RESPUESTA-2026-10-29-datos-metricas-de-ua.md`, que es su
documento de validación tal como llegó, sin cambios. **Nuestro pedido
original** es `docs/MENSAJE-2026-10-29-datos-metricas-de-ua.md`.

---

## Gracias, y en corto

Gracias por la entrega. Hay avances concretos y medidos: el nCAC ya no
multiplica el gasto, el estado del presupuesto ya cambia según el porcentaje,
existe la vista mensual de productos, y `SYNAPSE_APP_ROLE` puede leer las tres
vistas nuevas.

**Todavía no podemos cargar ninguna de las 11 métricas.** Hay tres motivos, y
los tres se pueden comprobar con una consulta:

1. **Las cifras de validación de septiembre no coinciden con las vistas.**
   Con la fórmula y la fuente que ustedes mismos declaran, el RPV da 0,39 y no
   24,12, y el MER da 11,11 y no 4,15. Detalle en el H1.
2. **Dos de las cinco métricas de la tanda A apuntan a columnas que no
   existen**: `REV_ONSALE` y `CATEGORY_LVL1`. Detalle en el H2.
3. **Las 11 filas del catálogo tienen 42 problemas**, según la vista de
   control de ustedes, `SYNAPSE_METRIC_CATALOG_ISSUES`. 31 son de ustedes y
   11 no lo son. Detalle en el H3.

Además, la corrección 3 y la pregunta ① se respondieron sobre otro tema. Las
volvemos a plantear abajo, con más detalle que la primera vez (H8 y H5).

---

## Cómo leer este documento

Cada hallazgo dice **de dónde sale**, con una de estas tres marcas:

| Marca | Qué quiere decir |
|---|---|
| **Medido** | Lo corrimos nosotros en Snowflake el 2026-11-03. La consulta está en el anexo |
| **Leído en su documento** | Lo dice `RESPUESTA-2026-10-29-datos-metricas-de-ua.md` y no lo comprobamos |
| **No medido** | No lo sabemos. Lo preguntamos |

Para cada hallazgo damos **qué vimos**, **por qué importa** y **una propuesta
de resolución**. Las propuestas son eso: si ustedes conocen una razón para
hacerlo distinto, la decisión es de ustedes y sólo necesitamos que quede
escrita.

---

## Estado de cada entregable

| # | Lo que pedimos | Lo que llegó | Estado |
|---|---|---|---|
| 1 | Una fila por métrica en `SYNAPSE_METRIC_CATALOG`, con las 12 columnas | Las 11 filas existen. Les faltan o tienen mal cargados 9 de los 12 campos | **Parcial** · H3 |
| 2 | La regla de cálculo de cada métrica, con numerador y denominador | Llegó para las 11. Dos apuntan a columnas que no existen, y las cifras de prueba no salen de esas reglas | **Parcial** · H1, H2 |
| 3a | Corregir el nCAC | La multiplicación está corregida. Cambió la cantidad de clientes y no sabemos por qué | **Parcial** · H6 |
| 3b | Corregir `BUDGET_STATUS` | Corregido: el estado ahora varía. Cambió el grano de la vista y siguen los emojis | **Parcial** · H7 |
| 3c | Explicar el ingreso atribuido que supera la venta del sitio | Se respondió otra cosa: nombres de columnas. El problema sigue igual | **Sin respuesta** · H8 |
| 4① | ¿Cuál es la inversión de UA? | Se respondió sobre la recomendación del modelo MMM. En la práctica, las vistas nuevas usan 118 807, pero no está escrito | **Sin respuesta explícita** · H5 |
| 4② | Top 10 mensual | La vista `GLD_PRODUCTO_METRICS_MONTHLY` existe, con 10 filas por mes | **Llegó** · falta una decisión, H10 |
| 4③ | Nivel de categoría para el mix | `CATEGORY_LVL1`, que no existe en la vista indicada | **No se puede usar** · H2 |
| 4④ | Qué es «promoción» | Llegaron tres definiciones posibles, sin elegir una. La regla usa una columna que no existe | **Sin respuesta** · H2 |
| 4⑤ | Ventana del LTV | Desde la primera compra hasta hoy, sin horizonte fijo | **Respondida** · H6 |

---

## Los hallazgos

### H1 · Las cifras de validación de septiembre no salen de las vistas

**Medido.** Sumamos septiembre de 2026 en `GLD_ECOMM_DAILY_PERFORMANCE`, que
es la fuente que su documento declara para estas cinco métricas:

| Suma de septiembre 2026 | Valor |
|---|---|
| `REV_TOTAL` | 1 319 462 |
| `VISITS_TOTAL` | 3 421 532 |
| `ORDERS_TOTAL` | 11 550 |
| `GROSS_SPEND` | 118 807 |
| `REV_PAID` | 795 916 |

Con esas sumas y **las fórmulas de su propio documento**:

| Métrica | Fórmula (de su documento) | Da, con las sumas | Su documento dice |
|---|---|---|---|
| RPV | `REV_TOTAL / VISITS_TOTAL` | **0,39 USD** | 24,12 USD |
| CVR | `ORDERS_TOTAL / VISITS_TOTAL × 100` | **0,338 %** | 0,37 % |
| AOV | `REV_TOTAL / ORDERS_TOTAL` | **114,24 USD** | 95,68 USD |
| MER | `REV_TOTAL / GROSS_SPEND` | **11,11** | 4,15 |
| ROAS paid | `REV_PAID / GROSS_SPEND` | **6,70** | 5,10 |

**Por qué importa:**

- **Sus propias cifras no son compatibles entre sí.** El RPV es siempre el CVR
  por el AOV: 0,37 % × 95,68 = 0,35 USD por visita, no 24,12. Y con el mismo
  denominador, un ROAS calculado sobre el ingreso pagado (5,10) no puede ser
  mayor que un MER calculado sobre el ingreso total (4,15), porque el ingreso
  pagado es una parte del total.
- **El CVR de 0,37 % se parece al que da promediar los días** (el 29 medimos
  0,379 % así), y no al de suma sobre suma (0,338 %), que es la regla que
  ustedes mismos escribieron.
- **No sabemos de dónde salen esas cifras.** Puede ser otro mes, otra vista u
  otra consulta. **No lo suponemos: lo preguntamos.**

**Además:** en la validación de la corrección 3, el resultado
«1,234,567 filas» parece un valor de ejemplo y no una salida real. Lo
mencionamos sólo para pedir lo mismo que en el resto: la salida literal.

**Propuesta:** para cada métrica, mandarnos **la consulta exacta que corrieron
y su salida tal cual**, sin redondear ni pasar a tabla. Si sale distinto de lo
que medimos, comparamos consulta contra consulta y la diferencia aparece sola.

---

### H2 · Dos reglas apuntan a columnas que no existen

**Medido.**

| Métrica | La regla usa | Dónde la busca | Resultado |
|---|---|---|---|
| `promo_dependency` | `REV_ONSALE` | `GLD_ECOMM_DAILY_PERFORMANCE` | **No existe.** La vista tiene 91 columnas y ninguna es `REV_ONSALE` |
| `category_mix` | `CATEGORY_LVL1` | `GLD_PRODUCTO_ANALYTICS` | **No existe:** `invalid identifier 'CATEGORY_LVL1'` |

**Por qué importa:** son dos de las cinco métricas de la tanda A, que era la
que podía salir primero. Sin una columna real, no hay forma de calcularlas.

**Propuesta:**

- **Promo Dependency.** El 2026-10-29 vimos `INGRESOS_ONSALE` y
  `PROMO_DEPENDENCY_PCT` en `GLD_PRODUCTO_METRICS_DAILY`. **No lo volvimos a
  medir hoy.** Si esa es la fuente correcta, que la regla diga
  `SUM(INGRESOS_ONSALE) / SUM(<venta total de esa misma vista>) × 100`, con el
  nombre real de la columna del denominador.
- **Además, falta elegir la definición de «promoción»** (pregunta ④). Su
  documento ofrece tres: el día con `PROMO`, el producto con descuento
  (`DISCOUNT_PCT > 0` o `SALE_PRICE < LIST_PRICE`) y el producto outlet. Dan
  números distintos. **Necesitamos una sola**, escrita en la `BASE`. Nuestra
  sugerencia es la venta de productos con precio rebajado, que es lo que mide
  `INGRESOS_ONSALE`. Pero la decisión es de ustedes.
- **Category Mix.** Que nos digan **el nombre real de la columna** y **en qué
  vista está**. El 29 vimos 130 categorías en
  `GLD_PRODUCTO_METRICS_BY_CATEGORY`, en varios niveles mezclados. Necesitamos
  un nivel que dé pocas categorías, idealmente menos de 10, y **la cantidad
  medida**, no estimada. Su documento dice «resultado esperado: ~5-10
  categorías», que no es una medición.

---

### H3 · Las 11 filas del catálogo tienen 42 problemas, y 31 son de ustedes

**Medido.** `SYNAPSE_METRIC_CATALOG` tiene 27 filas: las 16 que ya estaban
más las 11 nuevas. La vista de control de ustedes,
`SYNAPSE_METRIC_CATALOG_ISSUES`, devuelve **42 filas**, todas sobre las 11
nuevas:

| Problema que marca la vista | Filas | Qué pasa en la consola | ¿De quién? |
|---|---|---|---|
| `SHAPE` desconocida: `ratio` (×7), `cumulative` (×1), `distribution` (×1) | 9 | El panel falla al calcularse | **Datos** |
| `FAMILY` desconocida: `EFFICIENCY`, `CONVERSION`, `REVENUE`, `MIX`, `BUDGET`, `CUSTOMER` | 11 | El gráfico se pinta sin color, y sin dar error | **Datos** |
| Sin `CURATED_BY` | 11 | El dato no es auditable: no se sabe quién lo firmó | **Datos** |
| Clave desconocida en `MetricRegistry` | 11 | El panel sale bloqueado | **Backend · no es de ustedes** |

**Lo último no es un pedido para ustedes.** Que el backend no conozca la clave
es esperable: cada métrica nueva necesita su entrada en el código del backend.
Eso lo pedimos nosotros **cuando las filas y las reglas estén cerradas**, para
no hacerlos programar sobre números que van a cambiar.

**Hay campos que la vista de control no revisa, pero que se ven en
pantalla**:

| Campo | Cómo llegó en las 11 | Qué hace falta | Ejemplo de una fila que ya está bien |
|---|---|---|---|
| `UNIT` | Vacío en las 11 | `USD`, `%`, `x`, o vacío **sólo** si de verdad no tiene unidad | `revenue` → `USD` |
| `DIMENSIONS` | Vacío en las 11 | Un arreglo JSON, aunque sea `[]` | `inventory_forecast` → `["CATEGORIA"]` |
| `MEASUREMENT_WINDOW` | `month` o `LIFETIME` | **Texto que se lee en pantalla** | `revenue` → «Mes calendario seleccionado» |
| `SOURCE` | El nombre de la tabla | **Texto que se lee en pantalla**: de dónde viene el dato, en palabras | `revenue` → «Reporte diario de ecommerce del cliente · venta medida por Adobe Analytics» |
| `BASE` | Una fórmula, como `Revenue Total / Orders Total` | **Texto en pantalla**: el denominador y la ventana, dichos en una frase | `revenue` → «Venta total del sitio medida por Adobe Analytics, en USD, sumada sobre los días del mes» |
| `SEMANTIC_DIRECTION` | Vacío en `budget_status` y `category_mix` | `—` si no tiene dirección | `spend` → `—` |
| `NAME` | Sigla y nombre en inglés: «RPV - Revenue Per Visit Total» | El título del panel, **en español**, que es el idioma del catálogo de UA | `revenue` → «Ingresos» |

**Por qué importa:** `NAME`, `BASE`, `SOURCE`, `MEASUREMENT_WINDOW` y
`SEMANTIC_DIRECTION` **se muestran tal cual al usuario**. El front no los
traduce ni los redacta, porque quien conoce el dato es quien debe
describirlo. Esto está explicado en `docs/snowflake/COMO-ENTREGAR-UNA-METRICA.md`,
§2.

**Valores que acepta el front, medidos en `a5a4493`:**

- **`FAMILY`** (en minúscula): `demand`, `media`, `inventory`, `customer` y
  `external`. No hay otras. Cada familia tiene su rampa de color, y una que no
  existe se pinta sin color.
- **`SHAPE`**: `scalar`, `scalar_with_interval`, `time_series`,
  `series_with_band`, `multi_series`, `categorical`, `compared_categorical`,
  `composition`, `distribution`, `matrix`, `ranking`, `tabular` y `prose`.
  **`ratio` y `cumulative` no existen**: un ratio del mes es un `scalar` con
  unidad, y un acumulado es una `time_series`. **`distribution` sí existe**,
  aunque la vista de control la marque. Su vista y el front no coinciden, y
  eso no lo sabemos explicar. Igual, no es la forma de `category_mix`: ver la
  tabla de abajo.

**Propuesta de las 11 filas.** Es para corregir, no para copiar: donde
ustedes sepan algo mejor, gana lo de ustedes. Las claves son las suyas;
**nos sirven y no hace falta cambiarlas**.

| METRIC_KEY | SHAPE | FAMILY | UNIT | SEMANTIC_DIRECTION | MIN_GRAIN | Comentario |
|---|---|---|---|---|---|---|
| `rpv_total` | `scalar` | `demand` | `USD` | `HIGHER = BETTER` | `day` | |
| `cvr_total` | `scalar` | `demand` | `%` | `HIGHER = BETTER` | `day` | |
| `aov_total` | `scalar` | `demand` | `USD` | `HIGHER = BETTER` | `day` | |
| `promo_dependency` | `scalar` | `demand` | `%` | `LOWER = BETTER` | `day` | Depende del H2 |
| `category_mix` | `composition` | `demand` | `%` | `—` | `day` | Las partes suman 100 %, por eso es `composition` y no `distribution`. Depende del H2 |
| `mer_total` | `scalar` | `media` | `x` | `HIGHER = BETTER` | `day` | **Ver H4: puede sobrar** |
| `roas_paid` | `scalar` | `media` | `x` | `HIGHER = BETTER` | `day` | Ver H5 |
| `top_10_productos` | `ranking` | `demand` | `USD` | `HIGHER = BETTER` | `month` | Ver H10 |
| `budget_status` | `scalar` | `media` | `%` | `—` | `month` | Ver H7: proponemos publicar el porcentaje, no el semáforo |
| `ncac_registrados` | `time_series` o `scalar` | `customer` | `USD` | `LOWER = BETTER` | `month` | Ver H6 |
| `ltv_registrados` | `scalar` | `customer` | `USD` | `HIGHER = BETTER` | `month` | Ver H6 |

**Cómo comprobamos que quedó:** `SELECT COUNT(*) FROM SYNAPSE_METRIC_CATALOG_ISSUES`
devuelve **11**, que son sólo las claves desconocidas del backend, y en las 11
filas `UNIT`, `DIMENSIONS`, `SOURCE`, `BASE` y `MEASUREMENT_WINDOW` están en
texto.

---

### H4 · `mer_total` es la misma métrica que el `roas` que ya está en la consola

**Medido.** En el catálogo, las dos filas dicen esto:

| Clave | `BASE` | Fuente | Septiembre |
|---|---|---|---|
| `roas` (ya publicada) | «venta total del mes sobre inversión bruta del mismo mes» | Reporte diario de ecommerce | 11,11 |
| `mer_total` (nueva) | `Revenue Total / Gross Spend` | `GLD_ECOMM_DAILY_PERFORMANCE` | 11,11 |

Las dos dividen la misma venta por la misma inversión, sacadas de la misma
fuente.

**Por qué importa:** la consola mostraría dos paneles con nombres distintos y
el mismo número, y quien los vea va a preguntar en qué se diferencian. La
respuesta sería «en nada».

**Propuesta:** quedarse con una sola. Lo más simple es **retirar `mer_total`**
(con `IS_ACTIVE = FALSE` en `DD_METRIC_CURATION`) y, si el negocio prefiere
llamarla MER, **renombrar el `NAME` de `roas`**. La clave se puede mantener.
Lo decide producto con ustedes; sólo pedimos que no queden las dos.

---

### H5 · ¿Cuál es la inversión? Las vistas ya eligieron una, pero no está escrito

**Medido.** La pregunta ① era: en septiembre, ¿la inversión de UA es
**254 788** (`GLD_PAID_MEDIA`, consolidada) o **118 807** (`GROSS_SPEND`)?
Hoy pasa esto:

- **`GLD_CUSTOMER_METRICS_COHORT`** toma el costo de `GROSS_SPEND`
  (`SUM(GROSS_SPEND)` en `costos_mes`, lo vimos en su DDL). El nCAC de
  septiembre, 27,86, es exactamente 118 807 / 4 264.
- **`mer_total` y `roas_paid`** también dividen por `GROSS_SPEND`.
- **`GLD_PAID_MEDIA_METRICS_DAILY`** sigue sumando **254 788** de costo en
  septiembre (107 023 de BRAND más 147 765 de PERFORMANCE).

**Su documento respondió otra pregunta**: cuál es la inversión recomendada por
el modelo MMM, en `GLD_MEDIA_RECOMMENDATION`. **No encontramos ese objeto**:
no hay vista ni tabla con ese nombre en `DB_BT_UA.BT_UA_MART_ANALYTICS`. No
buscamos en otros esquemas.

**Por qué importa:** en la práctica, todas las métricas nuevas ya eligieron
118 807, y eso puede estar bien. Pero hay **una segunda fuente de costo que da
más del doble**, y nadie escribió qué mide cada una. Si en un mes alguien
compara el nCAC contra el costo de paid media, los números no van a cerrar.

**Lo que necesitamos, en tres respuestas cortas:**

1. **¿118 807 (`GROSS_SPEND`) es la inversión de UA?** Sí o no.
2. **¿Qué es 254 788?** ¿Por qué es 2,1 veces mayor? ¿Suma fuentes que se
   pisan, incluye otra moneda, otra ventana u otras marcas?
3. **¿`GROSS_SPEND` incluye el fee de agencia?** La `BASE` de `spend` dice que
   sí: «incluye el costo de las plataformas más la parte no desglosada por
   plataforma (fee de agencia)». Si es así, el nCAC y el ROAS lo incluyen, y
   eso tiene que estar escrito en sus `BASE`.

---

### H6 · nCAC y LTV: la cuenta ya está bien, pero cambió la base y no sabemos por qué

**Lo que está bien (medido):** el costo ya no se multiplica por la cantidad
de clientes. La vista agrega el costo por mes **antes** del join, que es la
corrección que pedimos.

| Cohorte | Clientes nuevos | nCAC | LTV/CAC |
|---|---|---|---|
| 2026-06 | 2 212 | 45,12 | 3,00 |
| 2026-07 | 2 677 | 31,69 | 3,77 |
| 2026-08 | 3 287 | 21,85 | 5,19 |
| 2026-09 | 4 264 | 27,86 | 4,40 |
| 2026-10 | 2 214 | 25,26 | 4,28 |
| 2026-11 | 61 | 62,79 | 1,55 |

**Lo que cambió y no sabemos por qué:**

1. **Los clientes nuevos de septiembre pasaron de 8 287 a 4 264.** El 29
   medimos 8 287 en esta misma vista, y hoy son 4 264. La vista nueva cuenta un
   cliente por `C11_ID_DE_CLIENTE`, con fecha desde 2023 y
   `ORDENES_VENDIDAS > 0`, en `RAW_UA_BT_MX_VENTAS_POR_PLATAFORMA_ID_CLIENTE`
   (lo leímos en el DDL). **No conocemos la definición anterior**, así que no
   sabemos cuál de las dos es la correcta. **Pregunta:** ¿qué cambió en la
   definición de «cliente nuevo», y cuál vale?
2. **El «rango esperado $27-30» de su documento no es lo que escribimos
   nosotros.** Nuestro mensaje decía «≈ 30,7», que era 254 788 / 8 287, la
   cuenta con la otra inversión y la otra cantidad de clientes. Que el
   resultado nuevo caiga en ese rango no confirma nada: cambiaron el
   numerador y el denominador a la vez.
3. **El numerador y el denominador miden poblaciones distintas.** El costo es
   **todo** el gasto del mes, que también trae clientes sin ID registrado y
   compras repetidas. El denominador son **sólo** los clientes nuevos
   registrados, que según su documento son el 71 % de las órdenes. Así, el
   nCAC queda más alto que el real. **No es un error** si se dice, pero tiene
   que estar en la `BASE`. Por ejemplo: «Inversión bruta del mes dividida por
   los clientes nuevos con ID registrado (≈ 71 % de las órdenes). Sobreestima
   el costo por cliente».
4. **La vista incluye el mes en curso.** Hoy, la cohorte de noviembre tiene
   61 clientes y un nCAC de 62,79. La consola maneja el mes abierto con su
   propio aviso, así que esto **no es un pedido**. Lo anotamos para que nadie
   lea ese 62,79 como una alarma.

**LTV (pregunta ⑤): respondida**, y la definición nos sirve. Es acumulado desde
la primera compra hasta hoy, sin horizonte fijo. **Una consecuencia que
conviene escribir:** una cohorte de 2023 lleva tres años comprando y una de
septiembre lleva dos meses, así que **sus LTV no se comparan entre sí**. Lo
mismo pasa con el LTV/CAC. Propuesta para la `MEASUREMENT_WINDOW`: «Acumulado
desde la primera compra hasta hoy · no comparable entre cohortes de distinta
antigüedad».

---

### H7 · El estado del presupuesto ya funciona, pero cambió de grano y sigue con emojis

**Lo que está bien (medido):** el estado ya no dice «ON TRACK» en todas las
filas:

| `BUDGET_STATUS` | Filas |
|---|---|
| 🟢 ON TRACK | 28 |
| 🟡 MONITOR (UNDERSPEND) | 5 |
| 🟡 MONITOR (OVERSPEND) | 4 |
| 🔴 OFF TRACK (UNDERSPEND) | 7 |
| 🔴 OFF TRACK (OVERSPEND) | 3 |
| ⚪ NO DATA | 25 |

**Lo que cambió y no sabemos por qué:**

1. **La vista pasó de 245 filas a 72.** El 29 tenía una fila por campaña y por
   mes, y venía del presupuesto de BRAND (`GLD_BRAND_BUDGET`). Hoy tiene una
   fila por mes, sin campaña. **No vimos el DDL nuevo.** **Pregunta:** ¿qué
   presupuesto es `PLANNED_BUDGET` ahora? ¿Sigue siendo sólo BRAND, o es el
   total de UA? Si es sólo BRAND, el nombre de la métrica tiene que decirlo.
2. **Hay 25 meses sin dato** (`⚪ NO DATA`). ¿Son meses sin presupuesto
   cargado, o meses en los que falta la fuente?

**Lo que pedimos el 29 y sigue igual:** los emojis. **La consola no puede
mostrar 🟢🟡🔴**: las reglas de diseño prohíben que el color exprese un
juicio, y prohíben el amarillo y el ámbar. Si el estado llega con emoji, el
front tendría que limpiarlo, y no lo hacemos, porque es copy de ustedes.

**Propuesta:** que la métrica sea **el porcentaje ejecutado**, no el
semáforo:

- `budget_status` (o una clave nueva, como `budget_pacing`) con
  `SHAPE = scalar`, `UNIT = %` y el valor de `PCT_SPENT`.
- La consola lo dibuja contra el 100 % como objetivo, y quien mira ve si se
  pasó o le falta.
- Si igual quieren el estado en texto, **sin emoji**: `EN LÍNEA`,
  `SUBEJECUCIÓN` o `SOBREEJECUCIÓN`.

**Un detalle menor de la regla:** los cortes `BETWEEN 80 AND 89.99` y
`BETWEEN 110.01 AND 120` dejan huecos. Un 89,995 % no cae en ningún tramo y
termina en `NO DATA`. Se resuelve con `>=` y `<`, por ejemplo
`PCT_SPENT >= 80 AND PCT_SPENT < 90`.

---

### H8 · El ingreso atribuido a medios sigue superando la venta del sitio

**Medido, y está igual que el 29.**

| Septiembre 2026 · `GLD_PAID_MEDIA_METRICS_DAILY` | Costo | Ingreso atribuido |
|---|---|---|
| PERFORMANCE | 147 765 | 1 004 014 |
| BRAND | 107 023 | 48 362 |
| **Sin `SCOPE_STRATEGY`** | **sin costo** | **483 494** |
| Total | 254 788 | **1 535 869** |

La venta total del sitio en el mismo mes es **1 319 462**. **Lo atribuido a
medios supera todo lo vendido.**

**Su respuesta a la corrección 3 trató otro tema:** que `INGRESOS_USD` y
`DATE` se llaman así y no `INGRESOS` y `FECHA`. Eso está bien, pero no era lo
que preguntamos. Lo planteamos de nuevo, más concreto:

1. **¿De dónde salen los 483 494 sin estrategia y sin costo?** ¿Qué
   plataforma o fuente los trae?
2. **¿Deben entrar en el ROAS?** Con ellos, el ROAS de paid media da **6,03**;
   sin ellos, **4,13**.
3. **¿Por qué la suma atribuida supera la venta?** Con last-click, cada orden
   debería contarse una sola vez. ¿Hay órdenes atribuidas en más de una
   plataforma, o ventanas de atribución distintas?

**Por qué importa:** si `roas_paid` o cualquier ROAS por plataforma se arma
sobre esta vista, el número sale inflado y no hay forma de saberlo desde la
consola.

**Propuesta:** como mínimo, **excluir las filas sin estrategia** hasta saber
qué son, y **escribir en la `BASE`** que la atribución puede contar dos veces
la misma orden si eso se confirma.

---

### H9 · `GLD_MEDIA_RECOMMENDATION` no aparece, y ya hay una métrica que la usa

**Medido.** No hay vista ni tabla `GLD_MEDIA_RECOMMENDATION` en
`DB_BT_UA.BT_UA_MART_ANALYTICS`. **No buscamos en otros esquemas.** La fila
`media_roas_recommendation`, que estaba en el catálogo antes de esta entrega,
dice que se calcula «sobre `GLD_MEDIA_RECOMMENDATION`».

**Pregunta:** ¿está en otro esquema, cambió de nombre, o falta crearla?

---

### H10 · Top 10: la vista existe, y hay que decidir qué se muestra

**Medido:** `GLD_PRODUCTO_METRICS_MONTHLY` tiene **10 filas por mes**, de julio
a noviembre de 2026, con `RANK`, `PRODUCT_NAME`, `PRODUCT_ID`,
`INGRESOS_MES_USD`, `UNIDADES_MES`, `ORDENES_MES` y `PRECIO_PROMEDIO_USD`.
`SYNAPSE_APP_ROLE` puede leerla.

**Leído en su documento, no medido:** el puesto 1 de septiembre es
**«Unspecified»**, con 111 116 USD, casi tres veces el segundo.

**Dos cosas para decidir:**

1. **¿Ranking o concentración?** Nosotros habíamos propuesto
   `top10_concentration`: qué porcentaje de la venta del mes se llevan los 10
   productos que más venden. Ustedes entregaron el ranking. **Los dos sirven y
   la consola sabe dibujar ranking.** Sólo hay que decidir cuál, o si van los
   dos.
2. **«Unspecified».** Si es venta sin producto identificado, no es un
   producto, y en un ranking desplaza a los demás. **Pregunta:** ¿qué es, y
   debería quedar fuera del ranking?

**Un detalle:** su documento dice que el filtro es `RANKING_INGRESOS <= 10`,
pero la columna se llama `RANK`. Lo mencionamos sólo para que la regla
escrita coincida con la vista.

---

## Lo que necesitamos, todo junto

Repetimos los dos tramos del 29. **Ninguna métrica pasa sin sus dos
comprobaciones:** la fila del catálogo limpia y la cifra de septiembre igual a
la nuestra.

### Tanda A · RPV, CVR, AOV, Promo Dependency y Category Mix

| # | Qué | Cómo comprobamos que llegó |
|---|---|---|
| A1 | La consulta y la salida literal de septiembre 2026 de las cinco (H1) | Corremos la misma consulta y da lo mismo |
| A2 | La columna real de la venta rebajada, y **una** definición de «promoción» (H2) | La columna existe y la `BASE` dice qué es promoción |
| A3 | La columna real y la vista del nivel de categoría, con la cantidad de categorías medida (H2) | `COUNT(DISTINCT <columna>)` da lo que dicen |
| A4 | Las cinco filas del catálogo corregidas (H3) | La vista de control no marca nada de datos en esas cinco claves |

### Tanda B · MER, ROAS, top 10, presupuesto, nCAC y LTV

| # | Qué | Cómo comprobamos que llegó |
|---|---|---|
| B1 | La inversión de UA, dicha explícitamente, y qué es la otra (H5) | Tres respuestas escritas |
| B2 | Qué hacer con `mer_total`, que duplica a `roas` (H4) | Una de las dos queda inactiva o con otro nombre |
| B3 | Por qué cambió la cantidad de clientes nuevos, y cuál vale (H6) | La definición, escrita en la `BASE` del nCAC |
| B4 | Qué presupuesto mide la vista mensual, el porcentaje como métrica y sin emojis (H7) | La fila del catálogo y `SELECT DISTINCT BUDGET_STATUS` sin emoji, si queda |
| B5 | El ingreso atribuido sin estrategia: de dónde sale y si entra en el ROAS (H8) | Una respuesta escrita, y la vista filtrada si corresponde |
| B6 | Ranking o concentración, y qué hacer con «Unspecified» (H10) | Una decisión escrita |
| B7 | Dónde está `GLD_MEDIA_RECOMMENDATION` (H9) | El nombre completo del objeto |
| B8 | Las seis filas del catálogo corregidas (H3) | Lo mismo que A4 |

**Cuando llegue cada tanda, lo nuestro:** verificamos con las consultas del
anexo, le pedimos al backend que programe esas claves y armamos los paneles.
**Ustedes no tienen que escribir nada de la consola.**

---

## Lo que ya está bien, para no volver a tocarlo

- **Permisos:** `SYNAPSE_APP_ROLE` tiene `SELECT` sobre
  `GLD_CUSTOMER_METRICS_COHORT`, `GLD_BUDGET_EXECUTION_MONTHLY` y
  `GLD_PRODUCTO_METRICS_MONTHLY`.
- **La aritmética del nCAC:** el costo se suma una vez por mes.
- **El estado del presupuesto:** varía según el porcentaje.
- **La vista mensual de productos:** existe, con 10 filas por mes.
- **La ventana del LTV:** está definida.
- **Las claves:** las de ustedes sirven tal como están.

## Lo que no medimos

- La definición anterior de «cliente nuevo» del nCAC (H6).
- El DDL nuevo de `GLD_BUDGET_EXECUTION_MONTHLY` (H7).
- El contenido del top 10 y la fila «Unspecified»: lo tomamos de su
  documento (H10).
- Otros esquemas, al buscar `GLD_MEDIA_RECOMMENDATION` (H9).
- Si `INGRESOS_ONSALE` sigue en `GLD_PRODUCTO_METRICS_DAILY`: lo vimos el 29
  y no hoy (H2).
- El notebook y los otros cinco documentos que menciona su validación. No
  llegaron al repositorio, así que no los leímos.

---

## Anexo · las consultas y su salida

Corridas el 2026-11-03 con `RL_BT_UA_TRANSFORM`, en sólo lectura. Las salidas
están copiadas tal cual; sólo las acortamos donde se indica.

```sql
-- Q1 · el catálogo (27 filas; acá sólo las 11 nuevas, columnas abreviadas)
SELECT * FROM DB_BT_UA.BT_UA_MART_ANALYTICS.SYNAPSE_METRIC_CATALOG ORDER BY METRIC_KEY;
```
```
METRIC_KEY,NAME,SHAPE,FAMILY,LAYER,SOURCE,BASE,UNIT,SEMANTIC_DIRECTION,MIN_GRAIN,DIMENSIONS,MEASUREMENT_WINDOW
aov_total,AOV - Average Order Value,ratio,REVENUE,GOLD,GLD_ECOMM_DAILY_PERFORMANCE,Revenue Total / Orders Total,None,HIGHER = BETTER,day,None,month
budget_status,Budget Pacing Status - Semáforo de Presupuesto,categorical,BUDGET,GOLD,GLD_BUDGET_EXECUTION_MONTHLY,Semáforo basado en PCT_SPENT: 90-110% ON TRACK,None,None,month,None,month
category_mix,Category Mix - Mix de Categorías,distribution,MIX,GOLD,GLD_PRODUCTO_ANALYTICS,Distribución % de ingresos por CATEGORY_LVL1,None,None,day,None,month
cvr_total,CVR - Conversion Rate Total,ratio,CONVERSION,GOLD,GLD_ECOMM_DAILY_PERFORMANCE,(Orders Total / Visits Total) × 100,None,HIGHER = BETTER,day,None,month
ltv_registrados,LTV - Lifetime Value (Registrados),cumulative,CUSTOMER,GOLD,GLD_CUSTOMER_METRICS_COHORT,"Revenue acumulado LIFETIME desde cohorte (73% revenue, 10x recurrencia)",None,HIGHER = BETTER,month,None,LIFETIME
mer_total,MER - Marketing Efficiency Ratio Total,ratio,EFFICIENCY,GOLD,GLD_ECOMM_DAILY_PERFORMANCE,Revenue Total / Gross Spend,None,HIGHER = BETTER,day,None,month
ncac_registrados,nCAC - New Customer Acquisition Cost (Registrados),ratio,CUSTOMER,GOLD,GLD_CUSTOMER_METRICS_COHORT,Cost Total Mes / Nuevos Clientes Registrados (71% órdenes),None,LOWER = BETTER,month,None,month
promo_dependency,Promo Dependency - Dependencia de Promociones,ratio,MIX,GOLD,GLD_ECOMM_DAILY_PERFORMANCE,(Revenue OnSale / Revenue Total) × 100,None,LOWER = BETTER,day,None,month
roas_paid,ROAS - Return on Ad Spend (Paid),ratio,EFFICIENCY,GOLD,GLD_ECOMM_DAILY_PERFORMANCE,Revenue Paid / Gross Spend,None,HIGHER = BETTER,day,None,month
rpv_total,RPV - Revenue Per Visit Total,ratio,EFFICIENCY,GOLD,GLD_ECOMM_DAILY_PERFORMANCE,Revenue Total / Visits Total,None,HIGHER = BETTER,day,None,month
top_10_productos,Top 10 Productos - Ranking Mensual,ranking,REVENUE,GOLD,GLD_PRODUCTO_METRICS_MONTHLY,Top 10 productos por Revenue con RANK mensual,None,HIGHER = BETTER,month,None,month
```

```sql
-- Q2 · la vista de control
SELECT COUNT(*) FROM DB_BT_UA.BT_UA_MART_ANALYTICS.SYNAPSE_METRIC_CATALOG_ISSUES;
-- 42
-- Q3 · agrupado por tipo de problema (las 42 filas están en la salida completa)
--   SHAPE ............. 9   (ratio ×7, cumulative ×1, distribution ×1)
--   FAMILY ........... 11
--   SIN FIRMA ........ 11   (falta CURATED_BY)
--   CLAVE DESCONOCIDA  11   (MetricRegistry · backend)
```

```sql
-- Q5 · nCAC por cohorte
SELECT MES_COHORTE, NUEVOS_CLIENTES_COHORTE, NCAC_USD, RATIO_LTV_CAC
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_METRICS_COHORT
WHERE MES_COHORTE >= '2026-06-01' ORDER BY MES_COHORTE;
```
```
2026-06-01,2212,45.122514,2.999741181752
2026-07-01,2677,31.691072,3.769425262105
2026-08-01,3287,21.852145,5.186320888865
2026-09-01,4264,27.862805,4.399983820007
2026-10-01,2214,25.264679,4.282915885454
2026-11-01,61,62.786885,1.549634470798
```

```sql
-- Q6 · DDL de la cohorte (fragmento: de dónde sale el costo y quién es cliente nuevo)
SELECT GET_DDL('VIEW','DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_METRICS_COHORT');
```
```
WITH costos_mes AS (
    SELECT DATE_TRUNC('month', DATE) AS MES, SUM(GROSS_SPEND) AS COSTO_MES_TOTAL
    FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE
    WHERE DATE >= '2023-01-01' GROUP BY 1
),
clientes_raw AS (
    SELECT DISTINCT C11_ID_DE_CLIENTE AS ID_CLIENTE, FECHA
    FROM DB_BT_UA.BT_UA_RAW_INGEST.RAW_UA_BT_MX_VENTAS_POR_PLATAFORMA_ID_CLIENTE
    WHERE C11_ID_DE_CLIENTE IS NOT NULL AND C11_ID_DE_CLIENTE != '' AND C11_ID_DE_CLIENTE != 'NULL'
      AND FECHA >= '2023-01-01' AND ORDENES_VENDIDAS > 0
),
cohortes AS (
    SELECT ID_CLIENTE, DATE_TRUNC('month', MIN(FECHA)) AS MES_COHORTE FROM clientes_raw GROUP BY 1
),
...
```

```sql
-- Q7 y Q8 · estado del presupuesto
SELECT BUDGET_STATUS, COUNT(*) FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_BUDGET_EXECUTION_MONTHLY GROUP BY 1 ORDER BY 1;
```
```
⚪ NO DATA,25
🔴 OFF TRACK (OVERSPEND),3
🔴 OFF TRACK (UNDERSPEND),7
🟡 MONITOR (OVERSPEND),4
🟡 MONITOR (UNDERSPEND),5
🟢 ON TRACK,28
```
```sql
SELECT COUNT(*), COUNT_IF(PCT_SPENT > 110), COUNT_IF(PCT_SPENT < 90), MAX(PCT_SPENT)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_BUDGET_EXECUTION_MONTHLY;
-- 72 · 7 · 12 · 158.355000
-- Columnas: MES, PLANNED_BUDGET, ACTUAL_SPEND, PCT_SPENT, BUDGET_STATUS, OVERSPEND_AMOUNT, REMAINING_BUDGET
```

```sql
-- Q10 · REV_ONSALE no está entre las 91 columnas de GLD_ECOMM_DAILY_PERFORMANCE
DESCRIBE VIEW DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE;
-- Q11 · septiembre 2026 (sin REV_ONSALE, que no existe)
SELECT SUM(REV_TOTAL), SUM(VISITS_TOTAL), SUM(ORDERS_TOTAL), SUM(GROSS_SPEND), SUM(REV_PAID)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE
WHERE DATE BETWEEN '2026-09-01' AND '2026-09-30';
-- 1319462 · 3421532 · 11550 · 118807 · 795916
```

```sql
-- Q12 · ingreso atribuido por estrategia, septiembre 2026
SELECT SCOPE_STRATEGY, SUM(COST_USD), SUM(INGRESOS_USD)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PAID_MEDIA_METRICS_DAILY
WHERE DATE BETWEEN '2026-09-01' AND '2026-09-30' GROUP BY 1 ORDER BY 1;
```
```
BRAND,107022.8621,48361.80
PERFORMANCE,147765.4256,1004013.63
None,NULL,483494.01
```

```sql
-- Q14 · top 10 mensual
SELECT MES, COUNT(*) FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PRODUCTO_METRICS_MONTHLY
WHERE MES >= '2026-07-01' GROUP BY 1 ORDER BY 1;
-- 2026-07-01,10 · 2026-08-01,10 · 2026-09-01,10 · 2026-10-01,10 · 2026-11-01,10
```

```sql
-- Q15 · nivel de categoría
SELECT COUNT(DISTINCT CATEGORY_LVL1), COUNT(DISTINCT DIVISION), COUNT(DISTINCT SILHOUETTE)
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PRODUCTO_ANALYTICS;
-- SQL compilation error: error line 1 at position 22 · invalid identifier 'CATEGORY_LVL1'
```

```sql
-- Q16 · la vista de recomendación
SHOW VIEWS  LIKE 'GLD_MEDIA_RECOMMENDATION' IN SCHEMA DB_BT_UA.BT_UA_MART_ANALYTICS;   -- 0 filas
SHOW TABLES LIKE 'GLD_MEDIA_RECOMMENDATION' IN SCHEMA DB_BT_UA.BT_UA_MART_ANALYTICS;   -- 0 filas
```

```sql
-- Q17 · permisos: SYNAPSE_APP_ROLE tiene SELECT en las tres
SHOW GRANTS ON VIEW DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_METRICS_COHORT;
SHOW GRANTS ON VIEW DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_BUDGET_EXECUTION_MONTHLY;
SHOW GRANTS ON VIEW DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PRODUCTO_METRICS_MONTHLY;
```
