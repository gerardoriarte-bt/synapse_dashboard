# Para el equipo de backend · B1.26 con dos clientes reales · 2026-10-22

**Medido contra `26eae4b` el 2026-10-22**, en QA y sólo con lecturas
(`schema-check` y el catálogo de cada cliente), más el código del sync en ese
commit. El detalle está en `docs/AUDITORIA-2026-10-22-catalogo-de-keralty-y-terpel.md`.

Hola. Gracias por `26eae4b`: en QA ya se ve con qué usuario y rol consulta cada
cliente, y con eso pudimos separar las causas.

**Datos entregó la vista `SYNAPSE_METRIC_CATALOG` de Keralty y de Terpel.**
`schema-check` la encuentra en los dos, y dice esto:

| | Métricas en la vista | Con cálculo en `MetricRegistry` |
|---|---|---|
| Keralty | 15 · medios, ATL y web | **0** |
| Terpel | 10 · medios y ATL | **0** |

Las claves son `media_investment`, `media_clicks`, `media_impressions`,
`atl_investment`, `web_sessions` y otras. Ninguna está en el registro ni en el
mapa de alias. Las tablas Gold de UA tampoco existen en sus esquemas.

## Lo que pedimos

**Decidir cómo se calculan estas métricas.** El 21 nos dijeron que B1.26 se
queda en A y que B no tiene fecha, y lo entendimos. Con estos números, en A
Keralty y Terpel no muestran ninguna cifra. Vemos tres salidas, y la decisión
es suya y de producto:

1. **Vistas con la forma de las Gold de UA en cada esquema, más alias.** Sirve
   para la inversión en medios, pero no para leads, sesiones o ATL.
2. **Sumar al registro las métricas de medios y web de estos clientes**,
   leyendo las tablas que datos indique. Cada cliente nuevo vuelve a pedir
   código.
3. **B: la consulta por métrica y por cliente.**

Del front no hace falta nada para ninguna de las tres: el panel se ancla al
`metricId` y la consola dibuja lo que llegue.

## Una pregunta chica

**¿Corremos el sync del catálogo de los dos en QA, o lo corren ustedes?** Hoy
la plataforma sirve la semilla de UA (v1, 12 métricas) en los dos clientes. Con
el sync se verían sus métricas reales, aunque bloqueadas.

## Sigue pendiente, de datos

El usuario de servicio por cliente y un rol de sólo lectura para Terpel, que
pedimos el 21. Hoy los dos siguen con `LUIS_ROJAS`, y Terpel con `SYSADMIN`.
