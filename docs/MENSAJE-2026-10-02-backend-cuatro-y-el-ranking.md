# Para el equipo de backend · dos decisiones de producto sobre sus cuatro métricas · 2026-10-02

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Contesta `RESPUESTA-2026-10-02-plots-metricas-y-datos.md`. **Lo que midieron en
las tablas Gold cambió dos decisiones**, y las dos les ahorran trabajo.

**Medido contra `41746a0` el 2026-10-05** · de nuestro lado,
`coarsestRequired` en `src/surfaces/console/periodGrain.ts`: es lo que retira el
pedido de semanas de §3. Lo de ustedes, levantando `c8b9247` acá.

Antes que nada: verificamos lo suyo levantando `c8b9247` acá. `go build`,
`go vet` y `go test ./...` verdes; `GET /config/plots` devuelve **200 con las 49
entradas, idénticas al archivo que les pasamos, 4 con tope y ninguna con
`cap: null`**; y el `t` sale en ISO —`2025-10-01`— después de rematerializar.
**Está todo bien.**

---

## 1 · Las dos de redes quedan afuera por ahora

**`instagram_followers_trend` y `tiktok_comment_sentiment` no se publican.** La
razón es la que ustedes midieron: el último dato de Instagram es del
**2026-08-01** y el último post de TikTok con sentimiento es del **2026-03-05**,
así que para los períodos en uso las dos salen vacías.

**Su trabajo no se tira.** Las consultas quedan en su rama y se encienden el día
que el dato llegue, curando las dos filas del catálogo. **No hace falta que
quiten nada.**

**Las cuatro que sí van**: `conversion_funnel`,
`media_investment_composition`, `media_platform_investment_matrix` y
`top_products_revenue`.

**Y los tres hallazgos de su §5c y §5d quedan registrados**, porque son el punto
de partida cuando se retome: `FOLLOWERS` no parece el total —200 a 400 por día
contra 1.157.829 en `GLD_SOCIAL_MEDIA_PROFILE_METRICS`—, los días con filas
repetidas, y que `GLD_SOCIAL_MEDIA_POSTS` no trae comentarios de Instagram. Se lo
pasamos a datos.

## 2 · El ranking va por MODELO

Preguntaron si el top 10 es por talla o por modelo. **Por modelo.**

Su medición lo decide: con `PRODUCT_ID` como grano, el top 10 son combinaciones
modelo-talla —«UA Charged Assert 10 … US 10.5 - MX 8.5»— sobre 1.641 productos en
septiembre. Un top de tallas contesta una pregunta de inventario; el panel
pregunta qué producto vende.

**Qué necesitamos de ustedes: nada todavía.** Hace falta primero la columna que
agrupe, que es lo que ustedes mismos señalaron. **Ya se la pedimos a datos**, y
cuando la definan les pasamos el nombre.

**Mientras tanto `top_products_revenue` no se publica**: un ranking por talla
rotulado «top productos» se ve bien y contesta otra cosa.

## 3 · Lo que no cambia

Las **otras seis** —las de MMM y forecast, `revenue_forecast` y compañía— son un
conjunto distinto. Esperan **las claves en el registro de Go**, y nada más. El
archivo con las seis está en `docs/backend/metricas-mmm-y-forecast.md`, en nuestro
repositorio.

**~~y los períodos semanales~~ · retirado el 2026-10-05.** Lo pedimos como si
destrabara estas seis. **No las destraba**, y la prueba era nuestra:
`coarsestRequired` toma el grano más grueso de la pestaña, así que una métrica
semanal nunca apaga los meses. Se difieren por acuerdo, en
`MENSAJE-2026-10-05-backend-las-semanas-pueden-esperar.md`.

**Son dos grupos de seis y conviene no mezclarlos**: uno viene de
`Metricas.xlsx`, el otro del informe de MMM del 29.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | Las dos de redes, pausadas · no hay nada que quitar | — |
| 2 | La columna que agrupa por modelo | **Datos** · les pasamos el nombre cuando esté |
| 3 | Las seis de MMM: **las claves en el registro**, nada más | Ustedes · ya pedido |
| — | Desplegar en QA y el usuario de QA | Ustedes |
