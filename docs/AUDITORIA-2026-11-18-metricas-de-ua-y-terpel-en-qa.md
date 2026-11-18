# Las métricas nuevas de UA y Terpel, medidas en QA · F6.3 · 2026-11-18

**Medido el 2026-11-18, sólo leyendo.** Las fuentes fueron cuatro:

- **QA**: `GET /admin/tenants/{tenantId}/catalog/data` de enero a noviembre de
  2026, el `schema-check` y la llave de servicio de Terpel.
- **La consola de UA MX abierta.**
- **Snowflake**, con las mismas consultas del pedido de B6.2, en
  `RL_BT_UA_TRANSFORM` y con agregados.
- **El backend**, en `fb3ca0c`.

## En corto

- **UA: las nueve métricas nuevas dan lo mismo que Snowflake**, de enero a
  octubre. Las tres excepciones tienen su causa: el LTV, que cambia cada día; el
  nCAC, que llega sin decimales; y noviembre, que es el mes abierto.
- **La serie del nCAC llega sin decimales**: 28 donde Snowflake da 27,86. Es
  del backend: toda serie `time_series` se redondea a entero.
- **Terpel no muestra ninguna cifra**: Snowflake rechaza su llave con
  `401 · JWT token is invalid`. No es del registro de métricas, es la
  conexión.
- **La carga de enero a septiembre de UA terminó**: los nueve meses están al
  día. La de julio a septiembre no se había llegado a ver.

## 1 · UA · las nueve de B6.2

**Los cinco de `KPISQL`, la dependencia de promoción y el LTV**, en QA:

| Mes | RPV | CVR | AOV | ROAS pagado | Presupuesto | Promoción | LTV |
|---|---|---|---|---|---|---|---|
| 2026-01 | 1,2655 | 1,3452 | 94,07 | 7,9866 | 101,43 | 80,73 | 134,49 |
| 2026-02 | 0,3292 | 0,3136 | 104,99 | 5,5993 | 98,37 | 63,22 | 154,14 |
| 2026-03 | 0,782 | 0,8793 | 88,94 | 7,9739 | 103,23 | 75,85 | 123,04 |
| 2026-04 | 0,3983 | 0,4228 | 94,21 | 6,5295 | 96,35 | 61,55 | 125,63 |
| 2026-05 | 0,6034 | 0,5081 | 118,78 | 4,3047 | 100,6 | 75,93 | 154,64 |
| 2026-06 | 0,3834 | 0,3566 | 107,49 | 4,7145 | 103,6 | 85,36 | 140,08 |
| 2026-07 | 0,4088 | 0,4046 | 101,05 | 6,7787 | 105,18 | 81,73 | 123,04 |
| 2026-08 | 0,8277 | 0,8391 | 98,63 | 8,8092 | 95,68 | 82,65 | 117,54 |
| 2026-09 | 0,3856 | 0,3376 | 114,24 | 6,6992 | 76,18 | 79,2 | 129,32 |
| 2026-10 | 0,4555 | 0,4505 | 101,11 | 6,848 | 73,63 | 73,78 | **117,25** |

**De enero a octubre, todas son iguales a Snowflake hasta el último decimal**,
salvo el LTV de octubre: 117,25 en QA y 118,08 en Snowflake. No es un error:
el LTV es lo acumulado por la cohorte hasta hoy y cambia cada día. QA lo
calculó anoche. **Septiembre lo muestra con claridad**: el 9 de noviembre daba
122,97 y hoy 129,32.

**Noviembre difiere en todo**, y también está bien: es el mes abierto, QA lo
calculó anoche y Snowflake suma un día más.

**El top 10 coincide** en los cuatro meses que se miraron. Enero, mayo,
septiembre y octubre tienen diez productos, el mismo primero y la misma cifra
del décimo.

**La serie del nCAC trae las doce cohortes** que terminan en el mes elegido,
con las fechas correctas. Pero **sin decimales**:

| Cohorte | QA | Snowflake |
|---|---|---|
| 2025-11 | 37 | 37,24 |
| 2026-08 | 22 | 21,85 |
| 2026-09 | 28 | 27,86 |
| 2026-10 | 25 | 25,26 |

**La causa está en el backend.** `transformTimeSeries`, en
`internal/core/dashboard/materialize/transform.go`, aplica `roundInt` a cada
punto, y es así desde `a1a72fc`, del 2026-09-09. Vale para toda métrica
`time_series`. En los seguidores de Instagram no importa; en un costo de 20 a 56
USD es un error de hasta 2 %. `transformComposition` hace lo mismo con cada
parte.

**En la consola abierta**, noviembre: el AOV es 108,21 con «USD · POR ORDEN», y
el CVR 1,09 %. Los dos son iguales al servicio, y sus comparativos están bien
calculados: el AOV +7,0 % contra octubre (108,21 / 101,11) y el CVR +142,2 %
(1,0912 / 0,4505).

## 2 · Terpel · las de B6.1

| Mes | Las ocho de pauta | Las dos de ATL |
|---|---|---|
| 2026-09 | Sin cifra: nunca se calculó | Sin cifra |
| 2026-10 | **`ERROR`** en las ocho | Sin cifra, como se esperaba |

**El error es el mismo en las ocho**, de la corrida del 2026-11-18 a las
03:02 UTC:

> `snowflake sql: status 401: 390144 · JWT token is invalid.`

**El `schema-check` de Terpel da lo mismo**: 502 con ese error. **La llave de
servicio existe** en la ficha, con la huella
`SHA256:Cyi1O/TefLNZj3+nGL2PTKDkJIoht1UCAQ2Re+kIrJc=`.

Según `docs/AUDITORIA-2026-10-23-usuarios-de-servicio.md`, un 401 de JWT
significa que **la llave no está registrada en el usuario de Snowflake, o la
huella no coincide**. **No pudimos comprobar cuál de las dos es.**

- `DESC USER SVC_SYNAPSE_TERPEL_COMBS` pide `MONITOR` sobre el usuario, que
  `RL_BT_UA_TRANSFORM` no tiene. El dueño del usuario es `ACCOUNTADMIN`.
- No hay ruta para leer con qué usuario se conecta Terpel hoy: sólo la devuelve
  el `PUT` que la cambia, y no se escribió en QA.

**Lo que lo destraba es de datos**: con `ACCOUNTADMIN`, comparar el
`RSA_PUBLIC_KEY_FP` del usuario con la huella de arriba, y registrar la
pública si no coincide. Es el paso 2 de
`docs/INSTRUCCIONES-2026-10-27-llaves-de-keralty-y-terpel.md`. Después,
«Verificar ahora» en la ficha y «Cargar meses».

## 3 · La carga de enero a septiembre de UA

Terminó. Los nueve meses están al día, con 31 a 33 métricas con cifra según el
mes: 33 de enero a marzo, 32 en junio y julio, y 31 en abril, mayo, agosto y
septiembre. Faltan siempre las ocho sin fuente (pronósticos, MMM, `category_mix`
y `mer_total`). Además, TikTok no tiene cifra desde abril, e Instagram tampoco
en abril, mayo, agosto y septiembre.

## 4 · Qué queda

- **Backend**: que `time_series` y `composition` no redondeen a entero.
- **Datos**: la llave de Terpel.
- **Front**: F6.3 queda en ⚠️, con UA verificada y Terpel bloqueada por la
  conexión.
