# Rehacer el dashboard de UA MX · procedimiento

> **Un procedimiento que se CORRE, y se mantiene.** No lleva fecha en el nombre
> a propósito: se corrige en su lugar.

**La base de `dev/postgres` es descartable**, así que el dashboard se pierde cada
vez que se rehace. Esto lo vuelve a crear en un comando.

```bash
SYNAPSE_EMAIL=dev@synapse.local SYNAPSE_PASSWORD=synapse \
  python3 tools/aplicar-dashboard.py dev/dashboards/ua-mx.json \
    --nombre "UA MX" --slug ua-mx
```

Crea el dashboard, publica el layout, y **agrega la clave de pestaña a los roles
activos** — sin eso el dashboard se publica y no aparece, que se lee como un
fallo del publish y no lo es.

---

## Qué compone, y por qué cada panel

**Diez paneles, y los diez tienen consulta de Snowflake registrada.** Ésa es la
regla de este dashboard: lo que no se puede volver a calcular no entra.

| Fila | Paneles |
|---|---|
| 1 | `revenue` · `spend` · `roas` · `orders` — cuatro KPI de 3 columnas |
| 2 | `units` · `sessions` — dos KPI · y `goal_attainment` como **`radial`** |
| 3 | `daily_trend` y `media_efficiency_12m`, los dos como **`smallmult`** |
| 4 | `platform_return` en tabla, 8 columnas |

**Los tres gráficos elegidos salen de la auditoría de comprensión**
—`docs/AUDITORIA-2026-10-01-comprension-de-graficos.md`—, no del gusto:

- **`goal_attainment` va `radial` y no dona ni mosaico.** Sus cinco valores son
  porcentajes de metas distintas: una dona los suma y presenta la participación
  de cada uno sobre esa suma, que no significa nada. El radial muestra el
  promedio —`92%`— y los cinco valores reales al lado.
- **Las dos `multi_series` van `smallmult` y no multilínea.** Sus series están en
  magnitudes distintas —ventas en millones, inversión en miles, ROAS en
  unidades—, así que en un eje común dos de las tres quedan pegadas al cero. En
  `smallmult` cada una trae su escala y su cifra.

## Qué queda AFUERA, y por qué

| | Por qué no entra |
|---|---|
| `platform_gap` y `platform_month_matrix` | **No tienen consulta de Snowflake registrada** en `d9147c3`: el servicio contesta `BLOCKED · No Snowflake query registered`. Sus queries están en `8876b4d` de nuestro fork, que upstream no tomó — es el §1 del mensaje al backend. Su dato de un mes viejo existe, pero **no se puede volver a calcular** |
| `spend_flow` | Es un sankey de 22 enlaces a un nodo «total» que es la suma de los otros 22 — un gráfico de barras dibujado como flujo. Se quitó el 2026-10-01 con su razón escrita |
| Las ocho de la semilla | `executive_summary`, `decisions`, `goals_vs_actual`, `investment`, `investment_by_platform`, `sales`, `twelve_month_efficiency`, `visits`. **Son la maqueta del `.pen` sembrada en Postgres**, en inglés y con cifras inventadas. Son exactamente lo que este dashboard existe para no mezclar |

## Las seis que van a entrar

Datos las entregó el 2026-10-01 y esperan registro del backend ·
`docs/snowflake/Metricas.xlsx`:

`conversion_funnel` · `media_platform_investment_matrix` ·
`media_investment_composition` · `top_products_revenue` ·
`instagram_followers_trend` · `tiktok_comment_sentiment`

**El front ya dibuja las seis formas**: apenas lleguen los payloads se agregan a
`dev/dashboards/ua-mx.json` y se vuelve a correr el script.

---

## Dos cosas que conviene saber al mirarlo

**El mes en curso es parcial, y el día 1 se nota.** Abre en el período abierto,
que el día 1 trae un solo día de datos: cifras chicas y `% DE LA META` al 5 %. El
panel lo declara —«PERÍODO EN CURSO · INCOMPLETO, NO COMPARA CONTRA UN MES
CERRADO»— pero **no es el mes para mirar**: el último cerrado sí.

**Si un período no se materializó, sus paneles salen `BLOCKED`.** Materializar
uno:

```bash
curl -X POST "$API/admin/tenants/$TENANT/materialize" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"periods":["2026-10"]}'
```

Es asíncrono: el resultado se lee en `GET /admin/materialize/runs`, o en la
pantalla **A5 · Salud de feeds**, que lo muestra con sus cinco contadores.
