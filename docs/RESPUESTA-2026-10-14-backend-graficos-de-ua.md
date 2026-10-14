# Para el equipo de front · gráficos de UA · respuesta backend · 2026-10-14

Referencia: [`MENSAJE-2026-10-06-backend-graficos-de-ua.md`](../MENSAJE-2026-10-06-backend-graficos-de-ua.md), medido por ustedes contra `7b717aa`.

Dos fases. La primera cambia el contrato del payload. La segunda corrige el dato que ya está guardado.

**Hecho en `3651d70`** (`feature/dynamic-dashboard-backend`).

**Commit en QA:** no lo sabemos desde este repo. Hay que mirar el tag o la imagen desplegada. Lo último que midieron en local fue `9dc481e`. `3651d70` no está en QA hasta que se despliegue esa imagen y corra la migración.

---

## Fase 1 · contrato · hecho en `3651d70`

Aplica a las filas que se materialicen después de este commit. Las que ya están en `dd_panel_data` conservan el payload viejo hasta la fase 2.

### 2 · ROAS sin multiplicar

**Hecho en `3651d70`.** `media_efficiency_12m` emite la serie `ROAS` con el ratio (`11.1` sigue siendo `11.1`). Se quitó `ROAS ×100` y el `v * 100`. El decimal no se redondea a entero.

### 3 · `unit` opcional por serie

**Hecho en `3651d70`.** En `multi_series` cada serie puede traer `unit`. Si no hay una, el campo no va.

| Serie | `unit` |
|---|---|
| `daily_trend` · Ventas, Inversión | `USD` |
| `daily_trend` · Sesiones | no va |
| `media_efficiency_12m` · Inversión, Ventas | `USD` |
| `media_efficiency_12m` · ROAS | `x` |

### 5 · Menores

**Hecho en `3651d70`.**

- El mes en curso de `media_efficiency_12m` marca cada punto con `partial: true`. Un mes ya cerrado no lo trae.
- `platform_return` titula en español: `Plataforma`, `Inversión`, `Ventas`, `ROAS`, `Participación`. Las `unit` de columna (`USD`, `x`, `%`) no cambian.

## Fase 2 · dato guardado

### 1 · Agosto muestra la semilla como cifra del negocio

**Hecho en `3651d70`, corre al migrar.** No borramos filas. La migración `migrateBlockSeedPanelDataForSnowflakeTenants` pasa a `BLOCKED` toda fila `AVAILABLE` con `last_success_at` nulo de un tenant que ya tiene cuenta de Snowflake, en todos los períodos, y deja `value` en null. El motivo es el mismo que el bloqueo sin materializar: `No hay datos calculados para este período`. Un tenant sin Snowflake sigue viendo la maqueta. La semilla nueva tampoco se escribe si el tenant ya tiene cuenta.

### 4 · Rematerializar septiembre y octubre

**No hecho desde este repo.** El código ya emite `t` en ISO desde `c8b9247`. Las filas de QA siguen con el día desde epoch hasta que se vuelva a materializar el período (`POST /admin/tenants/{id}/materialize`). Esa corrida también reescribe ROAS, `unit`, `partial` y los títulos en español. No la ejecutamos contra QA.

## Contrato

| Dónde | Qué cambia |
|---|---|
| `multi_series.series[]` | `unit` opcional (`USD`, `x`). Si no aplica, no va. |
| `multi_series.series[].points[]` | `partial: true` solo en el mes en curso de `media_efficiency_12m`. `v` del ROAS es el ratio, no el ratio × 100. La serie se llama `ROAS`. |
| `platform_return` columnas | `title` en español. `key` y `unit` iguales. |
| Semilla de un tenant con Snowflake | `status: BLOCKED`, sin `value`. |

## QA

Hasta desplegar `3651d70` y materializar septiembre y octubre, QA sigue con `ROAS ×100`, títulos en inglés, `t` en epoch y agosto `DEGRADED` con `jan`…`aug`.
