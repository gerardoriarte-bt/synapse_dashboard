# Para el equipo de datos · faltan tres metas de octubre en Gold · 2026-10-06

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `7b717aa` el 2026-10-06**: el SQL de `goal_attainment` leído en
`internal/core/dashboard/snowflake/queries.go` del backend, y el panel pedido al
servicio de QA con un usuario admin de UA, para octubre y para septiembre.

Hola. Es un pedido chico y es sólo de ustedes.

## Qué se ve

El panel **Cumplimiento de objetivo** de UA declara en su BASE «real sobre meta
del mes para **5 indicadores**: venta, órdenes, unidades, visitas e inversión».
En octubre muestra **dos**.

| Período | Lo que llega |
|---|---|
| **2026-10** | Inversión 11.8 · Ventas 26.5 |
| 2026-09 | Inversión 76.2 · Unidades 109.3 · Ventas 103.6 · Visitas 107.2 · Órdenes 92.1 |

## Por qué, y por qué es de ustedes

La métrica divide lo real por la meta del mes, indicador por indicador, sobre la
tabla Gold de ecommerce:

```sql
SELECT 'Órdenes', SUM(ORDERS_TOTAL), SUM(ORDERS_TARGET) …
ROUND(real / NULLIF(objetivo, 0) * 100, 1) AS v
```

Con la meta vacía o en cero, `NULLIF` da nulo y el indicador no llega. En
septiembre llegan los cinco, así que la consulta funciona. **Lo que falta son las
metas de octubre en tres columnas:**

- `ORDERS_TARGET`
- `UNITS_TARGET`
- `VISITS_TARGET`

`REV_TARGET` y `BUDGET_TARGET` sí están cargadas para octubre.

## Lo que pedimos

1. **Cargar las metas diarias de octubre** en esas tres columnas, igual que en
   septiembre.
2. **Decirnos si esto va a pasar cada mes.** Si las metas de unos indicadores
   llegan más tarde que las de otros, el panel tiene que decir «2 de 5 con meta
   cargada» en vez de mostrar dos barras sin explicar por qué faltan tres. Ese
   rótulo lo hacemos nosotros, pero necesitamos saber si es el caso normal o
   una excepción de este mes.

Lo demás que encontramos al revisar los gráficos de UA vive en el SQL del
backend y se lo pedimos a ellos aparte: `MENSAJE-2026-10-06-backend-graficos-de-ua.md`.
