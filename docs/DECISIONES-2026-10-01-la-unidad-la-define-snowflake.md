# La unidad de una cifra la define Snowflake, por métrica · 2026-10-01

> **Decisión tomada**, con lo que se midió para tomarla y lo que se descartó.
> Tiene fecha y **no se edita después**.
>
> Extiende `docs/DECISIONES-2026-10-01-la-moneda-del-tenant.md`, que fijó el
> VALOR —USD para UA MX—. Ésta fija **quién lo define**, que es la pregunta de
> atrás y la que evita volver a discutirlo con el próximo tenant.

---

## La decisión

**La unidad de una cifra la declara el catálogo de Snowflake, por métrica.
Lo que venga en `UNIT`, así se muestra.**

No se deduce del país del cliente, ni del `locale`, ni del huso, ni se elige en
un componente, ni se cablea en el front.

---

## Y para las cifras YA ES ASÍ · medido de punta a punta el 2026-10-01

```
SYNAPSE_METRIC_CATALOG.UNIT       ← columna 8 de la vista · «USD, %, x, un
                                     sustantivo, o NULL» · POR MÉTRICA
   │
   ├─ sync-catalog  →  dd_metrics.unit
   ├─ GET /config/catalog  →  `unit`
   ├─ src/api/adapt.ts  →  `unidad`
   └─ format.withUnit  →  «USD 4.28M»
```

**`format.withUnit` ya trata tres casos y no dos**, y su comentario explica por
qué: el catálogo guarda en `unidad` símbolos (`%`, `x`), códigos de moneda
(`USD`) y **nombres** (`órdenes`, `visitas`). Antepone el código, pega el
símbolo, y el nombre va al label. O sea que la decisión ya está implementada:
lo único que faltaba era declararla.

**No hay nada que construir del lado del front.**

## Dónde NO la define Snowflake, y es una línea

`dd_materializer_service.go:244` arma el pedido de prosa con
`Currency: tenant.Currency` —la columna de Postgres—, y el prompt escribe
«con montos en `<esa>`». Con `COP` producía:

> «los ingresos alcanzaron **COP 1.144.876**»

mientras el KPI de al lado, que sí lee el catálogo, mostraba `USD 1,232,721`.

**El `Context` que recibe el agente son las cifras sin unidad** —
`Context map[string]any`, «las cifras ya materializadas del período»—, así que
hoy el agente no tiene de dónde sacarla salvo ese campo del tenant.

---

## Por qué POR MÉTRICA y no por tenant · es lo que decide el diseño

**Un campo por tenant no puede expresar dos monedas, y uno por métrica sí.**

Hoy no muerde porque las cinco métricas de dinero de UA están en USD. Muerde el
día que un tenant tenga ingresos en USD e inversión local en su moneda: el campo
del tenant obliga a elegir una y rotular la otra mal, en silencio y con
aritmética coherente — que es el peor modo de falla que este producto tiene.

**Y la unidad no siempre es una moneda.** De las métricas curadas hoy: `%`, `x`,
`órdenes`, `unidades`, `visitas`. «La moneda del tenant» no tiene nada que decir
sobre ellas; «la unidad de la métrica» las cubre todas con una sola regla.

---

## El estado real de la cobertura · medido, no supuesto

`GET /config/catalog` contra `d9147c3`, 21 métricas. **`catalog_version` las
separa:**

| Origen | Cuántas | Con `unit` |
|---|---|---|
| **Snowflake · v4** (la curación más reciente) | 9 | **9 · el 100 %** |
| **Snowflake · v3** | 4 | 1 —`spend`— |
| **Semilla del backend · v1** | 8 | 0 |

**Las tres de Snowflake sin unidad son `daily_trend`, `media_efficiency_12m` y
`platform_return`, y no son el mismo caso:**

| | Qué le falta |
|---|---|
| `media_efficiency_12m` | Es ROAS · le corresponde `x`, que `roas` ya declara. **Es un olvido** |
| `platform_return` | Es ROAS reportado por la plataforma · igual, `x`. **Es un olvido** |
| `daily_trend` | **Correcto que no tenga**: mezcla venta, visitas e inversión en una sola métrica, así que no hay UNA unidad |

**Y `daily_trend` es el mismo hallazgo que la auditoría de comprensión de
gráficos** —§3.2, «tres series en un eje, sin leyenda, y dos quedan pegadas al
piso porque están en otra magnitud»—. **El catálogo ya lo estaba diciendo**: una
métrica sin unidad es una métrica que mezcla magnitudes. Es una señal que se
puede leer sin mirar el gráfico.

**Las ocho de la semilla no son un hueco de datos**: desaparecen cuando el
backend deje de servirlas desde su `seed`.

---

## Lo que esta regla obliga, y a quién

| | Qué | De quién |
|---|---|---|
| 1 | **El agente recibe la unidad de cada métrica del contexto**, no la moneda del tenant | Backend · `dd_prose.go` y `dd_materializer_service.go:244` |
| 2 | `media_efficiency_12m` y `platform_return` declaran `UNIT = 'x'` | Datos |
| 3 | `tenant.currency` queda como **respaldo**, no como fuente | Backend |
| 4 | El front: **nada** | — |

**El punto 3 importa y no es cosmético.** El campo no se borra: hace falta para
una cifra sin unidad propia y para que el agente no se quede sin nada que
escribir. Lo que cambia es su rango: **cuando discrepe con el `unit` de la
métrica, gana la métrica**, porque es quien conoce el dato.

---

## Lo que se descartó

| Opción | Por qué no |
|---|---|
| **Que el front resuelva el conflicto** entre `tenant.currency` y `unit` | Ya lo resuelve, de hecho: no lee el campo del tenant. Agregarle una comparación sería escribir una regla de datos en la capa de dibujo |
| **Borrar `tenant.currency`** | Deja al agente sin respaldo y a la ficha de cliente sin el dato. El campo no está de más: estaba mal usado |
| **Un chequeo en la puerta que compare los dos** | Tentador y no se puede: la puerta corre sin red y sin servicio. Lo que sí puede hacerlo es la octava regla de `SYNAPSE_METRIC_CATALOG_ISSUES`, que ya detecta sola las filas con `SEMANTIC_DIRECTION` en código |
| **Derivar `tenant.currency` del catálogo en el `sync`** | Funciona mientras haya una sola moneda, y falla callado cuando haya dos. Si se hace, que sea con la regla «si las métricas monetarias declaran más de una, es un error y no se elige» |

---

## La regla, en una línea, para citar

**El dueño de la unidad de una cifra es el catálogo, por métrica. El tenant es
respaldo. Y la unidad no se deduce del país.**
