# Para datos · Terpel pasa a ser tres clientes: Combustibles, Lubricantes y Lealtad · 2026-11-20

**Medido contra `fb3ca0c` el 2026-11-20**: las columnas que lee cada métrica de
pauta salen de `internal/core/dashboard/snowflake/schema.go`. En QA, ese mismo
día: la consola de Terpel en noviembre, la verificación de Combustibles con
`SVC_SYNAPSE_TERPEL_COMBS`, y el alta de los dos clientes nuevos con sus
llaves.

Hola. Gracias por lo de ayer: Terpel ya consulta como
`SVC_SYNAPSE_TERPEL_COMBS` y las 8 métricas de pauta salen con cifra.

Al verlo en la consola apareció algo: **la vista de pauta de Combustibles trae
campañas de las tres líneas.** En noviembre, «Resultados por campaña» muestra
`FAMILIA_NORM` = Combustibles, Lubricantes y Lealtad, así que «Inversión en
pauta» suma las tres.

Producto decidió que **cada línea sea un cliente propio en Synapse**. En QA ya
están los tres: «Terpel Combustibles», que es el de siempre renombrado,
«Terpel Lubricantes» y «Terpel Lealtad». Para que cada uno muestre solo lo
suyo, necesitamos lo de abajo.

## 1 · Una vista de pauta por línea, con el mismo nombre y las mismas columnas

Synapse busca `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE` **sin base ni esquema**:
los pone el cliente que consulta. Si la vista se llama igual y tiene las mismas
columnas en las tres bases, el backend no cambia nada.

| Cliente | Dónde va la vista | Qué filas trae |
|---|---|---|
| Terpel Combustibles | `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS` | **Solo** `FAMILIA_NORM` = Combustibles. Hoy trae las tres |
| Terpel Lubricantes | `DB_BT_TERPEL_LUBS.BT_TERPEL_LUBS_MART_ANALYTICS` | Solo Lubricantes |
| Terpel Lealtad | La base y el esquema que ustedes definan | Solo Lealtad |

Las columnas que lee Synapse, todas en la vista actual:

`PERIODO`, `GASTO_FINAL`, `PRESUPUESTO`, `PLATAFORMA_NORM`, `CAMPANA`,
`NOMBRE_CAMPANA`, `FAMILIA_NORM`, `CUENTA_NORM`, `RESULTADO_ALCANCE`,
`RESULTADO_IMPRESIONES`, `RESULTADO_CLICS`, `RESULTADO_INTERACCIONES`,
`RESULTADO_VIEWS`, `RESULTADO_LEADS`, `META_ALCANCE`, `META_IMPRESIONES`,
`META_CLICS`, `META_INTERACCIONES`, `META_VIEWS` y `META_LEADS`.

Para comprobarlo: en cada vista,
`SELECT DISTINCT FAMILIA_NORM FROM …` devuelve un solo valor.

## 2 · El catálogo en cada esquema

Synapse lee las métricas de un cliente de la vista `SYNAPSE_METRIC_CATALOG` de
su esquema. Hoy existe en el de Combustibles. **Hace falta la misma vista en
el de Lubricantes y en el de Lealtad**, con las filas de pauta (`media_*`) y
las de ATL si aplican a esa línea.

## 3 · Lealtad: dónde vive

No tenemos los nombres. Nos dicen:

- La base y el esquema.
- El almacén virtual.
- El rol de sólo lectura.
- El agente de Cortex, si va a tener chat.

En la ficha dejamos provisionalmente `RL_BT_TERPEL_LEALTAD_CLIENT_BI`. Si el
nombre es otro, lo cambiamos.

## 4 · Un usuario de servicio por cliente, con su llave

Cada cliente generó su llave en la plataforma. La privada no sale de ahí; les
pasamos la pública, en una línea y sin encabezados.

| Cliente | Usuario de servicio | Rol | Huella de la llave |
|---|---|---|---|
| Terpel Lubricantes | `SVC_SYNAPSE_TERPEL_LUBS` | `RL_BT_TERPEL_LUBS_CLIENT_BI` | `SHA256:CBmAZPVIv4nZl2UzTI5VEiNPrqlD3TZkyNJ/vuag38Y=` |
| Terpel Lealtad | `SVC_SYNAPSE_TERPEL_LEALTAD` | el que definan | `SHA256:UfUx3xObVVX4i2UC3TGLT9u37wOSDg/J5lFz+cFiMGs=` |

Pública de Lubricantes: `<pegar desde la ficha de Terpel Lubricantes>`

Pública de Lealtad: `<pegar desde la ficha de Terpel Lealtad>`

Igual que con Combustibles: `ALTER USER … SET RSA_PUBLIC_KEY='…'`, y
`DESC USER` tiene que mostrar la huella de la tabla. Cada usuario necesita su
rol por defecto y `USAGE` sobre su almacén virtual, su base y su esquema, más
`SELECT` sobre las vistas y `USAGE` sobre su agente de Cortex.

**Combustibles no cambia**: sigue con `SVC_SYNAPSE_TERPEL_COMBS`. Una vez
separadas las líneas, ese usuario ya no necesita el rol de Lubricantes.

## Lo que nos devuelven

- Las tres vistas, con la consulta de `FAMILIA_NORM` en cada una.
- Los nombres de Lealtad.
- `DESC USER` de los dos usuarios nuevos, con su huella.

Con eso conectamos los dos clientes, cargamos los meses y verificamos que cada
uno muestre solo su línea.

Gracias.
