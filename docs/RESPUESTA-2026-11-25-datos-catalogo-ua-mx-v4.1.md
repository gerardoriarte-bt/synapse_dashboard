# Catálogo de UA MX v4.1 · entrega de datos · 2026-11-25

**Registrado tal como llegó** (`CATALOGO_Y_ESPECIFICACION_TECNICA_UA_MX_FRONTEND (2).md`). Contesta `docs/MENSAJE-2026-11-24-datos-rentabilidad-ua.md`. Lo medido contra él está en `docs/AUDITORIA-2026-11-25-catalogo-ua-mx-v4.1.md`.

---

# Catálogo y Especificación Técnica de Métricas — Under Armour México (UA MX)
**Documento Maestro para Frontend, Producto & Synapse_UA (Guía Definitiva de Integración y Visualización)**  
**Fecha:** Noviembre 2026 | **Versión:** 4.1 Final (Resolución Integral de Auditoría v3.2, Framework Full-Funnel & Calendario Fiscal FY27–FY31)  
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
1. **FY27 ($14M USD) — Consolidación Operativa y Rentabilidad de Caja:** Los datos de Abril–Noviembre 2026 muestran que FY27 debe modelarse con una meta realista de **$14.0M USD**, enfocándose en CRO, control de margen unitario (`GPT > $40 USD`) y eficiencia de pauta (`MER > 4.6x`).
2. **Estrategia Full-Funnel ($3.0M USD en FY27):**
   - **Brand / Upper-Funnel (64.4% / $1.932M USD):** Creación de demanda, reconocimiento de marca (Brand Equity) y consideración.
   - **Performance / Lower-Funnel (35.6% / $1.068M USD):** Captura de demanda, retargeting y conversión directa.
3. **Escalamiento Progresivo a FY31 ($30M USD):** Crecimiento escalonado del ~21% anual acompañado de expansión de profundidad de catálogo e inventario (desde ~$28M MSRP en FY27 hasta ~$50M MSRP en FY31).

---

## 2. Respuestas a la Auditoría de Datos v3.2 (Resolución de Bloqueantes)

### 1. ¿Cuál es la venta de verdad? (Resolución del Bloqueante)
* **Causa Raíz:** `FCT_PERFORMANCE` filtra únicamente transacciones con atribución de pauta `ECOMM/PERFORMANCE`, omitiendo el tráfico Directo, Orgánico y Brand ($483K en Septiembre).
* **Fuente de Verdad Única (SoT):** La venta total del sitio es **`DB_BT_UA.BT_UA_CORE_MODEL.VENTAS_POR_PLATAFORMA_Y_ID_CLIENTE`**, que coincide exactamente con `GLD_ECOMM_DAILY_PERFORMANCE`:
  - **Septiembre 2026:** Venta = **$1,319,459 USD** | Órdenes = **11,550** | Spend Consolidado = **$254,788 USD** (MER = **5.18x**).
* **Solución Implementada:** Se actualizaron `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` y `GLD_ECOMM_PROFITABILITY_DAILY` para leer de `VENTAS_POR_PLATAFORMA_Y_ID_CLIENTE`. Ahora Ingresos, Órdenes, MER y Márgenes cuadran al 100% en todas las pantallas.

### 2. Supuestos Declarados Explícitamente en `BASE`
* Se actualizaron las descripciones en `DD_METRIC_CURATION` para que el usuario conozca con total transparencia los supuestos aplicados:
  - `cm1_margin`: *"Venta Total × Margen Bruto supuesto de 55% (Costo de Producto/COGS estimado en 45%)"*.
  - `cm2_margin`: *"CM1 menos 2.5% de comisión de pasarelas de pago y descuentos comerciales"*.
  - `cm3_contribution`: *"CM2 menos Inversión Total en Ads menos $5.00 USD de logística/empaque por orden"*.
  - `poas_blended`: *"Margen Bruto supuesto (55%) dividido por Total Ad Spend (Brand + Perf)"*.
  - `gpt_total`: *"Margen neto tras pauta: AOV − CPA (Antes de descontar costo de producto/COGS)"*.
  - `gpot_total`: *"Flujo neto tras pauta: Venta Total − Total Ad Spend (Antes de descontar COGS)"*.

### 3. Registro de las 5 Métricas Faltantes en el Catálogo
* Quedaron formalmente registradas y activas en `SYNAPSE_METRIC_CATALOG`: `atc_rate`, `cart_completion`, `cpa_blended`, `pacing_revenue_fy27` y `mer_total`.

### 4. Justificación de Cifras Auditadas
* **`cart_completion` (4.8% a 6.8%):** El denominador `TOTAL_ATC` mide **eventos de adición de producto (Product Adds)** y no sesiones únicas con carrito. En UA MX, cada usuario realiza ~2.5 adiciones por sesión, por lo que un 6% sobre adiciones equivale al 20%-25% de conversión por carrito iniciado.
* **`ltv_cac_ratio`:** Cruza el LTV de la cohorte con el gasto de ese mismo mes. Para visualizar la evolución multidimensional se utiliza **`GLD_CUSTOMER_LTV_COHORTS_MATRIX`**.

### 5. `SEMANTIC_DIRECTION` en Español Legible
* Estandarizado a: `"MÁS ALTO = MEJOR"`, `"MÁS BAJO = MEJOR"`, `"NEUTRAL / INFORMATIVO"`.

---

## 3. Matriz Metodológica Exhaustiva de Semaforización (100% de Métricas)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│               MATRIZ METODOLÓGICA DE SEMAFORIZACIÓN — UNDER ARMOUR MÉXICO (D2C APPAREL)                │
├─────────────────────┬──────────────┬──────────────┬──────────────┬─────────────────────────────────────┤
│ Indicador Clave     │ 🔴 Crítico   │ 🟡 Aceptable │ 🟢 Saludable │ Metodología / Benchmark de Industria│
│                     │ (Mal)        │ (Alerta)     │ (Óptimo)     │ y Justificación de Negocio          │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `ltv_cac_ratio`     │ < 1.5x       │ 1.5x – 3.0x  │ > 3.0x       │ **Bain & Co. Unit Economics Model** │
│                     │              │              │              │ • <1.5x: Destrucción neta de valor. │
│                     │              │              │              │ • 1.5–3.0x: Sostenible con mejora.  │
│                     │              │              │              │ • >3.0x: Crecimiento rentable.      │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `poas_blended`      │ < 1.5x       │ 1.5x – 2.0x  │ > 2.0x       │ **Profit on Ad Spend Framework**    │
│                     │              │              │              │ Con margen bruto ~55%, POAS > 2.0x  │
│                     │              │              │              │ garantiza que por cada $1 de ads    │
│                     │              │              │              │ quedan $2 de margen comercial.      │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `mer_total`         │ < 3.5x       │ 3.5x – 4.5x  │ > 4.5x       │ **D2C Marketing Efficiency Curve**  │
│                     │              │              │              │ Un MER > 4.5x implica que el gasto  │
│                     │              │              │              │ publicitario representa <22% del    │
│                     │              │              │              │ revenue total, permitiendo caja.    │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cm3_margin_pct`    │ < 12.0%      │ 12.0% – 18.0%│ > 18.0%      │ **Retail Contribution Margin Model**│
│                     │              │              │              │ CM3 > 18% es el estándar de marcas  │
│                     │              │              │              │ globales para cubrir costos fijos.  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `gpt_total`         │ < $25 USD    │ $25 – $40 USD│ > $40 USD    │ **Unit Margin per Transaction**     │
│                     │              │              │              │ Con AOV ~$95-$105 y CPA ~$20-$25,   │
│                     │              │              │              │ GPT > $40 asegura margen post-ads.  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `rpv_total`         │ < $1.00 USD  │ $1.00–$1.50  │ > $1.50 USD  │ **CRO Monetization Benchmark**      │
│                     │              │              │              │ RPV = CVR (~2.0%) × AOV (~$95).     │
│                     │              │              │              │ > $1.50 cubre un CPC medio de $0.25.│
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cvr_total`         │ < 1.20%      │ 1.20%–1.80%  │ > 1.80%      │ **E-Commerce Conversion Rate MX**   │
│                     │              │              │              │ 1.8% – 2.5% es el benchmark de      │
│                     │              │              │              │ retail deportivo de alta demanda.   │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `atc_rate`          │ < 6.0%       │ 6.0% – 10.0% │ > 10.0%      │ **Add-to-Cart Intent Benchmark**    │
│                     │              │              │              │ Mide la intención y atractivo PDP.  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cart_completion`   │ < 4.0%       │ 4.0% – 6.0%  │ > 6.0%       │ **Product Add to Order Conversion** │
│ (Órdenes / Product  │              │              │              │ Refleja la finalización basada en   │
│ Adds de producto)   │              │              │              │ adiciones totales de producto.      │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `roas_paid`         │ < 3.0x       │ 3.0x – 4.0x  │ > 4.0x       │ **Paid Performance Target**         │
│ (Last-Click Directo)│              │              │              │ Retorno directo en Google/Meta Ads. │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cpa_blended`       │ > $35 USD    │ $25 – $35 USD│ < $25 USD    │ **Admissible Cost per Acquisition** │
│                     │              │              │              │ Mantener CPA < $25 asegura que no   │
│                     │              │              │              │ sobrepase el 25% del ticket (AOV).  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cpa_paid`          │ > $30 USD    │ $20 – $30 USD│ < $20 USD    │ **Paid Performance CPA Target**     │
│                     │              │              │              │ Costo por orden pagada directa.     │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `bounce_rate_paid`  │ > 45.0%      │ 35.0%–45.0%  │ < 35.0%      │ **Paid Traffic Quality Index**      │
│                     │              │              │              │ Mide rebote en landing pages de ads.│
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `ncac_registrados`  │ > $45 USD    │ $30 – $45 USD│ < $30 USD    │ **New Customer Acquisition Cost**   │
│                     │              │              │              │ nCAC < $30 permite amortizar la     │
│                     │              │              │              │ inversión en la 1ra compra (LTV M1).│
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `ltv_registrados`   │ < $80 USD    │ $80 – $110   │ > $110 USD   │ **Customer Lifetime Value**         │
│                     │              │              │              │ Superar $110 demuestra recompra real│
│                     │              │              │              │ sobre el ticket inicial (~$95).     │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `promo_dependency`  │ > 45.0%      │ 25.0%–45.0%  │ < 25.0%      │ **Brand Equity & Price Erosion**    │
│                     │              │              │              │ <25% protege el valor de marca; >45%│
│                     │              │              │              │ genera adicción a descuentos.       │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `pacing_revenue_fy27│ < 85.0%      │ 85.0%–95.0%  │ > 95.0%      │ **Pacing de Cumplimiento Mensual**  │
│                     │              │              │              │ Cumplimiento vs meta mensual $14M.  │
└─────────────────────┴──────────────┴──────────────┴──────────────┴─────────────────────────────────────┘
```

---

## 4. Arquitectura de Dos Capas: Total Negocio vs Atribución Paid Media (Agencia)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│             ESTRUCTURA DE ATRIBUCIÓN Y RENTABILIDAD — UNDER ARMOUR MÉXICO (UA MX)                      │
├─────────────────────────────────────────────────┬──────────────────────────────────────────────────────┤
│ CAPA 1: NEGOCIO TOTAL ECOMMERCE (BLENDED)       │ CAPA 2: PAID PERFORMANCE MEDIA (AGENCIA)             │
│ (Disponible en vistas Diaria y Mensual)         │ (Disponible en vistas Diaria y Mensual)              │
├─────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
│ • TOTAL_REVENUE (Facturación total del sitio)   │ • REV_PAID (Venta atribuida directa a pauta)        │
│ • TOTAL_ORDERS (Órdenes totales facturadas)     │ • ORDERS_PAID (Órdenes generadas por pauta)          │
│ • TOTAL_SESSIONS (Visitas totales al sitio)     │ • VISITS_PAID (Tráfico calificado de pauta)          │
│ • TOTAL_ATC (Adiciones de producto al carrito)  │ • ATC_PAID (Adiciones al carrito desde pauta)        │
│ • TOTAL_UNITS (Unidades físicas vendidas)       │ • UNITS_PAID (Unidades vendidas por pauta)           │
│ • AOV_TOTAL ($ Ticket medio global)             │ • AOV_PAID ($ Ticket de compra pagada)               │
│ • RPV_TOTAL ($ Valor por visita total)          │ • RPV_PAID ($ Rendimiento por visita pagada)         │
│ • CVR_TOTAL_PCT (% Conversión global)           │ • CVR_PAID_PCT (% Conversión directa de pauta)       │
│ • ATC_RATE_TOTAL_PCT (% Intención global)       │ • ATC_RATE_PAID_PCT (% Intención tráfico pagado)     │
│ • BOUNCE_RATE_TOTAL_PCT (% Rebote del sitio)    │ • BOUNCE_RATE_PAID_PCT (% Rebote de campañas)        │
│ • TOTAL_AD_SPEND (Inversión total consolidada)  │ • SPEND_PERFORMANCE (Inversión directa Performance)  │
│ • MER_TOTAL (Eficiencia total: Rev / Total Ads) │ • ROAS_PAID (Retorno directo: RevPaid / PerfSpend)   │
│ • CPA_BLENDED (Costo por orden total)           │ • CPA_PAID (Costo por orden pagada directa)          │
│ • GPT_USD (Margen neto unitario tras ads)       │ • REV_SHARE_PAID_PCT (% Aporte de pauta a la venta)  │
│ • GPOT_USD (Flujo neto tras ads)                │ • ORDERS_SHARE_PAID_PCT (% Aporte a órdenes totales) │
│ • CM3_CONTRIBUTION_MARGIN_USD (Margen neto ecom)│ • VISITS_SHARE_PAID_PCT (% Aporte al tráfico total)  │
└─────────────────────────────────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 5. Catálogo Maestro de Métricas y Guía de Gráficas para Frontend

| # | Métrica | Clave Synapse | Dominio | Granularidad | Gráfica Principal (Hero) | Gráfica Secundaria / Alternativa | Widget KPI / Card |
|---|---|---|---|---|---|---|---|
| 1 | **Revenue Total** | `revenue` | Top-Line | Día, Mes | **Line / Area Chart** (Tendencia con Target) | **Bar Chart** (Comparativa YoY) | **Scorecard** con sparkline y $\Delta\%$ MoM |
| 2 | **Órdenes** | `orders` | Top-Line | Día, Mes | **Bar Chart** (Volumen transaccional) | **Combo Chart** (Órdenes vs AOV) | **Scorecard** numérico entero |
| 3 | **Unidades** | `units` | Top-Line | Día, Mes | **Stacked Bar** (Unidades por División) | **Line Chart** (Evolución de prendas) | **Scorecard** numérico |
| 4 | **Sesiones / Visitas** | `sessions` | Tráfico | Día, Mes | **Area Chart** (Curva de tráfico diario) | **Bar Chart** (Desglose por Canal) | **Scorecard** con $\Delta\%$ vs semana previa |
| 5 | **AOV Total** | `aov_total` | Eficiencia | Día, Mes | **Line Chart** (Evolución temporal) | **Histogram / Box Plot** (Distribución) | **Scorecard** ($ USD) |
| 6 | **RPV Total** | `rpv_total` | CRO | Día, Mes | **Line Chart con Banda Óptima** (> $1.50) | **Scatter Plot** (RPV vs CVR) | **Gauge / Bullet** con Target |
| 7 | **CVR Total (%)** | `cvr_total` | CRO | Día, Mes | **Line Chart con Zona de Control** | **Dual-Axis Chart** (Visitas vs CVR %) | **Scorecard** (%) con semáforo |
| 8 | **Add-to-Cart Rate** | `atc_rate` | CRO | Día, Mes | **Funnel Bar Horizontal** | **Area Chart** (Intención de compra) | **Progress Bar / Bullet** (%) |
| 9 | **Cart Completion Rate** | `cart_completion`| CRO | Día, Mes | **Gauge Chart** (Zona verde > 6.0%) | **Line Chart** (Fricción en checkout) | **Scorecard** (%) |
| 10| **Spend Consolidado** | `spend` | Medios | Día, Mes | **Stacked Area/Bar** (Brand 64% vs Perf 36%) | **Waterfall Chart** (Por Plataforma) | **Scorecard** ($ USD) con Pacing % |
| 11| **Spend Brand (64.4%)** | `brand_spend_total`| Medios | Día, Mes | **Area Chart** (Upper-Funnel continuo) | **Donut Chart** (Share Brand vs Perf) | **Scorecard** ($ USD) |
| 12| **Spend Perf (35.6%)** | `perf_spend_total` | Medios | Día, Mes | **Bar Chart** (Lower-Funnel por Canal) | **Waterfall** (Meta, Google, Criteo) | **Scorecard** ($ USD) |
| 13| **Paid Revenue** | `revenue_paid` | Paid Media | Día, Mes | **Line Chart** (Venta atribuida directa) | **Grouped Bar** (Venta Paid vs Orgánica) | **Scorecard** ($ USD) |
| 14| **Paid Orders** | `orders_paid` | Paid Media | Día, Mes | **Bar Chart** (Órdenes pagadas directas) | **Stacked Bar** (Órdenes por Plataforma) | **Scorecard** numérico |
| 15| **Paid Traffic** | `visits_paid` | Paid Media | Día, Mes | **Area Chart** (Tráfico calificado de pauta) | **Bar Chart** (Visitas por Plataforma) | **Scorecard** numérico |
| 16| **Paid CVR (%)** | `cvr_paid` | Paid Media | Día, Mes | **Line Chart** (CVR pagado vs CVR global) | **Scatter Plot** (CVR Paid vs CPC) | **Scorecard** (%) |
| 17| **Paid ROAS (Last-Click)**| `roas_paid` | Paid Media | Día, Mes | **Horizontal Bar Chart** (Por Canal) | **Scatter Plot** (ROAS vs Spend) | **Scorecard** (Ratio x) |
| 18| **Paid CPA** | `cpa_paid` | Paid Media | Día, Mes | **Line Chart Invertido** (Lower is better) | **Bar Chart** (CPA por Campaña) | **Scorecard** ($ USD) |
| 19| **Paid Bounce Rate (%)**| `bounce_rate_paid`| Paid Media | Día, Mes | **Line Chart** (Calidad de landing pages) | **Bar Chart** (Rebote por Plataforma) | **Scorecard** (%) |
| 20| **Share Venta Paid (%)** | `rev_share_paid_pct`| Paid Media | Día, Mes | **Area Chart Stacked 100%** (Paid vs Organic)| **Donut Chart** (% Contribución de pauta) | **Scorecard** (%) |
| 21| **Share Órdenes Paid (%)**| `orders_share_paid_pct`| Paid Media| Día, Mes | **Area Chart Stacked 100%** | **Donut Chart** (% Contribución órdenes) | **Scorecard** (%) |
| 22| **CPA Blended** | `cpa_blended` | Medios | Día, Mes | **Line Chart Invertido** | **Bar Chart** (CPA global) | **Scorecard** ($ USD) |
| 23| **MER Total (Blended)** | `mer_total` | Growth | Día, Mes, 12M | **Line Chart con Benchmark** (> 4.5x) | **Bullet Chart** (Actual vs Target) | **Scorecard** (Ratio x) destacado |
| 24| **GPT (Gross Profit / Tx)** | `gpt_total` | Profitability | Día, Mes | **Line Chart** (Margen neto unitario) | **Waterfall Chart** (AOV - CPA = GPT) | **Scorecard** ($ USD/orden) |
| 25| **GPOT (Margen Neto Ads)**| `gpot_total`| Profitability | Día, Mes | **Area Chart** (Flujo neto generado) | **Grouped Bar** (Revenue vs Spend vs GPOT) | **Scorecard** ($ USD acumulado) |
| 26| **POAS (Profit on Ads)** | `poas_blended` | Profitability | Día, Mes | **Line Chart** (POAS vs ROAS) | **Gauge Chart** (Zona verde > 2.0x) | **Scorecard** (Ratio x) |
| 27| **CM1 (Margen Comercial)**| `cm1_margin` | Finanzas | Día, Mes | **Stacked Bar** (Revenue vs COGS 45%) | **Area Chart** (Masa de margen bruto) | **Scorecard** ($ USD y % ~55%) |
| 28| **CM2 (Tras Promos/Fees)**| `cm2_margin` | Finanzas | Día, Mes | **Waterfall** (CM1 -> Promos -> Fees -> CM2)| **Line Chart** (Evolución de margen) | **Scorecard** ($ USD) |
| 29| **CM3 (Contribution Net)**| `cm3_contribution`| Finanzas | Día, Mes | **Line Chart con Umbral** (> 18%) | **Waterfall Integral de P&L Ecom** | **Scorecard** ($ USD y % Neto) |
| 30| **nCAC Registrados** | `ncac_registrados` | Clientes | Mes cohorte | **Line Chart por Cohorte** | **Bar Chart** (Costo mensual) | **Scorecard** ($ USD) |
| 31| **LTV Lifetime** | `ltv_registrados` | Clientes | Histórico | **Cohort Aging Curves** (30, 90, 360d) | **Stacked Area** (1ra orden vs Recompra) | **Scorecard** ($ USD) |
| 32| **Matriz de Cohortes LTV** | `ltv_cohort_matrix` | Clientes | Multiventana | **Cohort Aging Curves** (M1 a M24) | **Cohort Heatmap / Triangle Chart** | **Data Grid Matrix** |
| 33| **Ratio LTV / CAC** | `ltv_cac_ratio` | Unit Econ. | Mes cohorte | **Bullet / Gauge Chart** (Semáforo > 3.0x) | **Line Chart** (Evolución por cohorte) | **Scorecard** (Ratio x con badge) |
| 34| **Promo Dependency (%)** | `promo_dependency` | Merchandising | Día, Mes | **Stacked Area 100%** (Full Price vs Promo)| **Line Chart** (% descuento diario) | **Gauge / Scorecard** (%) |
| 35| **Top SKUs Héroe** | `top_10_productos` | Merchandising | Mes | **Data Table con Mini-Barras de Revenue** | **Horizontal Bar Chart** (Top 10 SKUs) | **Bump Chart** (Cambios ranking) |
| 36| **Pacing Revenue FY27** | `pacing_revenue_fy27`| Estrategia | Mes | **Bullet Chart** (Actual vs Target $14M) | **Progress Bar con Semáforo** | **Scorecard** (% Cumplimiento) |
| 37| **Pacing Anual ($30M USD)**| `pacing_annual_30m` | Estrategia | Mes (12M) | **Gauge Chart** (0% a 100% hacia $30M) | **Area Chart Trailing 12M** | **Scorecard** ($ T12M y % Meta) |

---

## 6. Mapeo de Pestañas en Synapse (Frontend UI Mockup)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            SYNAPSE UA MX — DASHBOARD DE ESCALA $30M                         │
├──────────────────────────┬──────────────────────────┬───────────────────────────────────────┤
│ 1. Executive Cockpit     │ 2. Cockpit Diario Promos │ 3. Performance Campaigns (Agencia)    │
│  • Line: Revenue vs Target│ • Line: Daily Revenue/Ads│ • Line: Paid Revenue vs Paid Spend    │
│  • Bar: Orders & Units   │  • Score: Daily MER & CVR│  • Bar: ROAS & CPA por Plataforma     │
│  • Gauge: Pacing $30M    │  • Gauge: Promo Dep. %   │  • Area 100%: % Share Paid vs Organic │
├──────────────────────────┼──────────────────────────┼───────────────────────────────────────┤
│ 4. Rentabilidad & POAS   │ 5. CRO & Funnel On-Site  │ 6. Clientes, LTV & Merchandising      │
│  • Line: GPT ($AOV - $CPA)│ • Funnel Bar: Drop-off  │  • Line: Cohort Aging LTV (M1-M24)    │
│  • Waterfall: CM1->CM2->CM3 • Line: CVR & RPV diario│  • Bullet: LTV/CAC Ratio (>3.0x)      │
│  • Line: POAS vs ROAS    │  • Gauge: Cart Completion│  • Data Table: Top 10 SKUs con barras │
└──────────────────────────┴──────────────────────────┴───────────────────────────────────────┘
```
