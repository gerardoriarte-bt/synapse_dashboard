# Para el equipo de backend · poder borrar un dashboard · 2026-10-07

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `7b717aa` el 2026-10-07**: el router leído en
`internal/adapters/handler/router.go:135-148` y el servicio de dashboards en
`internal/core/services/dd_dashboard_service.go`. Del lado del front, el builder
ya crea dashboards con `POST /admin/tenants/{tenantId}/dashboards`
(`src/api/admin.ts`, `crearDashboard`).

Hola. Reorganizamos el builder en **Cliente → Dashboard → Editor**: ahora se
elige un dashboard, se abre su editor y, si hace falta, se crea uno nuevo. Para
cerrar el ciclo nos falta una cosa de su lado.

## Lo que pedimos · `DELETE /admin/dashboards/{dashboardId}`

Hoy el router tiene `GET` y `POST` sobre `/tenants/:tenantId/dashboards` y `PUT`
sobre `/dashboards/:dashboardId`, **y no hay forma de borrar uno**. El único
`DELETE` de esa zona es el de roles (`/roles/:roleId`, soft delete).

Lo que el humano decidió, y que el front va a implementar del suyo: **borrar
pide doble verificación** —se escribe el nombre del dashboard para confirmar—.
Del lado del servicio sugerimos lo mismo que ya hacen con los roles:

| | Sugerencia |
|---|---|
| Forma | Soft delete, como `ddRoleHandler.Deactivate` |
| Si es el `is_default` | 409: primero hay que marcar otro como por defecto |
| Si algún rol lo tiene asignado (`dashboard_ids`) | 409, o quitarlo de esos roles en la misma transacción. Nos sirve cualquiera de las dos si el mensaje lo dice |
| Sus layouts | No se borran: el historial de publicaciones tiene que seguir leyéndose |
| Respuesta | 204, o 200 con el dashboard desactivado |

**Por qué lo necesitamos ya:** para medir el alta de dashboards en QA hay que
crear uno, y hoy ese dashboard de prueba queda para siempre. Lo dejamos escrito
en el cable cuando transcribimos el `POST` (2026-09-30) como la razón para no
correrlo.

Mientras no exista la ruta, **el front no muestra el botón de borrar**: un botón
que se aprieta y no hace nada es peor que uno que no está.

Gracias.
