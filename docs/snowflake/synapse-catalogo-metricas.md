x&nbsp;

15-sep-2026  ·  Tenant: UA México  ·  Ambiente: Snowflake productivo

**Catálogo de métricas de Synapse**

**Entrega B1.22–B1.26**

Qué se construyó en Snowflake para el catálogo de métricas de Synapse, dónde está cada objeto y cómo se verificó, para que otros equipos puedan conectarse y evaluarlo.

&nbsp;

&nbsp;

| Alcance de este equipo: solo Snowflake. Nuestro trabajo son B1.22, B1.23 y B1.24. B1.25 es de backend y B1.26 es de arquitectura y producto. Se incluyen solo para explicar qué son y qué deja listo Snowflake para ellos. |
| :---- |

**Contenido**

00   Resumen

01   Dónde apuntar · conexión, objetos y config.

02   Cómo fluye la información

03   Objetos nuevos

04   Tablas fuente que lee el materializador

05   B1.22 · Crear el catálogo

06   B1.23 · Escribir el gobierno

07   B1.24 · Alinear las claves

08   B1.25 · Fuera de alcance · lo hace backend

09   B1.26 · Fuera de alcance · decide arquitectura y producto

10   Consultas para evaluar

11   Pendientes

12   Anexo

**00   Resumen**

| Tarea | Qué pedía | Responsable | Estado |
| :---- | :---- | :---- | :---- |
| B1.22 | Crear el catálogo en Snowflake y dar permiso de lectura al backend | Datos | **✅ Hecho y verificado** |
| B1.23 | Redactar la base, la fuente y la ventana de cada métrica, con firma | Datos \+ producto | **✅ Hecho y firmado · 3 puntos a confirmar en queries.go** |
| B1.24 | Que cada clave del catálogo exista en el registro de Go | Datos | **✅ Hecho en Snowflake · falta correr el materializador** |
| B1.25 | Que MEASUREMENT\_WINDOW llegue a la API y al front | Backend | **➖ Fuera de nuestro alcance · Snowflake ya entrega la columna** |
| B1.26 | Decidir cómo escala el modelo al segundo tenant | Arquitectura \+ producto | **➖ Fuera de nuestro alcance · es una decisión, no un cambio** |

&nbsp;

**Lo que cambia para el backend:** make sync-catalog ya tiene de dónde leer. Antes fallaba porque SYNAPSE\_METRIC\_CATALOG no existía en ninguna base de la cuenta, y el catálogo que servía la API salía de una semilla de Postgres.

**Lo que no cambió:** ninguna tabla Gold se modificó. Todo lo nuevo son 2 tablas y 2 vistas.

**01   Dónde apuntar · conexión, objetos y configuración**

**1.1 · Conexión**

| Dato | Valor |
| :---- | :---- |
| Identificador de cuenta | LOBUENO-ANALYTICS (organización LOBUENO, cuenta ANALYTICS) |
| URL | https://LOBUENO-ANALYTICS.snowflakecomputing.com |
| Localizador · región | maa16864 · Azure East US 2 |
| Base de datos | DB\_BT\_UA |
| Esquema | BT\_UA\_MART\_ANALYTICS |
| Warehouse usado en esta entrega | SYNAPSE\_UA |
| Rol dueño de los objetos nuevos | RL\_BT\_UA\_TRANSFORM |
| Rol del backend de Synapse | SYNAPSE\_APP\_ROLE (a confirmar contra tenants.snowflake\_role) |
| Rol para revisar a mano | RL\_BT\_UA\_BI |

**1.2 · Mapa de objetos · a qué apuntar**

Nuevos · creados en esta entrega

| Nombre completo | Tipo | Quién lo lee | Para qué |
| :---- | :---- | :---- | :---- |
| DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.SYNAPSE\_METRIC\_CATALOG | Vista | Backend · dd\_catalog\_sync\_service.go (make sync-catalog) | El catálogo. Es el único objeto nuevo al que apunta el backend |
| DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.DD\_METRIC\_CURATION | Tabla | Datos · para editar | Textos y firma de cada métrica. Es la fuente de la vista anterior |
| DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.SYNAPSE\_METRIC\_CATALOG\_ISSUES | Vista | Datos, QA | Validación: debe dar cero filas antes de sincronizar |
| DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.DD\_EXPECTED\_METRIC\_KEYS | Tabla | Datos, QA | Copia de las claves y alias de Go |

&nbsp;

Existentes · de donde el backend saca los valores (no se modificaron)

| Nombre completo | Tipo | Quién lo lee | Métricas que salen de aquí |
| :---- | :---- | :---- | :---- |
| DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.GLD\_ECOMM\_DAILY\_PERFORMANCE | Dynamic table | Backend · dd\_materializer\_service.go (make materialize) | revenue, spend, roas, orders, sessions, units, goal\_attainment, daily\_trend, media\_efficiency\_12m |
| DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.GLD\_PAID\_MEDIA | Vista | Backend · dd\_materializer\_service.go | platform\_return |

Existentes · origen de los datos (no apuntar directo: alimentan las tablas Gold)

| Nombre completo | Tipo | Alimenta a |
| :---- | :---- | :---- |
| DB\_BT\_UA.BT\_UA\_RAW\_INGEST.RAW\_UA\_MX\_ECOMM\_SUMMARY | Tabla raw · ECOMM Summary del cliente | GLD\_ECOMM\_DAILY\_PERFORMANCE |
| DB\_BT\_UA.BT\_UA\_RAW\_INGEST.RAW\_UA\_MICROSOFT\_ADS | Tabla raw · Microsoft Ads | GLD\_ECOMM\_DAILY\_PERFORMANCE (COST\_MICROSOFT) |

&nbsp;

Existentes · que Synapse lee por fuera del catálogo (dato para B1.26)

| Nombre completo | Tipo | Nota |
| :---- | :---- | :---- |
| DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.VW\_MMM\_HEALTH | Vista | Salud del modelo MMM. Ver Dashboard\_ua/DOCUMENTACION\_MMM.md |
| DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.MMM\_MODEL\_METRICS\_HIST | Tabla | Métricas históricas del MMM. Ver Dashboard\_ua/DOCUMENTACION\_MMM.md |

&nbsp;

No apuntar

| Objeto | Por qué |
| :---- | :---- |
| SV\_SYNAPSE\_UA\_ANALYTICS y demás vistas semánticas | El materializador no las usa: lee las tablas Gold directo. Sus claves no sirven para el catálogo |

**1.3 · Configuración del backend para UA MX**

El backend arma cada nombre como \<agents.snowflake\_db\>.\<agents.snowflake\_schema\>.\<objeto\>. Por eso el catálogo y las dos tablas Gold tienen que estar en el mismo esquema, y lo están.

| Dónde se configura | Campo | Valor para UA MX |
| :---- | :---- | :---- |
| Postgres · tabla agents | snowflake\_db | DB\_BT\_UA |
| Postgres · tabla agents | snowflake\_schema | BT\_UA\_MART\_ANALYTICS |
| Postgres · tabla tenants | snowflake\_role | **SYNAPSE\_APP\_ROLE ⚠️ a confirmar** |
| Variable de entorno | DD\_SNOWFLAKE\_ECOMM\_TABLE | GLD\_ECOMM\_DAILY\_PERFORMANCE (valor por defecto) |
| Variable de entorno | DD\_SNOWFLAKE\_PAID\_MEDIA\_TABLE | GLD\_PAID\_MEDIA (valor por defecto) |
| Fijo en el código | Nombre de la vista del catálogo | SYNAPSE\_METRIC\_CATALOG |

&nbsp;

Prueba rápida de que el rol del backend llega a todo (correr con SYNAPSE\_APP\_ROLE):

| USE ROLE SYNAPSE\_APP\_ROLE; SELECT 'catalogo' AS OBJETO, COUNT(\*) AS FILAS FROM DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.SYNAPSE\_METRIC\_CATALOG UNION ALL SELECT 'ecommerce',   COUNT(\*) FROM DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.GLD\_ECOMM\_DAILY\_PERFORMANCE UNION ALL SELECT 'paid\_media',  COUNT(\*) FROM DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.GLD\_PAID\_MEDIA; |
| :---- |

&nbsp;

Esperado: 3 filas con conteos mayores que cero. Un error de permisos indica cuál de los tres objetos falta.

**1.4 · Quién puede leer qué**

El esquema tiene permisos futuros: toda tabla o vista nueva recibe SELECT automáticamente para estos roles. Se comprobó con SHOW FUTURE GRANTS IN SCHEMA y, en la vista del catálogo, con SHOW GRANTS ON VIEW.

| Rol | Uso | Permiso sobre los objetos nuevos |
| :---- | :---- | :---- |
| RL\_BT\_UA\_TRANSFORM | Ingeniería de datos · crea y edita | Dueño |
| SYNAPSE\_APP\_ROLE | Backend de Synapse | SELECT (permiso futuro desde el 10-abr-2026) |
| RL\_BT\_UA\_BI | Dashboards, Streamlit | SELECT |
| RL\_BT\_UA\_CLIENT\_VIEWER | Lectura del cliente | SELECT |

&nbsp;

| No hace falta ningún GRANT manual. Si un objeto se recrea con CREATE OR REPLACE, los permisos vuelven solos: se comprobó al recrear la vista del catálogo el 15-sep. |
| :---- |

**02   Cómo fluye la información**

| SNOWFLAKE \- DB\_BT\_UA   BT\_UA\_RAW\_INGEST    RAW\_UA\_MX\_ECOMM\_SUMMARY \-----+   (ECOMM Summary del cliente)    RAW\_UA\_MICROSOFT\_ADS \--------|                                 v BT\_UA\_MART\_ANALYTICS    GLD\_ECOMM\_DAILY\_PERFORMANCE \-+   (dynamic table \- ya existia)    GLD\_PAID\_MEDIA \--------------+   (vista \- ya existia)      \--- NUEVO \-----------------------------------------------------    DD\_METRIC\_CURATION              tabla \- textos y firma de cada metrica      \-\> SYNAPSE\_METRIC\_CATALOG     vista \- lo que lee el backend      \-\> SYNAPSE\_METRIC\_CATALOG\_ISSUES   vista \- que esta mal y por que    DD\_EXPECTED\_METRIC\_KEYS         tabla \- claves que Go sabe calcular   BACKEND GO (Synapse)    dd\_catalog\_sync\_service.go  \<-- lee SYNAPSE\_METRIC\_CATALOG       |  make sync-catalog       v    Postgres \- catalogo       |    dd\_materializer\_service.go  \<-- lee las 2 tablas Gold con MetricRegistry       |  make materialize       v    API  GET /config/catalog  ·  POST /config/panels:batch       |       v FRONT \- consola (PanelShell) |
| :---- |

&nbsp;

**Dos lecturas separadas:**&nbsp;

**•**  El catálogo dice qué es cada métrica: nombre, forma, base, ventana y fuente. Se lee de SYNAPSE\_METRIC\_CATALOG.

**•**  Los datos dicen cuánto vale. El materializador los calcula con el SQL escrito en Go (MetricRegistry), directo sobre las dos tablas Gold. No usa la capa semántica (SV\_SYNAPSE\_UA\_ANALYTICS).

&nbsp;

Las dos lecturas se unen por METRIC\_KEY. Si una clave del catálogo no existe en Go, el panel sale bloqueado. Eso es lo que controla B1.24 y lo que discute B1.26.

**03   Objetos nuevos**

Los cuatro están en DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS y los creó RL\_BT\_UA\_TRANSFORM el 15-sep-2026.

**3.1 · SYNAPSE\_METRIC\_CATALOG · vista · la que lee el backend**

Una fila por métrica publicable. Filtra DD\_METRIC\_CURATION por IS\_ACTIVE \= TRUE.

| \# | Columna | Tipo | Qué es | Valores válidos |
| :---- | :---- | :---- | :---- | :---- |
| 1 | METRIC\_KEY | VARCHAR | Clave estable. La usan paneles, jobs y front. No se renombra | Debe existir en DD\_EXPECTED\_METRIC\_KEYS |
| 2 | NAME | VARCHAR | Título del panel | Texto libre |
| 3 | SHAPE | VARCHAR | Forma del dato; decide cómo se transforma y se pinta | scalar, scalar\_with\_interval, time\_series, multi\_series, categorical, ranking, tabular, prose, composition |
| 4 | FAMILY | VARCHAR | Familia; de aquí sale el color de la serie | demand, media, inventory, customer, external |
| 5 | LAYER | VARCHAR | Capa de origen | BRONZE, SILVER, GOLD |
| 6 | SOURCE | VARCHAR | Procedencia legible por una persona | Texto libre |
| 7 | BASE | VARCHAR | El denominador: sobre qué se calcula | Texto libre |
| 8 | UNIT | VARCHAR | Unidad | USD, %, x, un sustantivo, o NULL |
| 9 | SEMANTIC\_DIRECTION | VARCHAR | Si subir es bueno | HIGHER\_IS\_BETTER o NULL (ver 6.4) |
| 10 | MIN\_GRAIN | VARCHAR | Grano mínimo | day, week, month |
| 11 | DIMENSIONS | ARRAY | Por dónde se puede desagregar | Hoy \[\] en todas |
| 12 | MEASUREMENT\_WINDOW | VARCHAR | Período que mide la métrica | Texto libre · el backend todavía no la lee: es B1.25 |

&nbsp;

Las columnas 1 a 11 tienen exactamente los nombres que espera el SELECT de dd\_catalog\_sync\_service.go. Si se renombra una, falla toda la sincronización, no una métrica.

**3.2 · DD\_METRIC\_CURATION · tabla · la que se edita**

Es la tabla de fondo de la vista anterior. Aquí se escriben los textos.

| Columna | Tipo | Notas |
| :---- | :---- | :---- |
| METRIC\_KEY | VARCHAR NOT NULL, PK | Snowflake no hace cumplir la PK: la semilla usa MERGE para no duplicar |
| SEMANTIC\_OBJECT | VARCHAR | Referencia opcional a INFORMATION\_SCHEMA.SEMANTIC\_METRICS. NULL en las 10 |
| NAME, SHAPE, FAMILY, LAYER, SOURCE, BASE, MEASUREMENT\_WINDOW | VARCHAR NOT NULL | Igual que en la vista |
| UNIT, SEMANTIC\_DIRECTION | VARCHAR | Igual que en la vista |
| MIN\_GRAIN | VARCHAR NOT NULL | month en las 10, porque el backend (ParsePeriod) solo acepta YYYY-MM |
| DIMENSIONS | ARRAY |  |
| IS\_ACTIVE | BOOLEAN, default TRUE | FALSE saca la métrica del catálogo sin borrar sus textos |
| CURATED\_BY | VARCHAR | Quién revisó y firmó. Vacío o con forma \<...\> \= sin firmar |
| UPDATED\_AT | TIMESTAMP\_NTZ |  |

&nbsp;

**3.3 · SYNAPSE\_METRIC\_CATALOG\_ISSUES · vista · control de calidad**

Lista cada fila activa que rompería el front o el materializador. Debe devolver cero filas antes de sincronizar. No filtra la vista principal a propósito: una fila mala tiene que verse, no desaparecer del dashboard en silencio.

Columnas: METRIC\_KEY · COLUMNA (tipo de problema) · VALOR · RAZON.

| Problema (COLUMNA) | Qué detecta | Qué pasaría si se publica |
| :---- | :---- | :---- |
| SHAPE | Forma fuera de las 9 | El materializador devuelve ErrUnknownShape: sincroniza bien y el panel falla después |
| FAMILY | Familia fuera de las 5 | La serie se pinta sin color, sin error |
| LAYER | Capa fuera de las 3 | Procedencia inválida en el front |
| MIN\_GRAIN | Grano fuera de los 3 | El selector de período no sabe agrupar |
| SIN REVISAR | Queda el marcador ⟨REVISAR⟩ en base, fuente o ventana | Se pinta el marcador en pantalla |
| SIN FIRMA | CURATED\_BY vacío o con forma \<...\> | Texto de gobierno que nadie respalda |
| CLAVE DESCONOCIDA | La clave no está en DD\_EXPECTED\_METRIC\_KEYS | El panel sale BLOQUEADO sin explicación |
| CLAVE BLOQUEADA | La clave resuelve a una métrica que Go trae bloqueada | Panel que solo puede salir bloqueado |
| SEMANTIC\_OBJECT | Referencia a la capa semántica que ya no existe | Definición técnica perdida |

&nbsp;

**3.4 · DD\_EXPECTED\_METRIC\_KEYS · tabla · espejo del registro de Go**

Snowflake no puede leer el código Go. Esta tabla es una copia a mano de las claves que el backend sabe calcular (MetricRegistry) y de sus alias (keys.go). Con ella, la vista de problemas detecta claves mal escritas.

| Columna | Tipo | Qué es |
| :---- | :---- | :---- |
| METRIC\_KEY | VARCHAR NOT NULL | Clave o alias que acepta el backend |
| CANONICAL\_KEY | VARCHAR NOT NULL | Clave de MetricRegistry a la que resuelve |
| IS\_ALIAS | BOOLEAN | TRUE si es alias de keys.go |
| BLOCKED | BOOLEAN | TRUE si el backend la trae con Blocked: true |
| BLOCKED\_REASON | VARCHAR | Razón escrita en el backend |
| UPDATED\_AT | TIMESTAMP\_NTZ |  |

Contenido (20 filas):

| Clave canónica | Alias | Bloqueada |
| :---- | :---- | :---- |
| revenue | sales | No |
| spend | investment | No |
| roas | — | No |
| orders | — | No |
| sessions | visits | No |
| units | — | No |
| goal\_attainment | goals\_vs\_actual | No |
| daily\_trend | — | No |
| media\_efficiency\_12m | twelve\_month\_efficiency | No |
| platform\_return | investment\_by\_platform | No |
| exec\_resumen | executive\_summary | **Sí · Requires BT\_UA\_DECISION\_LOG actionable framework (not in Snowflake Gold yet)** |
| month\_decisions | decisions | **Sí · misma razón** |

&nbsp;

| Regla de mantenimiento: quien agrega una clave o un alias en keys.go la agrega en esta tabla en el mismo cambio. Si no, la vista de problemas la marca como desconocida. |
| :---- |

**04   Tablas fuente que lee el materializador**

No se modificaron. Se documentan porque de ellas salen los textos del catálogo y porque son el "contrato" que discute B1.26.

El backend las resuelve por variable de entorno y las califica como \<agent.db\>.\<agent.schema\>.\<tabla\>:

| Variable | Valor por defecto |
| :---- | :---- |
| DD\_SNOWFLAKE\_ECOMM\_TABLE | GLD\_ECOMM\_DAILY\_PERFORMANCE |
| DD\_SNOWFLAKE\_PAID\_MEDIA\_TABLE | GLD\_PAID\_MEDIA |

&nbsp;

| Los nombres de tabla son configurables; los de columna no, porque están escritos dentro del SQL de cada query en Go. |
| :---- |

&nbsp;

**4.1 · GLD\_ECOMM\_DAILY\_PERFORMANCE · dynamic table**

| Dato | Valor (verificado 15-sep) |
| :---- | :---- |
| Tipo | Dynamic table · refresco incremental · lag 1 hora · warehouse WH\_BT\_UA\_BI · dueño SYSADMIN |
| Tamaño | 91 columnas · 2.557 filas · una fila por día |
| Origen | BT\_UA\_RAW\_INGEST.RAW\_UA\_MX\_ECOMM\_SUMMARY (ECOMM Summary del cliente) \+ BT\_UA\_RAW\_INGEST.RAW\_UA\_MICROSOFT\_ADS (solo campañas %ECOMM%) |

Las 11 columnas que usa el backend y de dónde salen:

| Columna Gold | Columna del reporte del cliente | Qué es |
| :---- | :---- | :---- |
| DATE | DATE\_(MAIN) | Día |
| REV\_TOTAL | \_REVENUE\_USD\_TOTAL\_ADOBE\_ | Venta total del sitio · Adobe Analytics · USD |
| ORDERS\_TOTAL | ORDERS\_TOTAL\_ADOBE | Órdenes · Adobe |
| UNITS\_TOTAL | UNITS\_TOTAL\_ADOBE | Unidades · Adobe |
| VISITS\_TOTAL | VISITS\_TOTAL\_ADOBE | Visitas · Adobe |
| GROSS\_SPEND | \_SPEND\_GROSS\_TOTAL\_ | Inversión bruta total |
| REV\_TARGET | \_REVENUE\_USD\_TOTAL\_TARGET\_ | Meta de venta |
| ORDERS\_TARGET | ORDERS\_TOTAL\_TARGET | Meta de órdenes |
| UNITS\_TARGET | UNITS\_TOTAL\_TARGET | Meta de unidades |
| VISITS\_TARGET | VISITS\_TOTAL\_TARGET | Meta de visitas |
| BUDGET\_TARGET | \_DAILY\_BUDGET\_GROSS\_TARGET\_ | Meta de presupuesto bruto |

&nbsp;

**Hallazgos que afectan la lectura**

**1\.**  La inversión bruta incluye un fee de agencia de \~9.5%. NET\_SPEND es la suma de los costos por plataforma (Meta, Google, Criteo, RTB, TikTok, Snap, Microsoft). AGENCY\_FEE \= GROSS\_SPEND − NET\_SPEND. Mes a mes, GROSS\_SPEND / NET\_SPEND da 1.095; mayo da 1.116.

**2\.**  La inversión está en USD. Se comparó NET\_SPEND contra SUM(COST\_USD) de GLD\_PAID\_MEDIA por mes. Si fuera MXN, el ratio rondaría 17–20.

| Mes 2026 | NET\_SPEND ecomm | COST\_USD plataformas | Ratio |
| :---- | :---- | :---- | :---- |
| Ene | 68.225 | 72.267 | 0.94 |
| Feb | 57.948 | 163.487 | 0.35 |
| Mar | 73.786 | 91.916 | 0.80 |
| Abr | 43.766 | 99.147 | 0.44 |
| May | 137.253 | 276.505 | 0.50 |
| Jun | 91.154 | 191.172 | 0.48 |
| Jul | 77.477 | 122.259 | 0.63 |
| Ago | 65.602 | 112.200 | 0.58 |
| Sep (parcial) | 25.816 | 61.203 | 0.42 |

&nbsp;

El ratio es menor que 1 porque el reporte de ecommerce solo cuenta campañas ECOMM y GLD\_PAID\_MEDIA las cuenta todas.

**3\.**  Hay filas futuras hasta dic-2028 con valores en 0\. El reporte del cliente trae las metas de planeación. Ver sección 11, aviso a backend.

**4\.**  El reporte trae 7 metas: venta, órdenes, unidades, visitas, presupuesto, ROAS y COS. El backend usa 5\.

**5\.**  ROAS\_TOTAL \= REV\_TOTAL / GROSS\_SPEND en la propia tabla. Es el ROAS bruto: venta total sobre inversión total, no incremental.

**4.2 · GLD\_PAID\_MEDIA · vista**

| Dato | Valor |
| :---- | :---- |
| Tipo | Vista · 33 columnas |
| Cobertura | Diario, por plataforma · desde 2023-01-01 |
| Columnas que usa el backend | DATE · FUENTE · COST\_USD · INGRESOS\_USD |
| Qué es INGRESOS\_USD | Ingreso que se atribuye cada plataforma. No es venta total ni venta incremental |

&nbsp;

La usa platform\_return. También es la fuente de gasto con la que se entrena el MMM.

&nbsp;

**4.3 · Tres ROAS distintos · no mezclarlos**

| ROAS | Cálculo | Rango típico UA MX | Dónde aparece |
| :---- | :---- | :---- | :---- |
| Bruto | Venta total Adobe / inversión bruta | 11–19x | roas, media\_efficiency\_12m |
| Reportado por plataforma | INGRESOS\_USD / COST\_USD | Depende de la plataforma | platform\_return |
| Incremental (MMM) | Contribución del modelo / gasto | 0.4–2.9x | Dashboard MMM, fuera de este catálogo |

&nbsp;

Por eso cada BASE del catálogo dice explícitamente de qué ROAS se trata.

**05   B1.22 · Crear el catálogo · ✅ Hecho**

**Qué pedía**

Crear en el esquema del tenant la tabla editorial, la vista que lee el backend y la vista de problemas, y darle permiso de lectura al rol del agente.

**Qué se hizo**

**1\.**  Se partió del SQL propuesto (SYNAPSE\_METRIC\_CATALOG.sql, secciones 1 a 4). La tabla y la vista principal quedaron idénticas al original.

**2\.**  Se corrigieron seis cosas antes de correrlo:

| Cambio | Por qué |
| :---- | :---- |
| Se quitó el chequeo "SIN CURAR" | Marcaba toda métrica de la capa semántica que no estuviera en el catálogo. Esas métricas no sirven al materializador (B1.24), nunca se van a curar, y la vista nunca habría llegado a cero filas, que es el criterio de B1.23 |
| Se agregó "CLAVE DESCONOCIDA" | El original no podía detectar claves mal escritas; es el hueco que B1.24 señalaba |
| Se agregó "CLAVE BLOQUEADA" | Evita curar exec\_resumen o month\_decisions |
| Se agregó "SIN FIRMA" | B1.23 exige CURATED\_BY y el original no lo verificaba. Luego se amplió a cualquier valor \<...\> (ver 6.3) |
| La semilla usa MERGE en vez de INSERT | Snowflake no hace cumplir la PK: correrla dos veces duplicaba filas |
| COPY GRANTS en la vista de problemas | Recrearla no pierde permisos |

&nbsp;

**3\.**  Se cargó la semilla con las 10 métricas publicables. exec\_resumen y month\_decisions quedaron fuera a propósito.

**4\.**  El GRANT no hizo falta: los permisos futuros del esquema lo dieron al crear la vista.

&nbsp;

**Verificación**

| Criterio de aceptación | Cómo se verificó | Resultado |
| :---- | :---- | :---- |
| SELECT \* FROM SYNAPSE\_METRIC\_CATALOG devuelve filas desde el esquema del agente | Consulta B | **✅ 10 filas en DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS** |
| SHOW GRANTS muestra SELECT para el rol del tenant | SHOW GRANTS ON VIEW | **✅ SYNAPSE\_APP\_ROLE · ⚠️ falta confirmar tenants.snowflake\_role** |
| Las 11 columnas con los nombres que espera Go | Definición de la vista | **✅ Sin renombres, más MEASUREMENT\_WINDOW** |
| La vista de problemas no filtra la principal | Definición de la vista | **✅ Son independientes** |

&nbsp;

**Qué falta:** Backend — confirmar el rol del tenant y correr make sync-catalog TENANT\_ID=\<uuid-UA-MX\>.

**06   B1.23 · Escribir el gobierno · ✅ Hecho**

**Qué pedía**

Reemplazar los marcadores ⟨REVISAR⟩ de BASE, SOURCE y MEASUREMENT\_WINDOW por textos redactados, revisar FAMILY y SEMANTIC\_DIRECTION, y firmar cada fila.

**Qué se hizo**

**1\.**  Borrador v1, a partir de los documentos del contrato de tenant.

**2\.**  Revisión contra la definición real de GLD\_ECOMM\_DAILY\_PERFORMANCE (SHOW DYNAMIC TABLES). Con eso se corrigió: venta, órdenes, unidades y visitas se miden con Adobe Analytics (v1 no lo decía); las metas vienen del mismo reporte del cliente (v1 decía "calendario comercial"); la inversión bruta incluye el fee de agencia; la venta está en USD, confirmado; media\_efficiency\_12m ahora dice que es ROAS bruto.

**3\.**  Se agregó un criterio propio: toda métrica de ROAS dice cuál de los tres ROAS es (sección 4.3).

**4\.**  Se firmaron las 10 filas en CURATED\_BY.

&nbsp;

**6.1 · Textos vigentes**

| Clave | Nombre | Forma · Familia · Unidad | SOURCE | BASE | MEASUREMENT\_WINDOW |
| :---- | :---- | :---- | :---- | :---- | :---- |
| revenue | Ingresos | scalar · demand · USD | Reporte diario de ecommerce del cliente · venta medida por Adobe Analytics | Venta total del sitio medida por Adobe Analytics, en USD, sumada sobre los días del mes | Mes calendario seleccionado |
| spend | Inversión | scalar · media · USD | Reporte diario de ecommerce del cliente | Inversión bruta en medios de todos los días del mes. Incluye el costo de las plataformas más el fee de agencia | Mes calendario seleccionado |
| roas | ROAS | scalar · media · x | Reporte diario de ecommerce del cliente · venta de Adobe Analytics e inversión bruta | ROAS bruto: venta total del mes sobre inversión bruta del mismo mes. No es incremental | Mes calendario seleccionado |
| orders | Órdenes | scalar · demand · órdenes | Reporte diario de ecommerce del cliente · órdenes medidas por Adobe Analytics | Órdenes totales del sitio medidas por Adobe Analytics, sumadas sobre los días del mes | Mes calendario seleccionado |
| sessions | Visitas | scalar · demand · visitas | Reporte diario de ecommerce del cliente · visitas medidas por Adobe Analytics | Visitas totales al sitio medidas por Adobe Analytics, sumadas sobre los días del mes | Mes calendario seleccionado |
| units | Unidades | scalar · demand · unidades | Reporte diario de ecommerce del cliente · unidades medidas por Adobe Analytics | Unidades vendidas en el sitio medidas por Adobe Analytics, sumadas sobre los días del mes | Mes calendario seleccionado |
| goal\_attainment | Cumplimiento de objetivo | categorical · demand · % | Reporte diario de ecommerce del cliente · trae lo real y las metas diarias en el mismo archivo | Real sobre meta del mes para 5 indicadores: venta, órdenes, unidades, visitas e inversión | Mes calendario seleccionado |
| daily\_trend | Tendencia diaria | multi\_series · demand · — | Reporte diario de ecommerce del cliente · venta y visitas de Adobe Analytics, inversión bruta | Venta, visitas e inversión de cada día, sin agregar | Cada día del mes calendario seleccionado |
| media\_efficiency\_12m | Eficiencia de medios · 12m | multi\_series · media · — | Reporte diario de ecommerce del cliente · venta de Adobe Analytics e inversión bruta | ROAS bruto de cada mes: venta total sobre inversión bruta, en los 12 meses que terminan en el mes seleccionado. No es incremental | Últimos 12 meses calendario hasta el mes seleccionado |
| platform\_return | Retorno por plataforma | tabular · media · — | Costo e ingresos que reporta cada plataforma de publicidad | ROAS reportado por la plataforma: ingresos que se atribuye cada plataforma sobre su costo. No es el ROAS del modelo ni el bruto | Mes calendario seleccionado |

**6.2 · Verificación**

| Criterio de aceptación | Resultado |
| :---- | :---- |
| SYNAPSE\_METRIC\_CATALOG\_ISSUES devuelve cero filas | **✅ Cero filas, con el chequeo de firma corregido** |
| Ninguna fila activa conserva ⟨REVISAR⟩ | **✅** |
| BASE declara un denominador | **✅ Cada una dice qué se suma o divide y sobre qué días** |
| MEASUREMENT\_WINDOW es el período medido, no el de la consulta | **✅ Distingue mes, cada día del mes y 12 meses** |
| FAMILY cae en las 5 con color | **✅ Solo demand y media** |
| Cada fila lleva CURATED\_BY | **✅** |

&nbsp;

**6.3 · Incidente durante la ejecución · ya resuelto**

La primera firma quedó con el marcador literal \<nombre real\>. La vista de problemas solo buscaba \<NOMBRE\> y no lo detectó. Se corrigió el chequeo para marcar como sin firma cualquier valor con forma \<...\>, y se volvió a firmar con el nombre real.

**6.4 · Puntos a confirmar por backend en queries.go**

Los textos se escribieron a partir de la tabla, no del SQL de Go, al que no hubo acceso. Si algo no coincide, se corrige solo el texto con un UPDATE:

| \# | Pregunta | Afecta a |
| :---- | :---- | :---- |
| 1 | ¿spend usa GROSS\_SPEND o NET\_SPEND? | spend, roas, daily\_trend, media\_efficiency\_12m |
| 2 | ¿roas es SUM(REV\_TOTAL)/SUM(GROSS\_SPEND) del mes o el promedio de ROAS\_TOTAL diario? | roas, media\_efficiency\_12m |
| 3 | ¿goal\_attainment compara venta, órdenes, unidades, visitas y presupuesto? | goal\_attainment |

&nbsp;

Además, SEMANTIC\_DIRECTION quedó como en la semilla (HIGHER\_IS\_BETTER o NULL). Sigue abierta la decisión de si el backend manda códigos o el front pinta texto.

**07   B1.24 · Alinear las claves · ✅ Hecho en Snowflake**

**Qué pedía**

Que toda clave activa del catálogo resuelva en MetricRegistry, directo o por alias, sin curar las dos bloqueadas, y dejar escrito que las claves de la capa semántica no sirven.

**Qué se hizo**

**1\.**  Se creó DD\_EXPECTED\_METRIC\_KEYS (sección 3.4) con las 12 claves y los 8 alias de la guía de alta de tenant, paso 3\.

**2\.**  Se conectó a la vista de problemas con los chequeos CLAVE DESCONOCIDA y CLAVE BLOQUEADA.

**3\.**  Se dejaron fuera exec\_resumen y month\_decisions.

**4\.**  Se documenta aquí que las claves de SV\_SYNAPSE\_UA\_ANALYTICS no sirven. El materializador no lee la capa semántica: lee las tablas Gold directo. Es el error que tenía la primera semilla, y por eso se quitó el chequeo "SIN CURAR".

&nbsp;

**Verificación**

| Criterio de aceptación | Resultado |
| :---- | :---- |
| Toda clave activa resuelve en el registro | **✅ En Snowflake: las 10 resuelven, ninguna bloqueada · ⏳ falta la prueba con el materializador** |
| Clave nueva entra con su alias en la misma jugada | **✅ Regla escrita en la tabla y en este documento** |
| exec\_resumen y month\_decisions no se curan | **✅ No están en el catálogo** |
| Queda escrito que la capa semántica no sirve | **✅ Este documento, punto 4** |

&nbsp;

**Qué falta · backend**

El criterio pide verificarlo corriendo el materializador, no comparando listas:

| make sync-catalog TENANT\_ID=\<uuid-UA-MX\> make materialize  TENANT\_ID=\<uuid-UA-MX\> PERIOD=2026-08 |
| :---- |

&nbsp;

Resultado correcto: los 10 paneles en AVAILABLE, con valores distintos a los de la semilla de Postgres. Si alguno sale BLOCKED, la clave no está en keys.go o en MetricRegistry: comparar con DD\_EXPECTED\_METRIC\_KEYS.

**08   B1.25 · Fuera de alcance · lo hace backend**

| No es tarea de este equipo. Es un cambio en el código Go del backend. Esta sección solo explica qué es y deja constancia de lo que Snowflake ya entrega para que backend lo haga. |
| :---- |

&nbsp;

**Qué es**

La consola muestra en la cabecera de todos los paneles, en todos sus estados, una línea con el formato "Base · {base} · {ventana}". Hoy el backend no lee la ventana del catálogo, y el front imprime la palabra undefined donde falta. Backend tiene que:

**1\.**  Leer MEASUREMENT\_WINDOW en el SELECT de internal/core/services/dd\_catalog\_sync\_service.go.

**2\.**  Agregar el campo al modelo DDCatalogMetric y exponerlo en GET /config/catalog.

&nbsp;

**Lo que Snowflake ya entrega ✅**

| Lo que backend necesita de Snowflake | Estado |
| :---- | :---- |
| La columna MEASUREMENT\_WINDOW en SYNAPSE\_METRIC\_CATALOG | **✅ Existe** |
| Con valor en las 10 métricas, sin nulos ni marcadores | **✅** |
| Nombre definitivo MEASUREMENT\_WINDOW, no WINDOW (reservada en ANSI) | **✅ Ya creada así** |
| Permiso de lectura para SYNAPSE\_APP\_ROLE | **✅** |

&nbsp;

Valores que hay hoy en la columna:

| Clave | MEASUREMENT\_WINDOW |
| :---- | :---- |
| revenue, spend, roas, orders, sessions, units, goal\_attainment, platform\_return | Mes calendario seleccionado |
| daily\_trend | Cada día del mes calendario seleccionado |
| media\_efficiency\_12m | Últimos 12 meses calendario hasta el mes seleccionado |

**Lo que no depende de Snowflake**

**•**  El cambio en Go.

**•**  Si el catálogo se guarda en Postgres antes de servirse, la columna y la migración de ese lado.

**•**  El nombre del campo JSON, que backend acuerda con front (adaptador F1.33).

**•**  La prueba de que ningún panel muestra undefined.

&nbsp;

**Solo volvería a Snowflake si**

**•**  Backend pide otro nombre de columna. Implica recrear la vista, y hay que avisar antes de que escriban el campo.

**•**  Producto pide cambiar el texto de alguna ventana. Es un UPDATE en DD\_METRIC\_CURATION.

&nbsp;

**09   B1.26 · Fuera de alcance · decide arquitectura y producto**

| No es tarea de este equipo ni es código. Es una decisión que deben dejar escrita arquitectura y producto. Esta sección explica el problema y qué implicaría cada opción en Snowflake, que es lo que nos afecta. |
| :---- |

**Qué es**

Cada métrica vive en dos lugares que se unen por la clave:

| Mitad | Dónde | Quién la mantiene |
| :---- | :---- | :---- |
| Catálogo: nombre, base, ventana | Snowflake · SYNAPSE\_METRIC\_CATALOG | Datos |
| SQL que calcula el valor | Go · MetricRegistry y alias en keys.go | Backend |

&nbsp;

Con UA México funciona, porque el código se escribió sobre sus tablas. Con un segundo tenant se rompe por dos lados:

**•**  Si su catálogo usa otra clave (por ejemplo "ventas"), Go no la encuentra y el panel sale bloqueado sin razón. Alguien tiene que agregar un alias en keys.go y desplegar.

**•**  Si sus tablas tienen otras columnas (por ejemplo VENTA\_TOTAL en vez de REV\_TOTAL), el SQL de Go no funciona, aunque el dato exista.

&nbsp;

**Las opciones que deben evaluar**

| Opción | Qué es | Costo |
| :---- | :---- | :---- |
| A · Contrato de forma | Todo tenant expone 2 objetos con las 15 columnas de la sección 4 | Barata y rígida: sin BUDGET\_TARGET no hay goal\_attainment |
| Intermedia (propuesta en CAMBIOS\_PROPUESTOS.md) | El SQL sigue en Go, pero el catálogo declara qué query usa cada clave | Media: elimina los alias a mano |
| B · El registro es dato | El SQL de cada métrica sale de Go a una tabla por tenant | Cara y flexible: la clave del catálogo es la del registro |

**Qué implicaría cada opción para Snowflake**

Es lo único de B1.26 que nos toca, y solo después de que decidan:

| Opción | Trabajo en Snowflake por cada tenant nuevo | Qué pasa con lo que ya existe |
| :---- | :---- | :---- |
| A | Crear 2 vistas que renombren sus tablas a las 15 columnas, su SYNAPSE\_METRIC\_CATALOG y sus filas en DD\_EXPECTED\_METRIC\_KEYS | Todo sigue igual. UA MX ya cumple |
| Intermedia | Lo mismo que A, más una columna nueva en el catálogo con la query asignada | DD\_EXPECTED\_METRIC\_KEYS deja de ser un espejo a mano |
| B | Crear y llenar una tabla de registro por tenant: clave, forma, SQL, columnas | DD\_EXPECTED\_METRIC\_KEYS desaparece; el catálogo se une a esa tabla |

&nbsp;

**Información que aportamos desde Snowflake para decidir**

**•**  El contrato de 15 columnas está documentado y verificado en UA MX (sección 4).

**•**  DD\_EXPECTED\_METRIC\_KEYS ya refleja las 12 claves y 8 alias de keys.go: sirve como inventario del registro actual.

**•**  Synapse lee objetos fuera del catálogo. SYNAPSE\_APP\_ROLE tiene SELECT sobre VW\_MMM\_HEALTH y MMM\_MODEL\_METRICS\_HIST, y los permisos futuros le dan lectura sobre toda tabla y vista nueva del esquema.

**•**  make sync-catalog asume que la vista del catálogo existe. Si un tenant no la tiene, falla sin decir qué falta.

&nbsp;

**Lo que la decisión debe dejar escrito · criterios de la tarea**

**•**  La opción elegida y su razón, antes de dar de alta el segundo tenant.

**•**  Si se elige A, la fecha para pasar a B.

**•**  Si se elige A, qué muestra un panel cuando al tenant le falta una columna: estado, razón y cómo se desbloquea.

**•**  Quién es dueño de las vistas de cada tenant. Si la respuesta es "datos", la tabla anterior es el trabajo que nos tocaría.

**10   Consultas para evaluar**

Todas son de solo lectura. En Snowsight, correr cada una sola (cursor dentro y Cmd/Ctrl \+ Enter): "Ejecutar todo" solo muestra el resultado de la última.

| USE ROLE RL\_BT\_UA\_BI;   \-- tiene SELECT sobre tablas, vistas y dynamic tables del esquema USE WAREHOUSE SYNAPSE\_UA; USE SCHEMA DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS; |
| :---- |

**1 · El catálogo tal como lo lee el backend · esperado: 10 filas**

| SELECT \* FROM SYNAPSE\_METRIC\_CATALOG ORDER BY METRIC\_KEY; |
| :---- |

**2 · Problemas · esperado: cero filas**

| SELECT COLUMNA AS PROBLEMA, COUNT(\*) AS FILAS, LISTAGG(METRIC\_KEY, ', ') AS METRICAS FROM SYNAPSE\_METRIC\_CATALOG\_ISSUES GROUP BY COLUMNA; |
| :---- |

**3 · Cada clave resuelve en Go · esperado: 10 filas, RESUELVE\_A lleno, BLOQUEADA FALSE**

| SELECT c.METRIC\_KEY, k.CANONICAL\_KEY AS RESUELVE\_A, k.IS\_ALIAS, k.BLOCKED AS BLOQUEADA FROM DD\_METRIC\_CURATION c LEFT JOIN DD\_EXPECTED\_METRIC\_KEYS k ON k.METRIC\_KEY \= c.METRIC\_KEY WHERE c.IS\_ACTIVE ORDER BY 1; |
| :---- |

**4 · Firma y fecha de cada texto**

| SELECT METRIC\_KEY, CURATED\_BY, UPDATED\_AT FROM DD\_METRIC\_CURATION ORDER BY 1; |
| :---- |

**5 · Permisos**

| SHOW GRANTS ON VIEW DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.SYNAPSE\_METRIC\_CATALOG; |
| :---- |

**6 · Valores de referencia para comparar con la materialización · agosto 2026**

| SELECT     SUM(REV\_TOTAL)                                    AS REVENUE,     SUM(GROSS\_SPEND)                                  AS SPEND\_BRUTO,     SUM(NET\_SPEND)                                    AS SPEND\_NETO,     ROUND(SUM(REV\_TOTAL) / NULLIF(SUM(GROSS\_SPEND),0), 2\) AS ROAS\_BRUTO,     SUM(ORDERS\_TOTAL)                                 AS ORDERS,     SUM(VISITS\_TOTAL)                                 AS SESSIONS,     SUM(UNITS\_TOTAL)                                  AS UNITS FROM GLD\_ECOMM\_DAILY\_PERFORMANCE WHERE DATE \>= '2026-08-01' AND DATE \< '2026-09-01'; |
| :---- |

&nbsp;

Si los paneles de make materialize PERIOD=2026-08 coinciden con estos valores, se confirman de paso los puntos 1 y 2 de 6.4.

**11   Pendientes**

**Nuestro · Snowflake**

Todo lo que se construye en Snowflake para B1.22, B1.23 y B1.24 está hecho y verificado. Lo único que queda de nuestro lado es reactivo:

| \# | Pendiente | Cuándo |
| :---- | :---- | :---- |
| 1 | Corregir textos del catálogo | Si backend encuentra diferencias en las 3 preguntas de 6.4 |
| 2 | Agregar filas a DD\_EXPECTED\_METRIC\_KEYS | Cuando backend agregue una clave o alias en keys.go |
| 3 | Preparar en Snowflake lo que implique la opción de B1.26 | Cuando arquitectura y producto decidan, si el dueño de las vistas es datos |

&nbsp;

**Lo que necesitamos de backend para cerrar lo nuestro**

Son comprobaciones que solo se pueden hacer desde el backend:

| \# | Qué | Cierra |
| :---- | :---- | :---- |
| 1 | Confirmar que tenants.snowflake\_role de UA MX es SYNAPSE\_APP\_ROLE | B1.22 |
| 2 | Correr make sync-catalog y make materialize PERIOD=2026-08; confirmar los 10 paneles en AVAILABLE | B1.22 · B1.24 |
| 3 | Responder las 3 preguntas de queries.go (sección 6.4) | B1.23 |

&nbsp;

**Fuera de nuestro alcance · informativo**

| Tema | Responsable |
| :---- | :---- |
| B1.25 · leer MEASUREMENT\_WINDOW y exponerla en la API (sección 8\) | Backend |
| B1.26 · decidir cómo escala el registro (sección 9\) | Arquitectura \+ producto |
| Nombre JSON del campo de ventana | Backend \+ front |
| Aviso desde los datos: GLD\_ECOMM\_DAILY\_PERFORMANCE tiene filas hasta dic-2028 con valores en 0 (metas de planeación). Si la consola deja elegir meses futuros, mostrará 0 y roas 0x en vez de "sin datos". El mes en curso está incompleto | Backend · selector de período |

**12   Anexo**

**12.1 · Archivos**

| Archivo | Qué es |
| :---- | :---- |
| Cambios/ejecucion/00\_LEEME.md | Orden de ejecución y bitácora del 15-sep |
| Cambios/ejecucion/01\_B1.24\_claves\_esperadas.sql | Crea y llena DD\_EXPECTED\_METRIC\_KEYS |
| Cambios/ejecucion/02\_B1.22\_crear\_catalogo.sql | Crea tabla, vistas y semilla |
| Cambios/ejecucion/03\_B1.23\_gobierno\_PROPUESTA.sql | Textos v2 y firma |
| Cambios/ejecucion/04\_verificacion.sql | Consultas de verificación |
| Cambios/B1.22 · …/Contratos y sql/SYNAPSE\_METRIC\_CATALOG.sql | SQL original propuesto |
| Cambios/B1.22 · …/Contratos y sql/INSTRUCCION-ALTA-TENANT.md | Guía de alta de tenant |
| Cambios/B1.22 · …/Contratos y sql/CONTRATO-DE-TENANT.md | Contrato de las 15 columnas y opciones de escala |
| Cambios/CAMBIOS\_PROPUESTOS.md | Ajustes a B1.23, B1.24, B1.26 y tareas nuevas B1.27–B1.30 |
| Dashboard\_ua/DOCUMENTACION\_MMM.md | Documentación del MMM; sección 7.1 enlaza aquí |

**12.2 · Cómo agregar una métrica nueva**

Las dos mitades se mueven juntas o no se mueven:

**1\.**  Backend: agregar la query en MetricRegistry y, si hace falta, el alias en keys.go.

**2\.**  Datos: en el mismo cambio, agregar la fila en DD\_EXPECTED\_METRIC\_KEYS.

**3\.**  Datos \+ producto: agregar la fila en DD\_METRIC\_CURATION con base, fuente, ventana y firma.

**4\.**  Datos: comprobar que SYNAPSE\_METRIC\_CATALOG\_ISSUES da cero filas.

**5\.**  Backend: make sync-catalog y make materialize; el panel debe salir AVAILABLE.

&nbsp;

Para sacar una métrica sin perder sus textos: UPDATE DD\_METRIC\_CURATION SET IS\_ACTIVE \= FALSE WHERE METRIC\_KEY \= '…'.

&nbsp;

**12.3 · Reversión**

No afecta ninguna tabla existente. Correr con RL\_BT\_UA\_TRANSFORM, en este orden:

| DROP VIEW  IF EXISTS DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.SYNAPSE\_METRIC\_CATALOG\_ISSUES; DROP VIEW  IF EXISTS DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.SYNAPSE\_METRIC\_CATALOG; DROP TABLE IF EXISTS DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.DD\_METRIC\_CURATION; DROP TABLE IF EXISTS DB\_BT\_UA.BT\_UA\_MART\_ANALYTICS.DD\_EXPECTED\_METRIC\_KEYS; |
| :---- |

&nbsp;

| Las tablas se pueden recuperar con UNDROP TABLE dentro de la retención de Time Travel. Advertencia: sin la vista, make sync-catalog vuelve a fallar. |
| :---- |

&nbsp;

**12.4 · Relación con las correcciones del MMM**

Son dos listas distintas:

**•**  M1–M8 corrigieron el control del modelo MMM (Dashboard\_ua/correcciones/) y están documentadas en DOCUMENTACION\_MMM.md.

**•**  B1.22–B1.26 son el catálogo de Synapse, documentado aquí.

&nbsp;

Solo se tocan en B1.26: Synapse lee tablas del MMM por fuera del catálogo.

&nbsp;

Catálogo de métricas de Synapse · Entrega B1.22–B1.26 · UA México — 15 de septiembre de 2026\.