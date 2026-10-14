# Composiciones versionadas · `dev/dashboards/`

**Un dashboard vive en la base, y la base de `dev/postgres` es descartable.** Acá
queda la composición para poder rehacerlo, y para poder leer en una revisión qué
panel se puso y por qué.

**Los paneles se guardan por `metric_key`, no por `metric_id`.** Los ids cambian
con cada base; la clave es estable y es la que el catálogo de Snowflake declara.
El script resuelve la clave contra `/config/catalog` al aplicar.

| Archivo | Qué |
|---|---|
| `ua-mx.json` | **UA MX · Resumen** · diez paneles, todos con dato de Snowflake |

Se aplica con `tools/aplicar-dashboard.py` · ver `docs/RUNBOOK-dashboard-ua-mx.md`.
