# Runbook · dar de alta un cliente en Synapse

**Para:** el equipo interno — datos y backend.
**NO es para el admin de la plataforma.** §7.3 de `design.md` dice que el
vocabulario de infraestructura no se muestra en ninguna pantalla porque «ningún
usuario de administración actúa sobre ella». Este documento es esa capa.

**Este archivo NO lleva fecha en el nombre a propósito.** Los otros dos de
`docs/snowflake/` sí la llevan y son **cortes**: fueron pedidos a datos para UA MX
y sus afirmaciones vencieron. Éste se mantiene.

> **Todo lo de acá se leyó del código o se midió contra el servicio el
> 2026-09-28** —upstream `f70cec2`—. Lo que no se verificó dice que no.
> **Un alta completa nunca se corrió de punta a punta**: haría falta un cliente
> real en Snowflake. Los pasos son correctos; el camino entero no está probado.

---

## Antes de empezar · las tres cosas que deciden si se puede

| | Qué | Si falta |
|---|---|---|
| 1 | El cliente tiene datos de ecommerce y de medios pagos en Snowflake | No hay alta |
| 2 | Podemos crear objetos en **su** cuenta, o él los crea | Ver paso 1 |
| 3 | Un usuario de servicio con par de claves RSA | Ver paso 5 |

---

## Paso 1 · El contrato de datos · **dos objetos, quince columnas**

**Es el paso que decide el costo de todo lo demás, y el que más se subestima.**

El backend resuelve los nombres de tabla desde variables de entorno **del
proceso** —`DD_SNOWFLAKE_ECOMM_TABLE` y `DD_SNOWFLAKE_PAID_MEDIA_TABLE`, leído de
`dd_materializer_service.go:530`— y los califica con el `db.schema` **del agente
de ese tenant**: `Qualify(agent.SnowflakeDb, agent.SnowflakeSchema, tabla)`.

**Consecuencia, y es la que hay que entender:** los nombres son **los mismos para
todos los clientes**; lo que cambia es el esquema donde viven.

Cada cliente expone en **su** `db.schema`:

### `GLD_ECOMM_DAILY_PERFORMANCE` · once columnas

```
DATE  REV_TOTAL  REV_TARGET  ORDERS_TOTAL  ORDERS_TARGET
UNITS_TOTAL  UNITS_TARGET  VISITS_TOTAL  VISITS_TARGET
GROSS_SPEND  BUDGET_TARGET
```

### `GLD_PAID_MEDIA` · cuatro columnas

```
DATE  FUENTE  COST_USD  INGRESOS_USD
```

**Pueden ser VISTAS, y casi siempre conviene que lo sean.** Un cliente que llame
`ingresos` a `REV_TOTAL` no cambia su modelo: crea una vista que renombre. Es la
opción A de `B1.26` y **es como ya funciona**, sólo que nunca se escribió como
contrato.

### Lo que pasa si falta una columna · **hoy es malo**

El panel sale **BLOQUEADO sin razón**. No dice qué columna falta ni que el
problema sea de esquema. Es uno de los cuatro puntos que `B1.26` pide resolver.

**Mientras tanto, verificar a mano antes de seguir:**

```sql
DESCRIBE TABLE <db>.<schema>.GLD_ECOMM_DAILY_PERFORMANCE;
DESCRIBE TABLE <db>.<schema>.GLD_PAID_MEDIA;
```

y contar que estén las quince. **Cinco minutos acá ahorran un día de «los paneles
salen bloqueados y no sé por qué».**

---

## Paso 2 · La vista de catálogo

Correr `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` **en el mismo `db.schema` que
se le va a configurar al agente** — el backend la califica con eso, no con una
ruta fija.

Crea tres objetos:

| Objeto | Qué es |
|---|---|
| `DD_METRIC_CURATION` | **Tabla.** Lo editorial: BASE, ventana, fuente, familia |
| `SYNAPSE_METRIC_CATALOG` | **Vista.** Lo que el backend lee |
| `SYNAPSE_METRIC_CATALOG_ISSUES` | **Vista.** Lo que está mal, con nombre y razón |

**El nombre de la vista también es configurable** —`DD_CATALOG_SNOWFLAKE_VIEW`,
default `SYNAPSE_METRIC_CATALOG`, de `dd_catalog_sync_service.go:16`— y **es
global igual que las tablas**: no se cambia por cliente.

### Las DOCE columnas que el backend le pide

Leídas de su `SELECT`, `dd_catalog_sync_service.go:69`:

```
METRIC_KEY  NAME  SHAPE  FAMILY  LAYER  SOURCE
BASE  UNIT  SEMANTIC_DIRECTION  MIN_GRAIN  DIMENSIONS  MEASUREMENT_WINDOW
```

**Son doce y no once.** `MEASUREMENT_WINDOW` se agregó con B1.25; los documentos
del 2026-09-11 dicen once y quedaron viejos.

**Verificación:** `SELECT * FROM SYNAPSE_METRIC_CATALOG;` devuelve filas.

---

## Paso 3 · Las claves de métrica · **el paso que se rompe en silencio**

`METRIC_KEY` **no es un nombre libre.** El materializador tiene doce queries en un
mapa de Go y las busca por esa clave. Una clave que no está sincroniza bien, se
compone bien, y después sale **BLOQUEADO sin que nada lo explique**.

Las doce que el registro conoce, leídas de `queries.go` el 2026-09-28:

```
revenue   spend   roas   orders   sessions   units
goal_attainment   daily_trend   media_efficiency_12m
platform_return   exec_resumen   month_decisions
```

Y los ocho alias aceptados, de `keys.go`:

| Alias | Resuelve a |
|---|---|
| `sales` | `revenue` |
| `investment` | `spend` |
| `visits` | `sessions` |
| `goals_vs_actual` | `goal_attainment` |
| `twelve_month_efficiency` | `media_efficiency_12m` |
| `investment_by_platform` | `platform_return` |
| `executive_summary` | `exec_resumen` |
| `decisions` | `month_decisions` |

**Cualquier otra clave no encuentra query.** Un cliente que declare `ventas` en su
catálogo no tiene alias y su métrica sale bloqueada.

**`exec_resumen` y `month_decisions` NO se curan.** El materializador ya las trae
con `Blocked: true` y su razón escrita: no hay dato de esas dos en Gold. Curarlas
publica dos paneles que sólo pueden salir bloqueados.

---

## Paso 4 · Curar el gobierno · **producto + datos, no sólo datos**

La semilla deja tres campos en `⟨REVISAR⟩`. **Se redactan, no se generan**: se
pintan literales en la cabecera de todo panel y en todos sus estados.

| Campo | Qué es | Ejemplo real de UA |
|---|---|---|
| `BASE` | **El denominador** | «312 SKU críticos sobre 18.240 activos» |
| `MEASUREMENT_WINDOW` | **La otra mitad**: qué período mide. NO es el de la consulta | «Mes calendario seleccionado» |
| `SOURCE` | Procedencia legible. **No el nombre de la tabla** | «Ads API + Brand Lift» |

**Van con marcador y no con un valor plausible** porque una BASE inventada se lee
bien y miente, y nadie la audita después.

Revisar también `FAMILY` —de ahí sale el color de cada serie— y
`SEMANTIC_DIRECTION`, que va **redactado** (`HIGHER = BETTER`) y no como código.
UA todavía tiene seis filas con `HIGHER_IS_BETTER` y salen con guiones bajos en
pantalla.

**Verificación:** `SELECT * FROM SYNAPSE_METRIC_CATALOG_ISSUES;` → **cero filas**.

---

## Paso 5 · Credenciales · **acá se toca AWS, no sólo Snowflake**

El alta pide **siete campos**, y `POST /admin/tenants` los nombra si faltan
—medido el 2026-09-28, contesta 400 en español—:

```
name  snowflake_url  snowflake_account  snowflake_user
snowflake_role  private_key_pem  kms_key_arn
```

Más `private_key_passphrase`, opcional.

**Dos cosas que sorprenden la primera vez:**

1. **Un par de claves RSA por cliente**, para su usuario de servicio. Es el mismo
   pedido que se le hizo a datos para UA en
   `docs/MENSAJE-2026-09-22-datos-agente-cortex.md` — se repite en cada alta.
2. **`kms_key_arn` es obligatorio.** El alta toca AWS KMS.

**La clave privada se cifra en la base** con `DATA_ENCRYPTION_KEY`, que se lee
como **base64 de 32 bytes**. Si esa variable cambia entre ambientes, lo guardado
no descifra y **el error no dice eso**: `/config/*` sigue andando y lo que se cae
es `/admin/*`. Ver `dev/postgres/README.md`.

---

## Paso 6 · Crear el tenant y su agente

```bash
POST /api/v1/admin/tenants     # los siete campos del paso 5
POST /api/v1/admin/agents      # tenant_id name target_role
                               # snowflake_db snowflake_schema
                               # snowflake_cortex_agent_name warehouse
```

**El agente aporta `db` y `schema`, que es con lo que se califica todo lo
anterior.** Sólo el chat le pregunta algo; para el catálogo y la materialización
aporta credenciales y nada más — **no hay prompt que escribir.**

**Aviso sobre el error de `POST /admin/agents`:** hoy devuelve el volcado crudo
del validador de Go —`Key: 'createAgentRequest.tenant_id' Error:Field
validation…`—. `POST /admin/tenants` sí está traducido. Pedido en
`docs/MENSAJE-2026-09-28-backend-lo-que-piden.md`.

---

## Paso 7 · Cargar el dato · **y acá hace falta la máquina del backend**

| | Cómo | Medido el 2026-09-28 |
|---|---|---|
| Catálogo | **Sólo CLI** | `POST /admin/tenants/{id}/sync-catalog` → **404** |
| Materialización | CLI **y API** | `POST /admin/tenants/{id}/materialize` → **202** |

```bash
make sync-catalog TENANT_ID=<uuid> [ROLE=admin]
make materialize  TENANT_ID=<uuid> [PERIOD=2026-09] [ROLE=…] [METRICS=…]
```

**No hay alta autoservicio hoy**: el sync del catálogo obliga a entrar a la
máquina. Es una vez por cliente, pero conviene no prometer otra cosa.

**Verificación:**

```
GET  /api/v1/config/catalog                    → las métricas del cliente
POST /api/v1/config/panels:batch               → AVAILABLE con valores reales
```

**El resultado correcto son valores distintos a los de la semilla.** Que conteste
200 no alcanza: la semilla también contesta 200. Es la lección del 2026-09-24 —
«verificado contra el servicio real» y «verificado con datos reales» son dos
afirmaciones distintas, y la primera se dice sola.

---

## Paso 8 · Recién ahí, el producto

Componer el dashboard en el builder, definir roles y publicar. **Eso sí tiene
pantallas y está construido.**

Hoy se compone desde cero: la herencia por plantilla de vertical que `design.md`
§3.4 describe **no existe en el backend** —medido contra `6e595e3`: la palabra
`vertical` no aparece en su código—. Ver `docs/PROPUESTA-2026-09-28-pantallas-de-alta.md` §5, D2.

---

## Los cuatro modos de falla, y cómo se distinguen

**Todos se ven parecido —paneles que no traen datos— y la causa es distinta.**

| Síntoma | Causa probable | Cómo se confirma |
|---|---|---|
| **Todos** en `BLOCKED` | Las claves del catálogo no caen en el registro · paso 3 | `SELECT METRIC_KEY FROM SYNAPSE_METRIC_CATALOG` contra la lista de doce |
| **Algunos** en `BLOCKED` | Falta una columna del paso 1 | `DESCRIBE` y contar las quince |
| `/admin/*` falla y la consola anda | `DATA_ENCRYPTION_KEY` distinta · paso 5 | El error nombra `decrypt SnowflakeURL` |
| `sync-catalog` falla sin decir qué | Falta el grant · paso 2 | `SHOW GRANTS ON VIEW SYNAPSE_METRIC_CATALOG` |

**El grant:** el rol del agente —`tenants.snowflake_role`— necesita `SELECT` sobre
la vista. Sin eso el error no dice qué falta.

---

## Lo que este runbook NO resuelve

- **Validar el contrato ANTES de intentar.** Hoy se descubre cuando los paneles
  salen bloqueados. Propuesto en `docs/DECISIONES-2026-09-28-alta-mas-simple.md`.
- **El alta sin entrar a la máquina.** Falta la ruta de `sync-catalog`.
- **La composición de arranque.** Sin plantilla de vertical, cada cliente se
  compone desde cero en el builder.
