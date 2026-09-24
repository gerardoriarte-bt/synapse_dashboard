-- ═══════════════════════════════════════════════════════════════════════════
-- SYNAPSE_METRIC_CATALOG · la vista que alimenta el catálogo de métricas
--
-- PARA REVISIÓN DE UN INGENIERO DE DATOS. No se corrió nada: esto se escribió
-- desde una inspección de solo lectura de la cuenta (2026-09-11) y desde el
-- SELECT que el backend ya tiene escrito.
--
-- ── QUIÉN LA LEE ───────────────────────────────────────────────────────────
--
-- `DDCatalogSyncService` del backend (`make sync-catalog TENANT_ID=<uuid>`).
-- Corre este SELECT, literal, contra el db/schema del agente del tenant:
--
--     SELECT METRIC_KEY, NAME, SHAPE, FAMILY, LAYER, SOURCE, BASE,
--            UNIT, SEMANTIC_DIRECTION, MIN_GRAIN, DIMENSIONS
--     FROM SYNAPSE_METRIC_CATALOG
--     ORDER BY METRIC_KEY
--
-- Hace upsert en `dd_catalog_metrics` y sube `catalog_version` si algo cambió.
-- El nombre de la vista es configurable con `DD_CATALOG_SNOWFLAKE_VIEW`.
--
-- **No hay LLM en este camino.** No es un prompt ni una consulta al agente: el
-- agente solo aporta las credenciales y el db/schema donde vive la vista.
--
-- ── QUÉ SE ENCONTRÓ EN LA CUENTA ───────────────────────────────────────────
--
-- `SYNAPSE_METRIC_CATALOG` NO EXISTE. `SHOW OBJECTS LIKE '%METRIC_CATALOG%'` y
-- `LIKE '%SYNAPSE_METRIC%'` devuelven cero filas en toda la cuenta.
--
-- Lo que sí hay, en `DB_BT_UA.BT_UA_MART_ANALYTICS`:
--
--   · `SYNAPSE_UA`               24 tablas lógicas · 285 facts · 170 dimensiones
--                                CERO objetos METRIC declarados
--   · `SV_SYNAPSE_UA_ANALYTICS`  las 10 métricas declaradas de todo DB_BT_UA
--   · `SV_UA_FORECAST`, `SYNAPSE_UA_PREDICTION`, `SV_SYNAPSE_PROACT`
--
-- Los nombres de columna de `INFORMATION_SCHEMA.SEMANTIC_METRICS` están
-- VERIFICADOS con un DESCRIBE contra la cuenta, no supuestos: la columna del
-- nombre de la métrica es `NAME` —no `METRIC_NAME`— y `TABLE_NAME` es la tabla
-- LÓGICA del semantic view, no una tabla física.
--
-- ── POR QUÉ ESTO NO SE PUEDE DERIVAR SOLO ──────────────────────────────────
--
-- `INFORMATION_SCHEMA.SEMANTIC_METRICS` da nombre, expresión, tipo de dato,
-- sinónimos y comentario. **No da ninguno de los campos de gobierno**, que son
-- justamente los que el producto hace obligatorios:
--
--     SHAPE · FAMILY · LAYER · SOURCE · BASE · MEASUREMENT_WINDOW
--     UNIT · SEMANTIC_DIRECTION · MIN_GRAIN · DIMENSIONS
--
-- Son editoriales, no técnicos. Nadie los puede inferir de un `SUM()`.
--
-- Por eso el catálogo son DOS objetos y no uno:
--
--   1. `DD_METRIC_CURATION`      tabla · lo editorial, curado a mano
--   2. `SYNAPSE_METRIC_CATALOG`  vista · lo que el backend lee
--   3. `SYNAPSE_METRIC_CATALOG_ISSUES`  vista · lo que está mal, con nombre
--
-- ── TRES DECISIONES QUE HAY QUE TOMAR ANTES DE CORRER ESTO ─────────────────
--
-- 1. **`SHAPE` no es propiedad de la métrica, es de la métrica MÁS cómo se
--    consulta.** `SUM(br_rev)` agrupado por mes es `time_series`; el mismo SUM
--    sin agrupar es `scalar`. Así que una misma expresión puede necesitar DOS
--    filas de catálogo con dos `METRIC_KEY` distintos. Hay que decidir la
--    convención de nombres — `roas` y `roas_trend`, por ejemplo.
--
-- 2. **Las 10 métricas declaradas son todas escalares** (`SUM`, `DIV0`,
--    `COUNT_IF`). El seed del backend arma paneles de tipo `series`, `bars`,
--    `table` y `prose`, que necesitan otras formas. Esas salen de los 285 facts
--    de `SYNAPSE_UA` agrupados, no de `SEMANTIC_METRICS`.
--
-- 3. **`executive_summary` y `decisions` NO se curan acá** · decidido el
--    2026-09-24 por producto. Antes esta línea era una duda —«o salen de otra
--    tabla, o no entran al catálogo por acá»—; ya no lo es.
--
--    Son **interpretación del agente**: el resumen y las propuestas que elabora
--    a partir de los datos del período. No son una agregación, así que no hay
--    expresión que curar ni `SEMANTIC_OBJECT` al que apuntar, y meterlas al
--    catálogo obligaría a inventarle una a cada una.
--
--    **No son paneles accesorios**: el resumen es el primero de la pantalla.
--    Que hoy salga con el texto del fixture es lo que hace que la consola se
--    contradiga consigo misma, y va pedido al backend en
--    `docs/MENSAJE-2026-09-24-materializador.md` §3.
-- ═══════════════════════════════════════════════════════════════════════════

USE DATABASE DB_BT_UA;
USE SCHEMA BT_UA_MART_ANALYTICS;   -- el db/schema del agente del tenant


-- ───────────────────────────────────────────────────────────────────────────
-- 1 · LA CURADURÍA
--
-- Una fila por métrica publicable. Es lo editorial: lo que alguien decide, no
-- lo que Snowflake sabe.
--
-- `MEASUREMENT_WINDOW` y no `WINDOW`: `WINDOW` es palabra reservada en ANSI y
-- obligaría a citarla en la vista, en el SELECT del backend y en cualquier
-- consulta a mano. Una comilla olvidada de tres lados es demasiado barato.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS DD_METRIC_CURATION (
    METRIC_KEY          VARCHAR       NOT NULL PRIMARY KEY
        COMMENT 'Clave estable. La usan los paneles, los jobs y el front. No se renombra.',

    SEMANTIC_OBJECT     VARCHAR
        COMMENT 'Nombre en SEMANTIC_METRICS si la métrica está declarada allá. NULL si sale de un fact de SYNAPSE_UA.',

    NAME                VARCHAR       NOT NULL
        COMMENT 'Nombre legible. Es el título del panel.',

    SHAPE               VARCHAR       NOT NULL
        COMMENT 'scalar | scalar_with_interval | time_series | multi_series | categorical | ranking | tabular | prose | composition. SOLO estas nueve: el materializador devuelve error con cualquier otra.',

    FAMILY              VARCHAR       NOT NULL
        COMMENT 'demand | media | inventory | customer | external. DE ACA SALE EL COLOR DE DATOS: una familia fuera de las cinco pinta la serie sin color y nadie se entera.',

    LAYER               VARCHAR       NOT NULL
        COMMENT 'BRONZE | SILVER | GOLD. Una métrica compuesta hereda la PEOR de sus fuentes.',

    SOURCE              VARCHAR       NOT NULL
        COMMENT 'Procedencia legible por una persona. Ej: «Ads API + Brand Lift». No el nombre de la tabla.',

    BASE                VARCHAR       NOT NULL
        COMMENT 'EL DENOMINADOR. Ej: «312 SKU críticos sobre 18.240 activos». Se pinta en la cabecera de todo panel, en todos sus estados.',

    MEASUREMENT_WINDOW  VARCHAR       NOT NULL
        COMMENT 'La otra mitad de la BASE: el período que mide. Ej: «Venta media de los últimos treinta días». NO es el período de la consulta.',

    UNIT                VARCHAR
        COMMENT 'USD | % | x | un nombre como «órdenes». NULL si no tiene.',

    SEMANTIC_DIRECTION  VARCHAR
        COMMENT 'TEXTO REDACTADO, NO UN CÓDIGO · decidido 2026-09-24. Se pinta tal cual al pie del panel: «MÁS ALTO = MEJOR». NULL cuando la métrica no es compuesta. NO pongas HIGHER_IS_BETTER: el panel lo muestra con guiones bajos. Es texto y no un enumerado porque hay métricas donde lo mejor no es «alto» sino «cerca de la meta» o «estable» — decisión humana del 2026-08-19.',

    MIN_GRAIN           VARCHAR       NOT NULL
        COMMENT 'day | week | month. El período más fino que esta métrica puede contestar. El selector deshabilita lo que no aplica.',

    DIMENSIONS          ARRAY
        COMMENT 'Por dónde se puede desagregar. Array de strings.',

    IS_ACTIVE           BOOLEAN       NOT NULL DEFAULT TRUE
        COMMENT 'FALSE la saca del catálogo sin borrar la curaduría.',

    CURATED_BY          VARCHAR
        COMMENT 'Quién revisó esta fila. Vacío = sin revisar.',

    UPDATED_AT          TIMESTAMP_NTZ NOT NULL DEFAULT CURRENT_TIMESTAMP()
)
COMMENT = 'Curaduría del catálogo de métricas de Synapse. Lo editorial; lo técnico vive en la capa semántica.';


-- ───────────────────────────────────────────────────────────────────────────
-- 2 · LA VISTA QUE LEE EL BACKEND
--
-- Las once columnas del SELECT de `dd_catalog_sync_service.go`, con los mismos
-- nombres y en el mismo orden. MEASUREMENT_WINDOW va de más: el backend todavía
-- no la selecciona — es el campo `ventana` que falta y que hace que la línea de
-- BASE diga «undefined» en los doce paneles.
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW SYNAPSE_METRIC_CATALOG
COMMENT = 'Catálogo de métricas que consume DDCatalogSyncService. Una fila por métrica publicable.'
AS
SELECT
    METRIC_KEY,
    NAME,
    SHAPE,
    FAMILY,
    LAYER,
    SOURCE,
    BASE,
    UNIT,
    SEMANTIC_DIRECTION,
    MIN_GRAIN,
    DIMENSIONS,
    MEASUREMENT_WINDOW          -- todavía no la lee el backend · ver plan §4
FROM DD_METRIC_CURATION
WHERE IS_ACTIVE
ORDER BY METRIC_KEY;


-- ───────────────────────────────────────────────────────────────────────────
-- 3 · LO QUE ESTÁ MAL, CON NOMBRE
--
-- Snowflake NO hace cumplir un CHECK, así que los enumerados no se pueden
-- declarar en la tabla: se verifican acá.
--
-- Esta vista no filtra nada de la de arriba **a propósito**. Un catálogo que se
-- arregla solo descartando en silencio la fila mala es peor que uno que falla:
-- la métrica desaparece del dashboard y nadie sabe por qué. Acá aparece con su
-- nombre y su razón.
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW SYNAPSE_METRIC_CATALOG_ISSUES
COMMENT = 'Filas de la curaduría que romperían el front o el materializador. Debe devolver cero filas.'
AS

-- ── forma fuera de las nueve que el materializador transforma ───────────────
SELECT METRIC_KEY, 'SHAPE' AS COLUMNA, SHAPE AS VALOR,
       'El materializador devuelve ErrUnknownShape: la métrica sincroniza bien y el panel falla dos pasos después' AS RAZON
FROM DD_METRIC_CURATION
WHERE IS_ACTIVE
  AND SHAPE NOT IN ('scalar','scalar_with_interval','time_series','multi_series',
                    'categorical','ranking','tabular','prose','composition')

UNION ALL

-- ── familia fuera de las cinco que tienen rampa de color ────────────────────
SELECT METRIC_KEY, 'FAMILY', FAMILY,
       'El color de la serie sale de la familia: una desconocida pinta sin color, en silencio'
FROM DD_METRIC_CURATION
WHERE IS_ACTIVE
  AND FAMILY NOT IN ('demand','media','inventory','customer','external')

UNION ALL

-- ── capa Medallion ─────────────────────────────────────────────────────────
SELECT METRIC_KEY, 'LAYER', LAYER,
       'La procedencia declara la capa y el front la pinta: solo BRONZE, SILVER o GOLD'
FROM DD_METRIC_CURATION
WHERE IS_ACTIVE AND LAYER NOT IN ('BRONZE','SILVER','GOLD')

UNION ALL

-- ── grano mínimo ───────────────────────────────────────────────────────────
SELECT METRIC_KEY, 'MIN_GRAIN', MIN_GRAIN,
       'El selector de período agrupa por grano: solo day, week o month'
FROM DD_METRIC_CURATION
WHERE IS_ACTIVE AND MIN_GRAIN NOT IN ('day','week','month')

UNION ALL

-- ── campos de gobierno sin revisar ─────────────────────────────────────────
-- El marcador ⟨REVISAR⟩ existe para que un campo sin curar se VEA, en la
-- pantalla y acá. Inventar una BASE plausible es peor: se lee bien y miente.
SELECT METRIC_KEY, 'SIN REVISAR',
       COALESCE(CURATED_BY, '(nadie)'),
       'BASE, SOURCE o MEASUREMENT_WINDOW siguen con el marcador ⟨REVISAR⟩'
FROM DD_METRIC_CURATION
WHERE IS_ACTIVE
  AND (BASE LIKE '%⟨REVISAR⟩%' OR SOURCE LIKE '%⟨REVISAR⟩%' OR MEASUREMENT_WINDOW LIKE '%⟨REVISAR⟩%')

UNION ALL

-- ── dirección semántica escrita como código ────────────────────────────────
-- **El front la pinta TAL CUAL al pie del panel**, así que un `HIGHER_IS_BETTER`
-- sale en pantalla con guiones bajos. Es texto redactado y no un enumerado por
-- decisión humana del 2026-08-19: hay métricas donde lo mejor no es «alto» sino
-- «cerca de la meta» o «estable», y un enumerado de dos valores las deforma.
--
-- Esta regla existe porque la deriva ya pasó: el 2026-09-14 se dio por cerrado
-- que la vista mandaba texto, verificándolo contra la SEMILLA de Postgres. La
-- fuente real mandaba códigos, y se vio en pantalla diez días después.
SELECT METRIC_KEY, 'SEMANTIC_DIRECTION', SEMANTIC_DIRECTION,
       'Se pinta tal cual: un código sale con guiones bajos. Escribilo redactado — «MÁS ALTO = MEJOR»'
FROM DD_METRIC_CURATION
WHERE IS_ACTIVE
  AND SEMANTIC_DIRECTION IS NOT NULL
  AND SEMANTIC_DIRECTION = UPPER(SEMANTIC_DIRECTION)
  AND SEMANTIC_DIRECTION NOT LIKE '% %'

UNION ALL

-- ── curada contra una métrica semántica que ya no existe ────────────────────
SELECT c.METRIC_KEY, 'SEMANTIC_OBJECT', c.SEMANTIC_OBJECT,
       'Referencia a SEMANTIC_METRICS que no resuelve: la definición técnica se movió o se borró'
FROM DD_METRIC_CURATION c
LEFT JOIN DB_BT_UA.INFORMATION_SCHEMA.SEMANTIC_METRICS m
       ON UPPER(m.NAME) = UPPER(c.SEMANTIC_OBJECT)
WHERE c.IS_ACTIVE
  AND c.SEMANTIC_OBJECT IS NOT NULL
  AND m.NAME IS NULL

UNION ALL

-- ── declarada en la capa semántica y sin curar ─────────────────────────────
-- No es un error: es trabajo pendiente, y es la única forma de verlo.
SELECT m.NAME, 'SIN CURAR', m.SEMANTIC_VIEW_NAME || '.' || m.TABLE_NAME,
       'Declarada en SEMANTIC_METRICS y sin fila en DD_METRIC_CURATION: no llega al dashboard'
FROM DB_BT_UA.INFORMATION_SCHEMA.SEMANTIC_METRICS m
LEFT JOIN DD_METRIC_CURATION c
       ON UPPER(c.SEMANTIC_OBJECT) = UPPER(m.NAME)
WHERE c.METRIC_KEY IS NULL;


-- ───────────────────────────────────────────────────────────────────────────
-- 4 · SEMILLA · LAS DOCE CLAVES QUE EL MATERIALIZADOR SABE CONSULTAR
--
-- ⚠ CORRECCIÓN respecto de la primera versión de este archivo.
--
-- La semilla anterior usaba las diez métricas de `SV_SYNAPSE_UA_ANALYTICS`
-- —`TOTAL_REV_BRAND`, `ROAS_BRAND`…—. **Eso no sirve**, y conviene entender por
-- qué antes de curar nada:
--
--   **El materializador NO lee la capa semántica.** Lee
--   `GLD_ECOMM_DAILY_PERFORMANCE` y `GLD_PAID_MEDIA` **directo**, con SQL
--   escrito a mano en `internal/core/dashboard/snowflake/queries.go`.
--
--   `SV_SYNAPSE_UA_ANALYTICS` y el materializador son dos caminos distintos a
--   las mismas tablas Gold. El semantic view es para el agente de chat; el
--   materializador lo esquiva.
--
-- Así que la clave del catálogo tiene que ser una que `MetricRegistry` conozca,
-- o una que `CanonicalKey` sepa traducir. Cualquier otra sincroniza bien y
-- después sale BLOQUEADA sin que nada lo explique.
--
-- Las doce que el registro conoce, y sus alias aceptados:
--
--   revenue              ← alias: sales
--   spend                ← alias: investment
--   roas                 (sin alias · usar la clave literal)
--   orders               (sin alias)
--   sessions             ← alias: visits
--   units                (sin alias)
--   goal_attainment      ← alias: goals_vs_actual
--   daily_trend          (sin alias)
--   media_efficiency_12m ← alias: twelve_month_efficiency
--   platform_return      ← alias: investment_by_platform
--   exec_resumen         ← alias: executive_summary      · Blocked en el código
--   month_decisions      ← alias: decisions              · Blocked en el código
--
-- ── LO QUE SE PROPONE Y LO QUE NO ──────────────────────────────────────────
--
-- SHAPE sale del registro, NO es opinable: si no coincide, el materializador
-- transforma a una forma y el panel espera otra.
--
-- UNIT y SEMANTIC_DIRECTION se proponen desde la expresión. Revisables.
--
-- MIN_GRAIN va en `month` en las doce **a propósito**, aunque la tabla de
-- ecommerce sea diaria: `ParsePeriod` del backend solo acepta `YYYY-MM` y
-- rechaza cualquier otra cosa. Declarar `day` haría que el selector de período
-- ofrezca un grano que el backend no puede contestar — el mismo defecto que un
-- panel sin BASE: promete algo que no sostiene. Cambia cuando cambie ParsePeriod.
--
-- BASE, SOURCE y MEASUREMENT_WINDOW van con ⟨REVISAR⟩ y hay que escribirlos.
-- No se derivan de un SUM y no los invento: una BASE plausible se lee bien y
-- miente, que es peor que un hueco. La vista de issues los marca hasta que
-- alguien los firme.
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO DD_METRIC_CURATION
    (METRIC_KEY, SEMANTIC_OBJECT, NAME, SHAPE, FAMILY, LAYER, SOURCE, BASE,
     MEASUREMENT_WINDOW, UNIT, SEMANTIC_DIRECTION, MIN_GRAIN, DIMENSIONS)
SELECT column1, NULL, column2, column3, column4, 'GOLD', column5, column6,
       column7, column8, column9, 'month', ARRAY_CONSTRUCT()
FROM VALUES
 ('revenue',              'Ingresos',                  'scalar',       'demand', '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', 'USD',  'MÁS ALTO = MEJOR'),
 ('spend',                'Inversión',                 'scalar',       'media',  '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', 'USD',  NULL),
 ('roas',                 'ROAS',                      'scalar',       'media',  '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', 'x',    'MÁS ALTO = MEJOR'),
 ('orders',               'Órdenes',                   'scalar',       'demand', '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', 'órdenes',  'MÁS ALTO = MEJOR'),
 ('sessions',             'Visitas',                   'scalar',       'demand', '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', 'visitas',  'MÁS ALTO = MEJOR'),
 ('units',                'Unidades',                  'scalar',       'demand', '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', 'unidades', 'MÁS ALTO = MEJOR'),
 ('goal_attainment',      'Cumplimiento de objetivo',  'categorical',  'demand', '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', '%',    'MÁS ALTO = MEJOR'),
 ('daily_trend',          'Tendencia diaria',          'multi_series', 'demand', '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', NULL,   NULL),
 ('media_efficiency_12m', 'Eficiencia de medios · 12m','multi_series', 'media',  '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', NULL,   NULL),
 ('platform_return',      'Retorno por plataforma',    'tabular',      'media',  '⟨REVISAR⟩ fuente', '⟨REVISAR⟩ denominador', '⟨REVISAR⟩ ventana', NULL,   NULL);

-- `exec_resumen` y `month_decisions` NO se insertan: el materializador las trae
-- con `Blocked: true` y la razón escrita —«Requires BT_UA_DECISION_LOG
-- actionable framework»—. Curarlas ahora publicaría dos paneles que solo pueden
-- salir bloqueados. Entran cuando exista de dónde sacarlas.


-- ───────────────────────────────────────────────────────────────────────────
-- 5 · VERIFICACIÓN · las tres consultas que corre quien revisa
-- ───────────────────────────────────────────────────────────────────────────

-- a) Debe devolver CERO filas. Cada una dice qué métrica y por qué.
-- SELECT * FROM SYNAPSE_METRIC_CATALOG_ISSUES ORDER BY METRIC_KEY, COLUMNA;

-- b) Lo que el backend va a leer, exactamente:
-- SELECT METRIC_KEY, NAME, SHAPE, FAMILY, LAYER, SOURCE, BASE,
--        UNIT, SEMANTIC_DIRECTION, MIN_GRAIN, DIMENSIONS
-- FROM SYNAPSE_METRIC_CATALOG ORDER BY METRIC_KEY;

-- c) Que el rol del agente pueda leerla. Sin esto, sync-catalog falla con un
--    error de permisos que no dice qué falta:
-- SHOW GRANTS ON VIEW SYNAPSE_METRIC_CATALOG;
