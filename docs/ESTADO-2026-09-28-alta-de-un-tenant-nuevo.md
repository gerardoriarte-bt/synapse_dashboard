# ¿Qué hace falta para dar de alta un cliente NUEVO? · 2026-09-28

> Contesta la pregunta de hoy: hasta ahora todo se contrastó contra UA MX, que ya
> estaba. Esto es qué pasa con uno desde cero. **Medido contra upstream
> `f70cec2`** corriendo en `:4010`, salvo lo que se dice que no se midió.

## La respuesta corta

**Hay proceso escrito y está casi entero, pero tiene UN agujero conocido y
declarado**, y es el que este documento existe para no dejar pasar:

- **El flujo técnico existe y funciona** — siete pasos, abajo, y todas sus rutas
  contestan.
- **`B1.26` está ⬜ y su título es literalmente «Decidir cómo escala el registro,
  ANTES del segundo tenant».** Nadie la tomó. Es la decisión que hace que el
  proceso sirva para uno o para muchos.
- **No hay pantalla para nada de esto.** Es todo API y CLI del backend.

## Los dos documentos que ya existen, y qué NO son

| Archivo | Qué es |
|---|---|
| `docs/snowflake/CONTRATO-DE-TENANT.md` | **Qué tiene que tener un tenant en Snowflake** · las quince columnas exactas |
| `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` | Los cinco pasos del lado de Snowflake, con verificación por paso |
| `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` | El SQL que datos corre |

**Los dos primeros son del 2026-09-11 y están escritos como PEDIDO a datos para
UA MX, no como runbook.** Varias de sus afirmaciones ya vencieron —dicen que
`SYNAPSE_METRIC_CATALOG` no existe, y existe desde el 15—. Sirven de referencia
técnica; **no sirven para entregárselos a alguien y que dé de alta un cliente.**

## El flujo completo, con quién hace cada cosa

### 1 · Snowflake · **datos** · lo que el cliente tiene que exponer

Dos objetos con **quince nombres de columna exactos**. Los nombres de las TABLAS
son configurables por entorno; **los de las COLUMNAS no** — están escritos dentro
del SQL de cada query en Go.

| Objeto · `DD_SNOWFLAKE_ECOMM_TABLE` | Columnas |
|---|---|
| ecommerce | `DATE` `REV_TOTAL` `REV_TARGET` `ORDERS_TOTAL` `ORDERS_TARGET` `UNITS_TOTAL` `UNITS_TARGET` `VISITS_TOTAL` `VISITS_TARGET` `GROSS_SPEND` `BUDGET_TARGET` |
| medios pagos | `DATE` `FUENTE` `COST_USD` `INGRESOS_USD` |

**Un cliente que no tenga `BUDGET_TARGET` no tiene `goal_attainment`.** Hoy eso
sale como panel bloqueado sin razón, que es una de las cuatro cosas que `B1.26`
pide resolver.

### 2 · Snowflake · **datos** · la vista de catálogo

Correr `SYNAPSE_METRIC_CATALOG.sql` en **el mismo `db.schema` que se le configure
al agente del tenant**, porque el backend califica la vista con eso y no con una
ruta fija. Crea tres objetos: la tabla editorial, la vista que el backend lee, y
la vista de issues.

**Verificación:** `SELECT * FROM SYNAPSE_METRIC_CATALOG_ISSUES;` → cero filas.

### 3 · Snowflake · **producto + datos** · curar el gobierno

`BASE`, `MEASUREMENT_WINDOW` y `SOURCE` se **redactan**, no se generan: se pintan
literales en la cabecera de todo panel y en todos sus estados. La semilla los deja
en `⟨REVISAR⟩` a propósito — **una BASE inventada se lee bien y miente.**

### 4 · Snowflake · **datos** · el grant

`SELECT` sobre la vista para el rol del agente. Sin esto `sync-catalog` falla con
un error de permisos que no dice qué falta.

### 5 · Backend · crear el tenant · **existe y se midió**

```
POST /api/v1/admin/tenants        → 400 con los siete campos nombrados en español
```

Pide `name`, `snowflake_url`, `snowflake_account`, `snowflake_user`,
`snowflake_role`, `private_key_pem` y **`kms_key_arn`**.

**Dos cosas que conviene ver acá.** La primera: hace falta **un par de claves RSA
por tenant** para `SYNAPSE_SERVICE_USER`, que es exactamente lo que se le pidió a
datos para UA en `docs/MENSAJE-2026-09-22-datos-agente-cortex.md` — o sea que ese
pedido se repite con cada cliente. La segunda: **`kms_key_arn` es obligatorio**,
así que el alta de un cliente toca AWS, no sólo Snowflake y Postgres.

### 6 · Backend · crear el agente

```
POST /api/v1/admin/agents         → 400 · existe
```

Es el que aporta `db` y `schema`. **Sólo el chat le pregunta algo**; para el
catálogo y la materialización aporta credenciales y nada más.

### 7 · Backend · cargar el dato · **y acá hay una asimetría**

| | Cómo se dispara | Medido |
|---|---|---|
| `sync-catalog` | **Sólo CLI** · `make sync-catalog TENANT_ID=<uuid>` | `POST /admin/tenants/{id}/sync-catalog` → **404** |
| `materialize` | CLI **y API** | `POST /admin/tenants/{id}/materialize` → **202** |

**La materialización se puede disparar remoto y el sync del catálogo no.** Para
dar de alta un cliente hay que entrar a la máquina del backend. No es un bloqueo
—es una vez por cliente— pero conviene saberlo antes de prometer un alta
autoservicio.

### 8 · Y recién ahí, el producto

Componer el dashboard en el builder, crear los roles y publicar. Eso sí tiene
pantallas y está construido.

## EL AGUJERO, Y ESTÁ DECLARADO DESDE EL 2026-09-11

**`B1.26 ⬜ · Decidir cómo escala el registro, antes del segundo tenant.**

El catálogo vive en Snowflake y el registro de queries en Go —`MetricRegistry`,
doce queries— y **son dos mitades del mismo hecho en dos lugares.** El puente es
un mapa de alias escrito a mano en `keys.go`.

**Un cliente cuyo catálogo declare `ventas` en vez de `revenue` no tiene alias, no
encuentra query, y la métrica sale BLOQUEADA sin que nada diga por qué.**

Con un tenant se sostiene. Con el segundo deja de sostenerse — y ése es
exactamente el caso que se está preguntando.

Los dos caminos, con su costo, están escritos en §7 de los dos documentos de
Snowflake y en el criterio de `B1.26`:

| | Qué implica | Costo |
|---|---|---|
| **A · contrato de forma** | Cada cliente expone los dos objetos con las quince columnas, vía una vista que renombre lo que ya tenga | Barato · rígido |
| **B · el registro pasa a ser dato** | `MetricRegistry` sale de Go a una tabla por tenant; la clave del catálogo **es** la del registro y el alias desaparece | Caro · flexible |

**La recomendación escrita es A para arrancar, con B declarado como destino y con
fecha.** «A sin fecha para B es cómo el mapa de alias termina con cuarenta
entradas.»

**Y la decisión no es del front.** Lo que sí es nuestro es que esté tomada antes y
no por omisión el día que alguien dé de alta al segundo cliente.

## Lo que NO existe hoy

- **Ninguna pantalla de alta.** `adminApi` expone `tenants()` y `agentes()` en
  **sólo lectura**; los `POST` de tenant y de agente no tienen cliente ni vista.
  A1 lista clientes, no los crea.
- **Ningún runbook operable.** Hay dos documentos técnicos escritos como pedido,
  con partes vencidas. Falta el que diga «para dar de alta a Terpel, hacé esto».
- **Ninguna validación de que el cliente cumpla el contrato** antes de intentarlo:
  hoy se descubre cuando los paneles salen bloqueados.

## Lo que se midió y lo que no

**Medido contra el servicio:** que existan `POST /admin/tenants`,
`POST /admin/agents` y `POST /admin/tenants/{id}/materialize`; que
`sync-catalog` no tenga ruta; los siete campos obligatorios del alta.

**NO medido:** un alta completa de punta a punta. Haría falta un cliente real en
Snowflake con sus quince columnas y un par de claves RSA. **Lo que este documento
afirma del camino feliz sale de leer el código y los documentos, no de haberlo
corrido**, y esa distinción es la lección del 2026-09-24: «verificado contra el
servicio real» y «verificado con datos reales» son dos afirmaciones distintas.

**Y `POST /admin/agents` vuelca el validador de Go crudo**, igual que
`/config/chat`. Son dos rutas, no una — se agrega al pedido de
`docs/MENSAJE-2026-09-28-backend-lo-que-piden.md`.
