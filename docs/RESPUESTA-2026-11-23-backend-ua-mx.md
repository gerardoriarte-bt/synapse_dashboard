# Para el equipo de front · UA MX listo en QA / producción · 2026-11-23

Respuesta a `docs/MENSAJE-2026-11-23-backend-ua-mx-y-produccion.md`, medido por ustedes contra `fb3ca0c`.

**Hecho en `a13d27c`** (títulos ES + prosa). Meses cerrados y tzdata siguen en `8366936` / `5b917f7`.

## 1 · Meses cerrados «DEGRADADO»

**Hecho en `8366936`.** El commit **sí está en el repositorio**, en `feature/dynamic-dashboard-backend`, encima de `fb3ca0c`. Si `git log` en el remoto o QA solo muestra `fb3ca0c`, es deploy/push atrasado, no que falte el cambio.

Al desplegar ≥ `8366936`, enero–septiembre materializados tras el cierre dejan de salir degradados por antigüedad.

## 2 · Zonas horarias

**Hecho en `5b917f7`.** Misma respuesta que en Terpel / desplegar QA: `time/tzdata` + `tzdata` en la imagen. Bloqueante para producción; va en el mismo deploy.

## 3 · Títulos en inglés en el catálogo

**Hecho en `a13d27c`.** La semilla ya nombra en español, y una migración idempotente renombra solo las filas que todavía tienen el título inglés de la semilla:

| key | Antes | Ahora |
|-----|--------|--------|
| `decisions` | Decisions | Decisiones |
| `investment` | Investment | Inversión |
| `twelve_month_efficiency` | Twelve-month efficiency | Eficiencia de doce meses |

También el resto de títulos de la semilla Overview (Ventas, Visitas, Tendencia diaria, etc.). No pisa un nombre que datos haya cambiado a mano o por sync.

**Contrato.** Mismo campo `name` del catálogo / panel; sin ruta nueva. Tras migrate + recarga de consola.

## 4 · Dos cifras que no cuadran

### 22 de noviembre: tendencia 14.970 vs detalle 19.611

**Sí: su hipótesis es la correcta.**

- **Tendencia diaria** (`daily_trend`): materializa `REV_TOTAL` **por fila/día tal cual está en Gold** en el momento de la corrida (foto).
- **Ver detalle** (drill-down `revenue` × día): consulta Snowflake **en vivo** con `SUM(REV_TOTAL) GROUP BY DATE`.

Si el día se sigue cargando, el panel puede mostrar la foto de la mañana y el detalle el total más nuevo. Las dos leen `REV_TOTAL`; cambia el instante.

**No hecho (mejora de producto):** marcar en el panel «dato hasta …» / `as_of` de la materialización. Si lo quieren en cable, lo armamos en un pedido aparte.

### Charged Assert 10: Producto 36.562 vs chat 37.761

**Confirmación de arquitectura, sin cifra en vivo desde acá:** el panel de Producto sirve el payload **materializado** de la métrica del catálogo (tabla/ventana de esa métrica). El chat habla con el **agente Cortex del rol**, que puede armar otra consulta (otra tabla Gold, otro filtro de producto/período o el dato ya refresco). Por eso pueden diferir sin que una de las dos esté «mal» del cable.

Si datos define una sola fuente de verdad para ese SKU, el siguiente paso es alinear la métrica del panel y la instrucción del agente; no es un bug del batch vs el SSE por sí solo.

## 5 · Más chico

### Salud de feeds vs procedencia del panel

**No hecho en este corte.** Los feeds de semilla se llaman ERP / Ads API / GA4 / Actionable framework y se enlazan por `source_labels` dentro de `catalog.source`. El texto «Reporte diario de ecommerce · Adobe Analytics» viene de la vista/sync de datos, no del nombre del feed. Renombrar feeds o ampliar labels sin romper el match lo podemos hacer en un pedido chico con el glosario que defina datos.

### Prosa: nombrar la base de cada comparación

**Hecho en `a13d27c`.** El prompt de prosa exige que cada comparación diga «frente al mes anterior» (`prev`) o «frente al mismo mes del año anterior» (`prior`). Hace falta **volver a materializar** las métricas de prosa (`DD_MATERIALIZE_PROSE_ENABLED=true`) para que el texto guardado cambie.

### Reportes 404 en QA

**Hecho en código desde `49ebb26` / ampliado en `5b917f7`.** El 404 es deploy: QA sigue &lt; ese commit. Va junto con tzdata y `DD_REPORTS_ENABLED` (ver respuesta de desplegar QA).

**Commit en QA:** al medir, `fb3ca0c`. Este corte y `8366936`/`5b917f7` no están en QA hasta el deploy.

## Cómo comprobarlo

1. Tras deploy ≥ `8366936`: marzo sin degradado por edad.
2. `America/Bogota` en ficha de cliente → 200.
3. Tras migrate: catálogo UA muestra «Decisiones», «Inversión», «Eficiencia de doce meses».
4. Tras rematerializar prosa: las comparaciones nombran mes anterior / año anterior.
