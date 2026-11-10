# La respuesta del backend sobre los clientes de QA, medida · 2026-11-10

**Qué llegó.** La respuesta al pedido de ordenar los clientes de QA, escrito el
2026-11-09 en `MENSAJE-2026-11-09-backend-clientes-de-qa.md`. Ese mensaje lo
escribió otra sesión y todavía no está en el repositorio. La respuesta entra sin
editar como `docs/RESPUESTA-2026-11-09-backend-clientes-de-qa.md`, idéntica a la
que publicaron en `docs/response/` de su repo.

**Medido contra `4192041` el 2026-11-10**, la cabeza de
`feature/dynamic-dashboard-backend` en `AntPack-dev/synapse-api-go`. El cambio es
`b7c4534`, publicado esa misma mañana.

## Lo que dicen y lo que el código hace

| Afirmación | Medido | Estado |
|---|---|---|
| Un cliente se apaga, no se borra | La ruta nueva —un `DELETE` sobre el cliente, `tenantHandler.Deactivate` en `router.go`; **no está transcripta en nuestro contrato**— llama a `SetActive(false)`, que hace un `UPDATE` de `is_active` y `updated_at`. Ninguna fila se borra | ✓ |
| Sólo superadmin | La ruta pasa por `RequirePlatformOperator()`; otro rol recibe 403 | ✓ |
| Sale de `GET /admin/tenants` y del formulario de acceso | `ListForAdmin` y `ListPublicOptions` filtran `is_active = true` | ✓ |
| El programador deja de materializarlo | `Targets` salta el agente si `!a.Tenant.IsActive`. **Se verificó que el cliente se carga**: `FindAll` hace `Preload("Tenant")`. Sin eso, el valor cero habría apagado el programador para todos los clientes | ✓ |
| Repetirlo no falla | `SetActive` sólo da 404 si el id no existe; sobre uno ya apagado vuelve a escribir `false` | ✓ |
| Las filas existentes nacen activas | La migración agrega la columna con `DEFAULT true`, y sólo si no existe | ✓ |
| No está en QA | Lo dicen ellos. QA sigue con los cinco clientes | Por desplegar |

**Su build y `vet` están limpios en `4192041`**, y `tests/services` y
`tests/dashboard` pasan. **`tests/handler` falla en una prueba,
`TestUserHandler_ListAll_Filtros`, y ya fallaba en `f7848dc`**, el commit
anterior: no la trajo este cambio. Y `tests/services`, que fallaba en `f7848dc`
(`TestSchemaCheck_FaltantesAfectanMetricasYClavesSinQuery`), ahora pasa.

## Lo que queda, y de quién es

**1 · Desplegar `b7c4534` en QA.** Es del backend. Va en el mismo pedido que el
de Terpel: los dos cortes están en la misma rama.

**2 · Apagar «Lobueno Analytics».** Después del despliegue lo hace un superadmin
con la ruta nueva. **El front no tiene con qué**: la ficha no ofrece apagar un
cliente y la ruta no está transcripta. Mientras tanto, la otra ruta que
mencionan —desactivar el agente— frena el programador pero deja al cliente en
las dos listas.

**3 · «Sistema».** No se apaga hasta saber de quién son sus dos cuentas. Los
correos se leen en Administración → Usuarios de QA, que es lectura. **Lo decide
el humano**, y después va igual que Lobueno.

**4 · Renombrar «Synapse UA HTML» a «Under Armour MX».** El mensaje decía que lo
haríamos nosotros con `PUT /admin/tenants/{tenantId}`, y el servicio lo acepta.
**Pero el front no lo ofrece**: la ficha edita la forma corta y la conexión, no
el nombre. Y QA es de sólo lectura para nosotros. Hace falta una de dos: que lo
haga el humano por fuera del front, o construir la edición del nombre en la
ficha. Antes de construirla se abre el `.pen` (`A2 · Ficha de cliente`).

**Y es parte de EV-003 de la evaluación de UX**: el cliente aparece como
«Synapse UA HTML» en la barra y en el menú de perfil.
