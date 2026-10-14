# Para el equipo de backend · administración: alta de clientes y de usuarios · 2026-10-09

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `9dc481e` el 2026-10-09**: el binario de `9dc481e` levantado acá
con la base local. Se llamaron el alta de cliente, `schema-check`, la cola de
solicitudes de acceso con una aprobación completa, y el cambio de rol y de
estado de un usuario, incluidos los casos de error. Del lado del front medimos
primero lo nuestro: lo que ya construimos con lo que existe está al final.

Hola. Producto pidió que administración permita dar de alta clientes y usuarios
desde la pantalla. La mitad ya se puede con sus rutas, y la construimos. Para
la otra mitad les pedimos tres cosas, y una confirmación.

---

## 1 · Dar de alta un cliente sin las credenciales de Snowflake

**Decisión de producto del 2026-10-09:** el alta del cliente se hace desde la
pantalla, pero **la conexión a Snowflake no**. La configura el equipo interno
después, y el backend tiene que poder saber cuándo quedó hecha.

Hoy no se puede: `POST /admin/tenants` sin credenciales contesta **400**,
«el campo 'snowflake_url' es obligatorio; … 'snowflake_account' … 'snowflake_user'
… 'snowflake_role'».

**El pedido:** que `POST /admin/tenants` acepte un cliente con sólo `name`,
`label`, `locale`, `currency` y `timezone`, y que las credenciales se carguen
después por el camino interno. Un cliente así existe, aparece en
`GET /admin/tenants` y todavía no tiene datos.

## 2 · Que el estado de la conexión viaje con el cliente

**Ya existe la verificación:** `GET /admin/tenants/{tenantId}/schema-check`
contesta `ok`, `checked_at` y qué objetos existen. Es exactamente lo que el
dibujo de la ficha pide («Acceso vigente · Última verificación · Verificar
ahora»). Medido sobre los dos clientes locales:

- el que tiene agente → **200**, `ok: false` porque seis claves del catálogo no
  tienen consulta;
- el que no tiene agente → **404**, «el tenant no tiene un agente activo».

**El pedido:** que `GET /admin/tenants` traiga por cliente el resultado de la
última verificación —por ejemplo `data_connection: { status, checked_at }`, con
`status` entre «sin configurar», «falla» y «vigente»—, sin correr Snowflake en
cada listado. Así la lista y la ficha dicen en qué estado quedó cada alta, y un
cliente recién creado se ve como «sin configurar» en vez de como un error.

Los nombres de base, esquema y tablas que trae `schema-check` **no los vamos a
mostrar**: la regla de la pantalla es decir la consecuencia, no la plomería.

## 3 · Invitar a un usuario que no pidió acceso

El dibujo de usuarios dice «el alta es por invitación · nadie fija la contraseña
de otro». **Su backend ya tiene ese mecanismo**, pero sólo al aprobar una
solicitud: genera una contraseña temporal y la manda por correo. `POST
/admin/users`, en cambio, exige `password`.

**El pedido:** una invitación directa —cliente, rol, correo y nombre— que reuse
la contraseña temporal por correo de la aprobación. Y, si se puede, reenviarla.

## 4 · Al aprobar una solicitud, el rol lo elige quien aprueba

**Medido:** aprobar un alta pide `tenant_id` y `agent_id`, y el rol del usuario
nuevo sale de `agent.TargetRole`. En la base local el único agente de UA tiene
`target_role: admin`, **así que la persona aprobada entró como admin**. Una
solicitud llega desde el formulario público del login.

El front ya le muestra a quien aprueba «Entra como admin» antes de apretar. Pero
lo correcto es que el rol sea una elección y no una consecuencia del agente.
**El pedido:** que la aprobación acepte `role_id`, del mismo cliente, y use el
del agente sólo si no viene.

## 5 · Una confirmación · cambiar rol y suspender

Construimos sobre `PUT /admin/tenants/{tenantId}/users/{userId}`, medido acá:
cambia `role_id` o `is_active` por separado; con el usuario bajo otro cliente da
404, y con un rol de otro cliente da 400. **Les pedimos que lo confirmen contra
QA**, que es donde lo va a usar alguien.

No usamos el `DELETE` de esa misma ruta: hace lo mismo que poner
`is_active: false`, y ofrecer «suspender» y «dar de baja» como dos acciones
prometería dos cosas distintas.

---

## Lo que construimos de nuestro lado, con lo que ya existe

- **Clientes y su ficha en una sola pantalla**: la lista a la izquierda, la
  ficha del elegido a la derecha. Dos clientes con el mismo nombre se
  distinguen por la forma corta o por el comienzo del id.
- **Los usuarios del cliente dentro de su ficha**, con
  `GET /admin/tenants/{tenantId}/users`.
- **Usuarios con filtros por cliente, rol y estado**, agrupados por cliente, y en
  cada fila **cambiar rol y suspender o reactivar**. La fila propia no ofrece
  acciones.
- **La cola de solicitudes de acceso**, con aprobar y rechazar. La contraseña
  temporal que devuelve la aprobación no se muestra: va por correo.

## Lo que NO medimos

- Nada de esto contra QA: todo fue contra el binario local.
- Si el correo sale. En el código, sin correo configurado se registra una
  advertencia y no se envía; nos dijeron que en producción está y que lo
  validan ustedes.
- Cuánto tarda `schema-check`, que es la razón de pedir el estado guardado en
  vez de correrlo en cada listado.

Gracias.
