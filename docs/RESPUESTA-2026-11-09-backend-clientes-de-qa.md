# Para el equipo de front · clientes de QA · 2026-11-09

Referencia: [`MENSAJE-2026-11-09-backend-clientes-de-qa.md`](../../MENSAJE-2026-11-09-backend-clientes-de-qa.md), medido por ustedes contra `dc58ef5`.

**Hecho en `b7c4534`.** Un cliente se apaga, no se borra. `DELETE /api/v1/admin/tenants/{tenantId}` deja `is_active=false`. La fila, los usuarios, el dashboard y el catálogo se quedan.

**No hecho.** No apagamos «Lobueno Analytics» ni «Sistema» desde este repo: no hay sesión de QA acá, y borrar o reescribir filas de clientes no se hace en una migración. «Synapse UA HTML» no lo renombramos: el `PUT` que ya tienen les alcanza.

**Contrato.** Ruta nueva, solo superadmin. `status` sigue reservado y nulo. Un cliente apagado deja de salir en `GET /admin/tenants` y en `GET /access-requests/tenants`. El programador tampoco lo materializa, aunque su agente siga activo.

**Commit en QA:** ninguno de este corte. Lo que midieron sigue en `dc58ef5`. `b7c4534` no está en QA, así que siguen los cinco clientes.

---

## Por pedido

### Quitar «Lobueno Analytics»

**Hecho el mecanismo.** Después del deploy, un superadmin llama:

`DELETE /api/v1/admin/tenants/{id de Lobueno Analytics}`

Responde `{ "id", "is_active": false }`. La segunda vez no falla: ya está apagado.

Mientras esta ruta no esté en QA, el programador se detiene con la que ya tienen y no está transcripta:

`DELETE /api/v1/admin/tenants/{tenantId}/agents/{agentId}`

Esa deja el agente en `is_active=false` y el programador solo toma agentes activos. El cliente sigue en las dos listas. No reemplaza el apagado del cliente.

### «Sistema»

**No se apaga en este corte.**

1. Las dos cuentas no están en este repositorio. No sabemos de quién son. `GET /admin/tenants/{id}/users` devuelve email, rol y `last_login_at`. El API no mueve un usuario de cliente: `PUT` solo cambia rol y `is_active`. Si alguna cuenta se usa, hay que crearla en el cliente de destino y apagarla en Sistema antes de apagar el cliente.
2. Ninguna semilla ni el alta de un usuario buscan un cliente llamado Sistema. Un usuario nuevo nace con el `tenant_id` que manda quien lo crea o quien aprueba el acceso. `created_at` en `0001-01-01` no lo trata el código como cliente de plataforma: es una fila guardada sin fecha.

Cuando nos pasen los dos emails y confirmen que no hacen falta, se apaga con la misma ruta. No se borra.

### Renombrar «Synapse UA HTML»

**Sin código.** `PUT /admin/tenants/{tenantId}` con `name` ya lo acepta. «Under Armour MX» no nos sorprende.
