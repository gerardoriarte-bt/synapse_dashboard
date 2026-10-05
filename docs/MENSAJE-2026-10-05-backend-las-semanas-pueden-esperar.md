# Para el equipo de backend · de acuerdo con diferir las semanas · 2026-10-05

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Contesta `RESPUESTA-2026-10-02-periodos-semanales.md`.

**De acuerdo, y lo verificamos en nuestro código antes de contestar.** Su §4
—«las seis de forecast y MMM no dependen de esto»— es correcto.

**Medido contra `5a23224` el 2026-10-05** · `coarsestRequired` en
`src/surfaces/console/periodGrain.ts`, leído y corrido. Es código nuestro, así
que el pedido original se caía sin preguntarles nada.

---

## Lo que medimos

El selector agrupa los períodos por grano y apaga el que las métricas de la
pestaña no pueden contestar. La regla la decide `coarsestRequired`, y el
resultado es:

| Métricas de la pestaña | ¿Meses? | ¿Semanas? |
|---|---|---|
| Las seis, todas semanales | **sí** | sí |
| Semanales + las diarias de hoy | **sí** | sí |
| Alguna MENSUAL en la pestaña | **sí** | **no** |

**Una métrica semanal nunca deshabilita los meses.** Así que las seis se pueden
publicar hoy, en un período mensual, y su serie dibuja sus puntos semanales
adentro — igual que `media_efficiency_12m` dibuja doce meses dentro de uno.

## Y hay algo que refuerza lo que decidieron

Mirando la tercera fila: **basta con que UNA métrica de la pestaña sea mensual
para que las semanas queden apagadas.** O sea que los períodos semanales sólo
rinden en una pestaña donde **todas** las métricas sepan contestar por semana.

Eso no es un detalle del selector: es una decisión de composición que hoy no está
tomada. Construir la infraestructura antes de saber en qué pestaña vive es
construir a ciegas, y es un argumento más para diferirlo.

## Nuestro pedido estaba sobredimensionado, y lo decimos

Les pedimos los períodos semanales como si destrabaran las seis métricas. **No las
destraban**, y eso lo podíamos haber medido antes de pedirlo — el selector es
nuestro.

Lo que dijimos bien fue el otro lado: declarar `MIN_GRAIN = week` en el catálogo
**no rompe nada hoy**, y conviene que quede declarado aunque las semanas no sean
seleccionables. Es el dato del dato.

## Las cinco definiciones, y de quién son

Tres no son nuestras, pero las anotamos para que no se pierdan:

| | Pregunta | De quién |
|---|---|---|
| 1 | Qué es una semana —ISO lunes a domingo— y cómo se identifica en las tablas | **Datos** |
| 2 | Qué métricas deben responder por semana | **Producto** |
| 3 | Cuánta historia semanal ofrecer | **Producto** |
| 4 | Contra qué se compara una semana | **Producto y diseño** · ver abajo |
| 5 | Si las metas se pueden sumar por semana | **Datos** |

**La 4 es la más cara y conviene decirlo ahora.** Hoy cada KPI declara dos
comparativos —mes anterior y mismo mes del año pasado— y el panel los pinta como
vienen. Para semanas hay que decidir no sólo contra qué se compara sino **cómo se
alinean las semanas entre años**, que es donde la respuesta deja de ser obvia: la
semana 32 de 2026 no cubre los mismos días que la de 2025.

**Y es una decisión de producto con consecuencia de diseño**, porque el rótulo lo
lee una persona. «VS SEMANA ANTERIOR» es claro; «VS MISMA SEMANA DEL AÑO
ANTERIOR» promete una comparación que sólo es honesta si las semanas se alinean.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| — | Las semanas, diferidas a otra fase | **De acuerdo** |
| — | `MIN_GRAIN = week` en las seis del catálogo | Datos · ya pedido |
| — | Las seis claves en el registro de Go | Ustedes · sigue pendiente |
| 4 | El comparativo semanal, cuando se planifique | Producto y diseño |
