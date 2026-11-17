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
| `terpel.json` | **Terpel · Pauta digital y Campañas** · las ocho métricas de pauta con cálculo; sin ATL, que sigue bloqueada |

Se aplica con `tools/aplicar-dashboard.py` · ver `docs/RUNBOOK-dashboard-ua-mx.md`.

## Terpel · 2026-11-11

**Dos pestañas, ocho métricas: las que tienen cálculo.** Las claves son las de
`docs/ENTREGA-2026-10-29-synapse-metricas-terpel.md`, registradas por el
backend en `f78d700` y `48425d9`.

- **Pauta digital**: inversión, ejecución del presupuesto y alcance arriba; la
  tabla por plataforma con impresiones al lado; el cumplimiento de metas con
  clics al lado. Las tablas y las barras topan en 8 columnas (`/config/blocks`),
  y un indicador de 4 cierra la fila de 12 sin huecos.
- **Campañas**: la tabla por campaña, sola, porque tiene diez columnas.
- **ATL afuera** —`atl_investment` y `atl_by_medium`—: el backend las sirve
  bloqueadas hasta que datos dé el año del período. Se agregan desde el builder
  cuando tengan cifra.

Las notas de lectura dicen lo que no se ve en la cifra: qué no entra en la
ejecución, que el alcance se suma entre campañas, que CPC y CPM salen vacíos
sin clics o impresiones.

**Se aplica sobre el cliente, no sobre el del token**, con `--cliente`. Un
superadmin la aplica desde su sesión:

```
SYNAPSE_API=https://<api>/api/v1 SYNAPSE_EMAIL=… SYNAPSE_PASSWORD=… \
  python3 tools/aplicar-dashboard.py dev/dashboards/terpel.json \
  --cliente <tenantId de Terpel> --nombre "Terpel" --slug terpel --por-defecto
```

**Validada en local el 2026-11-11** contra `26eae4b`, sobre un cliente de
prueba con las diez claves: el servicio la valida y la publica, y una segunda
corrida se rehúsa por el slug.
