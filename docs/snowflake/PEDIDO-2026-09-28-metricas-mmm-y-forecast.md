# Para el equipo de datos · las métricas que faltan para MMM y forecast · 2026-09-28

> **Qué pedimos y por qué, con lo que se midió.** Producto quiere dos dashboards
> nuevos —**MMM** y **forecast**— y del lado del front los gráficos **ya están
> dibujados y sus cuerpos construidos**. Lo que no existe es el dato.
>
> **No pedimos datos nuevos: pedimos filas de catálogo con otra agregación.** Es
> la primera de las tres decisiones que ustedes mismos escribieron en
> `SYNAPSE_METRIC_CATALOG.sql`, y abajo se cita.

## Lo que se midió · 2026-09-28

El catálogo hoy declara **seis formas**, contadas sobre `dd_catalog_metrics` en
la base local:

| `SHAPE` | Filas |
|---|---|
| `scalar` | 15 |
| `multi_series` | 4 |
| `prose` | 4 |
| `categorical` | 3 |
| `tabular` | 3 |
| `time_series` | 1 |

**Cero filas** de `composition`, `distribution`, `scalar_with_interval` y
`series_with_band`. Y del lado nuestro **los cuerpos de esas cuatro están
construidos y sin una sola métrica que los use**: `composition`, `distribution`
y `forecast` existen desde la Fase 1.

## Por qué esto es más barato de lo que parece

Lo dice el comentario de ustedes en `SYNAPSE_METRIC_CATALOG.sql`:

> «**`SHAPE` no es propiedad de la métrica, es de la métrica MÁS cómo se
> consulta.** `SUM(br_rev)` agrupado por mes es `time_series`; el mismo SUM sin
> agrupar es `scalar`. Así que una misma expresión puede necesitar DOS filas de
> catálogo con dos `METRIC_KEY` distintos.»

Y la segunda:

> «Las 10 métricas declaradas son todas escalares. El seed del backend arma
> paneles de tipo `series`, `bars`, `table` y `prose`, que necesitan otras
> formas. Esas salen de los **285 facts de `SYNAPSE_UA` agrupados**, no de
> `SEMANTIC_METRICS`.»

**Casi todo lo que pedimos es eso mismo**: agrupar de otra manera lo que ya está
y curar la fila. La excepción es MMM, y está al final porque es de otra
naturaleza.

---

## 1 · Forecast · dos formas

### `series_with_band` · una proyección en el tiempo con su banda

Alimenta tres gráficos ya dibujados: `PRONÓSTICO`, `CONTROL` y `INTERVALO`.

**Forma exacta que el backend tiene que poder emitir:**

```
puntos: [{ t, v, lo, hi }]   ·   nivel: <número>
```

`lo` y `hi` son **obligatorios en cada punto**, y `nivel` es el nivel de
confianza —0.8, 0.95— y también obligatorio.

**Es una regla dura de producto, no una preferencia:** «prohibida la estimación
puntual sin intervalo · un pronóstico sin banda no se publica». Un gráfico que no
soporta banda **queda deshabilitado** para esta forma.

**Candidatas naturales** sobre lo que ya existe: la proyección de `revenue` y la
de unidades, al grano que ya tiene el catálogo.

### `scalar_with_interval` · una cifra con su rango

Alimenta `INTERVALO` y `TORNADO`.

```
v, lo, hi, nivel
```

**Candidata**: el cierre proyectado del período en curso.

### La pregunta que decide este bloque

**¿De dónde sale la banda?** Lo miramos antes de preguntar, y el camino obvio
parece cerrado: **`SHOW FUNCTIONS LIKE 'FORECAST' IN SCHEMA SNOWFLAKE.ML`
devuelve cero filas** · 2026-09-28. Puede ser que la cuenta no tenga habilitadas
las ML Functions, o que el rol con el que miramos no alcance ese esquema — **no
lo distinguimos y no lo forzamos**, porque averiguarlo pide ejecutar y eso ya no
es leer.

Así que la pregunta es suya: ¿se habilita `SNOWFLAKE.ML.FORECAST`, se
materializa la salida de un modelo de afuera, o hay algo que no vimos?

Lo que sí sabemos es que **`nivel` tiene que venir declarado**, no supuesto. Si
el modelo produce un intervalo al 80 %, el panel lo dice; inventarlo del lado
nuestro sería afirmar una confianza que nadie calculó.

---

## 2 · MMM · el modelo YA EXISTE, y eso achica el pedido a casi nada

**Esta sección se reescribió el 2026-09-28 después de mirar el esquema.** Decía
que un dashboard de MMM presupone un modelo de atribución y que no sabíamos si
existía, y que si no existía era un proyecto y no un pedido de catálogo.

**Existe, corrido con Robyn, y con intervalos.** Leído en sólo lectura sobre
`DB_BT_UA.BT_UA_MART_ANALYTICS`:

| Tabla | Qué trae |
|---|---|
| `MMM_RESULTS_WEEKLY` | 138 semanas · `REVENUE`, `PREDICTED`, `RESIDUAL`, `BASELINE_CONTRIB` y `CONTRIB_<canal>` por semana |
| `MMM_RESULTS_CHANNELS` | 7 canales · `ROAS_ADJUSTED`, `CONTRIBUTION_USD`, `CONTRIBUTION_PCT` y **`BOOTSTRAP_P025 / P50 / P975`** |
| `MMM_RESULTS_CALIBRATION` | El cruce contra conversion lift de Meta |
| `MMM_MODEL_PARAMS_APPLY` | `BETA`, `THETA`, `ALPHA`, `GAMMA` para scorear semanas nuevas |
| `GLD_ECOMM_DAILY_PERFORMANCE` | El insumo · 91 columnas, gasto diario pivoteado por plataforma junto a ventas |

**Así que no pedimos que se construya nada: pedimos filas de catálogo sobre lo
que ya está.** Y dos de las tres se pueden curar hoy con formas que el front ya
dibuja:

| Fila que pedimos | `SHAPE` | Sobre | Estado del front |
|---|---|---|---|
| **Real contra predicho**, por semana | `multi_series` | `MMM_RESULTS_WEEKLY` · `REVENUE` y `PREDICTED` | **Cuerpo construido** · misma unidad, un solo eje |
| **Contribución por canal en el tiempo** | `multi_series` | `MMM_RESULTS_WEEKLY` · las siete `CONTRIB_*` más `BASELINE_CONTRIB` | **Cuerpo construido** |
| **Contribución por canal, con su intervalo** | — | `MMM_RESULTS_CHANNELS` | **Ninguna forma la lleva** · ver §3 |

### Lo que el modelo dice de sí mismo, y que el dashboard tiene que declarar

**No es un detalle técnico: cambia qué se puede publicar.** `MMM_ALERTAS` tiene
**seis alertas sin resolver**, y las dos clases importan:

- **`FRESCURA`, severidad CRÍTICA**, del 2026-08-24: «Modelo MMM vencido — última
  semana modelada tiene 147 días». Acción registrada: reentrenar.
- **`CONFIANZA`**, repetida cinco semanas seguidas: **4 de 7 canales tienen el
  intervalo inferior en cero**, sobre 1.5M de inversión. Acción registrada:
  correr holdout o geo test antes de escalar.

Medido fila por fila, los cuatro son `Google_Brand`, `Criteo`, `TikTok` y
`FB_Brand` — y `FB_Brand` da contribución **0** con intervalo `[0, 0.34]`.

**Esto choca de frente con dos reglas nuestras**, y por eso se dice acá y no se
descubre en pantalla:

1. **«Prohibida la estimación puntual sin intervalo».** Publicar «Criteo aportó
   USD 264K» cuando su intervalo de ROAS va de **0 a 17.96** es publicar un
   número que el propio modelo no distingue de cero.
2. **«Degradación declarada»**: un feed vencido no muestra un número aproximado,
   muestra estado, razón y qué lo desbloquea. Un modelo vencido es lo mismo, y
   `MMM_ALERTAS` ya trae las tres cosas escritas.

**Lo que pedimos entonces no es sólo la métrica: es que la fila del catálogo
pueda declarar que su modelo está vencido.** Es una conversación de producto y
datos, no una columna — y nosotros ya tenemos dónde pintarla.

### Lo que sigue faltando de MMM

**El pronóstico forward.** Las 138 filas de `MMM_RESULTS_WEEKLY` son in-sample:
`REVENUE` contra `PREDICTED` sobre semanas que ya pasaron, de 2024-01-01 a
2026-08-17. **No hay filas futuras**, así que no hay proyección que dibujar.

## 3 · Lo que NO les pedimos, porque el hueco es NUESTRO

**`DISPERSIÓN`, `BURBUJAS` y `CUADRANTES` no se piden todavía**, aunque los tres
sean gráficos de MMM y estén dibujados.

Medido el 2026-09-28: §5 de nuestro `design.md` los cuelga de la forma
`distribucion`, y el objeto de esa forma es `cortes: [{etiqueta, v}]` — que es un
histograma o una caja. **Una dispersión necesita pares `(x, y)`, y ninguna de
nuestras dieciséis formas los lleva.**

Así que pedirles una métrica «de dispersión» sería pedir una forma que nuestro
propio contrato no sabe recibir. **Primero lo arreglamos nosotros**, y después
viene el pedido con la forma exacta, como los de arriba.

### Y el dato real destapó un segundo hueco, que es el que más duele

**`MMM_RESULTS_CHANNELS` es N categorías, cada una con su intervalo** —siete
canales con `BOOTSTRAP_P025`, `P50` y `P975`—. Es el corazón del dashboard de
MMM: cuánto aportó cada canal y con cuánta certeza.

**Ninguna de nuestras dieciséis formas lo lleva.** `escalarConIntervalo` es UNA
cifra con rango; `categoricaComparada` tiene N ítems pero **sin `lo` ni `hi`**.

Y no es una necesidad hipotética: **el `.pen` ya la dibuja**. El frame
`Plot/INTERVALO · Estimaciones con rango` tiene **cuatro filas**, cada una con su
etiqueta, su cifra y su rango. Cuando lo leímos supusimos que la biblioteca
repetía el componente; con `MMM_RESULTS_CHANNELS` enfrente se lee distinto —
**es exactamente esta forma**.

**También lo arreglamos nosotros antes de pedirles nada.**

---

## Lo que cada fila necesita, y que ya conocen

Las mismas columnas de gobierno de siempre: `NAME`, `SHAPE`, `FAMILY`, `LAYER`,
`SOURCE`, `BASE`, `MEASUREMENT_WINDOW`, `MIN_GRAIN`, `DIMENSIONS`, `UNIT` y
`SEMANTIC_DIRECTION`.

**Dos recordatorios que salen de lo que ya pasó:**

- **`BASE` es obligatoria y se pinta.** «Toda métrica declara su BASE
  —denominador y ventana— y su PROCEDENCIA». Un panel sin BASE no cumple la
  anatomía, y la BASE sigue visible incluso mientras el panel carga o falla.
- **`SEMANTIC_DIRECTION` va como texto redactado, no como código.** Siguen
  **seis filas** trayendo `HIGHER_IS_BETTER` donde va `HIGHER = BETTER`, y sale
  en pantalla con guiones bajos. La séptima regla de
  `SYNAPSE_METRIC_CATALOG_ISSUES` las detecta sola. Ya que se tocan filas,
  conviene cerrarlas.

## Resumen del pedido

| | Forma | Para | Costo estimado por ustedes |
|---|---|---|---|
| **1** | `series_with_band` | Forecast · 3 gráficos | Depende de dónde salga la banda |
| **2** | `scalar_with_interval` | Forecast · 2 gráficos | Ídem |
| **3** | `multi_series` · real contra predicho | MMM | **Bajo** · `MMM_RESULTS_WEEKLY` ya lo tiene |
| **4** | `multi_series` · contribución por canal en el tiempo | MMM | **Bajo** · ídem |
| **5** | `composition` | MMM · 7 gráficos | Bajo · sobre `MMM_RESULTS_CHANNELS` |
| **6** | Que la fila pueda declarar **modelo vencido** | MMM | Decisión de producto · `MMM_ALERTAS` ya lo detecta |
| — | Contribución por canal **con intervalo** | MMM | **No pedido** · ninguna forma la lleva · §3 |
| — | `distribution` para dispersión | MMM · 3 gráficos | **No pedido** · hueco nuestro, lo arreglamos primero |
| — | Las seis de `SEMANTIC_DIRECTION` | Ya pendiente | Bajo |

**Nosotros no corremos nada en Snowflake.**
