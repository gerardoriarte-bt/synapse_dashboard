# Las métricas de UA MX: qué se puede mostrar hoy y qué falta · 2026-11-18

**Medido el 2026-11-18, sólo leyendo**, de tres fuentes:

- **QA**: el catálogo de Under Armour MX (`GET /admin/tenants/{tenantId}/catalog`)
  y el estado del dato de cada métrica, mes por mes, de enero a noviembre de
  2026 (`GET /admin/tenants/{tenantId}/catalog/data`).
- **El backend**, en `fb3ca0c`: qué claves calcula `MetricRegistry` y cuáles son
  alias de otras (`keys.go`).
- **Snowflake**: la vista `SYNAPSE_METRIC_CATALOG` de UA, que tiene 26 métricas.

## En corto

- **QA tiene 41 métricas para UA MX, y 31 muestran cifra en octubre y
  noviembre.**
- **De enero a septiembre nada está al día.** Lo que hay se calculó por última
  vez el 2026-10-31, y desde el 2026-11-03 sale como dato viejo. Las nueve
  métricas nuevas de UA no tienen cifra en esos meses porque nunca se
  calcularon.
- **Hay ocho métricas repetidas en inglés**: la semilla original del backend,
  con alias a las canónicas. Muestran el mismo dato con otro nombre.
- **Diez no muestran cifra en ningún mes.** Ocho no tienen de dónde salir, y las
  dos de redes sociales dejaron de cargarse.

## 1 · El estado de cada métrica, mes por mes

`✓` con cifra al día · `◐` con cifra vieja: «Los datos tienen más de 3 días» ·
`·` sin cifra

### Las de siempre: 14, con cifra en todos los meses

| Métrica | Clave | Forma | E | F | M | A | M | J | J | A | S | O | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ingresos | `revenue` | cifra | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Órdenes | `orders` | cifra | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Unidades | `units` | cifra | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Visitas | `sessions` | cifra | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Inversión | `spend` | cifra | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| ROAS | `roas` | cifra | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Cumplimiento de objetivo | `goal_attainment` | por categoría | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Tendencia diaria | `daily_trend` | varias series | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Eficiencia de medios · 12m | `media_efficiency_12m` | varias series | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Funnel de conversión | `conversion_funnel` | flujo | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Top productos por venta | `top_products_revenue` | ranking | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Retorno por plataforma | `platform_return` | tabla | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Distribución de inversión | `media_investment_composition` | composición | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Inversión por plataforma | `media_platform_investment_matrix` | matriz | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |

### Las nuevas de UA (B6.2): 9, sólo octubre y noviembre

| Métrica | Clave | Forma | E–S | O | N |
|---|---|---|---|---|---|
| Ingresos por visita (RPV) | `rpv_total` | cifra | · | ✓ | ✓ |
| Tasa de conversión (CVR) | `cvr_total` | cifra | · | ✓ | ✓ |
| Ticket promedio (AOV) | `aov_total` | cifra | · | ✓ | ✓ |
| ROAS pagado (Last-Click) | `roas_paid` | cifra | · | ✓ | ✓ |
| Ejecución del presupuesto (Pacing) | `budget_status` | cifra | · | ✓ | ✓ |
| Dependencia de promociones | `promo_dependency` | cifra | · | ✓ | ✓ |
| Top 10 productos más vendidos | `top_10_productos` | ranking | · | ✓ | ✓ |
| Costo de adquisición de cliente nuevo (nCAC) | `ncac_registrados` | serie | · | ✓ | ✓ |
| Valor de vida del cliente (LTV) | `ltv_registrados` | cifra | · | ✓ | ✓ |

### Repetidas en inglés: 8, el mismo dato que otra

Son la semilla con que arrancó el backend. `keys.go` las manda a la canónica,
así que la cifra es la misma.

| En QA | Es la misma que | E–A | S | O | N |
|---|---|---|---|---|---|
| Sales · `sales` | `revenue` | ◐ | ◐ | ✓ | ✓ |
| Visits · `visits` | `sessions` | ◐ | ◐ | ✓ | ✓ |
| Investment · `investment` | `spend` | ◐ | ◐ | ✓ | ✓ |
| Investment and return by platform · `investment_by_platform` | `platform_return` | ◐ | ◐ | ✓ | ✓ |
| Goals vs actual · `goals_vs_actual` | `goal_attainment` | ◐ | ◐ | ✓ | ✓ |
| Twelve-month efficiency · `twelve_month_efficiency` | `media_efficiency_12m` | ◐ | ◐ | ✓ | ✓ |
| Executive summary · `executive_summary` | prosa del agente | · | ◐ | ✓ | ✓ |
| Decisions · `decisions` | prosa del agente | · | ◐ | ✓ | ✓ |

**El dashboard publicado de UA MX usa dos de ellas**: «Investment» y «Decisions».
Por eso se ven títulos en inglés en la consola.

### Sin cifra en ningún mes: 10

| Métrica | Clave | Por qué |
|---|---|---|
| Cierre proyectado del mes | `revenue_forecast_close` | «Esta métrica todavía no tiene fuente de datos» |
| Proyección de revenue | `revenue_forecast` | Ídem |
| Proyección de inventario por categoría | `inventory_forecast` | Ídem |
| Contribución por canal (MMM) | `mmm_channel_contribution` | Ídem |
| Descomposición semanal MMM | `mmm_weekly_contribution` | Ídem |
| ROAS esperado por canal | `media_roas_recommendation` | Ídem |
| Mix de ventas por división | `category_mix` | Ídem. Lo frenamos nosotros: el 9 % de la venta llega sin división |
| MER - Marketing Efficiency Ratio Total | `mer_total` | Ídem. Datos la desactivó en Snowflake, porque es la misma cuenta que `roas`, pero sigue en el catálogo de QA |
| Tendencia de followers Instagram | `instagram_followers_trend` | Con cifra vieja en enero–marzo y junio–julio. Sin cifra desde agosto: los datos terminan el 2026-08-01 |
| Sentimiento de comentarios TikTok | `tiktok_comment_sentiment` | Con cifra vieja en enero–marzo. Sin cifra desde abril: los posts terminan el 2026-03-05 |

## 2 · Lo que falta, y de quién es

### Para que enero–septiembre se vean al día

1. **«Cargar meses» de enero a septiembre en UA MX**, desde Administración →
   Salud de feeds. Le da historia a las nueve nuevas y recalcula las demás. Lo
   hace un admin, en QA.
2. **Una pregunta al backend: ¿un mes cerrado tiene que envejecer?** Septiembre
   se calculó el 2026-10-31 y a los tres días pasó a «dato viejo», aunque sus
   cifras ya no van a cambiar. Con esta regla, recargar enero–septiembre los
   deja al día sólo tres días.

### Datos

3. **La inversión por plataforma no cuadra** con la del reporte de ecommerce:
   4,16 M contra 55 936 en octubre. Afecta a `platform_return`,
   `media_investment_composition`, `media_platform_investment_matrix` e
   `investment_by_platform`. **Ya está preguntado** en
   `docs/MENSAJE-2026-11-11-datos-ua-por-dia-y-por-mes.md`, junto con las series
   por día y por mes.
4. **`category_mix`**: si la venta sin división se muestra, y con qué nombre.
5. **Pronósticos y MMM**: no tienen fuente. Si van a existir, primero tienen que
   estar en Snowflake.
6. **Instagram y TikTok**: si se siguen cargando. También está en el mensaje del
   2026-11-11.

### Backend

7. **Desplegar el front de `main` en QA.** Pedido el 2026-11-17 en
   `docs/MENSAJE-2026-11-17-backend-desplegar-el-front.md`.
8. **Las ocho repetidas en inglés y `mer_total`**: si se sacan del catálogo de
   QA. No es urgente, pero ensucian la biblioteca del editor: «Investment» y
   «Inversión» aparecen como dos datos distintos.

### Producto, al componer

9. **Usar las canónicas**: «Inversión» en vez de «Investment», y las
   españolas en general.
10. **Dos pares que dicen casi lo mismo**:
    - `top_10_productos` agrupa por modelo y deja afuera lo que no tiene
      producto. `top_products_revenue` pone primero un producto nulo y repite
      tallas y colores.
    - `budget_status` da el mismo número que el medidor «% DE LA META» de
      Inversión.
11. **El resumen ejecutivo no entra en 12 × 4**: el texto desborda el panel.

### Front

12. **Las cards de la consola salían en escalera**, y en el editor no. Era
    nuestro y está arreglado en el PR #95: ver §3.

## 3 · Las cards desordenadas en la consola

**Lo que se vio**: en la pestaña «General overview UA MX», la consola mostraba
Órdenes, Visitas, Ingresos e Inversión en escalera, y en el editor estaban en
una fila.

**La causa es del front.** El servicio no guarda la fila de cada panel, sólo el
orden de la lista (`1756d1f`). La consola dejaba la fila a CSS, y CSS coloca con
un cursor de fila y de columna: un panel que arranca a la izquierda del anterior
baja de fila aunque haya lugar. El editor calcula sin el cursor de columna, y su
código decía que repetía a CSS. Medido en el navegador:

| Panel | Columna | Fila en el editor | Fila en la consola |
|---|---|---|---|
| Órdenes | 10 | 5 | 5 |
| Visitas | 7 | 5 | 6 |
| Ingresos | 1 | 5 | 7 |
| Investment | 4 | 5 | 7 |
| Ticket promedio (AOV) | 10 | 8 | 8 |
| Tasa de conversión (CVR) | 7 | 8 | 9 |
| Tendencia diaria | 1 | 8 | 10 |

**El arreglo** (PR #95): la consola calcula la fila igual que el editor y la
escribe. Aplicado desde el navegador sobre la pestaña de QA, sin guardar nada,
los paneles quedan en tres filas parejas, como en el editor. **Llega a QA con el
próximo despliegue del front.**
