# Para el equipo de datos · una columna, y lo que el backend vio en Gold · 2026-10-02

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Un pedido y cuatro observaciones.** Las observaciones no las hicimos nosotros:
las encontró el backend leyendo las tablas Gold de UA para escribir las
consultas de las métricas nuevas.

**Si todavía no mandaron `MENSAJE-2026-10-02-datos-las-cuatro-de-mmm.md`, este va
junto con aquel.**

---

## El pedido · una columna que agrupe modelo

**Producto decidió que el ranking de productos va por MODELO, no por talla.**

`GLD_PRODUCTO_ANALYTICS` tiene `PRODUCT_ID` al grano de talla, así que el top 10
sale con combinaciones modelo-talla:

```
Tenis para correr UA Charged Assert 10 para hombre Black US 10.5 - MX 8.5
```

Septiembre tiene **1.641 productos** con ese grano, y las diez primeras filas
pueden ser el mismo modelo en diez tallas sin que se note.

**El problema es del modelo de datos, no de la consulta.** La planilla declara
dos dimensiones —`PRODUCT_ID`, que es la talla, y `TITULO_PRODUCTO`, que es una
cadena con todo adentro— y **el modelo sólo existe dentro del título, como
texto**:

```
Tenis para correr UA Charged Assert 10 para hombre Black US 10.5 - MX 8.5
 └ tipo          └ modelo              └ género   └ color └ talla
```

No hay nada por lo que agrupar.

### Y «por modelo» son tres rankings distintos · **esto lo tienen que decidir**

| Agrupando por | Las diez filas serían |
|---|---|
| `UA Charged Assert 10` | El modelo, sumando géneros y colores |
| `… para hombre` | El modelo por género |
| `… para hombre Black` | La combinación de color · lo que en retail suele ser «el producto» comercial |

**No son equivalentes**: con el primero, un modelo que vende en hombre y en mujer
sube; con el tercero se parte en dos filas. Díganos cuál corresponde al negocio.

### Qué necesitamos, concreto

**Una columna por la que agrupar** —un `STYLE_ID`, `MODELO`, `COLORWAY_ID` o como
se llame— **y su rótulo legible**, al nivel que elijan. Con eso el backend cambia
el `GROUP BY` y listo.

**Si ya existe en la tabla y no la vimos, con que nos digan el nombre alcanza.**

**Lo que NO vamos a hacer es derivarlo del título.** Cortar la cadena con un
patrón funcionaría hasta el primer título con otra forma, y fallaría sin ruido:
el ranking mostraría diez filas plausibles y mal agrupadas. Es la misma razón por
la que el adaptador del front no calcula nada que el dato no declare.

## Lo que el backend vio en las tablas, y conviene que revisen

### a · La inversión no cuadra entre dos tablas · **es lo más urgente**

| Septiembre 2026 | |
|---|---|
| `SUM(COST_USD)` en `GLD_PAID_MEDIA` | **USD 3.347.868** |
| De eso, `Dailymotion` + `GCM-Other` | USD 3.092.080 |
| `SUM(GROSS_SPEND)` en `GLD_ECOMM_DAILY_PERFORMANCE` | **USD 118.807** |

**Difieren 28 veces para el mismo mes.** `Dailymotion` aparece con USD 1.984.511
en septiembre —59 % de la composición— y `GCM-Other` con USD 9.099.434 en octubre
de 2025.

**Lo vimos en pantalla y es lo que parece:** en el panel de retorno por
plataforma, esas dos filas se llevan el **92 % del share de inversión con CERO
ventas y ROAS 0,00**. Parecen montos en otra unidad, o impresiones cargadas como
costo.

Mientras sigan así, la matriz y la composición de inversión quedan dominadas por
esas dos filas **y no coinciden con el KPI de inversión**, que sale de la otra
tabla.

### b · `Dailymotion` y `Daily Motion` son dos plataformas distintas

En `FUENTE`, con cifras separadas. En la matriz salen como dos filas.

### c · `GLD_SOCIAL_MEDIA_FOLLOWERS.FOLLOWERS` no parece el total

La planilla dice «total de seguidores de IG UA México, reportado diariamente»,
pero los valores diarios de julio son de **200 a 400**, mientras
`GLD_SOCIAL_MEDIA_PROFILE_METRICS` trae **1.157.829** para el 1 de agosto. Parece
ser seguidores NUEVOS por día.

Además hay tres días con filas repetidas: `2026-08-01` (28 filas, todas nulas),
`2026-03-26` (4, nulas) y `2026-03-25` (21, en cero).

### d · Las redes están atrasadas

| Tabla | Último dato |
|---|---|
| `GLD_SOCIAL_MEDIA_FOLLOWERS` · Instagram | 2026-08-01 |
| `GLD_SOCIAL_MEDIA_POSTS` · TikTok con sentimiento | post del 2026-03-05 |

Y `GLD_SOCIAL_MEDIA_POSTS` no trae comentarios de Instagram: sus 529 filas tienen
el sentimiento vacío.

**Por esto producto decidió dejar las dos métricas de redes afuera por ahora** —
`instagram_followers_trend` y `tiktok_comment_sentiment`—. **No las descartamos**:
el backend ya escribió las consultas y quedan listas. Se encienden curando las
dos filas del catálogo el día que el dato llegue.

**Así que c y d no son urgentes**, pero conviene que queden escritos: son el
punto de partida cuando se retomen.

## Tres celdas de `Metricas.xlsx`

| Fila | Qué dice | Qué debería decir |
|---|---|---|
| `media_platform_investment_matrix` | `MEASUREMENT_WINDOW`: «Mes calendario seleccionado» | «Últimos doce meses calendario hasta el seleccionado» · es la decisión de producto del 01 |
| `platform_return` | `TABLA FUENTE`: `GLD_ECOMM_DAILY_PERFORMANCE` | La consulta lee `GLD_PAID_MEDIA` |
| `instagram_followers_trend` | `BASE`: «total de seguidores» | Ver el punto c |

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | La columna que agrupa modelo | **Ustedes** · es lo único que frena una métrica |
| a | La inversión de `Dailymotion` y `GCM-Other` | **Ustedes** · lo más urgente: hoy domina dos paneles |
| b | `Dailymotion` contra `Daily Motion` | Ustedes |
| c, d | `FOLLOWERS` y el atraso de redes | Ustedes · **sin apuro**, las métricas están pausadas |
| — | Las tres celdas de la planilla | Ustedes |
