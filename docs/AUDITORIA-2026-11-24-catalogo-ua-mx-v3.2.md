# El catálogo de UA MX v3.2, contra lo que existe · 2026-11-24

**Qué se revisó:** `docs/CATALOGO_Y_ESPECIFICACION_TECNICA_UA_MX_FRONTEND.md`,
versión 3.2 de noviembre de 2026. Son 29 métricas con su gráfico sugerido, el
año fiscal de abril a marzo, metas hasta FY31 y seis pestañas.

**Medido en QA el 2026-11-24**, con UA MX:

- `GET /admin/tenants/{tenantId}/catalog` (54 métricas);
- `GET /admin/tenants/{tenantId}/catalog/data?period=2026-10`;
- `GET /config/plots` (49 gráficos).

Las reglas de diseño se leyeron de `design/design.md`. **Las vistas de
Snowflake que el documento nombra no se midieron.**

## 1 · Las 29 métricas, en tres grupos

| Grupo | Métricas | Qué falta |
|---|---|---|
| **Con cifra hoy (13)** | `revenue`, `orders`, `units`, `sessions`, `aov_total`, `rpv_total`, `cvr_total`, `spend`, `roas_paid`, `ncac_registrados`, `ltv_registrados`, `promo_dependency`, `top_10_productos` | Nada: se pueden componer ya |
| **En el catálogo, sin cálculo (12)** | `brand_spend_total`, `perf_spend_total`, `mer_total`, `gpt_total`, `gpot_total`, `poas_blended`, `cm1_margin`, `cm2_margin`, `cm3_contribution`, `ltv_cohort_matrix`, `ltv_cac_ratio`, `pacing_annual_30m` | **El backend**: QA las sirve `BLOCKED` con «Esta métrica todavía no tiene fuente de datos». Datos las curó, pero `MetricRegistry` no tiene su consulta (B1.26, opción A) |
| **No están en el catálogo (4)** | `atc_rate`, `cart_completion`, `cpa_blended`, `pacing_revenue_fy27` | **Datos**: la fila del catálogo. Después, el backend: la consulta |

## 2 · Los gráficos: el que elige es la forma, no el nombre

Los gráficos que pide el documento casi todos existen: `waterfall`, `funnel`,
`heatmap`, `cohort`, `bump`, `bullet`, `gauge`, `scatter`, `histogram`,
`box`, `stacked100`, `treemap`, `combo`, `smallmult`. **Pero un panel dibuja
lo que la forma de su métrica permite**, y casi todas las del documento son
`scalar`. Una cifra sola no hace línea, cascada ni mapa de calor.

| Lo que pide | Lo que hay | Qué hace falta |
|---|---|---|
| `revenue` como línea con meta | `revenue` es `scalar` | La serie ya existe aparte: `daily_trend`, con ventas, sesiones e inversión |
| `cm1_margin → cm2 → cm3` en cascada | Tres `scalar` sueltos | Una métrica de forma `composition` (el P&L como partes) |
| `ltv_cohort_matrix` como mapa de calor | `multi_series` | El mapa de calor pide `matrix`. Con `multi_series`, las curvas de maduración sí se pueden |
| `gpt_total` como línea y cascada | `scalar` | Una serie, si se quiere ver en el tiempo |
| `top_10_productos` como tabla con barras y bump | `ranking`: barras, sí | Para `bump` hace falta el ranking de varios meses |

**Ningún gráfico se elige en el front sin la forma que lo alimente.** Pedir la
forma es lo que convierte la tabla del documento en algo construible.

## 3 · Lo que choca con las reglas de diseño

- **«Semáforo», «zona verde», «badge»** (CVR, RPV, Cart Completion, LTV/CAC,
  POAS). `design.md` §1.3 regla 7 dice «el color no codifica juicio» y
  prohíbe el verde y el rojo semánticos, y el ámbar está prohibido aparte. El
  umbral sí se puede dibujar: como banda o marca neutra en un `bullet` o un
  `gauge`, con su rótulo («META > 3,0×»).
- **Eje doble** (CVR frente a visitas, POAS frente a ROAS). El 2026-10-19
  (F5.25) se decidió dividir en `smallmult`, o en `combo` con dos series, y
  así quedó la tendencia diaria de UA MX en QA.
- **Cada métrica nueva tiene que declarar su BASE, su procedencia y su
  dirección**: reglas 8 a 10. El documento no las trae; las pone el catálogo
  de datos.

## 4 · Fórmulas que conviene revisar con datos antes de construir

- **`gpt_total` = AOV − CPA** se llama «Gross Profit per Transaction», pero no
  resta el costo de lo vendido: es ingreso por orden menos pauta. Lo mismo
  **`gpot_total` = revenue − ad spend**. Con esos nombres, alguien va a leerlos
  como margen.
- **Supuestos fijos dentro de la fórmula:**
  - `poas_blended` usa 55 % de margen;
  - `cm1_margin`, COGS del 45 %;
  - `cm3_contribution`, USD 5 de logística por orden.

  Si son supuestos, la BASE del panel tiene que decirlo («margen supuesto
  55 %»), o la cifra parece medida.
- **El reparto 64,4 % / 35,6 %** entre Brand y Performance aparece como meta
  del plan. **¿`brand_spend_total` mide el gasto real por tipo de campaña, o
  aplica el porcentaje al total?** Si es lo segundo, la cifra está inventada.
- **`pacing_revenue_fy27`** necesita la meta mensual de §3 como dato en
  Snowflake, no en un documento.

## 5 · El año fiscal

El selector de período de la consola es por **mes calendario**, y alcanza para
las métricas mensuales. Lo que el documento pide por año fiscal (pacing FY27,
acumulado de abril a la fecha) o por doce meses móviles (`pacing_annual_30m`)
**no existe como ventana**: tiene que venir resuelto en la métrica, con su
ventana declarada en `measurement_window`. Si se quiere un selector de año
fiscal, es otra cosa, y es del backend.

## 6 · Las seis pestañas

Con lo que tiene cifra hoy se pueden armar tres de las seis:

| Pestaña del documento | Hoy |
|---|---|
| 1 · Executive Cockpit | Sí, salvo el pacing hacia USD 30 M |
| 2 · Cockpit diario de promos | En parte: `daily_trend` y `promo_dependency`. El MER diario está bloqueado |
| 3 · Rentabilidad y POAS | No: las seis están bloqueadas |
| 4 · CRO y funnel | En parte: `cvr_total` y `rpv_total`. ATC y cart completion no existen |
| 5 · Clientes y cohortes | En parte: `ncac_registrados` y `ltv_registrados`. La matriz y LTV/CAC están bloqueadas |
| 6 · Catálogo y merchandising | En parte: `top_10_productos` y `promo_dependency`. `category_mix` está bloqueada |

## 7 · Una nota de seguridad

El documento nombra `SYSADMIN` entre los roles de consumo. Synapse no debería
consumir con él: los clientes nuevos se conectan con un usuario de servicio y
un rol de solo lectura.
