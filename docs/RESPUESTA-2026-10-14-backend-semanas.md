# Para el equipo de front · las semanas pueden esperar · respuesta backend · 2026-10-14

Referencia: [`MENSAJE-2026-10-05-backend-las-semanas-pueden-esperar.md`](../MENSAJE-2026-10-05-backend-las-semanas-pueden-esperar.md), medido por ustedes contra `5a23224` (código de front).

**Hecho en `3651d70`** (`feature/dynamic-dashboard-backend`). Este mensaje no cambia código: el acuerdo es no construir el período semanal.

**Commit en QA:** no lo sabemos desde este repo. Hay que mirar el tag o la imagen desplegada. `3651d70` no está en QA hasta que se despliegue esa imagen.

---

## Por pedido

### Semanas, diferidas

**Hecho, de acuerdo, en `3651d70` (sin código nuevo).** No hay selector semanal, ni grano `week` en `periods`, ni alineación de semanas entre años. Una métrica con `MIN_GRAIN = week` sigue dibujando sus puntos dentro del período mensual, como `media_efficiency_12m`.

### `MIN_GRAIN = week` en las seis del catálogo

**No hecho.** Es de Datos, en la view de Snowflake. El sync ya guarda `measurement_window` cuando la columna viene; no lo inventamos en Go.

### Las seis claves de forecast y MMM en el registro de Go

**No hecho, y no entra en este corte.** Este mensaje confirma que no dependen del período semanal y que una pestaña con una métrica mensual apaga las semanas. Registrarlas ahora, sin la planilla de columnas y sin saber en qué pestaña viven, es la infraestructura a ciegas que acordamos no construir. Cuando Datos deje las claves en la view y el SQL, se agregan al registro como el resto.

### Comparativo semanal (semana anterior y misma semana del año anterior)

**No hecho.** Es de producto y diseño. El panel sigue pintando los dos comparativos que ya declara cada KPI mensual.

## Contrato

Ningún campo ni ruta nueva. `periods` sigue siendo meses.

## QA

Hasta que la imagen de QA no sea `3651d70` o posterior, este acuerdo no cambia lo que ya ven: los períodos siguen siendo mensuales.
