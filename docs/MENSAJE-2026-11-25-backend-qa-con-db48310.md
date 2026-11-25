# Para el equipo de backend · QA con `db48310`: anda, y faltan tres cosas · 2026-11-25

**Medido contra `db48310` el 2026-11-25**, en QA, entre las 14:55 y las 15:10
UTC, con sesión de superadmin:

- `GET /config/blocks`, `GET /admin/tenants/{tenantId}/catalog` y
  `GET /admin/tenants/{tenantId}/catalog/data` de UA MX en 2026-10 y 2026-11;
- `POST /admin/dashboards/{dashboardId}/archive` sobre los dos Overview;
- un reporte de UA MX de punta a punta: `POST /admin/tenants/{tenantId}/reports`,
  y después validar, activar, cambiar el horario, leer las corridas y pausar.

Leímos `internal/core/services/dd_report_sources.go` y
`dd_report_dispatcher.go` de ese commit. Las cifras de rentabilidad se
compararon con Snowflake medido el mismo día.

Hola. Gracias por el despliegue: **funcionó todo lo que pedimos.**

| Qué | En QA |
|---|---|
| `thresholds` en `kpi` y `gauge` | ✓ |
| Archivar Overview (UA MX y Terpel Combustibles) | ✓ 200, los dos archivados |
| Títulos de la semilla | ✓ «Resumen ejecutivo», «Decisiones» |
| Las 16 de rentabilidad | ✓ con cifra, iguales a Snowflake de hoy. Datos regeneró las vistas el 24 por la tarde, así que no coinciden con las del mensaje del 24, y está bien |
| Crear un reporte con destinatario | ✓ 201, validado y activado |

Faltan tres cosas.

## 1 · El programador de reportes no envía

Dejamos activo un reporte de UA MX con `next_run_at` = `2026-11-25T15:05:00Z`.
A las 15:07 no había ninguna corrida programada; solo la de validación. El
programador revisa cada minuto, así que creemos que está apagado:
`DD_REPORTS_ENABLED` viene en `false` por defecto.

**Pedido:** encender `DD_REPORTS_ENABLED=true` en QA, con el envío de correo
configurado. Avísennos, y activamos el reporte para comprobar que llega a
`gerardo.riarte@buentipo.com`. Ahora quedó pausado, para que no salga solo.

## 2 · Las fuentes del reporte citan otro mes

En la validación, las tres respuestas hablan de octubre de 2026 y sus
`sources` dicen `"period": "2026-01"`. Leído en `dd_report_sources.go`:
`reportPeriodFromSQL` devuelve **el primer** literal `'YYYY-MM'` que aparece
en el SQL del agente, no el más reciente ni el del período que se pregunta.
Si el agente filtra desde enero para comparar, la fuente dice enero.

La `freshness` también llega vacía: `feedForGoldTable` solo conoce los feeds
de e-commerce y de medios, y la respuesta citó `GLD_PRODUCTO_ANALYTICS`.

**Pedido:** que el período sea el más reciente que aparece en el SQL (como ya
hace con las fechas completas) o el período del reporte. La frescura de las
tablas sin feed, si se puede; si no, que no se envíe vacía.

## 3 · Desplegar el front desde `main` (`7e673ba`)

El front de QA sigue siendo el del 2026-11-24 a las 14:36 GMT. `main` está
ahora en `7e673ba`: trae los umbrales en el builder y el semáforo de dos lados.

**Sigue vigente**: no mezclar las métricas nuevas con `revenue`, `spend` y
`daily_trend` en un layout hasta el OK de datos. Con la vista nueva, la venta
de octubre ya parece coincidir con la de los paneles (unos 648 K) y el gasto no
(224 K contra 56 K). Lo tiene que confirmar datos.

Gracias.
