# Auditoría · el inventario de métricas de Terpel, antes de medirlo · 2026-10-29

**Qué se revisó:** el notebook `TERPEL_COMBS_METRICS`, que datos exportó el
2026-10-29 a las 16:54 (GMT-5) en HTML. Documenta lo que existe en
`DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS` y lo que se podría mostrar
hoy en Synapse. El archivo está en el `docs/` local sin commitear; este
documento no lo copia.

**SIN MEDICIÓN EN SNOWFLAKE.** Ninguno de los roles de quien escribe ve la base
de Terpel. Cortex Code lo intentó el 2026-10-29 con `RL_BT_UA_TRANSFORM`,
`SYSADMIN`, `DATA_TEAM_ADMIN` y `DATA_ENGINEER`, y siempre recibió el mismo
error:

```
Database 'DB_BT_TERPEL_COMBS' does not exist or not authorized.
```

**El notebook tampoco midió datos**: lo dice él mismo, «solo metadatos (sin
leer registros de negocio)». Así que lo que sigue es una lectura del notebook
contra cómo funciona Synapse, no una comprobación. **El humano pidió acceso de
lectura el 2026-10-29.** Cuando llegue, se corren las consultas de §4 y este
documento se completa. Mientras tanto, no se escribe ningún pedido a datos: la
regla es medir antes de pedir.

## En una frase

El notebook es honesto y coincide en buena parte con el catálogo que Terpel ya
tiene. Pero su grano es la campaña, y la consola cuenta por mes calendario.
Además, sugiere promediar ratios, y deja tres cálculos sin dueño. Nada de eso
se resuelve sin mirar los datos, y ninguna métrica va a mostrar una cifra
hasta que el backend la programe.

## 1. Lo que propone el notebook

| Prioridad | Fuente | Qué se mostraría | Grano |
|---|---|---|---|
| 1 | `VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS` | Inversión (`GASTO_FINAL`), presupuesto, % de ejecución, cumplimiento de la métrica principal, resultados contra meta, costos unitarios, CTR y VTR | Campaña |
| 2 | `VW_TERPEL_ATL_26` (y `_25` como histórico) | Inversión ATL total y por medio (OTV, PTV, radio, prensa, OOH), y volúmenes en tabla | Campaña + `MES` en texto |
| 3 | `COMPETENCIA_COMBS_STRUCTURED` | Conteo de apariciones por anunciante, ciudad y mes, con aviso de OCR | Fila de OCR |

Fuera del tablero quedan los chunks (`PAID_MEDIA_*`, `ORGANIC_SM_CHUNKS`,
`COMPETENCIA_COMBS_CHUNKS`), `FORMULAS_MARKETING` y cualquier benchmark de
mercado. **Esa exclusión es correcta**: no hay tabla curada de industria, y el
notebook no inventa una.

**Coincide con el catálogo de Terpel**, que datos cargó el 22 con 10 métricas:
inversión, ejecución del presupuesto, clics, impresiones, alcance,
cumplimiento de metas, ATL por medio, inversión ATL, y medios por campaña y por
plataforma (`docs/AUDITORIA-2026-10-22-catalogo-de-keralty-y-terpel.md`). Las
claves exactas se leen con la consulta 4.2.

## 2. Lo que choca con cómo funciona la consola

### 2.1 · El grano es la campaña, y la consola cuenta por mes

La consola pide un período, que es un mes calendario, y cada panel responde
por ese mes. La vista digital tiene una fila por campaña, con `FECHA_INICIO`,
`FECHA_FIN` y una columna `MES` en texto. **Falta una regla:**

- Si una campaña empieza en un mes y termina en otro, ¿a qué mes va su gasto?
  ¿Al de `MES`, al de inicio, o se reparte por días?
- ¿Cuál es el formato de `MES`? (`2026-03`, `Marzo`, `MAR-26`…) Lo mismo para
  el ATL, que no tiene ninguna fecha.

Por la misma razón, la «serie temporal sobre `FECHA_INICIO`» que propone el
notebook **no muestra cuándo se gastó**: muestra cuándo arrancó cada campaña.
`MIN_GRAIN` sería `month`, no `day`.

**Lo que mide la consulta 4.3:** cuántas campañas cruzan de mes y qué valores
toma `MES`.

### 2.2 · Los ratios se calculan sobre sumas, no promediando

El notebook propone la card «CTR `AVG(CTR_BENCHMARK)` solo OK». Ese es el
promedio de los CTR de las campañas, donde pesa igual una de 1 000 impresiones
que una de 10 millones. **El CTR del mes es `SUM(RESULTADO_CLICS) /
SUM(RESULTADO_IMPRESIONES)`.** Con los costos unitarios pasa lo mismo:
`SUM(GASTO_FINAL) / SUM(RESULTADO_*)`.

El propio notebook lo advierte («no promediar CPM/CPC/CTR crudos sin
cuidado»), pero después lo propone para la card. Es el mismo error que
encontramos en UA, donde el CVR daba 0,379 % promediando y 0,338 % con sumas
(`docs/AUDITORIA-2026-10-29-metricas-de-ua-tabla-resumen.md`).

`CTR_BENCHMARK` (que queda en NULL cuando el CTR supera 100) sirve para
**excluir filas** del cálculo, no como valor a promediar. Cuántas filas quedan
fuera lo dice la consulta 4.3.

### 2.3 · Tres cálculos que no tienen dueño

| El notebook propone | Quién lo calcularía | Por qué no el front |
|---|---|---|
| Mediana interna por `PLATAFORMA` + `MODELO_COMPRA` (+ `FAMILIA`) | La vista o el backend | El front no calcula sin un campo en el contrato |
| Parsear `NOMBRE_CAMPANA` «en el front» (es una de sus hipótesis) | La vista, como columnas | Lo mismo, y la nomenclatura cambiaría en cada cliente |
| % de ejecución sumado por familia o por mes | `SUM(GASTO_FINAL) / SUM(PRESUPUESTO)`, en el backend | Promediar `PCT_EJECUCION_PRESUPUESTO` tiene el problema de §2.2 |

### 2.4 · Los umbrales y el color

Las alertas que propone (ejecución > 110, cumplimiento < 80, calidad distinta
de OK, campañas que terminan en 7 días) **son umbrales del negocio**, y el
notebook lo reconoce. Hay dos reglas de `design.md` que aplican:

- **El color no expresa juicio, y el ámbar está prohibido.** Un umbral se
  puede mostrar como referencia escrita, pero no como semáforo.
- **«Semáforo de ejecución»** (uso declarado de `PCT_EJECUCION_PRESUPUESTO`)
  se muestra como cifra contra el 100 %: un bullet, no un color.

### 2.5 · Unidades sin declarar

- **Digital: COP**, según el notebook (columna `PRESUPUESTO`, «Presupuesto
  COP»). Lo confirma la consulta 4.3.
- **ATL: sin moneda.** Ninguna columna tiene comentario. Sin unidad no se
  puede escribir la `BASE`, y una métrica sin BASE no se publica.
- **`COSTO_PROMEDIO` es TEXT.** El notebook lo dice («por validar formato»).
  No se usa hasta que sea numérico.
- **`COMISION` e `INVERSION_TOTAL_COMISION` tienen significado por validar.**
  No se muestran como inversión hasta saber si el total ya incluye la comisión.

### 2.6 · Dos fuentes, sin un total único

Digital y ATL no comparten ni grano ni dimensiones: el ATL no tiene `FAMILIA`,
y no hay un mapa de `CUENTA` a familia. **No se suman en una sola cifra**, y
el notebook está de acuerdo. En la consola son paneles separados. Lo que sí
conviene medir es si las `CUENTA` de los dos lados coinciden (consulta 4.5).
Si no coinciden, el filtro por cuenta muestra cosas distintas en cada sección.

### 2.7 · La competencia como conteo

Contar filas de OCR por anunciante y ciudad es un indicador de presencia, no de
inversión ni de share of voice. El notebook lo marca, y la `BASE` tiene que
decirlo en pantalla: «filas extraídas por OCR de Infoanálisis, alineación
aproximada». Va en la procedencia, no en letra chica.

## 3. Lo que falta además de datos

1. **El backend tiene que programar cada métrica.** Con B1.26 en A, una fila
   en `SYNAPSE_METRIC_CATALOG` no calcula nada: cada métrica necesita su
   entrada en `MetricRegistry`. Hoy son 18 claves, todas de UA. Es la
   conclusión del 22, y sigue vigente: «sin una salida que no sea A, Keralty y
   Terpel no van a mostrar datos nunca». La decisión se pidió en
   `docs/MENSAJE-2026-10-22-backend-b126-con-dos-clientes.md`, y lo que
   corresponde ahora es esperar la respuesta.
2. **El rol de Synapse tiene que poder leer estas vistas.** La plataforma se
   conecta a Terpel con `SVC_SYNAPSE_TERPEL_COMBS` y el rol
   `RL_BT_TERPEL_COMBS_CLIENT_BI`
   (`docs/AUDITORIA-2026-10-23-usuarios-de-servicio.md`). No está verificado
   que ese rol tenga `SELECT` sobre las tres vistas. Lo dice la consulta 4.1.

## 4. Las consultas, listas para correr

Todas son de sólo lectura y no devuelven filas de detalle: sólo conteos,
sumas y valores distintos. Usan este esquema:

```sql
USE SCHEMA DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS;
```

### 4.1 · Permisos: ¿la plataforma puede leer?

```sql
SHOW GRANTS ON VIEW  VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS;
SHOW GRANTS ON VIEW  VW_TERPEL_ATL_26;
SHOW GRANTS ON VIEW  VW_TERPEL_ATL_25;
SHOW GRANTS ON VIEW  SYNAPSE_METRIC_CATALOG;
SHOW GRANTS ON TABLE COMPETENCIA_COMBS_STRUCTURED;
SHOW FUTURE GRANTS IN SCHEMA DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS;
```

**Se espera:** `SELECT` para `RL_BT_TERPEL_COMBS_CLIENT_BI` en las cinco.

### 4.2 · El catálogo que ya está cargado

```sql
SELECT METRIC_KEY, NAME, SHAPE, FAMILY, UNIT, SEMANTIC_DIRECTION, MIN_GRAIN,
       DIMENSIONS, BASE, MEASUREMENT_WINDOW
FROM SYNAPSE_METRIC_CATALOG ORDER BY METRIC_KEY;

SELECT COUNT(*) AS filas, COUNT_IF(IS_ACTIVE) AS activas FROM DD_METRIC_CURATION;
```

**Para qué:** cruzar cada clave con su columna de la vista digital o ATL, y
ver si `SEMANTIC_DIRECTION` viene en texto o en código.

### 4.3 · La vista digital

```sql
DESCRIBE VIEW VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS;

-- Tamaño, fechas y campañas que cruzan de mes (§2.1)
SELECT COUNT(*)                                   AS filas,
       COUNT(DISTINCT CAMPANA)                    AS campanas,
       MIN(FECHA_INICIO), MAX(FECHA_INICIO), MIN(FECHA_FIN), MAX(FECHA_FIN),
       COUNT_IF(DATE_TRUNC('month', FECHA_INICIO)
             <> DATE_TRUNC('month', FECHA_FIN))   AS cruzan_de_mes,
       COUNT_IF(FECHA_FIN < FECHA_INICIO)         AS fechas_invertidas
FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS;

-- El formato de MES y el gasto por mes (§2.1)
SELECT MES, COUNT(*) AS campanas, SUM(GASTO_FINAL) AS gasto, SUM(PRESUPUESTO) AS presupuesto,
       ROUND(SUM(GASTO_FINAL) / NULLIF(SUM(PRESUPUESTO), 0) * 100, 1) AS ejecucion_sobre_sumas,
       ROUND(AVG(PCT_EJECUCION_PRESUPUESTO), 1)                     AS ejecucion_promediada
FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS
GROUP BY MES ORDER BY MES;

-- ¿PCT_EJECUCION_PRESUPUESTO cierra con su fórmula? (§2.3)
SELECT COUNT_IF(PRESUPUESTO IS NULL OR PRESUPUESTO = 0) AS sin_presupuesto,
       COUNT_IF(GASTO_FINAL IS NULL)                    AS sin_gasto,
       COUNT_IF(ABS(PCT_EJECUCION_PRESUPUESTO
                    - GASTO_FINAL / NULLIF(PRESUPUESTO, 0) * 100) > 0.5) AS no_cierra
FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS;

-- CTR: promedio contra sumas, y cuántas filas son outlier (§2.2)
SELECT COUNT_IF(CTR > 100) AS ctr_outlier, COUNT_IF(VTR > 100) AS vtr_outlier,
       ROUND(AVG(CTR_BENCHMARK), 3) AS ctr_promediado,
       ROUND(SUM(IFF(FLAG_CALIDAD_DATOS = 'OK', RESULTADO_CLICS, 0))
           / NULLIF(SUM(IFF(FLAG_CALIDAD_DATOS = 'OK', RESULTADO_IMPRESIONES, 0)), 0) * 100, 3)
                                    AS ctr_sobre_sumas_ok
FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS;

-- Dimensiones: valores distintos con su conteo
SELECT 'FAMILIA' AS dim, FAMILIA AS valor, COUNT(*) AS n FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS GROUP BY 2
UNION ALL SELECT 'CUENTA', CUENTA, COUNT(*) FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS GROUP BY 2
UNION ALL SELECT 'PLATAFORMA', PLATAFORMA, COUNT(*) FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS GROUP BY 2
UNION ALL SELECT 'OBJETIVO', OBJETIVO, COUNT(*) FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS GROUP BY 2
UNION ALL SELECT 'MODELO_COMPRA', MODELO_COMPRA, COUNT(*) FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS GROUP BY 2
UNION ALL SELECT 'FLAG_CALIDAD_DATOS', FLAG_CALIDAD_DATOS, COUNT(*) FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS GROUP BY 2
ORDER BY dim, n DESC;
```

**Se espera:**

- `MES` con un formato único.
- `cruzan_de_mes` en cero, o una regla para repartir esas campañas.
- `no_cierra` en cero.
- La diferencia entre `ctr_promediado` y `ctr_sobre_sumas_ok` es la que
  justifica §2.2.

### 4.4 · ATL

```sql
DESCRIBE VIEW VW_TERPEL_ATL_26;
DESCRIBE VIEW VW_TERPEL_ATL_25;

-- ¿El total es la suma de los medios? ¿Y la comisión? (§2.5)
SELECT '26' AS anio, COUNT(*) AS filas,
       SUM(INVERSION_TOTAL) AS total,
       SUM(COALESCE(INVERSION_OTV, 0) + COALESCE(INVERSION_PTV, 0) + COALESCE(INVERSION_RADIO, 0)
         + COALESCE(INVERSION_PRENSA, 0) + COALESCE(INVERSION_OOH, 0)) AS suma_medios,
       COUNT_IF(ABS(INVERSION_TOTAL - (COALESCE(INVERSION_OTV, 0) + COALESCE(INVERSION_PTV, 0)
         + COALESCE(INVERSION_RADIO, 0) + COALESCE(INVERSION_PRENSA, 0) + COALESCE(INVERSION_OOH, 0))) > 1)
                            AS filas_que_no_suman,
       SUM(COMISION) AS comision, SUM(INVERSION_TOTAL_COMISION) AS total_con_comision
FROM VW_TERPEL_ATL_26
UNION ALL
SELECT '25', COUNT(*), SUM(INVERSION_TOTAL),
       SUM(COALESCE(INVERSION_OTV, 0) + COALESCE(INVERSION_PTV, 0) + COALESCE(INVERSION_RADIO, 0)
         + COALESCE(INVERSION_PRENSA, 0) + COALESCE(INVERSION_OOH, 0)),
       COUNT_IF(ABS(INVERSION_TOTAL - (COALESCE(INVERSION_OTV, 0) + COALESCE(INVERSION_PTV, 0)
         + COALESCE(INVERSION_RADIO, 0) + COALESCE(INVERSION_PRENSA, 0) + COALESCE(INVERSION_OOH, 0))) > 1),
       SUM(COMISION), SUM(INVERSION_TOTAL_COMISION)
FROM VW_TERPEL_ATL_25;

-- El formato de MES en ATL
SELECT MES, COUNT(*) AS filas, SUM(INVERSION_TOTAL) AS total
FROM VW_TERPEL_ATL_26 GROUP BY MES ORDER BY MES;

-- En 2025, ¿qué es INVERSION frente a INVERSION_TOTAL?
SELECT SUM(INVERSION) AS inversion, SUM(INVERSION_TOTAL) AS inversion_total,
       COUNT_IF(INVERSION <> INVERSION_TOTAL) AS filas_distintas
FROM VW_TERPEL_ATL_25;
```

**Se espera:**

- `filas_que_no_suman` en cero.
- Que `total_con_comision − total` sea igual a `comision`. Si da eso, el total
  no incluye la comisión.
- **La moneda no sale de ninguna consulta.** La tiene que decir datos.

### 4.5 · Las cuentas: ¿digital y ATL hablan de lo mismo?

```sql
SELECT DISTINCT CUENTA FROM VW_TERPEL_ATL_26
EXCEPT
SELECT DISTINCT CUENTA FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS;

SELECT DISTINCT CUENTA FROM VW_DATATERPEL_PAUTA_METAS_VS_RESULTADOS
EXCEPT
SELECT DISTINCT CUENTA FROM VW_TERPEL_ATL_26;
```

**Se espera:** las dos listas vacías, o diferencias sólo de escritura
(mayúsculas, tildes), que se corrigen en la vista.

### 4.6 · Competencia

```sql
SELECT COUNT(*) AS filas, COUNT(DISTINCT ANUNCIANTE) AS anunciantes,
       COUNT(DISTINCT CIUDAD) AS ciudades, MIN(MES), MAX(MES)
FROM COMPETENCIA_COMBS_STRUCTURED;

SELECT MES, COUNT(*) AS filas FROM COMPETENCIA_COMBS_STRUCTURED GROUP BY MES ORDER BY MES;
SELECT CATEGORIA, COUNT(*) AS filas FROM COMPETENCIA_COMBS_STRUCTURED GROUP BY CATEGORIA ORDER BY 2 DESC;

-- ¿Cuánto ruido de OCR hay en los anunciantes? Los 30 con menos filas suelen ser variantes mal leídas
SELECT ANUNCIANTE, COUNT(*) AS filas FROM COMPETENCIA_COMBS_STRUCTURED
GROUP BY ANUNCIANTE ORDER BY filas ASC LIMIT 30;
```

**Se espera:** que el notebook diga 20 680 filas, de enero de 2025 a abril de
2026. Si el último mes es abril, la sección de competencia va a mostrar el
período de la consola vacío desde mayo, y eso hay que declararlo.

## 5. Lo que sigue

1. **Llega el acceso** y se corren las consultas de §4, con Cortex Code en
   sólo lectura. Los resultados se anotan acá, con fecha.
2. Con los números, se escribe el pedido a datos con lo mismo que el de UA:
   las filas del catálogo, la regla de cálculo de cada métrica (numerador,
   denominador y cómo se lleva al mes), las correcciones que aparezcan, y las
   respuestas de §2.1 y §2.5.
3. **El pedido al backend espera la decisión de B1.26.** No se repite: ya
   está pedido desde el 22.
