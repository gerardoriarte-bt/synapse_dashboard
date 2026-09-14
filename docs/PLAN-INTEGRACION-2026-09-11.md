# Plan de integración con el backend real · 2026-09-11

**Fuentes de este análisis.** `docs/backdocs/` —los cuatro archivos que dejó el
desarrollador de backend— y el código de la rama
`feature/dynamic-dashboard-backend` de `AntPack-dev/synapse-api-go`, leído
directamente. Donde el documento y el código difieren, **manda el código**, y
difieren: la guía de Postman dice `status: DEGRADADO` y
`domain/dd_panel_data.go` declara `DEGRADED`.

**Nosotros no desarrollamos backend ni tocamos su repositorio.** Todo lo que
sigue se implementa acá. Lo que necesita el otro lado sale como pregunta, no
como parche.

---

## 0 · Lo que cambió

**El backend de la consola existe.** Hasta el 2026-09-08 el estado era «no hay
una sola tarea de front desbloqueada»: la consola pedía `/config/me`,
`/config/catalog`, `/config/tabs` y `/config/panels:batch` y ningún servicio los
exponía. Ahora los expone, y además expone **admin y builder**, que era la
superficie entera que faltaba.

Tres cosas se caen de `CLAUDE.md` con esto:

1. **No son dos servicios, es uno.** `internal/adapters/handler/router.go` monta
   `/auth/*`, `/config/*` y `/admin/*` en el mismo `v1 := router.Group("/api/v1")`
   del mismo binario. `VITE_AUTH_URL` y `VITE_API_URL` apuntan al mismo origen;
   la separación deja de tener razón de ser.
2. **Las 21 tareas de admin y builder dejan de estar bloqueadas.** Existen
   `GET /admin/tenants`, `GET/POST /admin/tenants/:id/layouts`,
   `GET/PUT /admin/layouts/:id`, `POST /admin/layouts/:id/validate`,
   `POST /admin/layouts/:id/publish` y `GET /admin/tenants/:id/catalog`.
3. **El seed existe.** `dd_seed.go` deja un layout publicado «Overview» con 12
   paneles y tres roles (`user`, `planner`, `admin`), y `dd_seed_panel_data.go`
   materializa datos de fixture con el mismo transformador que el job real. Eso
   es B1.16 y B1.20, que desbloqueaban F1.25.

## 1 · Y lo que no cambió: el backend no implementó el contrato

`contracts/synapse-api.yaml` sigue siendo una propuesta del front. El backend
construyó su propia forma, y **la diferencia es sistemática, no cosmética**. Su
propio documento lo dice sin ambigüedad: **B0.7 está sin marcar** —«Extender
`contracts/synapse-api.yaml` con los 6 endpoints de consola»— y el OpenAPI que
el binario embebe (`internal/adapters/handler/docs/openapi.yaml`, 1.796 líneas)
declara `/auth`, `/chat`, `/tickets` y `/admin/*` de la rama vieja, y **ni una
sola ruta `/config/*` ni `/admin/layouts/*`**.

Ocho diferencias, todas verificadas contra el código:

| # | El contrato | El cable |
|---|---|---|
| 1 | Claves en español camelCase · `colSpan`, `metricId` | Inglés snake_case · `col_span`, `metric_id` |
| 2 | `error: { codigo, mensaje, campo, desbloqueaCon }` | `error: "cadena"` (`handler/response.go`) |
| 3 | `data: { metrics: [...] }` · `data: { blocks: [...] }` | Arreglo desnudo en `data` |
| 4 | `DISPONIBLE · DEGRADADO · BLOQUEADO · SIN_PERMISO · ERROR` | `AVAILABLE · DEGRADED · BLOCKED · FORBIDDEN · ERROR` |
| 5 | `Gobierno` intersectado en el payload (`allOf`) | Anidado en `governance` |
| 6 | Discriminador de `Valor`: `forma` | Discriminador: `shape` |
| 7 | Campos que el producto exige y el cable no trae | Ver §3 |
| 8 | Admin serializa DTOs | Admin serializa **structs de dominio de Go, en PascalCase** |

La #8 no es una opinión nuestra: **rompe los propios tests de Postman del
backend**. `scriptCreateDraft` afirma `lv.status === 'draft'`, y
`POST /admin/tenants/:id/layouts` devuelve `*domain.DDLayoutVersion`, que no
tiene ni una etiqueta `json:` — así que la clave que llega es `Status`. El test
compara `undefined` contra `'draft'`. Lo mismo `d.tabs[0].tab.name` en F4-8.

---

## 2 · La decisión: un adaptador en `src/api/`

**El principio que ordena todo lo demás: el NOMBRE lo absorbemos nosotros; el
CAMPO QUE FALTA lo tienen que poner ellos.**

Renombrar es barato, determinista y verificable en un solo archivo. Un campo que
no llega no se puede adaptar: o lo mandan, o la pantalla miente. De ahí sale que
**no les pedimos que adopten el contrato** —renombrar sus DTOs, su seed, su
materializador y sus colecciones de Postman son semanas de ellos para ahorrarnos
dos días de un adaptador que además es borrable— y sí les pedimos los campos, que
no tienen sustituto.


**El contrato sigue siendo la forma interna del front. `src/api/adapt.ts` traduce
el cable a esa forma, y nada por debajo de `api/` se entera.**

Cinco razones, en orden de peso:

1. **`render/` no se toca.** Son 2.800 líneas portadas, 350 pruebas, 15 reglas de
   `design-lint` y 9 anclas de `spec-anclas`. Renombrar `valor` a `value` y
   `forma` a `shape` atraviesa todo eso para no ganar nada.
2. **El contrato lleva semántica que el cable no tiene.** `ventana`, `base` como
   denominador, `direccionSemantica` como texto que se pinta, `grano`,
   `alcance`, el período con etiqueta. Adoptar la forma del cable no es
   renombrar: es **borrar los campos que `design.md` hace obligatorios**. La
   regla de «ningún número desnudo» y la de «toda métrica declara su BASE y su
   PROCEDENCIA» se sostienen sobre esos campos.
3. **El mapeo de familia tiene que existir igual.** El color de datos sale de
   `--color-fam-${familia}-1`, y esos tokens se llaman `demanda`, `medios`,
   `inventario`, `cliente`, `externo`. El cable dice `demand`, `media`,
   `inventory`, `customer`, `external`. Alguien traduce; la pregunta es dónde, y
   la respuesta es «una vez, en la frontera», no «en cada cuerpo».
4. **Es el mismo corte que ya se usó dos veces.** `api/auth.ts` desenvuelve el
   envelope del servicio de acceso por su cuenta, «si el servicio adopta §4.1,
   ese archivo se borra». `api/params.ts` dice textualmente que la validación va
   «acá se valida una vez, **al adaptar la respuesta**, y lo que baja está
   limpio». El adaptador no es una capa nueva: es la que ya estaba declarada.
5. **Se puede borrar.** El día que el backend implemente el contrato, `adapt.ts`
   se vuelve la identidad y desaparece. Si en cambio reescribimos `render/` a la
   forma del cable, ese camino se cierra.

### La regla del adaptador

**El adaptador renombra y reformatea. No calcula, no inventa una cifra y no
escribe copy de producto.**

- Renombrar `col_span` a `colSpan` está bien. Componer `nombre` desde
  `first_name` y `last_name` está bien: los dos datos llegaron.
- Derivar `porcentaje` de una composición que no lo trajo **no** está bien: el
  contrato dice explícitamente que lo calcula el backend porque redondear en el
  cliente da columnas que suman 99,9.
- Traducir `HIGHER_IS_BETTER` a «MÁS ALTO = MEJOR» **es copy de producto**, y va
  como pregunta al backend (§4, ask 7). Mientras no se conteste, el campo llega
  como vino y el panel lo pinta tal cual, que es lo que el contrato dice que
  hace.

Donde el cable no trae el campo, **el campo queda ausente y la tarea que depende
de él sigue bloqueada**. Es la misma regla que sostuvo los últimos tres meses: el
front no rellena huecos del backend.

### La segunda función del adaptador: cerrar los enumerados

En el cable, `shape`, `family`, `layer` y `block_type` son **`string` libre**.
En el contrato son enumerados cerrados, y de ellos cuelgan decisiones que fallan
en silencio:

- una `family` que no conocemos produce `var(--color-fam-vendors-1)`, que no
  existe: la serie se pinta **sin color**, igual que `text-labell` se pinta sin
  tamaño;
- una `shape` que no conocemos no tiene cuerpo que la renderice;
- un `block_type` que no conocemos no está en el registro.

`make sync-catalog` hace upsert de lo que diga una vista de Snowflake, así que
esto no es hipotético en cuanto un tenant sincronice su catálogo. **El adaptador
es el único lugar donde se puede detectar.** Un valor fuera del enumerado no se
deja pasar: el panel entra en `ERROR` con la razón escrita, que es el principio 6
—un error explícito, nunca un arreglo en silencio.

---

## 3 · El mapa, campo por campo

Todo lo que sigue sale de leer `ports/dd_config_service.go`,
`services/dd_config_service.go`, `dashboard/materialize/transform.go`,
`dashboard/materialize/presentation.go`, `dashboard/blocks.go` y
`domain/dd_*.go`.

### 3.1 · `GET /config/me` → `Contexto`

| Contrato | Cable | |
|---|---|---|
| `user.id` · `user.email` | `user.id` · `user.email` | ✅ |
| `user.nombre` | `user.first_name` + `user.last_name` | ✅ se compone |
| `tenant.id` · `tenant.nombre` | `tenant.id` · `tenant.name` | ✅ |
| `role.id` · `role.nombre` | `role.id` · `role.name` | ✅ |
| `tabs[].id · nombre · pregunta · orden` | `tabs[].id · name · operational_question · sort_order` | ✅ |
| `catalogVersion` | `catalog_version` | ✅ |
| `periodos[]` · objeto con etiqueta, rango, estado y grano | `periods[]` · **arreglo de cadenas** | ⚠️ solo el id |
| `user.preferencias.tema` | — | ❌ **y el dato existe en la BD** |
| `alcance` · `tenantsDisponibles` | — | ❌ |
| `tenant.etiqueta` · `tenant.vertical` | — | ❌ |
| `role.puedeAprobar` | — | ❌ |
| `user.capacidades` | — | ❌ |
| `tabs[].key` · `icono` · `chatSugerencias` | — | ❌ (`key` es requerido) |

**El tema es el que más duele y el más barato.** `users.theme` existe, migró,
y `PUT /config/me/preferences` lo escribe — pero `DDContextResponse` no lo
devuelve. O sea: la preferencia se guarda y no se puede leer. El front la
necesita **antes del primer pixel**, que es la razón por la que está en `/me` y
no en un endpoint aparte; sin ella la consola pinta oscura y cambia a clara a la
vista del usuario.

**Los períodos no salen de los datos.** `availablePeriods()` devuelve los
últimos 12 meses del calendario contando desde `time.Now()`, tenga o no tenga
materialización. Un período ofrecido que devuelve todo `BLOCKED` es lo mismo que
un `granoMinimo` ignorado: promete algo que no puede sostener.

### 3.2 · `GET /config/catalog` → `Metrica`

`id`, `key`, `nombre`←`name`, `capa`←`layer`, `fuente`←`source`, `base`,
`unidad`←`unit`, `dimensiones`←`dimensions`, `catalogVersion` mapean directo.
`forma`←`shape`, `familia`←`family` y `granoMinimo`←`min_grain` mapean por tabla.

**Faltan cuatro:** `ventana` (la mitad de la BASE — el período que mide),
`estado` y `estadoRazon` (`EstadoMetrica`, el gobierno de la métrica, que no es
el estado del panel) y `notaLectura`.

Y **`data` es un arreglo desnudo**, no `{ metrics: [...] }`.

### 3.3 · `GET /config/blocks` → `Bloque`

Mapea entero: `tipo`←`type`, `formasAceptadas`←`accepted_shapes` (con la tabla de
formas), `colSpanMin`←`col_span_min` y los otros tres, `paramsDisponibles`←
`layout_params`. Trae de más `ui_name`, que es etiqueta de UI de admin.

Un caso aparte: **el bloque `blocked` declara `accepted_shapes: ["*"]`**. El
contrato no tiene comodín, así que el adaptador lo expande al enumerado completo
o lo trata como caso especial en `acceptsShape`.

`data` también es un arreglo desnudo.

### 3.4 · `GET /config/tabs/{tabId}` → `PestanaConPaneles`

La parte más limpia. `panels[].tipo`←`type`, `metricId`←`metric_id`,
`colStart`/`colSpan`/`rowSpan` ← `col_start`/`col_span`/`row_span`,
`opciones`←`options`. El `tab` interno es el mismo `DDTabMeta` de `/me`, así que
le falta lo mismo (`key`, `icono`, `chatSugerencias`).

El 404 por pertenencia está implementado como pide el contrato —«si no, `404` y
no `403`: no se revela la existencia»— y `?layoutId=` funciona (B1.14).

### 3.5 · `POST /config/panels:batch` → `Payload`

**El cuerpo del request está mal en nuestro cliente hoy.** Mandamos
`{ panelIds, periodo }`; el cable declara
`PanelIDs []uuid.UUID json:"panel_ids" binding:"required,min=1"` y
`Period string json:"period" binding:"required"`. Como los dos son `required`, la
llamada de hoy devuelve **400**, no un batch vacío.

Estados:

| Contrato | Cable | Nota |
|---|---|---|
| `DISPONIBLE` | `AVAILABLE` | |
| `DEGRADADO` | `DEGRADED` | lo deriva el servidor por frescura ✅ |
| `BLOQUEADO` | `BLOCKED` | `unlocks_with` llega **vacío** |
| `SIN_PERMISO` | `FORBIDDEN` | `request_from: "administrator"`, fijo en el código |
| `ERROR` | `ERROR` | de `validatePanelOptions` (gauge sin `maximum`, forecast sin `horizon`) ✅ |

`Gobierno` viene anidado en `governance` con `base`, `layer`, `source`,
`freshness` (ISO 8601 desde `materialized_at`) y `catalog_version`: los cinco
campos que el contrato pide, en otro lugar y con otro nombre. `razon`←`reason`,
`desbloqueaCon`←`unlocks_with`, `mensaje`←`message`, `solicitarA`←`request_from`.

**Faltan `vacioRazon`, `vacioDesbloqueaCon` y `acciones`.** Las acciones son de
`PS-17` y hoy no tienen consumidor vivo, así que no bloquean nada nuevo; el par
de vacío sí lo tiene —§8 pide que el estado vacío sea una invitación a actuar—
pero sin `/config/accionables` tampoco hay a quién invitar todavía.

### 3.6 · `Valor` · nueve formas de dieciséis

`transform.go` tiene un `switch` con nueve casos y un `default` que devuelve
`ErrUnknownShape`.

| Cable | Contrato | Mapeo |
|---|---|---|
| `scalar` | `escalar` | `{v}` |
| `scalar_with_interval` | `escalarConIntervalo` | `{v, lo, hi, level→nivel}` (default 0.95) |
| `time_series` | `serieTemporal` | `points→puntos [{t, v}]` |
| `multi_series` | `seriesMultiples` | `series[{label→etiqueta, points→puntos}]` |
| `categorical` | `categorica` | `items[{label→etiqueta, v}]` |
| `ranking` | `ranking` | `items[{label→etiqueta, v, position→posicion}]` |
| `tabular` | `tabular` | `columns→columnas [{key→clave, title→titulo, numeric→numerica}]` · `rows→filas` |
| `prose` | `prosa` | `headline→titular` · `pillars→pilares [{label, value→valor, note→nota}]` |
| `composition` | `composicion` | `parts→partes [{label→etiqueta, v, percentage→porcentaje}]` |

**Las siete que no existen:** `distribucion`, `serieConBanda`,
`categoricaComparada`, `perfilMultiatributo`, `matriz`, `grafo`, `flujo`.

Consecuencia directa: **`DistributionBody` y `PlotDistribution` no tienen dato
posible hoy**, aunque estén escritos y probados. `ForecastBody` sí funciona, por
`scalar_with_interval`; lo que no llega es su variante de serie. Y F4.17–F4.20
—`ComparisonBody`, `MatrixBody`, `GraphBody`— siguen con su «no antes» intacto,
ahora con una segunda razón: el backend tampoco las materializa.

**Tres detalles del transformador que hay que contestar antes de confiar en el
número:**

- `time_series`, `multi_series` y `composition` pasan el valor por `roundInt()`.
  Una serie de ROAS de 4,2 · 4,5 · 3,5 llega **4 · 5 · 4**. El escalar no
  redondea; las series sí.
- En `composition`, `percentage` solo sale si venía en la fila. El contrato lo
  declara **requerido**, y con la razón escrita: la suma tiene que dar 100.
- `tabular` no trae `decimales` ni `unidad` por columna. Es exactamente el caso
  que el contrato documenta: una columna de ROAS sale «4.2 · 4.5 · 3.5 · 3» y la
  coma deja de alinearse. Cada celda está bien y la columna se lee mal.

### 3.7 · `Presentacion`

`label`✅, `medidor`←`meter {label, percentage→porcentaje, note→nota}`✅,
`comparativo`←`comparative [{label, delta}]` (falta `unidad`), y **falta `nota`**.

Con una limitación mayor: `PresentationFromRows` solo produce presentación para
`scalar` y `scalar_with_interval`. Para las otras siete formas devuelve `nil`, o
sea que **un panel de barras o de tabla no tiene rótulo**. Y «ningún número
desnudo» es regla dura.

### 3.8 · Lo que hoy está roto en `src/api/client.ts`

Seis cosas, todas de una línea:

| Llamada | Hoy | El cable |
|---|---|---|
| `panelsBatch` | `{ panelIds, periodo }` | `{ panel_ids, period }` → **400** |
| `savePreferences` | `PUT /config/me/preferencias` `{ tema }` | `PUT /config/me/preferences` `{ theme }` → **404** |
| `catalog` | espera `{ metrics }` | arreglo desnudo |
| `blocks` | espera `{ blocks }` | arreglo desnudo |
| `threads` | `GET /config/chat/hilos` | no existe |
| error | lee `body.error.codigo` | `body.error` es una cadena → `code: undefined`, `message: ""` |

La última es **el mismo defecto que ya costó una vez**: es la razón por la que
existe `api/auth.ts`. Una pantalla de error sin una palabra.

### 3.9 · Admin y builder

Existen las ocho rutas. Los cuerpos de `PUT /admin/layouts/:id` son snake_case y
razonables (`tabs[].panels[].metric_id`, `type`, `col_start`…). **Las respuestas
no**: `GetLayout`, `CreateDraft` y `PublishLayout` devuelven
`domain.DDLayoutVersion`, `domain.DDTab` y `domain.DDPanel` sin etiquetas `json:`,
o sea `ID`, `TenantID`, `Status`, `Name`, `ColStart`. `DDLayoutValidationResult`
sí las tiene (`{ valid, errors[] }`), y `DDCatalogMetric` también.

Hay un segundo efecto de eso que conviene decir con precisión. `DDLayoutVersion`
tiene un campo `Tenant Tenant` sin `json:"-"`, y `domain.Tenant` guarda
`PrivateKeyPEM` y `PrivateKeyPassphrase`. **Hoy no filtra nada**: ningún
repositorio hace `Preload("Tenant")`, así que lo que se serializa es un `Tenant`
en cero y lo que viaja son las claves vacías. Pero los nombres de los campos de
un almacén de credenciales aparecen en una respuesta de admin, y el día que
alguien agregue un `Preload` para mostrar el nombre del tenant, **filtra, y nada
lo detendría**. Es un `json:"-"` de una línea.

---

## 4 · Lo que necesitamos del backend

Ordenado por esfuerzo de ellos, que es la convención de `docs/PARA-BACKEND.md`.

### Punto 0 · Cerrar B0.7 · lo que más desbloquea

**Que el OpenAPI que el binario embebe declare `/config/*` y `/admin/layouts/*`.**
Está en su propia lista de tareas, sin marcar. Hoy el front tiene que
transcribir la forma leyendo estructuras de Go, y eso ya costó una vez con el
servicio de acceso. Con el spec emitido, `console-drift` lo verifica solo y la
transcripción se borra.

### Una línea de código cada uno

1. **`theme` en `GET /config/me`.** El campo existe en `users`, el `PUT` ya lo
   escribe. Solo falta leerlo.
2. **Etiquetas `json:` en `DDLayoutVersion`, `DDTab` y `DDPanel`.** Rompe sus
   propios tests de Postman (`lv.status`, `d.tabs[0].tab.name`).
3. **`json:"-"` en `DDLayoutVersion.Tenant`, `DDTab.LayoutVersion` y
   `DDPanel.Tab`.** Ver §3.9.
4. **`unlocks_with` en `BLOCKED`.** Hoy llega vacío. Un panel bloqueado sin «qué
   lo desbloquea» es media pantalla: §8 pide estado, razón, qué lo desbloquea y
   CTA.
5. **`request_from` real.** Hoy es la constante `"administrator"`. El contrato
   pide el **rol que decide** sobre esa métrica, y es lo que el panel pinta.
6. **`percentage` siempre en `composition`.** Ver §3.6.

### Decisiones de una línea

7. ~~**`semantic_direction`: ¿código o texto?**~~ **CERRADA el 2026-09-14
   contra el servicio real.** Es **texto ya redactado**: las doce métricas del
   tenant mandan `HIGHER = BETTER`, no `HIGHER_IS_BETTER`. El comentario de
   `dd_catalog_metric.go` sugería lo contrario y era de lo que salió la
   pregunta. El front lo pinta y no lo traduce, que es lo que el adaptador ya
   hacía. Nada que pedir.
8. **¿`shape`, `family` y `layer` son enumerados cerrados?** Hoy son `string`
   libre y `sync-catalog` hace upsert de lo que diga una vista de Snowflake. Del
   `family` sale el color de datos. Ver §2.
9. **`roundInt` en series y composición.** ¿Es intencional? Una serie de ROAS
   pierde el decimal.
10. **Los períodos.** ¿Salen del calendario o de lo materializado? Y si se puede,
    que traigan `etiqueta`, `rango`, `estado` y `grano`, que es lo que el
    selector pinta y lo que `coarsestRequired` necesita.

### Campos del catálogo y del contexto

11. **Catálogo:** `ventana`, `estado` + `estadoRazon`, `notaLectura`.
12. **Contexto:** `alcance`, `tenant.etiqueta` + `vertical`, `role.puede_aprobar`,
    `user.capabilities`, y en la pestaña `key`, `icon`, `chat_suggestions`.
13. **`Presentacion` para las formas que no son escalares.** Hoy solo `scalar` y
    `scalar_with_interval` traen rótulo, y «ningún número desnudo» es regla dura.
14. **`decimals` y `unit` por columna en `tabular`.**

### Envelope

15. **El error estructurado de §4.1.** `{ codigo, mensaje, campo, desbloqueaCon }`
    en vez de una cadena. El front solo necesita distinguir la **familia** por el
    prefijo hasta el primer `_` —`CAMPO_*`, `REGLA_*`, `FALLO_*`—, así que el
    backend agrega códigos sin que el front cambie. Está propuesto en el yaml
    desde el 2026-09-03.

### Lo que necesita conversación

16. **`/config/plots` y los mínimos por gráfico** (B1.21). Bloquea F1.31 y F4.21.
17. **B4.8 · CRUD de roles por tenant** y **B4.9 · preview por rol.** Bloquean
    F4.3 y F4.12.
18. **La lista de layouts del usuario en `/config/me`.** `?layoutId=` ya funciona,
    pero no hay forma de saber qué layouts puede ver alguien. Bloquea F5.1.
19. **`/config/chat` + `ContextoDePanel`** (B3.1, B3.2, T4). Sigue bloqueando
    F3.2, F3.3, F3.6 y la mitad de F3.7. El chat que el servicio sí tiene es otro
    producto, decidido el 2026-09-08.
20. **Solicitudes de acceso: `/config/solicitudes` o `/access-requests`.** Sigue
    abierto y sigue bloqueando el CTA de F2.3.

---

## 5 · Las tareas

Van con la convención del plan: números nuevos dentro de la fase que les toca.
El detalle con descripción y criterio de aceptación está en `plan-de-trabajo.md`,
que es la fuente. Acá va el orden y el porqué.

### Fase 1 · la consola contra el cable · F1.32–F1.39

| | Tarea | Por qué en ese orden |
|---|---|---|
| **F1.32** | `contracts/synapse-console-wire.yaml` + `gen:console-wire` + `console-drift` | Nada se escribe a mano contra un servicio: es la lección del 2026-09-08. Primero la forma, después el código |
| **F1.33** | `api/adapt.ts` · contexto, catálogo, bloques, pestaña | Las cuatro respuestas sin datos. Cierra la mitad del mapa |
| **F1.34** | `api/adapt.ts` · payload, valor y presentación | La otra mitad, y la que tiene las nueve formas |
| **F1.35** | Enumerados cerrados: lo desconocido no pasa | Es la función del adaptador que no es renombrar |
| **F1.36** | `client.ts` · rutas, cuerpos y el envelope de error de este servicio | Las seis de §3.8 |
| **F1.37** | Una sola base de API | `VITE_AUTH_URL` cae a `VITE_API_URL` |
| **F1.38** | MSW responde la forma del cable | Sin esto las 350 pruebas verifican el adaptador contra sí mismo |
| **F1.39** | Humo contra el servicio real | Una prueba verde contra MSW no demuestra que el servicio conteste |
| **F1.40** | `Presentacion` llega al cuerpo | Está declarada y nadie la pasa. **Es nuestro**, y contradice nuestro propio contrato |
| **F1.41** | Los nombres de los params, del cable al contrato | `gauge` llega con `maximum` y `GaugeBody` espera `maximo`: el medidor se dibuja contra otro máximo, en silencio |

**F1.38 es la que sostiene todo lo demás.** Hoy `tests/mocks/handlers.ts`
responde la forma del contrato. Si se queda así, el adaptador nunca se ejecuta en
una prueba y **las 350 pruebas siguen verdes con el adaptador roto** — que es el
modo de falla que este repositorio persigue desde el 2026-08-20. Los handlers
pasan a responder lo que responde Go; el adaptador queda en el camino de cada
prueba de superficie; y los fixtures se escriben **desde el cable transcripto**,
no de memoria.

**F1.32 tiene una deuda declarada y hay que escribirla:** mientras el backend no
cierre B0.7, ese yaml es una transcripción nuestra de estructuras de Go, no un
contrato firmado. Lleva el aviso adentro. Cuando llegue el spec del servicio, se
reemplaza y `console-drift` pasa a verificar contra él.

### Fase 2 · sin tareas nuevas, con una verificación

Los seis estados ya están en pantalla y probados. Lo que falta es volver a
verificarlos **contra el cable**: `DEGRADED` derivado por frescura, `BLOCKED`
sin `unlocks_with`, `FORBIDDEN` con un `request_from` que es una constante.
F2.3 sigue en ⚠️ y por la misma razón de siempre: un botón que devuelve 403 es
peor que un botón ausente.

### Fase 4 · admin y builder · F4.22–F4.23, y las 16 que se destraban

| | Tarea |
|---|---|
| **F4.22** | Transcribir el cable de admin y builder, con la deuda de PascalCase declarada |
| **F4.23** | Los hooks del builder contra ese cable |

Con eso, **F4.1, F4.2, F4.5, F4.6, F4.7, F4.8, F4.9, F4.10, F4.11, F4.13, F4.14,
F4.15 y F4.16 dejan de estar bloqueadas.** Siguen bloqueadas F4.3 (roles, B4.8),
F4.4 (agente por tenant — hay `POST/GET /admin/agents`, falta decidir si alcanza),
F4.12 (preview por rol, B4.9) y F4.21 (`/config/plots`).

F4.17–F4.20 **no se mueven**: su único consumidor es el builder, el backend no
materializa sus formas, y escribirlas ahora sería verificarlas contra fixtures
inventados.

### Fase 5

F5.2 se destraba (`?layoutId=` existe). F5.1 no: no hay forma de listar los
layouts de un usuario. F5.13 sigue esperando el patrón de `PeriodoId`.

---

## 6 · El orden

1. **F1.32** — sin la forma escrita, todo lo demás se escribe de memoria.
2. **F1.36 + F1.37** — las seis de una línea y la base única. Es lo que hace que
   la consola conteste algo en vez de 400 y 404.
3. **F1.33 + F1.34 + F1.35** — el adaptador.
4. **F1.38** — los mocks al cable. **No se puede dejar para el final**: es lo que
   hace que las pruebas midan el adaptador.
5. **F1.39** — humo contra el servicio real, con el seed levantado.
6. **F4.22 + F4.23**, y de ahí el builder, que es lo único genuinamente nuevo.

Y **en paralelo desde hoy**: mandar §4 al backend. El punto 0 y los seis de una
línea son horas de ellos y destraban semanas nuestras.

---

## 7 · Lo que este plan NO hace, con la razón escrita

1. **No toca `AntPack-dev/synapse-api-go`.** Ni un PR, ni una etiqueta `json:`.
   Lo de §4 son preguntas. El antecedente está en el repositorio: el commit
   `2de76de` revirtió un PR a ese servicio con el mismo criterio.
2. **No reescribe `render/` a la forma del cable.** §2, razón 2: no es renombrar,
   es borrar los campos que `design.md` hace obligatorios.
3. **No rellena lo que el backend no manda.** Ni un porcentaje derivado, ni una
   etiqueta de período inventada, ni una traducción de `HIGHER_IS_BETTER`. Donde
   falta el campo, la tarea sigue bloqueada y el ask queda en §4.
4. **No borra `contracts/synapse-api.yaml` ni lo alinea al cable.** Es la
   propuesta que declara lo que el producto necesita, y la lista de §4 sale
   justamente de compararla contra lo que hay. Alinearla al cable sería perder la
   lista.
