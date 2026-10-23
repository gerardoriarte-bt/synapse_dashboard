# Para el equipo de backend · Keralty y Terpel con sus usuarios de servicio · 2026-10-23

**Medido contra `26eae4b` el 2026-10-23**, con su binario en local, sobre un
cliente y un agente de prueba. El detalle está en
`docs/AUDITORIA-2026-10-23-usuarios-de-servicio.md`.

Hola. Datos creó un usuario de servicio por cliente, `SVC_SYNAPSE_KERALTY` y
`SVC_SYNAPSE_TERPEL_COMBS`, y un rol de sólo lectura para Terpel. Propusieron
que ustedes generen el par RSA con openssl y les pasen la pública.

## Lo que les proponemos en su lugar

**No hace falta openssl.** Su `POST /admin/tenants/{tenantId}/service-key` ya
genera el par, guarda la privada cifrada en la fila del cliente y devuelve la
pública con su huella. Así la privada no sale del servidor. Lo medimos:

- 201 al generar.
- 409 si ya hay llave y no viaja `rotate`.
- `rotate: true` la reemplaza.
- El `GET` devuelve la pública.

**Les pedimos que no carguen una privada a mano** en ningún secreto. El
servicio la lee de la fila del cliente, así que una cargada por fuera no se
usaría o se pisaría.

**El front ya lo hace desde la ficha del cliente**, con alcance de plataforma:

- «Generar llave», o «Reemplazar la llave» con confirmación. Muestra la
  pública sin delimitadores, lista para `ALTER USER`, y la huella.
- La conexión de F5.55, para cambiar el usuario y el rol.
- **El warehouse de cada agente.** Lo agregamos porque vive en el agente: un
  cliente con varios agentes tiene uno por agente.

## El pedido

**1 · Desplegar en QA el front de `main`** cuando entre este cambio. Les
avisamos al mergear. Con eso, el cambio de usuario lo hace un superadmin desde
la ficha y no hace falta que ustedes corran nada.

**2 · Si prefieren hacerlo ustedes sin esperar el front**, el orden importa,
porque la llave nueva corta la conexión del usuario actual:

1. `POST /admin/tenants/{tenantId}/service-key` con `{"rotate": true}` si el
   cliente ya tiene llave. Pasarle a datos la pública y la huella.
2. Esperar a que datos la registre en el usuario nuevo.
3. `PUT /admin/tenants/{tenantId}` con `snowflake_user` y, en Terpel,
   `snowflake_role: RL_BT_TERPEL_COMBS_CLIENT_BI`.
4. `PUT /admin/tenants/{tenantId}/agents/{agentId}` con `warehouse`, en
   **cada** agente del cliente.
5. `GET /admin/tenants/{tenantId}/schema-check`.

**Valores:**

| Cliente | Usuario | Rol | Warehouse |
|---|---|---|---|
| Keralty | `SVC_SYNAPSE_KERALTY` | `RL_HNO_KY_BI` · no cambia | `WH_HNO_KY_BI` |
| Terpel | `SVC_SYNAPSE_TERPEL_COMBS` | `RL_BT_TERPEL_COMBS_CLIENT_BI` | `WH_BT_TERPEL_COMBS_BI` |

**La verificación correcta** muestra el usuario nuevo y su rol,
`SYNAPSE_METRIC_CATALOG` presente y las dos tablas GLD ausentes. Lo último es
B1.26, y sigue pendiente su respuesta a
`docs/MENSAJE-2026-10-22-backend-b126-con-dos-clientes.md`.

## Tres avisos, sin pedido

1. **El warehouse del agente no se valida.** `"  WH  "` queda con los espacios
   y `""` da 200 y deja al agente sin warehouse. El `PUT` del cliente recorta y
   rechaza el vacío. El front ya lo filtra, pero un `curl` no.
2. **El chat con Cortex no manda el rol**, como les dijimos el 21. Con el
   usuario nuevo, el chat usa el rol por defecto del usuario. Datos lo cubre
   fijando `DEFAULT_ROLE`, pero si el rol del cliente cambia en la plataforma,
   el chat no se entera.
3. **Reemplazar la llave no tiene vuelta atrás**: la privada vieja se pisa.
   Hoy no se pierde nada visible, porque los dos clientes no muestran cifras.
