# El catálogo de Terpel, contra lo que existe · 2026-11-24

**Qué se revisó:** `docs/RESPUESTA-2026-11-24-datos-catalogo-terpel.md`, el
catálogo de datos de noviembre de 2026: dos clientes, 19 métricas de pauta
iguales en los dos y 9 de redes sociales.

**Medido el 2026-11-24** en Snowflake, en solo lectura con
`RL_BT_UA_TRANSFORM` (el rol de UA, no el de Terpel):

- `SHOW DATABASES LIKE 'DB_BT_TERPEL%'`;
- las tablas y vistas de `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS`;
- las columnas de `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE` y de
  `VW_TERPEL_ATL_26_ENTREGA_SYNAPSE`;
- la búsqueda de las columnas sociales y de ATL que nombra el catálogo, en
  toda la base;
- octubre de 2026 en la vista de pauta, por familia y por cliente.

Las claves que calcula hoy el backend se leyeron en
`internal/core/dashboard/snowflake/queries.go` de `f1ccbbe`.

## 0 · Decisión humana del 2026-11-24: dos clientes, como dice datos

El 2026-11-20 se decidió separar Terpel en tres clientes (Combustibles,
Lubricantes y Lealtad). **Datos lo arma en dos, y se acepta lo de datos:**

| Cliente | Qué agrupa |
|---|---|
| **Terpel Combustibles** | Combustibles, Conveniencia (Altoque, Sbarro), Lealtad (Vive Terpel) y ATL |
| **Terpel Lubricantes** | Mobil, Terpel Lubricantes, Dual Brand y las redes sociales |

El cliente «Terpel Lealtad» de QA (`95ac64ae…`) queda sin uso.

**Y una adaptación del semáforo**, también decidida ese día: el pacing es
malo por los dos lados (menos de 90 %, más de 110 %), y el semáforo solo
sabía de uno. Se extiende en el front; ver
`docs/DECISIONES-2026-11-24-semaforos-y-eje-doble.md`.

## 1 · Lo que no existe

- **`DB_BT_TERPEL_LUBS` no aparece**: solo se ve `DB_BT_TERPEL_COMBS`. Se
  midió con el rol de UA, así que puede existir y no ser visible para él.
- **Ninguna columna social existe** en `DB_BT_TERPEL_COMBS`:
  `TOTAL_FOLLOWERS`, `NEW_FOLLOWERS`, `LINK_CLICKS`, `IMPRESSIONS_ORGANIC`,
  `SHARES` y `VIDEO_VIEWS_ORGANIC` dan cero filas. Lo único social es
  `ORGANIC_SM_CHUNKS`, que es texto para el chat.
- **`INVERSION_TOTAL_ATL` y `GASTO_FINAL_DIGITAL` no existen.** La vista de
  ATL trae `INVERSION_TOTAL` e `INVERSION_TOTAL_COMISION`; el gasto digital es
  `GASTO_FINAL` de la vista de pauta. `atl_vs_digital_spend` cruza dos vistas.

## 2 · La vista de pauta, octubre de 2026

Sigue trayendo todas las líneas en una sola vista:

| `FAMILIA_NORM` | Filas | Gasto (COP) |
|---|---|---|
| Combustibles | 46 | 470 527 422 |
| Conveniencia | 14 | 265 022 603 |
| Lealtad | 14 | 126 584 208 |
| Lubricantes | 91 | 253 367 730 |
| Sin familia | 14 | 238 431 227 |

**Las 14 filas «Sin familia» son `CUENTA_NORM` = `SIN_CUENTA`**, con 238 M de
gasto contra 12 M de presupuesto: un pacing de 1 920 %. No caen en ningún
cliente.

Agrupado como dice datos, con las fórmulas de su catálogo:

| Cliente | Gasto | Presupuesto | Pacing | CPM | CPC | CPL | CTR | VTR | Líneas |
|---|---|---|---|---|---|---|---|---|---|
| Combustibles | 862 134 234 | 836 085 808 | 103,12 % | 5 147,76 | 121,29 | 12 296,44 | 4,24 % | 8,49 % | 72 |
| Lubricantes | 253 367 730 | 277 862 702 | 91,18 % | 3 278,47 | 1 078,16 | **0** | 0,30 % | 9,64 % | 90 |

## 3 · Fórmulas que no dan lo que su nombre dice

- **`cpl_effective` da 0 sin leads.** `DIV0NULL(gasto, NULLIF(leads, 0))`
  devuelve 0 cuando no hay leads, y Lubricantes no tuvo leads en octubre. Un
  CPL de 0 se lee como «gratis». Tiene que llegar vacío.
- **`social_organic_reach` suma impresiones** (`SUM(IMPRESSIONS_ORGANIC)`),
  no usuarios únicos. El propio catálogo estandariza el alcance como
  usuarios únicos.
- **`social_video_completions` suma vistas** (`SUM(VIDEO_VIEWS_ORGANIC)`), no
  vistas de 95 % o más, que es lo que dice su nombre.
- **`attainment_reach` y `media_reach` suman el alcance entre campañas**, y
  eso cuenta dos veces a quien vio dos. Estaba anotado desde el 2026-11-03.
- **El Advocacy Score** se multiplica por 1 000 en la tabla y no en el
  resumen del principio.
- **«Simetría total»**: el resumen dice que los dos clientes comparten las 9
  sociales, pero la tabla social solo aparece en Lubricantes.

## 4 · Claves nuevas para métricas que ya existen

QA ya calcula 10 métricas de Terpel, con estas claves. El catálogo nuevo les
pone otro nombre a varias:

| Hoy (backend y QA) | En el catálogo nuevo |
|---|---|
| `media_investment` | `paid_spend` |
| `media_budget_execution` | `pacing_rate` |
| `media_clicks`, `media_impressions`, `media_reach` | Sin equivalente como total |
| `media_goal_attainment` | `attainment_imp`, `attainment_reach`, `attainment_clicks`, `attainment_leads` |
| `media_by_platform`, `media_by_campaign` | Sin equivalente |
| `atl_investment`, `atl_by_medium` | `atl_vs_digital_spend` |

Renombrar rompe el dashboard publicado de Terpel Combustibles. Lo que se le
pide a datos es **conservar las claves que existen y agregar solo las
nuevas**.

## 5 · Lo que choca con las reglas del front

- **`pacing_status` como métrica aparte** («Badge de Estado» con
  «Sobregasto», «Subejecución», «Óptimo»). El estado no es una métrica: sale
  de `pacing_rate` y sus cortes, con el semáforo de dos lados. Datos da los
  cortes (90 y 110) y el front los pinta.
- **`cpl_effective` como «KPI Card Semáforo»**: hace falta el corte. El
  catálogo dice «fuera de umbral» y no dice cuál.
- **«Donut Chart»** para los dos mix: el repertorio dibuja una composición
  como `stacked100` o `treemap`.

## 6 · Lo que sigue

- **Datos**: la vista por cliente, Lubricantes, lo social, las fórmulas y las
  claves. Lo pide `docs/MENSAJE-2026-11-24-datos-catalogo-terpel.md`.
- **Backend**: las consultas de las métricas nuevas, cuando datos confirme las
  claves y la vista de cada cliente. Pedirlas antes sería escribir el SQL
  sobre una vista que va a cambiar.
- **QA**: el cliente «Terpel Lealtad» se borra o se deja; lo decide el humano.
