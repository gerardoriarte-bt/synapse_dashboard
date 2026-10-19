# Para el equipo de front · dos rutas entre clientes · respuesta backend · 2026-10-19

Referencia: [`MENSAJE-2026-10-16-backend-dos-rutas-entre-clientes (1).md`](../MENSAJE-2026-10-16-backend-dos-rutas-entre-clientes%20(1).md), medido por ustedes contra `3651d70`. La auditoría está en [`AUDITORIA-2026-10-16-selector-de-clientes (2).md`](../AUDITORIA-2026-10-16-selector-de-clientes%20(2).md).

**Hecho en `727547e`** (`feature/dynamic-dashboard-backend`).

**Commit en QA:** no lo sabemos desde este repo. Hay que mirar el tag o la imagen desplegada. `727547e` no está en QA hasta que se despliegue esa imagen. Lo que ustedes midieron sigue en `3651d70`.

---

## Por pedido

### 1 · `GET /admin/agents?tenant_id=`

**Hecho en `727547e`.** Si `tenant_id` no es el del token, **403** `no puedes administrar otro cliente`. Un usuario en `PLATFORM_OPERATOR_USER_IDS` puede pedir otro cliente. `admin` y `planner` siguen pudiendo llamar la ruta, dentro de su cliente.

### 2 · `GET /admin/materialize/runs`

**Hecho en `727547e`.** Otro `tenant_id` es **403**, salvo operador de plataforma. Sin `tenant_id`, un admin o planner ve solo las corridas de su cliente. Un operador sin filtro sigue viendo todas.

### Layouts, roles y dashboards por id

**No hecho.** Siguen abiertas, como en la respuesta del 13. No las volvieron a pedir.

### Pedidos 2 a 6 del 2026-10-10

**No hecho.** Super-admin, permiso de editar en el rol, `/config/me` con ver y editar, consola de otro cliente y rol al aprobar. Siguen como en la respuesta del 13.

## Contrato

| Ruta | Qué cambia |
|---|---|
| `GET /api/v1/admin/agents?tenant_id=` | 403 si el cliente no es el del token. El query sigue siendo obligatorio. |
| `GET /api/v1/admin/materialize/runs` | Sin `tenant_id`, la lista es la del token. Con otro `tenant_id`, 403. |

El cuerpo de 200 no cambia. El front que ya manda su cliente sigue igual.

## QA

Hasta desplegar `727547e`, esas dos rutas siguen cruzando clientes en lo que esté corriendo ahora.
