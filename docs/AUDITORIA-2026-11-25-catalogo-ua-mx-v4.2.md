# El catálogo de UA MX v4.2 y las dos respuestas del backend · 2026-11-25

**Qué se revisó:**

- `docs/RESPUESTA-2026-11-25-datos-catalogo-ua-mx-v4.2.md`, que contesta las
  cuatro preguntas de `MENSAJE-2026-11-25-datos-catalogo-ua-mx-v4.1.md`;
- `docs/RESPUESTA-2026-11-25-backend-pauta-atribuida-ua.md` y
  `docs/RESPUESTA-2026-11-25-backend-qa-con-db48310.md`, que citan el commit
  79d2e68.

**Medido el 2026-11-25 por la tarde.** En Snowflake, en solo lectura con
`RL_BT_UA_TRANSFORM`: las columnas de las dos vistas de rentabilidad,
septiembre a noviembre en `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS`, y
`SYNAPSE_METRIC_CATALOG`. En el backend, `git fetch` del remoto y
`internal/core/dashboard/snowflake/queries.go` y `schema.go` en `db48310`.

## 1 · El commit 79d2e68 no está publicado

`feature/dynamic-dashboard-backend` sigue en `db48310` y 79d2e68 no está en
ninguna rama del remoto. **Es lo mismo que pasó con 1d3013d el 2026-11-24**:
las dos respuestas describen código que todavía no se puede leer ni
desplegar. Lo que dicen está bien planteado:

| Respuesta | Qué trae 79d2e68 |
|---|---|
| Pauta atribuida | Las 8 métricas `_paid` en `MetricRegistry`, leyendo `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS`. No tocan `spend` ni `roas_paid` hasta que datos conteste |
| QA con `db48310` | El período de las fuentes pasa a ser el mes más reciente del SQL, y `freshness` se omite si la tabla no tiene feed |

**El programador de reportes no es código**: falta `DD_REPORTS_ENABLED=true`
en QA. Lo enciende quien opera QA.

## 2 · Lo que datos resolvió, medido

| Pregunta del 2026-11-25 | Respuesta v4.2 | Snowflake |
|---|---|---|
| ¿`spend` es `TOTAL_AD_SPEND`? | Sí. `GROSS_SPEND` es lo que reportan las plataformas | ✓ Octubre: `TOTAL_AD_SPEND` 224 312, `SPEND_BRAND` 157 469, `SPEND_PERFORMANCE` 66 843 |
| ¿Cuál `roas_paid`? | `ROAS_PAID` (5,73, contra costos). El de plataformas es otro: `ROAS_PAID_PLATFORMS` (6,85) | ✓ Las dos columnas existen, en las dos vistas |
| Rebote de pauta en cero | Corregido con Adobe Analytics | ✓ 16,85 % · 17,13 % · 23,72 % (sep–nov) |
| `SEMANTIC_DIRECTION` mezclado | Los tres textos en español | ✓ 34 «MÁS ALTO = MEJOR», 15 «NEUTRAL / INFORMATIVO», 5 «MÁS BAJO = MEJOR». Ningún otro valor |
| Fila de `cm3_margin_pct` | Agregada | ✓ «Margen de Contribución (%)», `%`, «MÁS ALTO = MEJOR» |
| El borde del umbral | Bueno inclusivo, malo exclusivo | Es la regla que ya implementa `src/catalog/umbrales.ts` |
| `SYSADMIN` | Quitado de los roles de consumo | ✓ En su lugar `RL_BT_UA_TRANSFORM` |

**Los umbrales de §5 de la auditoría v4.1 quedan como están.** La v4.2 sólo
precisa los bordes (`≥ 3,00x`, `1,50x – 2,99x`), y esa es la semántica que
el semáforo ya pinta: una cifra en el corte del bueno se ve bien, una en el
corte del malo se ve en el medio.

**Con esto, `spend` y el MER se pueden publicar juntos** en cuanto el
backend lea `spend` de `TOTAL_AD_SPEND`. Hoy lee `GROSS_SPEND`.

## 3 · Lo que el documento dice y Snowflake no tiene

- **`SPEND_PERF_PLATFORMS` no existe.** La tabla de mapeo la da como columna
  de las dos vistas de rentabilidad; la consulta falla con «invalid identifier
  'SPEND_PERF_PLATFORMS'». El gasto de plataformas sigue sólo en
  `GLD_ECOMM_DAILY_PERFORMANCE.GROSS_SPEND`.
- **`perf_spend_platforms` y `roas_paid_platforms` no tienen fila** en
  `SYNAPSE_METRIC_CATALOG`. Sin fila, el backend no las puede registrar.
- **«60 métricas»**: el catálogo tiene 54 filas.
- **«Brand 64,4 % / Performance 35,6 %»** está escrito junto a las cifras de
  octubre, y octubre da 70 / 30 (157 469 y 66 843). Septiembre da 42 / 58.
  El reparto es real y cambia cada mes; el 64,4 % es la meta del plan. **Es
  la respuesta a la pregunta de la v3.2**: `brand_spend_total` mide el gasto
  por tipo, no aplica el porcentaje.

## 4 · Lo que no es para el front

- **«Regla 1 · consumo por pestaña»** dice qué vista leer en cada pestaña. El
  front no lee Snowflake: lee métricas por clave, y la vista la elige el
  backend en `MetricRegistry`. Sirve como guía para ellos.
- **«Regla 4»** trae una función con `default: return 'GREEN'`. El front no
  pinta semáforo sin `thresholds`: un indicador sin umbral queda neutro, como
  manda `docs/DECISIONES-2026-11-24-semaforos-y-eje-doble.md`.

## 5 · Lo que cambia en el backend para pasar `spend`

En `db48310`, `GROSS_SPEND` alimenta más que `spend`:

| Dónde | Qué |
|---|---|
| `queries.go` · `KPISQL` | `spend`, `roas_paid`, `roas` y `budget_status` |
| `schema.go` | `daily_trend` y `media_efficiency_12m` |
| `drilldown.go` | `spend` y su ROAS |

Si `spend` pasa a `TOTAL_AD_SPEND` y `daily_trend` sigue en `GROSS_SPEND`, la
serie diaria de «Inversión» y la cifra del mes dejan de coincidir.
`GLD_ECOMM_PROFITABILITY_DAILY` tiene `TOTAL_AD_SPEND` por día, así que las
dos pueden leer lo mismo. **`budget_status` compara contra `BUDGET_TARGET`**:
falta saber si esa meta está en la base de las plataformas o en la
consolidada, y eso lo sabe datos.
