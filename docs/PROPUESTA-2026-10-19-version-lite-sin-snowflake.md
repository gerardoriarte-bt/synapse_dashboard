# Propuesta · una versión lite de Synapse, sin Snowflake · 2026-10-19

> **Propuesta abierta.** No es una tarea ni un pedido. La deciden producto —para
> qué es la versión lite— y backend —que es quien la construiría—. El front no
> escribe en su repositorio.

**Qué se midió de nuestro lado.** El código del backend en `3651d70`, leído el
2026-10-19 con `git show` sin moverles el checkout: `ports/snowflake_sql.go`,
`ports/dd_materializer.go`, `ports/dd_prose.go`, `dashboard/snowflake/queries.go`,
`dashboard/snowflake/schema.go`, `dashboard/snowflake/tables.go`,
`services/dd_materializer_service.go`, `services/dd_prose_generator.go`,
`services/dd_chat_prompt.go` y `services/dd_catalog_sync_service.go`. Del front,
el cable de consola y el adaptador.

**Lo que NO se midió.** La definición de la vista semántica que usa el agente de
UA: vive dentro de Snowflake y no está en ningún repositorio. Tampoco se midió
cuánto cuesta en horas: eso lo estima backend.

---

## 1 · La respuesta corta

**Es posible, y el front no cambia.** La consola nunca habla con Snowflake: lee
`dd_panel_data` de Postgres a través del batch de paneles (B2.3), y el chat le
habla al backend, no a Cortex. Todo lo que toca Snowflake está detrás de la API.

Lo que hay que cambiar está en el backend, y son cuatro piezas: **de dónde sale el
dato, dónde vive la fórmula, quién redacta la prosa y quién contesta el chat.**

## 2 · Dónde está Snowflake hoy

| Pieza | Qué hace con Snowflake | Dónde, en `3651d70` |
|---|---|---|
| **El catálogo** | `sync-catalog` lee la vista `SYNAPSE_METRIC_CATALOG` y llena `dd_catalog_metrics` | `dd_catalog_sync_service.go` · las columnas que lee están en `CatalogViewColumns`, en `schema.go` |
| **Las fórmulas** | **Están escritas en Go**, no en el catálogo: `MetricRegistry` tiene 18 claves, y cada una arma su SQL con `BuildSQL` o comparte `KPISQL` | `queries.go` |
| **El dato** | El materializador corre ese SQL con la SQL API de Snowflake y guarda el resultado en `dd_panel_data` | `dd_materializer_service.go`, sobre `SnowflakeSQLClient` |
| **La prosa** | El resumen y las decisiones los redacta el agente de Cortex con las cifras ya materializadas | `dd_prose_generator.go`, sobre `CortexClient` |
| **El chat** | Cortex Agents contesta y escribe su propio SQL sobre las vistas semánticas del agente | `dd_chat_prompt.go` le pasa al agente **los nombres** de las vistas; la **definición** está en Snowflake |
| **`schema-check`** | Comprueba que las tablas y columnas existan | `schema.go` · `MetricColumnUsage` |

**Dos hechos de esa tabla deciden el diseño:**

1. **Las interfaces dicen Snowflake en la firma.** `SnowflakeSQLClient.Query` recibe
   un `domain.SnowflakeAgentConfig` y un JWT, y `DDProseGenerator.Generate`
   también. No hay un puerto neutro detrás del cual cambiar la fuente. Eso hay
   que crearlo, y es el cambio central.
2. **El SQL es casi estándar.** En `queries.go` lo propio de Snowflake es
   `DATEADD` (2 usos), `TO_DATE` (4), `TO_VARCHAR` (3) y los parámetros `?`.
   `DATE_TRUNC` y `NULLIF` existen igual en Postgres. Portarlo son pocas líneas
   por consulta, no una reescritura.

## 3 · Tres niveles, de menos a más

| Nivel | Qué es | Estado |
|---|---|---|
| **1 · Demo sin backend** | `npm run dev:mock`: el front contra un servicio falso | **Existe.** El dato es inventado y se pierde al recargar |
| **2 · Local con la semilla** | Postgres en Docker con el binario del backend · `dev/postgres/README.md` | **Existe.** Un cliente sin credenciales de Snowflake ve la maqueta sembrada; la auditoría del 2026-10-14 lo midió con `3651d70`. Funcionan la consola, administración y el builder. **El chat no**: sin agente contesta 409 |
| **3 · Lite con dato propio** | Postgres como fuente, con detalle real del cliente | **Es lo que propone este documento** |

El nivel 2 alcanza para **mostrar** el producto. El nivel 3 hace falta para que
alguien lo **use con sus datos**.

## 4 · El dato: desglosado, y la métrica se calcula

**Se guarda el detalle y la métrica se calcula con SQL.** No hay una tabla por
métrica. El cálculo guardado ya existe y se queda donde está: es `dd_panel_data`.

| Capa | Qué guarda | Equivalente hoy |
|---|---|---|
| **Detalle** | Hechos diarios por dimensión, sólo cifras aditivas | Las tablas Gold |
| **Catálogo** | Una fila por métrica: fórmula, BASE, ventana, unidad, familia | La vista del catálogo + `MetricRegistry` |
| **Materializado** | El resultado por métrica y período | `dd_panel_data`, sin cambios |

### El esquema de detalle no hay que inventarlo

`schema.go` ya declara qué columnas pide cada métrica. Las tablas de la versión
lite son ésas:

| Tabla | Columnas | Métricas que la usan |
|---|---|---|
| **Ecommerce diario** | `DATE`, `REV_TOTAL`, `REV_TARGET`, `ORDERS_TOTAL`, `ORDERS_TARGET`, `UNITS_TOTAL`, `UNITS_TARGET`, `VISITS_TOTAL`, `VISITS_TARGET`, `GROSS_SPEND`, `BUDGET_TARGET`, más `ATC_TOTAL` para el embudo | Los seis KPI, `goal_attainment`, `daily_trend`, `media_efficiency_12m`, `conversion_funnel` |
| **Paid media diario** | `DATE`, `FUENTE`, `COST_USD`, `INGRESOS_USD` | `platform_return`, `media_platform_investment_matrix`, `media_investment_composition` |
| **Productos** | `DATE`, `PRODUCT_ID`, `TITULO_PRODUCTO`, `INGRESOS_USD` | `top_products_revenue` |
| **Redes** | `DATE`, `FUENTE`, `FOLLOWERS` · y `POST_DATE`, `FUENTE`, `COMMENT_SENTIMENT` | Las dos de redes |

**Ninguna es obligatoria salvo la de ecommerce.** `tables.go` ya lo dice para las
tres últimas: «un tenant sin ellas no pierde las demás».

**Las metas van en el detalle**, como hoy (`*_TARGET`). Se cargan por día igual
que el real, y el medidor «% DE LA META» sale de sumar las dos.

### Por qué el detalle y no una tabla por métrica

- **El drill-down lo necesita.** C2 desagrega una cifra por día, semana o
  plataforma, y eso no se puede hacer desde un total.
- **El total debería cuadrar con su desagregación, y hoy no cuadra.** La cifra
  publicada es 1 232 721; la desagregación suma 1 282 259 por día y 968 169 por
  plataforma, que lee **otra tabla** —registro de pantallas del plan, fila de
  C2—. Un mismo detalle elimina la segunda diferencia por construcción. La
  primera no se explicó y habría que medirla aparte.
- **El chat pregunta lo que nadie precalculó**, como «inversión de TikTok en
  abril».
- **Una métrica nueva es una fila**, no una tabla ni una carga nueva.
- **El volumen no lo justifica.** Tres años diarios por diez plataformas son unas
  11 000 filas, y el materializador calcula una vez por período, no por consulta.

### Reglas del cálculo

- **Lo que no es aditivo se calcula de sumas.** `ROAS = sum(ingresos) /
  sum(inversión)`, como ya hace `KPISQL`, y nunca un promedio de ratios diarios.
- **El mes se corta en el huso del cliente**, no del servidor.
- **El mes en curso se marca `partial`** al materializar, que es lo que el front
  ya lee desde el PR #18.
- **Una tabla precalculada sólo entra por rendimiento**, como vista materializada
  encima del detalle y regenerable.

## 5 · El modelo semántico

### Qué es

Es la descripción de los datos para quien no los conoce: tablas y cómo se
cruzan, dimensiones con su significado y sus sinónimos, hechos, métricas con su
fórmula, y consultas verificadas —preguntas con su SQL correcto—. En Snowflake
es la vista semántica del agente.

### ¿Hace falta?

| Quién consulta | ¿Lo necesita? |
|---|---|
| **El dashboard** | **No.** Le alcanza saber la fórmula de cada métrica, y eso ya existe |
| **El chat** | **Sí.** Sin él, el modelo de lenguaje adivina qué es cada columna y cómo se cruzan las tablas, y ahí sale una respuesta plausible y equivocada |

**Hoy el agente ya trabaja así**: `dd_chat_prompt.go` le dice «Usa únicamente
estas vistas semánticas: …», y la narración que se coló en inglés el 2026-10-10
hablaba de «logical column names (p_date, p_fuente)», que son los nombres de esa
vista.

### El problema que destapa: hoy una métrica se define en tres lugares

| Qué | Dónde | Quién lo escribe |
|---|---|---|
| Nombre, BASE, ventana, unidad, familia | La vista `SYNAPSE_METRIC_CATALOG` | Datos |
| La fórmula que dibuja el dashboard | `MetricRegistry`, en Go | Backend |
| La fórmula que usa el chat | La vista semántica del agente | Datos, dentro de Snowflake |

**Nada garantiza que las tres digan lo mismo.** Si el ROAS del chat y el del
panel se calculan distinto, la misma pregunta da dos cifras. No se midió que hoy
pase. Se señala porque la estructura lo permite.

### Propuesta: un archivo, y lo demás se genera

```
modelo-semantico.yaml
  ├─→ filas del catálogo          (dashboard · nombre, BASE, unidad, familia)
  ├─→ SQL de cada métrica         (materializador · reemplaza a BuildSQL)
  └─→ contexto del agente         (chat · tablas, relaciones, sinónimos, ejemplos)
```

- **Con la forma del YAML de Snowflake**, que es un formato abierto. Así el modelo
  se mueve entre la versión lite y producción sin traducirlo, y lo que datos ya
  escribió para UA es el punto de partida.
- **Las consultas verificadas son pruebas**: preguntas con respuesta conocida que
  se corren contra el agente para ver que no se degrada.
- **Es el mismo principio del plan de trabajo**: una fuente, y lo demás se
  genera, para que no puedan derivar.

**El tercer destino —reemplazar a `BuildSQL`— es el más caro**, porque hoy hay
consultas que además procesan las filas en Go (`ProcessRows`, los pivotes de
series). Se puede empezar por los dos primeros y dejar el registro como está.

## 6 · Qué cambia en el backend

| Cambio | Por qué |
|---|---|
| **Un puerto de datos neutro** —«correr esta consulta para este cliente»— con dos implementaciones: Snowflake y Postgres | Hoy la firma pide `SnowflakeAgentConfig` y un JWT |
| **El SQL en dos dialectos**, o escrito en lo común a los dos | `DATEADD`, `TO_DATE`, `TO_VARCHAR` y los `?` |
| **El catálogo desde un archivo** o una tabla, además de la vista | `sync-catalog` hoy sólo lee la vista |
| **La prosa con otro modelo de lenguaje**, por ejemplo la API de Claude | `DDProseGenerator` ya es un puerto; hay que sacarle `SnowflakeAgentConfig` de la firma. El prompt ya se arma aparte (`BuildProsePrompt`) |
| **El chat con otro agente**, o apagado en la versión lite | Es la pieza más grande: Cortex hoy escribe el SQL, grafica y devuelve `chart_spec`. Reemplazarlo es un agente con una herramienta de SQL sobre Postgres y el modelo semántico como contexto |
| **`schema-check` contra la fuente local** | `MetricColumnUsage` ya dice qué buscar |

## 7 · Qué no cambia

- **El front, entero.** El contrato, el adaptador, `render/` y las tres
  superficies.
- **`dd_panel_data`, el batch y los estados.** El materializador escribe lo mismo
  venga de donde venga el dato.
- **La gobernanza como regla**: BASE, procedencia y capa se siguen declarando.
  Lo que cambia es quién las escribe.

## 8 · Lo que cuesta, además del código

- **La gobernanza hay que escribirla a mano.** Hoy la firma datos en el catálogo
  de Snowflake. En la versión lite alguien escribe la BASE, la fuente y la capa de
  cada métrica. Si no, el panel queda sin cómo cumplir «ningún número desnudo».
- **Dos fuentes son dos cosas que mantener.** Cada métrica nueva se prueba contra
  las dos, o la versión lite envejece sin que nadie lo note.
- **El chat sin Cortex es el que más arriesga calidad.** Cortex trae resueltos el
  SQL sobre la vista semántica y los gráficos; otro agente hay que afinarlo con
  las consultas verificadas.

## 9 · Lo que hay que decidir, y no es del front

1. **¿Para qué es la versión lite?** Demo comercial, clientes que no tienen
   Snowflake, o entorno de desarrollo. Cambia todo lo demás.
2. **¿Lleva chat?** Sin chat, el modelo semántico no hace falta y el costo baja a
   la mitad.
3. **¿Con qué modelo de lenguaje** la prosa y el chat?
4. **¿El YAML único reemplaza también al de producción?** Si sí, resuelve las tres
   definiciones del §5 para todos, y deja de ser sólo de la versión lite.
5. **¿Quién mantiene el detalle de un cliente lite?** Una carga desde CSV, un
   conector, o el cliente escribiendo en Postgres.

## 10 · Un orden posible

1. **El puerto de datos y Postgres como fuente**, sólo para el dashboard, con el
   SQL portado de las 18 claves. Con eso el nivel 3 funciona sin chat ni prosa.
2. **El catálogo desde archivo.**
3. **La prosa con otro modelo de lenguaje.**
4. **El modelo semántico y el chat**, al final y sólo si la decisión 2 dice que sí.

Cada paso deja algo usable, y los dos primeros no tocan nada de lo que hoy anda
con Snowflake.
