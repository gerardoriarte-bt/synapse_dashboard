# Notebook `TERPEL_COMBS_METRICS` · inventario de Terpel Combustibles · 2026-10-29

> **Transcripción de lo que entregó datos. No se edita**, como todo lo que
> mandan ellos a `docs/snowflake/`.

**Origen:** `TERPEL_METRICS (2).html`, un notebook de Snowflake exportado el
29 de octubre de 2026 a las 04:54 PM GMT-5. Se generó automáticamente desde el
HTML: los bloques de texto, las tablas, el SQL y el resultado de la única celda
SQL. Lo que se dejó fuera es sólo la interfaz del visor (botones, buscador,
selector de columnas). Se comprobó que toda palabra del documento esté acá. El
`.html` original se quitó del repositorio local el 2026-10-29, y esta
transcripción lo reemplaza.

**El notebook se armó sólo con metadatos.** Lo que apareció al medir los datos
—las vistas de ATL rotas, `MES` sin formato, dimensiones sucias y competencia
duplicada— está en §0 de
`docs/AUDITORIA-2026-10-29-metricas-de-terpel-notebook.md`. Lo que se le pidió
a datos está en `docs/MENSAJE-2026-10-29-datos-metricas-de-terpel.md`.

---

Este notebook documenta **lo que ya existe** en `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS` y **lo que se puede habilitar ahora** en el dashboard Synapse. No incluye mejoras futuras.

# Inventario actual — Dashboard Terpel Combustibles

**Esquema:** `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS`  
**Alcance:** solo metadatos (sin leer registros de negocio).  
**Uso:** qué hay, qué se puede usar hoy y con qué límites.

| Estado | Significado |
|---|---|
| **Listo para usar** | Comentarios o definición de vista confirman significado y fórmula |
| **Usable con cuidado** | La columna/objeto existe, pero falta comentario o hay advertencia de calidad |
| **No habilitar todavía** | Existe como texto/chunks o requiere cálculo no presente en el esquema |

**Habilitable ahora**

- Pauta digital: metas vs resultados por campaña
- Pauta ATL: inversión y volumen por canal (2025 y 2026)
- Competencia: conteos de presencia (solo informativo)

**No habilitar como KPI de dashboard**

- Redes orgánicas, paid media PDF y competencia en chunks (son texto para búsqueda, no series)
- Fórmulas no documentadas y métricas inventadas (SOV, frecuencia, targets)

## 📁 OBJETOS DEL ESQUEMA

### Inventario Completo

**Celda SQL · Resumen de Objetos del Esquema**

```sql
-- Resumen de objetos en el esquema
SELECT 
    TABLE_TYPE,
    COUNT(*) AS NUM_OBJETOS,
    SUM(CASE WHEN COMMENT IS NOT NULL THEN 1 ELSE 0 END) AS OBJETOS_DOCUMENTADOS
FROM DB_BT_TERPEL_COMBS.INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'BT_TERPEL_COMBS_MART_ANALYTICS'
GROUP BY TABLE_TYPE
ORDER BY NUM_OBJETOS DESC;
```

Resultado:

| TABLE_TYPE | NUM_OBJETOS | OBJETOS_DOCUMENTADOS |
|---|---|---|
| BASE TABLE | 8 | 5 |
| VIEW | 4 | 3 |

### Qué hay y para qué sirve hoy

| Objeto | Tipo | Filas (metadato) | Uso actual |
|---|---|---|---|
| `VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS` | VIEW | n/d | **Fuente principal digital.** Grano: 1 fila por campaña. Metas, resultados, costos y calidad. |
| `VW_TERPEL_ATL_26` | VIEW | n/d | **Fuente ATL vigente.** Inversión y piezas por campaña/mes. Sin comentarios de columna. |
| `VW_TERPEL_ATL_25` | VIEW | n/d | ATL 2025 (histórico). Misma forma que 2026 + `INVERSION` y `SALIDAS`. |
| `COMPETENCIA_COMBS_STRUCTURED` | TABLE | 20,680 | Presencia publicitaria competencia (Ene25–Abr26). OCR con alineación aproximada. |
| `DD_METRIC_CURATION` | TABLE | 11 | Curaduría editorial Synapse (no es el fact de campañas). |
| `SYNAPSE_METRIC_CATALOG` | VIEW | n/d | Catálogo activo: filtra `DD_METRIC_CURATION` donde `IS_ACTIVE`. |
| `FORMULAS_MARKETING` | TABLE | 113 | Diccionario de fórmulas. Sin comentarios. No es fuente de cálculo. |
| `PAID_MEDIA_TEXTO_RAW` | TABLE | 208 | Texto OCR de reportes paid media. No tabular. |
| `PAID_MEDIA_CHUNKS` | TABLE | 1,701 | Chunks para búsqueda. No KPI. |
| `ORGANIC_SM_CHUNKS` | TABLE | 16 | Chunks orgánicos. Cobertura baja. No KPI. |
| `COMPETENCIA_COMBS_CHUNKS` | TABLE | 2,351 | Chunks competencia. No KPI. |
| `COMPETENCIA_COMBS_TEXTO_RAW` | TABLE | 1 | Texto crudo competencia. No KPI. |

## 1. Entendimiento de negocio (solo evidencia de metadatos)

### Hechos

**Familias** — comentario de `VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS.FAMILIA`:

- Combustibles: B2B, Combustibles, Corporativo, Fundación Terpel, Gazel, Voltex
- Conveniencia: Altoque, Sbarro
- Lubricantes: Mobil, Terpel
- Lealtad: Vive Terpel

**Digital** — misma vista: plataformas (Facebook/Instagram, DV360, Google Ads, TikTok, Basis) y objetivos (Alcance, Interacción, Views de Video, Tráfico, Conversión).

**ATL** — columnas de inversión en `VW_TERPEL_ATL_25/26`: OTV, PTV, Radio, Prensa, OOH. Los nombres de canal existen; las piezas (spots, cuñas, TRPs) **no** tienen comentario.

**Orgánico** — comentario de `ORGANIC_SM_CHUNKS`: Facebook, Instagram, TikTok; marcas TERPEL, ALTOQUE, SBARRO. Solo 16 chunks: no es serie de KPI.

**Paid media PDF** — comentarios de `PAID_MEDIA_*`: categorías COMBUSTIBLES, CONVENIENCIA, LEALTAD, LUBRICANTES. Texto/chunks, no tablero numérico.

### Modelos de compra digitales (confirmados en comentario de `MODELO_COMPRA`)

| Modelo | Qué mide | Métrica principal de la vista |
|---|---|---|
| CPM | Costo por mil impresiones | Impresiones |
| CPC | Costo por clic / tráfico | Clics en enlace |
| CPI | Costo por interacción | Interacciones |
| CPV | Costo por vista de video | Views |
| CPL | Costo por lead | Leads |
| CPE | Costo por escucha / audio | Escuchas |
| CPA | Costo por adquisición | Descargas |
| CPP | Costo por punto de alcance | Alcance |

`PCT_CUMPLIMIENTO_METRICA_PRINCIPAL` ya aplica esa regla en la vista.

### Competencia (hecho + límite)

Tabla `COMPETENCIA_COMBS_STRUCTURED`: Infoanalisis, Ene25–Abr26, columnas ANUNCIANTE, CIUDAD, CATEGORIA, MES. El comentario de tabla dice que la alineación OCR es aproximada. **Usable como conteo informativo, no como inversión ni SOV oficial.**

### Catálogo Synapse (hecho)

`DD_METRIC_CURATION` (11 filas) documenta familias `demand | media | inventory | customer | external` y capas BRONZE/SILVER/GOLD. `SYNAPSE_METRIC_CATALOG` solo publica las activas. No sustituye el fact de campañas.

### Hipótesis (no confirmadas por comentarios ni definiciones)

- El objetivo del tablero es optimizar inversión publicitaria.
- El ritmo de decisión es mensual (`MES` existe, pero en digital también hay fechas de campaña).
- Competencia se usará para share of voice (el cálculo **no** existe en el esquema).
- `NOMBRE_CAMPANA` se parseará en el front (la estructura sí está documentada; el parseo no).

---

## 2. Unidades de negocio habilitadas hoy

Cortes que **ya existen** en la vista digital (`FAMILIA` + `CUENTA`). Los objetivos de negocio de la tabla son hipótesis; el corte de datos no lo es.

| Unidad (`FAMILIA`) | Cuentas documentadas | Qué se puede mostrar hoy |
|---|---|---|
| Combustibles | B2B, Combustibles, Corporativo, Fundación Terpel, Gazel, Voltex | Inversión, ejecución, cumplimiento y costos digitales. ATL por `CUENTA` si coincide el texto. |
| Conveniencia | Altoque, Sbarro | Igual. Orgánico solo como búsqueda de texto (no KPI). |
| Lubricantes | Mobil, Terpel | Igual. |
| Lealtad | Vive Terpel | Igual. |

**Nota:** ATL no trae columna `FAMILIA`. Filtrar ATL por familia requiere mapear `CUENTA` — ese mapa no está en el esquema; hoy se filtra por `CUENTA` tal cual.

---

## 3. KPIs habilitables ahora

Objetivos numéricos (95–105%, CTR 1–3%, etc.) **no** están en el esquema. El tablero puede mostrar el valor; el semáforo contra target es decisión de negocio posterior.

### Digital — listos (fórmula en comentario de columna)

| KPI | Fórmula (vista) | Unidad | Grano | Fuente |
|---|---|---|---|---|
| Inversión digital | `SUM(GASTO_FINAL)` | COP | campaña | `GASTO_FINAL` |
| Presupuesto | `SUM(PRESUPUESTO)` | COP | campaña | `PRESUPUESTO` |
| % ejecución presupuesto | `(GASTO_FINAL / PRESUPUESTO) * 100` | % | campaña | `PCT_EJECUCION_PRESUPUESTO` |
| % cumplimiento métrica principal | según `MODELO_COMPRA` | % | campaña | `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL` |
| Calidad | contar `FLAG_CALIDAD_DATOS <> 'OK'` | conteo | campaña | `FLAG_CALIDAD_DATOS` |

### Digital — resultados y costos (listos)

Todas viven en `VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS`. Grano: **campaña**. Agregar con `SUM` en volumenes; en ratios usar columnas `_BENCHMARK` o recalcular sobre sumas (no promediar CPM/CPC/CTR crudos sin cuidado).

**Volumen (resultado y % vs meta ya calculados)**  
Impresiones, alcance, clics, interacciones, views, leads, descargas, escuchas — columnas `RESULTADO_*`, `META_*`, `PCT_CUMPLIMIENTO_*`.

**Costos unitarios (fórmula confirmada)**

- `CPM` = `(GASTO_FINAL / RESULTADO_IMPRESIONES) * 1000`
- `CPC` = `GASTO_FINAL / RESULTADO_CLICS`
- `CPI` = `GASTO_FINAL / RESULTADO_INTERACCIONES`
- `CPV` = `GASTO_FINAL / RESULTADO_VIEWS`
- `CTR` / `VTR` en %; para promedios usar `CTR_BENCHMARK` y `VTR_BENCHMARK` (capados; >100 quedan NULL).

**No habilitar ahora**

- Frecuencia (`impresiones / alcance`): no está en la vista.
- CPL / CPA / CPE como columnas: no están; solo metas/resultados de leads, descargas y escuchas.

### Benchmarks: que hay validado y que no

No existe en `BT_TERPEL_COMBS_MART_ANALYTICS` (ni en busqueda de catalogo) una tabla de **benchmark de mercado / industria** (CTR, CPM, CPV de categoria combustibles Colombia). No habilitar cifras de industria inventadas.

**Si esta validado en metadatos — usar esto como benchmark:**

| Tipo | Que compara | Fuente | Filtro de validacion | Grano |
|---|---|---|---|---|
| Vs meta de campana | Resultado vs meta del modelo de compra | `PCT_CUMPLIMIENTO_*` y `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL` | ya calculado en la vista | campana |
| Vs propio (calidad OK) | CTR / VTR sin outliers | `CTR_BENCHMARK`, `VTR_BENCHMARK` | comentario: cap a 100%; si CTR/VTR > 100 queda NULL | campana |
| Vs peer interno | Mediana propia por `PLATAFORMA` + `MODELO_COMPRA` (+ `FAMILIA`) | mismas columnas de costo/tasa, solo filas `FLAG_CALIDAD_DATOS = 'OK'` | flag documentado: OK vs CTR/VTR outlier | campana, agregado al corte |

`CTR_BENCHMARK` / `VTR_BENCHMARK` **no son** un benchmark de mercado. El comentario dice: CTR/VTR capados para promedios internos, para no distorsionar agregados.

**No habilitado (no hay objeto):** CPM/CPC/CPV de industria, SOV de mercado, benchmark ATL, targets oficiales por familia.

### ATL — usable ahora (inversión)

Fuente: `VW_TERPEL_ATL_26` (vigente) y `VW_TERPEL_ATL_25` (histórico). Grano: **campaña + mes (texto)**. No hay `FECHA_INICIO`/`FECHA_FIN`.

| KPI | Agregación | Unidad | Estado |
|---|---|---|---|
| Inversión total ATL | `SUM(INVERSION_TOTAL)` | NUMBER | Listo para sumar; sin comentario de columna |
| Inversión OTV / PTV / Radio / Prensa / OOH | `SUM` de cada columna | NUMBER | Igual |

`INVERSION` solo existe en ATL 25. `INVERSION_TOTAL_COMISION` y `COMISION` existen; significado **por validar**.

### ATL — volumen (mostrar como número, no interpretar de más)

`TRPS`, `SPOTS_OTV`, `SPOTS_PTV`, `MENCIONES`, `CUNAS`, `REMOTOS`, `SECCIONES`, `ELEMENTOS_OOH`, `ELEMENTOS_IMPRESOS`, `CONTENIDO_DIGITAL_EN_RADIO`, `SALIDAS` (solo 25). Se pueden poner en tabla. **No hay comentario que confirme unidad ni fórmula.**

### Competencia — solo informativo

Habilitable: `COUNT(*)` por `ANUNCIANTE`, `CIUDAD`, `CATEGORIA`, `MES`.  
No habilitar: inversión estimada, SOV oficial, alerta de “nuevos competidores” como KPI de negocio.

---

## 4️⃣ TABLA MAESTRA DE DIMENSIONES Y MÉTRICAS

### 📊 Vista Consolidada para Dashboard

### Dimensiones usables ahora

Fuente digital: `VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS`. Grano: campana.

| Nombre | Tipo | Fuente | Uso hoy | Periodicidad | Validacion |
|---|---|---|---|---|---|
| CAMPANA | Dim | `.CAMPANA` | Filtro / agrupacion | campana | Confirmado |
| NOMBRE_CAMPANA | Dim | `.NOMBRE_CAMPANA` | Detalle / nomenclatura | campana | Estructura documentada |
| FAMILIA | Dim | `.FAMILIA` | Filtro L1 | categorica | Confirmado |
| CUENTA | Dim | `.CUENTA` | Filtro L2 | categorica | Confirmado |
| PLATAFORMA | Dim | `.PLATAFORMA` | Canal digital | categorica | Confirmado |
| OBJETIVO | Dim | `.OBJETIVO` | Corte de efectividad | categorica | Confirmado |
| MODELO_COMPRA | Dim | `.MODELO_COMPRA` | Que KPI principal aplicar | categorica | Confirmado |
| MES | Dim | `.MES` | Corte mensual | mensual (texto) | Confirmado; no es DATE |
| FECHA_INICIO | Dim | `.FECHA_INICIO` | Rango / duracion | DATE | Confirmado |
| FECHA_FIN | Dim | `.FECHA_FIN` | Rango / duracion | DATE | Confirmado |
| FLAG_CALIDAD_DATOS | Dim | `.FLAG_CALIDAD_DATOS` | Filtrar OK vs outlier | campana | Confirmado |
| CAMPAIGN | Dim | `VW_TERPEL_ATL_26.CAMPAIGN` | Filtro ATL | campana+mes | Sin comentario |
| CUENTA (ATL) | Dim | `VW_TERPEL_ATL_26.CUENTA` | Filtro ATL | categorica | Sin comentario |
| MES (ATL) | Dim | `VW_TERPEL_ATL_26.MES` | Corte mensual ATL | texto | Sin comentario |
| TAG | Dim | `VW_TERPEL_ATL_26.TAG` | Etiqueta | texto | Por validar |
| ANUNCIANTE | Dim | `COMPETENCIA_COMBS_STRUCTURED.ANUNCIANTE` | Competidor | texto | OCR aproximado |
| CIUDAD | Dim | `COMPETENCIA_COMBS_STRUCTURED.CIUDAD` | Plaza | texto | OCR aproximado |
| CATEGORIA | Dim | `COMPETENCIA_COMBS_STRUCTURED.CATEGORIA` | Tipo de medio | texto | OCR aproximado |
| MES (comp.) | Dim | `COMPETENCIA_COMBS_STRUCTURED.MES` | Mes competencia | texto | OCR aproximado |

### Metricas digitales - listo para usar

Todas en `VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS`. Grano: campana.

| Nombre | Tipo | Fuente | Descripcion | Uso | Grano | Validacion |
|---|---|---|---|---|---|---|
| PRESUPUESTO | Metrica | `.PRESUPUESTO` | Presupuesto COP | Control | campana | Confirmado |
| GASTO_FINAL | Metrica | `.GASTO_FINAL` | Gasto real COP | Control | campana | Confirmado |
| PCT_EJECUCION_PRESUPUESTO | Metrica | `.PCT_EJECUCION_PRESUPUESTO` | Gasto / presupuesto x 100 | Semaforo ejecucion | campana | Formula confirmada |
| RESULTADO_IMPRESIONES / META / PCT | Metrica | columnas homonimas | Impresiones y cumplimiento | CPM | campana | Confirmado |
| RESULTADO_ALCANCE / META / PCT | Metrica | columnas homonimas | Personas unicas | CPP | campana | Confirmado |
| RESULTADO_CLICS / META / PCT | Metrica | columnas homonimas | Link clicks | CPC | campana | Confirmado |
| RESULTADO_INTERACCIONES / META / PCT | Metrica | columnas homonimas | Likes, comments, shares | CPI | campana | Confirmado |
| RESULTADO_VIEWS / META / PCT | Metrica | columnas homonimas | Views de video | CPV | campana | Confirmado |
| RESULTADO_LEADS / META / PCT | Metrica | columnas homonimas | Leads | CPL | campana | Confirmado |
| RESULTADO_DESCARGAS / META / PCT | Metrica | columnas homonimas | Descargas app | CPA | campana | Confirmado |
| RESULTADO_ESCUCHAS / META / PCT | Metrica | columnas homonimas | Escuchas | CPE | campana | Confirmado |
| CPM / CPC / CPI / CPV | Metrica | columnas homonimas | Costos unitarios | Eficiencia | campana | Formulas confirmadas |
| CTR / VTR | Metrica | `.CTR` `.VTR` | Tasas en % | Diagnostico fila | campana | Confirmado; >100 = outlier |
| CTR_BENCHMARK / VTR_BENCHMARK | Metrica | columnas homonimas | Tasas capadas / NULL si outlier | Promedios | campana | Confirmado |
| PCT_CUMPLIMIENTO_METRICA_PRINCIPAL | Metrica | columna homonima | Cumplimiento del KPI del modelo | Card maestra | campana | Confirmado |
| COSTO_PROMEDIO | Metrica | `.COSTO_PROMEDIO` | Costo unitario reportado por fuente | Referencia | campana | TEXT; por validar formato |
| DESCRIPCION_MODELO_COMPRA | Dim | `.DESCRIPCION_MODELO_COMPRA` | Que comparar | Tooltip | campana | Confirmado |

### Metricas ATL y competencia - lo que se puede poner hoy

**ATL** - `VW_TERPEL_ATL_26` (y 25). Grano: campana + mes texto. Moneda por validar (NUMBER/FLOAT; ningun comentario dice COP).

| Nombre | Tipo | Fuente | Uso hoy | Grano | Validacion |
|---|---|---|---|---|---|
| INVERSION_TOTAL | Metrica | `.INVERSION_TOTAL` | Card / mix ATL | campana+mes | Existe; sin comentario |
| INVERSION_OTV / PTV / RADIO / PRENSA / OOH | Metrica | columnas homonimas | Mix por canal | campana+mes | Existe; sin comentario |
| INVERSION | Metrica | `VW_TERPEL_ATL_25.INVERSION` | Solo 2025 | campana+mes | No esta en 26 |
| COMISION | Metrica | `.COMISION` | Mostrar numero | campana+mes | Por validar |
| INVERSION_TOTAL_COMISION | Metrica | `.INVERSION_TOTAL_COMISION` | Mostrar numero | campana+mes | Por validar |
| TRPS, SPOTS_*, MENCIONES, CUNAS, REMOTOS, SECCIONES, ELEMENTOS_* | Metrica | columnas homonimas | Tabla de volumen | campana+mes | Sin comentario; no interpretar |

**Competencia** - solo `COUNT(*)` sobre `COMPETENCIA_COMBS_STRUCTURED`. No hay columna de inversion.

---

## 5. Layout habilitable ahora

Filtros que ya tienen columna:

| Filtro | Fuente | Notas |
|---|---|---|
| Rango de fechas | digital: `FECHA_INICIO` / `FECHA_FIN` | ATL no tiene DATE; alli filtrar por `MES` |
| Familia | digital `.FAMILIA` | ATL no tiene esta columna |
| Cuenta | digital y ATL `.CUENTA` |  |
| Canal (Digital / ATL / Ambos) | selector de fuente | No es columna; elige que vista consultar |
| Calidad | digital `.FLAG_CALIDAD_DATOS` | Default: solo `OK` (filas validadas) |
| Plataforma / modelo / objetivo | solo digital |  |

**Cards digitales:** inversion `SUM(GASTO_FINAL)`, % ejecucion, # campanas, % cumplimiento vs meta, alcance `SUM(RESULTADO_ALCANCE)`, CTR `AVG(CTR_BENCHMARK)` solo `OK`.

**Comparativo validado en cards/graficos:** valor de campana vs mediana interna del mismo `PLATAFORMA` + `MODELO_COMPRA` (y opcional `FAMILIA`), calculada solo con `FLAG_CALIDAD_DATOS = 'OK'` y usando `CTR_BENCHMARK` / `VTR_BENCHMARK` para tasas. No es benchmark de mercado.

**Card ATL:** `SUM(INVERSION_TOTAL)` por `MES`. No mezclar con digital en un solo numero.

No incluir: targets de industria, SOV, frecuencia.

### Seccion digital - graficos con columnas existentes

- Inversion y cumplimiento por familia: barras `SUM(GASTO_FINAL)`, linea de `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL` (vs meta de campana).
- Serie temporal: eje `FECHA_INICIO`. Series: `SUM` de `RESULTADO_*`.
- Costo unitario por modelo: `MODELO_COMPRA` vs CPM/CPC/CPI/CPV. Solo `FLAG_CALIDAD_DATOS = 'OK'`. Linea de referencia = mediana del mismo corte (benchmark interno).
- Top campanas: `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL` + tooltip de plataforma y gasto.
- CTR / VTR por plataforma: `AVG(CTR_BENCHMARK)`, `AVG(VTR_BENCHMARK)` por `PLATAFORMA` (ya son tasas validadas / capadas).
- Campana vs peer interno: CTR o CPM de la fila vs mediana del mismo `PLATAFORMA` + `MODELO_COMPRA` en el periodo filtrado. Solo filas `OK`.

Alertas con columnas existentes (umbrales operativos, no targets de mercado):

- `PCT_EJECUCION_PRESUPUESTO > 110`
- `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL < 80`
- `FLAG_CALIDAD_DATOS <> 'OK'`
- `FECHA_FIN` en los proximos 7 dias

### Seccion ATL - solo inversion y tabla

Habilitar:

- Stacked / donut con `INVERSION_OTV`, `INVERSION_PTV`, `INVERSION_RADIO`, `INVERSION_PRENSA`, `INVERSION_OOH` por `MES`
- Tabla de campana: inversion + volumen (TRPS, spots, elementos) sin semaforo

No habilitar como insight:

- Grafico de efectividad TRP vs spots (definiciones no confirmadas)
- KPI de awareness / ROI ATL (no hay columnas)
- Filtro por `FAMILIA` (no existe en ATL)

Fuente vigente: `VW_TERPEL_ATL_26`. Historico 2025: `VW_TERPEL_ATL_25` (columnas extra `INVERSION`, `SALIDAS`).

### Seccion competencia - solo conteo, con disclaimer

Habilitar: tabla o heatmap de `COUNT(*)` por `ANUNCIANTE` x `CIUDAD` x `MES`, fuente `COMPETENCIA_COMBS_STRUCTURED`.

Disclaimer obligatorio (comentario de la tabla): alineacion OCR aproximada. No es inversion ni share of voice.

No habilitar: gauges de SOV, inversion estimada, alertas de nuevo competidor como decision.

Chunks (`COMPETENCIA_COMBS_CHUNKS`, `PAID_MEDIA_CHUNKS`, `ORGANIC_SM_CHUNKS`) no van al tablero numerico; son busqueda de documentos.

### Tablas de detalle - SQL actual (sin objetos nuevos)

Digital (una fila por campana):

```sql
SELECT
    CAMPANA, NOMBRE_CAMPANA, FAMILIA, CUENTA, MES, PLATAFORMA, OBJETIVO, MODELO_COMPRA,
    FECHA_INICIO, FECHA_FIN,
    PRESUPUESTO, GASTO_FINAL, PCT_EJECUCION_PRESUPUESTO,
    PCT_CUMPLIMIENTO_METRICA_PRINCIPAL,
    RESULTADO_IMPRESIONES, RESULTADO_ALCANCE, RESULTADO_CLICS,
    CTR_BENCHMARK, VTR_BENCHMARK,
    CPM, CPC, CPI, CPV,
    FLAG_CALIDAD_DATOS
FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS
WHERE FLAG_CALIDAD_DATOS = 'OK'
ORDER BY FECHA_INICIO DESC;
```

ATL 2026:

```sql
SELECT
    CAMPAIGN, CUENTA, MES, TAG,
    INVERSION_TOTAL, INVERSION_OTV, INVERSION_PTV, INVERSION_RADIO, INVERSION_PRENSA, INVERSION_OOH,
    TRPS, SPOTS_OTV, SPOTS_PTV,
    MENCIONES, CUNAS, REMOTOS, SECCIONES, ELEMENTOS_OOH, ELEMENTOS_IMPRESOS,
    COMISION, INVERSION_TOTAL_COMISION
FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_TERPEL_ATL_26;
```

Competencia (agregado, no fila OCR cruda):

```sql
SELECT MES, ANUNCIANTE, CIUDAD, CATEGORIA, COUNT(*) AS NUM_REGISTROS
FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.COMPETENCIA_COMBS_STRUCTURED
GROUP BY MES, ANUNCIANTE, CIUDAD, CATEGORIA;
```

### Limites actuales (no son backlog de mejora)

| Limite | Impacto |
|---|---|
| ATL sin comentarios de columna | Se muestran numeros; no se semaforizan |
| ATL `MES` es TEXT | No hay rango diario ATL |
| ATL sin `FAMILIA` | El filtro familia no aplica a ATL |
| Digital y ATL no estan unidos | Dos fuentes; no hay inversion total unica |
| Competencia es OCR | Solo conteo informativo |
| Organico / paid media PDF | Texto/chunks; no KPI tabular |
| Catalogos Synapse / formulas | No alimentan las cards |
| No hay tabla de benchmark de mercado | No hay CTR/CPM/CPV de industria en el catalogo Terpel |
| `CTR_BENCHMARK` / `VTR_BENCHMARK` | Son tasas internas capadas, no un target de mercado |

`SYNAPSE_METRIC_CATALOG` etiqueta metricas del front. Las cards salen de las vistas de pauta.

## Que habilitar en Synapse ahora

| Prioridad | Fuente | Que construir |
|---|---|---|
| 1 | `VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS` | Filtros, cards, tendencias, vs meta, vs mediana interna (solo `OK`), alertas y tabla |
| 2 | `VW_TERPEL_ATL_26` (+ 25 historico) | Mix de inversion y tabla ATL, separado |
| 3 | `COMPETENCIA_COMBS_STRUCTURED` | Conteos con disclaimer OCR |

Fuera del tablero numerico: `PAID_MEDIA_*`, `ORGANIC_SM_CHUNKS`, chunks de competencia.

Catalogos (no fact): `SYNAPSE_METRIC_CATALOG`, `DD_METRIC_CURATION`, `FORMULAS_MARKETING`.

No habilitar: linea de "benchmark de mercado" hasta que exista una tabla curada de industria.

Documentado solo con metadatos de `BT_TERPEL_COMBS_MART_ANALYTICS`. No se leyeron registros de negocio ni datos personales.


