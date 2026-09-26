# Los mínimos de datos por gráfico · B1.21 · 2026-09-26

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
