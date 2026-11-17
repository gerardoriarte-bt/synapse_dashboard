# Para el equipo de front · el dato de una métrica, sin panel · 2026-11-10

Referencia: [`MENSAJE-2026-11-10-backend-dato-por-metrica.md`](../../MENSAJE-2026-11-10-backend-dato-por-metrica.md), medido por ustedes contra `4192041`.

**Hecho en `a80c318`.** Una sola lectura de admin devuelve el dato materializado de cada métrica del catálogo, esté o no en un panel.

**No hecho.** No se agregó el payload al `GET` del catálogo: esa lista sigue siendo solo la ficha de la métrica. `CatalogHealth` sigue diciendo la frescura de las fuentes, no el estado del dato.

**Contrato.** Ruta nueva, el mismo grupo de admin que el editor.

`GET /api/v1/admin/tenants/{tenantId}/catalog/data?period=YYYY-MM`

`period` es obligatorio. Si no es `YYYY-MM`, responde 400 con `VALIDATION_PERIOD`.

`data` trae `period` y `metrics`, una entrada por métrica del catálogo, en el orden del nombre. Cada entrada tiene `metric_id`, `key` y el mismo payload que el lote de paneles: `status`, `value`, `governance`, `presentation`, `reason`, `unlocks_with`, `message` y, si el dato está vencido, `stale_since`.

Una métrica sin fila en ese período sale `BLOCKED` con `reason` «No hay datos calculados para este período». Un `AVAILABLE` viejo sale `DEGRADED` con la misma regla que el panel. El `value` es el guardado: el mismo que verían si la métrica estuviera en un panel. No se mezcla la nota del panel, porque acá no hay panel.

No filtra métricas ocultas por rol. Es el catálogo completo del cliente, igual que `GET .../catalog`.

**Commit en QA:** ninguno de este corte. Lo que midieron sigue en `4192041`. `a80c318` no está en QA.

## Cómo comprobarlo

Con el token de un admin del cliente, pedir la ruta para un mes ya materializado. Una métrica de UA que no esté en ningún panel tiene que traer su `status` y, si está `AVAILABLE`, el mismo `value` que el lote devuelve cuando sí está en un panel.
