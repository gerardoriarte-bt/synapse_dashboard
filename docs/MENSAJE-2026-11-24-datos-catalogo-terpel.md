# Para datos · Terpel: el catálogo, en dos clientes, y lo que falta · 2026-11-24

**Medido contra `f1ccbbe` el 2026-11-24**: las claves que calcula hoy el
backend, en `internal/core/dashboard/snowflake/queries.go`. En Snowflake, en
solo lectura (con el rol de UA, `RL_BT_UA_TRANSFORM`):

- las bases `DB_BT_TERPEL%`;
- las vistas del esquema `BT_TERPEL_COMBS_MART_ANALYTICS` y sus columnas;
- octubre de 2026 en `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE`.

El detalle está en `docs/AUDITORIA-2026-11-24-catalogo-terpel.md`.

Hola. Gracias por el catálogo. **Vamos con los dos clientes como lo
plantean**:

- **Terpel Combustibles**: Combustibles, Conveniencia, Lealtad y ATL.
- **Terpel Lubricantes**: Mobil, Terpel Lubricantes, Dual Brand y redes.

Esto reemplaza lo que les pedimos el 2026-11-20 sobre Lealtad: **ya no hace
falta una vista ni un usuario de servicio para Lealtad**.

También adaptamos el semáforo para que el pacing pueda ser malo por los dos
lados, con sus cortes de 90 % y 110 %.

Para conectar los dos clientes necesitamos lo de abajo.

## 1 · Una vista de pauta por cliente

`VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE` sigue trayendo todas las líneas. En
octubre:

| `FAMILIA_NORM` | Gasto (COP) |
|---|---|
| Combustibles | 470 527 422 |
| Conveniencia | 265 022 603 |
| Lealtad | 126 584 208 |
| Lubricantes | 253 367 730 |
| Sin familia | 238 431 227 |

Necesitamos la misma vista, con el mismo nombre y las mismas columnas, en el
esquema de cada cliente:

- La de **Combustibles**, solo con Combustibles, Conveniencia y Lealtad.
- La de **Lubricantes**, solo con Lubricantes.

**¿Qué pasa con «Sin familia»?** Son 14 filas con `CUENTA_NORM` =
`SIN_CUENTA`, con 238 M de gasto contra 12 M de presupuesto (un pacing de
1 920 %). ¿A qué cliente van, o se corrigen?

## 2 · Lubricantes: dónde vive

El catálogo dice `DB_BT_TERPEL_LUBS / DB_BT_TERPEL_COMBS`. Nosotros no vemos
`DB_BT_TERPEL_LUBS`. Puede ser el rol con el que miramos. Necesitamos:

- la base y el esquema;
- el almacén virtual y el rol de solo lectura (en la ficha dejamos
  `RL_BT_TERPEL_LUBS_CLIENT_BI`);
- registrar la llave de `SVC_SYNAPSE_TERPEL_LUBS`, la que mandamos el
  2026-11-20;
- el agente de Cortex, si va a tener chat;
- la vista `SYNAPSE_METRIC_CATALOG` en ese esquema.

## 3 · Redes sociales y ATL: las columnas no existen

- **Social**: ninguna de `TOTAL_FOLLOWERS`, `NEW_FOLLOWERS`, `LINK_CLICKS`,
  `IMPRESSIONS_ORGANIC`, `SHARES` ni `VIDEO_VIEWS_ORGANIC` existe en
  `DB_BT_TERPEL_COMBS`. ¿En qué vista van a estar?
- **ATL contra digital**: no existen `INVERSION_TOTAL_ATL` ni
  `GASTO_FINAL_DIGITAL`. La vista de ATL trae `INVERSION_TOTAL` e
  `INVERSION_TOTAL_COMISION`. ¿Cuál de las dos vale, y el digital es
  `GASTO_FINAL` de la vista de pauta?

## 4 · Mantengan las claves que ya existen

Hoy Terpel ya tiene 10 métricas publicadas. Si cambian de nombre, el dashboard
se rompe. Les pedimos **conservar estas y agregar solo las nuevas**:

| Ya existe | En el catálogo nuevo |
|---|---|
| `media_investment` | `paid_spend` |
| `media_budget_execution` | `pacing_rate` |
| `atl_investment` | parte de `atl_vs_digital_spend` |

`media_clicks`, `media_impressions`, `media_reach`, `media_goal_attainment`,
`media_by_platform`, `media_by_campaign` y `atl_by_medium` siguen igual.

**Y `pacing_status` no hace falta como métrica**: el estado lo pinta el
semáforo con `media_budget_execution` y los cortes de 90 % y 110 %.

## 5 · Fórmulas para revisar

- **`cpl_effective` da 0 sin leads.** `DIV0NULL(gasto, NULLIF(leads, 0))`
  devuelve 0, y Lubricantes no tuvo leads en octubre. Un CPL de 0 se lee como
  gratis. Tiene que salir vacío: `gasto / NULLIF(leads, 0)` sin `DIV0NULL`.
- **`social_organic_reach` suma impresiones**, no usuarios únicos.
- **`social_video_completions` suma vistas**, no vistas de 95 % o más.
- **`attainment_reach` suma el alcance entre campañas**, y eso cuenta dos
  veces a quien vio dos. ¿Hay un alcance único del mes?
- **El Advocacy Score**: en la tabla va por 1 000 y en el resumen no. ¿Cuál
  vale?
- **Lo social, ¿en los dos clientes?** El resumen dice que sí, pero la tabla
  social solo aparece en Lubricantes.

## 6 · Los cortes de los semáforos

| Indicador | Mal | Bien |
|---|---|---|
| `media_budget_execution` (pacing) | < 90 % o > 110 % | 90 % a 110 % |
| `cpl_effective` | ¿? | ¿? |

Confirmen el primero y dennos el del CPL, por cliente si cambia.

Gracias.
