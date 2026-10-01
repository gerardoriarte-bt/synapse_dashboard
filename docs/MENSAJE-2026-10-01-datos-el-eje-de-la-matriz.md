# Para el equipo de datos · el eje de columnas de la matriz · 2026-10-01 (noche)

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Una pregunta, sobre una fila de `Metricas.xlsx`.** El backend ya está
escribiendo la métrica y necesita el eje para cerrar el SQL.

## La fila

```
METRIC_KEY           media_platform_investment_matrix
SHAPE                matrix
DIMENSIONS           ["FUENTE"]
BASE                 Suma de inversión (cost_usd) por plataforma, agrupada por mes
MEASUREMENT_WINDOW   Mes calendario seleccionado
```

## Lo que se contradice

Una matriz necesita **dos** ejes. Las filas son plataforma —`FUENTE`—, y las
columnas tendrían que salir de «agrupada por mes».

**Pero la ventana es un solo mes**, así que agrupar por mes da **una columna**.
Una de las dos líneas está mal.

## Lo que creemos, y por qué preguntamos en vez de asumirlo

La métrica que reemplaza —`platform_month_matrix`— declaraba «inversión bruta de
cada plataforma en **los últimos doce meses**». Con esa ventana, «agrupada por
mes» sí produce una matriz: filas = plataforma, columnas = mes.

**Si es eso, lo que hay que corregir es `MEASUREMENT_WINDOW`**, no la base.

## Lo que el backend hizo mientras tanto

Eligieron **semana del mes** —«Semana 1» son los días 1 a 7, hasta «Semana 5»—,
que es la única lectura que produce una matriz con la ventana tal como está
escrita. Está implementado y anda.

**Les pedimos que confirmen una de las tres:**

| | Filas × columnas | Qué habría que cambiar en la planilla |
|---|---|---|
| **a** | plataforma × **mes**, últimos 12 | `MEASUREMENT_WINDOW` → «últimos doce meses hasta el seleccionado» |
| **b** | plataforma × **semana** del mes | `BASE` → «agrupada por semana del mes» |
| **c** | plataforma × **día** del mes | `BASE` → «agrupada por día» |

**No cambiamos nada hasta que contesten**, y el backend tampoco.

---

**Y gracias por la planilla**: resolvió dos cosas el mismo día. La regla
forma→unidad que trae —`multi_series`, `tabular` y `flow` sin unidad; las otras
seis con— nos corrigió un pedido que íbamos a mandarles pidiendo `UNIT = 'x'`
para `media_efficiency_12m` y `platform_return`. Estaban bien como están.
