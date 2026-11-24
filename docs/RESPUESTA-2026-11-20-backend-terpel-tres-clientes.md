# Para el equipo de front · Terpel en tres clientes y zona horaria · 2026-11-20

Respuesta a `docs/MENSAJE-2026-11-20-backend-terpel-tres-clientes.md`, medido por ustedes contra `fb3ca0c`.

**Hecho en `5b917f7`.** Puntos 1 y 2 del mensaje. Los 3 y 4 son propuesta (abajo); no hay código todavía.

## 1 · Zonas IANA en QA — hecho

El binario embebe `time/tzdata` y la imagen Alpine instala `tzdata`. `America/Bogota` (y el resto) vuelve a ser válida en alta/`PUT`, y `tenantNow` / reportes dejan de caer a UTC en silencio.

En QA, cuando desplieguen: pongan `America/Bogota` a Combustibles, Lubricantes y Lealtad.

## 2 · Semilla UA y archivar dashboard — hecho

### Semilla por cliente

- Columna `tenants.seed_default_dashboard` (default `false` en clientes nuevos).
- Migración: enciende el flag solo donde ya hay Overview publicado; **Terpel queda en `false`** (nombre/label).
- Con el flag apagado: el arranque **no** siembra Overview ni métricas UA, y el materializador **salta** esas 12 claves aunque sigan en el catálogo (no se borran).
- Se puede encender/apagar con `PUT /admin/tenants/{tenantId}`:

```json
{ "seed_default_dashboard": false }
```

El DTO del cliente trae `seed_default_dashboard`.

### Archivar dashboard

| Método | Ruta | Auth |
|--------|------|------|
| `POST` | `/api/v1/admin/dashboards/{dashboardId}/archive` | admin |

Soft archive (`is_archived`, `archived_at`). No se borra. No se puede archivar el default (409): marquen otro como default antes.

En consola / roles: un archivado no cuenta. Lista vacía de `dashboard_ids` = todos los **no** archivados (Overview archivado deja de «volver»).

Para Terpel Combustibles: apaguen la semilla (migración ya lo hace) y archiven Overview tras marcar «Terpel · Pauta digital» como default.

## 3 · Un usuario en dos clientes — no hecho (propuesta)

Hoy el correo es único global y el JWT lleva un solo `tenant_id`. Lo que encaja con lo que ya tienen:

1. Tabla de membresía `user_tenants (user_id, tenant_id, role_id)` sin borrar el `users.tenant_id` actual (sigue siendo el cliente «activo»).
2. Extender `POST /auth/switch-tenant` para cualquier usuario cuya membresía incluya el destino (hoy solo `superadmin`).
3. Login: si tiene varios, devolver el activo + lista de clientes permitidos (como ya ve el superadmin).

Así no hay dos filas con el mismo correo ni se toca el cifrado de sesiones. Hasta entonces, un usuario = un cliente.

## 4 · Un agente por cliente — no hecho (propuesta, sin urgencia)

Sí se puede, sin romper reportes:

- Agente «default del cliente»: `target_role` vacío o marcador `is_tenant_default`.
- `FindByTenantAndRole`: primero el del rol; si no hay, el default del cliente.
- Reportes y chat siguen pudiendo forzar uno por rol cuando haga falta.

Mientras, los tres agentes iguales que armaron siguen válidos.

**Commit en QA:** ninguno de este corte. Lo que midieron sigue en `fb3ca0c`. `5b917f7` no está en QA hasta que lo desplieguen.

## Cómo comprobarlo

1. Alta o `PUT` con `"timezone": "America/Bogota"` → 200.
2. Mes abierto / `next_run_at` de un reporte alineados a Bogotá, no UTC.
3. Cliente Terpel: no materializa las 12 de UA; `seed_default_dashboard=false`.
4. `POST .../dashboards/{id}/archive` sobre Overview (no default) → desaparece de consola.
5. Cliente nuevo: nace sin Overview de semilla.
