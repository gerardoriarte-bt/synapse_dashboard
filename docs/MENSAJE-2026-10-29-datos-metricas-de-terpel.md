# Para datos · las métricas de Terpel · 2026-10-29

**Medido contra `d296e6d` el 2026-10-29**, que es `MetricRegistry` del backend,
y con Snowflake en sólo lectura el mismo día. Se usaron dos roles:
`RL_BT_UA_TRANSFORM` y `RL_BT_TERPEL_COMBS_CLIENT_BI`, que es el rol con el
que Synapse se conecta a Terpel. Cada consulta y su resultado están en §0 de
`docs/AUDITORIA-2026-10-29-metricas-de-terpel-notebook.md`.

Gracias por el notebook `TERPEL_COMBS_METRICS` y por el catálogo del 22. El
notebook nos sirvió para saber dónde mirar. Como se armó sólo con metadatos,
corrimos consultas de agregados sobre los datos, sin leer filas de detalle, y
aparecieron cosas que los metadatos no muestran. Abajo están ordenadas por lo
que más frena.

## Lo que necesitamos que nos pasen

| # | Entregable | Qué exactamente | Cómo comprobamos que llegó |
|---|---|---|---|
| **1** | **Las vistas de ATL funcionando** | `VW_TERPEL_ATL_26` y `VW_TERPEL_ATL_25` se pueden consultar con `RL_BT_TERPEL_COMBS_CLIENT_BI` | `SELECT COUNT(*) FROM VW_TERPEL_ATL_26` devuelve filas con ese rol, y no un error |
| **2** | **Un período interpretable** en la vista digital | Una columna `PERIODO` en formato `YYYY-MM` (o `DATE` al primer día del mes) que diga a qué mes pertenece cada campaña, más la regla escrita de cómo se asigna. Igual en ATL | `COUNT_IF(PERIODO IS NULL) = 0`, y la regla está escrita en el comentario de la columna |
| **3** | **La regla de cálculo de cada métrica, por escrito** | Para cada una de las 10 del catálogo: la vista, **la columna del numerador y la del denominador**, el filtro (por ejemplo, sólo `FLAG_CALIDAD_DATOS = 'OK'`) y cómo se lleva al mes. **Promediar la columna de la campaña no sirve** (punto 3) | Una tabla con una fila por métrica. La comparamos contra la vista con la misma consulta |
| **4** | **Dimensiones normalizadas** | Un solo valor por cuenta, plataforma, modelo de compra y objetivo; y `FAMILIA` completa | Las consultas del punto 4 devuelven una fila por valor real, y cero `FAMILIA` nulas |
| **5** | **El catálogo completo** | `SEMANTIC_DIRECTION` en texto (`HIGHER = BETTER`) en las 10 filas, y la forma de `atl_by_medium` revisada | `SELECT METRIC_KEY, SEMANTIC_DIRECTION, SHAPE FROM SYNAPSE_METRIC_CATALOG` sin nulos |
| **6** | **Competencia sin duplicados**, si se va a mostrar | Que cada registro esté en una sola categoría, o la explicación de por qué está en dos | El conteo del punto 6 da cero gemelas, o hay una regla escrita |

**Se puede entregar en dos tandas:**

| Tanda | Métricas | Necesita |
|---|---|---|
| **A · ya** | `media_investment`, `media_budget_execution`, `media_clicks`, `media_impressions` y `media_reach` | Entregables 2, 3 y 5. La vista digital se lee bien y sus fórmulas cierran |
| **B · después** | `media_goal_attainment`, `media_by_campaign`, `media_by_platform`, `atl_investment` y `atl_by_medium` | Además el 4 (las tres de medios agrupan por dimensiones sucias) y el 1 (las dos de ATL) |

Competencia no está en el catálogo. Si se va a mostrar, entra después de la
tanda B, con su fila de catálogo y el entregable 6.

**Lo que hacemos nosotros cuando llegue cada tanda:** verificamos las reglas
contra las vistas, pedimos que se programen las métricas y armamos los
paneles. Ustedes no tienen que escribir nada de la consola.

## Lo que encontramos

### 1. Las vistas de ATL fallan para cualquier rol

```sql
USE ROLE RL_BT_TERPEL_COMBS_CLIENT_BI;
SELECT COUNT(*) FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_TERPEL_ATL_26;
```
```
Failure during expansion of view 'VW_TERPEL_ATL_26': SQL compilation error:
Object 'DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_RAW_INGEST.GSCC2_RAW_TERPEL_ATL_26'
does not exist or not authorized.
```

`VW_TERPEL_ATL_25` da el mismo error con `GSCC2_RAW_TERPEL_ATL_25`, y con
`RL_BT_UA_TRANSFORM` también falla. El rol de Synapse **sí** tiene `SELECT`
sobre las dos vistas desde el 22. Lo que no se resuelve es la tabla cruda.

Como la vista se resuelve con los privilegios de su dueño
(`RL_BT_TERPEL_COMBS_BI`), sospechamos que la tabla ya no existe o que ese rol
perdió el acceso. No lo pudimos comprobar, porque no vemos
`BT_TERPEL_COMBS_RAW_INGEST`. Sin esto, `atl_investment` y `atl_by_medium` no
tienen fuente.

### 2. `MES` no sirve como período

```sql
SELECT MES, COUNT(*), SUM(GASTO_FINAL), SUM(PRESUPUESTO)
FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS GROUP BY MES ORDER BY MES;
```

Es texto libre, como «Marzo 2025». Además, **211 de las 3 322 filas no tienen
un mes interpretable**:

| `MES` | Campañas |
|---|---|
| `Enero` (sin año) | 64 |
| `2024` (sin mes) | 61 |
| `NA` | 51 |
| `NA 2024` | 32 |
| nulo | 3 |

Las 51 de `NA` suman 188 553 036 COP de gasto sobre 71 922 493 de
presupuesto, o sea una ejecución del 262 %.

**`FECHA_INICIO` tampoco resuelve el problema.** En septiembre de 2026, las
dos formas dan la misma cantidad de campañas, pero no son las mismas:

| Septiembre de 2026 | Campañas | Gasto (COP) |
|---|---|---|
| `MES = 'Septiembre 2026'` | 90 | 585 906 230 |
| `FECHA_INICIO` en septiembre | 90 | 601 901 636 |

Además, 10 campañas cruzan de un mes a otro, y en 7 `FECHA_FIN` es anterior a
`FECHA_INICIO`. **La regla para asignar una campaña a un mes la conocen
ustedes**, por eso la pedimos escrita (entregable 2).

### 3. Promediar las campañas cambia la cifra

```sql
SELECT ROUND(AVG(CTR_BENCHMARK), 3) AS ctr_promediado,
       ROUND(SUM(IFF(FLAG_CALIDAD_DATOS = 'OK', RESULTADO_CLICS, 0))
           / NULLIF(SUM(IFF(FLAG_CALIDAD_DATOS = 'OK', RESULTADO_IMPRESIONES, 0)), 0) * 100, 3)
                                     AS ctr_sobre_sumas_ok
FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS;   -- 3,436 · 1,407
```

| | Promediando campañas | Con sumas |
|---|---|---|
| CTR, todo el histórico | **3,44 %** | **1,41 %** |
| Ejecución, `MES = 'Octubre 2026'` | **105,4 %** | **77,4 %** |

El notebook propone `AVG(CTR_BENCHMARK)` para la card de CTR, y eso mostraría
más del doble del CTR real. En octubre, el promedio dice «sobreejecución»
cuando con sumas queda un 23 % del presupuesto sin ejecutar.

**Lo que sí está bien:** `PCT_EJECUCION_PRESUPUESTO` coincide con su fórmula
en todas las filas donde se puede calcular. Hay 125 filas sin presupuesto y 32
sin gasto, y conviene que la regla diga qué se hace con ellas.

### 4. Las dimensiones parten las sumas

```sql
SELECT CUENTA, COUNT(*) FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS GROUP BY 1;
-- y lo mismo con FAMILIA, PLATAFORMA, MODELO_COMPRA y OBJETIVO
```

- **`CUENTA`**: `Vive Terpel` (376) y `VIve Terpel` (6); `Fundación Terpel`
  (65), `Fundación` (29) y `Fundacion` (1); `NA` (92) y nulo (29). Además,
  `Lubricantes` (4) aparece como cuenta, pero es el nombre de una familia.
- **`FAMILIA`**: 155 filas son nulas.
- **`PLATAFORMA`**: tiene 95 valores distintos. Por ejemplo, `Thanks To you`,
  `Thanks To You` y `Thanks to you`; `Mathilde ADS`, `Mathilde Ads` y
  `Mailde Ads`; `Tap Tap` y `TapTap`; `Facebook/Instagram`, `Facebook` e
  `Instagram`.
- **`MODELO_COMPRA`**: tiene modelos que el comentario de la columna no
  declara, como `CPF` (92), `CPCV` (10), `PF` (4), `CPEN` (1) y «CPC
  optimizado a Ventas» (1). Para esas filas, no sabemos cuál es la métrica
  principal de `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL`.
- **`OBJETIVO`**: aparecen `Envios` y `Envíos`, y `Seguidores` y `Followers`.

### 5. El catálogo

```sql
SELECT METRIC_KEY, SHAPE, UNIT, SEMANTIC_DIRECTION FROM SYNAPSE_METRIC_CATALOG;
```

- **Las 10 filas tienen `SEMANTIC_DIRECTION` en nulo.** En la consola se ve
  como un rótulo vacío. Va en texto: `HIGHER = BETTER`, o `—` si la métrica
  no tiene dirección, como la inversión.
- **`atl_by_medium` está como `categorical`**, pero su BASE dice
  «participación de cada medio en la inversión del mes». Si las partes suman
  el 100 %, es `composition`.
- `DD_METRIC_CURATION` tiene 11 filas y 10 activas. No sabemos si la inactiva
  es a propósito.

### 6. Competencia: lubricantes y combustibles duplicados

```sql
SELECT COUNT_IF(CATEGORIA = 'LUBRICANTES') AS lubricantes,
       (SELECT COUNT(*) FROM COMPETENCIA_COMBS_STRUCTURED x
         WHERE x.CATEGORIA = 'LUBRICANTES' AND EXISTS (
           SELECT 1 FROM COMPETENCIA_COMBS_STRUCTURED c
            WHERE c.CATEGORIA = 'COMBUSTIBLES'
              AND c.ANUNCIANTE IS NOT DISTINCT FROM x.ANUNCIANTE
              AND c.CIUDAD     IS NOT DISTINCT FROM x.CIUDAD
              AND c.MES        IS NOT DISTINCT FROM x.MES)) AS con_gemela
FROM COMPETENCIA_COMBS_STRUCTURED;   -- 4806 · 4399
```

Las dos categorías tienen exactamente 4 806 filas, y 4 399 de las de
lubricantes (91,5 %) coinciden en anunciante, ciudad y mes con una de
combustibles. Sólo comparamos esas tres columnas. Hay dos cosas más:

- **`MES` es un código** (`01Ene26` … `16Dic25`), y el prefijo de orden no es
  cronológico: `01` es enero de 2026 y `05` es enero de 2025.
- **La cobertura termina en abril de 2026.** ¿Se sigue cargando?

Lo bueno: hay 17 anunciantes y casi no hay ruido del OCR en los nombres. Sólo
`GOLDEN`, con una fila, nos parece sospechoso.

## Lo que no hace falta

- **Permisos**: el rol de Synapse tiene `SELECT` sobre todo lo que se
  necesita, y `SELECT` futuro sobre el esquema. Lo del ATL no es un permiso
  de Synapse.
- **Un benchmark de mercado**: estamos de acuerdo con el notebook en no
  mostrar uno hasta que exista una tabla curada.
- **Los chunks y el texto de OCR**: quedan fuera del tablero, como propone el
  notebook.
