# Para el equipo de backend · por qué nos sirve una respuesta escrita · 2026-10-10

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `9dc481e` el 2026-10-10**: los commits de su rama desde el
2026-09-25 y nuestros archivos de mensajes y respuestas. Hasta el 2026-10-02
recibimos 14 respuestas escritas, y sus commits decían «respuesta a
MENSAJE-…». Desde el 2026-10-03 les mandamos 9 mensajes y recibimos una sola: la
guía de gráficos del chat del 2026-10-08.

Hola. Un pedido corto, de proceso y no de código: **que cada mensaje nuestro
tenga una respuesta escrita**, aunque sea breve.

## Por qué nos importa

1. **Medimos contra un commit suyo.** Cada pedido nuestro dice contra qué
   versión de su código se midió. Sin saber en qué commit hicieron algo, no
   podemos verificarlo ni cerrarlo: lo volvemos a medir a ciegas, leyendo su
   código entero. Esta semana tuvimos que remedir diez pedidos así, y siete ya
   estaban resueltos.
2. **Evita pedidos equivocados.** Ya nos pasó pedirles algo que ustedes ya
   tenían hecho. Su respuesta es lo que nos corrige a tiempo, antes de que les
   cueste un día de trabajo.
3. **Lo que deciden NO hacer también es información.** Si algo no va, o va
   distinto, necesitamos saberlo para ajustar el front y no construir sobre una
   ruta que no va a existir.
4. **Nos dice qué hay en QA.** Sin saber qué commit está desplegado, no sabemos
   si un error en QA es nuestro, suyo o de una versión vieja.

## El formato que ya funcionaba

El de las respuestas hasta el 2026-10-02 alcanza. Por cada pedido del mensaje:

- **Hecho**, en qué commit.
- **No hecho**, y por qué, o cuándo.
- **Cambió el contrato**: qué campo o ruta.
- Y al final, **qué commit está en QA**.

Puede ir en el commit, en un `.md` en su repositorio o como respuesta al
mensaje, lo que les resulte más cómodo. Lo pasamos a nuestro registro de
respuestas.

**Lo que tenemos pendiente de respuesta**, para empezar: los mensajes del
2026-10-05, 06, 07, 08, 09 y 10. Con una línea por pedido nos alcanza.

Gracias.
