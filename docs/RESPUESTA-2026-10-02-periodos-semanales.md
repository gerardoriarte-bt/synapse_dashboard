# Para el equipo de datos · los períodos semanales quedan para otra fase · 2026-10-02

Recibimos el pedido de que la consola permita elegir **semanas** además de meses
(`2026-W32`), a raíz de las tablas de forecast y MMM que entregaron. Queremos
explicar por qué eso no entra en la fase actual, y qué sí podemos hacer ahora con
sus datos.

## Por qué es algo nuevo y no un ajuste

Hoy, en toda la plataforma, **un período es un mes**. No es solo el selector de la
pantalla: es la unidad con la que trabaja cada parte del sistema.

| Parte | Cómo funciona hoy |
|---|---|
| Cálculo de los paneles | Cada noche se calculan y guardan los valores del mes en curso y del anterior |
| Lectura de los paneles | La consola pide «el valor de tal métrica en tal mes» y lee lo ya calculado |
| Comparativos | Cada KPI se compara contra el mes anterior y contra el mismo mes del año pasado |
| Resumen ejecutivo | El agente redacta un párrafo por mes |
| Chat y detalle por dimensión | Las preguntas y los desgloses se hacen sobre el mes elegido |

Agregar semanas a la lista del selector es la parte pequeña. Para que una semana
elegida muestre algo, hay que cambiar todas las anteriores.

## Qué implica

- **Todas las métricas pasan a ser semanales, no solo las nuevas.** Ventas,
  órdenes, inversión y el resto tienen grano diario, así que la consola las
  ofrecería por semana. Habría que calcularlas y guardarlas por semana también;
  si no, esos paneles quedan vacíos al elegir una.
- **El cálculo nocturno se multiplica.** Hoy son dos períodos por cliente por
  corrida. Con doce semanas de historia serían catorce, cada uno con sus consultas
  a Snowflake y, si está encendido, su llamada al agente para el resumen.
- **Los comparativos no están definidos para semanas.** «Mes anterior» y «mismo
  mes del año pasado» tienen sentido claro. Para una semana hay que decidir contra
  qué se compara: la semana previa, la misma semana del año anterior, y cómo se
  alinean las semanas entre años.
- **Las metas.** Las tablas traen metas diarias que hoy se suman por mes. Hay que
  confirmar que sumarlas por semana da una meta válida para el negocio.

## Qué queda para la siguiente fase

Los períodos semanales seleccionables, completos: selector, cálculo, comparativos,
resumen y chat. Es un desarrollo propio, con su diseño y sus pruebas, y no lo
vamos a mezclar con la fase en curso.

## Qué sí podemos hacer ahora con sus datos

Las seis métricas de forecast y MMM, en principio, **no dependen de esto**. Un
pronóstico o una contribución semanal es una serie cuyos puntos son semanas, y
eso la plataforma ya lo sabe mostrar dentro del período mensual, igual que hoy
muestra una serie de doce meses. Lo confirmamos al revisar el detalle de cada
métrica contra las tablas.

## Lo que necesitaremos de ustedes para esa fase

Cuando se planifique, estas definiciones son las que determinan el diseño:

1. **Qué es una semana:** si es la semana ISO (lunes a domingo) y cómo se
   identifica en las tablas.
2. **Qué métricas deben responder por semana:** todas, o solo las de forecast y
   MMM.
3. **Cuánta historia semanal** tiene sentido ofrecer.
4. **Contra qué se compara una semana.**
5. **Si las metas se pueden sumar por semana.**
