# El repertorio de 49 gráficos · lo que `GET /config/plots` sirve · 2026-09-28

> **Es la transcripción de §5 de `design.md` en forma implementable.** El
> contrato declara la FORMA —`GraficoId`, `Grafico`, `MinimoDeDatos` y la ruta—;
> esta tabla es el DATO, y vive acá por la misma razón que la de
> `/config/blocks` no está en el yaml: el contrato declara esquemas, no filas.
>
> **La ruta hoy devuelve 404**, medido el 2026-09-26 y de nuevo el 2026-09-28.

## De dónde sale cada columna · ninguna se escribió de memoria

| Columna | Fuente |
|---|---|
| `id` | §5 de `design.md` · el mapa forma → gráfico, 65 pares |
| Nombre | El `.pen` · «Synapse · Plots», el título del frame |
| Formas | §5 · todas las filas en las que aparece ese id |
| Banda | §5 · la fila `serieConBanda`, que son exactamente tres |
| Mínimo | `docs/DECISIONES-2026-09-26-minimos-por-grafico.md` |
| Tope | §5 · las dos reglas duras que traen su razón redactada |

**El cruce cerró sin sobras.** Los 43 títulos del `.pen` mapean a 43 de los 49
ids: ni un título quedó sin id, ni un id sin dibujo salvo seis.

**Y esos seis no son un hueco** — `kpi`, `list`, `matrix`, `prose`, `reco` y
`table` son **cómo el cuerpo dibuja sin gráfico**: la cifra grande, la lista, la
grilla plana, el titular, la recomendación y la tabla. Por eso son también el
valor por defecto de su forma, que es lo que los doce paneles publicados hacen
hoy sin declarar nada. Van marcados **ᴺ** abajo.

## Lo que la transcripción destapó · y es un arreglo del contrato

**`MinimoDeDatos` necesitaba un campo y no se veía hasta llenarlo con datos
reales.** Nueve gráficos sirven a dos formas con mínimos distintos, y el umbral
cae sobre **la misma variable**:

| Gráfico | Como | Mínimo | Como | Mínimo |
|---|---|---|---|---|
| `bars` | `categorica` | `items < 2` | `ranking` | `items < 3` |
| `lollipop` | `categorica` | `items < 2` | `ranking` | `items < 3` |

Sin saber a qué forma aplica cada uno, el consumidor ve dos `items < N` y no
puede elegir — **evaluar los dos deja ganando siempre al más exigente**, que
rechazaría un ranking de dos donde la métrica es categórica.

**`MinimoDeDatos` gana `forma`, obligatorio.** El esquema se leía bien hasta que
se lo llenó: es la misma lección que «un fixture inventado verifica el fixture».

## La tabla

**ᴺ** = no es un plot · es cómo el cuerpo dibuja sin gráfico.

| # | `id` | Nombre | Formas | Banda | Mínimo · **por forma** | Tope |
|---|---|---|---|---|---|---|
| 1 | `kpi` ᴺ | KPI | `escalar` |  | — | — |
| 2 | `gauge` | ARCO | `escalar` |  | — | — |
| 3 | `bullet` | BULLET | `escalar` |  | — | — |
| 4 | `rings` | ANILLOS | `escalar` |  | — | — |
| 5 | `spark` | MICRO TENDENCIA | `escalar`, `serieTemporal` |  | `serieTemporal` → `puntos < 2` | — |
| 6 | `interval` | INTERVALO | `escalarConIntervalo`, `serieConBanda` | ✔ | `serieConBanda` → `puntos < 2` | — |
| 7 | `forecast` | PRONÓSTICO | `escalarConIntervalo`, `serieConBanda` | ✔ | `serieConBanda` → `puntos < 2` | — |
| 8 | `tornado` | TORNADO | `escalarConIntervalo`, `categoricaComparada` |  | `categoricaComparada` → `items < 2` | — |
| 9 | `columns` | COLUMNAS | `serieTemporal`, `categorica` |  | `serieTemporal` → `puntos < 2`<br>`categorica` → `items < 2` | — |
| 10 | `area` | ÁREA | `serieTemporal` |  | `serieTemporal` → `puntos < 2` | — |
| 11 | `step` | ESCALERA | `serieTemporal` |  | `serieTemporal` → `puntos < 2` | — |
| 12 | `multiline` | LÍNEAS | `serieTemporal`, `seriesMultiples` |  | `serieTemporal` → `puntos < 2`<br>`seriesMultiples` → `series < 2` | — |
| 13 | `cycle` | CICLO | `serieTemporal` |  | `serieTemporal` → `puntos < 2` | — |
| 14 | `candle` | RANGO DIARIO | `serieTemporal` |  | `serieTemporal` → `puntos < 2` | — |
| 15 | `control` | CONTROL | `serieTemporal`, `serieConBanda` | ✔ | `serieTemporal` → `puntos < 2`<br>`serieConBanda` → `puntos < 2` | — |
| 16 | `stackarea` | ÁREA APILADA | `seriesMultiples` |  | `seriesMultiples` → `series < 2` | — |
| 17 | `combo` | COMBINADO | `seriesMultiples` |  | `seriesMultiples` → `series < 2` | — |
| 18 | `smallmult` | MÚLTIPLOS | `seriesMultiples` |  | `seriesMultiples` → `series < 2` | — |
| 19 | `bump` | RANKING | `seriesMultiples`, `ranking` |  | `seriesMultiples` → `series < 2`<br>`ranking` → `items < 3` | — |
| 20 | `slope` | PENDIENTE | `seriesMultiples`, `categoricaComparada` |  | `seriesMultiples` → `series < 2`<br>`categoricaComparada` → `items < 2` | — |
| 21 | `bars` | BARRAS | `categorica`, `ranking` |  | `categorica` → `items < 2`<br>`ranking` → `items < 3` | — |
| 22 | `lollipop` | LOLLIPOP | `categorica`, `ranking` |  | `categorica` → `items < 2`<br>`ranking` → `items < 3` | — |
| 23 | `donut` | DONA | `categorica`, `composicion` |  | `categorica` → `items < 2`<br>`composicion` → `partes < 2` | `partes > 5` |
| 24 | `treemap` | TREEMAP | `categorica`, `composicion` |  | `categorica` → `partes < 3`<br>`composicion` → `partes < 3` | — |
| 25 | `radial` | BARRAS RADIALES | `categorica` |  | `categorica` → `items < 2` | — |
| 26 | `pareto` | PARETO | `categorica` |  | `categorica` → `items < 3` | — |
| 27 | `grouped` | COLUMNAS AGRUPADAS | `categoricaComparada` |  | `categoricaComparada` → `items < 2` | — |
| 28 | `dumbbell` | DUMBBELL | `categoricaComparada` |  | `categoricaComparada` → `items < 2` | — |
| 29 | `stacked` | COLUMNAS APILADAS | `composicion` |  | `composicion` → `partes < 2` | — |
| 30 | `stacked100` | APILADO 100% | `composicion` |  | `composicion` → `partes < 2` | — |
| 31 | `marimekko` | MARIMEKKO | `composicion` |  | `composicion` → `partes < 2` | — |
| 32 | `waterfall` | CASCADA | `composicion` |  | `composicion` → `partes < 3` | — |
| 33 | `funnel` | EMBUDO | `composicion`, `flujo` |  | `composicion` → `partes < 2`<br>`flujo` → `etapas < 3` | — |
| 34 | `heatmap` | MAPA DE CALOR | `matriz` |  | `matriz` → `filas < 2 o columnas < 2` | — |
| 35 | `cohort` | COHORTES | `matriz` |  | `matriz` → `filas < 2 o columnas < 2` | — |
| 36 | `calendar` | CALENDARIO | `matriz` |  | `matriz` → `filas < 2 o columnas < 2` | — |
| 37 | `matrix` ᴺ | MATRIX | `matriz` |  | `matriz` → `filas < 2 o columnas < 2` | — |
| 38 | `histogram` | HISTOGRAMA | `distribucion` |  | `distribucion` → `cortes < 3` | — |
| 39 | `box` | CAJA | `distribucion` |  | `distribucion` → `cortes < 3` | — |
| 40 | `scatter` | DISPERSIÓN | `distribucion` |  | `distribucion` → `cortes < 3` | — |
| 41 | `bubble` | BURBUJAS | `distribucion` |  | `distribucion` → `cortes < 3` | — |
| 42 | `cuadrantes` | CUADRANTES | `distribucion` |  | `distribucion` → `cortes < 3` | — |
| 43 | `sankey` | FLUJO | `flujo` |  | `flujo` → `etapas < 3` | — |
| 44 | `network` | GRAFO | `flujo`, `grafo` |  | `flujo` → `etapas < 3`<br>`grafo` → `aristas < 2` | — |
| 45 | `list` ᴺ | LIST | `ranking` |  | `ranking` → `items < 3` | — |
| 46 | `table` ᴺ | TABLE | `ranking`, `tabular` |  | `ranking` → `items < 3` | — |
| 47 | `prose` ᴺ | PROSE | `prosa` |  | — | — |
| 48 | `reco` ᴺ | RECO | `prosa` |  | — | — |
| 49 | `radar` | RADAR | `perfilMultiatributo` |  | `perfilMultiatributo` → `atributos < 3` | `perfiles > 3` |

## Lo que NO se transcribió, y por qué

**§5 tiene una tercera regla de tope que no se declara**: «`categorica` con
etiquetas de más de 16 caracteres: columns deshabilitado, bars sugerido». La
regla está, **la redacción no** — y `tope.razon` es copy que se pinta tal cual.
Las otras dos vienen redactadas en `design.md` («más de cinco partes, ilegible
en dona») y por eso sí se transcriben.

**Escribirla nosotros sería inventar copy de producto**, que es justo lo que el
adaptador tiene prohibido. Queda como pedido a diseño, junto con:

- **`cuadrantes` exige que los cuatro cuadrantes estén rotulados** · §5. No es
  un tope ni un mínimo: es un requisito de params, y `Grafico` no tiene dónde
  ponerlo. Ver la pregunta 1 de `PROPUESTA-2026-09-28-identidad-del-grafico.md`.
- **Los rangos de span**: §6 los declara por TIPO, y una cascada y una dona no
  necesitan el mismo ancho mínimo. Si son del gráfico, `Grafico` los necesita.

## Lo que falta para que esto sirva

1. **`GET /config/plots` que devuelva esta tabla.** Hoy 404.
2. **El campo `grafico` en el panel**, sin el cual nada de esto se puede elegir.
   Es la decisión de `docs/PROPUESTA-2026-09-28-identidad-del-grafico.md`, que
   **espera visto bueno** — acá no se dio por tomada.
