# Para datos · UA MX v4.2: resuelto, y tres detalles · 2026-11-25

**Medido contra `db48310` el 2026-11-25**, por la tarde: dónde usa el backend
`GROSS_SPEND` y `BUDGET_TARGET`. En Snowflake, en solo lectura con
`RL_BT_UA_TRANSFORM`: las columnas de las dos vistas de rentabilidad, septiembre
a noviembre en `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` y `SYNAPSE_METRIC_CATALOG`.
El detalle está en `docs/AUDITORIA-2026-11-25-catalogo-ua-mx-v4.2.md`.

Hola. Gracias por la v4.2: **las cuatro preguntas quedaron contestadas** y lo
comprobamos en Snowflake. El gasto ya tiene fuente, el rebote de pauta da
cifra (17,13 % en octubre), `SEMANTIC_DIRECTION` usa sólo los tres textos, y
`cm3_margin_pct` tiene fila. La regla de bordes coincide con la que pintamos,
así que los umbrales se cargan tal cual. Le pedimos al backend pasar `spend`
y `roas_paid` a sus columnas.

Quedan tres detalles.

## 1 · `SPEND_PERF_PLATFORMS` no existe

La tabla de mapeo la pone en las dos vistas de rentabilidad, y la consulta
falla con «invalid identifier». Tampoco hay filas de `perf_spend_platforms`
ni `roas_paid_platforms` en el catálogo. Si quieren que se vean, hacen falta
la columna y las dos filas; si no, basta con corregir el documento.

## 2 · El reparto Brand / Performance

El documento pone «Brand 64,4 %» al lado de las cifras de octubre, y octubre
da 70 / 30 (157 469 y 66 843). Entendemos que 64,4 % es la meta del plan y que
el reparto real cambia cada mes, que es lo correcto. Conviene que el texto lo
diga así.

## 3 · ¿En qué base está `BUDGET_TARGET`?

El backend calcula el estado del presupuesto como `GROSS_SPEND` sobre
`BUDGET_TARGET`. Con `spend` pasando a la inversión consolidada, ¿la meta es
de plataformas o consolidada?

Gracias.
