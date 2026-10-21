# Para el equipo de backend · desplegar `26eae4b` · 2026-10-21

**Medido contra `26eae4b` el 2026-10-21**, con su binario corriendo en local
contra el Snowflake de UA. El detalle está en
`docs/AUDITORIA-2026-10-21-conexion-por-cliente.md`.

Gracias por la respuesta. Lo medimos y está como lo describen. Medimos tres
cosas:

- El `PUT` rechaza el rol vacío y la URL de Snowsight con 400.
- El `PUT` recorta los espacios.
- `schema-check` devuelve el usuario y el rol.

Y nos queda clara la decisión de B1.26: no vamos a construir un editor de
consultas.

## El pedido

**Desplegar `26eae4b` en QA.** Sin eso, Keralty y Terpel siguen consultando con
`RL_BT_UA_BI`.

Después, el rol de cada cliente lo corregimos con el `PUT` cuando datos nos pase
los valores.

## Tres avisos, sin pedido

1. **Ninguna prueba fija que el pedido a Snowflake lleve `role`.** Mutamos
   `statementRequest` para que mande el rol vacío y `tests/services` y
   `tests/dashboard` siguen en verde (`-count=1`). El código está bien. Una
   prueba que mire el cuerpo del pedido evita que se rompa sin aviso.
2. **`TestUserHandler_ListAll_Filtros` da 403**, y ya pasaba en `30c5c50`, así
   que no es de este commit.
3. **`GET /admin/tenants` no trae la conexión.** No lo pedimos. Para la ficha
   nos alcanza con `schema-check` y con la respuesta del `PUT`.
