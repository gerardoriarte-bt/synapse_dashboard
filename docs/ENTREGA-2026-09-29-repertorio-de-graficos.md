# Para backend · todo lo que hace falta para `GET /config/plots` · 2026-09-29

> **Nos pidieron tres archivos y los tres estaban en NUESTRO repositorio, que no
> ven.** Acá van en uno solo, completos, para que no haya que ir a buscar nada.
> Es un artefacto de TRANSFERENCIA: la fuente sigue siendo el repositorio del
> front, y si algo de acá se contradice con el contrato, **gana el contrato**.

## Qué es cada cosa, en dos líneas

| | |
|---|---|
| **El repertorio** | Los 49 gráficos con su forma, su mínimo de datos, su tope y de dónde salió cada uno |
| **La decisión de los mínimos** | Por qué el mínimo es **de la forma** y no del gráfico, y los tres que lo suben |
| **El contrato** | `GET /config/plots`, `GraficoId`, `Grafico` y `MinimoDeDatos`, tal cual están en `contracts/synapse-api.yaml` |

## Lo único que hay que entender antes de implementarlo

**El mínimo de datos es de la FORMA, y un gráfico lo SUBE sólo si su geometría lo
exige.** Es la simetría de `tope`, que baja el techo por gráfico.

Un número elegido a mano para cada una de las 49 entradas serían 49 juicios y la
mayoría arbitrarios: `bars` y `lollipop` comen el mismo dato y fallan en el mismo
punto. **Sólo tres suben el de su forma** —`treemap`, `pareto` y `waterfall`, a
3— y están marcados aparte porque son juicio y no geometría.

**Y `MinimoDeDatos` declara `forma` como campo**, que no estaba en la primera
versión: **nueve de los 49 sirven DOS formas con umbrales distintos** sobre la
misma variable, así que el mínimo no se puede indexar sólo por gráfico.

**La razón se PINTA.** `MinimoDeDatos` la declara obligatoria: un panel que se
apaga sin decir por qué manda a buscar un error donde hay una regla.

---

# 1 · EL REPERTORIO DE LOS 49


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

## TRES GRÁFICOS CUELGAN DE UNA FORMA QUE NO PUEDE LLEVARLOS

**Encontrado el 2026-09-28, al preparar el pedido a datos.** §5 mapea
`DISPERSIÓN`, `BURBUJAS` y `CUADRANTES` a la forma **`distribucion`**, y el
objeto de esa forma es:

```
ValorDistribucion { forma, cortes: [{ etiqueta, v }] }
```

**Eso es un histograma o una caja.** Una dispersión necesita pares `(x, y)`; una
burbuja, `(x, y, r)`; y `cuadrantes`, lo mismo más el rótulo de cada zona.

**Ninguna de las dieciséis formas del contrato lleva pares `(x, y)`** ·
verificado sobre los diecisiete esquemas `Valor*`. Así que estos tres **no se
pueden dibujar hoy aunque se construya el componente**: no hay dónde poner el
dato.

**No es un error de la transcripción: es del mapa.** §5 los agrupó por la
pregunta que contestan —«qué forma tiene esto»— y no por el objeto que
necesitan. Los otros dos de esa fila, `histogram` y `box`, sí comen `cortes`.

**Y pega donde duele**: los tres son gráficos de MMM, y `CUADRANTES` es el que el
`.pen` dibuja con `INVERTIR · REVISAR PRECIO · ESCALAR · DEFENDER`, o sea el que
convierte el análisis en una decisión.

**Es una propuesta de spec, no un arreglo**: o `distribucion` gana una variante,
o nace una forma nueva. No se resuelve acá y **no se le pidió a datos** una
métrica para esto — pedirla sería pedir una forma que no sabemos recibir. Está
dicho en `docs/snowflake/PEDIDO-2026-09-28-metricas-mmm-y-forecast.md` §3.

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

---

# 2 · LA DECISIÓN DE LOS MÍNIMOS


> **Esto es la mitad nuestra de B1.21.** El plan lo dice: «decidir cuántos
> puntos necesita una serie, cuántas categorías una barra y cuántas partes una
> composición para no engañar es trabajo de producto y front, no de backend».
>
> **Para el backend**: la tabla de abajo es lo que `GET /config/plots` sirve, con
> la misma figura que `/config/blocks` — global, no por tenant. El esquema está
> en `contracts/synapse-api.yaml` · `Grafico` y `MinimoDeDatos`.

## El problema, en una línea

`SYNAPSE_PLOTS` declara desde v2 `formas`, `soportaBanda` y `tope` —el techo,
con su razón— **y no declara mínimos**. Hoy nada impide que `bars` reciba un
ítem y dibuje una barra sola: el panel se ve bien y no dice nada.

## La decisión de estructura

**El mínimo es de la FORMA. Un gráfico lo SUBE sólo si su geometría lo exige.**

Es la simetría de `tope`, que baja el techo por gráfico y por la misma razón. La
alternativa —elegir un número para cada una de las 49 entradas— serían 49
juicios, y la mayoría arbitrarios: `bars` y `lollipop` comen el mismo dato y
fallan en el mismo punto.

**Y la razón se pinta.** No es documentación: un panel que se apaga sin decir por
qué manda a buscar un error donde hay una regla. Es la gramática de §8, la misma
que usa un feed vencido.

## Lo que se midió antes de decidir

Los 43 gráficos del `.pen` tienen geometría real, así que se contó con cuántos
elementos los dibujó diseño. **Son el techo de lo razonable, no el piso** — pero
sirven para descartar un mínimo demasiado alto:

| Gráfico | Dibujado con |
|---|---|
| `BARRAS` | 12 barras |
| `HISTOGRAMA` | 10 cortes |
| `COLUMNAS AGRUPADAS` | 4 pares |
| `DUMBBELL` | 5 pares |
| `DONA` | 5 partes — **que es su propio `tope`** |
| `EMBUDO` | 5 etapas |
| `FLUJO` | 7 etapas · 12 enlaces |
| `RADAR` | 6 ejes |
| `GRAFO` | 7 nodos · 7 aristas |
| `MAPA DE CALOR` | 7 × 7 |
| `COHORTES` | 30 celdas |

**Y tres mínimos ya estaban escritos** en el criterio de B1.21, que los da como
ejemplos de lo que tiene que disparar el estado vacío: *«una serie de un punto,
una composición de una parte y un ranking de dos ítems»*. Se respetan.

## La tabla · por forma

| Forma | Mínimo | `cuando` | Razón · **se pinta tal cual** |
|---|---|---|---|
| `escalar` | — | | *una cifra es una cifra* |
| `escalarConIntervalo` | — | | idem |
| `prosa` | — | | el titular ya dice algo |
| `tabular` | — | | una tabla de una fila es una tabla |
| `serieTemporal` | **2 puntos** | `puntos < 2` | «un punto no es una tendencia» |
| `serieConBanda` | **2 puntos** | `puntos < 2` | «un punto no es una tendencia» |
| `seriesMultiples` | **2 series** | `series < 2` | «una sola serie no se compara con nada» |
| `categorica` | **2 ítems** | `items < 2` | «una barra sola no compara nada» |
| `categoricaComparada` | **2 ítems** | `items < 2` | «una barra sola no compara nada» |
| `ranking` | **3 ítems** | `items < 3` | «un ranking de dos es una comparación» |
| `composicion` | **2 partes** | `partes < 2` | «una parte sola es el 100 %» |
| `distribucion` | **3 cortes** | `cortes < 3` | «con dos cortes es una comparación, no una distribución» |
| `matriz` | **2 × 2** | `filas < 2 o columnas < 2` | «una matriz de una fila es un gráfico de barras» |
| `perfilMultiatributo` | **3 atributos** | `atributos < 3` | «con dos ejes el radar es una línea» |
| `grafo` | **2 aristas** | `aristas < 2` | «una sola relación se dice con una frase» |
| `flujo` | **3 etapas** | `etapas < 3` | «dos etapas son una tasa de conversión, y eso es una cifra» |

### Por qué cada uno

**`serieTemporal` · 2.** Es el mínimo geométrico: un punto no traza una línea. Y
es el mínimo semántico: la pregunta de una serie es «cómo se movió».

**`ranking` · 3, y no 2.** Un ranking de dos es «A le gana a B», que es una
comparación y se dice mejor con dos cifras. El tercero es el que convierte la
comparación en un orden. **Este número sale del criterio de B1.21**, no de acá.

**`composicion` · 2.** Una parte sola es el 100 %: la dona se dibuja entera y el
panel afirma «todo es X», que es cierto y no es una composición.

**`distribucion` · 3.** Con dos cortes no hay forma que leer —ni cola, ni
concentración, ni centro—: es un `categorica` con otro nombre.

**`matriz` · 2 × 2.** Una fila o una columna sola reduce la matriz a barras, y
entonces el panel promete el cruce de dos dimensiones que no está mostrando.

**`perfilMultiatributo` · 3 ejes.** Con dos, el radar degenera en una línea y el
área —que es lo que se lee— deja de existir.

**`grafo` · 2 aristas.** Con una, el grafo dibuja A→B: una frase con más tinta.

**`flujo` · 3 etapas.** Dos etapas son una tasa de conversión, y para eso está
`kpi` con su medidor.

## Los tres gráficos que SUBEN el mínimo de su forma

Son los que conviene mirar con más cuidado, porque son juicio y no geometría.

| Gráfico | Forma | Sube a | Razón |
|---|---|---|---|
| `treemap` | `composicion` 2 | **3** | «con dos rectángulos es una barra apilada» |
| `pareto` | `categorica` 2 | **3** | «con dos categorías no hay concentración que mostrar» |
| `waterfall` | `composicion` 2 | **3** | «una cascada de dos pasos es una diferencia» |

**Ninguno más sube.** Se consideró y se descartó:

- **`box`** · un diagrama de caja necesita cuartiles, así que pediría un mínimo
  sobre el número de observaciones — y el cable manda `cortes` ya agregados, no
  observaciones. **Pedir un mínimo sobre un dato que no llega sería inventarlo.**
- **`cycle`** · un ciclo semanal «necesita» siete puntos, pero eso es una
  propiedad de la métrica y no del gráfico: el mismo gráfico sirve para un ciclo
  de cuatro trimestres.
- **`scatter` y `bubble`** · quedarían bien con más, pero el 3 de `distribucion`
  ya evita el caso que engaña.

## Lo que esto NO resuelve

**El mínimo no reemplaza al estado vacío, lo explica.** `isEmpty` ya decide qué
es una colección sin elementos; esto decide qué es una **con muy pocos**. Los dos
terminan en el mismo lugar —el cuerpo no se dibuja y el shell conserva título,
BASE y procedencia— y la diferencia es la razón que se pinta.

**Y el mínimo no se evalúa en el front hasta que la ruta exista.** Hoy
`GET /config/plots` devuelve **404**, medido el 2026-09-26. Mientras tanto la
tabla vive acá y en el contrato, y no se copia a `src/`: una tabla duplicada en
tres lugares se separa en el primer cambio, que es la razón por la que
`/config/blocks` vive en el backend.

---

# 3 · EL CONTRATO · de `contracts/synapse-api.yaml`

```yaml
paths:
  /config/plots:
    get:
      tags: [config]
      operationId: obtenerGraficos
      summary: El repertorio de gráficos, con sus mínimos y sus topes
      description: |
        **B1.21 · propuesto por el front el 2026-09-26, medido en 404.**

        La tabla de §5 de `design.md` en forma legible por máquina. **Vive en el
        backend por la misma razón que `/config/blocks`**: la consumen el
        builder, `layouts/{id}/validate` y el adaptador del front, y una tabla
        duplicada en tres lugares se separa en el primer cambio.

        **Global, no por tenant.** Qué puede dibujar un gráfico no depende del
        cliente.

        **Lo que esta ruta agrega sobre el repertorio que ya existe son los
        `minimos`.** `SYNAPSE_PLOTS` declara `formas`, `soportaBanda` y `tope`
        desde v2; sin mínimos, nada impide que `bars` reciba un ítem y dibuje
        una barra sola.
      responses:
        '200':
          description: Los gráficos del repertorio
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        required: [plots]
                        properties:
                          plots:
                            type: array
                            items: { $ref: '#/components/schemas/Grafico' }
        '401': { $ref: '#/components/responses/NoAutorizado' }

components:
  schemas:
    GraficoId:
      type: string
      description: |
        Los **49 gráficos de §5** de `design.md`, transcriptos el 2026-09-28.

        **Es un enum cerrado de este lado.** En el cable llegará como `string`
        libre, igual que `shape`, `family` y `layer`, y lo cierra el adaptador —
        que es donde ya se cierran esos tres. Un id que no esté acá **no se
        sustituye por el gráfico por defecto**: el panel lo declara con la
        gramática de §8. Dibujar una cascada como dona se ve bien y miente.

        ── **SEIS DE LOS 49 NO SON PLOTS, Y ESO NO ES UN HUECO** ──────────────

        El `.pen` dibuja 43 en «Synapse · Plots». Los seis que no dibuja son
        `kpi`, `list`, `matrix`, `prose`, `reco` y `table`, y **son cómo el
        cuerpo dibuja SIN gráfico**: la cifra grande, la lista, la grilla
        plana, el titular en prosa, la recomendación y la tabla.

        Por eso son también **el valor por defecto de su forma**: un panel sin
        `grafico` cae en uno de estos seis, que es exactamente lo que los doce
        paneles publicados hacen hoy sin declarar nada.

        Se cruzaron los 43 del dibujo contra los 49 de §5 y **mapean sin
        sobras**: ni un título del `.pen` quedó sin id, ni un id sin dibujo
        salvo esos seis.
      enum:
        - kpi
        - gauge
        - bullet
        - rings
        - spark
        - interval
        - forecast
        - tornado
        - columns
        - area
        - step
        - multiline
        - cycle
        - candle
        - control
        - stackarea
        - combo
        - smallmult
        - bump
        - slope
        - bars
        - lollipop
        - donut
        - treemap
        - radial
        - pareto
        - grouped
        - dumbbell
        - stacked
        - stacked100
        - marimekko
        - waterfall
        - funnel
        - heatmap
        - cohort
        - calendar
        - matrix
        - histogram
        - box
        - scatter
        - bubble
        - cuadrantes
        - sankey
        - network
        - list
        - table
        - prose
        - reco
        - radar

    Grafico:
      type: object
      description: |
        Una entrada del repertorio · `SYNAPSE_PLOTS`.

        **Vive en el backend y se sirve en `GET /config/plots`**, con la misma
        figura que `/config/blocks`: una tabla global, no por tenant. La
        consumen los tres que validan — el builder, `layouts/{id}/validate` y el
        adaptador del front— y por eso no se duplica en ninguno.
      required: [id, nombre, formas, soportaBanda, minimos]
      properties:
        id: { $ref: '#/components/schemas/GraficoId' }
        nombre:
          type: string
          description: |
            El título en español, **transcripto del `.pen`** para los 43 que
            dibuja. Es copy de producto: lo pinta el selector de B3.
          examples: ['Barras', 'Radar']
        formas:
          type: array
          description: Qué formas de dato sabe dibujar.
          items: { $ref: '#/components/schemas/Forma' }
        soportaBanda:
          type: boolean
          description: |
            **Regla dura 6**: `serieConBanda` sólo admite gráficos con esto en
            `true`. Un pronóstico sin banda no se publica.
        minimos:
          type: array
          description: |
            **Vacío significa «ninguno», y es un valor legítimo**: una cifra es
            una cifra, y una prosa con titular ya dice algo. No se rellena con
            un mínimo inventado para que la lista no quede vacía.
          items: { $ref: '#/components/schemas/MinimoDeDatos' }
        tope:
          type: ['object', 'null']
          description: |
            El techo que lo deshabilita, con su razón. `null` cuando no tiene.
            Existe desde v2 y no cambia acá — se declara para que las dos
            reglas del mismo gráfico vivan juntas.
          required: [cuando, razon]
          properties:
            cuando: { type: string, examples: ['partes > 5'] }
            razon: { type: string, examples: ['más de cinco partes, ilegible en dona'] }

    MinimoDeDatos:
      type: object
      description: |
        Cuánto dato necesita un gráfico para no engañar.

        **La razón no es documentación: es lo que se muestra en pantalla.** Un
        panel que se apaga sin decir por qué manda a buscar un error donde hay
        una regla, y es la misma gramática de §8 que usa un feed vencido —
        estado, razón y qué lo desbloquea.
      required: [forma, cuando, razon]
      properties:
        forma:
          description: |
            **A QUÉ FORMA aplica este mínimo, y no es redundante con
            `Grafico.formas`** · agregado el 2026-09-28, al transcribir los 49.

            Nueve gráficos sirven a dos formas con mínimos distintos, y nueve
            veces el umbral cae sobre la MISMA variable: `bars` pide
            `items < 2` como `categorica` y `items < 3` como `ranking`.

            Sin este campo el consumidor ve dos `items < N` y **no puede saber
            cuál aplica** — evaluar los dos deja ganando siempre al más
            exigente, que rechazaría un ranking de dos donde la métrica es
            categórica. El esquema se leía bien hasta que se lo llenó con los
            datos reales.
          $ref: '#/components/schemas/Forma'
        cuando:
          type: string
          description: |
            La condición, legible y evaluable sobre el valor. Misma forma que
            `tope.cuando`, para que las dos se lean juntas.
          examples: ['puntos < 2', 'items < 3', 'filas < 2 o columnas < 2']
        razon:
          type: string
          description: |
            **Copy de producto, en minúscula y sin punto final**, como el resto
            de los rótulos del sistema. Se pinta tal cual.
          examples: ['un punto no es una tendencia', 'una parte sola es el 100 %']
```
