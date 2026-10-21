# Para el equipo de backend · el alta de un cliente, de punta a punta: Keralty y Terpel · 2026-10-21

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `30c5c50` el 2026-10-21**, leyendo su código. En QA, el mismo
día y con la sesión de un `superadmin`, sólo hicimos lecturas: el contexto, el
lote de paneles y `GET /admin/tenants/{tenantId}/schema-check` de cada cliente.
Del lado del front medimos lo nuestro primero: el error crudo repetido en cada
panel y la caída de mes que mentía eran nuestros, y ya están arreglados. El
detalle está en `docs/AUDITORIA-2026-10-21-keralty-sin-datos.md`.

---

Hola. Lo que necesitamos resolver es **el alta de un cliente**: que un
`superadmin`, desde la plataforma, pueda conectar un cliente nuevo a sus datos y
verlo funcionando. Hoy no se puede, y Keralty y Terpel son los dos casos.

## Lo que muestra QA

| Cliente | Paneles | Snowflake dice | `schema-check` |
|---|---|---|---|
| Keralty | Los 12 en `ERROR` | `DB_HNO_KERALTY.HNO_KY_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE` «does not exist or not authorized», rol `RL_BT_UA_BI` | Los tres objetos `exists: false` |
| Lobueno Analytics Terpel | Los 12 en `ERROR` | Lo mismo en `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS`, rol `RL_BT_UA_BI` | Los tres objetos `exists: false` |
| Lobueno Analytics (UA) | Los 12 `AVAILABLE` | — | — |

Los dos clientes tienen el catálogo de la semilla (versión 1, nunca
sincronizado) y el dashboard «Overview» de e-commerce.

## El alta, paso por paso, como está hoy

| Paso | Hoy |
|---|---|
| Crear el cliente con su conexión de Snowflake | ✓ `POST /admin/tenants` |
| **Corregir la conexión después** | ✗ `PUT /admin/tenants/{tenantId}` edita nombre, forma corta, locale, moneda y zona. «Las credenciales Snowflake no se tocan por acá» |
| **Usar el rol de Snowflake del cliente** | ✗ Se pide y se guarda, pero no se manda (ver 1) |
| Base, esquema y warehouse del agente | ✓ Se editan en el agente del cliente |
| Clave de servicio | ✓ |
| Verificar la conexión | ⚠ `schema-check` existe, pero corre con el mismo rol y sólo busca los objetos de UA |
| **Consultar datos que no tienen la forma de UA** | ✗ Ver 2 · B1.26 |
| Sincronizar el catálogo | ✓ Si existe la vista `SYNAPSE_METRIC_CATALOG`, que es de datos |
| Cargar los meses | ✓ Desde Salud de feeds |
| Componer el dashboard | ✓ En el builder |

## Lo que les pedimos

**1 · Que la conexión use el rol del cliente.** `SnowflakeConfigFromTenantAgent`
no pasa `tenant.SnowflakeRole`, y el pedido de `snowflake_sql_client.go` lleva
`warehouse`, `database` y `schema` sin `role`. Snowflake usa el rol por defecto
del usuario, `RL_BT_UA_BI`, el de UA, para Keralty y para Terpel. ¿Los tres
clientes comparten usuario de Snowflake?

**2 · Que la conexión se pueda corregir desde la plataforma.** Cuenta, usuario y
rol, como mínimo. Hoy un error en el alta no tiene arreglo sin tocar la base.

**3 · Que `schema-check` diga con qué rol miró.** Con un rol sin permiso,
«`exists: false`» no distingue «no existe» de «no lo veo», y es la respuesta que
se ve en pantalla.

**4 · Decidir cómo se consulta un cliente que no es UA.** Las tablas salen de
`DD_SNOWFLAKE_ECOMM_TABLE` y `DD_SNOWFLAKE_PAID_MEDIA_TABLE`, iguales para todos
los clientes, y el SQL de cada métrica pide las columnas de UA. Keralty y Terpel
no son e-commerce. Es B1.26 del plan: «decidir cómo escala el registro antes del
segundo tenant». Las dos salidas que vemos:
- una vista por cliente que traduzca sus datos a la forma de UA;
- consultas configurables por cliente.

Ustedes deciden; nos sirve saber cuál, porque de eso depende qué pantallas de
alta construimos.

## Lo que hace el front cuando esto esté

El alta se arma en administración, en el orden de la tabla: conexión,
verificación con su resultado a la vista, catálogo, meses y dashboard. Hoy no la
construimos, porque los pasos 2 a 4 no existen todavía.

## Lo que NO medimos

- Qué commit corre en QA.
- Si las tablas existen en esas bases: se lo preguntamos a datos.

Gracias.
