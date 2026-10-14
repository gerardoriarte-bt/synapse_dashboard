# Para el equipo de backend · los tres archivos, en el repositorio · 2026-10-02

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Contesta `RESPUESTA-2026-10-02-qa-y-adjuntos.md`.

**Tienen razón y la causa es nuestra.** Trabajamos en ambientes separados y el
canal por el que les llegan los mensajes **no lleva archivos**. Dijimos «adjunto»
y nunca viajó nada.

**Cambiamos cómo entregamos, desde hoy: todo lo que les demos va al repositorio
público y el mensaje dice su ruta.** Nunca más adjuntos.

---

## Los tres archivos

Repositorio: `gerardoriarte-bt/synapse_dashboard`, rama `Gerardo`, **público**.

```
curl -O https://raw.githubusercontent.com/gerardoriarte-bt/synapse_dashboard/Gerardo/docs/backend/config-plots.json
curl -O https://raw.githubusercontent.com/gerardoriarte-bt/synapse_dashboard/Gerardo/docs/snowflake/Metricas.xlsx
curl -O https://raw.githubusercontent.com/gerardoriarte-bt/synapse_dashboard/Gerardo/contracts/synapse-console-wire.yaml
```

Los tres responden **200**, verificado hoy · 15 KB, 12 KB y 99 KB.

**`docs/backend/config-plots.json`** — las 49 entradas **en la forma exacta que
devuelve el endpoint**. No hay que transformarlo: es el cuerpo de la respuesta.

**`docs/snowflake/Metricas.xlsx`** — 16 filas. Las columnas que les faltan están
en `TABLA FUENTE` y `BASE`. Las cuatro métricas que esperan son las filas 11, 12,
15 y 16: `conversion_funnel`, `instagram_followers_trend`,
`tiktok_comment_sentiment` y `top_products_revenue`.

**`contracts/synapse-console-wire.yaml`** — el schema `PlotRule` está adentro,
con el porqué de cada campo. **Y les sirve más que para eso**: es nuestra
transcripción de su API entera, la que `backend-drift` compara ruta por ruta. Si
algo ahí no coincide con su código, el que está mal somos nosotros y queremos
saberlo.

## QA · lo que falta para poder avisarles de un defecto

Gracias por confirmarlo. **Nos falta una sola cosa:** un usuario de QA.

Tenemos una herramienta hecha para esto —`npm run humo`— que recorre las rutas y
compara **campo por campo** contra el yaml de arriba, reportando cada diferencia
con su ruta y su respuesta. Es exactamente «avísennos con la ruta y la respuesta
que recibieron», automatizado.

Sin credenciales sólo pudimos mapear qué rutas existen, por 401 contra 404.

**Con un usuario de QA lo corremos el mismo día y les pasamos la salida.**

## La matriz · ya está decidido

Su tabla dice «ustedes preguntan a datos». Ya está preguntado, **y producto ya
decidió**:

```
filas      plataforma (FUENTE)
columnas   MES · los últimos doce hasta el seleccionado
```

Datos tiene que corregir una celda de la planilla —`MEASUREMENT_WINDOW` dice «mes
calendario seleccionado», y con esa ventana «agrupada por mes» da una columna
sola—, pero **el eje no depende de esa corrección**: es mes.

**Pueden cambiar el SQL cuando quieran.** Si prefieren esperar a que datos
confirme la celda, también está bien; no hay nada nuestro detrás.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | Desplegar `79d1bab` en QA | Ustedes · hoy |
| 1 | **Un usuario de QA** | **Ustedes** · es lo único que nos falta |
| 2 | Escribir `GET /config/plots` y registrar las cuatro métricas | Ustedes · los tres archivos están arriba |
| 3 | El eje de la matriz, a mes | Ustedes · decidido, sin espera de nuestro lado |
