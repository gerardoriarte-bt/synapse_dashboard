# Para el equipo de backend · el día en curso en las series diarias · 2026-11-10

**Medido contra `4192041` el 2026-11-10**, leyendo su rama
`feature/dynamic-dashboard-backend`: `pivotDailyTrend`,
`pivotMonthlyEfficiency` y `monthIsOpen` en
`internal/core/dashboard/snowflake/queries.go`, y `tenantNow` en
`dd_config_service.go`. Del lado nuestro, el gráfico de series de la consola,
que desde hoy dibuja distinto el punto que llega con `partial`.

Hola. Es corto.

## Qué pasa

Una evaluación de UX encontró que el último punto de las series se lee como
una caída: octubre en «Eficiencia de medios», y el 29 de octubre en el detalle
de la tendencia diaria, con 8.393 frente a 115.966 del día anterior.

**El mes ya lo marcan ustedes**: `pivotMonthlyEfficiency` pone `partial` en el
mes abierto, y desde hoy la consola lo dibuja punteado, con el punto hueco y
«· en curso» en su fecha.

**El día no**: `pivotDailyTrend` no marca ningún punto. Así que el día de hoy,
incompleto, sigue pareciendo una caída.

## Lo que pedimos

1. **`partial: true` en el punto del día en curso** de las series diarias,
   igual que en el mes abierto de la mensual. El front no necesita nada más:
   la marca ya se dibuja.
2. **Que el «en curso» se decida con el huso del cliente.** `monthIsOpen`
   compara contra `time.Now().UTC()`. En México, entre las 18:00 y la
   medianoche del último día del mes, UTC ya está en el mes siguiente y el mes
   todavía abierto saldría como cerrado. `tenantNow` ya resuelve eso en
   `dd_config_service.go`.

**Por qué no lo calculamos del lado nuestro:** el corte del día es del cliente,
y desde el navegador sólo tenemos el reloj de quien mira.

## Cómo lo comprobamos

Con la tendencia diaria materializada hoy: el punto de hoy llega con
`partial: true` y los anteriores sin él. Con la mensual, a las 20:00 de Ciudad
de México del último día del mes, ese mes sigue llegando con `partial: true`.

Gracias.
