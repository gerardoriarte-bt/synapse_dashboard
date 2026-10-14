# Redes sociales afuera · y el ranking por modelo · 2026-10-02

> **Decisiones tomadas**, con lo que se midió para tomarlas. Tienen fecha y **no
> se editan después**.

Las dos salen de la respuesta del backend del 2026-10-02, §3 y §5, y las tomó
producto el mismo día.

---

## 1 · Las dos métricas de redes sociales quedan afuera

**`instagram_followers_trend` y `tiktok_comment_sentiment` no se construyen por
ahora.** No hay datos.

**Lo medido, que es lo que la sostiene** —el backend lo leyó de las tablas Gold
al escribir las consultas—:

| Tabla | Último dato |
|---|---|
| `GLD_SOCIAL_MEDIA_FOLLOWERS` · Instagram | **2026-08-01** |
| `GLD_SOCIAL_MEDIA_POSTS` · TikTok con sentimiento | post del **2026-03-05** |

Para septiembre y octubre de 2026 las dos salen «No hay datos de este período
todavía». Y hay dos problemas más en el origen: `FOLLOWERS` **no parece ser el
total** —los valores diarios de julio son de 200 a 400, mientras
`GLD_SOCIAL_MEDIA_PROFILE_METRICS` trae 1.157.829 para el 1 de agosto—, y
`GLD_SOCIAL_MEDIA_POSTS` no trae comentarios de Instagram: sus 529 filas tienen
el sentimiento vacío.

**Las seis del `Metricas.xlsx` pasan a ser CUATRO**: `conversion_funnel`,
`media_investment_composition`, `media_platform_investment_matrix` y
`top_products_revenue`.

**No se descartan, se posponen.** El trabajo del backend ya está hecho y queda
en su rama; cuando el dato llegue se encienden curando las dos filas del
catálogo. Lo que no corresponde es publicarlas vacías: un panel que dice «no hay
datos» desde el día uno enseña a ignorar el estado.

**Y lo que el backend midió sobre esas tablas NO se tira**: está en su respuesta
y en `docs/ESTADO-qa-2026-10-02.md`. El día que se retomen, esos tres hallazgos
—el atraso, la columna que no es el total, y el sentimiento vacío— son el punto
de partida.

## 2 · El ranking de productos va por MODELO, no por talla

**`top_products_revenue` agrupa por modelo.**

**Lo que pasa hoy**, medido por el backend contra los datos de UA: `PRODUCT_ID`
es la talla, no el modelo, así que el top 10 son combinaciones modelo-talla:

```
Tenis para correr UA Charged Assert 10 para hombre Black US 10.5 - MX 8.5
```

Septiembre tiene **1.641 productos** con ese grano.

**Por qué por modelo.** Un top 10 de tallas responde «qué SKU se vendió más», que
es una pregunta de inventario, no de negocio. La pregunta que el panel contesta
—qué producto vende— se responde por modelo, y con el grano de talla las diez
filas pueden ser el mismo producto en diez tallas sin que se note.

**Qué hace falta**, y no es nuestro: una columna en `GLD_PRODUCTO_ANALYTICS` que
agrupe las tallas de un modelo. El backend lo dijo así —«si producto quiere el
ranking por modelo, hace falta una columna que agrupe»— y se le pidió a datos.

**Mientras no exista, la métrica no se publica.** Un ranking por talla rotulado
como «top productos» es la clase de panel que se ve bien y contesta otra cosa.

---

## Lo que esto NO cambia

**Las seis de MMM y forecast** —`revenue_forecast`, `inventory_forecast`,
`revenue_forecast_close`, `media_roas_recommendation`,
`mmm_channel_contribution`, `mmm_weekly_contribution`— son otro conjunto y siguen
como estaban: esperan las claves en el registro de Go y los períodos semanales.

**Son dos grupos de seis y conviene no mezclarlos**: uno viene de
`Metricas.xlsx`, el otro del informe de MMM.
