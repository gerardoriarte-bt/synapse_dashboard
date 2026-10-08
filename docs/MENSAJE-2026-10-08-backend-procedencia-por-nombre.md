# Para el equipo de backend · la procedencia del chat de pestaña · 2026-10-08

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `9dc481e` el 2026-10-08**: `dd_chat_tab_provenance.go`,
`dd_chat_service.go`, `dd_chat_structured.go` y `cortex_sse.go` leídos, y el
binario de `9dc481e` levantado acá contra `SYNAPSE_UA` real. Hicimos una
pregunta en el chat de pestaña y capturamos el stream completo. Del lado del
front medimos primero lo nuestro: lo que cambiamos está al final.

Hola. Gracias por `9dc481e` y por la guía `RESPUESTA-2026-10-08-backend-graficos-del-chat.md`.
**El cambio del prompt anda**: con la misma pregunta, la respuesta trajo
conclusión, puntos de lectura, fuentes, límite declarado y
`### Recomendaciones`, y el agente consultó y graficó. Eso pueden desplegarlo.

**El cruce de la procedencia en pestaña les pedimos que NO lo desplieguen
como está.** Al medirlo, declara la gobernanza de otra métrica, y la elige
distinta para el mismo dato. Abajo va lo medido.

---

## Lo que medimos

Pregunta, con `tab_context` de la pestaña `resumen` y período `2026-09`:

> ¿Cuánto ingreso generó paid media (Meta, Google y TikTok) por mes de enero a
> agosto de 2026? Grafícalo.

El agente consultó `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PAID_MEDIA`, sumó
`ingresos_usd` filtrando `fuente` por plataforma, y le puso el alias
`revenue` a la suma. El stream trajo tres frames `data`:

| Frame | `shape` | Columnas | `metric_key` declarada | `base` declarada |
|---|---|---|---|---|
| 1 | `tabular` | `mes`, `plataforma`, `revenue` | `revenue` | «Venta total del sitio medida por Adobe Analytics, en USD…» |
| 2 | `tabular` | `mes`, `plataforma`, `revenue` | `platform_return` | «ROAS reportado por la plataforma…» |
| 3 | `raw` + `chart_spec` | `PLATAFORMA`, `MES`, `REVENUE` | `""` | `""` |

**Los frames 1 y 2 traen las mismas 24 filas**, idénticas byte a byte, y
declaran dos métricas distintas. Son tres defectos, y los tres están en el
código:

### 1 · El cruce no es determinista

Las mismas filas salieron declaradas como dos métricas. Hay dos columnas que
coinciden con algo:

- `revenue` coincide exacto con la clave `revenue`.
- `plataforma` está **contenida** en `retornoporplataforma`, el nombre
  normalizado de `platform_return` («Retorno por plataforma»).

**Lo que creemos que decide cuál gana**, leído y no medido:
`resolveTabMetricKey` recorre `for col := range rows[0]`, y `rows[0]` es un
`map[string]any` (`rowsFromResultSetPayload`, `dd_chat_structured.go:110`). En
Go el orden de un `map` no está fijado, así que gana la columna que salga
primero.

**Lo repetimos desde la consola, con el front contra el mismo binario.** El
agente esta vez llamó a la columna `ingresos_usd` y no `revenue`, y otra vez
las mismas filas salieron dos veces: una como `revenue` y otra como
`platform_return`. En pantalla son dos tablas idénticas, una con la BASE «Venta
total del sitio medida por Adobe Analytics» y otra con «ROAS reportado por la
plataforma».

### 2 · Coincidir por nombre declara la base de otra métrica

Aunque el cruce fuera determinista, **las dos respuestas están mal**. Lo que el
agente sumó son los ingresos que reporta cada plataforma desde `GLD_PAID_MEDIA`.
`revenue` en el catálogo es `SUM(REV_TOTAL)` de `GLD_ECOMM_DAILY_PERFORMANCE`,
la venta del sitio medida por Adobe. Así lo dice la consulta de verificación de
`docs/snowflake/synapse-catalogo-metricas.md`. Comparten la palabra «ingresos»
y son dos métricas distintas.

Con el frame 1, el front pinta una tabla de paid media con la BASE «Venta
total del sitio» y la fuente «Adobe Analytics». **Es peor que una base
vacía**: se ve bien y es falsa.

El alias `revenue` lo eligió el modelo para esta respuesta. Con otra pregunta
o con otro cliente el nombre cambia, así que cruzar por nombre no tiene arreglo
afinando la heurística.

### 3 · El gráfico no se cruza nunca, que era el caso del pedido

Pedimos la familia el 07 por el frame del gráfico. En el stream real
`chart_spec` llega **como texto JSON, no como objeto**. `findKey` devuelve un
`string` y `vegaLiteFieldHints` sólo mira un `map`, así que el gráfico sale
siempre con `family: ""`. Lo mismo pasa con `usermeta.snowflake.columnRoles`,
que vive adentro de ese texto.

La prueba no lo ve porque le da el spec como objeto:
`dd_chat_tab_provenance_test.go:90`.

---

## Los pedidos

1. **No desplegar el cruce como está.** Mientras no haya un cruce exacto,
   que en pestaña sigan llegando vacíos `family`, `base`, `layer` y
   `source_system`. El front ya los declara así y no inventa un color. **Una
   procedencia vacía es correcta; una equivocada no.**

2. **Cruzar sólo por igualdad, y contra el origen de la métrica, no contra su
   nombre.** Nada de nombres contenidos ni de alias del SQL. El origen es la
   tabla y la columna Gold de cada métrica. Para que no quede escrito en Go por
   cliente, le pedimos a datos que lo declaren en el catálogo:
   `MENSAJE-2026-10-08-datos-equivalencia-semantica.md`. Con ambigüedad o sin
   coincidencia, el campo va vacío.

3. **Copiar la base del catálogo sólo cuando la consulta ES la métrica**: mismo
   origen y ningún filtro además del período. Si el agente filtra por medio,
   plataforma o cualquier otra dimensión, la base del catálogo ya no describe
   el número, y **va vacía**. La familia sí se puede mantener, porque es de la
   métrica y no de la consulta.

   **Vale también para `panel_context`**, aunque ahí no lo medimos con un
   stream: `provenanceFromContext` copia `pc.Base` siempre
   (`dd_chat_structured.go:57`). Una pregunta de paid media hecha desde el panel
   de Ingresos llevaría la misma base falsa.

   Para esto necesitan el texto del SQL cuando arman el frame `data`. Hoy
   `pump` guarda sólo `sqlSeen` y descarta el texto, aunque el frame `sql` llega
   antes que su `data` (`translateToolResult`, `cortex_sse.go:141`).

4. **Leer `chart_spec` también cuando llega como texto**, igual que ya lo hace
   el front (`src/api/vegaLite.ts`).

**Cómo saber que quedó:** con la pregunta de arriba, los frames de paid media
salen con `metric_key`, `base` y `family` vacías, y repetirla diez veces da
siempre lo mismo.

---

## Lo que cambiamos de nuestro lado

- **El chat dibuja por la forma.** Si el panel de origen no acepta lo que
  llegó, se usa el único tipo de `/config/blocks` que lo acepta: un `tabular`
  se dibuja como tabla. Era la «Opción A» de su guía. **Por eso el pedido 1
  urge**: con `9dc481e` desplegado, la tabla del frame 1 se vería con la base
  de la venta del sitio.
- **Una base vacía se lee como «Base · la consulta no la declara»** y no como
  un separador colgando. Pueden mandarla vacía sin que se vea rota.
- **No buscamos el panel por `metric_key`.** Lo consideramos, y lo descartamos
  por lo que muestra este mensaje.

Sobre la guía, dos cosas para que no las busquen:

- **El `shape: "chart"` de primer nivel no hace falta contemplarlo.** Su código
  siempre lo envuelve: `cortex_sse.go:115` arma `{shape: "chart", chart_spec}` y
  `StructuredDataFromCortex` lo devuelve como `raw`.
- **Sin familia no pintamos en gris.** El color de una cifra sale del catálogo y
  el front no lo elige. El dato se declara en vez de dibujarse.

## Lo que NO medimos

- Por qué gana una columna y no la otra. Lo medido son dos corridas, y en las
  dos el mismo resultado salió con dos métricas distintas. Que la causa sea el
  orden del `map` sale de leer el código.
- El chat de panel con una pregunta filtrada. El pedido 3 sobre `panel_context`
  sale de leer el código.
- Si el resultado de `Analyst_UA` trae el nombre de la métrica de la vista
  semántica que usó. Si lo trae, puede ser un camino más directo que leer el SQL.

Gracias.
