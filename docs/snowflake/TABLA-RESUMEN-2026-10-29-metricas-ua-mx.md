# Tabla resumen · métricas de Synapse para UA MX · versión 3.2 · 2026-10-29

> **Transcripción de lo que entregó datos. No se edita**, como todo lo que
> mandan ellos a `docs/snowflake/`.

**Origen:** `TABLA RESUMEN - MÉTRICAS SYNAPSE UA MX.xlsx`, versión 3.2, una
sola hoja. Se generó automáticamente desde el archivo con `openpyxl`: cada
celda con valor está acá, en el orden de la hoja. El `.xlsx` original se quitó
del repositorio local el 2026-10-29, y esta transcripción lo reemplaza.

**Lo que se midió sobre esta tabla** está en
`docs/AUDITORIA-2026-10-29-metricas-de-ua-tabla-resumen.md`. Por ejemplo, dos
de las tablas fuente que nombra no existen con ese nombre, y el nCAC sale mal
en la vista. Lo que se le pidió a datos está en
`docs/MENSAJE-2026-10-29-datos-metricas-de-ua.md`.

---

**Hoja:** TABLA RESUMEN - MÉTRICAS SYNAPS · 1 hoja(s) en el libro

## TABLA RESUMEN - MÉTRICAS SYNAPSE UA MX

Versión: 3.2 \| Fecha: 2026-10-29 \| Total: 11 métricas

| # | Métrica | Campo Técnico | Tabla Fuente | Fórmula | Descripción | Para Qué Sirve | Gráficos |
|---|---|---|---|---|---|---|---|
| 1 | MER (Marketing Efficiency Ratio) | MER_TOTAL MER_PAID MER_BRAND | GLD_ECOMM_METRICS_DAILY | Revenue / Costo | Ratio de eficiencia: USD revenue por cada USD invertido | Evaluar ROI marketing global. Benchmark >2.5 | Line (trending 6M), Gauge (actual), Bar (por canal) |
| 2 | RPV (Revenue Per Visit) | RPV_TOTAL RPV_PAID RPV_BRAND | GLD_ECOMM_METRICS_DAILY | Revenue / Visits | Revenue promedio por visita | Medir calidad de tráfico. Benchmark >$1.50 | Line (por scope), Histogram (90 días), Box Plot (por canal) |
| 3 | CVR (Conversion Rate) | CVR_TOTAL CVR_PAID CVR_BRAND | GLD_ECOMM_METRICS_DAILY | (Orders / Visits) × 100 | Tasa conversión visitas → órdenes (%) | Optimizar funnel. Benchmark >0.5% | Line (3M con bandas), Funnel (Visits→Orders), Heatmap (día/hora) |
| 4 | AOV (Average Order Value) | AOV_TOTAL AOV_PAID AOV_BRAND | GLD_ECOMM_METRICS_DAILY | Revenue / Orders | Ticket promedio por orden | Upsell/cross-sell. Benchmark >$100 | Line (con promos), Box Plot (percentiles), Scatter (AOV vs Units) |
| 5 | ROAS (Return On Ad Spend) | ROAS | GLD_PAID_MEDIA_METRICS_DAILY | Revenue / Ad Spend | Retorno sobre inversión publicitaria | Optimizar campañas paid. Benchmark >3.0. ⚠️ Solo lower-funnel | Bar (por canal 30D), Scatter (ROAS vs Spend), Line (trending) |
| 6 | Promo Dependency | PROMO_DEPENDENCY_PCT | GLD_ECOMM_METRICS_DAILY | (Rev Promo / Rev Total) × 100 | % revenue de promociones | Evaluar dependencia descuentos. Benchmark <40% | Line (6M), Stacked Bar (Full vs Sale), Gauge (actual) |
| 7 | Category Mix | CATEGORY_MIX_PCT | GLD_PRODUCT_MIX_METRICS | Rev Categoría / Rev Total × 100 | Distribución revenue por categoría | Diversificación portfolio. Max 50% por categoría | Pie (top 8), Treemap (jerárquico), Stacked Area (12M) |
| 8 | SKU Concentration | SKU_CONCENTRATION_RISK_PCT | GLD_PRODUCT_MIX_METRICS | Rev Top 10 SKUs / Rev Total × 100 | % revenue en top 10 SKUs | Riesgo concentración. Benchmark <30% | Bar (top 20 + Pareto), Line (trending 6M), Table (top 10) |
| 9 | Budget Pacing | PCT_SPENT BUDGET_STATUS | GLD_BUDGET_CONTROL | (Actual / Plan) × 100 | % presupuesto ejecutado | Control presupuestario. Día 15 = 50% ideal | Bullet (actual vs plan), Waterfall (por canal), Line (acumulado) |
| 10 | nCAC (New Customer Acq Cost) | nCAC_USD | GLD_CUSTOMER_METRICS_COHORT | Costo Cohorte / Nuevos Clientes | Costo adquirir cliente registrado. 71% órdenes, 73% revenue. Excluye guest | Eficiencia adquisición. ✅ Trending relativo. ❌ NO absolutos | Line (cohortes 24M), Bar (por canal), Scatter (nCAC vs Size) |
| 11 | LTV (Lifetime Value) | LTV_INGRESOS_USD | GLD_CUSTOMER_METRICS_COHORT | SUM(Revenue) por cliente | Valor total cliente registrado. 73% revenue, 73.5% recurrentes | Segmentación VIP/MID/ENTRY/LOW. Decisiones retención | Histogram (bins $50), Pie (segmentos), Box Plot (por canal), Scatter (LTV vs Freq) |

### 📊 BENCHMARKS RÁPIDOS

| Métrica | ✅ Saludable | ⚠️ Alerta | 🎯 Objetivo |
|---|---|---|---|
| MER Total | >2.5 | <1.5 | 3.0+ |
| RPV Total | >$1.50 | <$0.80 | $2.00+ |
| CVR Total | >0.5% | <0.3% | 0.8%+ |
| AOV Total | >$100 | <$80 | $120+ |
| ROAS (Lower Funnel) | >3.0 | <1.5 | 4.0+ |
| Promo Dependency | <40% | >60% | 25-35% |
| SKU Concentration | <30% | >50% | <25% |
| Ratio LTV/CAC | >3.0 | <1.5 | >4.0 |

🎯 DISCLAIMERS  
Métricas 10 y 11 (nCAC y LTV)  
📊 CLIENTES CON REGISTRO  
- Alcance: 71% órdenes \| 73% revenue \| 73.5% recurrentes  
- Excluye: Guest checkout (menor valor, no identificables)  
- Por qué: 10x mayor recompra, accionables para CRM  
✅ nCAC: Usar trending relativo (mes vs mes)  
❌ nCAC: NO valores absolutos ni benchmarks externos  
✅ LTV: Segmentación confiable (VIP/MID/ENTRY/LOW)  
✅ Ratio LTV/CAC: Ambos misma base = métrica válida  
Métrica 5 (ROAS)  
⚠️ LIMITACIÓN ATRIBUCIÓN LAST-CLICK  
- TikTok, Display: ROAS bajo (awareness/upper-funnel)  
- NO usar ROAS para evaluar estos canales  
- SÍ usar: Reach, VTR, Brand Lift  
✅ ROAS válido: Google Search, Meta Retargeting, Criteo  
🎨 TIPOS DE GRÁFICO POR CATEGORÍA  
Eficiencia (MER, ROAS, RPV)  
→ Line Chart (trending) + Gauge (actual) + Bar (comparativo)  
Conversión (CVR, Budget Pacing)  
→ Line (con bandas) + Funnel + Heatmap  
Mix/Composición (Category, Promo, SKU)  
→ Pie/Donut + Stacked Area + Treemap  
Clientes (LTV, nCAC)  
→ Histogram + Box Plot + Scatter + Cohort Heatmap  
