# Catálogo de Terpel · entrega de datos · 2026-11-24

**Registrado tal como llegó** (`CATALOGO_Y_ESPECIFICACION_TECNICA_TERPEL.txt`). Lo que se midió contra él está en `docs/AUDITORIA-2026-11-24-catalogo-terpel.md`.

---

# 📑 Catálogo Maestro y Simétrico de Métricas: Terpel Synapse New Front
**Proyecto:** Synapse New Front — Dashboard Terpel  
**Fecha:** Noviembre 2026  
**Audiencia:** Equipo de Frontend, Backend, Producto y Datos  

Resumen de Aclaraciones Integradas para el Frontend:
Estructura Estricta de 2 Familias / Clientes:

🔥 Terpel Combustibles (DB_BT_TERPEL_COMBS): Contiene Combustibles (B2B, Corp, Gazel, Voltex, Fundación), Conveniencia (Altoque, Sbarro) y Lealtad (Vive Terpel) + Medios Masivos (ATL).
🛢️ Terpel Lubricantes (DB_BT_TERPEL_LUBS / DB_BT_TERPEL_COMBS): Línea independiente que agrupa las marcas Mobil, Terpel Lubricantes, promociones Dual Brand + comunidades de Social Media (Mobil Delvac Colombia y De Moteros).
Simetría Total de Métricas (19 Paid + 9 Social):

Paid Media (Eje Principal - 19 Métricas Réplica): Gasto, Presupuesto, Pacing %, Semáforo, Mix, ATL, Clics/Impresiones/Leads por cada $1M COP invertido, CPM Real, CPC Real, CPL Real, CTR Ponderado, VTR Ponderado, Cumplimientos por objetivo y Líneas de pauta.
Social Media (Eje Complementario - 9 Métricas Réplica): Total Seguidores, Crecimiento Neto, Mix de Canal, Advocacy Score ponderado ((1\text{L} + 3\text{C} + 5\text{S})/\text{Imp}), Tasa de Intención Comercial B2B, Tasa de Viralidad, Alcance Orgánico, Clics Salientes y Retención de Video \ge 95\%.
Estandarización de Conceptos:

Terminología formal de usuarios únicos (unique_users / reach) aplicada en todas las definiciones y tablas.




---

### 📌 Aclaraciones Clave de Negocio y Arquitectura:
1. **2 Familias / Clientes Únicos:**
   * **Terpel Combustibles (`DB_BT_TERPEL_COMBS`):** Subfamilias *Combustibles* (B2B, Corp, Gazel, Voltex, Fundación), *Conveniencia* (Altoque, Sbarro) y *Lealtad (Vive Terpel)* + Medios ATL.
   * **Terpel Lubricantes (`DB_BT_TERPEL_LUBS` / `DB_BT_TERPEL_COMBS`):** Marcas *Mobil* (Delvac, Sintéticos, PVL, CVL), *Terpel Lubricantes* (Curalub, Maxter) y *Dual Brand* + Social Media (*Mobil Delvac Colombia* y *De Moteros*).
2. **Simetría Total:** Ambas líneas comparten idénticamente las **19 Métricas de Paid Media** + las **9 Métricas de Social Media**.
3. **Conceptos de Audiencia:** Estandarizado a **usuarios únicos (`unique_users` / `reach`)**.

## 1. TERPEL COMBUSTIBLES (`DB_BT_TERPEL_COMBS`)

### A. Eje Principal · Paid Media (19 Métricas Estándar)

| # | Métrica UI | Clave Técnica | Expresión SQL / Fórmula | Granularidad | Visualización | Decisión de Negocio |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Gasto Total Ejecutado** | `paid_spend` | `SUM(GASTO_FINAL)` | Mensual / Campaña | **KPI Card MoM %** | Monitoreo del consumo real de presupuesto publicitario. |
| **2** | **Presupuesto Total Aprobado** | `paid_budget` | `SUM(PRESUPUESTO)` | Mensual / Anual | **Bar (Pres. vs Gasto)** | Control del techo presupuestal asignado por dirección. |
| **3** | **Tasa de Ejecución Presupuestal** | `pacing_rate` | `DIV0NULL(SUM(GASTO_FINAL), SUM(PRESUPUESTO)) * 100` | Mensual / Familia | **Gauge Chart** | Detección de subejecución (<90%) o sobregasto (>110%). |
| **4** | **Semáforo de Riesgo de Pacing** | `pacing_status` | `CASE WHEN pacing > 110 THEN 'Sobregasto' WHEN pacing < 90 THEN 'Subejecución' ELSE 'Óptimo' END` | Mensual / Campaña | **Badge de Estado** | Reasignación quincenal de recursos no invertidos. |
| **5** | **Mix de Inversión por Segmento** | `segment_spend_share` | `DIV0NULL(SUM(GASTO_FINAL), SUM(SUM(GASTO_FINAL)) OVER()) * 100` | Mensual / Anual | **Donut Chart** | Balanceo entre Combustibles, Altoque/Sbarro y Vive Terpel. |
| **6** | **Inversión ATL vs Digital** | `atl_vs_digital_spend` | `SUM(INVERSION_TOTAL_ATL) vs SUM(GASTO_FINAL_DIGITAL)` | Mensual / Anual | **Stacked Bar 100%** | Visibilidad del reparto de capital masivo vs canales digitales. |
| **7** | **Clics por Millón COP** | `clicks_per_million_cop` | `DIV0NULL(SUM(RESULTADO_CLICS), SUM(GASTO_FINAL)) * 1000000` | Mensual / Canal | **Horizontal Bar** | Canal de mayor rendimiento de tráfico calificado por peso. |
| **8** | **Impresiones por Millón COP** | `imp_per_million_cop` | `DIV0NULL(SUM(RESULTADO_IMPRESIONES), SUM(GASTO_FINAL)) * 1000000` | Mensual / Canal | **Horizontal Bar** | Canal más eficiente para cobertura de marca. |
| **9** | **Leads por Millón COP** | `leads_per_million_cop` | `DIV0NULL(SUM(RESULTADO_LEADS), SUM(GASTO_FINAL)) * 1000000` | Mensual / Campaña | **KPI Card Ranking** | Rendimiento en captación B2B y registros Vive Terpel. |
| **10** | **CPM Real Ponderado** | `cpm_effective` | `DIV0NULL(SUM(GASTO_FINAL), (SUM(RESULTADO_IMPRESIONES)/1000.0))` | Mensual / Canal | **Line Chart Temporal** | Monitoreo de inflación de costos publicitarios y subastas. |
| **11** | **CPC Real de Tráfico** | `cpc_effective` | `DIV0NULL(SUM(GASTO_FINAL), SUM(RESULTADO_CLICS))` | Mensual / Campaña | **Bar Chart Ordenado** | Detección de campañas con tráfico costoso para optimizar. |
| **12** | **CPL Real de Conversión** | `cpl_effective` | `DIV0NULL(SUM(GASTO_FINAL), NULLIF(SUM(RESULTADO_LEADS), 0))` | Mensual / Campaña | **KPI Card Semáforo** | Frena campañas con costo de adquisición fuera de umbral. |
| **13** | **CTR Ponderado** | `ctr_weighted` | `DIV0NULL(SUM(RESULTADO_CLICS), SUM(RESULTADO_IMPRESIONES)) * 100` | Mensual / Campaña | **Scatter (Gasto vs CTR)** | Mide resonancia del mensaje creativo y afinidad de audiencia. |
| **14** | **VTR Ponderado** | `vtr_weighted` | `DIV0NULL(SUM(RESULTADO_VIEWS), SUM(RESULTADO_IMPRESIONES)) * 100` | Mensual / Canal | **Horizontal Bar** | Evalúa retención de video y memorabilidad de marca. |
| **15** | **Cumplimiento de Impresiones** | `attainment_imp` | `DIV0NULL(SUM(RESULTADO_IMPRESIONES), SUM(META_IMPRESIONES)) * 100` | Mensual / Campaña | **Dual Bar (Meta vs Real)** | Auditoría de entrega y cumplimiento de agencias de medios. |
| **16** | **Cumplimiento de Alcance Único** | `attainment_reach` | `DIV0NULL(SUM(RESULTADO_ALCANCE), SUM(META_ALCANCE)) * 100` | Mensual / Campaña | **Dual Bar (Meta vs Real)** | Usuarios únicos alcanzados vs meta de penetración. |
| **17** | **Cumplimiento de Clics** | `attainment_clicks` | `DIV0NULL(SUM(RESULTADO_CLICS), SUM(META_CLICS)) * 100` | Mensual / Campaña | **Dual Bar (Meta vs Real)** | Control de entrega de visitas a canales digitales Terpel. |
| **18** | **Cumplimiento de Leads** | `attainment_leads` | `DIV0NULL(SUM(RESULTADO_LEADS), SUM(META_LEADS)) * 100` | Mensual / Campaña | **Dual Bar (Meta vs Real)** | Eficacia comercial de pauta orientada a conversión. |
| **19** | **Total Líneas de Pauta Activas** | `active_ad_lines` | `COUNT(DISTINCT NOMBRE_CAMPANA)` | Mensual / Campaña | **Data Badge** | Control de granularidad y dispersión táctica de la pauta. |


## 2. TERPEL LUBRICANTES (`DB_BT_TERPEL_LUBS` / `DB_BT_TERPEL_COMBS`)

### A. Eje Principal · Paid Media Lubricantes (19 Métricas Réplica)

| # | Métrica UI | Clave Técnica | Expresión SQL / Fórmula | Granularidad | Visualización | Decisión de Negocio |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Gasto Total Paid Lubricantes** | `paid_spend` | `SUM(GASTO_FINAL)` | Mensual / Campaña | **KPI Card MoM %** | Monitoreo del presupuesto ejecutado en Mobil y Terpel Lubs. |
| **2** | **Presupuesto Paid Lubricantes** | `paid_budget` | `SUM(PRESUPUESTO)` | Mensual / Anual | **Bar (Pres. vs Gasto)** | Control del presupuesto aprobado para marcas de Lubricantes. |
| **3** | **Pacing Rate Lubricantes** | `pacing_rate` | `DIV0NULL(SUM(GASTO_FINAL), SUM(PRESUPUESTO)) * 100` | Mensual / Marca | **Gauge Chart** | Control de ritmo de ejecución presupuestal en lubricantes. |
| **4** | **Semáforo de Riesgo de Pacing** | `pacing_status` | `CASE WHEN pacing > 110 THEN 'Sobregasto' WHEN pacing < 90 THEN 'Subejecución' ELSE 'Óptimo' END` | Mensual / Campaña | **Badge de Estado** | Reasignación de recursos entre líneas automotrices. |
| **5** | **Mix de Inversión por Marca** | `segment_spend_share` | `DIV0NULL(SUM(GASTO_FINAL), SUM(SUM(GASTO_FINAL)) OVER()) * 100` | Mensual / Anual | **Donut Chart** | Reparto presupuestal entre Mobil, Terpel Lubs y Dual Brand. |
| **6** | **Inversión ATL vs Digital** | `atl_vs_digital_spend` | `SUM(INVERSION_TOTAL_ATL) vs SUM(GASTO_FINAL_DIGITAL)` | Mensual / Anual | **Stacked Bar 100%** | Visibilidad de medios masivos vs pauta digital de producto. |
| **7** | **Clics por Millón COP** | `clicks_per_million_cop` | `DIV0NULL(SUM(RESULTADO_CLICS), SUM(GASTO_FINAL)) * 1000000` | Mensual / Canal | **Horizontal Bar** | Eficiencia de tráfico a fichas técnicas y distribuidores. |
| **8** | **Impresiones por Millón COP** | `imp_per_million_cop` | `DIV0NULL(SUM(RESULTADO_IMPRESIONES), SUM(GASTO_FINAL)) * 1000000` | Mensual / Canal | **Horizontal Bar** | Cobertura publicitaria en el segmento automotor por peso. |
| **9** | **Leads por Millón COP** | `leads_per_million_cop` | `DIV0NULL(SUM(RESULTADO_LEADS), SUM(GASTO_FINAL)) * 1000000` | Mensual / Campaña | **KPI Card Ranking** | Generación de leads de flotas, talleres y distribuidores. |
| **10** | **CPM Real Ponderado** | `cpm_effective` | `DIV0NULL(SUM(GASTO_FINAL), (SUM(RESULTADO_IMPRESIONES)/1000.0))` | Mensual / Canal | **Line Chart Temporal** | Costo por mil impresiones de pauta en automoción. |
| **11** | **CPC Real de Tráfico** | `cpc_effective` | `DIV0NULL(SUM(GASTO_FINAL), SUM(RESULTADO_CLICS))` | Mensual / Campaña | **Bar Chart Ordenado** | Costo unitario por visita a fichas técnicas y canal B2B. |
| **12** | **CPL Real de Conversión** | `cpl_effective` | `DIV0NULL(SUM(GASTO_FINAL), NULLIF(SUM(RESULTADO_LEADS), 0))` | Mensual / Campaña | **KPI Card Semáforo** | Costo por lead de talleres, flotas o distribuidores. |
| **13** | **CTR Ponderado** | `ctr_weighted` | `DIV0NULL(SUM(RESULTADO_CLICS), SUM(RESULTADO_IMPRESIONES)) * 100` | Mensual / Campaña | **Scatter (Gasto vs CTR)** | Interés en promociones Dual Brand y nuevos lanzamientos. |
| **14** | **VTR Ponderado** | `vtr_weighted` | `DIV0NULL(SUM(RESULTADO_VIEWS), SUM(RESULTADO_IMPRESIONES)) * 100` | Mensual / Canal | **Horizontal Bar** | Retención de video en guías técnicas y videos de producto. |
| **15** | **Cumplimiento de Impresiones** | `attainment_imp` | `DIV0NULL(SUM(RESULTADO_IMPRESIONES), SUM(META_IMPRESIONES)) * 100` | Mensual / Campaña | **Dual Bar (Meta vs Real)** | Auditoría de entrega en pauta digital de lubricantes. |
| **16** | **Cumplimiento de Alcance Único** | `attainment_reach` | `DIV0NULL(SUM(RESULTADO_ALCANCE), SUM(META_ALCANCE)) * 100` | Mensual / Campaña | **Dual Bar (Meta vs Real)** | Usuarios únicos alcanzados en el target automotriz. |
| **17** | **Cumplimiento de Clics** | `attainment_clicks` | `DIV0NULL(SUM(RESULTADO_CLICS), SUM(META_CLICS)) * 100` | Mensual / Campaña | **Dual Bar (Meta vs Real)** | Cumplimiento de visitas a activos digitales de lubricantes. |
| **18** | **Cumplimiento de Leads** | `attainment_leads` | `DIV0NULL(SUM(RESULTADO_LEADS), SUM(META_LEADS)) * 100` | Mensual / Campaña | **Dual Bar (Meta vs Real)** | Cumplimiento de registros de distribuidores y talleres. |
| **19** | **Total Líneas de Pauta Activas** | `active_ad_lines` | `COUNT(DISTINCT NOMBRE_CAMPANA)` | Mensual / Campaña | **Data Badge** | Dispersión y taxonomía táctica de campañas en Lubricantes. |

---

### B. Eje Complementario · Social Media & Comunidad (9 Métricas Estándar)

| # | Métrica UI | Clave Técnica | Expresión SQL / Fórmula | Granularidad | Visualización | Decisión de Negocio |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **20** | **Total Seguidores Cierre** | `social_total_followers` | `MAX(TOTAL_FOLLOWERS)` | Diaria / Mensual | **Area Chart** | Audiencia cautiva en Mobil Delvac y De Moteros. |
| **21** | **Crecimiento Neto de Comunidad** | `social_net_growth` | `SUM(NEW_FOLLOWERS)` | Diaria / Mensual | **Bar Chart (+/-)** | Balance diario neto de followers ganados vs perdidos. |
| **22** | **Mix de Audiencia por Canal** | `social_channel_share` | `DIV0NULL(MAX(TOTAL_FOLLOWERS), SUM(MAX(TOTAL_FOLLOWERS)) OVER()) * 100` | Mensual | **Donut Chart** | Distribución entre Facebook, Instagram y LinkedIn. |
| **23** | **Advocacy Score** | `social_advocacy_score` | `DIV0NULL((1*Likes + 3*Comentarios + 5*Shares), Impresiones) * 1000` | Mensual / Post | **Stacked Column** | Mide interacción de alto valor (comentarios y compartidos). |
| **24** | **Tasa de Intención Comercial B2B** | `social_commercial_intent` | `DIV0NULL(SUM(LINK_CLICKS), SUM(IMPRESSIONS_ORGANIC)) * 100` | Mensual / Canal | **KPI Card** | Porcentaje de usuarios que van a fichas técnicas y B2B. |
| **25** | **Tasa de Viralidad** | `social_virality_rate` | `DIV0NULL(SUM(SHARES), SUM(IMPRESSIONS_ORGANIC)) * 100` | Mensual / Post | **Ranking Bar** | Temas y formatos que los usuarios más recomiendan. |
| **26** | **Alcance Orgánico Total** | `social_organic_reach` | `SUM(IMPRESSIONS_ORGANIC)` | Diaria / Mensual | **Line Chart** | Visibilidad natural conseguida sin costo directo de pauta. |
| **27** | **Tráfico Saliente a Enlaces** | `social_link_clicks` | `SUM(LINK_CLICKS)` | Mensual / Canal | **Bar Chart** | Tráfico derivado a distribuidores y fichas de producto. |
| **28** | **Retención de Video Educativo** | `social_video_completions` | `SUM(VIDEO_VIEWS_ORGANIC)` | Mensual / Post | **Bar Chart Top 10** | Optimiza la producción audiovisual técnica (vistas >= 95%). |






