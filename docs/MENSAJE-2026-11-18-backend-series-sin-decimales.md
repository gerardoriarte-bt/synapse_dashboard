# Para el equipo de backend · las series llegan sin decimales · 2026-11-18

**Medido contra `fb3ca0c` el 2026-11-18**, leyendo
`internal/core/dashboard/materialize/transform.go`. En QA, ese mismo día, la
serie de `ncac_registrados` de UA MX con
`GET /admin/tenants/{tenantId}/catalog/data`, comparada con Snowflake. El
detalle está en `docs/AUDITORIA-2026-11-18-metricas-de-ua-y-terpel-en-qa.md`.

Hola. Verificamos en QA las nueve métricas de UA de B6.2: **de enero a octubre
dan lo mismo que Snowflake hasta el último decimal**. Gracias. Sólo una no:
la serie del nCAC llega redondeada a entero.

| Cohorte | QA | Snowflake |
|---|---|---|
| 2025-11 | 37 | 37,24 |
| 2026-08 | 22 | 21,85 |
| 2026-09 | 28 | 27,86 |
| 2026-10 | 25 | 25,26 |

**La causa**: `transformTimeSeries` aplica `roundInt` a cada punto, así que
vale para toda métrica `time_series`. `transformComposition` hace lo mismo con
cada parte. Es así desde `a1a72fc`, del 2026-09-09.

En los seguidores de Instagram no se nota. En un costo de 20 a 56 USD por
cliente, es un error de hasta 2 %, y el panel muestra «28» donde es 27,86.

## Lo que pedimos

**Que `time_series` y `composition` conserven los decimales**, como ya hace
el escalar: entero sólo si el número es entero. El redondeo para mostrar lo
hace el front, con los decimales de la métrica.

## Cómo lo comprobamos

Después de desplegar y de «Cargar meses» de octubre en UA, la serie de
`ncac_registrados` trae 27,86 para septiembre y 25,26 para octubre.

Gracias.
