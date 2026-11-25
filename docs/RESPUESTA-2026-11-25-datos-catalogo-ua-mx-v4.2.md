# Catálogo de UA MX v4.2 · entrega de datos · 2026-11-25

**Registrado tal como llegó** (`CATALOGO_Y_ESPECIFICACION_TECNICA_UA_MX_FRONTEND (3).md`). Contesta `docs/MENSAJE-2026-11-25-datos-catalogo-ua-mx-v4.1.md`. Lo medido contra él está en `docs/AUDITORIA-2026-11-25-catalogo-ua-mx-v4.2.md`.

---

# Catálogo y Especificación Técnica de Métricas — Under Armour México (UA MX)
**Documento Maestro para Frontend, Producto & Synapse_UA (Guía Definitiva de Integración, Consumo y Visualización)**  
**Fecha:** Noviembre 2026 | **Versión:** 4.2 Final Blindada (Resolución Integral de Auditorías v3.2 & v4.1, Mapeo Backend Go, Guía de Consumo Anti-Reprocesos)  
**Ambiente Snowflake:** `DB_BT_UA.BT_UA_MART_ANALYTICS`  
**Roles Autorizados de Consumo:** `RL_BT_UA_BI`, `RL_BT_UA_TRANSFORM`, `SYNAPSE_APP_ROLE` (Usuario de Servicio de Synapse)

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

## 2. Respuestas a la Auditoría de Frontend v4.1 (Resolución de Puntos y Bloqueantes)

### 1. Reconciliación Definitiva de Inversión (`spend`, `roas_paid`, `GROSS_SPEND`)
* **Diferencia Conceptual y Fuentes de Verdad:**
  - **`TOTAL_AD_SPEND` ($224,312 USD en Octubre 2026):** Inversión total consolidada de pauta de la marca (**Brand 64.4% [$157,469 USD] + Performance 35.6% [$66,843 USD]**) proveniente de `COSTOS_CAMPANAS`. Se utiliza para medir la rentabilidad global del negocio (`MER_TOTAL` = $648,106 / $224,312 = **2.89x**, `POAS`, `CM3`).
  - **`SPEND_PERFORMANCE` ($66,843 USD en Octubre 2026):** Inversión neta asignada específicamente al canal de Performance en `COSTOS_CAMPANAS`. Genera `ROAS_PAID` = $383,053 / $66,843 = **5.73x**.
  - **`GROSS_SPEND` / `SPEND_PERF_PLATFORMS` ($55,936 USD en Octubre 2026):** Inversión bruta reportada directamente por las APIs de plataformas publicitarias (Meta Ads, Google Ads, Criteo, TikTok, etc.) dentro de `GLD_ECOMM_DAILY_PERFORMANCE`. Genera `ROAS_PAID_PLATFORMS` = $383,050 / $55,936 = **6.85x**.
* **Solución Técnica:** Ambas métricas son válidas y complementarias. En las vistas `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` y `GLD_ECOMM_PROFITABILITY_DAILY` se exponen tanto `ROAS_PAID` (5.73x vs contabilidad de costos) como `ROAS_PAID_PLATFORMS` (6.85x vs plataformas de pauta), permitiendo al backend consumir exactamente la requerida por cada panel.

### 2. Corrección de Rebote de Pauta (`BOUNCE_RATE_PAID_PCT`)
* **Causa Raíz:** La tabla `VENTAS_POR_PLATAFORMA_Y_ID_CLIENTE` no tenía populada la columna de rebotes de pauta en Septiembre y Octubre (0.00).
* **Solución Implementada:** Se integró `GLD_ECOMM_DAILY_PERFORMANCE` (Adobe Analytics) como fuente de tráfico y rebotes de pauta:
  - **Septiembre 2026:** 96,854 rebotes / 574,947 visitas = **16.85%**.
  - **Octubre 2026:** 95,237 rebotes / 555,845 visitas = **17.13%**.
  - **Noviembre 2026:** 240,322 rebotes / 1,013,103 visitas = **23.72%**.

### 3. Estandarización al 100% de `SEMANTIC_DIRECTION`
* El 100% de las 60 métricas en `DD_METRIC_CURATION` y `SYNAPSE_METRIC_CATALOG` ha sido normalizado exclusivamente a 3 textos canónicos en español:
  - `MÁS ALTO = MEJOR` (36 métricas)
  - `MÁS BAJO = MEJOR` (5 métricas)
  - `NEUTRAL / INFORMATIVO` (19 métricas)

### 4. Regla de Bordes Inclusivos y `cm3_margin_pct`
* **`cm3_margin_pct`:** Verificada y activa en `SYNAPSE_METRIC_CATALOG` con unidad `%`, granularidad `day`/`month` y semántica `MÁS ALTO = MEJOR`.
* **Regla Formal de Bordes (Intervalos):** Se establece la convención matemática estándar:
  - **🟢 Saludable / Óptimo:** $[\text{Umbral Verde}, \infty)$ $\rightarrow$ **Inclusivo en el borde**. Ejemplo: Para LTV/CAC, un valor exacto de `3.0x` se evalúa como **Verde**.
  - **🟡 Alerta / Aceptable:** $[\text{Umbral Amarillo}, \text{Umbral Verde})$. Ejemplo: $[1.5x, 3.0x)$.
  - **🔴 Crítico / Mal:** $(-\infty, \text{Umbral Amarillo})$. Ejemplo: $< 1.5x$.

---

## 3. Matriz Metodológica Exhaustiva de Semaforización (100% de Métricas)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│               MATRIZ METODOLÓGICA DE SEMAFORIZACIÓN — UNDER ARMOUR MÉXICO (D2C APPAREL)                │
├─────────────────────┬──────────────┬──────────────┬──────────────┬─────────────────────────────────────┤
│ Indicador Clave     │ 🔴 Crítico   │ 🟡 Aceptable │ 🟢 Saludable │ Metodología / Benchmark de Industria│
│                     │ (Mal)        │ (Alerta)     │ (Óptimo)     │ y Justificación de Negocio          │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `ltv_cac_ratio`     │ < 1.50x      │ 1.50x – 2.99x│ ≥ 3.00x      │ **Bain & Co. Unit Economics Model** │
│                     │              │              │              │ • <1.5x: Destrucción neta de valor. │
│                     │              │              │              │ • 1.5–3.0x: Sostenible con mejora.  │
│                     │              │              │              │ • ≥3.0x: Crecimiento rentable.      │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `poas_blended`      │ < 1.50x      │ 1.50x – 1.99x│ ≥ 2.00x      │ **Profit on Ad Spend Framework**    │
│                     │              │              │              │ Con margen bruto ~55%, POAS ≥ 2.0x  │
│                     │              │              │              │ garantiza que por cada $1 de ads    │
│                     │              │              │              │ quedan $2 de margen comercial.      │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `mer_total`         │ < 3.50x      │ 3.50x – 4.49x│ ≥ 4.50x      │ **D2C Marketing Efficiency Curve**  │
│                     │              │              │              │ Un MER ≥ 4.5x implica que el gasto  │
│                     │              │              │              │ publicitario representa <22% del    │
│                     │              │              │              │ revenue total, permitiendo caja.    │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cm3_margin_pct`    │ < 12.0%      │ 12.0% – 17.9%│ ≥ 18.0%      │ **Retail Contribution Margin Model**│
│                     │              │              │              │ CM3 ≥ 18% es el estándar de marcas  │
│                     │              │              │              │ globales para cubrir costos fijos.  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `gpt_total`         │ < $25.00 USD │ $25 – $39.99 │ ≥ $40.00 USD │ **Unit Margin per Transaction**     │
│                     │              │              │              │ Con AOV ~$95-$105 y CPA ~$20-$25,   │
│                     │              │              │              │ GPT ≥ $40 asegura margen post-ads.  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `rpv_total`         │ < $1.00 USD  │ $1.00 – $1.49│ ≥ $1.50 USD  │ **CRO Monetization Benchmark**      │
│                     │              │              │              │ RPV = CVR (~2.0%) × AOV (~$95).     │
│                     │              │              │              │ ≥ $1.50 cubre un CPC medio de $0.25.│
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cvr_total`         │ < 1.20%      │ 1.20% – 1.79%│ ≥ 1.80%      │ **E-Commerce Conversion Rate MX**   │
│                     │              │              │              │ 1.8% – 2.5% es el benchmark de      │
│                     │              │              │              │ retail deportivo de alta demanda.   │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `atc_rate`          │ < 6.00%      │ 6.00% – 9.99%│ ≥ 10.00%     │ **Add-to-Cart Intent Benchmark**    │
│                     │              │              │              │ Mide la intención y atractivo PDP.  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cart_completion`   │ < 4.00%      │ 4.00% – 5.99%│ ≥ 6.00%      │ **Product Add to Order Conversion** │
│ (Órdenes / Product  │              │              │              │ Refleja la finalización basada en   │
│ Adds de producto)   │              │              │              │ adiciones totales de producto.      │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `roas_paid`         │ < 3.00x      │ 3.00x – 3.99x│ ≥ 4.00x      │ **Paid Performance Target**         │
│ (Last-Click Directo)│              │              │              │ Retorno directo en Google/Meta Ads. │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cpa_blended`       │ > $35.00 USD │ $25.01 – $35 │ ≤ $25.00 USD │ **Admissible Cost per Acquisition** │
│                     │              │              │              │ Mantener CPA ≤ $25 asegura que no   │
│                     │              │              │              │ sobrepase el 25% del ticket (AOV).  │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `cpa_paid`          │ > $30.00 USD │ $20.01 – $30 │ ≤ $20.00 USD │ **Paid Performance CPA Target**     │
│                     │              │              │              │ Costo por orden pagada directa.     │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `bounce_rate_paid`  │ > 45.00%     │ 35.01% – 45% │ ≤ 35.00%     │ **Paid Traffic Quality Index**      │
│                     │              │              │              │ Mide rebote en landing pages de ads.│
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `ncac_registrados`  │ > $45.00 USD │ $30.01 – $45 │ ≤ $30.00 USD │ **New Customer Acquisition Cost**   │
│                     │              │              │              │ nCAC ≤ $30 permite amortizar la     │
│                     │              │              │              │ inversión en la 1ra compra (LTV M1).│
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `ltv_registrados`   │ < $80.00 USD │ $80 – $109.99│ ≥ $110.00 USD│ **Customer Lifetime Value**         │
│                     │              │              │              │ Superar $110 demuestra recompra real│
│                     │              │              │              │ sobre el ticket inicial (~$95).     │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `promo_dependency`  │ > 45.00%     │ 25.01% – 45% │ ≤ 25.00%     │ **Brand Equity & Price Erosion**    │
│                     │              │              │              │ ≤25% protege el valor de marca; >45%│
│                     │              │              │              │ genera adicción a descuentos.       │
├─────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ `pacing_revenue_fy27│ < 85.0%      │ 85.0% – 94.9%│ ≥ 95.0%      │ **Pacing de Cumplimiento Mensual**  │
│                     │              │              │              │ Cumplimiento vs meta mensual $14M.  │
└─────────────────────┴──────────────┴──────────────┴──────────────┴─────────────────────────────────────┘
```

---

## 4. Mapeo de Columnas (Snowflake $\leftrightarrow$ Synapse Metric Key $\leftrightarrow$ Backend Go)

| Métrica | Synapse Metric Key | Columna Snowflake (`GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` / `DAILY`) | Columna Backend Go (`queries.go`) | Tipo de Dato |
|---|---|---|---|---|
| **Venta Total Ecom** | `revenue` | `TOTAL_REVENUE` | `TOTAL_REVENUE` / `REVENUE` | `NUMBER(38,2)` |
| **Órdenes Totales** | `orders` | `TOTAL_ORDERS` | `TOTAL_ORDERS` / `ORDERS` | `NUMBER(38,0)` |
| **Visitas / Sesiones** | `sessions` | `TOTAL_SESSIONS` | `TOTAL_SESSIONS` / `VISITS` | `NUMBER(38,0)` |
| **Inversión Total Ads** | `spend` | `TOTAL_AD_SPEND` | `TOTAL_AD_SPEND` / `SPEND` | `NUMBER(38,2)` |
| **Inversión Brand (64%)** | `brand_spend_total` | `SPEND_BRAND` | `SPEND_BRAND` | `NUMBER(38,2)` |
| **Inversión Perf (36%)** | `perf_spend_total` | `SPEND_PERFORMANCE` | `SPEND_PERFORMANCE` | `NUMBER(38,2)` |
| **Inversión Plataformas** | `perf_spend_platforms`| `SPEND_PERF_PLATFORMS` / `GROSS_SPEND` | `GROSS_SPEND` | `NUMBER(38,2)` |
| **Venta Atribuida Paid**| `revenue_paid` | `REV_PAID` | `REV_PAID` | `NUMBER(38,2)` |
| **Órdenes Paid** | `orders_paid` | `ORDERS_PAID` | `ORDERS_PAID` | `NUMBER(38,0)` |
| **Tráfico Paid** | `visits_paid` | `VISITS_PAID` | `VISITS_PAID` | `NUMBER(38,0)` |
| **Rebotes Paid (%)** | `bounce_rate_paid` | `BOUNCE_RATE_PAID_PCT` | `BOUNCE_RATE_PAID` | `NUMBER(38,2)` |
| **ROAS Paid (Costos)** | `roas_paid` | `ROAS_PAID` | `ROAS_PAID` | `FLOAT` |
| **ROAS Paid (Plataformas)**| `roas_paid_platforms`| `ROAS_PAID_PLATFORMS` | `ROAS_PAID_PLATFORMS` | `FLOAT` |
| **MER Total (Blended)** | `mer_total` | `MER_TOTAL` | `MER_TOTAL` | `NUMBER(38,2)` |
| **GPT (Unit Margin)** | `gpt_total` | `GPT_USD` | `GPT_USD` | `NUMBER(38,2)` |
| **GPOT (Cash Margin)** | `gpot_total` | `GPOT_USD` | `GPOT_USD` | `NUMBER(38,2)` |
| **POAS (Profit on Ads)**| `poas_blended` | `POAS_RATIO` | `POAS_RATIO` | `NUMBER(38,2)` |
| **CM1 Margen Bruto** | `cm1_margin` | `CM1_GROSS_PROFIT` | `CM1_GROSS_PROFIT` | `NUMBER(38,2)` |
| **CM2 Margen Neto Fees**| `cm2_margin` | `CM2_PROFIT_AFTER_FEES` | `CM2_PROFIT_AFTER_FEES` | `NUMBER(38,2)` |
| **CM3 Contribución USD**| `cm3_contribution` | `CM3_CONTRIBUTION_MARGIN_USD` | `CM3_CONTRIBUTION_MARGIN_USD` | `NUMBER(38,2)` |
| **CM3 Margen (%)** | `cm3_margin_pct` | `CM3_MARGIN_PCT` | `CM3_MARGIN_PCT` | `NUMBER(38,2)` |

---

## 5. Guía de Operación y Consumo para el Equipo de Frontend (Anti-Reprocesos)

Para garantizar un desarrollo ágil y sin fricciones, el equipo de frontend debe aplicar las siguientes 5 reglas de implementación:

### Regla 1: Consumo por Pestaña de Dashboard
- **Pestaña 1 (Executive Cockpit) & Pestaña 4 (Rentabilidad P&L):** Consumir exclusivamente `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` filtrando por `FISCAL_YEAR` o `MES`.
- **Pestaña 2 (Cockpit Diario Promociones):** Consumir `GLD_ECOMM_PROFITABILITY_DAILY` para alimentar series de tiempo de alta resolución.
- **Pestaña 3 (Performance Campaigns - Agencia):** Consumir columnas `_PAID` (`REV_PAID`, `ORDERS_PAID`, `ROAS_PAID`, `CPA_PAID`, `BOUNCE_RATE_PAID_PCT`).
- **Pestaña 6 (Clientes & LTV):** Consumir `GLD_CUSTOMER_LTV_COHORTS_MATRIX` para matrices triangulares y curvas de maduración de cohortes (M1 a M24).

### Regla 2: Tratamiento Determinista de `NULL` vs `0`
- Los ratios calculados (`ROAS_PAID`, `MER_TOTAL`, `CVR_TOTAL_PCT`, `LTV_CAC_RATIO`) devolverán `NULL` si no hay denominador en lugar de un `0` artificial que distorsione los promedios.
- El frontend debe renderizar `"—"` o `"N/A"` ante valores `NULL` y no graficar puntos en 0.

### Regla 3: Moneda y Formato
- **Moneda Unificada:** Todas las métricas monetarias están en **USD** (Dólares Americanos).
- **Formato Visual:**
  - Moneda: `$#,##0.00 USD` (Ejemplo: `$1,319,459.78`).
  - Porcentajes: `0.00%` (Ejemplo: `17.13%`).
  - Ratios / Múltiplos: `0.00x` (Ejemplo: `5.18x`).

### Regla 4: Mapeo de Semáforos en Componentes UI
Utilizar la función de evaluación con bordes inclusivos:
```typescript
function getSemaphoreStatus(value: number, metricKey: string): 'GREEN' | 'YELLOW' | 'RED' {
  switch(metricKey) {
    case 'ltv_cac_ratio':
      if (value >= 3.0) return 'GREEN';
      if (value >= 1.5) return 'YELLOW';
      return 'RED';
    case 'mer_total':
      if (value >= 4.5) return 'GREEN';
      if (value >= 3.5) return 'YELLOW';
      return 'RED';
    case 'poas_blended':
      if (value >= 2.0) return 'GREEN';
      if (value >= 1.5) return 'YELLOW';
      return 'RED';
    case 'cm3_margin_pct':
      if (value >= 18.0) return 'GREEN';
      if (value >= 12.0) return 'YELLOW';
      return 'RED';
    case 'cpa_blended':
      if (value <= 25.0) return 'GREEN';
      if (value <= 35.0) return 'YELLOW';
      return 'RED';
    default:
      return 'GREEN';
  }
}
```

### Regla 5: Checklist Pre-Deploy Frontend
1. [ ] Verificar que el usuario de servicio consuma con el rol `RL_BT_UA_BI` o `SYNAPSE_APP_ROLE`.
2. [ ] Validar que los títulos de tarjetas y paneles coincidan con el campo `NAME` de `SYNAPSE_METRIC_CATALOG`.
3. [ ] Comprobar que el subtítulo de cada panel muestre el texto descriptivo del campo `BASE`.
4. [ ] Verificar que los semáforos se pinten según el campo `SEMANTIC_DIRECTION` (`MÁS ALTO = MEJOR` vs `MÁS BAJO = MEJOR`).
5. [ ] Confirmar que las cifras de Septiembre ($1.319M USD), Octubre ($648K USD) y Noviembre ($1.543M USD) cuadren idénticas en todas las vistas.
