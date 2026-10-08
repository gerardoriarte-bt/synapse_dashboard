# Para el equipo de datos · de qué métrica es lo que contesta el agente · 2026-10-08

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `9dc481e` el 2026-10-08**: el binario del backend en ese commit,
levantado acá contra `SYNAPSE_UA` real. Hicimos una pregunta en el chat de
pestaña, capturamos el stream con el SQL que corrió el agente, y lo cruzamos
con `/config/catalog` del mismo binario y con
`docs/snowflake/synapse-catalogo-metricas.md`.

Hola. Necesitamos una columna más en `SYNAPSE_METRIC_CATALOG`. El motivo va
primero, porque es lo que decide cómo llenarla.

---

## El problema

Cuando el agente contesta en el chat, cada cifra tiene que declarar de qué
métrica es: su familia, que le da el color, su BASE y su fuente. Esos datos
salen del catálogo. **Pero el agente escribe su propio SQL**, y entre lo que
consultó y la fila del catálogo no hay ningún identificador en común:

- El agente consulta la vista semántica (`SV_SYNAPSE_UA_ANALYTICS`) y las
  tablas Gold.
- Las claves del catálogo (`revenue`, `spend`…) salen del materializador, que
  no usa la capa semántica. Su documento ya lo dice: las claves de la vista
  semántica «no sirven para el catálogo».

Hoy el backend intenta adivinarlo comparando nombres, y con el dato real falla.
Preguntamos por los ingresos de paid media por mes. El agente sumó
`ingresos_usd` de `GLD_PAID_MEDIA` y lo llamó `revenue`. El backend lo cruzó
con la métrica `revenue` del catálogo, que es `SUM(REV_TOTAL)` de
`GLD_ECOMM_DAILY_PERFORMANCE`, la venta del sitio medida por Adobe. **Las dos
se llaman «ingresos», y una es lo que reporta cada plataforma y la otra lo que
vendió el sitio.**

El nombre no puede ser la llave: lo elige el modelo en cada respuesta y cambia
con cada cliente. **Lo que no cambia es de dónde sale el número**, y eso es lo
que les pedimos que declaren.

---

## El pedido

**Por cada métrica activa del catálogo, su origen en Gold: la tabla y la
columna, o la expresión, de la que sale.** Por ejemplo, `revenue` →
`GLD_ECOMM_DAILY_PERFORMANCE.REV_TOTAL`.

Va en el catálogo y no en el código del backend por la misma razón que el
resto de la gobernanza: el catálogo es de cada cliente y lo firman ustedes.
Con otro tenant las tablas y columnas son otras, y la equivalencia viaja con
ellas.

Con eso, el backend declara la métrica de una respuesta sólo si el agente
consultó **exactamente** ese origen. Si no coincide, la cifra llega sin
familia ni base, y el front lo dice en vez de inventar.

**Lo que necesitamos saber de su lado:**

1. **¿La columna puede ser la expresión que ya calcula el materializador?** Las
   consultas de verificación de su documento ya escriben `SUM(REV_TOTAL) …
   FROM GLD_ECOMM_DAILY_PERFORMANCE`. No sabemos si hay métricas cuyo origen no
   se reduce a una tabla y una columna, como `roas`, que divide dos.
2. **¿Las tablas lógicas de la vista semántica corresponden una a una con
   tablas Gold?** En el stream, una consulta del agente nombró la tabla física
   (`DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PAID_MEDIA`) y la otra sólo la lógica
   (`__gld_producto_analytics`). Para la segunda, el backend necesitaría saber a
   qué tabla física apunta, y eso lo declara la vista semántica.

## Lo que NO es el pedido

No les pedimos renombrar columnas de la vista semántica ni del modelo, aunque
`ingresos_usd` en dos tablas con dos significados es lo que confunde. Si
ustedes creen que conviene distinguirlas en la vista, es decisión suya. La
equivalencia declarada es lo que necesitamos para que no dependa de cómo se
llamen.

## Lo que NO medimos

- Si el resultado de la herramienta `Analyst_UA` trae el nombre de la métrica de
  la vista semántica que usó. Si lo trae, quizá la equivalencia pueda hacerse
  contra eso en vez de contra la tabla y la columna.
- Cuántas de las métricas activas tienen un origen de una sola tabla.

En paralelo le pedimos al backend que, mientras tanto, mande esos campos vacíos
en vez de adivinar: `MENSAJE-2026-10-08-backend-procedencia-por-nombre.md`.

Gracias.
