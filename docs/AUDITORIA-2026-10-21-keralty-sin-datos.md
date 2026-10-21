# Auditoría · por qué Keralty y Terpel no muestran datos en QA · 2026-10-21

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se miró:**
- QA, con la sesión del humano como `superadmin`, entrando a la consola de
  Keralty (cliente 2b5008f3-be5c-4d0a-8c0c-060c04826228). **Sólo lecturas.** Abrir la consola cambió la sesión a
  Keralty con `POST /auth/switch-tenant`, que emite un token y no escribe datos.
- El código del backend en `30c5c50`, la punta de
  `feature/dynamic-dashboard-backend`. **No sabemos qué commit corre en QA**:
  lo que sigue del código es lectura, no medición en QA.

---

## 1 · Lo que muestra QA

| | Medido en QA |
|---|---|
| Paneles | **Los 12 en `ERROR`**, en octubre y en septiembre |
| El error | `Object 'DB_HNO_KERALTY.HNO_KY_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE' does not exist or not authorized. Your primary role RL_BT_UA_BI or one of your secondary roles must have at least one privilege granted on TABLE …`. El panel de inversión por plataforma, lo mismo con `GLD_PAID_MEDIA` |
| Dashboard | «Overview», la semilla: Sales, Investment, ROAS, Orders… en inglés |
| Catálogo | Las 12 métricas de la semilla, `catalog_version: 1`: nunca se sincronizó desde Snowflake |
| Fuentes | Cuatro, las cuatro `unknown`: `erp → ecomm`, `ads_api → paid_media`, y dos sin tabla |
| Agente del chat | «Keralty», sólo para el rol `Planner` |

**Terpel es el mismo caso**, medido igual el mismo día: «Lobueno Analytics
Terpel» tiene los 12 paneles en `ERROR`, el mismo rol `RL_BT_UA_BI` y las mismas
dos tablas de UA dentro de `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS`.
Catálogo de la semilla y «Overview», igual que Keralty. «Lobueno Analytics», el
de UA, tiene los 12 `AVAILABLE`.

**`GET /admin/tenants/{tenantId}/schema-check`** —una lectura— da `ok: false` en
los dos: `GLD_ECOMM_DAILY_PERFORMANCE`, `GLD_PAID_MEDIA` y
`SYNAPSE_METRIC_CATALOG` con `exists: false`. **Corre con el mismo rol**, así que
eso no distingue «no existe» de «no lo ve».

## 2 · Por qué, leído en su código

**2.1 · El rol de Snowflake del cliente no se usa.** El alta de cliente exige
`snowflake_role` y lo guarda cifrado. Pero:
- `SnowflakeConfigFromTenantAgent` arma la conexión con cuenta, usuario, clave,
  base, esquema y warehouse, y **sin el rol**;
- el pedido a la SQL API (`snowflake_sql_client.go`) manda `warehouse`,
  `database` y `schema`, **y no `role`**.

Snowflake usa entonces el rol por defecto del usuario, y el mensaje dice cuál es:
**`RL_BT_UA_BI`**. Por el nombre es el de UA. Si Keralty y UA comparten usuario
de Snowflake, ningún permiso que se dé al rol de Keralty va a servir hasta que
el backend lo mande.

**2.2 · Las consultas son las de UA.** El materializador califica dos tablas
con la base y el esquema del agente de Keralty:
- `GLD_ECOMM_DAILY_PERFORMANCE` y `GLD_PAID_MEDIA`;
- sus nombres salen de dos variables de entorno, **iguales para todos los
  clientes**;
- el SQL de cada métrica, escrito en Go, pide las quince columnas de UA
  (`REV_TOTAL`, `ORDERS_TOTAL`, `COST_USD`…).

Ver `docs/snowflake/CONTRATO-DE-TENANT.md`. **Es B1.26** —«decidir cómo escala
el registro, antes del segundo tenant»—, que sigue abierta. Keralty es ese
segundo cliente.

**2.3 · La conexión no se puede corregir desde la plataforma.**
`PUT /admin/tenants/{tenantId}` edita nombre, forma corta, locale, moneda y zona;
su comentario dice que las credenciales de Snowflake no se tocan por ahí. Un rol
mal cargado en el alta no tiene arreglo desde la pantalla.

**2.4 · No sabemos si las tablas existen.** El mensaje de Snowflake dice
«does not exist **or** not authorized» y no distingue. Lo sabe quien pueda
consultar esa base con un rol que la vea.

## 3 · Qué hace falta, y de quién

| # | Qué | De quién |
|---|---|---|
| 1 | Que la conexión use el rol de Snowflake de cada cliente | Backend · §2.1 |
| 1b | Que la conexión se pueda corregir desde la plataforma, y que `schema-check` diga con qué rol miró | Backend · §2.3 |
| 2 | Que los roles de Keralty y de Terpel puedan leer sus bases | Datos |
| 3 | Saber si ahí existen tablas con esa forma, o cuáles hay | Datos · §2.4 |
| 4 | Decidir cómo consulta Synapse a un cliente que no tiene el modelo de UA: una vista que lo traduzca, o consultas por cliente | Backend y datos · B1.26 |
| 5 | La vista `SYNAPSE_METRIC_CATALOG` de Keralty, y sincronizar el catálogo | Datos |
| 6 | Qué métricas y qué dashboard tiene Keralty: hoy ve el de e-commerce de UA | Producto |

**El objetivo es el alta de un cliente**: que un `superadmin` lo conecte y lo
vea funcionar desde la plataforma. El 1 y el 2 destraban la conexión; del 3 al 6
es el alta de un cliente que no es e-commerce, y no tienen arreglo rápido. Los
pedidos al backend están en `MENSAJE-2026-10-21-backend-alta-de-cliente.md`. La receta de alta escrita para UA
está en `docs/snowflake/INSTRUCCION-ALTA-TENANT.md`, y el inventario que hace
falta antes de definir métricas en `docs/snowflake/COMO-ENTREGAR-UNA-METRICA.md`.

## 4 · Lo que era nuestro, y se arregló

**4.1 · El error crudo, doce veces.**
- Cada panel repetía el texto de Snowflake, con base, esquema y rol, para
  cualquiera que entrara.
- Debajo de cada uno decía «El resto de los paneles cargó normalmente», que
  era falso.

**F5.53**: si dos o más paneles fallan con el mismo mensaje, la consola lo dice
una vez sobre la grilla, con cuántos paneles alcanza y «Reintentar todos». Cada
panel apunta al aviso. **El texto del servicio sólo lo ve quien administra**,
detrás de «Ver el detalle técnico».

**4.2 · La caída de mes mentía.**
- Con todo en error, la consola caía a septiembre —que fallaba igual— y decía
  «2026-10 todavía no tiene datos calculados».
- La caída es para el mes que todavía no se calculó.

**F5.54**: si algún panel falló, se queda en el mes abierto con su falla.

**Mirado en el navegador** en local, con los paneles de un cliente puestos en
`ERROR` con el texto de Keralty en la base descartable, y devueltos después.
