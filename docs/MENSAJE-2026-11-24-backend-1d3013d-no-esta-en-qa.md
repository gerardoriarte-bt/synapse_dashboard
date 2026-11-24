# Para el equipo de backend · el commit 1d3013d no está publicado ni en QA · 2026-11-24

**Medido contra `f1ccbbe` el 2026-11-24**, a las 18:45 UTC. Es la cabeza de
`feature/dynamic-dashboard-backend` en el remoto: el commit 1d3013d que
citan las tres respuestas **no está en ninguna rama** (`git ls-remote` y
`git fetch`). En QA, con sesión de superadmin:

| Qué se pidió | Qué contesta QA |
|---|---|
| `GET /config/blocks` con `thresholds` | `kpi`: `comparative, meter` · `gauge`: `band, components, maximum`. **Sin `thresholds`** |
| `POST /admin/dashboards/{dashboardId}/archive` sobre Overview de UA MX | **500**: «column "archived_at" of relation "dd_dashboards" does not exist» |
| Títulos de la semilla en español | `executive_summary` = «Executive summary», `decisions` = «Decisions» |
| Las 16 de rentabilidad | `GET /admin/tenants/{tenantId}/catalog/data?period=2026-10`: `brand_spend_total`, `mer_total`, `cm1_margin`, `ltv_cohort_matrix` y las demás siguen `BLOCKED` con «Esta métrica todavía no tiene fuente de datos» |

**El front tampoco se volvió a desplegar**: el bundle de QA sigue siendo el
del 2026-11-24 a las 14:36 GMT, y no trae los umbrales. `main` del front
está en `4b58dbd`.

Hola. Gracias por las tres respuestas. Leímos lo hecho y está bien
planteado, pero todavía no lo vemos ni en el repositorio ni en QA.

## Lo que pedimos

1. **Publicar 1d3013d** en `feature/dynamic-dashboard-backend`, para medirlo
   de nuestro lado contra su código.
2. **Desplegarlo en QA y correr las migraciones una vez**, con
   `DB_AUTO_MIGRATE=true` y el usuario dueño de las tablas, como dicen en su
   respuesta. Sin eso siguen los tres síntomas de la tabla.
3. **Desplegar el front desde `main` (`4b58dbd`)**.
4. **Materializar UA MX en 2026-10** después del despliegue, para que las
   métricas nuevas dejen de salir `BLOCKED`.

Cuando nos avisen, comprobamos las cifras de su respuesta, archivamos
Overview y probamos el reporte por correo.

**De acuerdo con no mezclar** las métricas nuevas con `revenue`, `spend` y
`daily_trend` en un layout publicado hasta que datos elija la fuente. No las
vamos a componer antes.

Gracias.
