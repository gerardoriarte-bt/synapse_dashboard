# Auditoría · la conexión por cliente, contra `26eae4b` · 2026-10-21

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se miró:**

- La respuesta del backend, `docs/RESPUESTA-2026-10-21-backend-alta-de-cliente.md`.
- Su código en `26eae4b`. La punta es `d296e6d`, que sólo anota el hash.
- El binario de ese commit corriendo en local, con la base de `dev/postgres` y
  contra el Snowflake real del cliente de UA.

**Nada contra QA**: `26eae4b` todavía no está desplegado.

Sigue a `docs/AUDITORIA-2026-10-21-keralty-sin-datos.md` y contesta
`docs/MENSAJE-2026-10-21-backend-alta-de-cliente.md`.

---

## Lo que dicen, contra lo que hay

| Pedido | Dicen | Medido |
|---|---|---|
| 1 · Mandar el rol del cliente | Hecho | **Sí, leído en el código.** `SnowflakeConfigFromTenantAgent` copia `tenant.SnowflakeRole`, y los dos pedidos a `/api/v2/statements` pasan por `statementRequest`, que pone `role`. Es la única construcción de `sqlAPIRequest`. **Ninguna prueba lo fija**: ver abajo |
| 2 · Corregir la conexión | Hecho | **Sí, medido.** Un `PUT` con `"  "` en el rol da **400** («snowflake_role no puede ser vacío»). Una URL de Snowsight da **400**. El mismo rol con espacios da **200**, y la respuesta lo devuelve recortado |
| 3 · `schema-check` dice con qué rol miró | Hecho | **Sí, medido**: trae `snowflake_user: SYNAPSE_SERVICE_USER` y `snowflake_role: SYNAPSE_APP_ROLE`, con los tres objetos en `exists: true` |
| 4 · B1.26 | Se queda A, B sin fecha | **Decidido por ellos.** Cierra la pregunta: no hay consultas por cliente en este corte |

El chat con Cortex sigue sin mandar el rol. Lo dicen ellos, y se ve en el
código: `ticket_handler.go` arma su propia `SnowflakeAgentConfig` sin `Role`.

## Lo que encontró la medición

**1 · El envío del rol no tiene prueba.** Se mutó `statementRequest` para que
mande el rol vacío, conservando el import para que compile. **Las pruebas de
`tests/services` y `tests/dashboard` siguen en verde, sin caché.** Sus pruebas
nuevas cubren la config (`cfg.Role`) y el `schema-check`, no el cuerpo del
pedido. El código está bien hoy. El riesgo es que alguien lo rompa sin que nada
avise. Se les dice como aviso, sin pedido.

La primera corrida de la mutación no compiló (`strings` sin uso) y la segunda
salió «(cached)». Ninguna de las dos demostraba nada. La que vale es la
tercera, con `-count=1`.

**2 · El listado de clientes no trae la conexión.** `GET /admin/tenants` no
devuelve `snowflake_user`, `snowflake_role`, `snowflake_account` ni
`snowflake_url`, y no hay una ruta que lea un solo cliente por su id. La conexión
actual sólo se lee de dos lugares:

- La respuesta del `PUT`.
- `schema-check`, que trae el usuario y el rol, pero no la cuenta ni la URL.

Para la pantalla alcanza: `schema-check` es lo que la ficha ya planea mostrar
como «Última verificación · Verificar ahora». No se pide nada.

**3 · `tests/handler` ya estaba roja.** `TestUserHandler_ListAll_Filtros` da 403
también en `30c5c50`, así que no la trajo este commit. Se les avisa.

## Lo que esto destraba, y lo que no

**El alta que pueden hacer, con este contrato**, la escriben ellos mismos:

1. Crear el cliente.
2. Corregir la cuenta, el usuario, el rol y la URL.
3. Ver `schema-check` con el rol.
4. Sincronizar el catálogo, si la vista existe.
5. Materializar.

**Del front, lo que falta es la conexión en la ficha**: editar esos cuatro
campos y verificar con `schema-check`. El `.pen` la dibuja en
`A2 · Ficha · tenant en alta`, con «VERIFICAR AHORA». **No se construyó**. Se
abre el `.pen` antes, y es decisión del humano tomarla.

**Lo que no destraba:** si Keralty y Terpel no tienen las tablas Gold de UA,
siguen sin datos aunque el rol sea el correcto. Lo dicen ellos con todas las
letras: el dashboard de UA no le sirve a un cliente que no es e-commerce, y no
hay fecha para las consultas por cliente.

**El orden en QA:**

1. Backend despliega `26eae4b`.
2. Datos nos dice el rol, y el usuario si es otro, de cada cliente. Ya está
   preguntado en `docs/MENSAJE-2026-10-21-datos-keralty-y-terpel.md`.
3. Alguien corre el `PUT` con esos valores. Sin pantalla, es un `curl` de un
   superadmin.
4. Correr `schema-check`. Lo que diga ahí decide si falta permiso, falta la
   tabla o falta la vista.
