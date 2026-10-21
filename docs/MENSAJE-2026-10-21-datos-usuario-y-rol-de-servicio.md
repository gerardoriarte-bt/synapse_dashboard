# Para datos, con copia a backend · Keralty y Terpel: usuario y rol de servicio · 2026-10-21

**Medido contra `26eae4b` el 2026-10-21**, en QA, con `schema-check` y sólo
lecturas. El detalle está en `docs/AUDITORIA-2026-10-21-keralty-con-su-rol.md`.

Hola. Con `26eae4b` desplegado, Synapse ya consulta con el rol guardado de cada
cliente, y la verificación dice con qué usuario y rol miró:

| | Usuario | Rol | Lo que ve en su esquema |
|---|---|---|---|
| Keralty | `LUIS_ROJAS` | `RL_HNO_KY_BI` | Ninguna de las tres: `GLD_ECOMM_DAILY_PERFORMANCE`, `GLD_PAID_MEDIA`, `SYNAPSE_METRIC_CATALOG` |
| Terpel | `LUIS_ROJAS` | `SYSADMIN` | Ninguna de las tres |

Esto contesta en parte el mensaje de la mañana: el rol de Keralty ya estaba
cargado. Lo que se veía en el error (`RL_BT_UA_BI`) era el rol por defecto de
ese usuario.

## Lo nuevo que pedimos

**1 · Un usuario de servicio por cliente**, en lugar de `LUIS_ROJAS`. Hoy los
dos clientes dependen de la cuenta de una persona, y es la misma cuenta en los
dos: si cambia, se caen los dos juntos.

**2 · Un rol de sólo lectura para Terpel**, en lugar de `SYSADMIN`. Synapse
sólo necesita leer su esquema y la vista del catálogo.

Cuando nos pasen el usuario y el rol de cada uno, los cargamos desde la
plataforma y verificamos ahí mismo. La clave privada del usuario nuevo la carga
backend.

## Lo que sigue pendiente del mensaje de la mañana

Con `SYSADMIN` las tablas tampoco aparecen en Terpel, así que lo más probable es
que no existan en ese esquema. **Lo que destraba los datos sigue siendo el
inventario de tablas de cada cliente y su vista `SYNAPSE_METRIC_CATALOG`.** El
rol no alcanza.
