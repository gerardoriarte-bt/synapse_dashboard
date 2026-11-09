# Entrega al solicitante — métricas Terpel Combustibles

Respuesta a `MENSAJE-2026-10-29-datos-metricas-de-terpel.md`.  
Rol de trabajo: `RL_BT_TERPEL_COMBS_BI`. Fecha: 2026-10-29.

No se leyeron filas de detalle de campañas. Las cifras son solo agregados.

---

## Estado de los 6 entregables

| # | Pedido | Estado | Cómo se comprueba |
|---|--------|--------|-------------------|
| 1 | Vistas ATL consultables con el rol de Synapse | **Hecho (causa raíz corregida)** | `SELECT COUNT(*)` sobre `VW_TERPEL_ATL_26` = **85**; `VW_TERPEL_ATL_25` = **259**. Las raw existían; faltaba `SELECT` de `RL_BT_TERPEL_COMBS_BI` (owner de la vista) sobre `GSCC2_RAW_TERPEL_ATL_25/26`. Ese GRANT ya está. |
| 2 | Columna `PERIODO` interpretable + regla escrita | **Hecho en capa de entrega digital. Parcial en ATL** | Digital: `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE.PERIODO` (DATE, primer día del mes). `COUNT_IF(PERIODO IS NULL) = 7` de 3 322 (no cero: esas 7 no tienen mes ni fecha válida). Comentario de columna con la regla. ATL: `MES` es solo el nombre del mes (**Enero, Febrero, … sin año**). No se inventó 2026. `PERIODO` ATL queda NULL hasta que la fuente traiga año. |
| 3 | Regla de cada métrica (sumas, no AVG) | **Hecho** | Tabla más abajo. Validado: CTR promediado **3,436** vs CTR sobre sumas OK **1,407** (mismo hallazgo del mensaje). |
| 4 | Dimensiones normalizadas y `FAMILIA` completa | **Hecho en capa de entrega** | Columnas `*_NORM`. `FAMILIA_NORM` nulos = **0**. Cuentas 16→13, plataformas 95→90, modelos 13→9 (8 canónicos + `OTRO`), objetivos 20→18. |
| 5 | Catálogo: dirección + `atl_by_medium` | **Hecho** | `SELECT METRIC_KEY, SEMANTIC_DIRECTION, SHAPE FROM SYNAPSE_METRIC_CATALOG`: **0 nulos** en dirección. `atl_by_medium.shape = composition`. `atl_trps` sigue inactiva a propósito. |
| 6 | Competencia sin duplicados o regla | **Hecho como regla + vista** | No está en el catálogo. Vista `VW_COMPETENCIA_PRESENCIA_ENTREGA`: 1 fila por `ANUNCIANTE+CIUDAD+MES`. 641 de 791 presencias siguen en dos categorías (eso es el dato; la llave ya no duplica la fila). |

**Tanda A (programar ya):** `media_investment`, `media_budget_execution`, `media_clicks`, `media_impressions`, `media_reach` sobre `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE`.

**Tanda B (ya desbloqueada en fuente, con matices):** ATL se puede leer; `atl_investment` / `atl_by_medium` agrupan por `MES` texto hasta que exista año. Dimensiones sucias se cortan por `*_NORM`. Competencia solo si deciden mostrarla, con la vista de presencia.

---

## Objetos nuevos

| Objeto | Para qué |
|--------|----------|
| `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE` | Digital + `PERIODO` + `*_NORM`. `SELECT` ya otorgado a `RL_BT_TERPEL_COMBS_CLIENT_BI`. |
| `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_TERPEL_ATL_26_ENTREGA_SYNAPSE` | ATL 2026 + `PERIODO` (hoy NULL). `SELECT` a `CLIENT_BI`. |
| `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_COMPETENCIA_PRESENCIA_ENTREGA` | Presencia única. `SELECT` a `CLIENT_BI`. |

La gold original `VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS` **no se reemplazó**.

---

## Entregable 2 — regla de `PERIODO` (digital)

Escrita también en el comentario de `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE.PERIODO`:

1. Si `MES` parsea a mes + año (ej. `Marzo 2025`) → primer día de ese mes.
2. Si `MES` no es interpretable y `FECHA_INICIO` es válida y no posterior a `FECHA_FIN` → mes de `FECHA_INICIO`.
3. Si `FECHA_FIN < FECHA_INICIO` se ignoran las fechas.
4. Campaña que cruza meses: mes de inicio. Sin prorrateo.
5. `Enero` (sin año), `2024` (sin mes), `NA`, `NA 2024`, nulo → `PERIODO` NULL. **No se inventa mes.**

Validación:

| | Valor |
|---|---|
| Filas | 3 322 |
| `PERIODO` NULL | **7** |
| Gasto sin período | 2 570 588 COP |
| Gasto con período | 10 172 997 148 COP |

Las ~211 filas del mensaje (`Enero`, `2024`, `NA`…) en su mayoría cayeron en la regla 2 (tienen `FECHA_INICIO` usable). Las 7 restantes no.

`COUNT_IF(PERIODO IS NULL) = 0` **no se cumple a propósito**. Si el panel exige cero nulos, hay que excluir esas 7 filas o crear un cajón de negocio; no lo decidimos aquí.

**ATL:** `MES` observado = `Enero`, `Febrero`, `Marzo`, `Abril`, `MAYO`, `JUNIO` (sin año). Inventar 2026 rompería la regla del entregable 2. `PERIODO` ATL queda NULL hasta que la raw traiga año.

---

## Entregable 3 — reglas de las 10 métricas

**Nunca promediar la columna de la campaña.** El CTR del histórico lo demuestra: `AVG(CTR_BENCHMARK) = 3,436` vs sumas OK = `1,407`.

Fuente digital: `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE`.  
Fuente ATL: `VW_TERPEL_ATL_26` (o la de entrega). Agrupar ATL por `MES` texto mientras `PERIODO` sea NULL.

| METRIC_KEY | Vista | Numerador | Denominador | Filtro | A mes |
|---|---|---|---|---|---|
| `media_investment` | entrega digital | `SUM(GASTO_FINAL)` | — | ninguno | `PERIODO` |
| `media_budget_execution` | entrega digital | `SUM(GASTO_FINAL)` | `SUM(PRESUPUESTO) * 100` | ambas no nulas y `PRESUPUESTO <> 0` (125 sin presupuesto y 32 sin gasto no entran) | `PERIODO` |
| `media_clicks` | entrega digital | `SUM(RESULTADO_CLICS)` | — | ninguno | `PERIODO` |
| `media_impressions` | entrega digital | `SUM(RESULTADO_IMPRESIONES)` | — | ninguno | `PERIODO` |
| `media_reach` | entrega digital | `SUM(RESULTADO_ALCANCE)` | — | ninguno | `PERIODO` |
| `media_goal_attainment` | entrega digital | `SUM(RESULTADO_*)` del KPI | `SUM(META_*) * 100` | meta no nula y ≠ 0; un valor por KPI (alcance, impresiones, clics, interacciones, views, leads) | `PERIODO` |
| `media_by_campaign` | entrega digital | mismas columnas de fila (`PRESUPUESTO`, `GASTO_FINAL`, `PCT_EJECUCION` de la fila, `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL`) | — | `MODELO_COMPRA_NORM <> 'OTRO'` para interpretar el % principal | grano campaña + `PERIODO` |
| `media_by_platform` | entrega digital | `SUM(GASTO_FINAL)`, `SUM(RESULTADO_*)`; costos = gasto / resultado (o *1000 para CPM) | ver costos | `PLATAFORMA_NORM` | `PERIODO` + plataforma |
| `atl_investment` | ATL 26 | `SUM(INVERSION_TOTAL)` | — | ninguno | `MES` (hasta que exista año) |
| `atl_by_medium` | ATL 26 | `SUM(INVERSION_OTV\|PTV\|RADIO\|PRENSA\|OOH)` | `SUM(INVERSION_TOTAL)` del mismo mes | composition (partes / total del mes) | `MES` |

Validación tanda A (todo el histórico de la vista de entrega):

| Métrica | Valor |
|---|---|
| `media_investment` | 10 175 567 736 COP |
| `media_budget_execution` (sumas) | 96,019 % |
| misma métrica si se promedian filas | 96,255 % (no usar) |
| `media_clicks` | 58 053 144 |
| `media_impressions` | 4 124 161 791 |
| `media_reach` | 1 823 755 309 |

Si una card necesita CTR, usar `SUM(RESULTADO_CLICS) / SUM(RESULTADO_IMPRESIONES)` con `FLAG_CALIDAD_DATOS = 'OK'`, no `AVG(CTR_BENCHMARK)`.

---

## Entregable 4 — dimensiones

Columnas a usar en cortes: `CUENTA_NORM`, `FAMILIA_NORM`, `PLATAFORMA_NORM`, `MODELO_COMPRA_NORM`, `OBJETIVO_NORM`.

Mapas aplicados:

- Cuenta: `VIve Terpel` → `Vive Terpel`; `Fundación` / `Fundacion` → `Fundación Terpel`; `NA` / nulo → `SIN_CUENTA`.
- Familia (comentario original de `FAMILIA`): Combustibles = B2B, Combustibles, Corporativo, Fundación Terpel, Gazel, Voltex; Conveniencia = Altoque, Sbarro; Lubricantes = Mobil, Terpel **y** la cuenta errónea `Lubricantes`; Lealtad = Vive Terpel; `SIN_CUENTA` → `Sin familia`.
- Plataforma: casing/typos `Thanks To You`, `Mathilde ADS` / `Mailde Ads`, `TapTap`. **No** se unieron Facebook, Instagram y Facebook/Instagram.
- Modelo: los 8 documentados se quedan. `CPF` (92), `CPCV` (10), `PF` (4), `CPEN` (1), `CPC optimizado a Ventas` (1) → `OTRO`. En `OTRO` no se lee `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL`.
- Objetivo: `Envios`/`Envíos`; `Seguidores`/`Followers`.

`FAMILIA_NORM` nulos = 0 (121 filas son `Sin familia` por falta de cuenta).

---

## Entregable 5 — catálogo

```text
METRIC_KEY                 SHAPE          SEMANTIC_DIRECTION
atl_by_medium              composition    —
atl_investment             scalar         —
media_budget_execution     scalar         —
media_by_campaign          tabular        —
media_by_platform          tabular        —
media_clicks               scalar         HIGHER = BETTER
media_goal_attainment      categorical    HIGHER = BETTER
media_impressions          scalar         HIGHER = BETTER
media_investment           scalar         —
media_reach                scalar         HIGHER = BETTER
```

Inversión y ejecución van con `—`: más gasto no es “mejor”; ejecución tiene centro en 100 %, no es monótona.

`atl_trps` permanece `IS_ACTIVE = FALSE` (no hay definición confirmada de TRP).

---

## Entregable 1 — ATL

Antes: expansión de la vista fallaba porque el owner (`RL_BT_TERPEL_COMBS_BI`) no tenía `SELECT` en `GSCC2_RAW_TERPEL_ATL_25/26` (owner `RL_BT_TERPEL_COMBS_INGEST`). El `SELECT` de Synapse sobre la vista no alcanzaba.

Ahora:

```sql
SELECT COUNT(*) FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_TERPEL_ATL_26;  -- 85
SELECT COUNT(*) FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_TERPEL_ATL_25;  -- 259
```

Pedimos al solicitante repetir esas dos con `RL_BT_TERPEL_COMBS_CLIENT_BI` (invoker’s rights: la vista se expande con el owner, que ya ve la raw).

---

## Entregable 6 — competencia

Confirmado el conteo del mensaje: 4 806 lubricantes, 4 806 combustibles, **4 399 gemelas** en anunciante+ciudad+mes. 17 anunciantes. `MES` = código `01Ene26` … `16Dic25` (el prefijo no es cronológico).

**Regla:** una presencia = `ANUNCIANTE + CIUDAD + MES`. `CATEGORIA` no es llave. Usar `VW_COMPETENCIA_PRESENCIA_ENTREGA` (791 presencias; 641 siguen etiquetadas en dos categorías vía `CATEGORIAS`).

Sigue fuera del catálogo, solo informativo (OCR). Cobertura: el comentario de la tabla dice Ene25–Abr26; no hay evidencia aquí de carga posterior.

---

## Lo que no entra

- Benchmark de mercado / industria.
- Chunks y texto OCR en el tablero.
- `AVG` de CTR o de `%` de campaña en cards.
- Inventar año en ATL o mes en las 7 filas digitales rotas.

---

## SQL de comprobación (solicitante)

```sql
-- 1 ATL
SELECT COUNT(*) FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_TERPEL_ATL_26;

-- 2 período
SELECT COUNT(*) AS filas, COUNT_IF(PERIODO IS NULL) AS periodo_null
FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE;

-- 3 no promediar
SELECT
    ROUND(AVG(CTR_BENCHMARK), 3) AS ctr_promediado,
    ROUND(SUM(IFF(FLAG_CALIDAD_DATOS = 'OK', RESULTADO_CLICS, 0))
        / NULLIF(SUM(IFF(FLAG_CALIDAD_DATOS = 'OK', RESULTADO_IMPRESIONES, 0)), 0) * 100, 3)
        AS ctr_sobre_sumas_ok
FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE;

-- 4 familia
SELECT COUNT_IF(FAMILIA_NORM IS NULL)
FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE;

-- 5 catálogo
SELECT METRIC_KEY, SEMANTIC_DIRECTION, SHAPE
FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.SYNAPSE_METRIC_CATALOG
ORDER BY 1;

-- 6 competencia
SELECT COUNT(*) AS presencias, COUNT_IF(N_CATEGORIAS > 1) AS con_dos_categorias
FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_COMPETENCIA_PRESENCIA_ENTREGA;
```
