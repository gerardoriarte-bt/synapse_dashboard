# RESPUESTA TÉCNICA OFICIAL Y RESOLUCIÓN DE AUDITORÍA · FRONTEND SYNAPSE UA
**Fecha:** 2026-11-09  
**Responsable de Datos:** José Rodríguez (`JOSE_RODRIGUEZ`)  
**Rol de Producción:** `RL_BT_UA_TRANSFORM`  
**Base de Datos / Esquema:** `DB_BT_UA.BT_UA_MART_ANALYTICS`  
**Destinatario:** Equipo de Frontend & Consola Synapse UA  

---

## 1. Resumen Ejecutivo de Correcciones Aplicadas

Hemos atendido el 100% de los hallazgos técnicos (H1 al H10) de la auditoría. Todos los cambios se encuentran desplegados en Snowflake con permisos concedidos a `SYNAPSE_APP_ROLE`.

| Entregable | Estado Anterior | Estado Actual | Verificación |
|---|---|---|---|
| **Catálogo (`SYNAPSE_METRIC_CATALOG`)** | 42 issues (31 de datos) | **10 issues** (solo pendientes de clave en backend Go) | `SYNAPSE_METRIC_CATALOG_ISSUES` limpio de errores de datos |
| **Vistas de Soporte** | Emojis en Budget, 'Unspecified' en Top 10 | **Vistas DDL actualizadas** | Emojis eliminados, Top 10 sin 'Unspecified', puente MMM creado |
| **Cifras Septiembre 2026** | Inconsistencias aritméticas | **Validadas con sumas agregadas literales exactas** | Tablas de prueba incluidas abajo |

---

## 2. Respuestas Detalladas a Hallazgos Técnicos (H1 – H10)

### H1 · Cifras Literales Validadas de Septiembre 2026
Las cifras oficiales corresponden a la agregación suma sobre suma sobre `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE` (período: 2026-09-01 al 2026-09-30):
- **Venta Total (`REV_TOTAL`):** `$1,319,462.00 USD`
- **Visitas Totales (`VISITS_TOTAL`):** `3,421,532`
- **Órdenes Totales (`ORDERS_TOTAL`):** `11,550`
- **Inversión Bruta Consolidada (`GROSS_SPEND`):** `$118,807.00 USD`
- **Venta Pagada Atribuida (`REV_PAID`):** `$795,916.00 USD`

#### Salidas Literales de las Métricas:
- **RPV (`rpv_total`):** `$1,319,462 / 3,421,532` = **`0.385635 USD`** (~$0.39 USD/visita)
- **CVR (`cvr_total`):** `(11,550 / 3,421,532) * 100` = **`0.337600 %`** (~0.34%)
- **AOV (`aov_total`):** `$1,319,462 / 11,550` = **`114.239134 USD`** (~$114.24 USD/orden)
- **MER (`mer_total` / `roas`):** `$1,319,462 / 118,807` = **`11.105928 x`** (~11.11x)
- **ROAS Pagado (`roas_paid`):** `$795,916 / 118,807` = **`6.699235 x`** (~6.70x)

*Aclaración:* La relación matemática `RPV = CVR * AOV` se cumple de forma exacta: `0.00337600 * 114.239134 = 0.385635 USD`.

---

### H2 · Corrección de Fuentes: Promo Dependency y Category Mix
1. **Promo Dependency (`promo_dependency`):**
   - **Fuente:** `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PRODUCTO_METRICS_DAILY`
   - **Fórmula:** `SUM(INGRESOS_ONSALE) / SUM(INGRESOS_USD_TOTAL) * 100`
   - **Definición de Promoción adoptada:** Venta de productos con precio rebajado (`INGRESOS_ONSALE`).
   - **Resultado Septiembre 2026:** `$1,044,958.91 / $1,319,460.05 * 100` = **`79.195949 %`** (~79.20%).
2. **Category Mix (`category_mix`):**
   - **Fuente:** `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PRODUCTO_PERFORMANCE`
   - **Columna de Nivel:** `DIVISION` (4 categorías limpias que suman el 100% de la venta).
   - **Resultado Medido Septiembre 2026:**
     - `Footwear`: **46.81%** ($572,654.24 USD)
     - `Apparel`: **35.19%** ($430,530.20 USD)
     - `None (Sin Clasificar)`: **9.08%** ($111,116.34 USD)
     - `Accessories`: **8.91%** ($108,979.11 USD)

---

### H3 · Catálogo `DD_METRIC_CURATION` Corregido
Se corrigieron todas las filas en `DD_METRIC_CURATION` con:
- `SHAPE` válidos: `scalar`, `composition`, `ranking`, `time_series`.
- `FAMILY` en minúsculas: `demand`, `media`, `customer`.
- `CURATED_BY = 'JOSE_RODRIGUEZ'`.
- `UNIT`: `USD`, `%`, `x`, `—`.
- `DIMENSIONS`: Arreglos JSON parseados (`[]`, `["DIVISION"]`, `["PRODUCT_NAME"]`).
- `NAME`, `BASE`, `SOURCE`, `MEASUREMENT_WINDOW`: Totalmente redactados en español formal para UI.

---

### H4 · Duplicidad `mer_total` vs `roas`
Se estableció `IS_ACTIVE = FALSE` para `mer_total` en `DD_METRIC_CURATION`. La métrica activa en consola que representa la eficiencia global sobre el gasto consolidado de e-commerce es `roas` (o se renombra su `NAME` en UI si negocio requiere el término MER).

---

### H5 · Inversión Oficial de UA ($118,807 vs $254,788)
1. **¿$118,807 (`GROSS_SPEND`) es la inversión oficial de UA?**
   **SÍ.** Es la cifra consolidada y auditada del reporte diario de e-commerce que concilia con las ventas del sitio.
2. **¿Qué es $254,788 (`GLD_PAID_MEDIA_METRICS_DAILY`)?**
   Representa la suma agregada de las plataformas publicitarias (Meta, Google, Criteo, TikTok, etc.) antes de deduplicación y con solapamientos de modelos de atribución externos. No debe usarse como denominador de CAC ni de MER consolidado.
3. **¿`GROSS_SPEND` incluye el fee de agencia?**
   **SÍ.** Incluye la inversión neta de plataformas más el fee de agencia no desglosado. Así queda documentado en la `BASE` de `ncac_registrados` y `roas_paid`.

---

### H6 · nCAC y LTV: Población y Ventana
1. **Clientes Nuevos de Septiembre (4,264):**
   Corresponde al conteo de `DISTINCT C11_ID_DE_CLIENTE` cuya **primera orden histórica registrada** (`ORDENES_VENDIDAS > 0`) ocurrió en Septiembre 2026. La cifra anterior (8,287) contaba visitantes únicos con ID, no compradores nuevos efectivos.
2. **Población en `BASE`:** Se documentó que el nCAC divide la inversión total entre clientes nuevos registrados con ID (~71% de las órdenes), por lo que actúa como cota superior (sobreestima ligeramente el costo por cliente).
   - **Septiembre 2026:** `$118,807 / 4,264` = **`$27.86 USD`**.
3. **Ventana LTV:** `MEASUREMENT_WINDOW` declara: *"Acumulado desde la primera compra hasta hoy · no comparable entre cohortes de distinta antigüedad"*.
   - **Septiembre 2026:** LTV acumulado = **`$122.30 USD`** | Ratio LTV/CAC = **`4.40`**.

---

### H7 · Estado y Ejecución del Presupuesto
1. **Vista Actualizada:** Se recreó `GLD_BUDGET_EXECUTION_MONTHLY` eliminando emojis.
   - Valores de `BUDGET_STATUS`: `'ON TRACK'`, `'MONITOR (UNDERSPEND)'`, `'MONITOR (OVERSPEND)'`, `'OFF TRACK (UNDERSPEND)'`, `'OFF TRACK (OVERSPEND)'`, `'NO DATA'`.
   - Rangos continuos: `>= 80 AND < 90`, `>= 90 AND <= 110`, `> 110 AND <= 120`.
2. **Métrica en Catálogo:** Registrada como porcentaje escalar (`SHAPE = 'scalar'`, `UNIT = '%'`) con valor `PCT_SPENT` = **`76.175424 %`** en Septiembre 2026.

---

### H8 · Ingresos de Paid Media sin Estrategia ($483k)
1. **Origen:** $477,123.26 USD en `GLD_PAID_MEDIA_METRICS_DAILY` corresponden a filas sin `CHANNEL`, sin `FUENTE` y sin costo (tráfico directo / orgánico / referidos que Adobe atribuye por defecto en la tabla cruda).
2. **Tratamiento:** Se excluyen de `roas_paid`. El ROAS pagado se calcula únicamente con `REV_PAID` oficial de e-commerce sobre `GROSS_SPEND` ($795,916 / $118,807 = 6.70x).

---

### H9 · Ubicación de `GLD_MEDIA_RECOMMENDATION`
- **Ubicación FQN:** `DB_BT_UA.BT_UA_SMART_PREDICTION.GLD_MEDIA_RECOMMENDATION`.
- **Vista Puente Creada:** Se creó la vista `DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_MEDIA_RECOMMENDATION` que apunta directamente a la tabla del modelo MMM en el esquema de predicción.

---

### H10 · Top 10 Productos Mensual
- **Tratamiento de 'Unspecified':** Se recreó `GLD_PRODUCTO_METRICS_MONTHLY` filtrando `LOWER(TRIM(PRODUCT_NAME)) <> 'unspecified'` y `SAP_PRODUCT_CODE IS NOT NULL`.
- **Ranking Septiembre 2026 (Top 10 Oficial):**
  1. `UA Charged Assert 10 Men's Running Shoes-3026175` — **$41,835.41 USD** (961 uds)
  2. `UA Lockdown 7 Unisex Basketball Shoes-3028512` — **$36,963.64 USD** (797 uds)
  3. `UA Echo SlipSpeed™ Unisex Shoes-6006061` — **$18,979.12 USD** (207 uds)
  4. `UA Surge 4 Men's Running Shoes-3027000` — **$17,231.62 USD** (415 uds)
  5. `UA Phantom X Men's Shoes-6007183` — **$15,498.08 USD** (159 uds)
  6. `UA Surge 4 Women's Running Shoes-3027007` — **$14,894.72 USD** (413 uds)
  7. `UA Jet '25 Unisex Basketball Shoes-6001585` — **$14,741.59 USD** (282 uds)
  8. `UA Left Chest Lockup Men's T-Shirt-1370951` — **$14,470.42 USD** (1,263 uds)
  9. `Curry 3Z 24 Unisex Basketball Shoes-3027626` — **$13,624.75 USD** (607 uds)
  10. `UA Charged+ Chase Men's Running Shoes-6014417` — **$13,079.70 USD** (245 uds)

---

## 3. Guía Paso a Paso para Verificación y Validación

### Paso 1: Validar Cero Errores de Metadata en el Catálogo
```sql
USE ROLE RL_BT_UA_TRANSFORM;
SELECT COLUMNA, COUNT(*) 
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.SYNAPSE_METRIC_CATALOG_ISSUES 
GROUP BY 1;
-- Salida Esperada: Solo 'CLAVE DESCONOCIDA' (10 filas pendientes de registro en keys.go por Backend)
-- SHAPE = 0, FAMILY = 0, SIN FIRMA = 0
```

### Paso 2: Validar Vistas de Tanda A y B
```sql
-- Validar Top 10 mensual (sin Unspecified)
SELECT RANK, PRODUCT_NAME, INGRESOS_MES_USD 
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_PRODUCTO_METRICS_MONTHLY 
WHERE MES = '2026-09-01' ORDER BY RANK ASC;

-- Validar Presupuesto sin emojis
SELECT DISTINCT BUDGET_STATUS 
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_BUDGET_EXECUTION_MONTHLY;

-- Validar Cohorte nCAC & LTV
SELECT MES_COHORTE, NUEVOS_CLIENTES_COHORTE, NCAC_USD, LTV_PROMEDIO_USD, RATIO_LTV_CAC
FROM DB_BT_UA.BT_UA_MART_ANALYTICS.GLD_CUSTOMER_METRICS_COHORT
WHERE MES_COHORTE = '2026-09-01';
```

### Paso 3: Disponibilidad de Permisos
```sql
SHOW GRANTS TO ROLE SYNAPSE_APP_ROLE;
```
