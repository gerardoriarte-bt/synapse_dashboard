# Para el equipo de backend · Keralty: el rol de Snowflake y las consultas de UA · 2026-10-21

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `30c5c50` el 2026-10-21**, leyendo su código; y en QA el mismo
día, sólo con lecturas, con la sesión de un `superadmin` en Keralty. Del lado del
front medimos lo nuestro primero: el error crudo repetido en cada panel y la
caída de mes que mentía eran nuestros, y ya están arreglados. El detalle está en
`docs/AUDITORIA-2026-10-21-keralty-sin-datos.md`.

---

Hola. En QA, Keralty muestra los doce paneles en error. Snowflake dice:

> Object 'DB_HNO_KERALTY.HNO_KY_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE' does
> not exist or not authorized. Your primary role RL_BT_UA_BI or one of your
> secondary roles must have at least one privilege granted on TABLE …

Encontramos dos cosas en el código.

## 1 · El rol de Snowflake del cliente no se manda

El alta de cliente pide `snowflake_role` y lo guarda. Pero
`SnowflakeConfigFromTenantAgent` no lo pasa, y el pedido de
`snowflake_sql_client.go` lleva `warehouse`, `database` y `schema`, sin `role`.
Snowflake usa el rol por defecto del usuario, que el error dice que es
`RL_BT_UA_BI`, el de UA.

**El pedido:** que la conexión use el rol guardado del cliente (el campo `role`
de la SQL API). Sin eso, si Keralty y UA comparten usuario de Snowflake, ningún
permiso del lado de datos alcanza. ¿Comparten usuario?

## 2 · Las consultas son las de UA

Las dos tablas (`DD_SNOWFLAKE_ECOMM_TABLE`, `DD_SNOWFLAKE_PAID_MEDIA_TABLE`)
valen para todos los clientes, y el SQL de cada métrica pide las columnas de UA.
Keralty no es e-commerce.

**La pregunta:** ¿cómo quieren que Synapse consulte a un cliente que no tiene el
modelo de UA? Es B1.26 del plan, «decidir cómo escala el registro antes del
segundo tenant». Las dos salidas que vemos son una vista en Snowflake que
traduzca los datos de Keralty a esa forma, o consultas configurables por
cliente. No la decidimos nosotros; nos sirve saber cuál toman para el front.

## Lo que NO medimos

- Qué commit corre en QA.
- Si las tablas existen en la base de Keralty: el error no distingue «no
  existe» de «no autorizado». Se lo preguntamos a datos.

Gracias.
