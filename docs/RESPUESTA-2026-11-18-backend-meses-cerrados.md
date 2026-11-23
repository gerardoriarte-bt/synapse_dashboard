# Para el equipo de front · meses cerrados y dato viejo · 2026-11-18

Referencia: [`MENSAJE-2026-11-18-backend-desplegar-y-meses-cerrados.md`](../MENSAJE-2026-11-18-backend-desplegar-y-meses-cerrados.md), medido por ustedes contra `fb3ca0c`.

## 1 · Desplegar el front de `main` (`043cddc`) en QA

**No hecho (no es de este repo).** El cambio `798dda2` es de la aplicación; no pide nada del API. El despliegue de QA del front lo corre el equipo de front/ops.

## 2 · Un mes cerrado no pasa a dato viejo si ya se materializó después del cierre

**Hecho en `8366936`.** Aceptamos su propuesta.

`PanelDegradation` ya no marca `DEGRADED` por antigüedad cuando:

1. el período `YYYY-MM` ya cerró (hoy es el día 1 del mes siguiente o después, en UTC, el mismo corte que el materializador), y
2. `materialized_at` es en o después de ese cierre.

Así, enero–septiembre que cargaron el 2026-11-18 quedan `AVAILABLE` aunque pasen más de `DD_FRESHNESS_TOLERANCE_DAYS`. El programador sigue recalculando solo el mes en curso y el anterior (`DD_MATERIALIZE_PERIODS_BACK`); un mes más viejo no se vuelve a tocar solo, y por eso no lo castigamos por edad si su dato ya es el de cierre.

El mes en curso (y cualquier período inválido o vacío) sigue con la regla de siempre: más de 3 días → `DEGRADED` con «Se actualiza en la próxima materialización».

**Caso raro que sigue degradando:** un mes cerrado cuya última materialización fue *antes* del cierre (p. ej. junio materializado el 15 de junio y nunca de nuevo). Ahí sí sale viejo, y el texto de desbloqueo pasa a «Se actualiza cargando el mes desde Salud de feeds», porque la próxima corrida automática no lo va a tocar.

**Contrato.** Mismos campos (`status`, `reason`, `unlocks_with`, `stale_since`). No hay ruta nueva. Cambia cuándo un `AVAILABLE` se sirve como `DEGRADED` y, en ese caso raro de mes cerrado incompleto, el copy de `unlocks_with`.

**Commit en QA:** ninguno de este corte. Lo que midieron sigue en `fb3ca0c` (o el deploy de ayer). `8366936` no está en QA.

## Cómo comprobarlo

Con el catálogo de UA MX, un mes de enero–junio cargado hoy tiene que salir `AVAILABLE` en `GET /admin/tenants/{tenantId}/catalog/data?period=YYYY-MM` aunque pasen más de 3 días sin rematerializar. El mes en curso, si su `materialized_at` tiene más de 3 días, sigue `DEGRADED` con la frase de la próxima materialización.
