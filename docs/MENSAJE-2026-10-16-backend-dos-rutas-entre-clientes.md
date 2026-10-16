# Para el equipo de backend · dos rutas más que cruzan clientes · 2026-10-16

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `3651d70` el 2026-10-16**, que contiene `8272085`: el binario
corriendo acá con la base local, como admin de UA sin estar en
`PLATFORM_OPERATOR_USER_IDS`, y leídos `tenant_scope.go`, `router.go`,
`agent_handler.go` y `dd_materialize_handler.go`. Del lado del front medimos lo
nuestro primero: nuestro texto de alcance había quedado falso con su cambio y
ya lo corregimos (abajo). El detalle está en
`docs/AUDITORIA-2026-10-16-selector-de-clientes.md`.

Hola. Revisamos el aislamiento de `8272085` y anda: toda ruta con `:tenantId`
contesta 403 a un admin de otro cliente, y `GET /admin/tenants` devuelve sólo
el del token. En el front no hubo que cambiar el selector.

Encontramos **dos rutas más** que no están en la lista de abiertas de su
respuesta del 13. No llevan `:tenantId` en la ruta, así que
`RequireRouteTenant` no las ve, y el manejador tampoco compara contra el token:

1. **`GET /admin/agents?tenant_id=`** (`AgentHandler.ListByTenant`) lista los
   agentes del cliente que venga en la consulta. Además está en el grupo que
   admite `planner`, así que un planner de un cliente lee los agentes de otro.
2. **`GET /admin/materialize/runs`** (`DDMaterializeHandler.Runs`) devuelve las
   corridas del `tenant_id` que venga, o **de todos** si no viene.

**Lo que pedimos:** que las dos sigan la misma regla que las demás. Si el
`tenant_id` no es el del token, 403, salvo para un operador de plataforma. Sin
`tenant_id`, que `runs` filtre al cliente del token. El front ya manda siempre
el cliente, así que no cambia nada de nuestro lado.

Las que ustedes ya declararon abiertas —layouts, roles y dashboards por id— las
remedimos y siguen igual, como dijeron: no las volvemos a pedir.

## Lo que hicimos de nuestro lado

Clientes y Usuarios decían «Alcance · todas las cuentas», y con su cambio un
admin de un cliente ve uno solo. Ahora el rótulo cuenta lo que devuelve
`GET /admin/tenants`: «Alcance · 1 cliente».

## Lo que NO medimos

- El cruce con datos: en la base local el otro cliente no tiene agentes ni
  corridas, así que las dos rutas contestaron 200 vacías. Que cruzan sale del
  código, no de una fila vista.
- Nada contra QA: ahí sigue lo que esté desplegado.

Gracias.
