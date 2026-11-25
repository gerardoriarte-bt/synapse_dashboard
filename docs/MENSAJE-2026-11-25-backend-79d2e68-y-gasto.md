# Para el equipo de backend · 79d2e68 no está publicado, y datos ya eligió el gasto · 2026-11-25

**Medido contra `db48310` el 2026-11-25**, por la tarde. Es la cabeza de
`feature/dynamic-dashboard-backend` en el remoto después de `git fetch`: el
commit 79d2e68 que citan las dos respuestas de hoy **no está en ninguna
rama**. Leídos en `db48310` los usos de `GROSS_SPEND` en `queries.go`,
`schema.go` y `drilldown.go`. En Snowflake, en solo lectura, las columnas y
las cifras de septiembre a noviembre de `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS`.
El detalle está en `docs/AUDITORIA-2026-11-25-catalogo-ua-mx-v4.2.md`.

Hola. Gracias por las dos respuestas. Las 8 de pauta atribuida y el arreglo
del período de las fuentes están bien planteados, pero igual que ayer con
1d3013d, todavía no los vemos en el remoto.

## 1 · Publicar 79d2e68 y desplegarlo en QA

Con eso materializamos UA MX en 2026-10 y comprobamos `revenue_paid`
(383 052,87) y `orders_paid` (3 766). `bounce_rate_paid` ya no va a dar
cero: datos corrigió la fuente y octubre da 17,13 %.

Y en QA, **`DD_REPORTS_ENABLED=true`**. Cuando esté, reactivamos el reporte
pausado y avisamos si llega el correo.

## 2 · El gasto: datos eligió

La v4.2 de datos contesta lo que esperaban:

| Clave | Columna | Octubre |
|---|---|---|
| `spend` | `TOTAL_AD_SPEND` | 224 312 |
| `roas_paid` | `ROAS_PAID` | 5,73 |

Las dos están en `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` y, por día, en
`GLD_ECOMM_PROFITABILITY_DAILY`. `GROSS_SPEND` es el gasto que reportan las
plataformas (55 936), y su ROAS (6,85) es `ROAS_PAID_PLATFORMS`, otra métrica
que todavía no tiene fila en el catálogo.

**Les pedimos pasar `spend` y `roas_paid` a esas columnas.** En `db48310`,
`GROSS_SPEND` también alimenta `daily_trend`, `media_efficiency_12m`, `roas`,
`budget_status` y el drill-down de `spend`. Si `spend` cambia y la serie
diaria no, «Inversión» del mes y la línea diaria dejan de coincidir; las dos
pueden leer `TOTAL_AD_SPEND`. **`budget_status` conviene dejarlo** hasta que
datos diga en qué base está `BUDGET_TARGET`; se lo preguntamos hoy.

Cuando esté desplegado, cargamos los umbrales y publicamos `spend` junto al
MER.

Gracias.
