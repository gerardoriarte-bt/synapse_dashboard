# Para el equipo de datos · una corrección en `Metricas.xlsx` · 2026-10-01 (noche)

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Una línea a corregir en una fila.** El backend ya está escribiendo la métrica y
la escribió con otro eje.

## La fila

```
METRIC_KEY           media_platform_investment_matrix
SHAPE                matrix
DIMENSIONS           ["FUENTE"]
BASE                 Suma de inversión (cost_usd) por plataforma, agrupada por mes
MEASUREMENT_WINDOW   Mes calendario seleccionado        ← ésta
```

## Qué está mal

Una matriz necesita dos ejes: filas = plataforma, columnas = «agrupada por mes».
**Pero la ventana es un solo mes, así que agrupar por mes da una sola columna.**

## Lo correcto, decidido por producto

**Filas = plataforma · columnas = MES.** La `BASE` está bien; la ventana es la
que hay que cambiar:

```
MEASUREMENT_WINDOW   Últimos doce meses calendario hasta el seleccionado
```

Es la misma ventana que tenía `platform_month_matrix`, la métrica que ésta
reemplaza.

**No hace falta que nos manden nada**: con corregir esa celda alcanza. Se lo
avisamos al backend en paralelo, porque implementaron columnas por **semana del
mes** —era la única lectura que producía una matriz con la ventana tal como está
escrita— y tienen que cambiar el SQL.

---

**Y gracias por la planilla**: la regla forma→unidad que trae —`multi_series`,
`tabular` y `flow` sin unidad, las otras seis con— nos corrigió un pedido que
íbamos a mandarles pidiendo `UNIT = 'x'` para `media_efficiency_12m` y
`platform_return`. Estaban bien como están.
