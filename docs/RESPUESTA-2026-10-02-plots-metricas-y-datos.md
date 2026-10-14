# Para el equipo de frontend y el de datos · plots, las seis métricas y lo que vimos en los datos · 2026-10-02

> Contesta `MENSAJE-2026-10-02-backend-los-archivos.md`. Los tres archivos llegaron y con ellos
> quedó implementado todo lo pendiente de código: `GET /config/plots`, la matriz a mes y las cuatro
> métricas que faltaban.
>
> **La sección 5 es para el equipo de datos.** Para escribir las consultas leímos las tablas Gold de
> Under Armour y encontramos cifras que conviene que revisen antes de que lleguen a pantalla.

## Resumen

| # | Qué | Estado |
|---|---|---|
| 1 | `GET /config/plots` | **Hecho** · 200 con las 49 entradas, idénticas al archivo |
| 2 | Matriz de inversión, eje a mes | **Hecho** · probado contra Snowflake |
| 3 | Las cuatro métricas restantes | **Hecho** · probado contra Snowflake |
| 4 | El eje de tiempo de dos series salía como número | **Corregido** · cambia lo que reciben, ver §4 |
| 5 | Lo que vimos en los datos | **Para el equipo de datos** |
| 6 | Usuario de QA | Pendiente de nuestro lado |

Sin cambios de esquema en Postgres. Todo está en `feature/dynamic-dashboard-backend`; QA lo
tendrá cuando se despliegue.

---

## 1 · `GET /config/plots`

```
GET /api/v1/config/plots      → 200 · { "success": true, "data": [ …49 entradas… ] }
```

- Probado en vivo: 401 sin token, 200 con token. `data` es el arreglo desnudo y es **idéntico** a
  `config-plots.json`, comparado entrada por entrada.
- `cap` se omite cuando no hay tope (4 de 49 lo llevan). `minimums` vacío viaja como `[]`.
- El repertorio va embebido en el binario: no hay tabla. **Si regeneran el archivo, nos lo mandan
  y sale en el siguiente despliegue.** Un test fija 49 entradas y 4 topes, así que un archivo con
  otra cantidad nos avisa.
- Al cargarlo validamos ids únicos, nombre y formas presentes, y que cada mínimo refiera a una
  forma que el gráfico declara. El archivo actual pasa.

**Una diferencia entre sus dos archivos:** `synapse-console-wire.yaml` declara `cap` como
`['object', 'null']` («`null` cuando no tiene»), y el mensaje y el JSON dicen que se omite.
Seguimos el JSON: nunca viaja `null`.

`dd_panels.chart` sigue guardándose sin validar contra el repertorio.

## 2 · La matriz, a mes

`media_platform_investment_matrix` queda como decidió producto:

```
filas      plataforma (FUENTE), de mayor a menor inversión de la ventana
columnas   mes, los doce que terminan en el seleccionado · rótulo "YYYY-MM"
celda      inversión en USD · 0 si la plataforma no invirtió ese mes
```

Para septiembre de 2026 contra los datos de UA: 12 columnas (`2025-10` a `2026-09`) y 39
plataformas. Un mes en el que ninguna plataforma invirtió no aparece como columna.

`media_investment_composition` ahora incluye solo las plataformas con inversión en el mes: en
septiembre eran 23 partes, varias en cero, y quedan 17.

## 3 · Las cuatro métricas

La planilla no trae nombres de columna, así que los tomamos del catálogo de Snowflake de UA
(`INFORMATION_SCHEMA`). Las cuatro están registradas y corridas contra datos reales.

| Métrica | Forma | Cómo se calcula |
|---|---|---|
| `conversion_funnel` | `flow` | Visitas → adiciones al carrito → órdenes, sumadas sobre el mes (`VISITS_TOTAL`, `ATC_TOTAL`, `ORDERS_TOTAL`) |
| `top_products_revenue` | `ranking` | Los **10** productos de mayor `INGRESOS_USD` del mes, por `PRODUCT_ID`, con `TITULO_PRODUCTO` como rótulo |
| `instagram_followers_trend` | `time_series` | `FOLLOWERS` por día con `FUENTE = INSTAGRAM`; si un día trae más de una fila, la mayor |
| `tiktok_comment_sentiment` | `categorical` | Comentarios por `COMMENT_SENTIMENT` con `FUENTE = TIKTOK`, en los posts **publicados** en el mes |

**El embudo trae `from_v`**, como acordamos. Septiembre de 2026:

```
Visitas 3.421.532  →  Adiciones al carrito 236.209  →  Órdenes 11.550
```

**Decisiones nuestras, por si producto quiere otra cosa:**

- El ranking corta en 10. Septiembre tiene 1.641 productos.
- El sentimiento usa la fecha del post, no la del comentario: la planilla dice «en los posts del
  mes».
- Las etiquetas de sentimiento salen en español: `Positivo`, `Negativo`, `Neutral`, `Mixto`.

**Para que se vean en pantalla** falta que las seis claves estén en la view del catálogo del
tenant con el mismo `SHAPE` que la planilla; el materializador recorre el catálogo, no el registro.

**Tablas nuevas y alta de cliente.** El backend ahora lee cinco tablas Gold. Las tres nuevas
(`GLD_PRODUCTO_ANALYTICS`, `GLD_SOCIAL_MEDIA_FOLLOWERS`, `GLD_SOCIAL_MEDIA_POSTS`) y la columna
`ATC_TOTAL` solo se exigen en el schema-check si el catálogo del tenant usa esas métricas: un
cliente sin redes sociales no queda marcado como incompleto.

No agregamos drill-down para las seis métricas nuevas.

## 4 · El eje de tiempo salía como número · cambia lo que reciben

Snowflake entrega las fechas como días desde 1970. Dos métricas que ya usan las pasaban tal cual:

```
antes     daily_trend · media_efficiency_12m      "t": "20697"
ahora                                              "t": "2026-09-01"
```

- Aplica a `daily_trend`, `media_efficiency_12m` y a la nueva `instagram_followers_trend`.
- **Las filas ya materializadas conservan el número** hasta que se rematerialice su período:
  `POST /admin/tenants/{id}/materialize` sobre los períodos que muestren.
- Si el front convertía ese número por su cuenta, hay que quitar esa conversión.

## 5 · Para el equipo de datos · lo que vimos en las tablas Gold de UA

Nada de esto lo corrige el backend: las consultas muestran lo que hay. Lo dejamos escrito porque
se va a ver en pantalla.

**a · Inversión en `GLD_PAID_MEDIA` · dos fuentes concentran cifras que no cuadran**

| | Septiembre 2026 |
|---|---|
| `SUM(COST_USD)` en `GLD_PAID_MEDIA` | **USD 3.347.868** |
| De eso, `Dailymotion` + `GCM-Other` | USD 3.092.080 |
| `SUM(GROSS_SPEND)` en `GLD_ECOMM_DAILY_PERFORMANCE` | **USD 118.807** |

Las dos tablas difieren 28 veces en la inversión del mismo mes. `Dailymotion` aparece con USD
1.984.511 en septiembre (59 % de la composición) y `GCM-Other` con USD 9.099.434 en octubre de
2025. Parecen montos en otra unidad o impresiones cargadas como costo. Mientras sigan así, la
matriz y la composición quedan dominadas por esas dos filas, y no coinciden con el KPI de
inversión, que sale de la otra tabla.

**b · `Dailymotion` y `Daily Motion` son dos plataformas distintas** en `FUENTE`, con cifras
separadas. En la matriz salen como dos filas.

**c · `GLD_SOCIAL_MEDIA_FOLLOWERS.FOLLOWERS` no parece el total de seguidores.** La planilla dice
«Total de seguidores de IG UA México, reportado diariamente», pero los valores diarios de julio son
de unos pocos cientos (entre 200 y 400). `GLD_SOCIAL_MEDIA_PROFILE_METRICS` trae 1.157.829 para el 1 de agosto. La columna
parece ser seguidores nuevos por día. Además hay tres días con filas repetidas: `2026-08-01` (28
filas, todas nulas), `2026-03-26` (4, nulas) y `2026-03-25` (21, en cero).

**d · Los datos de redes sociales están atrasados.**

| Tabla | Último dato |
|---|---|
| `GLD_SOCIAL_MEDIA_FOLLOWERS` (Instagram) | 2026-08-01 |
| `GLD_SOCIAL_MEDIA_POSTS` (TikTok con sentimiento) | post del 2026-03-05 |

Para septiembre y octubre de 2026 las dos métricas salen «No hay datos de este período todavía».
`GLD_SOCIAL_MEDIA_POSTS` no trae comentarios de Instagram: sus 529 filas tienen el sentimiento
vacío.

**e · `PRODUCT_ID` es la talla, no el modelo.** Los títulos del ranking son del tipo «Tenis para
correr UA Charged Assert 10 para hombre Black US 10.5 - MX 8.5». El top 10 es de combinaciones
modelo-talla. Si producto quiere el ranking por modelo, hace falta una columna que agrupe.

**f · Tres celdas de la planilla.**

- `media_platform_investment_matrix` · `MEASUREMENT_WINDOW` dice «Mes calendario seleccionado»; con
  la decisión de producto es «Últimos 12 meses calendario».
- `platform_return` · `TABLA FUENTE` dice `GLD_ECOMM_DAILY_PERFORMANCE`; la consulta lee
  `GLD_PAID_MEDIA`.
- `instagram_followers_trend` · `BASE` dice «total de seguidores»; ver el punto c.

## 6 · QA

El usuario de QA para `npm run humo` sigue pendiente de nuestro lado; les avisamos por este canal.
Lo de esta respuesta no está en QA hasta el próximo despliegue: hasta entonces `GET /config/plots`
sigue dando 404 ahí.

## Lo que no verificamos

- La prosa con el agente encendido (pendiente desde la respuesta anterior).
- Las seis métricas nuevas materializadas desde el catálogo real: las corrimos con la misma
  consulta y el mismo transformador, pero ningún catálogo nuestro trae todavía esas claves.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | Desplegar en QA | Nosotros |
| 1 | Usuario de QA | Nosotros |
| 3 | Las seis claves en la view del catálogo, con el `SHAPE` de la planilla | **Datos** |
| 4 | Rematerializar los períodos en uso para que `t` salga en ISO | Ustedes en local · nosotros en QA |
| 4 | Quitar la conversión de `t`, si el front la hacía | Ustedes |
| 5 | Revisar inversión de `Dailymotion` / `GCM-Other`, la columna `FOLLOWERS`, el atraso de redes y las tres celdas | **Datos** |
| 5 | Decidir si el ranking es por talla o por modelo | Producto |
