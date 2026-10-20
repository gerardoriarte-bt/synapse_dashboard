# Auditoría · la consola por cliente, contra `d794a3e` · 2026-10-20

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se miró:** la respuesta del backend
(`docs/RESPUESTA-2026-10-20-backend-consola-por-cliente.md`), su código en
`d794a3e` —la punta de `feature/dynamic-dashboard-backend` es `673d061`, que sólo
anota el hash— y el binario de ese commit corriendo en local, con la base de
`dev/postgres` migrada. **Nada contra QA**: `d794a3e` no está desplegado.

**Para medir hizo falta un superadmin**, y la migración sólo se lo da a un id
fijo que en local no existe. Se le puso el rol a `dev@synapse.local` en la base
descartable y se le devolvió `admin` al terminar.

---

## 1 · Lo que dice la respuesta, medido

| Afirmación | Medido en local | |
|---|---|---|
| `admin` llega con `scope.kind = single_tenant` y un solo cliente | Sí | ✓ |
| `superadmin` llega con `multi_tenant` y todos los clientes | Sí, los dos clientes locales | ✓ |
| `POST /auth/switch-tenant` devuelve un token del cliente elegido | 200; el `tenant_id` del token y `data.user.tenant_id` son el elegido | ✓ |
| Con el token nuevo, `/config/me` es de ese cliente | Otro `tenant.id`, otras pestañas, otro dashboard; `scope` sigue en `multi_tenant` | ✓ |
| Catálogo y administración siguen con el token nuevo | `GET /config/catalog` y `GET /admin/tenants` → 200 | ✓ |
| Un `admin` no puede saltar | 403 `AUTH_FORBIDDEN` | ✓ |
| Sin `tenant_id` o con uno que no es UUID | 400 `VALIDATION_REQUEST`, las dos | ✓ |
| Un cliente que no existe | 404 `NOT_FOUND_TENANT` | ✓ |
| El token viejo sigue sirviendo el cliente de origen | Sí | ✓ |
| `PLATFORM_OPERATOR_USER_IDS` ya no se usa | Leído: `IsPlatformOperator` mira el rol del token | ✓ |

**Contesta dos preguntas nuestras:**
- La del #36 («¿superadmin reemplaza a la lista de operadores?»): **sí, la
  reemplaza**.
- El punto 2 de `MENSAJE-2026-10-20-backend-logo-y-consola-por-cliente.md`:
  **una sesión por cliente**, como se pidió.

## 2 · Lo que no contesta

- **El logo** (punto 1 del mismo mensaje). No hay campo ni ruta. La placa sigue
  con el monograma.
- **Si la entrada a otro cliente queda registrada.** El `.pen` pide que deje
  rastro, y `SwitchTenant` no escribe nada: firma el token y nada más.
- **Recordar el último cliente.** El backend no lo guarda. Del lado nuestro ya
  queda a medias: el cliente viaja en `?cliente=`, así que un enlace o una
  recarga vuelven a saltar solos. Un login nuevo vuelve al propio.

## 3 · Lo que se leyó en su código y no se midió

**3.1 · Cualquier admin puede dar «superadmin».** La migración crea el rol en
**cada** cliente, y `UpdateAdmin` acepta cualquier rol activo del cliente; el
alta de usuario también lo acepta por nombre. Un admin de un cliente puede
dárselo a alguien de su equipo, y esa persona cruza a todos.

**Decisión humana del 2026-10-20: por ahora se sigue el planteamiento del
backend**, y «superadmin» es de asignación interna, nunca de un cliente. El
front no lo ofrece en ninguna lista de roles —F5.51—, lo que **esconde** la
opción pero no la **impide**. Se les avisa sin pedido.

**3.2 · Un cliente nuevo no tiene el rol hasta la próxima migración.** El rol lo
crean la migración de arranque y la semilla, no el alta de cliente. Un cliente
creado desde la plataforma, hasta el próximo arranque con migraciones, daría
404 `NOT_FOUND_ROLE` al saltar. Preguntado.

**3.3 · El id del operador está fijo en la migración.** Sólo ese usuario recibe
«superadmin» al migrar. Darlo a otro es una escritura en la base.

## 4 · Lo que hizo el front

**F5.50 · la consola salta.**
- Con alcance de plataforma, un cliente elegido distinto del de la sesión pide
  el token de ese cliente.
- Da igual dónde se eligió: en la barra de la consola, o en administración o
  el builder antes de volver.
- Al saltar:
  1. guarda el token;
  2. vacía la pestaña, el período y las hojas abiertas;
  3. saca del cache todo lo que no es el contexto;
  4. reinicia el contexto.
- Si el servicio no deja saltar, lo dice con su razón, el token no cambia, no
  se reintenta solo y la salida es «Volver a la consola de <cliente>».

**El orden del vaciado lo encontró una prueba.** Con un `resetQueries` de todo,
la pestaña activa del cliente anterior se volvía a pedir **con el token del
nuevo**: el contexto todavía no había cambiado cuando se disparó. Ahora se saca
todo lo demás sin volver a pedirlo y se reinicia sólo el contexto, que deja a la
consola sin pestaña hasta que llega la nueva.

**F5.51 · «superadmin» no se ofrece.** `sinRolesInternos` en `src/api/rol.ts`,
aplicado en `useRoles` y `useRolesOf`, que alimentan todas las listas.

**El contrato:** `/auth/switch-tenant` está transcripto en
`contracts/synapse-auth.yaml` desde su `openapi.yaml` de `d794a3e`.

**Mirado en el navegador**, contra `d794a3e` en local:
- el salto desde la barra;
- administración siguiendo al cliente elegido;
- una recarga con `?cliente=` de otro cliente, que salta sola;
- el selector de rol de Usuarios, sin `superadmin`.

## 5 · Lo que falta para QA

Desplegar `d794a3e` y el front de `main`. **Después hay que volver a iniciar
sesión**: el token de hoy no trae el alcance nuevo.

**Lo que conviene mirar en QA, como José:**
1. Que `/config/me` diga `multi_tenant`.
2. Saltar a Keralty y volver.
3. Que los cinco clientes tengan el rol: si alguno se creó después de la última
   migración, el salto da 404 (§3.2).
