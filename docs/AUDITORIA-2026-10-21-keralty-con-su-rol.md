# Auditoría · Keralty y Terpel con su rol, en QA · 2026-10-21 (tarde)

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se miró:** QA después del despliegue. El front sale de `main` con F5.55 y
el backend de `26eae4b`. Se abrió la ficha de Keralty, se apretó «Verificar
ahora» y se leyó `schema-check` crudo de Keralty y de Terpel desde la misma
página. **Sólo lecturas**: no se guardó ninguna conexión.

Sigue a `docs/AUDITORIA-2026-10-21-keralty-sin-datos.md` y a
`docs/AUDITORIA-2026-10-21-conexion-por-cliente.md`.

---

## Lo que dice la verificación

| | Keralty | Terpel |
|---|---|---|
| Usuario de Snowflake | `LUIS_ROJAS` | `LUIS_ROJAS` |
| Rol | `RL_HNO_KY_BI` | **`SYSADMIN`** |
| Base · esquema | `DB_HNO_KERALTY.HNO_KY_MART_ANALYTICS` | `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS` |
| `GLD_ECOMM_DAILY_PERFORMANCE` | no está, o el rol no la ve | no está, o el rol no la ve |
| `GLD_PAID_MEDIA` | no está, o el rol no la ve | no está, o el rol no la ve |
| `SYNAPSE_METRIC_CATALOG` | no está, o el rol no la ve | no está, o el rol no la ve |
| Métricas sin datos | 13 | 13 |
| Catálogo | `postgres` (la semilla) | `postgres` (la semilla) |

**La conexión responde en los dos** (200, no 422 ni 502): Snowflake acepta el
usuario con ese rol.

## Lo que esto cambia del diagnóstico de la mañana

**1 · El rol propio YA ESTABA CARGADO.** Lo que se veía en el error,
`RL_BT_UA_BI`, era el rol por defecto de `LUIS_ROJAS`. Hasta `26eae4b` la
consulta no mandaba el rol guardado. Con el rol que sí estaba guardado,
**Keralty sigue sin ver nada**. Corregir el rol desde la ficha no destraba a
ninguno de los dos.

**2 · Con `SYSADMIN` tampoco aparecen las tablas en Terpel.** Con un rol tan
amplio, lo más probable es que **los objetos no existan** en ese esquema y no
que falte un permiso. `exists: false` no lo distingue, así que no está
probado. Es lo que ya esperaba la decisión B1.26: las consultas leen las
tablas Gold de UA, y esos clientes no las tienen.

## Dos hallazgos que no son de datos faltantes

**A · Los dos clientes se conectan con un usuario personal.** `LUIS_ROJAS` no
es un usuario de servicio: es el nombre de una persona, y es el mismo en los
dos clientes. Si esa persona cambia de clave, se va o pierde un rol, los dos
clientes se caen juntos. Y lo que Synapse consulta queda a nombre de una
persona.

**B · Terpel consulta con `SYSADMIN`.** Es un rol de administración de la
cuenta. Synapse sólo necesita leer el esquema del cliente, y con `SYSADMIN` una
consulta mal formada o una inyección no tiene ningún techo.

**No se corrigió ninguno.** QA es de sólo lectura para nosotros, y el usuario
y el rol correctos los define datos. Con esos valores, la corrección se hace
desde la ficha, F5.55.

## Lo que sigue

Lo ya pedido a datos sigue en pie, y ahora con la causa más clara: **qué tablas
tiene cada cliente**, y la vista del catálogo. Se suma un pedido nuevo, en
`docs/MENSAJE-2026-10-21-datos-usuario-y-rol-de-servicio.md`: **un usuario de
servicio y un rol de sólo lectura por cliente.**

## Visto de paso, nuestro

La ayuda de «faltan datos» lista las 13 métricas mezclando nombres y claves:
`conversion_funnel`, `Daily trend`, `Goals vs actual`… El nombre sale del
catálogo de Keralty, que es la semilla. La semilla nombra unas en inglés y no
tiene las otras, así que esas caen a la clave. No se arregla del lado nuestro:
el copy de datos es del catálogo, y con la vista propia de cada cliente se va.
