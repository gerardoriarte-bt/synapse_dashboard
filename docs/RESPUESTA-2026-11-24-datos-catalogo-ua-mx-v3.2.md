# Catálogo y Especificación Técnica de Métricas — Under Armour México (UA MX)
**Documento Maestro para Frontend, Producto & Synapse_UA (Guía de Integración y Visualización)**  
**Fecha:** Noviembre 2026 | **Versión:** 3.2 Final  
**Ambiente Snowflake:** `DB_BT_UA.BT_UA_MART_ANALYTICS` | **Roles de Consumo:** `RL_BT_UA_BI`, `SYSADMIN`, `SYNAPSE_APP_ROLE`

---

## 1. Contexto Estratégico y Calendario Fiscal UA (Abril – Marzo)

El año fiscal de Under Armour opera de **1 de Abril a 31 de Marzo**:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│            UNDER ARMOUR MÉXICO — ROADMAP FISCAL DE ESCALAMIENTO FY27 - FY31 (ABRIL - MARZO)            │
├─────────┬──────────────────┬──────────────┬──────────────────┬──────────────────┬──────────────────────┤
│ Año     │ Meta Revenue     │ Spend Total  │ Spend Brand      │ Spend Perf.      │ MER Objetivo         │
│ Fiscal  │ Anual (USD)      │ (Brand+Perf) │ (Upper 64.4%)    │ (Lower 35.6%)    │ Blended (Rev/Ads)    │
├─────────┼──────────────────┼──────────────┼──────────────────┼──────────────────┼──────────────────────┤
│ FY27    │ $14,000,000 USD  │ $3,000,000   │ $1,932,000 USD   │ $1,068,000 USD   │ 4.67x (Consolidación)│
│ FY28    │ $17,000,000 USD  │ $3,450,000   │ $2,140,000 USD   │ $1,310,000 USD   │ 4.93x (Expansión App)│
│ FY29    │ $21,000,000 USD  │ $4,000,000   │ $2,400,000 USD   │ $1,600,000 USD   │ 5.25x (Market Share) │
│ FY30    │ $25,500,000 USD  │ $4,600,000   │ $2,620,000 USD   │ $1,980,000 USD   │ 5.54x (Fidelización) │
│ FY31    │ $30,000,000 USD  │ $5,200,000   │ $2,860,000 USD   │ $2,340,000 USD   │ 5.77x (Meta 2030/31) │
└─────────┴──────────────────┴──────────────┴──────────────────┴──────────────────┴──────────────────────┘
```

### Premisas Clave de Negocio:
1. **FY27 ($14M USD) — Consolidación Operativa y Caja:** Los datos de Abril–Noviembre 2026 muestran que FY27 debe modelarse con una meta realista de **$14.0M USD**, enfocándose en CRO, control de margen unitario (`GPT > $40 USD`) y eficiencia de pauta (`MER > 4.6x`).
2. **Estrategia Full-Funnel ($3.0M USD en FY27):**
   - **Brand / Upper-Funnel (64.4% / $1.932M USD):** Creación de demanda, reconocimiento de marca (Brand Equity) y consideración.
   - **Performance / Lower-Funnel (35.6% / $1.068M USD):** Captura de demanda, retargeting y conversión directa.
3. **Escalamiento Progresivo a FY31 ($30M USD):** Crecimiento escalonado del ~21% anual acompañado de expansión de profundidad de catálogo e inventario (desde ~$28M MSRP en FY27 hasta ~$50M MSRP en FY31).

---

## 2. Arquitectura de Vistas en Snowflake (`DB_BT_UA.BT_UA_MART_ANALYTICS`)

| Vista en Snowflake | Granularidad | Propósito de Negocio |
|---|---|---|
| `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_ECOMM_PROFITABILITY_DAILY` | **Diaria** | Monitoreo en tiempo real, eventos promocionales (Buen Fin, Hot Sale, Flash Sales), alertas de quema de pauta intradía y caídas de conversión en checkout. |
| `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` | **Mensual** | Control de P&L fiscal, márgenes CM1/CM2/CM3, GPT/GPOT, LTV/CAC, Trailing 12M y pacing estacional hacia FY27 ($14M) y FY31 ($30M). |
| `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PRODUCTO_METRICS_MONTHLY` | **Mensual** | Ranking de productos más vendidos (Top 10/20) por Revenue y Unidades, desglose por División (`CATEGORY_LVL1`) y Silueta (`CATEGORY_LVL2`). |
| `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_LTV_COHORTS_MATRIX` | **Mensual (Cohortes)** | Matriz multidimensional de cohortes con maduración de LTV (M1 a M24, Lifetime) y tasas de retención/recompra. |
| `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_METRICS_COHORT` | **Mensual (Cohortes)** | Seguimiento de clientes registrados, costo de adquisición (`nCAC`) y maduración del `LTV` histórico. |
| `DB_BT_UA.BT_UA_MART_ANALYTICS.SYNAPSE_METRIC_CATALOG` | **Catálogo Synapse** | Vista oficial que consume `DDCatalogSyncService` para exponer los widgets en el editor y al agente `Synapse_UA`. |

---

## 3. Curva de Estacionalidad Mensual Fiscal FY27 (Under Armour México)

| Mes Fiscal | Mes Calendario | Evento Comercial Clave | % Peso Anual | Meta Revenue FY27 | Budget Brand (64.4%) | Budget Perf (35.6%) | Budget Total Ads |
|---|---|---|---|---|---|---|---|
| **M01** | Abril | Spring Launch / Día del Niño | **6.5%** | $910,000 USD | $125,580 USD | $69,420 USD | $195,000 USD |
| **M02** | Mayo | **Hot Sale** + Día de las Madres | **9.5%** | $1,330,000 USD | $183,540 USD | $101,460 USD | $285,000 USD |
| **M03** | Junio | Día del Padre / Cierre Q1 Fiscal | **8.0%** | $1,120,000 USD | $154,560 USD | $85,440 USD | $240,000 USD |
| **M04** | Julio | Summer / Mid-Season Sale | **6.5%** | $910,000 USD | $125,580 USD | $69,420 USD | $195,000 USD |
| **M05** | Agosto | Back to School / Training | **7.0%** | $980,000 USD | $135,240 USD | $74,760 USD | $210,000 USD |
| **M06** | Septiembre | Lanzamientos Fall/Winter | **6.5%** | $910,000 USD | $125,580 USD | $69,420 USD | $195,000 USD |
| **M07** | Octubre | Pre-Q4 / Warm-up Comercial | **7.5%** | $1,050,000 USD | $144,900 USD | $80,100 USD | $225,000 USD |
| **M08** | Noviembre | **Buen Fin / Black Friday / Cyber** | **16.5%** | $2,310,000 USD | $318,780 USD | $176,220 USD | $495,000 USD |
| **M09** | Diciembre | **Temporada Navideña / Fin de Año**| **14.0%** | $1,960,000 USD | $270,480 USD | $149,520 USD | $420,000 USD |
| **M10** | Enero | Cuesta de Enero / Winter Sale | **6.0%** | $840,000 USD | $115,920 USD | $64,080 USD | $180,000 USD |
| **M11** | Febrero | Mes Corto / Pre-Spring | **5.5%** | $770,000 USD | $106,260 USD | $58,740 USD | $165,000 USD |
| **M12** | Marzo | Cierre de Año Fiscal FY27 | **6.5%** | $910,000 USD | $125,580 USD | $69,420 USD | $195,000 USD |
| **TOTAL** | **Abr – Mar** | **Año Fiscal Completo FY27** | **100.0%** | **$14,000,000 USD**| **$1,932,000 USD** | **$1,068,000 USD** | **$3,000,000 USD** |

---

## 4. Matriz de Justificación de Granularidades Temporales

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    UNDER ARMOUR MX — ARQUITECTURA DE GRANULARIDADES                         │
├──────────────────────────┬──────────────────────────┬───────────────────────────────────────┤
│ DIARIO / INTRADÍA        │ MENSUAL                  │ ANUAL / FY31 (RUNWAY) │ COHORTES (AGING)│
│ • Reacción táctica       │ • Control de P&L         │ • Planificación       │ • Retención & LTV  │
│ • Quema de pauta         │ • Pacing presupuestal    │ • Crecimiento CAGR    │ • Amortización nCAC│
│ • Fricción en checkout   │ • Rebalanceo de catálogo │ • Curva hacia $30M    │ • Ciclo de recompra│
└──────────────────────────┴──────────────────────────┴───────────────────────┴─────────────────┘
```

1. **Diario / Intradía**: Reacción táctica inmediata en eventos promocionales. Permite ajustar bids y presupuestos en Meta/Google, monitorear caídas de conversión por rotura de tallas o pasarela, y evitar vender a pérdida en ofertas flash.
2. **Mensual**: Control consolidado de P&L, cumplimiento de presupuesto y rebalanceo del mix comercial (Calzado vs Ropa vs Accesorios).
3. **Anual / Multi-Año (Runway FY31)**: Seguimiento del CAGR y de la facturación acumulada móvil (`REVENUE_TRAILING_12M_USD`) requerida para escalar a los **$30M USD anuales**.
4. **Por Cohortes (Aging M1, M2, M3, M6, M12, M24 e Histórico)**: Mide la calidad de los clientes adquiridos en cada evento o mes, asegurando que el **LTV/CAC sea > 3.0x** y que el **CAC Payback sea < 60 días**.

---

## 5. Catálogo Maestro de Métricas y Guía de Gráficas para Frontend

| # | Métrica | Clave Synapse | Dominio | Granularidad | Gráfica Principal (Hero) | Gráfica Secundaria / Alternativa | Widget KPI / Card |
|---|---|---|---|---|---|---|---|
| 1 | **Revenue Total** | `revenue` | Top-Line | Día, Mes | **Line / Area Chart** (Tendencia temporal con Target) | **Bar Chart** (Comparativa YoY) | **Scorecard** con micro-sparkline y $\Delta\%$ MoM |
| 2 | **Órdenes** | `orders` | Top-Line | Día, Mes | **Bar Chart** (Volumen diario/mensual) | **Combo Chart** (Órdenes [Barras] vs AOV [Línea]) | **Scorecard** numérico entero |
| 3 | **Unidades** | `units` | Top-Line | Día, Mes | **Stacked Bar** (Unidades por División) | **Line Chart** (Evolución de volumen de prendas) | **Scorecard** numérico |
| 4 | **Sesiones / Visitas** | `sessions` | Tráfico | Día, Mes | **Area Chart** (Curva de tráfico diario) | **Bar Chart** (Desglose por Canal de Tráfico) | **Scorecard** con $\Delta\%$ vs semana previa |
| 5 | **AOV (Ticket Promedio)** | `aov_total` | Eficiencia | Día, Mes | **Line Chart** (Evolución temporal del ticket) | **Histogram / Box Plot** (Distribución de ticket) | **Scorecard** ($ USD) |
| 6 | **RPV (Revenue Per Visit)**| `rpv_total` | CRO | Día, Mes | **Line Chart con Banda Óptima** (> $1.50 USD) | **Scatter Plot** (RPV vs CVR por canal) | **Gauge / Bullet** con Target |
| 7 | **CVR (Conversion Rate)** | `cvr_total` | CRO | Día, Mes | **Line Chart con Zona de Control** | **Dual-Axis Chart** (Visitas vs CVR %) | **Scorecard** (%) con semáforo |
| 8 | **Add-to-Cart (ATC) Rate**| `atc_rate` | CRO | Día, Mes | **Funnel Bar Horizontal** | **Area Chart** (Intención de compra diaria) | **Progress Bar / Bullet** (%) |
| 9 | **Cart Completion Rate** | `cart_completion`| CRO | Día, Mes | **Gauge Chart** (Zona verde > 25%) | **Line Chart** (Fricción en checkout diaria) | **Scorecard** (%) |
| 10| **Spend Consolidado** | `spend` | Medios | Día, Mes | **Stacked Area / Bar** (Brand 64.4% vs Perf 35.6%) | **Waterfall Chart** (Inversión por Plataforma) | **Scorecard** ($ USD) con Pacing % |
| 11| **Spend Brand (64.4%)** | `brand_spend_total`| Medios | Día, Mes | **Area Chart** (Inversión Upper-Funnel continua) | **Donut Chart** (Share de Brand vs Perf) | **Scorecard** ($ USD) |
| 12| **Spend Perf (35.6%)** | `perf_spend_total` | Medios | Día, Mes | **Bar Chart** (Inversión Lower-Funnel por Canal) | **Waterfall** (Meta vs Google vs Criteo vs Bing) | **Scorecard** ($ USD) |
| 13| **Paid ROAS (Last-Click)**| `roas_paid` | Medios | Día, Mes | **Horizontal Bar Chart** (ROAS por Plataforma) | **Scatter Plot** (ROAS vs Inversión en Ads) | **Scorecard** (Ratio x) |
| 14| **CPA Blended** | `cpa_blended` | Medios | Día, Mes | **Line Chart Invertido** (Lower is better) | **Bar Chart** (CPA por Canal/Campaña) | **Scorecard** ($ USD) con umbral crítico |
| 15| **MER Total (Blended)** | `mer_total` | Growth | Día, Mes, 12M | **Line Chart con Línea de Benchmark** (3.5x - 5.0x) | **Bullet Chart** (Actual vs Target) | **Scorecard** (Ratio x) destacado |
| 16| **GPT (Gross Profit / Tx)** | `gpt_total` | Profitability | Día, Mes | **Line Chart** (Margen neto unitario tras ads) | **Waterfall Chart** ($AOV - \$CPA = \$GPT$) | **Scorecard** ($ USD/orden) |
| 17| **GPOT (Margen Neto Ads)**| `gpot_total`| Profitability | Día, Mes | **Area Chart** (Flujo de caja neto generado) | **Grouped Bar** (Revenue vs Spend vs GPOT) | **Scorecard** ($ USD acumulado) |
| 18| **POAS (Profit on Ads)** | `poas_blended` | Profitability | Día, Mes | **Line Chart** (POAS vs ROAS histórico) | **Gauge Chart** (Zona verde > 2.0x) | **Scorecard** (Ratio x) |
| 19| **CM1 (Margen Comercial)**| `cm1_margin` | Finanzas | Día, Mes | **Stacked Bar** (Revenue vs COGS 45%) | **Area Chart** (Masa de margen bruto) | **Scorecard** ($ USD y % ~55%) |
| 20| **CM2 (Tras Promos/Fees)**| `cm2_margin` | Finanzas | Día, Mes | **Waterfall Chart** (CM1 $\to$ Promos $\to$ Fees $\to$ CM2) | **Line Chart** (Evolución de margen tras descuentos)| **Scorecard** ($ USD) |
| 21| **CM3 (Contribution Net)**| `cm3_contribution`| Finanzas | Día, Mes | **Line Chart con Umbral de Rentabilidad** (>18%)| **Waterfall Integral de P&L Ecom** | **Scorecard** ($ USD y % Neto) |
| 22| **nCAC Registrados** | `ncac_registrados` | Clientes | Mes cohorte | **Line Chart por Cohorte de Registro** | **Bar Chart** (Evolución mensual de costo adquisición)| **Scorecard** ($ USD) |
| 23| **LTV Lifetime** | `ltv_registrados` | Clientes | Histórico | **Cohort Aging Curves** (Curvas de maduración LTV) | **Stacked Area** (Venta 1ra orden vs Recompra) | **Scorecard** ($ USD) |
| 24| **Matriz de Cohortes LTV** | `ltv_cohort_matrix` | Clientes | Multiventana | **Cohort Aging Curves** (Líneas multiseries M1-M24)| **Cohort Heatmap / Triangle Chart** | **Data Grid Matrix** |
| 25| **Ratio LTV / CAC** | `ltv_cac_ratio` | Unit Econ. | Mes cohorte | **Bullet / Gauge Chart** (Semáforo: <1.5 / 1.5-3.0 / >3.0)| **Line Chart** (Evolución de ratio por cohorte) | **Scorecard** (Ratio x con badge) |
| 26| **Promo Dependency (%)** | `promo_dependency` | Merchandising | Día, Mes | **Stacked Area 100%** (Full Price vs On-Sale) | **Line Chart** (Evolución diaria de % de descuento) | **Gauge / Scorecard** (%) |
| 27| **Top SKUs Héroe** | `top_10_productos` | Merchandising | Mes | **Data Table interactiva con Mini-Barras** | **Horizontal Bar Chart** (Top 10 por Revenue) | **Bump Chart** (Cambios de ranking) |
| 28| **Pacing Revenue FY27** | `pacing_revenue_fy27`| Estrategia | Mes | **Bullet Chart** (Actual vs Target Estacional $14M)| **Progress Bar con Semáforo** | **Scorecard** (% Cumplimiento) |
| 29| **Pacing Anual ($30M USD)**| `pacing_annual_30m` | Estrategia | Mes (12M) | **Gauge Chart** (0% a 100% hacia $30M USD) | **Area Chart Trailing 12M** (Curva de escalada) | **Scorecard** ($ T12M y % Meta) |

---

## 6. Fichas Técnicas Detalladas de Métricas y Fórmulas SQL

### Dominio 1: Executive & Top-Line
* **`revenue` (Revenue Total USD):** `TOTAL_REVENUE` = `SUM(INGRESOS_USD)`. Gráfica: Line/Area Chart con Target estacional. Card: Scorecard con micro-sparkline y $\Delta\%$ MoM.
* **`orders` (Órdenes):** `TOTAL_ORDERS` = `SUM(ORDENES_VENDIDAS)`. Gráfica: Bar Chart.
* **`units` (Unidades):** `TOTAL_UNITS` = `SUM(UNIDADES_VENDIDAS)`. Gráfica: Stacked Bar por División.
* **`sessions` (Visitas / Sesiones):** `TOTAL_SESSIONS` = `SUM(VISITAS)`. Gráfica: Area Chart.
* **`aov_total` (Ticket Promedio / AOV):** Fórmula: `SUM(INGRESOS_USD) / NULLIF(SUM(ORDENES_VENDIDAS), 0)`. *Nunca promediar ratios diarios*. Gráfica: Line Chart + Histogram.

### Dominio 2: CRO & Conversión On-Site
* **`rpv_total` (Revenue Per Visit):** Rendimiento por sesión (`RPV = CVR * AOV`). Fórmula: `SUM(INGRESOS_USD) / NULLIF(SUM(VISITAS), 0)`. Gráfica: Line Chart con Banda Óptima (> $1.50 USD).
* **`cvr_total` (Tasa de Conversión %):** Proporción de visitas que compran. Fórmula: `(SUM(ORDENES_VENDIDAS) / NULLIF(SUM(VISITAS), 0)) * 100`. Gráfica: Line Chart con bandas de control + Dual-Axis.
* **`atc_rate` (Add-to-Cart Rate %):** Intención de compra. Fórmula: `(SUM(TOTAL_ATC) / NULLIF(SUM(TOTAL_SESSIONS), 0)) * 100`. Gráfica: Funnel Bar Horizontal.
* **`cart_completion` (Cart Completion Rate %):** Eficiencia de checkout. Fórmula: `(SUM(ORDENES_VENDIDAS) / NULLIF(SUM(TOTAL_ATC), 0)) * 100`. Gráfica: Gauge Chart (> 25%).

### Dominio 3: Growth & Inversión Publicitaria
* **`spend` (Spend Consolidado):** Presupuesto total. Brand (64.4%) + Performance (35.6%). Gráfica: Stacked Area/Bar apilada.
* **`mer_total` (Marketing Efficiency Ratio - MER):** Eficiencia global. Fórmula: `TOTAL_REVENUE / NULLIF(TOTAL_AD_SPEND, 0)`. Gráfica: Line Chart con Benchmark (> 4.5x).
* **`roas_paid` (Paid ROAS Last-Click):** Retorno de pauta directa. Fórmula: `REV_PAID / COST_PAID`. Gráfica: Horizontal Bar por Plataforma.
* **`cpa_blended` (CPA Blended):** Costo por orden global. Fórmula: `TOTAL_AD_SPEND / NULLIF(TOTAL_ORDERS, 0)`. Gráfica: Line Chart invertido.

### Dominio 4: Profitability Engine (Márgenes Reales & POAS)
* **`gpt_total` (Gross Profit per Transaction):** Margen neto unitario tras ads. Fórmula: `AOV - CPA_BLENDED`. Gráfica: Line Chart + Waterfall.
* **`gpot_total` (Gross Profit Over Transactions):** Flujo neto tras ads. Fórmula: `TOTAL_REVENUE - TOTAL_AD_SPEND`. Gráfica: Area Chart de flujo neto.
* **`poas_blended` (Profit on Ad Spend):** Margen real por dólar de pauta. Fórmula: `(TOTAL_REVENUE * 0.55) / NULLIF(TOTAL_AD_SPEND, 0)`. Gráfica: Line Chart POAS vs ROAS + Gauge (> 2.0x).
* **`cm3_contribution` (Contribution Margin Neto Ecom):** Beneficio neto real transferido a UA. Fórmula: `CM2 - Total Ad Spend - (Órdenes * $5.00 Logística)`. Gráfica: Waterfall Integral de P&L.

### Dominio 5: Customer Retention & Unit Economics
* **`ncac_registrados` (nCAC Clientes Registrados):** Costo de adquisición de registrados. Fórmula: `TOTAL_SPEND / NULLIF(NUEVOS_REGISTRADOS, 0)`. Gráfica: Line Chart por Cohorte.
* **`ltv_registrados` (Customer Lifetime Value):** Gasto acumulado por cliente registrado. Gráfica: Cohort Aging Curves (30, 60, 90, 180, 360d).
* **`ltv_cohort_matrix` (Matriz de Cohortes LTV):** Desglose multidimensional `[Mes Cohorte x Ventana M1 a M24]`. Fuente: `GLD_CUSTOMER_LTV_COHORTS_MATRIX`. Gráfica: Curvas de maduración multiseries y Mapa de calor (Heatmap Triangle).
* **`ltv_cac_ratio` (Ratio LTV / nCAC):** Sostenibilidad de adquisición. Fórmula: `LTV_LIFETIME / NULLIF(NCAC_REGISTRADOS, 0)`. Gráfica: Bullet/Gauge con semáforos (> 3.0x).

### Dominio 6: Catálogo & Merchandising
* **`promo_dependency` (Dependencia de Promociones %):** Venta con descuento (eVar23). Fórmula: `(INGRESOS_ONSALE / TOTAL_REVENUE) * 100`. Gráfica: Stacked Area 100% (Full Price vs On-Sale).
* **`top_10_productos` (SKUs Héroe):** Ranking por Revenue y Unidades. Gráfica: Data Table con mini-barras horizontales y Bump Chart.

### Dominio 7: Estrategia Fiscal y Pacing $14M FY27 / $30M FY31
* **`pacing_revenue_fy27` (Pacing Mensual Estacional FY27):** `(TOTAL_REVENUE / TARGET_REVENUE_FY27_USD) * 100`. Gráfica: Bullet Chart (Actual vs Target).
* **`pacing_annual_30m` (Pacing Anual Trailing 12M $30M):** `(SUM(TOTAL_REVENUE) T12M / 30,000,000.0) * 100`. Gráfica: Area Chart Trailing 12M + Gauge hacia $30M.

---

## 7. Mapeo de Pestañas en el Frontend (Synapse UI Mockup)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            SYNAPSE UA MX — DASHBOARD DE ESCALA $30M                         │
├──────────────────────────┬──────────────────────────┬───────────────────────────────────────┤
│ 1. Executive Cockpit     │ 2. Cockpit Diario Promos │ 3. Rentabilidad & POAS                │
│  • Line: Revenue vs Target│ • Line: Daily Revenue/Ads│ • Line: GPT ($AOV - $CPA)             │
│  • Bar: Orders & Units   │  • Score: Daily MER & CVR│  • Waterfall: CM1 -> CM2 -> CM3       │
│  • Gauge: Pacing $30M    │  • Gauge: Promo Dep. %   │  • Line: POAS vs ROAS                 │
├──────────────────────────┼──────────────────────────┼───────────────────────────────────────┤
│ 4. CRO & Funnel On-Site  │ 5. Clientes & Cohortes   │ 6. Catálogo & Merchandising           │
│  • Funnel Bar: Drop-off  │  • Line: Cohort Aging LTV│  • Data Table: Top 10 SKUs con barras │
│  • Line: CVR & RPV diario│  • Bar: nCAC por Cohorte │  • Stacked Area 100%: Promo Dep. %    │
│  • Gauge: Cart Completion│  • Bullet: LTV/CAC Ratio │  • Treemap: Category Mix (División)   │
└──────────────────────────┴──────────────────────────┴───────────────────────────────────────┘
```
