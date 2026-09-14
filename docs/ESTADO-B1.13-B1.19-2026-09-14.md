# Estado de B1.13 – B1.19 · para el equipo de backend

**2026-09-14.** Verificado contra el servicio corriendo en local desde la rama
`feature/dynamic-dashboard-backend`, commit `733c13c`, con el tenant y el layout
que dejó el seed. **Nada de esto es deducido del código**: cada afirmación sale
de una respuesta real, y abajo dice cuál.

---

## ⚠️ Primero: la numeración se separó, y hay un ancestro que lo resuelve

Los identificadores de este documento son los de **`tareas-front-back.md`**, que
es el **ancestro común de los dos planes**: está en la raíz de `synapse-api-go` y
en la raíz del repo de front, y son **el mismo archivo byte a byte** — mismo md5,
verificado hoy.

`plan-de-trabajo.md` del front lo declara desde su primera línea —«se conservan
sus identificadores `B*` / `F*` para no perder el hilo»— y lo cumple: **los 151
identificadores del ancestro siguen ahí**, 144 con tarea propia y 7 absorbidos
por otra que dice cuál. Desde hoy lo verifica una herramienta en cada corrida de
la puerta, porque una promesa que no se verifica no se sostiene.

**`docs/dynamic-dashboard-backend.md` renumeró desde `B1.4` en adelante**, y
comprimió las 19 tareas de Fase 1 del ancestro en 14. No es un reproche: pasa
solo cuando dos equipos escriben su propio plan. Pero **los códigos ya están
cargados en la plataforma de seguimiento con la numeración del ancestro**, así
que hoy «B1.13» significa dos cosas según quién lo lea.

| ID del ancestro | Qué es | En su documento aparece como |
|---|---|---|
| **B1.13** | `Presentation` opcional: label, medidor, comparativo, nota | B1.11 |
| **B1.14** | Transformación a las 12+ formas de `Valor` | B1.12 |
| **B1.15** | Validar reglas mínimas **por forma** | B1.8 (pero valida por tipo) |
| **B1.16** | Seed de demo | B0.6 |
| **B1.17** | Modelo `Metrica` completo | — (dentro de B0.1 y el catálogo) |
| **B1.18** | Sincronizar catálogo con Snowflake | B1.13 |
| **B1.19** | Filtrar catálogo por rol | B1.2 |

Y donde más confunde: **su `B1.13` es el `B1.18` del ancestro.** Un ticket que
diga «B1.13 hecho» se entiende como «presentación lista» o como «catálogo
sincronizado» según el lado.

**Lo que pedimos, y es lo más barato de todo este documento:** volver a los
identificadores del ancestro en su plan, o agregarle una columna que mapee los
suyos a los de él. No hace falta tocar sus commits ni su historia — alcanza con
que el documento diga la equivalencia, como la dice esta tabla.

## Resumen

| | Tarea | Estado |
|---|---|---|
| B1.16 | Seed de demo | ✅ **Hecho**, y excede lo pedido |
| B1.13 | `Presentation` opcional | ⚠️ **Parcial** · solo para dos formas |
| B1.14 | Formas de `Valor` | ⚠️ **Parcial** · 9 de 16 |
| B1.15 | Reglas mínimas por forma | ⚠️ **Parcial** · valida por TIPO, no por forma |
| B1.17 | Modelo `Metrica` | ⚠️ **Parcial** · 11 de 15 campos |
| B1.18 | Sync de catálogo | ⚠️ **Código hecho, no ejecutable** |
| B1.19 | Filtrar por rol | ❓ **No verificable hoy** · ver abajo |

**Nada está bloqueando al front.** La consola renderiza los doce paneles contra
el servicio real, con datos del negocio y cero paneles en `ERROR`. Lo que sigue
son huecos que se ven en pantalla, no cosas que impidan trabajar.

---

## B1.16 · Seed de demo → ✅ hecho

Pedía «1 tenant, 1 layout, 1 pestaña, 4–6 paneles». Entrega **12 paneles** con
**6 tipos distintos** —`prose`, `kpi`, `bars`, `series`, `table`, `reco`— y 12
métricas, sobre un layout publicado `Overview` con su pregunta operativa.

> *Cómo se verificó:* `GET /config/tabs/{tabId}` devuelve 12 paneles;
> `GET /config/catalog`, 12 métricas.

**Falta una métrica que el ancestro pide por nombre.** `B1.16` dice
textualmente «seed de 1 tenant + 1 layout publicado + 1 pestaña con 4–6 paneles
de ejemplo **(Brand Momentum)**», y esa métrica no está. Las doce son
`daily_trend`,
`decisions`, `executive_summary`, `goals_vs_actual`, `investment`,
`investment_by_platform`, `orders`, `roas`, `sales`, `twelve_month_efficiency`,
`units`, `visits`.

No sabemos si sigue siendo un requisito o si quedó viejo. Si quedó viejo, lo
mejor es **sacarlo del ancestro**, que es de los dos: mientras esté escrito, el
próximo que lea la tarea la va a dar por incompleta.

---

## B1.13 · `Presentation` opcional → ⚠️ parcial

**Lo que llega es exactamente lo que se pidió, y está muy bien armado:**

```json
"presentation": {
  "label": "USD · TOTAL",
  "meter": { "label": "PERFORMANCE WEIGHT", "percentage": 61,
             "note": "USD 2.61M OF USD 4.28M" },
  "comparative": [ { "label": "VS PREVIOUS MONTH", "delta": 6.4 },
                   { "label": "VS PRIOR YEAR",     "delta": 11.2 } ]
}
```

**Faltan dos cosas.**

**1 · Solo se emite para `scalar` y `scalar_with_interval`.**
`PresentationFromRows` devuelve `nil` para las otras siete formas, así que un
panel de barras, de tabla o de serie **llega sin rótulo**. Eso choca con una
regla dura del producto: «ningún número desnudo — todo valor lleva label».

> *Cómo se verificó:* de los 12 payloads del batch, solo los 6 de forma `scalar`
> traen `presentation`.

**2 · No llega la `nota` de panel.** El contrato declara una nota al pie
—«lectura al pie del panel, cuando la métrica la necesita»—, distinta de la
`note` que va dentro del `meter`. Esa última sí llega; la de panel no existe.

---

## B1.14 · Las formas de `Valor` → ⚠️ 9 de 16

`TransformValue` produce nueve: `scalar`, `scalar_with_interval`, `time_series`,
`multi_series`, `categorical`, `ranking`, `tabular`, `prose`, `composition`.
**Las nueve están bien y el front las traduce sin pérdida.**

**Faltan siete**, que el contrato declara y el `switch` no tiene:
`distribution`, `series_with_band`, `compared_categorical`,
`multi_attribute_profile`, `matrix`, `graph`, `flow`.

**No es urgente y conviene decir por qué**: sus consumidores son los cuerpos
`comparison`, `matrix`, `graph` y `distribution`, y el front tampoco los va a
construir hasta que exista una métrica que los use. **Entran juntos o no entran.**

Una trampa que vale registrar: una métrica cuyo `shape` no esté entre las nueve
**sincroniza bien en el catálogo y falla al materializar**, dos pasos después.
Hoy el front la rechaza en su adaptador y el panel sale en `ERROR` con la razón;
sería mejor que no llegara al catálogo.

---

## B1.15 · Reglas mínimas por forma → ⚠️ valida por tipo, no por forma

`validatePanelOptions` valida por **tipo de bloque**: `gauge` exige `maximum`,
`forecast` exige `horizon`. Funciona y el front lo ve —un panel mal configurado
llega en `ERROR` con el mensaje—.

Lo que no hay es validación **por forma del valor**, y hay dos casos donde el
front hoy tiene que rechazar el payload:

| Forma | La regla | Qué pasa hoy |
|---|---|---|
| `composition` | Cada parte necesita su `percentage` | Es opcional: solo sale si venía en la fila. Sin él, el front pone el panel en `ERROR` |
| `scalar_with_interval` | `lo`, `hi` y `level` obligatorios | Si falta uno, el front rechaza: «un pronóstico sin banda no se publica» |

**El porcentaje no lo puede calcular el front**, y la razón está escrita en el
contrato: la suma tiene que dar 100, y redondear en el cliente produce columnas
que suman 99,9.

---

## B1.17 · Modelo `Metrica` → ⚠️ 11 de 15 campos

**Llegan:** `id`, `tenant_id`, `key`, `name`, `shape`, `family`, `layer`,
`source`, `base`, `semantic_direction`, `min_grain`, `dimensions`,
`catalog_version`, `created_at`, `updated_at`.

**Faltan cuatro**, y uno de ellos se ve en pantalla:

| Campo | Qué es | Impacto |
|---|---|---|
| **`window`** | La otra mitad de la BASE: el período que mide | **Se ve.** La cabecera pinta `Base · {base} · {window}` en los 12 paneles y en los 7 estados; sin él la línea queda `Base · COMPLETED · MONTH ·` con el separador colgando |
| `state` + `state_reason` | El gobierno de la métrica (no el del panel) | Hoy no lo usa nadie en el front |
| `reading_note` | Lo que hay que saber para no malinterpretarla | Idem |

**`window` es el único de los cuatro que pedimos.** Es una columna de texto
hermana de `base`, redactada —«Venta media de los últimos treinta días»—. **No se
puede derivar del período**: dos métricas consultadas con el mismo `2026-09`
pueden tener ventanas distintas, un total mensual y un promedio móvil de treinta
días. El front no la inventa.

**Y algo aparte: `unit` llega `null` en las doce.** No es un campo faltante —
existe—, pero ninguna métrica lo declara. La consecuencia es que un ROAS de 4.1
se lee `4.1` y no `4.1x`, y las cifras en dinero dependen de que el `label` de la
presentación diga «USD». Para las escalares funciona; para una tabla o una serie
no hay label donde meterlo.

> *Cómo se verificó:* las 12 métricas de `GET /config/catalog` tienen
> `unit: null`, y ninguna trae las claves `window`, `state` ni `reading_note`.

---

## B1.18 · Sync del catálogo con Snowflake → ⚠️ código hecho, no ejecutable

`DDCatalogSyncService` y el CLI existen y están bien. **Pero
`SYNAPSE_METRIC_CATALOG` no existe en ninguna base de la cuenta** —verificado con
`SHOW OBJECTS LIKE '%METRIC_CATALOG%'` y `LIKE '%SYNAPSE_METRIC%'`, cero filas—,
así que `make sync-catalog` falla y el catálogo que sirve la API sale del seed de
Postgres.

**Y hay un matiz en el nombre de la tarea.** Dice «sincronizar con semantic
views», y el servicio hace un `SELECT` de once columnas contra **una vista
plana**. Son cosas distintas, y la diferencia importa: probamos
`INFORMATION_SCHEMA.SEMANTIC_METRICS` y **no trae ningún campo de gobierno** —da
nombre, expresión, tipo y sinónimos, y nada de `base`, `family`, `layer` o
`source`—. O sea que el catálogo **no se puede derivar de la capa semántica**: lo
editorial hay que curarlo.

**Dejamos el SQL escrito para que lo revise un ingeniero de datos**, con esa
separación resuelta: una tabla de curaduría, la vista que ustedes leen, y una
tercera que lista lo que está mal con su razón. Está en
`docs/snowflake/SYNAPSE_METRIC_CATALOG.sql`, y los pasos en
`docs/snowflake/INSTRUCCION-ALTA-TENANT.md`. **No corrimos nada**: las tres
consultas fueron de solo lectura.

**Un cuidado que encontramos y conviene que sepan:** la clave del catálogo tiene
que caer en `MetricRegistry` o en el alias de `keys.go`. Una clave que no está
sincroniza bien y después **todos los paneles salen `BLOCKED` sin que nada lo
explique**. Nos pasó al escribir la primera versión del seed del SQL.

---

## B1.19 · Filtrar el catálogo por rol → ❓ no verificable hoy

El mecanismo está en el código —`roles.hidden_metric_ids`, aplicado en `/config/catalog`
y en `/config/tabs/:tabId`— y su documento dice que `planner` oculta
`executive_summary`, `roas` y `decisions`.

**Con el usuario con el que entramos no se puede comprobar.** El rol se llama
`Planner` y ve **las doce métricas**, incluidas esas tres: los paneles de
Executive summary, ROAS y Decisions están en pantalla.

No decimos que esté roto. Lo más probable es que **ese rol sea otra fila** que la
que el seed configura —`Planner` con mayúscula frente a `planner`— y que no tenga
`hidden_metric_ids` cargado.

**Lo que haría falta para cerrarla:** un usuario de prueba con un rol que sí tenga
métricas ocultas. Con eso comprobamos las dos mitades en un minuto — que el
catálogo venga recortado y que un panel oculto llegue en `FORBIDDEN`.

> *Cómo se verificó:* login real, `role.name = "Planner"`,
> `GET /config/catalog` → 12 métricas, y las tres «ocultas» entre ellas.

---

## Lo que pedimos, en orden de esfuerzo de ustedes

1. **`window` en el catálogo** — una columna de texto. Es el único hueco que se
   ve en los doce paneles.
2. **`theme` en `GET /config/me`** — el campo existe en `users` y el `PUT` ya lo
   escribe. Hoy se guarda y no se puede leer, así que la consola no puede
   restaurar la preferencia del usuario.
3. **Un usuario de prueba con rol restringido** — para cerrar B1.19.
4. **`percentage` siempre en `composition`.**
5. **`presentation` para las formas que no son escalares** — es la que choca con
   «ningún número desnudo».
6. **La vista `SYNAPSE_METRIC_CATALOG`** — con el SQL que dejamos, si les sirve.
7. **Los identificadores del ancestro en su plan**, o una columna de
   equivalencia. Es edición de un documento y evita que dos equipos entiendan
   cosas distintas del mismo ticket.

---

## Lo que NO les estamos pidiendo, para que no lo lean como deuda

- **Las siete formas que faltan.** Entran cuando exista una métrica que las use;
  el front tampoco tiene sus cuerpos.
- **Renombrar nada.** El servicio habla inglés snake_case y el contrato del front
  habla otra cosa; **eso lo absorbe un adaptador nuestro** y ya está hecho. No
  hace falta que toquen sus DTOs.
- **El envelope de error.** Lo manejamos. Cuando adopten §4.1 lo simplificamos
  nosotros.

El detalle campo por campo de todo lo anterior está en
`docs/PLAN-INTEGRACION-2026-09-11.md`.
