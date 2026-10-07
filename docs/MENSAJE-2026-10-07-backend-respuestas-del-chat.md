# Para el equipo de backend · las respuestas del chat · 2026-10-07

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `7b717aa` el 2026-10-07**: `dd_chat_prompt.go`,
`cortex_sse.go` y `dd_chat_structured.go` leídos, y el binario de `7b717aa`
levantado acá contra `SYNAPSE_UA` real. Capturamos un stream completo de
`POST /config/chat`. Del lado del front medimos primero lo nuestro, y **dos de
las tres causas eran nuestras**: ya están corregidas (abajo).

Hola. Datos y producto nos preguntaron por qué el chat de Synapse contesta
corto, sin gráficos y sin recomendaciones, si el mismo agente en Snowflake
Intelligence lo hace. Lo rastreamos de punta a punta. Les pedimos dos cosas.

---

## 1 · El bloque de formato le recorta la respuesta al agente

El agente está armado para analizar. Leímos `DESCRIBE AGENT
DB_BT_UA.BT_UA_MART_ANALYTICS.SYNAPSE_UA`: su `response` lo define como
«Senior Data Strategy Consultant», tiene la herramienta `data_to_chart` y su
`orchestration` dice *«ALWAYS generate a chart when: rankings, time series >=3
points, comparisons, distributions»*.

`BuildChatContextMessage` le antepone a cada pregunta un bloque propio, y como
viaja en el mensaje `role=user` pesa más que las instrucciones del agente.
Las cuatro líneas que recortan, en `internal/core/services/dd_chat_prompt.go`:

| Línea | Qué dice | Qué produce |
|---|---|---|
| 164 | «Empieza con una conclusión de **una o dos frases**» | Respuestas cortas |
| 165 | Tres secciones fijas: Puntos de lectura, Fuentes consultadas, Límite declarado | **Ninguna para recomendaciones** |
| 91 | «consulta Snowflake **solo** para lo que no esté ahí», con hasta 8 KB del panel en el mensaje | El agente casi no consulta, y sin consulta no hay gráfico |
| 90 | «Responde sobre esta métrica y este período» | Corta las comparaciones con otras métricas |

**La prueba de que es el bloque y no el agente:** con el mismo binario, en el
chat de pestaña, preguntamos «¿Cómo evolucionaron los ingresos mes a mes en los
últimos 6 meses? **Dame conclusiones y recomendaciones.**». La respuesta trajo
conclusión, cinco puntos de lectura, fuentes, límite declarado, tres
recomendaciones, una pregunta de seguimiento y un gráfico. Cuando el usuario no
lo pide explícitamente, el bloque gana.

**El pedido:** reescribir `writeResponseFormat` y las dos líneas de
instrucciones para que digan, más o menos:

- Abre con la conclusión, explica el porqué con los números y **cierra con
  recomendaciones accionables** (`### Recomendaciones`).
- Si la pregunta pide tendencia, ranking, comparación o distribución,
  **consulta Snowflake y grafica con `data_to_chart`**, aunque el panel ya
  traiga un número.
- Los datos del panel son el punto de partida, no el límite.

**Lo único de ese bloque del que depende el front** es la primera línea
`[SIN_COMPETENCIA]` (`src/surfaces/console/parseMarkdown.ts`). Los títulos de
sección se pintan como markdown común, así que pueden cambiarlos o sacarlos sin
romper nada nuestro. La otra opción es dejar de repetir instrucciones de
formato y que mande la `response` del agente: lo deciden ustedes.

---

## 2 · En el chat de pestaña, el dato llega sin familia

`provenanceFromContext` (`dd_chat_structured.go:42`) en modo pestaña sólo llena
`source` y `period`. En el stream capturado, **los dos frames `data` traían
`family: ""`**, y también `base`, `layer` y `source_system` vacíos: el
`tabular` de los seis meses y el `chart` de la línea.

El color de una cifra lo dicta la familia de la métrica, y el front no la puede
elegir. Así que hoy, en el modo por defecto del chat, el gráfico **llega pero se
declara sin dibujarse** («El catálogo no declaró de qué familia es»). En el chat
de panel sí se dibuja, porque ahí la procedencia trae la familia del panel.

**El pedido:** que cada frame `data` del chat de pestaña declare la gobernanza
de la métrica que el agente consultó: `family`, `base`, `layer` y
`source_system`, sacados del catálogo. No sabemos cuál es el mejor camino para
identificarla. El spec del agente trae
`usermeta.snowflake.columnRoles` (`INGRESOS: measure`), y quizá eso alcance para
cruzarlo con el catálogo, pero es una suposición nuestra y no lo medimos. Si no
se puede identificar, que siga vacía: el front lo declara y no inventa un
color.

---

## Lo que corregimos de nuestro lado · para que no lo busquen

- **El gráfico se descartaba en el front.** Ustedes mandan `response.chart` como
  `{shape: "raw", data: {shape: "chart", chart_spec}}` y nuestro adaptador no
  tenía caso para eso. Ahora traduce el Vega-Lite a nuestras formas —una línea
  es `series` y una barra es `bars`— y lo dibuja con nuestros colores. **No
  hace falta que cambien ese frame**: nuestro contrato decía que lo normalizaba
  el backend, y estaba mal escrito de nuestro lado.
- **`family: ""` tiraba el dato entero**, en vez de declararlo.
- **Las tablas markdown del agente se veían como un párrafo de pipes.** Ahora se
  pintan como tabla.

Lo probamos con el spec real que devolvió `SYNAPSE_UA`, capturado en
`tests/api/fixtures/chart-spec-ingresos-2026-10-07.json`.

## Lo que NO medimos

- El `system_prompt_base` del agente **en QA**. En la base local está vacío,
  pero si en QA tiene texto también se antepone, y vale revisarlo con el mismo
  criterio.
- Si `data_to_chart` emite a veces specs con `aggregate` o `transform`. El front
  los rechaza a propósito, porque dibujarlos obligaría a calcular la cifra en el
  navegador. En las capturas de hoy no apareció ninguno.

Gracias.
