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

**¿De dónde sale la banda?** No lo afirmamos porque no lo sabemos: puede ser
`SNOWFLAKE.ML.FORECAST` dentro de su cuenta, un modelo afuera cuyo resultado se
materialice, o algo ya existente que no conocemos.

Lo que sí sabemos es que **`nivel` tiene que venir declarado**, no supuesto. Si
el modelo produce un intervalo al 80 %, el panel lo dice; inventarlo del lado
nuestro sería afirmar una confianza que nadie calculó.

---

## 2 · MMM · una forma, y una pregunta más grande

### `composition` · partes de un todo, con el total declarado

Alimenta `CASCADA` —la descomposición del crecimiento, que es **el** gráfico de
MMM—, `MARIMEKKO`, y de paso `DONA`, `TREEMAP`, `APILADO`, `APILADO 100%` y
`EMBUDO`, todos ya dibujados.

```
partes: [{ etiqueta, v, porcentaje }]
```

**`porcentaje` lo calcula quien produce el dato, no el front.** Redondear en el
cliente da columnas que suman 99,9 %, y el contrato lo dice explícitamente.

**Candidata inmediata y de bajo costo**: *inversión por plataforma*. El `.pen`
la dibuja con sus cifras —META, GOOGLE, CRITEO, TIKTOK y OTROS, con su
porcentaje y su total— así que la pantalla ya sabe cómo se ve.

### `categorical` y `multi_series` · ya existen, y alcanzan

`PARETO` come `categorical` —hay 3 filas— y `ÁREA APILADA` y `COMBINADO` comen
`multi_series` —hay 4—. **Para estos tres no pedimos nada**, salvo que las que
existan sirvan al eje del dashboard: contribución por canal a lo largo del
tiempo.

### La pregunta que este pedido NO puede contestar

**Un dashboard de MMM presupone un modelo de atribución**, y no sabemos si
existe. «Descomposición del crecimiento» significa repartir un delta entre
canales, y ese reparto **es la salida de un modelo**, no una agregación.

- **Si el modelo existe**, lo que pedimos es curar sus salidas como filas de
  catálogo con `SHAPE = 'composition'`, y es barato.
- **Si no existe**, esto no es un pedido de catálogo sino un proyecto, y
  conviene decirlo ahora y no cuando la pantalla esté construida.

**Lo de forecast y lo de MMM no van juntos por esto.** El primero puede ser un
`GROUP BY` con una función de Snowflake; el segundo puede ser un trimestre de
modelado. Si hay que elegir uno, **empiecen por forecast**: sus tres gráficos
están dibujados, su cuerpo construido, y la regla de la banda ya está escrita.

---

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
| **3** | `composition` | MMM · 7 gráficos | Bajo **si** existe el modelo de atribución |
| — | `distribution` para dispersión | MMM · 3 gráficos | **No pedido** · hueco nuestro, lo arreglamos primero |
| — | Las seis de `SEMANTIC_DIRECTION` | Ya pendiente | Bajo |

**Nosotros no corremos nada en Snowflake.**
