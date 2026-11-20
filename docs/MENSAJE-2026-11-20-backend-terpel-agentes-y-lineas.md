# Para el equipo de backend · Terpel: de qué agente sale cada dato, y las líneas de negocio · 2026-11-20

**Medido contra `fb3ca0c` el 2026-11-20**. Del código leí
`internal/adapters/repository/agent_repository.go` (`FindByTenantAndRole`),
`internal/core/services/dd_materialize_orchestrator.go` (`TenantTarget`),
`dd_catalog_sync_service.go` y `agent_service.go`. En QA, ese mismo día y como
superadmin: la ficha de Terpel, `GET /admin/tenants/{tenantId}/agents`,
`GET /admin/tenants/{tenantId}/schema-check`, «Cargar meses» de julio a
noviembre y la consola con el dashboard nuevo.

Hola. Terpel ya tiene conexión: datos registró la llave en
`SVC_SYNAPSE_TERPEL_COMBS`, cambiamos usuario, rol y almacén virtual desde la
ficha, y la verificación contesta con ese usuario. Cargamos julio a noviembre y
**las 8 métricas de pauta salen con cifra**. Armamos el dashboard
«Terpel · Pauta digital» con esas 8, y Overview, el de UA, quedó fuera de
todos los roles de Terpel.

Al hacerlo aparecieron cuatro cosas que no se resuelven desde el front.

## 1 · El dato del dashboard sale del primer agente por orden alfabético

Terpel tiene dos agentes, «Terpel Combustibles» (`DB_BT_TERPEL_COMBS`) y
«Terpel Lubricantes» (`DB_BT_TERPEL_LUBS`). El materializador
(`TenantTarget`), la sincronización del catálogo y `schema-check` toman
**el primer agente activo**, y `findAllByTenant` ordena por `name ASC`. Hoy es
Combustibles porque la C va antes que la L.

El riesgo: **renombrar o desactivar un agente cambia en silencio de qué base
sale todo el dashboard.** Nadie lo ve en la ficha, porque nada dice qué agente
alimenta los paneles.

**Pedido:** que el cliente declare cuál es su agente de datos (un campo en el
tenant o una marca en el agente, lo que les quede mejor), y que
`GET /admin/tenants/{tenantId}/agents` lo devuelva. Con eso la ficha lo
muestra y un renombre deja de mover el dato.

## 2 · El chat elige agente por el rol, y un rol de Terpel no tiene ninguno

`FindByTenantAndRole` da un agente por rol. En Terpel queda así:

| Rol | Usuarios | Agente del chat |
|---|---|---|
| `Planner` | 6 | Terpel Combustibles |
| `admin` | 2 | Terpel Lubricantes |
| `user` | 2 | ninguno · el chat contesta que no hay agente activo |

Que alguien hable con Combustibles o con Lubricantes depende del rol que tiene,
no de lo que quiere preguntar. **Pregunta, sin pedido todavía:** ¿el modelo
pensado es un agente por rol, o un cliente con varias líneas debería poder
elegir con qué agente habla? Lo decide producto con ustedes. Lo que sí
necesitamos ya es que el rol `user` tenga agente, o saber que es a propósito.

## 3 · Las métricas de pauta mezclan las tres líneas de Terpel

`VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE` está en la base de Combustibles, pero
trae campañas de **Combustibles, Lubricantes y Lealtad (Vive Terpel)**: en
noviembre, «Resultados por campaña» muestra las tres familias. Así que
«Inversión en pauta» suma las tres líneas, y no hay forma de ver una sola.

Por eso no le pusimos «Combustibles» al dashboard: habría sido falso.

**Pedido:** poder filtrar las métricas `media_*` por la familia de la campaña.
La forma la proponen ustedes; la que nos sirve es un parámetro de panel
(`familia`), así cada línea es una pestaña con los mismos paneles. Si prefieren
registrar una métrica por línea, también funciona, y el front no cambia.

## 4 · Doce métricas de UA se calculan para Terpel y fallan todos los meses

Cada carga de Terpel termina con **8 disponibles, 2 bloqueadas y 12 con
error**. Las 12 son métricas de UA (`sales`, `orders`, `visits`,
`daily_trend`, `investment_by_platform`, `executive_summary`, …) que buscan
`GLD_ECOMM_DAILY_PERFORMANCE` y `GLD_PAID_MEDIA`, y esas tablas no existen en
Terpel. Están en el catálogo de Terpel, así que el materializador las intenta.

En Salud de feeds se ve como si a Terpel le fallara la mitad de las métricas.

**Pregunta:** ¿de dónde salen esas 12 filas del catálogo de Terpel? ¿Quedaron de
la semilla de Overview? Si es así, ¿se pueden sacar?

## Y una que es menor

**No hay forma de borrar o archivar un dashboard.** Overview sigue existiendo
en Terpel: lo sacamos de los cinco roles con
`PUT /admin/roles/{roleId}/dashboards`, pero una lista vacía significa «todos»
(`roleCanSeeDashboard`, en `dd_dashboard_access.go`). Así que **un rol nuevo
de Terpel vuelve a ver Overview**, y también uno al que se le vacíe la lista.
Un archivado lo resolvería.

Gracias.
