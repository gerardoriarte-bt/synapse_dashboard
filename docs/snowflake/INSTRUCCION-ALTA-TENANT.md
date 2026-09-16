# Instrucción · habilitar un tenant de Synapse en Snowflake

**Para:** ingeniería de datos (Snowflake) y backend (Go).
**De:** equipo de front.
**Fecha:** 2026-09-11.
**Tenant de referencia:** UA MX · `DB_BT_UA.BT_UA_MART_ANALYTICS`.

> **El equipo de front no ejecuta nada de esto.** Lo que sigue está escrito para
> que lo corra y lo revise quien es dueño de la cuenta. El SQL está en
> `SYNAPSE_METRIC_CATALOG.sql`, al lado de este archivo. **No se corrió**: todo
> lo verificado acá salió de consultas de **solo lectura** (`SHOW`, `DESCRIBE`,
> `SELECT` sobre `INFORMATION_SCHEMA`).

---

## 1 · Qué se pide, en una línea

Crear **la vista de catálogo de métricas** que el backend de Synapse necesita
para saber qué métricas existen y cómo se gobiernan, y dejar las claves alineadas
con las que el materializador sabe consultar.

---

## 2 · Lo mínimo que hay que entender antes de tocar nada

Synapse lee Snowflake por **tres caminos distintos**. Solo uno usa el agente.

| Camino | Qué produce | ¿Usa el agente Cortex? |
|---|---|---|
| `make sync-catalog` | **Metadatos**: qué métricas existen y su gobierno | **No.** Un `SELECT` a una vista |
| `make materialize` | **Los datos que pintan los gráficos** | **No.** SQL escrito a mano en Go |
| `/chat/stream` | Respuestas conversacionales | **Sí** |

Dos consecuencias que importan para esta tarea:

1. **No hay que construir ningún prompt.** En los dos primeros caminos el agente
   solo aporta credenciales y el `db.schema` donde buscar. No se le pregunta nada.
2. **El materializador NO lee la capa semántica.** Lee
   `GLD_ECOMM_DAILY_PERFORMANCE` y `GLD_PAID_MEDIA` **directo**.
   `SV_SYNAPSE_UA_ANALYTICS` es otro camino a las mismas tablas Gold, y lo usa el
   chat. **Las diez métricas declaradas ahí no son las que consume el dashboard.**

---

## 3 · Estado verificado hoy · UA MX

### ✅ Lo que ya está y no hay que tocar

Las dos tablas que el materializador consulta **existen y tienen las quince
columnas que su SQL nombra**:

| Objeto | Qué es | Columnas requeridas |
|---|---|---|
| `GLD_ECOMM_DAILY_PERFORMANCE` | dynamic table · 91 columnas · 2.557 filas | `DATE` `REV_TOTAL` `REV_TARGET` `ORDERS_TOTAL` `ORDERS_TARGET` `UNITS_TOTAL` `UNITS_TARGET` `VISITS_TOTAL` `VISITS_TARGET` `GROSS_SPEND` `BUDGET_TARGET` — **11/11 presentes** |
| `GLD_PAID_MEDIA` | vista · 33 columnas | `DATE` `FUENTE` `COST_USD` `INGRESOS_USD` — **4/4 presentes** |

**No hay que crear, renombrar ni migrar ninguna tabla Gold.**

### ❌ Lo único que falta

`SYNAPSE_METRIC_CATALOG` **no existe en ninguna base de la cuenta**.
`SHOW OBJECTS LIKE '%METRIC_CATALOG%'` y `LIKE '%SYNAPSE_METRIC%'` devuelven cero
filas. Por eso `make sync-catalog` hoy falla, y el catálogo que sirve la API sale
de un seed de Postgres en vez de Snowflake.

---

## 4 · Los cinco pasos

### Paso 1 · Crear los tres objetos · **ingeniería de datos**

Correr `SYNAPSE_METRIC_CATALOG.sql` en
`DB_BT_UA.BT_UA_MART_ANALYTICS` — **el mismo `db.schema` que tiene configurado el
agente del tenant**, porque el backend califica la vista con eso y no con una ruta
fija.

Crea tres cosas:

| Objeto | Qué es | Por qué |
|---|---|---|
| `DD_METRIC_CURATION` | **tabla** | Lo editorial: BASE, ventana, fuente, familia. Lo que Snowflake no sabe |
| `SYNAPSE_METRIC_CATALOG` | **vista** | Lo que el backend lee. Las once columnas de su `SELECT`, con esos nombres |
| `SYNAPSE_METRIC_CATALOG_ISSUES` | **vista** | Lo que está mal, con nombre y razón |

**Verificación:** `SELECT * FROM SYNAPSE_METRIC_CATALOG;` devuelve diez filas.

**Por qué son tres y no una:** `INFORMATION_SCHEMA.SEMANTIC_METRICS` da nombre,
expresión y tipo de dato — y **ninguno** de los campos de gobierno. Esos son
editoriales, no se derivan de un `SUM()`, y necesitan un lugar donde alguien los
escriba y los firme.

**Por qué la tercera:** Snowflake no hace cumplir un `CHECK`, así que los
enumerados cerrados no se pueden declarar en la tabla. La vista de issues los
verifica. **No filtra nada de la vista principal, a propósito**: un catálogo que
se arregla descartando en silencio la fila mala hace que la métrica desaparezca
del dashboard sin que nadie sepa por qué.

---

### Paso 2 · Escribir los campos de gobierno · **producto + datos**

La semilla deja diez filas con tres campos marcados `⟨REVISAR⟩`. Hay que
escribirlos. **Son texto que se pinta literal en pantalla**, así que se redactan,
no se generan.

| Campo | Qué es | Ejemplo del contrato |
|---|---|---|
| `BASE` | **El denominador.** Se pinta en la cabecera de todo panel, en todos sus estados | «312 SKU críticos sobre 18.240 activos» |
| `MEASUREMENT_WINDOW` | **La otra mitad de la BASE**: el período que mide. NO es el período de la consulta | «Venta media de los últimos treinta días» |
| `SOURCE` | Procedencia legible por una persona. **No el nombre de la tabla** | «Ads API + Brand Lift» |

Van con marcador y no con un valor plausible por una razón: **una BASE inventada
se lee bien y miente**, y nadie la audita después. El marcador hace que un campo
sin curar se vea en la pantalla y en la vista de issues.

También conviene revisar `FAMILY` —de ahí sale el color de cada serie— y
`SEMANTIC_DIRECTION`, que se propusieron desde la expresión.

**Verificación:** `SELECT * FROM SYNAPSE_METRIC_CATALOG_ISSUES;` devuelve **cero
filas**. Mientras devuelva algo, dice qué métrica y por qué.

---

### Paso 3 · No cambiar las claves · **ingeniería de datos**

**Este es el paso que se rompe en silencio, así que va con su explicación.**

`METRIC_KEY` no es un nombre libre. El materializador tiene doce queries en un
mapa de Go (`MetricRegistry`) y las busca **por esa clave**. Una clave que no
está en el mapa sincroniza bien, se compone bien, y después sale `BLOQUEADO` sin
que nada explique por qué.

Las doce que el registro conoce, con sus alias aceptados:

| Clave del registro | Alias también válido |
|---|---|
| `revenue` | `sales` |
| `spend` | `investment` |
| `sessions` | `visits` |
| `goal_attainment` | `goals_vs_actual` |
| `media_efficiency_12m` | `twelve_month_efficiency` |
| `platform_return` | `investment_by_platform` |
| `exec_resumen` | `executive_summary` |
| `month_decisions` | `decisions` |
| `roas` `orders` `units` `daily_trend` | — sin alias, usar la clave literal |

**La semilla ya usa las claves correctas.** Si alguien las renombra a algo más
descriptivo, hay que agregar el alias en `snowflake/keys.go` del backend en la
misma jugada.

`exec_resumen` y `month_decisions` **no se insertan**: el materializador ya las
trae con `Blocked: true` y la razón escrita —«Requires BT_UA_DECISION_LOG
actionable framework (not in Snowflake Gold yet)»—. Curarlas ahora publicaría dos
paneles que solo pueden salir bloqueados.

---

### Paso 4 · Permisos · **ingeniería de datos**

El rol del agente del tenant tiene que poder leer la vista. Sin esto
`sync-catalog` falla con un error de permisos que no dice qué falta.

```sql
SHOW GRANTS ON VIEW SYNAPSE_METRIC_CATALOG;
```

Debe aparecer `SELECT` para el rol que usa el agente (`tenants.snowflake_role`).

---

### Paso 5 · Agregar `MEASUREMENT_WINDOW` al backend · **backend**

Es lo único de esta instrucción que no es Snowflake, y es de una línea en dos
lugares:

1. Agregar `MEASUREMENT_WINDOW` al `SELECT` de
   `internal/core/services/dd_catalog_sync_service.go`.
2. Agregar el campo al modelo `DDCatalogMetric` y exponerlo en `/config/catalog`.

**Por qué no se puede saltear.** El front pinta
`Base · {base} · {ventana}` en la cabecera de **todos** los paneles y en **todos**
sus estados — es shell, no cuerpo, así que no se reemplaza nunca. Sin el campo, la
línea dice literalmente `undefined` en toda la pantalla.

**La columna se llama `MEASUREMENT_WINDOW` y no `WINDOW`** porque `WINDOW` es
palabra reservada en ANSI y obligaría a citarla en la vista, en el `SELECT` de Go
y en cada consulta a mano. Si prefieren `WINDOW`, es una decisión válida — pero
hay que avisarlo antes de que el backend escriba el campo.

---

## 5 · Cómo se verifica que quedó bien, de punta a punta

```bash
# 1 · el catálogo entra a Postgres
make sync-catalog TENANT_ID=<uuid-del-tenant>
#    → log con las métricas upserteadas y catalog_version arriba

# 2 · los datos se materializan
make materialize TENANT_ID=<uuid-del-tenant> PERIOD=2026-08
#    → log con available / blocked / errors
```

Y después, en la API:

```
POST /api/v1/config/panels:batch   { "panel_ids": [...], "period": "2026-08" }
```

**El resultado correcto:** los paneles llegan con `status: AVAILABLE` y valores
distintos a los del fixture del seed. Si llegan todos en `BLOCKED`, es el Paso 3:
las claves del catálogo no caen en el registro.

---

## 6 · Lo que esta instrucción NO pide

- **No pide tocar ninguna tabla Gold.** Están bien y completas.
- **No pide construir un prompt ni configurar el agente** para el catálogo ni
  para los gráficos. Ese camino no existe: es SQL de punta a punta.
- **No pide tocar `SV_SYNAPSE_UA_ANALYTICS`** ni las otras vistas semánticas. Son
  del chat, que es otro producto.
- **No pide nada del front.** Lo que el front necesita del backend está en
  `docs/PLAN-INTEGRACION-2026-09-11.md` §4 y es independiente de esto.

---

## 7 · La decisión que hay que tomar antes del SEGUNDO tenant

Esta instrucción resuelve UA MX. Para el siguiente hay un problema de diseño que
conviene decidir ahora y no cuando duela.

**El catálogo (Snowflake) y el registro de queries (Go) son dos mitades del mismo
hecho, en dos lugares, y se pueden separar sin que nadie se entere.** El puente es
el mapa de alias escrito a mano del Paso 3. Un tenant cuyo catálogo declare
`ventas` no tiene alias, no encuentra query, y la métrica sale bloqueada.

| | Qué implica | Costo |
|---|---|---|
| **A · Contrato de forma** | Todo tenant expone dos objetos con esas quince columnas, vía una vista que renombre lo que ya tenga | Barato. Rígido: sin `BUDGET_TARGET` no hay `goal_attainment` |
| **B · El registro pasa a ser dato** | `MetricRegistry` sale de Go a una tabla por tenant: clave, forma, SQL | Caro. La clave del catálogo **es** la del registro y el alias desaparece |

**Recomendación del front: A para arrancar, B declarado como destino con fecha.**
A se monta con vistas sobre lo que cada tenant ya tiene; B necesita resolver antes
cómo se versiona y se revisa un SQL que vive en la base. Pero **A sin fecha para B
es cómo el mapa de alias termina con cuarenta entradas.**

---

## Anexo · de dónde salió cada afirmación de este documento

| Afirmación | Fuente |
|---|---|
| Las tres rutas y que solo el chat usa el agente | `internal/adapters/handler/router.go` |
| El `SELECT` del catálogo, las once columnas | `internal/core/services/dd_catalog_sync_service.go` |
| Las dos tablas, sus defaults y las quince columnas | `internal/core/dashboard/snowflake/queries.go` · `dd_materializer_service.go` |
| Las doce claves y los ocho alias | `internal/core/dashboard/snowflake/keys.go` |
| `exec_resumen` y `month_decisions` bloqueadas | `queries.go`, campo `BlockedReason` |
| Que el período solo acepta `YYYY-MM` | `internal/core/dashboard/snowflake/period.go` |
| Que `SYNAPSE_METRIC_CATALOG` no existe | `SHOW OBJECTS` · solo lectura · 2026-09-11 |
| Que las quince columnas están | `DESCRIBE` de los dos objetos · solo lectura · 2026-09-11 |
| Que `SEMANTIC_METRICS` no trae gobierno | `DESCRIBE VIEW DB_BT_UA.INFORMATION_SCHEMA.SEMANTIC_METRICS` |
