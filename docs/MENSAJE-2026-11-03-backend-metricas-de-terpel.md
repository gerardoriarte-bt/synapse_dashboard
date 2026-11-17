# Para el equipo de backend · las métricas de Terpel · 2026-11-03

**Medido contra `db91b5d` el 2026-11-03**, leyendo su rama
`feature/dynamic-dashboard-backend`: `MetricRegistry`, los alias, cómo se arman
las tablas de cada corrida y qué formas sabe transformar el materializador. Del
lado de Snowflake, cada cifra de este mensaje se midió ese mismo día con
`RL_BT_TERPEL_COMBS_CLIENT_BI`, el rol que datos dio para Synapse, sólo con
agregados. Las consultas y sus salidas van al final.

Hola. Datos entregó el 2026-10-29 las vistas de Terpel con sus reglas de
cálculo, y producto decidió seguir con la opción A de B1.26: **cada métrica, una
entrada en `MetricRegistry`**. Este mensaje pide esas entradas, con el SQL de
cada una y la cifra que tiene que dar.

Es la tarea B6.1 del plan (`plan-fase-6.md`). El 2026-10-22, en QA,
`schema-check` marcaba las diez métricas del catálogo de Terpel sin consulta, y
en `db91b5d` siguen sin ella: la consola de Terpel no puede mostrar ninguna
cifra.

## 1 · Lo que encontramos en su código

**Ninguna clave de Terpel está registrada.** `MetricRegistry`, en
`internal/core/dashboard/snowflake/queries.go`, y el mapa de alias, en
`keys.go`, sólo tienen claves de UA. Ninguna coincide con las de Terpel, así
que tampoco chocan.

**Los nombres de las tablas son los mismos para todos los clientes.**
`SnowflakeGoldTableNamesFromEnv`, en `dd_materializer_service.go`, los toma de
variables de entorno (`DD_SNOWFLAKE_ECOMM_TABLE` y las demás), y lo único que
cambia por cliente es la base y el esquema del agente (`Tables.Qualified`). Las
vistas de Terpel tienen otros nombres, así que **hace falta una forma de que sus
consultas las nombren** sin cambiar lo que lee UA. Puede ser un campo nuevo en
`Tables` con su variable, o un nombre de tabla por cliente; eso lo deciden
ustedes.

**La base y el esquema ya son los correctos.** El 2026-10-22 `schema-check`
encontró `SYNAPSE_METRIC_CATALOG` en el esquema del agente de Terpel, y las
vistas nuevas viven en el mismo:
`DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS`.

**No hace falta ninguna forma nueva.** El materializador ya transforma
`scalar`, `categorical`, `tabular` y `composition`, que son las cuatro que pide
el catálogo de Terpel.

**Falta un rótulo en pesos.** Los escalares usan `LabelTotal` o `LabelUSDTotal`
(`materialize/presentation.go`), y las cifras de Terpel están en pesos
colombianos. Proponemos `COP · TOTAL`.

**Y `MetricColumnUsage` necesita sus entradas.** Su propio comentario en
`schema.go` dice que una columna usada en `MetricRegistry` se declara ahí, y es
lo que deja que `schema-check` diga qué columnas faltan en Terpel.

## 2 · Lo que pedimos

Datos dividió las métricas en dos tandas. **La A se puede programar ya. La B
también, con dos métricas que por ahora quedan bloqueadas a propósito.**

**Las diez son de la familia `media`** en el catálogo, con la forma que
indica cada una abajo. **Todas leen la misma vista**, salvo las dos de ATL:
`VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE`, con `PERIODO` como fecha al primer día
del mes. El período se filtra con `PERIODO >= ? AND PERIODO < ?`, que
`periodBindings` ya liga de a pares.

**Una regla vale para todas: se suma, nunca se promedia la columna de la
campaña.** Datos lo midió con el CTR: promediado da 3,436 y sobre sumas da
1,407.

### Tanda A · cinco escalares

| Clave | Qué es | Cálculo del mes | Rótulo |
|---|---|---|---|
| `media_investment` | Gasto de pauta digital | `SUM(GASTO_FINAL)` | `COP · TOTAL` |
| `media_budget_execution` | Gasto sobre presupuesto, en % | `SUM(GASTO_FINAL) / SUM(PRESUPUESTO) * 100`, sólo con las filas donde los dos existen y `PRESUPUESTO <> 0` | `TOTAL` |
| `media_clicks` | Clics | `SUM(RESULTADO_CLICS)` | `TOTAL` |
| `media_impressions` | Impresiones | `SUM(RESULTADO_IMPRESIONES)` | `TOTAL` |
| `media_reach` | Alcance | `SUM(RESULTADO_ALCANCE)` | `TOTAL` |

Una sola consulta da las cinco, igual que `KPISQL` da las de UA:

```sql
SELECT ROUND(SUM(GASTO_FINAL), 2)        AS media_investment,
       SUM(RESULTADO_CLICS)              AS media_clicks,
       SUM(RESULTADO_IMPRESIONES)        AS media_impressions,
       SUM(RESULTADO_ALCANCE)            AS media_reach,
       ROUND(SUM(IFF(GASTO_FINAL IS NOT NULL AND PRESUPUESTO IS NOT NULL AND PRESUPUESTO <> 0, GASTO_FINAL, 0))
           / NULLIF(SUM(IFF(GASTO_FINAL IS NOT NULL AND PRESUPUESTO IS NOT NULL AND PRESUPUESTO <> 0, PRESUPUESTO, 0)), 0)
           * 100, 2)                     AS media_budget_execution
  FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE
 WHERE PERIODO >= ? AND PERIODO < ?
```

**Lo que tiene que dar**, medido el 2026-11-03:

| Mes | `media_investment` | `media_clicks` | `media_impressions` | `media_reach` | `media_budget_execution` |
|---|---|---|---|---|---|
| 2026-07 | 452 448 460,49 | 2 513 191 | 201 419 686 | 56 240 991,33 | 102,88 |
| 2026-08 | 317 840 972,07 | 1 537 642 | 122 365 172 | 51 917 519,83 | 94,97 |
| 2026-09 | 603 703 707,59 | 3 063 656 | 212 390 902 | 78 026 859,50 | 97,25 |
| 2026-10 | 1 228 325 244,91 | 10 954 437 | 207 282 797 | 67 625 306 | 122,50 |

**Estas cifras se mueven**, porque datos sigue cargando: entre su entrega del 29
y nuestra medición del 3 la vista pasó de 3 322 a 3 323 filas. Si al
comprobarlas difieren un poco, conviene correr la consulta de nuevo antes de
buscar un error.

**La ejecución puede pasar de 100 %**, y es dato, no error: en octubre el gasto
supera al presupuesto. Por eso el catálogo la declara sin dirección (`—`).

### Tanda B · tres que se calculan

**`media_goal_attainment` · `categorical`.** Real sobre meta de cada KPI, en %.
Sólo cuentan las filas con meta, y la meta distinta de cero. Es la misma figura
que `goal_attainment` de UA:

```sql
SELECT etiqueta AS label, ROUND(real / NULLIF(objetivo, 0) * 100, 1) AS v
  FROM (
    SELECT 'Alcance' AS etiqueta,
           SUM(IFF(META_ALCANCE IS NOT NULL AND META_ALCANCE <> 0, RESULTADO_ALCANCE, 0)) AS real,
           SUM(IFF(META_ALCANCE IS NOT NULL AND META_ALCANCE <> 0, META_ALCANCE, 0))     AS objetivo
      FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE
     WHERE PERIODO >= ? AND PERIODO < ?
    UNION ALL
    -- igual para Impresiones (META_IMPRESIONES · RESULTADO_IMPRESIONES),
    -- Clics (META_CLICS · RESULTADO_CLICS),
    -- Interacciones (META_INTERACCIONES · RESULTADO_INTERACCIONES),
    -- Reproducciones (META_VIEWS · RESULTADO_VIEWS)
    -- y Leads (META_LEADS · RESULTADO_LEADS)
  )
 ORDER BY label
```

Septiembre de 2026 tiene que dar:

| KPI | % | Filas con meta |
|---|---|---|
| Alcance | 98,1 | 81 |
| Clics | 102,4 | 81 |
| Impresiones | 98,8 | 81 |
| Interacciones | 114,3 | 78 |
| Leads | 44,4 | 10 |
| Reproducciones | 66,6 | 21 |

**Leads y Reproducciones salen de pocas campañas**, 10 y 21. El porcentaje es
correcto, pero conviene saberlo antes de leer un 44 % como una caída.

**`media_by_platform` · `tabular`.** Una fila por plataforma del mes, cortada
por `PLATAFORMA_NORM` y no por `PLATAFORMA`: datos unificó las variantes de
escritura. Los costos son gasto sobre resultado, nunca el promedio de la
columna `CPC` o `CPM` de la campaña:

```sql
SELECT PLATAFORMA_NORM                                                   AS plataforma,
       ROUND(SUM(GASTO_FINAL), 2)                                        AS gasto,
       SUM(RESULTADO_CLICS)                                              AS clics,
       SUM(RESULTADO_IMPRESIONES)                                        AS impresiones,
       ROUND(SUM(GASTO_FINAL) / NULLIF(SUM(RESULTADO_CLICS), 0), 2)       AS cpc,
       ROUND(SUM(GASTO_FINAL) / NULLIF(SUM(RESULTADO_IMPRESIONES), 0) * 1000, 2) AS cpm
  FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE
 WHERE PERIODO >= ? AND PERIODO < ?
 GROUP BY 1
 ORDER BY gasto DESC NULLS LAST
```

En septiembre son 24 plataformas. Las cuatro primeras: YouTube con
127 283 840, Facebook/Instagram con 111 211 318, DV360 con 106 563 104 y TikTok
con 101 085 840,76. **Hay plataformas sin clics o sin impresiones** —Rappi trae
gasto y ningún resultado, LinkedIn trae clics y cero impresiones—, así que un
costo sale nulo, y eso es correcto. No hay que convertirlo en cero.

**`media_by_campaign` · `tabular`.** Una fila por campaña del mes, con
`PRESUPUESTO`, `GASTO_FINAL`, `PCT_EJECUCION_PRESUPUESTO` y
`PCT_CUMPLIMIENTO_METRICA_PRINCIPAL` tal como vienen en la fila. **Datos pone
una condición**: en las campañas con `MODELO_COMPRA_NORM = 'OTRO'` el
cumplimiento de la métrica principal no se puede interpretar. Proponemos
devolverlo nulo en esas filas y no sacar la campaña. En septiembre son 90
filas de campaña, y 4 tienen modelo `OTRO`.

### Tanda B · dos que quedan bloqueadas

**`atl_investment` y `atl_by_medium` no se pueden ubicar en un período.** La
vista de ATL trae `MES` como «Abril» o «MAYO», sin año, y `PERIODO` viene nulo
en las 85 filas. Datos decidió no inventar el año, y tiene razón. Además `MES`
mezcla mayúsculas, así que agrupar por ese texto podría partir un mes en dos.

**Pedimos registrarlas con `Blocked: true`** y esta razón para el usuario:

> El reporte de medios ATL no trae el año de cada mes, así que todavía no se
> puede ubicar en un período.

Cuando datos agregue el año, se calculan con `SUM(INVERSION_TOTAL)` y con la
participación de `INVERSION_OTV`, `INVERSION_PTV`, `INVERSION_RADIO`,
`INVERSION_PRENSA` e `INVERSION_OOH` sobre el total del mes, que es como la
entrega las define. **`atl_trps` no está en el catálogo**: datos la dejó
inactiva porque no hay definición de TRP.

## 3 · Cómo vamos a comprobarlo

Cuando esté en QA, desde nuestro lado (F6.3):

1. «Cargar meses» de julio a octubre de 2026 para Terpel, desde Salud de feeds.
2. **Los cinco escalares y `media_goal_attainment` salen `AVAILABLE`**, y cada
   cifra coincide con la consulta de arriba en el mismo mes.
3. Las dos de ATL salen `BLOCKED` con la razón.
4. Abrimos la consola de Terpel y la miramos, no sólo el cable.

## 4 · Lo que no les toca, para que no lo busquen

- **El alcance sumado entre campañas cuenta dos veces a una persona** que vio
  dos campañas. Es la regla que datos escribió, y la vamos a hablar con ellos.
  Para ustedes la cuenta es `SUM`.
- **Hay 6 campañas con período en diciembre de 2026 y ninguna en noviembre.**
  Es dato de la vista; tampoco cambia el código.

Gracias.

---

## Anexo · las consultas, tal como corrieron

Todas el 2026-11-03, con `USE ROLE RL_BT_TERPEL_COMBS_CLIENT_BI` en la misma
llamada. `CURRENT_ROLE()` devolvió ese rol. La herramienta muestra las fechas entre comillas
triples; acá van sin ellas.

**La tanda A por mes:**

```sql
SELECT PERIODO, ROUND(SUM(GASTO_FINAL),2) AS media_investment, SUM(RESULTADO_CLICS) AS media_clicks, SUM(RESULTADO_IMPRESIONES) AS media_impressions, SUM(RESULTADO_ALCANCE) AS media_reach, ROUND(SUM(IFF(GASTO_FINAL IS NOT NULL AND PRESUPUESTO IS NOT NULL AND PRESUPUESTO <> 0, GASTO_FINAL, 0)) / NULLIF(SUM(IFF(GASTO_FINAL IS NOT NULL AND PRESUPUESTO IS NOT NULL AND PRESUPUESTO <> 0, PRESUPUESTO, 0)),0)*100, 2) AS media_budget_execution FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE WHERE PERIODO >= '2026-07-01' AND PERIODO < '2026-11-01' GROUP BY 1 ORDER BY 1;
```
```
PERIODO,MEDIA_INVESTMENT,MEDIA_CLICKS,MEDIA_IMPRESSIONS,MEDIA_REACH,MEDIA_BUDGET_EXECUTION
2026-07-01,452448460.49,2513191,201419686,56240991.3333,102.88
2026-08-01,317840972.07,1537642,122365172,51917519.8333,94.97
2026-09-01,603703707.59,3063656,212390902,78026859.5,97.25
2026-10-01,1228325244.91,10954437,207282797,67625306,122.5
```

**El cumplimiento de metas de septiembre**, con las seis ramas escritas enteras:

```
LABEL,V,REAL,OBJETIVO,FILAS
Alcance,98.1,78026859.5,79558183,81
Clics,102.4,3063656,2992851,81
Impresiones,98.8,212390902,214993455,81
Interacciones,114.3,3853344,3371552,78
Leads,44.4,42180,95062,10
Reproducciones,66.6,9654021,14494321,21
```

**Las plataformas de septiembre**, con la consulta de §2:

```
PLATAFORMA_NORM,GASTO,CLICS,IMPRESIONES,CPC,CPM
YouTube,127283840,26546,9960205,4794.84,12779.24
Facebook/Instagram,111211318,308136,104829872,360.92,1060.87
DV360,106563104,323879,28184559,329.02,3780.9
TikTok,101085840.76,1366315,45326482,73.98,2230.17
Mobile Citi,25027778,1300,150717,19252.14,166058.1
TapTap,25000000,7443,1256260,3358.86,19900.34
Rappi,15601851.85,NULL,NULL,NULL,NULL
LinkedIn,13750000,26490,0,519.06,NULL
Logan,13687168,236519,2223633,57.87,6155.32
Google Demand Gen,10592845.82,504566,7571080,20.99,1399.12
Instagram,9933956,154752,2391418,64.19,4154
Cinecolor,7674236,NULL,123548,NULL,62115.42
Fifty. io,7000000,2330,538600,3004.29,12996.66
La Gogo,6700000,21624,7418740,309.84,903.12
Lead Genios,5000000,2660,204616,1879.7,24436.02
Link Factor,4991000,2241,222616,2227.13,22419.77
Logan Ads,4037036.85,4920,363506,820.54,11105.83
Google Ads,3442613.57,16535,272178,208.2,12648.39
Google Display,3121168.73,41646,281483,74.95,11088.3
Facebook,1999950,15754,1071389,126.95,1866.69
Pulzo,0,NULL,NULL,NULL,NULL
RCN,0,0,0,NULL,NULL
Google Search,0,0,0,NULL,NULL
Claro Media,NULL,NULL,NULL,NULL,NULL
```

**Las campañas de septiembre:**

```sql
SELECT COUNT(*) AS campanas, COUNT_IF(MODELO_COMPRA_NORM = 'OTRO') AS modelo_otro FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE WHERE PERIODO = '2026-09-01';
```
```
CAMPANAS,MODELO_OTRO
90,4
```

**ATL sin período:**

```sql
SELECT COUNT(*), COUNT_IF(PERIODO IS NULL), COUNT(DISTINCT MES) FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_TERPEL_ATL_26_ENTREGA_SYNAPSE;
```
```
COUNT(*),COUNT_IF(PERIODO IS NULL),COUNT(DISTINCT MES)
85,85,6
```

```sql
SELECT MES, COUNT(*), SUM(INVERSION_TOTAL) FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_TERPEL_ATL_26 GROUP BY 1 ORDER BY 1;
```
```
MES,COUNT(*),SUM(INVERSION_TOTAL)
Abril,24,828600765
Enero,11,142371642
Febrero,16,289790741
JUNIO,1,18518519
MAYO,15,634427667
Marzo,18,398425881
```
