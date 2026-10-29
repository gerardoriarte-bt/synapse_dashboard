# Propuesta · cada métrica es una vista, y el backend la lee por su forma · 2026-10-29

**Para:** backend y producto. Es una forma concreta de la opción B de B1.26,
la que quedó «sin fecha» el 2026-10-21.

**Qué se midió:** el backend en `d296e6d`
(`origin/feature/dynamic-dashboard-backend`): `MetricRegistry`, el bucle del
materializador y los transformadores de `materialize/`. Las vistas de UA y el
notebook de Terpel están medidos en
`docs/AUDITORIA-2026-10-29-metricas-de-ua-tabla-resumen.md` y
`docs/AUDITORIA-2026-10-29-metricas-de-terpel-notebook.md`.

## El problema, en una línea

**Hoy cada métrica de cada cliente es código Go.** Keralty tiene 15 métricas en
su catálogo y Terpel 10, y ninguna muestra una cifra
(`docs/AUDITORIA-2026-10-22-catalogo-de-keralty-y-terpel.md`). A UA le
llegaron once métricas nuevas en una tabla resumen, y cada una necesitaría su
entrada en el registro. Con B1.26 en A, sumar un cliente o una métrica es
siempre trabajo del backend.

## La propuesta, en una línea

**Datos publica cada métrica como una vista con columnas fijas según su forma,
y el backend tiene un solo lector que la consulta por período y le pasa las
filas al transformador que ya existe.** Sumar una métrica pasa a ser: una
vista más una fila de catálogo. Sin código.

## 1. Por qué esto es chico: la mitad ya existe

El materializador ya separa dos cosas:

| Qué | Dónde vive | ¿Es por métrica? |
|---|---|---|
| **La consulta**: `BuildSQL` y, a veces, `ProcessRows` | `MetricRegistry`, en `snowflake/queries.go` | **Sí**: es el código que hoy se escribe por métrica |
| **La transformación** de las filas a la forma del cable | `materialize.Materialize(shape, rows, opts)` | **No**: es una por forma |

Y **cada transformador ya lee columnas con nombres fijos**, sin importar las
mayúsculas (`lookup` en `materialize/rows.go`). Por ejemplo, `scalar` lee
`v`; `scalar_with_interval` lee `v`, `lo`, `hi` y `level`; `categorical`
lee `label` y `v`. **Ese es el contrato.** Ya está escrito en Go; lo único
que falta es que la consulta salga de una vista y no de un `fmt.Sprintf`.

El punto donde se engancha también existe. En
`services/dd_materializer_service.go`, cuando una métrica del catálogo no está
en el registro, el bucle hace esto:

```go
spec, ok := sfspec.MetricRegistry[canonical]
...
if !ok {
    // BLOCKED · "No Snowflake query registered for metric %q"
}
```

La propuesta cambia **sólo esa rama**: antes de bloquear, busca la vista de la
métrica.

## 2. El contrato

### 2.1 · El nombre de la vista

```
<base>.<esquema del cliente>.SYNAPSE_M_<METRIC_KEY en mayúsculas>
```

Por ejemplo, `SYNAPSE_M_CVR` o `SYNAPSE_M_MEDIA_INVESTMENT`.

- **Por convención, no con una columna nueva.** Así el sync del catálogo no
  cambia, y siguen siendo las mismas doce columnas de `CatalogViewColumns`.
- **El backend arma el identificador; no lo recibe.** La clave se valida contra
  `^[a-z0-9_]+$` y la base y el esquema son los de la conexión del cliente.
  **No hay SQL libre en ningún lado**: lo que corre es siempre
  `SELECT * FROM <identificador> WHERE PERIODO = ?`.
- **Los permisos los pone Snowflake.** La consulta corre con el rol del
  cliente, así que una vista que el rol no ve da ERROR con la razón.

### 2.2 · Las columnas

**Una columna común:** `PERIODO`, texto `YYYY-MM`, que es el mismo formato que
`ParsePeriod`. La vista devuelve, para cada período, **las filas que responden
ese período**: una fila para una cifra, doce para una serie de doce meses.

**Las columnas por forma son las que los transformadores ya leen**, sacadas de
`transform.go` y `transform_v11.go`. Van en la tabla con su nombre principal;
los transformadores también aceptan sinónimos en español.

| SHAPE | Columnas obligatorias | Opcionales |
|---|---|---|
| `scalar` | `v` | presentación (§2.3) |
| `scalar_with_interval` | `v`, `lo`, `hi`, `level` · **una sola fila** | — |
| `categorical`, `ranking` | `label`, `v` | `position` |
| `time_series` | `t`, `v` | — |
| `multi_series` | `series`, `t`, `v` | `unit`, `partial` |
| `series_with_band` | `t`, `v`, `lo`, `hi` | `level` |
| `composition` | `label`, `v` | `percentage` |
| `compared_categorical` | `label`, `v`, `reference` | `delta` |
| `multi_attribute_profile` | `profile`, `attribute`, `v` | — |
| `matrix` | `row`, `column`, `v` | — |
| `distribution` | `label`, `v` | `lo`, `hi` |
| `graph`, `flow` | `from`, `to`, `v` | `from_label`, `to_label` |

**Quedan afuera, a propósito:**

- **`prose`**: la redacta el agente, y ya tiene su propio camino
  (`proseWithoutQuery`).
- **`tabular`**, en esta primera etapa. Sin `TabularColumns`, el backend
  infiere las columnas recorriendo un mapa (`inferTabularColumns`). Eso deja
  el título igual a la clave y el orden al azar, y además descarta `label`,
  que es el defecto de `docs/MENSAJE-2026-10-09-backend-tablas-del-chat.md`.
  Una tabla necesita declarar sus columnas, y eso es una segunda etapa (§5).

### 2.3 · La presentación de las cifras

Una cifra simple puede traer su presentación en las mismas filas. Hoy lo lee
`PresentationFromRows`:

- `presentation_label`
- `meter_label`, `meter_percentage` y `meter_note`, para el medidor «% de la
  meta»
- **las filas comparativas**, con `comp_label` y `comp_delta`

Son opcionales: una vista que sólo trae `PERIODO` y `v` funciona igual.

### 2.4 · Ejemplos

**UA · CVR** (sobre la vista del 28, con la regla de suma sobre suma):

```sql
CREATE VIEW SYNAPSE_M_CVR AS
SELECT TO_CHAR(DATE_TRUNC('month', DATE), 'YYYY-MM')                    AS PERIODO,
       ROUND(SUM(ORDERS_TOTAL) / NULLIF(SUM(VISITS_TOTAL), 0) * 100, 2) AS V
  FROM GLD_ECOMM_METRICS_DAILY
 WHERE REV_TOTAL IS NOT NULL
 GROUP BY 1;
```

**UA · Category Mix** (`composition`):

```sql
CREATE VIEW SYNAPSE_M_CATEGORY_MIX AS
SELECT TO_CHAR(DATE_TRUNC('month', DATE), 'YYYY-MM') AS PERIODO,
       CATEGORIA_PRODUCTO                             AS LABEL,
       SUM(INGRESOS_USD)                              AS V
  FROM GLD_PRODUCTO_METRICS_BY_CATEGORY
 GROUP BY 1, 2;
```

La regla de suma sobre suma queda **adentro de la vista**: el backend no
agrega nada, sólo filtra por período.

**Terpel · inversión digital.** Depende de cómo se asigna una campaña a un mes
(§2.1 de la auditoría de Terpel), y eso todavía no está medido. **La vista es
exactamente donde esa regla queda escrita**, y la escribe datos, que es quien
la conoce.

## 3. Lo que cambia para cada equipo

| Equipo | Hace una vez | Hace por cada métrica nueva |
|---|---|---|
| **Backend** | El lector de la vista en la rama de §1. `schema-check` revisa que la vista exista y tenga `PERIODO` y las columnas de su forma | **Nada** |
| **Datos** | Aprender el contrato. Una vista de validación tipo `SYNAPSE_METRIC_CATALOG_ISSUES` que marque las vistas que no lo cumplen | La vista `SYNAPSE_M_*` y la fila del catálogo |
| **Front** | **Nada**: dibuja por forma, y el cable no cambia | Nada |

**UA sigue igual.** El registro tiene prioridad: una clave que está en
`MetricRegistry` se calcula como hoy. La vista sólo se busca para las claves
que no están, que hoy salen bloqueadas. No hay migración, y las 18 de UA
pueden pasarse a vistas de a una, si alguna vez conviene, o nunca.

## 4. Lo que se gana y lo que cuesta

**Se gana:**

- **Keralty y Terpel pueden mostrar cifras sin código del backend**: 25
  métricas que hoy están bloqueadas.
- **El cálculo queda donde ya está.** Las vistas de UA del 28 ya calculan MER,
  CVR y nCAC. Con el registro, el backend reescribe esa lógica en Go o la lee
  tal cual; con esta propuesta, la lee.
- **Una sola definición por métrica**, versionada en Snowflake, y la misma
  vista puede alimentar más adelante una vista semántica para el chat. Eso
  ataca el caso del 7,28 contra 2,07
  (`docs/AUDITORIA-2026-10-19-prosa-por-metrica.md`).

**Cuesta, y conviene decirlo antes:**

- **Un error de cálculo pasa a ser de datos.** Ya es así: el nCAC de UA sale
  mal en la vista, no en Go. Lo que cambia es que **nadie lo revisa al pasarlo
  a código**. Por eso la vista de validación del contrato no es opcional, y
  conviene una revisión de la vista antes de activar la fila del catálogo.
- **El error se ve en la consola, no en un deploy.** Una vista que no cumple
  el contrato produce `ErrMissingField` y el panel queda en ERROR con la
  razón. Es la degradación declarada que ya existe, no un número inventado.
- **El rendimiento queda en manos de la vista.** El materializador corre una
  vez por día y por período, así que una vista pesada cuesta warehouse pero no
  latencia al usuario. Si hace falta, datos la convierte en tabla dinámica sin
  que el backend se entere.
- **El drill-down no entra.** Las rutas de C2 tienen su propia consulta por
  dimensión, y extender el contrato a eso es otra conversación.

## 5. Lo que queda abierto

1. **Las tablas.** O la fila del catálogo declara sus columnas (un JSON con
   clave, título, unidad y decimales, como `ColumnDef`), o una vista auxiliar
   `SYNAPSE_M_<KEY>_COLUMNS` las describe. Se decide cuando haya una tabla que
   lo pida.
2. **Dónde registrar la consulta que se corrió.** Hoy `last_error` guarda el
   motivo técnico. Conviene que el detalle diga «vista `SYNAPSE_M_…`» para que
   un ERROR se diagnostique sin leer código.
3. **El nombre del prefijo.** `SYNAPSE_M_` es una propuesta; lo que importa es
   que sea uno solo para todos los clientes.

## 6. Lo que esta propuesta no es

- **No es un editor de consultas.** El backend ya dijo que no va a construir
  uno, y acá no hay SQL que viaje por la API ni que escriba un usuario. La
  consulta vive en Snowflake, gobernada por datos.
- **No es que el agente calcule las cifras.** Un número del tablero tiene que
  ser reproducible.
- **No le cambia nada al front ni al contrato** (`contracts/`).
